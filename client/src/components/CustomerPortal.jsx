import { useState, useEffect } from 'react'

function ProgressBar({ progress }) {
  return (
    <div className="w-full rounded-full h-3" style={{ backgroundColor: '#1e3a5f' }}>
      <div className="h-3 rounded-full transition-all duration-700"
        style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #c9a84c, #a8883a)' }} />
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    active: 'background:#c9a84c20;color:#c9a84c',
    completed: 'background:#16a34a20;color:#22c55e',
    pending: 'background:#1e3a5f;color:#8a9bb5',
  }
  return (
    <span className="text-xs font-bold px-3 py-1 rounded-full capitalize"
      style={{ ...(Object.fromEntries((styles[status] || styles.pending).split(';').map(s => s.split(':')))) }}>
      {status}
    </span>
  )
}

export default function CustomerPortal() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState(null) // 'project' or 'customer'
  const [activeProject, setActiveProject] = useState(null)

  useEffect(() => {
    const path = window.location.pathname
    const projectMatch = path.match(/\/portal\/project\/([a-f0-9]+)/)
    const customerMatch = path.match(/\/portal\/customer\/([a-f0-9]+)/)

    if (projectMatch) {
      setType('project')
      fetchPortal('project', projectMatch[1])
    } else if (customerMatch) {
      setType('customer')
      fetchPortal('customer', customerMatch[1])
    } else {
      setError('Invalid portal link.')
      setLoading(false)
    }
  }, [])

  const fetchPortal = async (type, token) => {
    try {
      const res = await fetch(`http://localhost:5000/portal/${type}/${token}`)
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Portal not found')
      setData(d)
      if (type === 'project') setActiveProject(d)
      else if (d.projects?.length > 0) setActiveProject(d.projects[0])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const currency = 'KSh'

  const getFinancials = (project) => {
    const quotation = Number(project.quotation) || 0
    const totalPaid = (project.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0)
    const totalExpenses = (project.expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0)
    const outstanding = Math.max(0, quotation - totalPaid)
    return { quotation, totalPaid, totalExpenses, outstanding }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#060f1e' }}>
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🏗️</div>
        <p style={{ color: '#c9a84c' }}>Loading your portal...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#060f1e' }}>
      <div className="text-center max-w-sm">
        <p className="text-6xl mb-4">🔒</p>
        <h2 className="text-white text-xl font-bold mb-2">Portal Not Found</h2>
        <p style={{ color: '#4a6fa5' }}>{error}</p>
        <p className="text-sm mt-3" style={{ color: '#4a6fa5' }}>Please contact Ndiwanjo Construction for a valid link.</p>
      </div>
    </div>
  )

  const settings = (() => { try { return JSON.parse(localStorage.getItem('ndiwanjo_settings') || '{}') } catch { return {} } })()
  const companyName = settings.companyName || 'Ndiwanjo Construction'
  const tagline = settings.tagline || 'Building Legacies, One Beam at a Time'
  const phone = settings.phone || ''
  const email = settings.email || ''

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#060f1e', color: '#fff' }}>

      {/* Header */}
      <div className="border-b" style={{ backgroundColor: '#0a1628', borderColor: '#1e3a5f' }}>
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.logo ? (
              <img src={settings.logo} alt="Logo" className="w-10 h-10 rounded-xl object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: '#1e3a5f', border: '1px solid #c9a84c' }}>🏗️</div>
            )}
            <div>
              <p className="font-bold text-white text-sm">{companyName}</p>
              <p className="text-xs" style={{ color: '#c9a84c' }}>{tagline}</p>
            </div>
          </div>
          <div className="text-right text-xs" style={{ color: '#4a6fa5' }}>
            {phone && <p>📞 {phone}</p>}
            {email && <p>✉️ {email}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Customer header (customer portal only) */}
        {type === 'customer' && data && (
          <div className="rounded-2xl p-6 border" style={{ backgroundColor: '#0d1f3c', borderColor: '#1e3a5f' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#c9a84c' }}>Client Portal</p>
            <h1 className="text-2xl font-bold text-white">{data.name}</h1>
            <div className="flex gap-4 mt-2 text-sm" style={{ color: '#8a9bb5' }}>
              {data.email && <span>✉️ {data.email}</span>}
              {data.phone && <span>📞 {data.phone}</span>}
            </div>
            <p className="text-sm mt-3" style={{ color: '#4a6fa5' }}>
              {data.projects?.length || 0} project{data.projects?.length !== 1 ? 's' : ''} in progress
            </p>
          </div>
        )}

        {/* Project tabs (customer portal) */}
        {type === 'customer' && data?.projects?.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {data.projects.map(p => (
              <button key={p.id} onClick={() => setActiveProject(p)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all border"
                style={activeProject?.id === p.id ? {
                  background: 'linear-gradient(135deg, #c9a84c, #a8883a)',
                  color: '#0a1628', borderColor: 'transparent'
                } : {
                  backgroundColor: '#0d1f3c', color: '#8a9bb5', borderColor: '#1e3a5f'
                }}>
                {p.name}
              </button>
            ))}
          </div>
        )}

        {/* Project detail */}
        {activeProject && (() => {
          const { quotation, totalPaid, totalExpenses, outstanding } = getFinancials(activeProject)
          const progress = Number(activeProject.progress) || 0

          return (
            <div className="space-y-5">
              {/* Project title */}
              <div className="rounded-2xl p-6 border" style={{ backgroundColor: '#0d1f3c', borderColor: '#1e3a5f' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#c9a84c' }}>Project</p>
                    <h2 className="text-xl font-bold text-white">{activeProject.name}</h2>
                    {activeProject.description && <p className="text-sm mt-1" style={{ color: '#8a9bb5' }}>{activeProject.description}</p>}
                  </div>
                  <StatusBadge status={activeProject.status} />
                </div>

                {/* Timeline */}
                {(activeProject.startDate || activeProject.endDate) && (
                  <div className="flex gap-6 mt-4 pt-4 border-t" style={{ borderColor: '#1e3a5f' }}>
                    {activeProject.startDate && (
                      <div>
                        <p className="text-xs" style={{ color: '#4a6fa5' }}>Start Date</p>
                        <p className="text-white text-sm font-medium mt-0.5">
                          {new Date(activeProject.startDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                    {activeProject.endDate && (
                      <div>
                        <p className="text-xs" style={{ color: '#4a6fa5' }}>Expected Completion</p>
                        <p className="text-white text-sm font-medium mt-0.5">
                          {new Date(activeProject.endDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Progress */}
              <div className="rounded-2xl p-6 border" style={{ backgroundColor: '#0d1f3c', borderColor: '#1e3a5f' }}>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-white font-semibold">Project Progress</p>
                  <p className="text-2xl font-bold" style={{ color: '#c9a84c' }}>{progress}%</p>
                </div>
                <ProgressBar progress={progress} />
                <p className="text-xs mt-2" style={{ color: '#4a6fa5' }}>
                  {progress === 100 ? '✅ Project completed!' : progress >= 75 ? '🔨 Nearly done' : progress >= 50 ? '🏗️ Good progress' : progress >= 25 ? '📐 Work in progress' : '🔍 Just getting started'}
                </p>
              </div>

              {/* Financial cards */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Contract Value', value: `${currency} ${quotation.toLocaleString()}`, icon: '📋', color: '#c9a84c' },
                  { label: 'Total Paid', value: `${currency} ${totalPaid.toLocaleString()}`, icon: '✅', color: '#22c55e' },
                  { label: 'Total Expenses', value: `${currency} ${totalExpenses.toLocaleString()}`, icon: '📊', color: '#f97316' },
                  { label: 'Outstanding', value: `${currency} ${outstanding.toLocaleString()}`, icon: '⏳', color: outstanding > 0 ? '#ef4444' : '#22c55e' },
                ].map((card) => (
                  <div key={card.label} className="rounded-2xl p-5 border" style={{ backgroundColor: '#0d1f3c', borderColor: '#1e3a5f' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span>{card.icon}</span>
                      <p className="text-xs" style={{ color: '#4a6fa5' }}>{card.label}</p>
                    </div>
                    <p className="text-xl font-bold" style={{ color: card.color }}>{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Payments */}
              {activeProject.payments?.length > 0 && (
                <div className="rounded-2xl p-6 border" style={{ backgroundColor: '#0d1f3c', borderColor: '#1e3a5f' }}>
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full inline-block" style={{ backgroundColor: '#c9a84c' }}></span>
                    Payment History
                  </h3>
                  <div className="space-y-2">
                    {activeProject.payments.map((p, i) => (
                      <div key={i} className="flex justify-between items-center py-2.5 border-b" style={{ borderColor: '#1e3a5f' }}>
                        <div>
                          <p className="text-white text-sm">{p.note || 'Payment received'}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#4a6fa5' }}>
                            {new Date(p.receivedAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        <p className="font-bold text-sm" style={{ color: '#22c55e' }}>+{currency} {Number(p.amount).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expenses */}
              {activeProject.expenses?.length > 0 && (
                <div className="rounded-2xl p-6 border" style={{ backgroundColor: '#0d1f3c', borderColor: '#1e3a5f' }}>
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full inline-block" style={{ backgroundColor: '#c9a84c' }}></span>
                    Expenses Breakdown
                  </h3>
                  <div className="space-y-2">
                    {activeProject.expenses.map((e, i) => (
                      <div key={i} className="flex justify-between items-center py-2.5 border-b" style={{ borderColor: '#1e3a5f' }}>
                        <div>
                          <p className="text-white text-sm">{e.title}</p>
                          {e.category && <p className="text-xs mt-0.5" style={{ color: '#4a6fa5' }}>{e.category}</p>}
                        </div>
                        <p className="font-medium text-sm" style={{ color: '#f97316' }}>{currency} {Number(e.amount).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-3 mt-1">
                    <p className="text-sm font-semibold" style={{ color: '#c9a84c' }}>Total Expenses</p>
                    <p className="text-sm font-bold" style={{ color: '#c9a84c' }}>{currency} {totalExpenses.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {/* Team */}
              {activeProject.employees?.length > 0 && (
                <div className="rounded-2xl p-6 border" style={{ backgroundColor: '#0d1f3c', borderColor: '#1e3a5f' }}>
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full inline-block" style={{ backgroundColor: '#c9a84c' }}></span>
                    Project Team
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {activeProject.employees.map((pe, i) => {
                      const emp = pe.employee || pe
                      return (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#1e3a5f' }}>
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                            style={{ backgroundColor: '#0a1628', color: '#c9a84c' }}>
                            {emp.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{emp.name}</p>
                            <p className="text-xs" style={{ color: '#4a6fa5' }}>{emp.role}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Footer */}
      <div className="border-t mt-10 py-6 text-center" style={{ borderColor: '#1e3a5f' }}>
        <p className="text-xs" style={{ color: '#4a6fa5' }}>
          This portal is provided by <span style={{ color: '#c9a84c' }}>{companyName}</span> for your project updates.
        </p>
        {phone && <p className="text-xs mt-1" style={{ color: '#4a6fa5' }}>📞 {phone}</p>}
      </div>
    </div>
  )
}