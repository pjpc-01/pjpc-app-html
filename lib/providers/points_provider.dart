import 'package:flutter/material.dart';
import 'package:pocketbase/pocketbase.dart';
import '../services/pocketbase_service.dart';
import 'dart:io';

class PointsProvider with ChangeNotifier {
  final PocketBaseService _pocketBaseService;
  
  bool _isLoading = false;
  String? _error;
  List<RecordModel> _studentPoints = [];
  List<RecordModel> _pointTransactions = [];
  final Map<String, RecordModel> _summaryByStudentId = {};

  PointsProvider() : _pocketBaseService = PocketBaseService.instance;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<RecordModel> get studentPoints => _studentPoints;
  List<RecordModel> get pointTransactions => _pointTransactions;
  RecordModel? getSummary(String studentId) => _summaryByStudentId[studentId];

  // Load student points
  Future<void> loadStudentPoints() async {
    _setLoading(true);
    _clearError();

    try {
      _studentPoints = await _pocketBaseService.getStudentPoints();
      notifyListeners();
    } catch (e) {
      _setError('加载学生积分失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadStudentSummary(String studentId) async {
    try {
      final summary = await _pocketBaseService.getStudentPointsSummary(studentId);
      if (summary != null) {
        _summaryByStudentId[studentId] = summary;
        notifyListeners();
      }
    } catch (_) {}
  }

  // Load point transactions
  Future<void> loadPointTransactions() async {
    _setLoading(true);
    _clearError();

    try {
      _pointTransactions = await _pocketBaseService.getPointTransactions();
      notifyListeners();
    } catch (e) {
      _setError('加载积分交易记录失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Add points via transaction and update summary
  Future<bool> addPointsToStudent(String studentId, int points, String reason, {required String teacherId, int? seasonNumber}) async {
    _setLoading(true);
    _clearError();

    try {
      final tx = await _pocketBaseService.createPointTransaction(
        studentId: studentId,
        teacherId: teacherId,
        pointsChange: points,
        transactionType: 'add_points',
        reason: reason,
        seasonNumber: seasonNumber,
      );
      _pointTransactions.insert(0, tx);

      final summary = await _pocketBaseService.upsertStudentPointsSummary(
        studentId: studentId,
        deltaEarned: points,
      );
      _summaryByStudentId[studentId] = summary;
      notifyListeners();
      return true;
    } catch (e) {
      _setError('添加积分失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Deduct points via transaction and update summary
  Future<bool> deductPointsFromStudent(String studentId, int points, String reason, {required String teacherId, int? seasonNumber}) async {
    _setLoading(true);
    _clearError();

    try {
      final tx = await _pocketBaseService.createPointTransaction(
        studentId: studentId,
        teacherId: teacherId,
        pointsChange: -points,
        transactionType: 'deduct_points',
        reason: reason,
        seasonNumber: seasonNumber,
      );
      _pointTransactions.insert(0, tx);

      final summary = await _pocketBaseService.upsertStudentPointsSummary(
        studentId: studentId,
        deltaSpent: points,
      );
      _summaryByStudentId[studentId] = summary;
      notifyListeners();
      return true;
    } catch (e) {
      _setError('扣除积分失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Redeem with proof image
  Future<bool> redeemWithProof(String studentId, int points, String reason, {required String teacherId, File? proofImage, int? seasonNumber}) async {
    _setLoading(true);
    _clearError();

    try {
      final tx = await _pocketBaseService.createPointTransaction(
        studentId: studentId,
        teacherId: teacherId,
        pointsChange: -points,
        transactionType: 'redeem',
        reason: reason,
        proofImage: proofImage,
        seasonNumber: seasonNumber,
      );
      _pointTransactions.insert(0, tx);

      final summary = await _pocketBaseService.upsertStudentPointsSummary(
        studentId: studentId,
        deltaSpent: points,
      );
      _summaryByStudentId[studentId] = summary;
      notifyListeners();
      return true;
    } catch (e) {
      _setError('兑换失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Get total points for student
  int getTotalPointsForStudent(String studentId) {
    final summary = _summaryByStudentId[studentId];
    if (summary != null) return summary.getIntValue('current_points');
    // fallback to local aggregation if summary not loaded
    final studentPointRecords = _studentPoints.where((p) => p.getStringValue('student') == studentId).toList();
    int total = 0;
    for (final record in studentPointRecords) {
      total += record.getIntValue('points');
    }
    return total;
  }

  // Get points history for student
  List<RecordModel> getPointsHistoryForStudent(String studentId) {
    final transactions = _pointTransactions.where((t) => t.getStringValue('student_id') == studentId).toList();
    transactions.sort((a, b) => b.getStringValue('created').compareTo(a.getStringValue('created')));
    return transactions;
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
