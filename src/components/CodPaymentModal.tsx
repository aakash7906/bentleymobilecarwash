import React, { useState } from 'react'
import { BookingRecord, PaymentCollectionData } from '@/types'
import { Dialog } from '@/components/ui/dialog'
import {
  Banknote,
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  User,
  Car,
  Receipt,
  Sparkles,
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
  const [selectedMethod, setSelectedMethod] = useState<'Cash' | 'Card POS' | 'E-Transfer'>('Cash')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSkipWarning, setShowSkipWarning] = useState(false)

  const rawAmount = booking.price?.replace('$', '') || `${booking.totalNumeric || '0.00'}`
  const totalAmount = parseFloat(rawAmount).toFixed(2)

  const handleConfirmPaid = () => {
    setIsSubmitting(true)
    onConfirmPayment({
      paymentStatus: 'paid',
      paymentCollectedBy: driverName || 'Certified Technician',
      paymentCollectedAt: new Date().toISOString(),
      paymentCollectedMethod: selectedMethod,
      paymentNotes: notes.trim() || undefined,
    })
    setIsSubmitting(false)
    onClose()
  }

  const handleSkipPayment = () => {
    setIsSubmitting(true)
    onConfirmPayment({
      paymentStatus: 'pending',
      paymentCollectedBy: driverName || 'Certified Technician',
      paymentCollectedAt: new Date().toISOString(),
      paymentCollectedMethod: 'Unpaid / Pending Doorstep Follow-up',
      paymentNotes: notes.trim() ? `Unpaid Note: ${notes.trim()}` : 'Payment not collected on completion',
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

        {/* Payment Method Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
            <span>How did the customer pay?</span>
            <span className="text-[10px] text-emerald-600 font-semibold uppercase">Required</span>
          </label>

          <div className="grid grid-cols-3 gap-2">
            {/* Cash */}
            <button
              type="button"
              onClick={() => setSelectedMethod('Cash')}
              className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedMethod === 'Cash'
                  ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 font-bold shadow-xs ring-1 ring-emerald-500'
                  : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  selectedMethod === 'Cash' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Banknote className="w-4 h-4" />
              </div>
              <span className="text-xs">Cash</span>
              <span className="text-[10px] text-gray-500 font-normal">Physical Cash</span>
            </button>

            {/* Mobile POS Card Terminal */}
            <button
              type="button"
              onClick={() => setSelectedMethod('Card POS')}
              className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedMethod === 'Card POS'
                  ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 font-bold shadow-xs ring-1 ring-emerald-500'
                  : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  selectedMethod === 'Card POS' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-xs">POS Machine</span>
              <span className="text-[10px] text-gray-500 font-normal">Card Terminal</span>
            </button>

            {/* Interac / E-Transfer */}
            <button
              type="button"
              onClick={() => setSelectedMethod('E-Transfer')}
              className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedMethod === 'E-Transfer'
                  ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 font-bold shadow-xs ring-1 ring-emerald-500'
                  : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  selectedMethod === 'E-Transfer' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="text-xs">E-Transfer</span>
              <span className="text-[10px] text-gray-500 font-normal">Direct Bank</span>
            </button>
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
            placeholder="e.g. Exact cash received, or E-transfer confirmation #"
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
            <span>Confirm ${totalAmount} CAD Received & Finish Job</span>
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
