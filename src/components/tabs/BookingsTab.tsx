import React, { useState } from 'react'
import { ChevronLeft, CheckCircle2, Clock, MapPin, Truck, Phone } from 'lucide-react'
import { ServiceItem } from '@/types'
import { SERVICES_CATALOG } from '@/data/mockData'

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
              <span className="px-2.5 py-0.5 rounded-full bg-[#dc2626] text-white text-[10px] font-bold">
                {activeBooking.category}
              </span>
              <h3 className="text-base font-bold text-gray-900 leading-snug mt-0.5">
                {activeBooking.title}
              </h3>
              <span className="text-xs font-semibold text-[#dc2626]">
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
            className="w-full py-2.5 rounded-xl bg-[#f1f3f5] hover:bg-[#e5e7eb] text-[#dc2626] text-xs font-semibold transition-all active:scale-[0.99] cursor-pointer text-center"
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
                  <span className="px-2.5 py-0.5 rounded-full bg-[#dc2626] text-white text-[10px] font-bold">
                    {booking.category}
                  </span>
                  <h3 className="text-base font-bold text-gray-900 leading-snug mt-0.5">
                    {booking.title}
                  </h3>
                  <span className="text-xs font-semibold text-[#dc2626]">
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
                  className="flex-1 py-2.5 rounded-xl bg-[#f1f3f5] hover:bg-[#e5e7eb] text-[#dc2626] text-xs font-semibold transition-all active:scale-[0.99] cursor-pointer text-center"
                >
                  View Detail &gt;
                </button>

                <button
                  onClick={() => {
                    const s = booking.serviceItem || SERVICES_CATALOG[0]
                    onBookAgain(s)
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold transition-all active:scale-[0.99] shadow-sm cursor-pointer text-center"
                >
                  Book Again &gt;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Live Order Tracking Modal */}
      {trackingModalOpen && activeTrackingBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-400">Order Tracking</span>
                <span className="text-sm font-extrabold text-gray-900 font-mono">
                  #{activeTrackingBooking.id}
                </span>
              </div>
              <button
                onClick={() => setTrackingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Estimated Arrival Banner */}
            <div className="p-3.5 rounded-xl bg-red-50/50 border border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#dc2626] text-white flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-900">Mobile Unit On The Way</span>
                  <span className="text-[11px] text-gray-500">Est. Arrival in ~15 mins</span>
                </div>
              </div>
              <span className="text-xs font-extrabold text-[#dc2626] font-mono">
                02:30 PM
              </span>
            </div>

            {/* Live Progress Timeline */}
            <div className="flex flex-col gap-3 py-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-xs font-bold text-gray-900">Order Confirmed</span>
                  <span className="text-[10px] text-gray-500">01:45 PM • Water & power equipped van ready</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#dc2626] text-white flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                  <Truck className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-xs font-bold text-[#dc2626]">Detailer Dispatched</span>
                  <span className="text-[10px] text-gray-500">In transit to Kelowna address</span>
                </div>
              </div>

              <div className="flex items-start gap-3 opacity-40">
                <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-xs font-bold text-gray-700">Precision Wash & Detail</span>
                  <span className="text-[10px] text-gray-500">Pending arrival</span>
                </div>
              </div>
            </div>

            {/* Detailer Quick Contact */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-900">Detailer: Marcus T.</span>
                <span className="text-[10px] text-gray-500">Bentley Mobile Unit #04</span>
              </div>
              <a
                href="tel:+12503519155"
                className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center text-[#dc2626] hover:bg-red-50 cursor-pointer shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setTrackingModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black active:scale-[0.99] transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
