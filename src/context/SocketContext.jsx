import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { connectSocket, disconnectSocket, EVENTS } from '../services/socket'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [connectError, setConnectError] = useState(null)
  const socketRef = useRef(null)
  // Track connection readiness so components know when they can emit
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !token) {
      console.log('[SocketCtx] not authenticated, cleaning up')
      setIsConnected(false)
      setReady(false)
      setConnectError(null)
      if (socketRef.current) {
        disconnectSocket()
        socketRef.current = null
      }
      return
    }

    console.log('[SocketCtx] connecting...')
    // Reset error on new connection attempt
    setConnectError(null)
    const sock = connectSocket(token)
    socketRef.current = sock

    const onConnect = () => {
      console.log('[SocketCtx] ✅ connected, id:', sock.id)
      setIsConnected(true)
      setReady(true)
      setConnectError(null)
    }
    const onDisconnect = (reason) => {
      console.log('[SocketCtx] ❌ disconnected, reason:', reason)
      setIsConnected(false)
      setReady(false)
    }
    const onConnectError = (err) => {
      console.log('[SocketCtx] connect_error:', err.message)
      setIsConnected(false)
      setReady(false)
      setConnectError(err.message)
    }

    sock.on('connect', onConnect)
    sock.on('disconnect', onDisconnect)
    sock.on('connect_error', onConnectError)

    // If already connected
    if (sock.connected) {
      console.log('[SocketCtx] socket already connected')
      setIsConnected(true)
      setReady(true)
    }

    return () => {
      sock.off('connect', onConnect)
      sock.off('disconnect', onDisconnect)
      sock.off('connect_error', onConnectError)
    }
  }, [isAuthenticated, token])

  const emit = useCallback((event, data) => {
    const sock = socketRef.current
    if (sock && sock.connected) {
      console.log('[SocketCtx] ➡️ emit:', event, data)
      sock.emit(event, data)
    } else {
      console.warn('[SocketCtx] ⚠️ emit FAILED — socket not connected. Event:', event)
    }
  }, [])

  const on = useCallback((event, handler) => {
    const sock = socketRef.current
    if (sock) {
      console.log('[SocketCtx] 👂 listening for:', event)
      sock.on(event, handler)
      return () => {
        sock.off(event, handler)
      }
    }
    console.warn('[SocketCtx] ⚠️ on() called but no socket. Event:', event)
    return () => { }
  }, [])

  const value = {
    isConnected,
    connectError,
    ready,
    emit,
    on,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) throw new Error('useSocket must be used within SocketProvider')
  return context
}
