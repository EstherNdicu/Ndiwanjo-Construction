import { useState, useEffect } from 'react'

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: '', department: '', salary: '', type: 'permanent' })

  useEffect(() => { fetchEmployees() }, [])

  const fetchEmployees = async () => {
    try {
      const res = await fetch('http://localhost:5000/employees')
      const data = await res.json()
      setEmployees(Array.isArray(data) ? data : [])
    } catch (e) {
      setEmployees([])
    }
  }

  const tabs = [
    { key: 'all', label: 'All Employees', icon: '👥' },
    { key: 'permanent', label: 'Permanent', icon: '👷' },
    { key: 'foreman', label: 'Foremen', icon: '🦺' },
    { key: 'subcontractor', label: 'Subcontractors', icon: '🔧' },
  ]

  const filtered = employees.filter(emp => {
    const matchesSearch =
      emp.name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase()) ||
      emp.role?.toLowerCase().includes(search.toLowerCase()) ||
      emp.department?.toLowerCase().includes(search.toLowerCase())
    const matchesTab = activeTab === 'all' || emp.type === activeTab
    return matchesSearch && matchesTab
  })

  const handleSubmit = async () => {
    if (editingId) {
      await fetch(`http://localhost:5000/employees/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      setEditingId(null)
    } else {
      await fetch('http://localhost:5000/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
    }
    setForm({ name: '', email: '', phone: '', role: '', department: '', salary: '', type: 'permanent' })
    setShowForm(false)
    fetchEmployees()
  }

  const handleEdit = (emp) => {
    setForm({ name: emp.name, email: emp.email, phone: emp.phone, role: emp.role, department: emp.department, salary: emp.salary, type: emp.type })
    setEditingId(emp.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/employees/${id}`, { method: 'DELETE' })
    fetchEmployees()
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ name: '', email: '', phone: '', role: '', department: '', salary: '', type: 'permanent' })
  }

  const getTypeBadge = (type) => {
    switch (type) {
      case 'permanent': return 'bg-green-500/20 text-green-400'
      case 'foreman': return 'bg-blue-500/20 text-blue-400'
      case 'subcontractor': return 'bg-purple-500/20 text-purple-400'
      default: return 'bg-zinc-500/20 text-zinc-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Employees</h3>
          <p className="text-zinc-500 text-sm">{filtered.length} of {employees.length} employees</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
          {showForm ? 'Cancel' : '+ Add Employee'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {tabs.slice(1).map((tab) => (
          <div key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`bg-zinc-900 border rounded-xl p-4 cursor-pointer transition-all ${
              activeTab === tab.key ? 'border-orange-500' : 'border-zinc-800 hover:border-zinc-600'
            }`}>
            <div className="flex items-center gap-2 mb-2">
              <span>{tab.icon}</span>
              <p className="text-zinc-400 text-xs">{tab.label}</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {employees.filter(e => e.type === tab.key).length}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.key
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-500 hover:text-white'
            }`}>
            {tab.icon} {tab.label} ({employees.filter(e => tab.key === 'all' || e.type === tab.key).length})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-4 top-3 text-zinc-500">🔍</span>
        <input
          placeholder="Search by name, email, role or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-4 top-3 text-zinc-500 hover:text-white">✕</button>
        )}
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 grid grid-cols-2 gap-4">
          <h4 className="col-span-2 text-white font-semibold">
            {editingId ? 'Edit Employee' : 'Add New Employee'}
          </h4>
          {['name', 'email', 'phone', 'role', 'department'].map((field) => (
            <input key={field}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          ))}
          <input
            placeholder="Salary (KSh)"
            value={form.salary}
            onChange={(e) => setForm({ ...form, salary: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="permanent">Permanent Employee</option>
            <option value="foreman">Foreman</option>
            <option value="subcontractor">Subcontractor</option>
          </select>
          <div className="col-span-2 flex gap-3">
            <button onClick={handleSubmit}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              {editingId ? 'Update Employee' : 'Save Employee'}
            </button>
            <button onClick={handleCancel}
              className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-800">
              {['Name', 'Email', 'Phone', 'Role', 'Department', 'Type', 'Salary', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-4 text-zinc-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="8" className="px-6 py-12 text-center text-zinc-600">
                {search ? `No results for "${search}"` : `No ${activeTab === 'all' ? 'employees' : activeTab + 's'} yet.`}
              </td></tr>
            ) : filtered.map((emp) => (
              <tr key={emp.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 text-sm font-bold">
                      {emp.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-medium">{emp.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-zinc-400">{emp.email}</td>
                <td className="px-6 py-4 text-zinc-400">{emp.phone}</td>
                <td className="px-6 py-4">
                  <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">{emp.role}</span>
                </td>
                <td className="px-6 py-4 text-zinc-400">{emp.department}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeBadge(emp.type)}`}>
                    {emp.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-green-400 font-medium">KSh {Number(emp.salary).toLocaleString()}</td>
                <td className="px-6 py-4 flex gap-3">
                  <button onClick={() => handleEdit(emp)}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(emp.id)}
                    className="text-red-500 hover:text-red-400 text-sm font-medium transition-colors">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}