import React from 'react'
import { BookingRecord } from '@/types'
import { X, Printer, CheckCircle, Car, MapPin, Calendar, Clock, CreditCard, Shield } from 'lucide-react'

interface InvoiceModalProps {
  booking: BookingRecord
  onClose: () => void
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ booking, onClose }) => {
  const invoiceYear = booking.createdAt?.toDate ? booking.createdAt.toDate().getFullYear() : (booking.createdAt ? new Date(booking.createdAt).getFullYear() : new Date().getFullYear())
  const invoiceNumber = `INV-${booking.id.replace('bkg-', '').toUpperCase()}-${invoiceYear}`
  const taxRate = 0.05 // 5% GST
  const total = booking.totalNumeric || parseFloat(booking.price.replace(/[^0-9.]/g, '')) || 0
  const subtotal = total / (1 + taxRate)
  const gst = total - subtotal

  const handlePrint = () => {
    window.print()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-surface-subtle">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              B
            </div>
            <div>
              <h2 id="invoice-modal-title" className="text-base font-bold text-neutral-900">Tax Invoice / Receipt</h2>
              <p className="text-xs text-neutral-500">#{invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-200 text-neutral-500 hover:text-neutral-700 transition"
            aria-label="Close invoice"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Brand & Status Banner */}
          <div className="flex items-start justify-between pb-4 border-b border-neutral-100">
            <div>
              <h3 className="font-extrabold text-lg tracking-tight text-neutral-900">
                Bentley Mobile Car Wash
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">Kelowna & Okanagan Valley, BC</p>
              <p className="text-xs text-neutral-500">support@bentleymobilecarwash.com</p>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-status-active/10 text-status-active rounded-full font-semibold text-xs border border-status-active/20">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Paid & Confirmed</span>
            </div>
          </div>

          {/* Customer & Appointment Info Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-surface-subtle border border-neutral-100 text-xs">
            <div>
              <span className="text-neutral-400 block font-medium">Billed To</span>
              <span className="font-bold text-neutral-900 mt-0.5 block">{booking.customerName}</span>
              <span className="text-neutral-500 block">{booking.customerPhone}</span>
              {booking.customerEmail && <span className="text-neutral-500 block truncate">{booking.customerEmail}</span>}
            </div>
            <div>
              <span className="text-neutral-400 block font-medium">Service Address</span>
              <span className="font-medium text-neutral-700 mt-0.5 block line-clamp-2">
                <MapPin className="w-3 h-3 inline mr-1 text-primary shrink-0" />
                {booking.address}
              </span>
            </div>

            <div className="border-t border-neutral-200/60 pt-3">
              <span className="text-neutral-400 block font-medium">Vehicle</span>
              <span className="font-bold text-neutral-900 mt-0.5 flex items-center">
                <Car className="w-3.5 h-3.5 mr-1 text-primary" />
                {booking.vehicle}
              </span>
              {booking.licensePlate && (
                <span className="text-neutral-500 block font-mono text-[11px]">Plate: {booking.licensePlate}</span>
              )}
            </div>

            <div className="border-t border-neutral-200/60 pt-3">
              <span className="text-neutral-400 block font-medium">Scheduled For</span>
              <span className="font-bold text-neutral-900 mt-0.5 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-primary" />
                {booking.date}
              </span>
              <span className="text-neutral-500 flex items-center mt-0.5">
                <Clock className="w-3 h-3 mr-1" />
                {booking.time}
              </span>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-neutral-400 mb-2">Itemized Breakdown</h4>
            <div className="border border-neutral-100 rounded-xl overflow-hidden divide-y divide-neutral-100">
              {/* Primary Service */}
              <div className="flex justify-between items-center p-3 bg-white">
                <div>
                  <div className="font-bold text-neutral-900">{booking.title}</div>
                  <div className="text-xs text-neutral-500">{booking.category} Service Tier</div>
                </div>
                <div className="font-bold text-neutral-900">
                  ${(subtotal - (booking.addons?.length ? booking.addons.length * 20 : 0)).toFixed(2)}
                </div>
              </div>

              {/* Addons if any */}
              {booking.addons && booking.addons.length > 0 && booking.addons.map((addon, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-surface-subtle text-xs">
                  <div className="text-neutral-700 font-medium">Add-on: {addon}</div>
                  <div className="font-semibold text-neutral-800">Included</div>
                </div>
              ))}

              {/* Frequency plan note */}
              {booking.frequency && booking.frequency !== 'one_time' && (
                <div className="flex justify-between items-center p-3 bg-emerald-50 text-xs text-emerald-800">
                  <span className="font-medium">Recurring Subscription Discount (15% Off)</span>
                  <span className="font-bold">Applied</span>
                </div>
              )}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <div className="flex justify-between text-xs text-neutral-500">
              <span>Subtotal</span>
              <span className="font-medium text-neutral-700">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-neutral-500">
              <span>GST / HST (5%)</span>
              <span className="font-medium text-neutral-700">${gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
              <span className="font-bold text-base text-neutral-900">Total Paid</span>
              <span className="font-extrabold text-lg text-primary">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Badge */}
          <div className="p-3 bg-surface-subtle rounded-xl flex items-center justify-between text-xs text-neutral-600">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-neutral-500" />
              <span>Paid via {booking.paymentMethod || 'Apple Pay / Card'}</span>
            </div>
            <div className="flex items-center space-x-1 text-emerald-600 font-medium">
              <Shield className="w-3.5 h-3.5" />
              <span>Verified Safe</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-100 bg-surface-subtle flex items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold text-sm transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm transition shadow-sm text-center"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
