import 'package:pocketbase/pocketbase.dart';
import '../../../shared/services/pocketbase_service.dart';

class SalaryCalculationService {
  final PocketBaseService _pocketBaseService;

  SalaryCalculationService({PocketBaseService? pocketBaseService}) 
      : _pocketBaseService = pocketBaseService ?? PocketBaseService.instance;

  // 根据考勤记录计算薪资
  Future<Map<String, dynamic>> calculateSalaryFromAttendance({
    required String teacherId,
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    try {
      // 获取考勤记录
      final attendanceStats = await _pocketBaseService.getTeacherAttendanceDetailedStats(
        teacherId: teacherId,
        startDate: startDate,
        endDate: endDate,
      );

      // 获取薪资结构
      final salaryStructures = await _pocketBaseService.getTeacherSalaryStructures(
        teacherId: teacherId,
      );

      if (salaryStructures.isEmpty) {
        throw Exception('未找到薪资结构，请先设置薪资结构');
      }

      final salaryStructure = salaryStructures.first;
      final baseSalary = salaryStructure.getDoubleValue('base_salary') ?? 0.0;
      final hourlyRate = salaryStructure.getDoubleValue('hourly_rate') ?? 0.0;
      final overtimeRate = salaryStructure.getDoubleValue('overtime_rate') ?? 1.5;
      
      // 获取津贴
      final allowanceFixed = salaryStructure.getDoubleValue('allowance_fixed') ?? 0.0;
      final allowanceTransport = salaryStructure.getDoubleValue('allowance_transport') ?? 0.0;
      final allowanceMeal = salaryStructure.getDoubleValue('allowance_meal') ?? 0.0;
      final allowanceHousing = salaryStructure.getDoubleValue('allowance_housing') ?? 0.0;
      final allowanceMedical = salaryStructure.getDoubleValue('allowance_medical') ?? 0.0;
      final allowanceOther = salaryStructure.getDoubleValue('allowance_other') ?? 0.0;

      // 获取扣除率
      final epfRate = salaryStructure.getDoubleValue('epf_rate') ?? 11.0;
      final socsoRate = salaryStructure.getDoubleValue('socso_rate') ?? 0.0;
      final eisRate = salaryStructure.getDoubleValue('eis_rate') ?? 0.2;
      final taxRate = salaryStructure.getDoubleValue('tax_rate') ?? 0.0;

      // 考勤数据
      final totalWorkHours = attendanceStats['total_work_hours'] ?? 0.0;
      final totalOvertimeHours = attendanceStats['total_overtime_hours'] ?? 0.0;
      final attendanceRate = attendanceStats['attendance_rate'] ?? 0.0;
      final completeDays = attendanceStats['complete_days'] ?? 0;
      final lateDays = attendanceStats['late_days'] ?? 0;
      final earlyLeaveDays = attendanceStats['early_leave_days'] ?? 0;

      // 计算基本薪资
      double calculatedBaseSalary = baseSalary;
      
      // 如果出勤率低于100%，按比例扣除
      if (attendanceRate < 100.0) {
        calculatedBaseSalary = baseSalary * (attendanceRate / 100.0);
      }

      // 计算加班费
      final overtimePay = totalOvertimeHours * hourlyRate * overtimeRate;

      // 计算总津贴
      final totalAllowances = allowanceFixed + allowanceTransport + allowanceMeal + 
                            allowanceHousing + allowanceMedical + allowanceOther;

      // 计算总薪资（基本工资 + 津贴 + 加班费）
      final grossSalary = calculatedBaseSalary + totalAllowances + overtimePay;

      // 计算扣除项
      final epfDeduction = grossSalary * (epfRate / 100.0);
      final socsoDeduction = grossSalary * (socsoRate / 100.0);
      final eisDeduction = grossSalary * (eisRate / 100.0);
      final taxDeduction = grossSalary * (taxRate / 100.0);
      final totalDeductions = epfDeduction + socsoDeduction + eisDeduction + taxDeduction;

      // 计算净薪资
      final netSalary = grossSalary - totalDeductions;

      // 计算考勤影响
      final attendancePenalty = baseSalary - calculatedBaseSalary;
      final punctualityPenalty = _calculatePunctualityPenalty(lateDays, earlyLeaveDays, baseSalary);

      return {
        'teacher_id': teacherId,
        'calculation_period': {
          'start_date': startDate.toIso8601String().split('T')[0],
          'end_date': endDate.toIso8601String().split('T')[0],
        },
        'attendance_data': {
          'total_work_hours': totalWorkHours,
          'total_overtime_hours': totalOvertimeHours,
          'attendance_rate': attendanceRate,
          'complete_days': completeDays,
          'late_days': lateDays,
          'early_leave_days': earlyLeaveDays,
        },
        'salary_breakdown': {
          'base_salary': baseSalary,
          'calculated_base_salary': calculatedBaseSalary,
          'overtime_pay': overtimePay,
          'total_allowances': totalAllowances,
          'gross_salary': grossSalary,
        },
        'deductions': {
          'epf_deduction': epfDeduction,
          'socso_deduction': socsoDeduction,
          'eis_deduction': eisDeduction,
          'tax_deduction': taxDeduction,
          'total_deductions': totalDeductions,
        },
        'penalties': {
          'attendance_penalty': attendancePenalty,
          'punctuality_penalty': punctualityPenalty,
          'total_penalties': attendancePenalty + punctualityPenalty,
        },
        'final_amounts': {
          'gross_salary': grossSalary,
          'net_salary': netSalary,
          'take_home_pay': netSalary - punctualityPenalty,
        },
        'calculation_date': DateTime.now().toIso8601String(),
      };
    } catch (e) {
      throw Exception('薪资计算失败: ${e.toString()}');
    }
  }

  // 计算准时性惩罚
  double _calculatePunctualityPenalty(int lateDays, int earlyLeaveDays, double baseSalary) {
    // 迟到或早退每次扣除基本工资的1%
    final totalViolations = lateDays + earlyLeaveDays;
    return baseSalary * (totalViolations * 0.01);
  }

  // 自动生成薪资记录
  Future<RecordModel> generateSalaryRecord({
    required String teacherId,
    required DateTime effectiveDate,
    required Map<String, dynamic> calculationData,
  }) async {
    try {
      final data = {
        'teacher_id': teacherId,
        'effective_date': effectiveDate.toIso8601String().split('T')[0],
        'salary_type': 'monthly',
        'base_salary': calculationData['salary_breakdown']['calculated_base_salary'],
        'overtime_pay': calculationData['salary_breakdown']['overtime_pay'],
        'allowance_fixed': calculationData['salary_breakdown']['total_allowances'],
        'gross_salary': calculationData['final_amounts']['gross_salary'],
        'epf_deduction': calculationData['deductions']['epf_deduction'],
        'socso_deduction': calculationData['deductions']['socso_deduction'],
        'eis_deduction': calculationData['deductions']['eis_deduction'],
        'tax_deduction': calculationData['deductions']['tax_deduction'],
        'other_deductions': calculationData['penalties']['total_penalties'],
        'net_salary': calculationData['final_amounts']['net_salary'],
        'attendance_rate': calculationData['attendance_data']['attendance_rate'],
        'work_hours': calculationData['attendance_data']['total_work_hours'],
        'overtime_hours': calculationData['attendance_data']['total_overtime_hours'],
        'notes': '系统自动生成 - 基于考勤记录计算',
        'calculation_data': calculationData, // 存储完整计算数据
      };

      return await _pocketBaseService.createSalaryRecord(data);
    } catch (e) {
      throw Exception('生成薪资记录失败: ${e.toString()}');
    }
  }

  // 批量计算所有教师的薪资
  Future<List<Map<String, dynamic>>> calculateAllTeachersSalary({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    try {
      // 获取所有教师
      final teachers = await _pocketBaseService.getTeachers();
      final results = <Map<String, dynamic>>[];

      for (final teacher in teachers) {
        try {
          final calculation = await calculateSalaryFromAttendance(
            teacherId: teacher.id,
            startDate: startDate,
            endDate: endDate,
          );
          results.add(calculation);
        } catch (e) {
          // 记录错误但继续处理其他教师
          results.add({
            'teacher_id': teacher.id,
            'teacher_name': teacher.getStringValue('name'),
            'error': e.toString(),
            'success': false,
          });
        }
      }

      return results;
    } catch (e) {
      throw Exception('批量计算薪资失败: ${e.toString()}');
    }
  }
}
