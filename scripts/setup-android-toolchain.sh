#!/usr/bin/env bash
# 给 Capacitor Android 构建准备工具链（不需要 sudo，全部装在用户目录）
# 用法：bash scripts/setup-android-toolchain.sh
set -euo pipefail

TOOLS="$HOME/.hermes/tools"
JDK_DIR="$TOOLS/jdk-21"
SDK_DIR="$TOOLS/android-sdk"
mkdir -p "$TOOLS" "$SDK_DIR"

echo "== 1/5 下载 JDK 21 (Temurin) =="
if [ ! -x "$JDK_DIR/bin/java" ]; then
  curl -fsSL -o /tmp/temurin21.tar.gz \
    "https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jdk/hotspot/normal/eclipse?project=jdk"
  mkdir -p "$JDK_DIR"
  tar -xzf /tmp/temurin21.tar.gz -C "$JDK_DIR" --strip-components=1
  rm -f /tmp/temurin21.tar.gz
fi
"$JDK_DIR/bin/java" -version

echo "== 2/5 下载 Android cmdline-tools =="
CLT="$SDK_DIR/cmdline-tools/latest"
if [ ! -x "$CLT/bin/sdkmanager" ]; then
  curl -fsSL -o /tmp/clt.zip "https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip"
  mkdir -p "$SDK_DIR/cmdline-tools"
  rm -rf "$SDK_DIR/cmdline-tools/tmp" && mkdir -p "$SDK_DIR/cmdline-tools/tmp"
  unzip -q /tmp/clt.zip -d "$SDK_DIR/cmdline-tools/tmp"
  mv "$SDK_DIR/cmdline-tools/tmp/cmdline-tools" "$CLT"
  rm -rf "$SDK_DIR/cmdline-tools/tmp" /tmp/clt.zip
fi
ls "$CLT/bin/sdkmanager"

echo "== 3/5 接受许可 + 装 platform / build-tools =="
export JAVA_HOME="$JDK_DIR"
export ANDROID_HOME="$SDK_DIR"
export ANDROID_SDK_ROOT="$SDK_DIR"
export PATH="$JDK_DIR/bin:$CLT/bin:$PATH"
yes | sdkmanager --licenses >/dev/null 2>&1 || true
sdkmanager --install "platform-tools" "platforms;android-35" "build-tools;35.0.0" 2>&1 | tail -5

echo "== 4/5 验收 =="
"$CLT/bin/sdkmanager" --list_installed | head -12
echo "JAVA_HOME=$JAVA_HOME"
echo "ANDROID_HOME=$ANDROID_HOME"

echo "== 5/5 写入环境变量（追加到 ~/.bashrc，只加一次）=="
for line in \
  "export JAVA_HOME=\"$JDK_DIR\"" \
  "export ANDROID_HOME=\"$SDK_DIR\"" \
  "export ANDROID_SDK_ROOT=\"$SDK_DIR\"" \
  "export PATH=\"\$JAVA_HOME/bin:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools:\$PATH\""; do
  grep -qxF "$line" "$HOME/.bashrc" 2>/dev/null || echo "$line" >> "$HOME/.bashrc"
done
echo "完成。开新终端或 source ~/.bashrc 生效。"
