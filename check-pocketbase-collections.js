import PocketBase from 'pocketbase';

async function checkPocketBase() {
  try {
    const pb = new PocketBase('http://pjpc.tplinkdns.com:8090');
    
    console.log('🔍 检查PocketBase连接...');
    
    // 尝试管理员认证
    try {
      const authResult = await pb.admins.authWithPassword('pjpcemerlang@gmail.com', '0122270775Sw!');
      console.log('✅ 管理员认证成功');
    } catch (authError) {
      console.error('❌ 管理员认证失败:', authError);
      return;
    }
    
    // 获取所有集合
    console.log('\n📋 获取所有集合...');
    const collections = await pb.collections.getFullList();
    console.log('可用集合:', collections.map(c => c.name));
    
    // 检查students集合
    if (collections.find(c => c.name === 'students')) {
      console.log('\n👥 检查students集合...');
      try {
        const students = await pb.collection('students').getList(1, 10);
        console.log(`✅ 找到 ${students.items.length} 个学生记录`);
        
        if (students.items.length > 0) {
          console.log('\n📊 学生数据示例:');
          students.items.slice(0, 3).forEach((student, index) => {
            console.log(`学生 ${index + 1}:`, {
              id: student.id,
              student_id: student.student_id,
              student_name: student.student_name,
              center: student.center,
              status: student.status
            });
          });
          
          // 统计中心分布
          const centerCounts = {};
          students.items.forEach(student => {
            const center = student.center || '未指定';
            centerCounts[center] = (centerCounts[center] || 0) + 1;
          });
          
          console.log('\n🏢 中心分布统计:');
          Object.entries(centerCounts).forEach(([center, count]) => {
            console.log(`${center}: ${count} 人`);
          });
        }
      } catch (error) {
        console.error('❌ 访问students集合失败:', error.message);
      }
    } else {
      console.log('❌ students集合不存在');
    }
    
    // 检查student_attendance集合
    if (collections.find(c => c.name === 'student_attendance')) {
      console.log('\n📅 检查student_attendance集合...');
      try {
        const attendance = await pb.collection('student_attendance').getList(1, 10);
        console.log(`✅ 找到 ${attendance.items.length} 条考勤记录`);
        
        if (attendance.items.length > 0) {
          console.log('\n📊 考勤数据示例:');
          attendance.items.slice(0, 3).forEach((record, index) => {
            console.log(`记录 ${index + 1}:`, {
              id: record.id,
              student_id: record.student_id,
              student_name: record.student_name,
              branch_code: record.branch_code,
              branch_name: record.branch_name,
              date: record.date,
              status: record.status
            });
          });
        }
      } catch (error) {
        console.error('❌ 访问student_attendance集合失败:', error.message);
      }
    } else {
      console.log('❌ student_attendance集合不存在');
    }
    
  } catch (error) {
    console.error('❌ 检查PocketBase失败:', error.message);
  }
}

checkPocketBase();
