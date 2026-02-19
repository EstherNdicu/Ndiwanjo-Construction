import { useState, useEffect } from 'react'

export default function Projects() {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Projects</h3>
          <p className="text-zinc-500 text-sm">{projects.length} total projects</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
          {showForm ? 'Cancel' : '+ Add Project'}
        </button>
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 grid grid-cols-2 gap-4">
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
          <div className="col-span-2">
            <button onClick={handleSubmit}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              Save Project
            </button>
          </div>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-800">
              {['Name', 'Description', 'Status', 'Start Date', 'End Date', 'Action'].map((h) => (
                <th key={h} className="px-6 py-4 text-zinc-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-12 text-center text-zinc-600">No projects yet. Add one above.</td></tr>
            ) : projects.map((p) => (
              <tr key={p.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-sm">
                      🏗️
                    </div>
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
                <td className="px-6 py-4">
                  <button onClick={() => handleDelete(p.id)}
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