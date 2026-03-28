import { useState, useEffect } from 'react'

const STATUS = {
  available: { label: 'Available', color: '#22c55e', bg: '#22c55e20', icon: '✅' },
  'in-use': { label: 'In Use', color: '#c9a84c', bg: '#c9a84c20', icon: '🔨' },
  maintenance: { label: 'Maintenance', color: '#ef4444', bg: '#ef444420', icon: '🔧' },
}

const TYPES = ['Vehicle', 'Machinery', 'Tool', 'Scaffold', 'Generator', 'Pump', 'Compressor', 'Other']

export default function Equipment({ theme }) {
  const [equipment, setEquipment] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedEq, setSelectedEq] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false)
  const [maintenanceForm, setMaintenanceForm] = useState({ description: '', cost: '', date: '' })
  const [form, setForm] = useState({ name: '', type: '', status: 'available', projectId: '', purchaseDate: '', purchaseCost: '', notes: '' })

  const dark = theme !== 'light'
  const card = dark ? '#0d1f3c' : '#fff'
  const border = dark ? '#1e3a5f' : '#e2e8f0'
  const text = dark ? '#fff' : '#1e293b'
  const muted = dark ? '#4a6fa5' : '#64748b'
  const subtle = dark ? '#8a9bb5' : '#94a3b8'
  const bg = dark ? '#060f1e' : '#f1f5f9'
  const input = dark ? '#1e3a5f' : '#f8fafc'
  const inputBorder = dark ? '#2a4a7f' : '#cbd5e1'

  useEffect(() => { fetchEquipment(); fetchProjects() }, [])

  const fetchEquipment = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:5000/equipment')
      const data = await res.json()
      setEquipment(Array.isArray(data) ? data : [])
    } catch { setEquipment([]) }
    finally { setLoading(false) }
  }

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:5000/projects')
      const data = await res.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch {}
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) return alert('Equipment name is required.')
    if (!form.type) return alert('Please select a type.')
    try {
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `http://localhost:5000/equipment/${editingId}` : 'http://localhost:5000/equipment'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      resetForm()
      await fetchEquipment()
      if (selectedEq) {
        const updated = await fetch('http://localhost:5000/equipment').then(r => r.json())
        setSelectedEq(updated.find(e => e.id === selectedEq.id) || null)
      }
    } catch (err) { alert('Failed to save equipment: ' + err.message) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this equipment?')) return
    await fetch(`http://localhost:5000/equipment/${id}`, { method: 'DELETE' })
    if (selectedEq?.id === id) setSelectedEq(null)
    fetchEquipment()
  }

  const handleEdit = (eq) => {
    setForm({
      name: eq.name, type: eq.type, status: eq.status,
      projectId: eq.projectId || '',
      purchaseDate: eq.purchaseDate ? eq.purchaseDate.slice(0, 10) : '',
      purchaseCost: eq.purchaseCost || '',
      notes: eq.notes || ''
    })
    setEditingId(eq.id)
    setShowForm(true)
    setSelectedEq(null)
  }

  const resetForm = () => {
    setForm({ name: '', type: '', status: 'available', projectId: '', purchaseDate: '', purchaseCost: '', notes: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const addMaintenance = async () => {
    if (!maintenanceForm.description.trim()) return alert('Description required.')
    try {
      await fetch(`http://localhost:5000/equipment/${selectedEq.id}/maintenance`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maintenanceForm)
      })
      setMaintenanceForm({ description: '', cost: '', date: '' })
      setShowMaintenanceForm(false)
      const updated = await fetch('http://localhost:5000/equipment').then(r => r.json())
      const updatedEq = updated.find(e => e.id === selectedEq.id)
      setSelectedEq(updatedEq)
      setEquipment(updated)
    } catch { alert('Failed to add maintenance log.') }
  }

  const deleteMaintenance = async (logId) => {
    await fetch(`http://localhost:5000/equipment/${selectedEq.id}/maintenance/${logId}`, { method: 'DELETE' })
    const updated = await fetch('http://localhost:5000/equipment').then(r => r.json())
    setSelectedEq(updated.find(e => e.id === selectedEq.id))
    setEquipment(updated)
  }

  const filtered = equipment.filter(e => filterStatus === 'all' || e.status === filterStatus)

  const counts = { all: equipment.length, available: 0, 'in-use': 0, maintenance: 0 }
  equipment.forEach(e => { if (counts[e.status] !== undefined) counts[e.status]++ })

  const totalMaintenanceCost = (eq) => (eq.maintenanceLogs || []).reduce((s, l) => s + (Number(l.cost) || 0), 0)

  // Detail view
  if (selectedEq) {
    const st = STATUS[selectedEq.status] || STATUS.available
    return (
      <div className="space-y-5">
        <button onClick={() => setSelectedEq(null)} className="text-sm flex items-center gap-1" style={{ color: muted }}>← Back to Equipment</button>

        <div className="rounded-2xl p-6 border" style={{ backgroundColor: card, borderColor: border }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#c9a84c' }}>{selectedEq.type}</p>
              <h2 className="text-xl font-bold" style={{ color: text }}>{selectedEq.name}</h2>
              {selectedEq.project && <p className="text-sm mt-1" style={{ color: muted }}>📍 Assigned to: <span style={{ color: '#c9a84c' }}>{selectedEq.project.name}</span></p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ backgroundColor: st.bg, color: st.color }}>{st.icon} {st.label}</span>
              <button onClick={() => handleEdit(selectedEq)} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: input, color: muted, border: `1px solid ${border}` }}>Edit</button>
              <button onClick={() => handleDelete(selectedEq.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400">Delete</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t" style={{ borderColor: border }}>
            {selectedEq.purchaseDate && (
              <div><p className="text-xs" style={{ color: muted }}>Purchase Date</p><p className="font-medium mt-0.5" style={{ color: text }}>{new Date(selectedEq.purchaseDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div>
            )}
            {selectedEq.purchaseCost && (
              <div><p className="text-xs" style={{ color: muted }}>Purchase Cost</p><p className="font-bold mt-0.5" style={{ color: '#c9a84c' }}>KSh {Number(selectedEq.purchaseCost).toLocaleString()}</p></div>
            )}
            <div><p className="text-xs" style={{ color: muted }}>Maintenance Cost</p><p className="font-bold mt-0.5 text-red-400">KSh {totalMaintenanceCost(selectedEq).toLocaleString()}</p></div>
          </div>

          {selectedEq.notes && <p className="text-sm mt-4 p-3 rounded-lg" style={{ backgroundColor: input, color: subtle, border: `1px solid ${border}` }}>{selectedEq.notes}</p>}
        </div>

        {/* Maintenance log */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: border }}>
          <div className="flex justify-between items-center px-5 py-4" style={{ backgroundColor: card, borderBottom: `1px solid ${border}` }}>
            <h3 className="font-semibold" style={{ color: text }}>🔧 Maintenance Log ({selectedEq.maintenanceLogs?.length || 0})</h3>
            <button onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: 'linear-gradient(135deg, #c9a84c, #a8883a)', color: '#0a1628' }}>
              + Add Log
            </button>
          </div>

          {showMaintenanceForm && (
            <div className="p-5 border-b space-y-3" style={{ backgroundColor: input, borderColor: border }}>
              <div className="grid grid-cols-3 gap-3">
                <input className="col-span-2 rounded-lg px-4 py-2.5 text-sm" placeholder="Description *"
                  style={{ backgroundColor: card, border: `1px solid ${inputBorder}`, color: text }}
                  value={maintenanceForm.description} onChange={e => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })} />
                <input type="number" className="rounded-lg px-4 py-2.5 text-sm" placeholder="Cost (KSh)"
                  style={{ backgroundColor: card, border: `1px solid ${inputBorder}`, color: text }}
                  value={maintenanceForm.cost} onChange={e => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })} />
                <input type="date" className="rounded-lg px-4 py-2.5 text-sm"
                  style={{ backgroundColor: card, border: `1px solid ${inputBorder}`, color: text }}
                  value={maintenanceForm.date} onChange={e => setMaintenanceForm({ ...maintenanceForm, date: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <button onClick={addMaintenance} className="px-5 py-2 rounded-lg text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #c9a84c, #a8883a)', color: '#0a1628' }}>Save</button>
                <button onClick={() => setShowMaintenanceForm(false)} className="px-5 py-2 rounded-lg text-sm" style={{ backgroundColor: card, color: muted, border: `1px solid ${border}` }}>Cancel</button>
              </div>
            </div>
          )}

          {!selectedEq.maintenanceLogs?.length ? (
            <div className="px-5 py-10 text-center text-sm" style={{ backgroundColor: card, color: muted }}>No maintenance logs yet.</div>
          ) : selectedEq.maintenanceLogs.map((log) => (
            <div key={log.id} className="flex justify-between items-center px-5 py-4 border-b" style={{ backgroundColor: card, borderColor: border }}>
              <div>
                <p className="text-sm font-medium" style={{ color: text }}>{log.description}</p>
                <p className="text-xs mt-0.5" style={{ color: muted }}>{new Date(log.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="flex items-center gap-3">
                {log.cost && <p className="text-sm font-bold text-red-400">KSh {Number(log.cost).toLocaleString()}</p>}
                <button onClick={() => deleteMaintenance(log.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold" style={{ color: text }}>Equipment Tracker</h3>
          <p className="text-sm mt-0.5" style={{ color: muted }}>{equipment.length} items tracked</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #c9a84c, #a8883a)', color: '#0a1628' }}>
          {showForm && !editingId ? 'Cancel' : '+ Add Equipment'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { key: 'all', label: 'Total', color: '#c9a84c', icon: '🏗️' },
          { key: 'available', label: 'Available', color: '#22c55e', icon: '✅' },
          { key: 'in-use', label: 'In Use', color: '#c9a84c', icon: '🔨' },
          { key: 'maintenance', label: 'Maintenance', color: '#ef4444', icon: '🔧' },
        ].map(s => (
          <div key={s.key} onClick={() => setFilterStatus(s.key)}
            className="rounded-xl p-5 border cursor-pointer transition-all"
            style={{ backgroundColor: filterStatus === s.key ? s.color + '15' : card, borderColor: filterStatus === s.key ? s.color : border }}>
            <p className="text-sm" style={{ color: muted }}>{s.icon} {s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{counts[s.key]}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl p-5 border space-y-4" style={{ backgroundColor: card, borderColor: border }}>
          <h4 className="font-semibold" style={{ color: text }}>{editingId ? 'Edit Equipment' : 'Add New Equipment'}</h4>
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="Equipment name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="rounded-lg px-4 py-2.5 text-sm" style={{ backgroundColor: input, border: `1px solid ${inputBorder}`, color: text }} />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="rounded-lg px-4 py-2.5 text-sm" style={{ backgroundColor: input, border: `1px solid ${inputBorder}`, color: text }}>
              <option value="">Select Type *</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
              className="rounded-lg px-4 py-2.5 text-sm" style={{ backgroundColor: input, border: `1px solid ${inputBorder}`, color: text }}>
              <option value="available">Available</option>
              <option value="in-use">In Use</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}
              className="rounded-lg px-4 py-2.5 text-sm" style={{ backgroundColor: input, border: `1px solid ${inputBorder}`, color: text }}>
              <option value="">No project assigned</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="date" placeholder="Purchase date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })}
              className="rounded-lg px-4 py-2.5 text-sm" style={{ backgroundColor: input, border: `1px solid ${inputBorder}`, color: text }} />
            <input type="number" placeholder="Purchase cost (KSh)" value={form.purchaseCost} onChange={e => setForm({ ...form, purchaseCost: e.target.value })}
              className="rounded-lg px-4 py-2.5 text-sm" style={{ backgroundColor: input, border: `1px solid ${inputBorder}`, color: text }} />
            <input placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="col-span-3 rounded-lg px-4 py-2.5 text-sm" style={{ backgroundColor: input, border: `1px solid ${inputBorder}`, color: text }} />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSubmit} className="px-6 py-2.5 rounded-lg text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #c9a84c, #a8883a)', color: '#0a1628' }}>
              {editingId ? 'Save Changes' : 'Add Equipment'}
            </button>
            <button onClick={resetForm} className="px-6 py-2.5 rounded-lg text-sm" style={{ backgroundColor: input, color: muted, border: `1px solid ${border}` }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Equipment grid */}
      {loading ? (
        <div className="text-center py-12" style={{ color: muted }}>Loading equipment...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl p-12 border text-center" style={{ backgroundColor: card, borderColor: border }}>
          <p className="text-4xl mb-3">🏗️</p>
          <p className="font-semibold" style={{ color: text }}>No equipment found</p>
          <p className="text-sm mt-1" style={{ color: muted }}>Add your first piece of equipment above</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(eq => {
            const st = STATUS[eq.status] || STATUS.available
            const maintCost = totalMaintenanceCost(eq)
            return (
              <div key={eq.id} onClick={() => setSelectedEq(eq)}
                className="rounded-xl p-5 border cursor-pointer transition-all hover:shadow-lg space-y-3"
                style={{ backgroundColor: card, borderColor: border }}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium" style={{ color: muted }}>{eq.type}</p>
                    <p className="font-bold mt-0.5" style={{ color: text }}>{eq.name}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0" style={{ backgroundColor: st.bg, color: st.color }}>
                    {st.icon} {st.label}
                  </span>
                </div>
                {eq.project && (
                  <p className="text-xs px-2 py-1 rounded-lg w-fit" style={{ backgroundColor: '#c9a84c20', color: '#c9a84c' }}>
                    📍 {eq.project.name}
                  </p>
                )}
                <div className="flex justify-between pt-2 border-t text-xs" style={{ borderColor: border }}>
                  <span style={{ color: muted }}>🔧 {eq.maintenanceLogs?.length || 0} logs</span>
                  {maintCost > 0 && <span className="text-red-400">KSh {maintCost.toLocaleString()}</span>}
                  {eq.purchaseCost && <span style={{ color: '#c9a84c' }}>KSh {Number(eq.purchaseCost).toLocaleString()}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}