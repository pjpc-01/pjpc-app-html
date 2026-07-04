#!/usr/bin/env python3
"""
NFC Reader Bridge — 将 USB NFC 读卡器连接到 PJPC 考勤 API

用法:
    python3 scripts/nfc_bridge.py                    # 连接第一个 USB 读卡器
    python3 scripts/nfc_bridge.py --api http://127.0.0.1:3001  # 指定 API 地址
    python3 scripts/nfc_bridge.py --sound            # 启用声音反馈
    python3 scripts/nfc_bridge.py --list             # 列出可用读卡器

支持设备:
    - ACR122U (最常见的 USB NFC 读卡器)
    - PN532 (UART/I2C/SPI 模式)
    - 任何 nfcpy 支持的 ContactlessFrontend

工作流程:
    刷卡 → 读取 UID → POST /api/nfc/tap → 查学生 → POST /api/attendance/checkin → 签到/签退
"""

import sys
import os
import json
import time
import argparse
import urllib.request
import urllib.error
from datetime import datetime

# ─── Configuration ──────────────────────────────────────────────

DEFAULT_API_BASE = "http://127.0.0.1:3001"
DEFAULT_API_LOCAL = "http://127.0.0.1:3001"

# ─── API Helpers ────────────────────────────────────────────────

def api_post(url: str, data: dict, timeout: int = 10) -> dict:
    """POST JSON to API, return parsed response."""
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            return json.loads(body)
        except json.JSONDecodeError:
            return {"error": f"HTTP {e.code}: {body[:200]}", "success": False}
    except urllib.error.URLError as e:
        return {"error": f"连接失败: {e.reason}", "success": False}
    except Exception as e:
        return {"error": str(e), "success": False}


def tap_card(api_base: str, card_uid: str) -> dict:
    """Call /api/nfc/tap to resolve a card UID to a person (student or teacher)."""
    return api_post(f"{api_base}/api/nfc/tap", {"card_uid": card_uid})


def checkin_person(api_base: str, person_id: str, person_name: str, person_type: str, center: str, card_uid: str) -> dict:
    """Call /api/attendance/checkin to check in/out (unified student + teacher)."""
    return api_post(
        f"{api_base}/api/attendance/checkin",
        {
            "person_id": person_id,
            "person_name": person_name,
            "person_type": person_type,
            "center": center,
            "method": "nfc_usb",
            "notes": f"USB NFC 读卡器 — 卡号: {card_uid}",
        },
    )


# ─── Display Helpers ────────────────────────────────────────────

# ANSI colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_banner():
    print(f"""
{CYAN}{BOLD}╔══════════════════════════════════════════╗
║       PJPC NFC Reader Bridge v2.0        ║
║    USB 读卡器 → 统一考勤 API (学生+教师)    ║
╚══════════════════════════════════════════╝{RESET}
""")


def print_result(action: str, person_name: str, person_id: str, person_type: str, center: str, card_uid: str):
    """Pretty-print check-in/out result."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    type_label = "教师" if person_type == "teacher" else "学生"
    if action == "签到":
        color = GREEN
        icon = "✅"
    elif action == "签退":
        color = YELLOW
        icon = "👋"
    else:
        color = RED
        icon = "❌"

    print(f"""
{color}{BOLD}  {icon} {action}成功!{RESET}
  ┌─────────────────────────────────────┐
  │  {type_label}: {BOLD}{person_name}{RESET}  ({person_id})
  │  中心: {center}
  │  卡号: {card_uid}
  │  时间: {timestamp}
  │  状态: {color}{BOLD}{action}{RESET}
  └─────────────────────────────────────┘
""")


def print_error(msg: str):
    print(f"{RED}❌ {msg}{RESET}")


def print_info(msg: str):
    print(f"{BLUE}ℹ️  {msg}{RESET}")


# ─── Sound Feedback (optional) ──────────────────────────────────

def play_beep(success: bool = True):
    """Play a terminal bell. Install 'sox' or 'beep' for actual sound."""
    try:
        # Try to use the terminal bell
        sys.stdout.write("\a")
        sys.stdout.flush()
    except Exception:
        pass


# ─── USB NFC Reader ─────────────────────────────────────────────

class NfcReaderBridge:
    """Wraps nfcpy ContactlessFrontend with retry and reconnect logic."""

    def __init__(self, api_base: str, device_path: str = "usb", play_sound: bool = False):
        self.api_base = api_base.rstrip("/")
        self.device_path = device_path
        self.play_sound = play_sound
        self.clf = None
        self.running = False

    def connect(self):
        """Connect to the NFC reader."""
        import nfc

        print_info(f"正在连接读卡器: {self.device_path} ...")
        try:
            self.clf = nfc.ContactlessFrontend(self.device_path)
            print(f"{GREEN}✅ 读卡器已连接: {self.clf.device}{RESET}")
            if hasattr(self.clf.device, "product_name"):
                print_info(f"设备名称: {self.clf.device.product_name}")
            return True
        except Exception as e:
            print_error(f"无法连接读卡器: {e}")
            print_info("请检查:")
            print("  1. USB 读卡器是否已插入")
            print("  2. 驱动是否已安装 (Linux: apt install libusb-dev pcscd)")
            print("  3. 用户是否有 USB 访问权限 (可能需要 sudo 或 udev 规则)")
            print()
            print_info("尝试列出可用设备: python3 -c \"import nfc; nfc.ContactlessFrontend('usb')\"")
            return False

    def on_tag_discovered(self, tag):
        """Callback when an NFC tag is detected."""
        try:
            uid_bytes = tag.identifier
            card_uid = uid_bytes.hex().upper()

            print(f"\n{BLUE}{BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}")
            print(f"{CYAN}📡 检测到 NFC 卡片{RESET}")
            print(f"   卡号: {BOLD}{card_uid}{RESET}")
            print(f"   类型: {tag.type}")

            # Step 1: Look up card → person (student or teacher)
            print_info(f"查询卡片信息...")
            tap_result = tap_card(self.api_base, card_uid)

            if tap_result.get("error") or not tap_result.get("found"):
                error_msg = tap_result.get("error", "未注册的卡片")
                print_error(error_msg)
                print(f"{YELLOW}   💡 此卡未在系统中注册，请先通过管理后台发卡{RESET}")
                if self.play_sound:
                    play_beep(False)
                return True  # Continue listening

            person_type = tap_result.get("person_type", "student")
            person = tap_result.get("person", {})
            person_name = person.get("name", "未知")
            person_id = person.get("id", "未知")
            center = person.get("center", "")

            type_label = "教师" if person_type == "teacher" else "学生"
            print(f"{GREEN}   ✅ {type_label}: {person_name} ({person_id}){RESET}")
            print(f"   中心: {center}")

            # Step 2: Check in / check out (unified)
            print_info("执行签到/签退...")
            chk_result = checkin_person(self.api_base, person_id, person_name, person_type, center, card_uid)

            if chk_result.get("success"):
                action = chk_result.get("action", "签到")
                print_result(action, person_name, person_id, person_type, center, card_uid)
                if self.play_sound:
                    play_beep(True)
            else:
                error_msg = chk_result.get("error", "考勤记录失败")
                print_error(f"考勤失败: {error_msg}")
                if self.play_sound:
                    play_beep(False)

            print(f"{BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}\n")
        except Exception as e:
            print_error(f"处理卡片时出错: {e}")

        return True  # Continue listening for more tags

    def run(self):
        """Main loop — connect and listen."""
        if not self.connect():
            return 1

        self.running = True
        print(f"\n{GREEN}{BOLD}🔍 等待 NFC 卡片... (Ctrl+C 退出){RESET}")
        print(f"{CYAN}   将 NFC 卡片靠近读卡器即可自动打卡{RESET}\n")

        try:
            # nfcpy will call on_tag_discovered for each tag
            self.clf.connect(rdwr={"on-connect": self.on_tag_discovered})
        except KeyboardInterrupt:
            print(f"\n{YELLOW}🛑 用户中断，正在退出...{RESET}")
        except Exception as e:
            print_error(f"读卡器错误: {e}")
            return 1
        finally:
            self.close()

        return 0

    def close(self):
        """Clean up resources."""
        if self.clf:
            try:
                self.clf.close()
            except Exception:
                pass
            print_info("读卡器已断开")


# ─── List Devices ───────────────────────────────────────────────

def list_devices():
    """List available NFC readers."""
    import nfc

    print_info("正在搜索 NFC 读卡器...")
    try:
        # Try USB first
        clf = nfc.ContactlessFrontend("usb")
        print(f"{GREEN}✅ 找到 USB 读卡器:{RESET}")
        print(f"   设备: {clf.device}")
        if hasattr(clf.device, "product_name"):
            print(f"   名称: {clf.device.product_name}")
        if hasattr(clf.device, "vendor_name"):
            print(f"   厂商: {clf.device.vendor_name}")
        clf.close()
        return 0
    except Exception as e:
        print(f"{YELLOW}⚠️  未找到 USB 读卡器: {e}{RESET}")
        print_info("请确保:")
        print("  - 读卡器已插入 USB 端口")
        print("  - 安装了必要的驱动")
        print("  - 对于 ACR122U: 可能需要安装 pcscd 和 libacsccid1")
        return 1


# ─── Write Card (for Web NFC compatibility) ─────────────────────

def write_card_ndef(card_uid: str, device: str = "usb"):
    """
    Write card_uid as NDEF text record to an NFC tag.
    This makes the card readable by both USB reader AND Web NFC (Android Chrome).
    """
    import nfc
    import ndef

    print_info(f"准备写入 NDEF 数据到卡片...")
    print_info(f"要写入的 UID: {card_uid}")

    def on_connect(tag):
        print_info(f"检测到标签: {tag.type}")
        if not tag.ndef:
            print_error("此标签不支持 NDEF 格式")
            return False

        if not tag.ndef.is_writeable:
            print_error("此标签不可写入（可能已锁定）")
            return False

        try:
            # Create NDEF text record with the card UID
            record = ndef.TextRecord(card_uid, language="en")
            tag.ndef.records = [record]
            print(f"{GREEN}✅ 已写入 NDEF 记录: '{card_uid}'{RESET}")
            print_info("此卡现在可以在 Web NFC 和 USB 读卡器上使用")
            return True
        except Exception as e:
            print_error(f"写入失败: {e}")
            return False

    try:
        clf = nfc.ContactlessFrontend(device)
        print_info("请将空白 NFC 卡片靠近读卡器以写入数据...")
        clf.connect(rdwr={"on-connect": on_connect})
        clf.close()
    except Exception as e:
        print_error(f"操作失败: {e}")
        return 1

    return 0


# ─── CLI ────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="PJPC NFC Reader Bridge — USB 读卡器到考勤 API 的桥接程序",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  %(prog)s                         启动桥接（默认 API: http://127.0.0.1:3001）
  %(prog)s --sound                 启用声音反馈
  %(prog)s --list                  列出可用 NFC 读卡器
  %(prog)s --write 04ABC123        将 UID 写入 NFC 标签（为 Web NFC 兼容）
        """,
    )
    parser.add_argument(
        "--api",
        default=DEFAULT_API_BASE,
        help=f"API 服务器地址 (默认: {DEFAULT_API_BASE})",
    )
    parser.add_argument(
        "--sound",
        action="store_true",
        help="启用刷卡声音反馈",
    )
    parser.add_argument(
        "--device",
        default="usb",
        help="读卡器路径 (默认: usb, 也可指定如 'tty:USB0:pn532')",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="列出可用 NFC 读卡器设备",
    )
    parser.add_argument(
        "--write",
        metavar="CARD_UID",
        help="将指定 UID 写入 NFC 标签（NDEF 格式，同时兼容 Web NFC）",
    )

    args = parser.parse_args()

    print_banner()

    if args.list:
        return list_devices()

    if args.write:
        return write_card_ndef(args.write, args.device)

    # Normal operation — run the bridge
    print_info(f"API 地址: {args.api}")
    print_info(f"读卡器: {args.device}")

    bridge = NfcReaderBridge(
        api_base=args.api,
        device_path=args.device,
        play_sound=args.sound,
    )
    return bridge.run()


if __name__ == "__main__":
    sys.exit(main())
