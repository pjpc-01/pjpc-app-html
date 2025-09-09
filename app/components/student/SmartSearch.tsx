"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X, Clock, TrendingUp, Users } from "lucide-react"
import { Student } from "@/hooks/useStudents"

interface SmartSearchProps {
  students: Student[]
  onSearch: (searchTerm: string) => void
  onClear: () => void
  placeholder?: string
}

interface SearchSuggestion {
  text: string
  type: 'name' | 'studentId' | 'grade' | 'parent' | 'school' | 'center' | 'status'
  count: number
  icon: string
}

interface SearchHistory {
  term: string
  timestamp: number
  resultCount: number
}

export default function SmartSearch({ 
  students, 
  onSearch, 
  onClear, 
  placeholder = "智能搜索：支持姓名、学号、年级、家长信息等..." 
}: SmartSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [popularSearches, setPopularSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // 从localStorage加载搜索历史
  useEffect(() => {
    const savedHistory = localStorage.getItem('student-search-history')
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.error('Failed to load search history:', error)
      }
    }
  }, [])

  // 生成智能搜索建议
  const searchSuggestions = useMemo(() => {
    if (!searchTerm.trim()) {
      // 显示搜索历史和热门搜索
      const historySuggestions = searchHistory
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3)
        .map(item => ({
          text: item.term,
          type: 'name' as const,
          count: item.resultCount,
          icon: '🕒'
        }))

      const popularSuggestions = popularSearches.slice(0, 2).map(term => ({
        text: term,
        type: 'name' as const,
        count: students.filter(s => 
          s.student_name?.toLowerCase().includes(term.toLowerCase()) ||
          s.student_id?.toLowerCase().includes(term.toLowerCase())
        ).length,
        icon: '🔥'
      }))

      return [...historySuggestions, ...popularSuggestions]
    }

    const suggestions = new Set<SearchSuggestion>()
    const lowerSearchTerm = searchTerm.toLowerCase()

    // 模糊匹配算法
    const fuzzyMatch = (text: string, query: string): boolean => {
      if (!text || !query) return false
      const textLower = text.toLowerCase()
      const queryLower = query.toLowerCase()
      
      // 精确匹配
      if (textLower.includes(queryLower)) return true
      
      // 拼音匹配（简单实现）
      const pinyinMap: Record<string, string[]> = {
        'a': ['啊', '阿'],
        'b': ['不', '把', '被'],
        'c': ['从', '此'],
        'd': ['的', '地', '得'],
        'e': ['而', '二'],
        'f': ['发', '分'],
        'g': ['个', '给'],
        'h': ['和', '很', '还'],
        'i': ['一', '以'],
        'j': ['就', '将', '经'],
        'k': ['可', '看'],
        'l': ['了', '来', '里'],
        'm': ['们', '没', '每'],
        'n': ['你', '那', '能'],
        'o': ['哦', '欧'],
        'p': ['平', '朋'],
        'q': ['去', '请', '前'],
        'r': ['人', '如', '让'],
        's': ['是', '说', '上'],
        't': ['他', '她', '它', '天', '太'],
        'u': ['有', '又', '用'],
        'v': ['为', '我', '无'],
        'w': ['我', '为', '问'],
        'x': ['下', '想', '学'],
        'y': ['一', '有', '也', '要'],
        'z': ['在', '这', '中', '只']
      }

      // 检查是否包含拼音首字母
      for (const [pinyin, chars] of Object.entries(pinyinMap)) {
        if (queryLower.includes(pinyin)) {
          for (const char of chars) {
            if (textLower.includes(char)) return true
          }
        }
      }

      return false
    }

    students.forEach(student => {
      // 姓名匹配
      if (student.student_name && fuzzyMatch(student.student_name, lowerSearchTerm)) {
        suggestions.add({
          text: student.student_name,
          type: 'name',
          count: 1,
          icon: '👤'
        })
      }

      // 学号匹配
      if (student.student_id && fuzzyMatch(student.student_id, lowerSearchTerm)) {
        suggestions.add({
          text: student.student_id,
          type: 'studentId',
          count: 1,
          icon: '🎓'
        })
      }

      // 年级匹配
      if (student.standard && fuzzyMatch(student.standard, lowerSearchTerm)) {
        suggestions.add({
          text: student.standard,
          type: 'grade',
          count: students.filter(s => s.standard === student.standard).length,
          icon: '📚'
        })
      }

      // 家长姓名匹配
      if (student.parentName && fuzzyMatch(student.parentName, lowerSearchTerm)) {
        suggestions.add({
          text: student.parentName,
          type: 'parent',
          count: students.filter(s => s.parentName === student.parentName).length,
          icon: '👨‍👩‍👧‍👦'
        })
      }

      // 学校匹配
      if (student.school && fuzzyMatch(student.school, lowerSearchTerm)) {
        suggestions.add({
          text: student.school,
          type: 'school',
          count: students.filter(s => s.school === student.school).length,
          icon: '🏫'
        })
      }

      // 中心匹配
      if (student.center && fuzzyMatch(student.center, lowerSearchTerm)) {
        suggestions.add({
          text: student.center,
          type: 'center',
          count: students.filter(s => s.center === student.center).length,
          icon: '📍'
        })
      }

      // 状态匹配
      if (student.status && fuzzyMatch(student.status, lowerSearchTerm)) {
        suggestions.add({
          text: student.status,
          type: 'status',
          count: students.filter(s => s.status === student.status).length,
          icon: '✅'
        })
      }
    })

    return Array.from(suggestions).slice(0, 8)
  }, [searchTerm, students, searchHistory, popularSearches])

  // 处理搜索
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    onSearch(term)
    
    // 保存到搜索历史
    if (term.trim()) {
      const resultCount = students.filter(s => 
        s.student_name?.toLowerCase().includes(term.toLowerCase()) ||
        s.student_id?.toLowerCase().includes(term.toLowerCase()) ||
        s.standard?.toLowerCase().includes(term.toLowerCase()) ||
        s.parentName?.toLowerCase().includes(term.toLowerCase()) ||
        s.school?.toLowerCase().includes(term.toLowerCase()) ||
        s.center?.toLowerCase().includes(term.toLowerCase()) ||
        s.status?.toLowerCase().includes(term.toLowerCase())
      ).length

      const newHistory = [
        { term, timestamp: Date.now(), resultCount },
        ...searchHistory.filter(item => item.term !== term)
      ].slice(0, 10) // 只保留最近10次搜索

      setSearchHistory(newHistory)
      localStorage.setItem('student-search-history', JSON.stringify(newHistory))
    }
  }

  // 处理建议点击
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    handleSearch(suggestion.text)
    setShowSuggestions(false)
  }

  // 清除搜索
  const handleClear = () => {
    setSearchTerm("")
    onClear()
    setShowSuggestions(false)
  }

  // 处理输入变化
  const handleInputChange = (value: string) => {
    setSearchTerm(value)
    setShowSuggestions(true)
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* 智能建议下拉框 */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1 max-h-80 overflow-y-auto">
          {searchSuggestions.length > 0 ? (
            <div className="p-2">
              {/* 搜索建议 */}
              {searchSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 cursor-pointer rounded-md"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{suggestion.icon}</span>
                    <span className="text-sm font-medium">{suggestion.text}</span>
                    <Badge variant="outline" className="text-xs">
                      {suggestion.type === 'name' ? '姓名' :
                       suggestion.type === 'studentId' ? '学号' :
                       suggestion.type === 'grade' ? '年级' :
                       suggestion.type === 'parent' ? '家长' :
                       suggestion.type === 'school' ? '学校' :
                       suggestion.type === 'center' ? '中心' :
                       suggestion.type === 'status' ? '状态' : suggestion.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="h-3 w-3" />
                    <span>{suggestion.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              没有找到匹配的建议
            </div>
          )}
        </div>
      )}
    </div>
  )
}