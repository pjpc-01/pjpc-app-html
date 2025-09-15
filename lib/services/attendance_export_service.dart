import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../providers/attendance_provider.dart';

class AttendanceExportService {
  static final AttendanceExportService _instance = AttendanceExportService._internal();
  factory AttendanceExportService() => _instance;
  AttendanceExportService._internal();

  /// 导出考勤报告为JSON格式
  Future<String> exportToJson(AttendanceProvider attendanceProvider) async {
    try {
      final reportData = attendanceProvider.exportAttendanceReport();
      final jsonString = const JsonEncoder.withIndent('  ').convert(reportData);
      
      // 获取应用文档目录
      final directory = await getApplicationDocumentsDirectory();
      final fileName = 'attendance_report_${DateTime.now().millisecondsSinceEpoch}.json';
      final file = File('${directory.path}/$fileName');
      
      // 写入文件
      await file.writeAsString(jsonString);
      
      return file.path;
    } catch (e) {
      throw Exception('导出JSON文件失败: $e');
    }
  }

  /// 导出考勤报告为CSV格式
  Future<String> exportToCsv(AttendanceProvider attendanceProvider) async {
    try {
      final reports = attendanceProvider.attendanceReports;
      final studentRecords = attendanceProvider.attendanceRecords;
      final teacherRecords = attendanceProvider.teacherAttendanceRecords;
      
      StringBuffer csvContent = StringBuffer();
      
      // CSV头部
      csvContent.writeln('报告类型,姓名,类型,日期,时间,状态,备注');
      
      // 添加学生考勤记录
      for (final record in studentRecords) {
        csvContent.writeln([
          '学生考勤',
          record.getStringValue('student_name') ?? '',
          record.getStringValue('type') ?? '',
          record.getStringValue('date') ?? '',
          record.getStringValue('check_in_time') ?? record.getStringValue('check_out_time') ?? '',
          record.getStringValue('status') ?? '',
          record.getStringValue('notes') ?? '',
        ].map((field) => '"${field.toString().replaceAll('"', '""')}"').join(','));
      }
      
      // 添加教师考勤记录
      for (final record in teacherRecords) {
        csvContent.writeln([
          '教师考勤',
          record.getStringValue('teacher_name') ?? '',
          record.getStringValue('type') ?? '',
          record.getStringValue('date') ?? '',
          record.getStringValue('check_in_time') ?? record.getStringValue('check_out_time') ?? '',
          record.getStringValue('status') ?? '',
          record.getStringValue('notes') ?? '',
        ].map((field) => '"${field.toString().replaceAll('"', '""')}"').join(','));
      }
      
      // 获取应用文档目录
      final directory = await getApplicationDocumentsDirectory();
      final fileName = 'attendance_report_${DateTime.now().millisecondsSinceEpoch}.csv';
      final file = File('${directory.path}/$fileName');
      
      // 写入文件
      await file.writeAsString(csvContent.toString());
      
      return file.path;
    } catch (e) {
      throw Exception('导出CSV文件失败: $e');
    }
  }

  /// 生成考勤报告摘要文本
  String generateReportSummary(AttendanceProvider attendanceProvider) {
    final reports = attendanceProvider.attendanceReports;
    if (reports.isEmpty) {
      return '暂无考勤数据';
    }

    // Calculate statistics from reports
    final studentStats = _calculateStudentStats(reports);
    final teacherStats = _calculateTeacherStats(reports);
    final summary = _calculateSummaryStats(reports);

    StringBuffer summaryText = StringBuffer();
    
    summaryText.writeln('考勤报告摘要');
    summaryText.writeln('=' * 50);
    summaryText.writeln('报告期间: 最近7天');
    summaryText.writeln('生成时间: ${DateTime.now().toIso8601String().split('T')[0]}');
    summaryText.writeln('');
    
    summaryText.writeln('学生考勤统计:');
    summaryText.writeln('- 总签到次数: ${studentStats['total_check_ins'] ?? 0}');
    summaryText.writeln('- 总签退次数: ${studentStats['total_check_outs'] ?? 0}');
    summaryText.writeln('- 迟到次数: ${studentStats['late_count'] ?? 0}');
    summaryText.writeln('- 缺勤次数: ${studentStats['absent_count'] ?? 0}');
    summaryText.writeln('- 出勤率: ${studentStats['attendance_rate']?.toStringAsFixed(1) ?? '0.0'}%');
    summaryText.writeln('');
    
    summaryText.writeln('教师考勤统计:');
    summaryText.writeln('- 总签到次数: ${teacherStats['total_check_ins'] ?? 0}');
    summaryText.writeln('- 总签退次数: ${teacherStats['total_check_outs'] ?? 0}');
    summaryText.writeln('- 出勤率: ${teacherStats['attendance_rate']?.toStringAsFixed(1) ?? '0.0'}%');
    summaryText.writeln('');
    
    summaryText.writeln('整体概况:');
    summaryText.writeln('- 统计天数: ${summary['total_days'] ?? 0}');
    summaryText.writeln('- 平均每日出勤: ${summary['average_daily_attendance']?.toStringAsFixed(1) ?? '0.0'}');
    summaryText.writeln('- 总迟到人数: ${summary['total_late'] ?? 0}');
    summaryText.writeln('- 总缺勤人数: ${summary['total_absent'] ?? 0}');
    
    return summaryText.toString();
  }

  Map<String, dynamic> _calculateStudentStats(List<Map<String, dynamic>> reports) {
    int totalCheckIns = 0;
    int totalCheckOuts = 0;
    int totalLate = 0;
    int totalAbsent = 0;

    for (final report in reports) {
      totalCheckIns += (report['student_check_ins'] as num?)?.toInt() ?? 0;
      totalCheckOuts += (report['student_check_outs'] as num?)?.toInt() ?? 0;
      totalLate += (report['late_count'] as num?)?.toInt() ?? 0;
      totalAbsent += (report['absent_count'] as num?)?.toInt() ?? 0;
    }

    final attendanceRate = totalCheckIns > 0 ? (totalCheckIns / (totalCheckIns + totalAbsent)) * 100 : 0.0;

    return {
      'total_check_ins': totalCheckIns,
      'total_check_outs': totalCheckOuts,
      'late_count': totalLate,
      'absent_count': totalAbsent,
      'attendance_rate': attendanceRate,
    };
  }

  Map<String, dynamic> _calculateTeacherStats(List<Map<String, dynamic>> reports) {
    int totalCheckIns = 0;
    int totalCheckOuts = 0;

    for (final report in reports) {
      totalCheckIns += (report['teacher_check_ins'] as num?)?.toInt() ?? 0;
      totalCheckOuts += (report['teacher_check_outs'] as num?)?.toInt() ?? 0;
    }

    return {
      'total_check_ins': totalCheckIns,
      'total_check_outs': totalCheckOuts,
      'attendance_rate': totalCheckIns > 0 ? 100.0 : 0.0,
    };
  }

  Map<String, dynamic> _calculateSummaryStats(List<Map<String, dynamic>> reports) {
    int totalDays = reports.length;
    int totalStudentCheckIns = 0;
    int totalTeacherCheckIns = 0;
    int totalLate = 0;
    int totalAbsent = 0;

    for (final report in reports) {
      totalStudentCheckIns += (report['student_check_ins'] as num?)?.toInt() ?? 0;
      totalTeacherCheckIns += (report['teacher_check_ins'] as num?)?.toInt() ?? 0;
      totalLate += (report['late_count'] as num?)?.toInt() ?? 0;
      totalAbsent += (report['absent_count'] as num?)?.toInt() ?? 0;
    }

    return {
      'total_days': totalDays,
      'total_student_check_ins': totalStudentCheckIns,
      'total_teacher_check_ins': totalTeacherCheckIns,
      'total_late': totalLate,
      'total_absent': totalAbsent,
      'average_daily_attendance': totalDays > 0 ? totalStudentCheckIns / totalDays : 0.0,
    };
  }

  /// 导出考勤报告为文本格式
  Future<String> exportToText(AttendanceProvider attendanceProvider) async {
    try {
      final summaryText = generateReportSummary(attendanceProvider);
      
      // 获取应用文档目录
      final directory = await getApplicationDocumentsDirectory();
      final fileName = 'attendance_report_${DateTime.now().millisecondsSinceEpoch}.txt';
      final file = File('${directory.path}/$fileName');
      
      // 写入文件
      await file.writeAsString(summaryText);
      
      return file.path;
    } catch (e) {
      throw Exception('导出文本文件失败: $e');
    }
  }

  /// 分享考勤报告
  Future<void> shareReport(BuildContext context, AttendanceProvider attendanceProvider, String format) async {
    try {
      String filePath;
      
      switch (format.toLowerCase()) {
        case 'json':
          filePath = await exportToJson(attendanceProvider);
          break;
        case 'csv':
          filePath = await exportToCsv(attendanceProvider);
          break;
        case 'txt':
          filePath = await exportToText(attendanceProvider);
          break;
        default:
          throw Exception('不支持的导出格式: $format');
      }
      
      // 分享文件
      await Share.shareXFiles(
        [XFile(filePath)],
        text: '考勤报告 - ${DateTime.now().toIso8601String().split('T')[0]}',
      );
      
      // 显示成功消息
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('考勤报告已导出为 $format 格式'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('导出失败: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  /// 显示导出选项对话框
  void showExportDialog(BuildContext context, AttendanceProvider attendanceProvider) {
    showModalBottomSheet(
      context: context,
      builder: (BuildContext context) {
        return Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '选择导出格式',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 20),
              ListTile(
                leading: const Icon(Icons.description, color: Colors.blue),
                title: const Text('JSON格式'),
                subtitle: const Text('包含完整数据的结构化格式'),
                onTap: () {
                  Navigator.pop(context);
                  shareReport(context, attendanceProvider, 'json');
                },
              ),
              ListTile(
                leading: const Icon(Icons.table_chart, color: Colors.green),
                title: const Text('CSV格式'),
                subtitle: const Text('适合Excel打开的表格格式'),
                onTap: () {
                  Navigator.pop(context);
                  shareReport(context, attendanceProvider, 'csv');
                },
              ),
              ListTile(
                leading: const Icon(Icons.text_snippet, color: Colors.orange),
                title: const Text('文本格式'),
                subtitle: const Text('简洁的摘要报告'),
                onTap: () {
                  Navigator.pop(context);
                  shareReport(context, attendanceProvider, 'txt');
                },
              ),
            ],
          ),
        );
      },
    );
  }
}
