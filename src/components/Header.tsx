import React from 'react'
import { ChevronLeft } from 'lucide-react'
import { TabType } from '@/types'
import { USER_INFO } from '@/data/mockData'
import logoBentley from '@/assets/Logo_Bentley.png'

interface HeaderProps {
  currentTab: TabType
  onTabChange: (tab: TabType) => void
  title?: string
  showBack?: boolean
  onBack?: () => void
  onReplaySplash?: () => void
  onReplayOnboarding?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  title,
  showBack,
  onBack,
  onReplaySplash,
  onReplayOnboarding,
}) => {
  return (
    <header className="w-full bg-white select-none">
      {/* Main Top Navigation Bar */}
      <div className="w-full flex items-center justify-between px-5 py-3">
        {showBack ? (
          <div className="w-full flex items-center justify-between">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-base font-bold text-[var(--text-main)] text-center flex-1">
              {title || 'Services'}
            </h1>
            <div className="w-9" /> {/* Spacer for balance */}
          </div>
        ) : (
          <>
            {/* Bentley Mascot Logo */}
            <div
              onClick={() => onTabChange('home')}
              className="cursor-pointer active:scale-95 transition-transform"
            >
              <img
                src={logoBentley}
                alt="Bentley Mobile Wash"
                className="h-11 w-auto object-contain filter drop-shadow-sm"
              />
            </div>

            {/* Right Action: Replay buttons & User Profile Avatar */}
            <div className="flex items-center gap-2">
              {onReplaySplash && (
                <button
                  onClick={onReplaySplash}
                  title="Preview Splash Screen"
                  className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 active:scale-95 transition-all flex items-center gap-1 font-medium"
                >
                  <span className="material-symbols-outlined text-[15px] text-gray-600">
                    hourglass_top
                  </span>
                  <span className="hidden sm:inline">Splash</span>
                </button>
              )}

              {onReplayOnboarding && (
                <button
                  onClick={onReplayOnboarding}
                  title="Preview Onboarding Screen"
                  className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 active:scale-95 transition-all flex items-center gap-1 font-medium"
                >
                  <span className="material-symbols-outlined text-[15px] text-red-600">
                    directions_car
                  </span>
                  <span className="hidden sm:inline">Onboard</span>
                </button>
              )}

              {/* User Profile Avatar with thin ring border */}
              <div
                onClick={() => onTabChange('profile')}
                className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden cursor-pointer hover:ring-2 hover:ring-[var(--color-primary-glow)] transition-all shadow-sm active:scale-95"
              >
                <img
                  src={USER_INFO.avatar}
                  alt={USER_INFO.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}

export default Header
