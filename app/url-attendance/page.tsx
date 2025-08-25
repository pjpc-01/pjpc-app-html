import dynamic from 'next/dynamic'

const URLAttendanceSystem = dynamic(() => import('../components/systems/url-attendance-system'), {
  ssr: false,
  loading: () => <div>加载中...</div>
})

export default function URLAttendancePage() {
  return <URLAttendanceSystem />
}
