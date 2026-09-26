import type { ClaimForm, ClaimItem } from '@/hooks/useClaimForms'

const esc = (s: any): string => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))

export const CLAIM_STATUS_TEXT: Record<string, string> = {
  draft: '草稿 Draft',
  submitted: '待审批 Submitted',
  supervisor_approved: '主管已批（待财务）',
  finance_approved: '已批可发 Approved',
  rejected: '已驳回 Rejected',
}

export function generateClaimFormHTML(c: ClaimForm): string {
  const items = (Array.isArray(c.items) ? c.items : []) as ClaimItem[]
  const rows = items.map((it, i) => {
    const amt = typeof it.amount === 'number' ? it.amount.toFixed(2) : '0.00'
    return `<tr>
      <td style="border:1px solid #333;padding:4px;text-align:center;">${esc(it.no || i + 1)}</td>
      <td style="border:1px solid #333;padding:4px;text-align:center;">${esc(it.date)}</td>
      <td style="border:1px solid #333;padding:4px;">${esc(it.desc)}</td>
      <td style="border:1px solid #333;padding:4px;text-align:right;">${amt}</td>
      <td style="border:1px solid #333;padding:4px;">${esc(it.note)}</td>
      <td style="border:1px solid #333;padding:4px;text-align:center;">${it.receipt ? '✔' : ''}</td>
    </tr>`
  }).join('')
  const total = (typeof c.total === 'number' ? c.total : 0).toFixed(2)
  const status = CLAIM_STATUS_TEXT[c.status] || c.status

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI','Microsoft YaHei',Arial,sans-serif;color:#11151f;}
    body{padding:24px;}
    .head{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;border-bottom:3px solid #1e40af;}
    .org{font-size:22px;font-weight:700;color:#1e40af;}
    .en{font-size:11px;color:#5a606b;}
    .slogan{font-size:9px;color:#1e40af;margin-top:2px;}
    .contact{font-size:9px;color:#5a606b;text-align:right;line-height:1.5;}
    h1{font-size:19px;text-align:center;color:#1e40af;margin:14px 0 2px;}
    .sub{font-size:9px;text-align:center;color:#5a606b;margin-bottom:10px;}
    table.info{width:100%;border-collapse:collapse;margin-bottom:10px;}
    table.info td{border:1px solid #8b98b8;padding:5px 8px;font-size:10px;}
    table.info .l{background:#eaf0fa;font-weight:600;color:#1e40af;width:16%;}
    table.detail{width:100%;border-collapse:collapse;margin-bottom:8px;}
    table.detail th{border:1px solid #1e40af;background:#eaf0fa;color:#1e40af;font-size:10px;padding:6px;}
    table.detail td{font-size:10px;padding:4px;}
    .total{font-size:13px;font-weight:700;color:#1e40af;text-align:right;margin:4px 0 10px;}
    .notes{font-size:9px;color:#5a606b;line-height:1.6;}
    .sig{width:100%;border-collapse:collapse;margin-top:14px;}
    .sig td{border:1px solid #8b98b8;padding:8px;font-size:9px;height:70px;vertical-align:top;}
    .foot{text-align:center;font-size:9px;color:#5a606b;margin-top:16px;}
  </style></head><body>
    <div class="head">
      <div><div class="org">温馨小屋</div><div class="en">Pusat Jagaan Prospek Cemerlang · PJPC BATU14</div><div class="slogan">自信自强 · 勤学善思 · 合作共进 · 全面发展</div></div>
      <div class="contact">1, Jalan PU10/8, Taman Puchong Utama<br>012-2270775 / 03-80519553<br>Sarawong080773@hotmail.com</div>
    </div>
    <h1>员工费用报销单  CLAIM FORM</h1>
    <div class="sub">状态：${esc(status)}　·　报销编号：${esc(c.claim_no)}</div>
    <table class="info">
      <tr><td class="l">报销人</td><td>${esc(c.claimant)}</td><td class="l">中心/部门</td><td>${esc(c.center)}</td></tr>
      <tr><td class="l">职位</td><td>${esc(c.position)}</td><td class="l">填表日期</td><td>${esc(c.fill_date)}</td></tr>
      <tr><td class="l">报销期间</td><td colspan="3">${esc(c.period)}</td></tr>
    </table>
    <table class="detail">
      <tr><th>No.</th><th>日期</th><th>项目 / 用途描述</th><th>金额 (RM)</th><th>备注</th><th>收据</th></tr>
      ${rows}
      <tr><td colspan="3" style="text-align:right;font-weight:700;color:#1e40af;">合计 TOTAL</td><td style="text-align:right;font-weight:700;color:#1e40af;">${total}</td><td colspan="2"></td></tr>
    </table>
    <div class="notes"><b>附注 Notes：</b><br>1) 所有报销项目必须附上正式收据 / 单据。 2) 报销范围：交通费、打印/考卷费用、教学材料费及其他工作相关开销。 3) 经主管及财务审批通过后发放。</div>
    <table class="sig">
      <tr>
        <td><b>申请人签字 Claimant</b><br><br><br>日期：____________</td>
        <td><b>行政主管签字 Supervisor</b>${c.supervisor_comment ? '<br>意见：' + esc(c.supervisor_comment) + (c.supervisor_at ? '（' + esc(c.supervisor_at) + '）' : '') : ''}<br><br>日期：____________</td>
        <td><b>财务审批 Approver</b>${c.finance_comment ? '<br>意见：' + esc(c.finance_comment) + (c.finance_at ? '（' + esc(c.finance_at) + '）' : '') : ''}<br><br>日期：____________</td>
      </tr>
    </table>
    <div class="foot">感谢您的付出，PJPC 与每位老师一同携手前行。</div>
  </body></html>`
}