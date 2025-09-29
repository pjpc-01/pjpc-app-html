import { useMemo } from 'react'
import { buildBirthdayList } from '../utils/tvBoardData'

export function useBirthdaySlides(students: any[], center: string, points: any[] = []) {
  return useMemo(() => {
    return buildBirthdayList(students, center, points)
  }, [students, center, points])
}
