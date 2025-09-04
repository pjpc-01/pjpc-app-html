@echo off
echo Running PJPC Flutter App Tests...
echo.

echo ========================================
echo Running Unit Tests
echo ========================================
flutter test test/unit_test.dart
if %errorlevel% neq 0 (
    echo Unit tests failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Running Widget Tests
echo ========================================
flutter test test/widget_test.dart
if %errorlevel% neq 0 (
    echo Widget tests failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Running Integration Tests
echo ========================================
flutter test integration_test/integration_test.dart
if %errorlevel% neq 0 (
    echo Integration tests failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo All Tests Completed Successfully!
echo ========================================
pause

