import 'package:pocketbase/pocketbase.dart';

class ScheduleTemplateModel {
  final String id;
  final String name;
  final String type; // fulltime, parttime, teaching_only
  final Map<String, dynamic> workDays; // JSON object with work days configuration
  final String startTime;
  final String endTime;
  final double maxHoursPerWeek;
  final String color;
  final bool isActive;
  final DateTime created;
  final DateTime updated;

  ScheduleTemplateModel({
    required this.id,
    required this.name,
    required this.type,
    required this.workDays,
    required this.startTime,
    required this.endTime,
    required this.maxHoursPerWeek,
    required this.color,
    required this.isActive,
    required this.created,
    required this.updated,
  });

  factory ScheduleTemplateModel.fromRecord(RecordModel record) {
    try {
      return ScheduleTemplateModel(
        id: record.id,
        name: record.getStringValue('name') ?? '',
        type: record.getStringValue('type') ?? 'fulltime',
        workDays: _parseWorkDays(record.getStringValue('work_days')),
        startTime: record.getStringValue('start_time') ?? '09:00',
        endTime: record.getStringValue('end_time') ?? '17:00',
        maxHoursPerWeek: record.getDoubleValue('max_hours_per_week') ?? 40.0,
        color: record.getStringValue('color') ?? '#2196F3',
        isActive: record.getBoolValue('is_active') ?? true,
        created: DateTime.tryParse(record.getStringValue('created') ?? '') ?? DateTime.now(),
        updated: DateTime.tryParse(record.getStringValue('updated') ?? '') ?? DateTime.now(),
      );
    } catch (e) {
      print('Error creating ScheduleTemplateModel from record: $e');
      return ScheduleTemplateModel(
        id: record.id,
        name: '默认模板',
        type: 'fulltime',
        workDays: {},
        startTime: '09:00',
        endTime: '17:00',
        maxHoursPerWeek: 40.0,
        color: '#2196F3',
        isActive: true,
        created: DateTime.now(),
        updated: DateTime.now(),
      );
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'type': type,
      'work_days': workDays,
      'start_time': startTime,
      'end_time': endTime,
      'max_hours_per_week': maxHoursPerWeek,
      'color': color,
      'is_active': isActive,
    };
  }

  ScheduleTemplateModel copyWith({
    String? id,
    String? name,
    String? type,
    Map<String, dynamic>? workDays,
    String? startTime,
    String? endTime,
    double? maxHoursPerWeek,
    String? color,
    bool? isActive,
    DateTime? created,
    DateTime? updated,
  }) {
    return ScheduleTemplateModel(
      id: id ?? this.id,
      name: name ?? this.name,
      type: type ?? this.type,
      workDays: workDays ?? this.workDays,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      maxHoursPerWeek: maxHoursPerWeek ?? this.maxHoursPerWeek,
      color: color ?? this.color,
      isActive: isActive ?? this.isActive,
      created: created ?? this.created,
      updated: updated ?? this.updated,
    );
  }

  // 获取类型显示名称
  String get typeDisplayName {
    switch (type) {
      case 'fulltime':
        return '全职';
      case 'parttime':
        return '兼职';
      case 'teaching_only':
        return '仅教学';
      default:
        return type;
    }
  }

  // 获取工作天数
  int get workDaysCount {
    return workDays.length;
  }

  // 获取工作天列表
  List<String> get workDaysList {
    return workDays.keys.toList();
  }

  // 检查是否在指定天工作
  bool isWorkDay(String day) {
    return workDays.containsKey(day) && workDays[day] == true;
  }

  // 解析工作天数JSON字符串
  static Map<String, dynamic> _parseWorkDays(String? workDaysJson) {
    if (workDaysJson == null || workDaysJson.isEmpty) {
      return {};
    }
    
    try {
      // 简单的JSON解析，假设格式为 {"Monday": true, "Tuesday": false, ...}
      final Map<String, dynamic> result = {};
      final cleanJson = workDaysJson.replaceAll('{', '').replaceAll('}', '');
      final pairs = cleanJson.split(',');
      
      for (final pair in pairs) {
        final keyValue = pair.split(':');
        if (keyValue.length == 2) {
          final key = keyValue[0].trim().replaceAll('"', '');
          final value = keyValue[1].trim() == 'true';
          result[key] = value;
        }
      }
      
      return result;
    } catch (e) {
      print('Error parsing work days: $e');
      return {};
    }
  }
}
