import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const pieColors = ['#f97316', '#22c55e', '#ef4444']

export default function Dashboard({ stats }) {
  const [projects, setProjects] = useState([])
  const [inventory, setInventory] = useState([])
  const [activities, setActivities] = useState([])
  const [expenses, setExpenses] = useState([])

  useEffect(() => {
    fetch('http://localhost:5000/projects').then(r => r.json()).then(setProjects)
    fetch('http://localhost:5000/inventory').then(r => r.json()).then(setInventory)
    fetch('http://localhost:5000/activities').then(r => r.json()).then(setActivities)
    fetch('http://localhost:5000/expenses').then(r => r.json()).then(setExpenses)
  }, [])

  // Financial summary
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const pendingPayments = expenses.filter(e => e.category === 'pending').reduce((sum, e) => sum + e.amount, 0)

  // Monthly expenses for bar chart
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const barData = monthNames.map((month, i) => ({
    month,
    amount: expenses.filter(e => new Date(e.createdAt).getMonth() === i).reduce((sum, e) => sum + e.amount, 0)
  }))

  // Task summary pie chart
  const pending = projects.filter(p => p.status === 'pending').length
  const active = projects.filter(p => p.status === 'active').length
  const completed = projects.filter(p => p.status === 'completed').length
  const pieData = [
    { name: 'In Progress', value: active || 0 },
    { name: 'Completed', value: completed || 0 },
    { name: 'Pending', value: pending || 0 },
  ]

  const getProgress = (status) => {
    if (status === 'completed') return 100
    if (status === 'active') return 65
    return 20
  }

  const getStatusColor = (status) => {
    if (status === 'completed') return 'bg-green-500'
    if (status === 'active') return 'bg-orange-500'
    return 'bg-yellow-500'
  }

  const timeAgo = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
    return `${Math.floor(diff / 86400)} days ago`
  }

  return (
    <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-600 rounded-xl p-5 relative overflow-hidden">
          <p className="text-blue-200 text-sm font-medium">Active Projects</p>
          <p className="text-5xl font-bold text-white mt-2">{stats.projects}</p>
          <div className="absolute right-4 bottom-4 text-6xl opacity-20">🏗️</div>
        </div>
        <div className="bg-orange-500 rounded-xl p-5 relative overflow-hidden">
          <p className="text-orange-100 text-sm font-medium">Total Employees</p>
          <p className="text-5xl font-bold text-white mt-2">{stats.employees}</p>
          <div className="absolute right-4 bottom-4 text-6xl opacity-20">👷</div>
        </div>
        <div className="bg-green-600 rounded-xl p-5 relative overflow-hidden">
          <p className="text-green-100 text-sm font-medium">Total Customers</p>
          <p className="text-5xl font-bold text-white mt-2">{stats.customers}</p>
          <div className="absolute right-4 bottom-4 text-6xl opacity-20">👥</div>
        </div>
        <div className="bg-red-500 rounded-xl p-5 relative overflow-hidden">
          <p className="text-red-100 text-sm font-medium">Inventory Items</p>
          <p className="text-5xl font-bold text-white mt-2">{stats.inventory}</p>
          <div className="absolute right-4 bottom-4 text-6xl opacity-20">📦</div>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-3 gap-4">

        {/* Project Overview */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Project Overview</h3>
          {projects.length === 0 ? (
            <p className="text-zinc-600 text-sm">No projects yet.</p>
          ) : (
            <div className="space-y-4">
              {projects.slice(0, 3).map((p) => (
                <div key={p.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-white font-medium truncate">{p.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ml-2 whitespace-nowrap ${
                      p.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      p.status === 'active' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>{p.status}</span>
                  </div>
                  <div className="w-full bg-zinc-700 rounded-full h-2">
                    <div className={`${getStatusColor(p.status)} h-2 rounded-full`}
                      style={{ width: `${getProgress(p.status)}%` }}></div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{getProgress(p.status)}% complete</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Task Summary */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Task Summary</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={pieColors[index]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pieColors[i] }}></div>
                <span className="text-xs text-zinc-400">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-2">Financial Summary</h3>
          <div className="flex justify-between mb-4">
            <div>
              <p className="text-xs text-zinc-500">Total Expenses</p>
              <p className="text-2xl font-bold text-white">${totalExpenses.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Pending Payments</p>
              <p className="text-2xl font-bold text-white">${pendingPayments.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mb-2">Monthly Expenses</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={barData}>
              <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="amount" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-4">

        {/* Recent Activities */}
        <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Recent Activities</h3>
          {activities.length === 0 ? (
            <p className="text-zinc-600 text-sm">No activities yet. Start adding projects, inventory or expenses.</p>
          ) : (
            <div className="space-y-1">
              {activities.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                      <span className="text-green-400 text-xs">✓</span>
                    </div>
                    <p className="text-sm text-zinc-300">
                      {a.description} <span className="text-white font-semibold">{a.bold}</span>
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500 whitespace-nowrap ml-4">{timeAgo(a.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Equipment Inventory */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Equipment Inventory</h3>
          {inventory.length === 0 ? (
            <p className="text-zinc-600 text-sm">No inventory items yet.</p>
          ) : (
            <div className="space-y-3">
              {inventory.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b border-zinc-800">
                  <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-xl">
                    📦
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">{item.name}</p>
                    <p className="text-xs text-zinc-500">{item.unit || 'units'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${item.quantity < 10 ? 'text-red-400' : 'text-white'}`}>
                      {item.quantity}
                    </p>
                    <p className="text-xs text-zinc-500">In Stock</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}