import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './CancelledState.css'

export default function CancelledState() {
  const { requestId } = useParams()
  const navigate = useNavigate()

  const [cancelData, setCancelData] = useState({
    reason: 'The request was cancelled.',
    rejectedBy: null,
  })

  useEffect(() => {
    const stored = sessionStorage.getItem('sh_cancel_reason')
    if (stored) {
      try {
        setCancelData(JSON.parse(stored))
      } catch { /* ignore */ }
    }

    // Clean up session data
    sessionStorage.removeItem('sh_active_request')
    sessionStorage.removeItem('sh_helper_data')
    sessionStorage.removeItem('sh_cancel_window_end')
    sessionStorage.removeItem('sh_cancel_reason')
  }, [])

  const title = cancelData.rejectedBy === 'helper'
    ? 'Help Cancelled'
    : 'Request Cancelled'

  return (
    <div className="cancelled-page">
      {/* Animated cancel icon */}
      <div className="cancelled-icon-wrap">
        <div className="icon-inner">
          <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 32, fontWeight: 700 }}>
            close
          </span>
        </div>
      </div>

      <h1 className="cancelled-title">{title}</h1>
      <p className="cancelled-reason">{cancelData.reason}</p>

      {/* Info card */}
      <div className="cancelled-info-card">
        <div className="cancelled-info-row">
          <span className="info-label">Request ID</span>
          <span className="info-value" style={{ fontSize: 11, fontFamily: 'monospace' }}>
            {requestId ? `...${requestId.slice(-8)}` : '—'}
          </span>
        </div>
        <div className="cancelled-info-divider"></div>
        <div className="cancelled-info-row">
          <span className="info-label">Cancelled by</span>
          <span className="info-value" style={{ textTransform: 'capitalize' }}>
            {cancelData.rejectedBy || 'User'}
          </span>
        </div>
        {cancelData.rejectedBy === 'helper' && (
          <>
            <div className="cancelled-info-divider"></div>
            <div className="cancelled-info-row">
              <span className="info-label">Reason</span>
              <span className="info-value" style={{ maxWidth: 180, textAlign: 'right' }}>
                {cancelData.reason}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="cancelled-actions">
        <button className="btn-dashboard" onClick={() => navigate('/dashboard')}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>home</span>
          Back to Dashboard
        </button>
        <button className="btn-history" onClick={() => navigate('/history')}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>history</span>
          View History
        </button>
      </div>
    </div>
  )
}
