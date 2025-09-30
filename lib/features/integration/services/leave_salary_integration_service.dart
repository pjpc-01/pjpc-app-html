import 'package:pocketbase/pocketbase.dart';
import '../../../shared/services/pocketbase_service.dart';

class LeaveSalaryIntegrationService {
  final PocketBaseService _pocketBaseService;

  LeaveSalaryIntegrationService({PocketBaseService? pocketBaseService}) 
      : _pocketBaseService = pocketBaseService ?? PocketBaseService.instance;

  // 计算请假对薪资的影响
  Future<Map<String, dynamic>> calculateLeaveSalaryImpact({
    required String teacherId,
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    try {
      // 获取请假记录
      final leaveRecords = await _pocketBaseService.getTeacherLeaveRecords(
        teacherId: teacherId,
        startDate: startDate,
        endDate: endDate,
      );

      // 获取薪资结构
      final salaryStructures = await _pocketBaseService.getTeacherSalaryStructures(
        teacherId: teacherId,
      );

      if (salaryStructures.isEmpty) {
        throw Exception('未找到薪资结构');
      }

      final salaryStructure = salaryStructures.first;
      final baseSalary = salaryStructure.getDoubleValue('base_salary') ?? 0.0;
      final dailySalary = baseSalary / 30; // 假设月薪按30天计算

      // 分析请假记录
      double totalLeaveDays = 0.0;
      double unpaidLeaveDays = 0.0;
      double paidLeaveDays = 0.0;
      double sickLeaveDays = 0.0;
      double personalLeaveDays = 0.0;
      double annualLeaveDays = 0.0;

      final Map<String, double> leaveTypeDays = {};

      for (final record in leaveRecords) {
        final leaveType = record.getStringValue('leave_type') ?? '';
        final status = record.getStringValue('status') ?? '';
        final startDateStr = record.getStringValue('start_date') ?? '';
        final endDateStr = record.getStringValue('end_date') ?? '';

        if (startDateStr.isEmpty || endDateStr.isEmpty) continue;

        try {
          final start = DateTime.parse(startDateStr);
          final end = DateTime.parse(endDateStr);
          final days = end.difference(start).inDays + 1; // 包含开始和结束日期

          totalLeaveDays += days;
          leaveTypeDays[leaveType] = (leaveTypeDays[leaveType] ?? 0.0) + days;

          // 根据请假类型和状态计算薪资影响
          if (status == 'approved') {
            switch (leaveType) {
              case 'sick_leave':
                sickLeaveDays += days;
                // 病假通常有薪
                paidLeaveDays += days;
                break;
              case 'annual_leave':
                annualLeaveDays += days;
                // 年假有薪
                paidLeaveDays += days;
                break;
              case 'personal_leave':
                personalLeaveDays += days;
                // 事假通常无薪
                unpaidLeaveDays += days;
                break;
              case 'emergency_leave':
                personalLeaveDays += days;
                // 紧急事假可能部分有薪
                unpaidLeaveDays += days * 0.5;
                paidLeaveDays += days * 0.5;
                break;
              default:
                unpaidLeaveDays += days;
            }
          }
        } catch (e) {
          // 忽略日期解析错误
          continue;
        }
      }

      // 计算薪资影响
      final unpaidSalaryDeduction = unpaidLeaveDays * dailySalary;
      final paidLeaveCost = paidLeaveDays * dailySalary;
      final netSalaryImpact = -unpaidSalaryDeduction; // 负数表示减少

      // 计算剩余假期余额
      final leaveBalance = await _calculateLeaveBalance(teacherId, leaveRecords);

      return {
        'teacher_id': teacherId,
        'calculation_period': {
          'start_date': startDate.toIso8601String().split('T')[0],
          'end_date': endDate.toIso8601String().split('T')[0],
        },
        'leave_summary': {
          'total_leave_days': totalLeaveDays,
          'paid_leave_days': paidLeaveDays,
          'unpaid_leave_days': unpaidLeaveDays,
          'sick_leave_days': sickLeaveDays,
          'personal_leave_days': personalLeaveDays,
          'annual_leave_days': annualLeaveDays,
        },
        'leave_type_breakdown': leaveTypeDays,
        'salary_impact': {
          'daily_salary': dailySalary,
          'unpaid_salary_deduction': unpaidSalaryDeduction,
          'paid_leave_cost': paidLeaveCost,
          'net_salary_impact': netSalaryImpact,
        },
        'leave_balance': leaveBalance,
        'recommendations': _generateLeaveRecommendations(
          totalLeaveDays,
          unpaidLeaveDays,
          leaveBalance,
        ),
      };
    } catch (e) {
      throw Exception('请假薪资影响计算失败: ${e.toString()}');
    }
  }

  // 计算假期余额
  Future<Map<String, dynamic>> _calculateLeaveBalance(
    String teacherId,
    List<RecordModel> leaveRecords,
  ) async {
    // 假设每年假期额度
    const int annualLeaveQuota = 21; // 年假21天
    const int sickLeaveQuota = 14; // 病假14天
    const int personalLeaveQuota = 5; // 事假5天

    final currentYear = DateTime.now().year;
    double usedAnnualLeave = 0.0;
    double usedSickLeave = 0.0;
    double usedPersonalLeave = 0.0;

    for (final record in leaveRecords) {
      final leaveType = record.getStringValue('leave_type') ?? '';
      final status = record.getStringValue('status') ?? '';
      final startDateStr = record.getStringValue('start_date') ?? '';
      final year = DateTime.tryParse(startDateStr)?.year ?? 0;

      if (status != 'approved' || year != currentYear) continue;

      try {
        final start = DateTime.parse(startDateStr);
        final endDateStr = record.getStringValue('end_date') ?? '';
        final end = DateTime.parse(endDateStr);
        final days = end.difference(start).inDays + 1;

        switch (leaveType) {
          case 'annual_leave':
            usedAnnualLeave += days;
            break;
          case 'sick_leave':
            usedSickLeave += days;
            break;
          case 'personal_leave':
          case 'emergency_leave':
            usedPersonalLeave += days;
            break;
        }
      } catch (e) {
        continue;
      }
    }

    return {
      'annual_leave': {
        'quota': annualLeaveQuota,
        'used': usedAnnualLeave,
        'remaining': (annualLeaveQuota - usedAnnualLeave).clamp(0.0, annualLeaveQuota.toDouble()),
      },
      'sick_leave': {
        'quota': sickLeaveQuota,
        'used': usedSickLeave,
        'remaining': (sickLeaveQuota - usedSickLeave).clamp(0.0, sickLeaveQuota.toDouble()),
      },
      'personal_leave': {
        'quota': personalLeaveQuota,
        'used': usedPersonalLeave,
        'remaining': (personalLeaveQuota - usedPersonalLeave).clamp(0.0, personalLeaveQuota.toDouble()),
      },
    };
  }

  // 生成请假建议
  List<String> _generateLeaveRecommendations(
    double totalLeaveDays,
    double unpaidLeaveDays,
    Map<String, dynamic> leaveBalance,
  ) {
    final recommendations = <String>[];

    // 检查假期余额
    final annualRemaining = leaveBalance['annual_leave']['remaining'] as double;
    final sickRemaining = leaveBalance['sick_leave']['remaining'] as double;
    final personalRemaining = leaveBalance['personal_leave']['remaining'] as double;

    if (annualRemaining < 5) {
      recommendations.add('年假余额不足，建议谨慎使用');
    }

    if (sickRemaining < 3) {
      recommendations.add('病假余额不足，建议注意身体健康');
    }

    if (personalRemaining < 2) {
      recommendations.add('事假余额不足，建议合理安排个人事务');
    }

    // 检查请假频率
    if (totalLeaveDays > 15) {
      recommendations.add('本月请假天数较多，建议减少不必要的请假');
    }

    if (unpaidLeaveDays > 5) {
      recommendations.add('无薪假较多，建议优先使用有薪假期');
    }

    // 检查请假模式
    if (totalLeaveDays > 0 && unpaidLeaveDays / totalLeaveDays > 0.7) {
      recommendations.add('无薪假比例过高，建议合理规划假期使用');
    }

    return recommendations;
  }

  // 自动调整薪资记录中的请假扣除
  Future<RecordModel> adjustSalaryForLeave({
    required String salaryRecordId,
    required Map<String, dynamic> leaveImpact,
  }) async {
    try {
      // 获取现有薪资记录
      final salaryRecord = await _pocketBaseService.getRecordById('teacher_salary_record', salaryRecordId);
      
      final currentNetSalary = salaryRecord.getDoubleValue('net_salary') ?? 0.0;
      final leaveDeduction = leaveImpact['salary_impact']['unpaid_salary_deduction'] as double;
      final adjustedNetSalary = currentNetSalary - leaveDeduction;

      // 更新薪资记录
      final updateData = {
        'other_deductions': (salaryRecord.getDoubleValue('other_deductions') ?? 0.0) + leaveDeduction,
        'net_salary': adjustedNetSalary,
        'leave_deduction': leaveDeduction,
        'leave_impact_data': leaveImpact,
      };

      return await _pocketBaseService.updateSalaryRecord(salaryRecordId, updateData);
    } catch (e) {
      throw Exception('调整薪资记录失败: ${e.toString()}');
    }
  }

  // 获取请假薪资影响报表
  Future<List<Map<String, dynamic>>> getLeaveSalaryImpactReport({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    try {
      // 获取所有教师
      final teachers = await _pocketBaseService.getTeachers();
      final report = <Map<String, dynamic>>[];

      for (final teacher in teachers) {
        try {
          final impact = await calculateLeaveSalaryImpact(
            teacherId: teacher.id,
            startDate: startDate,
            endDate: endDate,
          );
          
          report.add({
            'teacher_id': teacher.id,
            'teacher_name': teacher.getStringValue('name'),
            ...impact,
          });
        } catch (e) {
          report.add({
            'teacher_id': teacher.id,
            'teacher_name': teacher.getStringValue('name'),
            'error': e.toString(),
            'success': false,
          });
        }
      }

      return report;
    } catch (e) {
      throw Exception('生成请假薪资影响报表失败: ${e.toString()}');
    }
  }
}
