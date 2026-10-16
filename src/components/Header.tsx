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
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  title,
  showBack,
  onBack,
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
          </>
        )}
      </div>
    </header>
  )
}
