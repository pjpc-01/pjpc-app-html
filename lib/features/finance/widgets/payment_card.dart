import 'package:flutter/material.dart';
import 'package:pocketbase/pocketbase.dart';

class PaymentCard extends StatelessWidget {
  final RecordModel payment;
  final VoidCallback? onTap;

  const PaymentCard({
    super.key,
    required this.payment,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final studentName = payment.getStringValue('student_name');
    final amount = payment.getDoubleValue('amount');
    final paymentMethod = payment.getStringValue('payment_method');
    final paymentDate = payment.getStringValue('created');
    final status = payment.getStringValue('status');
    
    final isSuccess = status == 'success';
    final color = isSuccess ? Colors.green : Colors.orange;
    
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    studentName,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      isSuccess ? '成功' : '处理中',
                      style: TextStyle(
                        color: color,
                        fontWeight: FontWeight.w500,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(
                    _getPaymentMethodIcon(paymentMethod),
                    size: 16,
                    color: Colors.grey[600],
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _getPaymentMethodName(paymentMethod),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'RM ${amount.toStringAsFixed(2)}',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                  Text(
                    _formatDate(paymentDate),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _getPaymentMethodIcon(String method) {
    switch (method.toLowerCase()) {
      case 'cash':
        return Icons.money;
      case 'card':
        return Icons.credit_card;
      case 'bank_transfer':
        return Icons.account_balance;
      case 'online':
        return Icons.payment;
      default:
        return Icons.payment;
    }
  }

  String _getPaymentMethodName(String method) {
    switch (method.toLowerCase()) {
      case 'cash':
        return '现金';
      case 'card':
        return '银行卡';
      case 'bank_transfer':
        return '银行转账';
      case 'online':
        return '在线支付';
      default:
        return method;
    }
  }

  String _formatDate(String dateString) {
    if (dateString.isEmpty) return '未知';
    try {
      final date = DateTime.parse(dateString);
      return '${date.month}/${date.day} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return '未知';
    }
  }
}
