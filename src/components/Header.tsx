import React from 'react'
import { TabType } from '@/types'
import bentleyLogo from '@/assets/bentley-mobile-logo.png'

interface HeaderProps {
  currentTab: TabType
  onTabChange: (tab: TabType) => void
  activeBookingId?: string
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  activeBookingId = '#BM-6492',
}) => {
  const isOps = currentTab === 'ops'
  const isTracking = currentTab === 'tracking'

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[var(--border-light)] px-4 py-2.5 transition-all">
      <div className="flex items-center justify-between max-w-full">
        {/* Brand identity */}
        <div
          onClick={() => onTabChange('services')}
          className="flex items-center gap-2.5 cursor-pointer active:scale-98 transition-transform"
        >
          <div className="relative h-10 w-14 rounded-lg overflow-hidden bg-slate-100 p-0.5 border border-[var(--border-light)] shadow-sm shrink-0 flex items-center justify-center">
            <img
              src={bentleyLogo}
              alt="Bentley Mobile Wash"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[15px] tracking-tight text-[var(--text-main)] leading-none">
                Bentley Mobile Wash
              </span>
              {isTracking && (
                <span className="badge-pill bg-[var(--color-primary-light)] text-[var(--color-primary)] text-[10px] px-1.5 py-0.5 border border-[var(--color-primary-border)] font-mono font-bold">
                  {activeBookingId}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] mt-0.5 font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--status-green)] animate-pulse" />
              <span>
                {isOps
                  ? 'Owner / Dispatcher'
                  : isTracking
                  ? 'En Route to Kelowna, BC'
                  : 'Kelowna, BC - Rig On-Road'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Action: Staff Mode toggle or Notifications */}
        <div className="flex items-center gap-2">
          {isOps ? (
            <button
              onClick={() => onTabChange('services')}
              className="btn-secondary text-xs px-3 py-1.5 shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[15px] text-[var(--color-primary)]">
                visibility
              </span>
              <span className="hidden sm:inline">Client View</span>
              <span className="sm:hidden">Exit</span>
            </button>
          ) : (
            <button
              onClick={() => onTabChange('ops')}
              className="btn-dark text-xs px-3 py-1.5 shadow-sm active:scale-95 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px] text-amber-400">
                admin_panel_settings
              </span>
              <span>Staff Mode</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
