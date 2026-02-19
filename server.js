const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Server is running!')
})

// ---- EMPLOYEES ----
app.get('/employees', async (req, res) => {
  const employees = await prisma.employee.findMany()
  res.json(employees)
})

app.post('/employees', async (req, res) => {
  const { name, email, phone, role, department, salary } = req.body
  const employee = await prisma.employee.create({
    data: { name, email, phone, role, department, salary: parseFloat(salary) }
  })
  res.json(employee)
})

app.delete('/employees/:id', async (req, res) => {
  const { id } = req.params
  await prisma.employee.delete({ where: { id: parseInt(id) } })
  res.json({ message: 'Employee deleted' })
})

// ---- CUSTOMERS ----
app.get('/customers', async (req, res) => {
  const customers = await prisma.customer.findMany()
  res.json(customers)
})

app.post('/customers', async (req, res) => {
  const { name, email, phone, address } = req.body
  const customer = await prisma.customer.create({
    data: { name, email, phone, address }
  })
  res.json(customer)
})

app.delete('/customers/:id', async (req, res) => {
  const { id } = req.params
  await prisma.customer.delete({ where: { id: parseInt(id) } })
  res.json({ message: 'Customer deleted' })
})

// ---- PROJECTS ----
app.get('/projects', async (req, res) => {
  const projects = await prisma.project.findMany()
  res.json(projects)
})

app.post('/projects', async (req, res) => {
  const { name, description, status, startDate, endDate } = req.body
  const project = await prisma.project.create({
    data: { name, description, status, startDate: new Date(startDate), endDate: new Date(endDate) }
  })
  res.json(project)
})

app.delete('/projects/:id', async (req, res) => {
  const { id } = req.params
  await prisma.project.delete({ where: { id: parseInt(id) } })
  res.json({ message: 'Project deleted' })
})

// ---- INVENTORY ----
app.get('/inventory', async (req, res) => {
  const items = await prisma.inventory.findMany()
  res.json(items)
})

app.post('/inventory', async (req, res) => {
  const { name, quantity, unit, price } = req.body
  const item = await prisma.inventory.create({
    data: { name, quantity: parseInt(quantity), unit, price: parseFloat(price) }
  })
  res.json(item)
})

app.delete('/inventory/:id', async (req, res) => {
  const { id } = req.params
  await prisma.inventory.delete({ where: { id: parseInt(id) } })
  res.json({ message: 'Item deleted' })
})

app.listen(5000, () => {
  console.log('Server running on port 5000')
})