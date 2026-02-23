const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('@prisma/client')

const app = express()
const prisma = new PrismaClient()
const PORT = 5000

app.use(cors())
app.use(express.json())

// ─────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────

// GET all projects (with payments + expenses for financial summary)
app.get('/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        payments: true,
        expenses: true,
        employees: true,
      },
    })
    res.json(projects)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

// GET single project detail (full data for ProjectDetail.jsx)
app.get('/projects/:id/detail', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        payments: { orderBy: { receivedAt: 'desc' } },
        expenses: { orderBy: { createdAt: 'desc' } },
        employees: {
          include: { employee: true },
        },
        inventory: {
          include: { inventory: true },
        },
      },
    })
    if (!project) return res.status(404).json({ error: 'Project not found' })
    res.json(project)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch project detail' })
  }
})

// POST create project
app.post('/projects', async (req, res) => {
  try {
    const { name, description, status, startDate, endDate, quotation } = req.body
    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: status || 'pending',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        quotation: quotation ? Number(quotation) : null,
      },
    })
    res.status(201).json(project)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create project' })
  }
})

// PUT update project
app.put('/projects/:id', async (req, res) => {
  try {
    const { name, description, status, startDate, endDate, quotation } = req.body
    const project = await prisma.project.update({
      where: { id: Number(req.params.id) },
      data: {
        name,
        description,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        quotation: quotation ? Number(quotation) : null,
      },
    })
    res.json(project)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update project' })
  }
})

// DELETE project
app.delete('/projects/:id', async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: Number(req.params.id) } })
    res.json({ message: 'Project deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

// ─────────────────────────────────────────────
// PAYMENTS  ← THIS WAS YOUR MISSING ROUTE
// ─────────────────────────────────────────────

// POST record a payment
app.post('/projects/:id/payments', async (req, res) => {
  try {
    const { amount, note, receivedAt } = req.body
    if (!amount) return res.status(400).json({ error: 'Amount is required' })

    const payment = await prisma.payment.create({
      data: {
        projectId: Number(req.params.id),
        amount: Number(amount),
        note: note || null,
        receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
      },
    })
    res.status(201).json(payment)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to record payment' })
  }
})

// DELETE a payment
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

// POST add expense
app.post('/projects/:id/expenses', async (req, res) => {
  try {
    const { title, amount, category } = req.body
    if (!title) return res.status(400).json({ error: 'Title is required' })
    if (!amount) return res.status(400).json({ error: 'Amount is required' })

    const expense = await prisma.expense.create({
      data: {
        projectId: Number(req.params.id),
        title,
        amount: Number(amount),
        category: category || null,
      },
    })
    res.status(201).json(expense)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to add expense' })
  }
})

// DELETE an expense
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

// POST assign employee to project
app.post('/projects/:id/employees', async (req, res) => {
  try {
    const { employeeId } = req.body
    const assignment = await prisma.projectEmployee.create({
      data: {
        projectId: Number(req.params.id),
        employeeId: Number(employeeId),
      },
    })
    res.status(201).json(assignment)
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Employee already assigned' })
    console.error(err)
    res.status(500).json({ error: 'Failed to assign employee' })
  }
})

// DELETE remove employee from project
app.delete('/projects/:id/employees/:employeeId', async (req, res) => {
  try {
    await prisma.projectEmployee.deleteMany({
      where: {
        projectId: Number(req.params.id),
        employeeId: Number(req.params.employeeId),
      },
    })
    res.json({ message: 'Employee removed from project' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to remove employee' })
  }
})

// ─────────────────────────────────────────────
// PROJECT INVENTORY
// ─────────────────────────────────────────────

// POST add inventory to project
app.post('/projects/:id/inventory', async (req, res) => {
  try {
    const { inventoryId, quantity } = req.body
    const item = await prisma.projectInventory.create({
      data: {
        projectId: Number(req.params.id),
        inventoryId: Number(inventoryId),
        quantity: Number(quantity),
      },
    })
    res.status(201).json(item)
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Inventory item already added' })
    console.error(err)
    res.status(500).json({ error: 'Failed to add inventory' })
  }
})

// DELETE remove inventory from project
app.delete('/projects/:id/inventory/:inventoryId', async (req, res) => {
  try {
    await prisma.projectInventory.deleteMany({
      where: {
        projectId: Number(req.params.id),
        inventoryId: Number(req.params.inventoryId),
      },
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

// GET all employees
app.get('/employees', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } })
    res.json(employees)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch employees' })
  }
})

// POST create employee
app.post('/employees', async (req, res) => {
  try {
    const { name, email, phone, role, department, salary } = req.body
    const employee = await prisma.employee.create({
      data: { name, email, phone, role, department, salary: salary ? Number(salary) : null },
    })
    res.status(201).json(employee)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create employee' })
  }
})

// PUT update employee
app.put('/employees/:id', async (req, res) => {
  try {
    const { name, email, phone, role, department, salary } = req.body
    const employee = await prisma.employee.update({
      where: { id: Number(req.params.id) },
      data: { name, email, phone, role, department, salary: salary ? Number(salary) : null },
    })
    res.json(employee)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update employee' })
  }
})

// DELETE employee
app.delete('/employees/:id', async (req, res) => {
  try {
    await prisma.employee.delete({ where: { id: Number(req.params.id) } })
    res.json({ message: 'Employee deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete employee' })
  }
})

// ─────────────────────────────────────────────
// INVENTORY
// ─────────────────────────────────────────────

// GET all inventory
app.get('/inventory', async (req, res) => {
  try {
    const items = await prisma.inventory.findMany({ orderBy: { name: 'asc' } })
    res.json(items)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch inventory' })
  }
})

// POST create inventory item
app.post('/inventory', async (req, res) => {
  try {
    const { name, quantity, unit, price } = req.body
    const item = await prisma.inventory.create({
      data: { name, quantity: Number(quantity), unit, price: price ? Number(price) : null },
    })
    res.status(201).json(item)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create inventory item' })
  }
})

// PUT update inventory item
app.put('/inventory/:id', async (req, res) => {
  try {
    const { name, quantity, unit, price } = req.body
    const item = await prisma.inventory.update({
      where: { id: Number(req.params.id) },
      data: { name, quantity: Number(quantity), unit, price: price ? Number(price) : null },
    })
    res.json(item)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update inventory item' })
  }
})

// DELETE inventory item
app.delete('/inventory/:id', async (req, res) => {
  try {
    await prisma.inventory.delete({ where: { id: Number(req.params.id) } })
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
    const customers = await prisma.customer.findMany({ orderBy: { name: 'asc' } })
    res.json(customers)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers' })
  }
})

app.post('/customers', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body
    const customer = await prisma.customer.create({ data: { name, email, phone, address } })
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
    await prisma.customer.delete({ where: { id: Number(req.params.id) } })
    res.json({ message: 'Customer deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete customer' })
  }
})

// ─────────────────────────────────────────────
// EXPENSES (standalone — not project-specific)
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
// START
// ─────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ Ndiwanjo server running on http://localhost:${PORT}`)
})