import { useRef, useEffect, useState } from 'react'
import maplibregl from 'maplibre-gl'
import './MapView.css'

export default function MapView({ onLocationUpdate, showUserLocation = true }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markerRef = useRef(null)
  const [userLocation, setUserLocation] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  // Default fallback location (Bangalore)
  const DEFAULT_CENTER = [77.5946, 12.9716]
  const DEFAULT_ZOOM = 14

  useEffect(() => {
    if (map.current) return // initialize map only once

    console.log('Parameters: Initializing MapView...')
    console.log('Container:', mapContainer.current)

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
      zoom: DEFAULT_ZOOM,
      attributionControl: false // Hide default, we add custom if needed or use compact
    })

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')

    // Add geolocation control
    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true
    })
    map.current.addControl(geolocate, 'bottom-right')

    // Clean up on unmount
    return () => {
      map.current.remove()
      map.current = null
    }
  }, [])

  // Handle Geolocation
  useEffect(() => {
    if (!showUserLocation || !map.current) return

    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.')
      return
    }

    const success = (position) => {
      const { longitude, latitude } = position.coords
      setUserLocation([longitude, latitude])
      setPermissionDenied(false)

      // Notify parent
      if (onLocationUpdate) {
        onLocationUpdate({ longitude, latitude })
      }

      // Fly to user location on first fix
      if (map.current) {
        map.current.flyTo({
          center: [longitude, latitude],
          zoom: 15,
          speed: 1.2,
          curve: 1
        })
      }
    }

    const error = (err) => {
      console.warn(`Geolocation error (${err.code}): ${err.message}`)
      setPermissionDenied(true)
    }

    const watcher = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    })

    return () => navigator.geolocation.clearWatch(watcher)
  }, [showUserLocation, onLocationUpdate])

  // Update Custom Marker
  useEffect(() => {
    if (!map.current || !userLocation) return

    if (!markerRef.current) {
      // Create custom marker element
      const el = document.createElement('div')
      el.className = 'user-marker-container'

      const pulse = document.createElement('div')
      pulse.className = 'user-marker-pulse'

      const dot = document.createElement('div')
      dot.className = 'user-marker-dot'

      el.appendChild(pulse)
      el.appendChild(dot)

      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat(userLocation)
        .addTo(map.current)
    } else {
      markerRef.current.setLngLat(userLocation)
    }
  }, [userLocation])

  return (
    <div className="map-view-container">
      <div ref={mapContainer} className="map-view-instance" />
      {permissionDenied && (
        <div className="location-permission-warning">
          Location permission denied. Showing default view.
        </div>
      )}
    </div>
  )
}
