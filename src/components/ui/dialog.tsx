import React, { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DialogMaxWidth = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
export type DialogPosition = 'center' | 'bottom-sheet' | 'bottom'
export type DialogIconVariant = 'danger' | 'warning' | 'info' | 'success' | 'primary' | 'neutral'

const maxWidthClasses: Record<DialogMaxWidth, string> = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full',
}

const positionOverlayClasses: Record<DialogPosition, string> = {
  center: 'items-center justify-center p-4',
  'bottom-sheet': 'items-end sm:items-center justify-center p-0 sm:p-4',
  bottom: 'items-end justify-center p-0',
}

const iconVariantClasses: Record<DialogIconVariant, string> = {
  danger: 'bg-red-100 text-red-600',
  warning: 'bg-amber-100 text-amber-600',
  info: 'bg-blue-100 text-blue-600',
  success: 'bg-emerald-100 text-emerald-600',
  primary: 'bg-primary-light text-primary',
  neutral: 'bg-gray-100 text-gray-700',
}

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
  children?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  iconVariant?: DialogIconVariant
  maxWidth?: DialogMaxWidth
  position?: DialogPosition
  zIndex?: string
  overlayClassName?: string
  contentClassName?: string
  className?: string
  showCloseButton?: boolean
  closeOnBackdropClick?: boolean
  closeOnEsc?: boolean
  role?: string
  'aria-modal'?: boolean | 'true' | 'false'
  'aria-labelledby'?: string
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  children,
  title,
  description,
  icon,
  iconVariant = 'danger',
  maxWidth = 'sm',
  position = 'center',
  zIndex = 'z-50',
  overlayClassName,
  contentClassName,
  className,
  showCloseButton = false,
  closeOnBackdropClick = true,
  closeOnEsc = true,
  role = 'dialog',
  'aria-modal': ariaModal = true,
  'aria-labelledby': ariaLabelledBy,
}) => {
  // Handle ESC key press
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        onClose()
      }
    },
    [closeOnEsc, onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent background scrolling while modal is open
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose()
    }
  }

  const isBottomSheet = position === 'bottom-sheet'

  return (
    <div
      role={role}
      aria-modal={ariaModal}
      aria-labelledby={ariaLabelledBy}
      onClick={handleOverlayClick}
      className={cn(
        'fixed inset-0 bg-black/60 backdrop-blur-xs flex animate-in fade-in duration-150',
        zIndex,
        positionOverlayClasses[position],
        overlayClassName
      )}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative bg-white w-full p-5 sm:p-6 shadow-2xl border border-gray-100 flex flex-col',
          isBottomSheet ? 'rounded-t-3xl sm:rounded-3xl animate-in slide-in-from-bottom duration-200' : 'rounded-3xl animate-in zoom-in-95 duration-150',
          maxWidthClasses[maxWidth] || maxWidth,
          contentClassName,
          className
        )}
      >
        {/* Optional top-right close button */}
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer z-10"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Icon (extracted directly from User Profile Dialog pattern) */}
        {icon && (
          <div
            className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shrink-0 mb-3',
              iconVariantClasses[iconVariant]
            )}
          >
            {icon}
          </div>
        )}

        {/* Title and Description */}
        {(title || description) && (
          <div className="text-center flex flex-col gap-1.5 mb-2">
            {title && (
              <h3
                id={ariaLabelledBy}
                className="text-base sm:text-lg font-extrabold text-gray-900"
              >
                {title}
              </h3>
            )}
            {description && (
              <div className="text-xs text-gray-500 leading-relaxed">
                {description}
              </div>
            )}
          </div>
        )}

        {/* Main Body / Action Buttons */}
        {children}
      </div>
    </div>
  )
}

// Subcomponents for compound composition
export const DialogHeader: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => (
  <div className={cn('flex items-center justify-between pb-3 border-b border-gray-100', className)}>
    {children}
  </div>
)

export const DialogTitle: React.FC<{
  className?: string
  children: React.ReactNode
  id?: string
}> = ({ className, children, id }) => (
  <h3 id={id} className={cn('text-base font-bold text-gray-900', className)}>
    {children}
  </h3>
)

export const DialogDescription: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => <p className={cn('text-xs text-gray-500 leading-relaxed', className)}>{children}</p>

export const DialogContent: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => <div className={cn('py-2', className)}>{children}</div>

export const DialogFooter: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => <div className={cn('flex items-center gap-2 pt-2', className)}>{children}</div>

export default Dialog
