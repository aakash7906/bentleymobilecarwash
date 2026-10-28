import React, { useState, useEffect } from 'react'
import { User, Trash2, AlertTriangle, Loader2, LogOut } from 'lucide-react'
import { UserProfile } from '@/types'
import { preloadMembershipImages } from '@/pages/Membership/MembershipPage'
import { EditProfilePage } from '@/pages/Profile/EditProfilePage'
import { ContactUsPage } from '@/pages/Contact/ContactUsPage'
import { AboutUsPage } from '@/pages/About/AboutUsPage'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

interface ProfileTabProps {
  onBack: () => void
  onOpenSavedVehicles: () => void
  onNavigateToNotifications: () => void
  onOpenBooking?: () => void
  onOpenMembership?: () => void
  onOpenContactUs?: () => void
  onOpenAboutUs?: () => void
  onLogout?: () => void
  onDeleteAccount?: () => Promise<boolean | void>
  userProfile?: UserProfile
  onUpdateProfile?: (updated: UserProfile) => void
  savedVehiclesCount?: number
  savedVehiclesList?: string[]
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
  onOpenContactUs,
  onOpenAboutUs,
  onLogout,
  onDeleteAccount,
  userProfile: externalProfile,
  onUpdateProfile,
  savedVehiclesCount,
  savedVehiclesList,
}) => {
  // Global Toast Hook
  const { showToast } = useToast()

  // State for Logout confirmation modal
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // State for Delete Account confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Dynamic user profile state with local persistence (only dynamic photos or default User icon)
  const sanitizeAvatar = (url?: string) => {
    if (!url) return ''
    if (url.includes('unsplash.com')) return ''
    return url
  }

  const [profile, setProfile] = useState<UserProfile>(() => {
    if (externalProfile) {
      return {
        ...externalProfile,
        avatar: sanitizeAvatar(externalProfile.avatar),
      }
    }
    try {
      const saved = localStorage.getItem('bentley_user_profile')
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          ...parsed,
          avatar: sanitizeAvatar(parsed.avatar),
        }
      }
    } catch {
      // fallback
    }
    return {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      avatar: '',
      preferredVehicle: '',
      membershipTier: 'General Member',
    }
  })

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(() => {
    try {
      return localStorage.getItem('bentley_edit_profile_open') === 'true'
    } catch {
      return false
    }
  })
  const [isContactUsOpen, setIsContactUsOpen] = useState(false)
  const [isAboutUsOpen, setIsAboutUsOpen] = useState(false)

  // Persist edit profile modal open state across refresh
  useEffect(() => {
    try {
      if (isEditProfileOpen) {
        localStorage.setItem('bentley_edit_profile_open', 'true')
      } else {
        localStorage.removeItem('bentley_edit_profile_open')
      }
    } catch { }
  }, [isEditProfileOpen])

  useEffect(() => {
    // Preload membership images in background as soon as profile is open
    preloadMembershipImages()
  }, [])

  useEffect(() => {
    if (externalProfile) {
      setProfile({
        ...externalProfile,
        avatar: sanitizeAvatar(externalProfile.avatar),
      })
    }
  }, [externalProfile])

  const handleSaveProfile = (updated: UserProfile) => {
    const cleaned = {
      ...updated,
      avatar: sanitizeAvatar(updated.avatar),
    }
    setProfile(cleaned)
    try {
      localStorage.setItem('bentley_user_profile', JSON.stringify(cleaned))
    } catch {
      // ignore
    }
    if (onUpdateProfile) {
      onUpdateProfile(cleaned)
    }
  }

  const menuItems: MenuItem[] = [
    {
      icon: 'directions_car',
      title: 'Saved Vehicles',
      subtitle: savedVehiclesCount && savedVehiclesCount > 0 ? 'Manage registered vehicles' : 'Add your vehicle',
      action: onOpenSavedVehicles,
      badge: savedVehiclesCount !== undefined && savedVehiclesCount > 0 ? `${savedVehiclesCount} Cars` : undefined,
    },
    {
      icon: 'notifications',
      title: 'Notifications',
      subtitle: 'View service alerts & updates',
      action: onNavigateToNotifications,
    },
    {
      icon: 'headset_mic',
      title: 'Contact Us',
      subtitle: 'Call, email or visit us in Kelowna',
      action: onOpenContactUs || (() => setIsContactUsOpen(true)),
    },
    {
      icon: 'info',
      title: 'About Us',
      subtitle: 'Our story, mission & why choose us',
      action: onOpenAboutUs || (() => setIsAboutUsOpen(true)),
    },
    // {
    //   icon: 'shield',
    //   title: 'Security',
    //   subtitle: 'Further secure your account for safety',
    //   action: () => showToast('Security settings coming soon!', 'info'),
    // },
    // {
    //   icon: 'privacy_tip',
    //   title: 'Privacy & Policy',
    //   subtitle: 'Know our privacy and policies',
    //   action: () => showToast('Bentley Privacy Policy: Your data is 100% secure.', 'info'),
    // },
    // {
    //   icon: 'help',
    //   title: 'Help & Support',
    //   subtitle: 'Concierge assistance & inquiries',
    //   action: onOpenContactUs || (() => setIsContactUsOpen(true)),
    // },
  ]

  return (
    <div className="flex flex-col w-full pb-28 screen-padding px-4 sm:px-6 md:px-8">
      {/* User Information Card (Clickable to Edit) */}
      <div
        onClick={() => setIsEditProfileOpen(true)}
        className="mt-4 p-4 rounded-3xl border border-gray-200/90 bg-white shadow-sm flex flex-col gap-3.5 hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full border-2 border-primary/20 overflow-hidden shadow-sm group-hover:border-primary transition-colors flex items-center justify-center bg-gray-100">
                {!profile.avatar ? (
                  <User className="w-7 h-7 text-gray-400" />
                ) : (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center border border-white shadow-xs">
                <span className="material-symbols-outlined text-[12px]">edit</span>
              </div>
            </div>

            <div className="flex flex-col min-w-0 justify-center">
              <h2 className="text-base font-bold text-gray-900 truncate group-hover:text-primary transition-colors">
                {profile.name}
              </h2>
              {/* Email display */}
              <span className="text-xs text-gray-500 truncate font-normal">
                {profile.email || ''}
              </span>
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
            <span className="material-symbols-outlined text-[18px]">
              edit
            </span>
          </button>
        </div>

        {/* Dynamic Quick Details Badges */}
        <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-gray-600 min-w-0">
            <span className="material-symbols-outlined text-primary text-[16px] shrink-0">
              directions_car
            </span>
            <span
              className={`font-semibold truncate max-w-[140px] ${profile.preferredVehicle ? 'text-gray-900' : 'text-gray-400 font-normal'
                }`}
            >
              {profile.preferredVehicle || 'Add your vehicle'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-gray-600 min-w-0">
            <span className="material-symbols-outlined text-primary text-[16px] shrink-0">
              location_on
            </span>
            <span className="font-semibold text-gray-900 truncate max-w-[130px]">
              {profile.city || profile.address ? (profile.city || profile.address.split(',')[0]) : 'Location not set'}
            </span>
          </div>
        </div>
      </div>

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
                    <span className="px-1.5 py-0.2 rounded-sm bg-primary-light text-primary text-[10px] font-extrabold uppercase tracking-wide">
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

      {/* Bottom Auth Action Button */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowLogoutModal(true)}
          className="w-full sm:w-auto px-6 bg-surface-alt hover:bg-gray-200 text-gray-700 text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          <span>Logout</span>
        </Button>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteModal(true)}
          className="w-full sm:w-auto px-5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Account</span>
        </Button>
      </div>

      {/* Confirmation Modal for User Logout */}
      <Dialog
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        iconVariant="primary"
        title="Logout"
        description="Are you sure you want to log out of your account?"
      >
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowLogoutModal(false)}
            className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => {
              setShowLogoutModal(false)
              if (onLogout) {
                onLogout()
              } else {
                showToast('Logged out successfully.', 'info')
              }
            }}
            className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Yes, Logout</span>
          </Button>
        </div>
      </Dialog>

      {/* Confirmation Modal for Delete Account */}
      <Dialog
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        icon={<AlertTriangle className="w-6 h-6 stroke-[2.2]" />}
        iconVariant="danger"
        title="Delete Account?"
        description="This will permanently remove your profile, garage vehicles, and cloud bookings from Firebase. This action cannot be undone."
      >
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDeleting}
            onClick={() => setShowDeleteModal(false)}
            className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={async () => {
              setIsDeleting(true)
              try {
                if (onDeleteAccount) {
                  await onDeleteAccount()
                } else {
                  showToast('Account deleted successfully.', 'info')
                }
              } catch (err: any) {
                showToast(err?.message || 'Failed to delete account.', 'error')
              } finally {
                setIsDeleting(false)
                setShowDeleteModal(false)
              }
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete</span>
              </>
            )}
          </Button>
        </div>
      </Dialog>

      {/* Dedicated Edit Profile Full Page Modal */}
      <EditProfilePage
        isOpen={isEditProfileOpen}
        userProfile={profile}
        onClose={() => setIsEditProfileOpen(false)}
        onSave={handleSaveProfile}
        savedVehicles={savedVehiclesList && savedVehiclesList.length > 0 ? savedVehiclesList : (profile.preferredVehicle ? [profile.preferredVehicle] : [])}
      />

      {/* Dedicated Contact Us Full Page Modal */}
      <ContactUsPage
        isOpen={isContactUsOpen}
        onClose={() => setIsContactUsOpen(false)}
        userProfile={profile}
      />

      {/* Dedicated About Us Full Page Modal */}
      <AboutUsPage
        isOpen={isAboutUsOpen}
        onClose={() => setIsAboutUsOpen(false)}
        onBookNow={onOpenBooking}
        onContactUs={onOpenContactUs || (() => setIsContactUsOpen(true))}
      />
    </div>
  )
}
export default ProfileTab
