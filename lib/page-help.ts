/**
 * 每个页面的「?」说明内容。
 *
 * 为什么放在这里而不是每个页面自己写：80 多个页面，一个一个加说明一定会漏。
 * PageLayout 用 usePathname() 自动来这里查，页面不用改一行代码；
 * 查不到的页面退回「通用说明」（标题 + 描述 + 通用流程）。
 *
 * chart 是 mermaid 源码，前端懒加载 mermaid 才渲染，不进主 bundle。
 * 写法约束：节点文字用双引号包住，不要用括号/冒号（mermaid 会解析失败）。
 */

export type PageHelp = {
  /** 一句话：这页是干什么的 */
  summary: { zh: string; en: string }
  /** 流程图（mermaid flowchart / sequenceDiagram） */
  chart?: string
  /** 追加的图（状态图等），弹窗里依次排下去 */
  moreCharts?: string[]
  /** 怎么用：3–6 步 */
  steps: { zh: string[]; en: string[] }
  /** 注意事项 / 常见坑 */
  tips?: { zh: string[]; en: string[] }
}

const HELP: Record<string, PageHelp> = {
  '/': {
    summary: { zh: '总览：今天该看什么一眼就知道', en: 'Overview: what needs attention today' },
    chart: `flowchart TD
  A["登录"] --> B["仪表板总览"]
  B --> C["今日出勤"]
  B --> D["待收发票"]
  B --> E["老师排班"]
  B --> F["快捷入口"]
  C --> G["异常就点进去处理"]
  D --> G
  E --> G`,
    steps: {
      zh: ['先看上方数字卡：出勤、学生数、本月收入', '点任何一张卡会跳到对应明细页', '右侧快捷入口常用：点名、积分、开票'],
      en: ['Check the stat cards first', 'Click a card to open its detail page', 'Quick actions on the right'],
    },
  },

  '/student-management': {
    summary: { zh: '学生档案：名单、分班、中心、在读状态', en: 'Students: roster, class, center, status' },
    chart: `flowchart LR
  A["学生列表"] --> B["筛选 中心 / 年级 / 状态"]
  B --> C["点学生进详情"]
  C --> D["编辑资料"]
  C --> E["看考勤与积分"]
  C --> F["看费用与发票"]
  D --> G["保存"]`,
    steps: {
      zh: ['用上方筛选先缩到某个中心或年级', '点名字进详情，改完记得保存', '停课/毕业改的是「状态」，不是年级'],
      en: ['Filter by center or grade', 'Open a student to edit', 'Leaving is a status change, not grade'],
    },
    moreCharts: [`stateDiagram-v2
    [*] --> active: 注册 审核通过
    active --> withdrawn: 停课或停学
    active --> graduated: 毕业
    withdrawn --> active: 复课
    withdrawn --> deleted: 软删除
    graduated --> deleted: 软删除`],
    tips: {
      zh: ['停课 withdrawn 和毕业 graduated 的学生不该出现在点名名册', '学号 MMA 开头的是拳班，不属于安亲班'],
      en: ['Inactive students are hidden from roll call', 'Student IDs starting with MMA are course-only'],
    },
  },

  '/attendance': {
    summary: { zh: '考勤中心：刷卡记录、出勤统计、异常', en: 'Attendance hub: taps, stats, exceptions' },
    chart: `flowchart TD
  A["学生刷卡 NFC"] --> B["打卡记录 student_attendance"]
  B --> C["准时 +2 分"]
  B --> D["迟到 / 早退 按设置扣分"]
  E["老师点名 roll_call"] --> F["缺勤 -3 分"]
  F --> G["改成出席可退回"]
  C --> H["考勤中心显示"]
  D --> H`,
    steps: {
      zh: ['看今天：本页按分行列出刷卡记录', '异常（没刷卡但人来了）用点名页补勾', '分数不会自己重算，改点名才会退/扣'],
      en: ['Today taps are listed by center', 'Use roll call to mark those who came without tapping', 'Only roll call changes points'],
    },
    tips: {
      zh: ['打卡和点名是两套记录，互不改写', '自动扣分每天 18:00–22:00 跑，当天已点名出席的人会被豁免'],
      en: ['Taps and roll call are separate records', 'Auto deduction runs 18:00–22:00 and skips students marked present'],
    },
  },

  '/attendance/manual': {
    summary: { zh: '手动点名：老师勾今天谁真的来了', en: 'Manual roll call: who actually came today' },
    chart: `flowchart TD
  A["选分行"] --> B["今天的学生名册"]
  B --> C["点圆圈记出席"]
  C --> C2["再点变叉可撤销"]
  B --> D["批量弹窗记缺勤"]
  D --> E["按 points_absent 扣分"]
  C2 --> F["撤销会退回扣掉的分"]`,
    moreCharts: [`stateDiagram-v2
    [*] --> 未点名
    未点名 --> present: 老师点圆圈记出席
    未点名 --> absent: 批量弹窗记缺勤 扣分
    未点名 --> leave: 请假单 不扣分
    absent --> present: 改成出席 退回扣的分
    present --> 未点名: 再点一下撤销
    absent --> 未点名: 撤销 退回扣的分`],
    steps: {
      zh: ['先选分行 tab，只显示该中心在读学生', '一人一个圆按钮：勾 = 出席，再点变叉 = 未点名', '缺勤要在批量弹窗里处理，没勾的人才会被记缺勤'],
      en: ['Pick a center tab', 'One round button per student', 'Absence is recorded in the batch dialog'],
    },
    tips: {
      zh: ['请假走请假单，这里只分来了没来', '同一人同一天只保留一条记录'],
      en: ['Leave requests go through the leave form', 'One record per student per day'],
    },
  },

  '/points': {
    summary: { zh: '积分中心：加减分、流水、排行榜', en: 'Points: add/deduct, logs, ranking' },
    chart: `flowchart TD
  A["搜学生"] --> B["加分或扣分"]
  B --> C["写 point_logs 流水"]
  C --> D["更新 students.points"]
  D --> E["排行榜 与 贡献积分"]
  F["刷卡 +2"] --> C
  G["缺勤 -3"] --> C`,
    steps: {
      zh: ['先搜学生（名字或学号）', '选原因再填分数，加减都在同一处', '每次改动都会留一条流水，可追'],
      en: ['Search the student', 'Pick a reason and amount', 'Every change leaves a log entry'],
    },
    tips: {
      zh: ['分数以 students.points 为准，流水只做凭证', '贡献物品兑换会扣分，注意余额'],
      en: ['Balance lives in students.points', 'Redemptions deduct from the balance'],
    },
  },

  '/contribution-management': {
    summary: { zh: '贡献积分：升级物品、排行榜、领取记录', en: 'Contribution points: rewards, ranking, claims' },
    chart: `flowchart LR
  A["建物品 + 所需积分"] --> B["学生捐分累积"]
  B --> C["物品贡献榜"]
  C --> D["够分就可标记已领取"]
  D --> E["下架 / 删除"]
  C --> F["电视看板幻灯片"]`,
    moreCharts: [`stateDiagram-v2
    [*] --> active: 建物品 填所需积分
    active --> achieved: 贡献积分够了
    achieved --> closed: 已领取或下架
    active --> closed: 直接下架
    closed --> [*]`],
    steps: {
      zh: ['先建物品并填所需积分', '贡献榜放照片下方，按捐分排序', '领取、下架、删除都在物品详情里'],
      en: ['Create the reward with a point cost', 'Ranking sits under the photo', 'Claim and archive live in the detail dialog'],
    },
  },

  '/finance': {
    summary: { zh: '财务分区：总览、发票、收款、费用、报表', en: 'Finance area: overview, invoices, receipts, expenses, reports' },
    chart: `flowchart LR
  A["学生费用"] --> B["开票"]
  B --> C["收款"]
  C --> D["对账"]
  D --> E["报表 / 催收"]
  F["支出 与 报销"] --> D`,
    moreCharts: [`stateDiagram-v2
    [*] --> issued: 开票
    issued --> partially_paid: 收到部分款
    issued --> paid: 一次付清
    issued --> cancelled: 作废
    issued --> carried_forward: 结转下月
    partially_paid --> paid: 补齐余款
    carried_forward --> paid: 下月付清
    paid --> [*]
    cancelled --> [*]`],
    steps: {
      zh: ['先看总览，再进具体分区', '开票金额来自学生费用配置，不在这里手改', '收款后发票状态会自动变'],
      en: ['Start from overview', 'Invoice amounts come from student fees', 'Receipts update invoice status'],
    },
  },

  '/finance-management': {
    summary: { zh: '财务：发票、收款、费用、报表', en: 'Finance: invoices, receipts, fees, reports' },
    chart: `flowchart TD
  A["学生费用 student_fees"] --> B["开票 invoices"]
  B --> C["收款 receipts"]
  C --> D["对账 收付一致"]
  D --> E["月度结算"]
  E --> F["报表 与 催收"]`,
    steps: {
      zh: ['金额来自「学生费用」，不要在发票上手改', '收款后状态会自动转「部分付款 / 已付款」', '月底做一次结算，数字才对得起来'],
      en: ['Amounts come from student fees', 'Receipts update invoice status', 'Run monthly closing to reconcile'],
    },
    tips: {
      zh: ['餐点、迟接等按当月实际份数增减', '作废发票不会删记录，只是标记'],
      en: ['Meal/late fees follow actual usage', 'Voiding keeps the record'],
    },
  },

  '/finance/payroll': {
    summary: { zh: '薪资：结构、排班工时、发薪记录', en: 'Payroll: structures, scheduled hours, records' },
    chart: `flowchart TD
  A["薪资结构 时薪 / 月薪"] --> B["工时只算排班"]
  B --> C["算 gross"]
  C --> D["EPF SOCSO EIS PCB 仅月薪"]
  D --> E["净薪 payslip"]
  F["补发 / 奖金"] --> C`,
    moreCharts: [`stateDiagram-v2
    [*] --> draft: 批量生成或手动建
    draft --> approved: 院长审核
    draft --> paid: 直接标记已发
    approved --> paid: 发薪
    paid --> [*]`],
    steps: {
      zh: ['时薪老师工时只认排班，不看打卡', '月薪固定按 160 小时', '补发请写在「补贴项」，会算进 gross'],
      en: ['Hourly pay uses schedules only', 'Monthly uses a fixed 160h', 'Back-pay belongs in allowance items'],
    },
    tips: {
      zh: ['SOCSO/EIS 有上限关卡', 'PCB 要勾选才会扣'],
      en: ['SOCSO/EIS are capped', 'PCB only applies when enabled'],
    },
  },

  '/course-management': {
    summary: { zh: '课程与课表：各年级时间表、甘特图', en: 'Courses and timetable' },
    chart: `flowchart LR
  A["建课程"] --> B["排时间与老师"]
  B --> C["年级课表视图"]
  C --> D["打印 / 给家长"]
  B --> E["甘特图总览"]`,
    steps: {
      zh: ['先在课程里建好科目和时间', '再给每个时段排老师', '课表按年级分色，可直接打印'],
      en: ['Create the course and slot', 'Assign teachers per slot', 'Timetable is printable'],
    },
  },

  '/student-reports': {
    summary: { zh: '学生报告：每学期一份，含各科评语', en: 'Student reports, one per term' },
    chart: `flowchart TD
  A["教学评估 老师填评语"] --> B["自动写进同学期报告"]
  B --> C["学生报告 subjects"]
  C --> D["打印 / 家长查看"]`,
    steps: {
      zh: ['报告按学年 + 学期 + 学生定位', '老师在教学评估里填的评语会自动同步到对应科目', '多位老师同科会合并成两段并署名'],
      en: ['Reports are keyed by year, term, student', 'Teacher comments sync automatically', 'Multiple teachers merge with names'],
    },
    tips: {
      zh: ['手打的评语不会被自动同步覆盖', '只有 source=eval 的内容会被清空规则影响'],
      en: ['Manual comments are safe', 'Only source=eval entries are cleared'],
    },
  },

  '/teacher-teaching-report': {
    summary: { zh: '教学评估：分数等级 + 学生评语', en: 'Teaching evaluation: ratings and comments' },
    chart: `flowchart TD
  A["选教师 科目 年级 学期"] --> B["学生程度分析 打 6 项等级"]
  B --> C["学生整体学习表现 写评语"]
  C --> D["提交"]
  D --> E["同步到学生报告"]`,
    steps: {
      zh: ['第一块加学生并打 6 项等级', '第二块只填评语，会自动进学生报告', '提交后右上角提示同步了多少条'],
      en: ['Add students and rate six items', 'Comments sync on submit', 'A toast shows the sync result'],
    },
  },

  '/teacher-workspace': {
    summary: { zh: '教师工作台：我的排班、概览、快捷操作', en: 'Teacher workspace' },
    chart: `flowchart TD
  A["我的排班日历"] --> B["概览 今日课程"]
  B --> C["快速操作 评估 报告 点名 请假"]`,
    steps: {
      zh: ['先看今天的排班', '缺勤/补课在请假或点名里处理'],
      en: ['Check today schedule first', 'Handle absence in leave or roll call'],
    },
  },

  '/daily-logs': {
    summary: { zh: '每日日志：功课、午睡、餐饮、行为', en: 'Daily logs: homework, nap, meals, mood' },
    chart: `flowchart LR
  A["老师选学生与日期"] --> B["勾功课完成 午睡"]
  B --> C["选餐饮与情绪"]
  C --> D["写备注 加照片"]
  D --> E["家长查看"]`,
    steps: {
      zh: ['一人一行，当天只填一次', '照片点开可以换或删'],
      en: ['One row per student per day', 'Photos can be swapped in the dialog'],
    },
  },

  '/pickup': {
    summary: { zh: '接送：谁接、几点接、车辆', en: 'Pickup records' },
    chart: `flowchart TD
  A["放学到点"] --> B["登记接送人"]
  B --> C["记录时间与方式"]
  C --> D["家长确认"]`,
    steps: { zh: ['登记接送人姓名与关系', '异常（非授权人）要标记出来'], en: ['Record who picks up', 'Flag unauthorized pickups'] },
  },

  '/settings': {
    summary: { zh: '设置：系统、权限、公司资料、费率', en: 'Settings: system, roles, company, rates' },
    chart: `flowchart TD
  A["设置"] --> B["用户与角色"]
  A --> C["公司资料 抬头 电话"]
  A --> D["费率 与 薪资结构"]
  A --> E["考勤规则 截止时间 分数"]`,
    steps: { zh: ['改权限在「用户与角色」', '公司抬头改了发票/收据会跟着变'], en: ['Roles live in users', 'Company header flows into documents'] },
  },

  '/card-management': {
    summary: { zh: '门卡管理：NFC 卡绑定学生或老师', en: 'NFC card management' },
    chart: `flowchart LR
  A["刷卡或输入卡号"] --> B["归一化 card_uid"]
  B --> C["绑定学生或老师"]
  C --> D["状态 正常 / 挂失 / 停用"]`,
    steps: { zh: ['绑定后到考勤页刷一次确认', '挂失的卡刷了会被拒绝并提示'], en: ['Tap once to verify', 'Lost cards are rejected'] },
  },

  '/claim-form': {
    summary: { zh: '报销申请：填单、上传单据、审批', en: 'Claim form: submit, attach, approve' },
    chart: `flowchart TD
  A["填申请 金额 用途"] --> B["上传单据照片"]
  B --> C["提交"]
  C --> D["审批"]
  D --> E["入账 支出记录"]`,
    steps: { zh: ['金额与用途必填', '单据照片尽量清楚'], en: ['Amount and purpose required', 'Attach a clear receipt'] },
  },
}

/** 找当前路径的说明；找不到就用最长前缀匹配 */
export function helpFor(pathname: string): PageHelp | null {
  if (!pathname) return null
  const clean = pathname.split('?')[0].replace(/\/$/, '') || '/'
  if (HELP[clean]) return HELP[clean]
  const keys = Object.keys(HELP)
    .filter((k) => k !== '/' && clean.startsWith(k))
    .sort((a, b) => b.length - a.length)
  return keys.length ? HELP[keys[0]] : null
}

/** 没写说明的页面：用标题 + 描述拼一份通用说明，保证每页都有「?」 */
export function fallbackHelp(title: string, description?: string): PageHelp {
  return {
    summary: {
      zh: description || `${title}：在这里查看和处理对应的资料。`,
      en: description || `${title}`,
    },
    chart: `flowchart TD
  A["进入 ${title}"] --> B["筛选或搜索"]
  B --> C["查看详情"]
  C --> D["修改或导出"]
  D --> E["保存 系统留下记录"]`,
    steps: {
      zh: ['先用筛选或搜索缩小范围', '点条目看详情，改完保存', '右上角按钮一般是新增或导出'],
      en: ['Filter or search first', 'Open an item to edit', 'Top-right holds create or export'],
    },
    tips: {
      zh: ['看不到的按钮通常是权限被关了，找管理员开', '凡是能改数据的地方，系统都会留操作记录'],
      en: ['Missing buttons mean role permissions', 'All data changes are logged'],
    },
  }
}
