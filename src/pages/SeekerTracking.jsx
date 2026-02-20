import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import { useToast } from '../hooks/useToast'
import { EVENTS } from '../services/socket'
import TrackingMapView from '../components/TrackingMapView'
import './SeekerTracking.css'

// ── Format seconds to MM:SS ────────────────────────────────────
function formatTime(totalSeconds) {
  if (totalSeconds <= 0) return '00:00'
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function SeekerTracking() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const { on, emit, isConnected } = useSocket()
  const toast = useToast()

  // Data
  const [helperData, setHelperData] = useState(null)
  const [helperLocation, setHelperLocation] = useState(null)
  const [etaText, setEtaText] = useState('—')
  const [distanceText, setDistanceText] = useState('—')
  const [etaSeconds, setEtaSeconds] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const countdownRef = useRef(null)

  // Cancel window
  const [cancelWindowEnd, setCancelWindowEnd] = useState(null)
  const [cancelRemaining, setCancelRemaining] = useState(null)
  const [canCancel, setCanCancel] = useState(true)

  // Load data from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('sh_helper_data')
    if (stored) {
      const parsed = JSON.parse(stored)
      setHelperData(parsed)
      const h = parsed?.helper || {}
      if (h.longitude && h.latitude) {
        setHelperLocation([h.longitude, h.latitude])
      } else if (h.currentLocation?.coordinates) {
        setHelperLocation(h.currentLocation.coordinates)
      }
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
      setCanCancel(remaining > 0)
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [cancelWindowEnd])

  // Listen for real-time helper location
  useEffect(() => {
    const cleanup = on(EVENTS.LOCATION_UPDATE, (data) => {
      if (data.longitude && data.latitude) {
        setHelperLocation([data.longitude, data.latitude])
      }
    })
    return cleanup
  }, [on, isConnected])

  // Listen for cancel window expired
  useEffect(() => {
    const cleanup = on('cancel_window_expired', () => {
      setCanCancel(false)
      setCancelRemaining(0)
    })
    return cleanup
  }, [on, isConnected])

  // Listen for request cancelled (helper rejected)
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

  // Listen for request expired
  useEffect(() => {
    const cleanup = on(EVENTS.REQUEST_EXPIRED, () => {
      toast.info('Request has expired')
      navigate('/dashboard')
    })
    return cleanup
  }, [on, isConnected, toast, navigate])

  // Route info callback from TrackingMapView
  const handleRouteInfo = useCallback((info) => {
    setEtaSeconds(info.duration)
    setCountdown(Math.round(info.duration))
    setEtaText(info.etaText)
    setDistanceText(info.distanceText)
  }, [])

  // ETA countdown (inner ticking UI)
  useEffect(() => {
    if (countdown === null || countdown <= 0) return
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(countdownRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(countdownRef.current)
  }, [countdown === null])

  // Handle cancel
  const handleCancel = () => {
    if (!canCancel) return
    emit(EVENTS.CANCEL_REQUEST, { requestId })
    sessionStorage.setItem('sh_cancel_reason', JSON.stringify({
      reason: 'You cancelled the request.',
      rejectedBy: 'seeker',
    }))
    navigate(`/cancelled/${requestId}`)
  }

  const helper = helperData?.helper || {}
  const helperName = helper.name || 'Helper'
  const etaMinutes = countdown !== null ? Math.ceil(countdown / 60) : null
  const progressPercent = etaSeconds && countdown !== null
    ? Math.max(0, Math.min(100, ((etaSeconds - countdown) / etaSeconds) * 100))
    : 10

  return (
    <div className="tracking-page">
      {/* Map background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <TrackingMapView
          helperLocation={helperLocation}
          seekerLocation={null}
          onRouteInfo={handleRouteInfo}
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

        {/* Cancel Timer Badge */}
        <div className={`cancel-timer-badge ${cancelRemaining !== null && cancelRemaining < 60 ? 'expiring' : ''} ${cancelRemaining === 0 ? 'expired' : ''}`}>
          <div className="timer-dot"></div>
          <span style={{ fontSize: 12, fontWeight: 700, color: cancelRemaining === 0 ? '#6B7280' : '#374151' }}>
            {cancelRemaining !== null && cancelRemaining > 0
              ? `Cancel window ${formatTime(cancelRemaining)}`
              : cancelRemaining === 0
                ? 'Window expired'
                : 'TRACKING'}
          </span>
        </div>

        <button
          style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <span className="material-symbols-outlined" style={{ color: '#121212' }}>more_vert</span>
        </button>
      </header>

      {/* Spacer to push panel to bottom */}
      <div style={{ flex: 1 }}></div>

      {/* Bottom Panel */}
      <div className="tracking-bottom-panel">
        <div className="drag-handle"></div>

        {/* Helper info */}
        <div className="helper-arrival-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="helper-avatar">
              <span className="material-symbols-outlined" style={{ color: '#6366F1', fontSize: 26 }}>person</span>
              <div className="online-badge"></div>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#121212' }}>{helperName}</h2>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6B7280', fontWeight: 500 }}>is on the way</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F9FAFB', padding: '6px 10px', borderRadius: 10 }}>
            <span className="material-symbols-outlined" style={{ color: '#EAB308', fontSize: 16, fontVariationSettings: "'FILL' 1" }}>star</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{helper.rating || '0.0'}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="tracking-stats">
          <div className="stat-box">
            <div className="stat-label">ETA</div>
            <div className="stat-value">
              {etaMinutes !== null ? etaMinutes : '—'}
              <span className="stat-unit">min</span>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Distance</div>
            <div className="stat-value" style={{ fontSize: 14 }}>
              {distanceText}
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Status</div>
            <div className="stat-value" style={{ fontSize: 14, color: '#22C55E' }}>En Route</div>
          </div>
        </div>

        {/* Progress */}
        <div className="tracking-progress">
          <div className="fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.2 }}>
          <span>Dispatched</span>
          <span>{countdown !== null && countdown > 0 ? formatTime(countdown) : 'Arriving'}</span>
        </div>

        {/* Actions */}
        <div className="tracking-actions">
          <button className="btn-cancel" onClick={handleCancel} disabled={!canCancel}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
            {canCancel ? 'Cancel' : 'Locked'}
          </button>
          <button className="btn-message">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chat</span>
            Message
          </button>
        </div>

        {/* Cancel window banner */}
        {cancelRemaining !== null && (
          <div className={`cancel-window-banner ${cancelRemaining === 0 ? 'expired' : ''}`}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {cancelRemaining > 0 ? 'timer' : 'lock'}
            </span>
            {cancelRemaining > 0
              ? `Cancellation window active for ${formatTime(cancelRemaining)}`
              : 'Cancellation window has expired'}
          </div>
        )}
      </div>
    </div>
  )
}
