interface SlideIndicatorsProps {
  currentIndex: number
  totalSlides: number
  colors: {
    indicator: string
    indicatorActive: string
  }
  onSlideClick?: (index: number) => void
}

export default function SlideIndicators({ currentIndex, totalSlides, colors, onSlideClick }: SlideIndicatorsProps) {
  return (
    <div className="pb-4 px-6 flex items-center justify-center gap-2">
      {Array.from({ length: totalSlides }, (_, i) => (
        <button
          key={i} 
          onClick={() => onSlideClick?.(i)}
          className={`h-1.5 rounded-full transition-all ${
            i === currentIndex 
              ? `w-8 ${colors.indicatorActive}` 
              : `w-3 ${colors.indicator}`
          }`}
        />
      ))}
    </div>
  )
}
