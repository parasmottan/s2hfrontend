import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import { useToast } from '../hooks/useToast'
import { EVENTS } from '../services/socket'
import MapView from '../components/MapView'
import './SearchMap.css'

export default function SearchMap() {
  const { emit, on, isConnected } = useSocket()
  const toast = useToast()
  const navigate = useNavigate()
  const [searching, setSearching] = useState(false)
  const [searchForm, setSearchForm] = useState({
    category: 'Moving Help',
    budget: 50,
    estimatedArrivalTime: 15,
  })
  const searchingRef = useRef(false)

  // Listen for helper_found → navigate to helper detail
  useEffect(() => {
    const cleanup = on(EVENTS.HELPER_FOUND, (data) => {
      setSearching(false)
      searchingRef.current = false
      sessionStorage.setItem('sh_helper_data', JSON.stringify(data))
      toast.success('Helper found!')
      navigate('/helper-detail')
    })
    return cleanup
  }, [on, toast, navigate, isConnected])

  // Listen for search_started acknowledgement
  useEffect(() => {
    const cleanup = on(EVENTS.SEARCH_STARTED, (data) => {
      toast.info(`Searching... ${data.helpersNotified} helper(s) nearby`)
    })
    return cleanup
  }, [on, toast, isConnected])

  // Listen for errors — reset search state
  useEffect(() => {
    const cleanup = on(EVENTS.ERROR, (data) => {
      toast.error(data.message || 'Search error')
      setSearching(false)
      searchingRef.current = false
    })
    return cleanup
  }, [on, toast, isConnected])

  const doEmitSearch = (longitude, latitude) => {
    if (!isConnected) {
      toast.error('Connection lost. Please refresh.')
      setSearching(false)
      searchingRef.current = false
      return
    }
    const payload = { ...searchForm, longitude, latitude }
    console.log('[SearchMap] emitting search_help:', payload)
    emit(EVENTS.SEARCH_HELP, payload)
  }

  const handleSearch = () => {
    if (searching || searchingRef.current) return
    setSearching(true)
    searchingRef.current = true

    // Default fallback coords (Bangalore)
    const fallbackLng = 77.5946
    const fallbackLat = 12.9716

    if (navigator.geolocation) {
      const fallbackTimer = setTimeout(() => {
        console.log('[SearchMap] geolocation timed out, using fallback')
        doEmitSearch(fallbackLng, fallbackLat)
      }, 3000)

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(fallbackTimer)
          doEmitSearch(pos.coords.longitude, pos.coords.latitude)
        },
        () => {
          clearTimeout(fallbackTimer)
          doEmitSearch(fallbackLng, fallbackLat)
        },
        { timeout: 3000 }
      )
    } else {
      doEmitSearch(fallbackLng, fallbackLat)
    }
  }

  return (
    <div className="bg-[#f7f7f7] h-screen w-screen overflow-hidden flex flex-col relative" style={{ fontFamily: "'Inter', sans-serif", color: '#121212' }}>
      {/* Real Map Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <MapView />
      </div>


      {/* Top Left - Brand */}
      <div className="absolute top-4 left-4 md:top-8 md:left-10 z-30 flex items-center gap-6">
        <Link to="/dashboard" className="bg-white px-3 py-2 md:px-5 md:py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2 md:gap-3">
          <div className="w-7 h-7 md:w-8 md:h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">S&H</span>
          </div>
          <div className="h-4 w-px bg-gray-200 hidden md:block"></div>
          <span className="text-sm font-medium tracking-tight hidden md:inline">Premium Marketplace</span>
        </Link>
      </div>

      {/* Top Right - Controls */}
      <div className="absolute top-4 right-4 md:top-8 md:right-10 z-30 flex gap-2 md:gap-4">
        <button className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
          <span className="material-symbols-outlined text-primary text-xl md:text-2xl">search</span>
        </button>
        <button className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
          <span className="material-symbols-outlined text-primary text-xl md:text-2xl">tune</span>
        </button>
      </div>

      {/* Center Pulse */}
      <main className="flex-grow flex items-center justify-center relative z-10">
        {searching && (
          <div className="relative flex items-center justify-center w-[400px] h-[400px]">
            <div className="pulse-ring"></div>
            <div className="pulse-ring pulse-ring-2"></div>
            <div className="pulse-ring pulse-ring-3"></div>
            <div className="relative z-20 w-6 h-6 bg-primary rounded-full border-[3px] border-white shadow-2xl"></div>
          </div>
        )}
        {!searching && (
          <div className="text-center">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-gray-400">explore</span>
            </div>
            <p className="text-gray-500 text-sm font-medium">Ready to search</p>
          </div>
        )}
      </main>

      {/* Search Config Panel */}
      {
        !searching && (
          <div className="hidden md:block absolute top-24 left-10 z-30 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 p-6 w-80">
            <h3 className="text-sm font-bold mb-4">Search for Help</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Category</label>
                <select
                  value={searchForm.category}
                  onChange={(e) => setSearchForm({ ...searchForm, category: e.target.value })}
                  className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-[#111111]"
                >
                  <option>Moving Help</option>
                  <option>Cleaning</option>
                  <option>Tech Help</option>
                  <option>Handyman</option>
                  <option>Assembly</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Budget ($)</label>
                <input
                  type="number"
                  value={searchForm.budget}
                  onChange={(e) => setSearchForm({ ...searchForm, budget: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#111111]"
                  min="1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Max arrival (min)</label>
                <input
                  type="number"
                  value={searchForm.estimatedArrivalTime}
                  onChange={(e) => setSearchForm({ ...searchForm, estimatedArrivalTime: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#111111]"
                  min="1"
                />
              </div>
            </div>
          </div>
        )
      }

      {/* Bottom Scanning Pill / Start Search */}
      <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4">
        {searching ? (
          <div className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-full py-4 px-8 flex items-center justify-center gap-4 animate-float">
            <div className="relative flex items-center justify-center w-5 h-5">
              <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20"></div>
              <div className="relative w-2.5 h-2.5 bg-primary rounded-full"></div>
            </div>
            <span className="text-[15px] font-medium text-primary tracking-tight">Scanning nearby helpers...</span>
          </div>
        ) : (
          <button
            onClick={handleSearch}
            className="w-full bg-[#111111] text-white py-4 px-8 rounded-full font-bold text-[15px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:bg-[#333] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined">search</span>
            Start Searching
          </button>
        )}
        <div className="text-center mt-6">
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-[0.2em]">Real-time Network Activation</span>
        </div>
      </div>

    </div >
  )
}
