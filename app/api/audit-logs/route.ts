import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Try to fetch from PocketBase audit collection
    const response = await fetch(`${process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090"}/api/collections/audit_logs/records?sort=-created&perPage=50`, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({ success: true, logs: data.items || [] })
    }

    // Fallback: try the users collection for recent changes
    const usersRes = await fetch(`${process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090"}/api/collections/users/records?sort=-created&perPage=10`, {
      headers: { "Content-Type": "application/json" },
    })

    if (usersRes.ok) {
      const usersData = await usersRes.json()
      const logs = (usersData.items || []).map((u: any) => ({
        created: u.created,
        user: u.email || u.name || u.id,
        action: "user_registered",
        description: `用户 ${u.email || u.name} 注册`,
        ip: "-",
      }))
      return NextResponse.json({ success: true, logs })
    }

    return NextResponse.json({ success: true, logs: [] })
  } catch (error) {
    console.error("Failed to fetch audit logs:", error)
    return NextResponse.json({ success: true, logs: [] })
  }
}
