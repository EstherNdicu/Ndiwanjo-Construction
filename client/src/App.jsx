import { useState, useEffect } from 'react'
import Login from './components/Login'
import NotificationBell from './components/NotificationBell'
import Dashboard from './components/Dashboard'
import Employees from './components/Employees'
import Customers from './components/Customers'
import Projects from './components/Projects'
import Inventory from './components/Inventory'
import Expenses from './components/Expenses'
import Reports from './components/Reports'
import Payroll from './components/Payroll'
import Settings from './components/settings'

export default function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [user, setUser] = useState(localStorage.getItem('name'))
  const [stats, setStats] = useState({ employees: 0, customers: 0, projects: 0, inventory: 0 })

  // Load settings for company name/logo
  const [siteSettings, setSiteSettings] = useState(() => {
    try {
      const s = localStorage.getItem('ndiwanjo_settings')
      return s ? JSON.parse(s) : {}
    } catch { return {} }
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [emp, cust, proj, inv] = await Promise.all([
          fetch('http://localhost:5000/employees').then(r => r.json()),
          fetch('http://localhost:5000/customers').then(r => r.json()),
          fetch('http://localhost:5000/projects').then(r => r.json()),
          fetch('http://localhost:5000/inventory').then(r => r.json()),
        ])
        setStats({ employees: emp.length, customers: cust.length, projects: proj.length, inventory: inv.length })
      } catch {}
    }
    if (user) fetchStats()
  }, [user])

  // Refresh settings when coming back to app
  useEffect(() => {
    const handleStorage = () => {
      try {
        const s = localStorage.getItem('ndiwanjo_settings')
        if (s) setSiteSettings(JSON.parse(s))
      } catch {}
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('name')
    setUser(null)
  }

  const menuItems = [
    { name: 'Dashboard', icon: '📊' },
    { name: 'Employees', icon: '👷' },
    { name: 'Customers', icon: '👥' },
    { name: 'Projects', icon: '🏗️' },
    { name: 'Inventory', icon: '📦' },
    { name: 'Expenses', icon: '💰' },
    { name: 'Reports', icon: '📈' },
    { name: 'Payroll', icon: '💵' },
    { name: 'Settings', icon: '⚙️' },
  ]

  const renderPage = () => {
    switch (activePage) {
      case 'Dashboard': return <Dashboard stats={stats} />
      case 'Employees': return <Employees />
      case 'Customers': return <Customers />
      case 'Projects': return <Projects />
      case 'Inventory': return <Inventory />
      case 'Expenses': return <Expenses />
      case 'Reports': return <Reports />
      case 'Payroll': return <Payroll />
      case 'Settings': return <Settings />
      default: return <Dashboard stats={stats} />
    }
  }

  if (!user) return <Login onLogin={(name) => setUser(name)} />

  const companyName = siteSettings.companyName || 'Ndiwanjo Construction'
  const tagline = siteSettings.tagline || 'Management System'
  const logo = siteSettings.logo || null

  return (
    <div className="flex h-screen text-white" style={{ backgroundColor: '#060f1e' }}>

      {/* Sidebar */}
      <div className="w-72 flex flex-col border-r" style={{ backgroundColor: '#0a1628', borderColor: '#1e3a5f' }}>

        {/* Logo area */}
        <div className="p-5 border-b" style={{ borderColor: '#1e3a5f' }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ backgroundColor: '#1e3a5f', border: '1px solid #c9a84c' }}>
              {logo ? (
                <img src={logo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xl">🏗️</span>
              )}
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">{companyName}</h1>
              <p className="text-xs" style={{ color: '#c9a84c' }}>{tagline}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
          <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-3" style={{ color: '#4a6fa5' }}>Main Menu</p>
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActivePage(item.name)}
              className="w-full text-left px-4 py-2.5 rounded-lg flex items-center gap-3 transition-all text-sm font-medium"
              style={activePage === item.name ? {
                background: 'linear-gradient(135deg, #c9a84c, #a8883a)',
                color: '#fff',
                boxShadow: '0 4px 15px rgba(201, 168, 76, 0.3)'
              } : {
                color: '#8a9bb5',
              }}
              onMouseEnter={e => {
                if (activePage !== item.name) {
                  e.currentTarget.style.backgroundColor = '#1e3a5f'
                  e.currentTarget.style.color = '#fff'
                }
              }}
              onMouseLeave={e => {
                if (activePage !== item.name) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#8a9bb5'
                }
              }}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.name}</span>
              {activePage === item.name && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#fff' }}></span>
              )}
            </button>
          ))}
        </nav>

        {/* User area */}
        <div className="p-4 border-t" style={{ borderColor: '#1e3a5f' }}>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-2" style={{ backgroundColor: '#1e3a5f' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #c9a84c, #a8883a)', color: '#fff' }}>
              {user?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user}</p>
              <p className="text-xs" style={{ color: '#c9a84c' }}>Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2"
            style={{ color: '#6b7280' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = '#1e3a5f' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="px-8 py-4 flex items-center justify-between border-b flex-shrink-0"
          style={{ backgroundColor: '#0a1628', borderColor: '#1e3a5f' }}>
          <div>
            <h2 className="text-xl font-bold text-white">{activePage}</h2>
            <p className="text-xs" style={{ color: '#4a6fa5' }}>{companyName} › {activePage}</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-xs" style={{ color: '#4a6fa5' }}>System Online</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 p-8 overflow-auto">
          {renderPage()}
        </div>
      </div>
    </div>
  )
}