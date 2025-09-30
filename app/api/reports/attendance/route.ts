import { NextRequest, NextResponse } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase-optimized'
import { format, parseISO, startOfDay, endOfDay, subDays, subWeeks, subMonths, subYears } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// 企业级考勤报告生成器
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      reportType, // 'daily', 'weekly', 'monthly', 'yearly', 'custom'
      startDate, 
      endDate, 
      center, 
      includeStudents = true, 
      includeTeachers = true,
      format: reportFormat = 'pdf' // 'pdf', 'excel', 'csv'
    } = body

    console.log('📊 生成企业级考勤报告:', { reportType, startDate, endDate, center, includeStudents, includeTeachers, format: reportFormat })

    const pb = await getPocketBase()
    console.log('✅ PocketBase实例已就绪，认证状态:', pb.authStore.isValid ? '有效' : '无效')
    
    // 确定查询日期范围
    let queryStartDate = startDate
    let queryEndDate = endDate
    
    if (!queryStartDate || !queryEndDate) {
      const today = new Date()
      switch (reportType) {
        case 'daily':
          queryStartDate = queryEndDate = format(today, 'yyyy-MM-dd')
          break
        case 'weekly':
          queryStartDate = format(subDays(today, 7), 'yyyy-MM-dd')
          queryEndDate = format(today, 'yyyy-MM-dd')
          break
        case 'monthly':
          queryStartDate = format(subMonths(today, 1), 'yyyy-MM-dd')
          queryEndDate = format(today, 'yyyy-MM-dd')
          break
        case 'yearly':
          queryStartDate = format(subYears(today, 1), 'yyyy-MM-dd')
          queryEndDate = format(today, 'yyyy-MM-dd')
          break
        default:
          queryStartDate = format(today, 'yyyy-MM-dd')
          queryEndDate = format(today, 'yyyy-MM-dd')
      }
    }

    // 获取学生考勤数据
    let studentRecords = []
    if (includeStudents) {
      const studentParams = new URLSearchParams()
      if (queryStartDate) studentParams.append('startDate', queryStartDate)
      if (queryEndDate) studentParams.append('endDate', queryEndDate)
      if (center) studentParams.append('center', center)

      try {
        const studentResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/student-attendance?${studentParams.toString()}`)
        const studentData = await studentResponse.json()
        
        if (studentData.success) {
          studentRecords = studentData.records.map((record: any) => ({
            ...record,
            type: 'student',
            name: record.student_name,
            id_field: record.student_id
          }))
        }
      } catch (error) {
        console.error('获取学生考勤数据失败:', error)
        // 继续执行，不中断整个流程
      }
    }

    // 获取教师考勤数据
    let teacherRecords = []
    if (includeTeachers) {
      const teacherParams = new URLSearchParams()
      if (queryStartDate) teacherParams.append('startDate', queryStartDate)
      if (queryEndDate) teacherParams.append('endDate', queryEndDate)
      if (center) teacherParams.append('center', center)
      teacherParams.append('type', 'teacher')

      try {
        const teacherResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/teacher-attendance?${teacherParams.toString()}`)
        const teacherData = await teacherResponse.json()
        
        if (teacherData.success) {
          teacherRecords = teacherData.records.map((record: any) => ({
            ...record,
            type: 'teacher',
            name: record.teacher_name || record.name,
            id_field: record.teacher_id || record.user_id
          }))
        }
      } catch (error) {
        console.error('获取教师考勤数据失败:', error)
        // 继续执行，不中断整个流程
      }
    }

    // 合并所有考勤记录
    const allRecords = [...studentRecords, ...teacherRecords]
    
    // 生成企业级报告数据
    const reportData = generateEnterpriseReportData(allRecords, {
      reportType,
      startDate: queryStartDate,
      endDate: queryEndDate,
      center,
      generatedAt: new Date()
    })

    // 根据格式生成报告
    let reportContent
    let contentType
    let filename

    switch (reportFormat) {
      case 'pdf':
        reportContent = await generatePDFReport(reportData)
        contentType = 'application/pdf'
        filename = `attendance_report_${reportData.reportInfo.period}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`
        break
      case 'excel':
        reportContent = await generateExcelReport(reportData)
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        filename = `attendance_report_${reportData.reportInfo.period}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`
        break
      case 'csv':
        reportContent = generateCSVReport(reportData)
        contentType = 'text/csv; charset=utf-8'
        filename = `attendance_report_${reportData.reportInfo.period}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
        break
      default:
        reportContent = generateCSVReport(reportData)
        contentType = 'text/csv; charset=utf-8'
        filename = `attendance_report_${reportData.reportInfo.period}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
    }

    // 确保内容是正确的Buffer
    const buffer = Buffer.isBuffer(reportContent) ? reportContent : Buffer.from(reportContent, 'utf-8')
    
    return new NextResponse(buffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('❌ 生成企业级考勤报告失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '生成报告失败', 
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

// 生成企业级报告数据
function generateEnterpriseReportData(records: any[], options: any) {
  const { startDate, endDate, center, generatedAt } = options
  
  // 基础统计
  const totalRecords = records.length
  const studentRecords = records.filter(r => r.type === 'student')
  const teacherRecords = records.filter(r => r.type === 'teacher')
  
  // 出勤统计
  const presentRecords = records.filter(r => r.status === 'present' || r.status === 'completed')
  const absentRecords = records.filter(r => r.status === 'absent')
  const lateRecords = records.filter(r => r.status === 'late')
  const earlyLeaveRecords = records.filter(r => r.status === 'early_leave')
  
  // 按日期分组统计
  const dailyStats: Record<string, any> = {}
  records.forEach(record => {
    const date = record.date
    if (!dailyStats[date]) {
      dailyStats[date] = {
        date,
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        earlyLeave: 0,
        students: 0,
        teachers: 0
      }
    }
    dailyStats[date].total++
    dailyStats[date][record.status]++
    dailyStats[date][record.type + 's']++
  })
  
  // 按中心分组统计
  const centerStats: Record<string, any> = {}
  records.forEach(record => {
    const centerName = record.center || 'Unknown Center'
    if (!centerStats[centerName]) {
      centerStats[centerName] = {
        center: centerName,
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        earlyLeave: 0,
        students: 0,
        teachers: 0
      }
    }
    centerStats[centerName].total++
    centerStats[centerName][record.status]++
    centerStats[centerName][record.type + 's']++
  })
  
  // 按人员分组统计
  const personStats: Record<string, any> = {}
  records.forEach(record => {
    const personKey = `${record.type}_${record.id_field}`
    if (!personStats[personKey]) {
      personStats[personKey] = {
        name: record.name,
        id: record.id_field,
        type: record.type === 'student' ? 'Student' : 'Teacher',
        center: record.center,
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        earlyLeaveDays: 0,
        attendanceRate: 0
      }
    }
    personStats[personKey].totalDays++
    personStats[personKey][record.status + 'Days']++
  })
  
  // 计算个人出勤率
  Object.values(personStats).forEach((person: any) => {
    person.attendanceRate = person.totalDays > 0 ? Math.round((person.presentDays / person.totalDays) * 100) : 0
  })
  
  // 时间分析
  const checkInTimes = records
    .filter(r => r.check_in)
    .map(r => new Date(r.check_in).getHours() * 60 + new Date(r.check_in).getMinutes())
  
  const checkOutTimes = records
    .filter(r => r.check_out)
    .map(r => new Date(r.check_out).getHours() * 60 + new Date(r.check_out).getMinutes())
  
  const averageCheckInTime = checkInTimes.length > 0 
    ? format(new Date(0, 0, 0, Math.floor(checkInTimes.reduce((a, b) => a + b, 0) / checkInTimes.length / 60), 
      Math.floor((checkInTimes.reduce((a, b) => a + b, 0) / checkInTimes.length) % 60)), 'HH:mm')
    : 'No Data'
  
  const averageCheckOutTime = checkOutTimes.length > 0 
    ? format(new Date(0, 0, 0, Math.floor(checkOutTimes.reduce((a, b) => a + b, 0) / checkOutTimes.length / 60), 
      Math.floor((checkOutTimes.reduce((a, b) => a + b, 0) / checkOutTimes.length) % 60)), 'HH:mm')
    : 'No Data'
  
  return {
    // 报告基本信息
    reportInfo: {
      title: 'Attendance Report',
      period: `${startDate} to ${endDate}`,
      center: center || 'All Centers',
      generatedAt: format(generatedAt, 'yyyy-MM-dd HH:mm:ss'),
      generatedBy: 'PJPC Education System',
      version: '1.0.0'
    },
    
    // 总体统计
    summary: {
      totalRecords,
      studentRecords: studentRecords.length,
      teacherRecords: teacherRecords.length,
      presentRecords: presentRecords.length,
      absentRecords: absentRecords.length,
      lateRecords: lateRecords.length,
      earlyLeaveRecords: earlyLeaveRecords.length,
      overallAttendanceRate: totalRecords > 0 ? Math.round((presentRecords.length / totalRecords) * 100) : 0,
      averageCheckInTime,
      averageCheckOutTime
    },
    
    // 详细数据
    dailyStats: Object.values(dailyStats).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    centerStats: Object.values(centerStats),
    personStats: Object.values(personStats).sort((a: any, b: any) => b.attendanceRate - a.attendanceRate),
    
    // 原始记录
    records: records.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
  }
}

// 生成PDF报告
async function generatePDFReport(reportData: any): Promise<Buffer> {
  try {
    const puppeteer = require('puppeteer')
    const html = generateHTMLReport(reportData)
    
    // 启动浏览器
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    
    // 设置页面内容
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    // 生成PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
          <span>PJPC Education Management System - Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `
    })
    
    await browser.close()
    
    return pdfBuffer
  } catch (error) {
    console.error('PDF生成失败:', error)
    // 如果Puppeteer失败，返回HTML作为备用
    const html = generateHTMLReport(reportData)
    return Buffer.from(html, 'utf-8')
  }
}

// 生成Excel报告
async function generateExcelReport(reportData: any): Promise<Buffer> {
  try {
    const ExcelJS = require('exceljs')
    const { reportInfo, summary, records } = reportData
    
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Attendance Report')
    
    // 设置列宽
    worksheet.columns = [
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'ID', key: 'id', width: 15 },
      { header: 'Center', key: 'center', width: 15 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Check-in', key: 'checkIn', width: 12 },
      { header: 'Check-out', key: 'checkOut', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Notes', key: 'notes', width: 20 }
    ]
    
    // 添加标题
    worksheet.addRow(['PJPC Education Management System - Attendance Report'])
    worksheet.addRow([`Report Period: ${reportInfo.period}`])
    worksheet.addRow([`Center: ${reportInfo.center}`])
    worksheet.addRow([`Generated: ${reportInfo.generatedAt}`])
    worksheet.addRow([])
    
    // 添加统计信息
    worksheet.addRow(['Summary Statistics'])
    worksheet.addRow(['Total Records', summary.totalRecords])
    worksheet.addRow(['Student Records', summary.studentRecords])
    worksheet.addRow(['Teacher Records', summary.teacherRecords])
    worksheet.addRow(['Present Records', summary.presentRecords])
    worksheet.addRow(['Absent Records', summary.absentRecords])
    worksheet.addRow(['Overall Attendance Rate', `${summary.overallAttendanceRate}%`])
    worksheet.addRow([])
    
    // 添加表头
    worksheet.addRow(['Type', 'Name', 'ID', 'Center', 'Date', 'Check-in', 'Check-out', 'Status', 'Notes'])
    
    // 添加数据行
    records.forEach((record: any) => {
      worksheet.addRow([
        record.type === 'student' ? 'Student' : 'Teacher',
        record.name || '',
        record.id_field || '',
        record.center || '',
        record.date ? format(new Date(record.date), 'yyyy-MM-dd') : '',
        record.check_in ? format(parseISO(record.check_in), 'HH:mm:ss') : '',
        record.check_out ? format(parseISO(record.check_out), 'HH:mm:ss') : '',
        record.status || '',
        record.notes || ''
      ])
    })
    
    // 设置样式
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, size: 16 }
    headerRow.alignment = { horizontal: 'center' }
    
    const summaryRow = worksheet.getRow(7)
    summaryRow.font = { bold: true, size: 12 }
    
    const tableHeaderRow = worksheet.getRow(15)
    tableHeaderRow.font = { bold: true }
    tableHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    }
    tableHeaderRow.font = { color: { argb: 'FFFFFFFF' }, bold: true }
    
    // 生成Excel文件
    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  } catch (error) {
    console.error('Excel生成失败:', error)
    // 如果ExcelJS失败，返回CSV作为备用
    const csv = generateCSVReport(reportData)
    return Buffer.from(csv, 'utf-8')
  }
}

// 生成CSV报告
function generateCSVReport(reportData: any): string {
  const { reportInfo, summary, records } = reportData
  
  // 使用简单的CSV格式，避免复杂字符
  let csv = ''
  
  // 报告头部信息
  csv += `Attendance Report\n`
  csv += `Period,${reportInfo.period}\n`
  csv += `Center,${reportInfo.center}\n`
  csv += `Generated,${reportInfo.generatedAt}\n`
  csv += `System,${reportInfo.generatedBy}\n`
  csv += `\n`
  
  // 总体统计
  csv += `Summary\n`
  csv += `Total Records,${summary.totalRecords}\n`
  csv += `Student Records,${summary.studentRecords}\n`
  csv += `Teacher Records,${summary.teacherRecords}\n`
  csv += `Present Records,${summary.presentRecords}\n`
  csv += `Absent Records,${summary.absentRecords}\n`
  csv += `Late Records,${summary.lateRecords}\n`
  csv += `Early Leave Records,${summary.earlyLeaveRecords}\n`
  csv += `Overall Attendance Rate,${summary.overallAttendanceRate}%\n`
  csv += `Average Check-in Time,${summary.averageCheckInTime}\n`
  csv += `Average Check-out Time,${summary.averageCheckOutTime}\n`
  csv += `\n`
  
  // 详细记录
  csv += `Detailed Records\n`
  csv += `Type,Name,ID,Center,Date,Check-in,Check-out,Status,Notes\n`
  
  records.forEach((record: any) => {
    csv += `${record.type === 'student' ? 'Student' : 'Teacher'},`
    csv += `${record.name || ''},`
    csv += `${record.id_field || ''},`
    csv += `${record.center || ''},`
    csv += `${record.date || ''},`
    csv += `${record.check_in ? format(parseISO(record.check_in), 'yyyy-MM-dd HH:mm:ss') : ''},`
    csv += `${record.check_out ? format(parseISO(record.check_out), 'yyyy-MM-dd HH:mm:ss') : ''},`
    csv += `${record.status || ''},`
    csv += `${record.notes || ''}\n`
  })
  
  return csv
}

// 生成企业级HTML报告
function generateHTMLReport(reportData: any): string {
  const { reportInfo, summary, dailyStats, centerStats, personStats, records } = reportData
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reportInfo.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', 'Microsoft YaHei', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8fafc;
        }
        
        .report-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border-radius: 12px;
            overflow: hidden;
        }
        
        /* 企业级头部设计 */
        .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #8b5cf6 100%);
            color: white;
            padding: 40px 30px;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
        }
        
        .header-content {
            position: relative;
            z-index: 1;
            text-align: center;
        }
        
        .header h1 {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            letter-spacing: -0.5px;
        }
        
        .header .subtitle {
            font-size: 18px;
            opacity: 0.95;
            font-weight: 300;
            margin-bottom: 20px;
        }
        
        .header .version {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            letter-spacing: 0.5px;
        }
        /* 报告信息区域 */
        .report-info {
            padding: 30px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-bottom: 1px solid #e2e8f0;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 24px;
        }
        
        .info-item {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            border-left: 4px solid #3b82f6;
            transition: transform 0.2s ease;
        }
        
        .info-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .info-label {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .info-value {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 4px;
        }
        
        .info-description {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
        }
        /* 统计区域 */
        .summary-section {
            padding: 40px 30px;
            background: white;
        }
        
        .section-title {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 3px solid #3b82f6;
            position: relative;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: -3px;
            left: 0;
            width: 60px;
            height: 3px;
            background: #8b5cf6;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 24px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            padding: 24px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            border: 1px solid #e2e8f0;
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        
        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        }
        
        .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        
        .stat-number {
            font-size: 36px;
            font-weight: 800;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 8px;
            line-height: 1;
        }
        
        .stat-label {
            font-size: 13px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .stat-description {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 4px;
        }
        /* 表格样式 */
        .table-container {
            margin-top: 30px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
        }
        
        th {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            color: white;
            font-weight: 700;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 16px 20px;
            text-align: left;
            position: relative;
        }
        
        th::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        }
        
        td {
            padding: 16px 20px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
            color: #475569;
            transition: background-color 0.2s ease;
        }
        
        tr:hover td {
            background-color: #f8fafc;
        }
        
        tr:last-child td {
            border-bottom: none;
        }
        
        .status-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: inline-block;
        }
        
        .status-present {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
        }
        
        .status-absent {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
        }
        
        .status-late {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
        }
        
        .status-early-leave {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
        }
        
        .status-completed {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white;
            box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
        }
        /* 页脚样式 */
        .footer {
            padding: 30px;
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            color: white;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .footer::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, #3b82f6, transparent);
        }
        
        .footer p {
            margin: 8px 0;
            font-size: 14px;
            opacity: 0.9;
        }
        
        .footer .copyright {
            font-size: 12px;
            opacity: 0.7;
            margin-top: 16px;
        }
        
        /* 图表容器 */
        .chart-container {
            margin: 30px 0;
            padding: 24px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-radius: 12px;
            border: 1px solid #e2e8f0;
        }
        
        /* 响应式设计 */
        @media (max-width: 768px) {
            .header h1 { font-size: 28px; }
            .header .subtitle { font-size: 16px; }
            .stats-grid { grid-template-columns: 1fr; }
            .info-grid { grid-template-columns: 1fr; }
            .table-container { overflow-x: auto; }
        }
        
        /* 打印样式 */
        @media print {
            body { 
                background: white; 
                font-size: 12px;
            }
            .report-container { 
                box-shadow: none; 
                border-radius: 0;
            }
            .header {
                background: #1e293b !important;
                -webkit-print-color-adjust: exact;
            }
            .stat-card {
                break-inside: avoid;
            }
            .table-container {
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <!-- 企业级报告头部 -->
        <div class="header">
            <div class="header-content">
                <h1>${reportInfo.title}</h1>
                <div class="subtitle">PJPC Education Management System - Professional Attendance Solution</div>
                <div class="version">v${reportInfo.version}</div>
            </div>
        </div>
        
        <!-- 报告信息 -->
        <div class="report-info">
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Report Period</span>
                    <span class="info-value">${reportInfo.period}</span>
                    <span class="info-description">Data collection timeframe</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Center</span>
                    <span class="info-value">${reportInfo.center}</span>
                    <span class="info-description">Educational institution</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Generated</span>
                    <span class="info-value">${reportInfo.generatedAt}</span>
                    <span class="info-description">Report creation time</span>
                </div>
                <div class="info-item">
                    <span class="info-label">System</span>
                    <span class="info-value">${reportInfo.generatedBy}</span>
                    <span class="info-description">Management platform</span>
                </div>
            </div>
        </div>
        
        <!-- 企业级统计概览 -->
        <div class="summary-section">
            <h2 class="section-title">Executive Summary</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${summary.totalRecords}</div>
                    <div class="stat-label">Total Records</div>
                    <div class="stat-description">All attendance entries</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${summary.studentRecords}</div>
                    <div class="stat-label">Student Records</div>
                    <div class="stat-description">Student attendance data</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${summary.teacherRecords}</div>
                    <div class="stat-label">Teacher Records</div>
                    <div class="stat-description">Faculty attendance data</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${summary.overallAttendanceRate}%</div>
                    <div class="stat-label">Attendance Rate</div>
                    <div class="stat-description">Overall performance</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${summary.presentRecords}</div>
                    <div class="stat-label">Present</div>
                    <div class="stat-description">Successful check-ins</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${summary.absentRecords}</div>
                    <div class="stat-label">Absent</div>
                    <div class="stat-description">Missed sessions</div>
                </div>
            </div>
        </div>
        
        <!-- 企业级详细记录表格 -->
        <div class="summary-section">
            <h2 class="section-title">Detailed Attendance Records</h2>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Name</th>
                            <th>ID</th>
                            <th>Center</th>
                            <th>Date</th>
                            <th>Check-in</th>
                            <th>Check-out</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map((record: any) => `
                            <tr>
                                <td><strong>${record.type === 'student' ? 'Student' : 'Teacher'}</strong></td>
                                <td>${record.name || '-'}</td>
                                <td><code>${record.id_field || '-'}</code></td>
                                <td>${record.center || '-'}</td>
                                <td>${record.date ? format(new Date(record.date), 'MMM dd, yyyy') : '-'}</td>
                                <td>${record.check_in ? format(parseISO(record.check_in), 'HH:mm:ss') : '-'}</td>
                                <td>${record.check_out ? format(parseISO(record.check_out), 'HH:mm:ss') : '-'}</td>
                                <td>
                                    <span class="status-badge status-${record.status}">
                                        ${record.status === 'present' ? 'Present' :
                                         record.status === 'absent' ? 'Absent' :
                                         record.status === 'late' ? 'Late' :
                                         record.status === 'early_leave' ? 'Early Leave' :
                                         record.status === 'completed' ? 'Completed' : record.status}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- 企业级页脚 -->
        <div class="footer">
            <p>This report was automatically generated by PJPC Education Management System</p>
            <p>Generated on: ${reportInfo.generatedAt}</p>
            <p class="copyright">© 2025 PJPC Education Management System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `
}

