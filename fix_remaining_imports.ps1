# PowerShell script to fix remaining import path issues
Write-Host "Fixing remaining import path issues..."

# Get all .dart files in lib directory
$dartFiles = Get-ChildItem -Path "lib" -Filter "*.dart" -Recurse

foreach ($file in $dartFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Fix remaining import paths
    $content = $content -replace "import '\.\./\.\./widgets/", "import '../../shared/widgets/"
    $content = $content -replace "import '\.\./widgets/", "import '../shared/widgets/"
    $content = $content -replace "import '\.\./\.\./providers/", "import '../../shared/providers/"
    $content = $content -replace "import '\.\./providers/", "import '../shared/providers/"
    $content = $content -replace "import '\.\./\.\./services/", "import '../../shared/services/"
    $content = $content -replace "import '\.\./services/", "import '../shared/services/"
    $content = $content -replace "import '\.\./\.\./screens/", "import '../../features/"
    $content = $content -replace "import '\.\./screens/", "import '../features/"
    $content = $content -replace "import '\.\./\.\./utils/", "import '../../core/utils/"
    $content = $content -replace "import '\.\./utils/", "import '../core/utils/"
    $content = $content -replace "import '\.\./\.\./config/", "import '../../core/config/"
    $content = $content -replace "import '\.\./config/", "import '../core/config/"
    $content = $content -replace "import '\.\./\.\./constants/", "import '../../core/constants/"
    $content = $content -replace "import '\.\./constants/", "import '../core/constants/"
    $content = $content -replace "import '\.\./\.\./theme/", "import '../../core/theme/"
    $content = $content -replace "import '\.\./theme/", "import '../core/theme/"
    
    # Fix specific problematic imports
    $content = $content -replace "import '\.\./\.\./widgets/points/points_nfc_scanner_widget\.dart'", "import '../../shared/widgets/points_nfc_scanner_widget.dart'"
    $content = $content -replace "import '\.\./widgets/points/points_nfc_scanner_widget\.dart'", "import '../shared/widgets/points_nfc_scanner_widget.dart'"
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed imports in: $($file.FullName)"
    }
}

Write-Host "Import path fixes completed!"

