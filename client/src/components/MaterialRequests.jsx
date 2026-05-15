import { useState, useEffect } from 'react'

export default function MaterialRequests() {
  const [requests, setRequests] = useState([])
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    material: '', quantity: '', unit: '', projectId: '',
    supplier: '', dateNeeded: '', status: 'pending',
    notes: '', requestedBy: '', cost: ''
  })

  useEffect(() => {
    fetchRequests()
    fetchProjects()
  }, [])

  const fetchRequests = async () => {
    try {
      const res = await fetch('http://localhost:5000/material-requests')
      const data = await res.json()
      setRequests(Array.isArray(data) ? data : [])
    } catch (e) { setRequests([]) }
  }

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:5000/projects')
      const data = await res.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch (e) { setProjects([]) }
  }

  const filtered = requests.filter(r => {
    const matchesSearch =
      r.material?.toLowerCase().includes(search.toLowerCase()) ||
      r.supplier?.toLowerCase().includes(search.toLowerCase()) ||
      r.requestedBy?.toLowerCase().includes(search.toLowerCase()) ||
      r.project?.name?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleSubmit = async () => {
    const payload = {
      ...form,
      quantity: parseInt(form.quantity),
      cost: form.cost ? parseFloat(form.cost) : null,
      projectId: parseInt(form.projectId),
      dateNeeded: form.dateNeeded ? form.dateNeeded : null
    }
    if (editingId) {
      await fetch(`http://localhost:5000/material-requests/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      setEditingId(null)
    } else {
      await fetch('http://localhost:5000/material-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    }
    setForm({ material: '', quantity: '', unit: '', projectId: '', supplier: '', dateNeeded: '', status: 'pending', notes: '', requestedBy: '', cost: '' })
    setShowForm(false)
    fetchRequests()
  }

  const handleEdit = (r) => {
    setForm({
      material: r.material, quantity: r.quantity, unit: r.unit || '',
      projectId: r.projectId, supplier: r.supplier || '',
      dateNeeded: r.dateNeeded ? new Date(r.dateNeeded).toISOString().split('T')[0] : '',
      status: r.status, notes: r.notes || '', requestedBy: r.requestedBy || '',
      cost: r.cost || ''
    })
    setEditingId(r.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/material-requests/${id}`, { method: 'DELETE' })
    fetchRequests()
  }

  const handleStatusChange = async (id, status) => {
    await fetch(`http://localhost:5000/material-requests/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    fetchRequests()
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ material: '', quantity: '', unit: '', projectId: '', supplier: '', dateNeeded: '', status: 'pending', notes: '', requestedBy: '', cost: '' })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400'
      case 'approved': return 'bg-blue-500/20 text-blue-400'
      case 'delivered': return 'bg-green-500/20 text-green-400'
      case 'rejected': return 'bg-red-500/20 text-red-400'
      default: return 'bg-zinc-500/20 text-zinc-400'
    }
  }

  const totalCost = requests.reduce((sum, r) => sum + (r.cost || 0), 0)
  const pending = requests.filter(r => r.status === 'pending').length
  const approved = requests.filter(r => r.status === 'approved').length
  const delivered = requests.filter(r => r.status === 'delivered').length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Materials Request</h3>
          <p className="text-zinc-500 text-sm">{requests.length} total requests</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
          {showForm ? 'Cancel' : '+ New Request'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <p className="text-yellow-400 text-sm">Pending</p>
          <p className="text-3xl font-bold text-white mt-1">{pending}</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-blue-400 text-sm">Approved</p>
          <p className="text-3xl font-bold text-white mt-1">{approved}</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <p className="text-green-400 text-sm">Delivered</p>
          <p className="text-3xl font-bold text-white mt-1">{delivered}</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
          <p className="text-orange-400 text-sm">Total Cost</p>
          <p className="text-3xl font-bold text-white mt-1">KSh {totalCost.toLocaleString()}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-3 text-zinc-500">🔍</span>
          <input
            placeholder="Search by material, supplier, project or requester..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-4 top-3 text-zinc-500 hover:text-white">✕</button>
          )}
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="delivered">Delivered</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 grid grid-cols-2 gap-4">
          <h4 className="col-span-2 text-white font-semibold">
            {editingId ? 'Edit Request' : 'New Material Request'}
          </h4>
          <input placeholder="Material Name" value={form.material}
            onChange={(e) => setForm({ ...form, material: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <input placeholder="Quantity" type="number" value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <input placeholder="Unit (e.g. bags, tonnes, litres)" value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <input placeholder="Supplier Name" value={form.supplier}
            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="">Select Project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input placeholder="Requested By" value={form.requestedBy}
            onChange={(e) => setForm({ ...form, requestedBy: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <div>
            <p className="text-zinc-500 text-xs mb-1">Date Needed</p>
            <input type="date" value={form.dateNeeded}
              onChange={(e) => setForm({ ...form, dateNeeded: e.target.value })}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <input placeholder="Estimated Cost (KSh)" type="number" value={form.cost}
            onChange={(e) => setForm({ ...form, cost: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="delivered">Delivered</option>
            <option value="rejected">Rejected</option>
          </select>
          <input placeholder="Notes (optional)" value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <div className="col-span-2 flex gap-3">
            <button onClick={handleSubmit}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              {editingId ? 'Update Request' : 'Submit Request'}
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
              {['Material', 'Project', 'Qty', 'Supplier', 'Date Needed', 'Cost', 'Requested By', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-4 text-zinc-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="9" className="px-6 py-12 text-center text-zinc-600">
                {search ? `No results for "${search}"` : 'No material requests yet.'}
              </td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-orange-500/20 rounded-lg flex items-center justify-center text-sm">🧱</div>
                    <span className="text-white font-medium text-sm">{r.material}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-zinc-400 text-sm">{r.project?.name || '-'}</td>
                <td className="px-4 py-4 text-zinc-400 text-sm">{r.quantity} {r.unit}</td>
                <td className="px-4 py-4 text-zinc-400 text-sm">{r.supplier || '-'}</td>
                <td className="px-4 py-4 text-zinc-400 text-sm">{r.dateNeeded ? new Date(r.dateNeeded).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-4 text-green-400 text-sm font-medium">{r.cost ? `KSh ${r.cost.toLocaleString()}` : '-'}</td>
                <td className="px-4 py-4 text-zinc-400 text-sm">{r.requestedBy || '-'}</td>
                <td className="px-4 py-4">
                  <select
                    value={r.status}
                    onChange={(e) => handleStatusChange(r.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${getStatusBadge(r.status)}`}
                    style={{ background: 'transparent' }}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="delivered">Delivered</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </td>
                <td className="px-4 py-4 flex gap-2">
                  <button onClick={() => handleEdit(r)}
                    className="text-blue-400 hover:text-blue-300 text-xs font-medium">Edit</button>
                  <button onClick={() => handleDelete(r.id)}
                    className="text-red-500 hover:text-red-400 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}