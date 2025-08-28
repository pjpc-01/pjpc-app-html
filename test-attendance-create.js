const PocketBase = require('pocketbase').default

async function testAttendanceCreate() {
  try {
    const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://pjpc.tplinkdns.com:8090'
    console.log('🔗 连接到PocketBase:', pbUrl)
    
    const pb = new PocketBase(pbUrl)
    
    // 测试数据
    const testStudentAttendance = {
      studentId: 'test123',
      studentName: '测试学生',
      centerId: 'wx01',
      centerName: 'WX 01',
      branchId: 'wx01',
      branchName: 'WX 01',
      type: 'check-in',
      timestamp: new Date().toISOString(),
      status: 'success',
      deviceId: 'test-device',
      deviceName: '测试设备',
      method: 'manual'
    }
    
    const testTeacherAttendance = {
      teacherId: 'teacher123',
      teacherName: '测试老师',
      centerId: 'wx01',
      centerName: 'WX 01',
      branchId: 'wx01',
      branchName: 'WX 01',
      type: 'check-in',
      timestamp: new Date().toISOString(),
      status: 'success',
      deviceId: 'test-device',
      deviceName: '测试设备',
      method: 'manual'
    }
    
    console.log('\n📚 测试创建学生考勤记录...')
    try {
      const studentRecord = await pb.collection('student_attendance').create(testStudentAttendance)
      console.log('✅ 学生考勤记录创建成功:', studentRecord.id)
    } catch (error) {
      console.log('❌ 学生考勤记录创建失败:')
      console.log('   错误信息:', error.message)
      if (error.data && error.data.data) {
        console.log('   字段错误详情:')
        Object.keys(error.data.data).forEach(field => {
          console.log(`     - ${field}: ${error.data.data[field].message}`)
        })
      }
    }
    
    console.log('\n👨‍🏫 测试创建老师考勤记录...')
    try {
      const teacherRecord = await pb.collection('teacher_attendance').create(testTeacherAttendance)
      console.log('✅ 老师考勤记录创建成功:', teacherRecord.id)
    } catch (error) {
      console.log('❌ 老师考勤记录创建失败:')
      console.log('   错误信息:', error.message)
      if (error.data && error.data.data) {
        console.log('   字段错误详情:')
        Object.keys(error.data.data).forEach(field => {
          console.log(`     - ${field}: ${error.data.data[field].message}`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    if (error.status) {
      console.error('状态码:', error.status)
    }
  }
}

// 运行测试
testAttendanceCreate()
