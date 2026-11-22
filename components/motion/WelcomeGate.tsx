'use client'

/**
 * 欢迎动效挂载点。
 *
 * 放在 layout 里而不是 app/page.tsx：登录后可能落到 /、/parent/dashboard、
 * /teacher-workspace 任意一处，挂在 layout 才能保证「登录后第一次进系统」
 * 一定看得到，而且不用在那四个页面各写一遍。
 *
 * ⚠️ 关键：不能在挂载时判断一次就完事。
 *    layout 在登录页时就已经挂载了，登录是 SPA 跳转（layout 不重新挂载），
 *    所以必须盯 `pathname`：离开 /login 的那一刻再读标记。
 *    （第一版就是只在 mount 时读，结果欢迎页等到下一次整页刷新才冒出来。）
 *
 * 只消费一次标记（lib/welcome-flag.ts），刷新/再导航都不会重播。
 */

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import WelcomeIntro from './WelcomeIntro'
import { consumeWelcome } from '@/lib/welcome-flag'
import { useCompanyProfile } from '@/lib/company-profile'
import { useAuth } from '@/contexts/pocketbase-auth-context'

export default function WelcomeGate() {
  const [show, setShow] = useState(false)
  const pathname = usePathname()
  const { profile } = useCompanyProfile()
  const { user, userProfile } = useAuth()

  useEffect(() => {
    // sessionStorage 在服务端不存在，只在 effect 里读
    if (!pathname || pathname === '/login') return
    if (consumeWelcome()) setShow(true)
  }, [pathname])

  const orgName = profile?.name || '安亲班'
  const userName =
    (userProfile as any)?.name || (user as any)?.name || (user as any)?.username || ''

  return (
    <AnimatePresence>
      {show && <WelcomeIntro orgName={orgName} userName={userName} onDone={() => setShow(false)} />}
    </AnimatePresence>
  )
}
