---
version: "3.1"
name: PJPC Neutral
description: 中性灰白设计系统 — 纯色面板 + 灰白渐变背景。无玻璃态，无暖色，单一主题。
theme: neutral-only
---

## PJPC Neutral — Design System v3.1

### 唯一外观主题：中性灰白

本项目仅使用 **一种** 外观：中性灰白色系。不存在其他主题切换。

### CSS 变量（实际值）

```css
:root {
  /* 基础 */
  --background: 0 0% 100%;         /* 纯白 */
  --foreground: 0 0% 3.9%;         /* 近黑 */

  /* 卡片/弹出层 */
  --card: 0 0% 100%;
  --popover: 0 0% 100%;

  /* 主色 — 中性深灰 */
  --primary: 0 0% 9%;              /* #171717 */
  --primary-foreground: 0 0% 98%;

  /* 次色 — 浅灰 */
  --secondary: 0 0% 96.1%;
  --secondary-foreground: 0 0% 9%;

  /* 静默色 */
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;  /* 中灰文字 */

  /* 强调色 */
  --accent: 0 0% 96.1%;
  --accent-foreground: 0 0% 9%;

  /* 语义 */
  --destructive: 0 84.2% 60.2%;    /* 红色 */
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 89.8%;
  --input: 0 0% 89.8%;
  --ring: 0 0% 3.9%;

  /* 图表 */
  --chart-1: 12 76% 61%;
  --chart-2: 173 58% 39%;
  --chart-3: 197 37% 24%;
  --chart-4: 43 74% 66%;
  --chart-5: 27 87% 67%;

  /* 圆角 */
  --radius: 0.5rem;               /* 8px */

  /* 侧边栏 */
  --sidebar-background: 0 0% 98%;           /* 浅灰白 */
  --sidebar-foreground: 240 5.3% 26.1%;     /* 深灰 */
  --sidebar-primary: 240 5.9% 10%;          /* 近黑 */
  --sidebar-primary-foreground: 0 0% 98%;
  --sidebar-accent: 240 4.8% 95.9%;         /* hover 浅灰 */
  --sidebar-accent-foreground: 240 5.9% 10%;
  --sidebar-border: 220 13% 91%;
  --sidebar-ring: 217.2 91.2% 59.8%;
}
```

### 核心色板

| 用途 | 值 | 说明 |
|------|-----|------|
| 背景 | `0 0% 100%` / `0 0% 98%` | 纯白/浅灰白 |
| 文字 | `0 0% 3.9%` / `0 0% 45.1%` | 近黑/中灰 |
| 主色 | `0 0% 9%` | 中性深灰（按钮/激活态） |
| 侧边栏 | `0 0% 98%` | 浅灰白背景 |
| 边框 | `0 0% 89.8%` | 浅灰 |

### 状态颜色

| 状态 | Tailwind 类 | 用途 |
|------|------------|------|
| 成功 | `emerald-500` | 正常/已付款/已完成/出席 |
| 待处理 | `amber-500` | 待处理/部分付款/迟到 |
| 错误 | `red-500` | 逾期/未付款/缺席/退学 |
| 激活 | `indigo-500` 或 `blue-500` | 激活/在线/主操作 |

### 组件栈

- **UI 库：** shadcn/ui (Button, Card, Dialog, Table, Select, Tabs, etc.)
- **CSS：** Tailwind CSS 3
- **图标：** lucide-react
- **通知：** sonner (toast)
- **图表：** recharts

### Anti-patterns

- ❌ 任何暖色系（琥珀 #E8C86A、棕 #514A2E、金 #F59E0B 等）
- ❌ 主题切换器
- ❌ 暗色模式 .dark
- ❌ backdrop-filter / glassmorphism（实际代码不使用玻璃态效果）
- ❌ 任何非中性灰白色系的主题

### 字体

| 用途 | 字体 | 大小 |
|------|------|------|
| 标题 | Nunito | 1.875rem - 1.5rem |
| 正文 | Inter | 0.875rem - 1rem |
| 标签 | Nunito | 0.75rem |

### 圆角

| 尺寸 | 值 |
|------|-----|
| sm | 4px |
| md | 8px (默认) |
| lg | 12px |
| xl | 16px |
| 2xl | 20px |
| full | 9999px |
