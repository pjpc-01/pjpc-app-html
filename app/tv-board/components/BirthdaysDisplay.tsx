import { Cake, Gift } from "lucide-react"
import { Student, ThemeColors } from "../types"
import { getDobDate } from "../utils"

interface BirthdaysDisplayProps {
  data: Student[]
  isBright: boolean
  colors: ThemeColors
}

export default function BirthdaysDisplay({
  data,
  isBright,
  colors
}: BirthdaysDisplayProps) {
  return (
    <div className="h-full w-full flex flex-col">
      {/* 重新设计的生日祝福横幅 */}
      {data.length > 0 && (
        <div className={`${colors.cardBase} rounded-2xl p-6 mb-6 overflow-hidden shadow-xl`}>
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${isBright ? 'bg-yellow-100' : 'bg-yellow-500/20'}`}>
              <Gift className={`w-8 h-8 ${isBright ? 'text-yellow-600' : 'text-yellow-300'}`} />
            </div>
            <div className="flex-1">
              <div className="text-center">
                <span className={`text-5xl font-black ${isBright ? 'text-gradient bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent' : 'text-pink-300'}`}>
                  🎉 Happy Birthday! 🎂
                </span>
                <div className={`text-2xl font-semibold mt-3 ${isBright ? 'text-slate-600' : 'text-slate-300'}`}>
                  {new Date().getMonth() + 1}月生日 · {data.length}位寿星 · 生日快乐！
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 当天生日学生特殊展示区域 */}
      {(() => {
        const todayBirthdays = data.filter((s: Student) => {
          const dob = getDobDate(s.dob)
          return dob && dob.getMonth() === new Date().getMonth() && dob.getDate() === new Date().getDate()
        })
        
        if (todayBirthdays.length > 0) {
          return (
            <div className="mb-6">
              {/* 当天生日标题 */}
              <div className={`${colors.cardBase} rounded-2xl p-4 shadow-xl mb-4`}>
                <div className="text-center">
                  <h3 className={`text-2xl font-black ${isBright ? 'text-yellow-600' : 'text-yellow-300'} mb-1`}>
                    🎉 今天生日的寿星们 🎂
                  </h3>
                  <p className={`text-lg ${colors.textMuted} font-semibold`}>
                    共有 {todayBirthdays.length} 位同学今天过生日
                  </p>
                </div>
              </div>
              
              {/* 当天生日学生特殊展示 - 大卡片 */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {todayBirthdays.slice(0, 3).map((s: Student) => {
                  const dob = getDobDate(s.dob)
                  return (
                    <div
                      key={s.id}
                      className={`${isBright ? 'bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 border-4 border-yellow-400 shadow-yellow-300 ring-4 ring-yellow-200/50' : 'bg-gradient-to-br from-yellow-500/30 via-orange-500/30 to-red-500/30 border-4 border-yellow-400/80 shadow-yellow-400/30 ring-4 ring-yellow-300/30'} rounded-2xl p-6 relative overflow-hidden shadow-xl transition-all duration-300 hover:scale-105`}
                    >
                      {/* 当天生日特殊装饰背景 */}
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-2 left-2 w-12 h-12 bg-yellow-400 rounded-full animate-pulse"></div>
                        <div className="absolute top-6 right-3 w-10 h-10 bg-orange-400 rounded-full animate-bounce"></div>
                        <div className="absolute bottom-4 left-6 w-8 h-8 bg-red-400 rounded-full animate-pulse"></div>
                        <div className="absolute bottom-2 right-2 w-14 h-14 bg-yellow-400 rounded-full animate-bounce"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-orange-400 rounded-full animate-ping"></div>
                        <div className="absolute top-1/4 left-1/4 w-5 h-5 bg-yellow-300 rounded-full animate-pulse"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-red-300 rounded-full animate-bounce"></div>
                        <div className="absolute top-3/4 left-3/4 w-3 h-3 bg-orange-300 rounded-full animate-ping"></div>
                      </div>
                      
                      {/* 学号徽章 */}
                      <div className={`inline-flex items-center px-4 py-2 rounded-xl text-lg font-black mb-4 shadow-lg ${
                        isBright ? 'bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800 border-2 border-yellow-400' : 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-yellow-100 border-2 border-yellow-400/70'
                      }`}>
                        {s.student_id || '--'} 🎂
                      </div>
                      
                      {/* 今天生日标识 - 右上角 */}
                      <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-black shadow-lg ${
                        isBright ? 'bg-yellow-200 text-yellow-800 border-2 border-yellow-400' : 'bg-yellow-500/30 text-yellow-200 border-2 border-yellow-400/70'
                      }`}>
                        🎉 今天生日！
                      </div>
                      
                      {/* 学生姓名 */}
                      <div className="text-center mb-4">
                        <h4 className={`text-xl font-black ${isBright ? 'text-slate-900' : 'text-white'} leading-tight`}>
                          {s.student_name}
                        </h4>
                      </div>
                      
                      {/* 生日日期 */}
                      <div className="text-center">
                        <div className={`text-sm ${colors.textMuted} mb-2 font-semibold`}>🎂 生日</div>
                        <div className={`text-2xl font-black mb-2 ${
                          isBright ? 'text-gradient bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent drop-shadow-lg' : 'text-yellow-200 drop-shadow-lg'
                        }`}>
                          {dob ? dob.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '未知'}
                        </div>
                        <div className={`text-sm font-black ${isBright ? 'text-yellow-600 bg-yellow-100' : 'text-yellow-300 bg-yellow-500/20'} px-3 py-1 rounded-full`}>
                          🎉 今天生日！
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }
        return null
      })()}

      {/* 重新设计的生日学生网格 */}
      <div className="flex-1 overflow-hidden">
        {data.length === 0 ? (
          <div className={`${colors.cardBase} rounded-2xl p-16 text-center h-full flex items-center justify-center shadow-xl`}>
            <div className="space-y-6">
              <div className={`p-6 rounded-3xl ${isBright ? 'bg-slate-100' : 'bg-slate-700/30'} mx-auto w-fit`}>
                <Cake className={`w-20 h-20 ${colors.textMuted}`} />
              </div>
              <div>
                <h3 className={`text-3xl font-black ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
                  本月暂无生日
                </h3>
                <p className={`text-xl ${colors.textMuted} mt-3 font-medium`}>
                  {new Date().getMonth() + 1}月暂无学生生日
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* 当天生日学生特殊区域 */}
            {(() => {
              const todayBirthdays = data.filter((s: Student) => {
                const dob = getDobDate(s.dob)
                return dob && dob.getMonth() === new Date().getMonth() && dob.getDate() === new Date().getDate()
              })
              
              if (todayBirthdays.length > 0) {
                return (
                  <div className="mb-6">
                    <div className={`${colors.cardBase} rounded-3xl p-6 mb-4 shadow-2xl border-4 border-yellow-400 ring-4 ring-yellow-200/50`}>
                      <div className="text-center mb-4">
                        <h3 className={`text-2xl font-black ${isBright ? 'text-yellow-800' : 'text-yellow-200'} mb-2`}>
                          🎉 今天生日的寿星们 🎂
                        </h3>
                        <p className={`text-lg ${isBright ? 'text-yellow-700' : 'text-yellow-300'} font-semibold`}>
                          共有 {todayBirthdays.length} 位同学今天过生日！
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {todayBirthdays.slice(0, 3).map((s: Student) => {
                          const dob = getDobDate(s.dob)
                          return (
                            <div
                              key={s.id}
                              className={`${isBright ? 'bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 border-4 border-yellow-400 shadow-yellow-300 ring-4 ring-yellow-200/50' : 'bg-gradient-to-br from-yellow-500/30 via-orange-500/30 to-red-500/30 border-4 border-yellow-400/80 shadow-yellow-400/30 ring-4 ring-yellow-300/30'} rounded-2xl p-4 relative overflow-hidden shadow-xl transition-all duration-300 hover:scale-105`}
                            >
                              {/* 当天生日特殊装饰背景 */}
                              <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-2 left-2 w-8 h-8 bg-yellow-400 rounded-full animate-pulse"></div>
                                <div className="absolute top-4 right-2 w-6 h-6 bg-orange-400 rounded-full animate-bounce"></div>
                                <div className="absolute bottom-3 left-4 w-5 h-5 bg-red-400 rounded-full animate-pulse"></div>
                                <div className="absolute bottom-2 right-2 w-10 h-10 bg-yellow-400 rounded-full animate-bounce"></div>
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-orange-400 rounded-full animate-ping"></div>
                              </div>
                              
                              {/* 学号徽章 */}
                              <div className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-black mb-3 shadow-lg ${
                                isBright ? 'bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800 border-2 border-yellow-400' : 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-yellow-100 border-2 border-yellow-400/70'
                              }`}>
                                {s.student_id || '--'} 🎂
                              </div>
                              
                              {/* 学生姓名 */}
                              <div className="text-center mb-3">
                                <h4 className={`text-lg font-black ${isBright ? 'text-slate-900' : 'text-white'} leading-tight`}>
                                  {s.student_name}
                                </h4>
                              </div>
                              
                              {/* 生日日期 */}
                              <div className="text-center">
                                <div className={`text-xs ${colors.textMuted} mb-1 font-semibold`}>🎂 今天生日</div>
                                <div className={`text-xl font-black ${
                                  isBright ? 'text-gradient bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent drop-shadow-lg' : 'text-yellow-200 drop-shadow-lg'
                                }`}>
                                  {dob ? dob.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '未知'}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            })()}
            
            {/* 本月其他生日学生 */}
            <div className="flex-1">
              <div className={`${colors.cardBase} rounded-2xl p-4 mb-4 shadow-xl`}>
                <h4 className={`text-lg font-black ${isBright ? 'text-slate-700' : 'text-slate-300'} text-center`}>
                  🎂 本月其他生日学生
                </h4>
              </div>
              <div className="grid grid-cols-5 grid-rows-3 gap-6 h-full">
                {data.filter((s: Student) => {
                  const dob = getDobDate(s.dob)
                  return !(dob && dob.getMonth() === new Date().getMonth() && dob.getDate() === new Date().getDate())
                }).slice(0, 15).map((s: Student) => {
                  const dob = getDobDate(s.dob)
                  
                  return (
                    <div
                      key={s.id}
                      className={`${colors.cardBase} rounded-2xl p-6 relative overflow-hidden shadow-xl transition-all duration-300 hover:scale-105 ${isBright ? 'hover:shadow-2xl' : 'hover:shadow-white/10'}`}
                    >
                      {/* 普通生日装饰背景 */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-3 left-3 w-10 h-10 bg-pink-400 rounded-full animate-pulse"></div>
                        <div className="absolute top-8 right-5 w-8 h-8 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="absolute bottom-6 left-8 w-6 h-6 bg-green-400 rounded-full animate-pulse"></div>
                        <div className="absolute bottom-3 right-3 w-12 h-12 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                      </div>
                      
                      {/* 学号徽章 - 更突出的设计 */}
                      <div className={`student-id inline-flex items-center px-4 py-2 rounded-xl text-xl font-black mb-4 shadow-lg border-2 ${
                        isBright ? 'bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 border-pink-300' : 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-pink-100 border-pink-400/50'
                      }`}>
                        {s.student_id || '--'}
                      </div>
                      
                      {/* 学生姓名 - 更清晰的层次 */}
                      <div className="text-center mb-4">
                        <h3 className={`text-xl font-black ${isBright ? 'text-slate-900' : 'text-white'} leading-tight`}>
                          {s.student_name}
                        </h3>
                      </div>
                      
                      {/* 生日日期 - 更醒目的设计 */}
                      <div className="text-center">
                        <div className={`text-sm ${colors.textMuted} mb-2 font-semibold`}>🎂 生日</div>
                        <div className={`text-2xl font-black ${isBright ? 'text-pink-600' : 'text-pink-300'} mb-2`}>
                          {dob ? dob.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '未知'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
