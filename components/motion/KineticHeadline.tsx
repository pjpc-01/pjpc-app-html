'use client'

/**
 * 动效原语 1/4：标题弹性字距（kinetic tracking headline）。
 *
 * 效果：文字从「字距很松 + 略透明」收紧到正常间距，逐字错峰弹入。
 * 用途：登录页机构名、报告封面标题、看板大标题。
 *
 * 设计约束（TV 盒子/低端平板）：只用 transform 与 opacity，不碰 filter/backdrop，
 * 动画中不触发布局；prefers-reduced-motion 时直接静态显示。
 */

import { motion, useReducedMotion } from 'framer-motion'
import { useMemo } from 'react'

type Props = {
  text: string
  className?: string
  /** 逐字延迟（秒） */
  stagger?: number
  /** 起始额外字距（em） */
  tracking?: number
  delay?: number
}

export default function KineticHeadline({
  text,
  className = '',
  stagger = 0.028,
  tracking = 0.22,
  delay = 0,
}: Props) {
  const reduce = useReducedMotion()
  const chars = useMemo(() => Array.from(text), [text])

  if (reduce) return <span className={className}>{text}</span>

  return (
    <span className={`inline-block ${className}`} aria-label={text}>
      {/* 逐字包一层，空格也要占位，所以用 &nbsp; */}
      {chars.map((ch, i) => (
        <motion.span
          key={`${ch}-${i}`}
          aria-hidden
          className="inline-block will-change-transform"
          initial={{ opacity: 0, y: '0.28em', letterSpacing: `${tracking}em` }}
          animate={{ opacity: 1, y: 0, letterSpacing: '0em' }}
          transition={{
            delay: delay + i * stagger,
            duration: 0.62,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </motion.span>
      ))}
    </span>
  )
}
