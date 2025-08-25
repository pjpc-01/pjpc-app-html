import PocketBase from 'pocketbase'

// Simple PocketBase instance
export const getPocketBase = async () => {
  const url = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://pjpc.tplinkdns.com:8090'
  return new PocketBase(url)
}

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

// Auth state type
export interface AuthState {
  user: any | null
  userProfile: UserProfile | null
  loading: boolean
  error: string | null
  connectionStatus: 'connected' | 'disconnected' | 'checking'
}
