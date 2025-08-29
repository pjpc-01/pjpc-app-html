"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { pb } from '@/lib/pocketbase-instance'

export function PocketBaseTest() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isTesting, setIsTesting] = useState(false)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testConnection = async () => {
    setIsTesting(true)
    setTestResults([])
    
    try {
      addResult('🔍 Testing PocketBase connection...')
      
      // Test 1: Basic connection
      addResult('📡 Testing basic connection...')
      const collections = await pb.collections.getFullList()
      addResult(`✅ Connected! Found ${collections.length} collections`)
      
      // Test 2: Check if payments collection exists
      addResult('📋 Checking payments collection...')
      const paymentsCollection = collections.find(col => col.name === 'payments')
      if (paymentsCollection) {
        addResult(`✅ Payments collection found: ${paymentsCollection.name}`)
        addResult(`   - Type: ${paymentsCollection.type}`)
        addResult(`   - Schema fields: ${paymentsCollection.schema.length}`)
      } else {
        addResult('❌ Payments collection NOT found!')
      }
      
      // Test 3: Check if invoices collection exists
      addResult('📋 Checking invoices collection...')
      const invoicesCollection = collections.find(col => col.name === 'invoices')
      if (invoicesCollection) {
        addResult(`✅ Invoices collection found: ${invoicesCollection.name}`)
        addResult(`   - Type: ${invoicesCollection.type}`)
        addResult(`   - Schema fields: ${invoicesCollection.schema.length}`)
      } else {
        addResult('❌ Invoices collection NOT found!')
      }
      
      // Test 4: Try to fetch payments with expand
      if (paymentsCollection) {
        addResult('🔄 Testing payments fetch with expand...')
        try {
          const paymentsResult = await pb.collection('payments').getList(1, 5, {
            expand: 'invoice_id'
          })
          addResult(`✅ Successfully fetched ${paymentsResult.items.length} payments with expand`)
        } catch (error: any) {
          addResult(`❌ Failed to fetch payments with expand: ${error.message}`)
          addResult(`   Status: ${error.status}`)
          addResult(`   Data: ${JSON.stringify(error.data, null, 2)}`)
        }
      }
      
      // Test 5: Try to fetch payments without expand
      if (paymentsCollection) {
        addResult('🔄 Testing payments fetch without expand...')
        try {
          const paymentsResult = await pb.collection('payments').getList(1, 5)
          addResult(`✅ Successfully fetched ${paymentsResult.items.length} payments without expand`)
        } catch (error: any) {
          addResult(`❌ Failed to fetch payments without expand: ${error.message}`)
          addResult(`   Status: ${error.status}`)
        }
      }
      
    } catch (error: any) {
      addResult(`❌ Connection test failed: ${error.message}`)
      addResult(`   Status: ${error.status}`)
      addResult(`   Data: ${JSON.stringify(error.data, null, 2)}`)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>🔧 PocketBase Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testConnection} 
          disabled={isTesting}
          className="w-full"
        >
          {isTesting ? 'Testing...' : 'Run Connection Test'}
        </Button>
        
        {testResults.length > 0 && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Test Results:</h4>
            <div className="space-y-1 text-sm font-mono">
              {testResults.map((result, index) => (
                <div key={index} className="text-gray-700">{result}</div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}





