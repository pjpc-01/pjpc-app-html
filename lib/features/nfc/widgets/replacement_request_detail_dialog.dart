import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../../features/student/providers/student_provider.dart';
import '../../../core/theme/app_theme.dart';
import 'nfc_replacement_widget.dart';

/// 补办申请详情对话框
class ReplacementRequestDetailDialog extends StatelessWidget {
  final RecordModel request;
  final Function(String) onApprove;
  final Function(String) onReject;
  final bool isSmallScreen;

  const ReplacementRequestDetailDialog({
    super.key,
    required this.request,
    required this.onApprove,
    required this.onReject,
    required this.isSmallScreen,
  });

  @override
  Widget build(BuildContext context) {
    final studentProvider = context.read<StudentProvider>();
    final students = studentProvider.students;
    
    // 安全获取学生信息
    RecordModel? student;
    try {
      student = students.firstWhere(
        (s) => s.id == request.getStringValue('student'),
      );
    } catch (e) {
      // 如果找不到学生，显示错误信息
      return _buildErrorDialog(context);
    }

    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: Container(
        width: isSmallScreen ? double.infinity : 500,
        padding: EdgeInsets.all(isSmallScreen ? 16 : 24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 标题
            Row(
              children: [
                Icon(
                  Icons.assignment_rounded,
                  color: AppTheme.primaryColor,
                  size: isSmallScreen ? 24 : 28,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    '补办申请详情',
                    style: TextStyle(
                      fontSize: isSmallScreen ? 18 : 20,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF1E293B),
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            
            const SizedBox(height: 20),
            
            // 学生信息
            _buildInfoSection(
              '学生信息',
              Icons.person_rounded,
              [
                _buildInfoRow('姓名', student.getStringValue('student_name') ?? '未知'),
                _buildInfoRow('学号', student.getStringValue('student_id') ?? '未知'),
                _buildInfoRow('年级', student.getStringValue('standard') ?? '未知'),
                _buildInfoRow('班级', student.getStringValue('class_name') ?? '未知'),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // 申请信息
            _buildInfoSection(
              '申请信息',
              Icons.assignment_rounded,
              [
                _buildInfoRow('申请时间', _formatDateTime(request.created)),
                _buildInfoRow('丢失原因', request.getStringValue('replacement_reason') ?? '未知'),
                _buildInfoRow('丢失地点', request.getStringValue('replacement_lost_location') ?? '未知'),
                _buildInfoRow('丢失时间', _formatDateTime(request.getStringValue('replacement_lost_date'))),
                _buildInfoRow('紧急程度', _getUrgencyText(request.getStringValue('replacement_urgency'))),
                _buildInfoRow('状态', _getStatusText(request.getStringValue('replacement_status'))),
              ],
            ),
            
            // 备注
            if (request.getStringValue('replacement_notes')?.isNotEmpty == true) ...[
              const SizedBox(height: 16),
              _buildInfoSection(
                '备注',
                Icons.note_rounded,
                [
                  _buildInfoRow('', request.getStringValue('replacement_notes') ?? ''),
                ],
              ),
            ],
            
            const SizedBox(height: 24),
            
            // 操作按钮
            if (request.getStringValue('replacement_status') == 'pending') ...[
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => _showReplacementDialog(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: EdgeInsets.symmetric(
                          vertical: isSmallScreen ? 12 : 16,
                        ),
                      ),
                      child: Text(
                        '处理补办',
                        style: TextStyle(
                          fontSize: isSmallScreen ? 14 : 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        onReject(request.id);
                        Navigator.of(context).pop();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFEF4444),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: EdgeInsets.symmetric(
                          vertical: isSmallScreen ? 12 : 16,
                        ),
                      ),
                      child: Text(
                        '拒绝申请',
                        style: TextStyle(
                          fontSize: isSmallScreen ? 14 : 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ] else ...[
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: EdgeInsets.symmetric(
                      vertical: isSmallScreen ? 12 : 16,
                    ),
                  ),
                  child: Text(
                    '关闭',
                    style: TextStyle(
                      fontSize: isSmallScreen ? 14 : 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoSection(String title, IconData icon, List<Widget> children) {
    return Container(
      padding: EdgeInsets.all(isSmallScreen ? 12 : 16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                icon,
                color: AppTheme.primaryColor,
                size: isSmallScreen ? 16 : 20,
              ),
              const SizedBox(width: 8),
              Text(
                title,
                style: TextStyle(
                  fontSize: isSmallScreen ? 14 : 16,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF1E293B),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (label.isNotEmpty) ...[
            SizedBox(
              width: isSmallScreen ? 60 : 80,
              child: Text(
                label,
                style: TextStyle(
                  fontSize: isSmallScreen ? 12 : 14,
                  color: AppTheme.textSecondary,
                ),
              ),
            ),
            const SizedBox(width: 8),
          ],
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: isSmallScreen ? 12 : 14,
                color: const Color(0xFF1E293B),
                fontWeight: label.isNotEmpty ? FontWeight.w500 : FontWeight.normal,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDateTime(String? dateTime) {
    if (dateTime == null || dateTime.isEmpty) return '未知';
    try {
      final date = DateTime.parse(dateTime);
      return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateTime;
    }
  }

  String _getUrgencyText(String? urgency) {
    switch (urgency) {
      case 'low':
        return '低';
      case 'medium':
        return '中';
      case 'high':
        return '高';
      default:
        return urgency ?? '未知';
    }
  }

  String _getStatusText(String? status) {
    switch (status) {
      case 'pending':
        return '待处理';
      case 'approved':
        return '已批准';
      case 'rejected':
        return '已拒绝';
      default:
        return status ?? '未知';
    }
  }

  Widget _buildErrorDialog(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: Container(
        width: isSmallScreen ? double.infinity : 400,
        padding: EdgeInsets.all(isSmallScreen ? 16 : 24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline,
              color: const Color(0xFFEF4444),
              size: isSmallScreen ? 48 : 64,
            ),
            const SizedBox(height: 16),
            Text(
              '数据错误',
              style: TextStyle(
                fontSize: isSmallScreen ? 18 : 20,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '无法找到对应的学生信息，请刷新页面后重试',
              style: TextStyle(
                fontSize: isSmallScreen ? 14 : 16,
                color: AppTheme.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: EdgeInsets.symmetric(
                    vertical: isSmallScreen ? 12 : 16,
                  ),
                ),
                child: Text(
                  '关闭',
                  style: TextStyle(
                    fontSize: isSmallScreen ? 14 : 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showReplacementDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        child: Container(
          width: isSmallScreen ? double.infinity : 600,
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.8,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // 标题栏
              Container(
                padding: EdgeInsets.all(isSmallScreen ? 16 : 20),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
                  ),
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.add_card_rounded,
                      color: Colors.white,
                      size: isSmallScreen ? 24 : 28,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'NFC卡补办处理',
                        style: TextStyle(
                          fontSize: isSmallScreen ? 18 : 20,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.close, color: Colors.white),
                    ),
                  ],
                ),
              ),
              
              // 补办组件 - 使用固定高度而不是Flexible
              SizedBox(
                height: 500, // 固定高度，避免布局问题
                child: SingleChildScrollView(
                  child: NfcReplacementWidget(
                    request: request,
                    onReplacementComplete: () {
                      Navigator.of(context).pop(); // 关闭补办对话框
                      Navigator.of(context).pop(); // 关闭详情对话框
                      onApprove(request.id); // 触发列表刷新
                    },
                    isSmallScreen: isSmallScreen,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
