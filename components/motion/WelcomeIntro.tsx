'use client'

/**
 * 登录后的欢迎层（Scramble Glitch / Scramble Slice teaser 风格）。
 *
 * 节奏（总计 1.9s，不拖住进系统）：
 *   0.00s 暗底淡入（带极淡栅格，像屏幕通电）
 *   0.10s 顶行小字 PJPC · SECURE SESSION —— 打乱后对上频道
 *   0.25s 机构名 —— scramble 收敛 + 青/品红切条抖动（scramble slice）
 *   0.76s 「欢迎回来，名字」—— 同样 scramble，不带切条（小字带切条会脏）
 *   0.40s 一条扫描线从上往下扫过
 *   1.56s 整层向中间合拢 + 淡出（老显示器关机那种）
 *
 * 硬约束（与旧版一致）：
 *  - 只在登录后首次进首页播一次（lib/welcome-flag.ts），刷新不重播
 *  - prefers-reduced-motion 直接不渲染
 *  - pointer-events-none，绝不抢点击；播完自己消失
 *  - 全部动画只用 opacity / transform / clip-path，不上 filter
 */

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import ScrambleGlitch from './ScrambleGlitch'

type Props = {
  orgName?: string
  userName?: string
  onDone?: () => void
}

const TOTAL_MS = 1900
const EXIT_AT = 1560

const CSS = `
@keyframes pjpc-welcome-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes pjpc-welcome-out {
  0%   { opacity: 1; clip-path: inset(0 0 0 0); }
  45%  { opacity: 1; clip-path: inset(0 0 0 0); }
  100% { opacity: 0; clip-path: inset(50% 0 50% 0); }
}
@keyframes pjpc-welcome-scan {
  0%   { transform: translate3d(0, 0, 0); opacity: 0; }
  12%  { opacity: 1; }
  88%  { opacity: 1; }
  100% { transform: translate3d(0, 100vh, 0); opacity: 0; }
}
@keyframes pjpc-welcome-bar {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
`

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
    <div
      data-welcome-intro
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[120] flex flex-col items-center justify-center overflow-hidden px-6"
      style={{
        background: 'radial-gradient(120% 90% at 50% 112%, #1b1206 0%, #0d0d11 44%, #070709 100%)',
        animation: `pjpc-welcome-in 220ms ease-out both, pjpc-welcome-out 340ms ${EXIT_AT}ms ease-in both`,
      }}
    >
      {/* 栅格：极淡，只为「屏幕」质感 */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.16) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(70% 62% at 50% 46%, #000 28%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(70% 62% at 50% 46%, #000 28%, transparent 100%)',
        }}
      />

      {/* 顶行小字 */}
      <div className="relative z-10 mb-5 font-mono text-[11px] uppercase tracking-[0.42em] text-white/40">
        <ScrambleGlitch text="PJPC · SECURE SESSION" delay={100} duration={520} slice={false} />
      </div>

      {/* 机构名：scramble + 青/品红切条 */}
      <h1 className="relative z-10 text-center text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
        <ScrambleGlitch text={orgName} delay={250} duration={880} />
      </h1>

      {/* 问候 */}
      <p className="relative z-10 mt-3 text-center text-base font-medium text-white/70 sm:text-lg">
        <ScrambleGlitch text={greeting} delay={700} duration={520} slice={false} />
      </p>

      {/* 扫描线 */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent"
        style={{ animation: 'pjpc-welcome-scan 1150ms 400ms linear both' }}
      />

      {/* 底部细线 */}
      <div className="relative z-10 mt-7 h-px w-40 overflow-hidden bg-white/10">
        <div
          className="h-full w-full origin-left bg-white/60"
          style={{ animation: 'pjpc-welcome-bar 1250ms 300ms cubic-bezier(.16,1,.3,1) both' }}
        />
      </div>

      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </div>
  )
}
