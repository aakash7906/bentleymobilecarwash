import React, { useState, useEffect } from 'react'
import { UserProfile } from '@/types'
import { USER_INFO, USER_SAVED_VEHICLES } from '@/data/mockData'
import { preloadMembershipImages } from '@/components/MembershipPage'
import { EditProfilePage } from '@/components/EditProfilePage'
import { useToast } from '@/context/ToastContext'

interface ProfileTabProps {
  onBack: () => void
  onOpenSavedVehicles: () => void
  onNavigateToNotifications: () => void
  onOpenBooking?: () => void
  onOpenMembership?: () => void
  onLogout?: () => void
  onSwitchToDriver?: () => void
  userProfile?: UserProfile
  onUpdateProfile?: (updated: UserProfile) => void
  savedVehiclesCount?: number
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
  onSwitchToDriver,
  userProfile: externalProfile,
  onUpdateProfile,
  savedVehiclesCount,
}) => {
  // Global Toast Hook
  const { showToast } = useToast()

  // Dynamic user profile state with local persistence
  const [profile, setProfile] = useState<UserProfile>(() => {
    if (externalProfile) return externalProfile
    try {
      const saved = localStorage.getItem('bentley_user_profile')
      if (saved) return JSON.parse(saved)
    } catch {
      // fallback
    }
    return {
      name: USER_INFO.name || 'Sarah Jenkins',
      email: USER_INFO.email || 'sarah.jenkins@gmail.com',
      phone: '+1 (998) 877-5561',
      address: '21/22, 5th Avenue, Jamesford Road, Ontario, Canada',
      city: 'Ontario',
      postalCode: 'L4B 1X9',
      avatar:
        USER_INFO.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      preferredVehicle: USER_INFO.currentVehicle || 'Audi R8 GT',
      membershipTier: 'VIP Platinum',
    }
  })

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)

  useEffect(() => {
    // Preload membership images in background as soon as profile is open
    preloadMembershipImages()
  }, [])

  useEffect(() => {
    if (externalProfile) {
      setProfile(externalProfile)
    }
  }, [externalProfile])

  const handleSaveProfile = (updated: UserProfile) => {
    setProfile(updated)
    try {
      localStorage.setItem('bentley_user_profile', JSON.stringify(updated))
    } catch {
      // ignore
    }
    showToast('Profile updated successfully!', 'success')
    if (onUpdateProfile) {
      onUpdateProfile(updated)
    }
  }

  const menuItems: MenuItem[] = [
    {
      icon: 'manage_accounts',
      title: 'Edit Profile',
      subtitle: 'Update your name, contact & address',
      action: () => setIsEditProfileOpen(true),
      badge: 'Account',
    },
    {
      icon: 'receipt_long',
      title: 'Quote & Bookings',
      subtitle: 'Schedule or view appointments',
      action: onOpenBooking || (() => showToast('Viewing past quotes & appointments', 'info')),
    },
    {
      icon: 'directions_car',
      title: 'Saved Vehicles',
      subtitle: 'Manage registered vehicles',
      action: onOpenSavedVehicles,
      badge: savedVehiclesCount !== undefined ? `${savedVehiclesCount} Cars` : undefined,
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
      action: () => showToast('Security settings coming soon!', 'info'),
    },
    {
      icon: 'privacy_tip',
      title: 'Privacy & Policy',
      subtitle: 'Know our privacy and policies',
      action: () => showToast('Bentley Privacy Policy: Your data is 100% secure.', 'info'),
    },
    {
      icon: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and support',
      action: () => window.open('mailto:bentleymobilecarwash@gmail.com'),
    },
  ]

  return (
    <div className="flex flex-col w-full pb-28 px-4 sm:px-6 md:px-8">
      {/* User Information Card (Clickable to Edit) */}
      <div
        onClick={() => setIsEditProfileOpen(true)}
        className="mt-4 p-4 rounded-3xl border border-gray-200/90 bg-white shadow-sm flex flex-col gap-3.5 hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full border-2 border-primary/20 overflow-hidden shadow-sm group-hover:border-primary transition-colors">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center border border-white shadow-xs">
                <span className="material-symbols-outlined text-[12px]">edit</span>
              </div>
            </div>

            <div className="flex flex-col min-w-0 justify-center">
              <h2 className="text-base font-bold text-gray-900 truncate group-hover:text-primary transition-colors">
                {profile.name}
              </h2>
              {/* STEP 2 INTEGRATION: Display real logged-in user email */}
              {profile.email && (
                <span className="text-xs text-gray-500 truncate font-normal">
                  {profile.email}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsEditProfileOpen(true)
            }}
            className="w-8 h-8 rounded-full bg-surface-alt hover:bg-gray-200 text-gray-700 flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
            title="Edit Profile"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
        </div>

        {/* Dynamic Quick Details Badges */}
        <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-gray-600 min-w-0">
            <span className="material-symbols-outlined text-primary text-[16px] shrink-0">
              directions_car
            </span>
            <span className="font-semibold text-gray-900 truncate max-w-[140px]">
              {profile.preferredVehicle || 'Audi R8 GT'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-gray-600 min-w-0">
            <span className="material-symbols-outlined text-primary text-[16px] shrink-0">
              location_on
            </span>
            <span className="font-semibold text-gray-900 truncate max-w-[130px]">
              {profile.city || 'Ontario'}
            </span>
          </div>
        </div>
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
              Gold, Platinum &amp; Custom wash bundles
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-white relative z-10 pl-2">
          <span>View</span>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </div>
      </div>

      {/* Driver Partner Mode Quick Launcher */}
      {onSwitchToDriver && (
        <div
          onClick={onSwitchToDriver}
          className="mt-3 p-3.5 rounded-2xl bg-secondary text-white shadow-md flex items-center justify-between cursor-pointer hover:bg-neutral-900 active:scale-[0.99] transition-all border border-neutral-700/60"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-emerald-400">
              <span className="material-symbols-outlined text-[22px]">local_shipping</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-white">Driver Partner Portal</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  Switch
                </span>
              </div>
              <span className="text-[11px] text-gray-400">
                View live orders, accept jobs &amp; navigate washes
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-gray-400 text-[20px]">chevron_right</span>
        </div>
      )}

      {/* Profile Menu List Card */}
      <div className="mt-4 p-2 rounded-2xl border border-gray-200 bg-white shadow-sm grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-2">
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

      {/* Dedicated Edit Profile Full Page Modal */}
      <EditProfilePage
        isOpen={isEditProfileOpen}
        userProfile={profile}
        onClose={() => setIsEditProfileOpen(false)}
        onSave={handleSaveProfile}
        savedVehicles={USER_SAVED_VEHICLES}
      />
    </div>
  )
}
export default ProfileTab
