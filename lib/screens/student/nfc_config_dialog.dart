import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/student_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common/custom_text_field.dart';
import '../../widgets/common/custom_button.dart';

class NfcConfigDialog extends StatefulWidget {
  final dynamic student;

  const NfcConfigDialog({
    super.key,
    required this.student,
  });

  @override
  State<NfcConfigDialog> createState() => _NfcConfigDialogState();
}

class _NfcConfigDialogState extends State<NfcConfigDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nfcUrlController = TextEditingController();
  final _cardNumberController = TextEditingController();
  final _cardStatusController = TextEditingController();
  
  bool _isLoading = false;
  String _selectedCardStatus = 'active';

  @override
  void initState() {
    super.initState();
    _populateForm();
  }

  @override
  void dispose() {
    _nfcUrlController.dispose();
    _cardNumberController.dispose();
    _cardStatusController.dispose();
    super.dispose();
  }

  void _populateForm() {
    final student = widget.student;
    _nfcUrlController.text = student.getStringValue('nfc_url') ?? '';
    _cardNumberController.text = student.getStringValue('cardNumber') ?? '';
    _selectedCardStatus = student.getStringValue('cardStatus') ?? 'active';
  }

  String? _getSafeDropdownValue(String? currentValue, List<String> availableOptions) {
    if (availableOptions.isEmpty) return null;
    if (currentValue == null || currentValue.isEmpty) return availableOptions.first;
    if (availableOptions.contains(currentValue)) return currentValue;
    return availableOptions.first;
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Container(
        width: MediaQuery.of(context).size.width * 0.9,
        constraints: const BoxConstraints(maxWidth: 500),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildHeader(),
              _buildContent(),
              _buildActions(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: const BoxDecoration(
        color: AppTheme.primaryColor,
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.nfc,
            color: Colors.white,
            size: 24,
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              'NFC配置 - ${widget.student.getStringValue('student_name')}',
              style: AppTextStyles.headline6.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.close, color: Colors.white),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildInfoCard(),
          const SizedBox(height: AppSpacing.lg),
          
          CustomTextField(
            controller: _nfcUrlController,
            label: 'NFC URL',
            hintText: '请输入NFC URL',
            prefixIcon: const Icon(Icons.link),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return '请输入NFC URL';
              }
              final uri = Uri.tryParse(value);
              if (uri == null || !uri.hasAbsolutePath) {
                return '请输入有效的URL';
              }
              return null;
            },
          ),
          const SizedBox(height: AppSpacing.md),
          
          CustomTextField(
            controller: _cardNumberController,
            label: '卡片编号',
            hintText: '请输入NFC卡片编号（可选）',
            prefixIcon: const Icon(Icons.credit_card),
          ),
          const SizedBox(height: AppSpacing.md),
          
          DropdownButtonFormField<String>(
            value: _getSafeDropdownValue(_selectedCardStatus, ['active', 'inactive', 'blocked', 'lost']),
            decoration: const InputDecoration(
              labelText: '卡片状态',
              prefixIcon: Icon(Icons.info_outline),
            ),
            items: const [
              DropdownMenuItem(value: 'active', child: Text('激活')),
              DropdownMenuItem(value: 'inactive', child: Text('未激活')),
              DropdownMenuItem(value: 'blocked', child: Text('已锁定')),
              DropdownMenuItem(value: 'lost', child: Text('已丢失')),
            ],
            onChanged: (value) => setState(() => _selectedCardStatus = value!),
          ),
          const SizedBox(height: AppSpacing.lg),
          
          _buildInstructions(),
        ],
      ),
    );
  }

  Widget _buildInfoCard() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppTheme.primaryColor.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(
            Icons.info_outline,
            color: AppTheme.primaryColor,
            size: 20,
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              'NFC URL是学生NFC卡片中存储的唯一标识符，用于考勤识别。',
              style: AppTextStyles.bodySmall.copyWith(
                color: AppTheme.primaryColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInstructions() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppTheme.backgroundColor,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppTheme.dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '配置说明：',
            style: AppTextStyles.bodyMedium.copyWith(
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            '1. NFC URL应该是完整的URL地址\n'
            '2. 确保URL在系统中是唯一的\n'
            '3. 卡片状态影响考勤功能的使用\n'
            '4. 保存后需要重新扫描NFC卡片才能生效',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppTheme.textSecondary,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActions() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppTheme.dividerColor)),
      ),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: _isLoading ? null : () => Navigator.pop(context),
              child: const Text('取消'),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: CustomButton(
              onPressed: _isLoading ? null : _saveNfcConfig,
              text: '保存配置',
              isLoading: _isLoading,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _saveNfcConfig() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isLoading = true);

    try {
      final updateData = {
        'nfc_url': _nfcUrlController.text.trim(),
        'cardNumber': _cardNumberController.text.trim(),
        'cardStatus': _selectedCardStatus,
      };

      final studentProvider = Provider.of<StudentProvider>(context, listen: false);
      final success = await studentProvider.updateStudent(widget.student.id, updateData);

      if (success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('NFC配置更新成功'),
              backgroundColor: AppTheme.successColor,
            ),
          );
          Navigator.pop(context);
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(studentProvider.error ?? '配置更新失败'),
              backgroundColor: AppTheme.errorColor,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('配置更新失败: $e'),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }
}
