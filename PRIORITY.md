# PJPC 优先事项

| # | 事项 | 状态 | 说明 |
|---|------|------|------|
| 1 | 学生成绩 DataStudio 导入 | 🟡 | 查重修复验证✅ 零重复；23 学生已导入；9 人无数据（6 人 DataStudio 无记录 + 3 人 NRIC=000000000 等用户提供） |
| 2 | Finance 全测试 | 🔴 | 薪资 SOCSO/EIS/PCB/EPF 没测完 |
| 3 | 考勤缺勤扣分异常 | ✅ | 已修复：dedup filter 编码 + 周末跳过 + 积分守卫（4 入口） |
| 4 | 学生紧急联系人 + 载送人 | 🟡 | 紧急联系人动态列表已完成，待 test；载送人已移到接送管理页面 |
| 5 | 教师排班 | 🟡 | 排班功能须 test |
| 6 | 重复模块页面确认 | 🟡 | student-report vs student-reports 单复数并存，确认哪个在用、哪个删 |
| 7 | 备份文件加密 | 🟡 | 备份 zip 含 .env.local 密钥裸放 D 盘，建议加密码或排除密钥文件 |

## 已完成（2026-08-17 已推送 adrian/stable/main a051eb3）
- 积分守卫：points_enabled=false 学生拒绝任何加分/扣分
- 缺勤扣分：周末不扣 + 同日 dedup 防重复
- 学生表单：紧急联系人动态列表（可加减任意数量）
- 薪资结构：按薪资类型切换显示（时薪/佣金不扣 EPF/SOCSO/EIS/PCB）
- 备份：开机后 2 分钟 + 每天 18:00 自动备份（含全部 profile）
- 凭证迁移：25 个 API 硬编码密码 → 共享 lib/pb-admin-token.ts（改密码只改 .env.local 一处）
- 僵尸 API 删除：student-attendance-only（零引用）
- 年级统一：11 学生数字/remove 格式 → Standard N/Peralihan/Form N，积分榜中文显示修复

## 其他未处理
- 3 个 PU1 学生 NRIC=000000000（李芯妍、罗貹劼、林捷葇）无法拉成绩，等 NRIC
- 6 个 PU1 学生 DataStudio 无成绩记录（李凯文、张展铭、黄之语、黄俊鸿、曾令丰、黄脩竣）
- Anders（10 岁但 grade=Standard 1）疑似年级录入错误，待确认
