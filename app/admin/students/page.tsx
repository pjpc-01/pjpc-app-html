'use client'

import React, { useState, useMemo } from 'react'
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  ExternalLink, 
  UserPlus, 
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { MOCK_STUDENTS } from '@/lib/mock-data'

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCenter, setFilterCenter] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  const centers = ['All', ...new Set(MOCK_STUDENTS.map(s => s.center))]
  const statuses = ['All', 'active', 'inactive']
  const tuitionStatuses = ['All', 'paid', 'partial', 'overdue']

  const filteredStudents = useMemo(() => {
    return MOCK_STUDENTS.filter(student => {
      const matchesSearch = student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            student.student_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCenter = filterCenter === 'All' || student.center === filterCenter;
      const matchesStatus = filterStatus === 'All' || student.status === filterStatus;
      return matchesSearch && matchesCenter && matchesStatus;
    });
  }, [searchQuery, filterCenter, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Directory</h1>
          <p className="text-slate-500">Manage and track all registered students across centers.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm">
          <UserPlus className="w-4 h-4" />
          Add New Student
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name or Student ID..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={filterCenter}
              onChange={(e) => setFilterCenter(e.target.value)}
            >
              {centers.map(c => <option key={c} value={c}>{c === 'All' ? 'All Centers' : c}</option>)}
            </select>
          </div>

          <select 
            className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Student</th>
              <th className="px-6 py-4 font-semibold">ID</th>
              <th className="px-6 py-4 font-semibold">Center</th>
              <th className="px-6 py-4 font-semibold">Standard</th>
              <th className="px-6 py-4 font-semibold">Payment</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.map((student) => (
              <tr 
                key={student.id} 
                className="hover:bg-slate-50 transition-colors cursor-pointer group"
                onClick={() => setSelectedStudent(student)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                      {student.student_name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-slate-900">{student.student_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-mono">{student.student_id}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{student.center}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{student.standard}</td>
                <td className="px-6 py-4">
                  <PaymentBadge status={student.tuitionStatus} />
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={student.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredStudents.length === 0 && (
          <div className="py-20 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-medium text-slate-900">No students found</h3>
            <p className="text-xs text-slate-500">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* Student Detail Slide-over */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedStudent(null)}
          />
          
          {/* Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900">Student Profile</h2>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Header Section */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600 ring-4 ring-indigo-50">
                  {selectedStudent.student_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedStudent.student_name}</h3>
                  <p className="text-sm text-slate-500 font-mono">{selectedStudent.student_id}</p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={selectedStudent.status} />
                  <PaymentBadge status={selectedStudent.tuitionStatus} />
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-2 gap-6">
                <InfoBlock label="Standard" value={selectedStudent.standard} />
                <InfoBlock label="Center" value={selectedStudent.center} />
                <InfoBlock label="Parent Name" value={selectedStudent.parent_name} />
                <InfoBlock label="Contact" value={selectedStudent.phone} />
                <InfoBlock label="Card Number" value={selectedStudent.cardNumber} />
                <InfoBlock label="Enrollment" value="May 2024" />
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t space-y-3">
                <button className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                  Edit Profile
                </button>
                <button className="w-full py-2 px-4 border rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-slate-700">
                  View Payment History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, { color: string, icon: any, text: string }> = {
    paid: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, text: 'Paid' },
    partial: { color: 'bg-amber-100 text-amber-700', icon: Clock, text: 'Partial' },
    overdue: { color: 'bg-red-100 text-red-700', icon: AlertCircle, text: 'Overdue' },
    All: { color: 'bg-slate-100 text-slate-700', icon: Clock, text: 'Unknown' }
  }
  const config = styles[status] || styles['All']
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
      <config.icon className="w-3 h-3" />
      {config.text}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-blue-100 text-blue-700',
    inactive: 'bg-slate-100 text-slate-700',
    All: 'bg-slate-100 text-slate-700'
  }
  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status] || styles['All']}`}>
      {status}
    </span>
  )
}

function InfoBlock({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value || 'N/A'}</p>
    </div>
  )
}
