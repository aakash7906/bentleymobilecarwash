import React from 'react'
import { TabType } from '@/types'

interface BottomNavProps {
  currentTab: TabType
  onTabChange: (tab: TabType) => void
  trackingActive?: boolean
  pendingOpsCount?: number
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  trackingActive = true,
  pendingOpsCount = 3,
}) => {
  const tabs = [
    {
      id: 'services' as TabType,
      label: 'Services',
      icon: 'local_car_wash',
    },
    {
      id: 'tracking' as TabType,
      label: 'Tracking',
      icon: 'near_me',
      hasDot: trackingActive,
    },
    {
      id: 'garage' as TabType,
      label: 'Garage',
      icon: 'garage',
    },
    {
      id: 'ops' as TabType,
      label: 'Ops Hub',
      icon: 'support_agent',
      badge: pendingOpsCount > 0 ? pendingOpsCount : undefined,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[var(--border-light)] shadow-[var(--shadow-nav)]">
      <div className="max-w-md md:max-w-xl mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-all cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-[var(--color-primary)] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span
                  className={`material-symbols-outlined text-[23px] transition-transform ${
                    isActive ? 'scale-110' : ''
                  }`}
                >
                  {tab.icon}
                </span>

                {/* Tracking Live Pulse */}
                {tab.hasDot && !isActive && (
                  <span className="absolute -top-0.5 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-primary)]" />
                  </span>
                )}

                {/* Ops Hub Badge */}
                {tab.badge && (
                  <span className="absolute -top-1 -right-2.5 bg-[var(--color-primary)] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-tight">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>

              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-[var(--color-primary)] rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
