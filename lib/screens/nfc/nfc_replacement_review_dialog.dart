import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/nfc_card_provider.dart';
import '../../theme/app_theme.dart';

class NfcReplacementReviewDialog extends StatefulWidget {
  final Map<String, dynamic> request;
  final String action; // 'approve' or 'reject'

  const NfcReplacementReviewDialog({
    super.key,
    required this.request,
    required this.action,
  });

  @override
  State<NfcReplacementReviewDialog> createState() => _NfcReplacementReviewDialogState();
}

class _NfcReplacementReviewDialogState extends State<NfcReplacementReviewDialog> {
  final _notesController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isApprove = widget.action == 'approve';
    final title = isApprove ? '批准补办申请' : '拒绝补办申请';
    final confirmText = isApprove ? '批准' : '拒绝';
    final confirmColor = isApprove ? AppTheme.successColor : AppTheme.errorColor;

    return AlertDialog(
      title: Row(
        children: [
          Icon(
            isApprove ? Icons.check_circle : Icons.cancel,
            color: confirmColor,
            size: 24,
          ),
          const SizedBox(width: 8),
          Text(title),
        ],
      ),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 申请信息
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '申请信息',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text('学生: ${_getStudentName()}'),
                  Text('学号: ${_getStudentId()}'),
                  Text('班级: ${_getClassName()}'),
                  Text('原因: ${widget.request['replacement_reason'] ?? ''}'),
                  Text('地点: ${widget.request['replacement_lost_location'] ?? ''}'),
                  Text('时间: ${_formatDateTime(DateTime.tryParse(widget.request['replacement_lost_date'] ?? '') ?? DateTime.now())}'),
                  Text('紧急程度: ${_getUrgencyText(widget.request['replacement_urgency'] ?? '')}'),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 审核备注
            Text(
              '审核备注 ${isApprove ? '' : '*'}',
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _notesController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: isApprove 
                    ? '请输入批准备注（可选）'
                    : '请输入拒绝原因',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              validator: (value) {
                if (!isApprove && (value == null || value.isEmpty)) {
                  return '请输入拒绝原因';
                }
                return null;
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('取消'),
        ),
        ElevatedButton(
          onPressed: () => _submitReview(),
          style: ElevatedButton.styleFrom(
            backgroundColor: confirmColor,
            foregroundColor: Colors.white,
          ),
          child: Text(confirmText),
        ),
      ],
    );
  }

  void _submitReview() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final nfcProvider = Provider.of<NfcCardProvider>(context, listen: false);

    final success = await nfcProvider.reviewReplacementRequest(
      widget.request['replacement_request_id'] ?? '',
      widget.action,
      notes: _notesController.text.isNotEmpty ? _notesController.text : null,
    );

    if (success && mounted) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${_getStudentName()} 的补办申请已${widget.action == 'approve' ? '批准' : '拒绝'}'),
          backgroundColor: widget.action == 'approve' ? AppTheme.successColor : AppTheme.errorColor,
        ),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('操作失败: ${nfcProvider.error}'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

  String _getStudentName() {
    final studentInfo = widget.request['expand']?['student'] as Map<String, dynamic>?;
    return studentInfo?['student_name'] ?? '未知学生';
  }

  String _getStudentId() {
    final studentInfo = widget.request['expand']?['student'] as Map<String, dynamic>?;
    return studentInfo?['student_id'] ?? '';
  }

  String _getClassName() {
    final studentInfo = widget.request['expand']?['student'] as Map<String, dynamic>?;
    return studentInfo?['standard'] ?? '';
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.year}-${dateTime.month.toString().padLeft(2, '0')}-${dateTime.day.toString().padLeft(2, '0')} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  String _getUrgencyText(String urgency) {
    switch (urgency) {
      case 'low':
        return '低';
      case 'normal':
        return '普通';
      case 'high':
        return '高';
      case 'urgent':
        return '紧急';
      default:
        return '普通';
    }
  }
}
