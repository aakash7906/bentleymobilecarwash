import React, { useState, useMemo, useCallback } from 'react'
import {
  Truck,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  Navigation,
  Eye,
  X,
  ExternalLink,
  MessageSquare,
  Radio,
  History,
  Calendar,
} from 'lucide-react'
import logoBentley from '@/assets/Logo_Bentley.png'
import { BookingRecord, BookingStatus, DriverProfile, PaymentCollectionData } from '@/types'
import { DriverMapView } from './DriverMapView'
import { DriverProfilePage } from './DriverProfilePage'
import { useToast } from '@/context/ToastContext'
import { Dialog } from '@/components/ui/dialog'
import { CodPaymentModal } from '@/components/CodPaymentModal'
import { DriverBottomNav, DriverTabType } from '@/components/DriverBottomNav'

interface DriverDashboardProps {
  bookings: BookingRecord[]
  onAcceptOrder: (bookingId: string) => void
  onUpdateStatus: (
    bookingId: string,
    newStatus: BookingStatus,
    coords?: [number, number],
    paymentData?: PaymentCollectionData
  ) => void
  onLogout: () => void
  driverName?: string
  driverEmail?: string
  driverProfile?: DriverProfile
  onUpdateDriverProfile?: (updated: DriverProfile) => void
  onDeleteAccount?: () => Promise<boolean | void>
}

const DEFAULT_DRIVER_PROFILE: DriverProfile = {
  name: '',
  email: '',
  phone: '',
  vanModel: 'Mobile Detailing Unit',
  licensePlate: '',
  serviceArea: 'Ontario, Canada',
  driverLicenseNumber: '',
  emergencyContact: '',
  avatar: '',
  isAvailable: true,
  rating: 5.0,
  totalJobs: 0,
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  bookings,
  onAcceptOrder,
  onUpdateStatus,
  onLogout,
  driverName = '',
  driverEmail = '',
  driverProfile: externalProfile,
  onUpdateDriverProfile,
  onDeleteAccount,
}) => {
  const { showToast } = useToast()

  // 1. PRIMARY DRIVER NAVIGATION TABS: 'orders' | 'history' | 'profile'
  // Always default to 'orders' on fresh load or login so driver lands directly on Live Requests
  const [driverTab, setDriverTab] = useState<DriverTabType>(() => {
    try {
      const stored = localStorage.getItem('bentley_driver_current_tab')
      if (stored === 'orders' || stored === 'history') {
        return stored as DriverTabType
      }
    } catch {}
    return 'orders'
  })

  // 2. SUB-TAB INSIDE ORDERS: 'available' (Live Requests) | 'active' (My Active)
  const [ordersSubTab, setOrdersSubTab] = useState<'available' | 'active'>(() => {
    try {
      const stored = localStorage.getItem('bentley_driver_orders_subtab')
      if (stored === 'available' || stored === 'active') {
        return stored
      }
    } catch {}
    return 'available'
  })

  const [selectedBookingForMap, setSelectedBookingForMap] = useState<BookingRecord | null>(() => {
    try {
      const savedId = localStorage.getItem('bentley_driver_map_booking_id')
      if (savedId && Array.isArray(bookings)) {
        const found = bookings.find((b) => b.id === savedId)
        if (found && found.status !== 'completed' && found.status !== 'cancelled') {
          return found
        }
      }
    } catch {}
    return null
  })

  const [selectedDetailBooking, setSelectedDetailBooking] = useState<BookingRecord | null>(null)
  const [codPaymentBooking, setCodPaymentBooking] = useState<BookingRecord | null>(null)

  // Persist driver navigation tabs
  React.useEffect(() => {
    try {
      localStorage.setItem('bentley_driver_current_tab', driverTab)
    } catch {}
  }, [driverTab])

  React.useEffect(() => {
    try {
      localStorage.setItem('bentley_driver_orders_subtab', ordersSubTab)
    } catch {}
  }, [ordersSubTab])

  // Persist driver map view state
  React.useEffect(() => {
    try {
      if (selectedBookingForMap) {
        localStorage.setItem('bentley_driver_map_booking_id', selectedBookingForMap.id)
      } else {
        localStorage.removeItem('bentley_driver_map_booking_id')
      }
    } catch {}
  }, [selectedBookingForMap])

  // Restore driver map view if bookings load asynchronously after reload
  React.useEffect(() => {
    if (!selectedBookingForMap && bookings.length > 0) {
      try {
        const savedId = localStorage.getItem('bentley_driver_map_booking_id')
        if (savedId) {
          const found = bookings.find((b) => b.id === savedId)
          if (found && found.status !== 'completed' && found.status !== 'cancelled') {
            setSelectedBookingForMap(found)
          } else if (found && (found.status === 'completed' || found.status === 'cancelled')) {
            localStorage.removeItem('bentley_driver_map_booking_id')
          }
        }
      } catch {}
    }
  }, [bookings, selectedBookingForMap])

  // Clean up legacy profile open flag from localStorage to prevent unexpected modal popup
  React.useEffect(() => {
    try {
      localStorage.removeItem('bentley_driver_profile_open')
    } catch {}
  }, [])

  const sanitizeAvatar = (url?: string) => {
    if (!url) return ''
    if (url.includes('unsplash.com')) return ''
    return url
  }

  // Live Driver Profile
  const [profile, setProfile] = useState<DriverProfile>(() => {
    if (externalProfile) {
      return {
        ...externalProfile,
        avatar: sanitizeAvatar(externalProfile.avatar),
      }
    }
    try {
      const stored = localStorage.getItem('bentley_driver_profile')
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          ...parsed,
          avatar: sanitizeAvatar(parsed.avatar),
        }
      }
    } catch {}
    return {
      ...DEFAULT_DRIVER_PROFILE,
      name: driverName || 'Driver Partner',
      email: driverEmail || 'driver@bentleycarwash.com',
    }
  })

  // Sync external profile props with internal state
  React.useEffect(() => {
    if (externalProfile) {
      setProfile((prev) => ({
        ...prev,
        ...externalProfile,
        avatar: sanitizeAvatar(externalProfile.avatar || prev.avatar),
      }))
    }
  }, [externalProfile])

  // Filter Bookings by Status & Driver Assignment
  const availableOrders = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.status === 'pending' ||
          (b.status === 'scheduled' && !b.driverId && !b.driverName)
      ),
    [bookings]
  )

  const myActiveOrders = useMemo(
    () =>
      bookings.filter((b) => {
        const isActive =
          b.status === 'accepted' || b.status === 'en_route' || b.status === 'in_progress'
        if (!isActive) return false
        return (
          !b.driverName ||
          b.driverName === profile.name ||
          b.driverPhone === profile.phone ||
          b.technicianName === profile.name
        )
      }),
    [bookings, profile.name, profile.phone]
  )

  const completedOrders = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.status === 'completed' &&
          (!b.driverName ||
            b.driverName === profile.name ||
            b.driverPhone === profile.phone ||
            b.technicianName === profile.name)
      ),
    [bookings, profile.name, profile.phone]
  )

  // Handle saving driver profile updates
  const handleSaveProfile = (updated: DriverProfile) => {
    const cleaned = {
      ...updated,
      avatar: sanitizeAvatar(updated.avatar),
    }
    setProfile(cleaned)
    try {
      localStorage.setItem('bentley_driver_profile', JSON.stringify(cleaned))
    } catch {}

    if (onUpdateDriverProfile) {
      onUpdateDriverProfile(cleaned)
    }
  }

  // Handle accepting order
  const handleAccept = (booking: BookingRecord) => {
    onAcceptOrder(booking.id)
    showToast(`Order #${booking.id} accepted! Opening live route navigation.`, 'success')
    // Seamlessly focus on My Active
    setOrdersSubTab('active')
    // Open map right away for live dispatch
    setSelectedBookingForMap({
      ...booking,
      status: 'accepted',
      driverName: profile.name,
      driverPhone: profile.phone,
      driverVanNumber: profile.licensePlate,
      driverVehicle: profile.vanModel,
    })
  }

  return (
    <div className="w-full min-h-screen bg-canvas flex flex-col selection:bg-primary selection:text-primary-foreground">
      {/* 1. DRIVER PROFILE PAGE / MODAL */}
      <DriverProfilePage
        isOpen={driverTab === 'profile'}
        onClose={() => setDriverTab('orders')}
        profile={profile}
        onSave={handleSaveProfile}
        onLogout={onLogout}
        onDeleteAccount={onDeleteAccount}
        completedJobsCount={completedOrders.length}
      />

      {/* 2. DRIVER MAP MODAL */}
      {selectedBookingForMap && (() => {
        const targetBooking =
          bookings.find((b) => b.id === selectedBookingForMap.id) || selectedBookingForMap

        return (
          <DriverMapView
            booking={targetBooking}
            onBack={() => setSelectedBookingForMap(null)}
            onUpdateStatus={(id, status, coords, paymentData) => {
              onUpdateStatus(id, status, coords, paymentData)
              if (status === 'completed') {
                setSelectedBookingForMap(null)
                showToast('Wash completed! Order recorded in history.', 'success')
              }
            }}
            driverProfile={profile}
          />
        )
      })()}

      {/* 3. ORDER DETAILS MODAL */}
      <Dialog
        isOpen={!!selectedDetailBooking}
        onClose={() => setSelectedDetailBooking(null)}
        zIndex="z-60"
        position="center"
        maxWidth="md"
        contentClassName="p-5 sm:p-6"
      >
        {selectedDetailBooking && (
          <>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-gray-900">Order Information</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailBooking(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-xs">
              <div className="p-3.5 bg-surface-subtle rounded-2xl border border-gray-100 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Customer</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-900">
                    {selectedDetailBooking.customerName}
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${selectedDetailBooking.customerPhone}`}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold hover:bg-emerald-100 flex items-center gap-1 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 fill-emerald-600" />
                      <span>Call</span>
                    </a>
                    <a
                      href={`sms:${selectedDetailBooking.customerPhone}`}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold hover:bg-blue-100 flex items-center gap-1 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>SMS</span>
                    </a>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1 text-gray-600">
                  <span className="truncate max-w-[260px]">{selectedDetailBooking.address}</span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedDetailBooking.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-bold hover:underline inline-flex items-center gap-0.5 shrink-0"
                  >
                    <span>Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="p-3.5 bg-surface-subtle rounded-2xl border border-gray-100 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  Vehicle & Service
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{selectedDetailBooking.vehicle}</span>
                  <span className="font-mono font-bold text-primary text-sm">
                    {selectedDetailBooking.price}
                  </span>
                </div>
                <span className="text-gray-600">Service: {selectedDetailBooking.title}</span>
                {selectedDetailBooking.licensePlate && (
                  <span className="text-gray-500 text-[11px]">
                    Plate: {selectedDetailBooking.licensePlate}
                  </span>
                )}
                {selectedDetailBooking.addons && selectedDetailBooking.addons.length > 0 && (
                  <div className="mt-1 pt-1 border-t border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Add-ons:</span>
                    <ul className="list-disc list-inside text-gray-700 mt-0.5">
                      {selectedDetailBooking.addons.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl text-gray-700">
                <span className="font-medium">Appointment:</span>
                <span className="font-bold">
                  {selectedDetailBooking.date} • {selectedDetailBooking.time}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl text-gray-700">
                <span className="font-medium">Payment Mode:</span>
                <span className="font-bold">
                  {selectedDetailBooking.paymentMethod || 'Cash on Delivery (COD)'}
                </span>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              {selectedDetailBooking.status === 'pending' ||
              (selectedDetailBooking.status === 'scheduled' && !selectedDetailBooking.driverId) ? (
                <button
                  type="button"
                  onClick={() => {
                    handleAccept(selectedDetailBooking)
                    setSelectedDetailBooking(null)
                  }}
                  className="w-full py-3 rounded-2xl bg-primary hover:bg-primary-hover active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Order & Start Delivery</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBookingForMap(selectedDetailBooking)
                    setSelectedDetailBooking(null)
                  }}
                  className="w-full py-3 rounded-2xl bg-secondary hover:bg-neutral-900 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Navigation className="w-4 h-4 fill-white" />
                  <span>Open Live Map & Route</span>
                </button>
              )}
            </div>
          </>
        )}
      </Dialog>

      {/* 4. MAIN RESPONSIVE DASHBOARD LAYOUT */}
      <main className="w-full max-w-full min-h-screen bg-canvas flex flex-col pb-32">
        {/* TOP RESPONSIVE HEADER: Logo on Left (Profile icon only in Bottom Navbar) */}
        <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-2xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between">
            {/* Top Left: Bentley Logo */}
            <div className="flex items-center gap-2.5">
              <img
                src={logoBentley}
                alt="Bentley Mobile Car Wash"
                className="h-9 sm:h-10 w-auto object-contain filter drop-shadow-xs"
              />
            </div>
          </div>
        </header>

        {/* RESPONSIVE ORDER CARDS CONTAINER */}
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 flex-1">
          {/* TAB 1: ORDERS WORKSPACE (Live Requests & My Active) */}
          {driverTab === 'orders' && (
            <div className="flex flex-col gap-5">
              {/* Top Sub-tab Switcher Pills */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-3">
                <div className="inline-flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-2xl border border-gray-200/80 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      setOrdersSubTab('available')
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      ordersSubTab === 'available'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Radio className={`w-3.5 h-3.5 ${ordersSubTab === 'available' ? 'animate-pulse' : ''}`} />
                    <span>Live Requests</span>
                    <span
                      className={`min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-black rounded-full leading-none ${
                        ordersSubTab === 'available'
                          ? 'bg-white text-primary'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {availableOrders.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOrdersSubTab('active')
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      ordersSubTab === 'active'
                        ? 'bg-secondary text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>My Active</span>
                    <span
                      className={`min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-black rounded-full leading-none ${
                        ordersSubTab === 'active'
                          ? 'bg-white text-secondary'
                          : 'bg-secondary/10 text-secondary'
                      }`}
                    >
                      {myActiveOrders.length}
                    </span>
                  </button>
                </div>

                <div className="text-[11px] text-gray-500 font-medium">
                  {ordersSubTab === 'available'
                    ? `${availableOrders.length} incoming customer requests`
                    : `${myActiveOrders.length} orders currently assigned to you`}
                </div>
              </div>

              {/* Sub-tab 1: Available Live Orders */}
              {ordersSubTab === 'available' && (
                <>
                  {availableOrders.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-xs">
                      <CheckCircle2 className="w-12 h-12 text-gray-300 mb-2 stroke-[1.5]" />
                      <span className="text-base font-bold text-gray-800">No pending orders right now</span>
                      <p className="text-xs text-gray-400 mt-1 max-w-sm">
                        New customer car wash and detailing requests will appear here in real-time.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                      {availableOrders.map((booking) => (
                        <div
                          key={booking.id}
                          className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3.5"
                        >
                          {/* Customer & Distance */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary-light border border-primary-border/60 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                {booking.customerName.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs sm:text-sm font-bold text-gray-900">
                                  {booking.customerName}
                                </span>
                                <span className="text-[11px] text-gray-500 font-medium">
                                  {booking.vehicle} ({booking.vehicleType || 'Vehicle'})
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end">
                              <span className="text-sm sm:text-base font-black text-primary font-mono">
                                {booking.price}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 mt-0.5">
                                {booking.distanceKm ? `${booking.distanceKm} km away` : 'Available'}
                              </span>
                            </div>
                          </div>

                          {/* Address & Time */}
                          <div className="flex flex-col gap-1.5 text-xs text-gray-600 bg-surface-subtle p-3 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="truncate">{booking.address}</span>
                            </div>
                            <div className="flex items-center justify-between text-gray-500 text-[11px]">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span>{booking.date} at {booking.time}</span>
                              </span>
                              <span className="font-semibold text-gray-700">{booking.title}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setSelectedDetailBooking(booking)}
                              className="px-3.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                              title="View Order Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Details</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAccept(booking)}
                              className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-98 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Accept Request</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Sub-tab 2: My Active Accepted Orders */}
              {ordersSubTab === 'active' && (
                <>
                  {myActiveOrders.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-xs">
                      <Truck className="w-12 h-12 text-gray-300 mb-2 stroke-[1.5]" />
                      <span className="text-base font-bold text-gray-800">No active deliveries in progress</span>
                      <p className="text-xs text-gray-400 mt-1 max-w-sm">
                        Accept a live order from the "Live Requests" tab to start your delivery route.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                      {myActiveOrders.map((booking) => (
                        <div
                          key={booking.id}
                          className="p-4 sm:p-5 rounded-3xl bg-white border-2 border-primary/20 shadow-md flex flex-col justify-between gap-3.5 relative overflow-hidden"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 uppercase flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                <span>{booking.status.replace('_', ' ')}</span>
                              </span>
                            </div>
                            <span className="text-sm sm:text-base font-black text-primary font-mono">
                              {booking.price}
                            </span>
                          </div>

                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-sm font-bold text-gray-900">{booking.customerName}</h3>
                              <p className="text-xs text-gray-500 font-medium">{booking.vehicle}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[220px]">
                                {booking.address}
                              </p>
                            </div>
                          </div>

                          {/* Progress Flow Actions */}
                          <div className="flex flex-col gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setSelectedBookingForMap(booking)}
                              className="w-full py-2.5 rounded-xl bg-secondary hover:bg-neutral-900 active:scale-98 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                            >
                              <Navigation className="w-3.5 h-3.5 fill-white" />
                              <span>Open Live Map & Route</span>
                            </button>

                            <div className="grid grid-cols-2 gap-2">
                              {booking.status === 'accepted' && (
                                <button
                                  type="button"
                                  onClick={() => onUpdateStatus(booking.id, 'en_route')}
                                  className="w-full py-2 rounded-xl bg-primary hover:bg-primary-hover active:scale-98 text-white text-[11px] font-bold transition-all cursor-pointer"
                                >
                                  Mark En Route
                                </button>
                              )}

                              {booking.status === 'en_route' && (
                                <button
                                  type="button"
                                  onClick={() => onUpdateStatus(booking.id, 'in_progress')}
                                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-[11px] font-bold transition-all cursor-pointer"
                                >
                                  Start Washing
                                </button>
                              )}

                              {booking.status === 'in_progress' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      !booking.paymentStatus ||
                                      booking.paymentStatus !== 'paid' ||
                                      booking.paymentMethod?.toLowerCase().includes('cash') ||
                                      booking.paymentMethod?.toLowerCase().includes('delivery') ||
                                      booking.paymentMethod?.toLowerCase().includes('completion')
                                    ) {
                                      setCodPaymentBooking(booking)
                                    } else {
                                      onUpdateStatus(booking.id, 'completed')
                                      showToast('Service marked as completed!', 'success')
                                    }
                                  }}
                                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-[11px] font-bold transition-all cursor-pointer col-span-2 shadow-xs"
                                >
                                  Complete Service & Collect COD
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelectedDetailBooking(booking)}
                                className={`py-2 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-98 text-gray-700 text-[11px] font-bold transition-all cursor-pointer ${
                                  booking.status === 'in_progress' ? 'hidden' : ''
                                }`}
                              >
                                Details
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 2: COMPLETED HISTORY WORKSPACE */}
          {driverTab === 'history' && (
            <div className="flex flex-col gap-5">
              {/* Summary Header */}
              <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
                    <History className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">Completed Wash History</h3>
                    <p className="text-xs text-gray-500">Record of all your fulfilled customer dispatches</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{completedOrders.length} Washes Completed</span>
                  </span>
                </div>
              </div>

              {completedOrders.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-xs">
                  <CheckCircle2 className="w-12 h-12 text-gray-300 mb-2 stroke-[1.5]" />
                  <span className="text-base font-bold text-gray-800">No completed deliveries yet</span>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm">
                    Completed car washes will be recorded here with delivery receipts and COD collection status.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {completedOrders.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs sm:text-sm font-bold text-gray-900 truncate max-w-[180px]">
                            {booking.title}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-emerald-600 font-mono">
                          +{booking.price}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 bg-surface-subtle p-2.5 rounded-2xl">
                        <span>Customer: <strong className="text-gray-800">{booking.customerName}</strong></span>
                        <span className="truncate">{booking.vehicle}</span>
                      </div>

                      <div className="text-[11px] text-gray-400 truncate">
                        {booking.address}
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                        <span className="text-gray-400">Completed: {booking.date}</span>
                        <div className="flex items-center gap-1.5">
                          {booking.paymentStatus === 'paid' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Paid ({booking.paymentCollectedMethod || 'Cash'}) ✓
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Payment Pending
                            </span>
                          )}
                          <span className="text-emerald-600 font-bold">Fulfilled ✓</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 5. BOTTOM NAVIGATION TABS (Visible across Orders, History, and Profile) */}
      {!selectedBookingForMap && (
        <DriverBottomNav
          currentTab={driverTab}
          onTabChange={(tab) => {
            setDriverTab(tab)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          ordersBadge={availableOrders.length}
          historyBadge={completedOrders.length}
        />
      )}

      {/* COD Payment Confirmation Modal */}
      {codPaymentBooking && (
        <CodPaymentModal
          isOpen={!!codPaymentBooking}
          onClose={() => setCodPaymentBooking(null)}
          booking={codPaymentBooking}
          driverName={profile.name}
          onConfirmPayment={(paymentData) => {
            onUpdateStatus(codPaymentBooking.id, 'completed', undefined, paymentData)
            setCodPaymentBooking(null)
            showToast(
              paymentData.paymentStatus === 'paid'
                ? `Payment recorded via ${paymentData.paymentCollectedMethod || 'Cash'} & order completed!`
                : 'Order marked as completed (Payment Pending).',
              'success'
            )
          }}
        />
      )}
    </div>
  )
}

export const DriverDashboardPage = DriverDashboard
export default DriverDashboard
