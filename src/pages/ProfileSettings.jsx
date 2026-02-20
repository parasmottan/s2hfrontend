import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useToast } from '../hooks/useToast'
import api from '../services/api'
import './ProfileSettings.css'

export default function ProfileSettings() {
  const { user, logout, loadUser } = useAuth()
  const { isConnected } = useSocket()
  const toast = useToast()
  const [switching, setSwitching] = useState(false)

  const handleLogout = () => {
    logout()
    toast.info('Logged out successfully')
  }

  const handleSwitchRole = async () => {
    if (switching) return
    setSwitching(true)
    try {
      const res = await api.patch('/users/role')
      toast.success(`Switched to ${res.data.data.role} mode!`)
      // Reload user context to reflect the change everywhere
      await loadUser()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to switch role')
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif", color: '#111111', backgroundColor: '#ffffff' }}>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard">
            <button className="w-10 h-10 flex items-center justify-start">
              <span className="material-symbols-outlined text-[#111111]">arrow_back_ios</span>
            </button>
          </Link>
          <h1 className="text-[17px] font-semibold tracking-tight">Profile</h1>
          <div className="w-10 flex justify-end">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-[#22C55E]' : 'bg-red-500'}`} title={isConnected ? 'Connected' : 'Disconnected'}></div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto pt-24 pb-28 px-6">
        {/* Profile Section */}
        <section className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border border-gray-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-gray-400 text-4xl">person</span>
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#111111] rounded-full flex items-center justify-center text-white border-2 border-white">
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
          </div>
          <h2 className="text-2xl font-semibold mb-1">{user?.name || 'User'}</h2>
          <p className="text-gray-500 text-sm mb-6">{user?.email || ''}</p>

          {/* Role Switch */}
          <div className="bg-gray-100 p-1 rounded-full flex w-64">
            <button
              onClick={user?.role !== 'seeker' ? handleSwitchRole : undefined}
              disabled={switching}
              className={`flex-1 ${user?.role === 'seeker' ? 'bg-white shadow-sm text-[#111111]' : 'text-gray-500'} rounded-full py-2 text-xs font-semibold tracking-wide uppercase transition-all disabled:opacity-50`}
            >
              Seeker
            </button>
            <button
              onClick={user?.role !== 'helper' ? handleSwitchRole : undefined}
              disabled={switching}
              className={`flex-1 ${user?.role === 'helper' ? 'bg-white shadow-sm text-[#111111]' : 'text-gray-500'} rounded-full py-2 text-xs font-semibold tracking-wide uppercase transition-all disabled:opacity-50`}
            >
              Helper
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Current role: <span className="font-semibold text-gray-600 capitalize">{user?.role || 'seeker'}</span>
            {switching && <span className="ml-2 text-blue-500">Switching...</span>}
          </p>
        </section>

        <div className="space-y-10">
          {/* Account Info */}
          <section>
            <h3 className="text-[11px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-4 px-1">Account</h3>
            <div className="bg-[#fcfcfc] border border-gray-100 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#111111]">badge</span>
                  </div>
                  <div>
                    <span className="font-medium block">User ID</span>
                    <span className="text-xs text-gray-400 font-mono">{user?._id ? user._id.slice(-8) : '—'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#111111]">verified</span>
                  </div>
                  <div>
                    <span className="font-medium block">Rating</span>
                    <span className="text-xs text-gray-400">{user?.rating || 0} / 5.0</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Finances */}
          <section>
            <h3 className="text-[11px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-4 px-1">Finances</h3>
            <div className="bg-[#fcfcfc] border border-gray-100 rounded-2xl overflow-hidden">
              <button className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#111111]">payments</span>
                  </div>
                  <span className="font-medium">Payment Methods</span>
                </div>
                <span className="material-symbols-outlined text-gray-300">chevron_right</span>
              </button>
              <Link to="/history">
                <button className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#111111]">history_edu</span>
                    </div>
                    <span className="font-medium">Help History</span>
                  </div>
                  <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                </button>
              </Link>
            </div>
          </section>

          {/* Preferences */}
          <section>
            <h3 className="text-[11px] font-bold text-gray-400 tracking-[0.1em] uppercase mb-4 px-1">Preferences</h3>
            <div className="bg-[#fcfcfc] border border-gray-100 rounded-2xl overflow-hidden">
              <button className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#111111]">notifications</span>
                  </div>
                  <span className="font-medium">Notifications</span>
                </div>
                <span className="material-symbols-outlined text-gray-300">chevron_right</span>
              </button>
              <button className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#111111]">language</span>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Language</span>
                    <span className="text-xs text-gray-400">English (US)</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-gray-300">chevron_right</span>
              </button>
            </div>
          </section>

          {/* Log Out */}
          <section className="pt-4">
            <button
              onClick={handleLogout}
              className="w-full py-4 text-center text-red-500 font-semibold text-sm tracking-wide transition-opacity active:opacity-60"
            >
              Log Out
            </button>
            <p className="text-center text-[10px] text-gray-400 mt-8 tracking-wider uppercase">
              Seeker to Helper © 2024
            </p>
          </section>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-8 pb-8 pt-3 flex justify-between items-center z-50">
        <Link to="/dashboard" className="flex flex-col items-center gap-1 text-gray-400">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-medium">Dashboard</span>
        </Link>
        <Link to="/search" className="flex flex-col items-center gap-1 text-gray-400">
          <span className="material-symbols-outlined">explore</span>
          <span className="text-[10px] font-medium">Search</span>
        </Link>
        <Link to="/history" className="flex flex-col items-center gap-1 text-gray-400">
          <span className="material-symbols-outlined">receipt_long</span>
          <span className="text-[10px] font-medium">Activity</span>
        </Link>
        <Link to="/profile" className="flex flex-col items-center gap-1 text-[#111111]">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          <span className="text-[10px] font-bold">Profile</span>
        </Link>
      </nav>
    </div>
  )
}
