"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X, User, Hash, MapPin, GraduationCap } from "lucide-react"
import { Student } from "@/hooks/useStudents"

interface SmartSearchProps {
  students: Student[]
  onSearch: (term: string) => void
  placeholder?: string
  className?: string
}

interface SearchSuggestion {
  type: 'name' | 'id' | 'grade' | 'center' | 'gender'
  value: string
  count: number
  icon: React.ReactNode
}

export default function SmartSearch({ 
  students, 
  onSearch, 
  placeholder = "智能搜索学生...",
  className = "" 
}: SmartSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // 从localStorage加载最近搜索
  useEffect(() => {
    const saved = localStorage.getItem('recentStudentSearches')
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
    localStorage.setItem('recentStudentSearches', JSON.stringify(updated))
  }

  // 生成搜索建议
  const generateSuggestions = (input: string) => {
    if (!input.trim()) {
      setSuggestions([])
      return
    }

    const lowerInput = input.toLowerCase()
    const suggestionsMap = new Map<string, SearchSuggestion>()

    students.forEach(student => {
      // 姓名匹配
      if (student.name?.toLowerCase().includes(lowerInput)) {
        const key = `name:${student.name}`
        if (!suggestionsMap.has(key)) {
          suggestionsMap.set(key, {
            type: 'name',
            value: student.name,
            count: 1,
            icon: <User className="h-3 w-3" />
          })
        } else {
          suggestionsMap.get(key)!.count++
        }
      }

      // 学号匹配
      if (student.studentId?.toLowerCase().includes(lowerInput)) {
        const key = `id:${student.studentId}`
        if (!suggestionsMap.has(key)) {
          suggestionsMap.set(key, {
            type: 'id',
            value: student.studentId,
            count: 1,
            icon: <Hash className="h-3 w-3" />
          })
        } else {
          suggestionsMap.get(key)!.count++
        }
      }

      // 年级匹配
      if (student.standard?.toLowerCase().includes(lowerInput)) {
        const key = `grade:${student.standard}`
        if (!suggestionsMap.has(key)) {
          suggestionsMap.set(key, {
            type: 'grade',
            value: student.standard,
            count: 1,
            icon: <GraduationCap className="h-3 w-3" />
          })
        } else {
          suggestionsMap.get(key)!.count++
        }
      }

      // 中心匹配
      if (student.center?.toLowerCase().includes(lowerInput)) {
        const key = `center:${student.center}`
        if (!suggestionsMap.has(key)) {
          suggestionsMap.set(key, {
            type: 'center',
            value: student.center,
            count: 1,
            icon: <MapPin className="h-3 w-3" />
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

  const handleInputChange = (value: string) => {
    setSearchTerm(value)
    generateSuggestions(value)
    setShowSuggestions(true)
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchTerm(suggestion.value)
    setShowSuggestions(false)
    onSearch(suggestion.value)
    saveSearchHistory(suggestion.value)
  }

  const handleSearch = () => {
    onSearch(searchTerm)
    saveSearchHistory(searchTerm)
    setShowSuggestions(false)
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
    onSearch("")
  }

  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
          onFocus={() => setShowSuggestions(true)}
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
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1 max-h-80 overflow-y-auto">
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
                    onSearch(search)
                    setShowSuggestions(false)
                  }}
                >
                  <Search className="h-3 w-3 text-gray-400" />
                  <span className="text-sm">{search}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
