/**
 * 第二批「?」说明 —— 学生端、老师端、教务、行政的页面。
 *
 * 为什么单独一个文件：page-help.ts 已经 300+ 行，再塞 30 条会看不清。
 * 全部并进同一张表，PageLayout / 挂件照旧用 usePathname() 查，页面不用改。
 *
 * 写法约束（跟 page-help.ts 一样）：mermaid 节点文字用双引号包，别放括号和冒号。
 * 动态路由用 [id] 写键，helpFor 会按段通配。
 */

import type { PageHelp } from './page-help'

export const MORE_HELP: Record<string, PageHelp> = {
  // ───────────────────────── 学生端 /my ─────────────────────────
  '/my': {
    summary: { zh: '学生自己的首页：今天上什么课、有什么通知、积分多少', en: 'Student home: today, notices, points' },
    chart: `flowchart TD
  A["学生登录"] --> B["我的首页"]
  B --> C["今日课表"]
  B --> D["最新通知"]
  B --> E["我的积分"]
  B --> F["待交作业"]`,
    steps: {
      zh: ['先看今天的课和时间，别错过上课', '有红点就是还没看过的通知', '积分被扣会在「我的积分」里写明原因'],
      en: ['Check today’s classes first', 'Red dot means unread notice', 'Point deductions show their reason'],
    },
    tips: {
      zh: ['这里只显示你自己的资料，看不到别人', '财务相关的通知不会发给学生账号'],
      en: ['You only see your own data', 'Finance notices are not sent to students'],
    },
  },

  '/my/timetable': {
    summary: { zh: '我的课表：一周固定课表 + 本周实际安排', en: 'My timetable' },
    chart: `flowchart LR
  A["我的课表"] --> B["按星期看"]
  B --> C["科目 时间 老师"]
  C --> D["点课程看详情"]`,
    steps: {
      zh: ['横排是星期，竖排是时段', '有色块的就是有课，空白是没课', '课表按周重复，放假会另外通知'],
      en: ['Columns are weekdays, rows are time slots', 'Colored block means a class', 'Timetable repeats weekly'],
    },
  },

  '/my/homework': {
    summary: { zh: '我的作业：要交的、已交的、批改结果', en: 'My homework' },
    chart: `flowchart TD
  A["作业列表"] --> B["未交"]
  A --> C["已交 等批改"]
  A --> D["已批改 看分数"]
  B --> E["点进去上传或作答"]`,
    steps: {
      zh: ['先做「未交」那一栏，快到期的排前面', '交作业可以上传照片或文件', '批改完分数和评语都在这里'],
      en: ['Start with the not-submitted tab', 'Upload photos or files', 'Grades and comments appear here'],
    },
    tips: {
      zh: ['过了截止时间还是能交，但会标「迟交」'],
      en: ['Late submissions are marked as late'],
    },
  },

  '/my/points': {
    summary: { zh: '我的积分：现在多少分、每一笔怎么来的', en: 'My points history' },
    chart: `flowchart LR
  A["刷卡签到"] --> D["加 2 分"]
  B["缺勤未请假"] --> E["扣分"]
  C["老师手动加减"] --> E
  D --> F["我的积分明细"]
  E --> F`,
    steps: {
      zh: ['每一笔都写清日期和原因', '觉得扣错了找老师或办公室核对', '积分能换贡献物品，去「贡献积分」看'],
      en: ['Each entry shows date and reason', 'Ask a teacher if a deduction looks wrong', 'Points can fund contribution items'],
    },
    tips: {
      zh: ['积分是流水账，改一笔就会留记录'],
      en: ['Point changes are logged'],
    },
  },

  '/my/codex': {
    summary: { zh: '我的学情：强项、弱项、老师建议', en: 'My learning profile' },
    chart: `flowchart TD
  A["成绩与作业记录"] --> B["学情分析"]
  B --> C["强项科目"]
  B --> D["需要加强的科目"]
  B --> E["老师建议"]`,
    steps: {
      zh: ['先看「需要加强」那几科', '老师的建议比分数更值得读', '每隔一段时间回来看一次变化'],
      en: ['Start with weak subjects', 'Read the teacher notes', 'Come back to compare over time'],
    },
  },

  '/my/achievements': {
    summary: { zh: '我的成就：拿过的徽章和阶段记录', en: 'My achievements' },
    chart: `flowchart LR
  A["完成任务"] --> B["解锁徽章"]
  B --> C["我的成就墙"]`,
    steps: {
      zh: ['灰色的是还没解锁的，点开能看到条件', '徽章不会过期'],
      en: ['Grey badges show unlock conditions', 'Badges never expire'],
    },
  },

  '/my/contribution': {
    summary: { zh: '贡献积分：把积分捐给班级物品，满了就换回来', en: 'Contribution points' },
    chart: `flowchart TD
  A["选一个进行中的物品"] --> B["捐出自己的积分"]
  B --> C["物品进度条上涨"]
  C --> D["满了 标记已达成"]
  D --> E["领取物品 或 退回进行中"]`,
    steps: {
      zh: ['先看物品还差多少分', '捐出去的分不会退回积分余额，想清楚再捐', '物品达成后由老师确认领取'],
      en: ['Check how many points are missing', 'Donated points leave your balance', 'Teacher confirms the claim'],
    },
    tips: {
      zh: ['物品进度满了也不会自动发东西，要老师标记领取'],
      en: ['A full item still needs a teacher to mark it claimed'],
    },
  },

  '/my/notices': {
    summary: { zh: '通知：学校发的最新消息', en: 'Notices' },
    chart: `flowchart LR
  A["办公室发通知"] --> B["学生端通知列表"]
  B --> C["点开看全文"]
  C --> D["标记已读"]`,
    steps: {
      zh: ['未读的带红点', '通知按时间倒序，最新的在最上面'],
      en: ['Unread items show a red dot', 'Newest first'],
    },
  },

  '/my/leave': {
    summary: { zh: '我要请假：提交、看审批结果', en: 'My leave requests' },
    chart: `flowchart TD
  A["填请假日期和原因"] --> B["提交"]
  B --> C["待审批"]
  C --> D["批准"]
  C --> E["驳回 可改再交"]
  D --> F["当天不算缺勤 不扣分"]`,
    steps: {
      zh: ['日期要选对，跨天就选范围', '提交后等老师或办公室批', '批准了当天就不算缺勤'],
      en: ['Pick the right dates', 'Wait for approval', 'Approved days are not absences'],
    },
    tips: {
      zh: ['先斩后奏容易卡在「事后补请假」，尽量提前交'],
      en: ['Submit leave before the day if possible'],
    },
  },

  '/my/reports': {
    summary: { zh: '我的报告：老师写的阶段评语和成绩', en: 'My reports' },
    chart: `flowchart LR
  A["老师写评语"] --> B["生成学生报告"]
  B --> C["家长与学生可查看"]
  C --> D["可下载 PDF"]`,
    steps: {
      zh: ['按月份或学期找', '报告只能看，不能改'],
      en: ['Filter by month or term', 'Reports are read-only'],
    },
  },

  '/my/suggestions': {
    summary: { zh: '意见箱：给学校提建议，可以匿名', en: 'Suggestion box' },
    chart: `flowchart TD
  A["写建议"] --> B["选是否匿名"]
  B --> C["提交"]
  C --> D["办公室看到"]
  D --> E["处理后回覆"]`,
    steps: {
      zh: ['可以匿名，但匿名就收不到回覆', '一件建议写一件事，方便处理'],
      en: ['Anonymous means no reply', 'One topic per suggestion'],
    },
  },

  // ───────────────────────── 老师端 ─────────────────────────
  '/teacher-workspace/attendance': {
    summary: { zh: '我的考勤与积分：本月签到、教学统计', en: 'My attendance and stats' },
    chart: `flowchart LR
  A["老师刷卡"] --> B["本月签到记录"]
  B --> C["教学统计"]
  C --> D["上课节数 学生数 评分"]`,
    steps: {
      zh: ['刷卡记录就是出勤，没刷到要当天讲', '教学统计每月重算，看趋势不看单天'],
      en: ['Tap records are your attendance', 'Stats are monthly'],
    },
  },

  '/teacher-workspace/claim': {
    summary: { zh: '报销单：交单据、看审批到哪一步', en: 'Expense claims' },
    chart: `flowchart TD
  A["填金额 用途 期间"] --> B["上传单据照片"]
  B --> C["提交"]
  C --> D["待审批"]
  D --> E["通过 入支出记录"]
  D --> F["驳回 补资料再交"]`,
    steps: {
      zh: ['单据照片要能看清金额和日期', '一次报销写一个期间，别混', '驳回的会写原因，照着补'],
      en: ['Receipt must be readable', 'One period per claim', 'Rejected claims show a reason'],
    },
    tips: {
      zh: ['单号系统自动生成，不用自己填'],
      en: ['Claim number is auto-generated'],
    },
  },

  '/teacher-workspace/courses': {
    summary: { zh: '我的课程：整周课表和作业入口', en: 'My courses' },
    chart: `flowchart LR
  A["我的课程"] --> B["整周课表"]
  A --> C["作业总览"]
  A --> D["布置新作业"]`,
    steps: {
      zh: ['课表是固定周课表，调课要先讲', '布置作业从右边入口进'],
      en: ['Timetable is fixed weekly', 'Create homework from the right'],
    },
  },

  '/teacher-workspace/leave': {
    summary: { zh: '我的请假：提交和查询状态', en: 'My leave' },
    chart: `flowchart TD
  A["选日期 填原因"] --> B["提交"]
  B --> C["待审批"]
  C --> D["批准 当天不算缺勤"]`,
    steps: {
      zh: ['尽量提前交，临时请假也一样要交', '批准了考勤那边自动跟着改'],
      en: ['Submit early', 'Approved leave updates attendance'],
    },
  },

  '/teacher-workspace/students': {
    summary: { zh: '我的学生：名单、考勤、作业情况', en: 'My students' },
    chart: `flowchart LR
  A["我的学生名单"] --> B["点学生"]
  B --> C["考勤记录"]
  B --> D["作业与成绩"]
  B --> E["积分情况"]`,
    steps: {
      zh: ['只显示你带的班', '点学生能一路看考勤、作业、积分'],
      en: ['Shows only your classes', 'Open a student for details'],
    },
  },

  '/teacher-performance': {
    summary: { zh: '教师绩效：上课节数、学生反馈、评分', en: 'Teacher performance' },
    chart: `flowchart TD
  A["排班与实际签到"] --> B["上课节数"]
  C["学生与家长评分"] --> D["教学评分"]
  B --> E["绩效总表"]
  D --> E
  F["评语"] --> E`,
    steps: {
      zh: ['先选月份和老师', '节数来自排班 + 实际签到，两边对不上会标出来', '评分看趋势，别只看一个月'],
      en: ['Pick month and teacher', 'Hours come from schedule plus taps', 'Watch trends, not a single month'],
    },
    tips: {
      zh: ['绩效只做参考，不直接算钱 —— 钱还是看薪资记录'],
      en: ['Performance is advisory, pay comes from salary records'],
    },
  },

  '/teacher-attendance-reports': {
    summary: { zh: '老师考勤报表：迟到、缺勤、加班', en: 'Teacher attendance reports' },
    chart: `flowchart LR
  A["选月份 选老师"] --> B["逐日签到"]
  B --> C["迟到 早退 缺勤 统计"]
  C --> D["导出 或 给薪资参考"]`,
    steps: {
      zh: ['选月份后会自动算迟到次数', '报表里的小时数跟薪资用的排班小时不是一回事，看薪资就去薪资页'],
      en: ['Pick a month to compute lateness', 'Salary hours come from the payroll page'],
    },
  },

  '/teacher-management': {
    summary: { zh: '教师管理：档案、时薪、门卡、账号', en: 'Teacher management' },
    chart: `flowchart TD
  A["新增老师"] --> B["填档案 中心 时薪类型"]
  B --> C["绑定门卡"]
  B --> D["开登录账号"]
  C --> E["刷卡算考勤"]
  D --> F["老师能进工作台"]`,
    steps: {
      zh: ['先建档案，再绑卡，最后开账号', '停用的老师会从点名和排班里隐掉', '离职不要删，改状态就好'],
      en: ['Create profile, then card, then account', 'Inactive teachers disappear from lists', 'Never delete — change status'],
    },
    tips: {
      zh: ['时薪和月薪决定工资怎么算，选错整个月都错'],
      en: ['Hourly or monthly drives the whole calculation'],
    },
  },

  // ───────────────────────── 教务 ─────────────────────────
  '/grades': {
    summary: { zh: '成绩：录入、查看、按科目统计', en: 'Grades' },
    chart: `flowchart LR
  A["选考试类型和科目"] --> B["录分数"]
  B --> C["学生成绩表"]
  C --> D["平均分 排名"]
  C --> E["学生报告引用"]`,
    steps: {
      zh: ['先选考试类型（期中/期末/月测）再录', '分数录错可以直接改，会留记录', '报告里的成绩就是从这来'],
      en: ['Pick exam type first', 'Edits are logged', 'Reports pull from here'],
    },
    tips: {
      zh: ['没录成绩的学生在报告里是空白，不是 0 分'],
      en: ['Missing grades stay blank, not zero'],
    },
  },

  '/homework': {
    summary: { zh: '作业总览：谁交了、谁没交、批改进度', en: 'Homework overview' },
    chart: `flowchart TD
  A["布置作业"] --> B["学生提交"]
  B --> C["待批改"]
  C --> D["批改 给分 写评语"]
  D --> E["学生端可见"]`,
    steps: {
      zh: ['先看「待批改」有多少', '点作业进详情看每个人的提交', '批改完学生马上能看到'],
      en: ['Check pending grading', 'Open an assignment for submissions', 'Students see results immediately'],
    },
  },

  '/homework/new': {
    summary: { zh: '布置新作业：班级、截止时间、附件', en: 'New homework' },
    chart: `flowchart LR
  A["选班级和科目"] --> B["写要求"]
  B --> C["设截止时间"]
  C --> D["加附件"] 
  D --> E["发布"]`,
    steps: {
      zh: ['班级选错就是发给别人了，先确认', '截止时间到了还能交，但会标迟交'],
      en: ['Double-check the class', 'Late work is flagged'],
    },
  },

  '/homework/[id]': {
    summary: { zh: '作业详情：每个人的提交与分数', en: 'Homework detail' },
    chart: `flowchart TD
  A["作业详情"] --> B["已交名单"]
  A --> C["未交名单"]
  B --> D["点学生看内容和附件"]
  D --> E["打分 写评语"]`,
    steps: {
      zh: ['未交的可以一键提醒', '批改保存后不能撤回，但能再改'],
      en: ['Remind non-submitters in one click', 'Grading can be edited later'],
    },
  },

  '/homework/[id]/grade': {
    summary: { zh: '批改作业：逐人打分和评语', en: 'Grade submissions' },
    chart: `flowchart LR
  A["打开提交"] --> B["看内容或附件"]
  B --> C["给分"]
  C --> D["写评语"]
  D --> E["保存并下一个"]`,
    steps: {
      zh: ['一个一个批，保存后自动跳下一个人', '评语写具体一点，学生才看得懂'],
      en: ['Save and it moves to the next student', 'Be specific in comments'],
    },
  },

  '/monthly-tests': {
    summary: { zh: '安亲班月测：出卷、录分、对比', en: 'Monthly tests' },
    chart: `flowchart TD
  A["选月份和科目"] --> B["录入每人的分数"]
  B --> C["月测报表"]
  C --> D["与上月对比"]
  C --> E["进学生报告"]`,
    steps: {
      zh: ['按月按科目录，别混着录', '跟期中期末是分开的两套数据'],
      en: ['Record per month and subject', 'Separate from term exams'],
    },
  },

  '/exam-targets': {
    summary: { zh: '考试目标：定目标分、看达成情况', en: 'Exam targets' },
    chart: `flowchart LR
  A["给学生定目标分"] --> B["考试出分"]
  B --> C["对比目标"]
  C --> D["达标 或 未达标"]`,
    steps: {
      zh: ['目标要按学生水平定，别一刀切', '出分后自动比对，不用手算'],
      en: ['Set targets per student', 'Comparison is automatic'],
    },
  },

  '/student-codex': {
    summary: { zh: '学情档案：强项弱项、历史成绩、老师建议', en: 'Student learning profile' },
    chart: `flowchart TD
  A["选学生"] --> B["成绩曲线"]
  A --> C["作业完成率"]
  A --> D["老师评语"]
  B --> E["强项 与 需加强"]
  C --> E
  D --> E`,
    steps: {
      zh: ['先看曲线往哪走，再看单次分数', '弱项那栏是给老师和家长看的重点'],
      en: ['Look at the trend first', 'Weak areas are the point of this page'],
    },
  },

  // ───────────────────────── 行政 / 系统 ─────────────────────────
  '/user-management': {
    summary: { zh: '用户与权限：谁有账号、能看什么', en: 'Users and permissions' },
    chart: `flowchart TD
  A["新建用户"] --> B["选角色"]
  B --> C["admin 全权限"]
  B --> D["teacher 只看自己班"]
  B --> E["student 只看自己"]
  B --> F["office_admin 财务与行政"]
  C --> G["保存 立即可登录"]`,
    steps: {
      zh: ['账号建好把用户名和初始密码当面给对方', '角色决定能看什么，拿不准先给最小权限', '停用比删除安全，记录都还在'],
      en: ['Hand over username and initial password', 'Give the smallest role that works', 'Disable instead of delete'],
    },
    tips: {
      zh: ['改密码在「我的账号」页自己改，管理员这里能强制重置', '同名同姓的账号要看清中心，别给错人'],
      en: ['Users change their own password on the account page', 'Check the center before assigning'],
    },
  },

  '/education': {
    summary: { zh: '教育概览：课表、班级、公告一屏看完', en: 'Education overview' },
    chart: `flowchart LR
  A["教育概览"] --> B["今日课表"]
  A --> C["班级总览"]
  A --> D["公告动态"]
  B --> E["点进去看详情"]`,
    steps: {
      zh: ['这一页是看，不是改 —— 改课表去课表页', '公告发出去就收不回，检查再发'],
      en: ['This page is read-only', 'Announcements cannot be unsent'],
    },
  },

  '/activities': {
    summary: { zh: '活动管理：按日历排活动、报名', en: 'Activities calendar' },
    chart: `flowchart TD
  A["新建活动 名称 日期"] --> B["日历上出现"]
  B --> C["开放报名"]
  C --> D["名单与费用"]`,
    steps: {
      zh: ['先选分行再建活动，别建错中心', '日期重复会叠在一起，建完到日历上确认'],
      en: ['Pick the center first', 'Verify on the calendar after creating'],
    },
  },

  '/admin': {
    summary: { zh: '管理中心：系统设置的总入口', en: 'Admin hub' },
    chart: `flowchart LR
  A["管理中心"] --> B["用户与权限"]
  A --> C["分行与课程"]
  A --> D["费用与发票配置"]
  A --> E["系统设置"]`,
    steps: {
      zh: ['这里只放入口，具体都在各自页面做', '动配置前先想清楚影响哪个分行'],
      en: ['Entry points only', 'Consider which center a change affects'],
    },
  },

  '/center-management': {
    summary: { zh: '分行管理：中心资料、学生人数', en: 'Centers' },
    chart: `flowchart LR
  A["新增分行"] --> B["代号 名称 地址"]
  B --> C["学生与老师挂到这个分行"]
  C --> D["点名 课表 财务按分行拆开"]`,
    steps: {
      zh: ['代号建好就别改，别的地方都在用它', '学生人数是实时算的，不用手填'],
      en: ['Do not change the center code later', 'Student counts are live'],
    },
  },

  '/parent-management': {
    summary: { zh: '家长管理：家长账号与学生绑定', en: 'Parents' },
    chart: `flowchart TD
  A["新增家长"] --> B["填联系方式"]
  B --> C["绑定学生"]
  C --> D["家长端能看到该学生"]
  D --> E["考勤 成绩 缴费"]`,
    steps: {
      zh: ['一个家长可以绑多个孩子', '绑定错了家长会看到别人孩子的资料，必须核对'],
      en: ['One parent can link several children', 'Always verify the link'],
    },
  },

  '/resource-library': {
    summary: { zh: '资源库：教材、试卷、参考文件', en: 'Resource library' },
    chart: `flowchart LR
  A["上传文件"] --> B["选类型和科目"]
  B --> C["打标签"]
  C --> D["搜索 与 下载"]`,
    steps: {
      zh: ['上传时把类型和科目选对，不然搜不到', '做过的试卷建议放这里，以后能重复用'],
      en: ['Pick type and subject or search fails', 'Store past papers here for reuse'],
    },
  },

  '/suggestions': {
    summary: { zh: '意见箱管理：看建议、标记处理', en: 'Suggestion inbox' },
    chart: `flowchart TD
  A["收到建议"] --> B["分类"]
  B --> C["处理"]
  C --> D["标记已处理"]
  D --> E["匿名的不回覆"]`,
    steps: {
      zh: ['先看没处理的', '处理完记得标状态，不然一直挂着'],
      en: ['Start with unhandled', 'Mark handled to clear the list'],
    },
  },

  '/student-leave': {
    summary: { zh: '学生请假审批：谁请了、批不批', en: 'Student leave approvals' },
    chart: `flowchart TD
  A["学生提交"] --> B["待审批"]
  B --> C["批准 当天不算缺勤"]
  B --> D["驳回 写原因"]
  C --> E["考勤与扣分自动跳过"]`,
    steps: {
      zh: ['批之前对一下日期，批错要改回来很麻烦', '批准后当天的缺勤扣分会自动跳过'],
      en: ['Check dates before approving', 'Approved days skip absence deduction'],
    },
    tips: {
      zh: ['纸本请假如已批，系统里也要补，不然还是会被扣分'],
      en: ['Paper leave must also be entered here'],
    },
  },

  '/inventory': {
    summary: { zh: '库存：物品、数量、领用记录', en: 'Inventory' },
    chart: `flowchart LR
  A["新增物品"] --> B["分类 与 单位"]
  B --> C["入库 出库"]
  C --> D["库存数量"]
  D --> E["低于下限 提醒"]`,
    steps: {
      zh: ['领用一定要记，不然数量永远不准', '数量不对就做一次盘点调整，别硬改历史'],
      en: ['Always record issues', 'Fix counts with a stocktake adjustment'],
    },
  },

  '/inventory/new': {
    summary: { zh: '新增库存物品', en: 'New inventory item' },
    chart: `flowchart LR
  A["名称 分类 单位"] --> B["初始数量"]
  B --> C["保存"]`,
    steps: {
      zh: ['单位写清楚（包/箱/个），以后领用才不会乱', '同一物品别建两次，先搜一下'],
      en: ['State the unit clearly', 'Search before creating a duplicate'],
    },
  },

  '/inventory/[id]': {
    summary: { zh: '物品详情：数量变动与领用记录', en: 'Inventory item detail' },
    chart: `flowchart TD
  A["物品详情"] --> B["当前数量"]
  A --> C["变动记录"]
  C --> D["谁在什么时候领了多少"]`,
    steps: {
      zh: ['数量对不上先看变动记录', '改数量会留下记录，别用来掩盖差异'],
      en: ['Check the history if counts are off', 'Adjustments are logged'],
    },
  },

  '/student-report/[id]': {
    summary: { zh: '学生报告：一个学生的阶段成绩与老师评语', en: 'Student report' },
    chart: `flowchart TD
  A["选学生和月份"] --> B["成绩与月测"]
  A --> C["出勤与积分"]
  A --> D["老师评语"]
  B --> E["生成报告"]
  C --> E
  D --> E
  E --> F["下载 PDF 或直接给家长看"]`,
    steps: {
      zh: ['先确认学生和月份对不对', '评语是老师写的，报告里不能手改', '下载 PDF 发给家长最省事'],
      en: ['Confirm the student and month', 'Comments come from teachers', 'Download the PDF for parents'],
    },
    tips: {
      zh: ['没录成绩的科目会显示空白，不是 0 分'],
      en: ['Missing grades show blank, not zero'],
    },
  },

  '/achievement-management': {
    summary: { zh: '成就管理：徽章规则、颁发记录', en: 'Achievements' },
    chart: `flowchart LR
  A["定义成就与条件"] --> B["系统自动判定"]
  B --> C["学生解锁"]
  C --> D["学生端成就墙"]`,
    steps: {
      zh: ['条件写清楚，别设成达不到的', '手动颁发也算，会记在流水里'],
      en: ['Define achievable conditions', 'Manual grants are logged'],
    },
  },

  '/dashboard/slideshow': {
    summary: { zh: '电视轮播：决定大屏上放哪几块', en: 'TV slideshow' },
    chart: `flowchart TD
  A["开启要放的模板"] --> B["排序"]
  B --> C["电视按顺序轮播"]
  C --> D["完成的活动不上轮播"]`,
    steps: {
      zh: ['只开需要的，全开电视会太花', '轮播内容是实时数据，不用手动刷新'],
      en: ['Enable only what matters', 'Content is live'],
    },
    tips: {
      zh: ['已完成的活动不会出现在轮播里'],
      en: ['Completed items are hidden from the loop'],
    },
  },

  // ───────────────────────── 家长端 ─────────────────────────
  '/parent/dashboard': {
    summary: { zh: '家长门户：孩子今天怎么样、有没有欠费、有没有通知', en: 'Parent portal overview' },
    chart: `flowchart TD
  A["家长登录"] --> B["孩子卡片"]
  B --> C["出勤率 按最近签到算"]
  B --> D["成绩 查看"]
  B --> E["缴费 查看"]
  B --> F["作业 与 每日日志"]`,
    steps: {
      zh: ['一张卡片一个孩子，几个孩子就几张卡', '出勤率按最近 30 次签到算，没记录会显示「—」', '点任何一格都会进对应明细'],
      en: ['One card per child', 'Attendance is the last 30 taps', 'Tap a tile to open the detail'],
    },
    tips: {
      zh: ['看不到孩子表示还没绑定，找办公室关联', '家长端只能看自己孩子，看不到别家的资料'],
      en: ['No child means not linked yet', 'Parents only see their own children'],
    },
  },

  '/parent/attendance': {
    summary: { zh: '出勤记录：孩子每天几点到、几点走', en: 'Child attendance records' },
    chart: `flowchart LR
  A["刷卡签到"] --> B["student_attendance"]
  B --> C["家长端出勤列表"]
  C --> D["已签到 或 缺勤"]`,
    steps: {
      zh: ['按日期从新到旧排', '这里只显示最近 10 条，多的去报表看'],
      en: ['Newest first', 'Shows the latest 10 rows'],
    },
    tips: {
      zh: ['没刷卡不等于没来，老师点名也会记录', '请假批准的那天不会算缺勤'],
      en: ['No tap does not always mean absent', 'Approved leave is not an absence'],
    },
  },

  '/parent/grades': {
    summary: { zh: '成绩查询：孩子的考试成绩与进度', en: 'Child grades' },
    chart: `flowchart TD
  A["老师录入成绩"] --> B["按科目汇总"]
  B --> C["家长端成绩表"]
  C --> D["等级 与 分数"]`,
    steps: {
      zh: ['按科目看，别只看总分', '空白表示那科还没录，不是 0 分'],
      en: ['Look per subject', 'Blank means not entered yet'],
    },
  },

  '/parent/payments': {
    summary: { zh: '缴费记录：每张发票收了没、还差多少', en: 'Child payment records' },
    chart: `flowchart LR
  A["每月发票"] --> B["已还 或 未还"]
  B --> C["家长端缴费列表"]
  C --> D["点开看明细"]`,
    steps: {
      zh: ['未还的会排前面', '金额跟办公室开的发票一致，有疑问拿发票号去问'],
      en: ['Unpaid first', 'Amounts match the issued invoice'],
    },
    tips: {
      zh: ['多付的钱会转成下期抵扣，下个月自动扣掉'],
      en: ['Overpayment becomes a credit next month'],
    },
  },

  '/parent/leave': {
    summary: { zh: '请假申请：给孩子请假、看审批结果', en: 'Parent leave requests' },
    chart: `flowchart TD
  A["填日期 原因"] --> B["提交"]
  B --> C["待老师审批"]
  C --> D["批准 当天不算缺勤"]
  C --> E["驳回 可改再交"]`,
    steps: {
      zh: ['日期要选对，跨天就选范围', '提交后等老师批，批准了当天不扣分'],
      en: ['Pick the right dates', 'Approved days are not deducted'],
    },
    tips: {
      zh: ['当天临时不来也请补交，否则会被记缺勤'],
      en: ['Submit even for same-day absence'],
    },
  },

  '/parent/notifications': {
    summary: { zh: '通知消息：安亲班发给家长的公告', en: 'Notices for parents' },
    chart: `flowchart LR
  A["办公室发公告"] --> B["家长端通知"]
  B --> C["未读红点"]
  C --> D["点开变已读"]`,
    steps: {
      zh: ['未读的带红点，点开就消', '通知只发公告，不会发财务催款'],
      en: ['Unread has a red dot', 'Finance reminders are not sent here'],
    },
  },

  '/parent/dailylogs': {
    summary: { zh: '每日日志：孩子当天功课、午睡、用餐、心情', en: 'Child daily log' },
    chart: `flowchart TD
  A["老师当天记录"] --> B["每日日志"]
  B --> C["功课完成 与 午睡"]
  B --> D["用餐 与 心情"]
  C --> E["家长端按日期看"]`,
    steps: {
      zh: ['从家长首页选孩子进来', '一天一张卡，点开看细节'],
      en: ['Enter from the parent home', 'One card per day'],
    },
    tips: {
      zh: ['空白表示老师那天还没记，不是孩子没来'],
      en: ['Blank means not recorded yet'],
    },
  },
}
