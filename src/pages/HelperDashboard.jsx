import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useToast } from '../hooks/useToast'
import { EVENTS } from '../services/socket'
import './HelperDashboard.css'

export default function HelperDashboard() {
  const { user } = useAuth()
  const { emit, on, isConnected } = useSocket()
  const toast = useToast()
  const [isOnline, setIsOnline] = useState(false)
  const [incomingRequests, setIncomingRequests] = useState([])
  const hasAutoOnlined = useRef(false)

  // Auto go-online for helpers when connected
  useEffect(() => {
    if (user?.role !== 'helper' || !isConnected || hasAutoOnlined.current) return

    hasAutoOnlined.current = true

    const goOnline = (lng, lat) => {
      emit(EVENTS.GO_ONLINE, { longitude: lng, latitude: lat })
      setIsOnline(true)
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => goOnline(pos.coords.longitude, pos.coords.latitude),
        () => goOnline(77.5946, 12.9716),
        { timeout: 3000 }
      )
    } else {
      goOnline(77.5946, 12.9716)
    }
  }, [user, isConnected, emit])

  // Listen for new requests (helper role)
  useEffect(() => {
    if (user?.role !== 'helper') return

    const cleanup = on(EVENTS.NEW_REQUEST, (data) => {
      setIncomingRequests((prev) => {
        // Avoid duplicates
        if (prev.find((r) => r.requestId === data.requestId)) return prev
        return [data, ...prev]
      })
      toast.info(`New request: ${data.category} — $${data.budget}`)
    })

    return cleanup
  }, [user, on, toast, isConnected])

  // Listen for request_locked acknowledgement
  useEffect(() => {
    if (user?.role !== 'helper') return

    const cleanup = on(EVENTS.REQUEST_LOCKED, (data) => {
      toast.success(data.message || 'Request accepted!')
      // Remove from pending list
      setIncomingRequests((prev) => prev.filter((r) => r.requestId !== data.requestId))
    })

    return cleanup
  }, [user, on, toast, isConnected])

  // Listen for socket errors
  useEffect(() => {
    const cleanup = on(EVENTS.ERROR, (data) => {
      toast.error(data.message || 'Something went wrong')
    })
    return cleanup
  }, [on, toast, isConnected])

  // Listen for confirm_redirect (seeker confirmed → navigate to helper navigation)
  const navigate = useNavigate()
  useEffect(() => {
    if (user?.role !== 'helper') return

    const cleanup = on(EVENTS.CONFIRM_REDIRECT, (data) => {
      if (data.cancelWindowExpiresAt) {
        sessionStorage.setItem('sh_cancel_window_end', data.cancelWindowExpiresAt)
      }
      // Store request info for the navigation page
      sessionStorage.setItem('sh_active_request', JSON.stringify(data))
      navigate(`/navigation/${data.requestId}`)
    })

    return cleanup
  }, [user, on, navigate, isConnected])

  const toggleOnline = () => {
    if (!isOnline) {
      // Go online — use browser geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            emit(EVENTS.GO_ONLINE, {
              longitude: pos.coords.longitude,
              latitude: pos.coords.latitude,
            })
            setIsOnline(true)
            toast.success('You are now online!')
          },
          () => {
            // Fallback coordinates
            emit(EVENTS.GO_ONLINE, { longitude: 77.5946, latitude: 12.9716 })
            setIsOnline(true)
            toast.success('You are now online!')
          }
        )
      } else {
        emit(EVENTS.GO_ONLINE, { longitude: 77.5946, latitude: 12.9716 })
        setIsOnline(true)
      }
    } else {
      emit(EVENTS.GO_OFFLINE)
      setIsOnline(false)
      toast.info('You are now offline')
    }
  }

  const handleAcceptRequest = (requestId) => {
    emit(EVENTS.ACCEPT_REQUEST, { requestId })
  }

  const handleRejectRequest = (requestId) => {
    emit(EVENTS.REJECT_REQUEST, { requestId })
    setIncomingRequests((prev) => prev.filter((r) => r.requestId !== requestId))
    toast.info('Request rejected')
  }

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Inter', sans-serif", color: '#121212' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-gray-500 text-2xl">person</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Welcome back,</p>
            <h1 className="text-lg font-bold tracking-tight">{user?.name || 'User'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user?.role === 'helper' && (
            <button
              onClick={toggleOnline}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${isOnline
                ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30'
                : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}
            >
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#22C55E]' : 'bg-gray-400'}`}></div>
              {isOnline ? 'Online' : 'Offline'}
            </button>
          )}
          <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-lg">notifications</span>
          </button>
        </div>
      </header>

      <main className="flex-grow px-6 py-6 space-y-8 pb-28">
        {/* Earnings Card */}
        <section className="bg-[#111111] text-white rounded-3xl p-7 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5"></div>
          <div className="absolute -right-4 bottom-0 w-24 h-24 rounded-full bg-white/5"></div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] mb-2">
            {user?.role === 'helper' ? "This Week's Earnings" : 'Total Spent'}
          </p>
          <h2 className="text-4xl font-black tracking-tight mb-6">$0.00</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-[6px] w-32 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-0 bg-white rounded-full transition-all"></div>
              </div>
              <span className="text-[11px] font-semibold text-gray-500">No data yet</span>
            </div>
            <Link to="/history">
              <button className="text-xs font-semibold text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                View All
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </Link>
          </div>
        </section>

        {/* Incoming Requests (helper) / Quick Actions (seeker) */}
        {user?.role === 'helper' ? (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold tracking-tight">Incoming Requests</h2>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{incomingRequests.length} pending</span>
            </div>
            {incomingRequests.length === 0 ? (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center">
                <span className="material-symbols-outlined text-gray-300 text-4xl mb-3 block">inbox</span>
                <p className="text-gray-400 text-sm font-medium">
                  {isOnline ? 'No requests yet. Stay online to receive requests.' : 'Go online to start receiving requests.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {incomingRequests.map((req) => (
                  <div key={req.requestId} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-[15px]">{req.category}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Est. {req.estimatedArrivalTime} min arrival</p>
                      </div>
                      <span className="text-lg font-bold">${req.budget}</span>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleRejectRequest(req.requestId)}
                        className="flex-1 py-3 px-4 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold active:scale-[0.98] transition-all"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleAcceptRequest(req.requestId)}
                        className="flex-[2] py-3 px-4 rounded-full bg-black text-white text-sm font-bold shadow-lg shadow-black/10 active:scale-[0.98] transition-all"
                      >
                        Accept Request
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section>
            <h2 className="text-lg font-bold tracking-tight mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/search" className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center hover:bg-gray-100 transition-colors">
                <span className="material-symbols-outlined text-2xl mb-2 block">search</span>
                <p className="text-sm font-semibold">Find Help</p>
              </Link>
              <Link to="/history" className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center hover:bg-gray-100 transition-colors">
                <span className="material-symbols-outlined text-2xl mb-2 block">history</span>
                <p className="text-sm font-semibold">History</p>
              </Link>
            </div>
          </section>
        )}

        {/* Connection Status */}
        <section className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-[#22C55E]' : 'bg-red-500'}`}></div>
          <div>
            <p className="text-sm font-semibold">{isConnected ? 'Real-time connected' : 'Connecting...'}</p>
            <p className="text-xs text-gray-400">
              {isConnected ? 'Live updates enabled' : 'Attempting to connect to server'}
            </p>
          </div>
        </section>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-8 py-4 flex justify-between items-center pb-8 z-50">
        <Link to="/dashboard" className="flex flex-col items-center gap-1 text-[#111111]">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
          <span className="text-[10px] font-bold">Dashboard</span>
        </Link>
        <Link to="/search" className="flex flex-col items-center gap-1 text-gray-300">
          <span className="material-symbols-outlined">explore</span>
          <span className="text-[10px] font-medium">Search</span>
        </Link>
        <Link to="/history" className="flex flex-col items-center gap-1 text-gray-300">
          <span className="material-symbols-outlined">receipt_long</span>
          <span className="text-[10px] font-medium">Activity</span>
        </Link>
        <Link to="/profile" className="flex flex-col items-center gap-1 text-gray-300">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>
    </div>
  )
}
