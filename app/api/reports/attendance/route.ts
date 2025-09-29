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
      format = 'pdf' // 'pdf', 'excel', 'csv'
    } = body

    console.log('📊 生成企业级考勤报告:', { reportType, startDate, endDate, center, includeStudents, includeTeachers, format })

    const pb = await getPocketBase()
    
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
    }

    // 获取教师考勤数据
    let teacherRecords = []
    if (includeTeachers) {
      const teacherParams = new URLSearchParams()
      if (queryStartDate) teacherParams.append('startDate', queryStartDate)
      if (queryEndDate) teacherParams.append('endDate', queryEndDate)
      if (center) teacherParams.append('center', center)
      teacherParams.append('type', 'teacher')

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

    switch (format) {
      case 'pdf':
        reportContent = await generatePDFReport(reportData)
        contentType = 'application/pdf'
        filename = `考勤报告_${reportData.period}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`
        break
      case 'excel':
        reportContent = await generateExcelReport(reportData)
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        filename = `考勤报告_${reportData.period}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`
        break
      case 'csv':
        reportContent = generateCSVReport(reportData)
        contentType = 'text/csv; charset=utf-8'
        filename = `考勤报告_${reportData.period}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
        break
      default:
        reportContent = generateCSVReport(reportData)
        contentType = 'text/csv; charset=utf-8'
        filename = `考勤报告_${reportData.period}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
    }

    return new NextResponse(reportContent, {
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
  const dailyStats = {}
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
  const centerStats = {}
  records.forEach(record => {
    const centerName = record.center || '未知中心'
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
  const personStats = {}
  records.forEach(record => {
    const personKey = `${record.type}_${record.id_field}`
    if (!personStats[personKey]) {
      personStats[personKey] = {
        name: record.name,
        id: record.id_field,
        type: record.type === 'student' ? '学生' : '教师',
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
    : '无数据'
  
  const averageCheckOutTime = checkOutTimes.length > 0 
    ? format(new Date(0, 0, 0, Math.floor(checkOutTimes.reduce((a, b) => a + b, 0) / checkOutTimes.length / 60), 
      Math.floor((checkOutTimes.reduce((a, b) => a + b, 0) / checkOutTimes.length) % 60)), 'HH:mm')
    : '无数据'
  
  return {
    // 报告基本信息
    reportInfo: {
      title: '考勤管理报告',
      period: `${startDate} 至 ${endDate}`,
      center: center || '全部中心',
      generatedAt: format(generatedAt, 'yyyy年MM月dd日 HH:mm:ss', { locale: zhCN }),
      generatedBy: 'PJPC教育管理系统',
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
  // 这里使用HTML模板生成PDF
  const html = generateHTMLReport(reportData)
  
  // 在实际项目中，您可以使用 puppeteer 或 jsPDF 来生成PDF
  // 这里返回HTML的Buffer作为示例
  return Buffer.from(html, 'utf-8')
}

// 生成Excel报告
async function generateExcelReport(reportData: any): Promise<Buffer> {
  // 这里使用ExcelJS库生成Excel文件
  // 在实际项目中，您需要安装 exceljs 库
  const csv = generateCSVReport(reportData)
  return Buffer.from(csv, 'utf-8')
}

// 生成CSV报告
function generateCSVReport(reportData: any): string {
  const { reportInfo, summary, records } = reportData
  
  let csv = ''
  
  // 报告头部信息
  csv += `考勤管理报告\n`
  csv += `报告期间,${reportInfo.period}\n`
  csv += `中心,${reportInfo.center}\n`
  csv += `生成时间,${reportInfo.generatedAt}\n`
  csv += `生成系统,${reportInfo.generatedBy}\n`
  csv += `\n`
  
  // 总体统计
  csv += `总体统计\n`
  csv += `总记录数,${summary.totalRecords}\n`
  csv += `学生记录,${summary.studentRecords}\n`
  csv += `教师记录,${summary.teacherRecords}\n`
  csv += `出勤记录,${summary.presentRecords}\n`
  csv += `缺席记录,${summary.absentRecords}\n`
  csv += `迟到记录,${summary.lateRecords}\n`
  csv += `早退记录,${summary.earlyLeaveRecords}\n`
  csv += `整体出勤率,${summary.overallAttendanceRate}%\n`
  csv += `平均签到时间,${summary.averageCheckInTime}\n`
  csv += `平均签退时间,${summary.averageCheckOutTime}\n`
  csv += `\n`
  
  // 详细记录
  csv += `详细考勤记录\n`
  csv += `类型,姓名,ID,中心,日期,签到时间,签退时间,状态,备注\n`
  
  records.forEach(record => {
    csv += `${record.type === 'student' ? '学生' : '教师'},`
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

// 生成HTML报告
function generateHTMLReport(reportData: any): string {
  const { reportInfo, summary, dailyStats, centerStats, personStats, records } = reportData
  
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reportInfo.title}</title>
    <style>
        body {
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .report-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 300;
        }
        .header .subtitle {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .report-info {
            padding: 20px 30px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .info-label {
            font-weight: 600;
            color: #495057;
        }
        .info-value {
            color: #6c757d;
        }
        .summary-section {
            padding: 30px;
        }
        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #343a40;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #007bff;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #007bff;
        }
        .stat-number {
            font-size: 32px;
            font-weight: 700;
            color: #007bff;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 14px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .table-container {
            margin-top: 20px;
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #495057;
        }
        .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }
        .status-present {
            background-color: #d4edda;
            color: #155724;
        }
        .status-absent {
            background-color: #f8d7da;
            color: #721c24;
        }
        .status-late {
            background-color: #fff3cd;
            color: #856404;
        }
        .status-early-leave {
            background-color: #d1ecf1;
            color: #0c5460;
        }
        .footer {
            padding: 20px 30px;
            background: #f8f9fa;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        .chart-container {
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        @media print {
            body { background: white; }
            .report-container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <!-- 报告头部 -->
        <div class="header">
            <h1>${reportInfo.title}</h1>
            <div class="subtitle">PJPC教育管理系统 - 专业考勤管理解决方案</div>
        </div>
        
        <!-- 报告信息 -->
        <div class="report-info">
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">报告期间</span>
                    <span class="info-value">${reportInfo.period}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">中心</span>
                    <span class="info-value">${reportInfo.center}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">生成时间</span>
                    <span class="info-value">${reportInfo.generatedAt}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">系统版本</span>
                    <span class="info-value">${reportInfo.version}</span>
                </div>
            </div>
        </div>
        
        <!-- 总体统计 -->
        <div class="summary-section">
            <h2 class="section-title">总体统计</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${summary.totalRecords}</div>
                    <div class="stat-label">总记录数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${summary.studentRecords}</div>
                    <div class="stat-label">学生记录</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${summary.teacherRecords}</div>
                    <div class="stat-label">教师记录</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${summary.overallAttendanceRate}%</div>
                    <div class="stat-label">整体出勤率</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${summary.presentRecords}</div>
                    <div class="stat-label">出勤记录</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${summary.absentRecords}</div>
                    <div class="stat-label">缺席记录</div>
                </div>
            </div>
        </div>
        
        <!-- 详细记录表格 -->
        <div class="summary-section">
            <h2 class="section-title">详细考勤记录</h2>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>类型</th>
                            <th>姓名</th>
                            <th>ID</th>
                            <th>中心</th>
                            <th>日期</th>
                            <th>签到时间</th>
                            <th>签退时间</th>
                            <th>状态</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map(record => `
                            <tr>
                                <td>${record.type === 'student' ? '学生' : '教师'}</td>
                                <td>${record.name || ''}</td>
                                <td>${record.id_field || ''}</td>
                                <td>${record.center || ''}</td>
                                <td>${record.date || ''}</td>
                                <td>${record.check_in ? format(parseISO(record.check_in), 'HH:mm:ss') : '-'}</td>
                                <td>${record.check_out ? format(parseISO(record.check_out), 'HH:mm:ss') : '-'}</td>
                                <td>
                                    <span class="status-badge status-${record.status}">
                                        ${record.status === 'present' ? '已签到' :
                                         record.status === 'absent' ? '缺席' :
                                         record.status === 'late' ? '迟到' :
                                         record.status === 'early_leave' ? '早退' :
                                         record.status === 'completed' ? '已完成' : record.status}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- 页脚 -->
        <div class="footer">
            <p>本报告由PJPC教育管理系统自动生成 | 生成时间: ${reportInfo.generatedAt}</p>
            <p>© 2025 PJPC教育管理系统. 保留所有权利.</p>
        </div>
    </div>
</body>
</html>
  `
}

