const express = require("express")
const cors = require("cors")
const { PrismaClient } = require("@prisma/client")

const app = express()
const prisma = new PrismaClient()
const PORT = 5000

app.use(cors())
app.use(express.json())

const logActivity = async (description, bold = "") => {
  try {
    await prisma.activity.create({ data: { description, bold } })
  } catch (err) {
    console.error("Activity log failed:", err.message)
  }
}

app.get("/projects", async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: { payments: true, expenses: true, employees: true, customer: true },
    })
    res.json(projects)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to fetch projects" })
  }
})

app.get("/projects/:id/detail", async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        payments: { orderBy: { receivedAt: "desc" } },
        expenses: { orderBy: { createdAt: "desc" } },
        employees: { include: { employee: true } },
        inventory: { include: { inventory: true } },
        customer: true,
      },
    })
    if (!project) return res.status(404).json({ error: "Project not found" })
    res.json(project)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to fetch project detail" })
  }
})

app.post("/projects", async (req, res) => {
  try {
    const { name, description, status, startDate, endDate, quotation, progress, customerId } = req.body
    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: status || "pending",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        quotation: quotation ? Number(quotation) : null,
        progress: progress ? Number(progress) : 0,
        customerId: customerId ? Number(customerId) : null,
      },
    })
    await logActivity("New project created:", name)
    res.status(201).json(project)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to create project" })
  }
})

app.put("/projects/:id", async (req, res) => {
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
        customerId: customerId ? Number(customerId) : null,
      },
    })
    await logActivity("Project updated:", name)
    res.json(project)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to update project" })
  }
})

app.patch("/projects/:id/progress", async (req, res) => {
  try {
    const { progress } = req.body
    const project = await prisma.project.update({
      where: { id: Number(req.params.id) },
      data: { progress: Number(progress) },
    })
    await logActivity("Project progress updated to " + progress + "%:", project.name)
    res.json(project)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to update progress" })
  }
})

app.delete("/projects/:id", async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: Number(req.params.id) } })
    await prisma.project.delete({ where: { id: Number(req.params.id) } })
    await logActivity("Project deleted:", project ? project.name : "Unknown")
    res.json({ message: "Project deleted" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to delete project" })
  }
})

app.post("/projects/:id/payments", async (req, res) => {
  try {
    const { amount, note, receivedAt } = req.body
    if (!amount) return res.status(400).json({ error: "Amount is required" })
    const project = await prisma.project.findUnique({ where: { id: Number(req.params.id) } })
    const payment = await prisma.payment.create({
      data: {
        projectId: Number(req.params.id),
        amount: Number(amount),
        note: note || null,
        receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
      },
    })
    await logActivity("Payment of KSh " + Number(amount).toLocaleString() + " recorded for", project ? project.name : "project")
    res.status(201).json(payment)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to record payment" })
  }
})

app.delete("/projects/:id/payments/:paymentId", async (req, res) => {
  try {
    await prisma.payment.delete({ where: { id: Number(req.params.paymentId) } })
    res.json({ message: "Payment deleted" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to delete payment" })
  }
})

app.post("/projects/:id/expenses", async (req, res) => {
  try {
    const { title, amount, category } = req.body
    if (!title) return res.status(400).json({ error: "Title is required" })
    if (!amount) return res.status(400).json({ error: "Amount is required" })
    const project = await prisma.project.findUnique({ where: { id: Number(req.params.id) } })
    const expense = await prisma.expense.create({
      data: {
        projectId: Number(req.params.id),
        title,
        amount: Number(amount),
        category: category || null,
      },
    })
    await logActivity("Expense " + title + " of KSh " + Number(amount).toLocaleString() + " added to", project ? project.name : "project")
    res.status(201).json(expense)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to add expense" })
  }
})

app.delete("/projects/:id/expenses/:expenseId", async (req, res) => {
  try {
    await prisma.expense.delete({ where: { id: Number(req.params.expenseId) } })
    res.json({ message: "Expense deleted" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to delete expense" })
  }
})

app.post("/projects/:id/employees", async (req, res) => {
  try {
    const { employeeId } = req.body
    const project = await prisma.project.findUnique({ where: { id: Number(req.params.id) } })
    const employee = await prisma.employee.findUnique({ where: { id: Number(employeeId) } })
    const assignment = await prisma.projectEmployee.create({
      data: { projectId: Number(req.params.id), employeeId: Number(employeeId) },
    })
    await logActivity((employee ? employee.name : "Employee") + " assigned to", project ? project.name : "project")
    res.status(201).json(assignment)
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Employee already assigned" })
    console.error(err)
    res.status(500).json({ error: "Failed to assign employee" })
  }
})

app.delete("/projects/:id/employees/:employeeId", async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({ where: { id: Number(req.params.employeeId) } })
    const project = await prisma.project.findUnique({ where: { id: Number(req.params.id) } })
    await prisma.projectEmployee.deleteMany({
      where: { projectId: Number(req.params.id), employeeId: Number(req.params.employeeId) },
    })
    await logActivity((employee ? employee.name : "Employee") + " removed from", project ? project.name : "project")
    res.json({ message: "Employee removed from project" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to remove employee" })
  }
})

app.post("/projects/:id/inventory", async (req, res) => {
  try {
    const { inventoryId, quantity } = req.body
    const project = await prisma.project.findUnique({ where: { id: Number(req.params.id) } })
    const inventoryItem = await prisma.inventory.findUnique({ where: { id: Number(inventoryId) } })
    const item = await prisma.projectInventory.create({
      data: { projectId: Number(req.params.id), inventoryId: Number(inventoryId), quantity: Number(quantity) },
    })
    await logActivity((inventoryItem ? inventoryItem.name : "Item") + " (x" + quantity + ") added to", project ? project.name : "project")
    res.status(201).json(item)
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Inventory item already added" })
    console.error(err)
    res.status(500).json({ error: "Failed to add inventory" })
  }
})

app.delete("/projects/:id/inventory/:inventoryId", async (req, res) => {
  try {
    await prisma.projectInventory.deleteMany({
      where: { projectId: Number(req.params.id), inventoryId: Number(req.params.inventoryId) },
    })
    res.json({ message: "Inventory removed from project" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to remove inventory" })
  }
})

app.get("/employees", async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({ orderBy: { name: "asc" } })
    res.json(employees)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to fetch employees" })
  }
})

app.post("/employees", async (req, res) => {
  try {
    const { name, email, phone, role, department, salary } = req.body
    const employee = await prisma.employee.create({
      data: { name, email, phone, role, department, salary: salary ? Number(salary) : null },
    })
    await logActivity("New employee added:", name)
    res.status(201).json(employee)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to create employee" })
  }
})

app.put("/employees/:id", async (req, res) => {
  try {
    const { name, email, phone, role, department, salary } = req.body
    const employee = await prisma.employee.update({
      where: { id: Number(req.params.id) },
      data: { name, email, phone, role, department, salary: salary ? Number(salary) : null },
    })
    await logActivity("Employee updated:", name)
    res.json(employee)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to update employee" })
  }
})

app.delete("/employees/:id", async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({ where: { id: Number(req.params.id) } })
    await prisma.employee.delete({ where: { id: Number(req.params.id) } })
    await logActivity("Employee removed:", employee ? employee.name : "Unknown")
    res.json({ message: "Employee deleted" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to delete employee" })
  }
})

app.get("/inventory", async (req, res) => {
  try {
    const items = await prisma.inventory.findMany({ orderBy: { name: "asc" } })
    res.json(items)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to fetch inventory" })
  }
})

app.post("/inventory", async (req, res) => {
  try {
    const { name, quantity, unit, price } = req.body
    const item = await prisma.inventory.create({
      data: { name, quantity: Number(quantity), unit, price: price ? Number(price) : null },
    })
    await logActivity("Inventory item added:", name)
    res.status(201).json(item)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to create inventory item" })
  }
})

app.put("/inventory/:id", async (req, res) => {
  try {
    const { name, quantity, unit, price } = req.body
    const item = await prisma.inventory.update({
      where: { id: Number(req.params.id) },
      data: { name, quantity: Number(quantity), unit, price: price ? Number(price) : null },
    })
    await logActivity("Inventory item updated:", name)
    res.json(item)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to update inventory item" })
  }
})

app.delete("/inventory/:id", async (req, res) => {
  try {
    const item = await prisma.inventory.findUnique({ where: { id: Number(req.params.id) } })
    await prisma.inventory.delete({ where: { id: Number(req.params.id) } })
    await logActivity("Inventory item removed:", item ? item.name : "Unknown")
    res.json({ message: "Inventory item deleted" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to delete inventory item" })
  }
})

app.get("/customers", async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: "asc" },
      include: { projects: { include: { payments: true } } },
    })
    res.json(customers)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers" })
  }
})

app.post("/customers", async (req, res) => {
  try {
    const { name, email, phone, address } = req.body
    const customer = await prisma.customer.create({ data: { name, email, phone, address } })
    await logActivity("New customer added:", name)
    res.status(201).json(customer)
  } catch (err) {
    res.status(500).json({ error: "Failed to create customer" })
  }
})

app.put("/customers/:id", async (req, res) => {
  try {
    const { name, email, phone, address } = req.body
    const customer = await prisma.customer.update({
      where: { id: Number(req.params.id) },
      data: { name, email, phone, address },
    })
    res.json(customer)
  } catch (err) {
    res.status(500).json({ error: "Failed to update customer" })
  }
})

app.delete("/customers/:id", async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { id: Number(req.params.id) } })
    await prisma.customer.delete({ where: { id: Number(req.params.id) } })
    await logActivity("Customer removed:", customer ? customer.name : "Unknown")
    res.json({ message: "Customer deleted" })
  } catch (err) {
    res.status(500).json({ error: "Failed to delete customer" })
  }
})

app.get("/expenses", async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { createdAt: "desc" },
      include: { project: { select: { name: true } } },
    })
    res.json(expenses)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch expenses" })
  }
})

app.post("/expenses", async (req, res) => {
  try {
    const { title, amount, category, projectId } = req.body
    if (!title) return res.status(400).json({ error: "Title is required" })
    if (!amount) return res.status(400).json({ error: "Amount is required" })
    const expense = await prisma.expense.create({
      data: {
        title,
        amount: Number(amount),
        category: category || null,
        projectId: projectId ? Number(projectId) : null,
      },
    })
    await logActivity("Expense " + title + " of KSh " + Number(amount).toLocaleString() + " added", "")
    res.status(201).json(expense)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to create expense" })
  }
})

app.put("/expenses/:id", async (req, res) => {
  try {
    const { title, amount, category, projectId } = req.body
    const expense = await prisma.expense.update({
      where: { id: Number(req.params.id) },
      data: {
        title,
        amount: Number(amount),
        category: category || null,
        projectId: projectId ? Number(projectId) : null,
      },
    })
    res.json(expense)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to update expense" })
  }
})

app.delete("/expenses/:id", async (req, res) => {
  try {
    await prisma.expense.delete({ where: { id: Number(req.params.id) } })
    res.json({ message: "Expense deleted" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to delete expense" })
  }
})

app.get("/activities", async (req, res) => {
  try {
    const activities = await prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    })
    res.json(activities)
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch activities" })
  }
})

app.listen(PORT, () => {
  console.log("Ndiwanjo server running on http://localhost:" + PORT)
})