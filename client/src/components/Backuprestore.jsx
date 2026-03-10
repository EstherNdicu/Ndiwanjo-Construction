import { useState, useRef } from 'react'

export default function BackupRestore() {
  const [backing, setBacking] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [lastBackup, setLastBackup] = useState(localStorage.getItem('ndiwanjo_last_backup') || null)
  const [restoreFile, setRestoreFile] = useState(null)
  const [restoreData, setRestoreData] = useState(null)
  const [restoreError, setRestoreError] = useState('')
  const [restoreSuccess, setRestoreSuccess] = useState(null)
  const [confirmRestore, setConfirmRestore] = useState(false)
  const fileInputRef = useRef()

  const handleBackup = async () => {
    setBacking(true)
    try {
      const res = await fetch('http://localhost:5000/backup')
      if (!res.ok) throw new Error('Backup failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ndiwanjo_backup_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      const now = new Date().toLocaleString('en-KE')
      setLastBackup(now)
      localStorage.setItem('ndiwanjo_last_backup', now)
    } catch (err) {
      alert('Backup failed. Make sure your server is running.')
    } finally {
      setBacking(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setRestoreError('')
    setRestoreSuccess(null)
    setRestoreData(null)
    setRestoreFile(file)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result)
        if (!parsed.data) throw new Error('Invalid backup file format.')
        setRestoreData(parsed)
      } catch {
        setRestoreError('Invalid backup file. Please select a valid Ndiwanjo backup JSON file.')
        setRestoreFile(null)
      }
    }
    reader.readAsText(file)
  }

  const handleRestore = async () => {
    if (!restoreData) return
    setRestoring(true)
    setRestoreError('')
    setConfirmRestore(false)
    try {
      const res = await fetch('http://localhost:5000/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: restoreData.data }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Restore failed')
      setRestoreSuccess(result.results)
      setRestoreFile(null)
      setRestoreData(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setRestoreError(err.message || 'Restore failed. Make sure your server is running.')
    } finally {
      setRestoring(false)
    }
  }

  const summaryCount = (data) => {
    if (!data?.data) return []
    const d = data.data
    return [
      { label: 'Projects', count: d.projects?.length || 0, icon: '🏗️' },
      { label: 'Customers', count: d.customers?.length || 0, icon: '👥' },
      { label: 'Employees', count: d.employees?.length || 0, icon: '👷' },
      { label: 'Inventory', count: d.inventory?.length || 0, icon: '📦' },
      { label: 'Expenses', count: d.expenses?.length || 0, icon: '💰' },
      { label: 'Payments', count: d.payments?.length || 0, icon: '💵' },
      { label: 'Payrolls', count: (d.weeklyPayrolls?.length || 0) + (d.monthlyPayrolls?.length || 0), icon: '📋' },
    ].filter(i => i.count > 0)
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-white font-bold text-lg">Backup & Restore</h3>
        <p className="text-xs mt-0.5" style={{ color: '#4a6fa5' }}>Export all your data or restore from a previous backup</p>
      </div>

      {/* Warning */}
      <div className="rounded-xl p-4 border flex gap-3" style={{ backgroundColor: '#1a2a0a', borderColor: '#4a7a1a' }}>
        <span className="text-xl flex-shrink-0">💡</span>
        <div>
          <p className="text-green-400 text-sm font-semibold">Best Practice</p>
          <p className="text-sm mt-0.5" style={{ color: '#8a9b7a' }}>
            Take a backup before making major changes — adding employees, updating projects, or changing settings. Store your backup files safely on Google Drive or email them to yourself.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* BACKUP */}
        <div className="rounded-xl p-6 border space-y-5" style={{ backgroundColor: '#0d1f3c', borderColor: '#1e3a5f' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: '#1e3a5f' }}>📤</div>
            <div>
              <h4 className="text-white font-bold">Export Backup</h4>
              <p className="text-xs" style={{ color: '#4a6fa5' }}>Download all your data as a JSON file</p>
            </div>
          </div>

          <div className="space-y-2">
            {['Projects & payments', 'Customers & employees', 'Inventory & expenses', 'Payroll records', 'Activity log'].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm" style={{ color: '#8a9bb5' }}>
                <span className="text-green-400 text-xs">✓</span> {item}
              </div>
            ))}
          </div>

          {lastBackup && (
            <div className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: '#1e3a5f', color: '#8a9bb5' }}>
              🕐 Last backup: <span className="text-white">{lastBackup}</span>
            </div>
          )}

          <button onClick={handleBackup} disabled={backing}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
            style={{
              background: backing ? '#1e3a5f' : 'linear-gradient(135deg, #c9a84c, #a8883a)',
              color: backing ? '#6b7a8d' : '#0a1628',
              cursor: backing ? 'not-allowed' : 'pointer'
            }}>
            {backing ? '⏳ Exporting...' : '📥 Download Backup'}
          </button>
        </div>

        {/* RESTORE */}
        <div className="rounded-xl p-6 border space-y-5" style={{ backgroundColor: '#0d1f3c', borderColor: '#1e3a5f' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: '#1e3a5f' }}>📥</div>
            <div>
              <h4 className="text-white font-bold">Restore Backup</h4>
              <p className="text-xs" style={{ color: '#4a6fa5' }}>Import data from a backup JSON file</p>
            </div>
          </div>

          {/* Warning */}
          <div className="rounded-lg px-3 py-2.5 border text-xs" style={{ backgroundColor: '#3a1a0a', borderColor: '#7a3a1a', color: '#e08060' }}>
            ⚠️ <strong>Warning:</strong> Restoring will replace ALL current data with the backup. This cannot be undone.
          </div>

          {/* File picker */}
          <div>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
            <button onClick={() => fileInputRef.current.click()}
              className="w-full py-3 rounded-xl text-sm font-medium border-2 border-dashed transition-colors flex items-center justify-center gap-2"
              style={{ borderColor: restoreFile ? '#c9a84c' : '#1e3a5f', color: restoreFile ? '#c9a84c' : '#4a6fa5', backgroundColor: 'transparent' }}>
              {restoreFile ? `📄 ${restoreFile.name}` : '📁 Select backup file...'}
            </button>
          </div>

          {restoreError && (
            <div className="rounded-lg px-3 py-2 text-xs bg-red-500/10 border border-red-500/30 text-red-400">{restoreError}</div>
          )}

          {/* Preview */}
          {restoreData && (
            <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: '#1e3a5f' }}>
              <p className="text-xs font-semibold" style={{ color: '#c9a84c' }}>
                Backup from {new Date(restoreData.exportedAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {summaryCount(restoreData).map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-xs" style={{ color: '#8a9bb5' }}>
                    <span>{item.icon}</span>
                    <span>{item.count} {item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => setConfirmRestore(true)} disabled={!restoreData || restoring}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
            style={{
              backgroundColor: !restoreData ? '#1e3a5f' : '#dc2626',
              color: !restoreData ? '#4a6fa5' : '#fff',
              cursor: !restoreData ? 'not-allowed' : 'pointer',
              opacity: restoring ? 0.7 : 1
            }}>
            {restoring ? '⏳ Restoring...' : '🔄 Restore Data'}
          </button>
        </div>
      </div>

      {/* Success message */}
      {restoreSuccess && (
        <div className="rounded-xl p-5 border space-y-3" style={{ backgroundColor: '#0a2a0a', borderColor: '#1a5a1a' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-green-400 font-bold">Restore Successful!</p>
              <p className="text-xs mt-0.5" style={{ color: '#6a9b6a' }}>Your data has been restored. Refresh the page to see the updated data.</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(restoreSuccess.restored || {}).map(([key, count]) => (
              <div key={key} className="rounded-lg p-2 text-center" style={{ backgroundColor: '#1a3a1a' }}>
                <p className="text-green-400 font-bold text-sm">{count}</p>
                <p className="text-xs capitalize" style={{ color: '#6a9b6a' }}>{key}</p>
              </div>
            ))}
          </div>
          <button onClick={() => window.location.reload()}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: '#16a34a' }}>
            🔄 Refresh Page
          </button>
        </div>
      )}

      {/* Confirm restore modal */}
      {confirmRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ backgroundColor: '#0a1628', border: '1px solid #1e3a5f' }}>
            <div className="text-center">
              <p className="text-5xl mb-3">⚠️</p>
              <h4 className="text-white font-bold text-base">Confirm Restore</h4>
              <p className="text-sm mt-2" style={{ color: '#8a9bb5' }}>
                This will <span className="text-red-400 font-semibold">permanently replace</span> all your current data with the backup from <span className="text-white font-semibold">{restoreData && new Date(restoreData.exportedAt).toLocaleDateString('en-KE')}</span>. Are you sure?
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmRestore(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ backgroundColor: '#1e3a5f', color: '#8a9bb5' }}>
                Cancel
              </button>
              <button onClick={handleRestore}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors">
                Yes, Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}