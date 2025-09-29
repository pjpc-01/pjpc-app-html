import { useState, useMemo } from 'react'

interface UsePaginationProps<T> {
  data: T[]
  pageSize: number
  initialPage?: number
}

interface UsePaginationReturn<T> {
  currentPage: number
  totalPages: number
  paginatedData: T[]
  totalItems: number
  startIndex: number
  endIndex: number
  setCurrentPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void
  canGoNext: boolean
  canGoPrev: boolean
}

export function usePagination<T>({
  data,
  pageSize,
  initialPage = 1
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(initialPage)

  const totalPages = Math.ceil(data.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize

  const paginatedData = useMemo(() => {
    return data.slice(startIndex, endIndex)
  }, [data, startIndex, endIndex])

  const nextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }

  const prevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  const goToFirstPage = () => {
    setCurrentPage(1)
  }

  const goToLastPage = () => {
    setCurrentPage(totalPages)
  }

  const canGoNext = currentPage < totalPages
  const canGoPrev = currentPage > 1

  return {
    currentPage,
    totalPages,
    paginatedData,
    totalItems: data.length,
    startIndex,
    endIndex,
    setCurrentPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    canGoNext,
    canGoPrev
  }
}
