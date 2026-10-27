import React, { useState } from 'react'
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  Receipt,
  X,
  Star,
  RotateCcw,
  Ban,
  CheckCircle,
} from 'lucide-react'
import { ServiceItem, BookingRecord, BookingStatus, DriverProfile } from '@/types'
import { SERVICES_CATALOG } from '@/data/mockData'
import { OrderTrackingMapPage } from '@/pages/Orders/OrderTrackingMapPage'
import { InvoiceModal } from '@/pages/Orders/InvoiceModal'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

interface BookingsTabProps {
  onBack: () => void
  onBookAgain: (service: ServiceItem) => void
  onViewServiceDetail: (service: ServiceItem) => void
  currentVehicle: string
  bookings?: BookingRecord[]
  driverProfile?: DriverProfile
  onCancelBooking?: (bookingId: string) => void
  onRescheduleBooking?: (bookingId: string, newDate: string, newTime: string) => void
  onRateBooking?: (bookingId: string, rating: number, review: string) => void
}

const RESCHEDULE_TIME_SLOTS = [
  '09:00 AM',
  '11:00 AM',
  '01:30 PM',
  '03:30 PM',
  '05:00 PM',
]

const getDynamicRescheduleDates = (): string[] => {
  const dates: string[] = []
  const today = new Date()
  for (let i = 1; i <= 6; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dayName = i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'long' })
    const month = d.toLocaleDateString('en-US', { month: 'short' })
    const dayNum = d.getDate()
    dates.push(`${dayName}, ${month} ${dayNum}`)
  }
  return dates
}

const RESCHEDULE_DATES = getDynamicRescheduleDates()

export const BookingsTab: React.FC<BookingsTabProps> = ({
  onBack,
  onBookAgain,
  onViewServiceDetail,
  currentVehicle,
  bookings = [],
  driverProfile,
  onCancelBooking,
  onRescheduleBooking,
  onRateBooking,
}) => {
  const [trackingModalOpen, setTrackingModalOpen] = useState(() => {
    try {
      return localStorage.getItem('bentley_customer_tracking_open') === 'true'
    } catch {
      return false
    }
  })
  const [activeTrackingBooking, setActiveTrackingBooking] = useState<BookingRecord | null>(() => {
    try {
      const savedId = localStorage.getItem('bentley_customer_tracking_id')
      if (savedId && Array.isArray(bookings)) {
        return bookings.find((b) => b.id === savedId) || null
      }
    } catch { }
    return null
  })
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<BookingRecord | null>(null)

  // Persist tracking modal state across refreshes
  React.useEffect(() => {
    try {
      if (trackingModalOpen && activeTrackingBooking) {
        localStorage.setItem('bentley_customer_tracking_open', 'true')
        localStorage.setItem('bentley_customer_tracking_id', activeTrackingBooking.id)
      } else {
        localStorage.removeItem('bentley_customer_tracking_open')
        localStorage.removeItem('bentley_customer_tracking_id')
      }
    } catch { }
  }, [trackingModalOpen, activeTrackingBooking])

  // Restore active tracking booking if bookings array is loaded asynchronously
  React.useEffect(() => {
    if (!activeTrackingBooking && trackingModalOpen && bookings.length > 0) {
      try {
        const savedId = localStorage.getItem('bentley_customer_tracking_id')
        if (savedId) {
          const found = bookings.find((b) => b.id === savedId)
          if (found) {
            setActiveTrackingBooking(found)
          }
        }
      } catch { }
    }
  }, [bookings, trackingModalOpen, activeTrackingBooking])

  // Reschedule Modal State
  const [rescheduleTarget, setRescheduleTarget] = useState<BookingRecord | null>(null)
  const [newSelectedDate, setNewSelectedDate] = useState(RESCHEDULE_DATES[0])
  const [newSelectedTime, setNewSelectedTime] = useState(RESCHEDULE_TIME_SLOTS[1])

  // Cancel Modal State
  const [cancelTarget, setCancelTarget] = useState<BookingRecord | null>(null)

  // Rating Modal State
  const [ratingTarget, setRatingTarget] = useState<BookingRecord | null>(null)
  const [ratingStars, setRatingStars] = useState(5)
  const [ratingComment, setRatingComment] = useState('')

  // Split bookings into active and past
  const activeBookings = bookings.filter(
    (b) =>
      b.status === 'scheduled' ||
      b.status === 'en_route' ||
      b.status === 'in_progress' ||
      b.status === 'pending' ||
      b.status === 'accepted'
  )
  const pastBookings = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled'
  )

  const getDynamicDriverName = (booking: BookingRecord) => {
    const raw = (booking.driverName || booking.technicianName || '').trim()
    if (raw && raw.toLowerCase() !== 'alex rivera') {
      return raw
    }
    if (
      (booking.status === 'accepted' || booking.status === 'en_route' || booking.status === 'in_progress') &&
      driverProfile?.name &&
      driverProfile.name.trim().toLowerCase() !== 'alex rivera'
    ) {
      return driverProfile.name.trim()
    }
    return ''
  }

  const handleTrackOrder = (booking: BookingRecord) => {
    if (booking.status !== 'accepted' && booking.status !== 'en_route' && booking.status !== 'in_progress') {
      alert('This booking has not been accepted by a driver yet. Live tracking unlocks once a driver accepts your booking.')
      return
    }
    const resolvedName = getDynamicDriverName(booking)
    const enrichedBooking: BookingRecord = {
      ...booking,
      driverName: resolvedName || (booking.driverName && booking.driverName.toLowerCase() !== 'alex rivera' ? booking.driverName : ''),
      technicianName: resolvedName || (booking.technicianName && booking.technicianName.toLowerCase() !== 'alex rivera' ? booking.technicianName : ''),
    }
    setActiveTrackingBooking(enrichedBooking)
    setTrackingModalOpen(true)
  }

  const handleConfirmReschedule = () => {
    if (rescheduleTarget && onRescheduleBooking) {
      onRescheduleBooking(rescheduleTarget.id, newSelectedDate, newSelectedTime)
    }
    setRescheduleTarget(null)
  }

  const handleConfirmCancel = () => {
    if (cancelTarget && onCancelBooking) {
      onCancelBooking(cancelTarget.id)
    }
    setCancelTarget(null)
  }

  const handleConfirmRating = () => {
    if (ratingTarget && onRateBooking) {
      onRateBooking(ratingTarget.id, ratingStars, ratingComment)
    }
    setRatingTarget(null)
    setRatingStars(5)
    setRatingComment('')
  }

  const renderStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-0.5 rounded-sm bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending Driver
          </span>
        )
      case 'accepted':
        return (
          <span className="px-2.5 py-0.5 rounded-sm bg-teal-50 text-teal-700 text-[10px] font-bold border border-teal-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            Driver Accepted
          </span>
        )
      case 'scheduled':
        return (
          <span className="px-2.5 py-0.5 rounded-sm bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
            Scheduled
          </span>
        )
      case 'en_route':
        return (
          <span className="px-2.5 py-0.5 rounded-sm bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            Tech En Route
          </span>
        )
      case 'in_progress':
        return (
          <span className="px-2.5 py-0.5 rounded-sm bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
            In Progress
          </span>
        )
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
            Completed
          </span>
        )
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-sm bg-neutral-100 text-neutral-600 text-[10px] font-bold border border-neutral-200">
            Cancelled
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col w-full pb-28 screen-padding">
      {/* 1. Top Header */}
      <div className="py-2.5 flex items-center justify-between border-b border-gray-100">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>

        <h1 className="text-lg font-bold text-gray-900 text-center flex-1">
          Bookings
        </h1>

        <div className="w-9" />
      </div>

      {/* 2. Active Now Section */}
      <div className="mt-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">
            Active Appointments ({activeBookings.length})
          </h2>
        </div>

        {activeBookings.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white border border-gray-100 text-center flex flex-col items-center">
            <Calendar className="w-10 h-10 text-neutral-300 mb-2" />
            <p className="text-xs font-semibold text-neutral-700">No active bookings right now</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">Explore services to schedule your next detail</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {activeBookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col gap-3.5 transition-all hover:shadow-md"
              >
                {/* Top row: details + thumbnail */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col items-start gap-1 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-sm bg-primary text-primary-foreground text-[10px] font-bold">
                        {booking.category}
                      </span>
                      {renderStatusBadge(booking.status)}
                    </div>

                    <h3 className="text-base font-bold text-gray-900 leading-snug mt-0.5">
                      {booking.title}
                    </h3>
                    <span className="text-xs font-semibold text-primary">
                      {booking.vehicle}
                    </span>

                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-1">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      <span>{booking.date}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                      <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span className="truncate max-w-[200px]">{booking.address}</span>
                    </div>
                  </div>

                  {/* Thumbnail & Price */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="w-24 h-16 rounded-xl overflow-hidden bg-slate-100">
                      <img
                        src={booking.image}
                        alt={booking.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs font-extrabold text-primary font-mono">
                      {booking.price}
                    </span>
                  </div>
                </div>

                {/* Primary Button: Track Order (Only if booking has been accepted by driver) */}
                {booking.status === 'accepted' || booking.status === 'en_route' || booking.status === 'in_progress' ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleTrackOrder(booking)}
                    className="w-full bg-surface-alt hover:bg-[#e5e7eb] text-primary text-xs font-semibold cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <span>
                      {getDynamicDriverName(booking)
                        ? `Track Technician (${getDynamicDriverName(booking)}) >`
                        : 'Track Technician >'}
                    </span>
                  </Button>
                ) : (
                  <div className="w-full py-2 px-3 rounded-sm bg-amber-50/70 border border-amber-200/60 text-amber-800 text-[11px] font-medium text-center flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Awaiting Driver Acceptance</span>
                  </div>
                )}

                {/* Secondary Actions: Reschedule, Cancel, Invoice */}
                <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRescheduleTarget(booking)
                      setNewSelectedDate(RESCHEDULE_DATES[0])
                      setNewSelectedTime(booking.time || RESCHEDULE_TIME_SLOTS[1])
                    }}
                    className="flex-1 h-8 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-neutral-500" />
                    <span>Reschedule</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelTarget(booking)}
                    className="group flex-1 h-8 border border-neutral-200 bg-white hover:bg-red-50 text-neutral-700 hover:text-red-600 shadow-none font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Ban className="w-3 h-3 text-neutral-400 group-hover:text-red-500" />
                    <span>Cancel</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setSelectedInvoiceBooking(booking)}
                    className="h-8 w-8 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 flex items-center justify-center cursor-pointer shrink-0"
                    title="View Receipt"
                    aria-label="View Receipt"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Past Services Section */}
      <div className="mt-6 flex flex-col gap-3">
        <h2 className="text-sm font-bold text-gray-900 tracking-tight">
          Past Services ({pastBookings.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {pastBookings.map((booking) => (
            <div
              key={booking.id}
              className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col gap-3.5 transition-all hover:shadow-md"
            >
              {/* Top row: details + thumbnail */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col items-start gap-1 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-sm bg-primary text-primary-foreground text-[10px] font-bold">
                      {booking.category}
                    </span>
                    {renderStatusBadge(booking.status)}
                  </div>

                  <h3 className="text-base font-bold text-gray-900 leading-snug mt-0.5">
                    {booking.title}
                  </h3>
                  <span className="text-xs font-semibold text-primary">
                    {booking.vehicle}
                  </span>

                  <span className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-neutral-400" />
                    {booking.date}
                  </span>

                  {/* Rating display if present */}
                  {booking.rating ? (
                    <div className="flex items-center gap-1 mt-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${star <= (booking.rating || 0)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-neutral-300'
                              }`}
                          />
                        ))}
                      </div>
                      {booking.review && (
                        <span className="text-[10px] text-amber-900 italic line-clamp-1 max-w-[150px]">
                          "{booking.review}"
                        </span>
                      )}
                    </div>
                  ) : booking.status === 'completed' ? (
                    <button
                      onClick={() => setRatingTarget(booking)}
                      className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 mt-1 hover:underline"
                    >
                      <Star className="w-3 h-3" />
                      <span>Rate & Review Service</span>
                    </button>
                  ) : null}
                </div>

                {/* Thumbnail & Price */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="w-24 h-16 rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={booking.image}
                      alt={booking.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-extrabold text-primary font-mono">
                    {booking.price}
                  </span>
                </div>
              </div>

              {/* Bottom Buttons: View Detail, Book Again & Receipt */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const s =
                      booking.serviceItem ||
                      SERVICES_CATALOG.find((it) => it.title === booking.title) ||
                      SERVICES_CATALOG[0]
                    onViewServiceDetail(s)
                  }}
                  className="flex-1 bg-surface-alt hover:bg-[#e5e7eb] text-primary text-xs font-semibold cursor-pointer text-center"
                >
                  View Detail &gt;
                </Button>

                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => {
                    const s =
                      booking.serviceItem ||
                      SERVICES_CATALOG.find((it) => it.title === booking.title) ||
                      SERVICES_CATALOG[0]
                    onBookAgain(s)
                  }}
                  className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold shadow-xs cursor-pointer text-center"
                >
                  Book Again &gt;
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setSelectedInvoiceBooking(booking)}
                  className="h-8 w-8 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 flex items-center justify-center cursor-pointer shrink-0 shadow-xs"
                  title="View Invoice"
                  aria-label="View Invoice"
                >
                  <Receipt className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Live Order Tracking Map Page */}
      {trackingModalOpen && activeTrackingBooking && (
        <OrderTrackingMapPage
          onBack={() => setTrackingModalOpen(false)}
          booking={activeTrackingBooking}
          serviceTitle={activeTrackingBooking.title}
          serviceCategory={activeTrackingBooking.category}
          customerName={activeTrackingBooking.customerName}
          customerPhone={activeTrackingBooking.customerPhone}
          customerAddress={activeTrackingBooking.address}
          technicianName={getDynamicDriverName(activeTrackingBooking) || undefined}
          driverCoords={activeTrackingBooking.driverCoords}
          customerCoords={activeTrackingBooking.customerCoords}
          driverVanNumber={activeTrackingBooking.driverVanNumber}
          driverPhone={activeTrackingBooking.driverPhone}
          bookingStatus={activeTrackingBooking.status}
        />
      )}

      {/* 5. Digital Invoice Receipt Modal */}
      {selectedInvoiceBooking && (
        <InvoiceModal
          booking={selectedInvoiceBooking}
          onClose={() => setSelectedInvoiceBooking(null)}
        />
      )}

      {/* 6. Reschedule Modal Dialog */}
      <Dialog
        isOpen={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        maxWidth="sm"
        aria-labelledby="reschedule-modal-title"
      >
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-primary" />
            <h3 id="reschedule-modal-title" className="text-sm font-bold text-neutral-900">
              Reschedule Appointment
            </h3>
          </div>
          <button
            onClick={() => setRescheduleTarget(null)}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <p className="text-xs text-neutral-500 mb-2 font-medium">
            Select new appointment date:
          </p>
          <div className="flex flex-col gap-1.5">
            {RESCHEDULE_DATES.map((date) => (
              <button
                key={date}
                onClick={() => setNewSelectedDate(date)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold text-left transition ${newSelectedDate === date
                    ? 'bg-primary-light/40 border-primary text-primary'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
              >
                {date}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-neutral-500 mb-2 font-medium">
            Select preferred arrival time:
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {RESCHEDULE_TIME_SLOTS.map((time) => (
              <button
                key={time}
                onClick={() => setNewSelectedTime(time)}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold text-center transition ${newSelectedTime === time
                    ? 'bg-primary-light/40 border-primary text-primary'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRescheduleTarget(null)}
            className="flex-1 border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
          >
            Nevermind
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleConfirmReschedule}
            className="flex-1 bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs"
          >
            Confirm New Slot
          </Button>
        </div>
      </Dialog>

      {/* 7. Cancel Confirmation Modal */}
      <Dialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        maxWidth="sm"
        icon={<Ban className="w-6 h-6 stroke-[2]" />}
        iconVariant="danger"
        title="Cancel Appointment?"
        aria-labelledby="cancel-modal-title"
        description={
          cancelTarget ? (
            <>
              Are you sure you want to cancel your{' '}
              <strong className="text-neutral-800">{cancelTarget.title}</strong>{' '}
              slot on {cancelTarget.date}?
            </>
          ) : undefined
        }
      >
        <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCancelTarget(null)}
            className="flex-1 border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Keep Booking
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirmCancel}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs"
          >
            Yes, Cancel
          </Button>
        </div>
      </Dialog>

      {/* 8. Rating & Review Modal */}
      <Dialog
        isOpen={!!ratingTarget}
        onClose={() => setRatingTarget(null)}
        maxWidth="sm"
        aria-labelledby="rating-modal-title"
      >
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <h3 id="rating-modal-title" className="text-sm font-bold text-neutral-900">
            Rate & Review Detail
          </h3>
          <button
            onClick={() => setRatingTarget(null)}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center py-1">
          <span className="text-xs text-neutral-500 block mb-1">
            How was your {ratingTarget?.title} on {ratingTarget?.vehicle}?
          </span>
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRatingStars(star)}
                className="p-1 transition transform hover:scale-110 cursor-pointer"
                aria-label={`${star} star`}
              >
                <Star
                  className={`w-7 h-7 ${star <= ratingStars
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-neutral-300'
                    }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-neutral-700 block mb-1">
            Your Feedback (optional)
          </label>
          <textarea
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
            placeholder="The technician did a fantastic job..."
            rows={3}
            className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-primary resize-none"
          />
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRatingTarget(null)}
            className="flex-1 border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
          >
            Skip
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleConfirmRating}
            className="flex-1 bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs"
          >
            Submit Review
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
