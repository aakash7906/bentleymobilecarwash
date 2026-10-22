import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'

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
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2.5 max-w-sm sm:max-w-md w-[92%] pointer-events-none"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success'
        const isError = toast.type === 'error'
        const isWarning = toast.type === 'warning'
        const isInfo = toast.type === 'info'

        return (
          <div
            key={toast.id}
            role="alert"
            className={`w-full px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border backdrop-blur-md pointer-events-auto transition-all animate-in fade-in slide-in-from-top-4 duration-300 ${
              isSuccess
                ? 'bg-emerald-950/95 text-white border-emerald-500/30'
                : isError
                ? 'bg-red-950/95 text-white border-red-500/30'
                : isWarning
                ? 'bg-amber-950/95 text-white border-amber-500/30'
                : 'bg-secondary/95 text-white border-white/20'
            }`}
          >
            {/* Dynamic Status Icon */}
            <span
              className={`material-symbols-outlined text-[20px] shrink-0 ${
                isSuccess
                  ? 'text-emerald-400'
                  : isError
                  ? 'text-red-400'
                  : isWarning
                  ? 'text-amber-400'
                  : 'text-blue-400'
              }`}
            >
              {isSuccess
                ? 'check_circle'
                : isError
                ? 'error'
                : isWarning
                ? 'warning'
                : 'info'}
            </span>

            {/* Message Body */}
            <span className="text-xs sm:text-sm font-semibold flex-1 leading-snug">
              {toast.message}
            </span>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-white/60 hover:text-white transition-colors cursor-pointer shrink-0 p-0.5 rounded-lg active:scale-95"
              aria-label="Close notification"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
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
