import React, { useState } from 'react'
import {
  Mail,
  Phone,
  Calendar,
  Clock,
  Car,
  ShoppingBag,
  MapPin,
  ChevronDown,
} from 'lucide-react'
import { CustomerItem } from './CustomerManagementPage'

export interface CustomerDetailsViewProps {
  customer: CustomerItem
  onBack?: () => void
}


export const CustomerDetailsView: React.FC<CustomerDetailsViewProps> = ({
  customer,
  onBack,
}) => {
  // Accordion open/close state for Wash History and Shop Orders
  const [openSections, setOpenSections] = useState<{ washes: boolean; orders: boolean }>({
    washes: true, // Default open for quick view
    orders: false, // Collapsed by default
  })

  const toggleSection = (section: 'washes' | 'orders') => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  // Format date helper for human-readable uniform dates
  const formatDisplayDate = (val: any) => {
    if (!val) return 'Registered'
    try {
      let d: Date | null = null
      if (typeof val?.toDate === 'function') d = val.toDate()
      else if (val?.seconds) d = new Date(val.seconds * 1000)
      else if (typeof val === 'string' || typeof val === 'number') {
        const cleanStr = String(val).replace(/^(Today|Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*/i, '')
        d = new Date(cleanStr)
      }
      if (d && !isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }
    } catch { }
    return String(val)
  }

  // Active status indicator (Active if activity in last 90 days or orders placed)
  const isCustomerActive = Boolean(
    customer.lastActiveDate || customer.totalWashes > 0 || customer.totalDeliveries > 0
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Customer Profile Hero Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-gray-200/80 shadow-2xs flex flex-col gap-5">
        {/* Top: Avatar & Information */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary font-bold text-xl flex items-center justify-center shrink-0 border border-primary/15 shadow-2xs">
            {customer.avatar ? (
              <img
                src={customer.avatar}
                alt={customer.name}
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              customer.name.charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            {/* Customer Name & Active Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight truncate">
                {customer.name}
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  isCustomerActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCustomerActive ? 'bg-emerald-500' : 'bg-gray-400'
                  }`}
                />
                <span>{isCustomerActive ? 'Active' : 'Inactive'}</span>
              </span>
            </div>

            {/* Clickable Contact Details */}
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs text-gray-600">
              {customer.email && customer.email !== '—' && (
                <a
                  href={`mailto:${customer.email}`}
                  className="flex items-center gap-1.5 truncate hover:text-primary transition-colors cursor-pointer group"
                  title="Send email to client"
                >
                  <Mail className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary shrink-0 transition-colors" />
                  <span className="truncate group-hover:underline">{customer.email}</span>
                </a>
              )}
              {customer.phone && (
                <a
                  href={`tel:${customer.phone}`}
                  className="flex items-center gap-1.5 font-mono hover:text-primary transition-colors cursor-pointer group"
                  title="Call client"
                >
                  <Phone className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary shrink-0 transition-colors" />
                  <span className="group-hover:underline">{customer.phone}</span>
                </a>
              )}
            </div>

            {/* Membership & Activity Metadata */}
            <div className="flex items-center gap-2 text-[11px] text-gray-400 flex-wrap pt-0.5">
              <span>Member since {formatDisplayDate(customer.createdAt)}</span>
              {customer.lastActiveDate && (
                <>
                  <span>•</span>
                  <span>Last active {formatDisplayDate(customer.lastActiveDate)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom: Minimal Stat Cards */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 pt-4 border-t border-gray-100">
          <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100 flex flex-col">
            <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Total Expense
            </span>
            <span className="text-base sm:text-lg font-extrabold text-primary font-mono mt-0.5">
              ${customer.totalSpent.toFixed(2)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100 flex flex-col">
            <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Washes
            </span>
            <span className="text-base sm:text-lg font-extrabold text-gray-900 font-mono mt-0.5">
              {customer.totalWashes}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100 flex flex-col">
            <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Shop Orders
            </span>
            <span className="text-base sm:text-lg font-extrabold text-gray-900 font-mono mt-0.5">
              {customer.totalDeliveries}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Registered Vehicles Section */}
      {customer.vehicles.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs flex flex-col gap-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Car className="w-4 h-4 text-primary" />
            <span>Registered Vehicles ({customer.vehicles.length})</span>
          </h4>
          <div className="flex items-center gap-2.5 flex-wrap">
            {customer.vehicles.map((v, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800"
              >
                <Car className="w-3.5 h-3.5 text-primary" />
                <span>{v}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 4. History Accordion (Washes & Shop Orders) */}
      <div className="flex flex-col gap-4">
        {/* Accordion Item 1: Wash Service History */}
        <div className="rounded-2xl bg-white border border-gray-200/80 shadow-2xs overflow-hidden transition-all">
          {/* Accordion Header Button */}
          <button
            type="button"
            onClick={() => toggleSection('washes')}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-gray-50/70 transition-colors cursor-pointer select-none"
            aria-expanded={openSections.washes}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  Wash Service History
                </h4>
                <p className="text-[11px] text-gray-400">
                  Past bookings and scheduled appointments
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary-light text-primary border border-primary-border/60">
                {customer.bookingsList.length} Bookings
              </span>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 transition-transform duration-200 ${
                  openSections.washes ? 'rotate-180 text-gray-700' : ''
                }`}
              >
                <ChevronDown className="w-4 h-4 stroke-[2.2]" />
              </div>
            </div>
          </button>

          {/* Accordion Content */}
          {openSections.washes && (
            <div className="p-4 sm:p-5 pt-0 border-t border-gray-100 flex flex-col gap-3 animate-in fade-in-50 duration-200">
              {customer.bookingsList.length === 0 ? (
                <div className="py-8 rounded-xl bg-gray-50 border border-gray-100 text-center flex flex-col items-center justify-center gap-2 mt-4">
                  <Car className="w-8 h-8 text-gray-300" />
                  <p className="text-xs text-gray-500 font-medium">No car wash services booked yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 mt-4">
                  {customer.bookingsList.map((b) => (
                    <div
                      key={b.id || `booking-${b.date}-${b.title}`}
                      className="p-3.5 rounded-xl bg-surface-subtle border border-gray-200/70 hover:border-gray-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 truncate">{b.title || 'Wash Service'}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase shrink-0">
                            {String(b.status || 'confirmed').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>{b.date || '—'} {b.time && `• ${b.time}`}</span>
                          </span>
                          {b.vehicle && (
                            <span className="flex items-center gap-1">
                              <Car className="w-3 h-3 text-gray-400" />
                              <span>{b.vehicle}</span>
                            </span>
                          )}
                          {b.address && (
                            <span className="flex items-center gap-1 truncate max-w-[200px]" title={b.address}>
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="truncate">{b.address}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        <span className="font-mono font-black text-sm text-primary">
                          {b.price || (b.totalNumeric ? `$${Number(b.totalNumeric).toFixed(2)}` : '$0.00')}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {b.locationType === 'mobile' ? 'Mobile Wash' : 'In-Shop'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Accordion Item 2: Shop Product Orders */}
        <div className="rounded-2xl bg-white border border-gray-200/80 shadow-2xs overflow-hidden transition-all">
          {/* Accordion Header Button */}
          <button
            type="button"
            onClick={() => toggleSection('orders')}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-gray-50/70 transition-colors cursor-pointer select-none"
            aria-expanded={openSections.orders}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  Shop Product Orders
                </h4>
                <p className="text-[11px] text-gray-400">
                  Bentley car care product orders & deliveries
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {customer.ordersList.length} Orders
              </span>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 transition-transform duration-200 ${
                  openSections.orders ? 'rotate-180 text-gray-700' : ''
                }`}
              >
                <ChevronDown className="w-4 h-4 stroke-[2.2]" />
              </div>
            </div>
          </button>

          {/* Accordion Content */}
          {openSections.orders && (
            <div className="p-4 sm:p-5 pt-0 border-t border-gray-100 flex flex-col gap-3 animate-in fade-in-50 duration-200">
              {customer.ordersList.length === 0 ? (
                <div className="py-8 rounded-xl bg-gray-50 border border-gray-100 text-center flex flex-col items-center justify-center gap-2 mt-4">
                  <ShoppingBag className="w-8 h-8 text-gray-300" />
                  <p className="text-xs text-gray-500 font-medium">No Bentley Shop product deliveries placed yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 mt-4">
                  {customer.ordersList.map((o, oIdx) => {
                    const orderDateStr = o.createdAt?.toDate
                      ? o.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : undefined
                    return (
                      <div
                        key={o.id || `order-${oIdx}`}
                        className="p-3.5 rounded-xl bg-surface-subtle border border-gray-200/70 hover:border-gray-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 truncate">
                              Order #{o.id ? o.id.slice(-6).toUpperCase() : 'ORDER'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase shrink-0">
                              {String(o.status || 'pending').replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                            {orderDateStr && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <span>{orderDateStr}</span>
                              </span>
                            )}
                            {(o.deliveryAddress || o.shippingAddress) && (
                              <span className="flex items-center gap-1 truncate max-w-[200px]" title={o.deliveryAddress || o.shippingAddress}>
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span className="truncate">{o.deliveryAddress || o.shippingAddress}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            {o.items && o.items.length > 0 ? (
                              o.items.map((i: any, itemIdx: number) => (
                                <span
                                  key={itemIdx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100/90 border border-gray-200 text-[10px] font-medium text-gray-700"
                                >
                                  <span className="truncate max-w-[160px]">{i?.product?.title || i?.title || i?.name || 'Item'}</span>
                                  <span className="text-gray-400 font-bold">×{i?.quantity || 1}</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">No item details</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                          <span className="font-mono font-black text-sm text-primary">
                            ${Number(o.grandTotal || 0).toFixed(2)}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {o.items?.length || 0} item{(o.items?.length || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { CustomerDetailsView as CustomerDetailsPage }
export default CustomerDetailsView
