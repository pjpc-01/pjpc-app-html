import { useEffect, useState } from "react"
import { ThemeColors } from "../types"

interface TVBoardHeaderProps {
  center: string
  isBright: boolean
  colors: ThemeColors
  currentSlideIndex: number
  totalSlides: number
  currentSlideType: "student_points" | "birthdays" | "announcements"
}

export default function TVBoardHeader({
  center,
  isBright,
  colors,
  currentSlideIndex,
  totalSlides,
  currentSlideType
}: TVBoardHeaderProps) {
  const [now, setNow] = useState<string>(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))

  // clock updater
  useEffect(() => {
    const t = setInterval(() => {
      setNow(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))
    }, 1000 * 30)
    return () => clearInterval(t)
  }, [])

  const slideName = (type: "student_points" | "birthdays" | "announcements") =>
    type === 'student_points' ? '学生积分'
    : type === 'birthdays' ? '生日'
    : '公告'

  return (
    <div className="px-6 pt-4 pb-2">
      <div className="flex flex-col items-center space-y-3">
        {/* 分行名称 - 大标题 */}
        <div className="text-center">
          <h1 className={`text-3xl sm:text-4xl font-black ${isBright ? 'text-slate-900' : 'text-white'} tracking-wide`}>
            {center}
          </h1>
          <div className={`h-0.5 w-20 mx-auto mt-1 rounded-full ${isBright ? 'bg-gradient-to-r from-emerald-500 to-blue-500' : 'bg-gradient-to-r from-emerald-400 to-blue-400'}`}></div>
        </div>
        
        {/* 时间日期信息 - 卡片样式 */}
        <div className={`${colors.cardBase} rounded-xl px-6 py-3 shadow-lg`}>
          <div className="flex items-center space-x-6">
            {/* 当前时间 */}
            <div className="text-center">
              <div className={`text-2xl sm:text-3xl font-black ${isBright ? 'text-emerald-600' : 'text-emerald-300'}`}>
                {now}
              </div>
              <div className={`text-xs ${colors.textMuted} font-semibold uppercase tracking-wide`}>
                时间
              </div>
            </div>
            
            {/* 分隔线 */}
            <div className={`h-8 w-px ${isBright ? 'bg-slate-300' : 'bg-slate-600'}`}></div>
            
            {/* 当前日期 */}
            <div className="text-center">
              <div className={`text-2xl sm:text-3xl font-black ${isBright ? 'text-blue-600' : 'text-blue-300'}`}>
                {new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
              </div>
              <div className={`text-xs ${colors.textMuted} font-semibold uppercase tracking-wide`}>
                日期
              </div>
            </div>
            
            {/* 分隔线 */}
            <div className={`h-8 w-px ${isBright ? 'bg-slate-300' : 'bg-slate-600'}`}></div>
            
            {/* 星期 */}
            <div className="text-center">
              <div className={`text-2xl sm:text-3xl font-black ${isBright ? 'text-purple-600' : 'text-purple-300'}`}>
                {new Date().toLocaleDateString('zh-CN', { weekday: 'short' })}
              </div>
              <div className={`text-xs ${colors.textMuted} font-semibold uppercase tracking-wide`}>
                星期
              </div>
            </div>
          </div>
        </div>
        
        {/* 页面信息 - 小标签 */}
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full ${isBright ? 'bg-slate-100 text-slate-700' : 'bg-slate-700/30 text-slate-300'} text-xs font-semibold`}>
            第 {totalSlides ? (currentSlideIndex + 1) : 0} / {totalSlides} 页
          </div>
          <div className={`px-3 py-1 rounded-full ${isBright ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-300'} text-xs font-semibold`}>
            {slideName(currentSlideType)}
          </div>
        </div>
      </div>
    </div>
  )
}
