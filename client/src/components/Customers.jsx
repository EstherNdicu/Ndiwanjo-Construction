import { useState, useEffect } from 'react'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' })

  useEffect(() => { fetchCustomers() }, [])

  const fetchCustomers = async () => {
    const res = await fetch('http://localhost:5000/customers')
    setCustomers(await res.json())
  }

  const handleSubmit = async () => {
    await fetch('http://localhost:5000/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setForm({ name: '', email: '', phone: '', address: '' })
    setShowForm(false)
    fetchCustomers()
  }

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/customers/${id}`, { method: 'DELETE' })
    fetchCustomers()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Customers</h3>
          <p className="text-zinc-500 text-sm">{customers.length} total customers</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
          {showForm ? 'Cancel' : '+ Add Customer'}
        </button>
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 grid grid-cols-2 gap-4">
          {['name', 'email', 'phone', 'address'].map((field) => (
            <input key={field}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          ))}
          <div className="col-span-2">
            <button onClick={handleSubmit}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              Save Customer
            </button>
          </div>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-800">
              {['Name', 'Email', 'Phone', 'Address', 'Action'].map((h) => (
                <th key={h} className="px-6 py-4 text-zinc-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-12 text-center text-zinc-600">No customers yet. Add one above.</td></tr>
            ) : customers.map((c) => (
              <tr key={c.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 text-sm font-bold">
                      {c.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-zinc-400">{c.email}</td>
                <td className="px-6 py-4 text-zinc-400">{c.phone}</td>
                <td className="px-6 py-4 text-zinc-400">{c.address}</td>
                <td className="px-6 py-4">
                  <button onClick={() => handleDelete(c.id)}
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