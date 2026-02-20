import { useSocket } from '../context/SocketContext'

export default function ConnectionIndicator() {
  const { isConnected, connectError } = useSocket()

  // If connected, show minimized green indicator
  if (isConnected) {
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
          background: 'rgba(34, 197, 94, 0.12)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          padding: '8px 14px',
          borderRadius: 20,
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          fontWeight: 600,
          color: '#16A34A',
          letterSpacing: '0.03em',
          transition: 'all 0.3s ease',
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#22C55E',
            boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
          }}
        />
        Connected
      </div>
    )
  }

  // If disconnected/error, show red indicator with specific message
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
        background: 'rgba(239, 68, 68, 0.12)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        padding: '8px 14px',
        borderRadius: 20,
        fontFamily: "'Inter', sans-serif",
        fontSize: 11,
        fontWeight: 600,
        color: '#DC2626',
        letterSpacing: '0.03em',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#EF4444',
          boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
        }}
      />
      {connectError ? `Error: ${connectError}` : 'Disconnected'}
    </div>
  )
}
