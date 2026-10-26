import React, { useState, useRef } from 'react'
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
  Lock,
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
  const [avatar, setAvatar] = useState(profile.avatar || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [isAvailable, setIsAvailable] = useState<boolean>(profile.isAvailable !== false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Sync state when profile or isOpen changes
  React.useEffect(() => {
    if (isOpen) {
      setName(profile.name)
      setEmail(profile.email)
      setPhone(profile.phone)
      setVanModel(profile.vanModel)
      setLicensePlate(profile.licensePlate)
      setServiceArea(profile.serviceArea)
      setDriverLicenseNumber(profile.driverLicenseNumber || '')
      setEmergencyContact(profile.emergencyContact || '')
      setAvatar(profile.avatar || '')
      setBio(profile.bio || '')
      setIsAvailable(profile.isAvailable !== false)
      setUploadError(null)
    }
  }, [isOpen, profile])

  if (!isOpen) return null

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const updated: DriverProfile = {
      ...profile,
      name: name.trim() || profile.name,
      email: profile.email,
      phone: phone.trim() || profile.phone,
      vanModel: vanModel.trim() || profile.vanModel,
      licensePlate: licensePlate.trim().toUpperCase() || profile.licensePlate,
      serviceArea: serviceArea.trim() || profile.serviceArea,
      driverLicenseNumber: driverLicenseNumber.trim(),
      emergencyContact: emergencyContact.trim(),
      bio: bio.trim(),
      isAvailable,
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
            {/* Logout Button */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center gap-1.5 border border-rose-200/60 transition-all cursor-pointer font-bold text-xs shadow-2xs active:scale-95"
                title="Log out from Driver account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
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

              {/* Driver Details */}
              <div className="flex-1 text-center md:text-left flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    {name}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                    isAvailable
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                    <span>{isAvailable ? 'Active & Ready' : 'Off-Duty'}</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-gray-500">
                  {vanModel} {licensePlate ? `• ${licensePlate}` : ''}
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    ★ {profile.rating || '5.0'} Rating
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-primary bg-primary-light px-2 py-0.5 rounded-md border border-primary-border/40">
                    {profile.totalJobs || 0} Washes Done
                  </span>
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{serviceArea}</span>
                  </div>
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

                {/* Availability Toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-subtle border border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-900">Dispatch Availability</span>
                    <span className="text-[11px] text-gray-500">
                      {isAvailable ? 'You are receiving real-time customer wash dispatches' : 'Dispatches are paused while off-duty'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAvailable((prev) => !prev)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isAvailable ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        isAvailable ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
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
                      placeholder="Enter full legal name"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-subtle border border-gray-200 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden transition-all"
                    />
                  </div>
                </div>

                {/* Email Address (Non-editable) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">Account Email</label>
                    <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1 select-none">
                      <Lock className="w-2.5 h-2.5" /> Non-editable
                    </span>
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
                      placeholder="Contact phone number"
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
                      placeholder="Emergency contact phone number"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-subtle border border-gray-200 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden transition-all"
                    />
                  </div>
                </div>

                {/* Driver Bio / Experience */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Bio & Experience</label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Briefly state your detailing experience, IDA certifications, or special equipment."
                    className="w-full p-3 rounded-xl bg-surface-subtle border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden transition-all resize-none"
                  />
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
                      placeholder="e.g. Mercedes-Benz Sprinter / Ford Transit / Ram ProMaster"
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
                      placeholder="Van license plate"
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
                      placeholder="Operating city / territory"
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
                      placeholder="Driver License or Certification ID"
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
      </div>
    </div>
  )
}

