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

  // References for animation and throttling
  const lastRouteFetch = useRef(0)
  const animationRef = useRef(null)
  const [helperMarkerPos, setHelperMarkerPos] = useState(null)

  // ─── Initialize map ───────────────────────────────────────────
  useEffect(() => {
    if (map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
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

  // ─── Smooth Marker Animation ──────────────────────────────────
  useEffect(() => {
    if (!helperLocation) return

    if (!helperMarkerPos) {
      // Direct jump for the first location
      setHelperMarkerPos(helperLocation)
      return
    }

    // Cancel existing animation
    if (animationRef.current) cancelAnimationFrame(animationRef.current)

    const startPos = helperMarkerPos
    const endPos = helperLocation
    const startTime = performance.now()
    const DURATION = 800 // 800ms animation

    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / DURATION, 1)

      // Simple linear interpolation
      const currentLng = startPos[0] + (endPos[0] - startPos[0]) * progress
      const currentLat = startPos[1] + (endPos[1] - startPos[1]) * progress

      setHelperMarkerPos([currentLng, currentLat])

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [helperLocation])

  // ─── Seeker marker ────────────────────────────────────────────
  useEffect(() => {
    if (!map.current || !seekerLocation) return

    if (!seekerMarkerRef.current) {
      const el = document.createElement('div')
      el.className = 'user-marker-container'
      el.innerHTML = '<div class="user-marker-pulse"></div><div class="user-marker-dot"></div>'

      seekerMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat(seekerLocation)
        .addTo(map.current)
    } else {
      seekerMarkerRef.current.setLngLat(seekerLocation)
    }
  }, [seekerLocation])

  // ─── Helper marker (using animated position) ──────────────────
  useEffect(() => {
    if (!map.current || !helperMarkerPos) return

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
        .setLngLat(helperMarkerPos)
        .addTo(map.current)
    } else {
      helperMarkerRef.current.setLngLat(helperMarkerPos)
    }
  }, [helperMarkerPos])

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

    const now = Date.now()
    const ROUTE_THROTTLE = 10000 // 10 seconds

    // Always attempt initial route, then throttle
    if (lastRouteFetch.current !== 0 && now - lastRouteFetch.current < ROUTE_THROTTLE) {
      return
    }

    const drawRoute = async () => {
      try {
        lastRouteFetch.current = Date.now()
        const url = `https://router.project-osrm.org/route/v1/driving/${helperLocation[0]},${helperLocation[1]};${seekerLocation[0]},${seekerLocation[1]}?overview=full&geometries=geojson`
        const res = await fetch(url)
        const data = await res.json()

        if (data.code !== 'Ok' || !data.routes?.length) return

        const route = data.routes[0]
        const routeGeoJSON = route.geometry

        // Report ETA and distance to parent (formatted)
        if (onRouteInfo) {
          onRouteInfo({
            duration: route.duration, // raw for internal state if needed
            distance: route.distance, // raw for internal state if needed
            etaText: `Arriving in ${Math.round(route.duration / 60)} minutes`,
            distanceText: `${(route.distance / 1000).toFixed(2)} km`
          })
        }

        const addRoute = () => {
          if (!map.current) return
          let source = map.current.getSource('route')
          if (source) {
            source.setData({ type: 'Feature', geometry: routeGeoJSON })
          } else {
            map.current.addSource('route', {
              type: 'geojson',
              data: { type: 'Feature', geometry: routeGeoJSON }
            })
            map.current.addLayer({
              id: 'route-shadow', type: 'line', source: 'route',
              paint: { 'line-color': '#00000015', 'line-width': 10, 'line-blur': 4 }
            })
            map.current.addLayer({
              id: 'route-line', type: 'line', source: 'route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: { 'line-color': '#6366F1', 'line-width': 5 }
            })
            map.current.addLayer({
              id: 'route-dash', type: 'line', source: 'route',
              paint: { 'line-color': '#ffffff', 'line-width': 2, 'line-dasharray': [1, 2] }
            })
          }
        }

        if (map.current.isStyleLoaded()) addRoute()
        else map.current.once('styledata', addRoute)

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

