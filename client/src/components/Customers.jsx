import { useState, useEffect } from 'react'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchCustomers() }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:5000/customers')
      const data = await res.json()
      setCustomers(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      console.error('Failed to fetch customers:', err)
      setCustomers([])
      setError('Could not connect to the server. Make sure your backend is running.')
    } finally {
      setLoading(false)
    }
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
    } catch (err) {
      console.error('Failed to save customer:', err)
      alert('Failed to save customer. Check your server.')
    }
  }

  const handleEdit = (c) => {
    setForm({ name: c.name, email: c.email, phone: c.phone, address: c.address })
    setEditingId(c.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return
    try {
      await fetch(`http://localhost:5000/customers/${id}`, { method: 'DELETE' })
      fetchCustomers()
    } catch (err) {
      console.error('Failed to delete customer:', err)
      alert('Failed to delete customer. Check your server.')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ name: '', email: '', phone: '', address: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Customers</h3>
          <p className="text-zinc-500 text-sm">{filtered.length} of {customers.length} customers</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
          {showForm ? 'Cancel' : '+ Add Customer'}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={fetchCustomers} className="underline hover:text-red-300">Retry</button>
        </div>
      )}

      {/* Search Bar */}
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

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 grid grid-cols-2 gap-4">
          <h4 className="col-span-2 text-white font-semibold">
            {editingId ? 'Edit Customer' : 'Add New Customer'}
          </h4>
          {['name', 'email', 'phone', 'address'].map((field) => (
            <input key={field}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
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

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-800">
              {['Name', 'Email', 'Phone', 'Address', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-4 text-zinc-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="px-6 py-12 text-center text-zinc-600">Loading customers...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-12 text-center text-zinc-600">
                {search ? `No results for "${search}"` : 'No customers yet.'}
              </td></tr>
            ) : filtered.map((c) => (
              <tr key={c.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 text-sm font-bold">
                      {c.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-zinc-400">{c.email}</td>
                <td className="px-6 py-4 text-zinc-400">{c.phone}</td>
                <td className="px-6 py-4 text-zinc-400">{c.address}</td>
                <td className="px-6 py-4 flex gap-3">
                  <button onClick={() => handleEdit(c)}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(c.id)}
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