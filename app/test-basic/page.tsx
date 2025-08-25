export default function TestBasicPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">基本测试页面</h1>
      <p className="text-gray-600">这是一个基本的测试页面，用于验证Next.js是否正常工作。</p>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">系统状态</h2>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>✅ Next.js 开发服务器运行正常</li>
          <li>✅ 页面路由工作正常</li>
          <li>✅ 基本组件渲染正常</li>
        </ul>
      </div>
      
      <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <h2 className="text-lg font-semibold text-green-800 mb-2">下一步</h2>
        <p className="text-sm text-green-700">
          现在可以测试更复杂的组件和功能了。
        </p>
      </div>
    </div>
  )
}
