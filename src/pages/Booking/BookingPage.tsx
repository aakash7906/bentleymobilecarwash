import React, { useState } from 'react'
import {
  ChevronLeft,
  ChevronDown,
  Calendar,
  Clock,
  MapPin,
  Car,
  Banknote,
  ShieldCheck,
  Check,
  Truck,
  Building2,
  LocateFixed,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { ServiceItem, SavedVehicle, BookingRecord } from '@/types'
import { isValidPhone, isValidEmail, sanitizeText } from '@/lib/utils'
import { SERVICES_CATALOG } from '@/data/mockData'
import { useToast } from '@/context/ToastContext'
import { auth, db } from '@/firebase'
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { Select, SelectOption } from '@/components/ui/select'
import { getLiveGPSLocation } from '@/services/locationService'
import { BookingServicePreview } from './components/BookingServicePreview'
import { BookingPriceBreakdown } from './components/BookingPriceBreakdown'
import { BookingSuccessScreen } from './components/BookingSuccessScreen'

interface BookingPageProps {
  initialService?: ServiceItem | null
  currentVehicle: string
  onBack: () => void
  onBookingComplete?: (booking: BookingRecord) => void
  onTrackOrder?: () => void
  savedVehicles?: SavedVehicle[]
  onSelectVehicle?: (vehicleName: string) => void
  onUpdateLocation?: (address: string, city?: string, postalCode?: string, street?: string) => void
  userProfile?: {
    name?: string
    email?: string
    phone?: string
    address?: string
    lastLocation?: string
    city?: string
    postalCode?: string
  }
}



// Generate next 7 days for the date selector
const generateDateSlots = () => {
  const dates = []
  const today = new Date()
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    dates.push({
      dateObj: d,
      dayName: i === 0 ? 'Today' : daysOfWeek[d.getDay()],
      dayNumber: d.getDate(),
      month: months[d.getMonth()],
      formatted: d.toISOString().split('T')[0],
    })
  }
  return dates
}

const TIME_SLOTS = [
  { time: '09:00 AM', label: 'Morning' },
  { time: '10:00 AM', label: 'Morning' },
  { time: '11:00 AM', label: 'Morning' },
  { time: '12:00 PM', label: 'Afternoon' },
  { time: '01:00 PM', label: 'Afternoon' },
  { time: '02:00 PM', label: 'Afternoon' },
  { time: '03:00 PM', label: 'Afternoon' },
  { time: '04:00 PM', label: 'Afternoon' },
]

/**
 * Convert time string like '01:30 PM' or '09:00 AM' into minutes from midnight (0 - 1439)
 */
const parseTimeToMinutes = (timeStr: string): number => {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return 0
  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const period = match[3].toUpperCase()

  if (period === 'PM' && hours < 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0

  return hours * 60 + minutes
}

/**
 * Past-time validation: check if a specific time slot has already passed for Today
 */
const isTimeSlotPassed = (timeStr: string, isToday: boolean): boolean => {
  if (!isToday) return false
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const slotMinutes = parseTimeToMinutes(timeStr)
  return slotMinutes <= currentMinutes
}

/**
 * Check if all slots for today have already passed
 */
const areAllSlotsPassedToday = (): boolean => {
  return TIME_SLOTS.every((slot) => isTimeSlotPassed(slot.time, true))
}

/**
 * Pre-selection fallback: get the first valid upcoming time slot for a date
 */
const getFirstAvailableTimeSlot = (dateIdx: number): string => {
  const isToday = dateIdx === 0
  const available = TIME_SLOTS.find((s) => !isTimeSlotPassed(s.time, isToday))
  return available ? available.time : (TIME_SLOTS[0]?.time || '')
}

// Helper to infer vehicle type
const getInferredVehicleType = (
  vehicleName: string,
  vehicleObj?: SavedVehicle
): 'Sedan' | 'SUV' | 'Truck' | 'Van' | 'Coupe' | 'Hatchback' => {
  if (vehicleObj?.type) return vehicleObj.type as any
  const lower = (vehicleName || '').toLowerCase()
  if (
    lower.includes('truck') ||
    lower.includes('f-150') ||
    lower.includes('tacoma') ||
    lower.includes('silverado') ||
    lower.includes('ram')
  ) {
    return 'Truck'
  }
  if (
    lower.includes('van') ||
    lower.includes('transit') ||
    lower.includes('sienna') ||
    lower.includes('carnival')
  ) {
    return 'Van'
  }
  if (
    lower.includes('suv') ||
    lower.includes('crossover') ||
    lower.includes('cr-v') ||
    lower.includes('rav4') ||
    lower.includes('cx-5') ||
    lower.includes('x5') ||
    lower.includes('q7') ||
    lower.includes('model y') ||
    lower.includes('tucson') ||
    lower.includes('explorer')
  ) {
    return 'SUV'
  }
  if (
    lower.includes('coupe') ||
    lower.includes('911') ||
    lower.includes('mustang') ||
    lower.includes('supra') ||
    lower.includes('brz') ||
    lower.includes('8 series')
  ) {
    return 'Coupe'
  }
  if (lower.includes('hatchback') || lower.includes('golf') || lower.includes('gti')) {
    return 'Hatchback'
  }
  return 'Sedan'
}

export const BookingPage: React.FC<BookingPageProps> = ({
  initialService,
  currentVehicle,
  onBack,
  onBookingComplete,
  onTrackOrder,
  savedVehicles = [],
  onSelectVehicle,
  onUpdateLocation,
  userProfile,
}) => {
  // Service selection (Dynamic sync with incoming service)
  const [selectedService, setSelectedService] = useState<ServiceItem>(
    initialService || SERVICES_CATALOG[0]
  )

  React.useEffect(() => {
    if (initialService) {
      setSelectedService(initialService)
    }
  }, [initialService])

  // Dynamic Saved Vehicles resolution (combining props, localStorage & user profile)
  const dynamicVehicles = React.useMemo(() => {
    let list: SavedVehicle[] = [...(savedVehicles || [])]
    if (list.length === 0) {
      try {
        const stored = localStorage.getItem('bentley_saved_vehicles')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            list = parsed
          }
        }
      } catch { }
    }
    return list
  }, [savedVehicles])

  // Vehicle select options for select.tsx
  const vehicleOptions: SelectOption[] = React.useMemo(() => {
    const opts: SelectOption[] = []

    dynamicVehicles.forEach((v) => {
      opts.push({
        label: `${v.name}${v.licensePlate ? ` • ${v.licensePlate}` : ''} (${v.type || 'Sedan'})`,
        value: v.name,
      })
    })

    if (currentVehicle && !opts.some((o) => o.value === currentVehicle)) {
      opts.unshift({
        label: `${currentVehicle} (Active Vehicle)`,
        value: currentVehicle,
      })
    }

    if (opts.length === 0) {
      opts.push(
        { label: 'Sedan (Standard Size)', value: 'Sedan (Standard)' },
        { label: 'SUV / Crossover (+Size Adjustment)', value: 'SUV / Crossover' },
        { label: 'Truck / Large Van (+Size Adjustment)', value: 'Truck / Large Van' }
      )
    }

    if (!opts.some((o) => o.value === 'Custom Vehicle')) {
      opts.push({
        label: 'Custom Vehicle...',
        value: 'Custom Vehicle',
      })
    }

    return opts
  }, [dynamicVehicles, currentVehicle])

  const [selectedVehicle, setSelectedVehicle] = useState<string>(() => {
    if (currentVehicle) return currentVehicle
    if (dynamicVehicles.length > 0) return dynamicVehicles[0].name
    return vehicleOptions[0]?.value || 'Custom Vehicle'
  })
  const [customVehicleName, setCustomVehicleName] = useState<string>('')

  // Sync selectedVehicle when currentVehicle or options load
  React.useEffect(() => {
    if (currentVehicle) {
      setSelectedVehicle(currentVehicle)
    } else if (!selectedVehicle && vehicleOptions.length > 0) {
      setSelectedVehicle(vehicleOptions[0].value)
    }
  }, [currentVehicle, vehicleOptions])
  const [createdBooking, setCreatedBooking] = useState<BookingRecord | null>(null)

  // Helper to parse address, city & postal code from raw address string if missing
  const parseAddressFallback = (rawAddr: string, existingCity?: string, existingPostal?: string) => {
    let parsedPostal = existingPostal || ''
    let cleaned = (rawAddr || '').trim()

    // Match 6-digit PIN (India) or 5-digit ZIP / Canadian alphanumeric postal code
    const pinMatch = cleaned.match(/\b(\d{6}|\d{5}(-\d{4})?|[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d)\b/)
    if (pinMatch && !parsedPostal) {
      parsedPostal = pinMatch[1]
      cleaned = cleaned.replace(pinMatch[0], '').trim()
    }

    let parsedCity = existingCity || ''
    if (!parsedCity && cleaned) {
      const parts = cleaned.split(',').map((p) => p.trim()).filter(Boolean)
      if (parts.length >= 3) {
        parsedCity = parts[parts.length - 2]
      } else if (parts.length === 2) {
        parsedCity = parts[0]
      } else if (parts.length === 1) {
        parsedCity = parts[0]
      }
    }

    return {
      street: rawAddr || '',
      city: parsedCity || '',
      postalCode: parsedPostal || '',
    }
  }

  const initialAddressData = React.useMemo(
    () => parseAddressFallback(userProfile?.address || '', userProfile?.city, userProfile?.postalCode),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // Booking location (Autofilled dynamically from Firestore profile & address detection)
  const [locationType, setLocationType] = useState<'mobile' | 'shop'>('mobile')
  const [address, setAddress] = useState(initialAddressData.street)
  const [city, setCity] = useState(initialAddressData.city)
  const [postalCode, setPostalCode] = useState(initialAddressData.postalCode)
  const [addressNotes, setAddressNotes] = useState('')
  const [isLocating, setIsLocating] = useState(false)

  // Date & Time (with Past-Time validation and Pre-selection Fallback)
  const dateSlots = React.useMemo(() => generateDateSlots(), [])
  const allTodaySlotsPassed = React.useMemo(() => areAllSlotsPassedToday(), [])

  // Pre-selection Fallback: If all today slots passed, default to Tomorrow (index 1), else Today (index 0)
  const [selectedDateIndex, setSelectedDateIndex] = useState(() => (allTodaySlotsPassed ? 1 : 0))

  // Pre-selection Fallback: Pick the first valid upcoming time slot (avoids selecting a passed slot)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(() =>
    getFirstAvailableTimeSlot(allTodaySlotsPassed ? 1 : 0)
  )

  const handleSelectDate = (idx: number) => {
    setSelectedDateIndex(idx)
    const isToday = idx === 0
    // If selecting Today and current selected time has already passed, fallback to first available slot
    if (isToday && isTimeSlotPassed(selectedTimeSlot, true)) {
      const nextAvailable = getFirstAvailableTimeSlot(0)
      if (nextAvailable) {
        setSelectedTimeSlot(nextAvailable)
      }
    }
  }

  const handleSelectTimeSlot = (time: string) => {
    const isToday = selectedDateIndex === 0
    if (isTimeSlotPassed(time, isToday)) {
      showToast('This time slot has already passed for today. Please select an upcoming slot.', 'warning')
      return
    }
    setSelectedTimeSlot(time)
  }


  // Customer Contact Info (Autofilled dynamically from Firestore profile)
  const [customerName, setCustomerName] = useState(userProfile?.name || '')
  const [customerEmail, setCustomerEmail] = useState(userProfile?.email || '')
  const [customerPhone, setCustomerPhone] = useState(userProfile?.phone || '')

  // Sync state if userProfile finishes loading from Firestore
  const prevProfileRef = React.useRef(userProfile)
  React.useEffect(() => {
    if (userProfile && userProfile !== prevProfileRef.current) {
      prevProfileRef.current = userProfile
      setCustomerName((prev) => prev || userProfile.name || '')
      setCustomerEmail((prev) => prev || userProfile.email || '')
      setCustomerPhone((prev) => prev || userProfile.phone || '')

      if (userProfile.address) {
        const parsed = parseAddressFallback(userProfile.address, userProfile.city, userProfile.postalCode)
        setAddress((prev) => prev || parsed.street)
        setCity((prev) => prev || parsed.city)
        setPostalCode((prev) => prev || parsed.postalCode)
      } else {
        if (userProfile.city) setCity((prev) => prev || userProfile.city || '')
        if (userProfile.postalCode) setPostalCode((prev) => prev || userProfile.postalCode || '')
      }
    }
  }, [userProfile])

  // Live GPS Geolocation & reverse geocoding to Street, City, and Postal Code (100% unified with HomeTab)
  const handleFetchLiveLocation = async () => {
    setIsLocating(true)
    showToast('Detecting your live GPS location...', 'info', 2000)

    try {
      const result = await getLiveGPSLocation()
      setAddress(result.street)
      if (result.city) setCity(result.city)
      if (result.postalCode) setPostalCode(result.postalCode)

      const summary = [result.street, result.city, result.postalCode].filter(Boolean).join(', ')
      showToast(`Location detected: ${summary}`, 'success')

      if (onUpdateLocation) {
        onUpdateLocation(result.fullAddress, result.city, result.postalCode, result.street)
      }

      if (auth.currentUser) {
        try {
          const userDocRef = doc(db, 'users', auth.currentUser.uid)
          await setDoc(
            userDocRef,
            {
              lastLocation: result.fullAddress,
              address: result.street,
              city: result.city,
              postalCode: result.postalCode,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          )
        } catch (err) {
          console.warn('Failed to sync location to Firestore:', err)
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Unable to fetch your location', 'error')
    } finally {
      setIsLocating(false)
    }
  }

  // Payment method - Cash on Delivery (Pay on Completion)
  const paymentMethod = 'on_completion'
  const { showToast } = useToast()

  // Booking completion state
  const [isSuccess, setIsSuccess] = useState(false)
  const [bookingRef, setBookingRef] = useState('')

  // Effective vehicle & Vehicle Sizing dynamic calculation
  const effectiveVehicle =
    selectedVehicle === 'Custom Vehicle' && customVehicleName.trim()
      ? customVehicleName.trim()
      : selectedVehicle

  const selectedVehicleObj = dynamicVehicles.find(
    (v) => v.name === effectiveVehicle || v.name === selectedVehicle
  )
  const vehicleType = getInferredVehicleType(effectiveVehicle, selectedVehicleObj)
  const isTieredService = !!selectedService.tieredPricing
  const vehicleSizeSurcharge = isTieredService
    ? 0 // Vehicle size rate is built into the package tiered pricing
    : vehicleType === 'SUV'
      ? 15
      : vehicleType === 'Truck' || vehicleType === 'Van'
        ? 25
        : 0



  const isPackage =
    selectedService.category === 'Cleaning Packages' ||
    selectedService.category === 'Specialty'

  // Pricing calculations
  const effectiveTier =
    selectedService.selectedTier ||
    (vehicleType === 'SUV'
      ? 'suv'
      : vehicleType === 'Truck' || vehicleType === 'Van'
        ? 'truck'
        : 'car')

  const basePrice =
    selectedService.tieredPricing
      ? effectiveTier === 'suv'
        ? selectedService.tieredPricing.suv
        : effectiveTier === 'truck'
          ? selectedService.tieredPricing.truck
          : selectedService.tieredPricing.car
      : selectedService.priceNumeric || 0
  const preDiscountSubtotal = basePrice + vehicleSizeSurcharge
  const mobileFee = 0 // Free mobile dispatch in service area
  const subtotal = Math.max(0, preDiscountSubtotal + mobileFee)
  const tax = Number((subtotal * 0.05).toFixed(2)) // 5% GST
  const grandTotal = (subtotal + tax).toFixed(2)

  // Mobile dispatch minimum order requirement ($60 CAD)
  const MOBILE_MINIMUM_DISPATCH_AMOUNT = 60
  const isUnderMobileMinimum =
    locationType === 'mobile' && preDiscountSubtotal < MOBILE_MINIMUM_DISPATCH_AMOUNT
  const mobileDispatchShortfall = isUnderMobileMinimum
    ? Number((MOBILE_MINIMUM_DISPATCH_AMOUNT - preDiscountSubtotal).toFixed(2))
    : 0

  const fullAddress =
    locationType === 'mobile'
      ? `${address}${city ? `, ${city}` : ''}${postalCode ? ` ${postalCode}` : ''}`
      : `Bentley Studio ${city ? `(${city})` : ''}`

  const executeBookingConfirmation = async () => {
    // Generate official auto-generated Firebase Document ID
    const newBookingDocRef = doc(collection(db, 'bookings'))
    const newBookingId = newBookingDocRef.id
    const ref = `BW-${newBookingId.slice(-6).toUpperCase()}`
    const formattedDate = `${dateSlots[selectedDateIndex].dayName}, ${dateSlots[selectedDateIndex].month} ${dateSlots[selectedDateIndex].dayNumber}`

    const newBooking: BookingRecord = {
      id: newBookingId,
      title: selectedService.title,
      category: selectedService.category,
      vehicle: effectiveVehicle,
      vehicleType: vehicleType || 'Sedan',
      licensePlate: selectedVehicleObj?.licensePlate || '',
      image: selectedService.image,
      price: `$${grandTotal}`,
      totalNumeric: parseFloat(grandTotal),
      date: formattedDate,
      time: selectedTimeSlot,
      status: 'scheduled',
      locationType,
      address: fullAddress,
      customerName: customerName || 'Valued Customer',
      customerPhone: customerPhone || '',
      customerEmail: customerEmail || '',
      paymentMethod: 'Cash on Delivery (Pay on Completion)',
      paymentStatus: 'pending',
      frequency: 'one_time',
      serviceItem: selectedService,
      createdAt: new Date().toISOString(),
    }

    setBookingRef(ref)
    setCreatedBooking(newBooking)
    setIsSuccess(true)
    if (onBookingComplete) {
      onBookingComplete(newBooking)
    }
  }

  const handleConfirmBooking = () => {
    // 1. Date selection validation
    if (selectedDateIndex < 0 || selectedDateIndex >= dateSlots.length) {
      showToast('Please select a valid booking date.', 'error')
      return
    }

    const isToday = selectedDateIndex === 0

    // 2. Validate if all slots today have already passed
    if (isToday && areAllSlotsPassedToday()) {
      showToast('All service slots for today have already passed. Please choose tomorrow or an upcoming date.', 'warning')
      return
    }

    // 3. Time slot selection validation
    if (!selectedTimeSlot) {
      showToast('Please select a time slot for your appointment.', 'warning')
      return
    }

    // 4. Past-Time validation for Today
    if (isTimeSlotPassed(selectedTimeSlot, isToday)) {
      showToast(`The time slot (${selectedTimeSlot}) has already passed for today. Please select an upcoming slot.`, 'error')
      return
    }

    // 5. Mobile dispatch minimum limit validation ($60 CAD)
    if (locationType === 'mobile' && preDiscountSubtotal < MOBILE_MINIMUM_DISPATCH_AMOUNT) {
      showToast(
        `Mobile dispatch requires a minimum of $${MOBILE_MINIMUM_DISPATCH_AMOUNT}.00 (current subtotal: $${preDiscountSubtotal}.00). Please add $${mobileDispatchShortfall.toFixed(2)} in add-ons or choose Bentley Studio Drop-off.`,
        'warning'
      )
      return
    }

    executeBookingConfirmation()
  }

  // Confirmation Success View
  if (isSuccess) {
    const formattedDate = `${dateSlots[selectedDateIndex].dayName}, ${dateSlots[selectedDateIndex].month} ${dateSlots[selectedDateIndex].dayNumber}`
    return (
      <BookingSuccessScreen
        createdBooking={createdBooking}
        selectedService={selectedService}
        effectiveVehicle={effectiveVehicle}
        dateSlotText={formattedDate}
        selectedTimeSlot={selectedTimeSlot}
        addressText={createdBooking?.address || fullAddress}
        grandTotal={grandTotal}
        onTrackOrder={onTrackOrder}
        onBack={onBack}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#f7f9fb] overflow-y-auto animate-in slide-in-from-bottom duration-200">
      <div className="w-full max-w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto min-h-screen flex flex-col bg-[#f7f9fb] pb-32">
        {/* Top Header */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md screen-padding py-3 border-b border-gray-100 flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <h1 className="text-base font-bold text-gray-900 text-center flex-1">
            Book Appointment
          </h1>

          <div className="w-9" />
        </div>

        {/* Booking Form Content */}
        <div className="screen-padding py-5 flex flex-col gap-5">
          {/* 1. Selected Service Preview */}
          <BookingServicePreview
            selectedService={selectedService}
            basePrice={basePrice}
          />

          {/* 2. Vehicle Selector (Using Select component from select.tsx) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-primary" />
                <span>Vehicle to be Detailed</span>
              </label>
              {selectedVehicleObj?.licensePlate && (
                <span className="text-[10px] font-mono font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                  {selectedVehicleObj.licensePlate}
                </span>
              )}
            </div>

            <Select
              options={vehicleOptions}
              value={selectedVehicle}
              onValueChange={(val) => {
                setSelectedVehicle(val)
                if (onSelectVehicle) onSelectVehicle(val)
              }}
              placeholder="Select vehicle to be detailed"
              icon={<Car className="w-4 h-4 text-primary" />}
              triggerClassName="bg-white border-gray-200 hover:border-gray-300 shadow-xs"
            />

            {/* Custom Vehicle Name Entry if selected */}
            {selectedVehicle === 'Custom Vehicle' && (
              <div className="animate-in fade-in duration-150">
                <input
                  type="text"
                  value={customVehicleName}
                  onChange={(e) => {
                    setCustomVehicleName(e.target.value)
                    if (onSelectVehicle) onSelectVehicle(e.target.value)
                  }}
                  placeholder="Enter vehicle make, model & year (e.g. 2024 Honda Civic)"
                  className="w-full text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 shadow-xs"
                />
              </div>
            )}

            {/* Vehicle Sizing Tier Notice */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-surface-subtle rounded-lg border border-neutral-100 text-[11px]">
              <span className="text-neutral-500">
                Body Category: <strong className="text-neutral-800">{vehicleType}</strong>
              </span>
              {vehicleSizeSurcharge > 0 ? (
                <span className="text-primary font-semibold">
                  +${vehicleSizeSurcharge}.00 size adjustment applied
                </span>
              ) : (
                <span className="text-emerald-700 font-medium">Standard size ($0 extra)</span>
              )}
            </div>
          </div>

          {/* 3. Location Mode (Mobile vs Workshop) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>Service Location</span>
            </label>

            {/* Toggle Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setLocationType('mobile')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 cursor-pointer transition-all ${locationType === 'mobile'
                  ? 'border-primary bg-primary-light/30 ring-1 ring-primary'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <Truck className={`w-4 h-4 ${locationType === 'mobile' ? 'text-primary' : 'text-gray-500'}`} />
                  {locationType === 'mobile' && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-xs font-bold text-gray-900 mt-1">Mobile Unit</span>
                <span className="text-[10px] text-gray-500 leading-tight">We come to your doorstep</span>
              </button>

              <button
                type="button"
                onClick={() => setLocationType('shop')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 cursor-pointer transition-all ${locationType === 'shop'
                  ? 'border-primary bg-primary-light/30 ring-1 ring-primary'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <Building2 className={`w-4 h-4 ${locationType === 'shop' ? 'text-primary' : 'text-gray-500'}`} />
                  {locationType === 'shop' && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-xs font-bold text-gray-900 mt-1">Bentley Studio</span>
                <span className="text-[10px] text-gray-500 leading-tight">
                  Drop-off in {city || 'Kelowna, BC'}
                </span>
              </button>
            </div>

            {/* Address input if Mobile */}
            {locationType === 'mobile' && (
              <div className="p-3.5 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col gap-3 mt-1 animate-in fade-in duration-150">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span>Street Address</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleFetchLiveLocation}
                      disabled={isLocating}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-extrabold tracking-tight transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                      title="Auto-detect full Street, City & Postal code via GPS"
                    >
                      {isLocating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                          <span>Locating...</span>
                        </>
                      ) : (
                        <>
                          <LocateFixed className="w-3.5 h-3.5 text-primary" />

                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter driveway, road or parking address"
                      className="w-full text-xs font-semibold text-gray-800 border-b border-gray-200 py-2 pr-9 focus:outline-none focus:border-primary placeholder:text-gray-400 placeholder:font-normal"
                    />

                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City (e.g. Ghaziabad)"
                      className="w-full text-xs font-semibold text-gray-800 border-b border-gray-200 py-1.5 focus:outline-none focus:border-primary placeholder:text-gray-400 placeholder:font-normal"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Postal Code</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="Postal Code / PIN"
                      className="w-full text-xs font-semibold text-gray-800 border-b border-gray-200 py-1.5 focus:outline-none focus:border-primary placeholder:text-gray-400 placeholder:font-normal"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Special Parking / Access Notes</label>
                  <input
                    type="text"
                    value={addressNotes}
                    onChange={(e) => setAddressNotes(e.target.value)}
                    placeholder="e.g. Park in underground visitor bay #12"
                    className="w-full text-xs font-medium text-gray-800 border-b border-gray-200 py-1.5 focus:outline-none focus:border-primary placeholder:text-gray-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Select Date (Horizontal Scroll Strip) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>Select Date</span>
            </label>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {dateSlots.map((d, idx) => {
                const isSelected = selectedDateIndex === idx
                const isToday = idx === 0
                const isTodayEnded = isToday && allTodaySlotsPassed
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDate(idx)}
                    className={`min-w-[64px] py-2.5 px-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : isTodayEnded
                        ? 'bg-gray-100 border border-gray-200 text-gray-400 hover:bg-gray-200/60'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-[10px] font-medium opacity-90">
                      {d.dayName}
                      {isTodayEnded ? ' (Ended)' : ''}
                    </span>
                    <span className="text-sm font-extrabold my-0.5">{d.dayNumber}</span>
                    <span className="text-[9px] uppercase tracking-wider">{d.month}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 5. Select Time Slot */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Select Time Slot</span>
              </label>
              {selectedDateIndex === 0 && !allTodaySlotsPassed && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Upcoming Slots Today
                </span>
              )}
            </div>

            {selectedDateIndex === 0 && allTodaySlotsPassed ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold">All wash slots for today have already passed.</span>
                  <span className="text-[11px] text-amber-700">Please choose tomorrow or an upcoming date.</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectDate(1)}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 shadow-xs cursor-pointer transition-colors"
                >
                  Book Tomorrow
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TIME_SLOTS.map((slot, i) => {
                  const isSelected = selectedTimeSlot === slot.time
                  const isPassed = isTimeSlotPassed(slot.time, selectedDateIndex === 0)
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={isPassed}
                      onClick={() => handleSelectTimeSlot(slot.time)}
                      className={`py-2 px-1 rounded-xl text-center transition-all ${
                        isPassed
                          ? 'bg-gray-100/90 border border-gray-200/70 text-gray-400 cursor-not-allowed opacity-50'
                          : isSelected
                          ? 'bg-primary text-primary-foreground shadow-sm font-bold cursor-pointer'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium cursor-pointer'
                      }`}
                      title={isPassed ? 'This time slot has already passed for today' : `Select ${slot.time}`}
                    >
                      <span className={`text-xs block ${isPassed ? 'line-through text-gray-400' : ''}`}>
                        {slot.time}
                      </span>
                      <span className="text-[9px] opacity-75 block">
                        {isPassed ? 'Passed' : slot.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>



          {/* 7. Contact Details */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col gap-2.5">
            <span className="text-xs font-bold text-gray-900">Your Contact Details</span>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Full Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs font-medium text-gray-800 border-b border-gray-200 py-1 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Phone Number</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs font-medium text-gray-800 border-b border-gray-200 py-1 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Email Receipt</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full text-xs font-medium text-gray-800 border-b border-gray-200 py-1 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* 8. Payment Method */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5 text-primary" />
              <span>Payment Option</span>
            </label>

            <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-50/50 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Banknote className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-900">Cash on Delivery (Pay on Completion)</span>
                  <span className="text-[10px] text-gray-600">Pay cash directly to technician after your wash</span>
                </div>
              </div>
            </div>
          </div>

          {/* 9. Price Breakdown Box */}
          <BookingPriceBreakdown
            selectedService={selectedService}
            isTieredService={isTieredService}
            vehicleType={vehicleType}
            basePrice={basePrice}
            vehicleSizeSurcharge={vehicleSizeSurcharge}
            city={city}
            tax={tax}
            grandTotal={grandTotal}
            isUnderMobileMinimum={isUnderMobileMinimum}
            MOBILE_MINIMUM_DISPATCH_AMOUNT={MOBILE_MINIMUM_DISPATCH_AMOUNT}
            preDiscountSubtotal={preDiscountSubtotal}
            mobileDispatchShortfall={mobileDispatchShortfall}
            onSwitchToShop={() => setLocationType('shop')}
          />
        </div>

        {/* Sticky Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="w-full max-w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-medium">Estimated Total</span>
              <span className="text-lg font-black text-primary font-mono leading-tight">
                ${grandTotal}
              </span>
            </div>

            <button
              onClick={handleConfirmBooking}
              className="flex-1 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-bold shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm &amp; Schedule (Cash on Delivery)</span>
            </button>
          </div>
        </div>


      </div>
    </div>
  )
}
