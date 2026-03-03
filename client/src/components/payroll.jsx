import { useState, useEffect } from 'react'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export default function Payroll() {
  const [activeTab, setActiveTab] = useState('weekly')
  const [projects, setProjects] = useState([])
  const [employees, setEmployees] = useState([])
  const [weeklyPayrolls, setWeeklyPayrolls] = useState([])
  const [monthlyPayrolls, setMonthlyPayrolls] = useState([])
  const [loading, setLoading] = useState(true)

  // Weekly form
  const [showWeeklyForm, setShowWeeklyForm] = useState(false)
  const [weeklyForm, setWeeklyForm] = useState({
    projectId: '', foremanName: '', numWorkers: '',
    dailyRate: '', daysWorked: '', weekStart: '', note: ''
  })

  // Monthly form
  const [showMonthlyForm, setShowMonthlyForm] = useState(false)
  const [monthlyForm, setMonthlyForm] = useState({
    employeeId: '', month: new Date().getMonth() + 1,
    year: new Date().getFullYear(), note: ''
  })

  // Filter
  const [filterProject, setFilterProject] = useState('all')
  const currentYear = new Date().getFullYear()
  const [filterYear, setFilterYear] = useState(currentYear)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [proj, emp, weekly, monthly] = await Promise.all([
        fetch('http://localhost:5000/projects').then(r => r.json()),
        fetch('http://localhost:5000/employees').then(r => r.json()),
        fetch('http://localhost:5000/payroll/weekly').then(r => r.json()),
        fetch('http://localhost:5000/payroll/monthly').then(r => r.json()),
      ])
      setProjects(Array.isArray(proj) ? proj : [])
      setEmployees(Array.isArray(emp) ? emp : [])
      setWeeklyPayrolls(Array.isArray(weekly) ? weekly : [])
      setMonthlyPayrolls(Array.isArray(monthly) ? monthly : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Auto-calculate week end (Saturday) from week start (Monday)
  const getWeekEnd = (weekStart) => {
    if (!weekStart) return ''
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 5)
    return d.toISOString().split('T')[0]
  }

  // Auto-calculate total
  const weeklyTotal = () => {
    const { numWorkers, dailyRate, daysWorked } = weeklyForm
    if (!numWorkers || !dailyRate || !daysWorked) return 0
    return Number(numWorkers) * Number(dailyRate) * Number(daysWorked)
  }

  const handleWeeklySubmit = async () => {
    if (!weeklyForm.projectId) return alert('Please select a project.')
    if (!weeklyForm.foremanName.trim()) return alert('Foreman name is required.')
    if (!weeklyForm.numWorkers) return alert('Number of workers is required.')
    if (!weeklyForm.dailyRate) return alert('Daily rate is required.')
    if (!weeklyForm.daysWorked) return alert('Days worked is required.')
    if (!weeklyForm.weekStart) return alert('Week start date is required.')

    try {
      await fetch('http://localhost:5000/payroll/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...weeklyForm,
          weekEnd: getWeekEnd(weeklyForm.weekStart),
          totalAmount: weeklyTotal(),
          numWorkers: Number(weeklyForm.numWorkers),
          dailyRate: Number(weeklyForm.dailyRate),
          daysWorked: Number(weeklyForm.daysWorked),
          projectId: Number(weeklyForm.projectId),
        })
      })
      setWeeklyForm({ projectId: '', foremanName: '', numWorkers: '', dailyRate: '', daysWorked: '', weekStart: '', note: '' })
      setShowWeeklyForm(false)
      fetchAll()
    } catch {
      alert('Failed to save payroll entry.')
    }
  }

  const handleWeeklyDelete = async (id) => {
    if (!window.confirm('Delete this payroll entry?')) return
    await fetch(`http://localhost:5000/payroll/weekly/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  const handleMonthlySubmit = async () => {
    if (!monthlyForm.employeeId) return alert('Please select an employee.')
    try {
      await fetch('http://localhost:5000/payroll/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...monthlyForm,
          employeeId: Number(monthlyForm.employeeId),
          month: Number(monthlyForm.month),
          year: Number(monthlyForm.year),
        })
      })
      setMonthlyForm({ employeeId: '', month: new Date().getMonth() + 1, year: currentYear, note: '' })
      setShowMonthlyForm(false)
      fetchAll()
    } catch {
      alert('Failed to save monthly payroll.')
    }
  }

  const handleMonthlyDelete = async (id) => {
    if (!window.confirm('Delete this payroll record?')) return
    await fetch(`http://localhost:5000/payroll/monthly/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  // Filter weekly payrolls
  const filteredWeekly = weeklyPayrolls.filter(p =>
    filterProject === 'all' || String(p.projectId) === filterProject
  )

  // Weekly totals
  const totalWeeklyPaid = filteredWeekly.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0)
  const totalWorkersPaid = filteredWeekly.reduce((sum, p) => sum + (Number(p.numWorkers) || 0), 0)

  // Monthly staff — check who hasn't been paid this month
  const thisMonth = new Date().getMonth() + 1
  const thisYear = new Date().getFullYear()
  const monthlyStaff = employees.filter(e => e.employmentType === 'monthly' || e.department === 'Office')
  const paidThisMonth = monthlyPayrolls.filter(p => p.month === thisMonth && p.year === thisYear)
  const unpaidStaff = monthlyStaff.filter(e => !paidThisMonth.find(p => p.employeeId === e.id))

  // Monthly total for selected year
  const filteredMonthly = monthlyPayrolls.filter(p => p.year === filterYear)
  const totalMonthlyPaid = filteredMonthly.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <p className="text-zinc-500">Loading payroll...</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Payroll</h3>
          <p className="text-zinc-500 text-sm">Weekly site payments & monthly office salaries</p>
        </div>
        <button
          onClick={() => activeTab === 'weekly' ? setShowWeeklyForm(!showWeeklyForm) : setShowMonthlyForm(!showMonthlyForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
          {activeTab === 'weekly'
            ? (showWeeklyForm ? 'Cancel' : '+ Record Weekly Payment')
            : (showMonthlyForm ? 'Cancel' : '+ Record Monthly Salary')}
        </button>
      </div>

      {/* Unpaid alert */}
      {unpaidStaff.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4 flex items-start gap-3">
          <span className="text-red-400 text-xl">⚠️</span>
          <div>
            <p className="text-red-400 font-semibold text-sm">Unpaid Office Staff This Month</p>
            <p className="text-zinc-400 text-sm mt-0.5">
              {unpaidStaff.map(e => e.name).join(', ')} {unpaidStaff.length === 1 ? 'has' : 'have'} not been paid for {MONTHS[thisMonth - 1]}.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800">
        {['weekly', 'monthly'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-500 hover:text-white'
            }`}>
            {tab === 'weekly' ? '🏗️ Site Payroll (Weekly)' : '🏢 Office Payroll (Monthly)'}
          </button>
        ))}
      </div>

      {/* ── WEEKLY TAB ── */}
      {activeTab === 'weekly' && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-zinc-500 text-sm">Total Paid (All Time)</p>
              <p className="text-white text-2xl font-bold mt-1">KSh {weeklyPayrolls.reduce((s, p) => s + Number(p.totalAmount), 0).toLocaleString()}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-zinc-500 text-sm">Filtered Total</p>
              <p className="text-orange-400 text-2xl font-bold mt-1">KSh {totalWeeklyPaid.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-zinc-500 text-sm">Total Workers Paid</p>
              <p className="text-green-400 text-2xl font-bold mt-1">{totalWorkersPaid} workers</p>
            </div>
          </div>

          {/* Weekly form */}
          {showWeeklyForm && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 grid grid-cols-2 gap-4">
              <h4 className="col-span-2 text-white font-semibold">Record Weekly Site Payment</h4>

              <select value={weeklyForm.projectId} onChange={e => setWeeklyForm({ ...weeklyForm, projectId: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select Project *</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>

              <input placeholder="Foreman Name *" value={weeklyForm.foremanName}
                onChange={e => setWeeklyForm({ ...weeklyForm, foremanName: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />

              <input placeholder="Number of Workers *" type="number" value={weeklyForm.numWorkers}
                onChange={e => setWeeklyForm({ ...weeklyForm, numWorkers: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />

              <input placeholder="Daily Rate per Worker (KSh) *" type="number" value={weeklyForm.dailyRate}
                onChange={e => setWeeklyForm({ ...weeklyForm, dailyRate: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />

              <input placeholder="Days Worked (e.g. 6) *" type="number" step="0.5" value={weeklyForm.daysWorked}
                onChange={e => setWeeklyForm({ ...weeklyForm, daysWorked: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />

              <div>
                <label className="text-zinc-500 text-xs mb-1 block">Week Start (Monday) *</label>
                <input type="date" value={weeklyForm.weekStart}
                  onChange={e => setWeeklyForm({ ...weeklyForm, weekStart: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>

              <input placeholder="Note (optional)" value={weeklyForm.note}
                onChange={e => setWeeklyForm({ ...weeklyForm, note: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />

              {/* Auto-calculated total */}
              {weeklyTotal() > 0 && (
                <div className="col-span-2 bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-zinc-400 text-sm">Auto-calculated Total</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {weeklyForm.numWorkers} workers × KSh {Number(weeklyForm.dailyRate).toLocaleString()} × {weeklyForm.daysWorked} days
                    </p>
                  </div>
                  <p className="text-orange-400 text-2xl font-bold">KSh {weeklyTotal().toLocaleString()}</p>
                </div>
              )}

              <div className="col-span-2 flex gap-3">
                <button onClick={handleWeeklySubmit}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
                  Save Payment
                </button>
                <button onClick={() => setShowWeeklyForm(false)}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Filter */}
          <div className="flex gap-3">
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="all">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Weekly table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Project', 'Foreman', 'Workers', 'Daily Rate', 'Days', 'Total', 'Week', 'Note', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-zinc-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredWeekly.length === 0 ? (
                  <tr><td colSpan="9" className="px-6 py-12 text-center text-zinc-600">No weekly payroll records yet.</td></tr>
                ) : filteredWeekly.map(p => (
                  <tr key={p.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                    <td className="px-5 py-3 text-white text-sm font-medium">{p.project?.name || '—'}</td>
                    <td className="px-5 py-3 text-zinc-300 text-sm">{p.foremanName}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full font-medium">{p.numWorkers}</span>
                    </td>
                    <td className="px-5 py-3 text-zinc-400 text-sm">KSh {Number(p.dailyRate).toLocaleString()}</td>
                    <td className="px-5 py-3 text-zinc-400 text-sm">{p.daysWorked}</td>
                    <td className="px-5 py-3 text-orange-400 font-bold text-sm">KSh {Number(p.totalAmount).toLocaleString()}</td>
                    <td className="px-5 py-3 text-zinc-500 text-xs">
                      {new Date(p.weekStart).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })} –{' '}
                      {new Date(p.weekEnd).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-5 py-3 text-zinc-500 text-xs">{p.note || '—'}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleWeeklyDelete(p.id)}
                        className="text-red-500 hover:text-red-400 text-xs font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {filteredWeekly.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-zinc-700 bg-zinc-800/50">
                    <td colSpan="5" className="px-5 py-3 text-white font-bold text-sm">Total</td>
                    <td className="px-5 py-3 text-orange-400 font-bold text-sm">KSh {totalWeeklyPaid.toLocaleString()}</td>
                    <td colSpan="3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ── MONTHLY TAB ── */}
      {activeTab === 'monthly' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-zinc-500 text-sm">Total Paid ({filterYear})</p>
              <p className="text-white text-2xl font-bold mt-1">KSh {totalMonthlyPaid.toLocaleString()}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-zinc-500 text-sm">Payments This Year</p>
              <p className="text-green-400 text-2xl font-bold mt-1">{filteredMonthly.length} records</p>
            </div>
            <div className={`border rounded-xl p-5 ${unpaidStaff.length > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-zinc-900 border-zinc-800'}`}>
              <p className="text-zinc-500 text-sm">Unpaid This Month</p>
              <p className={`text-2xl font-bold mt-1 ${unpaidStaff.length > 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                {unpaidStaff.length} staff
              </p>
            </div>
          </div>

          {/* Monthly form */}
          {showMonthlyForm && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 grid grid-cols-2 gap-4">
              <h4 className="col-span-2 text-white font-semibold">Record Monthly Salary Payment</h4>

              <select value={monthlyForm.employeeId} onChange={e => {
                const emp = employees.find(em => em.id === Number(e.target.value))
                setMonthlyForm({ ...monthlyForm, employeeId: e.target.value, amount: emp?.salary || '' })
              }}
                className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select Employee *</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} — {e.role} {e.salary ? `(KSh ${Number(e.salary).toLocaleString()}/mo)` : ''}</option>
                ))}
              </select>

              <select value={monthlyForm.month} onChange={e => setMonthlyForm({ ...monthlyForm, month: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500">
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>

              <select value={monthlyForm.year} onChange={e => setMonthlyForm({ ...monthlyForm, year: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500">
                {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
              </select>

              <input placeholder="Amount (KSh) *" type="number" value={monthlyForm.amount || ''}
                onChange={e => setMonthlyForm({ ...monthlyForm, amount: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />

              <input placeholder="Note (optional)" value={monthlyForm.note}
                onChange={e => setMonthlyForm({ ...monthlyForm, note: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />

              <div className="col-span-2 flex gap-3">
                <button onClick={handleMonthlySubmit}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
                  Save Salary Payment
                </button>
                <button onClick={() => setShowMonthlyForm(false)}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Year filter */}
          <div className="flex gap-3">
            <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}
              className="bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500">
              {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Monthly table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Employee', 'Role', 'Month', 'Year', 'Amount', 'Note', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-zinc-500 text-xs font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMonthly.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-12 text-center text-zinc-600">No monthly salary records for {filterYear}.</td></tr>
                ) : filteredMonthly.map(p => (
                  <tr key={p.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                    <td className="px-5 py-3 text-white font-medium text-sm">{p.employee?.name || '—'}</td>
                    <td className="px-5 py-3 text-zinc-400 text-sm">{p.employee?.role || '—'}</td>
                    <td className="px-5 py-3 text-zinc-300 text-sm">{MONTHS[p.month - 1]}</td>
                    <td className="px-5 py-3 text-zinc-400 text-sm">{p.year}</td>
                    <td className="px-5 py-3 text-green-400 font-bold text-sm">KSh {Number(p.amount).toLocaleString()}</td>
                    <td className="px-5 py-3 text-zinc-500 text-xs">{p.note || '—'}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleMonthlyDelete(p.id)}
                        className="text-red-500 hover:text-red-400 text-xs font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {filteredMonthly.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-zinc-700 bg-zinc-800/50">
                    <td colSpan="4" className="px-5 py-3 text-white font-bold text-sm">Total ({filterYear})</td>
                    <td className="px-5 py-3 text-green-400 font-bold text-sm">KSh {totalMonthlyPaid.toLocaleString()}</td>
                    <td colSpan="2"></td>
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