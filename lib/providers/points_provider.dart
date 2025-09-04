import 'package:flutter/material.dart';
import 'package:pocketbase/pocketbase.dart';
import '../services/pocketbase_service.dart';

class PointsProvider with ChangeNotifier {
  final PocketBaseService _pocketBaseService;
  
  bool _isLoading = false;
  String? _error;
  List<RecordModel> _studentPoints = [];
  List<RecordModel> _pointTransactions = [];

  PointsProvider() : _pocketBaseService = PocketBaseService.instance;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<RecordModel> get studentPoints => _studentPoints;
  List<RecordModel> get pointTransactions => _pointTransactions;

  // Load student points
  Future<void> loadStudentPoints() async {
    _setLoading(true);
    _clearError();

    try {
      _studentPoints = await _pocketBaseService.getStudentPoints();
      print('✅ Loaded ${_studentPoints.length} student points from PocketBase');
      notifyListeners();
    } catch (e) {
      print('❌ Error loading student points: $e');
      _setError('加载学生积分失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Load point transactions
  Future<void> loadPointTransactions() async {
    _setLoading(true);
    _clearError();

    try {
      _pointTransactions = await _pocketBaseService.getPointTransactions();
      print('✅ Loaded ${_pointTransactions.length} point transactions from PocketBase');
      notifyListeners();
    } catch (e) {
      print('❌ Error loading point transactions: $e');
      _setError('加载积分交易记录失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Add points to student
  Future<bool> addPointsToStudent(String studentId, int points, String reason) async {
    _setLoading(true);
    _clearError();

    try {
      final data = {
        'student': studentId,
        'points': points,
        'reason': reason,
        'type': 'earned',
        'date': DateTime.now().toIso8601String(),
      };
      
      final record = await _pocketBaseService.createStudentPoint(data);
      _studentPoints.add(record);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('添加积分失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Deduct points from student
  Future<bool> deductPointsFromStudent(String studentId, int points, String reason) async {
    _setLoading(true);
    _clearError();

    try {
      final data = {
        'student': studentId,
        'points': -points, // Negative points for deduction
        'reason': reason,
        'type': 'deducted',
        'date': DateTime.now().toIso8601String(),
      };
      
      final record = await _pocketBaseService.createStudentPoint(data);
      _studentPoints.add(record);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('扣除积分失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Get total points for student
  int getTotalPointsForStudent(String studentId) {
    final studentPointRecords = _studentPoints.where((p) => p.getStringValue('student') == studentId).toList();
    int total = 0;
    
    for (final record in studentPointRecords) {
      total += record.getIntValue('points');
    }
    
    return total;
  }

  // Get points history for student
  List<RecordModel> getPointsHistoryForStudent(String studentId) {
    return _studentPoints.where((p) => p.getStringValue('student') == studentId).toList()
      ..sort((a, b) => b.getStringValue('date').compareTo(a.getStringValue('date')));
  }

  // Get students sorted by points
  List<RecordModel> getStudentsSortedByPoints() {
    // This would need to be implemented with a proper query or by grouping the data
    // For now, return empty list
    return [];
  }

  // Search points
  List<RecordModel> searchPoints(String query) {
    if (query.isEmpty) return _studentPoints;
    
    return _studentPoints.where((p) {
      final studentName = p.getStringValue('student_name');
      final reason = p.getStringValue('reason');
      final type = p.getStringValue('type');
      final searchQuery = query.toLowerCase();
      
      return studentName.toLowerCase().contains(searchQuery) ||
             reason.toLowerCase().contains(searchQuery) ||
             type.toLowerCase().contains(searchQuery);
    }).toList();
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
    notifyListeners();
  }

  void clearError() {
    _clearError();
  }
}
