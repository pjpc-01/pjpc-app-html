"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
  moduleName: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ModuleErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.moduleName}:`, error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-red-200 rounded-2xl bg-red-50 m-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            {this.props.moduleName} Module Error
          </h3>
          <p className="text-sm text-red-600 mb-6 max-w-md">
            Something went wrong while loading this module. The rest of the application is still working normally.
          </p>
          <Button variant="outline" onClick={this.handleReset} className="text-red-600 border-red-200 hover:bg-red-100">
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
