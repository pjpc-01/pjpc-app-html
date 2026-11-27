"use client"

/**
 * 主题动效（kinetic）—— 跟登录欢迎页 / 幻灯片同一套语言
 *
 * 两种：
 *  1) ThemeFlash：换主题那一刻全屏扫一次（斜切光带 + RGB 错位 + 闪白），700ms 结束
 *  2) ThemeAmbient：主题住下来之后的常驻低强度动效
 *     · 故障霓虹：每 9 秒一条斜切光带划过 + 顶部霓虹条呼吸
 *     · 乱码终端：光标闪烁（CSS 已有）+ 每 7 秒一条水平扫描带回扫
 *
 * 约束（照 SlideGlitch 的规矩来，TV 盒子/老安卓也要跑得动）：
 *  - 只用 transform / opacity，不用 filter / backdrop-filter
 *  - 播完即止，不常驻 requestAnimationFrame
 *  - prefers-reduced-motion 命中 → 全部不出
 */

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { useReducedMotion } from "framer-motion"
import type { ThemeId } from "@/contexts/theme-context"

const CSS = `
@keyframes pjpc-tf-band {
  0%   { transform: translate3d(-140%,0,0) skewX(-14deg); opacity: 0; }
  10%  { opacity: .9; }
  75%  { opacity: .5; }
  100% { transform: translate3d(140%,0,0) skewX(-14deg); opacity: 0; }
}
@keyframes pjpc-tf-rgb-a {
  0%,100% { transform: translate3d(0,0,0); opacity: 0; }
  20% { transform: translate3d(-6px,0,0); opacity: .55; }
  55% { transform: translate3d(4px,0,0); opacity: .35; }
  85% { transform: translate3d(-2px,0,0); opacity: .18; }
}
@keyframes pjpc-tf-rgb-b {
  0%,100% { transform: translate3d(0,0,0); opacity: 0; }
  20% { transform: translate3d(6px,0,0); opacity: .5; }
  55% { transform: translate3d(-4px,0,0); opacity: .32; }
  85% { transform: translate3d(2px,0,0); opacity: .16; }
}
@keyframes pjpc-tf-flash {
  0% { opacity: 0; }
  12% { opacity: .35; }
  40% { opacity: .06; }
  100% { opacity: 0; }
}
@keyframes pjpc-tf-drop {
  0% { transform: translate3d(0,-100%,0); }
  100% { transform: translate3d(0,100%,0); }
}
@keyframes pjpc-amb-band {
  0%, 86% { transform: translate3d(-140%,0,0) skewX(-14deg); opacity: 0; }
  88% { opacity: .6; }
  94% { opacity: .5; }
  98% { opacity: .25; }
  100% { transform: translate3d(120%,0,0) skewX(-14deg); opacity: 0; }
}
@keyframes pjpc-amb-scan {
  0%, 82% { transform: translate3d(0,-120%,0); opacity: 0; }
  85% { opacity: .5; }
  92% { opacity: .45; }
  97% { transform: translate3d(0,120%,0); opacity: .2; }
  100% { transform: translate3d(0,120%,0); opacity: 0; }
}
`

/** 换主题那一刻的整屏动效 */
export function ThemeFlash({ theme, trigger }: { theme: ThemeId; trigger: number }) {
  const reduce = useReducedMotion()
  const [alive, setAlive] = useState(false)
  const [shown, setShown] = useState(theme)

  useEffect(() => {
    if (reduce || trigger === 0) return
    setShown(theme)
    setAlive(true)
    const t = setTimeout(() => setAlive(false), 780)
    return () => clearTimeout(t)
  }, [trigger, theme, reduce])

  if (reduce || !alive) return null

  const glitch = shown === "glitch"
  const scan = shown === "scramble"

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pointer-events-none fixed inset-0 z-[9990] overflow-hidden">
        {/* 闪白 / 闪色 */}
        <div
          className="absolute inset-0"
          style={{
            background: glitch
              ? "radial-gradient(circle at 50% 45%, rgba(0,194,212,.22), transparent 70%)"
              : scan
                ? "radial-gradient(circle at 50% 45%, rgba(18,161,80,.20), transparent 70%)"
                : "radial-gradient(circle at 50% 45%, rgba(0,0,0,.08), transparent 70%)",
            animation: "pjpc-tf-flash .78s ease-out forwards",
          }}
        />
        {/* 斜切扫描光带 */}
        <div
          className="absolute top-0 h-full w-[70%]"
          style={{
            background: glitch
              ? "linear-gradient(90deg, transparent, rgba(0,194,212,.55), rgba(255,45,149,.45), transparent)"
              : scan
                ? "linear-gradient(90deg, transparent, rgba(18,161,80,.45), rgba(140,247,176,.35), transparent)"
                : "linear-gradient(90deg, transparent, rgba(0,0,0,.10), transparent)",
            animation: "pjpc-tf-band .78s cubic-bezier(.4,0,.2,1) forwards",
          }}
        />
        {/* 第二道光带，错开 140ms，换主题的瞬间更「活」 */}
        <div
          className="absolute top-0 h-full w-[45%]"
          style={{
            background: glitch
              ? "linear-gradient(90deg, transparent, rgba(255,45,149,.45), transparent)"
              : scan
                ? "linear-gradient(90deg, transparent, rgba(140,247,176,.35), transparent)"
                : "linear-gradient(90deg, transparent, rgba(0,0,0,.07), transparent)",
            animation: "pjpc-tf-band .78s cubic-bezier(.4,0,.2,1) forwards",
            animationDelay: "140ms",
            opacity: 0,
          }}
        />
        {glitch && (
          <>
            {/* RGB 错位：两条错开的细带 */}
            <div
              className="absolute inset-x-0 top-[38%] h-[2px]"
              style={{ background: "rgba(255,45,149,.9)", animation: "pjpc-tf-rgb-a .78s steps(3) forwards" }}
            />
            <div
              className="absolute inset-x-0 top-[52%] h-[2px]"
              style={{ background: "rgba(0,194,212,.9)", animation: "pjpc-tf-rgb-b .78s steps(3) forwards" }}
            />
          </>
        )}
        {scan && (
          <>
            {/* 终端：三列字符雨落下来 */}
            {[18, 50, 82].map((left, i) => (
              <div
                key={left}
                className="absolute top-0 h-1/2 w-[3px] opacity-70"
                style={{
                  left: `${left}%`,
                  background:
                    "repeating-linear-gradient(to bottom, rgba(18,161,80,.85) 0 6px, transparent 6px 14px)",
                  animation: `pjpc-tf-drop ${560 + i * 90}ms linear forwards`,
                  animationDelay: `${i * 60}ms`,
                }}
              />
            ))}
          </>
        )}
      </div>
    </>
  )
}

/** 换页动效：theme 不是默认时，每次路由切换扫一下（跟幻灯片切页同一个语汇） */
export function ThemeRouteSweep({ theme }: { theme: ThemeId }) {
  const reduce = useReducedMotion()
  const pathname = usePathname()
  const first = useRef(true)
  const [trigger, setTrigger] = useState(0)

  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (reduce || theme === "phantom") return
    setTrigger((n) => n + 1)
  }, [pathname, theme, reduce])

  if (reduce || theme === "phantom" || trigger === 0) return null

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pointer-events-none fixed inset-0 z-[9988] overflow-hidden">
        <div
          key={trigger}
          className="absolute top-0 h-full w-[45%]"
          style={{
            background: theme === "glitch"
              ? "linear-gradient(90deg, transparent, rgba(0,194,212,.35), transparent)"
              : "linear-gradient(90deg, transparent, rgba(18,161,80,.28), transparent)",
            animation: "pjpc-tf-band 460ms cubic-bezier(.4,0,.2,1) forwards",
          }}
        />
      </div>
    </>
  )
}

/** 主题常驻动效：住下来之后每隔几秒扫一下，别吵 */
export function ThemeAmbient({ theme }: { theme: ThemeId }) {
  const reduce = useReducedMotion()
  if (reduce || theme === "phantom") return null

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pointer-events-none fixed inset-0 z-[9989] overflow-hidden">
        {theme === "glitch" ? (
          <div
            className="absolute top-0 h-full w-[52%]"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(0,194,212,.55), rgba(255,45,149,.42), rgba(0,194,212,.25), transparent)",
              animation: "pjpc-amb-band 9s linear infinite",
            }}
          />
        ) : (
          <div
            className="absolute inset-x-0 h-[26vh]"
            style={{
              background:
                "linear-gradient(180deg, transparent, rgba(18,161,80,.34), rgba(140,247,176,.20), transparent)",
              animation: "pjpc-amb-scan 7s linear infinite",
            }}
          />
        )}
      </div>
    </>
  )
}
