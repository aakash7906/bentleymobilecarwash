import React from 'react'
import { AlertCircle } from 'lucide-react'
import { ServiceItem } from '@/types'

interface BookingPriceBreakdownProps {
  selectedService: ServiceItem
  isTieredService: boolean
  vehicleType: string
  basePrice: number
  vehicleSizeSurcharge: number
  city?: string
  tax: number
  grandTotal: string
  isUnderMobileMinimum: boolean
  MOBILE_MINIMUM_DISPATCH_AMOUNT: number
  preDiscountSubtotal: number
  mobileDispatchShortfall: number
  onSwitchToShop: () => void
}

export const BookingPriceBreakdown: React.FC<BookingPriceBreakdownProps> = ({
  selectedService,
  isTieredService,
  vehicleType,
  basePrice,
  vehicleSizeSurcharge,
  city,
  tax,
  grandTotal,
  isUnderMobileMinimum,
  MOBILE_MINIMUM_DISPATCH_AMOUNT,
  preDiscountSubtotal,
  mobileDispatchShortfall,
  onSwitchToShop,
}) => {
  return (
    <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col gap-2">
      <span className="text-xs font-bold text-gray-900">Summary &amp; Pricing</span>

      <div className="flex items-center justify-between text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <span>{selectedService.title}</span>
          {isTieredService && (
            <span className="text-[10px] text-primary font-bold bg-primary-light px-1.5 py-0.5 rounded">
              {vehicleType} Rate
            </span>
          )}
        </span>
        <span className="font-mono">${basePrice}.00</span>
      </div>

      {vehicleSizeSurcharge > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>+ {vehicleType} Size Surcharge</span>
          <span className="font-mono">+${vehicleSizeSurcharge}.00</span>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>Mobile Dispatch Fee {city ? `(${city})` : ''}</span>
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

      {isUnderMobileMinimum && (
        <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col gap-1.5 animate-in fade-in">
          <div className="flex items-center gap-1.5 font-bold text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Mobile Dispatch Minimum: ${MOBILE_MINIMUM_DISPATCH_AMOUNT}.00</span>
          </div>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            Mobile doorstep service requires a minimum order of ${MOBILE_MINIMUM_DISPATCH_AMOUNT}.00 (current subtotal: ${preDiscountSubtotal}.00). Add ${mobileDispatchShortfall.toFixed(2)} in add-ons above, or switch to Bentley Studio Drop-off (no minimum required).
          </p>
          <button
            type="button"
            onClick={onSwitchToShop}
            className="self-start text-[11px] font-bold text-primary hover:underline cursor-pointer"
          >
            Switch to Bentley Studio Drop-off &rarr;
          </button>
        </div>
      )}
    </div>
  )
}
