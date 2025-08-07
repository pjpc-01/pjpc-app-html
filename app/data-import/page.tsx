import SimpleImport from '@/app/components/systems/data-import/simple-import'

export default function DataImportPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">数据导入</h1>
          <p className="text-muted-foreground">
            从Google Sheets导入学生数据到Firebase Firestore。使用预设凭据，只需输入Spreadsheet ID即可。
          </p>
        </div>
        
        <SimpleImport />
      </div>
    </div>
  )
} 