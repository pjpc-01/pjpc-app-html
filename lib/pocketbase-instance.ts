import PocketBase from 'pocketbase'

// Simple PocketBase instance for hooks
export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://pjpc.tplinkdns.com:8090')

// User type definition
export interface UserProfile {
  id: string
  email: string
  name: string
  role: "admin" | "teacher" | "parent" | "accountant"
  status: "pending" | "approved" | "suspended"
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  lastLogin?: string
  loginAttempts: number
  lockedUntil?: string
  approvedBy?: string
  approvedAt?: string
}

export default pb
