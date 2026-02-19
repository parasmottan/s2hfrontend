import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import { useToast } from '../hooks/useToast'
import { EVENTS } from '../services/socket'
import './HelperFound.css'

export default function HelperFound() {
  const { on, emit, isConnected } = useSocket()
  const toast = useToast()
  const navigate = useNavigate()
  const [requestData, setRequestData] = useState(null)
  const [helperData, setHelperData] = useState(null)

  // Load active request and helper data
  useEffect(() => {
    const storedReq = sessionStorage.getItem('sh_active_request')
    const storedHelper = sessionStorage.getItem('sh_helper_data')
    if (storedReq) setRequestData(JSON.parse(storedReq))
    if (storedHelper) setHelperData(JSON.parse(storedHelper))
  }, [])

  // Listen for location updates
  useEffect(() => {
    const cleanup = on(EVENTS.LOCATION_UPDATE, (data) => {
      // Update helper position (for future map rendering)
      console.log('Helper location update:', data)
    })
    return cleanup
  }, [on])

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

  return (
    <div className="bg-[#f7f7f7] font-display text-primary h-screen w-screen overflow-hidden flex flex-col relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Map Background */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#F2F2F2]">
        <div className="absolute w-full h-full opacity-60">
          <div className="absolute left-[-20%] w-[140%] h-[20px] bg-white" style={{ transform: 'rotate(25deg)', top: '30%' }}></div>
          <div className="absolute left-[-20%] w-[140%] h-[12px] bg-white" style={{ transform: 'rotate(25deg)', top: '60%' }}></div>
          <div className="absolute w-full h-[15px] bg-white top-[15%]"></div>
          <div className="absolute w-full h-[10px] bg-white top-[45%]"></div>
          <div className="absolute w-full h-[18px] bg-white top-[75%]"></div>
          <div className="absolute h-full w-[12px] bg-white left-[25%]"></div>
          <div className="absolute h-full w-[16px] bg-white left-[65%]"></div>
          <div className="absolute top-[18%] left-[28%] w-[30%] h-[10%] bg-[#e8e8e8] rounded-md"></div>
          <div className="absolute top-[50%] left-[5%] w-[18%] h-[20%] bg-[#e8e8e8] rounded-md"></div>
          <div className="absolute top-[80%] left-[35%] w-[25%] h-[15%] bg-[#e8e8e8] rounded-md"></div>
        </div>

        {/* Helper Marker */}
        <div className="absolute top-[40%] left-[45%] z-20">
          <div className="relative flex flex-col items-center">
            <div className="accepted-pulse"></div>
            <div className="bg-primary text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wider mb-1 uppercase shadow-lg">En Route</div>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center border-4 border-white shadow-xl">
              <span className="material-symbols-outlined text-white text-lg">person</span>
            </div>
          </div>
        </div>

        {/* User location */}
        <div className="absolute bottom-[30%] right-[30%]">
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg ring-4 ring-blue-500/20"></div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-30 px-6 pt-12 flex justify-between items-start w-full">
        <button onClick={() => navigate('/dashboard')} className="w-11 h-11 rounded-full bg-white shadow-xl flex items-center justify-center active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-primary">arrow_back_ios_new</span>
        </button>
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/20">
          <span className="text-xs font-semibold tracking-tight text-gray-400">TRACKING TASK</span>
        </div>
        <button className="w-11 h-11 rounded-full bg-white shadow-xl flex items-center justify-center active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-primary">more_vert</span>
        </button>
      </header>

      <main className="flex-grow relative z-10"></main>

      {/* Bottom Card */}
      <div className="relative z-30 px-5 pb-8">
        <div className="bg-white rounded-xl shadow-2xl p-6 flex flex-col gap-6">
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
                <h2 className="text-xl font-bold text-primary">Helper Found!</h2>
                <p className="text-gray-500 text-sm font-medium">{helperName} is on the way</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="text-sm font-bold">{helper.rating || '0.0'}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-2/3 progress-bar-shimmer rounded-full"></div>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              <span>En Route</span>
              <span>Arriving Soon</span>
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
            <Link to="/history" className="flex-1">
              <button className="w-full bg-primary text-white font-semibold py-4 rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                <span className="material-symbols-outlined text-sm">receipt_long</span>
                History
              </button>
            </Link>
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
