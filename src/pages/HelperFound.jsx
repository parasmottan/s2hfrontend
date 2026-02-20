import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import { useToast } from '../hooks/useToast'
import { EVENTS } from '../services/socket'
import TrackingMapView from '../components/TrackingMapView'
import './HelperFound.css'

// ── Confetti colors ──────────────────────────────────────────────
const CONFETTI_COLORS = ['#22C55E', '#16A34A', '#4ADE80', '#86EFAC', '#FDE68A', '#60A5FA', '#C084FC']

function CelebrationOverlay({ helperName, onComplete }) {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 2400)
    const doneTimer = setTimeout(() => onComplete(), 3000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [onComplete])

  // Generate confetti particles
  const confetti = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${30 + Math.random() * 30}%`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: `${Math.random() * 0.6}s`,
      rotation: `${Math.random() * 360}deg`,
      size: 6 + Math.random() * 6,
    }))
  }, [])

  return (
    <div className={`celebration-overlay ${fadeOut ? 'fade-out' : ''}`} style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Confetti */}
      <div className="confetti-container">
        {confetti.map((c) => (
          <div
            key={c.id}
            className="confetti"
            style={{
              left: c.left,
              top: c.top,
              backgroundColor: c.color,
              animationDelay: c.delay,
              width: c.size,
              height: c.size,
              transform: `rotate(${c.rotation})`,
            }}
          />
        ))}
      </div>

      {/* Ring bursts */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="celebration-ring"></div>
        <div className="celebration-ring"></div>
        <div className="celebration-ring"></div>

        {/* Checkmark */}
        <div className="celebration-check">
          <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 48, fontWeight: 700 }}>check</span>
        </div>
      </div>

      <div className="celebration-title">Helper Appointed!</div>
      <div className="celebration-subtitle">Your helper is on the way</div>
      <div className="celebration-helper-name">{helperName}</div>
    </div>
  )
}

// ── Format seconds to MM:SS ──────────────────────────────────────
function formatTime(totalSeconds) {
  if (totalSeconds <= 0) return '00:00'
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatDistance(meters) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${meters} m`
}

// ── Main Component ───────────────────────────────────────────────
export default function HelperFound() {
  const { on, emit, isConnected } = useSocket()
  const toast = useToast()
  const navigate = useNavigate()
  const [requestData, setRequestData] = useState(null)
  const [helperData, setHelperData] = useState(null)
  const [helperLocation, setHelperLocation] = useState(null)
  const [showCelebration, setShowCelebration] = useState(true)
  const [etaSeconds, setEtaSeconds] = useState(null)
  const [distanceMeters, setDistanceMeters] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const countdownRef = useRef(null)

  // Load active request and helper data
  useEffect(() => {
    const storedReq = sessionStorage.getItem('sh_active_request')
    const storedHelper = sessionStorage.getItem('sh_helper_data')
    if (storedReq) setRequestData(JSON.parse(storedReq))
    if (storedHelper) {
      const parsed = JSON.parse(storedHelper)
      setHelperData(parsed)
      const h = parsed?.helper || {}
      if (h.longitude && h.latitude) {
        setHelperLocation([h.longitude, h.latitude])
      } else if (parsed?.helperLocation) {
        setHelperLocation([parsed.helperLocation.longitude, parsed.helperLocation.latitude])
      } else if (h.currentLocation?.coordinates) {
        setHelperLocation(h.currentLocation.coordinates)
      }
    }
  }, [])

  // Listen for real-time helper location updates
  useEffect(() => {
    const cleanup = on(EVENTS.LOCATION_UPDATE, (data) => {
      console.log('[HelperFound] location_update:', data)
      if (data.longitude && data.latitude) {
        setHelperLocation([data.longitude, data.latitude])
      }
    })
    return cleanup
  }, [on, isConnected])

  // Listen for request expiry
  useEffect(() => {
    const cleanup = on(EVENTS.REQUEST_EXPIRED, () => {
      toast.info('Request has expired')
      sessionStorage.removeItem('sh_active_request')
      sessionStorage.removeItem('sh_helper_data')
      navigate('/dashboard')
    })
    return cleanup
  }, [on, toast, navigate, isConnected])

  // Listen for cancellation
  useEffect(() => {
    const cleanup = on(EVENTS.REQUEST_CANCELLED, (data) => {
      toast.info(data.message || 'Request cancelled')
      sessionStorage.removeItem('sh_active_request')
      sessionStorage.removeItem('sh_helper_data')
      navigate('/dashboard')
    })
    return cleanup
  }, [on, toast, navigate, isConnected])

  // ── Route info callback from TrackingMapView ───────────────────
  const handleRouteInfo = useCallback(({ duration, distance }) => {
    setEtaSeconds(duration)
    setDistanceMeters(distance)
    // Start/restart countdown from the new ETA
    setCountdown(duration)
  }, [])

  // ── Countdown timer ────────────────────────────────────────────
  useEffect(() => {
    if (countdown === null || countdown <= 0) return

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdownRef.current)
  }, [etaSeconds]) // restart when new ETA comes from route

  const handleCancel = () => {
    const reqId = requestData?.requestId || helperData?.requestId
    if (reqId) {
      emit(EVENTS.CANCEL_REQUEST, { requestId: reqId })
    }
    sessionStorage.removeItem('sh_active_request')
    sessionStorage.removeItem('sh_helper_data')
    navigate('/dashboard')
  }

  const helper = helperData?.helper || {}
  const helperName = helper.name || 'Helper'
  const etaMinutes = countdown !== null ? Math.ceil(countdown / 60) : null
  const progressPercent = etaSeconds && countdown !== null
    ? Math.max(0, Math.min(100, ((etaSeconds - countdown) / etaSeconds) * 100))
    : 33

  return (
    <div className="bg-[#f7f7f7] font-display text-primary h-screen w-screen overflow-hidden flex flex-col relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Celebration overlay — plays for 3s then fades */}
      {showCelebration && (
        <CelebrationOverlay
          helperName={helperName}
          onComplete={() => setShowCelebration(false)}
        />
      )}

      {/* Real Map Background with Helper & Route */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <TrackingMapView
          helperLocation={helperLocation}
          seekerLocation={null}
          onRouteInfo={handleRouteInfo}
        />
      </div>

      {/* Header */}
      <header className="relative z-30 px-4 md:px-6 pt-12 flex justify-between items-start w-full">
        <button onClick={() => navigate('/dashboard')} className="w-11 h-11 rounded-full bg-white shadow-xl flex items-center justify-center active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-primary">arrow_back_ios_new</span>
        </button>

        {/* Live ETA pill */}
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/20 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#22C55E] eta-pulse"></div>
          <span className="text-xs font-semibold tracking-tight text-gray-600">
            {countdown !== null ? `ETA ${formatTime(countdown)}` : 'TRACKING'}
          </span>
        </div>

        <button className="w-11 h-11 rounded-full bg-white shadow-xl flex items-center justify-center active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-primary">more_vert</span>
        </button>
      </header>

      <main className="flex-grow relative z-10"></main>

      {/* Bottom Card */}
      <div className="relative z-30 px-5 pb-8">
        <div className="bg-white rounded-xl shadow-2xl p-6 flex flex-col gap-5">

          {/* Helper info row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-gray-500 text-2xl">person</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#22C55E] rounded-full border-2 border-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>
                </div>
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-primary">{helperName}</h2>
                <p className="text-gray-500 text-sm font-medium">is on the way</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="text-sm font-bold">{helper.rating || '0.0'}</span>
              </div>
            </div>
          </div>

          {/* ETA + Distance stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ETA</p>
              <p className="text-xl font-black eta-timer">
                {etaMinutes !== null ? `${etaMinutes}` : '—'}
                <span className="text-xs font-bold text-gray-400 ml-0.5">min</span>
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Distance</p>
              <p className="text-sm font-bold">
                {distanceMeters !== null ? formatDistance(distanceMeters) : '—'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
              <p className="text-sm font-bold text-[#22C55E]">En Route</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full progress-bar-shimmer rounded-full transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              <span>Dispatched</span>
              <span>{countdown !== null && countdown > 0 ? formatTime(countdown) : 'Arriving'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 bg-red-50 text-red-600 font-semibold py-4 rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all border border-red-100"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Cancel
            </button>
            <button className="flex-1 bg-primary text-white font-semibold py-4 rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
              <span className="material-symbols-outlined text-sm">chat</span>
              Message
            </button>
          </div>
        </div>

        {/* Verification badges */}
        <div className="mt-6 flex justify-center items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#22C55E]"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Identity Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#22C55E]"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Insured</span>
          </div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-gray-100/80 to-transparent z-10 pointer-events-none"></div>
    </div>
  )
}
