import React from 'react'
import { Truck, History, User } from 'lucide-react'

export type DriverTabType = 'orders' | 'history' | 'profile'

interface DriverBottomNavProps {
  currentTab: DriverTabType
  onTabChange: (tab: DriverTabType) => void
  ordersBadge?: number
  historyBadge?: number
}

export const DriverBottomNav: React.FC<DriverBottomNavProps> = ({
  currentTab,
  onTabChange,
  ordersBadge = 0,
  historyBadge = 0,
}) => {
  const tabs = [
    {
      id: 'orders' as DriverTabType,
      label: 'Orders',
      icon: Truck,
      badge: ordersBadge,
    },
    {
      id: 'history' as DriverTabType,
      label: 'History',
      icon: History,
      badge: historyBadge,
    },
    {
      id: 'profile' as DriverTabType,
      label: 'Profile',
      icon: User,
      badge: 0,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none select-none">
      <div className="w-full pointer-events-auto">
        {/* Parabolic Top Edge SVG - Matches Customer BottomNav Aesthetic */}
        <div className="relative w-full">
          <svg
            viewBox="0 0 600 32"
            preserveAspectRatio="none"
            className="w-full h-[24px] sm:h-[28px] md:h-[32px] block fill-secondary -mb-px filter drop-shadow-[0_-3px_8px_rgba(0,0,0,0.08)]"
          >
            <path d="M 0,32 Q 300,0 600,32 Z" />
          </svg>

          {/* Navigation Body */}
          <div className="bg-secondary w-full">
            <div className="max-w-md sm:max-w-lg md:max-w-xl mx-auto px-4 sm:px-6 pt-1 sm:pt-1.5 pb-3.5 sm:pb-4.5 pb-[max(0.85rem,env(safe-area-inset-bottom))] flex items-center justify-around">
              {tabs.map((tab) => {
                const isActive = currentTab === tab.id
                const IconComponent = tab.icon

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      onTabChange(tab.id)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    aria-label={tab.label}
                    className="relative flex flex-col items-center justify-center py-1 px-3 sm:px-4 min-w-[70px] sm:min-w-[80px] cursor-pointer transition-transform active:scale-90 group"
                  >
                    <div
                      className={`relative flex items-center justify-center transition-all ${
                        isActive
                          ? 'text-white scale-105'
                          : 'text-[#8e8e93] group-hover:text-white'
                      }`}
                    >
                      <IconComponent
                        size={20}
                        strokeWidth={isActive ? 2.4 : 1.8}
                        className="transition-colors sm:w-[22px] sm:h-[22px]"
                      />

                      {/* Notification / Count Badge */}
                      {tab.badge > 0 && (
                        <span
                          className={`absolute -top-1.5 -right-3 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-black flex items-center justify-center leading-none shadow-xs ${
                            tab.id === 'orders'
                              ? 'bg-primary text-white animate-pulse'
                              : 'bg-emerald-500 text-white'
                          }`}
                        >
                          {tab.badge > 99 ? '99+' : tab.badge}
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[11px] sm:text-xs tracking-tight mt-1 leading-none transition-colors ${
                        isActive
                          ? 'text-white font-bold'
                          : 'text-[#8e8e93] font-medium group-hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default DriverBottomNav
