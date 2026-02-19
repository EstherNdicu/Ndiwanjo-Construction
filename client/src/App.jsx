import { useState, useEffect } from 'react'

function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleLogin = async () => {
    const res = await fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (res.ok) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('name', data.name)
      onLogin(data.name)
    } else {
      setError(data.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Ndiwanjo Construction</h1>
        <p className="text-gray-500 mb-8">Sign in to your account</p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
        >
          Sign In
        </button>
      </div>
    </div>
  )
}

function Dashboard({ stats }) {
  const cards = [
    { label: 'Total Employees', value: stats.employees, icon: '👷', color: 'bg-blue-500' },
    { label: 'Total Customers', value: stats.customers, icon: '👥', color: 'bg-green-500' },
    { label: 'Active Projects', value: stats.projects, icon: '🏗️', color: 'bg-yellow-500' },
    { label: 'Inventory Items', value: stats.inventory, icon: '📦', color: 'bg-purple-500' },
  ]

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
            <div className={`${card.color} text-white text-3xl rounded-full w-14 h-14 flex items-center justify-center`}>
              {card.icon}
            </div>
            <div>
              <p className="text-gray-500 text-sm">{card.label}</p>
              <p className="text-3xl font-bold text-gray-800">{card.value}</p>
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
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: '', department: '', salary: '' })

  useEffect(() => { fetchEmployees() }, [])

  const fetchEmployees = async () => {
    const res = await fetch('http://localhost:5000/employees')
    setEmployees(await res.json())
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
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {showForm ? 'Cancel' : '+ Add Employee'}
        </button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-2 gap-4">
          {['name', 'email', 'phone', 'role', 'department', 'salary'].map((field) => (
            <input key={field} placeholder={field.charAt(0).toUpperCase() + field.slice(1)} value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          ))}
          <div className="col-span-2">
            <button onClick={handleSubmit} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Save Employee</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>{['Name', 'Email', 'Phone', 'Role', 'Department', 'Salary', 'Action'].map((h) => (
              <th key={h} className="px-6 py-3 text-gray-600 text-sm font-semibold">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-400">No employees yet.</td></tr>
            ) : employees.map((emp) => (
              <tr key={emp.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{emp.name}</td>
                <td className="px-6 py-4">{emp.email}</td>
                <td className="px-6 py-4">{emp.phone}</td>
                <td className="px-6 py-4">{emp.role}</td>
                <td className="px-6 py-4">{emp.department}</td>
                <td className="px-6 py-4">${emp.salary}</td>
                <td className="px-6 py-4"><button onClick={() => handleDelete(emp.id)} className="text-red-500 hover:text-red-700">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Customers() {
  const [customers, setCustomers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' })

  useEffect(() => { fetchCustomers() }, [])

  const fetchCustomers = async () => {
    const res = await fetch('http://localhost:5000/customers')
    setCustomers(await res.json())
  }

  const handleSubmit = async () => {
    await fetch('http://localhost:5000/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setForm({ name: '', email: '', phone: '', address: '' })
    setShowForm(false)
    fetchCustomers()
  }

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/customers/${id}`, { method: 'DELETE' })
    fetchCustomers()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">All Customers</h3>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {showForm ? 'Cancel' : '+ Add Customer'}
        </button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-2 gap-4">
          {['name', 'email', 'phone', 'address'].map((field) => (
            <input key={field} placeholder={field.charAt(0).toUpperCase() + field.slice(1)} value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          ))}
          <div className="col-span-2">
            <button onClick={handleSubmit} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Save Customer</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>{['Name', 'Email', 'Phone', 'Address', 'Action'].map((h) => (
              <th key={h} className="px-6 py-3 text-gray-600 text-sm font-semibold">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No customers yet.</td></tr>
            ) : customers.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{c.name}</td>
                <td className="px-6 py-4">{c.email}</td>
                <td className="px-6 py-4">{c.phone}</td>
                <td className="px-6 py-4">{c.address}</td>
                <td className="px-6 py-4"><button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Projects() {
  const [projects, setProjects] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', status: 'pending', startDate: '', endDate: '' })

  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    const res = await fetch('http://localhost:5000/projects')
    setProjects(await res.json())
  }

  const handleSubmit = async () => {
    await fetch('http://localhost:5000/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setForm({ name: '', description: '', status: 'pending', startDate: '', endDate: '' })
    setShowForm(false)
    fetchProjects()
  }

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/projects/${id}`, { method: 'DELETE' })
    fetchProjects()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">All Projects</h3>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {showForm ? 'Cancel' : '+ Add Project'}
        </button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-2 gap-4">
          <input placeholder="Project Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
          <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="col-span-2">
            <button onClick={handleSubmit} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Save Project</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>{['Name', 'Description', 'Status', 'Start Date', 'End Date', 'Action'].map((h) => (
              <th key={h} className="px-6 py-3 text-gray-600 text-sm font-semibold">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No projects yet.</td></tr>
            ) : projects.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{p.name}</td>
                <td className="px-6 py-4">{p.description}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'completed' ? 'bg-green-100 text-green-700' : p.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-4">{p.startDate ? new Date(p.startDate).toLocaleDateString() : '-'}</td>
                <td className="px-6 py-4">{p.endDate ? new Date(p.endDate).toLocaleDateString() : '-'}</td>
                <td className="px-6 py-4"><button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Inventory() {
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', quantity: '', unit: '', price: '' })

  useEffect(() => { fetchItems() }, [])

  const fetchItems = async () => {
    const res = await fetch('http://localhost:5000/inventory')
    setItems(await res.json())
  }

  const handleSubmit = async () => {
    await fetch('http://localhost:5000/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setForm({ name: '', quantity: '', unit: '', price: '' })
    setShowForm(false)
    fetchItems()
  }

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/inventory/${id}`, { method: 'DELETE' })
    fetchItems()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Inventory Items</h3>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {showForm ? 'Cancel' : '+ Add Item'}
        </button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-2 gap-4">
          {['name', 'quantity', 'unit', 'price'].map((field) => (
            <input key={field} placeholder={field.charAt(0).toUpperCase() + field.slice(1)} value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          ))}
          <div className="col-span-2">
            <button onClick={handleSubmit} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Save Item</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>{['Name', 'Quantity', 'Unit', 'Price', 'Action'].map((h) => (
              <th key={h} className="px-6 py-3 text-gray-600 text-sm font-semibold">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No items yet.</td></tr>
            ) : items.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{item.name}</td>
                <td className="px-6 py-4">{item.quantity}</td>
                <td className="px-6 py-4">{item.unit}</td>
                <td className="px-6 py-4">${item.price}</td>
                <td className="px-6 py-4"><button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function App() {
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

export default App
