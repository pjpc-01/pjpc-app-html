"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { getPocketBase } from "@/lib/pocketbase"

export interface NfcUser {
  id: string
  name: string
  role: string
}

interface PendingStudent {
  id: string
  name: string
  student_id: string
  grade: string
  center: string
}

interface NfcAuthState {
  user: NfcUser | null
  isAuthenticated: boolean
  pendingStudent: PendingStudent | null
  loginWithCard: (cardUid: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  setPendingStudent: (student: PendingStudent | null) => void
  clearPendingStudent: () => void
}

const NfcAuthContext = createContext<NfcAuthState>({
  user: null,
  isAuthenticated: false,
  pendingStudent: null,
  loginWithCard: async () => ({ success: false }),
  logout: () => {},
  setPendingStudent: () => {},
  clearPendingStudent: () => {},
})

export const useNfcAuth = () => useContext(NfcAuthContext)

const STORAGE_KEY = "pjpc_nfc_auth"

function loadFromStorage(): NfcUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data.login_time && Date.now() - data.login_time > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return data.user || null
  } catch {
    return null
  }
}

export function NfcAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<NfcUser | null>(null)
  const [pendingStudent, setPendingStudent] = useState<PendingStudent | null>(null)

  useEffect(() => {
    const stored = loadFromStorage()
    if (stored) setUser(stored)
  }, [])

  const loginWithCard = useCallback(async (cardUid: string) => {
    try {
      const res = await fetch("/api/auth/nfc-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_uid: cardUid }),
      })
      const data = await res.json()

      if (!data.success) {
        return { success: false, error: data.error || "登入失败" }
      }

      const userInfo: NfcUser = {
        id: data.user.id,
        name: data.user.name,
        role: data.user.role || "teacher",
      }

      setUser(userInfo)

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        user: userInfo,
        login_time: Date.now(),
      }))

      // Also save PocketBase auth so the main app recognizes the login
      if (data.pb_token && data.pb_record) {
        try {
          const pb = await getPocketBase()
          pb.authStore.save(data.pb_token, data.pb_record)
        } catch (pbErr) {
          console.warn('⚠️ [NFC] Failed to save PocketBase auth:', pbErr)
        }
      }

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }, [])

  const logout = useCallback(async () => {
    setUser(null)
    setPendingStudent(null)
    localStorage.removeItem(STORAGE_KEY)
    try {
      const pb = await getPocketBase()
      pb.authStore.clear()
    } catch {}
  }, [])

  const clearPendingStudent = useCallback(() => {
    setPendingStudent(null)
  }, [])

  return (
    <NfcAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        pendingStudent,
        loginWithCard,
        logout,
        setPendingStudent,
        clearPendingStudent,
      }}
    >
      {children}
    </NfcAuthContext.Provider>
  )
}
