# Codemagic界面配置指南

## 在Codemagic界面直接创建配置文件

### 步骤1：创建新工作流
1. 在Codemagic界面点击"Create workflow"
2. 选择平台：iOS
3. 选择框架：Flutter

### 步骤2：配置工作流
使用以下配置：

```yaml
workflows:
  ios-workflow:
    name: iOS Build for AltStore
    max_build_duration: 60
    instance_type: mac_mini_m1
    environment:
      vars:
        XCODE_VERSION: "15.0"
        FLUTTER_VERSION: "3.35.3"
        BUNDLE_ID: "com.pjpc.school.pjpcAppFlutter"
      flutter: stable
      xcode: latest
      cocoapods: default
    scripts:
      - name: Get Flutter packages
        script: |
          flutter packages pub get
      - name: Install pods
        script: |
          find . -name "Podfile" -execdir pod install \;
      - name: Flutter analyze
        script: |
          flutter analyze
      - name: Flutter unit tests
        script: |
          flutter test
      - name: Build ipa for AltStore
        script: |
          flutter build ipa --release --no-codesign \
            --build-name=1.0.0 \
            --build-number=1
    artifacts:
      - build/ios/ipa/*.ipa
    publishing:
      email:
        recipients:
          - your-email@example.com
        notify:
          success: true
          failure: false
```

### 步骤3：开始构建
1. 保存配置
2. 点击"Start new build"
3. 选择分支：flutter
4. 开始构建

## 如果仍然无法使用Codemagic

### 替代方案：使用其他云服务
1. **Bitrise**：https://bitrise.io/
2. **AppCenter**：https://appcenter.ms/
3. **Firebase App Distribution**：https://firebase.google.com/

### 替代方案：手动构建（需要Mac）
```bash
flutter build ios --release --no-codesign
```
