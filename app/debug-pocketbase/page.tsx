"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Database, Users, Award, CreditCard } from "lucide-react"

export default function DebugPocketBase() {
  const [collectionsData, setCollectionsData] = useState<any>(null)
  const [dataInfo, setDataInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkCollections = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/debug/collections')
      const result = await response.json()
      if (result.success) {
        setCollectionsData(result.data)
      } else {
        setError(result.error || '检查集合失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '检查集合失败')
    } finally {
      setLoading(false)
    }
  }

  const checkData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/debug/data')
      const result = await response.json()
      if (result.success) {
        setDataInfo(result.data)
      } else {
        setError(result.error || '检查数据失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '检查数据失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">PocketBase 调试工具</h1>
          <p className="text-gray-600">检查集合结构和现有数据</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={checkCollections} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
            检查集合结构
          </Button>
          <Button onClick={checkData} disabled={loading} variant="outline">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
            检查现有数据
          </Button>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 集合结构信息 */}
      {collectionsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                集合概览
              </CardTitle>
              <CardDescription>相关集合的基本信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>总集合数:</strong> {collectionsData.totalCollections}</p>
                <p><strong>相关集合数:</strong> {collectionsData.relevantCollections.length}</p>
                <p><strong>student_points 存在:</strong> {collectionsData.studentPointsExists ? '✅' : '❌'}</p>
                <p><strong>point_transactions 存在:</strong> {collectionsData.pointTransactionsExists ? '✅' : '❌'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                相关集合列表
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {collectionsData.relevantCollections.map((collection: any) => (
                  <div key={collection.name} className="flex items-center gap-2">
                    <span className="font-mono text-sm">{collection.name}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{collection.type}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* student_points 集合详情 */}
      {collectionsData?.studentPointsDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              student_points 集合详情
            </CardTitle>
            <CardDescription>字段结构和验证规则</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">字段结构:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {collectionsData.studentPointsDetails.schema.map((field: any) => (
                    <div key={field.name} className="border rounded p-2 text-sm">
                      <div className="font-mono font-semibold">{field.name}</div>
                      <div className="text-gray-600">类型: {field.type}</div>
                      <div className="text-gray-600">必需: {field.required ? '✅' : '❌'}</div>
                      {field.system && <div className="text-blue-600">系统字段</div>}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">权限规则:</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>创建规则:</strong> {collectionsData.studentPointsDetails.rules.createRule || '无'}</p>
                  <p><strong>查看规则:</strong> {collectionsData.studentPointsDetails.rules.viewRule || '无'}</p>
                  <p><strong>更新规则:</strong> {collectionsData.studentPointsDetails.rules.updateRule || '无'}</p>
                  <p><strong>删除规则:</strong> {collectionsData.studentPointsDetails.rules.deleteRule || '无'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* point_transactions 集合详情 */}
      {collectionsData?.pointTransactionsDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              point_transactions 集合详情
            </CardTitle>
            <CardDescription>字段结构和验证规则</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">字段结构:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {collectionsData.pointTransactionsDetails.schema.map((field: any) => (
                    <div key={field.name} className="border rounded p-2 text-sm">
                      <div className="font-mono font-semibold">{field.name}</div>
                      <div className="text-gray-600">类型: {field.type}</div>
                      <div className="text-gray-600">必需: {field.required ? '✅' : '❌'}</div>
                      {field.system && <div className="text-blue-600">系统字段</div>}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">权限规则:</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>创建规则:</strong> {collectionsData.pointTransactionsDetails.rules.createRule || '无'}</p>
                  <p><strong>查看规则:</strong> {collectionsData.pointTransactionsDetails.rules.viewRule || '无'}</p>
                  <p><strong>更新规则:</strong> {collectionsData.pointTransactionsDetails.rules.updateRule || '无'}</p>
                  <p><strong>删除规则:</strong> {collectionsData.pointTransactionsDetails.rules.deleteRule || '无'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 现有数据信息 */}
      {dataInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              现有数据概览
            </CardTitle>
            <CardDescription>各集合中的数据统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border rounded p-4">
                <h4 className="font-semibold mb-2">学生数据</h4>
                {dataInfo.students.error ? (
                  <p className="text-red-600 text-sm">{dataInfo.students.error}</p>
                ) : (
                  <div>
                    <p className="text-2xl font-bold">{dataInfo.students.count}</p>
                    <p className="text-sm text-gray-600">个学生记录</p>
                  </div>
                )}
              </div>
              <div className="border rounded p-4">
                <h4 className="font-semibold mb-2">教师数据</h4>
                {dataInfo.teachers.error ? (
                  <p className="text-red-600 text-sm">{dataInfo.teachers.error}</p>
                ) : (
                  <div>
                    <p className="text-2xl font-bold">{dataInfo.teachers.count}</p>
                    <p className="text-sm text-gray-600">个教师记录</p>
                  </div>
                )}
              </div>
              <div className="border rounded p-4">
                <h4 className="font-semibold mb-2">学生积分</h4>
                {dataInfo.studentPoints.error ? (
                  <p className="text-red-600 text-sm">{dataInfo.studentPoints.error}</p>
                ) : (
                  <div>
                    <p className="text-2xl font-bold">{dataInfo.studentPoints.count}</p>
                    <p className="text-sm text-gray-600">个积分记录</p>
                  </div>
                )}
              </div>
              <div className="border rounded p-4">
                <h4 className="font-semibold mb-2">积分交易</h4>
                {dataInfo.pointTransactions.error ? (
                  <p className="text-red-600 text-sm">{dataInfo.pointTransactions.error}</p>
                ) : (
                  <div>
                    <p className="text-2xl font-bold">{dataInfo.pointTransactions.count}</p>
                    <p className="text-sm text-gray-600">个交易记录</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
