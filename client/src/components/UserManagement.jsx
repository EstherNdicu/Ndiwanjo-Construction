import { useState, useEffect } from 'react'

const ROLES = [
  { value: 'admin', label: 'Admin', desc: 'Full access to everything', color: 'text-red-400 bg-red-500/10' },
  { value: 'manager', label: 'Manager', desc: 'Projects, employees, reports', color: 'text-blue-400 bg-blue-500/10' },
  { value: 'accountant', label: 'Accountant', desc: 'Expenses, payments, reports', color: 'text-green-400 bg-green-500/10' },
  { value: 'viewer', label: 'Viewer', desc: 'Read-only access', color: 'text-zinc-400 bg-zinc-500/10' },
]

const roleStyle = (role) => ROLES.find(r => r.value === role)?.color || 'text-zinc-400 bg-zinc-500/10'
const roleLabel = (role) => ROLES.find(r => r.value === role)?.label || role

const emptyForm = { name: '', email: '', password: '', role: 'viewer', isActive: true }

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch('http://localhost:5000/users')
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => {
    setEditingUser(null)
    setForm(emptyForm)
    setError('')
    setShowPassword(false)
    setShowForm(true)
  }

  const openEdit = (user) => {
    setEditingUser(user)
    setForm({ name: user.name, email: user.email, password: '', role: user.role, isActive: user.isActive })
    setError('')
    setShowPassword(false)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Name is required.')
    if (!form.email.trim()) return setError('Email is required.')
    if (!editingUser && !form.password) return setError('Password is required for new users.')
    if (form.password && form.password.length < 6) return setError('Password must be at least 6 characters.')

    setSaving(true)
    setError('')
    try {
      const url = editingUser ? `http://localhost:5000/users/${editingUser.id}` : 'http://localhost:5000/users'
      const method = editingUser ? 'PUT' : 'POST'
      const body = { ...form }
      if (editingUser && !body.password) delete body.password

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'Failed to save user.')
      setShowForm(false)
      fetchUsers()
    } catch {
      setError('Failed to save user.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (currentUser && id === currentUser.id) return setError("You can't delete your own account.")
    try {
      await fetch(`http://localhost:5000/users/${id}`, { method: 'DELETE' })
      setConfirmDelete(null)
      fetchUsers()
    } catch {
      setError('Failed to delete user.')
    }
  }

  const toggleActive = async (user) => {
    if (currentUser && user.id === currentUser.id) return
    try {
      await fetch(`http://localhost:5000/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, isActive: !user.isActive }),
      })
      fetchUsers()
    } catch {}
  }

  const isSelf = (user) => currentUser && user.id === currentUser.id

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-white font-bold text-lg">User Management</h3>
          <p className="text-xs mt-0.5" style={{ color: '#4a6fa5' }}>Manage system users and their access roles</p>
        </div>
        <button onClick={openAdd}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #c9a84c, #a8883a)', color: '#0a1628' }}>
          + Add User
        </button>
      </div>

      {error && !showForm && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {/* Role legend */}
      <div className="grid grid-cols-4 gap-3">
        {ROLES.map(r => (
          <div key={r.value} className="rounded-xl p-4 border" style={{ backgroundColor: '#0d1f3c', borderColor: '#1e3a5f' }}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.color}`}>{r.label}</span>
              <span className="text-xs" style={{ color: '#4a6fa5' }}>
                {users.filter(u => u.role === r.value).length} user{users.filter(u => u.role === r.value).length !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs" style={{ color: '#6b7a8d' }}>{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: '#0d1f3c', borderColor: '#1e3a5f' }}>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: '#0a1628' }}>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4a6fa5' }}>User</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4a6fa5' }}>Email</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4a6fa5' }}>Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4a6fa5' }}>Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#4a6fa5' }}>Joined</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-sm" style={{ color: '#4a6fa5' }}>Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-sm" style={{ color: '#4a6fa5' }}>No users found.</td></tr>
            ) : users.map((user, i) => (
              <tr key={user.id} className="border-t" style={{ borderColor: '#1e3a5f' }}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: isSelf(user) ? 'linear-gradient(135deg, #c9a84c, #a8883a)' : '#1e3a5f', color: isSelf(user) ? '#0a1628' : '#c9a84c' }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{user.name}</p>
                      {isSelf(user) && <p className="text-xs" style={{ color: '#c9a84c' }}>You</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm" style={{ color: '#8a9bb5' }}>{user.email}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleStyle(user.role)}`}>
                    {roleLabel(user.role)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <button onClick={() => toggleActive(user)} disabled={isSelf(user)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                      user.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    } ${isSelf(user) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}>
                    {user.isActive ? '● Active' : '○ Disabled'}
                  </button>
                </td>
                <td className="px-5 py-4 text-sm" style={{ color: '#6b7a8d' }}>
                  {new Date(user.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => openEdit(user)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                      style={{ backgroundColor: '#1e3a5f', color: '#c9a84c' }}>
                      Edit
                    </button>
                    {!isSelf(user) && (
                      <button onClick={() => setConfirmDelete(user)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors bg-red-500/10 text-red-400 hover:bg-red-500/20">
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ backgroundColor: '#0a1628', border: '1px solid #1e3a5f' }}>
            <div className="flex justify-between items-center">
              <h4 className="text-white font-bold text-base">{editingUser ? 'Edit User' : 'Add New User'}</h4>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white text-xl">×</button>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2.5 text-sm">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#8a9bb5' }}>Full Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. John Kamau"
                  className="w-full rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  style={{ backgroundColor: '#1e3a5f', border: '1px solid #2a4a7f' }} />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#8a9bb5' }}>Email Address *</label>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  type="email" placeholder="e.g. john@ndiwanjo.co.ke"
                  className="w-full rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  style={{ backgroundColor: '#1e3a5f', border: '1px solid #2a4a7f' }} />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#8a9bb5' }}>
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <div className="relative">
                  <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={editingUser ? 'Enter new password to change' : 'Min. 6 characters'}
                    className="w-full rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50 pr-12"
                    style={{ backgroundColor: '#1e3a5f', border: '1px solid #2a4a7f' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                    style={{ color: '#4a6fa5' }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#8a9bb5' }}>Role *</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })}
                      className="text-left px-3 py-2.5 rounded-lg border transition-all"
                      style={form.role === r.value ? {
                        backgroundColor: '#c9a84c20',
                        borderColor: '#c9a84c',
                      } : {
                        backgroundColor: '#1e3a5f',
                        borderColor: '#2a4a7f',
                      }}>
                      <p className={`text-xs font-bold ${form.role === r.value ? 'text-yellow-400' : 'text-white'}`}>{r.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#6b7a8d' }}>{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {editingUser && (
                <div className="flex items-center justify-between py-2 px-4 rounded-lg" style={{ backgroundColor: '#1e3a5f' }}>
                  <div>
                    <p className="text-white text-sm font-medium">Account Active</p>
                    <p className="text-xs" style={{ color: '#6b7a8d' }}>Disabled users cannot log in</p>
                  </div>
                  <button onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className="w-11 h-6 rounded-full transition-colors relative"
                    style={{ backgroundColor: form.isActive ? '#c9a84c' : '#1e3a5f', border: '1px solid #2a4a7f' }}>
                    <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
                      style={{ left: form.isActive ? '22px' : '2px' }}></span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ backgroundColor: '#1e3a5f', color: '#8a9bb5' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{ background: 'linear-gradient(135deg, #c9a84c, #a8883a)', color: '#0a1628', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ backgroundColor: '#0a1628', border: '1px solid #1e3a5f' }}>
            <div className="text-center">
              <p className="text-4xl mb-3">⚠️</p>
              <h4 className="text-white font-bold text-base">Delete User?</h4>
              <p className="text-sm mt-2" style={{ color: '#8a9bb5' }}>
                Are you sure you want to delete <span className="text-white font-semibold">{confirmDelete.name}</span>? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ backgroundColor: '#1e3a5f', color: '#8a9bb5' }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete.id)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}