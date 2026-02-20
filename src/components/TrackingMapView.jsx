import { useRef, useEffect, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import './MapView.css'

/**
 * TrackingMapView — shows a real map with:
 *  • Seeker's location (blue pulsing dot)
 *  • Helper's location (dark marker with label)
 *  • Shortest driving route between them (via OSRM)
 *  • Returns ETA + distance via onRouteInfo callback
 *
 * Props:
 *  @param {[number,number]|{lng,lat}|null} helperLocation — helper coords
 *  @param {[number,number]|null} seekerLocation — override; if null, uses browser geolocation
 *  @param {function} onRouteInfo — callback({duration, distance}) called each time route is fetched
 */
export default function TrackingMapView({ helperLocation: helperLocationProp, seekerLocation: seekerLocationProp, onRouteInfo }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const seekerMarkerRef = useRef(null)
  const helperMarkerRef = useRef(null)
  const hasFitBounds = useRef(false)
  const [seekerLocation, setSeekerLocation] = useState(null)

  // Default fallback (Bangalore)
  const DEFAULT_CENTER = [77.5946, 12.9716]

  // Normalize helper location to [lng, lat]
  const helperLocation = helperLocationProp
    ? Array.isArray(helperLocationProp)
      ? helperLocationProp
      : helperLocationProp.lng != null
        ? [helperLocationProp.lng, helperLocationProp.lat]
        : null
    : null

  // ─── Initialize map ───────────────────────────────────────────
  useEffect(() => {
    if (map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-light': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
              'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'
          }
        },
        layers: [
          {
            id: 'carto-light-layer',
            type: 'raster',
            source: 'carto-light',
            minzoom: 0,
            maxzoom: 20
          }
        ]
      },
      center: DEFAULT_CENTER,
      zoom: 14,
      attributionControl: false
    })

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // ─── Browser geolocation (if no prop override) ────────────────
  useEffect(() => {
    if (seekerLocationProp) {
      setSeekerLocation(Array.isArray(seekerLocationProp) ? seekerLocationProp : DEFAULT_CENTER)
      return
    }
    if (!navigator.geolocation) {
      setSeekerLocation(DEFAULT_CENTER)
      return
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (pos) => setSeekerLocation([pos.coords.longitude, pos.coords.latitude]),
      () => setSeekerLocation(DEFAULT_CENTER),
      { timeout: 5000 }
    )

    const watcher = navigator.geolocation.watchPosition(
      (pos) => setSeekerLocation([pos.coords.longitude, pos.coords.latitude]),
      () => { },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    )
    return () => navigator.geolocation.clearWatch(watcher)
  }, [seekerLocationProp])

  // ─── Seeker marker ────────────────────────────────────────────
  useEffect(() => {
    if (!map.current || !seekerLocation) return

    if (!seekerMarkerRef.current) {
      const el = document.createElement('div')
      el.className = 'user-marker-container'

      const pulse = document.createElement('div')
      pulse.className = 'user-marker-pulse'
      const dot = document.createElement('div')
      dot.className = 'user-marker-dot'

      el.appendChild(pulse)
      el.appendChild(dot)

      seekerMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat(seekerLocation)
        .addTo(map.current)
    } else {
      seekerMarkerRef.current.setLngLat(seekerLocation)
    }
  }, [seekerLocation])

  // ─── Helper marker ────────────────────────────────────────────
  useEffect(() => {
    if (!map.current || !helperLocation) return

    if (!helperMarkerRef.current) {
      const el = document.createElement('div')
      el.className = 'helper-marker-container'
      el.innerHTML = `
        <div class="helper-marker-pulse"></div>
        <div class="helper-marker-icon">
          <span class="material-symbols-outlined" style="color:#fff;font-size:18px;">person</span>
        </div>
        <div class="helper-marker-label">EN ROUTE</div>
      `
      helperMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(helperLocation)
        .addTo(map.current)
    } else {
      helperMarkerRef.current.setLngLat(helperLocation)
    }
  }, [helperLocation])

  // ─── Fit bounds to show both markers ──────────────────────────
  useEffect(() => {
    if (!map.current || !seekerLocation || !helperLocation) return
    if (hasFitBounds.current) return

    const bounds = new maplibregl.LngLatBounds()
    bounds.extend(seekerLocation)
    bounds.extend(helperLocation)

    map.current.fitBounds(bounds, { padding: 80, maxZoom: 16 })
    hasFitBounds.current = true
  }, [seekerLocation, helperLocation])

  // ─── Fetch + draw route (OSRM) + return ETA ──────────────────
  useEffect(() => {
    if (!map.current || !seekerLocation || !helperLocation) return

    const drawRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${helperLocation[0]},${helperLocation[1]};${seekerLocation[0]},${seekerLocation[1]}?overview=full&geometries=geojson`
        const res = await fetch(url)
        const data = await res.json()

        if (data.code !== 'Ok' || !data.routes?.length) {
          console.warn('[TrackingMap] OSRM returned no route')
          return
        }

        const route = data.routes[0]
        const routeGeoJSON = route.geometry

        // Report ETA and distance to parent
        if (onRouteInfo) {
          onRouteInfo({
            duration: Math.round(route.duration), // seconds
            distance: Math.round(route.distance),  // meters
          })
        }

        // Wait for map style to load
        const addRoute = () => {
          if (map.current.getSource('route')) {
            map.current.getSource('route').setData({
              type: 'Feature',
              geometry: routeGeoJSON
            })
            return
          }

          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: routeGeoJSON
            }
          })

          // Route shadow
          map.current.addLayer({
            id: 'route-shadow',
            type: 'line',
            source: 'route',
            paint: {
              'line-color': '#00000015',
              'line-width': 10,
              'line-blur': 4
            }
          })

          // Main route
          map.current.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#111111',
              'line-width': 4
            }
          })

          // Dashed overlay
          map.current.addLayer({
            id: 'route-dash',
            type: 'line',
            source: 'route',
            paint: {
              'line-color': '#ffffff',
              'line-width': 1.5,
              'line-dasharray': [2, 4]
            }
          })
        }

        if (map.current.isStyleLoaded()) {
          addRoute()
        } else {
          map.current.on('load', addRoute)
        }

        // Re-fit bounds along route on first load
        if (!hasFitBounds.current) {
          const bounds = new maplibregl.LngLatBounds()
          routeGeoJSON.coordinates.forEach((c) => bounds.extend(c))
          map.current.fitBounds(bounds, { padding: 80, maxZoom: 16 })
          hasFitBounds.current = true
        }

      } catch (err) {
        console.error('[TrackingMap] Route fetch error:', err)
      }
    }

    drawRoute()
  }, [seekerLocation, helperLocation, onRouteInfo])

  return (
    <div className="map-view-container">
      <div ref={mapContainer} className="map-view-instance" />
    </div>
  )
}
