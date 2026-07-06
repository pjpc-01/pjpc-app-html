---
version: "3.0"
name: PJPC Phantom Glass
description: 玻璃态设计系统 — 半透明模糊面板叠加在灰白渐变背景上。纯 Phantom 灰白中性色系，唯一外观主题。
glassmorphism: true
theme: phantom-only

colors:
  # Background — cool grey-white gradient
  background: "#FAFAFA"
  background-gradient: "linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 40%, #EEEEEE 100%)"
  foreground: "#212529"

  # Glass surfaces
  glass-bg: "rgba(255,255,255,0.55)"
  glass-bg-hover: "rgba(255,255,255,0.70)"
  glass-bg-strong: "rgba(255,255,255,0.75)"
  glass-bg-sidebar: "rgba(255,255,255,0.70)"

  # Glass effects
  glass-blur: "blur(20px) saturate(160%)"
  glass-blur-heavy: "blur(28px) saturate(180%)"
  glass-blur-light: "blur(12px) saturate(140%)"

  # Glass borders
  glass-border: "rgba(255,255,255,0.70)"
  glass-border-strong: "rgba(255,255,255,0.70)"
  glass-border-subtle: "rgba(0,0,0,0.06)"
  sidebar-border: "rgba(0,0,0,0.08)"

  # Brand colors (neutral grey)
  primary: "#6c757d"
  primary-foreground: "#FFFFFF"
  secondary: "#E9ECEF"
  secondary-foreground: "#212529"
  muted: "#E9ECEF"
  muted-foreground: "#6c757d"
  accent: "#ADB5BD"
  accent-foreground: "#212529"

  # Semantic
  destructive: "#DC3545"
  destructive-foreground: "#FFFFFF"
  border: "#DEE2E6"
  input: "#DEE2E6"
  ring: "#6c757d"

  # Sidebar
  sidebar-background: "rgba(255,255,255,0.70)"
  sidebar-foreground: "#495057"
  sidebar-primary: "#6c757d"
  sidebar-primary-foreground: "#FFFFFF"
  sidebar-accent: "rgba(233,236,239,0.60)"
  sidebar-accent-foreground: "#495057"
  sidebar-ring: "#6c757d"

  # Charts
  chart-1: "#6c757d"
  chart-2: "#ADB5BD"
  chart-3: "#5A9E6F"
  chart-4: "#495057"
  chart-5: "#DC3545"

typography:
  h1: { fontFamily: Nunito, fontSize: "1.875rem", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.01em" }
  h2: { fontFamily: Nunito, fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.25 }
  h3: { fontFamily: Nunito, fontSize: "1.125rem", fontWeight: 600, lineHeight: 1.3 }
  body-lg: { fontFamily: Inter, fontSize: "1rem", fontWeight: 400, lineHeight: 1.6 }
  body-md: { fontFamily: Inter, fontSize: "0.875rem", fontWeight: 400, lineHeight: 1.5 }
  body-sm: { fontFamily: Inter, fontSize: "0.75rem", fontWeight: 400, lineHeight: 1.4 }
  label: { fontFamily: Nunito, fontSize: "0.75rem", fontWeight: 600, lineHeight: 1.4, letterSpacing: "0.05em" }
  stat-number: { fontFamily: Nunito, fontSize: "1.875rem", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em" }
  stat-label: { fontFamily: Inter, fontSize: "0.875rem", fontWeight: 500, lineHeight: 1.4 }

rounded:
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  "2xl": 20px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  "2xl": 48px

shadows:
  glass: "0 8px 32px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)"
  glass-hover: "0 12px 40px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)"
  glass-sm: "0 4px 16px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)"
  card: "0 1px 3px rgba(0,0,0,0.06)"
  card-hover: "0 4px 12px rgba(0,0,0,0.10)"

components:
  glass-card:
    background: "rgba(255,255,255,0.55)"
    backdropFilter: "blur(20px) saturate(160%)"
    border: "1px solid rgba(255,255,255,0.70)"
    borderRadius: "16px"
    boxShadow: "0 8px 32px rgba(0,0,0,0.06)"
    padding: "24px"
    className: "glass transition-all duration-200 hover:bg-[rgba(255,255,255,0.70)]"

  glass-stat:
    background: "rgba(255,255,255,0.70)"
    backdropFilter: "blur(20px) saturate(160%)"
    border: "1px solid rgba(255,255,255,0.70)"
    borderRadius: "12px"
    boxShadow: "0 4px 16px rgba(0,0,0,0.04)"
    padding: "16px 24px"

  glass-sidebar:
    background: "rgba(255,255,255,0.70)"
    backdropFilter: "blur(28px) saturate(180%)"
    borderRight: "1px solid rgba(0,0,0,0.08)"
    boxShadow: "2px 0 24px rgba(0,0,0,0.06)"
    width: "260px"

  glass-button:
    background: "rgba(255,255,255,0.70)"
    backdropFilter: "blur(12px) saturate(140%)"
    border: "1px solid rgba(255,255,255,0.70)"
    borderRadius: "8px"
    padding: "8px 16px"
    fontWeight: 600
    color: "#1A1A1A"

  glass-button-primary:
    background: "linear-gradient(135deg, #999999, #666666)"
    color: "#FFFFFF"
    fontWeight: 700
    borderRadius: "8px"
    padding: "10px 20px"
    className: "shadow-[0_4px_16px_rgba(0,0,0,0.10)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.15)]"

  glass-input:
    background: "rgba(255,255,255,0.50)"
    backdropFilter: "blur(12px) saturate(140%)"
    border: "1px solid rgba(255,255,255,0.70)"
    borderRadius: "8px"
    padding: "8px 12px"

  glass-table-row:
    background: "rgba(255,255,255,0.40)"
    borderRadius: "8px"
    className: "glass-row"

  glass-badge:
    background: "rgba(255,255,255,0.45)"
    border: "1px solid rgba(255,255,255,0.50)"
    borderRadius: "9999px"
    padding: "2px 10px"

  glass-tabs:
    background: "rgba(255,255,255,0.40)"
    backdropFilter: "blur(12px) saturate(140%)"
    border: "1px solid rgba(255,255,255,0.70)"
    borderRadius: "12px"
    padding: "4px"

  page-background:
    background: "linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 40%, #EEEEEE 100%)"
    minHeight: "100vh"
    className: "glass-body"

---

## Phantom Glass — Design System v3.0

### 唯一外观主题：幻影玻璃 (Phantom Glass)

本项目仅使用 **一种** 外观：Phantom 灰白玻璃态。不存在其他主题切换。

**核心色板：**
- 背景：灰白渐变 `#FAFAFA → #F5F5F5 → #EEEEEE`
- 玻璃层：半透明白 `rgba(255,255,255,0.55–0.70)` + `backdrop-filter: blur()`
- 文字：深灰 `#212529` / 中灰 `#6c757d`
- 主色：中性灰 `#6c757d`
- 禁止：任何暖琥珀/棕/金/橙色调

### Core CSS Classes

```css
.glass-body {
  background: linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 40%, #EEEEEE 100%);
  min-height: 100vh;
}

.glass {
  background: rgba(255,255,255,0.55);
  backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid rgba(255,255,255,0.70);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.06);
}

.glass-sidebar {
  background: rgba(255,255,255,0.70);
  backdrop-filter: blur(28px) saturate(180%);
  border-right: 1px solid rgba(0,0,0,0.08);
}

.glass-btn-primary {
  background: linear-gradient(135deg, #999999, #666666);
  color: #FFFFFF;
}
```

### Anti-patterns

- ❌ 任何暖色系（琥珀 #E8C86A、棕 #514A2E、金 #F59E0B 等）
- ❌ 主题切换器
- ❌ 暗色模式 .dark
- ❌ planhat / superlist / basedash / 琥珀 / 任何非 Phantom 主题
