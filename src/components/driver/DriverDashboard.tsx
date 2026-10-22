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
import { BookingRecord, BookingStatus } from '@/types'
import { DriverMapView } from './DriverMapView'
import logoBentley from '@/assets/Logo_Bentley.png'

interface DriverDashboardProps {
  bookings: BookingRecord[]
  onAcceptOrder: (bookingId: string) => void
  onUpdateStatus: (bookingId: string, newStatus: BookingStatus, coords?: [number, number]) => void
  onSwitchToCustomer: () => void
  onLogout: () => void
  driverName?: string
  driverEmail?: string
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  bookings,
  onAcceptOrder,
  onUpdateStatus,
  onSwitchToCustomer,
  onLogout,
  driverName = 'Alex Rivera',
  driverEmail = 'driver@bentleycarwash.com',
}) => {
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>('available')
  const [isOnline, setIsOnline] = useState(true)
  const [selectedBookingForMap, setSelectedBookingForMap] = useState<BookingRecord | null>(null)
  const [selectedDetailBooking, setSelectedDetailBooking] = useState<BookingRecord | null>(null)

  // Categorize orders
  const availableOrders = bookings.filter(
    (b) => b.status === 'pending' || (b.status === 'scheduled' && !b.driverId)
  )

  const myActiveOrders = bookings.filter(
    (b) => b.status === 'accepted' || b.status === 'en_route' || b.status === 'in_progress'
  )

  const completedOrders = bookings.filter((b) => b.status === 'completed')

  // Handle accepting order
  const handleAccept = (booking: BookingRecord) => {
    onAcceptOrder(booking.id)
    // Open map right away for seamless dispatch
    setSelectedBookingForMap({
      ...booking,
      status: 'accepted',
      driverName,
      driverPhone: '+1 (800) 555-9274',
      driverVanNumber: 'Van #04',
    })
  }

  return (
    <div className="w-full min-h-screen bg-canvas flex justify-center selection:bg-primary selection:text-primary-foreground">
      {/* 1. DRIVER MAP MODAL */}
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
            }
          }}
        />
      )}

      {/* 2. ORDER DETAILS MODAL */}
      {selectedDetailBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-gray-900">Order Information</h3>
              </div>
              <button
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
                  <span className="font-bold text-sm text-gray-900">{selectedDetailBooking.customerName}</span>
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
                <span className="text-[10px] font-bold text-gray-500 uppercase">Vehicle & Service</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{selectedDetailBooking.vehicle}</span>
                  <span className="font-mono font-bold text-primary">{selectedDetailBooking.price}</span>
                </div>
                <span className="text-gray-600">Service: {selectedDetailBooking.title}</span>
                {selectedDetailBooking.licensePlate && (
                  <span className="text-gray-500 text-[11px]">Plate: {selectedDetailBooking.licensePlate}</span>
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
                <span className="font-bold">{selectedDetailBooking.date} • {selectedDetailBooking.time}</span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl text-gray-700">
                <span className="font-medium">Payment Mode:</span>
                <span className="font-bold">{selectedDetailBooking.paymentMethod || 'Pay on Completion'}</span>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              {(selectedDetailBooking.status === 'pending' || (selectedDetailBooking.status === 'scheduled' && !selectedDetailBooking.driverId)) ? (
                <button
                  onClick={() => {
                    handleAccept(selectedDetailBooking)
                    setSelectedDetailBooking(null)
                  }}
                  className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Order & Start Navigation</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedBookingForMap(selectedDetailBooking)
                    setSelectedDetailBooking(null)
                  }}
                  className="w-full py-3 rounded-xl bg-secondary hover:bg-black text-white text-xs font-bold shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-4 h-4 fill-white" />
                  <span>Open Live Map & Route</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN DASHBOARD CONTAINER */}
      <main className="w-full max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl min-h-screen bg-white shadow-2xl flex flex-col border-x border-gray-100">
        {/* Driver Header Profile & Online Toggle */}
        <div className="p-4 sm:p-5 bg-white border-b border-gray-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-lg ring-2 ring-primary/30 shrink-0">
                  {driverName.charAt(0)}
                </div>
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-extrabold text-gray-900 tracking-tight">{driverName}</h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider">
                    Driver
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 truncate max-w-[160px] sm:max-w-xs">{driverEmail}</span>
              </div>
            </div>

            {/* Top Action Buttons: Customer Switcher & Logout */}
            <div className="flex items-center gap-2">
              <button
                onClick={onSwitchToCustomer}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                title="Switch to Customer Mode"
              >
                <User className="w-3.5 h-3.5" />
                <span>Customer Mode</span>
              </button>

              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 active:scale-95 border border-rose-200/60 transition-all cursor-pointer shadow-2xs"
                title="Log out from Driver account"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics KPI Bar */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="p-3.5 rounded-2xl bg-surface-subtle border border-gray-100 flex flex-col shadow-xs">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Available</span>
              <span className="text-xl font-extrabold text-primary font-mono mt-0.5">
                {availableOrders.length}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">Ready to claim</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-subtle border border-gray-100 flex flex-col shadow-xs">
              <span className="text-[10px] font-bold text-gray-500 uppercase">My Active</span>
              <span className="text-xl font-extrabold text-secondary font-mono mt-0.5">
                {myActiveOrders.length}
              </span>
              <span className="text-[10px] text-primary font-medium">In progress</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-subtle border border-gray-100 flex flex-col shadow-xs">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Completed</span>
              <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5">
                {completedOrders.length}
              </span>
              <span className="text-[10px] text-gray-400">Fulfilled washes</span>
            </div>
          </div>
        </div>

        {/* Order Filters Tabs */}
        <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex items-center gap-2 bg-white sticky top-0 z-10">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center relative ${
              activeTab === 'available'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-alt hover:bg-gray-200 text-gray-700'
            }`}
          >
            <span>Live Requests ({availableOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center relative ${
              activeTab === 'active'
                ? 'bg-secondary text-white shadow-xs'
                : 'bg-surface-alt hover:bg-gray-200 text-gray-700'
            }`}
          >
            <span>My Active ({myActiveOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center relative ${
              activeTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-surface-alt hover:bg-gray-200 text-gray-700'
            }`}
          >
            <span>Completed ({completedOrders.length})</span>
          </button>
        </div>

        {/* Order Cards List Container */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col gap-3.5 pb-24">
          {/* TAB 1: AVAILABLE LIVE ORDERS */}
          {activeTab === 'available' && (
            <>
              {availableOrders.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400">
                  <CheckCircle2 className="w-12 h-12 text-gray-300 mb-2 stroke-[1.5]" />
                  <span className="text-sm font-bold text-gray-700">No pending orders right now</span>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    New customer car wash and detailing requests will appear here in real-time.
                  </p>
                </div>
              ) : (
                availableOrders.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col gap-3"
                  >
                    {/* Header: Customer & Distance */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-light border border-primary-border/60 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {booking.customerName.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-900">{booking.customerName}</span>
                          <span className="text-[11px] text-gray-500 font-medium">
                            {booking.vehicle} ({booking.vehicleType || 'Sedan'})
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="text-sm font-extrabold text-primary font-mono">
                          {booking.price}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 mt-0.5">
                          {booking.distanceKm || 2.8} km away
                        </span>
                      </div>
                    </div>

                    {/* Address & Time Slot */}
                    <div className="flex flex-col gap-1 text-xs bg-surface-subtle p-2.5 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-medium truncate">{booking.address}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>Scheduled: {booking.date} at {booking.time}</span>
                      </div>
                    </div>

                    {/* Package Name & Included Items */}
                    <div className="flex items-center justify-between text-xs text-gray-600 px-1">
                      <span>Package: <strong className="text-gray-900">{booking.title}</strong></span>
                      <span className="text-gray-400 text-[11px]">ID: {booking.id}</span>
                    </div>

                    {/* Action Buttons: View Details & Accept Order */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedDetailBooking(booking)}
                        className="py-2.5 px-3 rounded-xl border border-gray-200 bg-surface-alt hover:bg-gray-200 text-gray-700 text-xs font-semibold active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
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
                        <span>Accept & Start Delivery</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* TAB 2: MY ACTIVE ACCEPTED ORDERS */}
          {activeTab === 'active' && (
            <>
              {myActiveOrders.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400">
                  <Truck className="w-12 h-12 text-gray-300 mb-2 stroke-[1.5]" />
                  <span className="text-sm font-bold text-gray-700">No active deliveries in progress</span>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    Accept a live order from the "Live Requests" tab to start your delivery route.
                  </p>
                </div>
              ) : (
                myActiveOrders.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 rounded-2xl bg-white border-2 border-primary/20 shadow-md flex flex-col gap-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 uppercase flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          <span>Status: {booking.status.replace('_', ' ')}</span>
                        </span>
                        <span className="text-[11px] font-mono text-gray-400">{booking.id}</span>
                      </div>
                      <span className="text-sm font-black text-primary font-mono">{booking.price}</span>
                    </div>

                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{booking.customerName}</h3>
                        <p className="text-xs text-gray-500">{booking.vehicle}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[260px]">
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
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedBookingForMap(booking)}
                        className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Navigation className="w-4 h-4 fill-white" />
                        <span>Open Live Navigation Map</span>
                      </button>

                      {booking.status === 'accepted' && (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(booking.id, 'en_route')}
                          className="py-3 px-3 rounded-xl bg-secondary hover:bg-black text-white text-xs font-bold active:scale-98 transition-all cursor-pointer"
                          title="Mark as En Route"
                        >
                          En Route
                        </button>
                      )}

                      {booking.status === 'en_route' && (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(booking.id, 'in_progress')}
                          className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold active:scale-98 transition-all cursor-pointer"
                          title="Mark Arrived"
                        >
                          Arrived
                        </button>
                      )}

                      {booking.status === 'in_progress' && (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(booking.id, 'completed')}
                          className="py-3 px-3 rounded-xl bg-secondary hover:bg-black text-white text-xs font-bold active:scale-98 transition-all cursor-pointer"
                          title="Mark Completed"
                        >
                          Finish
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* TAB 3: COMPLETED ORDERS */}
          {activeTab === 'completed' && (
            <>
              {completedOrders.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400">
                  <CheckCircle2 className="w-12 h-12 text-gray-300 mb-2 stroke-[1.5]" />
                  <span className="text-sm font-bold text-gray-700">No completed deliveries yet</span>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    Completed car washes will be recorded here with delivery receipts.
                  </p>
                </div>
              ) : (
                completedOrders.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-gray-900">{booking.title}</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 font-mono">
                        +{booking.price}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Customer: {booking.customerName}</span>
                      <span>{booking.vehicle}</span>
                    </div>

                    <div className="text-[11px] text-gray-400 truncate">
                      {booking.address}
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">Completed: {booking.date}</span>
                      {/* <button
                        onClick={() => setSelectedDetailBooking(booking)}
                        className="text-primary font-bold hover:underline cursor-pointer"
                      >
                        View Receipt →
                      </button> */}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
