import { useState } from 'react'

export interface Student {
  id: number
  name: string
  grade: string
  parentName: string
  parentEmail: string
}

export const useStudents = () => {
  const [students] = useState<Student[]>([
    { id: 1, name: "王小明", grade: "三年级", parentName: "王大明", parentEmail: "wang@example.com" },
    { id: 2, name: "李小红", grade: "四年级", parentName: "李大红", parentEmail: "li@example.com" },
    { id: 3, name: "张小华", grade: "五年级", parentName: "张大华", parentEmail: "zhang@example.com" },
    { id: 4, name: "陈小军", grade: "三年级", parentName: "陈大军", parentEmail: "chen@example.com" },
  ])

  return { students }
} 