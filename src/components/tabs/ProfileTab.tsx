import React from 'react'
import { USER_INFO } from '@/data/mockData'

interface ProfileTabProps {
  onBack: () => void
  onOpenSavedVehicles: () => void
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  onBack,
  onOpenSavedVehicles,
}) => {
  const menuItems = [
    {
      icon: 'receipt_long',
      title: 'Quote',
      subtitle: 'Your previous quotes',
      action: () => alert('Viewing past quotes...'),
    },
    {
      icon: 'directions_car',
      title: 'Saved Vehicles',
      subtitle: 'Manage registered vehicles',
      action: onOpenSavedVehicles,
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
            <span className="text-xs text-gray-500 font-medium">
              {USER_INFO.email}
            </span>
          </div>
        </div>

        <button className="text-gray-600 hover:text-gray-900 cursor-pointer">
          <span className="material-symbols-outlined text-[20px]">edit</span>
        </button>
      </div>

      {/* Profile Menu List Card */}
      <div className="mt-5 p-2 rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col divide-y divide-gray-100">
        {menuItems.map((item, idx) => (
          <div
            key={idx}
            onClick={item.action}
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                <span className="material-symbols-outlined text-[20px]">
                  {item.icon}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-bold text-gray-900">
                  {item.title}
                </span>
                <span className="text-[11px] text-gray-500">
                  {item.subtitle}
                </span>
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
          onClick={() => alert('Logged out successfully.')}
          className="px-6 py-2 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}
