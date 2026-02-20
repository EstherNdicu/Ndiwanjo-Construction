import { useState, useEffect } from 'react'

export default function Inventory() {
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', quantity: '', unit: '', price: '' })

  useEffect(() => { fetchItems() }, [])

  const fetchItems = async () => {
    const res = await fetch('http://localhost:5000/inventory')
    setItems(await res.json())
  }

  const handleSubmit = async () => {
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
  }

  const handleEdit = (item) => {
    setForm({ name: item.name, quantity: item.quantity, unit: item.unit, price: item.price })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/inventory/${id}`, { method: 'DELETE' })
    fetchItems()
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ name: '', quantity: '', unit: '', price: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Inventory</h3>
          <p className="text-zinc-500 text-sm">{items.length} total items</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
          {showForm ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 grid grid-cols-2 gap-4">
          <h4 className="col-span-2 text-white font-semibold">
            {editingId ? 'Edit Item' : 'Add New Item'}
          </h4>
          {['name', 'quantity', 'unit', 'price'].map((field) => (
            <input key={field}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          ))}
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
              {['Item', 'Quantity', 'Unit', 'Price', 'Total Value', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-4 text-zinc-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-12 text-center text-zinc-600">No items yet.</td></tr>
            ) : items.map((item) => (
              <tr key={item.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-sm">
                      📦
                    </div>
                    <span className="text-white font-medium">{item.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-bold ${item.quantity < 10 ? 'text-red-400' : 'text-white'}`}>
                    {item.quantity}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-400">{item.unit}</td>
                <td className="px-6 py-4 text-zinc-400">${item.price}</td>
                <td className="px-6 py-4 text-green-400 font-medium">
                  ${(item.quantity * item.price).toFixed(2)}
                </td>
                <td className="px-6 py-4 flex gap-3">
                  <button onClick={() => handleEdit(item)}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(item.id)}
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