'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, FileSpreadsheet } from 'lucide-react'

export function TemplateDownload() {
  const downloadTemplate = () => {
    // 创建CSV模板内容
    const templateContent = `姓名,学号,年级,性别,出生日期,父亲电话,母亲电话,家庭地址
张三,STU001,Standard 1,男,2017-01-01,0123456789,0123456790,马来西亚柔佛州新山市
李四,STU002,Standard 2,女,2016-05-15,0123456791,0123456792,马来西亚柔佛州新山市
王五,STU003,Standard 3,男,2015-08-20,0123456793,0123456794,马来西亚柔佛州新山市`

    // 创建Blob并下载
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', '学生数据导入模板.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const openGoogleSheetsTemplate = () => {
    // 打开Google Sheets模板（这里使用一个示例模板）
    window.open('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing', '_blank')
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
            <li>• <strong>姓名</strong>：学生姓名（必填）</li>
            <li>• <strong>学号</strong>：学生学号（可选，系统会自动生成）</li>
            <li>• <strong>年级</strong>：年级信息，如 "Standard 1"（必填）</li>
            <li>• <strong>性别</strong>：男/女（可选）</li>
            <li>• <strong>出生日期</strong>：YYYY-MM-DD格式（可选）</li>
            <li>• <strong>父亲电话</strong>：父亲联系电话（可选）</li>
            <li>• <strong>母亲电话</strong>：母亲联系电话（可选）</li>
            <li>• <strong>家庭地址</strong>：家庭住址（可选）</li>
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
          <p><strong>注意：</strong></p>
          <ul className="mt-1 space-y-1">
            <li>• 第一行必须是列标题</li>
            <li>• 年级格式支持：Standard 1-6（小学），Standard 7+（中学）</li>
            <li>• 日期格式：YYYY-MM-DD</li>
            <li>• 电话号码格式：数字，如 0123456789</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
