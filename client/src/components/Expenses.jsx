import { useState, useEffect } from 'react'

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterProject, setFilterProject] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ title: '', amount: '', category: '', projectId: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('expenses')
  const [reminderModal, setReminderModal] = useState(null)
  const [paidInvoices, setPaidInvoices] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ndiwanjo_paid_invoices') || '[]') } catch { return [] }
  })

  useEffect(() => {
    fetchExpenses()
    fetchProjects()
  }, [])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:5000/expenses')
      const data = await res.json()
      setExpenses(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      setExpenses([])
      setError('Could not connect to the server. Make sure your backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:5000/projects')
      const data = await res.json()
      setProjects(Array.isArray(data) ? data : [])
    } catch {}
  }

  const filtered = expenses.filter(e => {
    const matchesSearch =
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.project?.name?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = filterCategory === 'all' || e.category === filterCategory
    const matchesProject = filterProject === 'all' || String(e.projectId) === filterProject
    return matchesSearch && matchesCategory && matchesProject
  })

  const handleSubmit = async () => {
    if (!form.title.trim()) return alert('Expense title is required.')
    if (!form.amount) return alert('Amount is required.')
    try {
      if (editingId) {
        await fetch(`http://localhost:5000/expenses/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, projectId: form.projectId ? Number(form.projectId) : null })
        })
        setEditingId(null)
      } else {
        // If project selected, add via project route so it links correctly
        if (form.projectId) {
          await fetch(`http://localhost:5000/projects/${form.projectId}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: form.title, amount: form.amount, category: form.category })
          })
        } else {
          await fetch('http://localhost:5000/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, projectId: null })
          })
        }
      }
      setForm({ title: '', amount: '', category: '', projectId: '' })
      setShowForm(false)
      fetchExpenses()
    } catch (err) {
      alert('Failed to save expense. Check your server.')
    }
  }

  const handleEdit = (e) => {
    setForm({
      title: e.title,
      amount: e.amount,
      category: e.category || '',
      projectId: e.projectId || ''
    })
    setEditingId(e.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return
    try {
      await fetch(`http://localhost:5000/expenses/${id}`, { method: 'DELETE' })
      fetchExpenses()
    } catch {
      alert('Failed to delete expense. Check your server.')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ title: '', amount: '', category: '', projectId: '' })
  }

  const markAsPaid = (projectId) => {
    const updated = [...paidInvoices, projectId]
    setPaidInvoices(updated)
    localStorage.setItem('ndiwanjo_paid_invoices', JSON.stringify(updated))
  }

  const unmarkAsPaid = (projectId) => {
    const updated = paidInvoices.filter(id => id !== projectId)
    setPaidInvoices(updated)
    localStorage.setItem('ndiwanjo_paid_invoices', JSON.stringify(updated))
  }

  // Build invoice list from projects with outstanding balances
  const invoices = projects
    .filter(p => p.quotation)
    .map((p, i) => {
      const totalPaid = (p.payments || []).reduce((s, pay) => s + Number(pay.amount || 0), 0)
      const outstanding = Number(p.quotation) - totalPaid
      return {
        id: p.id,
        invoiceNo: `INV-${String(i + 1).padStart(4, '0')}`,
        projectName: p.name,
        customerName: p.customer?.name || '—',
        quotation: Number(p.quotation),
        totalPaid,
        outstanding,
        status: paidInvoices.includes(p.id) ? 'paid' : outstanding <= 0 ? 'paid' : 'outstanding',
      }
    })

  const overdueInvoices = invoices.filter(inv => inv.status === 'outstanding')
  const paidInvoiceList = invoices.filter(inv => inv.status === 'paid')
  const totalOutstanding = overdueInvoices.reduce((s, inv) => s + inv.outstanding, 0)

  const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  const pending = expenses.filter(e => e.category === 'pending').reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  const paid = expenses.filter(e => e.category === 'paid').reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  const materials = expenses.filter(e => e.category === 'materials').reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Expenses & Invoices</h3>
          <p className="text-sm mt-0.5" style={{ color: '#4a6fa5' }}>{filtered.length} expense records · {overdueInvoices.length} outstanding invoices</p>
        </div>
        {activeTab === 'expenses' && (
          <button onClick={() => setShowForm(!showForm)}
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'linear-gradient(135deg, #c9a84c, #a8883a)', color: '#0a1628' }}>
            {showForm ? 'Cancel' : '+ Add Expense'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={fetchExpenses} className="underline hover:text-red-300">Retry</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: '#0d1f3c' }}>
        {[
          { id: 'expenses', label: '💰 Expenses', count: expenses.length },
          { id: 'invoices', label: '🧾 Invoice Tracker', count: overdueInvoices.length, alert: overdueInvoices.length > 0 },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            style={activeTab === tab.id ? {
              background: 'linear-gradient(135deg, #c9a84c, #a8883a)', color: '#0a1628'
            } : { color: '#8a9bb5' }}>
            {tab.label}
            <span className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: tab.alert ? '#ef4444' : '#1e3a5f', color: '#fff' }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── EXPENSES TAB ── */}
      {activeTab === 'expenses' && (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-xl p-5 border" style={{ backgroundColor: '#0d1f3c', borderColor: '#1e3a5f' }}>
              <p className="text-sm" style={{ color: '#4a6fa5' }}>Total Expenses</p>
              <p className="text-2xl font-bold text-white mt-1">KSh {total.toLocaleString()}</p>
            </div>
            <div className="rounded-xl p-5 border" style={{ backgroundColor: '#0d1f3c', borderColor: '#ef444430' }}>
              <p className="text-sm" style={{ color: '#4a6fa5' }}>Pending</p>
              <p className="text-2xl font-bold text-red-400 mt-1">KSh {pending.toLocaleString()}</p>
            </div>
            <div className="rounded-xl p-5 border" style={{ backgroundColor: '#0d1f3c', borderColor: '#22c55e30' }}>
              <p className="text-sm" style={{ color: '#4a6fa5' }}>Paid</p>
              <p className="text-2xl font-bold text-green-400 mt-1">KSh {paid.toLocaleString()}</p>
            </div>
            <div className="rounded-xl p-5 border" style={{ backgroundColor: '#0d1f3c', borderColor: '#3b82f630' }}>
              <p className="text-sm" style={{ color: '#4a6fa5' }}>Materials</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">KSh {materials.toLocaleString()}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-3">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Search expenses..."
              className="flex-1 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2"
              style={{ backgroundColor: '#0d1f3c', border: '1px solid #1e3a5f', focusRingColor: '#c9a84c' }} />
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none"
              style={{ backgroundColor: '#0d1f3c', border: '1px solid #1e3a5f' }}>
              <option value="all">All Categories</option>
              {['materials', 'labour', 'equipment', 'transport', 'utilities', 'pending', 'paid'].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
              className="rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none"
              style={{ backgroundColor: '#0d1f3c', border: '1px solid #1e3a5f' }}>
              <option value="all">All Projects</option>
              {projects.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
            </select>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <div className="rounded-xl p-5 border space-y-3" style={{ backgroundColor: '#0d1f3c', borderColor: '#1e3a5f' }}>
              <h4 className="text-white font-semibold">{editingId ? 'Edit Expense' : 'Add New Expense'}</h4>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Expense title *" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="rounded-lg px-4 py-2.5 text-sm text-white"
                  style={{ backgroundColor: '#1e3a5f', border: '1px solid #2a4a7f' }} />
                <input placeholder="Amount (KSh) *" type="number" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="rounded-lg px-4 py-2.5 text-sm text-white"
                  style={{ backgroundColor: '#1e3a5f', border: '1px solid #2a4a7f' }} />
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="rounded-lg px-4 py-2.5 text-sm text-white"
                  style={{ backgroundColor: '#1e3a5f', border: '1px solid #2a4a7f' }}>
                  <option value="">Category (optional)</option>
                  {['materials', 'labour', 'equipment', 'transport', 'utilities', 'pending', 'paid'].map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
                <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}
                  className="rounded-lg px-4 py-2.5 text-sm text-white"
                  style={{ backgroundColor: '#1e3a5f', border: '1px solid #2a4a7f' }}>
                  <option value="">No project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSubmit}
                  className="px-6 py-2.5 rounded-lg text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg, #c9a84c, #a8883a)', color: '#0a1628' }}>
                  {editingId ? 'Save Changes' : 'Add Expense'}
                </button>
                <button onClick={handleCancel}
                  className="px-6 py-2.5 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: '#1e3a5f', color: '#8a9bb5' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#1e3a5f' }}>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#0a1628' }}>
                  {['Title', 'Amount', 'Category', 'Project', 'Date', 'Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4a6fa5' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-sm" style={{ color: '#4a6fa5' }}>Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-sm" style={{ color: '#4a6fa5' }}>No expenses found.</td></tr>
                ) : filtered.map((e, i) => (
                  <tr key={e.id} className="border-t" style={{ borderColor: '#1e3a5f', backgroundColor: i % 2 === 0 ? '#0d1f3c' : 'transparent' }}>
                    <td className="px-6 py-4 text-white text-sm font-medium">{e.title}</td>
                    <td className="px-6 py-4 font-bold text-sm" style={{ color: '#c9a84c' }}>KSh {Number(e.amount).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        e.category === 'materials' ? 'bg-blue-500/20 text-blue-400' :
                        e.category === 'labour' ? 'bg-purple-500/20 text-purple-400' :
                        e.category === 'equipment' ? 'bg-yellow-500/20 text-yellow-400' :
                        e.category === 'paid' ? 'bg-green-500/20 text-green-400' :
                        e.category === 'pending' ? 'bg-red-500/20 text-red-400' :
                        'bg-zinc-700 text-zinc-400'
                      }`}>{e.category || 'uncategorized'}</span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#8a9bb5' }}>
                      {e.project?.name ? <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: '#1e3a5f', color: '#c9a84c' }}>{e.project.name}</span> : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#6b7a8d' }}>{e.createdAt ? new Date(e.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4 flex gap-3">
                      <button onClick={() => handleEdit(e)} className="text-sm font-medium" style={{ color: '#c9a84c' }}>Edit</button>
                      <button onClick={() => handleDelete(e.id)} className="text-red-400 text-sm font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="border-t-2" style={{ borderColor: '#1e3a5f', backgroundColor: '#0a1628' }}>
                    <td className="px-6 py-3 text-white font-bold text-sm">Total ({filtered.length})</td>
                    <td className="px-6 py-3 font-bold text-sm" style={{ color: '#c9a84c' }}>
                      KSh {filtered.reduce((sum, e) => sum + (Number(e.amount) || 0), 0).toLocaleString()}
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ── INVOICE TRACKER TAB ── */}
      {activeTab === 'invoices' && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl p-5 border" style={{ backgroundColor: '#0d1f3c', borderColor: '#ef444430' }}>
              <p className="text-sm" style={{ color: '#4a6fa5' }}>Outstanding Invoices</p>
              <p className="text-3xl font-bold text-red-400 mt-1">{overdueInvoices.length}</p>
            </div>
            <div className="rounded-xl p-5 border" style={{ backgroundColor: '#0d1f3c', borderColor: '#ef444430' }}>
              <p className="text-sm" style={{ color: '#4a6fa5' }}>Total Outstanding</p>
              <p className="text-2xl font-bold text-red-400 mt-1">KSh {totalOutstanding.toLocaleString()}</p>
            </div>
            <div className="rounded-xl p-5 border" style={{ backgroundColor: '#0d1f3c', borderColor: '#22c55e30' }}>
              <p className="text-sm" style={{ color: '#4a6fa5' }}>Paid Invoices</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{paidInvoiceList.length}</p>
            </div>
          </div>

          {/* Outstanding invoices */}
          {overdueInvoices.length > 0 && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#1e3a5f' }}>
              <div className="px-5 py-3 flex items-center gap-2" style={{ backgroundColor: '#1a0a0a' }}>
                <span className="text-red-400 font-semibold text-sm">🔴 Outstanding Invoices</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#0a1628' }}>
                    {['Invoice #', 'Project', 'Customer', 'Amount Due', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4a6fa5' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {overdueInvoices.map((inv, i) => (
                    <tr key={inv.id} className="border-t" style={{ borderColor: '#1e3a5f', backgroundColor: i % 2 === 0 ? '#0d1f3c' : 'transparent' }}>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: '#1e3a5f', color: '#c9a84c' }}>{inv.invoiceNo}</span>
                      </td>
                      <td className="px-5 py-4 text-white text-sm font-medium">{inv.projectName}</td>
                      <td className="px-5 py-4 text-sm" style={{ color: '#8a9bb5' }}>{inv.customerName}</td>
                      <td className="px-5 py-4">
                        <p className="text-red-400 font-bold text-sm">KSh {inv.outstanding.toLocaleString()}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#4a6fa5' }}>of KSh {inv.quotation.toLocaleString()}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => setReminderModal(inv)}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                            style={{ backgroundColor: '#1e3a5f', color: '#c9a84c' }}>
                            ✉️ Reminder
                          </button>
                          <button onClick={() => markAsPaid(inv.id)}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">
                            ✓ Mark Paid
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2" style={{ borderColor: '#1e3a5f', backgroundColor: '#0a1628' }}>
                    <td colSpan={3} className="px-5 py-3 text-white font-bold text-sm">Total Outstanding</td>
                    <td className="px-5 py-3 font-bold text-red-400 text-sm">KSh {totalOutstanding.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {overdueInvoices.length === 0 && (
            <div className="rounded-xl p-12 border text-center" style={{ backgroundColor: '#0d1f3c', borderColor: '#1e3a5f' }}>
              <p className="text-4xl mb-3">✅</p>
              <p className="text-white font-semibold">All invoices are paid!</p>
              <p className="text-sm mt-1" style={{ color: '#4a6fa5' }}>No outstanding balances found.</p>
            </div>
          )}

          {/* Paid invoices */}
          {paidInvoiceList.length > 0 && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#1e3a5f' }}>
              <div className="px-5 py-3" style={{ backgroundColor: '#0a2a0a' }}>
                <span className="text-green-400 font-semibold text-sm">✅ Paid Invoices</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#0a1628' }}>
                    {['Invoice #', 'Project', 'Customer', 'Contract Value', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4a6fa5' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paidInvoiceList.map((inv, i) => (
                    <tr key={inv.id} className="border-t" style={{ borderColor: '#1e3a5f', backgroundColor: i % 2 === 0 ? '#0d1f3c' : 'transparent' }}>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: '#1a3a1a', color: '#22c55e' }}>{inv.invoiceNo}</span>
                      </td>
                      <td className="px-5 py-4 text-white text-sm">{inv.projectName}</td>
                      <td className="px-5 py-4 text-sm" style={{ color: '#8a9bb5' }}>{inv.customerName}</td>
                      <td className="px-5 py-4 text-green-400 font-bold text-sm">KSh {inv.quotation.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        {paidInvoices.includes(inv.id) && (
                          <button onClick={() => unmarkAsPaid(inv.id)}
                            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                            style={{ backgroundColor: '#1e3a5f', color: '#6b7a8d' }}>
                            Undo
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Reminder Modal */}
      {reminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 space-y-4" style={{ backgroundColor: '#0a1628', border: '1px solid #1e3a5f' }}>
            <div className="flex justify-between items-center">
              <h4 className="text-white font-bold">Payment Reminder</h4>
              <button onClick={() => setReminderModal(null)} className="text-zinc-500 hover:text-white text-xl">×</button>
            </div>
            <p className="text-sm" style={{ color: '#8a9bb5' }}>Copy this message and send it to your client:</p>
            <div className="rounded-xl p-4 text-sm leading-relaxed" style={{ backgroundColor: '#1e3a5f', color: '#e2e8f0' }}>
              {`Dear ${reminderModal.customerName},\n\nThis is a friendly reminder regarding invoice ${reminderModal.invoiceNo} for the project "${reminderModal.projectName}".\n\nOutstanding Balance: KSh ${reminderModal.outstanding.toLocaleString()}\nTotal Contract Value: KSh ${reminderModal.quotation.toLocaleString()}\n\nKindly arrange payment at your earliest convenience.\n\nThank you for your continued partnership.\n\nRegards,\nNdiwanjo Construction`.split('\n').map((line, i) => (
                <span key={i}>{line}<br /></span>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => {
                navigator.clipboard.writeText(`Dear ${reminderModal.customerName},\n\nThis is a friendly reminder regarding invoice ${reminderModal.invoiceNo} for the project "${reminderModal.projectName}".\n\nOutstanding Balance: KSh ${reminderModal.outstanding.toLocaleString()}\nTotal Contract Value: KSh ${reminderModal.quotation.toLocaleString()}\n\nKindly arrange payment at your earliest convenience.\n\nThank you for your continued partnership.\n\nRegards,\nNdiwanjo Construction`)
                setReminderModal(null)
              }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg, #c9a84c, #a8883a)', color: '#0a1628' }}>
                📋 Copy Message
              </button>
              <button onClick={() => setReminderModal(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ backgroundColor: '#1e3a5f', color: '#8a9bb5' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}