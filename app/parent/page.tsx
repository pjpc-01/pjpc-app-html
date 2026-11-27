import { redirect } from "next/navigation"

// 家长收藏 pjpcapp.com/parent 时会吃到 404（只有 /parent/dashboard 等子页），
// 这里补一个重定向。
export default function ParentIndexPage() {
  redirect("/parent/dashboard")
}
