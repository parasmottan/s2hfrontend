import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import { useToast } from '../hooks/useToast'
import { EVENTS } from '../services/socket'
import TrackingMapView from '../components/TrackingMapView'
import './HelperNavigation.css'

// ── Format seconds to MM:SS ────────────────────────────────────
function formatTime(totalSeconds) {
  if (totalSeconds <= 0) return '00:00'
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function HelperNavigation() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const { on, emit, isConnected } = useSocket()
  const toast = useToast()
  const watchIdRef = useRef(null)

  // Data
  const [seekerLocation, setSeekerLocation] = useState(null)
  const [seekerAddress, setSeekerAddress] = useState('Loading address...')
  const [helperName, setHelperName] = useState('Helper')
  const [currentLocation, setCurrentLocation] = useState(null)
  const [etaText, setEtaText] = useState('—')
  const [distanceText, setDistanceText] = useState('—')

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // Cancel window
  const [cancelWindowEnd, setCancelWindowEnd] = useState(null)
  const [cancelRemaining, setCancelRemaining] = useState(null)
  const [canReject, setCanReject] = useState(true)

  // Load session data
  useEffect(() => {
    const storedReq = sessionStorage.getItem('sh_active_request')
    if (storedReq) {
      const parsed = JSON.parse(storedReq)
      if (parsed.seekerLocation) {
        const coords = parsed.seekerLocation.coordinates || [parsed.seekerLocation.longitude, parsed.seekerLocation.latitude]
        setSeekerLocation(coords)
      }
      setSeekerAddress(parsed.seekerAddress || parsed.address || 'Seeker location')
    }

    const storedUser = sessionStorage.getItem('sh_user')
    if (storedUser) {
      try { setHelperName(JSON.parse(storedUser).name || 'Helper') } catch { /* ignore */ }
    }

    const windowEnd = sessionStorage.getItem('sh_cancel_window_end')
    if (windowEnd) {
      setCancelWindowEnd(new Date(windowEnd))
    }
  }, [])

  // Cancel window countdown
  useEffect(() => {
    if (!cancelWindowEnd) return
    const tick = () => {
      const remaining = Math.max(0, Math.floor((cancelWindowEnd - Date.now()) / 1000))
      setCancelRemaining(remaining)
      setCanReject(remaining > 0)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [cancelWindowEnd])

  // Start watching GPS + emitting location updates
  useEffect(() => {
    if (!navigator.geolocation) return

    let lastEmit = 0
    const THROTTLE_MS = 3000 // 3 seconds requirement

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords
        setCurrentLocation([longitude, latitude])

        const now = Date.now()
        if (now - lastEmit >= THROTTLE_MS) {
          emit(EVENTS.LOCATION_UPDATE, {
            requestId,
            longitude,
            latitude,
          })
          lastEmit = now
        }
      },
      (err) => console.warn('[HelperNav] Geolocation error:', err.message),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [emit, requestId])

  // Listen for cancel (from seeker side)
  useEffect(() => {
    const cleanup = on(EVENTS.REQUEST_CANCELLED, (data) => {
      sessionStorage.setItem('sh_cancel_reason', JSON.stringify({
        reason: data.reason || data.message,
        rejectedBy: data.rejectedBy || 'seeker',
      }))
      navigate(`/cancelled/${requestId}`)
    })
    return cleanup
  }, [on, isConnected, navigate, requestId])

  // Listen for cancel window expired
  useEffect(() => {
    const cleanup = on('cancel_window_expired', () => {
      setCanReject(false)
      setCancelRemaining(0)
    })
    return cleanup
  }, [on, isConnected])

  // Handle reject
  const handleReject = () => {
    if (!canReject || !rejectReason.trim()) return
    emit(EVENTS.REJECT_REQUEST, { requestId, reason: rejectReason.trim() })
    setShowRejectModal(false)
    sessionStorage.setItem('sh_cancel_reason', JSON.stringify({
      reason: rejectReason.trim(),
      rejectedBy: 'helper',
    }))
    navigate(`/cancelled/${requestId}`)
  }

  return (
    <div className="navigation-page">
      {/* Map background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <TrackingMapView
          helperLocation={currentLocation}
          seekerLocation={seekerLocation}
          onRouteInfo={(info) => {
            setEtaText(info.etaText)
            setDistanceText(info.distanceText)
          }}
        />
      </div>

      {/* Header */}
      <header style={{ position: 'relative', zIndex: 30, padding: '48px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <span className="material-symbols-outlined" style={{ color: '#121212' }}>arrow_back_ios_new</span>
        </button>

        {/* Helper badge */}
        <div className="helper-id-badge">
          <div className="badge-avatar">
            <span className="material-symbols-outlined" style={{ color: '#6366F1', fontSize: 16 }}>person</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#121212' }}>{helperName}</span>
          <span style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF' }}>Helper</span>
        </div>

        <div style={{ width: 44 }}></div>
      </header>

      {/* Spacer */}
      <div style={{ flex: 1 }}></div>

      {/* Gradient overlay */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 200, background: 'linear-gradient(to top, rgba(247,247,247,0.9), transparent)', zIndex: 10, pointerEvents: 'none' }}></div>

      {/* Bottom Panel */}
      <div className="nav-bottom-panel">
        <div className="drag-handle"></div>

        {/* Current Location */}
        <div className="nav-location-row">
          <div className="loc-dot current"></div>
          <div>
            <div className="loc-label">Current Location</div>
            <div className="loc-address">Your location</div>
          </div>
        </div>

        <div className="nav-location-connector"></div>

        {/* Pickup Address */}
        <div className="nav-location-row">
          <div className="loc-dot pickup"></div>
          <div>
            <div className="loc-label">Pickup Address</div>
            <div className="loc-address">{seekerAddress}</div>
          </div>
        </div>

        {/* Path Stats (ETA/Distance) */}
        <div className="nav-location-row" style={{ marginTop: 8, background: '#F9FAFB', borderRadius: 12, padding: '10px 14px' }}>
          <div style={{ display: 'flex', gap: 20 }}>
            <div>
              <div className="loc-label" style={{ fontSize: 10 }}>ETA</div>
              <div className="loc-address" style={{ fontSize: 15, color: '#6366F1' }}>{etaText.replace('Arriving in ', '')}</div>
            </div>
            <div style={{ width: 1, height: 24, background: '#E5E7EB', alignSelf: 'center' }}></div>
            <div>
              <div className="loc-label" style={{ fontSize: 10 }}>Distance</div>
              <div className="loc-address" style={{ fontSize: 15 }}>{distanceText}</div>
            </div>
          </div>
        </div>

        {/* Rejection window banner */}
        {cancelRemaining !== null && (
          <div className={`rejection-banner ${cancelRemaining === 0 ? 'expired' : ''}`}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {cancelRemaining > 0 ? 'timer' : 'lock'}
            </span>
            {cancelRemaining > 0
              ? `Rejection window active for ${formatTime(cancelRemaining)}`
              : 'Rejection window has expired'}
          </div>
        )}

        {/* Display ETA / Distance in panel if needed, but per request we mainly use it in seeker side UI. 
            However, we can add it here too for the helper's convenience. */}

        {/* Start Navigation button */}
        <button className="btn-start-nav">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>navigation</span>
          Start Navigation
        </button>

        {/* Reject button */}
        <button className="btn-reject" onClick={() => setShowRejectModal(true)} disabled={!canReject}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
          {canReject ? 'Reject Request' : 'Rejection Locked'}
        </button>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="reject-modal-backdrop" onClick={() => setShowRejectModal(false)}>
          <div className="reject-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reject Request</h3>
            <p>Please provide a reason for rejecting this request.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., I had an emergency and cannot fulfill the request..."
              autoFocus
            />
            <div className="reject-modal-actions">
              <button className="btn-back" onClick={() => setShowRejectModal(false)}>Go Back</button>
              <button
                className="btn-confirm-reject"
                onClick={handleReject}
                disabled={!rejectReason.trim()}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
