import { useState } from 'react'

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const handleLogin = async () => {
    const res = await fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (res.ok) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('name', data.name)
      onLogin(data.name)
    } else {
      setError(data.message)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-2xl">
            🏗️
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Ndiwanjo Construction</h1>
            <p className="text-zinc-500 text-xs">Management System</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-zinc-500 text-sm mb-6">Sign in to your account to continue</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-zinc-400 text-xs font-medium mb-1.5 block">Email Address</label>
              <input type="email" placeholder="admin@ndiwanjo.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
            </div>
            <div>
              <label className="text-zinc-400 text-xs font-medium mb-1.5 block">Password</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
            </div>
            <button onClick={handleLogin}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors mt-2">
              Sign In
            </button>
          </div>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          Ndiwanjo Construction © 2026. All rights reserved.
        </p>
      </div>
    </div>
  )
}