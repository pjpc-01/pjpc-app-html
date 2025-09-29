"use client"

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LucideIcon } from 'lucide-react'

interface TabConfig {
  id: string
  label: string
  icon: LucideIcon
  content: React.ReactNode
  disabled?: boolean
}

interface TabbedPageProps {
  tabs: TabConfig[]
  defaultTab?: string
  className?: string
  onTabChange?: (tabId: string) => void
}

export default function TabbedPage({ 
  tabs, 
  defaultTab,
  className,
  onTabChange 
}: TabbedPageProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id)

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    onTabChange?.(value)
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className={className}>
      <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm mb-6">
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab.id} 
            value={tab.id}
            disabled={tab.disabled}
            className="flex items-center gap-2"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="space-y-6">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
