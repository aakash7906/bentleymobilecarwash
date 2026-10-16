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
      <div className="max-w-md md:max-w-xl mx-auto pointer-events-auto">
        {/* Parabolic Top Edge SVG */}
        <div className="relative w-full">
          <svg
            viewBox="0 0 400 18"
            preserveAspectRatio="none"
            className="w-full h-4 block fill-[#222225] filter drop-shadow-[0_-4px_8px_rgba(0,0,0,0.12)]"
          >
            <path d="M 0,18 Q 200,0 400,18 Z" />
          </svg>

          {/* Minimalist Navigation Body */}
          <div className="bg-[#222225] px-6 pt-0.5 pb-2.5 flex items-center justify-around">
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
                  className="flex items-center justify-center p-1 cursor-pointer transition-transform active:scale-90"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-[#8e8e93] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <IconComponent
                      size={20}
                      strokeWidth={isActive ? 2.4 : 1.7}
                      className="transition-colors"
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
