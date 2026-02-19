import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'seeker' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return null

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    const newErrors = {}
    if (!form.name) newErrors.name = 'Name is required'
    if (!form.email) newErrors.email = 'Email is required'
    if (!form.password) newErrors.password = 'Password is required'
    if (form.password && form.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (Object.keys(newErrors).length) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    try {
      await register(form.name, form.email, form.password, form.role)
      toast.success('Account created successfully!')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      setErrors({ general: msg })
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-md px-8">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#111111] rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S&H</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111111] mb-2">Create account</h1>
          <p className="text-gray-500 text-sm">Join the S&H marketplace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 font-medium">
              {errors.general}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Alex Sterling"
              className={`w-full px-4 py-3.5 rounded-xl border ${errors.name ? 'border-red-400' : 'border-gray-200'} bg-white text-[15px] outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`w-full px-4 py-3.5 rounded-xl border ${errors.email ? 'border-red-400' : 'border-gray-200'} bg-white text-[15px] outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              className={`w-full px-4 py-3.5 rounded-xl border ${errors.password ? 'border-red-400' : 'border-gray-200'} bg-white text-[15px] outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all`}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Role</label>
            <div className="bg-gray-100 p-1 rounded-full flex">
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'seeker' })}
                className={`flex-1 py-3 text-sm font-semibold rounded-full transition-all ${form.role === 'seeker'
                    ? 'bg-white shadow-sm text-[#111111]'
                    : 'text-gray-500'
                  }`}
              >
                🔍 Seeker
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'helper' })}
                className={`flex-1 py-3 text-sm font-semibold rounded-full transition-all ${form.role === 'helper'
                    ? 'bg-white shadow-sm text-[#111111]'
                    : 'text-gray-500'
                  }`}
              >
                🤝 Helper
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-[#111111] text-white rounded-xl font-bold text-[15px] hover:bg-[#333] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-[#111111] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
