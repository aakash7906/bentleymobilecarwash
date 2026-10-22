import React, { useState } from 'react'
import {
  Truck,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  Navigation,
  Sparkles,
  ChevronRight,
  User,
  Power,
  RotateCcw,
  Eye,
  AlertCircle,
  Car,
  ArrowRight,
  ShieldCheck,
  X,
  Calendar,
  Layers,
  LogOut,
} from 'lucide-react'
import { BookingRecord, BookingStatus, DriverProfile } from '@/types'
import { DriverMapView } from './DriverMapView'
import { DriverProfilePage } from './DriverProfilePage'
import { useToast } from '@/context/ToastContext'

interface DriverDashboardProps {
  bookings: BookingRecord[]
  onAcceptOrder: (bookingId: string) => void
  onUpdateStatus: (bookingId: string, newStatus: BookingStatus, coords?: [number, number]) => void
  onSwitchToCustomer: () => void
  onLogout: () => void
  driverName?: string
  driverEmail?: string
  driverProfile?: DriverProfile
  onUpdateDriverProfile?: (updated: DriverProfile) => void
}

const DEFAULT_DRIVER_PROFILE: DriverProfile = {
  name: 'Alex Rivera',
  email: 'driver@bentleycarwash.com',
  phone: '+1 (800) 555-9274',
  vanModel: 'Mercedes-Benz Sprinter 2500',
  licensePlate: 'BC-8492',
  serviceArea: 'Ontario & Greater Toronto Area',
  driverLicenseNumber: 'DL-ON-992014-B',
  bio: 'Certified IDA Mobile Detailing Specialist with 6+ years experience in luxury, exotic, and daily driver preservation.',
  emergencyContact: '+1 (998) 555-0199',
  avatar:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  isAvailable: true,
  rating: 4.95,
  totalJobs: 142,
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  bookings,
  onAcceptOrder,
  onUpdateStatus,
  onSwitchToCustomer,
  onLogout,
  driverName = 'Alex Rivera',
  driverEmail = 'driver@bentleycarwash.com',
  driverProfile: externalProfile,
  onUpdateDriverProfile,
}) => {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>('available')
  const [selectedBookingForMap, setSelectedBookingForMap] = useState<BookingRecord | null>(null)
  const [selectedDetailBooking, setSelectedDetailBooking] = useState<BookingRecord | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  // Driver profile state with external prop syncing & fallback
  const [profile, setProfile] = useState<DriverProfile>(() => {
    if (externalProfile) return externalProfile
    try {
      const stored = localStorage.getItem('bentley_driver_profile')
      if (stored) return JSON.parse(stored)
    } catch {}
    return {
      ...DEFAULT_DRIVER_PROFILE,
      name: driverName || DEFAULT_DRIVER_PROFILE.name,
      email: driverEmail || DEFAULT_DRIVER_PROFILE.email,
    }
  })

  // Synchronize if externalProfile changes
  React.useEffect(() => {
    if (externalProfile) {
      setProfile(externalProfile)
    }
  }, [externalProfile])

  // Categorize orders
  const availableOrders = bookings.filter(
    (b) => b.status === 'pending' || (b.status === 'scheduled' && !b.driverId)
  )

  const myActiveOrders = bookings.filter(
    (b) => b.status === 'accepted' || b.status === 'en_route' || b.status === 'in_progress'
  )

  const completedOrders = bookings.filter((b) => b.status === 'completed')

  // Handle saving driver profile updates
  const handleSaveProfile = (updated: DriverProfile) => {
    setProfile(updated)
    try {
      localStorage.setItem('bentley_driver_profile', JSON.stringify(updated))
    } catch {}

    if (onUpdateDriverProfile) {
      onUpdateDriverProfile(updated)
    }
  }

  // Handle accepting order
  const handleAccept = (booking: BookingRecord) => {
    onAcceptOrder(booking.id)
    showToast(`Order #${booking.id} accepted! Opening live route navigation.`, 'success')
    // Open map right away for seamless dispatch
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
      {/* 1. DRIVER PROFILE MODAL */}
      <DriverProfilePage
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
        totalCompletedJobs={completedOrders.length > 0 ? completedOrders.length + 80 : profile.totalJobs || 120}
        onLogout={onLogout}
      />

      {/* 2. DRIVER MAP MODAL */}
      {selectedBookingForMap && (
        <DriverMapView
          booking={
            bookings.find((b) => b.id === selectedBookingForMap.id) || selectedBookingForMap
          }
          onBack={() => setSelectedBookingForMap(null)}
          onUpdateStatus={(id, status, coords) => {
            onUpdateStatus(id, status, coords)
            if (status === 'completed') {
              setSelectedBookingForMap(null)
              showToast('Wash completed! Order recorded in history.', 'success')
            }
          }}
        />
      )}

      {/* 3. ORDER DETAILS MODAL */}
      {selectedDetailBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200">
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
                  <a
                    href={`tel:${selectedDetailBooking.customerPhone}`}
                    className="text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{selectedDetailBooking.customerPhone}</span>
                  </a>
                </div>
                <span className="text-gray-600">{selectedDetailBooking.address}</span>
              </div>

              <div className="p-3.5 bg-surface-subtle rounded-2xl border border-gray-100 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  Vehicle & Service
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{selectedDetailBooking.vehicle}</span>
                  <span className="font-mono font-bold text-primary">
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
                  {selectedDetailBooking.paymentMethod || 'Pay on Completion'}
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
          </div>
        </div>
      )}

      {/* 4. MAIN RESPONSIVE DASHBOARD LAYOUT */}
      <main className="w-full max-w-full min-h-screen bg-canvas flex flex-col">
        {/* TOP PROFILE & KPI HERO BAR */}
        <div className="w-full bg-white border-b border-gray-200/80 shadow-2xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-5 flex flex-col gap-4">
            {/* Top Row: Driver Profile & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {/* Driver info & clickable avatar */}
              <div
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-3 sm:gap-4 cursor-pointer group"
                title="Click to view & edit driver profile"
              >
                <div className="relative">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-primary/40 group-hover:ring-primary shadow-sm transition-all"
                  />
                  {profile.isAvailable !== false ? (
                    <span
                      className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white"
                      title="Online & Receiving Orders"
                    />
                  ) : (
                    <span
                      className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-gray-400 ring-2 ring-white"
                      title="Currently Offline"
                    />
                  )}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h1 className="text-base sm:text-lg font-black text-gray-900 tracking-tight group-hover:text-primary transition-colors">
                      {profile.name}
                    </h1>
                  </div>
                  <span className="text-xs text-gray-500 font-medium truncate max-w-[220px] sm:max-w-md">
                    {profile.vanModel} • <strong className="text-gray-800">{profile.licensePlate}</strong>
                  </span>
                </div>
              </div>

              {/* Top Logout Button */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 active:scale-95 border border-rose-200/60 transition-all cursor-pointer shadow-2xs"
                  title="Log out from Driver account"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />            
                </button>
              </div>
            </div>

            {/* Quick Metrics KPI Cards (Responsive 3-Column Grid) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-2xl bg-surface-subtle border border-gray-100 flex flex-col shadow-xs">
                <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Live Requests
                </span>
                <span className="text-xl sm:text-2xl font-black text-primary font-mono mt-0.5">
                  {availableOrders.length}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 hidden sm:block">
                  Ready to claim
                </span>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-surface-subtle border border-gray-100 flex flex-col shadow-xs">
                <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Active Dispatches
                </span>
                <span className="text-xl sm:text-2xl font-black text-secondary font-mono mt-0.5">
                  {myActiveOrders.length}
                </span>
                <span className="text-[10px] text-primary font-semibold mt-0.5 hidden sm:block">
                  In progress
                </span>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-surface-subtle border border-gray-100 flex flex-col shadow-xs">
                <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Completed Washes
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono mt-0.5">
                  {completedOrders.length}
                </span>
                <span className="text-[10px] text-gray-400 font-semibold mt-0.5 hidden sm:block">
                  Verified receipts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* STICKY TAB CONTROLLER BAR */}
        <div className="w-full bg-white border-b border-gray-200/80 sticky top-0 z-20 shadow-2xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('available')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-center relative ${
                activeTab === 'available'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-alt hover:bg-gray-200 text-gray-700'
              }`}
            >
              <span>Live Requests ({availableOrders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-center relative ${
                activeTab === 'active'
                  ? 'bg-secondary text-white shadow-xs'
                  : 'bg-surface-alt hover:bg-gray-200 text-gray-700'
              }`}
            >
              <span>My Active ({myActiveOrders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-center relative ${
                activeTab === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-surface-alt hover:bg-gray-200 text-gray-700'
              }`}
            >
              <span>Completed ({completedOrders.length})</span>
            </button>
          </div>
        </div>

        {/* RESPONSIVE ORDER CARDS CONTAINER */}
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 flex-1 pb-28">
          {/* TAB 1: AVAILABLE LIVE ORDERS */}
          {activeTab === 'available' && (
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
                            {booking.distanceKm || 2.8} km away
                          </span>
                        </div>
                      </div>

                      {/* Address & Time Slot */}
                      <div className="flex flex-col gap-1 text-xs bg-surface-subtle p-3 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-medium truncate">{booking.address}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>Scheduled: {booking.date} at {booking.time}</span>
                        </div>
                      </div>

                      {/* Package Name */}
                      <div className="flex items-center justify-between text-xs text-gray-600 px-1">
                        <span>Package: <strong className="text-gray-900">{booking.title}</strong></span>
                        <span className="text-gray-400 text-[11px]">ID: {booking.id}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailBooking(booking)}
                          className="py-2.5 px-3.5 rounded-xl border border-gray-200 bg-surface-alt hover:bg-gray-200 text-gray-700 text-xs font-semibold active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAccept(booking)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accept & Dispatch</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB 2: MY ACTIVE ACCEPTED ORDERS */}
          {activeTab === 'active' && (
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
                          <span className="text-[11px] font-mono text-gray-400">{booking.id}</span>
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

                        <a
                          href={`tel:${booking.customerPhone}`}
                          className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center hover:bg-emerald-100 transition-colors shadow-xs"
                          title="Call Customer"
                        >
                          <Phone className="w-4 h-4 fill-emerald-600" />
                        </a>
                      </div>

                      {/* Navigation CTA Bar */}
                      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setSelectedBookingForMap(booking)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Navigation className="w-4 h-4 fill-white" />
                          <span>Live Navigation</span>
                        </button>

                        {booking.status === 'accepted' && (
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateStatus(booking.id, 'en_route')
                              showToast('Status updated to En Route', 'info')
                            }}
                            className="py-2.5 px-3 rounded-xl bg-secondary hover:bg-black text-white text-xs font-bold active:scale-98 transition-all cursor-pointer"
                            title="Mark as En Route"
                          >
                            En Route
                          </button>
                        )}

                        {booking.status === 'en_route' && (
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateStatus(booking.id, 'in_progress')
                              showToast('Status updated to In Progress', 'info')
                            }}
                            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold active:scale-98 transition-all cursor-pointer"
                            title="Start Washing Service"
                          >
                            Start Wash
                          </button>
                        )}

                        {booking.status === 'in_progress' && (
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateStatus(booking.id, 'completed')
                              showToast('Service marked as Completed!', 'success')
                            }}
                            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold active:scale-98 transition-all cursor-pointer"
                            title="Complete Wash Job"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB 3: COMPLETED ORDERS */}
          {activeTab === 'completed' && (
            <>
              {completedOrders.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-xs">
                  <CheckCircle2 className="w-12 h-12 text-gray-300 mb-2 stroke-[1.5]" />
                  <span className="text-base font-bold text-gray-800">No completed deliveries yet</span>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm">
                    Completed car washes will be recorded here with delivery receipts.
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
                        <span className="text-emerald-600 font-bold">Fulfilled ✓</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
