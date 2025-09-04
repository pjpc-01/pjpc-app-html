import 'package:flutter/material.dart';
import 'package:pocketbase/pocketbase.dart';

class InvoiceCard extends StatelessWidget {
  final RecordModel invoice;
  final VoidCallback? onTap;

  const InvoiceCard({
    super.key,
    required this.invoice,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final invoiceNumber = invoice.getStringValue('invoice_number');
    final studentName = invoice.getStringValue('student_name');
    final totalAmount = invoice.getDoubleValue('total_amount');
    final status = invoice.getStringValue('status');
    final dueDate = invoice.getStringValue('due_date');
    
    final isPaid = status == 'paid';
    final color = isPaid ? Colors.green : Colors.orange;
    
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
                    invoiceNumber,
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
                      isPaid ? '已支付' : '待支付',
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
              Text(
                studentName,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'RM ${totalAmount.toStringAsFixed(2)}',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                  if (dueDate.isNotEmpty)
                    Text(
                      '到期: ${_formatDate(dueDate)}',
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

  String _formatDate(String dateString) {
    if (dateString.isEmpty) return '未知';
    try {
      final date = DateTime.parse(dateString);
      return '${date.month}/${date.day}';
    } catch (e) {
      return '未知';
    }
  }
}
