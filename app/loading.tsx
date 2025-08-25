import { GraduationCap } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <GraduationCap className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">系统加载中...</p>
      </div>
    </div>
  )
}
