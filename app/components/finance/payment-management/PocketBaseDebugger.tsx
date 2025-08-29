"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { pb } from '@/lib/pocketbase-instance'
import { debugLog, debugPocketBase } from '@/lib/debug'

interface DebugResult {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
  data?: any
}

export function PocketBaseDebugger() {
  const [debugResults, setDebugResults] = useState<DebugResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (level: DebugResult['level'], message: string, data?: any) => {
    const result: DebugResult = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      data
    }
    setDebugResults(prev => [...prev, result])
  }

  const clearResults = () => {
    setDebugResults([])
  }

  const testBasicConnection = async () => {
    addResult('info', '📡 Testing basic PocketBase connection...')
    
    try {
      debugPocketBase.instance(pb)
      addResult('success', '✅ PocketBase instance is accessible')
      
      if (pb.authStore.isValid) {
        addResult('success', '✅ User is authenticated')
      } else {
        addResult('warn', '⚠️ User is not authenticated')
      }
    } catch (error: any) {
      addResult('error', '❌ Basic connection failed', error)
    }
  }

  const testCollectionFields = async () => {
    addResult('info', '🔍 Testing collection field names...')
    try {
      const paymentsFields = await debugPocketBase.testCollectionFields(pb, 'payments')
      addResult('success', `Payments fields: ${paymentsFields.fields.join(', ')}`)
      addResult('info', `Potential relations: ${paymentsFields.relationFields.join(', ')}`)
      
      const invoicesFields = await debugPocketBase.testCollectionFields(pb, 'invoices')
      addResult('success', `Invoices fields: ${invoicesFields.fields.join(', ')}`)
      addResult('info', `Potential relations: ${invoicesFields.relationFields.join(', ')}`)
      
      addResult('success', 'Collection field testing completed')
    } catch (error: any) {
      addResult('error', `Collection field testing failed: ${error.message}`)
    }
  }

  const analyzePaymentsCollection = async () => {
    addResult('info', '🔍 Running comprehensive payments collection analysis...')
    try {
      const analysis = await debugPocketBase.analyzePaymentsCollection(pb)
      
      if (analysis.success) {
        addResult('success', '✅ Collection analysis completed!')
        addResult('info', `Sample record fields: ${analysis.sampleRecord.fields.join(', ')}`)
        addResult('info', `Potential relations: ${analysis.potentialRelations.join(', ')}`)
        
        if (analysis.validRelations.length > 0) {
          addResult('info', 'Valid relation candidates found:')
          analysis.validRelations.forEach(relation => {
            addResult('info', `  - ${relation.field}: ${relation.value} (ID-like: ${relation.looksLikeId})`)
          })
        }
        
        addResult('info', 'Expand test results:')
        analysis.expandResults.forEach(result => {
          if (result.success) {
            addResult('success', `  ✅ ${result.field}: Works!`)
          } else {
            addResult('error', `  ❌ ${result.field}: ${result.error.message} (${result.error.status})`)
          }
        })
      } else {
        addResult('error', `Collection analysis failed: ${analysis.reason || 'Unknown error'}`)
      }
    } catch (error: any) {
      addResult('error', `Collection analysis failed: ${error.message}`)
    }
  }

  const testExpandIssues = async () => {
    addResult('info', '🔗 Testing expand functionality...')
    try {
      const possibleFields = ['invoice_id', 'invoice', 'invoices', 'invoiceId']
      for (const field of possibleFields) {
        try {
          addResult('info', `Testing expand field: ${field}`)
          const result = await pb.collection('payments').getList(1, 1, { expand: field })
          addResult('success', `✅ Expand with "${field}" works!`)
          return // Stop on first success
        } catch (error: any) {
          addResult('warn', `❌ Expand with "${field}" failed: ${error.message}`)
        }
      }
      addResult('error', '❌ All expand fields failed. Check your collection schema.')
    } catch (error: any) {
      addResult('error', `Expand testing failed: ${error.message}`)
    }
  }

  const testFieldConflicts = async () => {
    addResult('info', '🔍 Testing for field conflicts between payments and invoices...')
    try {
      const conflictResult = await debugPocketBase.testFieldConflicts(pb, 'payments', 'invoices')
      
      if (conflictResult.hasConflicts) {
        addResult('warn', `⚠️ Field conflicts detected: ${conflictResult.conflictingFields.join(', ')}`)
        
        conflictResult.conflictAnalysis.forEach(conflict => {
          addResult('info', `Field "${conflict.field}":`)
          addResult('info', `  - Payments: ${conflict.payments_value} (${conflict.payments_type})`)
          addResult('info', `  - Invoices: ${conflict.invoices_value} (${conflict.invoices_type})`)
          addResult('info', `  - Same type: ${conflict.isSameType ? 'Yes' : 'No'}`)
        })
        
        addResult('warn', 'Recommendations:')
        conflictResult.recommendations.forEach(rec => {
          addResult('info', `  - ${rec}`)
        })
      } else {
        addResult('success', '✅ No field conflicts detected')
      }
    } catch (error: any) {
      addResult('error', `Field conflict testing failed: ${error.message}`)
    }
  }

  const runFullDiagnostic = async () => {
    setIsRunning(true)
    setDebugResults([])
    addResult('info', '🚀 Starting full PocketBase diagnostic...')
    await testBasicConnection()
    await testCollectionFields()
    await analyzePaymentsCollection()
    await testExpandIssues()
    await testFieldConflicts()
    addResult('success', '✅ Full diagnostic completed!')
    setIsRunning(false)
  }

  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 PocketBase Debugger
          <Badge variant="outline">Diagnostic Tool</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button 
            onClick={runFullDiagnostic} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? 'Running...' : 'Run Full Diagnostic'}
          </Button>
          
          <Button 
            onClick={testCollectionFields} 
            disabled={isRunning}
            variant="outline"
            className="w-full"
          >
            Test Collection Fields
          </Button>
          
          <Button 
            onClick={analyzePaymentsCollection} 
            disabled={isRunning}
            variant="outline"
            className="w-full"
          >
            Analyze Payments Collection
          </Button>
          
          <Button 
            onClick={testExpandIssues} 
            disabled={isRunning}
            variant="outline"
            className="w-full"
          >
            Test Expand Issues
          </Button>
          
          <Button 
            onClick={testFieldConflicts} 
            disabled={isRunning}
            variant="outline"
            className="w-full"
          >
            Test Field Conflicts
          </Button>
          
          <Button onClick={clearResults} variant="outline" className="w-full">
            Clear Results
          </Button>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <h3 className="font-semibold">Debug Results:</h3>
          <div className="max-h-96 overflow-y-auto space-y-2 p-4 bg-gray-50 rounded-lg">
            {debugResults.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Click "Run Full Diagnostic" to start debugging...
              </p>
            ) : (
              debugResults.map((result, index) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  result.level === 'error' ? 'bg-red-50 border-red-200' :
                  result.level === 'warn' ? 'bg-yellow-50 border-yellow-200' :
                  result.level === 'success' ? 'bg-green-50 border-green-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-mono text-gray-500">
                      {result.timestamp}
                    </span>
                    <span className={`font-medium ${
                      result.level === 'error' ? 'text-red-700' :
                      result.level === 'warn' ? 'text-yellow-700' :
                      result.level === 'success' ? 'text-green-700' :
                      'text-blue-700'
                    }`}>
                      {result.message}
                    </span>
                  </div>
                  {result.data && (
                    <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">💡 How to Use:</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Click "Run Full Diagnostic" to check all aspects of your PocketBase setup</li>
            <li>Use "Test Collection Fields" to see the exact field names in your collections</li>
            <li>Use "Analyze Payments Collection" for detailed payments collection analysis</li>
            <li>Use "Test Expand Issues" to specifically debug the expand problem</li>
            <li>Use "Test Field Conflicts" to check for field name conflicts between collections</li>
            <li>Review the results for any ❌ errors or ⚠️ warnings</li>
            <li>Follow the suggested solutions for each issue</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
