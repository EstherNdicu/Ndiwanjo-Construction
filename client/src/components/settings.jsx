import { useState, useEffect, useRef } from 'react'

const DEFAULT_SETTINGS = {
  companyName: 'Ndiwanjo Construction',
  tagline: 'Management System',
  phone: '',
  email: '',
  address: '',
  city: '',
  country: 'Kenya',
  currency: 'KSh',
  invoiceHeader: '',
  invoiceFooter: 'Thank you for your business.',
  logo: null,
}

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState('company')
  const fileInputRef = useRef()

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ndiwanjo_settings')
      if (stored) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) })
    } catch {}
  }, [])

  const handleSave = () => {
    try {
      localStorage.setItem('ndiwanjo_settings', JSON.stringify(settings))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      alert('Failed to save settings.')
    }
  }

  const handleReset = () => {
    if (!window.confirm('Reset all settings to default?')) return
    setSettings(DEFAULT_SETTINGS)
    localStorage.removeItem('ndiwanjo_settings')
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return alert('Logo must be under 2MB.')
    const reader = new FileReader()
    reader.onload = (ev) => setSettings({ ...settings, logo: ev.target.result })
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => setSettings({ ...settings, logo: null })

  const set = (field, value) => setSettings(prev => ({ ...prev, [field]: value }))

  const sections = [
    { id: 'company', label: 'Company Info', icon: '🏗️' },
    { id: 'contact', label: 'Contact Details', icon: '📞' },
    { id: 'invoice', label: 'Invoice Settings', icon: '🧾' },
    { id: 'currency', label: 'Currency', icon: '💰' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white">Settings</h3>
          <p className="text-zinc-500 text-sm">Manage your company profile and system preferences</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleReset}
            className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Reset to Default
          </button>
          <button onClick={handleSave}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            {saved ? '✅ Saved!' : '💾 Save Settings'}
          </button>
        </div>
      </div>

      {/* Saved banner */}
      {saved && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg px-4 py-3 text-sm">
          ✅ Settings saved successfully! Changes will reflect across the system.
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-52 flex-shrink-0 space-y-1">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors ${
                activeSection === s.id
                  ? 'bg-orange-500 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}>
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">

          {/* COMPANY INFO */}
          {activeSection === 'company' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
              <h4 className="text-white font-semibold text-base">Company Information</h4>

              {/* Logo upload */}
              <div>
                <p className="text-zinc-500 text-xs mb-3">Company Logo</p>
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center overflow-hidden">
                    {settings.logo ? (
                      <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-3xl">🏗️</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <button onClick={() => fileInputRef.current.click()}
                      className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors block">
                      📁 Upload Logo
                    </button>
                    {settings.logo && (
                      <button onClick={handleRemoveLogo}
                        className="text-red-400 hover:text-red-300 text-xs block">
                        Remove logo
                      </button>
                    )}
                    <p className="text-zinc-600 text-xs">PNG, JPG up to 2MB</p>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-500 text-xs mb-1.5 block">Company Name *</label>
                  <input value={settings.companyName}
                    onChange={e => set('companyName', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                </div>
                <div>
                  <label className="text-zinc-500 text-xs mb-1.5 block">Tagline / Subtitle</label>
                  <input value={settings.tagline}
                    onChange={e => set('tagline', e.target.value)}
                    placeholder="e.g. Building Excellence Since 2020"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                </div>
              </div>

              {/* Preview */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <p className="text-zinc-500 text-xs mb-3">Preview — how it appears in the sidebar</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {settings.logo ? (
                      <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xl">🏗️</span>
                    )}
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">{settings.companyName || 'Company Name'}</p>
                    <p className="text-zinc-500 text-xs">{settings.tagline || 'Tagline'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONTACT DETAILS */}
          {activeSection === 'contact' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
              <h4 className="text-white font-semibold text-base">Contact Details</h4>
              <p className="text-zinc-500 text-sm">These details appear on invoices and reports.</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-500 text-xs mb-1.5 block">Phone Number</label>
                  <input value={settings.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="e.g. +254 700 000 000"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                </div>
                <div>
                  <label className="text-zinc-500 text-xs mb-1.5 block">Email Address</label>
                  <input value={settings.email} type="email"
                    onChange={e => set('email', e.target.value)}
                    placeholder="e.g. info@ndiwanjo.co.ke"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                </div>
                <div>
                  <label className="text-zinc-500 text-xs mb-1.5 block">Street Address</label>
                  <input value={settings.address}
                    onChange={e => set('address', e.target.value)}
                    placeholder="e.g. 123 Mombasa Road"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                </div>
                <div>
                  <label className="text-zinc-500 text-xs mb-1.5 block">City</label>
                  <input value={settings.city}
                    onChange={e => set('city', e.target.value)}
                    placeholder="e.g. Nairobi"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                </div>
                <div>
                  <label className="text-zinc-500 text-xs mb-1.5 block">Country</label>
                  <input value={settings.country}
                    onChange={e => set('country', e.target.value)}
                    placeholder="e.g. Kenya"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                </div>
              </div>

              {/* Contact preview */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <p className="text-zinc-500 text-xs mb-3">Preview — how it appears on invoices</p>
                <div className="space-y-1">
                  <p className="text-white text-sm font-bold">{settings.companyName}</p>
                  {settings.address && <p className="text-zinc-400 text-sm">{settings.address}{settings.city ? `, ${settings.city}` : ''}{settings.country ? `, ${settings.country}` : ''}</p>}
                  {settings.phone && <p className="text-zinc-400 text-sm">📞 {settings.phone}</p>}
                  {settings.email && <p className="text-zinc-400 text-sm">✉️ {settings.email}</p>}
                  {!settings.address && !settings.phone && !settings.email && (
                    <p className="text-zinc-600 text-sm italic">Fill in your contact details above</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* INVOICE SETTINGS */}
          {activeSection === 'invoice' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
              <h4 className="text-white font-semibold text-base">Invoice Settings</h4>
              <p className="text-zinc-500 text-sm">Customize the text that appears at the top and bottom of your invoices.</p>

              <div>
                <label className="text-zinc-500 text-xs mb-1.5 block">Invoice Header Text</label>
                <textarea value={settings.invoiceHeader}
                  onChange={e => set('invoiceHeader', e.target.value)}
                  rows={3}
                  placeholder="e.g. TAX INVOICE&#10;VAT Registration No: KE12345678"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none" />
                <p className="text-zinc-600 text-xs mt-1">Appears at the top of every invoice, below the company name.</p>
              </div>

              <div>
                <label className="text-zinc-500 text-xs mb-1.5 block">Invoice Footer Text</label>
                <textarea value={settings.invoiceFooter}
                  onChange={e => set('invoiceFooter', e.target.value)}
                  rows={3}
                  placeholder="e.g. Thank you for your business. Payment is due within 30 days."
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none" />
                <p className="text-zinc-600 text-xs mt-1">Appears at the bottom of every invoice.</p>
              </div>

              {/* Invoice preview */}
              <div className="bg-white rounded-xl p-5 text-black text-sm">
                <p className="text-zinc-500 text-xs mb-3 text-center font-medium">INVOICE PREVIEW</p>
                <div className="border-b border-zinc-200 pb-4 mb-4 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-white text-sm overflow-hidden">
                        {settings.logo ? <img src={settings.logo} alt="" className="w-full h-full object-contain" /> : '🏗️'}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{settings.companyName}</p>
                        <p className="text-zinc-500 text-xs">{settings.tagline}</p>
                      </div>
                    </div>
                    {settings.invoiceHeader && (
                      <p className="text-xs text-zinc-600 mt-2 whitespace-pre-line">{settings.invoiceHeader}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-orange-500">INVOICE</p>
                    <p className="text-xs text-zinc-500">#INV-0001</p>
                    <p className="text-xs text-zinc-500">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-xs text-zinc-500 space-y-0.5 mb-4">
                  {settings.phone && <p>📞 {settings.phone}</p>}
                  {settings.email && <p>✉️ {settings.email}</p>}
                  {settings.address && <p>📍 {settings.address}{settings.city ? `, ${settings.city}` : ''}</p>}
                </div>
                <div className="border-t border-zinc-200 pt-3 mt-3">
                  {settings.invoiceFooter && (
                    <p className="text-xs text-zinc-500 text-center italic">{settings.invoiceFooter}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CURRENCY */}
          {activeSection === 'currency' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
              <h4 className="text-white font-semibold text-base">Currency Settings</h4>
              <p className="text-zinc-500 text-sm">Set the currency symbol used across the system.</p>

              <div>
                <label className="text-zinc-500 text-xs mb-1.5 block">Currency Symbol</label>
                <div className="flex gap-3 flex-wrap">
                  {['KSh', 'KES', 'USD', 'EUR', 'GBP', 'UGX', 'TZS'].map(c => (
                    <button key={c} onClick={() => set('currency', c)}
                      className={`px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                        settings.currency === c
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="text-zinc-500 text-xs mb-1.5 block">Or enter a custom symbol</label>
                  <input value={settings.currency}
                    onChange={e => set('currency', e.target.value)}
                    placeholder="e.g. KSh"
                    className="w-40 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                </div>
              </div>

              {/* Currency preview */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <p className="text-zinc-500 text-xs mb-3">Preview</p>
                <div className="grid grid-cols-3 gap-3">
                  {[1000000, 250000, 75000].map((amount, i) => (
                    <div key={i} className="bg-zinc-900 rounded-lg p-3">
                      <p className="text-zinc-500 text-xs mb-1">{['Quotation', 'Revenue', 'Expenses'][i]}</p>
                      <p className="text-white font-bold text-sm">{settings.currency} {amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-yellow-400 text-sm font-medium">⚠️ Note</p>
                <p className="text-zinc-400 text-sm mt-1">Changing the currency symbol only changes how amounts are displayed. It does not convert any values in the database.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}