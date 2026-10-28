import React, { useEffect } from 'react'
import { BookingRecord } from '@/types'
import {
  ChevronLeft,
  Printer,
  CheckCircle,
  Car,
  MapPin,
  Calendar,
  Clock,
  Banknote,
  Shield,
  Truck,
  Sparkles,
  AlertCircle,
  Receipt,
} from 'lucide-react'

interface InvoiceModalProps {
  booking: BookingRecord
  onClose: () => void
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ booking, onClose }) => {
  // Safe invoice date determination
  const invoiceDate = React.useMemo(() => {
    try {
      if (booking.createdAt?.toDate) {
        return booking.createdAt.toDate().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      }
      if (booking.createdAt) {
        const d = new Date(booking.createdAt)
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        }
      }
    } catch {}
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }, [booking.createdAt])

  const invoiceYear = React.useMemo(() => {
    try {
      if (booking.createdAt?.toDate) return booking.createdAt.toDate().getFullYear()
      if (booking.createdAt) {
        const y = new Date(booking.createdAt).getFullYear()
        if (!isNaN(y)) return y
      }
    } catch {}
    return new Date().getFullYear()
  }, [booking.createdAt])

  // Clean, official invoice reference number
  const cleanId = booking.id ? booking.id.replace(/^bkg-/, '').toUpperCase() : 'REC'
  const invoiceNumber = `INV-${cleanId.slice(0, 8)}-${invoiceYear}`

  // Financial calculations: Canadian Standard 5% GST
  const taxRate = 0.05
  const total =
    booking.totalNumeric ||
    parseFloat(String(booking.price || '0').replace(/[^0-9.]/g, '')) ||
    0
  const subtotal = total / (1 + taxRate)
  const gst = total - subtotal

  // Payment status derivation
  const isPaid =
    booking.paymentStatus === 'paid' ||
    (booking.paymentMethod &&
      !booking.paymentMethod.toLowerCase().includes('completion') &&
      !booking.paymentMethod.toLowerCase().includes('pending') &&
      !booking.paymentMethod.toLowerCase().includes('delivery'))

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Isolated Single-Page Print Handler
  const handlePrint = () => {
    const invoiceEl = document.getElementById('printable-tax-invoice')
    if (!invoiceEl) {
      window.print()
      return
    }

    // Clean up any lingering print iframes
    const oldFrame = document.getElementById('tax-invoice-isolated-print-frame')
    if (oldFrame) oldFrame.remove()

    // Create an isolated hidden iframe containing ONLY the invoice
    const iframe = document.createElement('iframe')
    iframe.id = 'tax-invoice-isolated-print-frame'
    iframe.style.position = 'fixed'
    iframe.style.top = '-9999px'
    iframe.style.left = '-9999px'
    iframe.style.width = '0px'
    iframe.style.height = '0px'
    iframe.style.border = '0px'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (!doc) {
      window.print()
      return
    }

    // Collect all loaded CSS styles from the main document
    let stylesHtml = ''
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
      stylesHtml += node.outerHTML
    })

    // Clone invoice content and strip action buttons
    const invoiceClone = invoiceEl.cloneNode(true) as HTMLElement
    invoiceClone.querySelectorAll('.invoice-no-print').forEach((el) => el.remove())

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Tax Invoice - ${invoiceNumber}</title>
          ${stylesHtml}
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 12mm;
            }
            *, *::before, *::after {
              box-sizing: border-box !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #111827 !important;
              height: auto !important;
              min-height: 0 !important;
              max-height: none !important;
              overflow: visible !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #isolated-print-root {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 0 !important;
              background: #ffffff !important;
            }
            #printable-tax-invoice {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 12px 18px !important;
              border: 1px solid #e5e7eb !important;
              border-radius: 12px !important;
              box-shadow: none !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .invoice-no-print {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div id="isolated-print-root">
            ${invoiceClone.outerHTML}
          </div>
        </body>
      </html>
    `)
    doc.close()

    // Ensure iframe styles have rendered, then trigger print
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch (e) {
        console.warn('Iframe print failed, falling back to window.print():', e)
        window.print()
      }
      setTimeout(() => {
        try {
          iframe.remove()
        } catch {}
      }, 2000)
    }, 200)
  }

  return (
    <>
      {/* Fallback Main Window Print Stylesheet (In case user uses Ctrl+P) */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 10mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: 100% !important;
            max-height: 100% !important;
            overflow: hidden !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          .invoice-no-print,
          .invoice-no-print * {
            display: none !important;
          }
          #printable-tax-invoice,
          #printable-tax-invoice * {
            visibility: visible !important;
          }
          #printable-tax-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 12px 18px !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 12px !important;
            box-shadow: none !important;
            background: #ffffff !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* FULL SCREEN RESPONSIVE PAGE VIEW (Fits edge-to-edge on mobile, perfectly centered on desktop) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-modal-title"
        className="fixed inset-0 z-50 bg-[#f7f9fb] overflow-y-auto animate-in slide-in-from-bottom duration-200"
      >
        <div className="w-full max-w-full md:max-w-3xl lg:max-w-4xl mx-auto min-h-screen flex flex-col bg-[#f7f9fb] pb-16">
          {/* 1. TOP STICKY APP BAR (Hidden during print) */}
          <header className="invoice-no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Return"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div>
                <h1
                  id="invoice-modal-title"
                  className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-tight"
                >
                  Tax Invoice / Receipt
                </h1>
                <p className="text-[11px] font-mono text-gray-500 font-medium">
                  #{invoiceNumber}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center gap-1.5 border border-primary/20 transition-all cursor-pointer font-bold text-xs shadow-2xs active:scale-95"
                title="Print or Save PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print / Save PDF</span>
                <span className="sm:hidden">Print</span>
              </button>
            </div>
          </header>

          {/* 2. MAIN INVOICE DOCUMENT SHEET */}
          <main className="flex-1 w-full px-3.5 sm:px-6 md:px-8 py-4 sm:py-6">
            <div
              id="printable-tax-invoice"
              className="w-full bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xs border border-gray-200/80 flex flex-col gap-4 sm:gap-5"
            >
              {/* Brand Banner & Status Badge */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 pb-3 sm:pb-4 border-b border-gray-100">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <h2 className="font-black text-base sm:text-xl tracking-tight text-gray-900">
                      Bentley Mobile Car Wash
                    </h2>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                    Ontario &amp; Greater Toronto Area, Canada
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-500">
                    support@bentleymobilecarwash.com • GST # 849201948RT0001
                  </p>
                </div>

                <div className="flex sm:flex-col items-start sm:items-end gap-1 shrink-0">
                  {isPaid ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 bg-emerald-50 text-emerald-800 rounded-full font-bold text-[11px] sm:text-xs border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{booking.paymentCollectedMethod ? `Paid (${booking.paymentCollectedMethod})` : 'Paid & Confirmed'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 bg-amber-50 text-amber-800 rounded-full font-bold text-[11px] sm:text-xs border border-amber-200">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Pay on Completion</span>
                    </span>
                  )}
                  <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium">
                    Issued: {invoiceDate}
                  </span>
                </div>
              </div>

              {/* Information Grid: Customer, Location, Vehicle, Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 text-xs sm:text-sm">
                {/* Billed To */}
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Billed To
                  </span>
                  <span className="font-black text-gray-900 text-xs sm:text-base mt-0.5">
                    {booking.customerName || 'Valued Customer'}
                  </span>
                  <span className="text-gray-600 mt-0.5 font-medium text-[11px] sm:text-xs">
                    {booking.customerPhone || 'Phone on file'}
                  </span>
                  {booking.customerEmail && (
                    <span className="text-gray-500 text-[11px] sm:text-xs truncate">
                      {booking.customerEmail}
                    </span>
                  )}
                </div>

                {/* Service Address */}
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Service Address
                  </span>
                  <span className="font-semibold text-gray-800 text-xs sm:text-sm mt-0.5 flex items-start gap-1 leading-snug">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{booking.address || 'Address on file'}</span>
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5">
                    Location Type: {booking.locationType === 'shop' ? 'Shop Location' : 'Mobile On-Site Detailing'}
                  </span>
                </div>

                {/* Registered Vehicle */}
                <div className="border-t border-gray-200/80 pt-2.5 flex flex-col">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Registered Vehicle
                  </span>
                  <span className="font-black text-gray-900 mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm">
                    <Car className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{booking.vehicle || 'Vehicle on record'}</span>
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
                    {booking.vehicleType && (
                      <span className="bg-gray-200/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-700">
                        {booking.vehicleType}
                      </span>
                    )}
                    {booking.licensePlate && (
                      <span className="font-mono uppercase font-bold text-gray-700 text-[10px] sm:text-[11px]">
                        Plate: {booking.licensePlate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Appointment Schedule */}
                <div className="border-t border-gray-200/80 pt-2.5 flex flex-col">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Appointment Schedule
                  </span>
                  <span className="font-bold text-gray-900 mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{booking.date || 'Scheduled Date'}</span>
                  </span>
                  <span className="text-gray-600 flex items-center gap-1 mt-0.5 text-[11px] sm:text-xs font-semibold">
                    <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                    <span>{booking.time || 'Scheduled Time'}</span>
                  </span>
                </div>

                {/* Dispatched Technician (If Assigned) */}
                {(booking.driverName || booking.technicianName) && (
                  <div className="col-span-1 sm:col-span-2 border-t border-gray-200/80 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0">
                        <Truck className="w-3 h-3" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Dispatched Technician
                        </span>
                        <span className="font-bold text-gray-900 text-xs">
                          {booking.driverName || booking.technicianName}
                          {booking.driverVanNumber ? ` (Van ${booking.driverVanNumber})` : ''}
                        </span>
                      </div>
                    </div>
                    {booking.driverPhone && (
                      <span className="text-[11px] font-semibold text-gray-600">
                        Contact: {booking.driverPhone}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 3. ITEMIZED BREAKDOWN TABLE */}
              <div>
                <h3 className="font-bold text-[10px] sm:text-xs uppercase tracking-wider text-gray-400 mb-1.5 sm:mb-2">
                  Itemized Service Breakdown
                </h3>
                <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 bg-white">
                  {/* Primary Service Tier */}
                  <div className="flex justify-between items-center p-2.5 sm:p-3 bg-white">
                    <div className="flex flex-col pr-3">
                      <span className="font-bold text-gray-900 text-xs sm:text-sm">
                        {booking.title}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-gray-500">
                        {booking.category} Detailing Tier • {booking.vehicleType || 'Standard'}
                      </span>
                    </div>
                    <span className="font-mono font-black text-gray-900 text-xs sm:text-sm shrink-0">
                      ${(subtotal - (booking.addons?.length ? booking.addons.length * 15 : 0)).toFixed(2)}
                    </span>
                  </div>

                  {/* Selected Add-ons */}
                  {booking.addons &&
                    booking.addons.length > 0 &&
                    booking.addons.map((addon, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-2 sm:p-2.5 bg-gray-50/50 text-xs"
                      >
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Sparkles className="w-3 h-3 text-primary shrink-0" />
                          <span className="text-[11px] sm:text-xs">Add-on: {addon}</span>
                        </div>
                        <span className="font-semibold text-gray-800 text-[10px] sm:text-xs">Included</span>
                      </div>
                    ))}

                  {/* Subscription Discount */}
                  {booking.frequency && booking.frequency !== 'one_time' && (
                    <div className="flex justify-between items-center p-2 sm:p-2.5 bg-emerald-50 text-xs text-emerald-800">
                      <span className="font-medium text-[11px]">
                        Recurring Membership Discount (15% Off Applied)
                      </span>
                      <span className="font-bold text-emerald-700 text-[11px]">Active</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. TOTALS SUMMARY */}
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                  <span>Subtotal (Net of Taxes)</span>
                  <span className="font-semibold font-mono text-gray-800">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                  <span>Federal GST (5.0%)</span>
                  <span className="font-semibold font-mono text-gray-800">
                    ${gst.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <div className="flex flex-col">
                    <span className="font-black text-sm sm:text-base text-gray-900">
                      Total Amount
                    </span>
                    <span className="text-[10px] text-gray-400">
                      All amounts in Canadian Dollars (CAD)
                    </span>
                  </div>
                  <span className="font-black font-mono text-lg sm:text-xl text-primary">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* 5. PAYMENT METHOD & VERIFICATION */}
              <div className="p-2.5 sm:p-3 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-medium text-[11px] sm:text-xs">
                    Payment Method: {booking.paymentMethod || (isPaid ? 'Cash on Delivery (Paid)' : 'Cash on Delivery (Pending)')}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                  <Shield className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Verified Official Tax Receipt</span>
                </div>
              </div>

              {/* 6. BOTTOM ACTION BUTTONS (Hidden in print) */}
              <div className="invoice-no-print flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full sm:w-1/2 py-3 sm:py-3.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 active:scale-98 text-gray-800 font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-gray-600" />
                  <span>Print / Save PDF</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-1/2 py-3 sm:py-3.5 rounded-2xl bg-primary hover:bg-primary-hover active:scale-98 text-white font-bold text-xs sm:text-sm transition-all shadow-md text-center cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

/**
 * Reusable Invoice Receipt Button Component
 */
interface InvoiceReceiptButtonProps {
  booking: BookingRecord
  variant?: 'icon' | 'full'
  className?: string
}

export const InvoiceReceiptButton: React.FC<InvoiceReceiptButtonProps> = ({
  booking,
  variant = 'icon',
  className = '',
}) => {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={
            className ||
            'h-8 w-8 rounded-sm border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 flex items-center justify-center cursor-pointer shrink-0 shadow-xs active:scale-95 transition-all'
          }
          title="View Tax Invoice / Receipt"
          aria-label="View Tax Invoice / Receipt"
        >
          <Receipt className="w-3.5 h-3.5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={
            className ||
            'w-full py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm'
          }
        >
          <Receipt className="w-3.5 h-3.5 text-primary" />
          <span>View Receipt / Invoice</span>
        </button>
      )}

      {isOpen && <InvoiceModal booking={booking} onClose={() => setIsOpen(false)} />}
    </>
  )
}
