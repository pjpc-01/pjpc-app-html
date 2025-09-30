import 'package:pocketbase/pocketbase.dart';

extension RecordModelExtensions on RecordModel {
  String getStringValue(String key) {
    return data[key]?.toString() ?? '';
  }

  double getDoubleValue(String key) {
    final value = data[key];
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  int getIntValue(String key) {
    final value = data[key];
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  bool getBoolValue(String key) {
    final value = data[key];
    if (value is bool) return value;
    if (value is String) return value.toLowerCase() == 'true';
    return false;
  }

  DateTime? getDateTimeValue(String key) {
    final value = data[key];
    if (value is String) {
      return DateTime.tryParse(value);
    }
    return null;
  }

  Map<String, dynamic> getMapValue(String key) {
    final value = data[key];
    if (value is Map<String, dynamic>) return value;
    return {};
  }

  List<dynamic> getListValue(String key) {
    final value = data[key];
    if (value is List) return value;
    return [];
  }
}
