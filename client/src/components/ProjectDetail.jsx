import { useState, useEffect } from 'react'
import InvoiceGenerator from './InvoiceGenerator'
import ProjectPDFReport from './ProjectPDFReport'

export default function ProjectDetail({ projectId, onBack }) {
  const [project, setProject] = useState(null)
  const [activeTab, setActiveTab] = useState('financials')
  const [allEmployees, setAllEmployees] = useState([])
  const [allInventory, setAllInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showEmployeeForm, setShowEmployeeForm] = useState(false)
  const [showInventoryForm, setShowInventoryForm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [selectedInventoryId, setSelectedInventoryId] = useState('')
  const [inventoryQuantity, setInventoryQuantity] = useState('')
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', category: '' })
  const [paymentForm, setPaymentForm] = useState({ amount: '', note: '', receivedAt: '' })
  const [showInvoice, setShowInvoice] = useState(false)
  const [progress, setProgress] = useState(0)
  const [savingProgress, setSavingProgress] = useState(false)

  useEffect(() => {
    fetchProject()
    fetchAllEmployees()
    fetchAllInventory()
  }, [projectId])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const res = await fetch(`http://localhost:5000/projects/${projectId}/detail`)
      const data = await res.json()
      setProject(data)
      setProgress(data.progress || 0)
      setError(null)
    } catch (err) {
      setError('Failed to load project details.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllEmployees = async () => {
    try {
      const res = await fetch('http://localhost:5000/employees')
      const data = await res.json()
      setAllEmployees(Array.isArray(data) ? data : [])
    } catch {}
  }

  const fetchAllInventory = async () => {
    try {
      const res = await fetch('http://localhost:5000/inventory')
      const data = await res.json()
      setAllInventory(Array.isArray(data) ? data : [])
    } catch {}
  }

  const saveProgress = async () => {
    try {
      setSavingProgress(true)
      await fetch(`http://localhost:5000/projects/${projectId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress }),
      })
      fetchProject()
    } catch {
      alert('Failed to update progress.')
    } finally {
      setSavingProgress(false)
    }
  }

  const assignEmployee = async () => {
    if (!selectedEmployeeId) return alert('Please select an employee.')
    try {
      await fetch(`http://localhost:5000/projects/${projectId}/employees`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: selectedEmployeeId })
      })
      setSelectedEmployeeId(''); setShowEmployeeForm(false); fetchProject()
    } catch { alert('Failed to assign employee.') }
  }

  const removeEmployee = async (employeeId) => {
    if (!window.confirm('Remove this employee from the project?')) return
    try {
      await fetch(`http://localhost:5000/projects/${projectId}/employees/${employeeId}`, { method: 'DELETE' })
      fetchProject()
    } catch { alert('Failed to remove employee.') }
  }

  const addInventory = async () => {
    if (!selectedInventoryId) return alert('Please select an inventory item.')
    if (!inventoryQuantity) return alert('Please enter a quantity.')
    try {
      await fetch(`http://localhost:5000/projects/${projectId}/inventory`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryId: selectedInventoryId, quantity: inventoryQuantity })
      })
      setSelectedInventoryId(''); setInventoryQuantity(''); setShowInventoryForm(false); fetchProject()
    } catch { alert('Failed to add inventory.') }
  }

  const removeInventory = async (inventoryId) => {
    if (!window.confirm('Remove this item from the project?')) return
    try {
      await fetch(`http://localhost:5000/projects/${projectId}/inventory/${inventoryId}`, { method: 'DELETE' })
      fetchProject()
    } catch { alert('Failed to remove inventory.') }
  }

  const addExpense = async () => {
    if (!expenseForm.title.trim()) return alert('Title is required.')
    if (!expenseForm.amount) return alert('Amount is required.')
    try {
      await fetch(`http://localhost:5000/projects/${projectId}/expenses`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseForm)
      })
      setExpenseForm({ title: '', amount: '', category: '' }); setShowExpenseForm(false); fetchProject()
    } catch { alert('Failed to add expense.') }
  }

  const removeExpense = async (expenseId) => {
    if (!window.confirm('Delete this expense?')) return
    try {
      await fetch(`http://localhost:5000/projects/${projectId}/expenses/${expenseId}`, { method: 'DELETE' })
      fetchProject()
    } catch { alert('Failed to delete expense.') }
  }

  const addPayment = async () => {
    if (!paymentForm.amount) return alert('Amount is required.')
    try {
      await fetch(`http://localhost:5000/projects/${projectId}/payments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm)
      })
      setPaymentForm({ amount: '', note: '', receivedAt: '' }); setShowPaymentForm(false); fetchProject()
    } catch { alert('Failed to add payment.') }
  }

  const removePayment = async (paymentId) => {
    if (!window.confirm('Delete this payment?')) return
    try {
      await fetch(`http://localhost:5000/projects/${projectId}/payments/${paymentId}`, { method: 'DELETE' })
      fetchProject()
    } catch { alert('Failed to delete payment.') }
  }

  const assignedEmployeeIds = project?.employees?.map(e => e.employeeId) || []
  const availableEmployees = allEmployees.filter(e => !assignedEmployeeIds.includes(e.id))
  const assignedInventoryIds = project?.inventory?.map(i => i.inventoryId) || []
  const availableInventory = allInventory.filter(i => !assignedInventoryIds.includes(i.id))
  const totalExpenses = project?.expenses?.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0
  const totalEarned = project?.payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0
  const profit = totalEarned - totalExpenses
  const isProfit = profit >= 0
  const progressColor = progress === 100 ? 'bg-green-500' : progress >= 60 ? 'bg-blue-500' : progress >= 30 ? 'bg-orange-500' : 'bg-yellow-500'

  if (loading) return <div className="flex items-center justify-center py-24"><p className="text-zinc-500">Loading project...</p></div>
  if (error) return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm">â† Back to Projects</button>
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3">{error}</div>
    </div>
  )

  const tabs = ['financials', 'employees', 'inventory', 'expenses']
  const tabCounts = {
    financials: project.payments?.length || 0,
    employees: project.employees?.length || 0,
    inventory: project.inventory?.length || 0,
    expenses: project.expenses?.length || 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button onClick={onBack} className="text-zinc-400 hover:text-white text-sm mb-4 flex items-center gap-1">
          â† Back to Projects
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-white">{project.name}</h3>
            <p className="text-zinc-500 text-sm mt-1">{project.description || 'No description'}</p>
          </div>
          <div className="flex items-center gap-3">
            <ProjectPDFReport project={project} />
            <button onClick={() => setShowInvoice(true)}
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              ðŸ§¾ Generate Invoice
            </button>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
              project.status === 'completed' ? 'bg-green-500/20 text-green-400' :
              project.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>{project.status}</span>
          </div>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white font-semibold">Project Progress</p>
            <p className="text-zinc-500 text-xs mt-0.5">Drag the slider to update completion %</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-2xl font-bold ${progress === 100 ? 'text-green-400' : 'text-white'}`}>
              {progress}%
            </span>
            {progress !== (project.progress || 0) && (
              <button onClick={saveProgress} disabled={savingProgress}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {savingProgress ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>
        </div>
        <div className="w-full bg-zinc-700 rounded-full h-3 mb-3">
          <div className={`${progressColor} h-3 rounded-full transition-all duration-300`}
            style={{ width: `${progress}%` }}></div>
        </div>
        <input type="range" min="0" max="100" step="5"
          value={progress}
          onChange={e => setProgress(Number(e.target.value))}
          className="w-full accent-orange-500 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-zinc-600 mt-1">
          <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-zinc-500 text-sm">Quotation</p>
          <p className="text-2xl font-bold text-white mt-1">
            {project.quotation ? `KSh ${Number(project.quotation).toLocaleString()}` : 'â€”'}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-zinc-500 text-sm">Total Earned</p>
          <p className="text-2xl font-bold text-green-400 mt-1">KSh {totalEarned.toLocaleString()}</p>
          {project.quotation && (
            <p className="text-xs text-zinc-600 mt-1">
              {Math.round((totalEarned / Number(project.quotation)) * 100)}% of quote
            </p>
          )}
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-zinc-500 text-sm">Total Spent</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">KSh {totalExpenses.toLocaleString()}</p>
        </div>
        <div className={`border rounded-xl p-5 ${isProfit ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <p className="text-zinc-500 text-sm">Net Profit / Loss</p>
          <p className={`text-2xl font-bold mt-1 ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}KSh {profit.toLocaleString()}
          </p>
          <p className={`text-xs mt-1 ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
            {isProfit ? 'âœ“ In profit' : 'âœ— In loss'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-500 hover:text-white'
            }`}>
            {tab} ({tabCounts[tab]})
          </button>
        ))}
      </div>

      {/* FINANCIALS TAB */}
      {activeTab === 'financials' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-zinc-400 text-sm">{project.payments?.length || 0} payments â€” Total: KSh {totalEarned.toLocaleString()}</p>
            <button onClick={() => setShowPaymentForm(!showPaymentForm)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
              + Record Payment
            </button>
          </div>
          {showPaymentForm && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 grid grid-cols-3 gap-3">
              <input placeholder="Amount Received (KSh)" type="number" value={paymentForm.amount}
                onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              <input placeholder="Note (optional)" value={paymentForm.note}
                onChange={e => setPaymentForm({ ...paymentForm, note: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              <input type="date" value={paymentForm.receivedAt}
                onChange={e => setPaymentForm({ ...paymentForm, receivedAt: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              <div className="col-span-3 flex gap-3">
                <button onClick={addPayment} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium">Save Payment</button>
                <button onClick={() => setShowPaymentForm(false)} className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium">Cancel</button>
              </div>
            </div>
          )}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {!project.payments?.length ? (
              <div className="px-6 py-12 text-center text-zinc-600">No payments recorded yet. Click "Record Payment" to add one.</div>
            ) : project.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 hover:bg-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 text-sm">ðŸ’°</div>
                  <div>
                    <p className="text-white font-medium">{payment.note || 'Payment received'}</p>
                    <p className="text-zinc-500 text-xs">{payment.receivedAt ? new Date(payment.receivedAt).toLocaleDateString() : '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-green-400 font-bold text-lg">KSh {Number(payment.amount).toLocaleString()}</p>
                  <button onClick={() => removePayment(payment.id)} className="text-red-500 hover:text-red-400 text-sm font-medium">Delete</button>
                </div>
              </div>
            ))}
          </div>
          {project.payments?.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center">
              <div className="flex gap-8">
                <div>
                  <p className="text-zinc-500 text-xs">Total Received</p>
                  <p className="text-green-400 font-bold">KSh {totalEarned.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs">Total Spent</p>
                  <p className="text-orange-400 font-bold">KSh {totalExpenses.toLocaleString()}</p>
                </div>
                {project.quotation && (
                  <div>
                    <p className="text-zinc-500 text-xs">Outstanding</p>
                    <p className="text-white font-bold">KSh {(Number(project.quotation) - totalEarned).toLocaleString()}</p>
                  </div>
                )}
              </div>
              <div className={`text-right px-4 py-2 rounded-lg ${isProfit ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <p className="text-zinc-500 text-xs">Net</p>
                <p className={`font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                  {isProfit ? '+' : ''}KSh {profit.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EMPLOYEES TAB */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-zinc-400 text-sm">{project.employees?.length || 0} employees assigned</p>
            <button onClick={() => setShowEmployeeForm(!showEmployeeForm)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Assign Employee</button>
          </div>
          {showEmployeeForm && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-3">
              <select value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select Employee</option>
                {availableEmployees.map(e => <option key={e.id} value={e.id}>{e.name} â€” {e.role}</option>)}
              </select>
              <button onClick={assignEmployee} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Assign</button>
              <button onClick={() => setShowEmployeeForm(false)} className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Cancel</button>
            </div>
          )}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {!project.employees?.length ? (
              <div className="px-6 py-12 text-center text-zinc-600">No employees assigned yet.</div>
            ) : project.employees.map(({ employee }) => (
              <div key={employee.id} className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 hover:bg-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 text-sm font-bold">
                    {employee.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{employee.name}</p>
                    <p className="text-zinc-500 text-xs">{employee.role} â€” {employee.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-green-400 text-sm">KSh {Number(employee.salary).toLocaleString()}</p>
                  <button onClick={() => removeEmployee(employee.id)} className="text-red-500 hover:text-red-400 text-sm font-medium">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-zinc-400 text-sm">{project.inventory?.length || 0} items assigned</p>
            <button onClick={() => setShowInventoryForm(!showInventoryForm)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Add Inventory</button>
          </div>
          {showInventoryForm && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-3">
              <select value={selectedInventoryId} onChange={e => setSelectedInventoryId(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select Item</option>
                {availableInventory.map(i => <option key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit} available)</option>)}
              </select>
              <input type="number" placeholder="Quantity" value={inventoryQuantity}
                onChange={e => setInventoryQuantity(e.target.value)}
                className="w-28 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              <button onClick={addInventory} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Add</button>
              <button onClick={() => setShowInventoryForm(false)} className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Cancel</button>
            </div>
          )}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {!project.inventory?.length ? (
              <div className="px-6 py-12 text-center text-zinc-600">No inventory assigned yet.</div>
            ) : project.inventory.map(({ inventory, quantity }) => (
              <div key={inventory.id} className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 hover:bg-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-sm">ðŸ“¦</div>
                  <div>
                    <p className="text-white font-medium">{inventory.name}</p>
                    <p className="text-zinc-500 text-xs">{inventory.unit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <p className="text-white text-sm">Qty: <span className="font-bold text-orange-400">{quantity}</span></p>
                  <p className="text-zinc-400 text-sm">KSh {Number(inventory.price).toLocaleString()} each</p>
                  <p className="text-green-400 text-sm font-medium">KSh {(quantity * Number(inventory.price)).toLocaleString()}</p>
                  <button onClick={() => removeInventory(inventory.id)} className="text-red-500 hover:text-red-400 text-sm font-medium">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-zinc-400 text-sm">{project.expenses?.length || 0} expenses â€” Total: KSh {totalExpenses.toLocaleString()}</p>
            <button onClick={() => setShowExpenseForm(!showExpenseForm)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Add Expense</button>
          </div>
          {showExpenseForm && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 grid grid-cols-3 gap-3">
              <input placeholder="Expense Title" value={expenseForm.title}
                onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              <input placeholder="Amount (KSh)" type="number" value={expenseForm.amount}
                onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500" />
              <select value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select Category</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="materials">Materials</option>
                <option value="labour">Labour</option>
                <option value="equipment">Equipment</option>
                <option value="other">Other</option>
              </select>
              <div className="col-span-3 flex gap-3">
                <button onClick={addExpense} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium">Save Expense</button>
                <button onClick={() => setShowExpenseForm(false)} className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium">Cancel</button>
              </div>
            </div>
          )}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {!project.expenses?.length ? (
              <div className="px-6 py-12 text-center text-zinc-600">No expenses yet.</div>
            ) : project.expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 hover:bg-zinc-800/50">
                <div>
                  <p className="text-white font-medium">{expense.title}</p>
                  <p className="text-zinc-500 text-xs">{expense.createdAt ? new Date(expense.createdAt).toLocaleDateString() : '-'}</p>
                </div>
                <div className="flex items-center gap-6">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    expense.category === 'paid' ? 'bg-green-500/20 text-green-400' :
                    expense.category === 'pending' ? 'bg-red-500/20 text-red-400' :
                    expense.category === 'materials' ? 'bg-blue-500/20 text-blue-400' :
                    expense.category === 'labour' ? 'bg-purple-500/20 text-purple-400' :
                    expense.category === 'equipment' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-zinc-700 text-zinc-400'
                  }`}>{expense.category || 'uncategorized'}</span>
                  <p className="text-orange-400 font-bold">KSh {Number(expense.amount).toLocaleString()}</p>
                  <button onClick={() => removeExpense(expense.id)} className="text-red-500 hover:text-red-400 text-sm font-medium">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice Generator Modal */}
      {showInvoice && (
        <InvoiceGenerator project={project} onClose={() => setShowInvoice(false)} />
      )}
    </div>
  )
}