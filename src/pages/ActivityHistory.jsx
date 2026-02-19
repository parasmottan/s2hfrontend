import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './ActivityHistory.css'

export default function ActivityHistory() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  // Note: There's no dedicated history endpoint in the backend.
  // Activity displays are based on locally tracked request data.
  // In production, you'd add GET /api/requests/history endpoint.

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
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-sm font-${activeTab === tab.key ? 'semibold' : 'medium'} border-b-2 ${activeTab === tab.key ? 'border-primary' : 'border-transparent text-gray-400'
                } pb-2 whitespace-nowrap transition-all`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-grow px-6 py-6">
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
            <Link to="/search" className="mt-6">
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
                          {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">${req.budget}</span>
                  </div>
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

      <nav className="sticky bottom-0 bg-white border-t border-gray-100 px-8 py-4 flex justify-between items-center pb-8">
        <Link to="/search" className="flex flex-col items-center gap-1 text-gray-300">
          <span className="material-symbols-outlined">explore</span>
          <span className="text-[10px] font-medium">Search</span>
        </Link>
        <Link to="/history" className="flex flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
          <span className="text-[10px] font-bold">Activity</span>
        </Link>
        <div className="flex flex-col items-center gap-1 text-gray-300">
          <span className="material-symbols-outlined">chat_bubble</span>
          <span className="text-[10px] font-medium">Messages</span>
        </div>
        <Link to="/profile" className="flex flex-col items-center gap-1 text-gray-300">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>
    </div>
  )
}
