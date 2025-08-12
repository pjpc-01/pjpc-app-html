import SimpleImport from '@/app/components/systems/data-import/simple-import'
import { TemplateDownload } from '@/app/components/systems/data-import/TemplateDownload'
import { ImportGuide } from '@/app/components/systems/data-import/ImportGuide'

export default function DataImportPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">数据导入</h1>
          <p className="text-muted-foreground">
            从Google Sheets导入学生数据到PocketBase。使用预设凭据，只需输入Spreadsheet ID即可。
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：指南和模板 */}
          <div className="lg:col-span-1 space-y-6">
            <ImportGuide />
            <TemplateDownload />
          </div>
          
          {/* 右侧：导入功能 */}
          <div className="lg:col-span-2">
            <SimpleImport />
          </div>
        </div>
      </div>
    </div>
  )
} 