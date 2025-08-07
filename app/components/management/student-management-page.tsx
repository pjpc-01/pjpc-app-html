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

export default function StudentManagementPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">学生管理系统</h2>
          <p className="text-gray-600">管理学生档案、班级分组、出勤记录和学习进度</p>
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
            students={[]}
            loading={false}
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
            students={[]}
          />
        </TabsContent>

        <TabsContent value="stats">
          <StudentStats students={[]} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
