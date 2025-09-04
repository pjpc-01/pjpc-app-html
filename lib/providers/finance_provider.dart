import 'package:flutter/material.dart';
import 'package:pocketbase/pocketbase.dart';
import '../services/pocketbase_service.dart';

class FinanceProvider with ChangeNotifier {
  final PocketBaseService _pocketBaseService;
  
  bool _isLoading = false;
  String? _error;
  List<RecordModel> _invoices = [];
  List<RecordModel> _payments = [];
  List<RecordModel> _receipts = [];
  Map<String, double> _financialStats = {};

  FinanceProvider() : _pocketBaseService = PocketBaseService.instance;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<RecordModel> get invoices => _invoices;
  List<RecordModel> get payments => _payments;
  List<RecordModel> get receipts => _receipts;
  Map<String, double> get financialStats => _financialStats;

  // Load all financial data
  Future<void> loadFinancialData() async {
    _setLoading(true);
    _clearError();

    try {
      await loadInvoices();
      await loadPayments();
      await loadReceipts();
      _calculateFinancialStats();
    } catch (e) {
      _setError('加载财务数据失败: ${e.toString()}');
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
      _setError('加载发票失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

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

  // Load receipts
  Future<void> loadReceipts() async {
    _setLoading(true);
    _clearError();

    try {
      // For now, receipts are the same as payments
      _receipts = await _pocketBaseService.getPayments();
      notifyListeners();
    } catch (e) {
      _setError('加载收据失败: ${e.toString()}');
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

  // Get invoices for student
  List<RecordModel> getInvoicesForStudent(String studentId) {
    return _invoices.where((i) => i.getStringValue('student') == studentId).toList();
  }

  // Get payments for student
  List<RecordModel> getPaymentsForStudent(String studentId) {
    return _payments.where((p) => p.getStringValue('student') == studentId).toList();
  }

  // Get payments for invoice
  List<RecordModel> getPaymentsForInvoice(String invoiceId) {
    return _payments.where((p) => p.getStringValue('invoice') == invoiceId).toList();
  }

  // Calculate total amount for invoice
  double getTotalAmountForInvoice(String invoiceId) {
    final invoice = _invoices.firstWhere(
      (i) => i.id == invoiceId,
      orElse: () => RecordModel(),
    );
    return invoice.getDoubleValue('total_amount');
  }

  // Calculate paid amount for invoice
  double getPaidAmountForInvoice(String invoiceId) {
    final payments = getPaymentsForInvoice(invoiceId);
    return payments.fold(0.0, (sum, payment) => sum + payment.getDoubleValue('amount'));
  }

  // Calculate remaining amount for invoice
  double getRemainingAmountForInvoice(String invoiceId) {
    final total = getTotalAmountForInvoice(invoiceId);
    final paid = getPaidAmountForInvoice(invoiceId);
    return total - paid;
  }

  // Check if invoice is fully paid
  bool isInvoiceFullyPaid(String invoiceId) {
    return getRemainingAmountForInvoice(invoiceId) <= 0;
  }

  // Get financial statistics
  Future<void> loadFinancialStats() async {
    _setLoading(true);
    _clearError();

    try {
      await loadInvoices();
      await loadPayments();
      
      _calculateFinancialStats();
      notifyListeners();
    } catch (e) {
      _setError('加载财务统计失败: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  void _calculateFinancialStats() {
    double totalInvoices = 0.0;
    double totalPayments = 0.0;
    double pendingAmount = 0.0;
    int totalInvoiceCount = _invoices.length;
    int paidInvoiceCount = 0;

    for (final invoice in _invoices) {
      final amount = invoice.getDoubleValue('total_amount');
      totalInvoices += amount;
      
      if (isInvoiceFullyPaid(invoice.id)) {
        paidInvoiceCount++;
        totalPayments += amount;
      } else {
        pendingAmount += getRemainingAmountForInvoice(invoice.id);
      }
    }

    _financialStats = {
      'total_invoices': totalInvoices,
      'total_payments': totalPayments,
      'pending_amount': pendingAmount,
      'total_invoice_count': totalInvoiceCount.toDouble(),
      'paid_invoice_count': paidInvoiceCount.toDouble(),
      'unpaid_invoice_count': (totalInvoiceCount - paidInvoiceCount).toDouble(),
    };
  }

  // Get invoices by status
  List<RecordModel> getInvoicesByStatus(String status) {
    return _invoices.where((i) {
      final isPaid = isInvoiceFullyPaid(i.id);
      switch (status) {
        case 'paid':
          return isPaid;
        case 'unpaid':
          return !isPaid;
        case 'overdue':
          // Add logic to check if invoice is overdue based on due date
          return !isPaid;
        default:
          return true;
      }
    }).toList();
  }

  // Get payments by date range
  List<RecordModel> getPaymentsByDateRange(DateTime startDate, DateTime endDate) {
    return _payments.where((p) {
      final paymentDate = DateTime.tryParse(p.getStringValue('created'));
      if (paymentDate == null) return false;
      
      return paymentDate.isAfter(startDate) && paymentDate.isBefore(endDate);
    }).toList();
  }

  // Search invoices
  List<RecordModel> searchInvoices(String query) {
    if (query.isEmpty) return _invoices;
    
    return _invoices.where((i) {
      final invoiceNumber = i.getStringValue('invoice_number');
      final studentName = i.getStringValue('student_name');
      final searchQuery = query.toLowerCase();
      
      return invoiceNumber.toLowerCase().contains(searchQuery) ||
             studentName.toLowerCase().contains(searchQuery);
    }).toList();
  }

  // Search payments
  List<RecordModel> searchPayments(String query) {
    if (query.isEmpty) return _payments;
    
    return _payments.where((p) {
      final paymentMethod = p.getStringValue('payment_method');
      final studentName = p.getStringValue('student_name');
      final searchQuery = query.toLowerCase();
      
      return paymentMethod.toLowerCase().contains(searchQuery) ||
             studentName.toLowerCase().contains(searchQuery);
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
