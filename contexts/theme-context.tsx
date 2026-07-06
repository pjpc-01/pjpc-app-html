"use client"

// Legacy — theme system removed. Only Phantom Glassmorphism is used.
// This file kept as a stub to prevent import errors in case other files
// still reference it. All themes have been consolidated to :root in globals.css.

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
