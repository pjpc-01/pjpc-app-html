"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Loader2, AlertCircle } from "lucide-react"
import { useReceipts } from "@/hooks/useReceipts"

export default function ReceiptManagement() {
  const {
    receipts,
    totalReceipts,
    totalAmount,
    isLoading,
    error,
    removeReceipt,
    refetch,
    isDeleting
  } = useReceipts()

  // React Query handles all data fetching automatically - no need for useEffect



  // Handle receipt removal
  const handleRemoveReceipt = async (id: string) => {
    try {
      await removeReceipt(id)
    } catch (error) {
      console.error('Failed to remove receipt:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading receipts...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 p-8">
        <div className="flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-600" />
          <span className="ml-2 text-red-600">Error: {error}</span>
        </div>
        
        <div className="flex justify-center space-x-4">
          <Button onClick={() => refetch()} variant="outline">
            Retry
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Receipts</h3>
          <p className="text-gray-600">Connected to PocketBase receipts collection</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" disabled={isLoading}>
            <Loader2 className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>


        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Receipts</p>
                <p className="text-2xl font-bold text-green-600">{totalReceipts}</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-blue-600">RM {totalAmount.toLocaleString()}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receipts List */}
      <Card>
        <CardHeader>
          <CardTitle>Receipts List</CardTitle>
                     <CardDescription>
             {totalReceipts === 0 ? "No receipts found in PocketBase." : `${totalReceipts} receipt(s) from PocketBase`}
           </CardDescription>
        </CardHeader>
        <CardContent>
          {totalReceipts === 0 ? (
                         <div className="text-center py-8 text-gray-500">
               <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
               <p>No receipts available</p>
               <p className="text-sm">Receipts will appear here when added to the system</p>
             </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt ID</TableHead>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-medium">{receipt.receipt_id}</TableCell>
                    <TableCell>{receipt.invoice_id}</TableCell>
                    <TableCell>RM {receipt.amount.toLocaleString()}</TableCell>
                    <TableCell>{receipt.receipt_date}</TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleRemoveReceipt(receipt.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Removing...' : 'Remove'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
