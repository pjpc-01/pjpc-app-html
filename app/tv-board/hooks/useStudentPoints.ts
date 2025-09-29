import { useMemo } from 'react'
import { buildStudentPoints } from '../utils/tvBoardData'

export function useStudentPoints(students: any[], points: any[], center: string) {
  return useMemo(() => {
    console.log('useStudentPoints 调用:', {
      studentsLength: students.length,
      pointsLength: points.length,
      center: center
    })
    const result = buildStudentPoints(students, points, center)
    console.log('useStudentPoints 结果:', {
      resultLength: result.length,
      sampleResult: result.slice(0, 3)
    })
    return result
  }, [students, points, center])
}
