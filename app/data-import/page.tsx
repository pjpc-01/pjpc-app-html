import SimpleCSVImport from '@/app/components/systems/data-import/simple-csv-import'
import { TemplateDownload } from '@/app/components/systems/data-import/TemplateDownload'
import { ImportGuide } from '@/app/components/systems/data-import/ImportGuide'
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function DataImportPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                返回主页
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold mb-2">数据导入</h1>
              <p className="text-muted-foreground">
                直接导入 CSV 数据到 PocketBase。支持文件上传或直接粘贴数据，简单快捷。
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：指南和模板 */}
          <div className="lg:col-span-1 space-y-6">
            <ImportGuide />
            <TemplateDownload />
          </div>
          
          {/* 右侧：导入功能 */}
                                <div className="lg:col-span-2">
                        <SimpleCSVImport />
                      </div>
        </div>
      </div>
    </div>
  )
} 