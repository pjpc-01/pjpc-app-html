import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pocketbase/pocketbase.dart';
import '../../../shared/services/pocketbase_service.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../core/theme/app_theme.dart';

class AddEditCenterScreen extends StatefulWidget {
  final dynamic centerData;
  
  const AddEditCenterScreen({super.key, this.centerData});

  @override
  State<AddEditCenterScreen> createState() => _AddEditCenterScreenState();
}

class _AddEditCenterScreenState extends State<AddEditCenterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _codeController = TextEditingController();
  final _addressController = TextEditingController();
  final _phoneController = TextEditingController();
  final _managerController = TextEditingController();
  final _emailController = TextEditingController();
  final _descriptionController = TextEditingController();
  
  String _selectedStatus = 'active';
  bool _isLoading = false;
  
  final List<String> _statuses = ['active', 'inactive'];
  final List<String> _statusDisplayNames = ['活跃', '停用'];

  @override
  void initState() {
    super.initState();
    if (widget.centerData != null) {
      _loadCenterData();
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _codeController.dispose();
    _addressController.dispose();
    _phoneController.dispose();
    _managerController.dispose();
    _emailController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _loadCenterData() {
    final center = widget.centerData;
    _nameController.text = center.getStringValue('name') ?? '';
    _codeController.text = center.getStringValue('code') ?? '';
    _addressController.text = center.getStringValue('address') ?? '';
    _phoneController.text = center.getStringValue('phone') ?? '';
    _managerController.text = center.getStringValue('manager') ?? '';
    _emailController.text = center.getStringValue('email') ?? '';
    _descriptionController.text = center.getStringValue('description') ?? '';
    _selectedStatus = center.getStringValue('status') ?? 'active';
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        if (!authProvider.isAdmin) {
          return Scaffold(
            backgroundColor: const Color(0xFFF8FAFC),
            appBar: AppBar(
              title: const Text('权限不足'),
              backgroundColor: const Color(0xFF1E3A8A),
              foregroundColor: Colors.white,
            ),
            body: const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.lock_rounded, size: 64, color: Color(0xFF64748B)),
                  SizedBox(height: 16),
                  Text(
                    '权限不足',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 8),
                  Text('只有管理员可以添加或编辑分行'),
                ],
              ),
            ),
          );
        }

        final isEdit = widget.centerData != null;
        
        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: AppBar(
            title: Text(
              isEdit ? '编辑分行' : '添加分行',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            backgroundColor: const Color(0xFF1E3A8A),
            foregroundColor: Colors.white,
            elevation: 0,
            actions: [
              if (isEdit)
                IconButton(
                  icon: const Icon(Icons.delete_rounded),
                  onPressed: _showDeleteDialog,
                ),
            ],
          ),
          body: Form(
            key: _formKey,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _buildBasicInfoCard(),
                  const SizedBox(height: 16),
                  _buildContactInfoCard(),
                  const SizedBox(height: 16),
                  _buildStatusCard(),
                  const SizedBox(height: 24),
                  _buildActionButtons(),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildBasicInfoCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.business, color: Colors.blue[600], size: 20),
                const SizedBox(width: 8),
                Text(
                  '基本信息',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue[600],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _nameController,
              label: '分行名称',
              icon: Icons.business,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return '请输入分行名称';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _codeController,
              label: '分行代码',
              icon: Icons.tag,
              hintText: '如：WX 01, WX 02',
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return '请输入分行代码';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _addressController,
              label: '分行地址',
              icon: Icons.location_on,
              maxLines: 2,
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _descriptionController,
              label: '分行描述',
              icon: Icons.description,
              maxLines: 3,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactInfoCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.contact_phone, color: Colors.green[600], size: 20),
                const SizedBox(width: 8),
                Text(
                  '联系信息',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.green[600],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildTextField(
                    controller: _phoneController,
                    label: '联系电话',
                    icon: Icons.phone,
                    keyboardType: TextInputType.phone,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildTextField(
                    controller: _emailController,
                    label: '邮箱地址',
                    icon: Icons.email,
                    keyboardType: TextInputType.emailAddress,
                    validator: (value) {
                      if (value != null && value.isNotEmpty) {
                        if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                          return '请输入有效的邮箱地址';
                        }
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _managerController,
              label: '负责人',
              icon: Icons.person,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.settings, color: Colors.orange[600], size: 20),
                const SizedBox(width: 8),
                Text(
                  '状态设置',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.orange[600],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedStatus,
              decoration: InputDecoration(
                labelText: '分行状态',
                prefixIcon: const Icon(Icons.toggle_on),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
              items: _statuses.asMap().entries.map((entry) {
                return DropdownMenuItem(
                  value: entry.value,
                  child: Text(_statusDisplayNames[entry.key]),
                );
              }).toList(),
              onChanged: (value) => setState(() => _selectedStatus = value!),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    int maxLines = 1,
    String? hintText,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        hintText: hintText,
        prefixIcon: Icon(icon),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFF3B82F6)),
        ),
      ),
    );
  }

  Widget _buildActionButtons() {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: () => Navigator.pop(context),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              side: const BorderSide(color: Color(0xFF64748B)),
            ),
            child: const Text(
              '取消',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Color(0xFF64748B),
              ),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: ElevatedButton(
            onPressed: _isLoading ? null : _saveCenter,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3B82F6),
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : Text(
                    widget.centerData != null ? '更新' : '保存',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
          ),
        ),
      ],
    );
  }

  Future<void> _saveCenter() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final pocketBaseService = Provider.of<PocketBaseService>(context, listen: false);
      
      final centerData = {
        'name': _nameController.text.trim(),
        'code': _codeController.text.trim(),
        'address': _addressController.text.trim(),
        'phone': _phoneController.text.trim(),
        'manager': _managerController.text.trim(),
        'email': _emailController.text.trim(),
        'description': _descriptionController.text.trim(),
        'status': _selectedStatus,
      };

      bool success;
      if (widget.centerData != null) {
        success = await pocketBaseService.updateCenter(widget.centerData.id, centerData);
      } else {
        success = await pocketBaseService.createCenter(centerData);
      }

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.centerData != null ? '分行信息已更新' : '分行已添加',
            ),
            backgroundColor: const Color(0xFF10B981),
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('保存失败: $e'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _showDeleteDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('删除分行'),
        content: Text('确定要删除分行 "${widget.centerData.getStringValue('name')}" 吗？此操作不可撤销。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final pocketBaseService = Provider.of<PocketBaseService>(context, listen: false);
              final success = await pocketBaseService.deleteCenter(widget.centerData.id);
              if (success && mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('已删除分行 "${widget.centerData.getStringValue('name')}"'),
                    backgroundColor: const Color(0xFF10B981),
                  ),
                );
                Navigator.pop(context);
              }
            },
            child: const Text('删除'),
          ),
        ],
      ),
    );
  }
}
