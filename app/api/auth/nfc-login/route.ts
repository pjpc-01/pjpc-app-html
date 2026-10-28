import { NextRequest, NextResponse } from 'next/server'
import { getCardUidSearchTerms } from '@/lib/utils'
import { getAdminToken } from '@/lib/pb-admin-token'

const PB_URL = 'http://127.0.0.1:8090'

async function pbAuth(): Promise<string> {
  return getAdminToken()
}

export async function POST(request: NextRequest) {
  try {
    const { card_uid } = await request.json()

    if (!card_uid) {
      return NextResponse.json({ success: false, error: '缺少 card_uid' }, { status: 400 })
    }

    const token = await pbAuth()

    const terms = getCardUidSearchTerms(card_uid)
    const cardFilters = terms.map(t => 'card_uid="' + t + '"').join(' || ')

    // 1. Find the NFC card
    const cardRes = await fetch(
      PB_URL + '/api/collections/nfc_cards/records?perPage=1&filter=' + encodeURIComponent(cardFilters),
      { headers: { Authorization: 'Bearer ' + token } },
    )
    const cardData = await cardRes.json()

    if (!cardData.items || cardData.items.length === 0) {
      return NextResponse.json({ success: false, error: '找不到该卡' })
    }

    const card = cardData.items[0]

    // 2. Find user — three paths
    let user: any = null

    // Path A: Direct card link (try both PB record id and card_uid)
    const userARes = await fetch(
      PB_URL + '/api/collections/users/records?perPage=1&filter=' + 
        encodeURIComponent('card_id="' + card.id + '" || card_id="' + card.card_uid + '"'),
      { headers: { Authorization: 'Bearer ' + token } },
    )
    const userAData = await userARes.json()
    if (userAData.items?.[0]) user = userAData.items[0]

    // Path B: Through teacher profile
    if (!user && card.teacherId) {
      const userBRes = await fetch(
        PB_URL + '/api/collections/users/records?perPage=1&filter=' + encodeURIComponent('teacher_id="' + card.teacherId + '"'),
        { headers: { Authorization: 'Bearer ' + token } },
      )
      const userBData = await userBRes.json()
      if (userBData.items?.[0]) user = userBData.items[0]
    }

    // Path C: Through student profile
    if (!user && card.studentId) {
      const userCRes = await fetch(
        PB_URL + '/api/collections/users/records?perPage=1&filter=' + encodeURIComponent('student_id="' + card.studentId + '"'),
        { headers: { Authorization: 'Bearer ' + token } },
      )
      const userCData = await userCRes.json()
      if (userCData.items?.[0]) user = userCData.items[0]
    }

    if (!user) {
      return NextResponse.json({ success: false, error: '未绑定账户，请在用户管理中绑定档案' })
    }

    // 3. 卡验过了、人也找到了 —— 换成**这个账号自己的** token
    //
    // 为什么不能用管理员 token：管理员(superuser)的 token 在 /api/collections/users/auth-refresh
    // 上会被 PB 拒绝(403 "requires auth record from _superusers collection")，于是前端之后每个
    // /api/* 都是 401，页面就一直「加载中 / 未绑定档案」。而且把 superuser token 交给浏览器，
    // 等于刷卡就能动整库。
    // 正确做法：用 PB 的 impersonate 接口按账号签发真 token（不需要密码）。
    const impRes = await fetch(PB_URL + '/api/collections/users/impersonate/' + user.id, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
    })
    if (!impRes.ok) {
      return NextResponse.json({ success: false, error: `签发登录票据失败（${impRes.status}）` })
    }
    const imp = await impRes.json()

    return NextResponse.json({
      success: true,
      pb_token: imp.token,
      pb_record: imp.record || user,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        teacher_id: user.teacher_id || '',
        student_id: user.student_id || '',
        center: user.center || '',
      },
    })
  } catch (error: any) {
    console.error('NFC login failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
