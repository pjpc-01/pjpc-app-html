import 'package:flutter/material.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../../shared/services/pocketbase_service.dart';
import '../models/schedule_template_model.dart';

class ScheduleTemplateProvider with ChangeNotifier {
  final PocketBaseService _pocketBaseService;
  
  bool _isLoading = false;
  String? _error;
  List<ScheduleTemplateModel> _templates = [];

  ScheduleTemplateProvider({PocketBaseService? pocketBaseService}) 
      : _pocketBaseService = pocketBaseService ?? PocketBaseService.instance;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<ScheduleTemplateModel> get templates => _templates;
  List<ScheduleTemplateModel> get activeTemplates => _templates.where((t) => t.isActive).toList();

  // 加载所有排班模板
  Future<void> loadTemplates() async {
    _setLoading(true);
    _clearError();

    try {
      final records = await _pocketBaseService.getScheduleTemplates();
      _templates = records.map((record) => ScheduleTemplateModel.fromRecord(record)).toList();
      notifyListeners();
    } catch (e) {
      _setError('加载排班模板失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // 创建排班模板
  Future<bool> createTemplate(Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();

    try {
      final record = await _pocketBaseService.createScheduleTemplate(data);
      final template = ScheduleTemplateModel.fromRecord(record);
      _templates.add(template);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('创建排班模板失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // 更新排班模板
  Future<bool> updateTemplate(String templateId, Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();

    try {
      final record = await _pocketBaseService.updateScheduleTemplate(templateId, data);
      final template = ScheduleTemplateModel.fromRecord(record);
      
      final index = _templates.indexWhere((t) => t.id == templateId);
      if (index != -1) {
        _templates[index] = template;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('更新排班模板失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // 删除排班模板
  Future<bool> deleteTemplate(String templateId) async {
    _setLoading(true);
    _clearError();

    try {
      await _pocketBaseService.deleteScheduleTemplate(templateId);
      _templates.removeWhere((t) => t.id == templateId);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('删除排班模板失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // 根据类型获取模板
  List<ScheduleTemplateModel> getTemplatesByType(String type) {
    return _templates.where((t) => t.type == type && t.isActive).toList();
  }

  // 获取模板统计
  Map<String, dynamic> getTemplateStats() {
    final activeTemplates = _templates.where((t) => t.isActive).toList();
    final typeCounts = <String, int>{};
    
    for (final template in activeTemplates) {
      typeCounts[template.type] = (typeCounts[template.type] ?? 0) + 1;
    }

    return {
      'total_templates': _templates.length,
      'active_templates': activeTemplates.length,
      'type_counts': typeCounts,
    };
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
  }
}
