#!/bin/bash
# ============================================================
#  PJPC NFC Reader Bridge Launcher
#  一键启动 USB NFC 读卡器 → 考勤 API 桥接
# ============================================================
#
# 用法:
#   ./scripts/start_nfc_bridge.sh              # 启动桥接
#   ./scripts/start_nfc_bridge.sh --sound      # 启动 + 声音
#   ./scripts/start_nfc_bridge.sh --list       # 查看设备
#   ./scripts/start_nfc_bridge.sh --write UID  # 写卡
#
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BRIDGE_SCRIPT="$SCRIPT_DIR/nfc_bridge.py"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== PJPC NFC Reader Bridge ===${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ python3 未安装${NC}"
    exit 1
fi

# Check if nfcpy is installed
if ! python3 -c "import nfc" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  nfcpy 未安装，正在安装...${NC}"
    cd "$PROJECT_DIR"

    # Try uv first (preferred), fallback to pip
    if command -v uv &> /dev/null; then
        uv pip install nfcpy pyserial
    elif command -v pip3 &> /dev/null; then
        pip3 install nfcpy pyserial
    else
        echo -e "${RED}❌ 需要 uv 或 pip3 来安装依赖${NC}"
        exit 1
    fi
fi

# Check if PocketBase is running
PB_RUNNING=false
if curl -s http://127.0.0.1:8090/api/health > /dev/null 2>&1; then
    PB_RUNNING=true
fi

# Check if Next.js is running
NEXT_RUNNING=false
if curl -s http://127.0.0.1:3001 > /dev/null 2>&1; then
    NEXT_RUNNING=true
fi

echo ""
echo -e "  PocketBase (8090):  $([ "$PB_RUNNING" = true ] && echo "${GREEN}✅ 运行中${NC}" || echo "${RED}❌ 未运行${NC}")"
echo -e "  Next.js   (3001):  $([ "$NEXT_RUNNING" = true ] && echo "${GREEN}✅ 运行中${NC}" || echo "${RED}❌ 未运行${NC}")"
echo ""

if [ "$PB_RUNNING" = false ] || [ "$NEXT_RUNNING" = false ]; then
    echo -e "${YELLOW}⚠️  部分服务未运行，桥接可能无法正常工作${NC}"
    echo ""
fi

# USB permissions hint
if [ "$(id -u)" != "0" ] && [ -e /dev/bus/usb ]; then
    echo -e "${YELLOW}💡 提示: 如果读卡器连接失败，可能需要 root 权限或 udev 规则${NC}"
    echo -e "   sudo ./scripts/start_nfc_bridge.sh $*"
    echo ""
fi

# Run the bridge
exec python3 "$BRIDGE_SCRIPT" --api http://127.0.0.1:3001 "$@"
