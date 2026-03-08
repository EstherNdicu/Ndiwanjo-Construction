import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'

const pieColors = ['#f97316', '#22c55e', '#ef4444', '#3b82f6', '#a855f7', '#eab308']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export default function Reports() {
  const [projects, setProjects] = useState([])
  const [expenses, setExpenses] = useState([])
  const [employees, setEmployees] = useState([])
  const [weeklyPayrolls, setWeeklyPayrolls] = useState([])
  const [monthlyPayrolls, setMonthlyPayrolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:5000/projects').then(r => r.json()),
      fetch('http://localhost:5000/expenses').then(r => r.json()),
      fetch('http://localhost:5000/employees').then(r => r.json()),
      fetch('http://localhost:5000/payroll/weekly').then(r => r.json()),
      fetch('http://localhost:5000/payroll/monthly').then(r => r.json()),
    ]).then(([proj, exp, emp, weekly, monthly]) => {
      setProjects(Array.isArray(proj) ? proj : [])
      setExpenses(Array.isArray(exp) ? exp : [])
      setEmployees(Array.isArray(emp) ? emp : [])
      setWeeklyPayrolls(Array.isArray(weekly) ? weekly : [])
      setMonthlyPayrolls(Array.isArray(monthly) ? monthly : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const totalRevenue = projects.reduce((sum, p) =>
    sum + (p.payments || []).reduce((s, pay) => s + (Number(pay.amount) || 0), 0), 0)
  const totalExpensesAll = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  const totalQuotations = projects.reduce((sum, p) => sum + (Number(p.quotation) || 0), 0)
  const totalOutstanding = projects.reduce((sum, p) => {
    const earned = (p.payments || []).reduce((s, pay) => s + (Number(pay.amount) || 0), 0)
    const outstanding = (Number(p.quotation) || 0) - earned
    return sum + (outstanding > 0 ? outstanding : 0)
  }, 0)
  const netProfit = totalRevenue - totalExpensesAll

  const projectFinancials = projects.map(p => {
    const earned = (p.payments || []).reduce((s, pay) => s + (Number(pay.amount) || 0), 0)
    const spent = (p.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0)
    const profit = earned - spent
    const outstanding = (Number(p.quotation) || 0) - earned
    return {
      id: p.id, name: p.name,
      quotation: Number(p.quotation) || 0,
      earned, spent, profit,
      outstanding: outstanding > 0 ? outstanding : 0,
      status: p.status, progress: p.progress || 0,
    }
  })

  const monthlyData = MONTHS.map((month, i) => {
    const revenue = projects.reduce((sum, p) =>
      sum + (p.payments || [])
        .filter(pay => new Date(pay.receivedAt).getMonth() === i)
        .reduce((s, pay) => s + (Number(pay.amount) || 0), 0), 0)
    const spent = expenses
      .filter(e => new Date(e.createdAt).getMonth() === i)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    return { month, revenue, expenses: spent, profit: revenue - spent }
  })

  const expensesByCategory = expenses.reduce((acc, e) => {
    const cat = e.category || 'uncategorized'
    acc[cat] = (acc[cat] || 0) + (Number(e.amount) || 0)
    return acc
  }, {})
  const categoryPieData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }))

  const statusData = [
    { name: 'Pending', value: projects.filter(p => p.status === 'pending').length },
    { name: 'Active', value: projects.filter(p => p.status === 'active').length },
    { name: 'Completed', value: projects.filter(p => p.status === 'completed').length },
  ]

  // Payroll stats
  const currentYear = new Date().getFullYear()
  const totalWeeklyPaid = weeklyPayrolls.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0)
  const totalMonthlyPaid = monthlyPayrolls.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const totalPayroll = totalWeeklyPaid + totalMonthlyPaid

  const weeklyByProject = projects.map(p => {
    const entries = weeklyPayrolls.filter(w => w.projectId === p.id)
    const total = entries.reduce((sum, w) => sum + (Number(w.totalAmount) || 0), 0)
    const workers = entries.reduce((sum, w) => sum + (Number(w.numWorkers) || 0), 0)
    return { name: p.name, total, workers, entries: entries.length }
  }).filter(p => p.total > 0)

  const monthlyByMonth = MONTHS.map((month, i) => {
    const total = monthlyPayrolls
      .filter(p => p.month === i + 1 && p.year === currentYear)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    return { month, total }
  })

  const monthlyByEmployee = employees.map(e => {
    const payments = monthlyPayrolls.filter(p => p.employeeId === e.id)
    const total = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    return { name: e.name, role: e.role, total, months: payments.length }
  }).filter(e => e.total > 0)

  const handlePrint = () => window.print()

  const handleExportCSV = () => {
    const rows = [
      ['Project', 'Status', 'Quotation (KSh)', 'Earned (KSh)', 'Spent (KSh)', 'Profit (KSh)', 'Outstanding (KSh)', 'Progress %'],
      ...projectFinancials.map(p => [p.name, p.status, p.quotation, p.earned, p.spent, p.profit, p.outstanding, p.progress])
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ndiwanjo-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const tabs = ['overview', 'projects', 'expenses', 'monthly', 'payroll']

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <p className="text-zinc-500">Loading reports...</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Reports</h3>
          <p className="text-zinc-500 text-sm">Financial overview for Ndiwanjo Construction</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportCSV}
            className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            📥 Export CSV
          </button>
          <button onClick={handlePrint}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            🖨️ Print Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs">Total Quotations</p>
          <p className="text-white font-bold text-lg mt-1">KSh {totalQuotations.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs">Total Revenue</p>
          <p className="text-green-400 font-bold text-lg mt-1">KSh {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs">Total Expenses</p>
          <p className="text-orange-400 font-bold text-lg mt-1">KSh {totalExpensesAll.toLocaleString()}</p>
        </div>
        <div className={`border rounded-xl p-4 ${netProfit >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <p className="text-zinc-500 text-xs">Net Profit / Loss</p>
          <p className={`font-bold text-lg mt-1 ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {netProfit >= 0 ? '+' : ''}KSh {netProfit.toLocaleString()}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs">Outstanding</p>
          <p className="text-yellow-400 font-bold text-lg mt-1">KSh {totalOutstanding.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-zinc-800">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-500 hover:text-white'
            }`}>
            {tab === 'payroll' ? '💵 Payroll' : tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h4 className="text-white font-semibold mb-4">Project Status</h4>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h4 className="text-white font-semibold mb-4">Expenses by Category</h4>
              {categoryPieData.length === 0 ? (
                <p className="text-zinc-600 text-sm text-center py-16">No expenses recorded yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value">
                      {categoryPieData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                      formatter={(value) => `KSh ${Number(value).toLocaleString()}`} />
                    <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h4 className="text-white font-semibold mb-4">Revenue vs Expenses by Project</h4>
            {projectFinancials.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-8">No projects yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={projectFinancials} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value, name) => [`KSh ${Number(value).toLocaleString()}`, name]} />
                  <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: '12px' }} />
                  <Bar dataKey="earned" name="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" name="Expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outstanding" name="Outstanding" fill="#eab308" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Project', 'Status', 'Quotation', 'Earned', 'Spent', 'Outstanding', 'Profit/Loss', 'Progress'].map(h => (
                  <th key={h} className={`px-6 py-3 text-zinc-500 text-xs font-medium uppercase ${h === 'Project' || h === 'Status' || h === 'Progress' ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projectFinancials.length === 0 ? (
                <tr><td colSpan="8" className="px-6 py-12 text-center text-zinc-600">No projects yet.</td></tr>
              ) : projectFinancials.map((p, i) => (
                <tr key={i} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                  <td className="px-6 py-4 text-white font-medium">{p.name}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      p.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      p.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'}`}>{p.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-300 text-sm">{p.quotation ? `KSh ${p.quotation.toLocaleString()}` : '—'}</td>
                  <td className="px-6 py-4 text-right text-green-400 font-medium text-sm">KSh {p.earned.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-orange-400 font-medium text-sm">KSh {p.spent.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-yellow-400 font-medium text-sm">KSh {p.outstanding.toLocaleString()}</td>
                  <td className={`px-6 py-4 text-right font-bold text-sm ${p.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {p.profit >= 0 ? '+' : ''}KSh {p.profit.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-zinc-700 rounded-full h-1.5">
                        <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${p.progress}%` }}></div>
                      </div>
                      <span className="text-xs text-zinc-400 w-8">{p.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {projectFinancials.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-zinc-700 bg-zinc-800/50">
                  <td className="px-6 py-3 text-white font-bold text-sm" colSpan="2">Totals</td>
                  <td className="px-6 py-3 text-right text-white font-bold text-sm">KSh {totalQuotations.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right text-green-400 font-bold text-sm">KSh {totalRevenue.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right text-orange-400 font-bold text-sm">KSh {totalExpensesAll.toLocaleString()}</td>
                  <td className="px-6 py-3 text-right text-yellow-400 font-bold text-sm">KSh {totalOutstanding.toLocaleString()}</td>
                  <td className={`px-6 py-3 text-right font-bold text-sm ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {netProfit >= 0 ? '+' : ''}KSh {netProfit.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Object.entries(expensesByCategory).map(([cat, amount]) => (
              <div key={cat} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-zinc-500 text-xs capitalize">{cat}</p>
                <p className="text-white font-bold text-sm mt-1">KSh {Number(amount).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Title', 'Project', 'Category', 'Date', 'Amount'].map(h => (
                    <th key={h} className={`px-6 py-3 text-zinc-500 text-xs font-medium uppercase ${h === 'Amount' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-zinc-600">No expenses yet.</td></tr>
                ) : expenses.map((e) => (
                  <tr key={e.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                    <td className="px-6 py-3 text-white text-sm">{e.title}</td>
                    <td className="px-6 py-3 text-zinc-400 text-sm">{e.project?.name || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        e.category === 'paid' ? 'bg-green-500/20 text-green-400' :
                        e.category === 'pending' ? 'bg-red-500/20 text-red-400' :
                        e.category === 'materials' ? 'bg-blue-500/20 text-blue-400' :
                        e.category === 'labour' ? 'bg-purple-500/20 text-purple-400' :
                        e.category === 'equipment' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-zinc-700 text-zinc-400'}`}>{e.category || 'uncategorized'}</span>
                    </td>
                    <td className="px-6 py-3 text-zinc-500 text-sm">{e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-KE') : '—'}</td>
                    <td className="px-6 py-3 text-right text-orange-400 font-bold text-sm">KSh {Number(e.amount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              {expenses.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-zinc-700 bg-zinc-800/50">
                    <td className="px-6 py-3 text-white font-bold text-sm" colSpan="4">Total</td>
                    <td className="px-6 py-3 text-right text-orange-400 font-bold text-sm">KSh {totalExpensesAll.toLocaleString()}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {activeTab === 'monthly' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h4 className="text-white font-semibold mb-4">Monthly Revenue vs Expenses ({new Date().getFullYear()})</h4>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyData}>
                <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  formatter={(value, name) => [`KSh ${Number(value).toLocaleString()}`, name]} />
                <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: '12px' }} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 4 }} />
                <Line type="monotone" dataKey="profit" name="Profit" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#3b82f6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Month', 'Revenue', 'Expenses', 'Profit / Loss'].map(h => (
                    <th key={h} className={`px-6 py-3 text-zinc-500 text-xs font-medium uppercase ${h === 'Month' ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((m, i) => (
                  <tr key={i} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                    <td className="px-6 py-3 text-white text-sm font-medium">{m.month} {new Date().getFullYear()}</td>
                    <td className="px-6 py-3 text-right text-green-400 text-sm">{m.revenue > 0 ? `KSh ${m.revenue.toLocaleString()}` : '—'}</td>
                    <td className="px-6 py-3 text-right text-orange-400 text-sm">{m.expenses > 0 ? `KSh ${m.expenses.toLocaleString()}` : '—'}</td>
                    <td className={`px-6 py-3 text-right text-sm font-medium ${m.profit > 0 ? 'text-green-400' : m.profit < 0 ? 'text-red-400' : 'text-zinc-600'}`}>
                      {m.profit !== 0 ? `${m.profit > 0 ? '+' : ''}KSh ${m.profit.toLocaleString()}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAYROLL TAB */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-zinc-500 text-sm">Total Payroll (All Time)</p>
              <p className="text-white text-2xl font-bold mt-1">KSh {totalPayroll.toLocaleString()}</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5">
              <p className="text-zinc-500 text-sm">Site Payroll (Weekly)</p>
              <p className="text-orange-400 text-2xl font-bold mt-1">KSh {totalWeeklyPaid.toLocaleString()}</p>
              <p className="text-zinc-600 text-xs mt-1">{weeklyPayrolls.length} payment records</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
              <p className="text-zinc-500 text-sm">Office Payroll (Monthly)</p>
              <p className="text-blue-400 text-2xl font-bold mt-1">KSh {totalMonthlyPaid.toLocaleString()}</p>
              <p className="text-zinc-600 text-xs mt-1">{monthlyPayrolls.length} salary records</p>
            </div>
          </div>

          {/* Weekly payroll per project bar chart */}
          {weeklyByProject.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h4 className="text-white font-semibold mb-4">🏗️ Site Payroll Cost per Project</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyByProject} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value) => [`KSh ${Number(value).toLocaleString()}`, 'Total Paid']} />
                  <Bar dataKey="total" name="Total Paid" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weekly payroll per project table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h4 className="text-white font-semibold">🏗️ Site Payroll by Project</h4>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Project', 'Payments', 'Workers Paid', 'Total Paid'].map(h => (
                    <th key={h} className={`px-6 py-3 text-zinc-500 text-xs font-medium uppercase ${h === 'Project' ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeklyByProject.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-12 text-center text-zinc-600">No weekly payroll recorded yet.</td></tr>
                ) : weeklyByProject.map((p, i) => (
                  <tr key={i} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                    <td className="px-6 py-4 text-white font-medium">{p.name}</td>
                    <td className="px-6 py-4 text-right text-zinc-400 text-sm">{p.entries}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">{p.workers}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-orange-400 font-bold text-sm">KSh {p.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              {weeklyByProject.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-zinc-700 bg-zinc-800/50">
                    <td className="px-6 py-3 text-white font-bold text-sm" colSpan="3">Total Site Payroll</td>
                    <td className="px-6 py-3 text-right text-orange-400 font-bold text-sm">KSh {totalWeeklyPaid.toLocaleString()}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Monthly office salary bar chart */}
          {monthlyByMonth.some(m => m.total > 0) && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h4 className="text-white font-semibold mb-4">🏢 Monthly Office Salary Payments ({currentYear})</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyByMonth} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value) => [`KSh ${Number(value).toLocaleString()}`, 'Salaries Paid']} />
                  <Bar dataKey="total" name="Salaries Paid" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Monthly payroll by employee table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h4 className="text-white font-semibold">🏢 Office Staff Salary Summary</h4>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Employee', 'Role', 'Months Paid', 'Total Paid'].map(h => (
                    <th key={h} className={`px-6 py-3 text-zinc-500 text-xs font-medium uppercase ${h === 'Employee' || h === 'Role' ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyByEmployee.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-12 text-center text-zinc-600">No monthly salary records yet.</td></tr>
                ) : monthlyByEmployee.map((e, i) => (
                  <tr key={i} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                    <td className="px-6 py-4 text-white font-medium">{e.name}</td>
                    <td className="px-6 py-4 text-zinc-400 text-sm">{e.role}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">{e.months} months</span>
                    </td>
                    <td className="px-6 py-4 text-right text-blue-400 font-bold text-sm">KSh {e.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              {monthlyByEmployee.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-zinc-700 bg-zinc-800/50">
                    <td className="px-6 py-3 text-white font-bold text-sm" colSpan="3">Total Office Payroll</td>
                    <td className="px-6 py-3 text-right text-blue-400 font-bold text-sm">KSh {totalMonthlyPaid.toLocaleString()}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  )
}