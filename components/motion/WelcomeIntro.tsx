'use client'

/**
 * 登录后的欢迎动效（kinetic typography 阶段式入场）。
 *
 * 节奏（总计约 2.0s，不拖住进系统）：
 *   0.00s 暖色底淡入
 *   0.10s 徽标弹入
 *   0.25s 机构名逐字收字距（KineticHeadline）
 *   0.85s 「欢迎回来，名字」从地平线升起（LetterRise）
 *   1.15s 细线从左划过（进度感，不代表真实加载）
 *   1.85s 整层向上退出
 *
 * 硬约束：
 *  - 只在登录后首次进首页播一次（见 lib/welcome-flag.ts），刷新不会重复弹
 *  - prefers-reduced-motion / 老设备降级：直接不渲染
 *  - 覆盖层不拦截点击超过 2s，也不改路由，播完自己消失
 */

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'
import KineticHeadline from './KineticHeadline'
import LetterRise from './LetterRise'

type Props = {
  orgName?: string
  userName?: string
  onDone?: () => void
}

const TOTAL_MS = 1800

export default function WelcomeIntro({ orgName = '安亲班', userName = '', onDone }: Props) {
  const reduce = useReducedMotion()
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (reduce) {
      setGone(true)
      onDone?.()
      return
    }
    const t = setTimeout(() => {
      setGone(true)
      onDone?.()
    }, TOTAL_MS)
    return () => clearTimeout(t)
  }, [reduce, onDone])

  if (reduce || gone) return null

  const greeting = userName ? `欢迎回来，${userName}` : '欢迎回来'

  return (
    <motion.div
      data-welcome-intro
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      aria-hidden
      style={{
        background:
          'radial-gradient(120% 90% at 50% 0%, #fff7ed 0%, #ffedd5 38%, #fed7aa 72%, #fdba74 100%)',
      }}
    >
      {/* 徽标 */}
      <motion.div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 shadow-xl shadow-orange-600/30"
        initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 18 }}
      >
        <GraduationCap className="h-10 w-10 text-white" />
      </motion.div>

      {/* 机构名：逐字收字距 */}
      <h1 className="text-center text-3xl font-extrabold tracking-tight text-amber-950 sm:text-4xl">
        <KineticHeadline text={orgName} delay={0.25} stagger={0.03} tracking={0.18} />
      </h1>

      {/* 问候：地平线升起 */}
      <p className="mt-2.5 text-center text-lg font-semibold text-[#7c3a12]">
        <LetterRise text={greeting} delay={0.85} stagger={0.03} />
      </p>

      {/* 细线扫过 */}
      <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-amber-900/15">
        <motion.div
          className="h-full w-full origin-left rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-orange-700"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* 整层退出：向上滑 + 淡出 */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: 0, opacity: 0 }}
        exit={{ y: '-100%' }}
        transition={{ duration: 0.45, ease: [0.7, 0, 0.84, 0] }}
      />
    </motion.div>
  )
}
