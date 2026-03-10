import { useState, useEffect, useRef } from 'react'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ndiwanjo_dismissed') || '[]') } catch { return [] }
  })
  const dropdownRef = useRef()

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchNotifications = async () => {
    try {
      const [projects, inventory, employees, monthlyPayrolls] = await Promise.all([
        fetch('http://localhost:5000/projects').then(r => r.json()),
        fetch('http://localhost:5000/inventory').then(r => r.json()),
        fetch('http://localhost:5000/employees').then(r => r.json()),
        fetch('http://localhost:5000/payroll/monthly').then(r => r.json()),
      ])

      const today = new Date()
      const thisMonth = today.getMonth() + 1
      const thisYear = today.getFullYear()
      const notifs = []

      // Overdue projects
      if (Array.isArray(projects)) {
        projects.forEach(p => {
          if (!p.endDate || p.status === 'completed') return
          const end = new Date(p.endDate)
          const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
          if (daysLeft < 0) {
            notifs.push({
              id: `overdue-${p.id}`,
              type: 'danger',
              icon: '🚨',
              title: 'Overdue Project',
              message: `${p.name} is ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} past its deadline.`,
              time: p.endDate,
            })
          } else if (daysLeft <= 14) {
            notifs.push({
              id: `deadline-${p.id}`,
              type: 'warning',
              icon: '⚠️',
              title: 'Deadline Approaching',
              message: `${p.name} is due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`,
              time: p.endDate,
            })
          }
        })

        // Outstanding customer payments
        projects.forEach(p => {
          const earned = (p.payments || []).reduce((s, pay) => s + (Number(pay.amount) || 0), 0)
          const outstanding = (Number(p.quotation) || 0) - earned
          if (outstanding > 0 && p.quotation) {
            notifs.push({
              id: `outstanding-${p.id}`,
              type: 'info',
              icon: '💰',
              title: 'Outstanding Payment',
              message: `${p.name} has KSh ${outstanding.toLocaleString()} outstanding.`,
              time: null,
            })
          }
        })
      }

      // Low stock inventory
      if (Array.isArray(inventory)) {
        inventory.forEach(item => {
          if (Number(item.quantity) < 10) {
            notifs.push({
              id: `stock-${item.id}`,
              type: 'warning',
              icon: '📦',
              title: 'Low Stock',
              message: `${item.name} has only ${item.quantity} ${item.unit || 'units'} left.`,
              time: null,
            })
          }
        })
      }

      // Unpaid office staff this month
      if (Array.isArray(employees) && Array.isArray(monthlyPayrolls)) {
        const paidThisMonth = monthlyPayrolls.filter(p => p.month === thisMonth && p.year === thisYear)
        employees
          .filter(e => e.employmentType === 'monthly')
          .forEach(e => {
            if (!paidThisMonth.find(p => p.employeeId === e.id)) {
              notifs.push({
                id: `unpaid-${e.id}`,
                type: 'danger',
                icon: '👤',
                title: 'Unpaid Staff',
                message: `${e.name} (${e.role}) has not been paid this month.`,
                time: null,
              })
            }
          })
      }

      setNotifications(notifs)
    } catch (err) {
      console.error('Failed to fetch notifications', err)
    }
  }

  const dismiss = (id) => {
    const updated = [...dismissed, id]
    setDismissed(updated)
    localStorage.setItem('ndiwanjo_dismissed', JSON.stringify(updated))
  }

  const dismissAll = () => {
    const allIds = visible.map(n => n.id)
    const updated = [...dismissed, ...allIds]
    setDismissed(updated)
    localStorage.setItem('ndiwanjo_dismissed', JSON.stringify(updated))
    setOpen(false)
  }

  const clearDismissed = () => {
    setDismissed([])
    localStorage.removeItem('ndiwanjo_dismissed')
  }

  const visible = notifications.filter(n => !dismissed.includes(n.id))
  const count = visible.length

  const typeStyles = {
    danger: { bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-500', text: 'text-red-400' },
    warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', dot: 'bg-yellow-400', text: 'text-yellow-400' },
    info: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-400', text: 'text-blue-400' },
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications() }}
        className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
        style={{ backgroundColor: open ? '#1e3a5f' : 'transparent', border: '1px solid #1e3a5f' }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1e3a5f'}
        onMouseLeave={e => { if (!open) e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        <span className="text-lg">🔔</span>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
            style={{ backgroundColor: '#c9a84c' }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-96 rounded-2xl shadow-2xl z-50 overflow-hidden"
          style={{ backgroundColor: '#0a1628', border: '1px solid #1e3a5f' }}>

          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: '#1e3a5f' }}>
            <div>
              <h4 className="text-white font-semibold">Notifications</h4>
              <p className="text-xs mt-0.5" style={{ color: '#4a6fa5' }}>
                {count > 0 ? `${count} unread alert${count !== 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            <div className="flex gap-2">
              {dismissed.length > 0 && (
                <button onClick={clearDismissed}
                  className="text-xs px-2 py-1 rounded-lg transition-colors"
                  style={{ color: '#4a6fa5', backgroundColor: '#1e3a5f' }}>
                  Restore all
                </button>
              )}
              {count > 0 && (
                <button onClick={dismissAll}
                  className="text-xs px-2 py-1 rounded-lg transition-colors"
                  style={{ color: '#c9a84c', backgroundColor: '#1e3a5f' }}>
                  Dismiss all
                </button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {visible.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-white font-medium">All clear!</p>
                <p className="text-xs mt-1" style={{ color: '#4a6fa5' }}>No pending alerts right now.</p>
              </div>
            ) : (
              <div>
                {/* Group by type */}
                {['danger', 'warning', 'info'].map(type => {
                  const group = visible.filter(n => n.type === type)
                  if (group.length === 0) return null
                  const labels = { danger: '🔴 Urgent', warning: '🟡 Attention Needed', info: '🔵 Info' }
                  return (
                    <div key={type}>
                      <p className="px-5 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider"
                        style={{ color: '#4a6fa5' }}>{labels[type]}</p>
                      {group.map(n => {
                        const s = typeStyles[n.type]
                        return (
                          <div key={n.id}
                            className={`mx-3 mb-2 rounded-xl p-3 border flex items-start gap-3 ${s.bg} ${s.border}`}>
                            <span className="text-lg flex-shrink-0 mt-0.5">{n.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold ${s.text}`}>{n.title}</p>
                              <p className="text-zinc-300 text-xs mt-0.5 leading-relaxed">{n.message}</p>
                            </div>
                            <button
                              onClick={() => dismiss(n.id)}
                              className="text-zinc-600 hover:text-zinc-300 text-lg leading-none flex-shrink-0 mt-0.5 transition-colors">
                              ×
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t text-center" style={{ borderColor: '#1e3a5f' }}>
            <p className="text-xs" style={{ color: '#4a6fa5' }}>
              Dismissed alerts reappear when you reopen — they clear automatically when issues are resolved.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}