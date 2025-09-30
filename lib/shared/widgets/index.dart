/// 通用组件库
/// 
/// 这个库包含了应用中常用的通用组件，旨在：
/// - 减少重复代码
/// - 保持UI一致性
/// - 提高开发效率
/// - 便于维护和更新

// UI组件
export 'unified_ui_components.dart';
export 'unified_dialog_components.dart';
export 'unified_components.dart';

// 学生相关组件
export '../student/student_header_widget.dart';
export '../student/student_overview_widget.dart';
export '../student/student_search_widget.dart';
export '../student/student_list_widget.dart';

/// 通用组件使用指南
/// 
/// 1. 加载组件
/// ```dart
/// UnifiedLoadingWidget(message: '加载中...')
/// ```
/// 
/// 2. 空状态组件
/// ```dart
/// UnifiedEmptyStateWidget(
///   title: '暂无数据',
///   subtitle: '请稍后再试',
///   icon: Icons.inbox_outlined,
/// )
/// ```
/// 
/// 3. 错误状态组件
/// ```dart
/// UnifiedErrorStateWidget(
///   title: '加载失败',
///   subtitle: '网络连接异常',
///   onRetry: () => retry(),
/// )
/// ```
/// 
/// 4. 列表项组件
/// ```dart
/// UnifiedListItemWidget(
///   title: '标题',
///   subtitle: '副标题',
///   leadingIcon: Icons.person,
///   onTap: () => navigate(),
/// )
/// ```
/// 
/// 5. 统计卡片组件
/// ```dart
/// UnifiedStatCardWidget(
///   title: '总用户数',
///   value: '1,234',
///   icon: Icons.people,
///   color: Colors.blue,
/// )
/// ```
/// 
/// 6. 搜索栏组件
/// ```dart
/// UnifiedSearchBarWidget(
///   hintText: '搜索...',
///   onChanged: (query) => search(query),
/// )
/// ```
/// 
/// 7. 确认对话框
/// ```dart
/// UnifiedConfirmDialog.show(
///   context,
///   title: '确认删除',
///   content: '此操作不可撤销',
///   onConfirm: () => delete(),
/// )
/// ```
/// 
/// 8. 输入对话框
/// ```dart
/// UnifiedInputDialog.show(
///   context,
///   title: '输入名称',
///   hintText: '请输入名称',
///   onConfirm: (value) => save(value),
/// )
/// ```
/// 
/// 9. 底部操作栏
/// ```dart
/// UnifiedBottomActionBar(
///   actions: [
///     Expanded(child: ElevatedButton(...)),
///     SizedBox(width: 8),
///     Expanded(child: OutlinedButton(...)),
///   ],
/// )
/// ```
/// 
/// 10. 标签组件
/// ```dart
/// UnifiedTagWidget(
///   text: '标签',
///   backgroundColor: Colors.blue,
///   textColor: Colors.white,
/// )
/// ```
/// 
/// 11. 头像组件
/// ```dart
/// UnifiedAvatarWidget(
///   imageUrl: 'https://example.com/avatar.jpg',
///   name: '张三',
///   size: 50,
/// )
/// ```
/// 
/// 12. 分割线组件
/// ```dart
/// UnifiedDividerWidget(height: 1, margin: EdgeInsets.all(16))
/// ```
/// 
/// 13. 间距组件
/// ```dart
/// UnifiedSpacingWidget(height: 20)
/// ```
