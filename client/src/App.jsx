import { useState } from 'react'

function App() {
  const [activePage, setActivePage] = useState('Dashboard')

  const menuItems = [
    { name: 'Dashboard', icon: '📊' },
    { name: 'Employees', icon: '👷' },
    { name: 'Customers', icon: '👥' },
    { name: 'Projects', icon: '🏗️' },
    { name: 'Inventory', icon: '📦' },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">Ndiwanjo Construction</h1>
          <p className="text-gray-400 text-sm">Management System</p>
        </div>
        <nav className="flex-1 p-4">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActivePage(item.name)}
              className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center gap-3 transition-colors ${
                activePage === item.name
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow px-8 py-4">
          <h2 className="text-2xl font-semibold text-gray-800">{activePage}</h2>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-500">Welcome to {activePage} module</p>
          </div>
        </div>
      </div>

    </div>
  )
}

export default App
