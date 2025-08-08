"use client"

import { useEffect, useState } from 'react'
import { checkPocketBaseConnection } from '@/lib/pocketbase'

export default function ConnectionStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkConnection = async () => {
      try {
          const result = await checkPocketBaseConnection()
        
        if (result.connected) {
          setStatus('connected')
          setError(null)
        } else {
          setStatus('disconnected')
          setError(result.error)
        }
      } catch (err) {
        console.error('ConnectionStatus: Error:', err)
        setStatus('disconnected')
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    checkConnection()
  }, [])

  if (status === 'checking') {
    return (
      <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
          <span>检查连接中...</span>
        </div>
      </div>
    )
  }

  if (status === 'connected') {
    return (
      <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-800 px-4 py-2 rounded-lg shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          <span>PocketBase 已连接</span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-800 px-4 py-2 rounded-lg shadow-lg">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
        <span>PocketBase 连接失败</span>
      </div>
      {error && (
        <div className="mt-1 text-xs">
          错误: {error}
        </div>
      )}
    </div>
  )
}
