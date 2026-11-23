'use client'

/**
 * 动效原语：Scramble Glitch / Scramble Slice。
 *
 * 做法（全部 transform / clip-path / opacity，不用 filter，TV 盒子也跑得动）：
 *  1. 主字：每个字符先用随机字占位，按从左到右的顺序逐个「对上频道」锁定；
 *  2. 切条：叠两层彩色副本（青 / 品红），用 clip-path 只露出一条横带，
 *     横带上下跳几个像素、左右抖 1-3px —— 就是 glitch slice 那种「信号不稳」；
 *  3. prefers-reduced-motion：直接出最终文字，不做任何抖动。
 *
 * 用途：登录后欢迎层、TV 看板标题、加载态。
 */

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

type Props = {
  text: string
  className?: string
  /** 打乱到锁定的总时长（毫秒） */
  duration?: number
  delay?: number
  /** 关掉切条（只剩字在收敛），给小号文字用 */
  slice?: boolean
  /** 字符集 */
  pool?: string
}

const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@/<>*+=安亲班学习成长明德学院'

const KEYFRAMES = `
@keyframes pjpc-gj-a {
  0%   { clip-path: inset(4% 0 74% 0);  transform: translate3d(-5px, 0, 0); }
  17%  { clip-path: inset(34% 0 42% 0); transform: translate3d(6px, 0, 0); }
  34%  { clip-path: inset(66% 0 16% 0); transform: translate3d(-6px, 0, 0); }
  51%  { clip-path: inset(12% 0 66% 0); transform: translate3d(5px, 0, 0); }
  68%  { clip-path: inset(52% 0 30% 0); transform: translate3d(-4px, 0, 0); }
  85%  { clip-path: inset(22% 0 60% 0); transform: translate3d(4px, 0, 0); }
  100% { clip-path: inset(4% 0 74% 0);  transform: translate3d(-5px, 0, 0); }
}
@keyframes pjpc-gj-b {
  0%   { clip-path: inset(56% 0 26% 0); transform: translate3d(5px, 0, 0); }
  20%  { clip-path: inset(8% 0 74% 0);  transform: translate3d(-6px, 0, 0); }
  40%  { clip-path: inset(42% 0 38% 0); transform: translate3d(4px, 0, 0); }
  60%  { clip-path: inset(74% 0 10% 0); transform: translate3d(-5px, 0, 0); }
  80%  { clip-path: inset(26% 0 56% 0); transform: translate3d(6px, 0, 0); }
  100% { clip-path: inset(56% 0 26% 0); transform: translate3d(5px, 0, 0); }
}
/* 白色切片：真正把字「切开错位」的那一层 */
@keyframes pjpc-gj-slice {
  0%   { clip-path: inset(30% 0 58% 0); transform: translate3d(9px, 0, 0); }
  22%  { clip-path: inset(58% 0 30% 0); transform: translate3d(-8px, 0, 0); }
  44%  { clip-path: inset(10% 0 76% 0); transform: translate3d(7px, 0, 0); }
  66%  { clip-path: inset(70% 0 18% 0); transform: translate3d(-9px, 0, 0); }
  88%  { clip-path: inset(44% 0 46% 0); transform: translate3d(6px, 0, 0); }
  100% { clip-path: inset(30% 0 58% 0); transform: translate3d(9px, 0, 0); }
}
`

export default function ScrambleGlitch({
  text,
  className = '',
  duration = 900,
  delay = 0,
  slice = true,
  pool = POOL,
}: Props) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? text : text.replace(/[^\s]/g, '·'))
  const [glitching, setGlitching] = useState(!reduce && slice)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    if (reduce) {
      setShown(text)
      setGlitching(false)
      return
    }
    const chars = Array.from(text)
    const startAt = performance.now() + delay
    const total = Math.max(160, duration)

    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - startAt) / total))
      // 锁定从左往右推，末段收得更快一点
      const lockRatio = Math.pow(p, 1.35)
      const next = chars.map((ch, i) => {
        if (ch === ' ') return ' '
        return (i + 1) / chars.length <= lockRatio ? ch : pool[Math.floor(Math.random() * pool.length)]
      })
      setShown(next.join(''))
      if (p < 1) raf.current = requestAnimationFrame(tick)
      else { setShown(text); setGlitching(false) }
    }

    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [text, duration, delay, pool, reduce])

  return (
    <span className={`relative inline-block ${className}`} aria-label={text}>
      {slice && <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />}
      {/* 主字 */}
      <span className="relative z-10">{shown}</span>

      {/* 切条：只露一条横带，带色偏 */}
      {glitching && (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 select-none text-cyan-400/80 mix-blend-screen"
            style={{ animation: 'pjpc-gj-a 620ms steps(1, end) infinite' }}
          >
            {shown}
          </span>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 select-none text-fuchsia-500/70 mix-blend-screen"
            style={{ animation: 'pjpc-gj-b 520ms steps(1, end) infinite' }}
          >
            {shown}
          </span>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1] select-none text-current"
            style={{ animation: 'pjpc-gj-slice 430ms steps(1, end) infinite' }}
          >
            {shown}
          </span>
        </>
      )}
    </span>
  )
}
