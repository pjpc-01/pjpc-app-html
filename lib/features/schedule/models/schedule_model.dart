import 'package:pocketbase/pocketbase.dart';

class ScheduleModel {
  final String id;
  final String teacherId;
  final String? classId;
  final DateTime date;
  final String startTime; // e.g., '09:00'
  final String endTime;   // e.g., '17:00'
  final String? center;
  final String? room;
  final String status; // scheduled, confirmed, in_progress
  final bool isOvertime;
  final double? hourlyRate;
  final double? totalHours;
  final String scheduleType; // fulltime, parttime, teaching_only
  final DateTime created;
  final DateTime updated;

  // 扩展字段
  final String? teacherName;
  final String? className;

  ScheduleModel({
    required this.id,
    required this.teacherId,
    this.classId,
    required this.date,
    required this.startTime,
    required this.endTime,
    this.center,
    this.room,
    required this.status,
    this.isOvertime = false,
    this.hourlyRate,
    this.totalHours,
    required this.scheduleType,
    required this.created,
    required this.updated,
    this.teacherName,
    this.className,
  });

  factory ScheduleModel.fromRecord(RecordModel record) {
    try {
      return ScheduleModel(
        id: record.id,
        teacherId: record.getStringValue('teacher_id') ?? '',
        classId: record.getStringValue('class_id'),
        date: DateTime.parse(record.getStringValue('date') ?? DateTime.now().toIso8601String().split('T')[0]),
        startTime: record.getStringValue('start_time') ?? '09:00',
        endTime: record.getStringValue('end_time') ?? '17:00',
        center: record.getStringValue('center'),
        room: record.getStringValue('room'),
        status: record.getStringValue('status') ?? 'scheduled',
        isOvertime: record.getBoolValue('is_overtime') ?? false,
        hourlyRate: record.getDoubleValue('hourly_rate'),
        totalHours: record.getDoubleValue('total_hours'),
        scheduleType: record.getStringValue('schedule_type') ?? 'fulltime',
        created: DateTime.tryParse(record.getStringValue('created') ?? '') ?? DateTime.now(),
        updated: DateTime.tryParse(record.getStringValue('updated') ?? '') ?? DateTime.now(),
        teacherName: record.expand?['teacher_id']?.first?.getStringValue('name') ?? '未知教师',
        className: record.expand?['class_id']?.first?.getStringValue('name') ?? '未知班级',
      );
    } catch (e) {
      print('Error creating ScheduleModel from record: $e');
      // 返回一个默认的ScheduleModel
      return ScheduleModel(
        id: record.id,
        teacherId: record.getStringValue('teacher_id') ?? '',
        classId: null,
        date: DateTime.now(),
        startTime: '09:00',
        endTime: '17:00',
        center: null,
        room: null,
        status: 'scheduled',
        isOvertime: false,
        hourlyRate: null,
        totalHours: null,
        scheduleType: 'fulltime',
        created: DateTime.now(),
        updated: DateTime.now(),
        teacherName: '未知教师',
        className: '未知班级',
      );
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'teacher_id': teacherId,
      'class_id': classId,
      'date': date.toIso8601String().split('T')[0],
      'start_time': startTime,
      'end_time': endTime,
      'center': center,
      'room': room,
      'status': status,
      'is_overtime': isOvertime,
      'hourly_rate': hourlyRate,
      'total_hours': totalHours,
      'schedule_type': scheduleType,
    };
  }

  ScheduleModel copyWith({
    String? id,
    String? teacherId,
    String? classId,
    DateTime? date,
    String? startTime,
    String? endTime,
    String? center,
    String? room,
    String? status,
    bool? isOvertime,
    double? hourlyRate,
    double? totalHours,
    String? scheduleType,
    DateTime? created,
    DateTime? updated,
    String? teacherName,
    String? className,
  }) {
    return ScheduleModel(
      id: id ?? this.id,
      teacherId: teacherId ?? this.teacherId,
      classId: classId ?? this.classId,
      date: date ?? this.date,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      center: center ?? this.center,
      room: room ?? this.room,
      status: status ?? this.status,
      isOvertime: isOvertime ?? this.isOvertime,
      hourlyRate: hourlyRate ?? this.hourlyRate,
      totalHours: totalHours ?? this.totalHours,
      scheduleType: scheduleType ?? this.scheduleType,
      created: created ?? this.created,
      updated: updated ?? this.updated,
      teacherName: teacherName ?? this.teacherName,
      className: className ?? this.className,
    );
  }

  // 计算工作时长（小时）
  double get workHours {
    try {
      final start = DateTime.parse('2024-01-01 $startTime:00');
      final end = DateTime.parse('2024-01-01 $endTime:00');
      if (end.isBefore(start)) {
        // 跨天班次
        final nextDay = end.add(const Duration(days: 1));
        return nextDay.difference(start).inHours.toDouble();
      }
      return end.difference(start).inHours.toDouble();
    } catch (e) {
      return totalHours ?? 0.0;
    }
  }

  // 获取状态显示名称
  String get statusDisplayName {
    switch (status) {
      case 'scheduled':
        return '已排班';
      case 'confirmed':
        return '已确认';
      case 'in_progress':
        return '进行中';
      default:
        return status;
    }
  }

  // 获取排班类型显示名称
  String get scheduleTypeDisplayName {
    switch (scheduleType) {
      case 'fulltime':
        return '全职';
      case 'parttime':
        return '兼职';
      case 'teaching_only':
        return '仅教学';
      default:
        return scheduleType;
    }
  }

  // 获取班次显示名称
  String get shiftDisplayName {
    return '$startTime - $endTime';
  }
}