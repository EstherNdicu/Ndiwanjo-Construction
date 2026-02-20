import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export default function Reports() {
  const [employees, setEmployees] = useState([])
  const [customers, setCustomers] = useState([])
  const [projects, setProjects] = useState([])
  const [inventory, setInventory] = useState([])
  const [expenses, setExpenses] = useState([])

  useEffect(() => {
    fetch('http://localhost:5000/employees').then(r => r.json()).then(setEmployees)
    fetch('http://localhost:5000/customers').then(r => r.json()).then(setCustomers)
    fetch('http://localhost:5000/projects').then(r => r.json()).then(setProjects)
    fetch('http://localhost:5000/inventory').then(r => r.json()).then(setInventory)
    fetch('http://localhost:5000/expenses').then(r => r.json()).then(setExpenses)
  }, [])

  const exportPDF = (title, columns, rows) => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Ndiwanjo Construction', 14, 20)
    doc.setFontSize(12)
    doc.text(title, 14, 30)
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38)
    autoTable(doc, {
      startY: 45,
      head: [columns],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    })
    doc.save(`${title}.pdf`)
  }

  const exportExcel = (title, columns, rows) => {
    const ws = XLSX.utils.aoa_to_sheet([columns, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, title)
    XLSX.writeFile(wb, `${title}.xlsx`)
  }

  const reports = [
    {
      title: 'Employees Report',
      icon: '👷',
      color: 'bg-orange-500',
      count: employees.length,
      columns: ['Name', 'Email', 'Phone', 'Role', 'Department', 'Salary'],
      rows: () => employees.map(e => [e.name, e.email, e.phone, e.role, e.department, `$${e.salary}`])
    },
    {
      title: 'Customers Report',
      icon: '👥',
      color: 'bg-green-500',
      count: customers.length,
      columns: ['Name', 'Email', 'Phone', 'Address'],
      rows: () => customers.map(c => [c.name, c.email, c.phone, c.address])
    },
    {
      title: 'Projects Report',
      icon: '🏗️',
      color: 'bg-blue-500',
      count: projects.length,
      columns: ['Name', 'Description', 'Status', 'Start Date', 'End Date'],
      rows: () => projects.map(p => [
        p.name, p.description, p.status,
        p.startDate ? new Date(p.startDate).toLocaleDateString() : '-',
        p.endDate ? new Date(p.endDate).toLocaleDateString() : '-'
      ])
    },
    {
      title: 'Inventory Report',
      icon: '📦',
      color: 'bg-purple-500',
      count: inventory.length,
      columns: ['Name', 'Quantity', 'Unit', 'Price', 'Total Value'],
      rows: () => inventory.map(i => [i.name, i.quantity, i.unit, `$${i.price}`, `$${(i.quantity * i.price).toFixed(2)}`])
    },
    {
      title: 'Expenses Report',
      icon: '💰',
      color: 'bg-red-500',
      count: expenses.length,
      columns: ['Title', 'Amount', 'Category', 'Project', 'Date'],
      rows: () => expenses.map(e => [
        e.title, `$${e.amount}`, e.category, e.projectName || '-',
        new Date(e.createdAt).toLocaleDateString()
      ])
    },
  ]

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const pendingExpenses = expenses.filter(e => e.category === 'pending').reduce((sum, e) => sum + e.amount, 0)

  const exportFullPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('Ndiwanjo Construction', 14, 20)
    doc.setFontSize(14)
    doc.text('Full Business Report', 14, 30)
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38)

    let y = 48

    reports.forEach((report) => {
      doc.setFontSize(13)
      doc.text(report.title, 14, y)
      y += 6
      autoTable(doc, {
        startY: y,
        head: [report.columns],
        body: report.rows(),
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14 },
      })
      y = doc.lastAutoTable.finalY + 12
      if (y > 250) { doc.addPage(); y = 20 }
    })

    doc.save('Ndiwanjo_Full_Report.pdf')
  }

  const exportFullExcel = () => {
    const wb = XLSX.utils.book_new()
    reports.forEach((report) => {
      const ws = XLSX.utils.aoa_to_sheet([report.columns, ...report.rows()])
      XLSX.utils.book_append_sheet(wb, ws, report.title.split(' ')[0])
    })
    XLSX.writeFile(wb, 'Ndiwanjo_Full_Report.xlsx')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Reports</h3>
          <p className="text-zinc-500 text-sm">Export your data to PDF or Excel</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportFullPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
            📄 Export All to PDF
          </button>
          <button onClick={exportFullExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
            📊 Export All to Excel
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-zinc-500 text-sm">Total Employees</p>
          <p className="text-3xl font-bold text-white mt-1">{employees.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-zinc-500 text-sm">Total Projects</p>
          <p className="text-3xl font-bold text-white mt-1">{projects.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-zinc-500 text-sm">Total Expenses</p>
          <p className="text-3xl font-bold text-orange-400 mt-1">${totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-zinc-500 text-sm">Pending Payments</p>
          <p className="text-3xl font-bold text-red-400 mt-1">${pendingExpenses.toLocaleString()}</p>
        </div>
      </div>

      {/* Individual Reports */}
      <div className="grid grid-cols-1 gap-4">
        {reports.map((report) => (
          <div key={report.title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`${report.color} w-12 h-12 rounded-xl flex items-center justify-center text-2xl`}>
                {report.icon}
              </div>
              <div>
                <h4 className="text-white font-semibold">{report.title}</h4>
                <p className="text-zinc-500 text-sm">{report.count} records available</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => exportPDF(report.title, report.columns, report.rows())}
                className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/30 px-4 py-2 rounded-lg text-sm font-medium transition-all">
                📄 PDF
              </button>
              <button
                onClick={() => exportExcel(report.title, report.columns, report.rows())}
                className="bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white border border-green-600/30 px-4 py-2 rounded-lg text-sm font-medium transition-all">
                📊 Excel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}