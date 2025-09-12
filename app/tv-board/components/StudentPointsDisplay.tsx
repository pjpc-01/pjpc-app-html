import { StudentPoints, ThemeColors } from "../types"
import { getDobDate } from "../utils"

interface StudentPointsDisplayProps {
  data: StudentPoints[]
  isBright: boolean
  colors: ThemeColors
  currentPageIndex: number
}

export default function StudentPointsDisplay({
  data,
  isBright,
  colors,
  currentPageIndex
}: StudentPointsDisplayProps) {
  return (
    <div className="h-full w-full flex flex-col">
      {/* 重新设计的积分标题栏 */}
      <div className={`${colors.cardBase} rounded-3xl p-8 mb-6 shadow-2xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className={`p-4 rounded-2xl ${isBright ? 'bg-gradient-to-br from-emerald-100 to-green-100' : 'bg-gradient-to-br from-emerald-500/20 to-green-500/20'}`}>
              <svg className={`w-10 h-10 ${isBright ? 'text-emerald-600' : 'text-emerald-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h2 className={`text-4xl font-black ${isBright ? 'text-slate-900' : 'text-white'} tracking-tight`}>
                🏆 学生积分榜
              </h2>
              <p className={`text-xl ${colors.textMuted} font-medium`}>
                学习表现与成就展示
              </p>
            </div>
          </div>
          <div className={`px-6 py-3 rounded-2xl ${isBright ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700' : 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-200'} shadow-lg`}>
            <span className="text-2xl font-black">{data.length}</span>
            <span className="text-lg font-semibold ml-2">位学生</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4 auto-rows-fr flex-1">
        {data.map((p: any, i: number) => {
          const dob = getDobDate(p.student?.dob)
          const isToday = dob && dob.getMonth() === new Date().getMonth() && dob.getDate() === new Date().getDate()
          const isTopThree = i < 3 && currentPageIndex === 0  // 只有第一页显示前三名特效
          const rank = i + 1
          
          return (
            <div 
              key={p.id} 
              className={`relative rounded-2xl p-4 ${colors.cardBase} flex flex-col transition-all duration-300 ${
                isToday 
                  ? `${isBright ? 'bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 border-3 border-yellow-400 shadow-yellow-200' : 'bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 border-3 border-yellow-400/70 shadow-yellow-400/20'}`
                  : rank === 1 && currentPageIndex === 0
                    ? `${isBright ? 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-4 border-yellow-400 shadow-yellow-300 ring-4 ring-yellow-200/50' : 'bg-gradient-to-br from-yellow-500/30 via-amber-500/30 to-orange-500/30 border-4 border-yellow-400/80 shadow-yellow-400/30 ring-4 ring-yellow-300/30'}`
                    : isTopThree 
                      ? `${isBright ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-300 shadow-amber-200' : 'bg-gradient-to-br from-amber-500/20 via-yellow-500/20 to-orange-500/20 border-2 border-amber-400/50 shadow-amber-400/20'}`
                      : ''
              }`}
            >
              {/* 第一名特殊装饰背景 */}
              {rank === 1 && currentPageIndex === 0 && (
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-1 left-1 w-12 h-12 bg-yellow-400 rounded-full animate-pulse"></div>
                  <div className="absolute top-4 right-2 w-10 h-10 bg-orange-400 rounded-full animate-bounce"></div>
                  <div className="absolute bottom-3 left-4 w-8 h-8 bg-amber-400 rounded-full animate-pulse"></div>
                  <div className="absolute bottom-1 right-1 w-14 h-14 bg-yellow-400 rounded-full animate-bounce"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-orange-400 rounded-full animate-ping"></div>
                  <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-yellow-300 rounded-full animate-pulse"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-5 h-5 bg-amber-300 rounded-full animate-bounce"></div>
                </div>
              )}
              
              {/* 第二三名装饰背景 */}
              {isTopThree && rank !== 1 && (
                <div className="absolute inset-0 opacity-15">
                  <div className="absolute top-2 left-2 w-8 h-8 bg-yellow-400 rounded-full animate-pulse"></div>
                  <div className="absolute top-6 right-4 w-6 h-6 bg-orange-400 rounded-full animate-bounce"></div>
                  <div className="absolute bottom-4 left-6 w-4 h-4 bg-amber-400 rounded-full animate-pulse"></div>
                  <div className="absolute bottom-2 right-2 w-10 h-10 bg-yellow-400 rounded-full animate-bounce"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-orange-400 rounded-full animate-ping"></div>
                </div>
              )}
              
              {/* 生日装饰背景 - 只在当天生日时显示 */}
              {isToday && (
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-2 left-2 w-8 h-8 bg-pink-400 rounded-full animate-pulse"></div>
                  <div className="absolute top-6 right-4 w-6 h-6 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="absolute bottom-4 left-6 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="absolute bottom-2 right-2 w-10 h-10 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                </div>
              )}
              
              {/* 排名徽章 - 前三名特殊样式 */}
              {isTopThree && (
                <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg ${
                  rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                  rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                  'bg-gradient-to-br from-orange-400 to-orange-600'
                }`}>
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                </div>
              )}
              
              {/* 学号徽章 - 当天生日时特殊样式 */}
              <div className={`absolute top-2 left-2 rounded-md px-2.5 py-1 border text-sm sm:text-base font-semibold ${
                isToday 
                  ? `${isBright ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-300 text-yellow-700' : 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/50 text-yellow-200'}`
                  : rank === 1 && currentPageIndex === 0
                    ? `${isBright ? 'bg-gradient-to-r from-yellow-200 to-orange-200 border-yellow-400 text-yellow-800 shadow-lg' : 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-yellow-400/70 text-yellow-100 shadow-lg'}`
                    : isTopThree
                      ? `${isBright ? 'bg-gradient-to-r from-amber-100 to-yellow-100 border-amber-300 text-amber-700' : 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-400/50 text-amber-200'}`
                      : `${colors.rankBadge}`
              }`}>
                {p.student?.student_id || '--'}
                {isToday && <span className="ml-1">🎂</span>}
                {rank === 1 && !isToday && currentPageIndex === 0 && <span className="ml-1">👑</span>}
              </div>
              
              {/* 生日标识 - 右上角 */}
              {isToday && (
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-black ${
                  isBright ? 'bg-yellow-200 text-yellow-800' : 'bg-yellow-500/30 text-yellow-200'
                }`}>
                  🎉 今天生日
                </div>
              )}
              
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-1">
                {/* 英文名字 */}
                <div className={`text-sm font-medium truncate w-full ${
                  isToday ? (isBright ? 'text-slate-600' : 'text-slate-300') : 
                  isTopThree ? (isBright ? 'text-slate-600' : 'text-slate-300') : colors.textMuted
                }`}>
                  {p.student?.english_name || p.student?.student_name?.split(' ')[0] || ''}
                </div>
                {/* 华文名字 */}
                <div className={`text-base sm:text-lg font-semibold truncate w-full ${
                  isToday ? (isBright ? 'text-slate-900' : 'text-white') : 
                  isTopThree ? (isBright ? 'text-slate-900' : 'text-white') : ''
                }`}>
                  {p.student?.student_name || '未知'}
                </div>
                <div className={`text-3xl sm:text-4xl font-extrabold ${
                  isToday 
                    ? (isBright ? 'text-gradient bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent' : 'text-pink-300')
                    : rank === 1 && currentPageIndex === 0
                      ? (isBright ? 'text-gradient bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent drop-shadow-lg' : 'text-yellow-200 drop-shadow-lg')
                      : isTopThree
                        ? (isBright ? 'text-gradient bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent' : 'text-amber-300')
                        : colors.number
                }`}>
                  {p.current_points}
                </div>
                {isToday && (
                  <div className={`text-xs font-bold ${
                    isBright ? 'text-yellow-600' : 'text-yellow-300'
                  }`}>
                    🎂 生日快乐！
                  </div>
                )}
                {isTopThree && !isToday && (
                  <div className={`text-xs font-bold ${
                    rank === 1 
                      ? (isBright ? 'text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full' : 'text-yellow-200 bg-yellow-500/20 px-2 py-1 rounded-full')
                      : (isBright ? 'text-amber-600' : 'text-amber-300')
                  }`}>
                    {rank === 1 ? '👑 冠军' : rank === 2 ? '🥈 第二名' : '🥉 第三名'}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
