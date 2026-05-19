import React from 'react'
import Link from 'next/link'
import { 
  Users, 
  UserCog, 
  DollarSign, 
  LayoutDashboard, 
  Settings,
  GraduationCap
} from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Students', href: '/admin/students', icon: Users },
    { name: 'Teachers', href: '/admin/teachers', icon: UserCog },
    { name: 'Finance', href: '/admin/finance', icon: DollarSign },
    { name: 'Classes', href: '/admin/classes', icon: GraduationCap },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight">Warm Home ERP</h1>
          <p className="text-xs text-slate-400">Admin Management</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">
              AD
            </div>
            <div className="text-sm">
              <p className="font-medium">Administrator</p>
              <p className="text-xs text-slate-400">Super User</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-slate-800">Admin Panel</h2>
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-500 italic">
              System Status: <span className="text-green-500 font-medium">Connected to PocketBase</span>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
