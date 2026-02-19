export default function Dashboard({ stats }) {
  const cards = [
    { label: 'Total Employees', value: stats.employees, icon: '👷', color: 'bg-blue-500' },
    { label: 'Total Customers', value: stats.customers, icon: '👥', color: 'bg-green-500' },
    { label: 'Active Projects', value: stats.projects, icon: '🏗️', color: 'bg-yellow-500' },
    { label: 'Inventory Items', value: stats.inventory, icon: '📦', color: 'bg-purple-500' },
  ]

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
            <div className={`${card.color} text-white text-3xl rounded-full w-14 h-14 flex items-center justify-center`}>
              {card.icon}
            </div>
            <div>
              <p className="text-gray-500 text-sm">{card.label}</p>
              <p className="text-3xl font-bold text-gray-800">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Welcome 👋</h3>
        <p className="text-gray-500">Use the sidebar to navigate between modules.</p>
      </div>
    </div>
  )
}