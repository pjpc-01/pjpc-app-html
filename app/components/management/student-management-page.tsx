"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import StudentManagement from "../student/StudentManagement"
import StudentList from "../student/StudentList"
import StudentForm from "../student/StudentForm"
import StudentStats from "../student/StudentStats"
import StudentFilters from "../student/StudentFilters"
import StudentBulkActions from "../student/StudentBulkActions"
import StudentDetails from "../student/StudentDetails"
import { useStudents } from "@/hooks/useStudents"

export default function StudentManagementPage() {
  const { students, loading, error, refetch } = useStudents()
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">学生管理系统</h2>
          <p className="text-gray-600">管理学生档案、班级分组、出勤记录和学习进度</p>
          {error && (
            <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              错误: {error}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {loading && <div className="text-sm text-gray-500">加载中...</div>}
          <button 
            onClick={() => refetch()} 
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            刷新数据
          </button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">学生概览</TabsTrigger>
          <TabsTrigger value="list">学生列表</TabsTrigger>
          <TabsTrigger value="add">添加学生</TabsTrigger>
          <TabsTrigger value="bulk">批量操作</TabsTrigger>
          <TabsTrigger value="filters">筛选管理</TabsTrigger>
          <TabsTrigger value="stats">统计报表</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <StudentManagement />
        </TabsContent>

        <TabsContent value="list">
          <StudentList 
            students={students}
            loading={loading}
            selectedStudents={[]}
            onSelectStudent={() => {}}
            onSelectAll={() => {}}
            onEditStudent={() => {}}
            onViewStudent={() => {}}
            onDeleteStudent={() => {}}
          />
        </TabsContent>

        <TabsContent value="add">
          <StudentForm 
            open={false}
            onOpenChange={() => {}}
            student={null}
            onSubmit={async () => {}}
          />
        </TabsContent>

        <TabsContent value="bulk">
          <StudentBulkActions
            selectedCount={0}
            onDelete={() => {}}
            onClearSelection={() => {}}
          />
        </TabsContent>

        <TabsContent value="filters">
          <StudentFilters
            searchTerm=""
            setSearchTerm={() => {}}
            selectedGrade=""
            setSelectedGrade={() => {}}
            students={students}
          />
        </TabsContent>

        <TabsContent value="stats">
          <StudentStats students={students} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
