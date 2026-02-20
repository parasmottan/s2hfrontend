
import { io } from 'socket.io-client'
import axios from 'axios'

const API_URL = 'http://localhost:5000/api'
const SOCKET_URL = 'http://localhost:5000'

async function run() {
  console.log('--- STARTING TEST ---')
  try {
    const email = `test${Date.now()}@example.com`
    const password = 'password123'
    console.log(`1. Registering user: ${email}`)

    const res = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test User',
      email,
      password,
      role: 'seeker'
    })

    const token = res.data.token
    console.log('2. Got token:', token ? 'YES (length ' + token.length + ')' : 'NO')

    if (!token) {
      console.error('No token received')
      process.exit(1)
    }

    console.log('3. Connecting to socket:', SOCKET_URL)
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: false
    })

    socket.on('connect', () => {
      console.log('✅ 4. CONNECTED! Socket ID:', socket.id)
      socket.disconnect()
      console.log('--- TEST PASSED ---')
    })

    socket.on('connect_error', (err) => {
      console.error('❌ 4. CONNECT ERROR:', err.message)
      console.error('Details:', JSON.stringify(err, Object.getOwnPropertyNames(err)))
    })

    socket.on('disconnect', (reason) => {
      console.log('ℹ️  DISCONNECTED:', reason)
    })

    // Timeout
    setTimeout(() => {
      console.log('⏰ TIMEOUT waiting for connection')
      socket.disconnect()
      process.exit(1)
    }, 5000)

  } catch (err) {
    console.error('❌ API ERROR:', err.message)
    if (err.response) {
      console.error('Status:', err.response.status)
      console.error('Data:', JSON.stringify(err.response.data))
    }
    process.exit(1)
  }
}

run()
