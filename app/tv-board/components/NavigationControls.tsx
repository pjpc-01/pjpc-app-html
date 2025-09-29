interface NavigationControlsProps {
  onPrev: () => void
  onNext: () => void
}

export default function NavigationControls({ onPrev, onNext }: NavigationControlsProps) {
  return (
    <div className="pointer-events-none fixed inset-0 flex items-center justify-between px-2 md:px-6">
      <button
        aria-label="上一页"
        onClick={onPrev}
        className="pointer-events-auto h-12 w-12 md:h-14 md:w-14 rounded-full bg-black/20 text-white/80 text-2xl flex items-center justify-center hover:bg-black/30 transition shadow-lg border border-white/10"
      >
        ‹
      </button>
      <button
        aria-label="下一页"
        onClick={onNext}
        className="pointer-events-auto h-12 w-12 md:h-14 md:w-14 rounded-full bg-black/20 text-white/80 text-2xl flex items-center justify-center hover:bg-black/30 transition shadow-lg border border-white/10"
      >
        ›
      </button>
    </div>
  )
}
