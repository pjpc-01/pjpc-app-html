"use client"

/**
 * 标题文字动效（kinetic for headings）
 *
 * 老板要求：不要整屏扫光/闪屏，要「字」有动效 —— 跟登录欢迎页、幻灯片那套一样。
 * 所以这里只动标题文字：换页、换主题时，页面上 h1 / h2 的字符先乱码再逐个锁定。
 *
 * 规矩：
 *  - 只动「纯文字」标题（有子元素的跳过，不然会把图标/徽章删掉）；
 *  - 字符数不变，不会把布局撑开太多；
 *  - 每个标题只跑一次，跑完把原文写回去；
 *  - prefers-reduced-motion 命中 → 一动不动；
 *  - 不用 filter / backdrop-filter，只用 textContent 改写（TV 盒子也扛得住）。
 */

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useReducedMotion } from "framer-motion"
import { useTheme } from "@/contexts/theme-context"

const POOL_LIGHT = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@/<>*+=安亲班学习成长明德"
const POOL_GLITCH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ01<>[]{}/\\|=+*#%&@░▒▓█"
const POOL_SCRAMBLE = "アイウエオカキクケコサシスセソ01<>[]{}/\\|=+*#_▓▒░"

type Cleanup = () => void

function scrambleEl(el: HTMLElement, pool: string, duration: number, delay: number): Cleanup {
  const original = el.dataset.ktOriginal ?? (el.textContent || "")
  el.dataset.ktOriginal = original
  // 乱码期间挂一个类：glitch 走 RGB 错位阴影，scramble 走绿色辉光（CSS 在 globals.css）
  el.classList.add("kt-scrambling")
  const chars = [...original]
  const now = performance.now()
  const settleAt = chars.map((_, i) => delay + (i / Math.max(chars.length, 1)) * duration * 0.72)
  let timer: ReturnType<typeof setTimeout> | null = null
  let cancelled = false

  const tick = () => {
    if (cancelled) return
    const t = performance.now() - now
    let out = ""
    let done = true
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i]
      if (/\s/.test(ch)) { out += ch; continue }
      if (t >= settleAt[i] + duration * 0.28) { out += ch; continue }
      done = false
      out += pool[Math.floor(Math.random() * pool.length)]
    }
    el.textContent = out
    if (!done && t < delay + duration * 1.1) {
      timer = setTimeout(tick, 32)
    } else {
      el.textContent = original
      el.classList.remove("kt-scrambling")
      delete el.dataset.ktOriginal
    }
  }
  timer = setTimeout(tick, 0)

  return () => {
    cancelled = true
    if (timer) clearTimeout(timer)
    el.textContent = original
    el.classList.remove("kt-scrambling")
    delete el.dataset.ktOriginal
    delete el.dataset.ktBusy
  }
}

export default function KineticHeadings() {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  const { theme } = useTheme()
  const animatedFor = useRef<string>("")

  useEffect(() => {
    if (reduce) return
    if (!pathname || pathname === "/login") return

    const pool = theme === "glitch" ? POOL_GLITCH : theme === "scramble" ? POOL_SCRAMBLE : POOL_LIGHT

    // 标题大多是数据回来后才渲染的，所以轮询几轮：见到新的标题就打一次，最多 3 秒
    const timers: ReturnType<typeof setTimeout>[] = []
    const cleanups: Cleanup[] = []
    let stopped = false

    const run = () => {
      if (stopped) return
      const nodes = Array.from(document.querySelectorAll<HTMLElement>("h1, h2"))
        .filter((el) => el.childElementCount === 0 && (el.textContent || "").trim().length > 1)
        .filter((el) => !el.dataset.ktBusy && !el.dataset.ktDone)
        .slice(0, 6)
      nodes.forEach((el, i) => {
        el.dataset.ktBusy = "1"
        cleanups.push(scrambleEl(el, pool, theme === "phantom" ? 560 : 720, i * 90))
        // 跑完标记 done，避免下一轮立刻又打一次
        timers.push(setTimeout(() => {
          delete el.dataset.ktBusy
          el.dataset.ktDone = "1"
        }, 720 + i * 90 + 200))
      })
    }

    const key = `${pathname}|${theme}`
    if (animatedFor.current !== key) {
      animatedFor.current = key
      // 清掉上一轮留下的标记 —— 关键：上一次 effect 的 cleanup 会把 rAF 取消但标记留着，
      // 不清掉这里就会「有标记 → 全部被跳过 → 一个字都没动」。
      document.querySelectorAll<HTMLElement>("[data-kt-busy], [data-kt-done]").forEach((el) => {
        delete el.dataset.ktBusy
        delete el.dataset.ktDone
      })
      let ticks = 0
      const poll = () => {
        if (stopped) return
        run()
        ticks += 1
        if (ticks < 10) timers.push(setTimeout(poll, 300))
      }
      poll()
    }

    return () => {
      stopped = true
      timers.forEach(clearTimeout)
      cleanups.forEach((fn) => fn())
      document.querySelectorAll<HTMLElement>("[data-kt-busy]").forEach((el) => {
        delete el.dataset.ktBusy
      })
    }
  }, [pathname, theme, reduce])

  return null
}
