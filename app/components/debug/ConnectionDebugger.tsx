// ========================================
// Connection Debugger Component
// ========================================

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/pocketbase-auth-context'
import { useStudentFeeMatrixQuery } from '@/hooks/useStudentFeeMatrixQuery'

export function ConnectionDebugger() {
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { connectionStatus, user } = useAuth()
  
  // Use the new hook
  const { runDiagnostics } = useStudentFeeMatrixQuery()

  const handleRunDiagnostics = async () => {
    setLoading(true)
    try {
      const results = await runDiagnostics()
      setDiagnostics(results)
    } catch (error) {
      console.error('Diagnostics failed:', error)
      setDiagnostics({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Connection Debugger
        </CardTitle>
        <CardDescription>
          Debug PocketBase connection and data access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleRunDiagnostics} 
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Running...' : 'Run Diagnostics'}
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
              {connectionStatus}
            </Badge>
          </div>
          
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">User:</span>
              <Badge variant="outline">{user.email}</Badge>
            </div>
          )}
        </div>

        {diagnostics && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Diagnostics Results:</h3>
            
            {diagnostics.error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">Error: {diagnostics.error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Connection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs">Status: {diagnostics.connectionStatus}</p>
                    <p className="text-xs">Has User: {diagnostics.hasUser ? 'Yes' : 'No'}</p>
                    <p className="text-xs">User ID: {diagnostics.userId || 'None'}</p>
                    <p className="text-xs">Role: {diagnostics.userRole || 'None'}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Collections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs">Total: {diagnostics.collectionsCount}</p>
                    <p className="text-xs">Students: {diagnostics.hasStudents ? '✅' : '❌'}</p>
                    <p className="text-xs">Fee Items: {diagnostics.hasFeeItems ? '✅' : '❌'}</p>
                    <p className="text-xs">Student Fees: {diagnostics.hasStudentFees ? '✅' : '❌'}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Data Counts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs">Students: {diagnostics.studentsCount}</p>
                    <p className="text-xs">Fees: {diagnostics.feesCount}</p>
                    <p className="text-xs">Assignments: {diagnostics.assignmentsCount}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
