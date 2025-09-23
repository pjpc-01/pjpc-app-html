#!/usr/bin/env node

/**
 * API兼容性检查脚本
 * 验证API代码与PocketBase集合的字段匹配
 */

const fs = require('fs');
const path = require('path');

// 读取集合定义
function loadCollectionSchema(collectionName) {
  const filePath = path.join(__dirname, '..', 'pocketbase_collections', `${collectionName}.json`);
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

// 检查字段匹配
function checkFieldCompatibility() {
  console.log('🔍 检查API与集合字段兼容性...\n');

  // 加载集合定义
  const schedulesSchema = loadCollectionSchema('schedules');
  const templatesSchema = loadCollectionSchema('schedule_templates');
  const classesSchema = loadCollectionSchema('classes');
  const logsSchema = loadCollectionSchema('schedule_logs');

  // API中使用的字段
  const apiFields = {
    schedules: [
      'employee_id', 'employee_name', 'employee_type', 'date', 'start_time', 'end_time',
      'class_id', 'class_name', 'subject', 'grade', 'center', 'room', 'status',
      'is_overtime', 'hourly_rate', 'total_hours', 'notes'
    ],
    schedule_templates: [
      'name', 'type', 'work_days', 'start_time', 'end_time', 'break_duration',
      'max_hours_per_week', 'color', 'description', 'requirements', 'is_active'
    ],
    classes: [
      'name', 'subject', 'grade', 'center', 'room', 'start_time', 'end_time',
      'max_students', 'current_students', 'status', 'color', 'work_days',
      'weekend_enabled', 'time_slot', 'notes', 'is_active'
    ],
    schedule_logs: [
      'schedule_id', 'action', 'user_id', 'user_name', 'user_role', 'details',
      'old_values', 'new_values', 'ip_address', 'user_agent', 'status', 'error_message'
    ]
  };

  // 检查每个集合
  const collections = {
    schedules: schedulesSchema,
    schedule_templates: templatesSchema,
    classes: classesSchema,
    schedule_logs: logsSchema
  };

  let allCompatible = true;

  Object.keys(collections).forEach(collectionName => {
    console.log(`📋 检查 ${collectionName} 集合:`);
    
    const schema = collections[collectionName];
    const apiFieldList = apiFields[collectionName];
    const schemaFields = schema.schema.map(field => field.name);

    let compatible = true;
    const missingInSchema = [];
    const missingInAPI = [];

    // 检查API字段是否在schema中存在
    apiFieldList.forEach(field => {
      if (!schemaFields.includes(field)) {
        missingInSchema.push(field);
        compatible = false;
      }
    });

    // 检查schema字段是否在API中使用
    schemaFields.forEach(field => {
      if (!apiFieldList.includes(field) && !['id', 'created', 'updated'].includes(field)) {
        missingInAPI.push(field);
      }
    });

    if (compatible) {
      console.log('  ✅ 字段完全兼容');
    } else {
      console.log('  ❌ 字段不兼容');
      if (missingInSchema.length > 0) {
        console.log(`    - API中使用但schema中缺失: ${missingInSchema.join(', ')}`);
      }
      if (missingInAPI.length > 0) {
        console.log(`    - Schema中存在但API中未使用: ${missingInAPI.join(', ')}`);
      }
      allCompatible = false;
    }

    console.log(`    - Schema字段数: ${schemaFields.length}`);
    console.log(`    - API字段数: ${apiFieldList.length}`);
    console.log('');
  });

  return allCompatible;
}

// 检查数据类型匹配
function checkDataTypeCompatibility() {
  console.log('🔍 检查数据类型兼容性...\n');

  const schedulesSchema = loadCollectionSchema('schedules');
  
  // 检查关键字段的数据类型
  const fieldChecks = [
    { name: 'employee_type', expectedType: 'select', values: ['fulltime', 'parttime', 'teaching_only'] },
    { name: 'status', expectedType: 'select', values: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'] },
    { name: 'start_time', expectedType: 'text', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' },
    { name: 'end_time', expectedType: 'text', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' },
    { name: 'is_overtime', expectedType: 'bool' },
    { name: 'hourly_rate', expectedType: 'number', min: 0 },
    { name: 'total_hours', expectedType: 'number', min: 0 }
  ];

  let allValid = true;

  fieldChecks.forEach(check => {
    const field = schedulesSchema.schema.find(f => f.name === check.name);
    
    if (!field) {
      console.log(`❌ 字段 ${check.name} 不存在`);
      allValid = false;
      return;
    }

    if (field.type !== check.expectedType) {
      console.log(`❌ 字段 ${check.name} 类型不匹配: 期望 ${check.expectedType}, 实际 ${field.type}`);
      allValid = false;
    } else {
      console.log(`✅ 字段 ${check.name} 类型正确: ${field.type}`);
    }

    // 检查select字段的值
    if (check.values && field.options && field.options.values) {
      const schemaValues = field.options.values;
      const missingValues = check.values.filter(v => !schemaValues.includes(v));
      const extraValues = schemaValues.filter(v => !check.values.includes(v));
      
      if (missingValues.length > 0) {
        console.log(`  ⚠️ 缺少值: ${missingValues.join(', ')}`);
      }
      if (extraValues.length > 0) {
        console.log(`  ℹ️ 额外值: ${extraValues.join(', ')}`);
      }
    }

    // 检查验证规则
    if (check.pattern && field.options && field.options.pattern) {
      if (field.options.pattern !== check.pattern) {
        console.log(`  ⚠️ 正则表达式不匹配: 期望 ${check.pattern}, 实际 ${field.options.pattern}`);
      } else {
        console.log(`  ✅ 正则表达式正确`);
      }
    }
  });

  return allValid;
}

// 检查索引
function checkIndexes() {
  console.log('🔍 检查数据库索引...\n');

  const collections = ['schedules', 'schedule_templates', 'classes', 'schedule_logs'];
  
  collections.forEach(collectionName => {
    const schema = loadCollectionSchema(collectionName);
    console.log(`📋 ${collectionName} 集合索引:`);
    
    if (schema.indexes && schema.indexes.length > 0) {
      schema.indexes.forEach(index => {
        console.log(`  ✅ ${index}`);
      });
    } else {
      console.log('  ⚠️ 没有定义索引');
    }
    console.log('');
  });
}

// 主函数
function main() {
  console.log('🚀 开始API兼容性检查...\n');

  const fieldCompatible = checkFieldCompatibility();
  const dataTypeCompatible = checkDataTypeCompatibility();
  checkIndexes();

  console.log('📊 检查结果总结:');
  console.log(`  - 字段兼容性: ${fieldCompatible ? '✅ 通过' : '❌ 失败'}`);
  console.log(`  - 数据类型兼容性: ${dataTypeCompatible ? '✅ 通过' : '❌ 失败'}`);
  console.log(`  - 索引定义: ✅ 完成`);

  if (fieldCompatible && dataTypeCompatible) {
    console.log('\n🎉 所有检查通过！API与集合完全兼容。');
    process.exit(0);
  } else {
    console.log('\n❌ 发现兼容性问题，请检查上述报告。');
    process.exit(1);
  }
}

// 运行检查
if (require.main === module) {
  main();
}

module.exports = { checkFieldCompatibility, checkDataTypeCompatibility, checkIndexes };
