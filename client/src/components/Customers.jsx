import { useState, useEffect } from 'react'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  useEffect(() => {
    fetchCustomers()
    fetchProjects()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const res = await fetch(`http://localhost:5000/customers?t=${Date.now()}`, { cache: 'no-store' })
      const data = await res.json()
      setCustomers(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      setCustomers([])
      setError('Could not connect to the server. Make sure your backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const res = await fetch(`http://localhost:5000/projects?t=${Date.now()}`, { cache: 'no-store' })
      const data = await res.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch {}
  }

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase()) ||
    c.address?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async () => {
    if (!form.name.trim()) return alert('Name is required.')
    try {
      if (editingId) {
        await fetch(`http://localhost:5000/customers/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })
        setEditingId(null)
      } else {
        await fetch('http://localhost:5000/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })
      }
      setForm({ name: '', email: '', phone: '', address: '' })
      setShowForm(false)
      fetchCustomers()
    } catch {
      alert('Failed to save customer. Check your server.')
    }
  }

  const handleEdit = (c) => {
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '' })
    setEditingId(c.id)
    setShowForm(true)
    setSelectedCustomer(null)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return
    try {
      await fetch(`http://localhost:5000/customers/${id}`, { method: 'DELETE' })
      if (selectedCustomer?.id === id) setSelectedCustomer(null)
      fetchCustomers()
    } catch {
      alert('Failed to delete customer. Check your server.')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ name: '', email: '', phone: '', address: '' })
  }

  // Get projects for a specific customer
  const getCustomerProjects = (customerId) =>
    projects.filter(p => p.customerId === customerId)

  // Get financial summary for a customer
  const getCustomerFinancials = (customerId) => {
    const cProjects = getCustomerProjects(customerId)
    const totalQuotation = cProjects.reduce((sum, p) => sum + (Number(p.quotation) || 0), 0)
    const totalEarned = cProjects.reduce((sum, p) =>
      sum + (p.payments || []).reduce((s, pay) => s + (Number(pay.amount) || 0), 0), 0)
    const totalOutstanding = totalQuotation - totalEarned
    return { totalQuotation, totalEarned, totalOutstanding: totalOutstanding > 0 ? totalOutstanding : 0 }
  }

  // If viewing a customer detail
  if (selectedCustomer) {
    const customerProjects = getCustomerProjects(selectedCustomer.id)
    const { totalQuotation, totalEarned, totalOutstanding } = getCustomerFinancials(selectedCustomer.id)

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <button onClick={() => setSelectedCustomer(null)}
            className="text-zinc-400 hover:text-white text-sm mb-4 flex items-center gap-1">
            ← Back to Customers
          </button>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400 text-2xl font-bold">
                {selectedCustomer.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedCustomer.name}</h3>
                <p className="text-zinc-500 text-sm mt-0.5">{selectedCustomer.email || 'No email'}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleEdit(selectedCustomer)}
                className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                ✏️ Edit
              </button>
              <button onClick={() => handleDelete(selectedCustomer.id)}
                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-medium">
                🗑 Delete
              </button>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 grid grid-cols-3 gap-4">
          <div>
            <p className="text-zinc-500 text-xs mb-1">Phone</p>
            <p className="text-white">{selectedCustomer.phone || '—'}</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs mb-1">Email</p>
            <p className="text-white">{selectedCustomer.email || '—'}</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs mb-1">Address</p>
            <p className="text-white">{selectedCustomer.address || '—'}</p>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-sm">Total Contract Value</p>
            <p className="text-white text-2xl font-bold mt-1">
              {totalQuotation ? `KSh ${totalQuotation.toLocaleString()}` : '—'}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-sm">Total Paid</p>
            <p className="text-green-400 text-2xl font-bold mt-1">KSh {totalEarned.toLocaleString()}</p>
          </div>
          <div className={`border rounded-xl p-5 ${totalOutstanding > 0 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-zinc-900 border-zinc-800'}`}>
            <p className="text-zinc-500 text-sm">Outstanding Balance</p>
            <p className={`text-2xl font-bold mt-1 ${totalOutstanding > 0 ? 'text-orange-400' : 'text-zinc-400'}`}>
              KSh {totalOutstanding.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Projects */}
        <div>
          <h4 className="text-white font-semibold mb-3">
            Projects ({customerProjects.length})
          </h4>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {customerProjects.length === 0 ? (
              <div className="px-6 py-12 text-center text-zinc-600">
                No projects linked to this customer yet.
                <p className="text-xs mt-2 text-zinc-700">When creating or editing a project, select this customer in the Customer field.</p>
              </div>
            ) : customerProjects.map((p) => {
              const earned = (p.payments || []).reduce((s, pay) => s + (Number(pay.amount) || 0), 0)
              const outstanding = (Number(p.quotation) || 0) - earned
              return (
                <div key={p.id} className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 hover:bg-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">🏗️</div>
                    <div>
                      <p className="text-white font-medium">{p.name}</p>
                      <p className="text-zinc-500 text-xs">{p.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-zinc-500 text-xs">Quotation</p>
                      <p className="text-white text-sm font-medium">
                        {p.quotation ? `KSh ${Number(p.quotation).toLocaleString()}` : '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-zinc-500 text-xs">Paid</p>
                      <p className="text-green-400 text-sm font-medium">KSh {earned.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-zinc-500 text-xs">Outstanding</p>
                      <p className={`text-sm font-medium ${outstanding > 0 ? 'text-orange-400' : 'text-zinc-400'}`}>
                        KSh {outstanding > 0 ? outstanding.toLocaleString() : '0'}
                      </p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      p.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      p.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>{p.status}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Customers</h3>
          <p className="text-zinc-500 text-sm">{filtered.length} of {customers.length} customers</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', email: '', phone: '', address: '' }) }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
          {showForm && !editingId ? 'Cancel' : '+ Add Customer'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={fetchCustomers} className="underline hover:text-red-300">Retry</button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <span className="absolute left-4 top-3 text-zinc-500">🔍</span>
        <input
          placeholder="Search by name, email, phone or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-4 top-3 text-zinc-500 hover:text-white">✕</button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 grid grid-cols-2 gap-4">
          <h4 className="col-span-2 text-white font-semibold">
            {editingId ? 'Edit Customer' : 'Add New Customer'}
          </h4>
          {[
            { field: 'name', placeholder: 'Full Name *' },
            { field: 'email', placeholder: 'Email Address' },
            { field: 'phone', placeholder: 'Phone Number' },
            { field: 'address', placeholder: 'Address' },
          ].map(({ field, placeholder }) => (
            <input key={field}
              placeholder={placeholder}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          ))}
          <div className="col-span-2 flex gap-3">
            <button onClick={handleSubmit}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              {editingId ? 'Update Customer' : 'Save Customer'}
            </button>
            <button onClick={handleCancel}
              className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Customer Cards */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-800">
              {['Customer', 'Email', 'Phone', 'Address', 'Projects', 'Total Value', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-4 text-zinc-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="px-6 py-12 text-center text-zinc-600">Loading customers...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="7" className="px-6 py-12 text-center text-zinc-600">
                {search ? `No results for "${search}"` : 'No customers yet. Add your first customer!'}
              </td></tr>
            ) : filtered.map((c) => {
              const cProjects = getCustomerProjects(c.id)
              const { totalQuotation } = getCustomerFinancials(c.id)
              return (
                <tr key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 text-sm font-bold">
                        {c.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">{c.email || '—'}</td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">{c.phone || '—'}</td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">{c.address || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full font-medium">
                      {cProjects.length} project{cProjects.length !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white font-medium text-sm">
                    {totalQuotation ? `KSh ${totalQuotation.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-3">
                      <button onClick={() => handleEdit(c)}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(c.id)}
                        className="text-red-500 hover:text-red-400 text-sm font-medium transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}