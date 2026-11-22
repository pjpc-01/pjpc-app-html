'use client'

/**
 * 动效原语 4/4：翻牌数字（split-flap / flip counter）。
 *
 * 每一位数字单独一列，变化时向上一格换牌。
 * 用途：TV 看板人数/积分、首页统计卡、欢迎页里的「今日 N 人」。
 *
 * 为什么不用 requestAnimationFrame 做计数：这里是「换牌」不是「滚动」，
 * 每位用 framer-motion 的 y 位移即可，停表后不再占 CPU（看板要挂一整天）。
 */

import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'

type Props = {
  value: number | string
  className?: string
  /** 每列宽度 */
  width?: string
  /** 牌面高度 */
  height?: string
  /** 千分位 */
  group?: boolean
}

function format(n: number | string, group: boolean) {
  if (typeof n === 'string') return n
  return group ? n.toLocaleString('en-MY') : String(n)
}

export default function FlipCounter({
  value,
  className = '',
  width = '0.72em',
  height = '1.15em',
  group = false,
}: Props) {
  const reduce = useReducedMotion()
  const text = format(value, group)

  return (
    <span className={`inline-flex items-end ${className}`} aria-label={text}>
      {Array.from(text).map((ch, i) => {
        const isDigit = /\d/.test(ch)
        if (!isDigit) {
          return (
            <span key={`s-${i}`} className="inline-block" style={{ width: '0.36em' }}>
              {ch}
            </span>
          )
        }
        return (
          <span
            key={`d-${text.length}-${i}`}
            className="relative inline-block overflow-hidden text-center"
            style={{ width, height, lineHeight: height }}
          >
            {reduce ? (
              <span>{ch}</span>
            ) : (
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={`${i}-${ch}`}
                  className="absolute inset-0 will-change-transform"
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  exit={{ y: '-100%', opacity: 0 }}
                  transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                >
                  {ch}
                </motion.span>
              </AnimatePresence>
            )}
          </span>
        )
      })}
    </span>
  )
}
