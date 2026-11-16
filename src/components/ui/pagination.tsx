import React from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  pageSize?: number
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  itemLabel?: string
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  className = '',
}: PaginationProps) {
  // If no items at all or single empty page with 0 items, don't show pagination
  if (totalItems !== undefined && totalItems === 0) {
    return null
  }

  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages]
    }

    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
  }

  const pages = getPageNumbers()

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className={`w-full flex items-center justify-center py-4 px-4 sm:px-6 rounded-2xl bg-white border border-gray-200/80 shadow-xs ${className}`}
    >
      {/* Editorial Pagination Controls: ← PREV  1  2  (3)  4  5  NEXT → */}
      <div className="flex items-center gap-3 sm:gap-6 select-none">
        {/* PREV Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Go to previous page"
          className={`inline-flex items-center gap-2 text-xs sm:text-sm font-bold tracking-[0.22em] uppercase transition-all cursor-pointer py-1.5 px-2 ${
            currentPage <= 1
              ? 'opacity-30 cursor-not-allowed text-gray-400'
              : 'text-gray-900 hover:text-primary active:scale-95'
          }`}
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.4]" />
          <span>PREV</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 sm:gap-2">
          {pages.map((p, index) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="w-8 h-8 flex items-center justify-center text-xs font-bold text-gray-400 select-none tracking-widest"
                >
                  …
                </span>
              )
            }

            const isActive = p === currentPage

            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Page ${p}`}
                className={`w-9 h-9 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center justify-center cursor-pointer ${
                  isActive
                    ? 'bg-primary text-white shadow-xs font-black scale-105'
                    : 'text-gray-800 hover:text-primary hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            )
          })}
        </div>

        {/* NEXT Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Go to next page"
          className={`inline-flex items-center gap-2 text-xs sm:text-sm font-bold tracking-[0.22em] uppercase transition-all cursor-pointer py-1.5 px-2 ${
            currentPage >= totalPages
              ? 'opacity-30 cursor-not-allowed text-gray-400'
              : 'text-gray-900 hover:text-primary active:scale-95'
          }`}
        >
          <span>NEXT</span>
          <ArrowRight className="w-4 h-4 stroke-[2.4]" />
        </button>
      </div>
    </nav>
  )
}
