import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { ToastProvider } from './hooks/useToast'
import ProtectedRoute from './components/ProtectedRoute'
import ConnectionIndicator from './components/ConnectionIndicator'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HelperDashboard from './pages/HelperDashboard'
import HelperFound from './pages/HelperFound'
import ActivityHistory from './pages/ActivityHistory'
import HelperDetail from './pages/HelperDetail'
import SearchMap from './pages/SearchMap'
import ProfileSettings from './pages/ProfileSettings'
import SeekerTracking from './pages/SeekerTracking'
import HelperNavigation from './pages/HelperNavigation'
import CancelledState from './pages/CancelledState'

function AppRoutes() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><HelperDashboard /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchMap /></ProtectedRoute>} />
        <Route path="/helper-detail" element={<ProtectedRoute><HelperDetail /></ProtectedRoute>} />
        <Route path="/helper-found" element={<ProtectedRoute><HelperFound /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><ActivityHistory /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />

        {/* Post-confirmation flow */}
        <Route path="/tracking/:requestId" element={<ProtectedRoute><SeekerTracking /></ProtectedRoute>} />
        <Route path="/navigation/:requestId" element={<ProtectedRoute><HelperNavigation /></ProtectedRoute>} />
        <Route path="/cancelled/:requestId" element={<ProtectedRoute><CancelledState /></ProtectedRoute>} />
      </Routes>
      <ConnectionIndicator />
    </>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
