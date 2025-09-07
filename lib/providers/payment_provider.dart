import 'package:flutter/material.dart';
import 'package:pocketbase/pocketbase.dart';
import '../services/pocketbase_service.dart';

class PaymentProvider with ChangeNotifier {
  final PocketBaseService _pocketBaseService;
  
  bool _isLoading = false;
  String? _error;
  List<RecordModel> _payments = [];
  List<RecordModel> _invoices = [];

  PaymentProvider() : _pocketBaseService = PocketBaseService.instance;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<RecordModel> get payments => _payments;
  List<RecordModel> get invoices => _invoices;

  // Load payments
  Future<void> loadPayments() async {
    _setLoading(true);
    _clearError();

    try {
      _payments = await _pocketBaseService.getPayments();
      notifyListeners();
    } catch (e) {
      _setError('加载支付记录失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Load invoices
  Future<void> loadInvoices() async {
    _setLoading(true);
    _clearError();

    try {
      _invoices = await _pocketBaseService.getInvoices();
      notifyListeners();
    } catch (e) {
      _setError('加载发票记录失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Create payment
  Future<bool> createPayment(Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();

    try {
      final record = await _pocketBaseService.createPayment(data);
      _payments.add(record);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('创建支付记录失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Create invoice
  Future<bool> createInvoice(Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();

    try {
      final record = await _pocketBaseService.createInvoice(data);
      _invoices.add(record);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('创建发票失败: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Get payments for student
  List<RecordModel> getPaymentsForStudent(String studentId) {
    return _payments.where((p) => p.getStringValue('student') == studentId).toList();
  }

  // Get invoices for student
  List<RecordModel> getInvoicesForStudent(String studentId) {
    return _invoices.where((i) => i.getStringValue('student') == studentId).toList();
  }

  // Get total amount paid by student
  double getTotalPaidByStudent(String studentId) {
    final studentPayments = getPaymentsForStudent(studentId);
    double total = 0.0;
    
    for (final payment in studentPayments) {
      total += payment.getDoubleValue('amount');
    }
    
    return total;
  }

  // Get total invoice amount for student
  double getTotalInvoiceAmountForStudent(String studentId) {
    final studentInvoices = getInvoicesForStudent(studentId);
    double total = 0.0;
    
    for (final invoice in studentInvoices) {
      total += invoice.getDoubleValue('total_amount');
    }
    
    return total;
  }

  // Get outstanding balance for student
  double getOutstandingBalanceForStudent(String studentId) {
    final totalInvoiced = getTotalInvoiceAmountForStudent(studentId);
    final totalPaid = getTotalPaidByStudent(studentId);
    return totalInvoiced - totalPaid;
  }

  // Search payments
  List<RecordModel> searchPayments(String query) {
    if (query.isEmpty) return _payments;
    
    return _payments.where((p) {
      final studentName = p.getStringValue('student_name');
      final paymentMethod = p.getStringValue('payment_method');
      final status = p.getStringValue('status');
      final searchQuery = query.toLowerCase();
      
      return studentName.toLowerCase().contains(searchQuery) ||
             paymentMethod.toLowerCase().contains(searchQuery) ||
             status.toLowerCase().contains(searchQuery);
    }).toList();
  }

  // Search invoices
  List<RecordModel> searchInvoices(String query) {
    if (query.isEmpty) return _invoices;
    
    return _invoices.where((i) {
      final invoiceId = i.getStringValue('invoice_id');
      final studentName = i.getStringValue('student_name');
      final status = i.getStringValue('status');
      final searchQuery = query.toLowerCase();
      
      return invoiceId.toLowerCase().contains(searchQuery) ||
             studentName.toLowerCase().contains(searchQuery) ||
             status.toLowerCase().contains(searchQuery);
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
