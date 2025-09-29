interface StatusIndicatorProps {
  isRealtime: boolean
  onRefresh: () => void
}

export default function StatusIndicator({ isRealtime, onRefresh }: StatusIndicatorProps) {
  return (
    <div className="pointer-events-none fixed top-4 left-4 flex gap-2">
      <div className={`pointer-events-auto px-3 py-1 rounded-full text-xs font-semibold transition-all ${
        isRealtime 
          ? 'bg-green-500/80 text-white' 
          : 'bg-yellow-500/80 text-white'
      }`}>
        {isRealtime ? '🟢 实时' : '🟡 轮询'}
      </div>
      <button
        onClick={onRefresh}
        className="pointer-events-auto px-3 py-1 rounded-full bg-blue-500/80 text-white text-xs font-semibold hover:bg-blue-600/80 transition"
      >
        🔄 刷新
      </button>
    </div>
  )
}
