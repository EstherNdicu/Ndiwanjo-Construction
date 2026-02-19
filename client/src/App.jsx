import { useState, useEffect } from 'react'

function Dashboard() {
  const stats = [
    { label: 'Total Employees', value: '0', icon: '👷', color: 'bg-blue-500' },
    { label: 'Total Customers', value: '0', icon: '👥', color: 'bg-green-500' },
    { label: 'Active Projects', value: '0', icon: '🏗️', color: 'bg-yellow-500' },
    { label: 'Inventory Items', value: '0', icon: '📦', color: 'bg-purple-500' },
  ]

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
            <div className={`${stat.color} text-white text-3xl rounded-full w-14 h-14 flex items-center justify-center`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-gray-500 text-sm">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Welcome 👋</h3>
        <p className="text-gray-500">Use the sidebar to navigate between modules.</p>
      </div>
    </div>
  )
}

function Employees() {
  const [employees, setEmployees] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', role: '', department: '', salary: ''
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    const res = await fetch('http://localhost:5000/employees')
    const data = await res.json()
    setEmployees(data)
  }

  const handleSubmit = async () => {
    await fetch('http://localhost:5000/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setForm({ name: '', email: '', phone: '', role: '', department: '', salary: '' })
    setShowForm(false)
    fetchEmployees()
  }

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/employees/${id}`, { method: 'DELETE' })
    fetchEmployees()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">All Employees</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Employee'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-2 gap-4">
          {['name', 'email', 'phone', 'role', 'department', 'salary'].map((field) => (
            <input
              key={field}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ))}
          <div className="col-span-2">
            <button
              onClick={handleSubmit}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Save Employee
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Name', 'Email', 'Phone', 'Role', 'Department', 'Salary', 'Action'].map((h) => (
                <th key={h} className="px-6 py-3 text-gray-600 text-sm font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-400">No employees yet. Add one above.</td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{emp.name}</td>
                  <td className="px-6 py-4">{emp.email}</td>
                  <td className="px-6 py-4">{emp.phone}</td>
                  <td className="px-6 py-4">{emp.role}</td>
                  <td className="px-6 py-4">{emp.department}</td>
                  <td className="px-6 py-4">${emp.salary}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Customers() {
  return <div className="bg-white rounded-xl shadow p-6"><p className="text-gray-500">Customers module coming soon...</p></div>
}

function Projects() {
  return <div className="bg-white rounded-xl shadow p-6"><p className="text-gray-500">Projects module coming soon...</p></div>
}

function Inventory() {
  return <div className="bg-white rounded-xl shadow p-6"><p className="text-gray-500">Inventory module coming soon...</p></div>
}

function App() {
  const [activePage, setActivePage] = useState('Dashboard')

  const menuItems = [
    { name: 'Dashboard', icon: '📊' },
    { name: 'Employees', icon: '👷' },
    { name: 'Customers', icon: '👥' },
    { name: 'Projects', icon: '🏗️' },
    { name: 'Inventory', icon: '📦' },
  ]

  const renderPage = () => {
    switch (activePage) {
      case 'Dashboard': return <Dashboard />
      case 'Employees': return <Employees />
      case 'Customers': return <Customers />
      case 'Projects': return <Projects />
      case 'Inventory': return <Inventory />
      default: return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
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

export default App
