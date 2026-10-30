import React from 'react'
import { CheckCircle2, Receipt } from 'lucide-react'
import { BookingRecord, ServiceItem } from '@/types'
import { InvoiceModal } from '@/components/modals/InvoiceModal'

interface BookingSuccessScreenProps {
  createdBooking: BookingRecord | null
  selectedService: ServiceItem
  effectiveVehicle: string
  dateSlotText: string
  selectedTimeSlot: string
  addressText: string
  grandTotal: string
  onTrackOrder?: () => void
  onBack: () => void
}

export const BookingSuccessScreen: React.FC<BookingSuccessScreenProps> = ({
  createdBooking,
  selectedService,
  effectiveVehicle,
  dateSlotText,
  selectedTimeSlot,
  addressText,
  grandTotal,
  onTrackOrder,
  onBack,
}) => {
  const [showInvoiceModal, setShowInvoiceModal] = React.useState(false)

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
            <span className="font-semibold text-gray-900">{effectiveVehicle}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Date &amp; Time:</span>
            <span className="font-semibold text-gray-900">
              {dateSlotText} at {selectedTimeSlot}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Location:</span>
            <span className="font-semibold text-gray-900 text-right truncate max-w-[180px]">
              {addressText}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Payment Option:</span>
            <span className="font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Cash on Delivery (Due after wash)
            </span>
          </div>

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
