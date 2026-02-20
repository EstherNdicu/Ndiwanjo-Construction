const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => res.send('Server is running!'))

// ---- AUTH ----
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' })
    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.create({ data: { name, email, password: hashed } })
    res.json({ message: 'User created successfully' })
  } catch (e) { res.status(500).json({ message: e.message }) }
})

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' })
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ message: 'Invalid email or password' })
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' })
    const token = jwt.sign({ id: user.id, email: user.email }, 'secret123', { expiresIn: '1d' })
    res.json({ token, name: user.name })
  } catch (e) { res.status(500).json({ message: e.message }) }
})

// ---- EMPLOYEES ----
app.get('/employees', async (req, res) => {
  try { res.json(await prisma.employee.findMany()) }
  catch (e) { res.status(500).json({ message: e.message }) }
})
app.post('/employees', async (req, res) => {
  try {
    const { name, email, phone, role, department, salary } = req.body
    res.json(await prisma.employee.create({ data: { name, email, phone, role, department, salary: parseFloat(salary) } }))
  } catch (e) { res.status(500).json({ message: e.message }) }
})
app.put('/employees/:id', async (req, res) => {
  try {
    const { name, email, phone, role, department, salary } = req.body
    res.json(await prisma.employee.update({
      where: { id: parseInt(req.params.id) },
      data: { name, email, phone, role, department, salary: parseFloat(salary) }
    }))
  } catch (e) { res.status(500).json({ message: e.message }) }
})
app.delete('/employees/:id', async (req, res) => {
  try {
    await prisma.employee.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Deleted' })
  } catch (e) { res.status(500).json({ message: e.message }) }
})

// ---- CUSTOMERS ----
app.get('/customers', async (req, res) => {
  try { res.json(await prisma.customer.findMany()) }
  catch (e) { res.status(500).json({ message: e.message }) }
})
app.post('/customers', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body
    res.json(await prisma.customer.create({ data: { name, email, phone, address } }))
  } catch (e) { res.status(500).json({ message: e.message }) }
})
app.put('/customers/:id', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body
    res.json(await prisma.customer.update({
      where: { id: parseInt(req.params.id) },
      data: { name, email, phone, address }
    }))
  } catch (e) { res.status(500).json({ message: e.message }) }
})
app.delete('/customers/:id', async (req, res) => {
  try {
    await prisma.customer.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Deleted' })
  } catch (e) { res.status(500).json({ message: e.message }) }
})

// ---- PROJECTS ----
app.get('/projects', async (req, res) => {
  try { res.json(await prisma.project.findMany({ orderBy: { createdAt: 'desc' } })) }
  catch (e) { res.status(500).json({ message: e.message }) }
})
app.post('/projects', async (req, res) => {
  try {
    const { name, description, status, startDate, endDate } = req.body
    const project = await prisma.project.create({
      data: { name, description, status, startDate: new Date(startDate), endDate: new Date(endDate) }
    })
    await prisma.activity.create({ data: { description: 'New project created', bold: name } })
    res.json(project)
  } catch (e) { res.status(500).json({ message: e.message }) }
})
app.put('/projects/:id', async (req, res) => {
  try {
    const { name, description, status, startDate, endDate } = req.body
    res.json(await prisma.project.update({
      where: { id: parseInt(req.params.id) },
      data: { name, description, status, startDate: new Date(startDate), endDate: new Date(endDate) }
    }))
  } catch (e) { res.status(500).json({ message: e.message }) }
})
app.delete('/projects/:id', async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Deleted' })
  } catch (e) { res.status(500).json({ message: e.message }) }
})

// ---- INVENTORY ----
app.get('/inventory', async (req, res) => {
  try { res.json(await prisma.inventory.findMany({ orderBy: { createdAt: 'desc' } })) }
  catch (e) { res.status(500).json({ message: e.message }) }
})
app.post('/inventory', async (req, res) => {
  try {
    const { name, quantity, unit, price } = req.body
    const item = await prisma.inventory.create({
      data: { name, quantity: parseInt(quantity), unit, price: parseFloat(price) }
    })
    await prisma.activity.create({ data: { description: 'New inventory item added', bold: name } })
    res.json(item)
  } catch (e) { res.status(500).json({ message: e.message }) }
})
app.put('/inventory/:id', async (req, res) => {
  try {
    const { name, quantity, unit, price } = req.body
    res.json(await prisma.inventory.update({
      where: { id: parseInt(req.params.id) },
      data: { name, quantity: parseInt(quantity), unit, price: parseFloat(price) }
    }))
  } catch (e) { res.status(500).json({ message: e.message }) }
})
app.delete('/inventory/:id', async (req, res) => {
  try {
    await prisma.inventory.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Deleted' })
  } catch (e) { res.status(500).json({ message: e.message }) }
})

// ---- EXPENSES ----
app.get('/expenses', async (req, res) => {
  try { res.json(await prisma.expense.findMany({ orderBy: { createdAt: 'desc' } })) }
  catch (e) { res.status(500).json({ message: e.message }) }
})
app.post('/expenses', async (req, res) => {
  try {
    const { title, amount, category, projectName } = req.body
    const expense = await prisma.expense.create({
      data: { title, amount: parseFloat(amount), category, projectName }
    })
    await prisma.activity.create({ data: { description: 'New expense recorded', bold: title } })
    res.json(expense)
  } catch (e) { res.status(500).json({ message: e.message }) }
})
app.put('/expenses/:id', async (req, res) => {
  try {
    const { title, amount, category, projectName } = req.body
    res.json(await prisma.expense.update({
      where: { id: parseInt(req.params.id) },
      data: { title, amount: parseFloat(amount), category, projectName }
    }))
  } catch (e) { res.status(500).json({ message: e.message }) }
})
app.delete('/expenses/:id', async (req, res) => {
  try {
    await prisma.expense.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Deleted' })
  } catch (e) { res.status(500).json({ message: e.message }) }
})

// ---- ACTIVITIES ----
app.get('/activities', async (req, res) => {
  try { res.json(await prisma.activity.findMany({ orderBy: { createdAt: 'desc' }, take: 10 })) }
  catch (e) { res.status(500).json({ message: e.message }) }
})

app.listen(5000, () => console.log('Server running on port 5000'))