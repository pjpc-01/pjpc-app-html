import { useSearchParams } from "next/navigation"
import { ThemeColors } from "./types"

export function useTheme() {
  const searchParams = useSearchParams()
  const theme = (searchParams.get('theme') || 'bright').toLowerCase()
  const isBright = theme !== 'glass'
  
  const wrapClass = isBright
    ? "h-screen w-screen overflow-hidden text-slate-900 bg-gradient-to-br from-amber-50 via-white to-amber-50"
    : "h-screen w-screen overflow-hidden text-white bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
    
  const colors: ThemeColors = {
    textMuted: isBright ? 'text-slate-600' : 'text-slate-300',
    cardBase: isBright ? 'bg-white border border-slate-200 shadow-lg' : 'bg-white/10 backdrop-blur-md border border-white/10 shadow-lg',
    number: isBright ? 'text-emerald-600' : 'text-yellow-300',
    rankBadge: isBright ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-yellow-400/20 border-yellow-300/30 text-yellow-200',
    indicatorActive: isBright ? 'bg-emerald-600' : 'bg-white/90',
    indicator: isBright ? 'bg-slate-300' : 'bg-white/40',
  }

  return {
    isBright,
    wrapClass,
    colors
  }
}
