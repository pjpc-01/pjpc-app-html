# PJPC 待处理事项

> 最后整理：**2026-09-21** ｜ 已完成项见文末

---

## 一、主表格（编号项）

| # | 事项 | 状态 | 说明 |
|---|------|------|------|
| 1 | 日薪资计算 | 🔴 | 需课程排班完善 → 按编排的老师算工作时长 → 记录到教师考勤与排班 → 从那算日薪资 → 汇总总薪资。工程量最大，等排班数据稳定后再动 |
| 3 | 学生报告 AI 生成 | 🟡 | 按教师评估的个别教师/学生成绩/评语生成；format 不改，只生成内容。需要 AI 接口（未定） |
| 8 | 学生成绩 DataStudio 导入 | 🟡 | 23 人已导入(查重零重复)；**9 人卡数据**：6 人 DataStudio 无记录 + 3 人 NRIC=000000000 |
| 14 | **主体类型确认** | 🔴 | Sdn Bhd（Form C + 审计 + MPERS）或 Enterprise/合伙（Form B 不审计）→ **卡着账套口径与税务细化多项，建议优先拍板** |

（原 #2 #4 #5 #6 #7 #9 #10 #11 #12 #13 已完成，移至文末）

---

## 二、数据质量

- **学号不完整 4 人**（需补完整格式；原 6 人，JOANNA→`BT G12`、安藤豊大→`BT T25` 已补齐）
  - 阿吉拉非 Muhammad Akid Rafif → `T13`（建议 `BT T13`）
  - 帝韦尼 Dhivnesh bin Umaganthan → `B27`（建议 `BT B27`）
  - 郑凯昇 Tee Khai Shen → `B`（**缺号码**）
  - 黄俊鸿 Ethan Ng Junn Hong → `PU E`（**缺号码**）
- **家长电话空 6 人**：叶浩凯 Anders Yap、杜晨曦 XAVERIA TOH、JOANNA、杨凯欐、安藤豊大
- **卡号空 18 人**（NFC 刷不了）：郑凯昇 + BK 14 人 + 黄俊鸿 + JOANNA + 安藤豊大
- **NRIC 空 18 人**（拉不到成绩）：BK 14 人 + 加华 BT T11、刘芝榛 BT T19、杨凯欐 BT T13、安藤豊大 BT T25
- **家长-学生关联**：还有 **44 个家长 / 46 个学生**未关联（学生端家长姓名/电话对不上），需手动补
- **年级格式混乱**：数字（`7`/`8`/`3`/`4`/`2`/`1` 共 41 人）与英文（`Standard N`/`Form N`）混用 —— 显示层已用 `formatGrade()` 归一化，**数据层未统一**
- **Anders**（10 岁但 grade=Standard 1）疑似年级录入错误，待确认
- 3 个 PU1 学生 NRIC=000000000（李芯妍、罗貹劼、林捷葇）无法拉成绩，等 NRIC
- 6 个 PU1 学生 DataStudio 无成绩记录（李凯文、张展铭、黄之语、黄俊鸿、曾令丰、黄脩竣）
- **BK 那批 14 人年级空缺** —— BK = 已关闭的另一间分行，**用户明确暂时保留不动**
- ✅ 已解决：JOANNA 重复已消除（现仅剩 1 条 B04/BATU14）／centerId 空 14 人已补齐

---

## 三、账套缺口

- **预收款概念** —— 现在提前交的学费直接算当月收入
- **固定资产与折旧** —— 无
- **应付账款** —— 无
- **税务报表** —— 无 PCB/SST 汇总表
- **银行流水** —— 对账功能已通，账户已建 **2 个**，**流水仍 0 条** → 待用户导入真实流水（银行与现金栏待补）
- **现金账户** —— 没有现金账户记录，5 笔现金收款学费无法核对
- **薪资记录缺「分行」字段** —— `teacher_salary_records` 无 centerId/center（38 条全缺）→ **分行损益算不准**；需从 `teacher_id` 对应老师的 center 回填或加字段
- **凭证 PDF 附件缺 11 笔** —— 全是水电费（TNB + Air Selangor，Auto Debit），账单 PDF 在邮箱，需人工下载上传；页面已有红色「缺」标记 + 顶部计数
  - 最新增 1 笔：`EXP-202609-005` TNB BATU14 101A 2026-09-09 RM362.63（上周补入账时未带 PDF）
- ✅ 已解决：凭证编号体系、资产负债表简版、26 张发票补账期、票号重复已重编 + 唯一索引

### 已知但**不需要动**的
- **2 笔真实收付差额**：`INV-202608-095` Mirza 少付 28（partially_paid，正确挂应收）；`INV-202608-003` 艾曼达多付 2（paid）→ 属真实业务

---

## 四、合规（马来西亚）

- ⚠️ **PCB 算法仍缺**：配偶/子女等其他减免（需员工申报数据）；当前仅减 EPF + SOCSO + 个人 RM9,000
- **HRD Corp 1% levy**：`暂缓` —— 门槛为员工 ≥10 人缴 1% / 5-9 人缴 0.5%（<5 人豁免）；PJPC 17 名在职教师本应缴约 RM 280-290/月，但用户查询后答复「不需要」，用户表示「再问问才决定」
- **PDPA 2010**：系统存学生/家长个人资料，需隐私合规；所得税法要求记录保存 **7 年**
- **e-Invoice（MyInvois）**：用户确认年营收未超门槛，**暂时不用**；日后超了必须对接 LHDN（教育服务免 SST 但不免 e-Invoice）→ 留意即可
- ✅ 法定缴款已核对正确：EPF（≤5000 雇主 13%／>5000 → 12%）、SOCSO（完整波段，RM6,000 封顶）、EIS（0.2% 波段，封顶 11.90）、PCB（已启用自动计算 + SOCSO 减免 RM350/年）
- ℹ️ Lindung 24 Jam 只针对自雇人士，雇主无需为员工购买
- ℹ️ 马来西亚无会计软件认证制度；审计报告由 MIA 注册审计师签

---

## 五、UX

- **两个空壳页**：`接送管理`（空）、`预算管理`（空）→ 要真做还是置灰？
- **菜单 39 项全平铺、没有二级分组**（教务 15 项、财务 12 项、系统 9 项）
- **财务 5 个入口概念重叠**，用户难分辨钱该在哪录：收费管理 / 学生费用 / 发票管理 / 付款管理 / 收据管理
  - 用户决定（2026-09-17）：**暂不改（选 C）**，用久了自然熟悉
  - 可选方案留档：A 只改名（付款管理→收款记录 等，风险近零）；B 合并成 1 页 3 tab
- **单页按钮过多**（每行操作列重复堆）：家长管理 543 个、学生费用 248、学生列表 232、薪资管理 174、课程管理 161

---

## 六、⏳ 待用户拍板（汇总，优先看这里）

1. **主体类型** —— Sdn Bhd 还是 Enterprise？（卡着账套口径、税务细化、凭证编号需求）
2. **学号格式** —— 上面 6 人的学号怎么补（建议 `BT T13` / `PU E01` 这类）
3. **接送管理 / 预算管理** —— 真做还是像资源库那样置灰？
4. **HRD Corp 1%** —— 最终要不要缴
5. **PCB 员工申报数据** —— 有没有配偶/子女减免要登记
6. **CZY 老师（SITI NUR MAULIDIYAH）** —— 外籍不缴 EPF/EIS 已按合理处理；若他有缴 EPF 需告知（改开关 + 重算 8/9 月）
7. **凭证 PDF 附件 11 笔** —— 需你从邮箱下载上传

---

# ✅ 已完成（按时间倒序）

### 2026-09-21
- **审计脚本 `scripts/account-audit.mjs` 修 2 处误报**
  - PCB 读错字段：脚本读 `s.pcb`（该字段**不存在**）→ 每周误报「38 条薪资没记 PCB」。实际 PCB 存在 **`tax_deduction`**（9 月 3 人共 RM200.18）→ 已改，9 月 PCB 列从 0.00 → 200.18
  - C/D 章节原为硬编码文案，永远喊「没有凭证编号体系 / 没有资产负债表」→ 已改数据驱动（凭证号实测 收款 108/108、支出 14/14，均齐）
  - 新增**按日快照** `reports/account-audit-YYYY-MM-DD.md` + 自动与上一份对比，下周起能直接看出「新增问题」
- **学号补齐 2 人** —— JOANNA TING SHIN YU → `BT G12`、安藤豊大 Miharu Ando → `BT T25`（学号不完整 6 → 4 人）

### 2026-09-18
- **凭证编号体系** —— payments/expenses/refunds 加 `voucher_no` 字段 + PB hook 自动生成（`RCV/EXP/REF-YYYYMM-NNN`）+ 回填 134 条历史 + 前端「凭证号」列
  - ⚠️ 坑：hook 名必须是 **`onRecordCreateRequest`**；用 `onRecordBeforeCreateRequest`（PB 0.39 无此名）会导致**整个 main.pb.js 加载失败、审计 hook 一起挂**
- **死代码全项目扫描清理** —— 删 24 个无引用文件（7,064 行）+ `lib/schedule-conflicts.ts` + `contexts/theme-context.tsx`
  - 方法：全类型（`.ts/.tsx/.js/.mjs`）扫描 252 个候选 + 二次人工核实
  - 二次核实拦下 9 个假阳性（变量名 `attendanceRecords`、字符串路径 `/course-management?tab=`、同名不同文件 `secure-login-form` vs `login-form`）
  - 保留 `components/ui/*`（shadcn 库，15 个未被 import 但属标准库）
- **删除 NFC 模拟系统整块**（6 文件）—— `lib/nfc-rfid.ts`（内存模拟张三/李四）← `useNFC` ← `nfc-attendance-system` ← overview/cards tab + 假 API `api/nfc/attendance`；零外部引用
- **管理中心统计卡片接真数据** —— `/admin` 三个卡片原全是硬编码 `—` → 学生 131 / 待缴 RM1,729.00 / 教师 17
  - 坑：`invoices` 过滤必须带 `deleted != true`，否则多算 RM9,790
- **修 2 处 SSR 崩溃** —— `app/tv-board/services/api.ts`（`localStorage`）+ `lib/usb-nfc-reader.ts`（`'NDEFReader' in window`）加 `typeof window` 守卫
- **删除垃圾集合** `_test_tmp_coll`（0 条记录空壳，65 → 64 集合）
- **水电费自动拉取补齐** —— TNB 3 账户 + Air Selangor 3 账户；发现 TNB BATU14 101A 九月账单 RM362.63 **完全没入账** → 补进 `utility_bills`（8→9）+ `expenses`（13→14）
  - **凭据位置**（重要）：TNB → `.env.local`（`TNB_EMAIL`/`TNB_PASSWORD`）；Air Selangor → skill `references/malaysia-utility-bill-integration.md`（`AIR_SELANGOR_NRIC`/`AIR_SELANGOR_PASSWORD`）
- **CZY 老师身份查明** —— `czysolp80d4la8z` = **SITI NUR MAULIDIYAH**（外籍，Citizen: No，月薪 RM2000）→ `no_statutory=True` 合理
- **低风险小修** —— 删孤儿测试路由 `api/utility-bills-test`；管理中心卡片接真数据；SSR 修复
- **#6 Finance 全测试** —— 用真实代码验算 9 月 17 条薪资 → 16/17 正确（唯一差异 CZY 配置）。脚本 `scripts/verify-salary.ts`
- **#9 学生紧急联系人** —— 真浏览器实测通过（载送人按设计在 `/pickup`）
- **#10 教师排班** —— `/course-management` 时段/星期/课程/甘特图/时间表全部正常
- **安全加固** —— 全仓 19 文件硬编码管理员凭据 → 环境变量；`.env.local` 移出版本控制 + `.gitignore`；密码轮换 3 次（不动 git 历史，旧值已失效）
  - ⚠️ 教训：**删账号前必须先 grep 引用**（曾删 superuser 导致约 50 路由短暂挂掉）
- **pre-commit schema 导出修复** —— 弃用 `/api/admins/`（PB 0.23+ 已废弃）→ 走代理入口零凭据
- **学生报告中文优先级写反修复** —— `lib/pdf-generator.ts` 中文分支（模板 > 本份报告）与英文相反 → 统一为「本份报告 > 模板默认 > 内置默认」，影响 5 个板块
- **教师看板接真数据** —— `TeacherDashboard.tsx` 原整页假数据 → 接 `schedules`/`student_attendance`/`homework_submissions`；标签改「所教年级学生」

### 2026-09-17
- **绩效管理启用** —— 建 `teacher_performance_evaluation` 集合（20 字段）→ 接口 500→200，菜单取消置灰
- **假数据大清理** —— 删 7 个死文件；教师工作台假通知清空
- **资源库置灰**（308 行全硬编码假数据，无 fetch/API/集合）
- **银行对账清理** —— 清 19 条假数据（2 假账户/14 假流水/3 假对账）、修对账 API 硬编码凭证、实测真匹配
- **资产负债表简版** —— 财务报表页新增「资产负债概览」
- **法定缴款核对** —— EPF/SOCSO/EIS/PCB 全部核对正确；PCB 启用自动计算 + SOCSO 减免
- **PCB 重算** —— 9 月 3 人扣税共 RM200.18
  - 字段名注意：薪资记录 PCB 存在 **`tax_deduction`**（不是 `pcb`）
- **薪资结构按类型切换** —— 时薪/佣金不扣法定缴款；auto-generate 0 值跳过修复
- **教师工作台清假通知**

### 2026-09-16 及更早
- **支出管理** —— 支出+薪资并入财务报表；新增「月度收支对比」；口径统一（收入=实收按收款日、成本=支出+薪资按发放日）
- **薪资管理优化** —— 批量生成可选年+月+发薪日期
- **数据备份** —— timer 每天 18:00 + 开机 2 分钟，落地 `/mnt/d/` 保留 7 天
- **课程管理-时间表** —— 时段按年级独立存、时间表/甘特图移到上方、就地在表格改
- **重复模块确认** —— `/student-reports`（列表）与 `/student-report/[id]`（详情）配套，非重复
- **迁移 Hermes Desktop** —— WSL 升 v0.21；serve systemd 常驻（9119）
- **26 张发票补账期**、**票号重复 20 张重编 + 唯一索引**
- **积分守卫** —— `points_enabled=false` 学生拒绝加分/扣分
- **缺勤扣分** —— 周末不扣 + 同日 dedup
- **学生表单** —— 紧急联系人动态列表 + 载送人资料（`pickup_persons`）
- **凭证迁移** —— 25 个 API 硬编码密码 → 共享 `lib/pb-admin-token.ts`
- **僵尸 API 删除、年级统一、WhatsApp 只发 PDF**

---

## ⚠️ 反复踩过的坑（改代码前必读）

1. **改文件前必须确认「导航 → 目标 page.tsx → 实际组件」链路** —— 曾误改死文件 `management/user-management.tsx`（真页面自己实现了真数据版）
2. **引用扫描必须覆盖 `.ts` 与 `.tsx` 全类型** —— 首轮只搜 `*.tsx` 曾误判 4 个活文件为死代码
3. **删账号/改数据前必须先 grep 引用** —— 曾删 superuser 导致约 50 路由挂掉
4. **PB hook 名以 `strings pocketbase-0.39.6` 为准** —— 写错名字会让整个 `main.pb.js` 加载失败（审计功能一起挂）
5. **`deleted != true` 必带** —— 查发票/流水等集合时漏掉会把软删数据算进去

### ✅ 财务报表 / 财务概览 —— 分行筛选（2026-09-21）
**用户要求**：财务报表也要有分行的；并核对 finance 下哪些没有分行。

**盘点结果**
- ✅ 已有分行：发票管理、支出管理、收款管理、收据管理（部分）、薪资管理（部分）
- ❌ 原无分行：**财务报表**、**财务概览**、银行对账、收费管理、学生费用、水电费卡片、预算管理
- 数据库现实：**只有 `expenses.centerId` 是直连字段**；发票/收款/收据没有分行，需透过「发票 → 学生 → center」反推；薪资需「教师 → centerId」
- 数据覆盖：学生 center **131/131** ✅；支出 centerId **14/14** ✅；教师 centerId **18/28**（缺的 10 位中 9 位是 `inactive` 离职，仅 **SITI NUR MAULIDIYAH** 一位在职）

**实现（单一源头，不逐页改）**
- 新增 **`lib/center-scope.ts`**：统一分行归属规则 + `buildCenterMaps()` / `centerOfInvoice()` / `centerOfExpense()` / `centerOfSalary()` / `inCenterScope()`
- 新增 **`hooks/useCenterScope.ts`**：页面侧取映射
- **`hooks/useFinancialStats.ts`** 加 `centerCode` 参数 —— 收入/支出/薪资/应收全部按分行过滤（数据源头）
- **财务报表** 与 **财务概览** 顶部加分行下拉：`全部分行 / 中学（PU1） / 小学（BATU14） / 未分配`
- 定位不到分行的记录进「**未分配**」，不硬塞，避免分行损益假平衡

**⚠️ 跨中心教师（重要）**
- `teachers.crossCenter` 字段**早就被设为 `true`**（SITI NUR MAULIDIYAH），但**全项目没有任何代码读它** —— 属于"设了却没人用"的死字段，导致她的薪资一直落在「未分配」
- 已接上：`crossCenter = true` 的教师，薪资**按分行数均分**（两间 = 各 50%）；**「全部分行」整笔只算一次**，不重复计
- 实现：`lib/center-scope.ts` 的 `salaryAllocation()` + `useFinancialStats` 薪资改用加权累加（不再用 filter）

**验证（真浏览器实测，数字能对上账）**
- 财务报表 · 薪资：全部 **32,352.41** = PU1 **11,403.53** + BATU14 **20,948.87** + 未分配 **0.00** ✅
- 财务报表 · 支出：全部 **1,685.48** = PU1 **348.11** + BATU14 **1,337.37** ✅
- 财务报表 · 收入：全部 **703.00** = PU1 **0.00** + BATU14 **703.00** ✅
- 财务概览 · 总收入：全部 **59,680** = PU1 **18,845** + BATU14 **40,835** ✅
- SITI 均分后：PU1 由 10,403.53 → **11,403.53**（+1,000），BATU14 由 19,948.87 → **20,948.87**（+1,000），未分配归零

**不做**：收费标准（fees）—— 用户确认两个中心收费统一，本来就不需要分行。
**仍无分行**：银行对账、学生费用、水电费卡片（数据库无分行字段；银行账户按理该按分行分账户，待用户决定）

### ✅ 积分：学生全部记录查看 + LIEW SI MING 补分（2026-09-22）
**用户需求**：1) 核对 LIEW SI MING 积分有没有出错；2) 在积分交易记录区加「点击查看该学生全部积分记录」。

**① LIEW SI MING（刘騦酩，PU1，Form 1，id `z7zmu6s56rko9hw`）积分核查**
- 结论：**确实丢分**。她 2026-09-15 04:07 前是 **120 分**，被两笔 `test` 流水打没了：
  `+1.000000000000009e+53`（120→1e53）后 `-1.000000000000009e+53`（1e53→0）
- **根因：浮点精度吸收** —— 120 加到 1e53 上直接被吃掉，再减回去回不到 120。这两笔本该净变动 0。
- 同类"测试"流水 7/14、7/16、7/22、8/6 也有（1e8/1e9 级），但**那些都还原回去了**（474→474、84.5→84.5、117→117），**只有 9/15 这笔 1e53 造成真实丢失**。
- **已补回 120**（走正规 `/api/points/adjust`，留流水）：**19 → 139**；备份 `/home/pjpc/backups/liew_si_ming_points_before_20260922_124047.json`
- 另有待确认项（用户未处理）：`2026-07-31 00:51「Fries」-150 连续两笔`（同分钟，疑重复提交，共 -300）、`2026-07-31 11:04「Reset」-78/-1`（清零）

**② 积分页「查看全部」功能**
- 现状：学生面板「最近记录」写死 `limit=20`；底部「全部交易记录」是全站分页 —— 学生看不到自己的完整历史
- 已加：最近记录卡右上**「查看全部 ›」** → 底部卡片切为该生「{姓名} — 全部记录」（分页、隐藏分行标签、右上「‹ 返回全部」）
- 实现：`app/points/page.tsx` 加 `txStudentId`/`txStudentName` 状态 + `txCardRef` 滚动定位；`fetchTransactions` 带 `student_id` 参数（API 本就支持 `?student_id=&page=`）
- 实测：72 条 / 分页 1-3 / 返回后回到全站 2826 条 ✓

**⚠️ 建议（未做，待用户决定）**
- `/api/points/adjust` 目前只挡 `amount === 0`，**没有上限** —— 任何超大数值都能写进去（这次 1e53 就是这么来的）。建议加个合理上限（如 |amount| ≤ 1000）防止再出现数据丢失。

### ✅ 积分变动加上限 ±100000（2026-09-22）
**用户决定**：`/api/points/adjust` 加上限 **100000**（同时不处理 7/31 那两笔 Fries/Reset）。

**做法（单一源头）**
- `lib/points-guard.ts` 新增 `MAX_POINTS_DELTA = 100000` + `validatePointsDelta(value)`
- 两个写入入口都接上：`app/api/points/adjust/route.ts`（单笔**和批量**都走这里）、`app/api/points/route.ts`（NFC/直接加减）
- 批量「设为」是前端算好 delta 再打 adjust，所以堵 adjust 即覆盖

**⚠️ 测试时发现的额外漏洞（已修）**
- 初版校验用 `Number(value)`，**`Number(null) === 0`** 会骗过有限性检查 → `amount: null` 被当成合法值放行；**JSON 无法表示 `Infinity`，会序列化成 `null`**，所以 `Infinity` 同样溜过
- 已改为显式拒绝 `null` / `undefined` / 空串 / 布尔 / 数组 / 对象，并单独判 `n === 0`
- 验证：`100000`/`-100000`/`99999.5`/`120` 通过；`100001`/`1e53`/`null`/`Infinity`/`''`/`abc`/`true`/`[]`/`{}`/`0` 全部 400 拒绝

**影响范围**：只加校验，不改任何写入逻辑；未影响既有流水。LIEW SI MING 分数保持 139。

### ✅ 付款 + 收据合并（2026-09-22）
**用户需求**：把付款和收据合并。原本想「另做一页验好再删旧的」，讨论后确认**不必另做一页**。

**关键事实（决定了方案）**
- 收据是「记录新付款」时**自动生成**的产物 —— 付款页弹窗原文：「系统将自动生成电子收据」
- 数据实测 **付款 108 笔 ↔ 收据 108 张，1:1**：每笔付款都有收据、每张收据都绑 `paymentId`，**无一对多、无孤儿**
- 两个页面看的是同一批 108 行，只是两个角度 → 合并 = 把收据按钮挪到付款行，**不涉及任何数据搬迁**

**做法（加法式，可回退）**
- 新增共享模块 **`app/components/finance/shared/useReceiptTools.tsx`**：从原 ReceiptManagement 抽出 PDF 预设（含各中心专属预设）、`getStudentName`/`getInvoiceNumber`、打印/下载PDF/发送WhatsApp、收据详情弹窗、`ReceiptStatsCards`、`ReceiptSettingsDialog`、`ReceiptBinDialog`
- **`app/components/finance/PaymentManagement.tsx`**：
  - 每行新增「收据」列 → 收据号 + 4 个按钮（查看/打印/下载PDF/发送）
  - 顶部加 4 张收据统计卡（总收据数 108 / 已开具 108 / 待处理 0 / 总金额 RM 59,480）
  - 加「收据设置」「回收站」入口
- **旧收据页 `/finance/receipts` 一行未动**，作为回退；用户决定「之后才看要不要删」

**实测（真浏览器）**
- 表头含「收据」列；统计卡数字与 DB 一致
- 查看收据 → 弹窗 + 收据预览 iframe（78KB HTML）✓
- 打印 → 开打印窗口 ✓；下载 PDF → 真下载 `Receipt_RCP-2026-121.pdf` ✓
- 发送 → 下载 PDF + 打开 WhatsApp（带家长号码）✓
- 回收站 → 列出软删收据，可恢复/永久删除 ✓
- 旧收据页仍正常（108 张、同统计）✓ 无 JS 错误

**待办（用户明确「之后才看」）**：菜单里的「收据」入口是否撤掉/灰掉。

### ✅ 支出类别改为自定义（2026-09-22）
**用户需求**：支出管理的类别做成自定义，可自己添加/删减/写字（改名）。

**原状**：7 个类别**写死在代码里**（`ExpenseManagement.tsx` 的 `EXPENSE_CATEGORIES`）：salary/rent/utilities/marketing/stationery/maintenance/misc（id + label + Tailwind 色类 + 图标）。
`expenses.category` 是 TEXT，存的是 **key**（实际数据 14 条：utilities 11、misc 3）。

**做法（照项目既有模式 fee_categories）**
- 新建 PB 集合 **`expense_categories`**：`name`(显示名) / `key`(存进 expenses.category 的代号) / `sort_order` / `color`(hex) / `deleted`
- 种入原 7 个类别（key 与历史数据一致，零影响）
- 新增 **`hooks/useExpenseCategories.ts`**：读取 + 增/改名/改色/排序/软删；取不到数据回退内置默认，页面不白屏
- 新增 **`app/components/finance/shared/ExpenseCategoryManager.tsx`**：管理弹窗（名称可编辑、颜色选择器、上移下移、删除）
- **`ExpenseManagement.tsx`**：类别从 PB 读；徽章/汇总卡改用 **hex 内联色**（原 Tailwind 类无法支持自定义色）；加「管理类别」按钮

**关键设计（防数据损坏）**
- `expenses.category` 存 key → **改名只动 name，历史记录不受影响**
- **删除是软删**（deleted=true）：下拉不再出现，但历史支出**仍能解析出原名称**（`labelOf` 查全量含已删）
- 类别已被支出使用时，删除前提示笔数（「正被 N 笔支出使用」+「仍要删除」）

**⚠️ 测试时发现并修复的 bug**
- `makeCategoryKey` 原逻辑会把中文名剥成零散字母：「测试类别XYZ」→ `xyz`、中文名只剩 ASCII 时极易**撞 key**（如「维修费A」「水电费A」都变 `a`）
- 已修：含非 ASCII 字符或 slug < 3 位时，补 4 位随机后缀（验证：「维修费」→ `cat_9re1`）

**实测（真浏览器）**
- 表格类别显示正常，徽章颜色渲染为 hex（水电费 → `rgb(14,116,144)`）✓
- 管理弹窗 7 行 + 8 个颜色选择器 ✓
- 添加「测试类别XYZ」→ 出现在弹窗和下拉 ✓
- 改名 → 测试改名ABC ✓；删除 → 确认后消失 ✓；再加「维修费」✓
- 无 JS 错误；测试数据已清理，最终回到 7 个原始类别

**注意**：新增集合 → PB 集合数 **64 → 65**（`pb-schema.json` 已随 commit 更新）。备份：`/home/pjpc/backups/pb-schema-before-expense-categories-*.json`

### ✅ 「付款管理」改名为「付款和收据」（2026-09-22）
收据已内嵌进付款页（每行一列 + 统计卡 + 设置/回收站），故改名。
- 中文：`nav.payments` / `breadcrumb.payments` / `common.payment_management` / `finance.payment_management` + `AppShell` 导航项与标签→i18n 映射 + `PaymentManagement` 页面 h2 + `PermissionEditor` 权限名 → **付款和收据**
- 英文：`Payment Management` → **Payments & Receipts**
- 实测：侧边栏、页面标题均显示「付款和收据」，全项目已无「付款管理」残留，无 JS 错误
- 侧边栏「收据管理」入口**暂未动**（用户「之后才看要不要删」）

### ✅ 删除「收据管理」独立页面（2026-09-22）
收据已并入「付款和收据」页，故撤掉独立入口。**删前做了功能对账**：

**收据页原有、付款页缺的 4 项 → 处理**
| 收据页独有 | 处理 |
|---|---|
| 按**收据号**搜索 | ✅ **已补进付款页**（搜索框现支持 学生 / 发票号 / 凭证号 / 收据号） |
| 收据**状态筛选** | 不补 —— 实测 121 张收据**全是 `issued`**，筛选无实际作用 |
| **批量删除收据** | 不补 —— 收据是付款的自动产物，要删该删付款（付款页已有批量删除） |
| 行**展开**查看 | 等价功能已在（收据详情弹窗 + PDF 预览） |

**改动**
- `app/finance/receipts/page.tsx` → 改为**服务端重定向**到 `/finance/payments`（旧书签不 404）
- 删除 `app/components/finance/payment-management/ReceiptManagement.tsx`（851 行）
- 清引用：`payment-management/index.ts` 导出、`AppShell` 侧边栏入口 / 面包屑 / 路径→权限映射、`scripts/ux-audit.mjs`
- **保留** `ReceiptSettingsManager.tsx`（共享模块 `useReceiptTools` 仍在用！）、i18n key、`finance.receipts` 权限 key（避免动角色配置）

**实测**：侧边栏剩 10 项无「收据管理」；付款页收据列/统计正常；搜 `RCP-2026-121` 精确命中 1 行；`/finance/receipts` → 跳 `/finance/payments`；无 JS 错误

### ✅ 死代码清理：脚本 + 坏掉的 npm scripts（2026-09-22）
用户要求「一定要确认都是没再用的」→ 逐个验证后才删。

**删掉的（先验证零引用：项目 / ~/.hermes/cron / systemd / 其他脚本调用 全都查过）**
- `scripts/` 17 个一次性排查脚本（`check-rep6/7/8`、`check-report2~5`、`check-bs/err/att/period-col`、`img-check`、`verify-finance/monthly/parents/student-status`、`perf-check`）
- `scripts/test-json-field.py`、`scripts/test-pb-coll.py`（PB 试错脚本）
- `scripts/tnb_hist_probe.py`（TNB 账单探测前身，已被 `tnb_scraper.py` 取代）
- **保留**：cron 在用的 `ux-audit.mjs` / `account-audit.mjs`、`dev-check.sh`、`export-pb-schema.py`（pre-commit 钩子用）、TNB/Air 抓取管线

**⚠️ 顺手发现的更大问题：`package.json` 有 18 个 script 指向不存在的文件**
全是坏的（`npm run start` / `smart` / `wifi` / `http` / `test:*` …），跑起来必然报 module not found。
- 先确认生产服务用的是 `ExecStart=... next start -H 0.0.0.0 -p 3001`（**不是 `npm start`**），所以删除安全
- 已移除 18 个坏 script；**`start` 补为可用的 `next start -H 0.0.0.0 -p 3001`**（与 systemd 一致，实测 3010 端口 HTTP 200）
- 修正 `docs/environment-setup.md` 里让用户跑 `npm run test:env` 的那行（该脚本从来不存在）
- 现剩 9 个 script 全部有效：`build / build:static / dev / dev:fast / dev:http / export-pb-schema / lint / pb:start / start`
- `__pycache__/` 已在 `.gitignore`（第 126 行）且未被 git 跟踪 → 无需处理

**经验**：临时测试脚本（`*.mjs`）必须**跑完先删再 `git add`** —— 曾把 `vd.mjs` 误提交进 `afd00a0`。

## ✅ 已修复：points-agent（WhatsApp bot）掉线 2 天（2026-09-23）
**症状**：`hermes-gateway-points` 服务 active 但平台没连上，从 09-21 09:42 起每 5 分钟重试一次、连续失败 5928 次，Hermes 自己标了 NEEDS_ATTENTION。
**根因**：WhatsApp「已链接设备」被登出（session 失效），bridge 每次启动都读到 `Logged out` 直接退出 → 重试一万次也没用。**不是网络/服务问题，是登录凭证失效。**
**处理**：`hermes -p points-agent whatsapp` 重新扫码配对 → 网关下一轮重试（≤5min）自动读新 session 连上。
**验证**：bridge `/health` = `{"status":"connected"}`；网关日志 `Bridge ready (status: connected)`；期间有真实 WhatsApp DM 进出并成功回复；无任何告警。
**注意**：
- bot WhatsApp 号已更换（用户确认「换了」）；旧号 session 备份在 `platforms/whatsapp/session.dead-<ts>`，确认稳定后可删。
- 网关实际用的 session 路径是 `~/.hermes/profiles/points-agent/whatsapp/session`（**不是** `platforms/whatsapp/session`，后者是旧布局）。
- ⚠️ **gateway 不能从 gateway 内部 stop/restart**（安全护栏会拦，防止自杀）。改 session 后靠网关自身 5 分钟重试周期生效，或从独立 shell 操作。

### ✅ 白名单补齐（2026-09-23，同日）
核对 points-agent 的 `WHATSAPP_ALLOWED_USERS`（17 个）↔ teachers 表电话：**17/17 全部对得上老师**，白名单机制正常（跟着老师电话走）。
发现并修正 2 处不一致：
- **加入** GAN SOH YEE（在职，8/20 入职，科任/辅导老师）—— 原本不在白名单，用不了 bot
- **移除** Yap Kai Qing（已离职）—— 号码仍留在白名单
改的是 `~/.hermes/profiles/points-agent/.env`，备份 `.env.bak-20260923_164042`。
⚠️ **改完未重启，尚未生效**（运行中的 bridge 进程内存里仍是旧名单）；重启网关后才生效。
**待办：入职/离职时记得同步这份白名单**（老师表 status=inactive 后应从白名单移除）。

### ✅ points-agent 认错老师身份（2026-09-23）
**症状**：Thong Wei Ting 发消息被认成 **Ng Kar Jin**；NG SHI JIE 被认成 **JAN SUI WAI**。积分记到了错误操作人。
**根因（三层叠加）**：
1. **技能写错示例**：`points-operations` §1a 原文把 `193407799460@lid` 当作「发件人 id」举例 —— 而这个 LID 其实是 **`WHATSAPP_HOME_CHANNEL`（Adrian 的 DM）**。agent 照示例拿它当发件人 → 解析成 Ng Kar Jin。
2. **新会话拿不到发件人 LID**：老师**第一条**消息只有显示名（「DM with Ting」），Hermes 的 `Gateway message origin` 块只在 busy-steer（同会话后续消息）时注入。
3. **记忆污染**：`memories/USER.md` 混入了 default profile 的开发记忆，含「Jan=PJPC daycare teacher」「User prefers English」→ agent 猜 Jan、还回英文。
**修复**（备份在 `/home/pjpc/backups/points-agent-fix-20260923_171021`）：
- 重写 `SOUL.md` 身份铁律：显示名 → `channel_directory.json` → LID → `lid-mapping-<LID>_reverse.json` → `teachers.phone`（精确 + active）；⛔ 禁止用 Home Channel / 显示名 / 记忆 / 自称认定身份；拿不到就拒绝。
- 修 `points-operations` §1a 的错误示例，改成三步法 + 明确「HOME_CHANNEL ≠ 发件人」。
- 清 `USER.md` 害人的两行，补身份铁律 + 「回复用中文」。
**✅ 已重启生效**（2026-09-23 17:23）：用 `hermes -p points-agent gateway restart`（护栏对**兄弟 profile** 放行）。注意：该命令会**在前台变成新网关进程**，与 systemd 抢锁导致服务重启循环 —— 收尾用 `hermes -p points-agent gateway stop` 让 systemd 自动接管。重启后 MainPID=9969、无抢锁报错、WhatsApp connected。原步骤（已不必要）：
`systemctl --user restart hermes-gateway-points`
**已澄清（2026-09-23）**：Adrian 的 WhatsApp 解析出的 `601110010775` 与 teachers 表里 **Ng Kar Jin** 的号码相同是**正常的** —— 老板本人 Adrian Ng 就是 teachers 表里的 Ng Kar Jin（用户确认「是对的」）。不是录错，无需修改。

### ✅ 修 `nav.claims` 显示原始 key（2026-09-24）
**现象**：财务导航栏出现 `nav.claims` 而不是「报销单」。
**根因**：`AppShell.tsx` 的 `NAV_LABEL_MAP` 把「报销单 (Claim Form)」映射到 i18n key `nav.claims`，但 `contexts/language-context.tsx` **没有定义这个 key**。`t()` 的实现是 `translations[lang][key] || key` —— key 缺失时直接把原始 key 显示出来。
**来源**：新功能「报销单 (Claim Form)」是 **alicia-agent**（另一个 Hermes bot）2026-09-24 12:25–12:40 在共享仓库里做的，未提交（`app/claim-form/`、`hooks/useClaimForms.ts`、`lib/claim-form-pdf.ts`、PB 集合 `claim_forms`、AppShell 导航项）。她漏了 i18n。
**修复**：`language-context.tsx` 补 `"nav.claims": "报销单"` / `"Claim Form"`（2 行），build + restart，已验证产物里 `nav.claims = 报销单`。
**注意**：本仓库**长期有第二个 agent（alicia）在同时改**，动文件前先 `git status` 看有没有别人的未提交工作，不要误提交/覆盖。

### ✅ 用户反馈 2 项（2026-09-24）
**① 支出页「新增支出」金额打不进小数点**
- 根因：`ExpenseManagement.tsx` 的金额框是 `<Input type="number" />` **没给 `step`** → 浏览器默认 `step=1`，小数点直接被拒。
- 修复：加 `step="0.01" min="0" inputMode="decimal"`。
- ⚠️ 同类隐患：全项目还有 20+ 个 `type="number"` 缺 `step`（含 `settings` 薪资费率、`claim-form` 金额等）。**这次只改用户报的支出金额**，其余待定。

**② 教学评估「新建报告」年级下拉没有「中学预备班」**
- 根因：`teacher-teaching-report/page.tsx` 的 `GRADE_OPTIONS` 只有「一年级…中六」，**没有预备班**；且 `GRADE_DISPLAY` 把 `Peralihan` 映射成「预备班」（名字也对不上）。学生表里**确实有 1 个 `Peralihan` 学生** → 选了年级也加不进学生。
- 修复：`GRADE_OPTIONS` 加「中学预备班」；`GRADE_DISPLAY["Peralihan"]` 改为「中学预备班」（两边对齐才能匹配到学生）。
- ⚠️ 年级选项**全项目有 7 处各自写死**（homework、student-reports、points、courses…），措辞还不统一（`预备班`/`Peralihan`/`中学预备班`）。**这次只改教学评估**，未做统一源头（避免扩大范围）。

**③ 顺手修掉我自己留下的 bug**
- `ExpenseManagement.tsx` 的「导出 CSV」里有 `const cat = cat.labelOf(e.category)` —— **初始化器引用自己（TDZ）→ 一点就抛 ReferenceError**。是我上次做「自定义支出类别」时（commit `315f70f`）留下的。
- 修复：内部变量改名 `catName`。已全项目扫描，无其他同类自引用。

**验证程度**：`npx next build` 通过；构建产物里确认 `step:"0.01"/inputMode:"decimal"` 和 `"中学预备班"` 已进包；`/`、`/finance/expenses`、`/teacher-teaching-report` 均 200；CSV 那个 LSP 报错已消失。**未做登录后的真实点击测试**（不在脚本里写密码）。

### ✅ 上述 3 项修复的真实点击测试（2026-09-24，已通过）
用真实 Chromium + 真实登录（临时建的测试账号，测完已删并验证无残留：HTTP 204 / 读回 404 / users 数回到 20）：
- **① 支出金额**：属性 `step="0.01" min="0" inputMode="decimal"`；逐字打入 `1234.56` → 值 `1234.56` ✅；`checkValidity()` ✅。
- **② 导出账单 CSV**（原 TDZ 崩溃）：下载成功 `expenses_2026-09-24.csv`，内容正确且**类别名正常**（「福利」「水电费」）→ 证明 `catName` 生效 ✅。
- **③ 教学评估年级下拉**：选项含 `中学预备班`（位于 六年级 与 中一 之间）✅。
- 全程 **无 pageerror / console.error** ✅。
- 注：浏览器测试需要登录；`.env.local` 的 `ADMIN_*`/`POCKETBASE_ADMIN_*` **不是应用 users 的登录凭据**（`auth-with-password` 400）。做法是用 PB 超管临时建/删测试账号，**不猜也不硬编码密码**。

### ✅ 已修：`type="number"` 缺 `step`（2026-09-24）
全项目实测 **75 个 `type="number"`**，逐个看上下文分类：
- 💰 **钱/费率/余额/工时 —— 19 处 / 6 文件 → 已加 `step="0.01"`**：
  `AddFeeDialog`×3、`EditFeeDialog`×3、`BudgetManagement`×1、`BankReconciliation`×2（期初/当前余额）、`PaymentManagement`×2（付款额/退款额）、`TeacherSalaryManagement`×8（底薪/时薪/加班费率/津贴/奖金/工时）
  - **只加 `step`，不加 `min`** —— 余额可为负、折扣可为 0，加 `min="0"` 会改行为。
- 🔢 **整数 —— 30 处 / 16 文件 → 故意不动**：分数(0-100)、年份、请假天数、库存/学生数量、课时分钟、积分额度、子女数、教龄、提前天数。这些本来就该只收整数，默认 `step=1` 正好。
- ⏸ 跳过 1 处：`app/claim-form/page.tsx`（alicia 未提交的工作，不碰）。
- ❌ 误报 2 处：`modern-admin-dashboard.tsx` 的 `<XAxis type="number">` 是图表坐标轴，不是输入框。
**验证**：`next build` 通过；diff 仅 19 行、每行只多 ` step="0.01"`；真实浏览器登录实测「付款和收据→记录新付款」金额框 `step=0.01`，打入 `123.45` → `123.45` ✅；全程无 pageerror/console.error。测试用的临时账号已删（204/读回404/users=20/无残留）。

### 📋 待办：年级列表 7 处各自写死（风险中等）
各页格式用途不同（`homework` 中英混 / `student-reports` PB 原始值 / `教学评估` 显示值），而过滤靠 `toGradeDisplay(学生.grade) === 选中值` —— 措辞对不上就「学生列表变空、报告加不进人」（即本次 bug 的放大版）。
- 建议：先只建 `lib/grades.ts` 地基（新增文件，不动现有页面），日后哪个页面漏年级了顺手迁一页
- **状态：暂缓，等用户决定**

### 🔴 invoices 重复/金额翻倍（2026-09-24 处理，仍有后续待办）
**现象**：今天自动开单后，多名学生的 2026-09 账单金额翻了倍；另有学生出现多张一模一样的单。
**已处理**：软删 **29 张 `period=''` 的「杂单」**（进回收站可恢复）。备份：`/home/pjpc/backups/invoices-dedup-20260924115534./`（全量 247KB + to-delete.json）。验证：残留 0、未删总数 280→220。

**根因链（已查实）**
1. **`StudentFeeMatrix.tsx:153` 的开单调用没传 `period`** → 生成的单 `period=''`、`notes="2026年9月学费"`（这正是识别特征；正常单是 `notes="Auto-generated invoice"`）。
2. auto-generate 的「上期未结」判定是 `period != 当期` → **`''` 也算「上期」** → 把这些杂单当欠款，`totalAmount -= carryForward`（carryForward 为负 → 变成 **加**）→ 金额翻倍。
3. 同时把杂单标成 `carried_forward`。
4. 同一学生被连点多次 → 6 张 440 杂单 = 2640，当期单 440 → 3080（数字分毫不差）。

**待办 A：23 张 live 账单金额被抬高，需修正**
每张的 `items` 里都多了一行假的「上期未清欠款/迟付罚金」，删掉那一行即是正确金额（其余项金额本身没问题）：
`073→560, 074→570, 075→390, 076→570, 077→560, 078→570, 079→440, 081→440, 082→560, 083→560, 084→560, 086→560, 088→360, 089→560, 093→330, 101→430, 103→330, 118→541.5, 119→541.5, 128→560, 138→80, 140→725, 158→440`
（其中 `081 努凯琳` 的假欠款行是 888 而非 440，可能是更早一次杂单叠加，需单独看。）

**待办 B：修根因，防复发**
- `StudentFeeMatrix` 开单时补 `period`（该 hook 的 `createInvoice` 因 `[key:string]:any` 可以收 `period`）。
- 建议再加一道保险：auto-generate 算「上期结转」时**跳过 `period` 为空的 invoice**，这样即使再出现杂单也不会污染金额。

### ✅ invoices 重复/翻倍 —— 已修完（2026-09-24 第二轮）
**金额修正总计 36 张**（两轮，均先备份、软删、读回验证）：
- 第一轮 **23 张**（杂单连带）：`073→560 074→570 075→390 076→570 077→560 078→570 079→440 081→440 082→560 083→560 084→560 086→560 088→360 089→560 093→330 101→430 103→330 118→541.5 119→541.5 128→560 138→80 140→725 158→440`。备份 `invoices-fix-amounts-20260924125520.`
- 第二轮 **13 张**（被删的重复 8 月单被当欠款）：`066→650 070→650 080→560 085→560 087→650 099→555 100→330 107→405 135→845 141→188 143→580 152→570 156→725`。备份 `invoices-fix-round2-20260924125800.`

**代码修复（防复发）**
1. `StudentFeeMatrix.tsx:157` 开单补 `period: toLocalMonthKey()` —— 根因，原来不传 period → `period=''`。
2. `api/billing/auto-generate/route.ts:108` 算「上期结转」时**排除 `period` 为空 和 `deleted=true` 的 invoice** —— 否则它们会被当欠款，金额「减负为加」→ 翻倍。这条同时解释了第二轮那 13 张（被删的重复 8 月单被算进去）。

**⚠️ 刻意保留的 5 张（看着是真欠款，未动，等确认）**
- `061 罗兆俊` 欠 536（8月单 carried_forward，零收款）
- `105 张展铭` 欠 458（同上，零收款）
- `130 亚沙迪` 欠 36（8月 418 只收 390，差 28 + 8）
- `161 塔润雅` 欠 28（8月 20 零收款 + 8）
- `095 许瑜桐` 欠 568 —— **不明**：她 8 月单是 `deleted + carried_forward`、零收款，无法证明已付，需要人工判断

**另注**：`InvoiceManagement` 手动开单仍是 `period: period || undefined`（不选账期就会生成无账期单）。金额翻倍的坑已被上面第 2 条堵住，但若希望「手动单也必须有账期」，可加校验 —— 待定。

### ✅ 隐患②（年级不统一）—— 已建源头并迁移 11 处（2026-09-24）
**新建源头 `lib/grades.ts`**（唯一出处）：`GRADE_CANON` / `GRADE_LABEL` / `GRADE_CANON_ALL` / `GRADE_OPTIONS_ZH` / `gradeCanon()` / `gradeLabel()` / `gradeRank()`
- 归一化覆盖：`一年级`/`1`/`7`/`Y4`(大写)/`y4`/`Form 1`/`Standard 6`/`Peralihan`/`预备班`/`中学预备班`/`中一`…`中六`/`明年新生`/空白
- **「预备班」全站统一叫「中学预备班」**；中英混排排序正确（Peralihan < 一年级 < … < 六年级 < 中一 < … < 中六）
- 实测（`npx tsx` 单测 + 真实浏览器）：全部正确

**已迁移 11 处（原来各写一套）**
1. `app/teacher-teaching-report/page.tsx` —— 本地 GRADE_OPTIONS/GRADE_DISPLAY（就是漏「中学预备班」那处）
2. `app/points/page.tsx` —— 本地 GRADE_DISPLAY（**缺 y1–y6**）
3. `components/shared/LeaderboardList.tsx` —— 同上拷贝
4. `app/components/finance/invoice-management/InvoiceCreateDialog.tsx` —— **修排序失效**（原 order 写的是 `初一/初二/高一`，与真实值对不上 → `indexOf` 恒 -1）
5. `app/student-reports/page.tsx` —— 本地 ALL_GRADES（**缺 Form 6**）
6. `app/homework/page.tsx` + `app/homework/new/page.tsx` —— 本地 GRADES（中英混、缺中四~中六）
7. `components/courses/ClassManagement.tsx` —— 选项改 canonical + 中文标签；**筛选/分组/统计改按 canonical 归并**（原来 `一年级` 与 `Standard 1` 被拆成两组）；颜色表补中一~中六/Form 6
8. `components/courses/CourseScheduling.tsx` —— 选项/筛选/排课过滤全部按 canonical
9. `components/courses/GradeGanttChart.tsx` —— 年级开关按 canonical
10. `app/components/management/course-management.tsx` + `app/components/attendance/CalendarScheduleView.tsx` —— 显示走 `gradeLabel`

**验证**：build 通过；真实浏览器实测 —— 课程管理两个年级下拉均为「合并后中文 13 级、无英文原始值 ✅」；学生报告筛选含「中学预备班/中六」✅；作业筛选含「中学预备班」✅；教学评估含「中学预备班」✅；全程无 pageerror。测试临时账号已删（204/读回404/无残留）。

**⚠️ 尚未迁移（各自一套，功能上能用但仍是隐患）**
- `app/api/points/records/route.ts:54` —— **服务端**又有一份年级映射
- `app/components/student/utils.ts:14,22` —— 另一套年级转换（`'一年级': 'Standard 1（一年级）'` 风格）
- `components/teacher/TeacherDashboard.tsx:148` —— 又一份映射表
- `app/components/finance/student-fee-matrix/StudentFeeMatrix.tsx:53` —— 自己一份 order
- `app/card-management/page.tsx:109`、`app/components/management/student-management-page.tsx:153,340`、`app/components/student/StudentAnalytics.tsx:51` —— 各自用正则判断小学年级

**⚠️ 数据层**：`courses.grade_level` **中英混存**（`一年级`×8 与 `Standard 1`×3 并存）。显示/筛选现在已按 canonical 归并，但**存库值仍不统一**；若要彻底统一需一次性把 81 门课的值改写成 canonical（待定）。
