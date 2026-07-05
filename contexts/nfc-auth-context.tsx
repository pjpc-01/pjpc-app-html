"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

export interface NfcTeacher {
  id: string
  name: string
  position: string
  center: string
}

interface PendingStudent {
  id: string
  name: string
  student_id: string
  grade: string
  center: string
}

interface NfcAuthState {
  // Teacher auth
  teacher: NfcTeacher | null
  token: string | null
  isAuthenticated: boolean

  // Pending student (scanned before login)
  pendingStudent: PendingStudent | null

  // Actions
  loginWithCard: (cardUid: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  setPendingStudent: (student: PendingStudent | null) => void
  clearPendingStudent: () => void
}

const NfcAuthContext = createContext<NfcAuthState>({
  teacher: null,
  token: null,
  isAuthenticated: false,
  pendingStudent: null,
  loginWithCard: async () => ({ success: false }),
  logout: () => {},
  setPendingStudent: () => {},
  clearPendingStudent: () => {},
})

export const useNfcAuth = () => useContext(NfcAuthContext)

const STORAGE_KEY = "pjpc_nfc_auth"

function loadFromStorage(): { teacher: NfcTeacher | null; token: string | null } {
  if (typeof window === "undefined") return { teacher: null, token: null }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { teacher: null, token: null }
    const data = JSON.parse(raw)

    // Check if token is still valid (24h expiry)
    if (data.login_time && Date.now() - data.login_time > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY)
      return { teacher: null, token: null }
    }

    return { teacher: data.teacher || null, token: data.token || null }
  } catch {
    return { teacher: null, token: null }
  }
}

export function NfcAuthProvider({ children }: { children: React.ReactNode }) {
  const [teacher, setTeacher] = useState<NfcTeacher | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [pendingStudent, setPendingStudent] = useState<PendingStudent | null>(null)

  // Load from storage on mount
  useEffect(() => {
    const stored = loadFromStorage()
    if (stored.teacher && stored.token) {
      setTeacher(stored.teacher)
      setToken(stored.token)
    }
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

      const teacherInfo: NfcTeacher = {
        id: data.teacher.id,
        name: data.teacher.name,
        position: data.teacher.position,
        center: data.teacher.center,
      }

      // Save to state + localStorage
      setTeacher(teacherInfo)
      setToken(data.token)

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        teacher: teacherInfo,
        token: data.token,
        login_time: Date.now(),
      }))

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }, [])

  const logout = useCallback(() => {
    setTeacher(null)
    setToken(null)
    setPendingStudent(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const clearPendingStudent = useCallback(() => {
    setPendingStudent(null)
  }, [])

  return (
    <NfcAuthContext.Provider
      value={{
        teacher,
        token,
        isAuthenticated: !!teacher && !!token,
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
