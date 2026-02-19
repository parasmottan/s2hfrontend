import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import { useToast } from '../hooks/useToast'
import { EVENTS } from '../services/socket'
import './HelperDetail.css'

export default function HelperDetail() {
  const { emit, on, isConnected } = useSocket()
  const toast = useToast()
  const navigate = useNavigate()
  const [helperData, setHelperData] = useState(null)
  const [confirming, setConfirming] = useState(false)

  // Load helper data from sessionStorage (set by SearchMap on helper_found)
  useEffect(() => {
    const stored = sessionStorage.getItem('sh_helper_data')
    if (stored) {
      setHelperData(JSON.parse(stored))
    }
  }, [])

  // Listen for helper_on_the_way → navigate to tracking
  useEffect(() => {
    const cleanup = on(EVENTS.HELPER_ON_THE_WAY, (data) => {
      toast.success('Helper is on the way!')
      sessionStorage.setItem('sh_active_request', JSON.stringify(data))
      navigate('/helper-found')
    })
    return cleanup
  }, [on, toast, navigate, isConnected])

  // Listen for errors
  useEffect(() => {
    const cleanup = on(EVENTS.ERROR, (data) => {
      toast.error(data.message || 'Something went wrong')
      setConfirming(false)
    })
    return cleanup
  }, [on, toast, isConnected])

  const handleConfirm = () => {
    if (!helperData?.requestId || confirming) return
    setConfirming(true)
    emit(EVENTS.CONFIRM_HELPER, { requestId: helperData.requestId })
    toast.info('Confirming helper...')
  }

  const helper = helperData?.helper || {}

  return (
    <div className="bg-white h-screen w-screen overflow-hidden flex flex-row" style={{ fontFamily: "'Inter', sans-serif", color: '#121212' }}>
      {/* Map Panel - 65% */}
      <div className="w-[65%] h-full relative overflow-hidden bg-[#F2F2F2] map-grid">
        <div className="absolute inset-0">
          <div className="absolute top-[20%] left-[-10%] w-[120%] h-[30px] bg-white" style={{ transform: 'rotate(-5deg)' }}></div>
          <div className="absolute top-0 left-[40%] w-[40px] h-[120%] bg-white" style={{ transform: 'rotate(15deg)' }}></div>
          <div className="absolute top-[10%] left-[10%] w-[15%] h-[12%] bg-[#EBEBEB] rounded-sm"></div>
          <div className="absolute top-[15%] left-[60%] w-[20%] h-[15%] bg-[#EBEBEB] rounded-sm"></div>
          <div className="absolute top-[45%] left-[25%] w-[12%] h-[20%] bg-[#EBEBEB] rounded-sm"></div>
          <div className="absolute top-[70%] left-[70%] w-[18%] h-[10%] bg-[#EBEBEB] rounded-sm"></div>

          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <path className="dashed-route" d="M 250 550 Q 350 450, 550 350 T 850 200" fill="transparent" stroke="black" strokeWidth="3"></path>
          </svg>

          {/* Helper Marker */}
          <div className="absolute top-[180px] left-[840px] flex flex-col items-center">
            <div className="bg-white p-1 rounded-full shadow-2xl border-2 border-primary">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-500">person</span>
              </div>
            </div>
            <div className="mt-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Helper</div>
          </div>

          {/* User Marker */}
          <div className="absolute bottom-[280px] left-[240px]">
            <div className="w-5 h-5 bg-[#007AFF] rounded-full border-4 border-white shadow-lg ring-4 ring-[#007AFF]/20"></div>
          </div>
        </div>

        <div className="absolute top-8 left-8 flex flex-col gap-3">
          <Link to="/search">
            <button className="w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-gray-50 transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          </Link>
        </div>
        <div className="absolute bottom-8 right-8 flex flex-col gap-2">
          <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50">
            <span className="material-symbols-outlined">add</span>
          </button>
          <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50">
            <span className="material-symbols-outlined">remove</span>
          </button>
          <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center mt-2">
            <span className="material-symbols-outlined text-[#007AFF]">near_me</span>
          </button>
        </div>
      </div>

      {/* Detail Sidebar - 35% */}
      <aside className="w-[35%] h-full bg-white border-l border-gray-100 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.02)] relative z-20">
        <div className="flex-grow overflow-y-auto px-10 py-12">
          {!helperData ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">hourglass_empty</span>
              <p className="text-gray-400 text-sm">Waiting for helper match...</p>
              <Link to="/search" className="text-[#111111] text-sm font-semibold mt-4 hover:underline">Back to search</Link>
            </div>
          ) : (
            <>
              {/* Profile Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex flex-col gap-3">
                  <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-gray-400 text-4xl">person</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">{helper.name || 'Helper'}</h1>
                    <p className="text-gray-500 font-medium">{helper.email || 'Specialist'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center bg-yellow-50 px-3 py-1.5 rounded-full">
                    <span className="material-symbols-outlined text-yellow-500 text-lg mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="font-bold text-yellow-700">{helper.rating || '0.0'}</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Estimated Arrival</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black">~5</span>
                    <span className="text-lg font-bold">min</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Rating</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black">{helper.rating || '0'}</span>
                    <span className="text-lg font-bold">/ 5</span>
                  </div>
                </div>
              </div>

              {/* Verification */}
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100 mb-8">
                <span className="material-symbols-outlined text-green-600">verified_user</span>
                <p className="text-sm text-green-800 font-medium">Background checked & ID verified</p>
              </div>
            </>
          )}
        </div>

        {/* Confirm Button */}
        {helperData && (
          <div className="p-8 border-t border-gray-100 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full bg-primary text-white py-5 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
            >
              {confirming ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Confirming...
                </>
              ) : (
                <>
                  Confirm Helper
                  <span className="material-symbols-outlined">chevron_right</span>
                </>
              )}
            </button>
            <p className="text-center text-xs text-gray-400 mt-4">Average response time: 2 minutes</p>
          </div>
        )}
      </aside>
    </div>
  )
}
