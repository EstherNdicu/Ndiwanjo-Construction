import { useState, useEffect } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Employees from './components/Employees'
import Customers from './components/Customers'
import Projects from './components/Projects'
import Inventory from './components/Inventory'
import Expenses from './components/Expenses'
import Reports from './components/Reports'

export default function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [user, setUser] = useState(localStorage.getItem('name'))
  const [stats, setStats] = useState({ employees: 0, customers: 0, projects: 0, inventory: 0 })

  useEffect(() => {
    const fetchStats = async () => {
      const [emp, cust, proj, inv] = await Promise.all([
        fetch('http://localhost:5000/employees').then(r => r.json()),
        fetch('http://localhost:5000/customers').then(r => r.json()),
        fetch('http://localhost:5000/projects').then(r => r.json()),
        fetch('http://localhost:5000/inventory').then(r => r.json()),
      ])
      setStats({ employees: emp.length, customers: cust.length, projects: proj.length, inventory: inv.length })
    }
    if (user) fetchStats()
  }, [user])

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
      default: return <Dashboard stats={stats} />
    }
  }

  if (!user) return <Login onLogin={(name) => setUser(name)} />

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      <div className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-xl">
              🏗️
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Ndiwanjo Construction</h1>
              <p className="text-xs text-zinc-500">Management System</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <p className="text-xs text-zinc-600 uppercase tracking-widest px-3 mb-3">Main Menu</p>
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActivePage(item.name)}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all text-sm font-medium ${
                activePage === item.name
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.name}</span>
              {activePage === item.name && (
                <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-800 mb-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user}</p>
              <p className="text-xs text-zinc-500">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-zinc-900 border-b border-zinc-800 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{activePage}</h2>
            <p className="text-xs text-zinc-500">Ndiwanjo Construction › {activePage}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-zinc-400">System Online</span>
          </div>
        </div>
        <div className="flex-1 p-8 overflow-auto">
          {renderPage()}
        </div>
      </div>
    </div>
  )
}