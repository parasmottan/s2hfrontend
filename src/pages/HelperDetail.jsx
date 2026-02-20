import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import { useToast } from '../hooks/useToast'
import { EVENTS } from '../services/socket'
import TrackingMapView from '../components/TrackingMapView'
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

  // Extract helper location from the data (if available)
  const helperLocation = helper.currentLocation?.coordinates
    ? { lng: helper.currentLocation.coordinates[0], lat: helper.currentLocation.coordinates[1] }
    : helper.location?.coordinates
      ? { lng: helper.location.coordinates[0], lat: helper.location.coordinates[1] }
      : null

  return (
    <div className="bg-white h-screen w-screen overflow-hidden flex flex-col md:flex-row" style={{ fontFamily: "'Inter', sans-serif", color: '#121212' }}>
      {/* Map Panel — full width on mobile (45vh), 65% on desktop */}
      <div className="w-full h-[45vh] md:w-[65%] md:h-full relative overflow-hidden bg-[#F2F2F2]">
        <TrackingMapView
          helperLocation={helperLocation}
          className="w-full h-full"
        />

        {/* Back button */}
        <div className="absolute top-4 left-4 md:top-8 md:left-8 flex flex-col gap-3 z-20">
          <Link to="/search">
            <button className="w-11 h-11 md:w-12 md:h-12 bg-white rounded-full shadow-xl flex items-center justify-center hover:bg-gray-50 transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Detail Panel — full width stacked on mobile, 35% sidebar on desktop */}
      <aside className="w-full flex-grow md:w-[35%] md:h-full bg-white border-t md:border-t-0 md:border-l border-gray-100 flex flex-col shadow-[0_-4px_20px_rgba(0,0,0,0.03)] md:shadow-[-10px_0_30px_rgba(0,0,0,0.02)] relative z-20 overflow-hidden">
        <div className="flex-grow overflow-y-auto px-6 py-6 md:px-10 md:py-12">
          {!helperData ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">hourglass_empty</span>
              <p className="text-gray-400 text-sm">Waiting for helper match...</p>
              <Link to="/search" className="text-[#111111] text-sm font-semibold mt-4 hover:underline">Back to search</Link>
            </div>
          ) : (
            <>
              {/* Profile Header */}
              <div className="flex items-start justify-between mb-6 md:mb-8">
                <div className="flex flex-col gap-3">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gray-100 flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-gray-400 text-3xl md:text-4xl">person</span>
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{helper.name || 'Helper'}</h1>
                    <p className="text-gray-500 font-medium text-sm">{helper.email || 'Specialist'}</p>
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
              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-10">
                <div className="bg-gray-50 p-4 md:p-5 rounded-2xl border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Estimated Arrival</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl md:text-3xl font-black">~5</span>
                    <span className="text-base md:text-lg font-bold">min</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 md:p-5 rounded-2xl border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Rating</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl md:text-3xl font-black">{helper.rating || '0'}</span>
                    <span className="text-base md:text-lg font-bold">/ 5</span>
                  </div>
                </div>
              </div>

              {/* Verification */}
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100 mb-6 md:mb-8">
                <span className="material-symbols-outlined text-green-600">verified_user</span>
                <p className="text-sm text-green-800 font-medium">Background checked & ID verified</p>
              </div>
            </>
          )}
        </div>

        {/* Confirm Button */}
        {helperData && (
          <div className="p-5 md:p-8 border-t border-gray-100 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full bg-primary text-white py-4 md:py-5 rounded-2xl font-bold text-base md:text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
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
            <p className="text-center text-xs text-gray-400 mt-3 md:mt-4">Average response time: 2 minutes</p>
          </div>
        )}
      </aside>
    </div>
  )
}
