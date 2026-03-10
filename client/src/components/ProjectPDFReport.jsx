import { useState } from 'react'

// Dynamically loads jsPDF from CDN
const loadJsPDF = () => new Promise((resolve, reject) => {
  if (window.jspdf) return resolve(window.jspdf.jsPDF)
  const script = document.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
  script.onload = () => resolve(window.jspdf.jsPDF)
  script.onerror = reject
  document.head.appendChild(script)
})

export default function ProjectPDFReport({ project }) {
  const [generating, setGenerating] = useState(false)

  const generatePDF = async () => {
    if (!project) return
    setGenerating(true)
    try {
      const JsPDF = await loadJsPDF()

      // Load settings
      let settings = {}
      try { settings = JSON.parse(localStorage.getItem('ndiwanjo_settings') || '{}') } catch {}
      const companyName = settings.companyName || 'Ndiwanjo Construction'
      const tagline = settings.tagline || 'Construction Management'
      const phone = settings.phone || ''
      const email = settings.email || ''
      const address = settings.address || ''
      const city = settings.city || ''
      const currency = settings.currency || 'KSh'
      const invoiceFooter = settings.invoiceFooter || 'Thank you for your business.'

      const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210
      const margin = 18
      const contentW = W - margin * 2

      // ── Colors ──────────────────────────────────────
      const navy = [10, 22, 40]
      const navyMid = [30, 58, 95]
      const gold = [201, 168, 76]
      const white = [255, 255, 255]
      const lightGray = [245, 246, 248]
      const midGray = [120, 130, 145]
      const darkText = [20, 30, 45]

      let y = 0

      // ── HEADER BAND ─────────────────────────────────
      doc.setFillColor(...navy)
      doc.rect(0, 0, W, 42, 'F')

      // Gold accent line
      doc.setFillColor(...gold)
      doc.rect(0, 42, W, 1.5, 'F')

      // Company name
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(...white)
      doc.text(companyName.toUpperCase(), margin, 16)

      // Tagline
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...gold)
      doc.text(tagline, margin, 22)

      // Contact info top right
      doc.setFontSize(7)
      doc.setTextColor(180, 195, 215)
      const contactLines = [phone, email, [address, city].filter(Boolean).join(', ')].filter(Boolean)
      contactLines.forEach((line, i) => {
        doc.text(line, W - margin, 13 + i * 5, { align: 'right' })
      })

      // Report label
      doc.setFillColor(...gold)
      doc.roundedRect(W - margin - 38, 26, 38, 12, 2, 2, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...navy)
      doc.text('PROJECT REPORT', W - margin - 19, 33.5, { align: 'center' })

      y = 52

      // ── PROJECT TITLE SECTION ────────────────────────
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(...darkText)
      doc.text(project.name, margin, y)
      y += 7

      if (project.description) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(...midGray)
        const descLines = doc.splitTextToSize(project.description, contentW)
        doc.text(descLines, margin, y)
        y += descLines.length * 4.5 + 2
      }

      // Status + dates row
      const statusColors = {
        active: [[201, 168, 76], [255, 248, 220]],
        completed: [[34, 197, 94], [220, 252, 231]],
        pending: [[99, 139, 186], [219, 234, 254]],
      }
      const [statusBg, statusText] = statusColors[project.status] || statusColors.pending

      doc.setFillColor(...statusText)
      doc.roundedRect(margin, y, 28, 7, 1.5, 1.5, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...statusBg)
      doc.text((project.status || 'pending').toUpperCase(), margin + 14, y + 4.8, { align: 'center' })

      // Dates
      if (project.startDate || project.endDate) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...midGray)
        const dateStr = [
          project.startDate ? `Start: ${new Date(project.startDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}` : null,
          project.endDate ? `Deadline: ${new Date(project.endDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}` : null,
        ].filter(Boolean).join('   |   ')
        doc.text(dateStr, margin + 32, y + 4.8)
      }

      y += 13

      // ── FINANCIAL SUMMARY CARDS ──────────────────────
      const payments = project.payments || []
      const expenses = project.expenses || []
      const quotation = Number(project.quotation) || 0
      const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0)
      const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
      const outstanding = quotation - totalPaid
      const profit = totalPaid - totalExpenses
      const progress = Number(project.progress) || 0

      const cards = [
        { label: 'Contract Value', value: `${currency} ${quotation.toLocaleString()}`, accent: navy },
        { label: 'Total Received', value: `${currency} ${totalPaid.toLocaleString()}`, accent: [22, 163, 74] },
        { label: 'Total Expenses', value: `${currency} ${totalExpenses.toLocaleString()}`, accent: [220, 100, 30] },
        { label: 'Outstanding', value: `${currency} ${Math.max(0, outstanding).toLocaleString()}`, accent: outstanding > 0 ? [200, 50, 50] : [22, 163, 74] },
      ]

      const cardW = (contentW - 9) / 4
      cards.forEach((card, i) => {
        const cx = margin + i * (cardW + 3)
        doc.setFillColor(...lightGray)
        doc.roundedRect(cx, y, cardW, 22, 2, 2, 'F')
        doc.setFillColor(...card.accent)
        doc.roundedRect(cx, y, cardW, 3, 1, 1, 'F')
        doc.rect(cx, y + 1.5, cardW, 1.5, 'F')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(...midGray)
        doc.text(card.label, cx + cardW / 2, y + 9, { align: 'center' })
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.setTextColor(...darkText)
        doc.text(card.value, cx + cardW / 2, y + 16, { align: 'center' })
      })

      y += 27

      // Progress bar
      doc.setFillColor(...lightGray)
      doc.roundedRect(margin, y, contentW, 10, 2, 2, 'F')
      if (progress > 0) {
        doc.setFillColor(...gold)
        doc.roundedRect(margin, y, (contentW * progress) / 100, 10, 2, 2, 'F')
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...navy)
      doc.text(`Project Progress: ${progress}%`, margin + 4, y + 6.5)
      doc.setTextColor(...white)
      if (progress > 20) doc.text(`${progress}% Complete`, margin + (contentW * progress) / 100 - 4, y + 6.5, { align: 'right' })

      y += 16

      // ── SECTION HELPER ───────────────────────────────
      const sectionHeader = (title, iconChar) => {
        doc.setFillColor(...navy)
        doc.rect(margin, y, contentW, 8, 'F')
        doc.setFillColor(...gold)
        doc.rect(margin, y, 2.5, 8, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(...white)
        doc.text(`${iconChar}  ${title}`, margin + 6, y + 5.5)
        y += 11
      }

      const tableHeader = (cols) => {
        doc.setFillColor(...navyMid)
        doc.rect(margin, y, contentW, 7, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.5)
        doc.setTextColor(...white)
        cols.forEach(col => {
          doc.text(col.label, col.align === 'right' ? margin + col.x + col.w - 1 : margin + col.x + 2, y + 5, { align: col.align || 'left' })
        })
        y += 7
      }

      const tableRow = (cols, data, rowIndex) => {
        if (rowIndex % 2 === 0) {
          doc.setFillColor(...lightGray)
          doc.rect(margin, y, contentW, 7, 'F')
        }
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(...darkText)
        cols.forEach((col, ci) => {
          const val = String(data[ci] || '-')
          if (col.align === 'right') {
            doc.text(val, margin + col.x + col.w - 1, y + 5, { align: 'right' })
          } else {
            const truncated = doc.splitTextToSize(val, col.w - 3)[0]
            doc.text(truncated, margin + col.x + 2, y + 5)
          }
        })
        y += 7
      }

      const tableTotalRow = (label, value) => {
        doc.setFillColor(...gold)
        doc.rect(margin, y, contentW, 8, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(...navy)
        doc.text(label, margin + 4, y + 5.5)
        doc.text(value, W - margin - 2, y + 5.5, { align: 'right' })
        y += 11
      }

      const checkPageBreak = (needed = 30) => {
        if (y + needed > 272) {
          doc.addPage()
          // Mini header on new pages
          doc.setFillColor(...navy)
          doc.rect(0, 0, W, 12, 'F')
          doc.setFillColor(...gold)
          doc.rect(0, 12, W, 0.8, 'F')
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(8)
          doc.setTextColor(...white)
          doc.text(companyName, margin, 8)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...gold)
          doc.text(`${project.name} — Project Report`, W - margin, 8, { align: 'right' })
          y = 20
        }
      }

      // ── PAYMENTS TABLE ───────────────────────────────
      if (payments.length > 0) {
        checkPageBreak(40)
        sectionHeader('Payments Received', '#')
        const pCols = [
          { label: '#', x: 0, w: 8 },
          { label: 'Date', x: 8, w: 38 },
          { label: 'Note', x: 46, w: 90 },
          { label: 'Amount', x: 136, w: 38, align: 'right' },
        ]
        tableHeader(pCols)
        payments.forEach((p, i) => {
          checkPageBreak(8)
          tableRow(pCols, [
            i + 1,
            p.receivedAt ? new Date(p.receivedAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
            p.note || '-',
            `${currency} ${Number(p.amount).toLocaleString()}`,
          ], i)
        })
        tableTotalRow('TOTAL RECEIVED', `${currency} ${totalPaid.toLocaleString()}`)
      }

      // ── EXPENSES TABLE ───────────────────────────────
      if (expenses.length > 0) {
        checkPageBreak(40)
        sectionHeader('Expenses', '$')
        const eCols = [
          { label: '#', x: 0, w: 8 },
          { label: 'Title', x: 8, w: 65 },
          { label: 'Category', x: 73, w: 40 },
          { label: 'Date', x: 113, w: 30 },
          { label: 'Amount', x: 143, w: 31, align: 'right' },
        ]
        tableHeader(eCols)
        expenses.forEach((e, i) => {
          checkPageBreak(8)
          tableRow(eCols, [
            i + 1,
            e.title || '-',
            e.category || '-',
            e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
            `${currency} ${Number(e.amount).toLocaleString()}`,
          ], i)
        })
        tableTotalRow('TOTAL EXPENSES', `${currency} ${totalExpenses.toLocaleString()}`)
      }

      // ── EMPLOYEES TABLE ──────────────────────────────
      const employees = project.employees || []
      if (employees.length > 0) {
        checkPageBreak(40)
        sectionHeader('Assigned Employees', '@')
        const empCols = [
          { label: '#', x: 0, w: 8 },
          { label: 'Name', x: 8, w: 60 },
          { label: 'Role', x: 68, w: 55 },
          { label: 'Department', x: 123, w: 51 },
        ]
        tableHeader(empCols)
        employees.forEach((emp, i) => {
          checkPageBreak(8)
          const e = emp.employee || emp
          tableRow(empCols, [i + 1, e.name || '-', e.role || '-', e.department || '-'], i)
        })
        y += 4
      }

      // ── INVENTORY TABLE ──────────────────────────────
      const inventoryItems = project.inventory || []
      if (inventoryItems.length > 0) {
        checkPageBreak(40)
        sectionHeader('Inventory Used', '*')
        const invCols = [
          { label: '#', x: 0, w: 8 },
          { label: 'Item', x: 8, w: 80 },
          { label: 'Unit', x: 88, w: 40 },
          { label: 'Qty', x: 128, w: 46, align: 'right' },
        ]
        tableHeader(invCols)
        inventoryItems.forEach((inv, i) => {
          checkPageBreak(8)
          const item = inv.inventory || inv
          tableRow(invCols, [i + 1, item.name || '-', item.unit || '-', inv.quantity || '-'], i)
        })
        y += 4
      }

      // ── PROFIT/LOSS SUMMARY ──────────────────────────
      checkPageBreak(50)
      sectionHeader('Financial Summary', '=')

      const summaryRows = [
        ['Contract Value (Quotation)', `${currency} ${quotation.toLocaleString()}`],
        ['Total Payments Received', `${currency} ${totalPaid.toLocaleString()}`],
        ['Total Expenses', `${currency} ${totalExpenses.toLocaleString()}`],
        ['Outstanding Balance', `${currency} ${Math.max(0, outstanding).toLocaleString()}`],
      ]
      summaryRows.forEach(([label, value], i) => {
        if (i % 2 === 0) { doc.setFillColor(...lightGray); doc.rect(margin, y, contentW, 8, 'F') }
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...darkText)
        doc.text(label, margin + 4, y + 5.5)
        doc.text(value, W - margin - 2, y + 5.5, { align: 'right' })
        y += 8
      })

      // Profit row
      const isProfit = profit >= 0
      doc.setFillColor(...(isProfit ? [220, 252, 231] : [254, 226, 226]))
      doc.rect(margin, y, contentW, 10, 'F')
      doc.setFillColor(...(isProfit ? [34, 197, 94] : [239, 68, 68]))
      doc.rect(margin, y, 3, 10, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...(isProfit ? [20, 100, 50] : [150, 20, 20]))
      doc.text(isProfit ? 'NET PROFIT' : 'NET LOSS', margin + 6, y + 6.8)
      doc.text(`${isProfit ? '+' : '-'}${currency} ${Math.abs(profit).toLocaleString()}`, W - margin - 2, y + 6.8, { align: 'right' })
      y += 14

      // ── FOOTER ───────────────────────────────────────
      checkPageBreak(25)
      doc.setFillColor(...navy)
      doc.rect(0, 282, W, 15, 'F')
      doc.setFillColor(...gold)
      doc.rect(0, 282, W, 0.8, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(180, 195, 215)
      doc.text(invoiceFooter, W / 2, 288, { align: 'center' })
      doc.setTextColor(...gold)
      doc.text(`Generated on ${new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}`, W / 2, 293, { align: 'center' })

      // Page numbers
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(...gold)
        doc.text(`Page ${i} of ${pageCount}`, W - margin, 293, { align: 'right' })
      }

      // Save
      const safeName = project.name.replace(/[^a-zA-Z0-9]/g, '_')
      doc.save(`${safeName}_Report_${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) {
      console.error(err)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <button
      onClick={generatePDF}
      disabled={generating}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
      style={{
        background: generating ? '#1e3a5f' : 'linear-gradient(135deg, #c9a84c, #a8883a)',
        color: generating ? '#6b7280' : '#0a1628',
        cursor: generating ? 'not-allowed' : 'pointer',
      }}
    >
      {generating ? (
        <>
          <span className="animate-spin">⏳</span> Generating...
        </>
      ) : (
        <>
          📄 Export PDF Report
        </>
      )}
    </button>
  )
}