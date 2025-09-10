import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/nfc_card_provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';

class NfcReplacementRequestDialog extends StatefulWidget {
  final dynamic student;

  const NfcReplacementRequestDialog({
    super.key,
    required this.student,
  });

  @override
  State<NfcReplacementRequestDialog> createState() => _NfcReplacementRequestDialogState();
}

class _NfcReplacementRequestDialogState extends State<NfcReplacementRequestDialog> {
  final _formKey = GlobalKey<FormState>();
  final _reasonController = TextEditingController();
  final _locationController = TextEditingController();
  final _notesController = TextEditingController();
  
  String _selectedReason = '丢失';
  String _selectedUrgency = 'normal';
  DateTime _lostDate = DateTime.now();

  final List<String> _reasons = [
    '丢失',
    '损坏',
    '无法读取',
    '其他',
  ];

  final List<Map<String, String>> _urgencyLevels = [
    {'value': 'low', 'label': '低'},
    {'value': 'normal', 'label': '普通'},
    {'value': 'high', 'label': '高'},
    {'value': 'urgent', 'label': '紧急'},
  ];

  @override
  void dispose() {
    _reasonController.dispose();
    _locationController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  // 安全获取字符串值的方法
  String _getStringValue(dynamic data, String key) {
    if (data == null) return '';
    
    try {
      // 如果是RecordModel类型，直接使用getStringValue方法
      if (data.runtimeType.toString().contains('RecordModel')) {
        return data.getStringValue(key) ?? '';
      }
      
      // 如果是Map类型
      if (data is Map<String, dynamic>) {
        return data[key]?.toString() ?? '';
      }
      
      // 尝试使用getStringValue方法（RecordModel类型）
      return data.getStringValue(key) ?? '';
    } catch (e) {
      // 如果出错，返回空字符串
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final studentName = _getStringValue(widget.student, 'student_name');
    final studentId = _getStringValue(widget.student, 'student_id');
    final className = _getStringValue(widget.student, 'standard');
    
    // 确保学生姓名不为空
    final displayName = studentName.isNotEmpty ? studentName : '未知学生';

    return AlertDialog(
      title: Row(
        children: [
          CircleAvatar(
            backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
            child: Text(
              displayName.isNotEmpty ? displayName[0].toUpperCase() : '?',
              style: const TextStyle(
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'NFC卡补办申请',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                ),
                Text(
                  displayName,
                  style: TextStyle(
                    fontSize: 14,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 学生信息
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
                      '学生信息',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text('姓名: $displayName'),
                    Text('学号: $studentId'),
                    Text('班级: $className'),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              
              // 丢失原因
              Text(
                '丢失原因 *',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _selectedReason,
                decoration: InputDecoration(
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
                items: _reasons.map((reason) {
                  return DropdownMenuItem(
                    value: reason,
                    child: Text(reason),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedReason = value!;
                  });
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return '请选择丢失原因';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // 丢失时间
              Text(
                '丢失时间 *',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              InkWell(
                onTap: () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: _lostDate,
                    firstDate: DateTime.now().subtract(const Duration(days: 30)),
                    lastDate: DateTime.now(),
                  );
                  if (date != null) {
                    setState(() {
                      _lostDate = date;
                    });
                  }
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppTheme.textSecondary),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.calendar_today, size: 20, color: AppTheme.textSecondary),
                      const SizedBox(width: 8),
                      Text(
                        '${_lostDate.year}-${_lostDate.month.toString().padLeft(2, '0')}-${_lostDate.day.toString().padLeft(2, '0')}',
                        style: const TextStyle(fontSize: 16),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // 丢失地点
              Text(
                '丢失地点 *',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _locationController,
                decoration: InputDecoration(
                  hintText: '请输入丢失地点',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return '请输入丢失地点';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // 紧急程度
              Text(
                '紧急程度 *',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _selectedUrgency,
                decoration: InputDecoration(
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
                items: _urgencyLevels.map((urgency) {
                  return DropdownMenuItem(
                    value: urgency['value'],
                    child: Text(urgency['label']!),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedUrgency = value!;
                  });
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return '请选择紧急程度';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // 备注
              Text(
                '备注',
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
                  hintText: '请输入备注信息（可选）',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('取消'),
        ),
        ElevatedButton(
          onPressed: _submitRequest,
          child: const Text('提交申请'),
        ),
      ],
    );
  }

  void _submitRequest() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final nfcProvider = Provider.of<NfcCardProvider>(context, listen: false);

    // 重新获取学生信息
    final studentName = _getStringValue(widget.student, 'student_name');
    final displayName = studentName.isNotEmpty ? studentName : '未知学生';

    final success = await nfcProvider.submitReplacementRequest(
      studentId: widget.student.id ?? _getStringValue(widget.student, 'id'),
      studentName: displayName,
      className: _getStringValue(widget.student, 'standard'),
      teacherId: authProvider.user?.id ?? '',
      reason: _selectedReason,
      lostDate: _lostDate,
      lostLocation: _locationController.text,
      urgency: _selectedUrgency,
      notes: _notesController.text.isNotEmpty ? _notesController.text : null,
    );

    if (success && mounted) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('$displayName 的NFC卡补办申请已提交'),
          backgroundColor: AppTheme.successColor,
        ),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('提交失败: ${nfcProvider.error}'),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }
}
