import React from 'react'

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome Back, Administrator</h1>
        <p className="text-slate-500">Here is what's happening across your centers today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Students" value="0" description="Across all centers" color="bg-blue-500" />
        <StatCard title="Pending Payments" value="RM 0" description="Due this month" color="bg-red-500" />
        <StatCard title="Active Teachers" value="0" description="On duty today" color="bg-green-500" />
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionBtn label="Add Student" href="/admin/students" />
          <QuickActionBtn label="Create Invoice" href="/finance/overview" />
          <QuickActionBtn label="Attendance" href="/unified-attendance" />
          <QuickActionBtn label="Reports" href="/finance/reports" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, description, color }: { title: string, value: string, description: string, color: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm space-y-2">
      <div className={`w-2 h-8 ${color} rounded-full absolute left-0 top-6`} />
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400">{description}</p>
    </div>
  )
}

function QuickActionBtn({ label, href }: { label: string, href: string }) {
  return (
    <a 
      href={href} 
      className="p-4 text-center border rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
    >
      {label}
    </a>
  )
}
