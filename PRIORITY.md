# PJPC 待处理事项

> 最后整理：**2026-09-18** ｜ 已完成项见文末

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

- **学号不完整 6 人**（需补完整格式）
  - 阿吉拉非 Muhammad Akid Rafif → `T13`（建议 `BT T13`）
  - 帝韦尼 Dhivnesh bin Umaganthan → `B27`（建议 `BT B27`）
  - JOANNA TING SHIN YU → `G1`（建议 `BT G01`）
  - 郑凯昇 Tee Khai Shen → `B`（**缺号码**）
  - 黄俊鸿 Ethan Ng Junn Hong → `PU E`（**缺号码**）
  - 安藤豊大 Miharu Ando → `T`（**缺号码**）
- **家长电话空 6 人**：叶浩凯 Anders Yap、杜晨曦 XAVERIA TOH、JOANNA、杨凯欐、安藤豊大
- **卡号空 18 人**（NFC 刷不了）：郑凯昇 + BK 14 人 + 黄俊鸿 + JOANNA + 安藤豊大
- **NRIC 空 18 人**（拉不到成绩）：BK 14 人 + 加华 BT T11、刘芝榛 BT T19、杨凯欐 BT T13、安藤豊大 T
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
- **银行流水** —— 对账功能已通，**待用户建真实账户 + 导入真实流水**（银行与现金栏待补）
- **凭证 PDF 附件缺 10 笔** —— 全是水电费（TNB + Air Selangor，Auto Debit），账单 PDF 在邮箱，需人工下载上传；页面已有红色「缺」标记 + 顶部计数
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
7. **凭证 PDF 附件 10 笔** —— 需你从邮箱下载上传

---

# ✅ 已完成（按时间倒序）

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
