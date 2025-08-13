"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Search, 
  X, 
  User, 
  Hash, 
  MapPin, 
  GraduationCap, 
  CreditCard, 
  Receipt, 
  Bell, 
  DollarSign,
  Users,
  FileText,
  Calendar,
  Filter,
  ArrowRight
} from "lucide-react"
import { useStudents } from "@/hooks/useStudents"
import { useFees } from "@/hooks/useFees"
import { useInvoices } from "@/hooks/useInvoices"
import { useReceipts } from "@/hooks/useReceipts"
import { useReminders } from "@/hooks/useReminders"
import { usePayments } from "@/hooks/usePayments"
import { useRouter } from "next/navigation"

interface SearchResult {
  id: string
  type: 'student' | 'fee' | 'invoice' | 'receipt' | 'reminder' | 'payment'
  title: string
  subtitle: string
  description: string
  icon: React.ReactNode
  color: string
  action: () => void
  score: number
}

interface SearchSuggestion {
  type: 'student' | 'fee' | 'invoice' | 'receipt' | 'reminder' | 'payment'
  value: string
  count: number
  icon: React.ReactNode
}

interface GlobalSearchProps {
  placeholder?: string
  className?: string
  onResultClick?: (result: SearchResult) => void
}

export default function GlobalSearch({ 
  placeholder = "全局搜索：学生、费用、发票、收据...",
  className = "",
  onResultClick
}: GlobalSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // 获取数据
  const { students } = useStudents()
  const { feeItems } = useFees()
  const { invoices } = useInvoices()
  const { receipts } = useReceipts()
  const { reminders } = useReminders()
  const { payments } = usePayments()

  // 从localStorage加载最近搜索
  useEffect(() => {
    const saved = localStorage.getItem('recentGlobalSearches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse recent searches:', e)
      }
    }
  }, [])

  // 保存搜索历史
  const saveSearchHistory = (term: string) => {
    if (!term.trim()) return
    
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentGlobalSearches', JSON.stringify(updated))
  }

  // 生成搜索建议
  const generateSuggestions = (input: string) => {
    if (!input.trim()) {
      setSuggestions([])
      return
    }

    const lowerInput = input.toLowerCase()
    const suggestionsMap = new Map<string, SearchSuggestion>()

    // 学生建议
    students.forEach(student => {
      if (student.name?.toLowerCase().includes(lowerInput)) {
        const key = `student:${student.name}`
        if (!suggestionsMap.has(key)) {
          suggestionsMap.set(key, {
            type: 'student',
            value: student.name,
            count: 1,
            icon: <User className="h-3 w-3" />
          })
        } else {
          suggestionsMap.get(key)!.count++
        }
      }
      if (student.studentId?.toLowerCase().includes(lowerInput)) {
        const key = `student:${student.studentId}`
        if (!suggestionsMap.has(key)) {
          suggestionsMap.set(key, {
            type: 'student',
            value: student.studentId,
            count: 1,
            icon: <Hash className="h-3 w-3" />
          })
        } else {
          suggestionsMap.get(key)!.count++
        }
      }
    })

    // 费用建议
    feeItems.forEach(fee => {
      if (fee.name?.toLowerCase().includes(lowerInput)) {
        const key = `fee:${fee.name}`
        if (!suggestionsMap.has(key)) {
          suggestionsMap.set(key, {
            type: 'fee',
            value: fee.name,
            count: 1,
            icon: <DollarSign className="h-3 w-3" />
          })
        } else {
          suggestionsMap.get(key)!.count++
        }
      }
    })

    // 发票建议
    invoices.forEach(invoice => {
      if (invoice.invoiceNumber?.toLowerCase().includes(lowerInput)) {
        const key = `invoice:${invoice.invoiceNumber}`
        if (!suggestionsMap.has(key)) {
          suggestionsMap.set(key, {
            type: 'invoice',
            value: invoice.invoiceNumber,
            count: 1,
            icon: <FileText className="h-3 w-3" />
          })
        } else {
          suggestionsMap.get(key)!.count++
        }
      }
    })

    // 转换为数组并排序
    const suggestionsArray = Array.from(suggestionsMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    setSuggestions(suggestionsArray)
  }

  // 执行全局搜索
  const performGlobalSearch = (term: string): SearchResult[] => {
    if (!term.trim()) return []

    const lowerTerm = term.toLowerCase()
    const results: SearchResult[] = []

    // 搜索学生
    students.forEach(student => {
      let score = 0
      let matchedFields: string[] = []

      if (student.name?.toLowerCase().includes(lowerTerm)) {
        score += 10
        matchedFields.push('姓名')
      }
      if (student.studentId?.toLowerCase().includes(lowerTerm)) {
        score += 8
        matchedFields.push('学号')
      }
      if (student.grade?.toLowerCase().includes(lowerTerm)) {
        score += 5
        matchedFields.push('年级')
      }
      if (student.center?.toLowerCase().includes(lowerTerm)) {
        score += 5
        matchedFields.push('中心')
      }
      if (student.parentName?.toLowerCase().includes(lowerTerm)) {
        score += 6
        matchedFields.push('家长姓名')
      }

      if (score > 0) {
        results.push({
          id: student.id,
          type: 'student',
          title: student.name,
          subtitle: `${student.grade} | ${student.center}`,
          description: `匹配字段: ${matchedFields.join(', ')}`,
          icon: <User className="h-4 w-4" />,
          color: 'bg-blue-50 border-blue-200',
          action: () => router.push(`/management/students?search=${student.id}`),
          score
        })
      }
    })

    // 搜索费用
    feeItems.forEach(fee => {
      let score = 0
      let matchedFields: string[] = []

      if (fee.name?.toLowerCase().includes(lowerTerm)) {
        score += 10
        matchedFields.push('费用名称')
      }
      if (fee.category?.toLowerCase().includes(lowerTerm)) {
        score += 5
        matchedFields.push('类别')
      }
      if (fee.description?.toLowerCase().includes(lowerTerm)) {
        score += 3
        matchedFields.push('描述')
      }

      if (score > 0) {
        results.push({
          id: fee.id.toString(),
          type: 'fee',
          title: fee.name,
          subtitle: `${fee.category} | ${fee.amount}元`,
          description: `匹配字段: ${matchedFields.join(', ')}`,
          icon: <DollarSign className="h-4 w-4" />,
          color: 'bg-green-50 border-green-200',
          action: () => router.push('/finance/fees'),
          score
        })
      }
    })

    // 搜索发票
    invoices.forEach(invoice => {
      let score = 0
      let matchedFields: string[] = []

      if (invoice.invoiceNumber?.toLowerCase().includes(lowerTerm)) {
        score += 10
        matchedFields.push('发票号码')
      }
      if (invoice.studentName?.toLowerCase().includes(lowerTerm)) {
        score += 8
        matchedFields.push('学生姓名')
      }
      if (invoice.status?.toLowerCase().includes(lowerTerm)) {
        score += 5
        matchedFields.push('状态')
      }

      if (score > 0) {
        results.push({
          id: invoice.id,
          type: 'invoice',
          title: invoice.invoiceNumber,
          subtitle: `${invoice.studentName} | ${invoice.totalAmount}元`,
          description: `匹配字段: ${matchedFields.join(', ')}`,
          icon: <FileText className="h-4 w-4" />,
          color: 'bg-purple-50 border-purple-200',
          action: () => router.push('/finance/invoices'),
          score
        })
      }
    })

    // 搜索收据
    receipts.forEach(receipt => {
      let score = 0
      let matchedFields: string[] = []

      if (receipt.receiptNumber?.toLowerCase().includes(lowerTerm)) {
        score += 10
        matchedFields.push('收据号码')
      }
      if (receipt.studentName?.toLowerCase().includes(lowerTerm)) {
        score += 8
        matchedFields.push('学生姓名')
      }
      if (receipt.invoiceNumber?.toLowerCase().includes(lowerTerm)) {
        score += 6
        matchedFields.push('发票号码')
      }

      if (score > 0) {
        results.push({
          id: receipt.id,
          type: 'receipt',
          title: receipt.receiptNumber,
          subtitle: `${receipt.studentName} | ${receipt.amount}元`,
          description: `匹配字段: ${matchedFields.join(', ')}`,
          icon: <Receipt className="h-4 w-4" />,
          color: 'bg-orange-50 border-orange-200',
          action: () => router.push('/finance/receipts'),
          score
        })
      }
    })

    // 搜索提醒
    reminders.forEach(reminder => {
      let score = 0
      let matchedFields: string[] = []

      if (reminder.title?.toLowerCase().includes(lowerTerm)) {
        score += 10
        matchedFields.push('标题')
      }
      if (reminder.studentName?.toLowerCase().includes(lowerTerm)) {
        score += 8
        matchedFields.push('学生姓名')
      }
      if (reminder.type?.toLowerCase().includes(lowerTerm)) {
        score += 5
        matchedFields.push('类型')
      }

      if (score > 0) {
        results.push({
          id: reminder.id,
          type: 'reminder',
          title: reminder.title,
          subtitle: `${reminder.studentName} | ${reminder.type}`,
          description: `匹配字段: ${matchedFields.join(', ')}`,
          icon: <Bell className="h-4 w-4" />,
          color: 'bg-yellow-50 border-yellow-200',
          action: () => router.push('/finance/reminders'),
          score
        })
      }
    })

    // 搜索付款
    payments.forEach(payment => {
      let score = 0
      let matchedFields: string[] = []

      if (payment.paymentNumber?.toLowerCase().includes(lowerTerm)) {
        score += 10
        matchedFields.push('付款号码')
      }
      if (payment.studentName?.toLowerCase().includes(lowerTerm)) {
        score += 8
        matchedFields.push('学生姓名')
      }
      if (payment.method?.toLowerCase().includes(lowerTerm)) {
        score += 5
        matchedFields.push('付款方式')
      }

      if (score > 0) {
        results.push({
          id: payment.id,
          type: 'payment',
          title: payment.paymentNumber,
          subtitle: `${payment.studentName} | ${payment.amount}元`,
          description: `匹配字段: ${matchedFields.join(', ')}`,
          icon: <CreditCard className="h-4 w-4" />,
          color: 'bg-emerald-50 border-emerald-200',
          action: () => router.push('/finance/payments'),
          score
        })
      }
    })

    // 按分数排序并限制结果数量
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
  }

  const handleInputChange = (value: string) => {
    setSearchTerm(value)
    generateSuggestions(value)
    setShowSuggestions(true)
    setShowResults(false)
  }

  const handleInputFocus = () => {
    setShowSuggestions(true)
    // 如果搜索框为空，跳转到搜索页面
    if (!searchTerm.trim()) {
      router.push('/search')
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchTerm(suggestion.value)
    setShowSuggestions(false)
    performSearch(suggestion.value)
    saveSearchHistory(suggestion.value)
  }

  const performSearch = (term: string) => {
    const results = performGlobalSearch(term)
    setSearchResults(results)
    setShowResults(true)
    setShowSuggestions(false)
  }

  const handleSearch = () => {
    performSearch(searchTerm)
    saveSearchHistory(searchTerm)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearSearch = () => {
    setSearchTerm("")
    setSuggestions([])
    setShowSuggestions(false)
    setShowResults(false)
    setSearchResults([])
  }

  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result)
    } else {
      result.action()
    }
    setShowResults(false)
    setShowSuggestions(false)
  }

  // 点击外部关闭建议和结果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 统计结果
  const resultStats = useMemo(() => {
    const stats = {
      student: 0,
      fee: 0,
      invoice: 0,
      receipt: 0,
      reminder: 0,
      payment: 0
    }
    
    searchResults.forEach(result => {
      stats[result.type]++
    })
    
    return stats
  }, [searchResults])

  return (
    <div className={`relative ${className}`} ref={suggestionsRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={handleInputFocus}
          className="pl-10 pr-20"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* 搜索建议 */}
      {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg">
          <CardContent className="p-0">
            {/* 搜索建议 */}
            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 mb-2 px-2">搜索建议</div>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-2 py-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-center gap-2">
                      {suggestion.icon}
                      <span className="text-sm">{suggestion.value}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.count}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* 最近搜索 */}
            {recentSearches.length > 0 && (
              <div className="p-2 border-t">
                <div className="text-xs font-medium text-gray-500 mb-2 px-2">最近搜索</div>
                {recentSearches.map((search, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => {
                      setSearchTerm(search)
                      performSearch(search)
                    }}
                  >
                    <Search className="h-3 w-3 text-gray-400" />
                    <span className="text-sm">{search}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 搜索结果 */}
      {showResults && searchResults.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {/* 结果统计 */}
            <div className="p-3 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">找到 {searchResults.length} 个结果</span>
                <div className="flex gap-2">
                  {resultStats.student > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <User className="h-3 w-3 mr-1" />
                      {resultStats.student}
                    </Badge>
                  )}
                  {resultStats.fee > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {resultStats.fee}
                    </Badge>
                  )}
                  {resultStats.invoice > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      {resultStats.invoice}
                    </Badge>
                  )}
                  {resultStats.receipt > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <Receipt className="h-3 w-3 mr-1" />
                      {resultStats.receipt}
                    </Badge>
                  )}
                  {resultStats.reminder > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <Bell className="h-3 w-3 mr-1" />
                      {resultStats.reminder}
                    </Badge>
                  )}
                  {resultStats.payment > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <CreditCard className="h-3 w-3 mr-1" />
                      {resultStats.payment}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* 结果列表 */}
            <div className="p-2">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${result.color}`}
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-shrink-0">
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{result.title}</div>
                        <div className="text-xs text-gray-600">{result.subtitle}</div>
                        <div className="text-xs text-gray-500 mt-1">{result.description}</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 无结果 */}
      {showResults && searchResults.length === 0 && searchTerm && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg">
          <CardContent className="p-4 text-center">
            <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">未找到相关结果</p>
            <p className="text-xs text-gray-500 mt-1">尝试使用不同的关键词</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
