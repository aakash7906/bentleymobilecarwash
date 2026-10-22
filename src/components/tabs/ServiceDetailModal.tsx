import React, { useState } from 'react'
import { ChevronLeft, Check, ArrowRight } from 'lucide-react'
import { ServiceItem } from '@/types'

interface ServiceDetailModalProps {
  service: ServiceItem | null
  onClose: () => void
  onBookNow: (service: ServiceItem) => void
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  onBookNow,
}) => {
  const [isOrderSummary, setIsOrderSummary] = useState(false)
  const [booked, setBooked] = useState(false)

  if (!service) return null

  const handleAction = () => {
    onBookNow(service)
    setIsOrderSummary(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto animate-in slide-in-from-bottom duration-200">
      <div className="w-full max-w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto min-h-screen flex flex-col bg-white pb-12">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <button
            onClick={() => {
              if (isOrderSummary) {
                setIsOrderSummary(false)
              } else {
                onClose()
              }
            }}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900 text-center flex-1">
            {isOrderSummary ? 'Order Summary' : service.title}
          </h1>
          <div className="w-9" />
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-4">
          {/* Service Image */}
          <div className="relative h-56 w-full rounded-2xl overflow-hidden bg-slate-100">
            <img
              src={service.image}
              alt={service.title}
              className="w-full h-full object-cover"
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          </div>

          {/* Pricing & Category */}
          <div className="flex items-center justify-between pt-1">
            <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
              {service.category}
            </span>
            <div className="text-right">
              <span className="text-[11px] text-gray-500 block">Starting at</span>
              <span className="text-base font-bold text-primary font-mono">
                {service.price}
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900">{service.title}</h2>
            <div className="flex items-center gap-2 mt-0.5 text-xs">
              <span className="text-primary font-semibold">{service.vehicleModel}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600 font-medium">Est. Time <strong className="text-primary">({service.estTime})</strong></span>
            </div>
          </div>

          {/* Action Button ("Add" or "Book Now ->") */}
          <div className="py-2">
            <button
              onClick={handleAction}
              disabled={booked}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-bold shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {booked ? (
                <span>✓ Appointment Confirmed!</span>
              ) : isOrderSummary ? (
                <>
                  <span>Book Now</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              ) : (
                <span>Add</span>
              )}
            </button>
          </div>

          {/* Service Description */}
          <div className="flex flex-col gap-1.5 pt-2">
            <h3 className="text-sm font-bold text-gray-900 underline decoration-gray-300 underline-offset-4">
              Service Description
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed mt-1">
              {service.description}
            </p>
          </div>

          {/* What's Included */}
          <div className="flex flex-col gap-2 pt-2">
            <h3 className="text-sm font-bold text-gray-900 underline decoration-gray-300 underline-offset-4">
              What's Included
            </h3>
            <ul className="flex flex-col gap-2 mt-1">
              {service.included.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2.5 text-xs text-gray-700">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
