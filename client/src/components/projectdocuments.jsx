import { useState, useEffect, useRef } from 'react'

const CATEGORIES = {
  contract: { label: 'Contract', color: '#3b82f6', bg: '#3b82f620', icon: '📄' },
  permit: { label: 'Permit', color: '#f97316', bg: '#f9731620', icon: '🏛️' },
  invoice: { label: 'Invoice', color: '#c9a84c', bg: '#c9a84c20', icon: '🧾' },
  report: { label: 'Site Report', color: '#8b5cf6', bg: '#8b5cf620', icon: '📋' },
  photo: { label: 'Photo', color: '#22c55e', bg: '#22c55e20', icon: '📷' },
  other: { label: 'Other', color: '#8a9bb5', bg: '#1e3a5f', icon: '📎' },
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function ProjectDocuments({ projectId, showPortal = false }) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [dragOver, setDragOver] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const fileInputRef = useRef()

  useEffect(() => { fetchDocs() }, [projectId])

  const fetchDocs = async () => {
    try {
      setLoading(true)
      const res = await fetch(`http://localhost:5000/projects/${projectId}/documents`)
      const data = await res.json()
      setDocs(Array.isArray(data) ? data : [])
    } catch { setDocs([]) }
    finally { setLoading(false) }
  }

  const uploadFile = async (file) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('originalName', file.name)
      const res = await fetch(`http://localhost:5000/projects/${projectId}/documents`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      await fetchDocs()
    } catch { alert('Upload failed. Make sure your server is running.') }
    finally { setUploading(false) }
  }

  const handleFiles = (files) => {
    Array.from(files).forEach(uploadFile)
  }

  const handleDelete = async (filename) => {
    try {
      await fetch(`http://localhost:5000/projects/${projectId}/documents/${filename}`, { method: 'DELETE' })
      setDocs(docs.filter(d => d.filename !== filename))
      setDeleteConfirm(null)
    } catch { alert('Failed to delete document.') }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const filtered = filter === 'all' ? docs : docs.filter(d => d.category === filter)

  const categoryCounts = docs.reduce((acc, d) => {
    acc[d.category] = (acc[d.category] || 0) + 1
    return acc
  }, {})

  const isImage = (name) => /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(name)
  const isPDF = (name) => /\.pdf$/i.test(name)

  return (
    <div className="space-y-5">

      {/* Upload area — hide on portal view */}
      {!showPortal && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          className="rounded-xl p-8 border-2 border-dashed cursor-pointer transition-all text-center"
          style={{
            borderColor: dragOver ? '#c9a84c' : '#1e3a5f',
            backgroundColor: dragOver ? '#c9a84c10' : '#0d1f3c',
          }}>
          <input ref={fileInputRef} type="file" multiple className="hidden"
            onChange={e => handleFiles(e.target.files)} />
          {uploading ? (
            <div>
              <p className="text-3xl mb-2 animate-pulse">⏳</p>
              <p className="text-sm font-medium" style={{ color: '#c9a84c' }}>Uploading...</p>
            </div>
          ) : (
            <div>
              <p className="text-3xl mb-2">☁️</p>
              <p className="text-white font-semibold text-sm">Drop files here or click to upload</p>
              <p className="text-xs mt-1" style={{ color: '#4a6fa5' }}>
                Contracts, permits, photos, invoices, site reports — any file up to 20MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* Category filter */}
      {docs.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter('all')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={filter === 'all' ? { background: 'linear-gradient(135deg, #c9a84c, #a8883a)', color: '#0a1628' } : { backgroundColor: '#0d1f3c', color: '#8a9bb5', border: '1px solid #1e3a5f' }}>
            All ({docs.length})
          </button>
          {Object.entries(CATEGORIES).map(([key, cat]) => {
            const count = categoryCounts[key] || 0
            if (!count) return null
            return (
              <button key={key} onClick={() => setFilter(key)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                style={filter === key ? { backgroundColor: cat.bg, color: cat.color, border: `1px solid ${cat.color}` } : { backgroundColor: '#0d1f3c', color: '#8a9bb5', border: '1px solid #1e3a5f' }}>
                {cat.icon} {cat.label} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Document list */}
      {loading ? (
        <div className="text-center py-8" style={{ color: '#4a6fa5' }}>Loading documents...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl p-10 border text-center" style={{ backgroundColor: '#0d1f3c', borderColor: '#1e3a5f' }}>
          <p className="text-3xl mb-2">📁</p>
          <p className="text-white font-semibold text-sm">{docs.length === 0 ? 'No documents yet' : 'No documents in this category'}</p>
          {!showPortal && <p className="text-xs mt-1" style={{ color: '#4a6fa5' }}>Upload contracts, permits, photos and more above</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => {
            const cat = CATEGORIES[doc.category] || CATEGORIES.other
            return (
              <div key={doc.filename}
                className="flex items-center gap-4 p-4 rounded-xl border transition-colors"
                style={{ backgroundColor: '#0d1f3c', borderColor: '#1e3a5f' }}>

                {/* Icon / thumbnail */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: cat.bg }}>
                  {isImage(doc.originalName) ? (
                    <img src={`http://localhost:5000${doc.url}`} alt={doc.originalName}
                      className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <span>{cat.icon}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{doc.originalName}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: cat.bg, color: cat.color }}>
                      {cat.label}
                    </span>
                    <span className="text-xs" style={{ color: '#4a6fa5' }}>{formatSize(doc.size)}</span>
                    <span className="text-xs" style={{ color: '#4a6fa5' }}>
                      {new Date(doc.uploadedAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {(isImage(doc.originalName) || isPDF(doc.originalName)) && (
                    <a href={`http://localhost:5000${doc.url}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                      style={{ backgroundColor: '#1e3a5f', color: '#c9a84c' }}>
                      👁️ View
                    </a>
                  )}
                  <a href={`http://localhost:5000${doc.url}`} download={doc.originalName}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ backgroundColor: '#1e3a5f', color: '#8a9bb5' }}>
                    ⬇️ Download
                  </a>
                  {!showPortal && (
                    <button onClick={() => setDeleteConfirm(doc)}
                      className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                      style={{ backgroundColor: '#3a1a1a', color: '#ef4444' }}>
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ backgroundColor: '#0a1628', border: '1px solid #1e3a5f' }}>
            <p className="text-4xl text-center">🗑️</p>
            <div className="text-center">
              <h4 className="text-white font-bold">Delete Document?</h4>
              <p className="text-sm mt-1" style={{ color: '#8a9bb5' }}>
                "{deleteConfirm.originalName}" will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ backgroundColor: '#1e3a5f', color: '#8a9bb5' }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm.filename)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-red-600 text-white">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}