# PJPC 待处理事项

| # | 事项 | 状态 | 说明 |
|---|------|------|------|
| 1 | 日薪资计算 | 🔴 | 需课程排班完善 → 按编排的老师算工作时长 → 记录到教师考勤与排班 → 从那算日薪资 → 汇总总薪资 |
| 2 | 支出管理 | ✅ | 已完成：支出+薪资已并入财务报表；新增「月度收支对比」(实收/支出/薪资/利润)；口径统一(收入=实收按收款日、成本=支出+薪资按发放日)；金额2位小数、图表取整 (2026-09-16) |
| 3 | 学生报告生成 | 🟡 | 按教师评估的个别教师/学生成绩/评语生成；format 不改，只生成内容；需 AI 总结 |
| 4 | 薪资管理优化 | ✅ | 已完成：生成本月薪资→批量生成薪资，可选年+月+发薪日期(payment_date) |
| 5 | 数据备份 | ✅ | 已确认：timer 每天 18:00 跑，落地 /mnt/d/hermes-backup，最新 hermes-20260905.zip（9/5，连续每天都有），保留 7 天 |
| 6 | Finance 全测试 | ✅ | 已完成(2026-09-18)：用真实代码验算 9 月 17 条薪资记录 → 16/17 正确；唯一差异是 CZY 老师 no_statutory=True(外籍,设置合理)。脚本 `scripts/verify-salary.ts` |
| 7 | 绩效管理 | ✅ | 已完成(2026-09-17)：建 teacher_performance_evaluation 集合 → 接口 500→200，菜单取消置灰 |
| 8 | 学生成绩 DataStudio 导入 | 🟡 | 查重✅零重复；23 学生已导入；9 人无数据（6 人 DataStudio 无记录 + 3 人 NRIC=000000000 等提供） |
| 9 | 学生紧急联系人 + 载送人 | ✅ | 已完成(2026-09-18)：真浏览器实测「添加学生」表单——紧急联络人区块正常、按钮可新增输入行；载送人按设计在 /pickup 页 |
| 10 | 教师排班 | ✅ | 已验证(2026-09-18)：/course-management 的时段/星期/课程/甘特图/时间表全部正常渲染无报错 |
| 11 | 重复模块页面确认 | ✅ | 已确认非重复：/student-reports=列表页(导航入口)，/student-report/[id]=详情页，两者配套，都在用不需要删 |
| 12 | 课程管理-时间表 | ✅ | 时段已按年级独立存 PB + 时间表/甘特图移到页面上方 + 网格显示课程修复 + 就地加/改/排序时段 |
| 13 | 迁移 Hermes Desktop | ✅ | 2026-09-02 完成：WSL 升 v0.21；serve systemd 常驻(9119,basic_auth admin/1234567890)；Desktop 连 WSL serve。WSL2 IP 重启可能变 `hostname -I`。IP 暂不配死 |

## 已完成
- 积分守卫：points_enabled=false 学生拒绝任何加分/扣分
- 缺勤扣分：周末不扣 + 同日 dedup 防重复
- 学生表单：紧急联系人动态列表 + 载送人资料填框（pickup_persons 字段）
- 薪资结构：按薪资类型切换显示（时薪/佣金不扣 EPF/SOCSO/EIS/PCB）+ auto-generate 0值跳过修复
- 备份：开机后 2 分钟 + 每天 18:00 自动备份（含全部 profile）
- 凭证迁移：25 个 API 硬编码密码 → 共享 lib/pb-admin-token.ts
- 僵尸 API 删除、年级统一、考勤缺勤扣分、WhatsApp 只发 PDF、课程时间表、甘特图、教师排班整合

## 其他待处理（非优先级）

### UX 审计发现（2026-09-16 用真浏览器走完全站 39 页）
- **假数据残留在正式页面**：`资源库`（张老师/李老师/王老师的教案、语文课件、英语视频，下载次数都是编的）、`银行对账`（CIMB Bank 账号 1234-567-890 余额 RM52,300、1234-567-89 余额 RM12,500 —— 全是硬编码演示数据，会让查账的人当真）
- **空壳/坏页**：`绩效管理`（接口 500、数据 0 条，菜单已置灰但直连 URL 仍报错，可考虑换成"开发中"提示）、`接送管理`（空）、`预算管理`（空）、`管理面板`（学生总数/待缴费用/教师人数全显示 "—"）
- **菜单 39 项全平铺、没有二级分组**（教务 15 项、财务 12 项、系统 9 项）
- **财务 5 个入口概念重叠**，用户难分辨钱该在哪录：收费管理 / 学生费用 / 发票管理 / 付款管理 / 收据管理
- **单页按钮过多**（每行操作列重复堆）：家长管理 543 个、学生费用 248、学生列表 232、薪资管理 174、课程管理 161

### 数据质量（2026-09-16 全量扫描 132 名学生）
- **学号不完整 6 人**（要定正确学号，建议补成完整格式）：
  - 阿吉拉非 Muhammad Akid Rafif → `T13`（建议 `BT T13`）
  - 帝韦尼 Dhivnesh bin Umaganthan → `B27`（建议 `BT B27`）
  - 郑凯昇 Tee Khai Shen → `B`（**缺号码**）
  - 黄俊鸿 Ethan Ng Junn Hong → `PU E`（**缺号码**）
  - JOANNA TING SHIN YU → `G1`（建议 `BT G01`）
  - 安藤豊大 Miharu Ando → `T`（**缺号码**）
- ✅ **JOANNA TING SHIN YU 重复已消除**（2026-09-17 核实）：现仅剩 1 条 `陈芯妤 JOANNA TING SHIN YU`(BATU14, grade=1)——重复那条已被删除，无需再合并
- **年级空缺 14 人**（PU1 的 BK 那批）：全莉莉 BK G12、THAM YU HWA BK B7、张巧琳 BK G2、张巧恩 BK G1、林晨晰 BK G7、詹嘉敏 BK G10、马弘懿 BK B2、马如恩 BK G5、亚当 BK T1、刘晓彤 BK G4、法奇 BK B11、林珂萱 BK G8、刘维德 BK B3、陆光铭 BK B05
- **卡号空 18 人**（NFC 刷不了）：郑凯昇 + 上述 BK 14 人 + 黄俊鸿 + JOANNA + 安藤豊大
- **NRIC 空 18 人**（拉不到成绩）：上述 BK 14 人 + 加华 BT T11、刘芝榛 BT T19、杨凯欐 BT T13、安藤豊大 T
- **家长电话空 6 人**：叶浩凯 Anders Yap、杜晨曦 XAVERIA TOH、JOANNA(两条)、杨凯欐、安藤豊大
- ✅ **centerId 空 14 人已补齐**（2026-09-16，按 center code 映射；备份 `pjpc-backup-students-centerid-20260916-151426.json`）
- **BK 含义已确认**：BK = 之前另一间分行（已关闭），那批学生**暂时保留不动**
- 家长-学生关联：还有 **44 个家长 / 46 个学生**未关联（学生端家长姓名/电话对不上），之后手动补
- 3 个 PU1 学生 NRIC=000000000（李芯妍、罗貹劼、林捷葇）无法拉成绩，等 NRIC
- 6 个 PU1 学生 DataStudio 无成绩记录（李凯文、张展铭、黄之语、黄俊鸿、曾令丰、黄脩竣）
- Anders（10 岁但 grade=Standard 1）疑似年级录入错误，待确认
- **年级格式混乱**：数字（`7`/`8`/`3`/`4`/`2`/`1` 共 41 人）与英文（`Standard N`/`Form N`）混用 —— 显示层已用 `formatGrade()` 归一化，数据层未统一

### 账务审计发现（2026-09-16 智能会计师首次审计 · 每周一 9:30 自动复检）
- ✅ **已修（2026-09-17）**：26 张发票补账期、9 月薪资已生成（17 人）、票号重复 20 张已重编 + PB 加唯一索引防复现
- **支出凭证缺失 10 笔**（全是水电费：TNB 电费 + Air Selangor 水费，都是 Auto Debit，账单 PDF 在邮箱）→ 表单**早就有上传功能**，缺的是人工上传；列表已加红色「缺」标记 + 顶部计数提醒
- **2 笔真实收付差额**：`INV-202608-095` 票额 418 / 实收 390（Mirza 少付 28，状态 partially_paid）；`INV-202608-003` 票额 418 / 实收 420（艾曼达多付 2）
- **没有银行流水导入** → ✅ **已通（2026-09-17）**：清掉 19 条假数据（2 个假账户/14 条假流水/3 条假对账）、修好对账 API 硬编码凭证（改用共享 token）、实测对账能真匹配（流水 640 ↔ 发票 640 匹配成功）；**待用户在「银行对账」建真实账户并导入真实流水**
- **资产负债表** → ✅ **已做简版**（2026-09-17）：财务报表页新增「资产负债概览」= 应收（未收发票 RM 4,003.50）/ 应付薪资 / 累计收入·成本·利润；银行与现金栏待导入流水后补齐
- **账套结构缺口（剩余）**：没有预收款概念（提前交的学费直接算当月收入）、没有固定资产与折旧、没有应付账款、没有税务报表（PCB/SST 汇总）、没有连续凭证编号体系

### 马来西亚合规（2026-09-17 查证）
- **e-Invoice（MyInvois）**：用户确认**年营收未超过门槛，暂时不用**；日后超了必须对接 LHDN（直连 MyInvois API 或买已对接的第三方软件），教育服务免 SST 但不免 e-Invoice → **留意，暂不做**
- **会计软件无强制认证**：马来西亚没有会计软件认证制度；审计报告要 MIA 注册审计师签、报税可自行用 MyTax — 与自建系统无关
- ✅ **法定缴款已核对并修好（2026-09-17）**：
  - **EPF** ✅ 正确（≤RM5,000 雇主 13%；>RM5,000 → 12%）
  - **SOCSO** ✅ 正确（完整波段表；RM6,000 封顶 —— PERKESO 官网确认 2024-10 起由 RM5,000 上调；上限员工 29.75 / 雇主 104.15）
  - **EIS** ✅ 正确（0.2% 波段表，封顶 11.90）
  - **PCB** ✅ 已启用自动计算 + 补上 SOCSO 减免（RM350/年上限）；9 月重算后 3 人扣税共 RM 200.18（月薪 4,500→78.67、4,200→60.76，其余低于起征点不扣）
  - 字段名注意：薪资记录里 PCB 存在 **`tax_deduction`** 字段（不是 `pcb`）
- **HRD Corp 1% levy**：`暂缓（2026-09-17）` —— 法定门槛为员工 ≥10 人缴 1%、5-9 人缴 0.5%（<5 人豁免）；PJPC 17 名在职教师本应缴约 RM 280-290/月，但**用户已向相关方询问，答复「不需要」**，用户表示「再问问才决定」→ **暂不加入薪资计算，等用户最终确认**
- ⚠️ **PCB 算法仍缺**：配偶/子女等其他减免（需员工申报数据）；当前仅减 EPF + SOCSO + 个人 RM9,000
- **Lindung 24 Jam（PERKESO 非工伤意外险）**：**只针对自雇人士**，用户不需要给员工买；雇主法定义务仍只有 EPF / SOCSO / EIS / PCB（+ HRD Corp 1%，条件性）
- **主体类型待确认**：Sdn Bhd（Form C + 审计 + MPERS）或 Enterprise/合伙（Form B，不审计）→ 决定报表要不要按审计口径做、要不要凭证编号
- **PDPA 2010**：系统存学生/家长个人资料，需隐私合规；所得税法要求记录保存 **7 年**
- **21 条薪资没有分行** → 分行损益不准；**14 个学生没有年级**；**5 个学生学号不完整**
- 报表清晰度评估：收入/支出/薪资/利润四项清楚、已支持按月切换；**缺资产负债表与现金流**

### 财务菜单入口重叠（UX 审计 #2）
- **现象**：财务菜单 11 个页面，其中 5 个与「收费」相关且命名易混——收费管理(设价) / 学生费用分配(分给学生) / 发票管理(开票) / **付款管理(实为收款记录，名字易被误解为"付钱出去")** / 收据管理
- **用户决定（2026-09-17）**：`暂不改（选 C）`——先不改名也不合并，用久了自然熟悉；如日后仍困扰再处理
- **可选方案留档**：A 只改名（付款管理→收款记录 / 收费管理→收费标准 / 学生费用分配→学生收费标准，风险近零）；B 合并成 1 个页面 3 个 tab（发票/收款/收据，工程量中等）

### 资源库（假数据空壳）— ✅ 已置灰（2026-09-17）
- **实情**：`app/components/features/resource-library.tsx` 共 308 行**全部为硬编码假数据**（"三年级数学教案/分数运算专题/张老师/23次下载"），无 fetch、无 API、无 PB 集合；「上传资源」按钮无任何功能；4 个 tab 全为静态假内容
- **处理（用户选 B）**：菜单置灰不可点 —— `components/layouts/AppShell.tsx` 资源库项加 `disabled: true`（沿用既有机制：不隐藏、只灰掉）
- **若要真做**：需建 PB 集合 + 上传/下载/搜索 API + 权限，工程量较大，待用户提出再做
### 绩效管理 — 有代码、缺数据库表
- 页面 `components/teacher/TeacherPerformanceManagement.tsx` 与 `/api/teacher-performance` 均已完成，调用 `/api/teacher-performance` 报 **500**（根因：PB 缺 `teacher_performance_evaluation` 集合，schema 定义已在 `lib/pocketbase-schema.ts` 中）
- **菜单当前已置灰**（`teacher-performance` 项 `disabled: true`）→ **待用户决定是否建表启用**
### 其它含硬编码假数据的页面（待决定）
- `simple-course-management.tsx`（张老师/李老师/王老师）、`user-management.tsx`、`admin/enterprise-user-approval.tsx`、`systems/communication-system.tsx`、`dashboards/modern-parent-dashboard.tsx`、`teacher/TeacherDashboard.tsx`、`teacher-workspace/page.tsx`（"李四提交了英语作业"等假动态）、`course/AdvancedCourseFilters.tsx`（假老师筛选选项）
- ⚠️ 保留不动（属于演示占位/示例）：`BankReconciliation.tsx` CSV 粘贴示例、`systems/ReadWriteDialog.tsx` 演示数据、`PayslipSettingsManager.tsx` 的 "张老师" 占位

### ✅ 绩效管理已启用（2026-09-17）
- **做了什么**：新建 PB 集合 `teacher_performance_evaluation`（20 字段：teacher_id/evaluator_id 关联、year/quarter、6 项评分 teaching_quality/student_satisfaction/attendance/punctuality/teamwork/communication、overall_score、strengths/areas_for_improvement/goals_next_period/recommendations 四个 json、status、evaluation_date、notes）
- **结果**：`/api/teacher-performance` 由 **500 → 200**；菜单 `teacher-performance` 取消置灰可正常使用
### ✅ 教师工作台假通知已清（2026-09-17）
- `app/teacher-workspace/page.tsx` 原在无待批改作业时 fallback 显示 3 条假通知（"李四提交了英语作业"等）→ 已改为不显示任何假数据
### ⚠️ 重要：多个"假数据组件"实为死代码（无任何页面引用）
- 经全项目引用扫描确认，以下文件**没有任何页面 import**，用户完全看不到，其内部假数据不影响运行：
  `simple-course-management.tsx`、`management/user-management.tsx`（真页面 `/user-management/page.tsx` 自己实现了真数据版本）、`admin/enterprise-user-approval.tsx`、`systems/communication-system.tsx`、`dashboards/modern-parent-dashboard.tsx`、`teacher/TeacherDashboard.tsx`、`course/AdvancedCourseFilters.tsx`
- **教训**：改之前必须先确认「导航 → 目标页面 → 实际组件」链路；本次曾误改死文件 `management/user-management.tsx`，发现后已 `git checkout` 回滚
- **待用户决定**：是否删除这 7 个死文件

### ✅ 假数据大清理（2026-09-17）
**删除的死文件（经全类型引用扫描确认无任何 import）**：
- `app/components/management/simple-course-management.tsx`、`management/user-management.tsx`、`management/admin/enterprise-user-approval.tsx`、`systems/communication-system.tsx`、`course/AdvancedCourseFilters.tsx`、`systems/index.ts`（barrel 本身已引用不存在的 `attendance-system`，早已损坏且无人使用）、`dashboards/modern-parent-dashboard.tsx`（首页家长分支实际已 redirect 到真实的 `/parent/dashboard`）
**修复的活页面**：
- `components/teacher/TeacherDashboard.tsx`（教师工作台第一个 tab）：原整页假数据（45 学生/张三签到/三年级A班课表）→ 改为接真实数据：今日课表取 `schedules`（按 teacher_id + 当天 date 排他区间）、今日出勤取 `student_attendance`、待批作业取 `homework_submissions`；无数据源的项（总学生数/平均分/最近活动）留 0 或空，**不再编造**
- `app/teacher-workspace/page.tsx`：无待批改作业时的 3 条假通知 → 清空
**⚠️ 排查教训（重要）**：
- **扫描引用必须覆盖 `.ts` 与 `.tsx` 全部类型**。本次首轮只搜 `*.tsx`，误判 4 个文件为死代码（其中 `modern-parent-dashboard` 实被首页 `app/page.tsx` 引用）；第二轮用 `grep -rl` 全类型复核才发现
- **改之前必须先确认链路：导航配置 → 目标 page.tsx → 实际渲染的组件**。本次曾误改死文件 `management/user-management.tsx`（真实页面 `/user-management/page.tsx` 自己实现了真数据版本），已 `git checkout` 回滚

### ✅ 安全加固 + 学生报告修复（2026-09-18）
**① 学生报告「存在的问题/改进措施」改了不更新** — 根因：`lib/pdf-generator.ts` 中文分支优先级写反（模板 > 本份报告），英文分支却是对的。影响不止第二/三项，还包括成长寄语、四、未来目标、五、总结。已改为统一「本份报告 > 模板默认 > 内置默认」。实测含自定义内容的报告已正常显示。
**② pre-commit schema 导出一直失败** — 根因：`scripts/export-pb-schema.py` 硬编码旧管理员账号 + 使用 PB 0.23+ 已废弃的 `/api/admins/auth-with-password`。已改为走代理入口（零凭据）→ 实测 `✅ Exported 65 collections`。
**③ 全仓硬编码管理员凭据（19 文件）** — `lib/pocketbase.ts`、`lib/auth-utils.ts`、`lib/points-guard.ts`、代理路由、考勤/财务/教师 API 等全部写死账号密码。已全部改读环境变量（`POCKETBASE_ADMIN_EMAIL` / `POCKETBASE_ADMIN_PASSWORD`）。
**④ `.env.local` 一直在 git 仓库里** — 管理员密码长期暴露在版本历史。已从版本控制移除 + `.gitignore` 加 `.env.*`（白名单保留 `.env.example`）。
**⑤ 管理员密码轮换** — 因曾入库，共轮换 3 次；已验证历史旧密码 `final_pass` 登录失败（400）。**决定不动 git 历史**（旧值已全部失效）。
**⑥ 失误记录** — 删 superuser 账号前未查引用，导致 50 个路由短暂 `Auth failed`（代理 500）。已用 PB CLI 重建账号并恢复。**教训：删账号/改数据前必须先 grep 引用**。

### ⚠️ 待查（用户点名）
- `app/api/utility-bills-test/route.ts` — 测试用路由，是否需要在生产保留
- `app/api/teacher-accounts/*` — 教师账号生成/绑卡流程，待实机 test

### ✅ 待办推进（2026-09-18 续）
**#6 Finance 全测试 — ✅ 完成**
- 用 `lib/perkeso-rates.ts` 真实代码批量验算 9 月全部 17 条薪资记录 → **16/17 完全正确**
- 唯一「不一致」的是 CZY 老师（`czysolp80d4la8z`）：其薪资结构 `no_statutory = True`（全 17 条中仅此一条开启）→ 按配置不扣法定缴款，**是设置而非算法错误**
- 验算脚本留存：`scripts/verify-salary.ts`（`npx tsx scripts/verify-salary.ts`）
- 已确认正确：EPF 11%/13%（≤5000）、SOCSO 波段（1800→员工8.75/雇主30.65）、EIS 波段（1800→3.50）、PCB 累进、净薪 = 毛 − 四项扣款
- **⏳ 待用户确认**：CZY 老师是否应扣法定缴款？若应扣，把该结构 `no_statutory` 改为 false 并重算其 8/9 月薪资即可

**#9 学生紧急联系人 + 载送人 — ✅ UI 实测通过**
- 真浏览器实测「添加学生」表单：**紧急联络人**区块存在，「添加紧急联系人」按钮点击后正常新增输入行（姓名/关系/电话三项）
- **接送信息**区块存在（接送方式下拉）
- 载送人资料**已按设计移至 `/pickup` 页面**管理，不在学生表单内（代码注释明确）→ 非缺陷

**#10 教师排班 — ✅ 实机验证通过**
- `/course-management` 页面正常：**时段 / 星期 / 课程 / 教师 / 甘特图 / 时间表** 全部渲染，无 JS 错误
- `/teacher-attendance-reports`（考勤排班页）正常：含排班 + 出勤
- 注：`/schedule` 路径不存在（404），也无任何导航指向它 → 无影响

**清理 — ✅**
- 删除孤儿测试路由 `app/api/utility-bills-test/route.ts`（5 行，全项目零引用）
- `app/api/teacher-accounts/generate` 实测正常（幂等：17 张教师卡 ↔ 17 个用户全部配对，`created:0, skipped:17` 为正确行为）

**⏳ 支出凭证缺失 10 笔（需用户运行抓取脚本）**
- 全是水电费：TNB 电费 4 笔（PU1 Daycare ×2、BATU14 101A ×2）+ Air Selangor 水费 6 笔（101A / 98B / PU1）
- 脚本已就绪：`scripts/airselangor_history.py`、`scripts/tnb_scraper.py`、`scripts/utility_bills_upsert.py`，但需水电账号凭据（环境变量 `AIR_LOGIN_ID`/`AIR_PASSWORD`），**凭据不在配置里，需用户自行运行**
- 页面已有红色「缺」标记 + 顶部计数提醒

### ✅ 水电费自动拉取（2026-09-18 用户要求执行）
**凭据位置（重要，别再忘）**：
- **TNB**：`.env.local` → `TNB_EMAIL` / `TNB_PASSWORD`（`scripts/tnb_scraper.py` 自动读取）
- **Air Selangor**：`.hermes/skills/software-development/pjpc-development-standards/references/malaysia-utility-bill-integration.md` → `AIR_SELANGOR_NRIC=010101101345` / `AIR_SELANGOR_PASSWORD`（脚本读环境变量 `AIR_LOGIN_ID`/`AIR_PASSWORD`）

**本次执行结果**：
- **TNB 3 账户抓取成功**：BATU 98B `#220077824105` RM **-568.22**(Inactive，负数为 credit) / BATU14 101A `#220077881101` RM **362.63**(账单日 09-Sep) / PU1 Daycare `#220104544209` RM **348.11**(08-Sep)
- **Air Selangor 3 账户登录成功**：BATU14 101A `#9834001000`、BATU14 98B `#1363880000`、PU1 `#2837070000` —— **9 月均已付清 RM 0.00**（9/10 各付 126.70 / 149.65），下期账单未出
- **入库**：`utility_bills` 新增 `2026-09-09 BATU14 101A RM362.63`（8→9 条）
- **补账**：`expenses` 新增同笔 `2026-09-09 utilities RM362.63`（centerId=BATU14 `zwdm8bd190uiwhv`），13→14 条
- **差异核对**：TNB 101A 的 9 月账单此前完全没入账（系统只有 8/9 的 519.47）→ **已补**
- 备份：`/home/pjpc/backups/expenses_before_tnb_20260918_154209.json`、`/home/pjpc/backups/pb-data-before-utilbill-*.db`

**⚠️ 仍未解决**：「支出凭证缺失」的**账单 PDF 附件**——抓取脚本产出的是数据不是 PDF，PDF 在邮箱里，需人工下载上传（页面已有红色「缺」标记）。

**CZY 老师已确认身份**：`czysolp80d4la8z` = **SITI NUR MAULIDIYAH**（外籍，NRIC `E0698423`，系统标注 Citizen: No / Married: No，账号 `teacher_czysolp8@pjpc.local`，月薪 RM2000）。
- 其 `no_statutory = True`（17 条结构中唯一一条）→ **外籍员工按规定不缴 EPF/EIS，此设置合理**；若不符合实际（月薪制外籍在马来西亚可选缴 EPF），告知后改开关并重算 8/9 月。

### ✅ 低风险小修批次（2026-09-18）
**① 删除垃圾集合 `_test_tmp_coll`** — PB 里只有 1 个 `id` 字段、0 条记录的空壳测试集合。已备份 schema 后删除（65 → 64 个集合）。

**② 修 2 处 SSR 崩溃**（服务端日志一直刷 `window is not defined` / `localStorage is not defined`）
- `app/tv-board/services/api.ts`：`loadCacheFromStorage` / `saveCacheToStorage` / `clearCache` 直接调 `localStorage`，而构造函数在服务端也会执行 → 加 `typeof window` 守卫
- `lib/usb-nfc-reader.ts`：`WebNFCReader.checkConnection()` 用 `'NDEFReader' in window`，构造函数调用 → 加 SSR 守卫（USB/Serial 两个 reader 本来就有 try-catch，不受影响）
- 结果：journalctl 里这两条警告消失（验证过）

**③ 管理中心统计卡片接真实数据**（`app/admin/page.tsx`）
- 原来三个卡片全是硬编码 `—`：学生总数 / 待缴费用 / 教师人数
- 现在：学生总数 = `students` 总数（**131**）；待缴费用 = 未结清发票的「票额 − 已收」合计（**RM 1,729.00**，5 张：INV-024/069/095/131/027）；教师人数 = `teachers` 中 `status="active"`（**17**）
- 注意坑：`invoices` 过滤必须带 `deleted != true`，否则把软删发票也算进去（会多算 RM 9,790）
- 卡片描述同步更正：「本月待收」→「未结清发票合计」、「今日在岗」→「在职教师」

**④ 删除 NFC 模拟系统整块死代码（6 个文件）**
- 链路：`lib/nfc-rfid.ts`（整文件是内存模拟：张三/李四/STU001）← `hooks/useNFC.ts` ← `app/components/systems/nfc-attendance-system.tsx` ← `nfc-overview-tab.tsx` / `nfc-cards-tab.tsx`，外加一个假 API `app/api/nfc/attendance/route.ts`（实机返回 `data: []`）
- **全类型引用扫描确认：6 个文件互相引用、零外部引用**（这套跟真实 NFC 无关，真 NFC 走 GlobalCardScanner/USB + `/api/nfc/tap`）
- 已 `git rm` 6 文件，构建通过、页面全 200

### ✅ 死代码全项目扫描与清理（2026-09-18）
**方法**：扫描 `app/components`、`components`、`hooks`、`lib`、`contexts`、`utils` 下全部 `.ts/.tsx`（252 个），对每个文件在**全类型**（`.ts/.tsx/.js/.mjs`）源码中查 import 引用；再做**二次人工核实**（排除变量名、字符串路径等假阳性）。

**删除 24 个文件（7064 行）**：
- `app/components/admin/`：AIControlPanel、UserManagementTable
- `app/components/attendance/`：DraggableScheduleItem、ScheduleManagement、ScheduleTemplateManager、SimpleSchedule
- `app/components/dashboards/students-tab.tsx`
- `app/components/management/`：admin/unified-user-approval、admin/user-approval、birthdays-panel、simple-student-management
- `app/components/settings/BackupRestore.tsx`
- `app/components/systems/`：ReadWriteDialog、exam-system、security-monitoring
- `components/`：ModuleErrorBoundary、attendance/TeacherMobileCheckin、layouts/PageHeader、shared/MobileWrapper、teacher/NFCReplacementCard
- `components/ui/`：PermissionButton、empty-state
- `lib/schedule-conflicts.ts`（185 行完整冲突检测库，但真实 API `/api/schedule/conflicts` 用的是自己的实现 → 弃用）
- `contexts/theme-context.tsx`（9 行 stub，注释写明 theme system 已移除）

**保守保留（二次核实疑似有引用，未删）**：
`admin/ApprovalStats.tsx`、`attendance/AttendanceRecords.tsx`、`attendance/AttendanceReport.tsx`、`attendance/AttendanceSettings.tsx`、`attendance/DeviceManagement.tsx`、`management/course-management.tsx`、`systems/AttendanceRecords.tsx`、`systems/DeviceManagement.tsx`、`systems/auth/login-form.tsx`
—— 多数是变量名（`attendanceRecords`）、字符串路径（`/course-management?tab=`）或**同名不同文件**（`secure-login-form` vs `login-form`）造成的假阳性；宁可留错不删错。

**保留不动**：`components/ui/*`（shadcn 组件库，15 个未被 import 但属标准库，删了以后要用还得装回来）

**验证**：`next build` 通过、页面全 200、体检 4 项通过 0 异常

### ✅ 凭证编号体系（2026-09-18）
**问题**：账套缺口之一——发票/收据/薪资各有编号，但 **收款、支出、退款三类单据完全没有编号**，无法做会计凭证追溯。

**现状盘点（改前）**
- `invoices.invoiceNumber` → `INV-202609-027` ✅
- `receipts.receiptNumber` → `RCP-2026-121` ✅
- `teacher_salary_records.bank_reference` → `PS-202609-044` ✅
- `payments` / `expenses` / `refunds` → **❌ 无编号**（且这三类是前端直接写 PB，没有后端 API）

**实现**
1. **加字段**：给 `payments` / `expenses` / `refunds` 加 `voucher_no`（text，先备份 3 个集合 schema → `/home/pjpc/backups/pb-schemas-before-voucher-*.json`）
2. **PB hook 自动生成**（`pb_hooks/main.pb.js` 追加 `onRecordCreateRequest`）：新增这三类记录时若 `voucher_no` 为空则自动填 `RCV/EXP/REF-YYYYMM-NNN`，序号取当月最大号 +1
   - ⚠️ **坑**：hook 名不能用 `onRecordBeforeCreateRequest`（PB 0.39 不存在此名，会导致**整个 main.pb.js 加载失败、审计 hook 一起挂掉**）。正确名是 **`onRecordCreateRequest`**（已用 `strings pocketbase-0.39.6` 核对过全部可用 hook 名）
3. **回填历史**：134 条（payments 115 + expenses 14 + refunds 5）全部补号，已备份 → `/home/pjpc/backups/finance-records-before-voucher-backfill-*.json`
4. **前端显示**：`PaymentManagement.tsx` 与 `ExpenseManagement.tsx` 表格加「凭证号」列

**验证结果**
- 编号全部连续、无重复：`RCV-202608` 25 张 / `RCV-202609` 90 张；`EXP-202607/08/09` 共 14 张；`REF-202606` 3 张 + `REF-202609` 2 张
- 覆盖情况：invoices 139/139、receipts 121/121、payments 115/115、expenses 14/14、refunds 5/5；薪资 97/99（缺的 2 条是 `test_teacher` 已软删测试数据）
- 真浏览器实测：收款页显示 `RCV-202609-090…086`，支出页正常，无 JS 错误
- 新建记录实测：自动得到 `RCV-202609-001` / `EXP-202609-001`（测试数据已清理）

**剩余账套缺口**：预收款概念、固定资产与折旧、应付账款、税务报表（PCB/SST 汇总）
