"use client"

import { motion } from "framer-motion"
import { Clock, TrendingUp, TrendingDown, Minus, Gift } from "lucide-react"

interface RecentTransactionsProps {
  transactions: any[]
  loading: boolean
  error: string | null
  isRealtime?: boolean
}

export default function RecentTransactions({
  transactions,
  loading,
  error,
  isRealtime = false
}: RecentTransactionsProps) {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p>加载交易记录中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-red-400">
          <p>加载失败: {error}</p>
        </div>
      </div>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">暂无交易记录</p>
          <p className="text-sm opacity-75">积分变动将在这里显示</p>
        </div>
      </div>
    )
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'add_points':
        return <TrendingUp className="w-4 h-4 text-green-400" />
      case 'deduct_points':
        return <TrendingDown className="w-4 h-4 text-red-400" />
      case 'redeem_gift':
        return <Gift className="w-4 h-4 text-purple-400" />
      default:
        return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'add_points':
        return 'text-green-400'
      case 'deduct_points':
        return 'text-red-400'
      case 'redeem_gift':
        return 'text-purple-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="h-full flex flex-col">
      <motion.div
        className="mb-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-bold text-white">最近交易</h3>
          <div className={`text-xs px-2 py-1 rounded ${
            isRealtime 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          }`}>
            {isRealtime ? '🟢 LIVE' : '🟡 POLLING'}
          </div>
        </div>
        <p className="text-gray-400 text-sm">最近的积分变动记录</p>
      </motion.div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {transactions.slice(0, 10).map((transaction, index) => (
            <motion.div
              key={transaction.id}
              className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTransactionIcon(transaction.transaction_type)}
                  <div>
                    <div className="font-medium text-white text-sm">
                      {transaction.student_name || '未知学生'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {transaction.reason || '积分变动'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${getTransactionColor(transaction.transaction_type)}`}>
                    {transaction.transaction_type === 'add_points' ? '+' : transaction.transaction_type === 'deduct_points' ? '-' : ''}
                    {transaction.points_change || 0}
                  </div>
                  <div className="text-xs text-gray-400">
                    {transaction.created ? new Date(transaction.created).toLocaleTimeString() : '刚刚'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}