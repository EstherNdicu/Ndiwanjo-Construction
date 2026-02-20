import { useState, useEffect } from 'react'

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: '', department: '', salary: '' })

  useEffect(() => { fetchEmployees() }, [])

  const fetchEmployees = async () => {
    const res = await fetch('http://localhost:5000/employees')
    setEmployees(await res.json())
  }

  const handleSubmit = async () => {
    if (editingId) {
      await fetch(`http://localhost:5000/employees/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      setEditingId(null)
    } else {
      await fetch('http://localhost:5000/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
    }
    setForm({ name: '', email: '', phone: '', role: '', department: '', salary: '' })
    setShowForm(false)
    fetchEmployees()
  }

  const handleEdit = (emp) => {
    setForm({ name: emp.name, email: emp.email, phone: emp.phone, role: emp.role, department: emp.department, salary: emp.salary })
    setEditingId(emp.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5000/employees/${id}`, { method: 'DELETE' })
    fetchEmployees()
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ name: '', email: '', phone: '', role: '', department: '', salary: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Employees</h3>
          <p className="text-zinc-500 text-sm">{employees.length} total employees</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
          {showForm ? 'Cancel' : '+ Add Employee'}
        </button>
      </div>

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 grid grid-cols-2 gap-4">
          <h4 className="col-span-2 text-white font-semibold">
            {editingId ? 'Edit Employee' : 'Add New Employee'}
          </h4>
          {['name', 'email', 'phone', 'role', 'department', 'salary'].map((field) => (
            <input key={field}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          ))}
          <div className="col-span-2 flex gap-3">
            <button onClick={handleSubmit}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              {editingId ? 'Update Employee' : 'Save Employee'}
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
              {['Name', 'Email', 'Phone', 'Role', 'Department', 'Salary', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-4 text-zinc-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr><td colSpan="7" className="px-6 py-12 text-center text-zinc-600">No employees yet. Add one above.</td></tr>
            ) : employees.map((emp) => (
              <tr key={emp.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 text-sm font-bold">
                      {emp.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-medium">{emp.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-zinc-400">{emp.email}</td>
                <td className="px-6 py-4 text-zinc-400">{emp.phone}</td>
                <td className="px-6 py-4">
                  <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">{emp.role}</span>
                </td>
                <td className="px-6 py-4 text-zinc-400">{emp.department}</td>
                <td className="px-6 py-4 text-green-400 font-medium">${emp.salary}</td>
                <td className="px-6 py-4 flex gap-3">
                  <button onClick={() => handleEdit(emp)}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(emp.id)}
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