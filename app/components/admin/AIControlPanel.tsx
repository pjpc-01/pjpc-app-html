"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Brain,
  Zap,
  Lightbulb,
  Target,
  BarChart,
  Sparkles
} from "lucide-react"

interface AIControlPanelProps {
  aiEnabled: boolean
  autoReviewEnabled: boolean
  onToggleAI: () => void
  onToggleAutoReview: () => void
  onIntelligentBulkApproval: () => void
  onBatchAIAnalysis: () => void
}

export default function AIControlPanel({
  aiEnabled,
  autoReviewEnabled,
  onToggleAI,
  onToggleAutoReview,
  onIntelligentBulkApproval,
  onBatchAIAnalysis
}: AIControlPanelProps) {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle className="text-lg">AI智能审核助手</CardTitle>
              <p className="text-sm text-gray-600">人工智能辅助审核决策</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={aiEnabled ? "default" : "outline"}
              size="sm"
              onClick={onToggleAI}
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              {aiEnabled ? 'AI已启用' : 'AI已禁用'}
            </Button>
            <Button
              variant={autoReviewEnabled ? "default" : "outline"}
              size="sm"
              onClick={onToggleAutoReview}
              className="flex items-center gap-2"
              disabled={!aiEnabled}
            >
              <Zap className="h-4 w-4" />
              {autoReviewEnabled ? '自动审核已启用' : '自动审核已禁用'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">智能建议</p>
              <p className="text-xs text-blue-700">基于风险评估算法</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <Target className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">自动审核</p>
              <p className="text-xs text-green-700">高置信度自动处理</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <BarChart className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-purple-900">风险分析</p>
              <p className="text-xs text-purple-700">实时风险评估</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-4">
          <Button
            onClick={onIntelligentBulkApproval}
            className="flex items-center gap-2"
            disabled={!aiEnabled}
          >
            <Brain className="h-4 w-4" />
            智能批量审核
          </Button>
          <Button
            variant="outline"
            onClick={onBatchAIAnalysis}
            className="flex items-center gap-2"
            disabled={!aiEnabled}
          >
            <Sparkles className="h-4 w-4" />
            AI分析所有待审核用户
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
