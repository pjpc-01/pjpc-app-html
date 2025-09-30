# 导入路径更新脚本
$importMappings = @{
    # 认证相关
    "'../../providers/auth_provider.dart'" = "'../../features/auth/providers/auth_provider.dart'"
    "'../auth/login_screen.dart'" = "'../features/auth/screens/login_screen.dart'"
    
    # 考勤相关
    "'../../providers/attendance_provider.dart'" = "'../../features/attendance/providers/attendance_provider.dart'"
    "'../attendance/attendance_dashboard_screen.dart'" = "'../features/attendance/screens/attendance_dashboard_screen.dart'"
    "'../attendance/attendance_management_screen.dart'" = "'../features/attendance/screens/attendance_management_screen.dart'"
    "'../attendance/attendance_records_screen.dart'" = "'../features/attendance/screens/attendance_records_screen.dart'"
    "'../attendance/nfc_attendance_screen.dart'" = "'../features/attendance/screens/nfc_attendance_screen.dart'"
    "'../../widgets/attendance/attendance_filters.dart'" = "'../../features/attendance/widgets/attendance_filters.dart'"
    "'../../widgets/attendance/attendance_records_list_enhanced.dart'" = "'../../features/attendance/widgets/attendance_records_list_enhanced.dart'"
    "'../../widgets/attendance/attendance_stats_grid.dart'" = "'../../features/attendance/widgets/attendance_stats_grid.dart'"
    
    # 学生相关
    "'../../providers/student_provider.dart'" = "'../../features/student/providers/student_provider.dart'"
    "'../student/student_management_screen.dart'" = "'../features/student/screens/student_management_screen.dart'"
    "'../student/add_edit_student_screen.dart'" = "'../features/student/screens/add_edit_student_screen.dart'"
    "'../student/student_detail_screen.dart'" = "'../features/student/screens/student_detail_screen.dart'"
    "'../student/student_profile_screen.dart'" = "'../features/student/screens/student_profile_screen.dart'"
    "'../student/nfc_config_dialog.dart'" = "'../features/student/screens/nfc_config_dialog.dart'"
    
    # 教师相关
    "'../../providers/teacher_provider.dart'" = "'../../features/teacher/providers/teacher_provider.dart'"
    "'../teacher/teacher_management_screen.dart'" = "'../features/teacher/screens/teacher_management_screen.dart'"
    "'../teacher/add_edit_teacher_screen.dart'" = "'../features/teacher/screens/add_edit_teacher_screen.dart'"
    "'../teacher/teacher_salary_management_screen.dart'" = "'../features/teacher/screens/teacher_salary_management_screen.dart'"
    "'../teacher/teacher_leave_management_screen.dart'" = "'../features/teacher/screens/teacher_leave_management_screen.dart'"
    "'../teacher/add_edit_salary_record_screen.dart'" = "'../features/teacher/screens/add_edit_salary_record_screen.dart'"
    "'../teacher/add_edit_salary_structure_screen.dart'" = "'../features/teacher/screens/add_edit_salary_structure_screen.dart'"
    "'../teacher/add_edit_leave_record_screen.dart'" = "'../features/teacher/screens/add_edit_leave_record_screen.dart'"
    
    # 财务相关
    "'../../providers/teacher_salary_provider.dart'" = "'../../features/finance/providers/teacher_salary_provider.dart'"
    "'../../providers/finance_provider.dart'" = "'../../features/finance/providers/finance_provider.dart'"
    "'../../providers/payment_provider.dart'" = "'../../features/finance/providers/payment_provider.dart'"
    
    # 请假相关
    "'../../providers/teacher_leave_provider.dart'" = "'../../features/leave/providers/teacher_leave_provider.dart'"
    
    # NFC相关
    "'../../providers/nfc_card_provider.dart'" = "'../../features/nfc/providers/nfc_card_provider.dart'"
    "'../nfc/nfc_management_optimized_v2.dart'" = "'../features/nfc/screens/nfc_management_optimized_v2.dart'"
    "'../nfc/nfc_read_write_screen.dart'" = "'../features/nfc/screens/nfc_read_write_screen.dart'"
    
    # 通知相关
    "'../../providers/notification_provider.dart'" = "'../../features/notification/providers/notification_provider.dart'"
    "'../notification/notification_screen.dart'" = "'../features/notification/screens/notification_screen.dart'"
    "'../notification/admin_notification_screen.dart'" = "'../features/notification/screens/admin_notification_screen.dart'"
    
    # 报表相关
    "'../reports/reports_screen.dart'" = "'../features/reports/screens/reports_screen.dart'"
    "'../reports/analytics_screen.dart'" = "'../features/reports/screens/analytics_screen.dart'"
    
    # 共享组件
    "'../../widgets/common/app_logo.dart'" = "'../../shared/widgets/app_logo.dart'"
    "'../../widgets/common/custom_button.dart'" = "'../../shared/widgets/custom_button.dart'"
    "'../../widgets/common/custom_search_bar.dart'" = "'../../shared/widgets/custom_search_bar.dart'"
    "'../../widgets/common/custom_text_field.dart'" = "'../../shared/widgets/custom_text_field.dart'"
    "'../../widgets/common/feature_card.dart'" = "'../../shared/widgets/feature_card.dart'"
    "'../../widgets/common/loading_widget.dart'" = "'../../shared/widgets/loading_widget.dart'"
    "'../../widgets/common/recent_activity_item.dart'" = "'../../shared/widgets/recent_activity_item.dart'"
    "'../../widgets/common/role_switch_button.dart'" = "'../../shared/widgets/role_switch_button.dart'"
    "'../../widgets/common/statistics_card.dart'" = "'../../shared/widgets/statistics_card.dart'"
    "'../../widgets/common/student_card.dart'" = "'../../shared/widgets/student_card.dart'"
    
    # 核心文件
    "'../../theme/app_theme.dart'" = "'../../core/theme/app_theme.dart'"
    "'../../constants/nfc_constants.dart'" = "'../../core/constants/nfc_constants.dart'"
    "'../../config/multi_role_config.dart'" = "'../../core/config/multi_role_config.dart'"
    
    # 服务文件
    "'../../services/pocketbase_service.dart'" = "'../../shared/services/pocketbase_service.dart'"
    "'../../services/permission_manager.dart'" = "'../../shared/services/permission_manager.dart'"
    "'../../services/nfc_management_service.dart'" = "'../../shared/services/nfc_management_service.dart'"
    "'../../services/error_handler_service.dart'" = "'../../shared/services/error_handler_service.dart'"
    
    # 工具文件
    "'../../utils/record_extensions.dart'" = "'../../shared/utils/record_extensions.dart'"
    "'../../utils/app_theme.dart'" = "'../../shared/utils/app_theme.dart'"
}

# 获取所有Dart文件
$dartFiles = Get-ChildItem -Path "lib" -Filter "*.dart" -Recurse

foreach ($file in $dartFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    foreach ($oldPath in $importMappings.Keys) {
        $newPath = $importMappings[$oldPath]
        $content = $content -replace [regex]::Escape($oldPath), $newPath
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated imports in: $($file.FullName)"
    }
}

Write-Host "Import updates completed!"

