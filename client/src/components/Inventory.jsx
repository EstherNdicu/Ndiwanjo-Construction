import { useState, useEffect } from 'react'

const LOW_STOCK_THRESHOLD = 10

export default function Inventory() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', quantity: '', unit: '', price: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterStock, setFilterStock] = useState('all')

  useEffect(() => { fetchItems() }, [])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:5000/inventory')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      setItems([])
      setError('Could not connect to the server. Make sure your backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = items.filter(item => {
    const matchesSearch =
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.unit?.toLowerCase().includes(search.toLowerCase())
    const matchesStock =
      filterStock === 'all' ||
      (filterStock === 'low' && Number(item.quantity) < LOW_STOCK_THRESHOLD) ||
      (filterStock === 'ok' && Number(item.quantity) >= LOW_STOCK_THRESHOLD)
    return matchesSearch && matchesStock
  })

  const handleSubmit = async () => {
    if (!form.name.trim()) return alert('Item name is required.')
    try {
      if (editingId) {
        await fetch(`http://localhost:5000/inventory/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })
        setEditingId(null)
      } else {
        await fetch('http://localhost:5000/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })
      }
      setForm({ name: '', quantity: '', unit: '', price: '' })
      setShowForm(false)
      fetchItems()
    } catch (err) {
      alert('Failed to save item. Check your server.')
    }
  }

  const handleEdit = (item) => {
    setForm({ name: item.name, quantity: item.quantity, unit: item.unit || '', price: item.price || '' })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return
    try {
      await fetch(`http://localhost:5000/inventory/${id}`, { method: 'DELETE' })
      fetchItems()
    } catch {
      alert('Failed to delete item. Check your server.')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ name: '', quantity: '', unit: '', price: '' })
  }

  const totalValue = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.price || 0)), 0)
  const totalItems = items.length
  const lowStockItems = items.filter(i => Number(i.quantity) < LOW_STOCK_THRESHOLD)
  const totalUnits = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Inventory</h3>
          <p className="text-zinc-500 text-sm">{filtered.length} of {items.length} items</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
          {showForm ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={fetchItems} className="underline hover:text-red-300">Retry</button>
        </div>
      )}

      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-5 py-4 flex items-start gap-3">
          <span className="text-yellow-400 text-xl">⚠️</span>
          <div>
            <p className="text-yellow-400 font-semibold text-sm">Low Stock Alert</p>
            <p className="text-zinc-400 text-sm mt-0.5">
              {lowStockItems.map(i => i.name).join(', ')} {lowStockItems.length === 1 ? 'is' : 'are'} running low (below {LOW_STOCK_THRESHOLD} units).
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-zinc-500 text-sm">Total Items</p>
          <p className="text-2xl font-bold text-white mt-1">{totalItems}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-zinc-500 text-sm">Total Units</p>
          <p className="text-2xl font-bold text-white mt-1">{totalUnits.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-zinc-500 text-sm">Total Stock Value</p>
          <p className="text-2xl font-bold text-green-400 mt-1">KSh {totalValue.toLocaleString()}</p>
        </div>
        <div className={`border rounded-xl p-5 ${lowStockItems.length > 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-zinc-900 border-zinc-800'}`}>
          <p className="text-zinc-500 text-sm">Low Stock</p>
          <p className={`text-2xl font-bold mt-1 ${lowStockItems.length > 0 ? 'text-yellow-400' : 'text-zinc-400'}`}>
            {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-3 text-zinc-500">🔍</span>
          <input
            placeholder="Search by name or unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-4 top-3 text-zinc-500 hover:text-white">✕</button>
          )}
        </div>
        <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500">
          <option value="all">All Stock Levels</option>
          <option value="low">Low Stock Only</option>
          <option value="ok">Sufficient Stock</option>
        </select>
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 grid grid-cols-2 gap-4">
          <h4 className="col-span-2 text-white font-semibold">
            {editingId ? 'Edit Item' : 'Add New Item'}
          </h4>
          <input placeholder="Item Name *" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <input placeholder="Unit (e.g. bags, pieces, litres)" value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <input placeholder="Quantity *" type="number" value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <input placeholder="Unit Price (KSh)" type="number" value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <div className="col-span-2 flex gap-3">
            <button onClick={handleSubmit}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              {editingId ? 'Update Item' : 'Save Item'}
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
              {['Item', 'Quantity', 'Unit', 'Unit Price', 'Total Value', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-4 text-zinc-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="px-6 py-12 text-center text-zinc-600">Loading inventory...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="7" className="px-6 py-12 text-center text-zinc-600">
                {search ? `No results for "${search}"` : 'No items yet.'}
              </td></tr>
            ) : filtered.map((item) => {
              const isLow = Number(item.quantity) < LOW_STOCK_THRESHOLD
              const totalVal = Number(item.quantity) * Number(item.price || 0)
              return (
                <tr key={item.id} className={`border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors ${isLow ? 'bg-yellow-500/5' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-sm">📦</div>
                      <span className="text-white font-medium">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-lg font-bold ${isLow ? 'text-yellow-400' : 'text-white'}`}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-400">{item.unit || '—'}</td>
                  <td className="px-6 py-4 text-zinc-400">
                    {item.price ? `KSh ${Number(item.price).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-green-400 font-medium">
                    {totalVal > 0 ? `KSh ${totalVal.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {isLow ? (
                      <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full font-medium">⚠️ Low Stock</span>
                    ) : (
                      <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full font-medium">✓ In Stock</span>
                    )}
                  </td>
                  <td className="px-6 py-4 flex gap-3">
                    <button onClick={() => handleEdit(item)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">Edit</button>
                    <button onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-400 text-sm font-medium transition-colors">Delete</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-zinc-700 bg-zinc-800/50">
                <td className="px-6 py-3 text-white font-bold text-sm" colSpan="4">Total Stock Value</td>
                <td className="px-6 py-3 text-green-400 font-bold text-sm">
                  KSh {filtered.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.price || 0)), 0).toLocaleString()}
                </td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}