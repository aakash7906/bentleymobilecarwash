import React, { useState, useRef } from 'react'
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
  Upload,
  Trash2,
  Lock,
} from 'lucide-react'
import { UserProfile } from '@/types'
import { Select } from '@/components/ui/select'

interface EditProfilePageProps {
  isOpen: boolean
  userProfile: UserProfile
  onClose: () => void
  onSave: (updated: UserProfile) => void
  savedVehicles?: string[]
}

export const EditProfilePage: React.FC<EditProfilePageProps> = ({
  isOpen,
  userProfile,
  onClose,
  onSave,
  savedVehicles = [],
}) => {
  const [name, setName] = useState(userProfile.name || '')
  const [email, setEmail] = useState(userProfile.email || '')
  const [phone, setPhone] = useState(userProfile.phone || '')
  const [address, setAddress] = useState(userProfile.address || '')
  const [city, setCity] = useState(userProfile.city || '')
  const [postalCode, setPostalCode] = useState(userProfile.postalCode || '')
  const [avatar, setAvatar] = useState(userProfile.avatar || '')
  const [preferredVehicle, setPreferredVehicle] = useState(
    userProfile.preferredVehicle || (savedVehicles[0] || '')
  )

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  if (!isOpen) return null

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, JPEG, WEBP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result)
      }
    }
    reader.onerror = () => {
      setUploadError('Failed to read image file. Please try another image.')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = () => {
    setAvatar('')
    setUploadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    setTimeout(() => {
      const updated: UserProfile = {
        ...userProfile,
        name: name.trim() || userProfile.name,
        email: userProfile.email,
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
    new Set([...savedVehicles, preferredVehicle].filter(Boolean))
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
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 bg-secondary/95 backdrop-blur-md text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-white/10 animate-in fade-in slide-from-top duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        {/* 3. MAIN FORM BODY */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 flex flex-col gap-5">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3 py-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />

            <div className="relative group">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100 ring-2 ring-primary/20 flex items-center justify-center cursor-pointer group hover:ring-primary transition-all"
                title="Click to upload profile photo"
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name || 'User Profile'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <User className="w-12 h-12 sm:w-14 sm:h-14 text-gray-400 group-hover:text-primary transition-colors" />
                )}
              </div>

              {/* Edit / Camera Icon Overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground border-2 border-white flex items-center justify-center shadow-md hover:bg-primary-hover active:scale-95 transition-all cursor-pointer"
                title="Upload Photo"
              >
                <Camera className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover hover:underline transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{avatar ? 'Change Photo' : 'Upload Photo'}</span>
                </button>
                {avatar && (
                  <>
                    <span className="text-gray-300">•</span>
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </>
                )}
              </div>
              <span className="text-[11px] text-gray-400 font-normal">
                Supports JPG, PNG or WEBP (Max 5MB)
              </span>
              {uploadError && (
                <span className="text-xs text-rose-500 font-medium mt-0.5">
                  {uploadError}
                </span>
              )}
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

            {/* Email Address (Non-editable / Read-only) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Email Address
                </label>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                  <Lock className="w-3 h-3 text-gray-600" />
                  Not Editable
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  readOnly
                  disabled
                  value={email}
                  placeholder="your.email@example.com"
                  className="w-full bg-gray-100/90 border border-gray-200 rounded-xl py-2.5 pl-10 pr-9 text-xs sm:text-sm font-semibold text-gray-500 cursor-not-allowed select-all focus:outline-none"
                  title="Email cannot be changed once registered"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 pl-0.5">
                Your email is associated with your account credentials and cannot be edited.
              </p>
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

            {/* Primary Registered Vehicle (Modern Responsive shadcn/ui Select) */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">
                Primary Registered Vehicle
              </label>
              <Select
                value={preferredVehicle}
                onValueChange={(val) => setPreferredVehicle(val)}
                placeholder={
                  allVehicles.length === 0
                    ? 'No registered vehicles (Add one in Saved Vehicles)'
                    : 'Select primary vehicle'
                }
                icon={<Car className="w-4 h-4 text-gray-400" />}
                options={allVehicles.map((veh) => ({
                  label: veh,
                  value: veh,
                }))}
              />
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
