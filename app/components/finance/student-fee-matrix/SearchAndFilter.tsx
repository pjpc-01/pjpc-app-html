import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"

interface SearchAndFilterProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  onClearSearch: () => void
  selectedGradeFilter: string
  onGradeFilterChange: (value: string) => void
  availableGrades: string[]
  filteredStudentsCount: number
  totalStudentsCount: number
}

export const SearchAndFilter = ({
  searchTerm,
  onSearchChange,
  onClearSearch,
  selectedGradeFilter,
  onGradeFilterChange,
  availableGrades,
  filteredStudentsCount,
  totalStudentsCount
}: SearchAndFilterProps) => {
  return (
    <>
      <div className="flex gap-4 items-end">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="搜索学生姓名、ID、年级或家长姓名..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={onClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Grade Filter */}
        <div className="w-48">
          <Select value={selectedGradeFilter} onValueChange={onGradeFilterChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择年级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有年级</SelectItem>
              {availableGrades.map(grade => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Results Info */}
      {(searchTerm || selectedGradeFilter !== "all") && (
        <div className="text-sm text-gray-600">
          找到 {filteredStudentsCount} 个学生 (共 {totalStudentsCount} 个)
        </div>
      )}
    </>
  )
}
