
### 2026-09-29 已修：考勤年级显示 + 年级 override 失效

**现象**：考勤中心学生年级显示成 `7` / `1` / `9` 这种裸数字；且按年级配的「签到截止 / 最低签退」完全不生效。
**根因**：`students.grade` 是自由文本，在读生里 18 种写法混着（`Standard N` / `Form N` / `Peralihan` / **纯数字 41 位**）。考勤这几处**没走归一化**：
- 3 处直接吐原始值：`api/attendance/report/route.ts:194`、`:229`、`api/attendance/monthly/route.ts:103`
- 2 处 override 裸比 `g.grade === grade`：`report/route.ts:74`、`settings/route.ts:138` → `'7' === 'Form 1'` 永远 false → 整段配置失效，全吃默认 13:30

**修法（只动 API 出口，数据与页面未动）**：引入 `lib/grades.ts` 的 `gradeCanon()`，3 处显示值归一化、2 处比对补三路归一（与 `checkin/route.ts:221-224` 对齐）。
**验证**：report 60 人裸数字 0；`Standard 1/2/3 → 11:00`、`Standard 4/5/6 → 16:00`（配置值命中），`Form 1/2 → 13:30`（无配置=默认）。tester 39 页全绿。

📌 **未做（待定）**：那 41 位学生的 `students.grade` 仍是裸数字（只是显示层已兜住）—— 是否洗成 canonical 待老板拍板。
