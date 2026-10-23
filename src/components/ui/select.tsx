import * as React from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  label: string
  value: string
}

export interface SelectProps {
  value: string
  onValueChange: (val: string) => void
  children?: React.ReactNode
  placeholder?: string
  className?: string
  triggerClassName?: string
  contentClassName?: string
  icon?: React.ReactNode
  disabled?: boolean
  options: SelectOption[]
}

export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  placeholder = 'Select an option',
  className,
  triggerClassName,
  contentClassName,
  icon,
  disabled = false,
  options = [],
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Close on outside click
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen])

  // Close on ESC
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <div ref={containerRef} className={cn('relative w-full select-none', className)}>
      {/* Trigger Button (shadcn/ui inspired) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'flex h-11 w-full items-center justify-between rounded-xl border border-gray-200 bg-[var(--surface-alt,#f8fafc)] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-gray-900 shadow-xs transition-all hover:border-gray-300 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
          icon ? 'pl-10' : 'pl-3.5',
          isOpen && 'border-primary bg-white ring-2 ring-primary/15',
          triggerClassName
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <span className={cn('truncate text-left', !selectedOption && 'text-gray-400 font-normal')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-400 shrink-0 transition-transform duration-200 ml-2',
            isOpen && 'rotate-180 text-primary'
          )}
        />
      </button>

      {/* Responsive Dropdown Popover (shadcn/ui style with rounded edges, shadow, and check marks) */}
      {isOpen && (
        <div
          role="listbox"
          className={cn(
            'absolute z-50 mt-1.5 max-h-60 w-full min-w-[200px] overflow-y-auto overscroll-contain rounded-2xl border border-gray-200 bg-white p-1.5 text-gray-900 shadow-2xl shadow-black/10 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150',
            contentClassName
          )}
        >
          {options.length === 0 ? (
            <div className="py-3 px-3 text-center text-xs text-gray-500 font-medium">
              No options available
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onValueChange(opt.value)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'group relative flex w-full cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all hover:bg-gray-50 active:bg-gray-100 text-left',
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold hover:bg-primary/15'
                      : 'text-gray-700 hover:text-gray-900'
                  )}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="truncate pr-2">{opt.label}</span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
