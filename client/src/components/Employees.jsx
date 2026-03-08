import { useState, useEffect } from 'react'

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', role: '',
    department: '', salary: '', employmentType: 'monthly'
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchEmployees() }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:5000/employees')
      const data = await res.json()
      setEmployees(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      setEmployees([])
      setError('Could not connect to the server. Make sure your backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = employees.filter(emp => {
    const matchesSearch =
      emp.name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase()) ||
      emp.role?.toLowerCase().includes(search.toLowerCase()) ||
      emp.department?.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'all' || emp.employmentType === filterType
    return matchesSearch && matchesType
  })

  const handleSubmit = async () => {
    if (!form.name.trim()) return alert('Name is required.')
    try {
      if (editingId) {
        const res = await fetch(`http://localhost:5000/employees/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })
        if (!res.ok) throw new Error('Failed to update')
        setEditingId(null)
      } else {
        const res = await fetch('http://localhost:5000/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })
        if (!res.ok) throw new Error('Failed to create')
      }
      setForm({ name: '', email: '', phone: '', role: '', department: '', salary: '', employmentType: 'monthly' })
      setShowForm(false)
      fetchEmployees()
    } catch (err) {
      alert('Failed to save employee. Check your server.')
    }
  }

  const handleEdit = (emp) => {
    setForm({
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      role: emp.role || '',
      department: emp.department || '',
      salary: emp.salary || '',
      employmentType: emp.employmentType || 'monthly'
    })
    setEditingId(emp.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return
    try {
      const res = await fetch(`http://localhost:5000/employees/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      fetchEmployees()
    } catch {
      alert('Failed to delete employee. Check your server.')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ name: '', email: '', phone: '', role: '', department: '', salary: '', employmentType: 'monthly' })
  }

  // Summary stats
  const monthlyStaff = employees.filter(e => e.employmentType === 'monthly')
  const siteStaff = employees.filter(e => e.employmentType === 'site')
  const totalMonthlyCost = monthlyStaff.reduce((sum, e) => sum + (Number(e.salary) || 0), 0)

  const getSalaryLabel = (type) => type === 'monthly' ? 'Monthly Salary (KSh)' : 'Daily Rate (KSh)'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Employees</h3>
          <p className="text-zinc-500 text-sm">{filtered.length} of {employees.length} employees</p>
        </div>
        <button onClick={() => { showForm ? handleCancel() : setShowForm(true) }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
          {showForm ? 'Cancel' : '+ Add Employee'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={fetchEmployees} className="underline hover:text-red-300">Retry</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-zinc-500 text-sm">Total Staff</p>
          <p className="text-white text-2xl font-bold mt-1">{employees.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-zinc-500 text-sm">Office Staff</p>
          <p className="text-blue-400 text-2xl font-bold mt-1">{monthlyStaff.length}</p>
          <p className="text-zinc-600 text-xs mt-1">Monthly salary</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-zinc-500 text-sm">Site Staff</p>
          <p className="text-orange-400 text-2xl font-bold mt-1">{siteStaff.length}</p>
          <p className="text-zinc-600 text-xs mt-1">Daily rate</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-zinc-500 text-sm">Monthly Payroll Cost</p>
          <p className="text-green-400 text-2xl font-bold mt-1">KSh {totalMonthlyCost.toLocaleString()}</p>
          <p className="text-zinc-600 text-xs mt-1">Office staff only</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
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
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500">
          <option value="all">All Staff</option>
          <option value="monthly">Office Staff (Monthly)</option>
          <option value="site">Site Staff (Daily)</option>
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 grid grid-cols-2 gap-4">
          <h4 className="col-span-2 text-white font-semibold">
            {editingId ? 'Edit Employee' : 'Add New Employee'}
          </h4>

          {/* Employment Type toggle */}
          <div className="col-span-2">
            <p className="text-zinc-500 text-xs mb-2">Employment Type</p>
            <div className="flex gap-3">
              <button
                onClick={() => setForm({ ...form, employmentType: 'monthly' })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  form.employmentType === 'monthly'
                    ? 'bg-blue-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}>
                🏢 Office Staff (Monthly Salary)
              </button>
              <button
                onClick={() => setForm({ ...form, employmentType: 'site' })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  form.employmentType === 'site'
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}>
                🏗️ Site Staff (Daily Rate)
              </button>
            </div>
          </div>

          <input placeholder="Full Name *" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />

          <input placeholder="Email" type="email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />

          <input placeholder="Phone" value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />

          <input placeholder="Role (e.g. CEO, Accountant, Foreman)" value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />

          <input placeholder="Department (e.g. Office, Site)" value={form.department}
            onChange={e => setForm({ ...form, department: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />

          <input
            placeholder={getSalaryLabel(form.employmentType)}
            type="number" value={form.salary}
            onChange={e => setForm({ ...form, salary: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />

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

      {/* Employee Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-6 py-3 border-b border-zinc-800">
          <div className="col-span-3 text-zinc-500 text-xs font-semibold uppercase tracking-wider">Name</div>
          <div className="col-span-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider">Role</div>
          <div className="col-span-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider">Department</div>
          <div className="col-span-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider">Type</div>
          <div className="col-span-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider">Pay</div>
          <div className="col-span-1 text-zinc-500 text-xs font-semibold uppercase tracking-wider">Actions</div>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-zinc-600">Loading employees...</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-zinc-600">
            {search ? `No results for "${search}"` : 'No employees yet.'}
          </div>
        ) : filtered.map((emp) => (
          <div key={emp.id} className="grid grid-cols-12 gap-2 px-6 py-4 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors items-center">
            <div className="col-span-3 flex items-center gap-3 min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                emp.employmentType === 'monthly' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
              }`}>
                {emp.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white font-medium truncate">{emp.name}</p>
                <p className="text-zinc-500 text-xs truncate">{emp.phone || emp.email}</p>
              </div>
            </div>
            <div className="col-span-2">
              <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">{emp.role}</span>
            </div>
            <div className="col-span-2">
              <p className="text-zinc-400 text-sm">{emp.department}</p>
            </div>
            <div className="col-span-2">
              {emp.employmentType === 'monthly' ? (
                <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full font-medium">🏢 Monthly</span>
              ) : (
                <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded-full font-medium">🏗️ Site</span>
              )}
            </div>
            <div className="col-span-2">
              {emp.salary ? (
                <div>
                  <p className="text-green-400 font-medium text-sm">KSh {Number(emp.salary).toLocaleString()}</p>
                  <p className="text-zinc-600 text-xs">{emp.employmentType === 'monthly' ? 'per month' : 'per day'}</p>
                </div>
              ) : (
                <p className="text-zinc-600 text-sm">—</p>
              )}
            </div>
            <div className="col-span-1 flex gap-2">
              <button onClick={() => handleEdit(emp)}
                className="bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all">
                Edit
              </button>
              <button onClick={() => handleDelete(emp.id)}
                className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all">
                Del
              </button>
            </div>
          </div>
        ))}

        {/* Footer totals */}
        {filtered.length > 0 && filterType === 'monthly' && (
          <div className="px-6 py-3 border-t-2 border-zinc-700 bg-zinc-800/50 flex justify-between items-center">
            <p className="text-white font-bold text-sm">Total Monthly Payroll</p>
            <p className="text-green-400 font-bold text-sm">
              KSh {filtered.reduce((sum, e) => sum + (Number(e.salary) || 0), 0).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}