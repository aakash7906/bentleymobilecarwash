import React, { useState } from 'react'
import { DISPATCH_ORDERS, BUSINESS_INFO } from '@/data/mockData'
import { DispatchBooking, BookingStatus } from '@/types'

interface OpsHubTabProps {
  onSwitchToClient: () => void
  onNewBooking: () => void
  onBroadcastAlert: () => void
}

export const OpsHubTab: React.FC<OpsHubTabProps> = ({
  onSwitchToClient,
  onNewBooking,
  onBroadcastAlert,
}) => {
  const [orders, setOrders] = useState<DispatchBooking[]>(DISPATCH_ORDERS)
  const [activeSegment, setActiveSegment] = useState<'queue' | 'rates' | 'fleet'>('queue')
  const [selectedTechFilter, setSelectedTechFilter] = useState('all')
  const [approvedPhoto, setApprovedPhoto] = useState(false)
  const [assignedRaheem, setAssignedRaheem] = useState(false)

  const handleStatusChange = (orderId: string, newStatus: BookingStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    )
  }

  const handleAssignVan = (orderId: string, driver: string, van: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              unassigned: false,
              driverName: driver,
              driverVan: van,
              driverEta: 'Dispatched from base - ETA 18 mins',
            }
          : o
      )
    )
    setAssignedRaheem(true)
  }

  return (
    <div className="flex flex-col gap-5 pb-24">
      {/* 1. OPERATIONS & DISPATCH HEADER */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">
            Operations &amp; Dispatch
          </h1>
          <span className="badge-pill bg-[var(--color-primary-light)] text-[var(--color-primary)] text-[10px] font-bold px-2 py-0.5 border border-[var(--color-primary-border)]">
            • Live Kelowna Feed
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Kelowna, BC Metro Area - Mon-Sat (9:00 AM – 5:00 PM)
        </p>

        {/* Quick actions top bar */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onSwitchToClient}
            className="btn-secondary text-xs px-3 py-1.5 flex-1 font-bold"
          >
            <span className="material-symbols-outlined text-[15px]">visibility</span>
            <span>Customer View</span>
          </button>

          <button
            onClick={onNewBooking}
            className="btn-secondary text-xs px-3 py-1.5 flex-1 font-bold"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            <span>New Booking</span>
          </button>
        </div>

        {/* Big Red Broadcast Action */}
        <button
          onClick={onBroadcastAlert}
          className="btn-primary py-2.5 text-xs font-bold w-full shadow-md active:scale-95 flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">campaign</span>
          <span>Broadcast Tech Alert</span>
        </button>
      </div>

      {/* 2. 4 STAT KPI CARDS (2x2 Grid from screenshot) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1 */}
        <div className="app-card p-3.5 flex flex-col justify-between gap-2 border border-[var(--border-light)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Total Bookings Today
            </span>
            <span className="material-symbols-outlined text-[16px] text-[var(--text-light)]">
              calendar_today
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[var(--text-main)] font-mono">12</span>
            <span className="badge-pill bg-emerald-50 text-emerald-600 text-[9px] px-1 py-0.2 font-bold">
              +3 new
            </span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">
            Daily Target: $2,000 <strong className="text-[var(--text-main)]">• 92%</strong>
          </span>
        </div>

        {/* Card 2 */}
        <div className="app-card p-3.5 flex flex-col justify-between gap-2 border border-[var(--border-light)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Active Vans on Route
            </span>
            <span className="material-symbols-outlined text-[16px] text-[var(--text-light)]">
              local_shipping
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[var(--text-main)] font-mono">3</span>
            <span className="text-xs text-[var(--text-muted)] font-bold">/ 4 Ready</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>GPS Status: All Pinged</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="app-card p-3.5 flex flex-col justify-between gap-2 border border-[var(--border-light)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Pending Dispatch
            </span>
            <span className="material-symbols-outlined text-[16px] text-amber-500">
              error_outline
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[var(--color-primary)] font-mono">4</span>
            <span className="badge-pill bg-[var(--color-primary-light)] text-[var(--color-primary)] text-[9px] px-1 py-0.2 font-bold">
              Needs Tech
            </span>
          </div>
          <span className="text-[10px] text-[var(--color-primary)] font-bold">
            Next Slot: 1:00 PM Action Req.
          </span>
        </div>

        {/* Card 4 */}
        <div className="app-card p-3.5 flex flex-col justify-between gap-2 border border-[var(--border-light)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              On-Time Completion
            </span>
            <span className="material-symbols-outlined text-[16px] text-emerald-500">
              verified
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[var(--text-main)] font-mono">98.4%</span>
            <span className="text-[10px] font-bold text-amber-500">★ 4.9</span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">
            Avg Wash Time: <strong className="text-[var(--text-main)]">78 mins</strong>
          </span>
        </div>
      </div>

      {/* 3. SEGMENT SWITCHER */}
      <div className="flex items-center gap-1 p-1 bg-white rounded-[var(--radius-box-sm)] border border-[var(--border-light)] shadow-sm">
        <button
          onClick={() => setActiveSegment('queue')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-[var(--radius-btn-sm)] transition-all ${
            activeSegment === 'queue'
              ? 'bg-[var(--color-primary)] text-white shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          Live Dispatch Queue
        </button>
        <button
          onClick={() => setActiveSegment('rates')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-[var(--radius-btn-sm)] transition-all ${
            activeSegment === 'rates'
              ? 'bg-[var(--color-primary)] text-white shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          Pricing &amp; Rates
        </button>
        <button
          onClick={() => setActiveSegment('fleet')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-[var(--radius-btn-sm)] transition-all ${
            activeSegment === 'fleet'
              ? 'bg-[var(--color-primary)] text-white shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          Fleet (3)
        </button>
      </div>

      {/* 4. ACTIVE KELOWNA BOOKINGS DISPATCH QUEUE */}
      {activeSegment === 'queue' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-[var(--text-main)]">
                Active Kelowna Bookings
              </h2>
              <span className="badge-pill bg-[var(--color-primary-light)] text-[var(--color-primary)] text-[9px] font-bold px-1.5 py-0.2">
                3 Critical Today
              </span>
            </div>

            <select
              value={selectedTechFilter}
              onChange={(e) => setSelectedTechFilter(e.target.value)}
              className="text-[11px] font-bold text-[var(--text-muted)] bg-transparent border-none cursor-pointer"
            >
              <option value="all">All Technicians ▾</option>
              <option value="van4">Van 4 (Raheem)</option>
              <option value="van2">Van 2 (Marcus)</option>
            </select>
          </div>

          {/* ORDER CARDS */}
          <div className="flex flex-col gap-3.5">
            {orders.map((ord) => {
              return (
                <div
                  key={ord.id}
                  className={`app-card p-4 flex flex-col gap-3 border transition-all ${
                    ord.immediateAction
                      ? 'border-[var(--color-primary)] shadow-md'
                      : 'border-[var(--border-light)]'
                  }`}
                >
                  {/* Top row: Order ID, Time, Package */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[var(--text-main)]">
                        {ord.id}
                      </span>
                      <span className="badge-pill bg-[var(--surface-alt)] text-[var(--text-muted)] text-[10px] px-1.5 py-0.2 font-medium">
                        🕒 {ord.time}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[var(--text-main)]">
                      {ord.packageTitle}
                    </span>
                  </div>

                  {/* Immediate Action pill if applicable */}
                  {ord.immediateAction && (
                    <div className="self-start inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--color-primary-light)] text-[var(--color-primary)] text-[10px] font-bold border border-[var(--color-primary-border)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-ping" />
                      <span>Immediate Action</span>
                    </div>
                  )}

                  {/* Customer & Vehicle */}
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-extrabold text-[var(--text-main)]">
                        {ord.customerName}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] mt-0.5">
                        {ord.vehicle}
                      </span>
                      <span className="text-[11px] text-[var(--text-light)] flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[13px] text-[var(--color-primary)]">
                          location_on
                        </span>
                        <span>{ord.address}</span>
                      </span>
                    </div>

                    <a
                      href={`tel:${ord.customerPhone}`}
                      className="btn-secondary text-xs px-2.5 py-1.5 shrink-0 flex items-center gap-1 font-bold"
                    >
                      <span className="material-symbols-outlined text-[14px]">call</span>
                      <span className="hidden sm:inline">Call {ord.customerName.split(' ')[0]}</span>
                    </a>
                  </div>

                  {/* Customer special note */}
                  {ord.notes && (
                    <div className="p-2 rounded-[var(--radius-box-sm)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] italic">
                      Note: "{ord.notes}"
                    </div>
                  )}

                  {/* Price & Payment status */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-sm text-[var(--text-main)]">
                        ${ord.price.toFixed(2)}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          ord.paidOnline
                            ? 'text-emerald-600'
                            : 'text-[var(--color-primary)]'
                        }`}
                      >
                        {ord.paidOnline ? 'Paid Online' : ord.paymentMethod || 'Pre-authorized'}
                      </span>
                    </div>

                    {/* Status badge / selector */}
                    <select
                      value={ord.status}
                      onChange={(e) => handleStatusChange(ord.id, e.target.value as BookingStatus)}
                      className="text-xs font-bold px-2 py-1 rounded bg-[var(--surface-alt)] border border-[var(--border-light)] cursor-pointer"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="on_the_way">On The Way</option>
                      <option value="arrived">Arrived</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  {/* Driver status or Unassigned Action */}
                  {ord.unassigned ? (
                    <div className="p-2.5 rounded-[var(--radius-box-sm)] bg-red-50/70 border border-red-200 flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-[var(--color-primary)] font-bold">
                        <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                        <span>Unassigned Route</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAssignVan(ord.id, 'Marcus', 'Van 2')}
                          className="btn-secondary text-[11px] py-1.5 px-2.5 flex-1 font-bold"
                        >
                          + Assign Marcus (Van 2)
                        </button>
                        <button
                          onClick={() => handleAssignVan(ord.id, 'Raheem', 'Van 4')}
                          className="btn-primary text-[11px] py-1.5 px-2.5 flex-1 font-bold"
                        >
                          + Assign Raheem (Van 4)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 rounded-[var(--radius-box-sm)] bg-[var(--surface-subtle)] text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white font-bold text-[10px] flex items-center justify-center">
                          {ord.driverName?.[0] || 'T'}
                        </div>
                        <span className="font-bold text-[var(--text-main)]">
                          {ord.driverName} ({ord.driverVan})
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          • {ord.driverEta}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Photo Verified Inspection thumbnail */}
                  {ord.photoVerified && (
                    <div className="p-2.5 rounded-[var(--radius-box-sm)] bg-[var(--surface-subtle)] border border-[var(--border-light)] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={ord.photoVerified.thumbnail}
                          alt="Detail inspection"
                          className="w-10 h-10 rounded object-cover border border-[var(--border-light)]"
                        />
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-[var(--text-main)]">
                            Photo Verified Engine Bay &amp; Undercarriage
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {ord.photoVerified.note}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => alert('Opening photo inspector: 3 full-res proof images available.')}
                          className="btn-secondary text-[10px] px-2 py-1 font-bold"
                        >
                          View (3)
                        </button>
                        <button
                          onClick={() => setApprovedPhoto(true)}
                          className={`btn-primary text-[10px] px-2.5 py-1 font-bold ${
                            approvedPhoto ? 'bg-emerald-600' : ''
                          }`}
                        >
                          {approvedPhoto ? '✓ Approved' : 'Approve Detail'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 5. LIVE RATE MATRIX SECTION */}
      <div className="app-card p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[var(--color-primary)]">
              sell
            </span>
            <h3 className="text-sm font-extrabold text-[var(--text-main)]">
              Live Rate Matrix
            </h3>
          </div>
          <button
            onClick={() => alert('Rate editor unlocked for Kelowna zone.')}
            className="text-xs text-[var(--color-primary)] font-bold hover:underline"
          >
            Edit All
          </button>
        </div>

        <div className="flex flex-col divide-y divide-[var(--border-subtle)] text-xs">
          <div className="flex items-center justify-between py-2">
            <span className="font-semibold text-[var(--text-main)]">Basic Clean</span>
            <span className="font-mono font-bold text-[var(--text-main)]">$50 / wash</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="font-semibold text-[var(--text-main)]">Deluxe Clean</span>
            <span className="font-mono font-bold text-[var(--text-main)]">$140 / wash</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="font-semibold text-[var(--text-main)]">Supreme Clean</span>
            <span className="font-mono font-bold text-[var(--color-primary)]">$170 / wash</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <span className="font-semibold text-[var(--text-main)] block">Truck Extra Fee</span>
              <span className="text-[10px] text-[var(--text-muted)]">Oversize vehicle surcharge</span>
            </div>
            <span className="font-mono font-bold text-[var(--text-main)]">+$15–$30</span>
          </div>
        </div>

        <button
          onClick={() => setActiveSegment('rates')}
          className="btn-secondary py-2 text-xs font-bold w-full"
        >
          Open Full Pricing Table
        </button>
      </div>

      {/* 6. FLEET GEOLOCATION */}
      <div className="app-card p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[var(--text-main)]">
              explore
            </span>
            <h3 className="text-sm font-extrabold text-[var(--text-main)]">
              Fleet Geolocation
            </h3>
          </div>
          <span className="badge-pill bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 border border-emerald-200">
            • 3 Vans Active
          </span>
        </div>

        {/* Small simulated map graphic */}
        <div className="h-32 rounded-[var(--radius-box-sm)] bg-slate-200 overflow-hidden relative border border-[var(--border-light)]">
          <img
            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80"
            alt="Kelowna Fleet Map"
            className="w-full h-full object-cover filter brightness-95"
          />
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center gap-3">
            <div className="bg-white/95 px-2.5 py-1 rounded shadow text-[10px] font-bold text-[var(--text-main)] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
              <span>Van 4 (Raheem)</span>
            </div>
            <div className="bg-white/95 px-2.5 py-1 rounded shadow text-[10px] font-bold text-[var(--text-main)] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Van 2 (Marcus)</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[var(--text-main)]">Van 4 - Sprinter (Raheem)</span>
            <span className="text-[10px] font-bold text-emerald-600">Active Wash</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[var(--text-main)]">Van 2 - Ford Transit (Marcus)</span>
            <span className="text-[10px] font-bold text-amber-600">Finishing Up</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[var(--text-main)]">Van 1 - Express Clean (Idle)</span>
            <span className="text-[10px] text-[var(--text-muted)]">Kelowna Base</span>
          </div>
        </div>
      </div>

      {/* 7. OPERATING HOURS */}
      <div className="app-card p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[var(--text-muted)]">
              schedule
            </span>
            <h3 className="text-sm font-extrabold text-[var(--text-main)]">
              Operating Hours
            </h3>
          </div>
          <span className="badge-pill bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 border border-emerald-200">
            Open Now
          </span>
        </div>

        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)]">Monday – Saturday</span>
            <span className="font-bold text-[var(--text-main)]">9:00 AM – 5:00 PM</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)]">Sunday</span>
            <span className="font-bold text-[var(--color-primary)]">Closed (Maintenance)</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
            <span className="text-[var(--text-muted)]">Dispatch Contact</span>
            <span className="font-bold text-[var(--text-main)] font-mono">{BUSINESS_INFO.phone}</span>
          </div>
        </div>

        <button
          onClick={() => alert('Calendar block modal opened for dispatcher.')}
          className="btn-secondary py-2 text-xs font-bold w-full"
        >
          Block Specific Booking Dates
        </button>
      </div>
    </div>
  )
}
