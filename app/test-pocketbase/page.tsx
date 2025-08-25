"use client"

import { useState, useEffect } from 'react'
import { pb } from '@/lib/pocketbase-instance'
import { getAllStudents } from '@/lib/pocketbase-students'

export default function TestPocketBase() {
  const [connectionStatus, setConnectionStatus] = useState<string>('检查中...')
  const [students, setStudents] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [gradeDistribution, setGradeDistribution] = useState<Record<string, number>>({})

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('测试PocketBase连接...')
        console.log('PocketBase URL:', pb.baseUrl)
        console.log('认证状态:', pb.authStore.isValid)
        
        // 测试健康检查
        const healthResponse = await fetch(`${pb.baseUrl}/api/health`)
        console.log('健康检查响应:', healthResponse.status)
        
        if (healthResponse.ok) {
          setConnectionStatus('连接成功')
          
          // 尝试获取学生数据
          try {
            console.log('尝试获取学生数据...')
            const studentsData = await getAllStudents()
            console.log('获取到的学生数据:', studentsData)
            setStudents(studentsData)
            
            // 分析年级分布
            const distribution = studentsData.reduce((acc: Record<string, number>, student: any) => {
              const grade = student.standard || '无年级'
              acc[grade] = (acc[grade] || 0) + 1
              return acc
            }, {})
            
            console.log('年级分布:', distribution)
            setGradeDistribution(distribution)
            
          } catch (studentError) {
            console.error('获取学生数据失败:', studentError)
            setError(`获取学生数据失败: ${studentError}`)
          }
        } else {
          setConnectionStatus(`连接失败: ${healthResponse.status}`)
          setError(`健康检查失败: ${healthResponse.status}`)
        }
      } catch (err) {
        console.error('连接测试失败:', err)
        setConnectionStatus('连接失败')
        setError(`连接错误: ${err}`)
      }
    }

    testConnection()
  }, [])

  // 测试筛选逻辑
  const testFiltering = () => {
    console.log('=== 测试筛选逻辑 ===')
    
    // 测试小学筛选（一年级到六年级）
    const primaryStudents = students.filter(student => {
      const grade = student.standard || ''
      const isPrimary = grade.includes('一年级') || grade.includes('二年级') || grade.includes('三年级') || 
                       grade.includes('四年级') || grade.includes('五年级') || grade.includes('六年级') ||
                       grade === '1' || grade === '2' || grade === '3' || 
                       grade === '4' || grade === '5' || grade === '6' ||
                       grade === 'Standard 1' || grade === 'Standard 2' || grade === 'Standard 3' ||
                       grade === 'Standard 4' || grade === 'Standard 5' || grade === 'Standard 6' ||
                       grade === 'Grade 1' || grade === 'Grade 2' || grade === 'Grade 3' ||
                       grade === 'Grade 4' || grade === 'Grade 5' || grade === 'Grade 6'
      return isPrimary
    })
    
    // 测试中学筛选（初一到高三）
    const secondaryStudents = students.filter(student => {
      const grade = student.standard || ''
      const isSecondary = grade.includes('初一') || grade.includes('初二') || grade.includes('初三') || 
                         grade.includes('高一') || grade.includes('高二') || grade.includes('高三') ||
                         grade === '7' || grade === '8' || grade === '9' || 
                         grade === '10' || grade === '11' || grade === '12' ||
                         grade === 'Form 1' || grade === 'Form 2' || grade === 'Form 3' ||
                         grade === 'Form 4' || grade === 'Form 5' || grade === 'Form 6' ||
                         grade === 'Grade 7' || grade === 'Grade 8' || grade === 'Grade 9' ||
                         grade === 'Grade 10' || grade === 'Grade 11' || grade === 'Grade 12'
      return isSecondary
    })
    
    console.log('小学生数量:', primaryStudents.length)
    console.log('中学生数量:', secondaryStudents.length)
    console.log('小学生样本:', primaryStudents.slice(0, 3))
    console.log('中学生样本:', secondaryStudents.slice(0, 3))
    
    // 显示筛选结果
    alert(`筛选结果：
小学生：${primaryStudents.length}人
中学生：${secondaryStudents.length}人
总学生：${students.length}人`)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">PocketBase 连接测试</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">连接状态</h2>
        <p className={`p-2 rounded ${connectionStatus.includes('成功') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {connectionStatus}
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">错误信息</h2>
          <p className="p-2 bg-red-100 text-red-800 rounded">
            {error}
          </p>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">PocketBase 信息</h2>
        <p><strong>URL:</strong> {pb.baseUrl}</p>
        <p><strong>认证状态:</strong> {pb.authStore.isValid ? '已认证' : '未认证'}</p>
        {pb.authStore.model && (
          <p><strong>用户:</strong> {JSON.stringify(pb.authStore.model)}</p>
        )}
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">学生数据统计</h2>
        <p><strong>总学生数:</strong> {students.length}</p>
        
        <div className="mt-2">
          <h3 className="font-medium">年级分布:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {Object.entries(gradeDistribution).map(([grade, count]) => (
              <div key={grade} className="p-2 bg-gray-100 rounded text-sm">
                <span className="font-medium">{grade}:</span> {count}人
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">学生数据样本</h2>
        {students.length > 0 ? (
          <div className="space-y-2">
            {students.slice(0, 5).map((student, index) => (
              <div key={index} className="p-2 border rounded">
                <p><strong>姓名:</strong> {student.student_name}</p>
                <p><strong>学号:</strong> {student.student_id}</p>
                <p><strong>年级:</strong> {student.standard}</p>
                <p><strong>家长电话:</strong> {student.father_phone}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">暂无学生数据</p>
        )}
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">调试功能</h2>
        <div className="space-x-2">
          <button 
            onClick={() => {
              console.log('手动测试连接...')
              console.log('pb.baseUrl:', pb.baseUrl)
              console.log('pb.authStore:', pb.authStore)
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            查看连接日志
          </button>
          
          <button 
            onClick={testFiltering}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            测试筛选逻辑
          </button>
        </div>
      </div>
    </div>
  )
}
