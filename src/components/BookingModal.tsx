import React, { useState } from 'react'
import { DetailPackage } from '@/types'
import { DETAILING_PACKAGES, BUSINESS_INFO } from '@/data/mockData'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  initialPackageId?: string
  onConfirmBooking: (bookingData: {
    packageId: string
    packageName: string
    price: number
    date: string
    timeSlot: string
    vehicle: string
    address: string
    notes: string
  }) => void
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  initialPackageId = 'supreme-detail',
  onConfirmBooking,
}) => {
  const [selectedPkgId, setSelectedPkgId] = useState<string>(initialPackageId)
  const [vehicle, setVehicle] = useState('2023 Porsche Macan GTS (BC • 924-KNA)')
  const [address, setAddress] = useState('1480 Water St, Kelowna, BC V1Y 1J7')
  const [notes, setNotes] = useState('Key left in drop pouch by front door / park mobile unit in driveway.')
  const [date, setDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [timeSlot, setTimeSlot] = useState('10:15 AM – 12:00 PM')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const currentPkg =
    DETAILING_PACKAGES.find((p) => p.id === selectedPkgId) || DETAILING_PACKAGES[2]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      onConfirmBooking({
        packageId: currentPkg.id,
        packageName: currentPkg.title,
        price: currentPkg.priceNumeric,
        date,
        timeSlot,
        vehicle,
        address,
        notes,
      })
      setIsSubmitting(false)
      onClose()
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-[var(--radius-box-lg)] sm:rounded-[var(--radius-box-lg)] max-h-[90vh] overflow-y-auto shadow-[var(--shadow-modal)] border border-[var(--border-light)] flex flex-col">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-5 py-4 border-b border-[var(--border-light)] flex items-center justify-between z-10">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
              Direct Mobile Dispatch
            </span>
            <h3 className="text-lg font-extrabold text-[var(--text-main)]">
              Schedule Your Mobile Wash
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--surface-alt)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-90 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">
          {/* Package Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
              1. Choose Detail Package
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DETAILING_PACKAGES.map((pkg) => {
                const isSelected = pkg.id === selectedPkgId
                return (
                  <button
                    type="button"
                    key={pkg.id}
                    onClick={() => setSelectedPkgId(pkg.id)}
                    className={`p-3 text-left rounded-[var(--radius-box-sm)] border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] ring-2 ring-[var(--color-primary-glow)]'
                        : 'border-[var(--border-light)] bg-white hover:bg-[var(--surface-subtle)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-main)]">
                        {pkg.title}
                      </span>
                      <span className="text-xs font-extrabold text-[var(--color-primary)]">
                        {pkg.price}
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                      {pkg.badge}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Vehicle info */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
              2. Vehicle
            </label>
            <input
              type="text"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              placeholder="e.g. 2023 Porsche Macan GTS (BC • 924-KNA)"
              className="app-input px-3 py-2 text-sm w-full font-medium"
              required
            />
          </div>

          {/* Date & Time Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                3. Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="app-input px-3 py-2 text-sm w-full"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                4. Arrival Window
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="app-input px-3 py-2 text-sm w-full bg-white"
              >
                <option value="10:15 AM – 12:00 PM">10:15 AM – 12:00 PM (Next Slot)</option>
                <option value="1:00 PM – 3:00 PM">1:00 PM – 3:00 PM</option>
                <option value="3:45 PM – 5:30 PM">3:45 PM – 5:30 PM</option>
              </select>
            </div>
          </div>

          {/* Location & Driveway Access */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
              5. Service Address (Kelowna Metro)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="1480 Water St, Kelowna, BC"
              className="app-input px-3 py-2 text-sm w-full font-medium"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
              Technician Notes (Driveway & Keys)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Park in left bay, key under mat"
              className="app-input px-3 py-2 text-sm w-full"
            />
          </div>

          {/* Pricing Summary */}
          <div className="app-card-subtle p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[var(--text-main)] block">
                {currentPkg.title}
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                Self-sustained deionized wash • No hookups needed
              </span>
            </div>
            <span className="text-lg font-extrabold text-[var(--color-primary)]">
              {currentPkg.price}
            </span>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary py-3.5 text-base w-full shadow-lg"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin material-symbols-outlined text-[18px]">progress_activity</span>
                Locking Dispatch...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Confirm &amp; Track Mobile Rig</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
