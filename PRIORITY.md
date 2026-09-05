# PJPC 优先事项

| # | 事项 | 状态 | 说明 |
|---|------|------|------|
| 1 | 学生成绩 DataStudio 导入 | 🟡 | 查重修复验证✅ 零重复；23 学生已导入；9 人无数据（6 人 DataStudio 无记录 + 3 人 NRIC=000000000 等用户提供） |
| 2 | Finance 全测试 | 🔴 | 薪资 SOCSO/EIS/PCB/EPF 没测完 |
| 3 | 考勤缺勤扣分异常 | ✅ | 已修复：dedup filter 编码 + 周末跳过 + 积分守卫（4 入口） |
| 4 | 学生紧急联系人 + 载送人 | 🟡 | 紧急联系人动态列表 + 载送人资料填框（监护/授权时显示）；API 层自测✅，页面 UI 待用户 test |
| 5 | 教师排班 | 🟡 | 排班功能待用户实机test；已自动测试添加可用 + 修复教师映射404(9b661da) |
| 6 | 重复模块页面确认 | 🟡 | student-report vs student-reports 单复数并存，确认哪个在用、哪个删 |
| 7 | 备份文件加密 | ✅ | 2026-08-18 用户决定保持原样：全量明文备份，不加密不排除（无需密码）|
| 8 | WhatsApp 发送需要字段 | ✅ | 2026-08-18 完成：invoice/receipt/payslip 发 WhatsApp 只发 PDF，不再附带字段文本（发票内容在 PDF 里）|
| 9 | 课程管理-时间表 | 🟡 | 已改：去掉[全部年级]改按年级编辑；跨年级同时间可分别保存；教师排班已移到考勤页 | 
| 10 | 年级时间表甘特图 | ✅ | 已改：统一时间表(行=星期)+年级filter开关（878ae49） |
| 11 | 教师排班整合 | ✅ | 统计卡片+周/月视图+请假并入教师考勤与排班页；绩效拉独立导航页（706b979） |
| 12 | 绩效管理-集合缺失 | 🔴 | PB 无 teacher_performance_evaluation 集合→接口500。用户决定暂不动，待想清绩效记录方案 (2026-08-22) |
| 13 | 迁移 Hermes Desktop | ✅ | 2026-09-02 完成：WSL 升 v0.21.0；serve 设 systemd 常驻(hermes-serve.service, 端口9119绑0.0.0.0, basic_auth admin/1234567890)；Desktop=Dashboard窗口化连 WSL serve，数据/工具全在 WSL，无需搬数据。登录 http://<WSL-IP>:9119。WSL2 IP 重启可能变，连不上先 `hostname -I`。IP 暂不配死(观察几天)。Bot Mode 需 Desktop v0.21+ |

## 已完成（2026-08-17 已推送 adrian/stable/main d1da28c）
- 积分守卫：points_enabled=false 学生拒绝任何加分/扣分
- 缺勤扣分：周末不扣 + 同日 dedup 防重复
- 学生表单：紧急联系人动态列表 + 载送人资料填框（pickup_persons 字段）
- 薪资结构：按薪资类型切换显示（时薪/佣金不扣 EPF/SOCSO/EIS/PCB）+ auto-generate 0值跳过修复（a458193 仅 adrian）
- 备份：开机后 2 分钟 + 每天 18:00 自动备份（含全部 profile）
- 凭证迁移：25 个 API 硬编码密码 → 共享 lib/pb-admin-token.ts（改密码只改 .env.local 一处）
- 僵尸 API 删除：student-attendance-only（零引用）
- 年级统一：11 学生数字/remove 格式 → Standard N/Peralihan/Form N，积分榜中文显示修复

## 其他未处理
- 3 个 PU1 学生 NRIC=000000000（李芯妍、罗貹劼、林捷葇）无法拉成绩，等 NRIC
- 6 个 PU1 学生 DataStudio 无成绩记录（李凯文、张展铭、黄之语、黄俊鸿、曾令丰、黄脩竣）
- Anders（10 岁但 grade=Standard 1）疑似年级录入错误，待确认