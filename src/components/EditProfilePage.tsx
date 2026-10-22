import React, { useState } from 'react'
import {
  ChevronLeft,
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  Car,
  Building,
  Check,
  CheckCircle2,
  X,
  Shield,
  Award,
} from 'lucide-react'
import { UserProfile } from '@/types'
import { USER_SAVED_VEHICLES } from '@/data/mockData'

interface EditProfilePageProps {
  isOpen: boolean
  userProfile: UserProfile
  onClose: () => void
  onSave: (updated: UserProfile) => void
  savedVehicles?: string[]
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
]

export const EditProfilePage: React.FC<EditProfilePageProps> = ({
  isOpen,
  userProfile,
  onClose,
  onSave,
  savedVehicles = USER_SAVED_VEHICLES,
}) => {
  const [name, setName] = useState(userProfile.name)
  const [email, setEmail] = useState(userProfile.email)
  const [phone, setPhone] = useState(userProfile.phone || '+1 (998) 877-5561')
  const [address, setAddress] = useState(
    userProfile.address || '21/22, 5th Avenue, Jamesford Road, Ontario, Canada'
  )
  const [city, setCity] = useState(userProfile.city || 'Ontario')
  const [postalCode, setPostalCode] = useState(userProfile.postalCode || 'L4B 1X9')
  const [avatar, setAvatar] = useState(userProfile.avatar)
  const [preferredVehicle, setPreferredVehicle] = useState(
    userProfile.preferredVehicle || 'Audi R8 GT'
  )

  const [showCustomAvatarInput, setShowCustomAvatarInput] = useState(false)
  const [customAvatarUrl, setCustomAvatarUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  if (!isOpen) return null

  const handleApplyCustomAvatar = (e: React.FormEvent) => {
    e.preventDefault()
    if (customAvatarUrl.trim()) {
      setAvatar(customAvatarUrl.trim())
      setShowCustomAvatarInput(false)
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    setTimeout(() => {
      const updated: UserProfile = {
        ...userProfile,
        name: name.trim() || userProfile.name,
        email: email.trim() || userProfile.email,
        phone: phone.trim() || userProfile.phone,
        address: address.trim() || userProfile.address,
        city: city.trim() || userProfile.city,
        postalCode: postalCode.trim() || userProfile.postalCode,
        avatar,
        preferredVehicle,
      }

      onSave(updated)
      setIsSaving(false)
      setSavedSuccess(true)

      setTimeout(() => {
        setSavedSuccess(false)
        onClose()
      }, 1200)
    }, 600)
  }

  const allVehicles = Array.from(
    new Set(['Audi R8 GT', ...savedVehicles, preferredVehicle])
  )

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto animate-in slide-in-from-bottom duration-200">
      <div className="w-full max-w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto min-h-screen flex flex-col bg-white pb-32">
        {/* 1. TOP HEADER */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-4 sm:px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-surface-alt active:scale-95 transition-all cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <h1 className="text-base font-extrabold text-gray-900 tracking-tight">
            Edit Profile
          </h1>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs font-bold text-primary hover:text-primary-hover active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </header>

        {/* 2. SUCCESS TOAST ALERT */}
        {savedSuccess && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 bg-secondary/95 backdrop-blur-md text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-white/10 animate-in fade-in slide-in-from-top duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        {/* 3. MAIN FORM BODY */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 flex flex-col gap-5">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-100 ring-2 ring-primary/20">
                <img
                  src={avatar}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Edit Icon Overlay */}
              <button
                type="button"
                onClick={() => setShowCustomAvatarInput(!showCustomAvatarInput)}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground border-2 border-white flex items-center justify-center shadow-md hover:bg-primary-hover active:scale-95 transition-all cursor-pointer"
                title="Change Photo"
              >
                <Camera className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>

            <div className="text-center">
              <span className="text-xs font-bold text-gray-800 block">
                Profile Photo
              </span>
            </div>
          </div>

          {/* Form Fields Card */}
          <div className="bg-white rounded-3xl border border-gray-200 p-4 sm:p-5 shadow-xs flex flex-col gap-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Personal Information
            </h2>

            {/* Full Name */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-surface-alt border border-gray-200 rounded-xl py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-semibold text-gray-900 focus:outline-none focus:border-primary focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full bg-surface-alt border border-gray-200 rounded-xl py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-semibold text-gray-900 focus:outline-none focus:border-primary focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-surface-alt border border-gray-200 rounded-xl py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-semibold text-gray-900 focus:outline-none focus:border-primary focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Primary Vehicle */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">
                Primary Registered Vehicle
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Car className="w-4 h-4" />
                </div>
                <select
                  value={preferredVehicle}
                  onChange={(e) => setPreferredVehicle(e.target.value)}
                  className="w-full bg-surface-alt border border-gray-200 rounded-xl py-2.5 pl-10 pr-8 text-xs sm:text-sm font-semibold text-gray-900 focus:outline-none focus:border-primary focus:bg-white transition-colors appearance-none cursor-pointer"
                >
                  {allVehicles.map((veh, idx) => (
                    <option key={idx} value={veh}>
                      {veh}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                  <span className="material-symbols-outlined text-[18px]">expand_more</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location & Address Card */}
          <div className="bg-white rounded-3xl border border-gray-200 p-4 sm:p-5 shadow-xs flex flex-col gap-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Service Delivery Address
            </h2>

            {/* Street Address */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">
                Street Address
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3.5 pointer-events-none text-gray-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street and unit number"
                  className="w-full bg-surface-alt border border-gray-200 rounded-xl py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-semibold text-gray-900 focus:outline-none focus:border-primary focus:bg-white transition-colors resize-none"
                />
              </div>
            </div>

            {/* City & Postal Code (2 Columns) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  City / Region
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ontario"
                    className="w-full bg-surface-alt border border-gray-200 rounded-xl py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-semibold text-gray-900 focus:outline-none focus:border-primary focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="L4B 1X9"
                  className="w-full bg-surface-alt border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-gray-900 focus:outline-none focus:border-primary focus:bg-white transition-colors uppercase"
                />
              </div>
            </div>
          </div>

          {/* Membership Info Pill (Read-only status) */}
          <div className="bg-surface-alt rounded-2xl p-3 border border-gray-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-primary shadow-xs">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 block">
                  {userProfile.membershipTier || 'VIP Member'}
                </span>
                <span className="text-[11px] text-gray-500">
                  Active Bentley Mobile Detailing Plan
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Active
            </span>
          </div>
        </form>

        {/* 4. STICKY BOTTOM ACTIONS */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-4 sm:px-5 py-3 shadow-lg">
          <div className="w-full max-w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-full bg-surface-alt hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-bold active:scale-95 transition-all cursor-pointer border border-gray-200"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 px-4 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground text-xs sm:text-sm font-extrabold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-primary-foreground" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default EditProfilePage
