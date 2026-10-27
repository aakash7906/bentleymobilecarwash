import React from 'react'
import { TabType } from '@/types'
import { Home, Car, ReceiptText, User } from 'lucide-react'

interface BottomNavProps {
  currentTab: TabType
  onTabChange: (tab: TabType) => void
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'services' as TabType, label: 'Services', icon: Car },
    { id: 'bookings' as TabType, label: 'Bookings', icon: ReceiptText },
    { id: 'profile' as TabType, label: 'Profile', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="w-full pointer-events-auto">
        {/* Parabolic Top Edge SVG */}
        <div className="relative w-full">
          <svg
            viewBox="0 0 600 32"
            preserveAspectRatio="none"
            className="w-full h-[24px] sm:h-[28px] md:h-[32px] block fill-secondary -mb-px filter drop-shadow-[0_-3px_8px_rgba(0,0,0,0.08)]"
          >
            <path d="M 0,32 Q 300,0 600,32 Z" />
          </svg>

          {/* Minimalist Navigation Body */}
          <div className="bg-secondary w-full">
            <div className="max-w-md sm:max-w-lg md:max-w-xl mx-auto px-4 sm:px-6 pt-1 sm:pt-1.5 pb-3.5 sm:pb-4.5 pb-[max(0.85rem,env(safe-area-inset-bottom))] flex items-center justify-around">
              {tabs.map((tab) => {
                const isActive = currentTab === tab.id
                const IconComponent = tab.icon

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    aria-label={tab.label}
                    className="flex flex-col items-center justify-center py-1 px-2.5 sm:px-3 min-w-[60px] sm:min-w-[68px] cursor-pointer transition-transform active:scale-90 group select-none"
                  >
                    <div
                      className={`flex items-center justify-center transition-all ${
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
