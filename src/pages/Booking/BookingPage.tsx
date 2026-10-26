import React, { useState } from 'react'
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  Car,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Check,
  Truck,
  Building2,
  Receipt,
  RefreshCw,
} from 'lucide-react'
import { ServiceItem, SavedVehicle, BookingRecord } from '@/types'
import { SERVICES_CATALOG } from '@/data/mockData'
import { InvoiceModal } from '@/pages/Orders/InvoiceModal'
import { StripeCardForm } from '@/components/StripeCardForm'
import { processStripePayment, StripeCardDetails } from '@/stripe/stripeClient'
import { useToast } from '@/context/ToastContext'
import { db } from '@/firebase'
import { collection, doc } from 'firebase/firestore'

interface BookingPageProps {
  initialService?: ServiceItem | null
  currentVehicle: string
  onBack: () => void
  onBookingComplete?: (booking: BookingRecord) => void
  onTrackOrder?: () => void
  savedVehicles?: SavedVehicle[]
  onSelectVehicle?: (vehicleName: string) => void
  userProfile?: {
    name?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    postalCode?: string
  }
}

interface AddOnOption {
  id: string
  title: string
  description: string
  price: number
}

const AVAILABLE_ADDONS: AddOnOption[] = [
  {
    id: 'addon-engine',
    title: 'Engine Bay Deep Clean',
    description: 'Degrease & protect plastics under the hood',
    price: 35,
  },
  {
    id: 'addon-ozone',
    title: 'Ozone Odor Treatment',
    description: 'Neutralizes smoke, pet, & organic smells permanently',
    price: 40,
  },
  {
    id: 'addon-windshield',
    title: 'Ceramic Glass Shield',
    description: 'High-hydrophobic water repellent for all glass',
    price: 25,
  },
  {
    id: 'addon-pethair',
    title: 'Heavy Pet Hair Removal',
    description: 'Specialized pumice & vacuum extraction for fur',
    price: 30,
  },
]

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
  { time: '11:00 AM', label: 'Morning' },
  { time: '01:30 PM', label: 'Afternoon' },
  { time: '03:30 PM', label: 'Afternoon' },
  { time: '05:00 PM', label: 'Evening' },
]

export const BookingPage: React.FC<BookingPageProps> = ({
  initialService,
  currentVehicle,
  onBack,
  onBookingComplete,
  onTrackOrder,
  savedVehicles = [],
  onSelectVehicle,
  userProfile,
}) => {
  // Service selection
  const [selectedService] = useState<ServiceItem>(
    initialService || SERVICES_CATALOG[0]
  )
  const [selectedVehicle, setSelectedVehicle] = useState<string>(
    currentVehicle || (savedVehicles[0]?.name || '')
  )

  // Frequency & Subscription
  const [frequency, setFrequency] = useState<'one_time' | 'biweekly' | 'monthly'>('one_time')
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [createdBooking, setCreatedBooking] = useState<BookingRecord | null>(null)

  // Booking location (Autofilled dynamically from Firestore profile)
  const [locationType, setLocationType] = useState<'mobile' | 'shop'>('mobile')
  const [address, setAddress] = useState(userProfile?.address || '')
  const [city, setCity] = useState(userProfile?.city || '')
  const [postalCode, setPostalCode] = useState(userProfile?.postalCode || '')
  const [addressNotes, setAddressNotes] = useState('')

  // Date & Time
  const dateSlots = generateDateSlots()
  const [selectedDateIndex, setSelectedDateIndex] = useState(0)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[1].time)

  // Add-ons
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([])

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
      setAddress((prev) => prev || userProfile.address || '')
      setCity((prev) => prev || userProfile.city || '')
      setPostalCode((prev) => prev || userProfile.postalCode || '')
    }
  }, [userProfile])

  React.useEffect(() => {
    if (currentVehicle) {
      setSelectedVehicle(currentVehicle)
    }
  }, [currentVehicle])

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'on_completion' | 'card'>('on_completion')
  const { showToast } = useToast()
  const [stripeCardDetails, setStripeCardDetails] = useState<StripeCardDetails>({
    cardNumber: '',
    cardholderName: userProfile?.name || '',
    expiry: '',
    cvc: '',
    postalCode: userProfile?.postalCode || '',
  })
  const [isStripeCardValid, setIsStripeCardValid] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Booking completion state
  const [isSuccess, setIsSuccess] = useState(false)
  const [bookingRef, setBookingRef] = useState('')

  // Vehicle Sizing calculation
  const selectedVehicleObj = savedVehicles?.find((v) => v.name === selectedVehicle)
  const vehicleType = selectedVehicleObj?.type || 'Sedan'
  const isTieredService = !!selectedService.tieredPricing
  const vehicleSizeSurcharge = isTieredService
    ? 0 // Vehicle size rate is built into the package tiered pricing
    : vehicleType === 'SUV'
      ? 15
      : vehicleType === 'Truck' || vehicleType === 'Van'
        ? 25
        : 0

  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const isPackage =
    selectedService.category === 'Cleaning Packages' ||
    selectedService.category === 'Specialty'

  // Pricing calculations
  const basePrice = isPackage
    ? isTieredService && selectedService.tieredPricing
      ? vehicleType === 'SUV'
        ? selectedService.tieredPricing.suv
        : vehicleType === 'Truck' || vehicleType === 'Van'
          ? selectedService.tieredPricing.truck
          : selectedService.tieredPricing.car
      : selectedService.priceNumeric || 0
    : 0
  const addonsTotal = selectedAddonIds.reduce((sum, id) => {
    const addon = AVAILABLE_ADDONS.find((a) => a.id === id)
    return sum + (addon ? addon.price : 0)
  }, 0)
  const preDiscountSubtotal = basePrice + vehicleSizeSurcharge + addonsTotal
  const recurringDiscount =
    frequency !== 'one_time' ? Math.round(preDiscountSubtotal * 0.15) : 0
  const mobileFee = locationType === 'mobile' ? 0 : 0 // Free mobile dispatch in Kelowna
  const subtotal = Math.max(0, preDiscountSubtotal - recurringDiscount + mobileFee)
  const tax = Number((subtotal * 0.05).toFixed(2)) // 5% GST
  const grandTotal = (subtotal + tax).toFixed(2)

  const executeBookingConfirmation = async () => {
    let stripeTx: any = null

    if (paymentMethod === 'card') {
      if (!isStripeCardValid) {
        showToast('Please enter complete & valid card details for Stripe payment.', 'error')
        return
      }

      setIsProcessingPayment(true)
      try {
        const paymentResult = await processStripePayment(
          parseFloat(grandTotal),
          'cad',
          stripeCardDetails,
          {
            serviceTitle: selectedService.title,
            customerName,
            customerEmail,
          }
        )

        if (!paymentResult.success) {
          setIsProcessingPayment(false)
          showToast(paymentResult.error || 'Stripe card payment authorization failed.', 'error')
          return
        }

        stripeTx = paymentResult
      } catch (err: any) {
        setIsProcessingPayment(false)
        showToast(err?.message || 'Payment processing error.', 'error')
        return
      }
      setIsProcessingPayment(false)
    }

    // Generate official auto-generated Firebase Document ID
    const newBookingDocRef = doc(collection(db, 'bookings'))
    const newBookingId = newBookingDocRef.id
    const ref = `BW-${newBookingId.slice(-6).toUpperCase()}`
    const fullAddress =
      locationType === 'mobile'
        ? `${address}, ${city} ${postalCode}`
        : 'Bentley Studio (Kelowna)'
    const formattedDate = `${dateSlots[selectedDateIndex].dayName}, ${dateSlots[selectedDateIndex].month} ${dateSlots[selectedDateIndex].dayNumber}`

    const newBooking: BookingRecord = {
      id: newBookingId,
      title: selectedService.title,
      category: selectedService.category,
      vehicle: selectedVehicle,
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
      technicianName: 'Alex Rivera',
      addons: selectedAddonIds
        .map((id) => AVAILABLE_ADDONS.find((a) => a.id === id)?.title)
        .filter(Boolean) as string[],
      paymentMethod:
        paymentMethod === 'card'
          ? `Credit / Debit Card (Stripe •••• ${stripeTx?.last4 || '4242'})`
          : 'Pay on Completion',
      stripePaymentId: stripeTx?.paymentIntentId,
      cardBrand: stripeTx?.cardBrand,
      cardLast4: stripeTx?.last4,
      paymentStatus: paymentMethod === 'card' ? 'paid' : 'pending',
      frequency,
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
    executeBookingConfirmation()
  }

  // Confirmation Success View
  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto flex flex-col justify-between p-6 w-full max-w-full lg:max-w-3xl xl:max-w-4xl mx-auto">
        <div className="flex flex-col items-center text-center pt-8">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 animate-in zoom-in duration-300">
            <CheckCircle2 className="w-12 h-12 stroke-[2.2]" />
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold tracking-wider uppercase mb-2">
            Appointment Confirmed
          </span>

          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Booking Scheduled!
          </h1>
          <p className="text-xs text-gray-500 mt-1.5 max-w-xs">
            We will arrive on time with our fully-equipped eco-friendly mobile detailing unit.
          </p>

          {/* Reference Card */}
          <div className="mt-6 w-full p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col gap-3 text-left">


            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Service:</span>
              <span className="font-semibold text-gray-900">{selectedService.title}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Vehicle:</span>
              <span className="font-semibold text-gray-900">{selectedVehicle}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Date & Time:</span>
              <span className="font-semibold text-gray-900">
                {dateSlots[selectedDateIndex].dayName}, {dateSlots[selectedDateIndex].month} {dateSlots[selectedDateIndex].dayNumber} at {selectedTimeSlot}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Location:</span>
              <span className="font-semibold text-gray-900 text-right truncate max-w-[180px]">
                {locationType === 'mobile' ? address : 'Bentley Studio (Kelowna)'}
              </span>
            </div>

            {createdBooking?.stripePaymentId && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Stripe Payment:</span>
                <span className="font-mono text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Paid ({createdBooking.cardBrand || 'Card'} •••• {createdBooking.cardLast4 || '4242'})
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-xs">
              <span className="font-bold text-gray-900">Total Estimated:</span>
              <span className="text-sm font-bold text-primary font-mono">${grandTotal} CAD</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex flex-col gap-2.5 pb-6">
          <button
            onClick={() => {
              if (onTrackOrder) {
                onTrackOrder()
              } else {
                onBack()
              }
            }}
            className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-bold shadow-md active:scale-98 transition-all cursor-pointer text-center"
          >
            Track Order &gt;
          </button>
          {createdBooking && (
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="w-full py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Receipt className="w-3.5 h-3.5 text-primary" />
              <span>View Receipt / Invoice</span>
            </button>
          )}
          <button
            onClick={onBack}
            className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold active:scale-98 transition-all cursor-pointer text-center"
          >
            Back to Home
          </button>
        </div>

        {/* Invoice Modal */}
        {showInvoiceModal && createdBooking && (
          <InvoiceModal
            booking={createdBooking}
            onClose={() => setShowInvoiceModal(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#f7f9fb] overflow-y-auto animate-in slide-in-from-bottom duration-200">
      <div className="w-full max-w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto min-h-screen flex flex-col bg-[#f7f9fb] pb-32">
        {/* Top Header */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-5 py-3 border-b border-gray-100 flex items-center justify-between">
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
        <div className="p-5 flex flex-col gap-5">
          {/* 1. Selected Service Preview */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center gap-3.5">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
              <img
                src={selectedService.image}
                alt={selectedService.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wide">
                {selectedService.category}
              </span>
              <h2 className="text-sm font-bold text-gray-900 truncate">
                {selectedService.title}
              </h2>
              <span className="text-xs text-gray-500 mt-0.5">
                Est. {selectedService.estTime}
              </span>
              {isPackage ? (
                <span className="text-sm font-extrabold text-primary font-mono mt-1">
                  {selectedService.price}
                </span>
              ) : (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1 self-start">
                  Included in Packages
                </span>
              )}
            </div>
          </div>

          {/* 2. Vehicle Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-primary" />
              <span>Vehicle to be Detailed</span>
            </label>
            <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-900">{selectedVehicle}</span>
                <span className="text-[11px] text-gray-500">Registered Vehicle</span>
              </div>
              <select
                value={selectedVehicle}
                onChange={(e) => {
                  setSelectedVehicle(e.target.value)
                  if (onSelectVehicle) onSelectVehicle(e.target.value)
                }}
                className="text-xs font-semibold text-primary bg-primary-light py-1.5 px-3 rounded-lg border-0 cursor-pointer focus:outline-none"
              >
                {savedVehicles.length === 0 && (
                  <option value={selectedVehicle || 'Custom Vehicle'}>
                    {selectedVehicle || 'Custom Vehicle'}
                  </option>
                )}
                {savedVehicles.map((veh) => (
                  <option key={veh.id} value={veh.name}>
                    {veh.name} {veh.licensePlate ? `• ${veh.licensePlate}` : ''}
                  </option>
                ))}
              </select>
            </div>

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
                <span className="text-[10px] text-gray-500 leading-tight">Drop-off in Kelowna, BC</span>
              </button>
            </div>

            {/* Address input if Mobile */}
            {locationType === 'mobile' && (
              <div className="p-3.5 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col gap-2.5 mt-1 animate-in fade-in duration-150">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter driveway or parking address"
                    className="w-full text-xs font-medium text-gray-800 border-b border-gray-200 py-1.5 focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs font-medium text-gray-800 border-b border-gray-200 py-1.5 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Postal Code</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full text-xs font-medium text-gray-800 border-b border-gray-200 py-1.5 focus:outline-none focus:border-primary"
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
                    className="w-full text-xs font-medium text-gray-800 border-b border-gray-200 py-1.5 focus:outline-none focus:border-primary"
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
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDateIndex(idx)}
                    className={`min-w-[62px] py-2.5 px-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${isSelected
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <span className="text-[10px] font-medium opacity-90">{d.dayName}</span>
                    <span className="text-sm font-extrabold my-0.5">{d.dayNumber}</span>
                    <span className="text-[9px] uppercase tracking-wider">{d.month}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 5. Select Time Slot */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Select Time Slot</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((slot, i) => {
                const isSelected = selectedTimeSlot === slot.time
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedTimeSlot(slot.time)}
                    className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer ${isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm font-bold'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium'
                      }`}
                  >
                    <span className="text-xs block">{slot.time}</span>
                    <span className="text-[9px] opacity-75 block">{slot.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 6. Popular Add-Ons */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <span>Recommended Add-Ons</span>
            </label>

            <div className="flex flex-col gap-2">
              {AVAILABLE_ADDONS.map((addon) => {
                const isChecked = selectedAddonIds.includes(addon.id)
                return (
                  <div
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isChecked
                      ? 'bg-primary-light/30 border-primary'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${isChecked ? 'bg-primary text-primary-foreground' : 'border border-gray-300 bg-white'
                          }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900">{addon.title}</span>
                        <span className="text-[10px] text-gray-500 leading-tight">
                          {addon.description}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary font-mono shrink-0 ml-2">
                      +${addon.price}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 7. Service Frequency & Subscription Plan */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-primary" />
                <span>Service Frequency</span>
              </label>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Save 15% with Recurring
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFrequency('one_time')}
                className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${frequency === 'one_time'
                  ? 'border-primary bg-primary-light/40 ring-1 ring-primary'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
              >
                <span className="text-xs font-bold text-gray-900">One-Time</span>
                <span className="text-[10px] text-gray-500">Standard rate</span>
              </button>

              <button
                type="button"
                onClick={() => setFrequency('biweekly')}
                className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all relative overflow-hidden ${frequency === 'biweekly'
                  ? 'border-primary bg-primary-light/40 ring-1 ring-primary'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
              >
                <span className="text-xs font-bold text-gray-900">Bi-Weekly</span>
                <span className="text-[10px] font-bold text-emerald-600">Save 15%</span>
              </button>

              <button
                type="button"
                onClick={() => setFrequency('monthly')}
                className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${frequency === 'monthly'
                  ? 'border-primary bg-primary-light/40 ring-1 ring-primary'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
              >
                <span className="text-xs font-bold text-gray-900">Monthly</span>
                <span className="text-[10px] font-bold text-emerald-600">Save 15%</span>
              </button>
            </div>
          </div>

          {/* 8. Contact Details */}
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
              <CreditCard className="w-3.5 h-3.5 text-primary" />
              <span>Payment Option</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('on_completion')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 cursor-pointer transition-all ${paymentMethod === 'on_completion'
                  ? 'border-primary bg-primary-light/40 ring-1 ring-primary'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  {paymentMethod === 'on_completion' && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-xs font-bold text-gray-900 mt-1">Pay on Completion</span>
                <span className="text-[10px] text-gray-500">Tap / Card / Cash after wash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 cursor-pointer transition-all ${paymentMethod === 'card'
                  ? 'border-primary bg-primary-light/40 ring-1 ring-primary'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <CreditCard className="w-4 h-4 text-gray-700" />
                  {paymentMethod === 'card' && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-xs font-bold text-gray-900 mt-1">Credit / Debit Card</span>
                <span className="text-[10px] text-gray-500">Stripe instant payment</span>
              </button>
            </div>

            {/* Embedded Stripe Card Form */}
            {paymentMethod === 'card' && (
              <div className="mt-2 animate-in fade-in duration-200">
                <StripeCardForm
                  onChange={(details, isValid) => {
                    setStripeCardDetails(details)
                    setIsStripeCardValid(isValid)
                  }}
                  disabled={isProcessingPayment}
                  initialName={customerName}
                  initialPostal={postalCode}
                />
              </div>
            )}
          </div>

          {/* 9. Price Breakdown Box */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-900">Summary & Pricing</span>

            <div className="flex items-center justify-between text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <span>{selectedService.title}</span>
                {isTieredService && (
                  <span className="text-[10px] text-primary font-bold bg-primary-light px-1.5 py-0.5 rounded">
                    {vehicleType} Rate
                  </span>
                )}
              </span>
              <span className="font-mono">
                {isPackage ? `$${basePrice}.00` : 'Included'}
              </span>
            </div>

            {vehicleSizeSurcharge > 0 && (
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>+ {vehicleType} Size Surcharge</span>
                <span className="font-mono">+${vehicleSizeSurcharge}.00</span>
              </div>
            )}

            {selectedAddonIds.map((id) => {
              const addon = AVAILABLE_ADDONS.find((a) => a.id === id)
              if (!addon) return null
              return (
                <div key={id} className="flex items-center justify-between text-xs text-gray-600">
                  <span>+ {addon.title}</span>
                  <span className="font-mono">${addon.price}.00</span>
                </div>
              )
            })}

            {recurringDiscount > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold">
                <span>Recurring Subscription (15% Off)</span>
                <span className="font-mono">-${recurringDiscount}.00</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Mobile Dispatch Fee (Kelowna)</span>
              <span className="font-semibold text-emerald-600">Free</span>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>GST (5%)</span>
              <span className="font-mono">${tax}</span>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
              <span className="text-sm font-bold text-gray-900">Total Amount</span>
              <span className="text-base font-extrabold text-primary font-mono">
                ${grandTotal} CAD
              </span>
            </div>
          </div>
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
              disabled={isProcessingPayment}
              className="flex-1 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-bold shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isProcessingPayment ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Stripe Payment...</span>
                </>
              ) : (
                <span>{paymentMethod === 'card' ? `Pay $${grandTotal} & Schedule` : 'Confirm & Schedule'}</span>
              )}
            </button>
          </div>
        </div>


      </div>
    </div>
  )
}
