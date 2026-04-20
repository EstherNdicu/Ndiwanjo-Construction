import { useState } from 'react'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invalid credentials')
      localStorage.setItem('name', data.name)
      localStorage.setItem('role', data.role)
      localStorage.setItem('userId', data.id)
      onLogin(data.name)
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const settings = (() => { try { return JSON.parse(localStorage.getItem('ndiwanjo_settings') || '{}') } catch { return {} } })()
  const companyName = settings.companyName || 'Ndiwanjo Construction'
  const tagline = settings.tagline || 'Management System'
  const logo = settings.logo || null

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: '#f0f4f8',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>

      {/* Left panel */}
      <div style={{
        width: '45%',
        background: 'linear-gradient(160deg, #0a1628 0%, #0d2147 50%, #0a1628 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(circle at 20px 20px, #c9a84c 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />

        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', border: '1px solid rgba(201,168,76,0.15)' }} />
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', border: '1px solid rgba(201,168,76,0.1)' }} />
        <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '400px', height: '400px', borderRadius: '50%', border: '1px solid rgba(201,168,76,0.08)' }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              backgroundColor: '#1e3a5f',
              border: '1px solid rgba(201,168,76,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0,
            }}>
              {logo ? (
                <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: '24px' }}>🏗️</span>
              )}
            </div>
            <div>
              <h1 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{companyName}</h1>
              <p style={{ color: '#c9a84c', fontSize: '12px', margin: 0, marginTop: '2px' }}>{tagline}</p>
            </div>
          </div>
        </div>

        {/* Center content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '56px', height: '3px', borderRadius: '2px',
            background: 'linear-gradient(90deg, #c9a84c, transparent)',
            marginBottom: '24px',
          }} />
          <h2 style={{ color: '#fff', fontSize: '32px', fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
            Manage your<br />
            <span style={{ color: '#c9a84c' }}>projects</span> with<br />
            confidence.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '16px', lineHeight: 1.7, maxWidth: '280px' }}>
            Track projects, employees, finances, and suppliers — all in one place.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '32px' }}>
            {[
              { icon: '📊', text: 'Real-time project dashboard' },
              { icon: '💰', text: 'Financial tracking & invoicing' },
              { icon: '👷', text: 'Employee & payroll management' },
              { icon: '🏭', text: 'Supplier & equipment tracking' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  backgroundColor: 'rgba(201,168,76,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', flexShrink: 0,
                }}>{f.icon}</div>
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', margin: 0 }}>
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        backgroundColor: '#f0f4f8',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#0a1628', margin: 0 }}>Welcome back</h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0, marginTop: '6px' }}>Sign in to your account to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Error */}
            {error && (
              <div style={{
                backgroundColor: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '10px', padding: '12px 16px',
                color: '#dc2626', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="you@ndiwanjo.com"
                autoComplete="email"
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '10px',
                  border: '1.5px solid #e2e8f0', fontSize: '14px', color: '#0a1628',
                  backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#0a1628'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '12px 48px 12px 16px', borderRadius: '10px',
                    border: '1.5px solid #e2e8f0', fontSize: '14px', color: '#0a1628',
                    backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#0a1628'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '14px',
                  }}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #0a1628, #0d2147)',
                color: '#fff', border: 'none', borderRadius: '10px',
                fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '4px', transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(10,22,40,0.3)',
              }}>
              {loading ? '⏳ Signing in...' : 'Sign In →'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '28px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>secured access</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          </div>

          {/* Info */}
          <div style={{
            backgroundColor: '#fff', borderRadius: '12px', padding: '16px',
            border: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>🔒</span>
            <div>
              <p style={{ color: '#374151', fontSize: '13px', fontWeight: 600, margin: 0 }}>Admin access only</p>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0, marginTop: '3px' }}>
                Contact your administrator if you don't have an account or forgot your password.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}