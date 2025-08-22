// ========================================
// Connection Debugger Component
// ========================================

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/pocketbase-auth-context'
import { useStudentFeeMatrix } from '@/hooks/useStudentFeeMatrix'

export const ConnectionDebugger: React.FC = () => {
  const { user, connectionStatus, loading, error } = useAuth()
  const { runDiagnostics } = useStudentFeeMatrix()

  const handleRunDiagnostics = async () => {
    console.log('🔍 Running diagnostics...')
    await runDiagnostics()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800'
      case 'disconnected': return 'bg-red-100 text-red-800'
      case 'checking': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Connection Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="space-y-2">
          <h3 className="font-medium">Connection Status</h3>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(connectionStatus)}>
              {connectionStatus}
            </Badge>
            {loading && <Badge variant="secondary">Loading...</Badge>}
          </div>
        </div>

        {/* User Info */}
        <div className="space-y-2">
          <h3 className="font-medium">User Information</h3>
          <div className="text-sm space-y-1">
            <div>User ID: {user?.id || 'Not authenticated'}</div>
            <div>Email: {user?.email || 'Not available'}</div>
            <div>Role: {user?.role || 'Not available'}</div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="space-y-2">
            <h3 className="font-medium text-red-600">Error</h3>
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <h3 className="font-medium">Actions</h3>
          <div className="flex gap-2">
            <Button 
              onClick={handleRunDiagnostics}
              variant="outline"
              size="sm"
            >
              Run Diagnostics
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              Reload Page
            </Button>
          </div>
        </div>

        {/* Debug Info */}
        <div className="space-y-2">
          <h3 className="font-medium">Debug Information</h3>
          <div className="text-xs bg-gray-50 p-2 rounded space-y-1">
            <div>Loading: {loading.toString()}</div>
            <div>Connection Status: {connectionStatus}</div>
            <div>Has User: {!!user}</div>
            <div>User ID: {user?.id || 'null'}</div>
            <div>Timestamp: {new Date().toISOString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
