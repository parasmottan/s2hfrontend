import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './LandingPage.css'

export default function LandingPage() {
  const { isAuthenticated } = useAuth()

  // If already logged in, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="bg-white min-h-screen flex flex-col" style={{ fontFamily: "'Inter', sans-serif", color: '#121212' }}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#111111] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">S&H</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">Seeker to Helper</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <span className="cursor-pointer hover:text-[#111111] transition-colors">Categories</span>
            <span className="cursor-pointer hover:text-[#111111] transition-colors">How It Works</span>
            <span className="cursor-pointer hover:text-[#111111] transition-colors">Become a Helper</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login">
            <button className="text-sm font-medium text-gray-600 hover:text-[#111111] transition-colors">Log In</button>
          </Link>
          <Link to="/register">
            <button className="bg-[#111111] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#333] transition-colors">Sign Up</button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-6 py-20">
        <h1 className="hero-title text-7xl font-bold tracking-tighter leading-none mb-6">
          Get instant help<br />near you.
        </h1>
        <p className="text-gray-500 text-lg max-w-md mb-10">
          Find verified local helpers for any task. From cleaning to tech support, get matched in seconds.
        </p>

        {/* Search */}
        <div className="w-full max-w-xl relative mb-12">
          <div className="search-shadow flex items-center bg-[#F5F5F5] rounded-full px-6 py-2 border border-gray-100">
            <span className="material-symbols-outlined text-gray-400 mr-3">search</span>
            <input
              type="text"
              placeholder="What do you need help with?"
              className="flex-grow bg-transparent outline-none text-[15px] py-3 placeholder-gray-400"
            />
            <Link to="/register">
              <button className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#111111] text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-3 flex-wrap justify-center mb-16">
          {['Cleaning', 'Shifting', 'Tech Help', 'Handyman', 'Assembly'].map((cat) => (
            <span key={cat} className="border border-gray-200 text-sm font-medium px-5 py-2.5 rounded-full hover:bg-[#111111] hover:text-white hover:border-[#111111] transition-all cursor-pointer">{cat}</span>
          ))}
        </div>

        {/* Promo Card */}
        <div className="bg-[#F9F9F9] rounded-3xl overflow-hidden flex max-w-3xl w-full border border-gray-100">
          <div className="flex-1 p-10 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-3">Featured Service</span>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Expert Deep Clean</h2>
            <p className="text-gray-500 text-sm mb-6">Professional home cleaning by verified helpers, starting at $45/hr.</p>
            <Link to="/register">
              <button className="bg-[#111111] text-white text-sm font-semibold px-6 py-3 rounded-full w-fit hover:bg-[#333] transition-colors">Book Now</button>
            </Link>
          </div>
          <div className="flex-1">
            <img
              alt="Expert Deep Cleaning Service"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCILvRQPRHTIjt2pYP99zzaOQk93cqeZLjkP01NguXIvNJr4lqUcecGtdUjUHHqIxoSA9MABUYd6HJN5LZ9t8HRh3QZlqVQo0mw67lKf37Rkl5xrBwvDlYlUoMJACKUAaxUWQQWxg-RG9ECWT9VfmYr1B39AGptjopEHkXw35wGx9m6TxSfE0K18Qf_uQ9rIQTLFLdWQjBT_dMD5EXjh3TtJ8uJzq3hBD56tIJwRrYlCnx3TlT3Ue7tQKzjD7PZqJX1d0K8_gfRg"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-8 py-6 flex items-center justify-between">
        <span className="text-xs text-gray-400">© 2024 Seeker to Helper</span>
        <div className="flex gap-6 text-xs text-gray-400">
          <span className="cursor-pointer hover:text-[#111111] transition-colors">Privacy</span>
          <span className="cursor-pointer hover:text-[#111111] transition-colors">Terms</span>
          <span className="cursor-pointer hover:text-[#111111] transition-colors">Support</span>
        </div>
      </footer>
    </div>
  )
}
