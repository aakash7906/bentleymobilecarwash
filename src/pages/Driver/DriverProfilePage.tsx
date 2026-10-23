import React, { useState } from 'react'
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
  Check,
  CheckCircle2,
  LogOut,
  X,
} from 'lucide-react'
import { DriverProfile } from '@/types'
import { useToast } from '@/context/ToastContext'

interface DriverProfilePageProps {
  isOpen: boolean
  onClose: () => void
  profile: DriverProfile
  onSave: (updated: DriverProfile) => void
  onLogout?: () => void
}

const DRIVER_AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
]

export const DriverProfilePage: React.FC<DriverProfilePageProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
  onLogout,
}) => {
  const { showToast } = useToast()

  // Form State
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [phone, setPhone] = useState(profile.phone)
  const [vanModel, setVanModel] = useState(profile.vanModel)
  const [licensePlate, setLicensePlate] = useState(profile.licensePlate)
  const [serviceArea, setServiceArea] = useState(profile.serviceArea)
  const [driverLicenseNumber, setDriverLicenseNumber] = useState(profile.driverLicenseNumber || '')
  const [emergencyContact, setEmergencyContact] = useState(profile.emergencyContact || '')
  const [avatar, setAvatar] = useState(profile.avatar)

  // Avatar Picker State
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [customAvatarUrl, setCustomAvatarUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  if (!isOpen) return null

  const handleApplyCustomAvatar = (e: React.FormEvent) => {
    e.preventDefault()
    if (customAvatarUrl.trim()) {
      setAvatar(customAvatarUrl.trim())
      setShowAvatarPicker(false)
      setCustomAvatarUrl('')
      showToast('Custom photo URL applied', 'info')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const updated: DriverProfile = {
      ...profile,
      name: name.trim() || profile.name,
      email: email.trim() || profile.email,
      phone: phone.trim() || profile.phone,
      vanModel: vanModel.trim() || profile.vanModel,
      licensePlate: licensePlate.trim().toUpperCase() || profile.licensePlate,
      serviceArea: serviceArea.trim() || profile.serviceArea,
      driverLicenseNumber: driverLicenseNumber.trim(),
      emergencyContact: emergencyContact.trim(),
      avatar,
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200 flex justify-center">
      <div className="w-full min-h-screen bg-canvas flex flex-col">
        {/* TOP RESPONSIVE APP BAR */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 md:px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 flex items-center justify-center transition-all cursor-pointer"
              title="Return to Dashboard"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
                {name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Logout Shortcut */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="w-9 h-9 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200/60 transition-all cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* MAIN FORM CONTAINER */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* 1. HERO PROFILE OVERVIEW CARD */}
            <div className="w-full bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-primary/10 via-transparent to-transparent pointer-events-none" />

              {/* Avatar + Change Photo */}
              <div className="relative group shrink-0">
                <img
                  src={avatar}
                  alt={name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-primary/20 shadow-md"
                />
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(true)}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-secondary hover:bg-neutral-900 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer ring-2 ring-white"
                  title="Change Driver Photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Driver Details */}
              <div className="flex-1 text-center md:text-left flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    {name}
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-gray-500">
                  {vanModel}
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 text-xs text-gray-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>{serviceArea}</span>
                  <span className="text-gray-300">•</span>
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span>{email}</span>
                </div>
              </div>
            </div>

            {/* 2. FORM GRID SECTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SECTION A: PERSONAL & CONTACT INFORMATION */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Personal & Contact Info</h3>
                    <p className="text-[11px] text-gray-400">Used for customer communication and dispatches</p>
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
                      placeholder="e.g. Alex Rivera"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-subtle border border-gray-200 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden transition-all"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Account Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="driver@bentleycarwash.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-subtle border border-gray-200 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden transition-all"
                    />
                  </div>
                </div>

                {/* Direct Phone Number */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Mobile Phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (800) 555-9274"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-subtle border border-gray-200 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden transition-all"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">
                    Customers can reach you at this number during service.
                  </span>
                </div>

                {/* Emergency Contact */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Emergency Contact Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="+1 (998) 555-0199"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-subtle border border-gray-200 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: SERVICE VAN & VEHICLE SPECIFICATIONS */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Mobile Service Van</h3>
                    <p className="text-[11px] text-gray-400">Vehicle details used on active jobs</p>
                  </div>
                </div>

                {/* Service Van Model */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Service Van / Vehicle Model</label>
                  <div className="relative">
                    <Truck className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={vanModel}
                      onChange={(e) => setVanModel(e.target.value)}
                      placeholder="e.g. Mercedes-Benz Sprinter 2500"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-subtle border border-gray-200 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden transition-all"
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
                      onChange={(e) => setLicensePlate(e.target.value)}
                      placeholder="e.g. BNT-8821"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-subtle border border-gray-200 text-xs sm:text-sm uppercase font-mono tracking-wider text-gray-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden transition-all"
                    />
                  </div>
                </div>

                {/* Service Area / Territory */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Operating City / Coverage Area</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={serviceArea}
                      onChange={(e) => setServiceArea(e.target.value)}
                      placeholder="e.g. Ontario, Canada"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-subtle border border-gray-200 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden transition-all"
                    />
                  </div>
                </div>

                {/* Driver License / Cert ID */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Commercial / Driver License ID</label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={driverLicenseNumber}
                      onChange={(e) => setDriverLicenseNumber(e.target.value)}
                      placeholder="e.g. DL-ON-883921"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-subtle border border-gray-200 text-xs sm:text-sm font-mono text-gray-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. ACTIONS FOOTER BAR */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 active:scale-98 text-xs sm:text-sm font-bold text-gray-700 transition-all cursor-pointer text-center"
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

        {/* 4. AVATAR PICKER MODAL */}
        {showAvatarPicker && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">Choose Profile Photo</h3>
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-700 mb-2.5 block">Preset Avatars</span>
                <div className="grid grid-cols-3 gap-3">
                  {DRIVER_AVATAR_PRESETS.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setAvatar(preset)
                        setShowAvatarPicker(false)
                        showToast('Avatar updated', 'info')
                      }}
                      className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                        avatar === preset
                          ? 'border-primary ring-2 ring-primary/30 scale-102'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img src={preset} alt="" className="w-full h-full object-cover" />
                      {avatar === preset && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-700 mb-2 block">Or Enter Photo URL</span>
                <form onSubmit={handleApplyCustomAvatar} className="flex gap-2">
                  <input
                    type="url"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="flex-1 px-3 py-2 rounded-xl bg-surface-subtle border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-primary outline-hidden"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-secondary text-white text-xs font-bold hover:bg-neutral-900 transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
