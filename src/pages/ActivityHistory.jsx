import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './ActivityHistory.css'

export default function ActivityHistory() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  // Fetch real request history from API
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        const res = await api.get('/requests/my')
        setRequests(res.data.data || [])
      } catch (err) {
        console.error('Failed to fetch history:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  const getCategoryIcon = (category) => {
    const icons = {
      'Cleaning': 'cleaning_services',
      'Moving Help': 'local_shipping',
      'Tech Help': 'computer',
      'Handyman': 'construction',
      'Assembly': 'handyman',
    }
    return icons[category] || 'task'
  }

  const getStatusBadge = (status) => {
    const styles = {
      completed: { bg: 'bg-black text-white', label: 'Completed' },
      cancelled: { bg: 'bg-red-100 text-red-600', label: 'Cancelled' },
      searching: { bg: 'bg-yellow-100 text-yellow-700', label: 'Searching' },
      helper_accepted: { bg: 'bg-blue-100 text-blue-700', label: 'Accepted' },
      confirmed: { bg: 'bg-green-100 text-green-700', label: 'Confirmed' },
      on_the_way: { bg: 'bg-purple-100 text-purple-700', label: 'On The Way' },
    }
    return styles[status] || { bg: 'bg-gray-100 text-gray-600', label: status }
  }

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'all') return true
    if (activeTab === 'active') return ['searching', 'helper_accepted', 'confirmed', 'on_the_way'].includes(r.status)
    if (activeTab === 'completed') return r.status === 'completed'
    if (activeTab === 'cancelled') return r.status === 'cancelled'
    return true
  })

  return (
    <div className="min-h-screen flex flex-col bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md pt-14 pb-4 px-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">History</h1>
          <Link to="/dashboard">
            <button className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50">
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
          </Link>
        </div>
        <div className="flex gap-6 overflow-x-auto no-scrollbar">
          {[
            { key: 'all', label: 'All Activity' },
            { key: 'active', label: 'Active' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-sm ${activeTab === tab.key ? 'font-semibold' : 'font-medium'} border-b-2 ${activeTab === tab.key ? 'border-primary' : 'border-transparent text-gray-400'
                } pb-2 whitespace-nowrap transition-all`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-grow px-6 py-6 pb-28">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-[#111111] rounded-full animate-spin"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-gray-300 text-3xl">receipt_long</span>
            </div>
            <h3 className="font-semibold text-gray-600 mb-1">No activity yet</h3>
            <p className="text-sm text-gray-400 max-w-xs">
              {user?.role === 'seeker'
                ? 'Your completed and past requests will appear here.'
                : 'Your completed tasks and earnings will show here.'}
            </p>
            <Link to={user?.role === 'seeker' ? '/search' : '/dashboard'} className="mt-6">
              <button className="bg-[#111111] text-white text-sm font-semibold px-6 py-3 rounded-full">
                {user?.role === 'seeker' ? 'Find Help' : 'Go to Dashboard'}
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => {
              const badge = getStatusBadge(req.status)
              return (
                <div key={req._id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-400">{getCategoryIcon(req.category)}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-[15px]">{req.category}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">${req.budget}</span>
                  </div>
                  {/* Show helper/seeker name if available */}
                  {req.helperId?.name && user?.role === 'seeker' && (
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">person</span>
                      Helper: {req.helperId.name}
                    </p>
                  )}
                  {req.seekerId?.name && user?.role === 'helper' && (
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">person</span>
                      Seeker: {req.seekerId.name}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <span className="material-symbols-outlined text-gray-300 text-lg">chevron_right</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-8 py-4 flex justify-between items-center pb-8 z-50">
        <Link to="/dashboard" className="flex flex-col items-center gap-1 text-gray-300">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-medium">Dashboard</span>
        </Link>
        <Link to="/search" className="flex flex-col items-center gap-1 text-gray-300">
          <span className="material-symbols-outlined">explore</span>
          <span className="text-[10px] font-medium">Search</span>
        </Link>
        <Link to="/history" className="flex flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
          <span className="text-[10px] font-bold">Activity</span>
        </Link>
        <Link to="/profile" className="flex flex-col items-center gap-1 text-gray-300">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>
    </div>
  )
}
