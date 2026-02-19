import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { disconnectSocket } from '../services/socket'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('sh_token'))
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // ── Load user on mount / token change ──────────────────────────
  const loadUser = useCallback(async () => {
    const storedToken = localStorage.getItem('sh_token')
    if (!storedToken) {
      setUser(null)
      setToken(null)
      setLoading(false)
      return
    }

    try {
      const res = await api.get('/auth/me')
      setUser(res.data.data)
      setToken(storedToken)
    } catch {
      // Token invalid — clear everything
      localStorage.removeItem('sh_token')
      localStorage.removeItem('sh_user')
      setUser(null)
      setToken(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  // ── Register ───────────────────────────────────────────────────
  const register = async (name, email, password, role) => {
    const res = await api.post('/auth/register', { name, email, password, role })
    const { token: newToken, data } = res.data

    localStorage.setItem('sh_token', newToken)
    localStorage.setItem('sh_user', JSON.stringify(data))
    setToken(newToken)
    setUser(data)

    // Socket connection is handled by SocketContext when isAuthenticated changes
    navigate('/dashboard')
    return data
  }

  // ── Login ──────────────────────────────────────────────────────
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token: newToken, data } = res.data

    localStorage.setItem('sh_token', newToken)
    localStorage.setItem('sh_user', JSON.stringify(data))
    setToken(newToken)
    setUser(data)

    // Socket connection is handled by SocketContext when isAuthenticated changes
    navigate('/dashboard')
    return data
  }

  // ── Logout ─────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('sh_token')
    localStorage.removeItem('sh_user')
    disconnectSocket()
    setUser(null)
    setToken(null)
    navigate('/login')
  }

  const value = {
    user,
    token,
    loading,
    register,
    login,
    logout,
    loadUser,
    isAuthenticated: !!user && !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
