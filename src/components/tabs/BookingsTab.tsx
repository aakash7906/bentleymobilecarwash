import React, { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { ServiceItem } from '@/types'
import { SERVICES_CATALOG } from '@/data/mockData'
import { OrderTrackingMapPage } from '@/components/OrderTrackingMapPage'

interface BookingsTabProps {
  onBack: () => void
  onBookAgain: (service: ServiceItem) => void
  onViewServiceDetail: (service: ServiceItem) => void
  currentVehicle: string
}

interface BookingRecord {
  id: string
  title: string
  category: string
  vehicle: string
  image: string
  price: string
  date: string
  status: 'active' | 'completed'
  serviceItem?: ServiceItem
}

export const BookingsTab: React.FC<BookingsTabProps> = ({
  onBack,
  onBookAgain,
  onViewServiceDetail,
  currentVehicle,
}) => {
  const [trackingModalOpen, setTrackingModalOpen] = useState(false)
  const [activeTrackingBooking, setActiveTrackingBooking] = useState<BookingRecord | null>(null)

  // Mock Active Booking (matching reference image)
  const activeBooking: BookingRecord = {
    id: 'BW-982410',
    title: 'Car Wash',
    category: 'Exterior Cleaning',
    vehicle: currentVehicle || 'Audi R8 GT',
    image: '/services_img/service1.jpeg',
    price: '$49.00',
    date: 'Today, 02:30 PM',
    status: 'active',
    serviceItem: SERVICES_CATALOG[0],
  }

  // Mock Past Services (matching reference image)
  const pastBookings: BookingRecord[] = [
    {
      id: 'BW-781920',
      title: 'Car Wash',
      category: 'Exterior Cleaning',
      vehicle: currentVehicle || 'Audi R8 GT',
      image: '/services_img/service1.jpeg',
      price: '$49.00',
      date: 'May 14, 2026',
      status: 'completed',
      serviceItem: SERVICES_CATALOG[0],
    },
    {
      id: 'BW-651230',
      title: 'Car Wash',
      category: 'Exterior Cleaning',
      vehicle: currentVehicle || 'Audi R8 GT',
      image: '/services_img/service1.jpeg',
      price: '$49.00',
      date: 'Apr 28, 2026',
      status: 'completed',
      serviceItem: SERVICES_CATALOG[0],
    },
  ]

  const handleTrackOrder = (booking: BookingRecord) => {
    setActiveTrackingBooking(booking)
    setTrackingModalOpen(true)
  }

  return (
    <div className="flex flex-col w-full pb-28 px-5">
      {/* 1. Top Header */}
      <div className="py-2.5 flex items-center justify-between border-b border-gray-100">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
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
        <h2 className="text-sm font-bold text-gray-900 tracking-tight">
          Active Now
        </h2>

        {/* Active Order Card */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col gap-3.5">
          {/* Top row: details + thumbnail */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col items-start gap-1">
              <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {activeBooking.category}
              </span>
              <h3 className="text-base font-bold text-gray-900 leading-snug mt-0.5">
                {activeBooking.title}
              </h3>
              <span className="text-xs font-semibold text-primary">
                {activeBooking.vehicle}
              </span>
            </div>

            {/* Thumbnail */}
            <div className="w-24 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
              <img
                src={activeBooking.image}
                alt={activeBooking.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Bottom Button: Track Order */}
          <button
            onClick={() => handleTrackOrder(activeBooking)}
            className="w-full py-2.5 rounded-xl bg-surface-alt hover:bg-[#e5e7eb] text-primary text-xs font-semibold transition-all active:scale-[0.99] cursor-pointer text-center"
          >
            Track Order &gt;
          </button>
        </div>
      </div>

      {/* 3. Past Services Section */}
      <div className="mt-6 flex flex-col gap-3">
        <h2 className="text-sm font-bold text-gray-900 tracking-tight">
          Past Services
        </h2>

        <div className="flex flex-col gap-3.5">
          {pastBookings.map((booking) => (
            <div
              key={booking.id}
              className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col gap-3.5"
            >
              {/* Top row: details + thumbnail */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col items-start gap-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                    {booking.category}
                  </span>
                  <h3 className="text-base font-bold text-gray-900 leading-snug mt-0.5">
                    {booking.title}
                  </h3>
                  <span className="text-xs font-semibold text-primary">
                    {booking.vehicle}
                  </span>
                </div>

                {/* Thumbnail */}
                <div className="w-24 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={booking.image}
                    alt={booking.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Bottom Buttons: View Detail & Book Again */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    const s = booking.serviceItem || SERVICES_CATALOG[0]
                    onViewServiceDetail(s)
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-surface-alt hover:bg-[#e5e7eb] text-primary text-xs font-semibold transition-all active:scale-[0.99] cursor-pointer text-center"
                >
                  View Detail &gt;
                </button>

                <button
                  onClick={() => {
                    const s = booking.serviceItem || SERVICES_CATALOG[0]
                    onBookAgain(s)
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold transition-all active:scale-[0.99] shadow-sm cursor-pointer text-center"
                >
                  Book Again &gt;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Live Order Tracking Map Page (Matches attached design) */}
      {trackingModalOpen && activeTrackingBooking && (
        <OrderTrackingMapPage
          onBack={() => setTrackingModalOpen(false)}
          serviceTitle={activeTrackingBooking.title}
          serviceCategory={activeTrackingBooking.category}
          customerName="Steve Miller"
          customerPhone="998 877 5561"
          customerAddress={`21/22, 5th Avenue, Jamesford Road, Ontario,\nCanada`}
          technicianName="James Marlo"
        />
      )}
    </div>
  )
}
