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

app.get('/', (req, res) => {
  res.send('Server is running!')
})

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

app.get('/employees', async (req, res) => {
  const employees = await prisma.employee.findMany()
  res.json(employees)
})

app.post('/employees', async (req, res) => {
  const { name, email, phone, role, department, salary } = req.body
  const employee = await prisma.employee.create({ data: { name, email, phone, role, department, salary: parseFloat(salary) } })
  res.json(employee)
})

app.delete('/employees/:id', async (req, res) => {
  await prisma.employee.delete({ where: { id: parseInt(req.params.id) } })
  res.json({ message: 'Deleted' })
})

app.get('/customers', async (req, res) => {
  const customers = await prisma.customer.findMany()
  res.json(customers)
})

app.post('/customers', async (req, res) => {
  const { name, email, phone, address } = req.body
  const customer = await prisma.customer.create({ data: { name, email, phone, address } })
  res.json(customer)
})

app.delete('/customers/:id', async (req, res) => {
  await prisma.customer.delete({ where: { id: parseInt(req.params.id) } })
  res.json({ message: 'Deleted' })
})

app.get('/projects', async (req, res) => {
  const projects = await prisma.project.findMany()
  res.json(projects)
})

app.post('/projects', async (req, res) => {
  const { name, description, status, startDate, endDate } = req.body
  const project = await prisma.project.create({ data: { name, description, status, startDate: new Date(startDate), endDate: new Date(endDate) } })
  res.json(project)
})

app.delete('/projects/:id', async (req, res) => {
  await prisma.project.delete({ where: { id: parseInt(req.params.id) } })
  res.json({ message: 'Deleted' })
})

app.get('/inventory', async (req, res) => {
  const items = await prisma.inventory.findMany()
  res.json(items)
})

app.post('/inventory', async (req, res) => {
  const { name, quantity, unit, price } = req.body
  const item = await prisma.inventory.create({ data: { name, quantity: parseInt(quantity), unit, price: parseFloat(price) } })
  res.json(item)
})

app.delete('/inventory/:id', async (req, res) => {
  await prisma.inventory.delete({ where: { id: parseInt(req.params.id) } })
  res.json({ message: 'Deleted' })
})

app.listen(5000, () => console.log('Server running on port 5000'))
