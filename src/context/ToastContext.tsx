import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react'

/**
 * Toast notification severity types
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning'

/**
 * Individual toast item definition
 */
export interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration?: number
}

/**
 * Toast context value contract
 */
export interface ToastContextType {
  toasts: ToastItem[]
  showToast: (message: string, type?: ToastType, duration?: number) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

/**
 * Custom hook to trigger toasts from any component in the application
 */
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

/**
 * Global Toaster overlay component rendering active toasts with smooth animations
 */
export const Toaster: React.FC = () => {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-5 right-5 z-[9999] flex flex-col items-end gap-2 max-w-sm w-[92%] sm:w-auto pointer-events-none"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success'
        const isError = toast.type === 'error'
        const isWarning = toast.type === 'warning'
        const _isInfo = toast.type === 'info'

        return (
          <div
            key={toast.id}
            role="alert"
            className="w-auto min-w-[260px] max-w-full px-4 py-3 rounded-[var(--radius-box-sm)] shadow-[var(--shadow-card)] border border-[var(--border-light)] flex items-center gap-2.5 pointer-events-auto transition-all animate-in fade-in slide-in-from-right-4 duration-200 bg-[var(--bg-app)]"
          >
            {/* Outline Status Icon referencing index.css brand & status tokens */}
            <span className="shrink-0 flex items-center justify-center">
              {isSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-[var(--status-active)] stroke-[1.75]" />
              ) : isError ? (
                <XCircle className="w-4 h-4 text-[var(--primary)] stroke-[1.75]" />
              ) : isWarning ? (
                <AlertCircle className="w-4 h-4 text-[var(--status-warning)] stroke-[1.75]" />
              ) : (
                <Info className="w-4 h-4 text-[var(--status-info)] stroke-[1.75]" />
              )}
            </span>

            {/* Message Body */}
            <span className="text-xs sm:text-sm font-normal text-[var(--text-main)] leading-snug tracking-tight">
              {toast.message}
            </span>

            {/* Subtle Close button */}
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="ml-auto pl-1 text-[var(--text-light)] hover:text-[var(--text-muted)] transition-colors cursor-pointer shrink-0"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5 stroke-[1.5]" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Toast Context Provider wrapping the application root
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3500) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newToast: ToastItem = { id, message, type, duration }

      setToasts((prev) => [...prev, newToast])

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const value = useMemo(
    () => ({ toasts, showToast, removeToast }),
    [toasts, showToast, removeToast]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  )
}
