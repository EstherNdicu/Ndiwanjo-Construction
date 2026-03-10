const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('@prisma/client')

const app = express()
const prisma = new PrismaClient()
const PORT = 5000

app.use(cors())
app.use(express.json())

// ─────────────────────────────────────────────
// HELPER: Log activity automatically
// ─────────────────────────────────────────────
const logActivity = async (description, bold = '') => {
  try {
    await prisma.activity.create({ data: { description, bold } })
  } catch (err) {
    console.error('Activity log failed:', err.message)
  }
}

// ─────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────

app.get('/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        payments: true,
        expenses: true,
        employees: true,
        customer: true, // ✅ include linked customer
      },
    })
    res.json(projects)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

app.get('/projects/:id/detail', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        payments: { orderBy: { receivedAt: 'desc' } },
        expenses: { orderBy: { createdAt: 'desc' } },
        employees: { include: { employee: true } },
        inventory: { include: { inventory: true } },
        customer: true, // ✅ include linked customer
      },
    })
    if (!project) return res.status(404).json({ error: 'Project not found' })
    res.json(project)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch project detail' })
  }
})

app.post('/projects', async (req, res) => {
  try {
    const { name, description, status, startDate, endDate, quotation, progress, customerId } = req.body
    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: status || 'pending',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        quotation: quotation ? Number(quotation) : null,
        progress: progress ? Number(progress) : 0,
        customerId: customerId ? Number(customerId) : null, // ✅
      },
    })
    await logActivity('New project created:', name)
    res.status(201).json(project)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create project' })
  }
})

app.put('/projects/:id', async (req, res) => {
  try {
    const { name, description, status, startDate, endDate, quotation, progress, customerId } = req.body
    const project = await prisma.project.update({
      where: { id: Number(req.params.id) },
      data: {
        name,
        description,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        quotation: quotation ? Number(quotation) : null,
        progress: progress !== undefined ? Number(progress) : undefined,
        customerId: customerId ? Number(customerId) : null, // ✅
      },
    })
    await logActivity('Project updated:', name)
    res.json(project)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update project' })
  }
})

// PATCH just the progress field
app.patch('/projects/:id/progress', async (req, res) => {
  try {
    const { progress } = req.body
    const project = await prisma.project.update({
      where: { id: Number(req.params.id) },
      data: { progress: Number(progress) },
    })
    await logActivity(`Project progress updated to ${progress}%:`, project.name)
    res.json(project)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update progress' })
  }
})

app.delete('/projects/:id', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: Number(req.params.id) } })
    await prisma.project.delete({ where: { id: Number(req.params.id) } })
    await logActivity('Project deleted:', project?.name || 'Unknown')
    res.json({ message: 'Project deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

// ─────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────

app.post('/projects/:id/payments', async (req, res) => {
  try {
    const { amount, note, receivedAt } = req.body
    if (!amount) return res.status(400).json({ error: 'Amount is required' })
    const project = await prisma.project.findUnique({ where: { id: Number(req.params.id) } })
    const payment = await prisma.payment.create({
      data: {
        projectId: Number(req.params.id),
        amount: Number(amount),
        note: note || null,
        receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
      },
    })
    await logActivity(`Payment of KSh ${Number(amount).toLocaleString()} recorded for`, project?.name || 'project')
    res.status(201).json(payment)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to record payment' })
  }
})

app.delete('/projects/:id/payments/:paymentId', async (req, res) => {
  try {
    await prisma.payment.delete({ where: { id: Number(req.params.paymentId) } })
    res.json({ message: 'Payment deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete payment' })
  }
})

// ─────────────────────────────────────────────
// EXPENSES
// ─────────────────────────────────────────────

app.post('/projects/:id/expenses', async (req, res) => {
  try {
    const { title, amount, category } = req.body
    if (!title) return res.status(400).json({ error: 'Title is required' })
    if (!amount) return res.status(400).json({ error: 'Amount is required' })
    const project = await prisma.project.findUnique({ where: { id: Number(req.params.id) } })
    const expense = await prisma.expense.create({
      data: {
        projectId: Number(req.params.id),
        title,
        amount: Number(amount),
        category: category || null,
      },
    })
    await logActivity(`Expense "${title}" of KSh ${Number(amount).toLocaleString()} added to`, project?.name || 'project')
    res.status(201).json(expense)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to add expense' })
  }
})

app.delete('/projects/:id/expenses/:expenseId', async (req, res) => {
  try {
    await prisma.expense.delete({ where: { id: Number(req.params.expenseId) } })
    res.json({ message: 'Expense deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete expense' })
  }
})

// ─────────────────────────────────────────────
// PROJECT EMPLOYEES
// ─────────────────────────────────────────────

app.post('/projects/:id/employees', async (req, res) => {
  try {
    const { employeeId } = req.body
    const project = await prisma.project.findUnique({ where: { id: Number(req.params.id) } })
    const employee = await prisma.employee.findUnique({ where: { id: Number(employeeId) } })
    const assignment = await prisma.projectEmployee.create({
      data: { projectId: Number(req.params.id), employeeId: Number(employeeId) },
    })
    await logActivity(`${employee?.name || 'Employee'} assigned to`, project?.name || 'project')
    res.status(201).json(assignment)
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Employee already assigned' })
    console.error(err)
    res.status(500).json({ error: 'Failed to assign employee' })
  }
})

app.delete('/projects/:id/employees/:employeeId', async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({ where: { id: Number(req.params.employeeId) } })
    const project = await prisma.project.findUnique({ where: { id: Number(req.params.id) } })
    await prisma.projectEmployee.deleteMany({
      where: { projectId: Number(req.params.id), employeeId: Number(req.params.employeeId) },
    })
    await logActivity(`${employee?.name || 'Employee'} removed from`, project?.name || 'project')
    res.json({ message: 'Employee removed from project' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to remove employee' })
  }
})

// ─────────────────────────────────────────────
// PROJECT INVENTORY
// ─────────────────────────────────────────────

app.post('/projects/:id/inventory', async (req, res) => {
  try {
    const { inventoryId, quantity } = req.body
    const project = await prisma.project.findUnique({ where: { id: Number(req.params.id) } })
    const inventoryItem = await prisma.inventory.findUnique({ where: { id: Number(inventoryId) } })
    const item = await prisma.projectInventory.create({
      data: { projectId: Number(req.params.id), inventoryId: Number(inventoryId), quantity: Number(quantity) },
    })
    await logActivity(`${inventoryItem?.name || 'Item'} (x${quantity}) added to`, project?.name || 'project')
    res.status(201).json(item)
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Inventory item already added' })
    console.error(err)
    res.status(500).json({ error: 'Failed to add inventory' })
  }
})

app.delete('/projects/:id/inventory/:inventoryId', async (req, res) => {
  try {
    await prisma.projectInventory.deleteMany({
      where: { projectId: Number(req.params.id), inventoryId: Number(req.params.inventoryId) },
    })
    res.json({ message: 'Inventory removed from project' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to remove inventory' })
  }
})

// ─────────────────────────────────────────────
// EMPLOYEES
// ─────────────────────────────────────────────

app.get('/employees', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } })
    res.json(employees)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch employees' })
  }
})

app.post('/employees', async (req, res) => {
  try {
    const { name, email, phone, role, department, salary } = req.body
    const employee = await prisma.employee.create({
      data: { name, email, phone, role, department, salary: salary ? Number(salary) : null },
    })
    await logActivity('New employee added:', name)
    res.status(201).json(employee)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create employee' })
  }
})

app.put('/employees/:id', async (req, res) => {
  try {
    const { name, email, phone, role, department, salary } = req.body
    const employee = await prisma.employee.update({
      where: { id: Number(req.params.id) },
      data: { name, email, phone, role, department, salary: salary ? Number(salary) : null },
    })
    await logActivity('Employee updated:', name)
    res.json(employee)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update employee' })
  }
})

app.delete('/employees/:id', async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({ where: { id: Number(req.params.id) } })
    await prisma.employee.delete({ where: { id: Number(req.params.id) } })
    await logActivity('Employee removed:', employee?.name || 'Unknown')
    res.json({ message: 'Employee deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete employee' })
  }
})

// ─────────────────────────────────────────────
// INVENTORY
// ─────────────────────────────────────────────

app.get('/inventory', async (req, res) => {
  try {
    const items = await prisma.inventory.findMany({ orderBy: { name: 'asc' } })
    res.json(items)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch inventory' })
  }
})

app.post('/inventory', async (req, res) => {
  try {
    const { name, quantity, unit, price } = req.body
    const item = await prisma.inventory.create({
      data: { name, quantity: Number(quantity), unit, price: price ? Number(price) : null },
    })
    await logActivity('Inventory item added:', name)
    res.status(201).json(item)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create inventory item' })
  }
})

app.put('/inventory/:id', async (req, res) => {
  try {
    const { name, quantity, unit, price } = req.body
    const item = await prisma.inventory.update({
      where: { id: Number(req.params.id) },
      data: { name, quantity: Number(quantity), unit, price: price ? Number(price) : null },
    })
    await logActivity('Inventory item updated:', name)
    res.json(item)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update inventory item' })
  }
})

app.delete('/inventory/:id', async (req, res) => {
  try {
    const item = await prisma.inventory.findUnique({ where: { id: Number(req.params.id) } })
    await prisma.inventory.delete({ where: { id: Number(req.params.id) } })
    await logActivity('Inventory item removed:', item?.name || 'Unknown')
    res.json({ message: 'Inventory item deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete inventory item' })
  }
})

// ─────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────

app.get('/customers', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' },
      include: { projects: true }, // ✅ include linked projects
    })
    res.json(customers)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers' })
  }
})

app.post('/customers', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body
    const customer = await prisma.customer.create({ data: { name, email, phone, address } })
    await logActivity('New customer added:', name)
    res.status(201).json(customer)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create customer' })
  }
})

app.put('/customers/:id', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body
    const customer = await prisma.customer.update({
      where: { id: Number(req.params.id) },
      data: { name, email, phone, address },
    })
    res.json(customer)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update customer' })
  }
})

app.delete('/customers/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { id: Number(req.params.id) } })
    await prisma.customer.delete({ where: { id: Number(req.params.id) } })
    await logActivity('Customer removed:', customer?.name || 'Unknown')
    res.json({ message: 'Customer deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete customer' })
  }
})

// ─────────────────────────────────────────────
// EXPENSES (standalone)
// ─────────────────────────────────────────────

app.get('/expenses', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { createdAt: 'desc' },
      include: { project: { select: { name: true } } },
    })
    res.json(expenses)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses' })
  }
})

// ─────────────────────────────────────────────
// ACTIVITY FEED
// ─────────────────────────────────────────────

app.get('/activities', async (req, res) => {
  try {
    const activities = await prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    res.json(activities)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activities' })
  }
})

// ─────────────────────────────────────────────
// AUTH — Login
// ─────────────────────────────────────────────

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid email or password' })
    if (!user.isActive) return res.status(403).json({ error: 'Account is disabled. Contact your administrator.' })
    const bcrypt = require('bcryptjs')
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' })
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Login failed' })
  }
})

// ─────────────────────────────────────────────
// USER MANAGEMENT (Admin only on frontend)
// ─────────────────────────────────────────────

app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
    })
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

app.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' })
    const bcrypt = require('bcryptjs')
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role || 'viewer' },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
    })
    await logActivity('New user added:', name)
    res.json(user)
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Email already exists' })
    res.status(500).json({ error: 'Failed to create user' })
  }
})

app.put('/users/:id', async (req, res) => {
  try {
    const { name, email, role, isActive, password } = req.body
    const data = { name, email, role, isActive }
    if (password) {
      const bcrypt = require('bcryptjs')
      data.password = await bcrypt.hash(password, 10)
    }
    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
    })
    await logActivity('User updated:', name)
    res.json(user)
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Email already exists' })
    res.status(500).json({ error: 'Failed to update user' })
  }
})

app.delete('/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ Ndiwanjo server running on http://localhost:${PORT}`)
})