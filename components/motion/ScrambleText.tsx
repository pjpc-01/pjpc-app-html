'use client'

/**
 * 动效原语 3/4：解构重组（scramble slice）。
 *
 * 先用随机字替换、再逐步收敛到真字，像电子屏在「对上频道」。
 * 用途：加载态、刷卡识别、数据刷新提示。
 *
 * 性能：用 requestAnimationFrame + 固定总时长，不用 interval 堆定时器；
 * 组件卸载即取消；prefers-reduced-motion 直接显示最终文字。
 */

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

type Props = {
  text: string
  className?: string
  /** 总时长（毫秒） */
  duration?: number
  delay?: number
  /** 参与打乱的字符集（中文用常用字，拉丁用字母数字） */
  pool?: string
}

const DEFAULT_POOL = '安亲班学习成长进步明德学院0123456789ABCDEF'

export default function ScrambleText({
  text,
  className = '',
  duration = 900,
  delay = 0,
  pool = DEFAULT_POOL,
}: Props) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? text : text.replace(/[^\s]/g, '·'))
  const raf = useRef<number | null>(null)

  useEffect(() => {
    if (reduce) {
      setShown(text)
      return
    }
    const chars = Array.from(text)
    const startAt = performance.now() + delay
    const total = Math.max(120, duration)

    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - startAt) / total))
      // 前面是随机字，后面收敛；用非线性让「锁定」发生在末段
      const lockRatio = Math.pow(p, 1.6)
      const next = chars.map((ch, i) => {
        if (ch === ' ') return ' '
        const locked = (i + 1) / chars.length <= lockRatio
        if (locked) return ch
        return pool[Math.floor(Math.random() * pool.length)]
      })
      setShown(next.join(''))
      if (p < 1) raf.current = requestAnimationFrame(tick)
      else setShown(text)
    }

    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [text, duration, delay, pool, reduce])

  return (
    <span className={className} aria-label={text}>
      {shown}
    </span>
  )
}
