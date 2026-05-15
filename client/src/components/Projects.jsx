import { useState, useEffect } from 'react'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [permits, setPermits] = useState([])
  const [showPermitForm, setShowPermitForm] = useState(false)
  const [editingPermitId, setEditingPermitId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', status: 'pending', startDate: '', endDate: '' })
  const [permitForm, setPermitForm] = useState({ name: '', issueDate: '', expiryDate: '', status: 'active', description: '' })

  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:5000/projects')
      const data = await res.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch (e) { setProjects([]) }
  }

  const fetchPermits = async (projectId) => {
    try {
      const res = await fetch(`http://localhost:5000/permits/project/${projectId}`)
      const data = await res.json()
      setPermits(Array.isArray(data) ? data : [])
    } catch (e) { setPermits([]) }
  }

  const filtered = projects.filter(p => {
    const matchesSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleSubmit = async () => {
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
  }

  const handleEdit = (p) => {
    setForm({
      name: p.name, description: p.description, status: p.status,
      startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
      endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : ''
    })
    setEditingId(p.id)
    setShowForm(true)
    setSelectedProject(null)
  }

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/projects/${id}`, { method: 'DELETE' })
    fetchProjects()
    if (selectedProject?.id === id) setSelectedProject(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ name: '', description: '', status: 'pending', startDate: '', endDate: '' })
  }

  const handleSelectProject = (p) => {
    setSelectedProject(p)
    fetchPermits(p.id)
    setShowForm(false)
  }

  const handlePermitSubmit = async () => {
    if (editingPermitId) {
      await fetch(`http://localhost:5000/permits/${editingPermitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...permitForm, projectId: selectedProject.id })
      })
      setEditingPermitId(null)
    } else {
      await fetch('http://localhost:5000/permits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...permitForm, projectId: selectedProject.id })
      })
    }
    setPermitForm({ name: '', issueDate: '', expiryDate: '', status: 'active', description: '' })
    setShowPermitForm(false)
    fetchPermits(selectedProject.id)
  }

  const handleEditPermit = (permit) => {
    setPermitForm({
      name: permit.name,
      issueDate: permit.issueDate ? new Date(permit.issueDate).toISOString().split('T')[0] : '',
      expiryDate: permit.expiryDate ? new Date(permit.expiryDate).toISOString().split('T')[0] : '',
      status: permit.status,
      description: permit.description || ''
    })
    setEditingPermitId(permit.id)
    setShowPermitForm(true)
  }

  const handleDeletePermit = async (id) => {
    await fetch(`http://localhost:5000/permits/${id}`, { method: 'DELETE' })
    fetchPermits(selectedProject.id)
  }

  const getPermitStatusBadge = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400'
      case 'expired': return 'bg-red-500/20 text-red-400'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400'
      default: return 'bg-zinc-500/20 text-zinc-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Projects</h3>
          <p className="text-zinc-500 text-sm">{filtered.length} of {projects.length} projects</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setSelectedProject(null) }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
          {showForm ? 'Cancel' : '+ Add Project'}
        </button>
      </div>

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

      <div className="grid grid-cols-2 gap-6">
        {/* Projects Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h4 className="text-white font-semibold">All Projects</h4>
            <p className="text-zinc-500 text-xs">Click a project to manage permits</p>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Name', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-zinc-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="3" className="px-4 py-8 text-center text-zinc-600">No projects yet.</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id}
                  onClick={() => handleSelectProject(p)}
                  className={`border-b border-zinc-800 cursor-pointer transition-colors ${
                    selectedProject?.id === p.id ? 'bg-orange-500/10 border-l-2 border-l-orange-500' : 'hover:bg-zinc-800/50'
                  }`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-500/20 rounded-lg flex items-center justify-center text-sm">🏗️</div>
                      <div>
                        <p className="text-white text-sm font-medium">{p.name}</p>
                        <p className="text-zinc-500 text-xs">{p.permits?.length || 0} permits</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      p.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      p.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(p) }}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium">Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id) }}
                      className="text-red-500 hover:text-red-400 text-xs font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Permits Panel */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {selectedProject ? (
            <>
              <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
                <div>
                  <h4 className="text-white font-semibold">Permits — {selectedProject.name}</h4>
                  <p className="text-zinc-500 text-xs">{permits.length} permits</p>
                </div>
                <button onClick={() => setShowPermitForm(!showPermitForm)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  {showPermitForm ? 'Cancel' : '+ Add Permit'}
                </button>
              </div>

              {showPermitForm && (
                <div className="p-4 border-b border-zinc-800 grid grid-cols-2 gap-3">
                  <input placeholder="Permit Name" value={permitForm.name}
                    onChange={(e) => setPermitForm({ ...permitForm, name: e.target.value })}
                    className="col-span-2 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  <input placeholder="Description" value={permitForm.description}
                    onChange={(e) => setPermitForm({ ...permitForm, description: e.target.value })}
                    className="col-span-2 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">Issue Date</p>
                    <input type="date" value={permitForm.issueDate}
                      onChange={(e) => setPermitForm({ ...permitForm, issueDate: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">Expiry Date</p>
                    <input type="date" value={permitForm.expiryDate}
                      onChange={(e) => setPermitForm({ ...permitForm, expiryDate: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <select value={permitForm.status} onChange={(e) => setPermitForm({ ...permitForm, status: e.target.value })}
                    className="col-span-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="expired">Expired</option>
                  </select>
                  <div className="col-span-2">
                    <button onClick={handlePermitSubmit}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      {editingPermitId ? 'Update Permit' : 'Save Permit'}
                    </button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-zinc-800">
                {permits.length === 0 ? (
                  <p className="px-6 py-8 text-center text-zinc-600 text-sm">No permits yet. Add one above.</p>
                ) : permits.map((permit) => (
                  <div key={permit.id} className="px-6 py-4 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-medium text-sm">{permit.name}</p>
                        {permit.description && <p className="text-zinc-500 text-xs mt-0.5">{permit.description}</p>}
                        <div className="flex gap-3 mt-2">
                          {permit.issueDate && <p className="text-zinc-500 text-xs">Issued: {new Date(permit.issueDate).toLocaleDateString()}</p>}
                          {permit.expiryDate && <p className="text-zinc-500 text-xs">Expires: {new Date(permit.expiryDate).toLocaleDateString()}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPermitStatusBadge(permit.status)}`}>
                          {permit.status}
                        </span>
                        <button onClick={() => handleEditPermit(permit)}
                          className="text-blue-400 hover:text-blue-300 text-xs">Edit</button>
                        <button onClick={() => handleDeletePermit(permit.id)}
                          className="text-red-500 hover:text-red-400 text-xs">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-white font-medium">Select a Project</p>
              <p className="text-zinc-500 text-sm mt-1">Click on a project to view and manage its permits</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}