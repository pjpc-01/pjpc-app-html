import 'package:flutter/material.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import '../../../core/constants/nfc_constants.dart';

/// 优化的NFC状态Widget - 使用状态管理避免重复重建
class NFCOptimizedStatus extends StatefulWidget {
  final bool isSmallScreen;
  
  const NFCOptimizedStatus({
    super.key,
    required this.isSmallScreen,
  });

  @override
  State<NFCOptimizedStatus> createState() => _NFCOptimizedStatusState();
}

class _NFCOptimizedStatusState extends State<NFCOptimizedStatus> {
  bool _isNfcAvailable = false;
  String _nfcStatus = NFCConstants.nfcStatusChecking;
  bool _isChecking = true;

  @override
  void initState() {
    super.initState();
    _checkNfcStatus();
  }

  Future<void> _checkNfcStatus() async {
    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      if (mounted) {
        setState(() {
          _isNfcAvailable = availability == NFCAvailability.available;
          _nfcStatus = _isNfcAvailable 
              ? NFCConstants.nfcStatusAvailable 
              : NFCConstants.nfcStatusUnavailable;
          _isChecking = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isNfcAvailable = false;
          _nfcStatus = 'NFC检查失败: $e';
          _isChecking = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.all(widget.isSmallScreen ? 12 : 16),
      padding: EdgeInsets.all(widget.isSmallScreen ? 16 : 20),
      decoration: BoxDecoration(
        color: Color(NFCConstants.cardColor),
        borderRadius: BorderRadius.circular(NFCConstants.cardBorderRadius),
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
            width: widget.isSmallScreen ? 48 : 56,
            height: widget.isSmallScreen ? 48 : 56,
            decoration: BoxDecoration(
              color: _isNfcAvailable 
                  ? Color(NFCConstants.successColor).withOpacity(0.1)
                  : Color(NFCConstants.errorColor).withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              _isNfcAvailable ? Icons.nfc : Icons.nfc_outlined,
              color: _isNfcAvailable 
                  ? Color(NFCConstants.successColor)
                  : Color(NFCConstants.errorColor),
              size: widget.isSmallScreen ? 24 : 28,
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
                    fontSize: widget.isSmallScreen ? 16 : 18,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _nfcStatus,
                  style: TextStyle(
                    fontSize: widget.isSmallScreen ? 14 : 16,
                    color: _isNfcAvailable 
                        ? Color(NFCConstants.successColor)
                        : Color(NFCConstants.errorColor),
                  ),
                ),
              ],
            ),
          ),
          if (_isChecking)
            const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          else
            IconButton(
              onPressed: _checkNfcStatus,
              icon: const Icon(Icons.refresh),
              tooltip: '刷新NFC状态',
            ),
        ],
      ),
    );
  }
}

