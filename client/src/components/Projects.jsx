import { useState, useEffect } from 'react'
import ProjectDetail from './ProjectDetail'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', status: 'pending', startDate: '', endDate: '', quotation: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState(null)

  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:5000/projects')
      const data = await res.json()
      setProjects(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
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
      setForm({ name: '', description: '', status: 'pending', startDate: '', endDate: '', quotation: '' })
      setShowForm(false)
      fetchProjects()
    } catch (err) {
      alert('Failed to save project. Check your server.')
    }
  }

  const handleEdit = (e, p) => {
    e.stopPropagation()
    setForm({
      name: p.name, description: p.description, status: p.status,
      startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
      endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : '',
      quotation: p.quotation || ''
    })
    setEditingId(p.id)
    setShowForm(true)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this project?')) return
    try {
      await fetch(`http://localhost:5000/projects/${id}`, { method: 'DELETE' })
      fetchProjects()
    } catch (err) {
      alert('Failed to delete project. Check your server.')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ name: '', description: '', status: 'pending', startDate: '', endDate: '', quotation: '' })
  }

  if (selectedProjectId) {
    return (
      <ProjectDetail
        projectId={selectedProjectId}
        onBack={() => { setSelectedProjectId(null); fetchProjects() }}
      />
    )
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

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={fetchProjects} className="underline hover:text-red-300">Retry</button>
        </div>
      )}

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
          <input placeholder="Initial Quotation (KSh)" type="number" value={form.quotation}
            onChange={(e) => setForm({ ...form, quotation: e.target.value })}
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

      {/* Project Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-12 text-center text-zinc-600">Loading projects...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-12 text-center text-zinc-600">
            {search ? `No results for "${search}"` : 'No projects yet.'}
          </div>
        ) : filtered.map((p) => {
          const totalEarned = (p.payments || []).reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0)
          const totalSpent = (p.expenses || []).reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
          const profit = totalEarned - totalSpent
          const isProfit = profit >= 0

          return (
            <div key={p.id}
              onClick={() => setSelectedProjectId(p.id)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:bg-zinc-800/50 transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 text-lg">🏗️</div>
                  <div>
                    <h4 className="text-white font-semibold">{p.name}</h4>
                    <p className="text-zinc-500 text-xs">{p.description || 'No description'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    p.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    p.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>{p.status}</span>
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={(e) => handleEdit(e, p)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">Edit</button>
                    <button onClick={(e) => handleDelete(e, p.id)}
                      className="text-red-500 hover:text-red-400 text-sm font-medium transition-colors">Delete</button>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-zinc-500 text-xs mb-1">Quotation</p>
                  <p className="text-white font-semibold text-sm">
                    {p.quotation ? `KSh ${Number(p.quotation).toLocaleString()}` : '-'}
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-zinc-500 text-xs mb-1">Earned</p>
                  <p className="text-green-400 font-semibold text-sm">KSh {totalEarned.toLocaleString()}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-zinc-500 text-xs mb-1">Spent</p>
                  <p className="text-orange-400 font-semibold text-sm">KSh {totalSpent.toLocaleString()}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-zinc-500 text-xs mb-1">Profit / Loss</p>
                  <p className={`font-semibold text-sm ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                    {isProfit ? '+' : ''}KSh {profit.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-3">
                <p className="text-zinc-600 text-xs">
                  📅 {p.startDate ? new Date(p.startDate).toLocaleDateString() : 'No start'} →{' '}
                  {p.endDate ? new Date(p.endDate).toLocaleDateString() : 'No end'}
                </p>
                <p className="text-zinc-600 text-xs">👷 {(p.employees || []).length} employees</p>
                <p className="text-zinc-600 text-xs">💰 {(p.payments || []).length} payments</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}