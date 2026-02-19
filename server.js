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
  const { name, email, password } = req.body
  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.create({ data: { name, email, password: hashed } })
  res.json({ message: 'User created successfully' })
})

app.post('/login', async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ message: 'Invalid email or password' })
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ message: 'Invalid email or password' })
  const token = jwt.sign({ id: user.id, email: user.email }, 'secret123', { expiresIn: '1d' })
  res.json({ token, name: user.name })
})

// ---- EMPLOYEES ----
app.get('/employees', async (req, res) => {
  res.json(await prisma.employee.findMany())
})
app.post('/employees', async (req, res) => {
  const { name, email, phone, role, department, salary } = req.body
  res.json(await prisma.employee.create({ data: { name, email, phone, role, department, salary: parseFloat(salary) } }))
})
app.delete('/employees/:id', async (req, res) => {
  await prisma.employee.delete({ where: { id: parseInt(req.params.id) } })
  res.json({ message: 'Deleted' })
})

// ---- CUSTOMERS ----
app.get('/customers', async (req, res) => {
  res.json(await prisma.customer.findMany())
})
app.post('/customers', async (req, res) => {
  const { name, email, phone, address } = req.body
  res.json(await prisma.customer.create({ data: { name, email, phone, address } }))
})
app.delete('/customers/:id', async (req, res) => {
  await prisma.customer.delete({ where: { id: parseInt(req.params.id) } })
  res.json({ message: 'Deleted' })
})

// ---- PROJECTS ----
app.get('/projects', async (req, res) => {
  res.json(await prisma.project.findMany({ orderBy: { createdAt: 'desc' } }))
})
app.post('/projects', async (req, res) => {
  const { name, description, status, startDate, endDate } = req.body
  const project = await prisma.project.create({
    data: { name, description, status, startDate: new Date(startDate), endDate: new Date(endDate) }
  })
  await prisma.activity.create({ data: { description: 'New project created', bold: name } })
  res.json(project)
})
app.delete('/projects/:id', async (req, res) => {
  await prisma.project.delete({ where: { id: parseInt(req.params.id) } })
  res.json({ message: 'Deleted' })
})

// ---- INVENTORY ----
app.get('/inventory', async (req, res) => {
  res.json(await prisma.inventory.findMany({ orderBy: { createdAt: 'desc' } }))
})
app.post('/inventory', async (req, res) => {
  const { name, quantity, unit, price } = req.body
  const item = await prisma.inventory.create({
    data: { name, quantity: parseInt(quantity), unit, price: parseFloat(price) }
  })
  await prisma.activity.create({ data: { description: 'New inventory item added', bold: name } })
  res.json(item)
})
app.delete('/inventory/:id', async (req, res) => {
  await prisma.inventory.delete({ where: { id: parseInt(req.params.id) } })
  res.json({ message: 'Deleted' })
})

// ---- EXPENSES ----
app.get('/expenses', async (req, res) => {
  res.json(await prisma.expense.findMany({ orderBy: { createdAt: 'desc' } }))
})
app.post('/expenses', async (req, res) => {
  const { title, amount, category, projectName } = req.body
  const expense = await prisma.expense.create({
    data: { title, amount: parseFloat(amount), category, projectName }
  })
  await prisma.activity.create({ data: { description: 'New expense recorded', bold: title } })
  res.json(expense)
})
app.delete('/expenses/:id', async (req, res) => {
  await prisma.expense.delete({ where: { id: parseInt(req.params.id) } })
  res.json({ message: 'Deleted' })
})

// ---- ACTIVITIES ----
app.get('/activities', async (req, res) => {
  res.json(await prisma.activity.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }))
})

app.listen(5000, () => console.log('Server running on port 5000'))