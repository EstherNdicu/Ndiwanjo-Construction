import { useState, useRef } from 'react'

export default function InvoiceGenerator({ project, onClose }) {
  const printRef = useRef()
  const [invoiceNumber] = useState(() => `INV-${Date.now().toString().slice(-6)}`)
  const [invoiceDate] = useState(() => new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [notes, setNotes] = useState('Thank you for your business.')
  const [showPreview, setShowPreview] = useState(false)

  const totalEarned = project?.payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0
  const totalExpenses = project?.expenses?.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0
  const quotation = Number(project?.quotation) || 0
  const outstanding = quotation - totalEarned

  const handlePrint = () => {
    const content = printRef.current.innerHTML
    const win = window.open('', '_blank')
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoiceNumber} - ${project?.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Georgia', serif; color: #1a1a1a; background: white; }
            .invoice { max-width: 800px; margin: 0 auto; padding: 48px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; border-bottom: 3px solid #f97316; padding-bottom: 32px; }
            .company-name { font-size: 28px; font-weight: bold; color: #1a1a1a; letter-spacing: -1px; }
            .company-sub { font-size: 13px; color: #888; margin-top: 4px; }
            .invoice-label { font-size: 36px; font-weight: bold; color: #f97316; text-align: right; }
            .invoice-meta { text-align: right; margin-top: 8px; font-size: 13px; color: #555; }
            .invoice-meta span { display: block; margin-bottom: 2px; }
            .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .party-label { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #f97316; margin-bottom: 10px; }
            .party-name { font-size: 16px; font-weight: bold; color: #1a1a1a; margin-bottom: 4px; }
            .party-detail { font-size: 13px; color: #555; margin-bottom: 2px; }
            .project-section { background: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 32px; }
            .project-title { font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; }
            .project-name { font-size: 20px; font-weight: bold; color: #1a1a1a; }
            .project-desc { font-size: 13px; color: #666; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { background: #1a1a1a; color: white; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
            th:last-child { text-align: right; }
            td { padding: 12px 16px; border-bottom: 1px solid #eee; font-size: 14px; color: #333; }
            td:last-child { text-align: right; font-weight: 600; }
            .totals { margin-left: auto; width: 280px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #555; border-bottom: 1px solid #eee; }
            .total-row.outstanding { font-size: 16px; font-weight: bold; color: #1a1a1a; border-bottom: none; border-top: 2px solid #1a1a1a; padding-top: 12px; margin-top: 4px; }
            .total-row.outstanding span:last-child { color: #f97316; }
            .notes { margin-top: 40px; padding-top: 24px; border-top: 1px solid #eee; }
            .notes-label { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 8px; }
            .notes-text { font-size: 13px; color: #555; line-height: 1.6; }
            .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #aaa; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `)
    win.document.close()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  const InvoiceContent = () => (
    <div className="invoice">
      {/* Header */}
      <div className="header">
        <div>
          <div className="company-name">Ndiwanjo Construction</div>
          <div className="company-sub">Professional Construction Services</div>
        </div>
        <div>
          <div className="invoice-label">INVOICE</div>
          <div className="invoice-meta">
            <span><strong>Invoice #:</strong> {invoiceNumber}</span>
            <span><strong>Date:</strong> {new Date(invoiceDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span><strong>Due:</strong> {new Date(dueDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Parties */}
      <div className="parties">
        <div>
          <div className="party-label">From</div>
          <div className="party-name">Ndiwanjo Construction</div>
          <div className="party-detail">Nairobi, Kenya</div>
          <div className="party-detail">info@ndiwanjo.co.ke</div>
        </div>
        <div>
          <div className="party-label">Bill To</div>
          <div className="party-name">{clientName || 'Client Name'}</div>
          {clientEmail && <div className="party-detail">{clientEmail}</div>}
          {clientPhone && <div className="party-detail">{clientPhone}</div>}
          {clientAddress && <div className="party-detail">{clientAddress}</div>}
        </div>
      </div>

      {/* Project */}
      <div className="project-section">
        <div className="project-title">Project</div>
        <div className="project-name">{project?.name}</div>
        {project?.description && <div className="project-desc">{project.description}</div>}
      </div>

      {/* Payments table */}
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Date</th>
            <th>Amount (KSh)</th>
          </tr>
        </thead>
        <tbody>
          {quotation > 0 && (
            <tr>
              <td><strong>Project Quotation</strong><br /><span style={{fontSize:'12px',color:'#888'}}>Agreed contract value</span></td>
              <td>{project?.startDate ? new Date(project.startDate).toLocaleDateString('en-KE') : '—'}</td>
              <td>KSh {quotation.toLocaleString()}</td>
            </tr>
          )}
          {project?.payments?.length > 0 && project.payments.map((p, i) => (
            <tr key={p.id}>
              <td>{p.note || `Payment ${i + 1}`}</td>
              <td>{p.receivedAt ? new Date(p.receivedAt).toLocaleDateString('en-KE') : '—'}</td>
              <td style={{color: '#16a34a'}}>KSh {Number(p.amount).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="totals">
        <div className="total-row">
          <span>Quotation Value</span>
          <span>KSh {quotation.toLocaleString()}</span>
        </div>
        <div className="total-row">
          <span>Total Received</span>
          <span style={{color:'#16a34a'}}>KSh {totalEarned.toLocaleString()}</span>
        </div>
        <div className="total-row outstanding">
          <span>Balance Due</span>
          <span>KSh {outstanding.toLocaleString()}</span>
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="notes">
          <div className="notes-label">Notes</div>
          <div className="notes-text">{notes}</div>
        </div>
      )}

      <div className="footer">
        Ndiwanjo Construction Management System • Generated {new Date().toLocaleDateString('en-KE')}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl my-4">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-white text-lg font-bold">Generate Invoice</h2>
            <p className="text-zinc-500 text-sm mt-0.5">{project?.name} • {invoiceNumber}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowPreview(!showPreview)}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              {showPreview ? 'Edit Details' : 'Preview'}
            </button>
            <button onClick={handlePrint}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              🖨️ Print / Save PDF
            </button>
            <button onClick={onClose}
              className="text-zinc-500 hover:text-white text-xl leading-none px-2">✕</button>
          </div>
        </div>

        {!showPreview ? (
          /* Edit Form */
          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <p className="text-zinc-400 text-sm font-medium mb-3">Client Details</p>
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Client / Company Name</label>
              <input value={clientName} onChange={e => setClientName(e.target.value)}
                placeholder="e.g. John Kamau"
                className="w-full bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Email</label>
              <input value={clientEmail} onChange={e => setClientEmail(e.target.value)}
                placeholder="client@email.com" type="email"
                className="w-full bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Phone</label>
              <input value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                className="w-full bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Address</label>
              <input value={clientAddress} onChange={e => setClientAddress(e.target.value)}
                placeholder="Nairobi, Kenya"
                className="w-full bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
            </div>
            <div className="col-span-2 border-t border-zinc-800 pt-4">
              <p className="text-zinc-400 text-sm font-medium mb-3">Invoice Details</p>
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
            </div>
            <div>
              <label className="text-zinc-500 text-xs mb-1 block">Notes</label>
              <input value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Payment terms, bank details, etc."
                className="w-full bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
            </div>

            {/* Financial Summary */}
            <div className="col-span-2 border-t border-zinc-800 pt-4">
              <p className="text-zinc-400 text-sm font-medium mb-3">Invoice Summary</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-900 rounded-xl p-4">
                  <p className="text-zinc-500 text-xs">Quotation</p>
                  <p className="text-white font-bold mt-1">KSh {quotation.toLocaleString()}</p>
                </div>
                <div className="bg-zinc-900 rounded-xl p-4">
                  <p className="text-zinc-500 text-xs">Total Received</p>
                  <p className="text-green-400 font-bold mt-1">KSh {totalEarned.toLocaleString()}</p>
                </div>
                <div className={`rounded-xl p-4 ${outstanding > 0 ? 'bg-orange-500/10' : 'bg-green-500/10'}`}>
                  <p className="text-zinc-500 text-xs">Balance Due</p>
                  <p className={`font-bold mt-1 ${outstanding > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                    KSh {outstanding.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Preview */
          <div className="p-6">
            <div ref={printRef} style={{background:'white', borderRadius:'12px', overflow:'hidden'}}>
              <style>{`
                .invoice { max-width: 800px; margin: 0 auto; padding: 48px; font-family: Georgia, serif; color: #1a1a1a; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; border-bottom: 3px solid #f97316; padding-bottom: 32px; }
                .company-name { font-size: 28px; font-weight: bold; color: #1a1a1a; letter-spacing: -1px; }
                .company-sub { font-size: 13px; color: #888; margin-top: 4px; }
                .invoice-label { font-size: 36px; font-weight: bold; color: #f97316; text-align: right; }
                .invoice-meta { text-align: right; margin-top: 8px; font-size: 13px; color: #555; }
                .invoice-meta span { display: block; margin-bottom: 2px; }
                .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                .party-label { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #f97316; margin-bottom: 10px; }
                .party-name { font-size: 16px; font-weight: bold; color: #1a1a1a; margin-bottom: 4px; }
                .party-detail { font-size: 13px; color: #555; margin-bottom: 2px; }
                .project-section { background: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 32px; }
                .project-title { font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; }
                .project-name { font-size: 20px; font-weight: bold; color: #1a1a1a; }
                .project-desc { font-size: 13px; color: #666; margin-top: 4px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
                th { background: #1a1a1a; color: white; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
                th:last-child { text-align: right; }
                td { padding: 12px 16px; border-bottom: 1px solid #eee; font-size: 14px; color: #333; }
                td:last-child { text-align: right; font-weight: 600; }
                .totals { margin-left: auto; width: 280px; }
                .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #555; border-bottom: 1px solid #eee; }
                .total-row.outstanding { font-size: 16px; font-weight: bold; color: #1a1a1a; border-bottom: none; border-top: 2px solid #1a1a1a; padding-top: 12px; margin-top: 4px; }
                .total-row.outstanding span:last-child { color: #f97316; }
                .notes { margin-top: 40px; padding-top: 24px; border-top: 1px solid #eee; }
                .notes-label { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 8px; }
                .notes-text { font-size: 13px; color: #555; line-height: 1.6; }
                .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #aaa; }
              `}</style>
              <InvoiceContent />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}