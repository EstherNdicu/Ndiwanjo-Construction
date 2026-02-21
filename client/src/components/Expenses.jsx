import { useState, useEffect } from 'react'

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ title: '', amount: '', category: '', projectName: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchExpenses() }, [])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:5000/expenses')
      const data = await res.json()
      setExpenses(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      console.error('Failed to fetch expenses:', err)
      setExpenses([])
      setError('Could not connect to the server. Make sure your backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = expenses.filter(e => {
    const matchesSearch =
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.projectName?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = filterCategory === 'all' || e.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const handleSubmit = async () => {
    if (!form.title.trim()) return alert('Expense title is required.')
    if (!form.amount) return alert('Amount is required.')
    try {
      if (editingId) {
        await fetch(`http://localhost:5000/expenses/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })
        setEditingId(null)
      } else {
        await fetch('http://localhost:5000/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })
      }
      setForm({ title: '', amount: '', category: '', projectName: '' })
      setShowForm(false)
      fetchExpenses()
    } catch (err) {
      console.error('Failed to save expense:', err)
      alert('Failed to save expense. Check your server.')
    }
  }

  const handleEdit = (e) => {
    setForm({ title: e.title, amount: e.amount, category: e.category, projectName: e.projectName })
    setEditingId(e.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return
    try {
      await fetch(`http://localhost:5000/expenses/${id}`, { method: 'DELETE' })
      fetchExpenses()
    } catch (err) {
      console.error('Failed to delete expense:', err)
      alert('Failed to delete expense. Check your server.')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ title: '', amount: '', category: '', projectName: '' })
  }

  const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  const pending = expenses.filter(e => e.category === 'pending').reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  const paid = expenses.filter(e => e.category === 'paid').reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Expenses</h3>
          <p className="text-zinc-500 text-sm">{filtered.length} of {expenses.length} records</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
          {showForm ? 'Cancel' : '+ Add Expense'}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={fetchExpenses} className="underline hover:text-red-300">Retry</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-zinc-500 text-sm">Total Expenses</p>
          <p className="text-3xl font-bold text-white mt-1">${total.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-zinc-500 text-sm">Pending Payments</p>
          <p className="text-3xl font-bold text-red-400 mt-1">${pending.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-zinc-500 text-sm">Paid</p>
          <p className="text-3xl font-bold text-green-400 mt-1">${paid.toLocaleString()}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-3 text-zinc-500">🔍</span>
          <input
            placeholder="Search by title or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-4 top-3 text-zinc-500 hover:text-white">✕</button>
          )}
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500">
          <option value="all">All Categories</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="materials">Materials</option>
          <option value="labour">Labour</option>
          <option value="equipment">Equipment</option>
          <option value="other">Other</option>
        </select>
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 grid grid-cols-2 gap-4">
          <h4 className="col-span-2 text-white font-semibold">
            {editingId ? 'Edit Expense' : 'Add New Expense'}
          </h4>
          <input placeholder="Expense Title" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <input placeholder="Amount" type="number" value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="">Select Category</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="materials">Materials</option>
            <option value="labour">Labour</option>
            <option value="equipment">Equipment</option>
            <option value="other">Other</option>
          </select>
          <input placeholder="Project Name (optional)" value={form.projectName}
            onChange={(e) => setForm({ ...form, projectName: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <div className="col-span-2 flex gap-3">
            <button onClick={handleSubmit}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              {editingId ? 'Update Expense' : 'Save Expense'}
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
              {['Title', 'Amount', 'Category', 'Project', 'Date', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-4 text-zinc-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="px-6 py-12 text-center text-zinc-600">Loading expenses...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-12 text-center text-zinc-600">
                {search ? `No results for "${search}"` : 'No expenses yet.'}
              </td></tr>
            ) : filtered.map((e) => (
              <tr key={e.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 text-white font-medium">{e.title}</td>
                <td className="px-6 py-4 text-orange-400 font-bold">${Number(e.amount).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    e.category === 'paid' ? 'bg-green-500/20 text-green-400' :
                    e.category === 'pending' ? 'bg-red-500/20 text-red-400' :
                    e.category === 'materials' ? 'bg-blue-500/20 text-blue-400' :
                    e.category === 'labour' ? 'bg-purple-500/20 text-purple-400' :
                    e.category === 'equipment' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-zinc-700 text-zinc-400'
                  }`}>{e.category || 'uncategorized'}</span>
                </td>
                <td className="px-6 py-4 text-zinc-400">{e.projectName || '-'}</td>
                <td className="px-6 py-4 text-zinc-400">{e.createdAt ? new Date(e.createdAt).toLocaleDateString() : '-'}</td>
                <td className="px-6 py-4 flex gap-3">
                  <button onClick={() => handleEdit(e)}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">Edit</button>
                  <button onClick={() => handleDelete(e.id)}
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