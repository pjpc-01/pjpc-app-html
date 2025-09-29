import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'

// 静态导出配置
export const dynamic = 'force-static'

// 获取智能PocketBase实例
const getPb = async () => await getPocketBase()

// 简单的 Google Sheets 数据导入
export async function POST(request: NextRequest) {
  try {
    // 获取智能PocketBase实例
    const pb = await getPb()
    
    // 确保 PocketBase 认证
    if (!pb.authStore.isValid) {
      try {
        await pb.collection('users').authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD)
        console.log('✅ API 路由中认证成功')
      } catch (authError) {
        console.error('❌ API 路由中认证失败:', authError)
        return NextResponse.json({ error: 'PocketBase 认证失败' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'import-csv':
        // 直接导入 CSV 数据
        if (!data || !Array.isArray(data)) {
          return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
        }

          const importResults = {
            success: 0,
            failed: 0,
          skipped: 0,
            errors: [] as string[]
          }

                 for (const row of data) {
           try {
             // 获取学生姓名
             const studentName = row.name || row.姓名 || row['Student Name'] || ''
             
             // 忽略空姓名或只包含空格的数据
             if (!studentName || studentName.trim() === '') {
               console.log(`⏭️ 跳过空姓名数据`)
               importResults.skipped++
               continue
             }
             
             
            
                         // 获取出生日期
             const dob = row.dob || row.生日 || row.birthday || row['D.O.B'] || ''
             
             // 获取原始年级信息
             const originalGrade = row.grade || row.年级 || row.standard || row.Standard || ''
             
             // 根据出生日期自动计算年级
             let calculatedGrade = originalGrade
             if (dob) {
               const birthYear = parseBirthYear(dob)
               if (birthYear) {
                 const autoGrade = getGradeFromBirthYear(birthYear)
                 console.log(`📅 ${studentName}: 出生年份 ${birthYear}, 自动计算年级: ${autoGrade}`)
                 calculatedGrade = autoGrade
               } else {
                 console.log(`⚠️ ${studentName}: 无法解析出生日期 "${dob}", 使用原始年级: ${originalGrade}`)
                 // 转换原始年级格式
                 calculatedGrade = convertGradeFormat(originalGrade)
               }
             } else {
               console.log(`⚠️ ${studentName}: 无出生日期信息, 使用原始年级: ${originalGrade}`)
               // 转换原始年级格式
               calculatedGrade = convertGradeFormat(originalGrade)
             }
             
             // 映射 CSV 数据到 PocketBase 格式
             const student = {
               student_id: row.id || row.ID || row.student_id || `STU${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
               student_name: studentName,
               standard: calculatedGrade || '未知年级',
               father_phone: row.father_phone || row.父亲电话 || row['Parents Phone Number (Father)'] || '',
               mother_phone: row.mother_phone || row.母亲电话 || row['Parents Phone Number (Mother)'] || '',
               home_address: row.address || row.地址 || row['Home Address'] || '',
               gender: row.gender || row.性别 || row.Gender || '',
               dob: dob || '',
               Center: (row.center || row.中心 || row.Center || 'WX 01') as 'WX 01' | 'WX 02' | 'WX 03' | 'WX 04',
               level: getLevelFromGrade(calculatedGrade)
             }
             
             // 检查是否已存在相同student_id和Center的学生
             try {
               const existingStudent = await pb.collection('students').getFirstListItem(`student_id = "${student.student_id}" && Center = "${student.Center}"`)
               if (existingStudent) {
                 console.log(`⚠️ 学生ID ${student.student_id} 在中心 ${student.Center} 已存在，跳过导入`)
                 importResults.skipped++
                 continue
               }
             } catch (error) {
               // 如果找不到，说明不存在，可以继续导入
             }

                         // 直接使用 PocketBase 添加学生
             console.log(`📝 准备导入学生: ${studentName}`)
             console.log(`   数据:`, JSON.stringify(student, null, 2))
             
             await pb.collection('students').create(student)
             console.log(`✅ 成功导入: ${studentName}`)
              importResults.success++
                         } catch (error) {
               importResults.failed++
               const studentName = row.name || row.姓名 || row['Student Name'] || '未知学生'
               const errorMessage = error instanceof Error ? error.message : 'Unknown error'
               console.error(`❌ 导入失败 ${studentName}:`, error)
               if (error instanceof Error && (error as any).data) {
                 console.error('PocketBase验证错误:', (error as any).data)
               }
               importResults.errors.push(`Failed to import ${studentName}: ${errorMessage}`)
             }
          }
          
          return NextResponse.json({
            success: true,
          message: `Successfully imported ${importResults.success} students, ${importResults.failed} failed${importResults.skipped > 0 ? `, ${importResults.skipped} skipped` : ''}`,
            details: importResults
          })

      case 'stats':
        // 获取统计数据
        try {
          const studentsResponse = await pb.collection('students').getList(1, 500)
          const students = studentsResponse.items
          
          const byGrade = students.reduce((acc: Record<string, number>, student: any) => {
            const grade = student.standard || '未知年级'
            acc[grade] = (acc[grade] || 0) + 1
            return acc
          }, {})
          
          return NextResponse.json({
            total: students.length,
            byGrade,
            message: `当前数据库中有 ${students.length} 个学生`
          })
        } catch (error) {
          return NextResponse.json({
            total: 0,
            byGrade: {},
            message: '无法获取统计数据',
            error: error instanceof Error ? error.message : '未知错误'
          })
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// 根据出生年份计算年级
function getGradeFromBirthYear(birthYear: number): string {
  // 使用2024年作为基准学年（当前学年）
  const baseYear = 2024
  const age = baseYear - birthYear
  
  // 根据年龄计算年级
  if (age === 6) return '一年级'
  if (age === 7) return '二年级'
  if (age === 8) return '三年级'
  if (age === 9) return '四年级'
  if (age === 10) return '五年级'
  if (age === 11) return '六年级'
  if (age === 12) return '初一'
  if (age === 13) return '初二'
  if (age === 14) return '初三'
  if (age === 15) return '高一'
  if (age === 16) return '高二'
  if (age === 17) return '高三'
  if (age === 18) return '高三'
  
  // 如果年龄不在正常范围内，返回未知年级
  return '未知年级'
}

// 解析出生日期并提取年份
function parseBirthYear(dob: string): number | null {
  if (!dob || dob === '0' || dob === '#N/A' || dob.trim() === '') return null
  
  // 尝试不同的日期格式
  const dateFormats = [
    /(\d{4})/, // 直接年份
    /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i, // 12 July 2013
    /(\d{4})-(\d{1,2})-(\d{1,2})/, // 2013-07-12
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // 12/07/2013
    /(\d{4})\/(\d{1,2})\/(\d{1,2})/ // 2013/07/12
  ]
  
  for (const format of dateFormats) {
    const match = dob.match(format)
    if (match) {
      if (match.length === 2) {
        // 直接年份格式
        return parseInt(match[1])
      } else if (match.length === 4) {
        // 完整日期格式，取年份
        return parseInt(match[3] || match[1])
      }
    }
  }
  
  return null
}

// 将马来西亚年级格式转换为中文格式
function convertGradeFormat(grade: string): string {
  if (!grade) return '未知年级'
  
  const gradeStr = grade.toString().toLowerCase().trim()
  
  // 马来西亚格式转换
  if (gradeStr === 'standard 1' || gradeStr === 'std 1') return '一年级'
  if (gradeStr === 'standard 2' || gradeStr === 'std 2') return '二年级'
  if (gradeStr === 'standard 3' || gradeStr === 'std 3') return '三年级'
  if (gradeStr === 'standard 4' || gradeStr === 'std 4') return '四年级'
  if (gradeStr === 'standard 5' || gradeStr === 'std 5') return '五年级'
  if (gradeStr === 'standard 6' || gradeStr === 'std 6') return '六年级'
  if (gradeStr === 'form 1') return '初一'
  if (gradeStr === 'form 2') return '初二'
  if (gradeStr === 'form 3') return '初三'
  if (gradeStr === 'form 4') return '高一'
  if (gradeStr === 'form 5') return '高二'
  if (gradeStr === 'form 6') return '高三'
  
  // 如果已经是中文格式，直接返回
  if (gradeStr.includes('一年级') || gradeStr.includes('二年级') || 
      gradeStr.includes('三年级') || gradeStr.includes('四年级') || 
      gradeStr.includes('五年级') || gradeStr.includes('六年级') ||
      gradeStr.includes('初一') || gradeStr.includes('初二') || gradeStr.includes('初三') ||
      gradeStr.includes('高一') || gradeStr.includes('高二') || gradeStr.includes('高三')) {
    return grade
  }
  
  return grade // 返回原始值
}

// 根据年级确定级别
function getLevelFromGrade(grade: string): 'primary' | 'secondary' {
  if (!grade) return 'primary'
  
  const gradeStr = grade.toString().toLowerCase()
  
  // 小学年级
  if (gradeStr.includes('一年级') || gradeStr.includes('二年级') || 
      gradeStr.includes('三年级') || gradeStr.includes('四年级') || 
      gradeStr.includes('五年级') || gradeStr.includes('六年级') ||
      gradeStr.includes('standard 1') || gradeStr.includes('standard 2') ||
      gradeStr.includes('standard 3') || gradeStr.includes('standard 4') ||
      gradeStr.includes('standard 5') || gradeStr.includes('standard 6') ||
      gradeStr.includes('grade 1') || gradeStr.includes('grade 2') ||
      gradeStr.includes('grade 3') || gradeStr.includes('grade 4') ||
      gradeStr.includes('grade 5') || gradeStr.includes('grade 6')) {
    return 'primary'
  }
  
  // 中学年级
  if (gradeStr.includes('初一') || gradeStr.includes('初二') || gradeStr.includes('初三') ||
      gradeStr.includes('高一') || gradeStr.includes('高二') || gradeStr.includes('高三') ||
      gradeStr.includes('form 1') || gradeStr.includes('form 2') || gradeStr.includes('form 3') ||
      gradeStr.includes('form 4') || gradeStr.includes('form 5') || gradeStr.includes('form 6')) {
    return 'secondary'
  }
  
  // 数字年级判断
  const gradeNum = parseInt(gradeStr)
  if (!isNaN(gradeNum)) {
    return gradeNum <= 6 ? 'primary' : 'secondary'
  }
  
  return 'primary' // 默认
} 