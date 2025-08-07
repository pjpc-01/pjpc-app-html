"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  FileText, 
  Upload, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  Plus,
  CheckCircle,
  AlertCircle
} from "lucide-react"

export interface InvoiceTemplate {
  id: string
  name: string
  description: string
  htmlContent: string
  variables: string[]
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export default function InvoiceTemplateManager() {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([
    {
      id: "1",
      name: "标准发票模板",
      description: "默认的学校发票模板",
      htmlContent: `
        <div class="invoice-template">
          <div class="header">
            <h1>{{schoolName}}</h1>
            <p>{{schoolAddress}}</p>
            <p>电话: {{schoolPhone}}</p>
          </div>
          <div class="invoice-info">
            <h2>发票</h2>
            <p>发票号码: {{invoiceNumber}}</p>
            <p>开具日期: {{issueDate}}</p>
            <p>到期日期: {{dueDate}}</p>
          </div>
          <div class="student-info">
            <h3>学生信息</h3>
            <p>学生姓名: {{studentName}}</p>
            <p>年级: {{studentGrade}}</p>
            <p>家长姓名: {{parentName}}</p>
          </div>
          <div class="items">
            <h3>费用明细</h3>
            {{#each items}}
            <div class="item">
              <span>{{name}}</span>
              <span>RM {{amount}}</span>
            </div>
            {{/each}}
          </div>
          <div class="total">
            <h3>总计: RM {{totalAmount}}</h3>
          </div>
        </div>
      `,
      variables: [
        "schoolName", "schoolAddress", "schoolPhone", "invoiceNumber", 
        "issueDate", "dueDate", "studentName", "studentGrade", 
        "parentName", "items", "totalAmount"
      ],
      isDefault: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01"
    }
  ])

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null)
  const [uploadFormData, setUploadFormData] = useState({
    name: "",
    description: "",
    htmlContent: ""
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setUploadFormData(prev => ({
          ...prev,
          htmlContent: content
        }))
      }
      reader.readAsText(file)
    }
  }

  const handleUploadTemplate = () => {
    if (!uploadFormData.name || !uploadFormData.htmlContent) return

    const newTemplate: InvoiceTemplate = {
      id: Date.now().toString(),
      name: uploadFormData.name,
      description: uploadFormData.description,
      htmlContent: uploadFormData.htmlContent,
      variables: extractVariables(uploadFormData.htmlContent),
      isDefault: false,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    }

    setTemplates(prev => [...prev, newTemplate])
    setUploadFormData({ name: "", description: "", htmlContent: "" })
    setIsUploadDialogOpen(false)
  }

  const extractVariables = (htmlContent: string): string[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g
    const variables = new Set<string>()
    let match

    while ((match = variableRegex.exec(htmlContent)) !== null) {
      variables.add(match[1].trim())
    }

    return Array.from(variables)
  }

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId))
  }

  const handleSetDefault = (templateId: string) => {
    setTemplates(prev => prev.map(t => ({
      ...t,
      isDefault: t.id === templateId
    })))
  }

  const handleDownloadTemplate = (template: InvoiceTemplate) => {
    const blob = new Blob([template.htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.name}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadSampleTemplate = () => {
    // Download the sample template from public/templates/
    fetch('/templates/sample-invoice-template.html')
      .then(response => response.text())
      .then(content => {
        const blob = new Blob([content], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'sample-invoice-template.html'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      })
      .catch(error => {
        console.error('Failed to download sample template:', error)
      })
  }

  const renderTemplatePreview = (template: InvoiceTemplate) => {
    // Sample data for preview
    const sampleData = {
      schoolName: "智慧教育学校",
      schoolAddress: "北京市朝阳区教育路123号",
      schoolPhone: "010-12345678",
      invoiceNumber: "INV-2024-001",
      issueDate: "2024-01-15",
      dueDate: "2024-01-30",
      studentName: "王小明",
      studentGrade: "三年级",
      parentName: "王先生",
      items: [
        { name: "基础学费", amount: 800 },
        { name: "特色课程费", amount: 400 }
      ],
      totalAmount: 1200
    }

    let previewContent = template.htmlContent

    // Replace variables with sample data
    Object.entries(sampleData).forEach(([key, value]) => {
      if (key === 'items') {
        // Handle array items specially
        if (Array.isArray(value)) {
          const itemsHtml = value.map((item: any) => 
                            `<div class="item"><span>${item.name}</span><span>RM ${item.amount}</span></div>`
          ).join('')
          previewContent = previewContent.replace(/\{\{#each items\}\}([\s\S]*?)\{\{\/each\}\}/g, itemsHtml)
        }
      } else {
        previewContent = previewContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value))
      }
    })

    return previewContent
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            发票模板管理
          </CardTitle>
          <CardDescription>上传和管理自定义发票模板</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadSampleTemplate}>
                <Download className="h-4 w-4 mr-2" />
                下载示例模板
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                预览所有
              </Button>
            </div>
            <Button size="sm" onClick={() => setIsUploadDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              上传模板
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>模板名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>变量数量</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建日期</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>{template.description}</TableCell>
                  <TableCell>{template.variables.length}</TableCell>
                  <TableCell>
                    {template.isDefault ? (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        默认
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        自定义
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{template.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template)
                          setIsPreviewDialogOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDownloadTemplate(template)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!template.isDefault && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {!template.isDefault && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleSetDefault(template.id)}
                        >
                          设为默认
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upload Template Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>上传发票模板</DialogTitle>
            <DialogDescription>上传HTML模板文件或手动创建模板</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateName">模板名称</Label>
                <Input
                  id="templateName"
                  value={uploadFormData.name}
                  onChange={(e) => setUploadFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入模板名称"
                />
              </div>
              <div>
                <Label htmlFor="templateDescription">描述</Label>
                <Input
                  id="templateDescription"
                  value={uploadFormData.description}
                  onChange={(e) => setUploadFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="输入模板描述"
                />
              </div>
            </div>

            <div>
              <Label>上传HTML文件</Label>
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html,.htm"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  选择HTML文件
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="htmlContent">HTML内容</Label>
              <Textarea
                id="htmlContent"
                value={uploadFormData.htmlContent}
                onChange={(e) => setUploadFormData(prev => ({ ...prev, htmlContent: e.target.value }))}
                placeholder="粘贴HTML模板内容或使用变量如 {{studentName}}, {{totalAmount}} 等"
                className="min-h-[300px] font-mono text-sm"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">可用变量</h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div><code>{'{{schoolName}}'}</code> - 学校名称</div>
                <div><code>{'{{schoolAddress}}'}</code> - 学校地址</div>
                <div><code>{'{{schoolPhone}}'}</code> - 学校电话</div>
                <div><code>{'{{invoiceNumber}}'}</code> - 发票号码</div>
                <div><code>{'{{issueDate}}'}</code> - 开具日期</div>
                <div><code>{'{{dueDate}}'}</code> - 到期日期</div>
                <div><code>{'{{studentName}}'}</code> - 学生姓名</div>
                <div><code>{'{{studentGrade}}'}</code> - 学生年级</div>
                <div><code>{'{{parentName}}'}</code> - 家长姓名</div>
                <div><code>{'{{totalAmount}}'}</code> - 总金额</div>
                <div><code>{'{{#each items}}'}</code> - 费用项目循环</div>
                <div><code>{'{{name}}'}</code> - 项目名称</div>
                <div><code>{'{{amount}}'}</code> - 项目金额</div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsUploadDialogOpen(false)
                  setUploadFormData({ name: "", description: "", htmlContent: "" })
                }}
              >
                取消
              </Button>
              <Button 
                onClick={handleUploadTemplate}
                disabled={!uploadFormData.name || !uploadFormData.htmlContent}
              >
                上传模板
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Template Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>模板预览 - {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>预览模板效果</DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">模板信息</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">名称:</span> {selectedTemplate.name}</div>
                  <div><span className="font-medium">描述:</span> {selectedTemplate.description}</div>
                  <div><span className="font-medium">变量数量:</span> {selectedTemplate.variables.length}</div>
                  <div><span className="font-medium">状态:</span> {selectedTemplate.isDefault ? "默认" : "自定义"}</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">预览效果</h3>
                <div 
                  className="border rounded-lg p-4 bg-white"
                  dangerouslySetInnerHTML={{ 
                    __html: renderTemplatePreview(selectedTemplate) 
                  }}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">HTML源码</h3>
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                  {selectedTemplate.htmlContent}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>编辑模板 - {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>修改模板内容</DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editTemplateName">模板名称</Label>
                  <Input
                    id="editTemplateName"
                    value={selectedTemplate.name}
                    onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="editTemplateDescription">描述</Label>
                  <Input
                    id="editTemplateDescription"
                    value={selectedTemplate.description}
                    onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, description: e.target.value } : null)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="editHtmlContent">HTML内容</Label>
                <Textarea
                  id="editHtmlContent"
                  value={selectedTemplate.htmlContent}
                  onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, htmlContent: e.target.value } : null)}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  取消
                </Button>
                <Button 
                  onClick={() => {
                    // TODO: Implement save functionality
                    setIsEditDialogOpen(false)
                  }}
                >
                  保存修改
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 