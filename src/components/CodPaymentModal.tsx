import { sanitizeText } from '@/lib/utils';
import React, { useState } from 'react'
import { BookingRecord, PaymentCollectionData } from '@/types'
import { Dialog } from '@/components/ui/dialog'
import {
  Banknote,
  CheckCircle2,
  AlertTriangle,
  User,
  Car,
} from 'lucide-react'

interface CodPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  booking: BookingRecord
  driverName?: string
  onConfirmPayment: (paymentData: PaymentCollectionData) => void
}

export const CodPaymentModal: React.FC<CodPaymentModalProps> = ({
  isOpen,
  onClose,
  booking,
  driverName,
  onConfirmPayment,
}) => {
  const selectedMethod = 'Cash'
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSkipWarning, setShowSkipWarning] = useState(false)

  const rawAmount = booking.price?.replace('$', '') || `${booking.totalNumeric || '0.00'}`
  const parsedAmt = parseFloat(rawAmount)
  const totalAmount = (isNaN(parsedAmt) || parsedAmt <= 0 ? 0 : parsedAmt).toFixed(2)

  const handleConfirmPaid = () => {
    const cleanNotes = sanitizeText(notes).slice(0, 200)
    setIsSubmitting(true)
    onConfirmPayment({
      paymentStatus: 'paid',
      paymentCollectedBy: driverName || 'Certified Technician',
      paymentCollectedAt: new Date().toISOString(),
      paymentCollectedMethod: selectedMethod,
      paymentNotes: cleanNotes || undefined,
    })
    setIsSubmitting(false)
    onClose()
  }

  const handleSkipPayment = () => {
    const cleanNotes = sanitizeText(notes).slice(0, 200)
    setIsSubmitting(true)
    onConfirmPayment({
      paymentStatus: 'pending',
      paymentCollectedBy: driverName || 'Certified Technician',
      paymentCollectedAt: new Date().toISOString(),
      paymentCollectedMethod: 'Unpaid / Pending Doorstep Follow-up',
      paymentNotes: cleanNotes ? `Unpaid Note: ${cleanNotes}` : 'Payment not collected on completion',
    })
    setIsSubmitting(false)
    onClose()
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title="Confirm Payment Collection"
      aria-labelledby="cod-payment-title"
    >
      <div className="flex flex-col gap-4 pt-1">
        {/* Banner with Total Amount Due */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wider">
              Pay on Completion (COD)
            </span>
            <span className="text-2xl font-black font-mono tracking-tight text-white mt-0.5">
              ${totalAmount} <span className="text-xs font-bold text-emerald-100">CAD</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/25">
            <Banknote className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Customer & Service Info Strip */}
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/80 flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-gray-600">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-semibold text-gray-900">{booking.customerName}</span>
            </div>
            <span className="text-[11px] text-gray-500 font-mono">#{booking.id.slice(-6).toUpperCase()}</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-gray-200/60 text-gray-600">
            <div className="flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-gray-400" />
              <span>{booking.vehicle}</span>
            </div>
            <span className="font-semibold text-gray-800">{booking.title}</span>
          </div>
        </div>

        {/* Payment Collection Mode - Cash on Delivery Only */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
            <span>Payment Collection Mode</span>
            <span className="text-[10px] text-emerald-600 font-semibold uppercase">Cash on Delivery (COD)</span>
          </label>

          <div className="p-3.5 rounded-xl border border-emerald-600 bg-emerald-50/80 text-emerald-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Banknote className="w-5 h-5" />
            </div>
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">Cash on Delivery</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Verified COD
                </span>
              </div>
              <span className="text-[11px] text-gray-600">Collect ${totalAmount} CAD physical cash directly from customer</span>
            </div>
          </div>
        </div>

        {/* Optional Notes or Transaction Ref */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-gray-600">
            Payment Notes / Reference (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Exact cash received, change provided, etc."
            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all text-gray-900"
          />
        </div>

        {/* Warning if skipping payment */}
        {showSkipWarning && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2 animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Caution: Order will be marked Pending Payment</span>
              <span>
                Use this only if the customer requested invoice billing or was unavailable to pay.
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmPaid}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm ${totalAmount} CAD Cash Received & Finish Job</span>
          </button>

          {!showSkipWarning ? (
            <button
              type="button"
              onClick={() => setShowSkipWarning(true)}
              className="text-[11px] font-semibold text-gray-400 hover:text-amber-600 transition-colors py-1 cursor-pointer text-center"
            >
              Customer didn't pay now? (Mark Unpaid)
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSkipPayment}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs transition-all cursor-pointer text-center"
            >
              Proceed & Complete Without Payment
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-xl text-gray-500 hover:text-gray-700 font-semibold text-xs transition-colors cursor-pointer text-center"
          >
            Cancel & Return
          </button>
        </div>
      </div>
    </Dialog>
  )
}
