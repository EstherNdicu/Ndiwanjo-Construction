import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const pieColors = ['#c9a84c', '#22c55e', '#4a6fa5']

export default function Dashboard({ stats }) {
  const [projects, setProjects] = useState([])
  const [inventory, setInventory] = useState([])
  const [activities, setActivities] = useState([])
  const [expenses, setExpenses] = useState([])
  const [weeklyPayrolls, setWeeklyPayrolls] = useState([])
  const [monthlyPayrolls, setMonthlyPayrolls] = useState([])

  useEffect(() => {
    fetch('http://localhost:5000/projects').then(r => r.json()).then(d => Array.isArray(d) && setProjects(d))
    fetch('http://localhost:5000/inventory').then(r => r.json()).then(d => Array.isArray(d) && setInventory(d))
    fetch('http://localhost:5000/activities').then(r => r.json()).then(d => Array.isArray(d) && setActivities(d))
    fetch('http://localhost:5000/expenses').then(r => r.json()).then(d => Array.isArray(d) && setExpenses(d))
    fetch('http://localhost:5000/payroll/weekly').then(r => r.json()).then(d => Array.isArray(d) && setWeeklyPayrolls(d))
    fetch('http://localhost:5000/payroll/monthly').then(r => r.json()).then(d => Array.isArray(d) && setMonthlyPayrolls(d))
  }, [])

  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

  const pendingPayments = projects.reduce((sum, p) => {
    const earned = (p.payments || []).reduce((s, pay) => s + (Number(pay.amount) || 0), 0)
    const outstanding = (Number(p.quotation) || 0) - earned
    return sum + (outstanding > 0 ? outstanding : 0)
  }, 0)

  // Recent payments across all projects
  const recentPayments = projects
    .flatMap(p => (p.payments || []).map(pay => ({ ...pay, projectName: p.name })))
    .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
    .slice(0, 5)

  // Projects nearing deadline (within 14 days and not completed)
  const today = new Date()
  const nearingDeadline = projects.filter(p => {
    if (!p.endDate || p.status === 'completed') return false
    const end = new Date(p.endDate)
    const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
    return daysLeft <= 14
  }).map(p => {
    const end = new Date(p.endDate)
    const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
    return { ...p, daysLeft }
  })

  // Total payroll this month
  const thisMonth = today.getMonth() + 1
  const thisYear = today.getFullYear()
  const weeklyThisMonth = weeklyPayrolls
    .filter(p => new Date(p.weekStart).getMonth() + 1 === thisMonth && new Date(p.weekStart).getFullYear() === thisYear)
    .reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0)
  const monthlyThisMonth = monthlyPayrolls
    .filter(p => p.month === thisMonth && p.year === thisYear)
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const totalPayrollThisMonth = weeklyThisMonth + monthlyThisMonth

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const barData = monthNames.map((month, i) => ({
    month,
    amount: expenses.filter(e => new Date(e.createdAt).getMonth() === i)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  }))

  const pending = projects.filter(p => p.status === 'pending').length
  const active = projects.filter(p => p.status === 'active').length
  const completed = projects.filter(p => p.status === 'completed').length
  const pieData = [
    { name: 'Active', value: active || 0 },
    { name: 'Completed', value: completed || 0 },
    { name: 'Pending', value: pending || 0 },
  ]

  const getProgress = (p) => {
    if (p.progress !== undefined && p.progress !== null) return Number(p.progress)
    if (p.status === 'completed') return 100
    if (p.status === 'active') return 50
    return 0
  }

  const timeAgo = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="space-y-5">

      {/* Deadline alerts */}
      {nearingDeadline.length > 0 && (
        <div className="space-y-2">
          {nearingDeadline.map(p => (
            <div key={p.id} className={`rounded-xl px-5 py-3 flex items-center justify-between border ${
              p.daysLeft < 0 ? 'bg-red-500/10 border-red-500/30' :
              p.daysLeft <= 3 ? 'bg-red-500/10 border-red-500/30' :
              'bg-yellow-500/10 border-yellow-500/30'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{p.daysLeft < 0 ? '🚨' : '⚠️'}</span>
                <div>
                  <p className={`font-semibold text-sm ${p.daysLeft < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                    {p.daysLeft < 0 ? `OVERDUE — ${p.name}` : `Deadline Soon — ${p.name}`}
                  </p>
                  <p className="text-zinc-400 text-xs">
                    {p.daysLeft < 0
                      ? `${Math.abs(p.daysLeft)} days past deadline`
                      : `${p.daysLeft} day${p.daysLeft !== 1 ? 's' : ''} remaining`}
                    {' · '}{new Date(p.endDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                p.status === 'active' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>{p.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active Projects', value: stats.projects, icon: '🏗️', color: 'from-[#c9a84c] to-[#a8883a]' },
          { label: 'Total Employees', value: stats.employees, icon: '👷', color: 'from-[#1e3a5f] to-[#152d4d]' },
          { label: 'Total Customers', value: stats.customers, icon: '👥', color: 'from-[#1e3a5f] to-[#152d4d]' },
          { label: 'Inventory Items', value: stats.inventory, icon: '📦', color: 'from-[#1e3a5f] to-[#152d4d]' },
        ].map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.color} rounded-xl p-5 relative overflow-hidden border border-white/10`}>
            <p className="text-white/70 text-sm font-medium">{card.label}</p>
            <p className="text-5xl font-bold text-white mt-2">{card.value}</p>
            <div className="absolute right-4 bottom-3 text-5xl opacity-20">{card.icon}</div>
          </div>
        ))}
      </div>

      {/* Financial + Payroll row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0d1f3c] border border-[#1e3a5f] rounded-xl p-5">
          <p className="text-[#c9a84c] text-xs font-semibold uppercase tracking-wider mb-1">Total Expenses</p>
          <p className="text-white text-2xl font-bold">KSh {totalExpenses.toLocaleString()}</p>
          <div className="mt-3 pt-3 border-t border-[#1e3a5f]">
            <p className="text-[#c9a84c] text-xs font-semibold uppercase tracking-wider mb-1">Outstanding Balance</p>
            <p className="text-white text-xl font-bold">KSh {pendingPayments.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-[#0d1f3c] border border-[#c9a84c]/30 rounded-xl p-5">
          <p className="text-[#c9a84c] text-xs font-semibold uppercase tracking-wider mb-1">Payroll This Month</p>
          <p className="text-[#c9a84c] text-2xl font-bold">KSh {totalPayrollThisMonth.toLocaleString()}</p>
          <div className="mt-3 pt-3 border-t border-[#1e3a5f] space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">🏗️ Site (weekly)</span>
              <span className="text-white font-medium">KSh {weeklyThisMonth.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">🏢 Office (monthly)</span>
              <span className="text-white font-medium">KSh {monthlyThisMonth.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="bg-[#0d1f3c] border border-[#1e3a5f] rounded-xl p-5">
          <p className="text-[#c9a84c] text-xs font-semibold uppercase tracking-wider mb-2">Monthly Expenses</p>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={barData}>
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0a1628', border: '1px solid #1e3a5f', borderRadius: '8px', color: '#fff' }}
                formatter={(value) => [`KSh ${Number(value).toLocaleString()}`, 'Expenses']} />
              <Bar dataKey="amount" fill="#c9a84c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Project Overview */}
        <div className="bg-[#0d1f3c] border border-[#1e3a5f] rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#c9a84c] rounded-full inline-block"></span>
            Project Overview
          </h3>
          {projects.length === 0 ? (
            <p className="text-zinc-600 text-sm">No projects yet.</p>
          ) : (
            <div className="space-y-4">
              {projects.slice(0, 3).map((p) => {
                const progress = getProgress(p)
                return (
                  <div key={p.id}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-white font-medium truncate">{p.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ml-2 whitespace-nowrap font-medium ${
                        p.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        p.status === 'active' ? 'bg-[#c9a84c]/20 text-[#c9a84c]' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>{p.status}</span>
                    </div>
                    <div className="w-full bg-[#1e3a5f] rounded-full h-1.5">
                      <div className="bg-[#c9a84c] h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{progress}% complete</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Task Summary */}
        <div className="bg-[#0d1f3c] border border-[#1e3a5f] rounded-xl p-5">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#c9a84c] rounded-full inline-block"></span>
            Task Summary
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} dataKey="value">
                {pieData.map((_, index) => <Cell key={index} fill={pieColors[index]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#0a1628', border: '1px solid #1e3a5f', borderRadius: '8px', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pieColors[i] }}></div>
                <span className="text-xs text-zinc-400">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-[#0d1f3c] border border-[#1e3a5f] rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#c9a84c] rounded-full inline-block"></span>
            Recent Payments
          </h3>
          {recentPayments.length === 0 ? (
            <p className="text-zinc-600 text-sm">No payments recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((pay) => (
                <div key={pay.id} className="flex items-center justify-between py-2 border-b border-[#1e3a5f]">
                  <div>
                    <p className="text-white text-sm font-medium truncate max-w-[130px]">{pay.projectName}</p>
                    <p className="text-zinc-500 text-xs">{timeAgo(pay.receivedAt)}</p>
                  </div>
                  <p className="text-[#c9a84c] font-bold text-sm">+KSh {Number(pay.amount).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Recent Activities */}
        <div className="col-span-2 bg-[#0d1f3c] border border-[#1e3a5f] rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#c9a84c] rounded-full inline-block"></span>
            Recent Activities
          </h3>
          {activities.length === 0 ? (
            <p className="text-zinc-600 text-sm">No activities yet.</p>
          ) : (
            <div className="space-y-1">
              {activities.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-[#1e3a5f]">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-[#c9a84c]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[#c9a84c] text-xs">✓</span>
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

        {/* Inventory */}
        <div className="bg-[#0d1f3c] border border-[#1e3a5f] rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#c9a84c] rounded-full inline-block"></span>
            Inventory
          </h3>
          {inventory.length === 0 ? (
            <p className="text-zinc-600 text-sm">No inventory items yet.</p>
          ) : (
            <div className="space-y-3">
              {inventory.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b border-[#1e3a5f]">
                  <div className="w-9 h-9 bg-[#1e3a5f] rounded-lg flex items-center justify-center text-lg">📦</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{item.name}</p>
                    <p className="text-xs text-zinc-500">{item.unit || 'units'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${Number(item.quantity) < 10 ? 'text-red-400' : 'text-[#c9a84c]'}`}>
                      {item.quantity}
                    </p>
                    {Number(item.quantity) < 10 && <p className="text-xs text-red-400">Low</p>}
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