/**
 * usePayroll - 薪资计算 Hook
 * 
 * EPF/SOCSO/EIS 自动计算逻辑
 * 新老师入职 → 自动算出净薪资和雇主成本
 */

import { useState, useCallback } from 'react'

export interface PayrollInput {
  basicSalary: number
  allowance: number
  epfRate?: number      // 默认 0.11 (员工)
  epfEmployerRate?: number // 默认 0.12 (雇主)
  socsoRate?: number    // 默认按 wage bracket
  eisRate?: number      // 默认 0.002
}

export interface PayrollResult {
  grossSalary: number
  epfEmployee: number
  epfEmployer: number
  socsoEmployee: number
  socsoEmployer: number
  eisEmployee: number
  eisEmployer: number
  totalDeductions: number
  netSalary: number
  employerCost: number
}

// SOCSO wage bracket table (2025 rates)
// First RM5,000 — employee 0.5% (RM25 max), employer various
const SOCSO_BRACKETS = [
  { max: 30, employee: 0.00, employer: 1.75 },
  { max: 50, employee: 0.10, employer: 3.35 },
  { max: 70, employee: 0.20, employer: 5.45 },
  { max: 100, employee: 0.40, employer: 9.10 },
  { max: 140, employee: 0.70, employer: 14.75 },
  { max: 200, employee: 1.10, employer: 21.75 },
  { max: 300, employee: 1.80, employer: 34.75 },
  { max: 400, employee: 2.50, employer: 49.50 },
  { max: 500, employee: 3.25, employer: 65.50 },
  { max: 600, employee: 4.00, employer: 80.50 },
  { max: 700, employee: 4.75, employer: 95.50 },
  { max: 800, employee: 5.50, employer: 110.50 },
  { max: 900, employee: 6.25, employer: 125.50 },
  { max: 1000, employee: 7.00, employer: 140.50 },
  { max: 1100, employee: 8.25, employer: 155.50 },
  { max: 1200, employee: 9.75, employer: 170.50 },
  { max: 1300, employee: 11.25, employer: 185.50 },
  { max: 1400, employee: 12.75, employer: 200.50 },
  { max: 1500, employee: 14.25, employer: 215.50 },
  { max: 1600, employee: 15.75, employer: 230.50 },
  { max: 1700, employee: 17.25, employer: 245.50 },
  { max: 1800, employee: 18.75, employer: 260.50 },
  { max: 1900, employee: 20.25, employer: 275.50 },
  { max: 2000, employee: 21.75, employer: 290.50 },
  { max: 2100, employee: 23.25, employer: 305.50 },
  { max: 2200, employee: 24.75, employer: 320.50 },
  { max: 2300, employee: 26.25, employer: 335.50 },
  { max: 2400, employee: 27.75, employer: 350.50 },
  { max: 2500, employee: 29.25, employer: 365.50 },
  { max: 2600, employee: 30.75, employer: 380.50 },
  { max: 2700, employee: 32.25, employer: 395.50 },
  { max: 2800, employee: 33.75, employer: 410.50 },
  { max: 2900, employee: 35.25, employer: 425.50 },
  { max: 3000, employee: 36.75, employer: 440.50 },
  { max: 3100, employee: 38.25, employer: 455.50 },
  { max: 3200, employee: 39.75, employer: 470.50 },
  { max: 3300, employee: 41.25, employer: 485.50 },
  { max: 3400, employee: 42.75, employer: 500.50 },
  { max: 3500, employee: 44.25, employer: 515.50 },
  { max: 3600, employee: 45.75, employer: 530.50 },
  { max: 3700, employee: 47.25, employer: 545.50 },
  { max: 3800, employee: 48.75, employer: 560.50 },
  { max: 3900, employee: 50.25, employer: 575.50 },
  { max: 4000, employee: 51.75, employer: 590.50 },
  { max: 4100, employee: 53.25, employer: 605.50 },
  { max: 4200, employee: 54.75, employer: 620.50 },
  { max: 4300, employee: 56.25, employer: 635.50 },
  { max: 4400, employee: 57.75, employer: 650.50 },
  { max: 4500, employee: 59.25, employer: 665.50 },
  { max: 4600, employee: 60.75, employer: 680.50 },
  { max: 4700, employee: 62.25, employer: 695.50 },
  { max: 4800, employee: 63.75, employer: 710.50 },
  { max: 4900, employee: 65.25, employer: 725.50 },
  { max: 5000, employee: 66.75, employer: 740.50 },
]

/**
 * Calculate SOCSO contribution based on wage bracket
 */
function calculateSOCSO(grossSalary: number): { employee: number; employer: number } {
  const bracket = SOCSO_BRACKETS.find(b => grossSalary <= b.max)
  if (bracket) {
    return { employee: bracket.employee, employer: bracket.employer }
  }
  // Above RM5,000 — employee capped at RM66.75, employer capped at RM740.50
  return { employee: 66.75, employer: 740.50 }
}

/**
 * Main payroll calculation function
 */
export function calculatePayroll(input: PayrollInput): PayrollResult {
  const {
    basicSalary,
    allowance,
    epfRate = 0.11,
    epfEmployerRate = 0.12,
    socsoRate,  // unused — use bracket table instead
    eisRate = 0.002,
  } = input

  const grossSalary = basicSalary + allowance

  // EPF
  const epfEmployee = grossSalary * epfRate
  const epfEmployer = grossSalary * epfEmployerRate

  // SOCSO (use bracket table)
  const socso = calculateSOCSO(grossSalary)

  // EIS (fixed rates — simplified)
  // Actual: employee ~RM2.45, employer ~RM4.90 for first RM5,000
  // Simplified: percentage-based for now
  const eisEmployee = Math.min(grossSalary * eisRate, 2.45)
  const eisEmployer = Math.min(grossSalary * (eisRate * 2), 4.90)

  const totalDeductions = epfEmployee + socso.employee + eisEmployee
  const netSalary = grossSalary - totalDeductions
  const employerCost = grossSalary + epfEmployer + socso.employer + eisEmployer

  return {
    grossSalary,
    epfEmployee,
    epfEmployer,
    socsoEmployee: socso.employee,
    socsoEmployer: socso.employer,
    eisEmployee,
    eisEmployer,
    totalDeductions,
    netSalary,
    employerCost,
  }
}

/**
 * Payroll Hook — encapsulates salary calculation + data fetching
 */
export function usePayroll() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PayrollResult | null>(null)

  const compute = useCallback((input: PayrollInput) => {
    setResult(calculatePayroll(input))
  }, [])

  /**
   * Auto-generate payroll for all active teachers
   */
  const autoGenerate = useCallback(async (year: number, month: number) => {
    setLoading(true)
    try {
      const response = await fetch('/api/salary/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, created_by: 'system' }),
      })
      const data = await response.json()
      return data
    } catch (err) {
      console.error('Auto-generate payroll failed:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    result,
    compute,
    autoGenerate,
    calculatePayroll,
  }
}
