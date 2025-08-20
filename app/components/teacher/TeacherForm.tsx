"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Teacher } from '@/hooks/useTeachers'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, MapPin, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface TeacherFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (teacherData: Partial<Teacher>) => Promise<void>
  teacher?: Teacher | null
  title?: string
}

export default function TeacherForm({ 
  open, 
  onOpenChange, 
  onSubmit, 
  teacher, 
  title = "添加教师" 
}: TeacherFormProps) {
  // 马来西亚银行列表
  const malaysianBanks = [
    { value: 'maybank', label: '马来亚银行 (Maybank)' },
    { value: 'cimb', label: '联昌国际银行 (CIMB Bank)' },
    { value: 'public', label: '大众银行 (Public Bank)' },
    { value: 'rhb', label: '兴业银行 (RHB Bank)' },
    { value: 'hongleong', label: '丰隆银行 (Hong Leong Bank)' },
    { value: 'ambank', label: '大马银行 (AmBank)' },
    { value: 'alliance', label: '联盟银行 (Alliance Bank)' },
    { value: 'affin', label: '艾芬银行 (Affin Bank)' },
    { value: 'bankislam', label: '伊斯兰银行 (Bank Islam)' },
    { value: 'bsn', label: '国民储蓄银行 (BSN)' },
    { value: 'agrobank', label: '农业银行 (AgroBank)' },
    { value: 'bankrakyat', label: '人民银行 (Bank Rakyat)' },
    { value: 'muamalat', label: '穆阿马莱银行 (Bank Muamalat)' },
    { value: 'ocbc', label: '华侨银行 (OCBC Bank)' },
    { value: 'uob', label: '大华银行 (UOB Bank)' },
    { value: 'hsbc', label: '汇丰银行 (HSBC Bank)' },
    { value: 'standardchartered', label: '渣打银行 (Standard Chartered)' },
    { value: 'citibank', label: '花旗银行 (Citibank)' },
    { value: 'deutsche', label: '德意志银行 (Deutsche Bank)' },
    { value: 'jpmorgan', label: '摩根大通银行 (JP Morgan)' },
    { value: 'other', label: '其他银行 (Other Bank)' }
  ]

  // 部门和职位映射
  const departmentPositions = {
    '管理层': [
      { 
        value: '中心负责人/校长', 
        label: '中心负责人 / 校长',
        description: '负责安亲班整体管理与决策\n制定教学方向、课程规划、招生策略\n审核财务、监督各部门运作\n处理家长重大投诉与对外沟通'
      },
      { 
        value: '副主任/协调员', 
        label: '副主任 / 协调员',
        description: '协助负责人管理日常事务\n协调各部门工作、确保流程顺畅\n代替负责人处理临时事务'
      }
    ],
    '学术部门': [
      { 
        value: '科任老师/辅导老师', 
        label: '科任老师 / 辅导老师',
        description: '辅导学生完成作业与课业\n提供补习与额外学术支持\n记录学生学习情况并汇报'
      },
      { 
        value: '班主任', 
        label: '班主任',
        description: '负责班级学生的考勤、纪律、日常管理\n定期与家长沟通学生表现\n作为班级与学校/家长的桥梁'
      },
      { 
        value: '学务主任', 
        label: '学务主任',
        description: '监督整体学业与学生学术表现\n制定考试、测验、功课安排\n组织老师之间的教学协调'
      }
    ],
    '学生事务与活动部门': [
      { 
        value: '学生事务老师', 
        label: '学生事务老师',
        description: '管理学生日常行为与纪律\n处理学生突发事件（争执、违规等）\n关注学生心理与情绪需求'
      },
      { 
        value: '活动与兴趣班老师', 
        label: '活动与兴趣班老师',
        description: '策划与执行兴趣活动、假期课程、比赛\n结合学生兴趣提供课外学习机会\n协助培养学生的全面发展'
      },
      { 
        value: '健康与安全监督', 
        label: '健康与安全监督',
        description: '监督学生用餐与卫生\n处理小型意外与突发健康状况\n确保放学接送安全'
      }
    ],
    '行政与家长沟通部门': [
      { 
        value: '行政人员', 
        label: '行政人员',
        description: '处理日常行政事务、文件管理\n协助招生、收费、记录管理\n维护学校日常运作'
      },
      { 
        value: '家长沟通专员', 
        label: '家长沟通专员',
        description: '定期与家长沟通学生表现\n处理家长咨询与投诉\n组织家长会与活动'
      }
    ],
    '财务与后勤部门': [
      { 
        value: '财务/会计助理', 
        label: '财务 / 会计助理',
        description: '管理学校财务、收费、支出\n制作财务报表、预算规划\n处理薪资、税务相关事务'
      },
      { 
        value: '后勤人员', 
        label: '后勤人员',
        description: '负责清洁、采购、餐饮服务\n维护学校环境与设施\n确保学生安全与舒适'
      }
    ]
  }

  const [formData, setFormData] = useState<Partial<Teacher>>({
    teacher_name: '',
    teacher_id: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    epfNo: '',
    socsoNo: '',
    joinDate: '',
    address: '',
    emergencyContact: '',
    notes: '',
    taxNo: '',
    isCitizen: true,
    marriedStatus: false,
    totalChild: 0,
    accountNo: '',
    bankName: '',
    bankAccountName: '',
    bankAccountNo: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [showQuickYears, setShowQuickYears] = useState(false)

  useEffect(() => {
    if (teacher) {
      setFormData({
        teacher_name: teacher.teacher_name || '',
        teacher_id: teacher.teacher_id || '',
        email: teacher.email || '',
        phone: teacher.phone || '',
        department: teacher.department || '',
        position: teacher.position || '',
        epfNo: teacher.epfNo || '',
        socsoNo: teacher.socsoNo || '',
        joinDate: teacher.joinDate || '',
        address: teacher.address || '',
        emergencyContact: teacher.emergencyContact || '',
        notes: teacher.notes || '',
        taxNo: teacher.taxNo || '',
        isCitizen: teacher.isCitizen ?? true,
        marriedStatus: teacher.marriedStatus ?? false,
        totalChild: teacher.totalChild || 0,
        accountNo: teacher.accountNo || '',
        bankName: teacher.bankName || '',
        bankAccountName: teacher.bankAccountName || '',
        bankAccountNo: teacher.bankAccountNo || ''
      })
    } else {
      setFormData({
        teacher_name: '',
        teacher_id: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        epfNo: '',
        socsoNo: '',
        joinDate: '',
        address: '',
        emergencyContact: '',
        notes: '',
        taxNo: '',
        isCitizen: true,
        marriedStatus: false,
        totalChild: 0,
        accountNo: '',
        bankName: '',
        bankAccountName: '',
        bankAccountNo: ''
      })
    }
    setErrors({})
  }, [teacher, open])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // 如果改变部门，重置职位
    if (field === 'department') {
      setFormData(prev => ({ ...prev, position: '' }))
    }
    
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // 验证必填字段
    const newErrors: Record<string, string> = {}
    if (!formData.teacher_name?.trim()) {
      newErrors.teacher_name = '教师姓名是必填项'
    }
    if (!formData.email?.trim()) {
      newErrors.email = '邮箱是必填项'
    }
    if (!formData.phone?.trim()) {
      newErrors.phone = '电话是必填项'
    }
    if (!formData.department) {
      newErrors.department = '部门是必填项'
    }
    if (!formData.position) {
      newErrors.position = '职位是必填项'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }
    
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      console.error('提交失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teacher_name">教师姓名 *</Label>
              <Input
                id="teacher_name"
                value={formData.teacher_name}
                onChange={(e) => handleInputChange('teacher_name', e.target.value)}
                placeholder="请输入教师姓名"
                className={errors.teacher_name ? 'border-red-500' : ''}
              />
              {errors.teacher_name && (
                <p className="text-sm text-red-500">{errors.teacher_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacher_id">教师工号</Label>
              <Input
                id="teacher_id"
                value={formData.teacher_id}
                onChange={(e) => handleInputChange('teacher_id', e.target.value)}
                placeholder="请输入教师工号"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="epfNo">EPF 号码</Label>
              <Input
                id="epfNo"
                value={formData.epfNo}
                onChange={(e) => handleInputChange('epfNo', e.target.value)}
                placeholder="请输入 EPF 号码"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="socsoNo">SOCSO 号码</Label>
              <Input
                id="socsoNo"
                value={formData.socsoNo}
                onChange={(e) => handleInputChange('socsoNo', e.target.value)}
                placeholder="请输入 SOCSO 号码"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">邮箱 *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="请输入邮箱"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">电话 *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="请输入电话"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">部门 *</Label>
              <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                <SelectTrigger className={errors.department ? 'border-red-500' : ''}>
                  <SelectValue placeholder="选择部门" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="管理层">管理层（Management）</SelectItem>
                  <SelectItem value="学术部门">学术部门（Academic Department）</SelectItem>
                  <SelectItem value="学生事务与活动部门">学生事务与活动部门（Student Affairs）</SelectItem>
                  <SelectItem value="行政与家长沟通部门">行政与家长沟通部门（Admin & Parent Liaison）</SelectItem>
                  <SelectItem value="财务与后勤部门">财务与后勤部门（Finance & Operations）</SelectItem>
                </SelectContent>
              </Select>
              {errors.department && (
                <p className="text-sm text-red-500">{errors.department}</p>
              )}
            </div>

                         <div className="space-y-2">
               <Label htmlFor="position">职位 *</Label>
               <Select 
                 value={formData.position}
                 onValueChange={(value) => handleInputChange('position', value)}
                 disabled={!formData.department}
               >
                <SelectTrigger className={errors.position ? 'border-red-500' : ''}>
                  <SelectValue placeholder={formData.department ? "选择职位" : "请先选择部门"} />
                </SelectTrigger>
                <SelectContent>
                  {formData.department && departmentPositions[formData.department as keyof typeof departmentPositions]?.map((pos) => (
                    <SelectItem 
                      key={pos.value}
                      value={pos.value}
                      className="hover:bg-blue-50"
                      title={pos.description}
                    >
                      {pos.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.position && (
                <p className="text-sm text-red-500">{errors.position}</p>
              )}
            </div>

                         <div className="space-y-2">
               <Label htmlFor="joinDate">入职日期</Label>
               <Button
                 type="button"
                 variant="outline"
                 className={cn(
                   "w-full justify-start text-left font-normal",
                   !formData.joinDate && "text-muted-foreground"
                 )}
                 onClick={() => setIsCalendarOpen(true)}
               >
                 <CalendarIcon className="mr-2 h-4 w-4" />
                 {formData.joinDate ? format(new Date(formData.joinDate), "PPP") : <span>选择入职日期</span>}
               </Button>
             </div>
          </div>

          {/* 财务信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxNo">税务号码</Label>
              <Input
                id="taxNo"
                value={formData.taxNo}
                onChange={(e) => handleInputChange('taxNo', e.target.value)}
                placeholder="请输入税务号码"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalChild">子女数量</Label>
              <Input
                id="totalChild"
                type="number"
                min="0"
                value={formData.totalChild}
                onChange={(e) => handleInputChange('totalChild', parseInt(e.target.value) || 0)}
                placeholder="请输入子女数量"
              />
            </div>
          </div>

          {/* 银行信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">银行信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">银行名称 *</Label>
                <Select value={formData.bankName} onValueChange={(value) => handleInputChange('bankName', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择银行" />
                  </SelectTrigger>
                  <SelectContent>
                    {malaysianBanks.map((bank) => (
                      <SelectItem key={bank.value} value={bank.value}>
                        {bank.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccountName">账户持有人姓名 *</Label>
                <Input
                  id="bankAccountName"
                  value={formData.bankAccountName}
                  onChange={(e) => handleInputChange('bankAccountName', e.target.value)}
                  placeholder="请输入账户持有人姓名"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccountNo">银行账号 *</Label>
                <Input
                  id="bankAccountNo"
                  value={formData.bankAccountNo}
                  onChange={(e) => handleInputChange('bankAccountNo', e.target.value)}
                  placeholder="请输入银行账号"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNo">其他账号</Label>
                <Input
                  id="accountNo"
                  value={formData.accountNo}
                  onChange={(e) => handleInputChange('accountNo', e.target.value)}
                  placeholder="请输入其他账号（可选）"
                />
              </div>
            </div>
          </div>

          {/* 个人状态信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>是否公民</Label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="isCitizen"
                    value="true"
                    checked={formData.isCitizen === true}
                    onChange={(e) => handleInputChange('isCitizen', e.target.value === 'true')}
                    className="text-blue-600"
                  />
                  <span>是</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="isCitizen"
                    value="false"
                    checked={formData.isCitizen === false}
                    onChange={(e) => handleInputChange('isCitizen', e.target.value === 'true')}
                    className="text-blue-600"
                  />
                  <span>否</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>婚姻状况</Label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="marriedStatus"
                    value="true"
                    checked={formData.marriedStatus === true}
                    onChange={(e) => handleInputChange('marriedStatus', e.target.value === 'true')}
                    className="text-blue-600"
                  />
                  <span>已婚</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="marriedStatus"
                    value="false"
                    checked={formData.marriedStatus === false}
                    onChange={(e) => handleInputChange('marriedStatus', e.target.value === 'true')}
                    className="text-blue-600"
                  />
                  <span>未婚</span>
                </label>
              </div>
            </div>
          </div>

          {/* 地址和紧急联系人 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">地址</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="请输入地址"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyContact">紧急联系人</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                placeholder="请输入紧急联系人"
              />
            </div>
          </div>

          {/* 备注 */}
          <div className="space-y-2">
            <Label htmlFor="notes">备注</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="请输入备注信息"
              rows={3}
            />
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '提交中...' : (teacher ? '更新' : '添加')}
            </Button>
          </div>
        </form>
      </DialogContent>

             {/* 日期选择器 */}
       <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle>选择教师入职日期</DialogTitle>
           </DialogHeader>
           
           <div className="space-y-4">
             {/* 快速年份选择 */}
             <div className="space-y-2">
               <Button
                 type="button"
                 variant="ghost"
                 size="sm"
                 className="text-xs h-6 p-1 w-full justify-between"
                 onClick={() => setShowQuickYears(!showQuickYears)}
               >
                 <span>快速选择年份</span>
                 <span>{showQuickYears ? '▼' : '▶'}</span>
               </Button>
               
               {showQuickYears && (
                 <div className="space-y-3 border-t pt-3">
                   {/* 最近年份 */}
                   <div className="space-y-2">
                     <p className="text-xs text-blue-600 font-medium">最近年份:</p>
                     <div className="grid grid-cols-4 gap-1">
                       {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017].map((year) => (
                         <Button
                           key={year}
                           variant="outline"
                           size="sm"
                           className="text-xs h-6 bg-blue-50 hover:bg-blue-100 px-1"
                           onClick={() => {
                             const dateString = `${year}-01-01`
                             handleInputChange('joinDate', dateString)
                             setIsCalendarOpen(false)
                           }}
                         >
                           {year}
                         </Button>
                       ))}
                     </div>
                   </div>
                   
                   {/* 更早年份 */}
                   <div className="space-y-2">
                     <p className="text-xs text-green-600 font-medium">更早年份:</p>
                     <div className="grid grid-cols-4 gap-1">
                       {[2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009].map((year) => (
                         <Button
                           key={year}
                           variant="outline"
                           size="sm"
                           className="text-xs h-6 bg-green-50 hover:bg-green-100 px-1"
                           onClick={() => {
                             const dateString = `${year}-01-01`
                             handleInputChange('joinDate', dateString)
                             setIsCalendarOpen(false)
                           }}
                         >
                           {year}
                         </Button>
                       ))}
                     </div>
                   </div>
                 </div>
               )}
             </div>
             
             {/* 日历组件 */}
             <Calendar
               mode="single"
               selected={formData.joinDate ? new Date(formData.joinDate) : undefined}
               onSelect={(date) => {
                 if (date) {
                   // 修复时区问题，确保日期正确
                   const year = date.getFullYear()
                   const month = String(date.getMonth() + 1).padStart(2, '0')
                   const day = String(date.getDate()).padStart(2, '0')
                   const dateString = `${year}-${month}-${day}`
                   handleInputChange('joinDate', dateString)
                 } else {
                   handleInputChange('joinDate', '')
                 }
                 // 选择日期后自动关闭日历
                 setIsCalendarOpen(false)
               }}
               disabled={(date) => {
                 const today = new Date()
                 // 限制入职日期范围：1990年到今天
                 const minDate = new Date("1990-01-01")
                 const maxDate = new Date()
                 return date > maxDate || date < minDate
               }}
               className="rounded-md border"
               captionLayout="dropdown"
               fromYear={1990}
               toYear={new Date().getFullYear()}
             />
             
             {/* 底部操作 */}
             <div className="flex justify-between items-center pt-2 border-t">
               <p className="text-sm text-gray-600">
                 {formData.joinDate ? `已选择: ${format(new Date(formData.joinDate), "yyyy年MM月dd日")}` : '请选择日期'}
               </p>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => {
                   handleInputChange('joinDate', '')
                   setIsCalendarOpen(false)
                 }}
               >
                 清除日期
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
    </Dialog>
  )
}
