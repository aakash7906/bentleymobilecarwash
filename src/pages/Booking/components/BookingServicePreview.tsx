import React from 'react'
import { ServiceItem } from '@/types'

interface BookingServicePreviewProps {
  selectedService: ServiceItem
  basePrice: number
}

export const BookingServicePreview: React.FC<BookingServicePreviewProps> = ({
  selectedService,
  basePrice,
}) => {
  return (
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
        <span className="text-sm font-extrabold text-primary font-mono mt-1">
          ${basePrice}.00
        </span>
      </div>
    </div>
  )
}
