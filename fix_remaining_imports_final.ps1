# PowerShell script to fix remaining import path issues
Write-Host "Fixing remaining import path issues..."

# Get all .dart files in lib directory
$dartFiles = Get-ChildItem -Path "lib" -Filter "*.dart" -Recurse

foreach ($file in $dartFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Fix specific problematic patterns
    $content = $content -replace "import '\\.\\./\\.\\./student/providers/", "import '../../features/student/providers/"
    $content = $content -replace "import '\\.\\./student/providers/", "import '../features/student/providers/"
    $content = $content -replace "import '\\.\\./\\.\\./attendance/providers/", "import '../../features/attendance/providers/"
    $content = $content -replace "import '\\.\\./attendance/providers/", "import '../features/attendance/providers/"
    $content = $content -replace "import '\\.\\./\\.\\./auth/providers/", "import '../../features/auth/providers/"
    $content = $content -replace "import '\\.\\./auth/providers/", "import '../features/auth/providers/"
    $content = $content -replace "import '\\.\\./\\.\\./notification/providers/", "import '../../features/notification/providers/"
    $content = $content -replace "import '\\.\\./notification/providers/", "import '../features/notification/providers/"
    $content = $content -replace "import '\\.\\./\\.\\./teacher/providers/", "import '../../features/teacher/providers/"
    $content = $content -replace "import '\\.\\./teacher/providers/", "import '../features/teacher/providers/"
    $content = $content -replace "import '\\.\\./\\.\\./finance/providers/", "import '../../features/finance/providers/"
    $content = $content -replace "import '\\.\\./finance/providers/", "import '../features/finance/providers/"
    $content = $content -replace "import '\\.\\./\\.\\./leave/providers/", "import '../../features/leave/providers/"
    $content = $content -replace "import '\\.\\./leave/providers/", "import '../features/leave/providers/"
    
    # Fix screen imports
    $content = $content -replace "import '\\.\\./\\.\\./student/screens/", "import '../../features/student/screens/"
    $content = $content -replace "import '\\.\\./student/screens/", "import '../features/student/screens/"
    $content = $content -replace "import '\\.\\./\\.\\./attendance/screens/", "import '../../features/attendance/screens/"
    $content = $content -replace "import '\\.\\./attendance/screens/", "import '../features/attendance/screens/"
    $content = $content -replace "import '\\.\\./\\.\\./auth/screens/", "import '../../features/auth/screens/"
    $content = $content -replace "import '\\.\\./auth/screens/", "import '../features/auth/screens/"
    $content = $content -replace "import '\\.\\./\\.\\./notification/screens/", "import '../../features/notification/screens/"
    $content = $content -replace "import '\\.\\./notification/screens/", "import '../features/notification/screens/"
    $content = $content -replace "import '\\.\\./\\.\\./teacher/screens/", "import '../../features/teacher/screens/"
    $content = $content -replace "import '\\.\\./teacher/screens/", "import '../features/teacher/screens/"
    $content = $content -replace "import '\\.\\./\\.\\./reports/screens/", "import '../../features/reports/screens/"
    $content = $content -replace "import '\\.\\./reports/screens/", "import '../features/reports/screens/"
    $content = $content -replace "import '\\.\\./\\.\\./nfc/screens/", "import '../../features/nfc/screens/"
    $content = $content -replace "import '\\.\\./nfc/screens/", "import '../features/nfc/screens/"
    
    # Fix widget imports
    $content = $content -replace "import '\\.\\./\\.\\./attendance/widgets/", "import '../../features/attendance/widgets/"
    $content = $content -replace "import '\\.\\./attendance/widgets/", "import '../features/attendance/widgets/"
    $content = $content -replace "import '\\.\\./\\.\\./student/widgets/", "import '../../features/student/widgets/"
    $content = $content -replace "import '\\.\\./student/widgets/", "import '../features/student/widgets/"
    $content = $content -replace "import '\\.\\./\\.\\./teacher/widgets/", "import '../../features/teacher/widgets/"
    $content = $content -replace "import '\\.\\./teacher/widgets/", "import '../features/teacher/widgets/"
    
    # Fix service imports
    $content = $content -replace "import '\\.\\./\\.\\./services/", "import '../../shared/services/"
    $content = $content -replace "import '\\.\\./services/", "import '../shared/services/"
    
    # Fix theme imports
    $content = $content -replace "import '\\.\\./\\.\\./theme/", "import '../../core/theme/"
    $content = $content -replace "import '\\.\\./theme/", "import '../core/theme/"
    $content = $content -replace "import '\\.\\./\\.\\./utils/", "import '../../core/utils/"
    $content = $content -replace "import '\\.\\./utils/", "import '../core/utils/"
    $content = $content -replace "import '\\.\\./\\.\\./constants/", "import '../../core/constants/"
    $content = $content -replace "import '\\.\\./constants/", "import '../core/constants/"
    
    # Fix shared widget imports
    $content = $content -replace "import '\\.\\./\\.\\./widgets/", "import '../../shared/widgets/"
    $content = $content -replace "import '\\.\\./widgets/", "import '../shared/widgets/"
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Import path fixes completed!"
