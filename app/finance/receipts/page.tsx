import { redirect } from "next/navigation"

/**
 * 收据已并入「付款和收据」页（/finance/payments）。
 * 收据是记录付款时自动生成的产物，payments ↔ receipts 为 1:1，
 * 所以收据不再单独一页 —— 这里只做重定向，保留旧书签/链接可用。
 */
export default function FinanceReceiptsPage() {
  redirect("/finance/payments")
}
