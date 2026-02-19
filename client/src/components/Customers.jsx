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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">All Customers</h3>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {showForm ? 'Cancel' : '+ Add Customer'}
        </button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-2 gap-4">
          {['name', 'email', 'phone', 'address'].map((field) => (
            <input key={field} placeholder={field.charAt(0).toUpperCase() + field.slice(1)} value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          ))}
          <div className="col-span-2">
            <button onClick={handleSubmit} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Save Customer</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>{['Name', 'Email', 'Phone', 'Address', 'Action'].map((h) => (
              <th key={h} className="px-6 py-3 text-gray-600 text-sm font-semibold">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No customers yet.</td></tr>
            ) : customers.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{c.name}</td>
                <td className="px-6 py-4">{c.email}</td>
                <td className="px-6 py-4">{c.phone}</td>
                <td className="px-6 py-4">{c.address}</td>
                <td className="px-6 py-4"><button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}