'use client'

/**
 * 动效原语 2/4：字母从地平线升起（horizon letter rise）。
 *
 * 每个字被裁在一行「地平线」下方，依次向上推出，带轻微透视。
 * 用途：欢迎页副标题、成就解锁、报告章节标题。
 */

import { motion, useReducedMotion } from 'framer-motion'
import { useMemo } from 'react'

type Props = {
  text: string
  className?: string
  stagger?: number
  delay?: number
  /** 每字上升距离 */
  rise?: string
}

export default function LetterRise({
  text,
  className = '',
  stagger = 0.035,
  delay = 0,
  rise = '110%',
}: Props) {
  const reduce = useReducedMotion()
  const chars = useMemo(() => Array.from(text), [text])

  if (reduce) return <span className={className}>{text}</span>

  return (
    <span className={`inline-block ${className}`} aria-label={text}>
      {chars.map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          aria-hidden
          className="inline-block overflow-hidden align-bottom"
          style={{ lineHeight: 1.15 }}
        >
          <motion.span
            className="inline-block will-change-transform"
            initial={{ y: rise }}
            animate={{ y: '0%' }}
            transition={{
              delay: delay + i * stagger,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </motion.span>
        </span>
      ))}
    </span>
  )
}
