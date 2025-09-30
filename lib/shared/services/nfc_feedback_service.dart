import 'package:flutter/services.dart';

/// NFC反馈服务 - 管理音效和触觉反馈
class NFCFeedbackService {
  static final NFCFeedbackService _instance = NFCFeedbackService._internal();
  factory NFCFeedbackService() => _instance;
  NFCFeedbackService._internal();
  
  static NFCFeedbackService get instance => _instance;
  
  bool _isSoundEnabled = true;
  bool _isHapticEnabled = true;
  
  /// 启用/禁用音效
  void setSoundEnabled(bool enabled) {
    _isSoundEnabled = enabled;
  }
  
  /// 启用/禁用触觉反馈
  void setHapticEnabled(bool enabled) {
    _isHapticEnabled = enabled;
  }
  
  /// 播放扫描开始音效
  Future<void> playScanStartSound() async {
    if (!_isSoundEnabled) return;
    
    try {
      // 播放系统音效
      await SystemSound.play(SystemSoundType.click);
    } catch (e) {
      // 忽略音效播放错误
    }
  }
  
  /// 播放扫描成功音效
  Future<void> playScanSuccessSound() async {
    if (!_isSoundEnabled) return;
    
    try {
      // 播放成功音效
      await SystemSound.play(SystemSoundType.click);
      // 延迟播放第二个音效
      await Future.delayed(const Duration(milliseconds: 100));
      await SystemSound.play(SystemSoundType.click);
    } catch (e) {
      // 忽略音效播放错误
    }
  }
  
  /// 播放扫描失败音效
  Future<void> playScanErrorSound() async {
    if (!_isSoundEnabled) return;
    
    try {
      // 播放错误音效
      await SystemSound.play(SystemSoundType.alert);
    } catch (e) {
      // 忽略音效播放错误
    }
  }
  
  /// 播放扫描超时音效
  Future<void> playScanTimeoutSound() async {
    if (!_isSoundEnabled) return;
    
    try {
      // 播放超时音效
      await SystemSound.play(SystemSoundType.alert);
    } catch (e) {
      // 忽略音效播放错误
    }
  }
  
  /// 触觉反馈 - 扫描开始
  void hapticScanStart() {
    if (!_isHapticEnabled) return;
    
    try {
      HapticFeedback.lightImpact();
    } catch (e) {
      // 忽略触觉反馈错误
    }
  }
  
  /// 触觉反馈 - 扫描成功
  void hapticScanSuccess() {
    if (!_isHapticEnabled) return;
    
    try {
      HapticFeedback.mediumImpact();
    } catch (e) {
      // 忽略触觉反馈错误
    }
  }
  
  /// 触觉反馈 - 扫描失败
  void hapticScanError() {
    if (!_isHapticEnabled) return;
    
    try {
      HapticFeedback.heavyImpact();
    } catch (e) {
      // 忽略触觉反馈错误
    }
  }
  
  /// 触觉反馈 - 扫描超时
  void hapticScanTimeout() {
    if (!_isHapticEnabled) return;
    
    try {
      HapticFeedback.heavyImpact();
    } catch (e) {
      // 忽略触觉反馈错误
    }
  }
  
  /// 触觉反馈 - 重试
  void hapticRetry() {
    if (!_isHapticEnabled) return;
    
    try {
      HapticFeedback.selectionClick();
    } catch (e) {
      // 忽略触觉反馈错误
    }
  }
  
  /// 组合反馈 - 扫描开始
  Future<void> feedbackScanStart() async {
    hapticScanStart();
    await playScanStartSound();
  }
  
  /// 组合反馈 - 扫描成功
  Future<void> feedbackScanSuccess() async {
    hapticScanSuccess();
    await playScanSuccessSound();
  }
  
  /// 组合反馈 - 扫描失败
  Future<void> feedbackScanError() async {
    hapticScanError();
    await playScanErrorSound();
  }
  
  /// 组合反馈 - 扫描超时
  Future<void> feedbackScanTimeout() async {
    hapticScanTimeout();
    await playScanTimeoutSound();
  }
  
  /// 组合反馈 - 重试
  Future<void> feedbackRetry() async {
    hapticRetry();
  }
  
  /// 释放资源
  void dispose() {
    // 无需释放资源
  }
}
