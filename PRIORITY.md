

---

## 2026-09-28 考勤系统体检（子代理只读排查，待修）

🟢 **本轮已修**：签退写入/读取端两层 bug、同款 `date` 等值过滤 5 处、历史回填 921 条、`invoices.amount`、`FeeCard` 天数静默失效。

🔴 **待修（不修每天都会错）**
1. **积分只实现「签到 / 迟到」**：`points_early:-1`、`points_absent:-3` 从未被任何逻辑读取 → 早退、缺勤永远不扣分。（`api/attendance/checkin/route.ts:157`、`:238-239`）
2. **无防误刷间隔**：实测库内 `in=12:46:55 → out=12:46:56`（1.2 秒）直接判「已签退」→ 时薪老师工时算 0。第 3 次刷卡走「allow another check_out」分支配不到开行时还会新建 `check_in=check_out=now` 的脏行。
3. **TV 大屏刷卡写不进去**：`components/systems/nfc-background-runner.tsx` 学生分支 POST 到只读路由（405）、老师分支缺必填 `type`（400）。该组件被 `app/tv-board/[center]/page.tsx:358` 真实渲染，**不是死代码**。

🟠 **特定场景**
4. **`date =` 打 date 类型字段**共 6 处（按日查恒 0 / 防重永不触发）：`api/daily-logs/route.ts:22,60`、`api/teacher-attendance-only/route.ts:54`、`api/schedule/route.ts:19`、`schedule/check-conflicts/route.ts:44`、`schedule/conflicts/route.ts:25,174`、`api/pickup/route.ts:21`。
5. **跨天打卡**：晚上来、凌晨走 → 签退落到「新一天」找不到当天签到行 → 薪资 `hours<0||>24` 整条跳过 = 0 工时。
6. **老师工作台考勤列表恒空**：`components/teacher-workspace/AttendanceManagement.tsx:94` 读 `data.data`，而接口返回 `records`。
7. **缺勤统计未排除已批准请假**（`api/attendance/report/route.ts:185-203`）。

🟡 **小**
8. `components/attendance/AttendanceReport.tsx:75` 调 `/api/teacher-attendance` 未带 `type=teacher` → 拉回学生数据、老师全显示 Unknown（该组件未进主流程）。
📌 另：`report/route.ts:91` 对一天多条记录取「首进 / 末出」跨行拼装，一天多次进出会被压成一条（待确认预期）。
