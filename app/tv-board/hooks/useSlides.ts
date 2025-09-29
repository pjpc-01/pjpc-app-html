import { useMemo } from 'react'
import { buildSlides } from '../utils/tvBoardData'

export function useSlides(sortedStudents: any[], monthBirthdays: any[], announcements: any[], transactions: any[] = [], studentsPerPage: number = 12) {
  return useMemo(() => {
    console.log('useSlides 调用:', {
      sortedStudentsLength: sortedStudents.length,
      monthBirthdaysLength: monthBirthdays.length,
      announcementsLength: announcements.length,
      transactionsLength: transactions.length,
      studentsPerPage: studentsPerPage
    })
    const result = buildSlides(sortedStudents, monthBirthdays, announcements, transactions, studentsPerPage)
    console.log('useSlides 结果:', {
      resultLength: result.length,
      slideTypes: result.map(s => s.type)
    })
    return result
  }, [sortedStudents, monthBirthdays, announcements, transactions, studentsPerPage])
}
