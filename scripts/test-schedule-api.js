#!/usr/bin/env node

/**
 * 排班系统API测试脚本
 * 用于验证PocketBase集合与API的兼容性
 */

const PocketBase = require('pocketbase').default;

// 配置
const PB_URL = 'http://pjpc.tplinkdns.com:8090';
const ADMIN_EMAIL = 'pjpcemerlang@gmail.com';
const ADMIN_PASSWORD = '0122270775Sw!';

const pb = new PocketBase(PB_URL);

// 测试数据
const testData = {
  schedule: {
    employee_id: 'test-teacher-001',
    employee_name: '测试老师',
    employee_type: 'fulltime',
    date: '2024-01-15',
    start_time: '09:00',
    end_time: '17:00',
    center: '总校',
    room: 'A101',
    status: 'scheduled',
    is_overtime: false,
    hourly_rate: 25.00,
    total_hours: 8,
    notes: 'API测试排班'
  },
  template: {
    name: '测试模板',
    type: 'fulltime',
    work_days: [1, 2, 3, 4, 5],
    start_time: '09:00',
    end_time: '17:00',
    break_duration: 60,
    max_hours_per_week: 40,
    color: '#3b82f6',
    description: 'API测试模板',
    requirements: ['教学经验', '相关学历'],
    is_active: true
  },
  class: {
    name: '测试课程',
    subject: '数学',
    grade: '四年级',
    center: '总校',
    room: 'A101',
    start_time: '09:00',
    end_time: '10:00',
    max_students: 15,
    current_students: 0,
    status: 'scheduled',
    color: '#3b82f6',
    work_days: [1, 2, 3, 4, 5],
    weekend_enabled: false,
    time_slot: 'morning',
    notes: 'API测试课程',
    is_active: true
  }
};

// 测试函数
async function testCollections() {
  console.log('🚀 开始测试排班系统集合...\n');

  try {
    // 1. 管理员认证
    console.log('1️⃣ 管理员认证...');
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ 管理员认证成功\n');

    // 2. 测试 schedules 集合
    console.log('2️⃣ 测试 schedules 集合...');
    try {
      // 创建排班记录
      const schedule = await pb.collection('schedules').create(testData.schedule);
      console.log('✅ 创建排班记录成功:', schedule.id);

      // 查询排班记录
      const schedules = await pb.collection('schedules').getList(1, 10, {
        filter: `employee_id = "${testData.schedule.employee_id}"`
      });
      console.log('✅ 查询排班记录成功:', schedules.items.length, '条');

      // 更新排班记录
      const updatedSchedule = await pb.collection('schedules').update(schedule.id, {
        status: 'confirmed',
        notes: 'API测试 - 已确认'
      });
      console.log('✅ 更新排班记录成功');

      // 删除测试数据
      await pb.collection('schedules').delete(schedule.id);
      console.log('✅ 删除排班记录成功\n');
    } catch (error) {
      console.error('❌ schedules 集合测试失败:', error.message);
    }

    // 3. 测试 schedule_templates 集合
    console.log('3️⃣ 测试 schedule_templates 集合...');
    try {
      // 创建排班模板
      const template = await pb.collection('schedule_templates').create(testData.template);
      console.log('✅ 创建排班模板成功:', template.id);

      // 查询排班模板
      const templates = await pb.collection('schedule_templates').getList(1, 10, {
        filter: `type = "${testData.template.type}"`
      });
      console.log('✅ 查询排班模板成功:', templates.items.length, '条');

      // 更新排班模板
      const updatedTemplate = await pb.collection('schedule_templates').update(template.id, {
        description: 'API测试模板 - 已更新'
      });
      console.log('✅ 更新排班模板成功');

      // 删除测试数据
      await pb.collection('schedule_templates').delete(template.id);
      console.log('✅ 删除排班模板成功\n');
    } catch (error) {
      console.error('❌ schedule_templates 集合测试失败:', error.message);
    }

    // 4. 测试 classes 集合
    console.log('4️⃣ 测试 classes 集合...');
    try {
      // 创建课程
      const classRecord = await pb.collection('classes').create(testData.class);
      console.log('✅ 创建课程成功:', classRecord.id);

      // 查询课程
      const classes = await pb.collection('classes').getList(1, 10, {
        filter: `subject = "${testData.class.subject}"`
      });
      console.log('✅ 查询课程成功:', classes.items.length, '条');

      // 更新课程
      const updatedClass = await pb.collection('classes').update(classRecord.id, {
        notes: 'API测试课程 - 已更新'
      });
      console.log('✅ 更新课程成功');

      // 删除测试数据
      await pb.collection('classes').delete(classRecord.id);
      console.log('✅ 删除课程成功\n');
    } catch (error) {
      console.error('❌ classes 集合测试失败:', error.message);
    }

    // 5. 测试 schedule_logs 集合
    console.log('5️⃣ 测试 schedule_logs 集合...');
    try {
      // 创建日志记录
      const log = await pb.collection('schedule_logs').create({
        action: 'create',
        user_id: 'test-user-001',
        user_name: '测试用户',
        user_role: 'admin',
        details: { test: true },
        status: 'success'
      });
      console.log('✅ 创建日志记录成功:', log.id);

      // 查询日志记录
      const logs = await pb.collection('schedule_logs').getList(1, 10, {
        filter: `user_id = "test-user-001"`
      });
      console.log('✅ 查询日志记录成功:', logs.items.length, '条');

      // 删除测试数据
      await pb.collection('schedule_logs').delete(log.id);
      console.log('✅ 删除日志记录成功\n');
    } catch (error) {
      console.error('❌ schedule_logs 集合测试失败:', error.message);
    }

    console.log('🎉 所有集合测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testCollections().catch(console.error);
}

module.exports = { testCollections };
