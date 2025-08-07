"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // 生成错误ID用于追踪
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.error("ErrorBoundary caught an error:", error, errorInfo)
    
    this.setState({
      errorInfo,
    })

    // 调用自定义错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 可以在这里发送错误报告到服务器
    this.reportError(error, errorInfo)
  }

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // 这里可以集成错误报告服务，如Sentry
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }

      console.log("Error Report:", errorReport)
      
      // 可以发送到服务器或错误报告服务
      // fetch('/api/error-report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // })
    } catch (reportError) {
      console.error("Failed to report error:", reportError)
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })
  }

  handleGoHome = () => {
    window.location.href = "/"
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // 如果有自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认错误UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Bug className="h-5 w-5" />
                系统错误
              </CardTitle>
              <CardDescription>
                抱歉，系统遇到了一个意外错误。我们的技术团队已经收到通知。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {this.state.error?.message || "未知错误"}
                </AlertDescription>
              </Alert>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-xs bg-gray-100 p-3 rounded">
                  <summary className="cursor-pointer font-medium mb-2">
                    错误详情 (开发模式)
                  </summary>
                  <div className="space-y-2">
                    <div>
                      <strong>错误ID:</strong> {this.state.errorId}
                    </div>
                    <div>
                      <strong>错误信息:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>错误堆栈:</strong>
                      <pre className="mt-1 text-xs overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>组件堆栈:</strong>
                        <pre className="mt-1 text-xs overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleRetry} variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重试
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="h-4 w-4 mr-2" />
                  返回首页
                </Button>
              </div>

              <Button onClick={this.handleReload} variant="default" className="w-full">
                重新加载页面
              </Button>

              {this.state.errorId && (
                <p className="text-xs text-gray-500 text-center">
                  错误ID: {this.state.errorId}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// 函数式错误边界Hook
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: Error) => {
    console.error("Error caught by useErrorHandler:", error)
    setError(error)
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  return { error, handleError, clearError }
} 