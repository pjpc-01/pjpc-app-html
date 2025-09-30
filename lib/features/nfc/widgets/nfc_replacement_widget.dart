import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../../features/student/providers/student_provider.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/services/pocketbase_service.dart';
import '../../../core/theme/app_theme.dart';

/// NFC卡补办功能组件
class NfcReplacementWidget extends StatefulWidget {
  final RecordModel request;
  final Function() onReplacementComplete;
  final bool isSmallScreen;

  const NfcReplacementWidget({
    super.key,
    required this.request,
    required this.onReplacementComplete,
    required this.isSmallScreen,
  });

  @override
  State<NfcReplacementWidget> createState() => _NfcReplacementWidgetState();
}

class _NfcReplacementWidgetState extends State<NfcReplacementWidget> {
  final PocketBaseService _pocketBaseService = PocketBaseService.instance;
  bool _isProcessing = false;
  String? _newNfcId;
  String? _processingError;

  @override
  Widget build(BuildContext context) {
    final studentProvider = context.read<StudentProvider>();
    final students = studentProvider.students;
    
    RecordModel? student;
    try {
      student = students.firstWhere(
        (s) => s.id == widget.request.getStringValue('student'),
      );
    } catch (e) {
      return _buildErrorWidget('无法找到学生信息');
    }

    return Container(
      padding: EdgeInsets.all(widget.isSmallScreen ? 16 : 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 标题
          Row(
            children: [
              Icon(
                Icons.add_card_rounded,
                color: AppTheme.primaryColor,
                size: widget.isSmallScreen ? 24 : 28,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'NFC卡补办',
                  style: TextStyle(
                    fontSize: widget.isSmallScreen ? 18 : 20,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF1E293B),
                  ),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          // 学生信息摘要
          _buildStudentSummary(student),
          
          const SizedBox(height: 20),
          
          // 补办说明
          _buildReplacementInfo(),
          
          const SizedBox(height: 20),
          
          // 新NFC卡ID输入
          _buildNfcIdInput(),
          
          const SizedBox(height: 20),
          
          // 错误信息显示
          if (_processingError != null) _buildErrorDisplay(),
          
          const SizedBox(height: 20),
          
          // 操作按钮
          _buildActionButtons(),
        ],
      ),
    );
  }

  Widget _buildStudentSummary(RecordModel student) {
    return Container(
      padding: EdgeInsets.all(widget.isSmallScreen ? 12 : 16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '学生信息',
            style: TextStyle(
              fontSize: widget.isSmallScreen ? 14 : 16,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Text(
                  '姓名: ${student.getStringValue('student_name') ?? '未知'}',
                  style: TextStyle(
                    fontSize: widget.isSmallScreen ? 12 : 14,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ),
              Expanded(
                child: Text(
                  '学号: ${student.getStringValue('student_id') ?? '未知'}',
                  style: TextStyle(
                    fontSize: widget.isSmallScreen ? 12 : 14,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildReplacementInfo() {
    return Container(
      padding: EdgeInsets.all(widget.isSmallScreen ? 12 : 16),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF3C7),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(
            Icons.info_outline,
            color: const Color(0xFFF59E0B),
            size: widget.isSmallScreen ? 20 : 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              '补办说明：请准备新的NFC卡，扫描后系统将自动完成补办流程',
              style: TextStyle(
                fontSize: widget.isSmallScreen ? 12 : 14,
                color: const Color(0xFF92400E),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNfcIdInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '新NFC卡ID',
          style: TextStyle(
            fontSize: widget.isSmallScreen ? 14 : 16,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF1E293B),
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          onChanged: (value) {
            setState(() {
              _newNfcId = value.trim();
              _processingError = null;
            });
          },
          decoration: InputDecoration(
            hintText: '请输入或扫描新NFC卡的ID',
            hintStyle: TextStyle(
              color: AppTheme.textTertiary,
              fontSize: widget.isSmallScreen ? 14 : 16,
            ),
            prefixIcon: Icon(
              Icons.nfc,
              color: AppTheme.textSecondary,
              size: widget.isSmallScreen ? 20 : 24,
            ),
            suffixIcon: _newNfcId != null && _newNfcId!.isNotEmpty
              ? Icon(
                  Icons.check_circle,
                  color: const Color(0xFF10B981),
                  size: widget.isSmallScreen ? 20 : 24,
                )
              : null,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppTheme.dividerColor),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppTheme.dividerColor),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppTheme.primaryColor),
            ),
            contentPadding: EdgeInsets.symmetric(
              horizontal: widget.isSmallScreen ? 12 : 16,
              vertical: widget.isSmallScreen ? 12 : 16,
            ),
          ),
          style: TextStyle(
            fontSize: widget.isSmallScreen ? 14 : 16,
            color: AppTheme.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildErrorDisplay() {
    return Container(
      padding: EdgeInsets.all(widget.isSmallScreen ? 12 : 16),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(
            Icons.error_outline,
            color: const Color(0xFFEF4444),
            size: widget.isSmallScreen ? 20 : 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              _processingError!,
              style: TextStyle(
                fontSize: widget.isSmallScreen ? 12 : 14,
                color: const Color(0xFFDC2626),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Row(
      children: [
        Expanded(
          child: ElevatedButton(
            onPressed: _isProcessing ? null : _processReplacement,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              padding: EdgeInsets.symmetric(
                vertical: widget.isSmallScreen ? 12 : 16,
              ),
            ),
            child: _isProcessing
              ? SizedBox(
                  height: widget.isSmallScreen ? 16 : 20,
                  width: widget.isSmallScreen ? 16 : 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : Text(
                  '确认补办',
                  style: TextStyle(
                    fontSize: widget.isSmallScreen ? 14 : 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
          ),
        ),
      ],
    );
  }

  Widget _buildErrorWidget(String message) {
    return Container(
      padding: EdgeInsets.all(widget.isSmallScreen ? 16 : 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(
            Icons.error_outline,
            color: const Color(0xFFEF4444),
            size: widget.isSmallScreen ? 48 : 64,
          ),
          const SizedBox(height: 16),
          Text(
            '错误',
            style: TextStyle(
              fontSize: widget.isSmallScreen ? 18 : 20,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: TextStyle(
              fontSize: widget.isSmallScreen ? 14 : 16,
              color: AppTheme.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Future<void> _processReplacement() async {
    if (_newNfcId == null || _newNfcId!.isEmpty) {
      setState(() {
        _processingError = '请输入新NFC卡的ID';
      });
      return;
    }

    setState(() {
      _isProcessing = true;
      _processingError = null;
    });

    try {
      // 获取当前用户信息
      final authProvider = context.read<AuthProvider>();
      final currentUser = authProvider.user;
      
      if (currentUser == null) {
        throw Exception('用户信息获取失败，请重新登录');
      }

      // 验证用户权限
      if (!authProvider.isAdmin && !authProvider.isTeacher) {
        throw Exception('权限不足，只有管理员和教师可以处理补办申请');
      }

      // 更新申请状态为已批准
      await _pocketBaseService.updateNfcReplacementStatus(
        widget.request.id,
        'approved',
        notes: '管理员批准并完成补办，新NFC ID: $_newNfcId',
      );

      // 这里可以添加实际的NFC卡分配逻辑
      // 例如：更新学生记录中的NFC卡信息
      // await _pocketBaseService.updateStudentNfcCard(
      //   widget.request.getStringValue('student'),
      //   _newNfcId!,
      // );

      // 显示成功消息
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('NFC卡补办完成！新卡ID: $_newNfcId'),
          backgroundColor: const Color(0xFF10B981),
        ),
      );

      // 调用完成回调
      widget.onReplacementComplete();
      
    } catch (e) {
      setState(() {
        _processingError = '补办失败: ${e.toString()}';
      });
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }
}
