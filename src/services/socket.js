import { io } from 'socket.io-client'

const SOCKET_URL = 'https://s2hbackend.zeabur.app'

let socket = null

// ── Socket event constants (matching backend) ────────────────────
export const EVENTS = {
  // Seeker emits
  SEARCH_HELP: 'search_help',
  CONFIRM_HELPER: 'confirm_helper',
  CANCEL_REQUEST: 'cancel_request',

  // Helper emits
  GO_ONLINE: 'go_online',
  GO_OFFLINE: 'go_offline',
  ACCEPT_REQUEST: 'accept_request',
  REJECT_REQUEST: 'reject_request',
  LOCATION_UPDATE: 'location_update',

  // Server emits
  NEW_REQUEST: 'new_request',
  HELPER_FOUND: 'helper_found',
  REQUEST_LOCKED: 'request_locked',
  REQUEST_EXPIRED: 'request_expired',
  HELPER_ON_THE_WAY: 'helper_on_the_way',
  SEARCH_STARTED: 'search_started',
  REQUEST_CANCELLED: 'request_cancelled',
  CONFIRM_REDIRECT: 'confirm_redirect',
  CANCEL_WINDOW_EXPIRED: 'cancel_window_expired',
  SYNC_STATE: 'sync_state',

  // Generic
  ERROR: 'error',
  STATUS: 'status',
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
}

/**
 * Connect to Socket.io server with JWT auth.
 * Prevents duplicate connections.
 * @param {string} token - JWT token
 * @returns {import('socket.io-client').Socket}
 */
export function connectSocket(token) {
  // If already connected with same token, reuse
  if (socket?.connected) {
    console.log('[socket.js] already connected, reusing')
    return socket
  }

  // If there's an existing disconnected socket, clean up first
  if (socket) {
    console.log('[socket.js] cleaning up stale socket')
    socket.disconnect()
    socket = null
  }

  console.log('[socket.js] creating new connection')
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  socket.on('connect', () => {
    console.log('[socket.js] connected, id:', socket.id)
  })

  socket.on('connect_error', (err) => {
    console.error('[socket.js] connect_error:', err.message)
  })

  return socket
}

/**
 * Disconnect the current socket connection.
 */
export function disconnectSocket() {
  if (socket) {
    console.log('[socket.js] disconnecting')
    socket.disconnect()
    socket = null
  }
}

/**
 * Get the current socket instance.
 * @returns {import('socket.io-client').Socket | null}
 */
export function getSocket() {
  return socket
}
