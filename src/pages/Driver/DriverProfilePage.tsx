import React, { useState, useRef, useEffect } from 'react'
import {
  ChevronLeft,
  Camera,
  User,
  Mail,
  Phone,
  Truck,
  MapPin,
  ShieldCheck,
  Save,
  CheckCircle2,
  LogOut,
  Upload,
  Trash2,
  AlertTriangle,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { DriverProfile } from '@/types'
import { useToast } from '@/context/ToastContext'
import { Dialog } from '@/components/ui/dialog'

interface DriverProfilePageProps {
  isOpen: boolean
  onClose: () => void
  profile: DriverProfile
  onSave: (updated: DriverProfile) => void
  onLogout?: () => void
  onDeleteAccount?: () => Promise<boolean | void>
  completedJobsCount?: number
}

// Mobile phone number validation helper
const validatePhone = (value: string): string | null => {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'Mobile phone number is required'
  }
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 10) {
    return 'Phone number must have at least 10 digits'
  }
  if (digits.length > 15) {
    return 'Phone number cannot exceed 15 digits'
  }
  const phonePattern = /^(\+?\d{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?[\d\s.-]{6,14}$/
  if (!phonePattern.test(trimmed)) {
    return 'Please enter a valid phone number (e.g. +1 (800) 555-9274)'
  }
  return null
}

// Emergency contact optional validation helper
const validateEmergency = (value: string): string | null => {
  const trimmed = value.trim()
  if (!trimmed) return null
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 10) {
    return 'Emergency phone must have at least 10 digits'
  }
  if (digits.length > 15) {
    return 'Emergency phone cannot exceed 15 digits'
  }
  return null
}

export const DriverProfilePage: React.FC<DriverProfilePageProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
  onLogout,
  onDeleteAccount,
  completedJobsCount,
}) => {
  const { showToast } = useToast()

  // Form State
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [phone, setPhone] = useState(profile.phone)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [phoneTouched, setPhoneTouched] = useState(false)

  const [vanModel, setVanModel] = useState(profile.vanModel)
  const [licensePlate, setLicensePlate] = useState(profile.licensePlate)
  const [serviceArea, setServiceArea] = useState(profile.serviceArea)
  const [driverLicenseNumber, setDriverLicenseNumber] = useState(profile.driverLicenseNumber || '')

  const [emergencyContact, setEmergencyContact] = useState(profile.emergencyContact || '')
  const [emergencyError, setEmergencyError] = useState<string | null>(null)

  const [avatar, setAvatar] = useState(
    profile.avatar && !profile.avatar.includes('unsplash.com') ? profile.avatar : ''
  )

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // State for Logout confirmation modal
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // State for Delete Driver Profile confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Dynamic completed jobs count (from actual completed bookings or profile totalJobs)
  const effectiveCompletedJobs =
    completedJobsCount !== undefined ? completedJobsCount : profile.totalJobs || 0

  // Sync state when profile or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setName(profile.name)
      setEmail(profile.email)
      setPhone(profile.phone)
      setPhoneError(null)
      setPhoneTouched(false)
      setVanModel(profile.vanModel)
      setLicensePlate(profile.licensePlate)
      setServiceArea(profile.serviceArea)
      setDriverLicenseNumber(profile.driverLicenseNumber || '')
      setEmergencyContact(profile.emergencyContact || '')
      setEmergencyError(null)
      setAvatar(profile.avatar && !profile.avatar.includes('unsplash.com') ? profile.avatar : '')
      setUploadError(null)
      setShowDeleteModal(false)
    }
  }, [isOpen, profile])

  if (!isOpen) return null

  // Handle phone changes with real-time validation
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setPhone(val)
    if (phoneTouched) {
      setPhoneError(validatePhone(val))
    }
  }

  const handlePhoneBlur = () => {
    setPhoneTouched(true)
    setPhoneError(validatePhone(phone))
  }

  // Handle emergency phone changes
  const handleEmergencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setEmergencyContact(val)
    setEmergencyError(validateEmergency(val))
  }

  // Handle profile image upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)

    if (!file.type.startsWith('image/')) {
      const err = 'Please select a valid image file (PNG, JPG, JPEG, WEBP)'
      setUploadError(err)
      showToast(err, 'error')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      const err = 'Image size should be less than 5MB'
      setUploadError(err)
      showToast(err, 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result)
        showToast('Photo uploaded! Remember to save profile.', 'success')
      }
    }
    reader.onerror = () => {
      const err = 'Failed to read image file. Please try another image.'
      setUploadError(err)
      showToast(err, 'error')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = () => {
    setAvatar('')
    setUploadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    showToast('Photo removed', 'info')
  }

  // Form submission with complete validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate phone number
    setPhoneTouched(true)
    const pError = validatePhone(phone)
    if (pError) {
      setPhoneError(pError)
      showToast(pError, 'error')
      return
    }

    // Validate emergency phone if entered
    const emError = validateEmergency(emergencyContact)
    if (emError) {
      setEmergencyError(emError)
      showToast(emError, 'error')
      return
    }

    setIsSaving(true)

    const updated: DriverProfile = {
      ...profile,
      name: name.trim() || profile.name,
      email: profile.email,
      phone: phone.trim(),
      vanModel: vanModel.trim() || profile.vanModel,
      licensePlate: licensePlate.trim().toUpperCase() || profile.licensePlate,
      serviceArea: serviceArea.trim() || profile.serviceArea,
      driverLicenseNumber: driverLicenseNumber.trim(),
      emergencyContact: emergencyContact.trim(),
      avatar,
      isAvailable: profile.isAvailable,
      totalJobs: effectiveCompletedJobs,
    }

    setTimeout(() => {
      onSave(updated)
      setIsSaving(false)
      setSavedSuccess(true)
      showToast('Driver profile updated successfully!', 'success')

      setTimeout(() => {
        setSavedSuccess(false)
        onClose()
      }, 700)
    }, 400)
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#f7f9fb] overflow-y-auto animate-in slide-in-from-bottom duration-200">
      <div className="w-full max-w-full md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto min-h-screen flex flex-col bg-[#f7f9fb] pb-24">
        {/* TOP RESPONSIVE APP BAR */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 md:px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              title="Return to Dashboard"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-tight">
                {name || 'Driver Profile'}
              </h1>
              <p className="text-[11px] text-gray-500 font-medium">
                Bentley Partner ID & Mobile Detailing Unit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Logout Button */}
            {onLogout && (
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center gap-1.5 border border-rose-200/60 transition-all cursor-pointer font-bold text-xs shadow-2xs active:scale-95"
                title="Log out from Driver account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            )}
          </div>
        </header>

        {/* MAIN FORM CONTAINER */}
        <main className="flex-1 w-full px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* 1. HERO PROFILE OVERVIEW CARD */}
            <div className="w-full bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-200/80 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-radial from-primary/10 via-transparent to-transparent pointer-events-none" />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileChange}
              />

              {/* Avatar + Change Photo */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="relative group">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100 ring-4 ring-primary/20 flex items-center justify-center cursor-pointer group hover:ring-primary transition-all"
                    title="Click to upload profile photo"
                  >
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <User className="w-12 h-12 sm:w-14 sm:h-14 text-gray-400 group-hover:text-primary transition-colors" />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-secondary hover:bg-neutral-900 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer ring-2 ring-white"
                    title="Upload / Change Photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                {/* Photo Actions: Upload & Remove */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-hover hover:underline transition-colors cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{avatar ? 'Change' : 'Upload'}</span>
                  </button>
                  {avatar && (
                    <>
                      <span className="text-gray-300">•</span>
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </>
                  )}
                </div>
                {uploadError && (
                  <span className="text-[10px] text-rose-500 font-medium">
                    {uploadError}
                  </span>
                )}
              </div>

              {/* Dynamic Driver Details & Badges */}
              <div className="flex-1 text-center md:text-left flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    {name || 'Service Specialist'}
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-gray-600 font-medium">
                  {vanModel} {licensePlate ? `• Plate: ${licensePlate}` : ''}
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs text-gray-500 mt-1">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{serviceArea || 'Ontario, Canada'}</span>
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span>{email}</span>
                  </span>
                </div>

                {/* Dynamic Metrics Row */}
                <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3">
                  <div className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-bold text-gray-900">
                      {effectiveCompletedJobs}
                    </span>
                    <span className="text-[11px] text-gray-500">Jobs Completed</span>
                  </div>

                  {driverLicenseNumber && (
                    <div className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px] font-mono font-semibold text-gray-700">
                        {driverLicenseNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. FORM GRID SECTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SECTION A: PERSONAL & CONTACT INFORMATION */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-200/80 flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Personal & Contact Info</h3>
                    <p className="text-[11px] text-gray-400">
                      Used for client notifications and mobile dispatches
                    </p>
                  </div>
                </div>

                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Smith"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden transition-all"
                    />
                  </div>
                </div>

                {/* Email Address (Non-editable) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">Account Email</label>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      readOnly
                      disabled
                      value={email}
                      placeholder="driver@bentleycarwash.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100/80 border border-gray-200 text-xs sm:text-sm font-semibold text-gray-500 cursor-not-allowed select-none outline-hidden"
                      title="Driver account email cannot be changed"
                    />
                  </div>
                </div>

                {/* Direct Mobile Phone Number WITH VALIDATION */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">
                      Mobile Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-gray-400">Min 10 digits</span>
                  </div>

                  <div className="relative">
                    <Phone
                      className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${phoneError ? 'text-rose-500' : 'text-gray-400'
                        }`}
                    />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={handlePhoneChange}
                      onBlur={handlePhoneBlur}
                      placeholder="+1 (800) 555-9274"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-xs sm:text-sm text-gray-900 outline-hidden transition-all ${phoneError
                        ? 'border border-rose-300 ring-2 ring-rose-100 bg-rose-50/20 focus:border-rose-500'
                        : 'border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20'
                        }`}
                    />
                  </div>

                  {phoneError ? (
                    <div className="flex items-center gap-1.5 text-rose-500 text-[11px] font-semibold mt-0.5">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{phoneError}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400">
                      Customers will contact you through this verified direct number.
                    </span>
                  )}
                </div>

                {/* Emergency Contact */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Emergency Contact Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone
                      className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${emergencyError ? 'text-rose-500' : 'text-gray-400'
                        }`}
                    />
                    <input
                      type="tel"
                      value={emergencyContact}
                      onChange={handleEmergencyChange}
                      placeholder="+1 (998) 555-0199"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-xs sm:text-sm text-gray-900 outline-hidden transition-all ${emergencyError
                        ? 'border border-rose-300 ring-2 ring-rose-100 bg-rose-50/20'
                        : 'border border-gray-200 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20'
                        }`}
                    />
                  </div>
                  {emergencyError && (
                    <div className="flex items-center gap-1 text-rose-500 text-[11px] font-semibold">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{emergencyError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION B: SERVICE VAN & VEHICLE SPECIFICATIONS */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-200/80 flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Mobile Service Van</h3>
                    <p className="text-[11px] text-gray-400">
                      Vehicle details shown to customers on active bookings
                    </p>
                  </div>
                </div>

                {/* Service Van Model */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Service Van / Vehicle Model
                  </label>
                  <div className="relative">
                    <Truck className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={vanModel}
                      onChange={(e) => setVanModel(e.target.value)}
                      placeholder="e.g. Mercedes-Benz Sprinter 2500"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden transition-all"
                    />
                  </div>
                </div>

                {/* License Plate */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Van License Plate</label>
                  <div className="relative">
                    <span className="material-symbols-outlined text-[18px] text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2">
                      badge
                    </span>
                    <input
                      type="text"
                      required
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                      placeholder="e.g. BC-8492"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm uppercase font-mono tracking-wider text-gray-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden transition-all"
                    />
                  </div>
                </div>

                {/* Service Area / Territory */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Operating City / Coverage Area
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={serviceArea}
                      onChange={(e) => setServiceArea(e.target.value)}
                      placeholder="e.g. Ontario, Canada"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden transition-all"
                    />
                  </div>
                </div>

                {/* Driver License / Cert ID */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Commercial / Driver License ID
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={driverLicenseNumber}
                      onChange={(e) => setDriverLicenseNumber(e.target.value)}
                      placeholder="e.g. DL-ON-992014-B"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-mono text-gray-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION C: DANGER ZONE - DELETE DRIVER PROFILE (JUST LIKE USER PROFILE) */}
            <div className="bg-red-50/50 rounded-3xl p-5 sm:p-6 border border-red-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-900">Delete Driver Profile</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-red-300 bg-white hover:bg-red-600 hover:text-white text-red-600 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Profile</span>
              </button>
            </div>

            {/* 3. ACTIONS FOOTER BAR */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 active:scale-98 text-xs sm:text-sm font-bold text-gray-700 transition-all cursor-pointer text-center shadow-2xs"
              >
                Cancel & Close
              </button>

              <button
                type="submit"
                disabled={isSaving || savedSuccess}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-primary hover:bg-primary-hover active:scale-98 text-xs sm:text-sm font-bold text-primary-foreground flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-75"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white animate-in zoom-in-50" />
                    <span>Saved Successfully!</span>
                  </>
                ) : isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Driver Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>

      {/* CONFIRMATION MODAL FOR DRIVER LOGOUT */}
      <Dialog
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        zIndex="z-60"
        icon={<LogOut className="w-6 h-6 stroke-[2.2]" />}
        iconVariant="primary"
        title="Log Out of Driver Portal?"
        description="Are you sure you want to log out? You will stop receiving job notifications and customer bookings until you sign back in."
      >
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setShowLogoutModal(false)}
            className="w-full py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              setShowLogoutModal(false)
              onLogout?.()
            }}
            className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Yes, Logout</span>
          </button>
        </div>
      </Dialog>

      {/* CONFIRMATION MODAL FOR DELETE DRIVER PROFILE */}
      <Dialog
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        zIndex="z-60"
        icon={<AlertTriangle className="w-6 h-6 stroke-[2.2]" />}
        iconVariant="danger"
        title="Delete Driver Profile?"
        description="This will permanently delete your driver profile, vehicle registration, and cloud driver account from Firebase. This action cannot be undone."
      >
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => setShowDeleteModal(false)}
            className="w-full py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={async () => {
              setIsDeleting(true)
              try {
                if (onDeleteAccount) {
                  await onDeleteAccount()
                } else {
                  try {
                    localStorage.removeItem('bentley_driver_profile')
                  } catch { }
                  showToast('Driver profile deleted successfully.', 'info')
                  onLogout?.()
                }
              } catch (err: any) {
                showToast(err?.message || 'Failed to delete driver profile.', 'error')
              } finally {
                setIsDeleting(false)
                setShowDeleteModal(false)
              }
            }}
            className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
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
          </button>
        </div>
      </Dialog>
    </div>
  )
}

export default DriverProfilePage
