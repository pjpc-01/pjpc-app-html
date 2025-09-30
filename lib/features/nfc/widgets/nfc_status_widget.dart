import 'package:flutter/material.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import '../../../core/theme/app_theme.dart';

/// NFC状态显示组件
class NfcStatusWidget extends StatefulWidget {
  final bool isSmallScreen;
  
  const NfcStatusWidget({
    super.key,
    required this.isSmallScreen,
  });

  @override
  State<NfcStatusWidget> createState() => _NfcStatusWidgetState();
}

class _NfcStatusWidgetState extends State<NfcStatusWidget> {
  bool _isNfcAvailable = false;
  String _nfcStatus = '检查NFC状态...';
  bool _isChecking = true;

  @override
  void initState() {
    super.initState();
    _checkNfcStatus();
  }

  Future<void> _checkNfcStatus() async {
    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      setState(() {
        _isNfcAvailable = availability == NFCAvailability.available;
        _nfcStatus = _isNfcAvailable ? 'NFC功能正常' : 'NFC功能不可用';
        _isChecking = false;
      });
    } catch (e) {
      setState(() {
        _isNfcAvailable = false;
        _nfcStatus = 'NFC检查失败: $e';
        _isChecking = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(
        horizontal: widget.isSmallScreen ? 16 : 20,
        vertical: 8,
      ),
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
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _isNfcAvailable 
                ? const Color(0xFF10B981).withOpacity(0.1)
                : const Color(0xFFEF4444).withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: _isChecking
              ? SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      AppTheme.primaryColor,
                    ),
                  ),
                )
              : Icon(
                  _isNfcAvailable ? Icons.nfc : Icons.nfc_outlined,
                  color: _isNfcAvailable 
                    ? const Color(0xFF10B981)
                    : const Color(0xFFEF4444),
                  size: 24,
                ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'NFC状态',
                  style: TextStyle(
                    fontSize: widget.isSmallScreen ? 14 : 16,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _nfcStatus,
                  style: TextStyle(
                    fontSize: widget.isSmallScreen ? 12 : 14,
                    color: _isNfcAvailable 
                      ? const Color(0xFF10B981)
                      : const Color(0xFFEF4444),
                  ),
                ),
              ],
            ),
          ),
          if (!_isChecking)
            TextButton(
              onPressed: _checkNfcStatus,
              child: Text(
                '重新检查',
                style: TextStyle(
                  fontSize: widget.isSmallScreen ? 12 : 14,
                  color: AppTheme.primaryColor,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
