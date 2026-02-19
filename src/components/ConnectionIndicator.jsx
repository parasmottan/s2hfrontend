import { useSocket } from '../context/SocketContext'

export default function ConnectionIndicator() {
  const { isConnected } = useSocket()

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: isConnected ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isConnected ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
        padding: '8px 14px',
        borderRadius: 20,
        fontFamily: "'Inter', sans-serif",
        fontSize: 11,
        fontWeight: 600,
        color: isConnected ? '#16A34A' : '#DC2626',
        letterSpacing: '0.03em',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: isConnected ? '#22C55E' : '#EF4444',
          boxShadow: isConnected ? '0 0 8px rgba(34, 197, 94, 0.6)' : '0 0 8px rgba(239, 68, 68, 0.6)',
        }}
      />
      {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  )
}
