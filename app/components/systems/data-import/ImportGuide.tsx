'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Info, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react'

export function ImportGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          导入指南
        </CardTitle>
        <CardDescription>
          按照以下步骤完成数据导入
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 步骤说明 */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">1</Badge>
            <div>
              <h4 className="font-medium">准备数据</h4>
              <p className="text-sm text-muted-foreground">
                下载模板或创建Google Sheets，确保数据格式正确。第一行必须是列标题。
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">2</Badge>
            <div>
              <h4 className="font-medium">获取Spreadsheet ID</h4>
              <p className="text-sm text-muted-foreground">
                从Google Sheets URL中复制Spreadsheet ID。格式：https://docs.google.com/spreadsheets/d/<strong>SPREADSHEET_ID</strong>/edit
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">3</Badge>
            <div>
              <h4 className="font-medium">验证数据</h4>
              <p className="text-sm text-muted-foreground">
                点击&quot;验证表格&quot;检查数据格式是否正确，确保包含必需的字段。
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">4</Badge>
            <div>
              <h4 className="font-medium">预览数据</h4>
              <p className="text-sm text-muted-foreground">
                点击&quot;预览数据&quot;查看导入的数据内容，确认无误后再进行导入。
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1">5</Badge>
            <div>
              <h4 className="font-medium">开始导入</h4>
              <p className="text-sm text-muted-foreground">
                点击&quot;开始导入&quot;将数据导入到PocketBase数据库。
              </p>
            </div>
          </div>
        </div>

        {/* 必需字段 */}
        <Alert>
          <FileSpreadsheet className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">必需字段：</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>姓名</strong> - 学生姓名（必填）</div>
              <div><strong>年级</strong> - 年级信息（必填）</div>
              <div><strong>学号</strong> - 学生学号（可选）</div>
              <div><strong>性别</strong> - 男/女（可选）</div>
              <div><strong>出生日期</strong> - YYYY-MM-DD（可选）</div>
              <div><strong>父亲电话</strong> - 联系电话（可选）</div>
              <div><strong>母亲电话</strong> - 联系电话（可选）</div>
              <div><strong>家庭地址</strong> - 住址（可选）</div>
              <div><strong>中心</strong> - WX 01-04（可选）</div>
            </div>
          </AlertDescription>
        </Alert>

        {/* 故障排除 */}
        <div className="space-y-2">
          <h4 className="font-medium">常见问题：</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
              <div>
                <strong>权限错误：</strong>确保Google Sheets已设置为&quot;任何人都可以查看&quot;
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
              <div>
                <strong>格式错误：</strong>检查第一行是否为列标题，数据从第二行开始
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
              <div>
                <strong>网络问题：</strong>确保网络连接正常，可以访问Google Sheets API
              </div>
            </div>
          </div>
        </div>

        {/* 支持格式 */}
        <div className="space-y-2">
          <h4 className="font-medium">支持的年级格式：</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>小学：</strong>Standard 1-6, 一年级-六年级</div>
            <div><strong>中学：</strong>Standard 7+, 初一-初三</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
