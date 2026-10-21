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
      <div className="max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto pointer-events-auto">
        {/* Parabolic Top Edge SVG */}
        <div className="relative w-full">
          <svg
            viewBox="0 0 400 18"
            preserveAspectRatio="none"
            className="w-full h-4 block fill-secondary -mb-px"
          >
            <path d="M 0,18 Q 200,0 400,18 Z" />
          </svg>

          {/* Minimalist Navigation Body */}
          <div className="bg-secondary px-6 pt-0.5 pb-2.5 flex items-center justify-around">
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
                  className="flex flex-col items-center justify-center p-1 cursor-pointer transition-transform active:scale-90 group"
                >
                  <div
                    className={`flex items-center justify-center transition-all ${
                      isActive
                        ? 'text-white'
                        : 'text-[#8e8e93] group-hover:text-white'
                    }`}
                  >
                    <IconComponent
                      size={18}
                      strokeWidth={isActive ? 2.4 : 1.7}
                      className="transition-colors"
                    />
                  </div>
                  <span
                    className={`text-[10px] tracking-tight mt-0.5 leading-none transition-colors ${
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
    </nav>
  )
}
