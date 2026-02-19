import { useState, useEffect } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Employees from './components/Employees'
import Customers from './components/Customers'
import Projects from './components/Projects'
import Inventory from './components/Inventory'

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
  ]

  const renderPage = () => {
    switch (activePage) {
      case 'Dashboard': return <Dashboard stats={stats} />
      case 'Employees': return <Employees />
      case 'Customers': return <Customers />
      case 'Projects': return <Projects />
      case 'Inventory': return <Inventory />
      default: return <Dashboard stats={stats} />
    }
  }

  if (!user) return <Login onLogin={(name) => setUser(name)} />

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">Ndiwanjo Construction</h1>
          <p className="text-gray-400 text-sm">Management System</p>
        </div>
        <nav className="flex-1 p-4">
          {menuItems.map((item) => (
            <button key={item.name} onClick={() => setActivePage(item.name)}
              className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center gap-3 transition-colors ${
                activePage === item.name ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}>
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Logged in as {user}</p>
          <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-gray-700">
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white shadow px-8 py-4">
          <h2 className="text-2xl font-semibold text-gray-800">{activePage}</h2>
        </div>
        <div className="flex-1 p-8 overflow-auto">
          {renderPage()}
        </div>
      </div>
    </div>
  )
}