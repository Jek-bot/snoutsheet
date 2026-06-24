import { createContext, useContext, useState, useCallback } from 'react'
import ReportProblemModal from '@/components/support/ReportProblemModal'

const SupportContext = createContext(null)

/** Mounts the "Report a problem" modal once and exposes openReport() so any
 *  component (top bar, sidebar, …) can trigger it. */
export function SupportProvider({ children }) {
  const [open, setOpen] = useState(false)
  const openReport = useCallback(() => setOpen(true), [])
  const closeReport = useCallback(() => setOpen(false), [])

  return (
    <SupportContext.Provider value={{ openReport }}>
      {children}
      {open && <ReportProblemModal onClose={closeReport} />}
    </SupportContext.Provider>
  )
}

export function useSupport() {
  const ctx = useContext(SupportContext)
  if (!ctx) throw new Error('useSupport must be used within SupportProvider')
  return ctx
}
