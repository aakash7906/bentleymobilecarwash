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
  options: SelectOption[]
}

export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  placeholder = 'Select an option',
  className,
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
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-xs transition-colors hover:border-gray-300 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20',
          isOpen && 'border-primary ring-1 ring-primary/20'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-gray-400 shrink-0 transition-transform duration-200 ml-1.5',
            isOpen && 'rotate-180 text-primary'
          )}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full min-w-[130px] overflow-auto rounded-xl border border-gray-100 bg-white p-1 text-gray-900 shadow-xl animate-in fade-in zoom-in-95 duration-150"
        >
          {options.map((opt) => {
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
                  'relative flex w-full cursor-pointer select-none items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-gray-100/80 active:bg-gray-200/70',
                  isSelected && 'bg-primary/10 text-primary font-bold hover:bg-primary/15'
                )}
                role="option"
                aria-selected={isSelected}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary stroke-[2.5]" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
