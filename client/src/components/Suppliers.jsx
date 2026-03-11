import { useState, useEffect } from 'react'

export default function Suppliers({ theme }) {
  const [suppliers, setSuppliers] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [purchaseForm, setPurchaseForm] = useState({ description: '', amount: '', paid: false, projectId: '', date: '' })
  const [form, setForm] = useState({ name: '', contact: '', email: '', phone: '', materials: '', creditTerms: '' })

  const dark = theme !== 'light'
  const card = dark ? '#0d1f3c' : '#fff'
  const border = dark ? '#1e3a5f' : '#e2e8f0'
  const text = dark ? '#fff' : '#1e293b'
  const muted = dark ? '#4a6fa5' : '#64748b'
  const subtle = dark ? '#8a9bb5' : '#94a3b8'
  const input = dark ? '#1e3a5f' : '#f8fafc'
  const inputBorder = dark ? '#2a4a7f' : '#cbd5e1'

  useEffect(() => { fetchSuppliers(); fetchProjects() }, [])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:5000/suppliers')
      const data = await res.json()
      setSuppliers(Array.isArray(data) ? data : [])
    } catch { setSuppliers([]) }
    finally { setLoading(false) }
  }

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:5000/projects')
      setProjects(Array.isArray(await res.json()) ? await res.json() : [])
    } catch {}
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) return alert('Supplier name is required.')
    try {
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `http://localhost:5000/suppliers/${editingId}` : 'http://localhost:5000/suppliers'
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      resetForm()
      await fetchSuppliers()
    } catch { alert('Failed to save supplier.') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier and all their purchase history?')) return
    await fetch(`http://localhost:5000/suppliers/${id}`, { method: 'DELETE' })
    if (selectedSupplier?.id === id) setSelectedSupplier(null)
    fetchSuppliers()
  }

  const handleEdit = (s) => {
    setForm({ name: s.name, contact: s.contact || '', email: s.email || '', phone: s.phone || '', materials: s.materials || '', creditTerms: s.creditTerms || '' })
    setEditingId(s.id)
    setShowForm(true)
    setSelectedSupplier(null)
  }

  const resetForm = () => {
    setForm({ name: '', contact: '', email: '', phone: '', materials: '', creditTerms: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const addPurchase = async () => {
    if (!purchaseForm.description.trim() || !purchaseForm.amount) return alert('Description and amount required.')
    try {
      await fetch(`http://localhost:5000/suppliers/${selectedSupplier.id}/purchases`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(purchaseForm)
      })
      setPurchaseForm({ description: '', amount: '', paid: false, projectId: '', date: '' })
      setShowPurchaseForm(false)
      const updated = await fetch('http://localhost:5000/suppliers').then(r => r.json())
      setSuppliers(updated)
      setSelectedSupplier(updated.find(s => s.id === selectedSupplier.id))
    } catch { alert('Failed to add purchase.') }
  }

  const markPaid = async (purchaseId) => {
    await fetch(`http://localhost:5000/suppliers/${selectedSupplier.id}/purchases/${purchaseId}/paid`, { method: 'PATCH' })
    const updated = await fetch('http://localhost:5000/suppliers').then(r => r.json())
    setSuppliers(updated)
    setSelectedSupplier(updated.find(s => s.id === selectedSupplier.id))
  }

  const deletePurchase = async (purchaseId) => {
    await fetch(`http://localhost:5000/suppliers/${selectedSupplier.id}/purchases/${purchaseId}`, { method: 'DELETE' })
    const updated = await fetch('http://localhost:5000/suppliers').then(r => r.json())
    setSuppliers(updated)
    setSelectedSupplier(updated.find(s => s.id === selectedSupplier.id))
  }

  const getOutstanding = (s) => (s.purchases || []).filter(p => !p.paid).reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const getTotal = (s) => (s.purchases || []).reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const totalOutstanding = suppliers.reduce((sum, s) => sum + getOutstanding(s), 0)

  // Detail view
  if (selectedSupplier) {
    const outstanding = getOutstanding(selectedSupplier)
    const total = getTotal(selectedSupplier)
    const paid = total - outstanding
    return (
      <div className="space-y-5">
        <button onClick={() => setSelectedSupplier(null)} className="text-sm flex items-center gap-1" style={{ color: muted }}>← Back to Suppliers</button>

        <div className="rounded-2xl p-6 border" style={{ backgroundColor: card, borderColor: border }}>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold" style={{ color: text }}>{selectedSupplier.name}</h2>
              <div className="flex gap-4 mt-2 flex-wrap">
                {selectedSupplier.contact && <span className="text-sm" style={{ color: muted }}>👤 {selectedSupplier.contact}</span>}
                {selectedSupplier.phone && <span className="text-sm" style={{ color: muted }}>📞 {selectedSupplier.phone}</span>}
                {selectedSupplier.email && <span className="text-sm" style={{ color: muted }}>✉️ {selectedSupplier.email}</span>}
              </div>
              {selectedSupplier.materials && <p className="text-sm mt-2 px-3 py-1.5 rounded-lg w-fit" style={{ backgroundColor: '#c9a84c20', color: '#c9a84c' }}>📦 {selectedSupplier.materials}</p>}
              {selectedSupplier.creditTerms && <p className="text-sm mt-2" style={{ color: muted }}>💳 Credit Terms: <span style={{ color: text }}>{selectedSupplier.creditTerms}</span></p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(selectedSupplier)} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: input, color: muted, border: `1px solid ${border}` }}>Edit</button>
              <button onClick={() => handleDelete(selectedSupplier.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400">Delete</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t" style={{ borderColor: border }}>
            <div><p className="text-xs" style={{ color: muted }}>Total Purchases</p><p className="text-xl font-bold mt-0.5" style={{ color: '#c9a84c' }}>KSh {total.toLocaleString()}</p></div>
            <div><p className="text-xs" style={{ color: muted }}>Total Paid</p><p className="text-xl font-bold mt-0.5 text-green-400">KSh {paid.toLocaleString()}</p></div>
            <div><p className="text-xs" style={{ color: muted }}>Outstanding</p><p className="text-xl font-bold mt-0.5 text-red-400">KSh {outstanding.toLocaleString()}</p></div>
          </div>
        </div>

        {/* Purchase history */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: border }}>
          <div className="flex justify-between items-center px-5 py-4" style={{ backgroundColor: card, borderBottom: `1px solid ${border}` }}>
            <h3 className="font-semibold" style={{ color: text }}>🛒 Purchase History ({selectedSupplier.purchases?.length || 0})</h3>
            <button onClick={() => setShowPurchaseForm(!showPurchaseForm)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: 'linear-gradient(135deg, #c9a84c, #a8883a)', color: '#0a1628' }}>
              + Add Purchase
            </button>
          </div>

          {showPurchaseForm && (
            <div className="p-5 border-b space-y-3" style={{ backgroundColor: input, borderColor: border }}>
              <div className="grid grid-cols-3 gap-3">
                <input className="col-span-2 rounded-lg px-4 py-2.5 text-sm" placeholder="Description *"
                  style={{ backgroundColor: card, border: `1px solid ${inputBorder}`, color: text }}
                  value={purchaseForm.description} onChange={e => setPurchaseForm({ ...purchaseForm, description: e.target.value })} />
                <input type="number" className="rounded-lg px-4 py-2.5 text-sm" placeholder="Amount (KSh) *"
                  style={{ backgroundColor: card, border: `1px solid ${inputBorder}`, color: text }}
                  value={purchaseForm.amount} onChange={e => setPurchaseForm({ ...purchaseForm, amount: e.target.value })} />
                <select className="rounded-lg px-4 py-2.5 text-sm" style={{ backgroundColor: card, border: `1px solid ${inputBorder}`, color: text }}
                  value={purchaseForm.projectId} onChange={e => setPurchaseForm({ ...purchaseForm, projectId: e.target.value })}>
                  <option value="">No project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="date" className="rounded-lg px-4 py-2.5 text-sm" style={{ backgroundColor: card, border: `1px solid ${inputBorder}`, color: text }}
                  value={purchaseForm.date} onChange={e => setPurchaseForm({ ...purchaseForm, date: e.target.value })} />
                <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: text }}>
                  <input type="checkbox" checked={purchaseForm.paid} onChange={e => setPurchaseForm({ ...purchaseForm, paid: e.target.checked })} />
                  Already paid
                </label>
              </div>
              <div className="flex gap-2">
                <button onClick={addPurchase} className="px-5 py-2 rounded-lg text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #c9a84c, #a8883a)', color: '#0a1628' }}>Save</button>
                <button onClick={() => setShowPurchaseForm(false)} className="px-5 py-2 rounded-lg text-sm" style={{ backgroundColor: card, color: muted, border: `1px solid ${border}` }}>Cancel</button>
              </div>
            </div>
          )}

          {!selectedSupplier.purchases?.length ? (
            <div className="px-5 py-10 text-center text-sm" style={{ backgroundColor: card, color: muted }}>No purchases recorded yet.</div>
          ) : selectedSupplier.purchases.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-5 py-4 border-b" style={{ backgroundColor: card, borderColor: border }}>
              <div>
                <p className="text-sm font-medium" style={{ color: text }}>{p.description}</p>
                <div className="flex gap-3 mt-0.5">
                  <p className="text-xs" style={{ color: muted }}>{new Date(p.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  {p.projectId && <p className="text-xs" style={{ color: '#c9a84c' }}>📍 {projects.find(pr => pr.id === p.projectId)?.name}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-bold text-sm" style={{ color: '#c9a84c' }}>KSh {Number(p.amount).toLocaleString()}</p>
                {p.paid ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">✓ Paid</span>
                ) : (
                  <button onClick={() => markPaid(p.id)} className="text-xs px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20">Mark Paid</button>
                )}
                <button onClick={() => deletePurchase(p.id)} className="text-xs text-red-400">Delete</button>
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
          <h3 className="text-xl font-bold" style={{ color: text }}>Supplier Management</h3>
          <p className="text-sm mt-0.5" style={{ color: muted }}>{suppliers.length} suppliers · KSh {totalOutstanding.toLocaleString()} outstanding</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #c9a84c, #a8883a)', color: '#0a1628' }}>
          {showForm && !editingId ? 'Cancel' : '+ Add Supplier'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl p-5 border" style={{ backgroundColor: card, borderColor: border }}>
          <p className="text-sm" style={{ color: muted }}>Total Suppliers</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#c9a84c' }}>{suppliers.length}</p>
        </div>
        <div className="rounded-xl p-5 border" style={{ backgroundColor: card, borderColor: '#ef444430' }}>
          <p className="text-sm" style={{ color: muted }}>Total Outstanding</p>
          <p className="text-2xl font-bold mt-1 text-red-400">KSh {totalOutstanding.toLocaleString()}</p>
        </div>
        <div className="rounded-xl p-5 border" style={{ backgroundColor: card, borderColor: '#22c55e30' }}>
          <p className="text-sm" style={{ color: muted }}>Total Paid Out</p>
          <p className="text-2xl font-bold mt-1 text-green-400">KSh {suppliers.reduce((s, sup) => s + getTotal(sup) - getOutstanding(sup), 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl p-5 border space-y-4" style={{ backgroundColor: card, borderColor: border }}>
          <h4 className="font-semibold" style={{ color: text }}>{editingId ? 'Edit Supplier' : 'Add New Supplier'}</h4>
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="Supplier name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="rounded-lg px-4 py-2.5 text-sm" style={{ backgroundColor: input, border: `1px solid ${inputBorder}`, color: text }} />
            <input placeholder="Contact person" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })}
              className="rounded-lg px-4 py-2.5 text-sm" style={{ backgroundColor: input, border: `1px solid ${inputBorder}`, color: text }} />
            <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="rounded-lg px-4 py-2.5 text-sm" style={{ backgroundColor: input, border: `1px solid ${inputBorder}`, color: text }} />
            <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="rounded-lg px-4 py-2.5 text-sm" style={{ backgroundColor: input, border: `1px solid ${inputBorder}`, color: text }} />
            <input placeholder="Materials supplied (e.g. Cement, Steel)" value={form.materials} onChange={e => setForm({ ...form, materials: e.target.value })}
              className="rounded-lg px-4 py-2.5 text-sm" style={{ backgroundColor: input, border: `1px solid ${inputBorder}`, color: text }} />
            <input placeholder="Credit terms (e.g. Net 30)" value={form.creditTerms} onChange={e => setForm({ ...form, creditTerms: e.target.value })}
              className="rounded-lg px-4 py-2.5 text-sm" style={{ backgroundColor: input, border: `1px solid ${inputBorder}`, color: text }} />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSubmit} className="px-6 py-2.5 rounded-lg text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #c9a84c, #a8883a)', color: '#0a1628' }}>
              {editingId ? 'Save Changes' : 'Add Supplier'}
            </button>
            <button onClick={resetForm} className="px-6 py-2.5 rounded-lg text-sm" style={{ backgroundColor: input, color: muted, border: `1px solid ${border}` }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Suppliers list */}
      {loading ? (
        <div className="text-center py-12" style={{ color: muted }}>Loading suppliers...</div>
      ) : suppliers.length === 0 ? (
        <div className="rounded-xl p-12 border text-center" style={{ backgroundColor: card, borderColor: border }}>
          <p className="text-4xl mb-3">🏭</p>
          <p className="font-semibold" style={{ color: text }}>No suppliers yet</p>
          <p className="text-sm mt-1" style={{ color: muted }}>Add your first supplier above</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: border }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: dark ? '#0a1628' : '#f8fafc' }}>
                {['Supplier', 'Contact', 'Materials', 'Credit Terms', 'Outstanding', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s, i) => {
                const outstanding = getOutstanding(s)
                return (
                  <tr key={s.id} className="border-t" style={{ borderColor: border, backgroundColor: i % 2 === 0 ? card : 'transparent' }}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-sm" style={{ color: text }}>{s.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: muted }}>{s.purchases?.length || 0} purchases</p>
                    </td>
                    <td className="px-5 py-4">
                      {s.contact && <p className="text-sm" style={{ color: subtle }}>👤 {s.contact}</p>}
                      {s.phone && <p className="text-xs mt-0.5" style={{ color: muted }}>📞 {s.phone}</p>}
                    </td>
                    <td className="px-5 py-4">
                      {s.materials ? <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#c9a84c20', color: '#c9a84c' }}>{s.materials}</span> : <span style={{ color: muted }}>—</span>}
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: subtle }}>{s.creditTerms || '—'}</td>
                    <td className="px-5 py-4">
                      <p className={`font-bold text-sm ${outstanding > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {outstanding > 0 ? `KSh ${outstanding.toLocaleString()}` : '✓ Clear'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedSupplier(s)} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: dark ? '#1e3a5f' : '#f1f5f9', color: '#c9a84c' }}>View</button>
                        <button onClick={() => handleEdit(s)} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: dark ? '#1e3a5f' : '#f1f5f9', color: muted }}>Edit</button>
                        <button onClick={() => handleDelete(s.id)} className="text-xs text-red-400">Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}