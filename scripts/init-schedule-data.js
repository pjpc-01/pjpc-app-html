#!/usr/bin/env node

/**
 * 排班系统默认数据初始化脚本
 * 创建必要的默认排班模板和测试数据
 */

const PocketBase = require('pocketbase').default;

// 配置
const PB_URL = 'http://pjpc.tplinkdns.com:8090';
const ADMIN_EMAIL = 'pjpcemerlang@gmail.com';
const ADMIN_PASSWORD = '0122270775Sw!';

const pb = new PocketBase(PB_URL);

// 默认排班模板数据
const defaultTemplates = [
  {
    name: '管理层标准班',
    type: 'fulltime',
    work_days: [1, 2, 3, 4, 5], // 周一到周五
    start_time: '08:00',
    end_time: '18:00',
    break_duration: 60,
    max_hours_per_week: 40,
    color: '#3b82f6',
    description: '管理层全职工作时间',
    requirements: ['管理经验', '教育背景'],
    is_active: true
  },
  {
    name: '全职教师班',
    type: 'fulltime',
    work_days: [1, 2, 3, 4, 5],
    start_time: '09:00',
    end_time: '17:00',
    break_duration: 60,
    max_hours_per_week: 40,
    color: '#10b981',
    description: '全职教师标准工作时间',
    requirements: ['教学经验', '相关学历'],
    is_active: true
  },
  {
    name: '兼职下午班',
    type: 'parttime',
    work_days: [1, 2, 3, 4, 5],
    start_time: '14:00',
    end_time: '18:00',
    break_duration: 0,
    max_hours_per_week: 20,
    color: '#f59e0b',
    description: '兼职教师下午时段',
    requirements: ['教学能力', '时间灵活'],
    is_active: true
  },
  {
    name: '仅教书时段',
    type: 'teaching_only',
    work_days: [1, 2, 3, 4, 5, 6, 0], // 全周
    start_time: '16:00',
    end_time: '19:00',
    break_duration: 0,
    max_hours_per_week: 15,
    color: '#8b5cf6',
    description: '外聘老师教学时段',
    requirements: ['专业能力', '科目专长'],
    is_active: true
  }
];

// 默认课程数据
const defaultClasses = [
  {
    name: '四年级数学',
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
    notes: '四年级数学基础课程',
    is_active: true
  },
  {
    name: '三年级英文',
    subject: '英文',
    grade: '三年级',
    center: '总校',
    room: 'A102',
    start_time: '14:00',
    end_time: '15:00',
    max_students: 12,
    current_students: 0,
    status: 'scheduled',
    color: '#10b981',
    work_days: [1, 2, 3, 4, 5],
    weekend_enabled: false,
    time_slot: 'afternoon',
    notes: '三年级英文基础课程',
    is_active: true
  },
  {
    name: '五年级科学',
    subject: '科学',
    grade: '五年级',
    center: '总校',
    room: 'A103',
    start_time: '16:00',
    end_time: '17:00',
    max_students: 10,
    current_students: 0,
    status: 'scheduled',
    color: '#8b5cf6',
    work_days: [1, 2, 3, 4, 5],
    weekend_enabled: false,
    time_slot: 'evening',
    notes: '五年级科学实验课程',
    is_active: true
  }
];

async function initDefaultData() {
  console.log('🚀 开始初始化排班系统默认数据...\n');

  try {
    // 管理员认证
    console.log('1️⃣ 管理员认证...');
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ 管理员认证成功\n');

    // 初始化排班模板
    console.log('2️⃣ 初始化排班模板...');
    for (const templateData of defaultTemplates) {
      try {
        // 检查是否已存在
        const existing = await pb.collection('schedule_templates').getList(1, 1, {
          filter: `name = "${templateData.name}"`
        });

        if (existing.items.length === 0) {
          const template = await pb.collection('schedule_templates').create(templateData);
          console.log(`✅ 创建模板: ${templateData.name} (${template.id})`);
        } else {
          console.log(`⏭️ 模板已存在: ${templateData.name}`);
        }
      } catch (error) {
        console.error(`❌ 创建模板失败 ${templateData.name}:`, error.message);
      }
    }
    console.log('');

    // 初始化课程数据
    console.log('3️⃣ 初始化课程数据...');
    for (const classData of defaultClasses) {
      try {
        // 检查是否已存在
        const existing = await pb.collection('classes').getList(1, 1, {
          filter: `name = "${classData.name}" && center = "${classData.center}"`
        });

        if (existing.items.length === 0) {
          const classRecord = await pb.collection('classes').create(classData);
          console.log(`✅ 创建课程: ${classData.name} (${classRecord.id})`);
        } else {
          console.log(`⏭️ 课程已存在: ${classData.name}`);
        }
      } catch (error) {
        console.error(`❌ 创建课程失败 ${classData.name}:`, error.message);
      }
    }
    console.log('');

    // 验证数据
    console.log('4️⃣ 验证初始化数据...');
    
    const templates = await pb.collection('schedule_templates').getList(1, 100);
    console.log(`✅ 排班模板数量: ${templates.items.length}`);

    const classes = await pb.collection('classes').getList(1, 100);
    console.log(`✅ 课程数量: ${classes.items.length}`);

    console.log('\n🎉 默认数据初始化完成！');
    console.log('\n📋 可用的排班模板:');
    templates.items.forEach(t => {
      console.log(`  - ${t.name} (${t.type}) - ${t.start_time} 到 ${t.end_time}`);
    });

    console.log('\n📚 可用的课程:');
    classes.items.forEach(c => {
      console.log(`  - ${c.name} (${c.subject}) - ${c.start_time} 到 ${c.end_time}`);
    });

  } catch (error) {
    console.error('❌ 初始化过程中发生错误:', error.message);
    process.exit(1);
  }
}

// 运行初始化
if (require.main === module) {
  initDefaultData().catch(console.error);
}

module.exports = { initDefaultData };
