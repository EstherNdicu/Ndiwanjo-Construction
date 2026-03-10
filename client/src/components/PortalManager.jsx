import { useState } from 'react'

export default function PortalManager({ type, id, existingToken, onTokenChange }) {
  const [token, setToken] = useState(existingToken || null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [revoking, setRevoking] = useState(false)

  const portalUrl = token
    ? `${window.location.origin}/portal/${type}/${token}`
    : null

  const generateLink = async () => {
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:5000/${type === 'project' ? 'projects' : 'customers'}/${id}/portal-token`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToken(data.token)
      if (onTokenChange) onTokenChange(data.token)
    } catch {
      alert('Failed to generate portal link.')
    } finally {
      setLoading(false)
    }
  }

  const revokeLink = async () => {
    if (!window.confirm('Revoke this link? The client will no longer be able to access the portal.')) return
    setRevoking(true)
    try {
      await fetch(`http://localhost:5000/${type === 'project' ? 'projects' : 'customers'}/${id}/portal-token`, {
        method: 'DELETE',
      })
      setToken(null)
      if (onTokenChange) onTokenChange(null)
    } catch {
      alert('Failed to revoke portal link.')
    } finally {
      setRevoking(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl p-4 border space-y-3" style={{ backgroundColor: '#0d1f3c', borderColor: '#1e3a5f' }}>
      <div className="flex items-center gap-2">
        <span className="text-lg">🔗</span>
        <div>
          <p className="text-white text-sm font-semibold">Client Portal Link</p>
          <p className="text-xs" style={{ color: '#4a6fa5' }}>
            Share this link with your client so they can track {type === 'project' ? 'this project' : 'all their projects'}
          </p>
        </div>
      </div>

      {token ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ backgroundColor: '#1e3a5f' }}>
            <p className="text-xs flex-1 truncate" style={{ color: '#8a9bb5' }}>{portalUrl}</p>
            <button onClick={copyLink}
              className="text-xs px-2.5 py-1 rounded-lg font-medium flex-shrink-0 transition-colors"
              style={{ backgroundColor: copied ? '#16a34a' : '#c9a84c', color: copied ? '#fff' : '#0a1628' }}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <div className="flex gap-2">
            <a href={portalUrl} target="_blank" rel="noopener noreferrer"
              className="flex-1 text-center py-2 rounded-lg text-xs font-medium transition-colors"
              style={{ backgroundColor: '#1e3a5f', color: '#c9a84c' }}>
              👁️ Preview Portal
            </a>
            <button onClick={revokeLink} disabled={revoking}
              className="flex-1 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{ backgroundColor: '#3a1a1a', color: '#ef4444' }}>
              {revoking ? 'Revoking...' : '🗑️ Revoke Link'}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={generateLink} disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: loading ? '#1e3a5f' : 'linear-gradient(135deg, #c9a84c, #a8883a)',
            color: loading ? '#6b7a8d' : '#0a1628',
          }}>
          {loading ? '⏳ Generating...' : '🔗 Generate Portal Link'}
        </button>
      )}
    </div>
  )
}