import { AnnouncementItem, ThemeColors } from "../types"

interface AnnouncementsDisplayProps {
  data: AnnouncementItem[]
  isBright: boolean
  colors: ThemeColors
}

export default function AnnouncementsDisplay({
  data,
  isBright,
  colors
}: AnnouncementsDisplayProps) {
  return (
    <div className="h-full w-full flex flex-col">
      {/* 重新设计的公告标题栏 */}
      <div className={`${colors.cardBase} rounded-3xl p-8 mb-6 shadow-2xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className={`p-4 rounded-2xl ${isBright ? 'bg-gradient-to-br from-blue-100 to-indigo-100' : 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20'}`}>
              <svg className={`w-10 h-10 ${isBright ? 'text-blue-600' : 'text-blue-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div>
              <h2 className={`text-4xl font-black ${isBright ? 'text-slate-900' : 'text-white'} tracking-tight`}>
                📢 重要公告
              </h2>
              <p className={`text-xl ${colors.textMuted} font-medium`}>
                最新消息与通知
              </p>
            </div>
          </div>
          <div className={`px-6 py-3 rounded-2xl ${isBright ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700' : 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-200'} shadow-lg`}>
            <span className="text-2xl font-black">{data.length}</span>
            <span className="text-lg font-semibold ml-2">条公告</span>
          </div>
        </div>
      </div>

      {/* 公告列表 - 重新设计 */}
      <div className="flex-1 overflow-hidden">
        {(!data || data.length === 0) ? (
          <div className={`${colors.cardBase} rounded-2xl p-16 text-center h-full flex items-center justify-center shadow-xl`}>
            <div className="space-y-6">
              <div className={`p-6 rounded-3xl ${isBright ? 'bg-slate-100' : 'bg-slate-700/30'} mx-auto w-fit`}>
                <svg className={`w-20 h-20 ${colors.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div>
                <h3 className={`text-3xl font-black ${isBright ? 'text-slate-700' : 'text-slate-300'}`}>
                  暂无公告
                </h3>
                <p className={`text-xl ${colors.textMuted} mt-3 font-medium`}>
                  目前没有新的公告消息
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 h-full overflow-y-auto">
            {data.slice(0, 8).map((a, index) => (
              <div 
                key={a.id} 
                className={`${colors.cardBase} rounded-2xl p-6 relative overflow-hidden shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
              >
                {/* 公告装饰背景 */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-2 left-2 w-8 h-8 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="absolute top-6 right-4 w-6 h-6 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="absolute bottom-4 left-6 w-4 h-4 bg-purple-400 rounded-full animate-pulse"></div>
                  <div className="absolute bottom-2 right-2 w-10 h-10 bg-cyan-400 rounded-full animate-bounce"></div>
                </div>
                
                {/* 优先级指示器 - 更醒目的设计 */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-3 w-3 rounded-full shadow-lg ${
                    a.priority === 'high' 
                      ? `${isBright ? 'bg-red-500 animate-pulse' : 'bg-red-400 animate-pulse'}` 
                      : a.priority === 'low' 
                        ? `${isBright ? 'bg-emerald-600' : 'bg-emerald-400'}` 
                        : `${isBright ? 'bg-amber-500 animate-pulse' : 'bg-yellow-300 animate-pulse'}`
                  }`}></div>
                  <div className={`text-sm font-bold px-3 py-1 rounded-full ${
                    a.priority === 'high' 
                      ? `${isBright ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-200'}` 
                      : a.priority === 'low' 
                        ? `${isBright ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-200'}` 
                        : `${isBright ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-200'}`
                  }`}>
                    {a.priority === 'high' ? '🔴 高优先级' : a.priority === 'low' ? '🟢 低优先级' : '🟡 普通'}
                  </div>
                </div>
                
                {/* 公告标题 - 更突出的设计 */}
                <div className="mb-3">
                  <h3 className={`text-2xl font-black ${isBright ? 'text-slate-900' : 'text-white'} leading-tight`}>
                    {a.title}
                  </h3>
                </div>
                
                {/* 公告内容 - 更清晰的层次 */}
                <div className={`text-lg ${colors.textMuted} leading-relaxed line-clamp-3`}>
                  {a.content}
                </div>
                
                {/* 公告编号 - 右下角 */}
                <div className={`absolute bottom-3 right-3 text-xs font-bold ${
                  isBright ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
