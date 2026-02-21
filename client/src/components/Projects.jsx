import { useState, useEffect } from 'react'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', status: 'pending', startDate: '', endDate: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:5000/projects')
      const data = await res.json()
      setProjects(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      console.error('Failed to fetch projects:', err)
      setProjects([])
      setError('Could not connect to the server. Make sure your backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = projects.filter(p => {
    const matchesSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleSubmit = async () => {
    if (!form.name.trim()) return alert('Project name is required.')
    try {
      if (editingId) {
        await fetch(`http://localhost:5000/projects/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })
        setEditingId(null)
      } else {
        await fetch('http://localhost:5000/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })
      }
      setForm({ name: '', description: '', status: 'pending', startDate: '', endDate: '' })
      setShowForm(false)
      fetchProjects()
    } catch (err) {
      console.error('Failed to save project:', err)
      alert('Failed to save project. Check your server.')
    }
  }

  const handleEdit = (p) => {
    setForm({
      name: p.name, description: p.description, status: p.status,
      startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
      endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : ''
    })
    setEditingId(p.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return
    try {
      await fetch(`http://localhost:5000/projects/${id}`, { method: 'DELETE' })
      fetchProjects()
    } catch (err) {
      console.error('Failed to delete project:', err)
      alert('Failed to delete project. Check your server.')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ name: '', description: '', status: 'pending', startDate: '', endDate: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Projects</h3>
          <p className="text-zinc-500 text-sm">{filtered.length} of {projects.length} projects</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
          {showForm ? 'Cancel' : '+ Add Project'}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={fetchProjects} className="underline hover:text-red-300">Retry</button>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-3 text-zinc-500">🔍</span>
          <input
            placeholder="Search by name or description..."
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
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 grid grid-cols-2 gap-4">
          <h4 className="col-span-2 text-white font-semibold">
            {editingId ? 'Edit Project' : 'Add New Project'}
          </h4>
          <input placeholder="Project Name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <input placeholder="Description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
          <input type="date" value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <input type="date" value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <div className="col-span-2 flex gap-3">
            <button onClick={handleSubmit}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              {editingId ? 'Update Project' : 'Save Project'}
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
              {['Name', 'Description', 'Status', 'Start Date', 'End Date', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-4 text-zinc-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="px-6 py-12 text-center text-zinc-600">Loading projects...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-12 text-center text-zinc-600">
                {search ? `No results for "${search}"` : 'No projects yet.'}
              </td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-sm">🏗️</div>
                    <span className="text-white font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-zinc-400">{p.description}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    p.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    p.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>{p.status}</span>
                </td>
                <td className="px-6 py-4 text-zinc-400">{p.startDate ? new Date(p.startDate).toLocaleDateString() : '-'}</td>
                <td className="px-6 py-4 text-zinc-400">{p.endDate ? new Date(p.endDate).toLocaleDateString() : '-'}</td>
                <td className="px-6 py-4 flex gap-3">
                  <button onClick={() => handleEdit(p)}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">Edit</button>
                  <button onClick={() => handleDelete(p.id)}
                    className="text-red-500 hover:text-red-400 text-sm font-medium transition-colors">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}