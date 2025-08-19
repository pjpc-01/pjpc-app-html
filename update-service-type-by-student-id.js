import PocketBase from 'pocketbase';

async function updateServiceTypeByStudentId() {
  const pb = new PocketBase('http://localhost:8090');
  
  try {
    // 登录管理员账户
    await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!');
    console.log('✅ 管理员登录成功');
    
    // 获取所有学生记录
    const students = await pb.collection('students').getList(1, 1000, {
      sort: 'student_name',
      $autoCancel: false
    });
    
    console.log(`✅ 获取到 ${students.items.length} 个学生记录`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const student of students.items) {
      const studentId = student.student_id;
      
      if (!studentId) {
        console.log(`⚠️ 跳过学生 ${student.student_name} - 没有学号`);
        skippedCount++;
        continue;
      }
      
      // 根据学号前缀确定服务类型
      let serviceType = null;
      if (studentId.startsWith('T')) {
        serviceType = 'tuition';
      } else if (studentId.startsWith('B') || studentId.startsWith('G')) {
        serviceType = 'afterschool';
      } else {
        console.log(`⚠️ 跳过学生 ${student.student_name} - 学号 ${studentId} 不符合规则`);
        skippedCount++;
        continue;
      }
      
      // 检查当前服务类型是否已经正确
      if (student.serviceType === serviceType) {
        console.log(`✅ 学生 ${student.student_name} (${studentId}) 服务类型已正确: ${serviceType}`);
        skippedCount++;
        continue;
      }
      
      // 更新服务类型
      try {
        await pb.collection('students').update(student.id, {
          serviceType: serviceType
        });
        
        console.log(`✅ 更新学生 ${student.student_name} (${studentId}): ${student.serviceType || 'undefined'} → ${serviceType}`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ 更新学生 ${student.student_name} 失败:`, error.message);
      }
    }
    
    console.log('\n📊 更新完成统计:');
    console.log(`- 成功更新: ${updatedCount} 个学生`);
    console.log(`- 跳过/已正确: ${skippedCount} 个学生`);
    console.log(`- 总计处理: ${students.items.length} 个学生`);
    
  } catch (error) {
    console.error('❌ 批量更新失败:', error);
    console.error('错误详情:', error.message);
  }
}

// 运行脚本
updateServiceTypeByStudentId();
