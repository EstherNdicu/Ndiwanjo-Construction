import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const barData = [
  { month: 'Jan', amount: 28000 },
  { month: 'Feb', amount: 35000 },
  { month: 'Mar', amount: 22000 },
  { month: 'Apr', amount: 45300 },
  { month: 'May', amount: 38000 },
  { month: 'Jun', amount: 52000 },
]

const pieData = [
  { name: 'In Progress', value: 18, color: '#f97316' },
  { name: 'Completed', value: 10, color: '#22c55e' },
  { name: 'Pending', value: 6, color: '#ef4444' },
]

export default function Dashboard({ stats }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-600 rounded-xl p-5 relative overflow-hidden">
          <p className="text-blue-200 text-sm font-medium">Active Projects</p>
          <p className="text-5xl font-bold text-white mt-2">{stats.projects}</p>
          <div className="absolute right-4 bottom-4 text-6xl opacity-20">🏗️</div>
        </div>
        <div className="bg-orange-500 rounded-xl p-5 relative overflow-hidden">
          <p className="text-orange-100 text-sm font-medium">Total Employees</p>
          <p className="text-5xl font-bold text-white mt-2">{stats.employees}</p>
          <div className="absolute right-4 bottom-4 text-6xl opacity-20">👷</div>
        </div>
        <div className="bg-green-600 rounded-xl p-5 relative overflow-hidden">
          <p className="text-green-100 text-sm font-medium">Total Customers</p>
          <p className="text-5xl font-bold text-white mt-2">{stats.customers}</p>
          <div className="absolute right-4 bottom-4 text-6xl opacity-20">👥</div>
        </div>
        <div className="bg-red-500 rounded-xl p-5 relative overflow-hidden">
          <p className="text-red-100 text-sm font-medium">Inventory Items</p>
          <p className="text-5xl font-bold text-white mt-2">{stats.inventory}</p>
          <div className="absolute right-4 bottom-4 text-6xl opacity-20">📦</div>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-3 gap-4">

        {/* Project Overview */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Project Overview</h3>
          <div className="space-y-4">
            {[
              { name: 'Sunset Villas', status: 'In Progress', progress: 65, color: 'bg-orange-500' },
              { name: 'Metro Plaza', status: 'On Hold', progress: 20, color: 'bg-yellow-500' },
              { name: 'Lakeside Apts', status: 'Completed', progress: 100, color: 'bg-green-500' },
            ].map((p) => (
              <div key={p.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-white font-medium">{p.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    p.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                    p.status === 'On Hold' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-orange-500/20 text-orange-400'
                  }`}>{p.status}</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2">
                  <div className={`${p.color} h-2 rounded-full`} style={{ width: `${p.progress}%` }}></div>
                </div>
                <p className="text-xs text-zinc-500 mt-1">{p.progress}% complete</p>
              </div>
            ))}
          </div>
        </div>

        {/* Task Summary Donut */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Task Summary</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                <span className="text-xs text-zinc-400">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-2">Financial Summary</h3>
          <div className="flex justify-between mb-4">
            <div>
              <p className="text-xs text-zinc-500">Total Expenses</p>
              <p className="text-2xl font-bold text-white">$45,300</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Pending Payments</p>
              <p className="text-2xl font-bold text-white">$18,750</p>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mb-2">Monthly Expenses</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={barData}>
              <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="amount" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-4">

        {/* Recent Activities */}
        <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Recent Activities</h3>
          <div className="space-y-3">
            {[
              { text: 'Material Delivered to', bold: 'Metro Plaza', time: '2 hours ago' },
              { text: 'Safety Inspection Completed at', bold: 'Sunset Villas', time: '3 hours ago' },
              { text: 'New Task Assigned to', bold: 'John Doe', time: '5 hours ago' },
              { text: 'Invoice sent to', bold: 'Lakeside Apartments', time: '1 day ago' },
            ].map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                    <span className="text-green-400 text-xs">✓</span>
                  </div>
                  <p className="text-sm text-zinc-300">{a.text} <span className="text-white font-semibold">{a.bold}</span></p>
                </div>
                <span className="text-xs text-zinc-500">{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Equipment Inventory */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Equipment Inventory</h3>
          <div className="space-y-4">
            {[
              { name: 'Excavator', count: 3, status: 'Available', icon: '🚜' },
              { name: 'Cement Bags', count: 120, status: 'In Stock', icon: '🧱' },
              { name: 'Steel Beams', count: 45, status: 'In Stock', icon: '🔩' },
            ].map((e) => (
              <div key={e.name} className="flex items-center gap-3 py-2 border-b border-zinc-800">
                <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-xl">
                  {e.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{e.name}</p>
                  <p className="text-xs text-zinc-500">{e.status}</p>
                </div>
                <span className="text-lg font-bold text-white">{e.count}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg transition-colors">
            Manage Inventory
          </button>
        </div>
      </div>

    </div>
  )
}