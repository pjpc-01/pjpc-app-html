'use client'

/**
 * 幻灯片切页动效：标题 scramble glitch + 横向扫描条 + 内容切片进入。
 *
 * 设计约束（TV 盒子 / 老安卓机也要跑得动）：
 *  - 只用 transform / opacity / clip-path，不用 filter / backdrop-filter；
 *  - 每次切页才播一次，播完即止，不常驻 RAF；
 *  - prefers-reduced-motion 命中 → 完全没有动效，直接出终态。
 */

import { useReducedMotion } from 'framer-motion'
import ScrambleGlitch from './ScrambleGlitch'

const CSS = `
@keyframes pjpc-slide-sweep {
  0%   { transform: translate3d(-130%, 0, 0) skewX(-14deg); opacity: 0; }
  12%  { opacity: .85; }
  70%  { opacity: .55; }
  100% { transform: translate3d(130%, 0, 0) skewX(-14deg); opacity: 0; }
}
@keyframes pjpc-slide-flash {
  0%   { opacity: 0; }
  8%   { opacity: .18; }
  22%  { opacity: 0; }
  100% { opacity: 0; }
}
@keyframes pjpc-slide-slice-in {
  0%   { transform: translate3d(0, 6px, 0) scale(.995); opacity: .55; }
  60%  { transform: translate3d(0, 0, 0) scale(1); opacity: 1; }
  100% { transform: none; opacity: 1; }
}
@keyframes pjpc-slide-progress {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
@keyframes pjpc-title-glow {
  0%   { text-shadow: 0 0 0 rgba(34,211,238,0); }
  30%  { text-shadow: 0 0 18px rgba(34,211,238,.55), 0 0 34px rgba(217,70,239,.35); }
  100% { text-shadow: 0 0 0 rgba(34,211,238,0); }
}
`

/** 幻灯片标题：每次 trigger 变化重播 scramble + 色散光晕 */
export function GlitchTitle({
  text,
  trigger,
  className = '',
  duration = 620,
}: {
  text: string
  trigger: number
  className?: string
  duration?: number
}) {
  const reduce = useReducedMotion()
  if (reduce) return <span className={className}>{text}</span>
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <ScrambleGlitch key={trigger} text={text} duration={duration} delay={60} className={className} />
    </>
  )
}

/** 整页切页：一条斜切的扫描光带 + 一次极淡闪白 */
export function GlitchTransition({ trigger }: { trigger: number }) {
  const reduce = useReducedMotion()
  if (reduce) return null
  return (
    <div key={trigger} aria-hidden className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        className="absolute inset-y-0 -left-2/3 w-[55%] bg-gradient-to-r from-transparent via-cyan-400/45 to-transparent"
        style={{ animation: 'pjpc-slide-sweep 680ms cubic-bezier(.22,.61,.36,1) both' }}
      />
      <div
        className="absolute inset-y-0 -left-2/3 w-[18%] bg-gradient-to-r from-transparent via-cyan-100/70 to-transparent"
        style={{ animation: 'pjpc-slide-sweep 680ms 40ms cubic-bezier(.22,.61,.36,1) both' }}
      />
      <div
        className="absolute inset-y-0 -left-2/3 w-[30%] bg-gradient-to-r from-transparent via-fuchsia-400/35 to-transparent"
        style={{ animation: 'pjpc-slide-sweep 680ms 110ms cubic-bezier(.22,.61,.36,1) both' }}
      />
      <div className="absolute inset-0 bg-white" style={{ animation: 'pjpc-slide-flash 420ms ease-out both' }} />
    </div>
  )
}

/** 内容区：切页时按切片方式「接上信号」 */
export function GlitchContent({
  trigger,
  className = '',
  children,
}: {
  trigger: number
  className?: string
  children: React.ReactNode
}) {
  const reduce = useReducedMotion()
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        key={trigger}
        className={className}
        style={reduce ? undefined : { animation: 'pjpc-slide-slice-in 340ms cubic-bezier(.22,.61,.36,1) both' }}
      >
        {children}
      </div>
    </>
  )
}

/** 标题下方的时间条：跟 8 秒自动翻页同步，暂停就停在原地 */
export function SlideProgress({ trigger, durationMs, paused }: { trigger: number; durationMs: number; paused: boolean }) {
  const reduce = useReducedMotion()
  return (
    <div className="mx-auto mt-2.5 h-[3px] w-48 overflow-hidden rounded-full bg-white/10">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        key={`${trigger}-${paused}`}
        className="h-full origin-left rounded-full bg-cyan-300/80 shadow-[0_0_8px_rgba(34,211,238,0.7)]"
        style={reduce || paused ? { transform: 'scaleX(0)' } : { animation: `pjpc-slide-progress ${durationMs}ms linear both` }}
      />
    </div>
  )
}

/** 标题的光晕层（不参与 scramble，纯装饰） */
export function titleGlowStyle(trigger: number) {
  return { animation: 'pjpc-title-glow 900ms ease-out both' } as React.CSSProperties
}
