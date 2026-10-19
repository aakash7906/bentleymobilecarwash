import React, { useEffect } from 'react'
import { USER_INFO } from '@/data/mockData'
import { preloadMembershipImages } from '@/components/MembershipPage'

interface ProfileTabProps {
  onBack: () => void
  onOpenSavedVehicles: () => void
  onNavigateToNotifications: () => void
  onOpenBooking?: () => void
  onOpenMembership?: () => void
  onLogout?: () => void
}

interface MenuItem {
  icon: string
  title: string
  subtitle: string
  action: () => void
  badge?: string
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  onBack,
  onOpenSavedVehicles,
  onNavigateToNotifications,
  onOpenBooking,
  onOpenMembership,
  onLogout,
}) => {
  useEffect(() => {
    // Preload membership images in background as soon as profile is open
    preloadMembershipImages()
  }, [])
  const menuItems: MenuItem[] = [
    {
      icon: 'receipt_long',
      title: 'Quote & Bookings',
      subtitle: 'Schedule or view appointments',
      action: onOpenBooking || (() => alert('Viewing past quotes...')),
    },
    {
      icon: 'directions_car',
      title: 'Saved Vehicles',
      subtitle: 'Manage registered vehicles',
      action: onOpenSavedVehicles,
    },
    {
      icon: 'notifications',
      title: 'Notifications',
      subtitle: 'View service alerts & updates',
      action: onNavigateToNotifications,
    },
    {
      icon: 'person',
      title: 'Contact Us',
      subtitle: 'Get to know us more',
      action: () => window.open('tel:+12503519155'),
    },
    {
      icon: 'shield',
      title: 'Security',
      subtitle: 'Further secure your account for safety',
      action: () => alert('Account security settings'),
    },
    {
      icon: 'privacy_tip',
      title: 'Privacy & Policy',
      subtitle: 'Know our privacy and policies',
      action: () => alert('Privacy policy'),
    },
    {
      icon: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and support',
      action: () => window.open('mailto:bentleymobilecarwash@gmail.com'),
    },
  ]

  return (
    <div className="flex flex-col w-full pb-28 px-5">
      {/* User Information Card */}
      <div className="mt-4 p-4 rounded-2xl border border-gray-200 bg-white shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full border border-gray-200 overflow-hidden shrink-0 shadow-sm">
            <img
              src={USER_INFO.avatar}
              alt={USER_INFO.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-bold text-gray-900">{USER_INFO.name}</h2>
            <span className="text-xs text-gray-500 font-medium">{USER_INFO.email}</span>
          </div>
        </div>

        <button className="text-gray-600 hover:text-gray-900 cursor-pointer">
          <span className="material-symbols-outlined text-[20px]">edit</span>
        </button>
      </div>

      {/* VIP Membership Banner */}
      <div
        onClick={onOpenMembership}
        onMouseEnter={preloadMembershipImages}
        onTouchStart={preloadMembershipImages}
        className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-primary to-primary-hover text-white shadow-md flex items-center justify-between cursor-pointer hover:shadow-lg active:scale-[0.99] transition-all overflow-hidden relative"
      >
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px] text-white">
              workspace_premium
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight">Bentley Membership</span>
              <span className="px-1.5 py-0.5 rounded bg-white text-primary text-[10px] font-black uppercase">
                VIP
              </span>
            </div>
            <span className="text-[11px] text-white/90">
              Gold, Platinum & Custom wash bundles
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-white relative z-10 pl-2">
          <span>View</span>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </div>
      </div>

      {/* Profile Menu List Card */}
      <div className="mt-4 p-2 rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col divide-y divide-gray-100">
        {menuItems.map((item, idx) => (
          <div
            key={idx}
            onClick={item.action}
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-gray-900">{item.title}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded-full bg-primary-light text-primary text-[10px] font-extrabold uppercase tracking-wide">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-gray-500">{item.subtitle}</span>
              </div>
            </div>

            <span className="material-symbols-outlined text-[18px] text-gray-400">
              chevron_right
            </span>
          </div>
        ))}
      </div>

      {/* Red Logout Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={onLogout || (() => alert('Logged out successfully.'))}
          className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}
