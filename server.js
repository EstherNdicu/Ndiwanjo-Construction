const express = require('express')
const cors = require('cors')
const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

// Test route
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

app.listen(5000, () => {
  console.log('Server running on port 5000')
})