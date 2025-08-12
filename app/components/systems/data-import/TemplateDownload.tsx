'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, FileSpreadsheet } from 'lucide-react'

export function TemplateDownload() {
  const downloadTemplate = () => {
    // 创建CSV模板内容 - 添加BOM以解决中文乱码问题
    const templateContent = `ID,姓名,年级,父亲电话,母亲电话,地址,父亲姓名,母亲姓名,生日,性别,中心
STU001,张三,Standard 1,0123456789,0987654321,吉隆坡市中心,张先生,李女士,2015-01-15,男,WX 01
STU002,李四,Standard 2,0123456790,0987654322,雪兰莪州,李先生,王女士,2014-03-20,女,WX 01
STU003,王五,Standard 3,0123456791,0987654323,槟城,王先生,陈女士,2013-07-10,男,WX 01`

    // 添加UTF-8 BOM以解决中文乱码
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + templateContent], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'student-import-template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const openGoogleSheetsTemplate = () => {
    // 创建一个新的Google Sheets模板
    const templateUrl = 'https://docs.google.com/spreadsheets/create?usp=sharing'
    window.open(templateUrl, '_blank')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          下载模板
        </CardTitle>
        <CardDescription>
          下载学生数据导入模板，确保数据格式正确
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium">模板说明：</h4>
                     <ul className="text-sm text-muted-foreground space-y-1">
             <li>• <strong>ID</strong>：学生学号（可选，系统会自动生成）</li>
             <li>• <strong>姓名</strong>：学生姓名（必填）</li>
             <li>• <strong>年级</strong>：年级信息，如 "Standard 1"（必填）</li>
             <li>• <strong>性别</strong>：男/女（可选）</li>
             <li>• <strong>出生日期</strong>：YYYY-MM-DD格式（可选）</li>
             <li>• <strong>父亲电话</strong>：父亲联系电话（可选）</li>
             <li>• <strong>母亲电话</strong>：母亲联系电话（可选）</li>
             <li>• <strong>家庭地址</strong>：家庭住址（可选）</li>
             <li>• <strong>中心</strong>：WX 01, WX 02, WX 03, WX 04（可选，默认WX 01）</li>
           </ul>
        </div>

        <div className="flex gap-2">
          <Button onClick={downloadTemplate} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            下载CSV模板
          </Button>
          <Button onClick={openGoogleSheetsTemplate} variant="outline">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            打开Google Sheets模板
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p><strong>使用说明：</strong></p>
          <ul className="mt-1 space-y-1">
            <li>• 第一行必须是列标题</li>
            <li>• 年级格式支持：Standard 1-6（小学），Standard 7+（中学）</li>
            <li>• 日期格式：YYYY-MM-DD</li>
            <li>• 电话号码格式：数字，如 0123456789</li>
            <li>• 中心格式：WX 01, WX 02, WX 03, WX 04</li>
            <li>• 创建Google Sheets后，设置为"任何人都可以查看"</li>
            <li>• 复制Spreadsheet ID（URL中的长字符串）</li>
          </ul>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p><strong>字段映射到PocketBase：</strong></p>
          <ul className="mt-1 space-y-1">
            <li>• 姓名 → student_name</li>
            <li>• 学号 → student_id</li>
            <li>• 年级 → standard</li>
            <li>• 性别 → gender</li>
            <li>• 出生日期 → dob</li>
            <li>• 父亲电话 → father_phone</li>
            <li>• 母亲电话 → mother_phone</li>
            <li>• 家庭地址 → home_address</li>
            <li>• 中心 → Center</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
