import React, { useState } from 'react'
import {
  BUSINESS_INFO,
  SAVED_VEHICLE,
  DETAILING_PACKAGES,
  MEMBERSHIP_PASSES,
  CLIENT_REVIEWS,
} from '@/data/mockData'
import { DetailPackage } from '@/types'

interface ServicesTabProps {
  onOpenBooking: (pkgId: string) => void
  onQuickInquiry: () => void
}

export const ServicesTab: React.FC<ServicesTabProps> = ({
  onOpenBooking,
  onQuickInquiry,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'exterior' | 'interior' | 'ceramic'>('all')
  const [selectedPkgId, setSelectedPkgId] = useState<string>('supreme-detail')

  const filteredPackages = DETAILING_PACKAGES.filter((pkg) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'exterior') return pkg.category === 'exterior' || pkg.category === 'all'
    if (activeFilter === 'interior') return pkg.category === 'interior' || pkg.category === 'all'
    if (activeFilter === 'ceramic') return pkg.category === 'ceramic' || pkg.category === 'specialty'
    return true
  })

  const currentSelectedPkg =
    DETAILING_PACKAGES.find((p) => p.id === selectedPkgId) || DETAILING_PACKAGES[2]

  return (
    <div className="flex flex-col gap-6 pb-40">
      {/* 1. HERO CARD (Dark Luxury Mobile Detailing) */}
      <section className="app-card-dark p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4">
          {/* Top Pill */}
          <div className="self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] font-semibold text-white/90">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Kelowna's Premier Mobile Unit • 100% Self Sustained • We Come 2 U</span>
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Doorstep Luxury Detailing
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-on-dark-muted)] leading-relaxed max-w-xl">
              Self-contained supreme wash and commercial power dispatch directly to your driveway, workplace, or hanger across Kelowna and Lake Country.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => onOpenBooking('supreme-detail')}
              className="btn-primary px-5 py-2.5 text-xs sm:text-sm flex-1 sm:flex-none shadow-lg active:scale-95"
            >
              <span className="material-symbols-outlined text-[17px]">calendar_month</span>
              <span>Book Detailing</span>
            </button>

            <a
              href={`tel:${BUSINESS_INFO.phoneTel}`}
              className="btn-dark-outline px-4 py-2.5 text-xs sm:text-sm flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[17px]">call</span>
              <span>Quick Inquiry</span>
            </a>
          </div>

          {/* Next Slot nested card */}
          <div className="mt-2 p-3.5 rounded-[var(--radius-box-sm)] bg-[var(--surface-dark-card)] border border-[var(--surface-dark-border)] flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-on-dark-muted)] font-medium">Next Slot:</span>
              <span className="badge-pill bg-[var(--color-primary)] text-white px-2 py-0.5 text-[10px] font-bold">
                • {BUSINESS_INFO.currentSlot}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-white/90 font-medium">
              <span className="material-symbols-outlined text-[17px] text-[var(--color-primary)]">
                local_shipping
              </span>
              <span>{BUSINESS_INFO.currentZone}</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px] text-[var(--text-on-dark-muted)]">
              <span>Select Location: <strong className="text-white">Kelowna, BC</strong></span>
              <button
                onClick={() => onOpenBooking('supreme-detail')}
                className="text-[var(--color-primary)] hover:underline font-semibold cursor-pointer"
              >
                (Change)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SAVED VEHICLE RECOMMENDED BANNER */}
      <section className="app-card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 border-l-[var(--color-primary)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-box-sm)] bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">directions_car</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-[var(--text-main)]">
                {SAVED_VEHICLE.year} {SAVED_VEHICLE.make} {SAVED_VEHICLE.model}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--surface-alt)] text-[var(--text-muted)] font-mono font-semibold">
                {SAVED_VEHICLE.plate}
              </span>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">
              Recommended: <strong className="text-[var(--color-primary)]">{SAVED_VEHICLE.recommendedPackage}</strong> ({SAVED_VEHICLE.reason})
            </span>
          </div>
        </div>

        <button
          onClick={() => onOpenBooking('supreme-detail')}
          className="btn-secondary text-xs px-3.5 py-2 font-bold hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] self-start sm:self-auto shrink-0"
        >
          <span className="material-symbols-outlined text-[15px]">event</span>
          <span>Book for Macan GTS</span>
        </button>
      </section>

      {/* 3. SECTION HEADER & CATEGORY FILTER */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
            Detailing Packages
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            All services include deionized spot-free wash &amp; micro-air blow dry
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All / VIP' },
            { id: 'exterior', label: 'Exterior Wash' },
            { id: 'interior', label: 'Full Detailing & Interior' },
            { id: 'ceramic', label: 'Ceramic & PPF' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'bg-white text-[var(--text-muted)] border border-[var(--border-light)] hover:bg-[var(--surface-subtle)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* 4. DETAILING PACKAGE CARDS */}
      <section className="grid grid-cols-1 gap-5">
        {filteredPackages.map((pkg) => {
          const isSelected = selectedPkgId === pkg.id

          return (
            <div
              key={pkg.id}
              onClick={() => setSelectedPkgId(pkg.id)}
              className={`app-card overflow-hidden transition-all duration-200 cursor-pointer ${
                pkg.highlighted
                  ? 'ring-2 ring-[var(--color-primary)] shadow-md'
                  : 'hover:shadow-md'
              }`}
            >
              {/* Card Photo Header */}
              <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100">
                <img
                  src={pkg.image}
                  alt={pkg.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-102"
                />

                {/* Top left badge */}
                <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                  {pkg.badge}
                </div>

                {/* Top right badges */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  {pkg.kelownaChoice && (
                    <span className="badge-pill bg-[var(--color-primary)] text-white text-[10px] font-extrabold px-2 py-0.8 shadow-sm">
                      ★ Kelowna Choice
                    </span>
                  )}
                  <span className="bg-black/85 backdrop-blur-md text-white font-black text-xs px-2.5 py-1 rounded-md font-mono">
                    {pkg.price}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5 flex flex-col gap-3.5">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-extrabold text-[var(--text-main)]">
                      {pkg.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    {pkg.description}
                  </p>
                </div>

                {/* Feature checklist */}
                <ul className="flex flex-col gap-1.5 pt-1 border-t border-[var(--border-subtle)]">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                      <span className="material-symbols-outlined text-[16px] text-[var(--color-primary)] shrink-0 mt-0.5">
                        check
                      </span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Action button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenBooking(pkg.id)
                  }}
                  className={`w-full py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                    pkg.highlighted
                      ? 'btn-primary'
                      : 'btn-secondary hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                  }`}
                >
                  <span>{pkg.ctaText}</span>
                </button>
              </div>
            </div>
          )
        })}
      </section>

      {/* 5. UNLIMITED & MULTI-WASH PASSES */}
      <section className="flex flex-col gap-3 pt-4">
        <div>
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--color-primary)]">
            Bentley Executive Concierge
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-[var(--text-main)] tracking-tight">
            Unlimited &amp; Multi-Wash Passes
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Keep your vehicle immaculate throughout the year. Share passes between households or fleet vehicles with priority booking locks.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {MEMBERSHIP_PASSES.map((pass) => (
            <div
              key={pass.id}
              className={`app-card p-4 sm:p-5 flex flex-col gap-3.5 ${
                pass.highlighted
                  ? 'border-2 border-[var(--color-primary)] shadow-md'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[var(--text-main)]">
                    {pass.title}
                  </h3>
                  <span className="text-xs text-[var(--text-muted)] block mt-0.5">
                    {pass.washesIncluded}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  {pass.badge && (
                    <span className="badge-pill bg-[var(--color-primary)] text-white text-[9px] font-extrabold px-1.5 py-0.5 mb-1">
                      {pass.badge}
                    </span>
                  )}
                  <span className="text-lg font-black text-[var(--text-main)] font-mono">
                    {pass.price}
                  </span>
                </div>
              </div>

              <ul className="flex flex-col gap-1.5 pt-1 border-t border-[var(--border-subtle)]">
                {pass.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
                    <span className="material-symbols-outlined text-[15px] text-[var(--color-primary)] shrink-0 mt-0.5">
                      check
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onOpenBooking('supreme-detail')}
                className={`py-2 text-xs font-bold ${
                  pass.highlighted ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                {pass.ctaText}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CLIENT EXPERIENCES (REVIEWS) */}
      <section className="flex flex-col gap-3 pt-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[var(--text-main)] tracking-tight">
            Client Experiences
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex text-amber-400 text-xs">
              {'★★★★★'}
            </div>
            <span className="text-xs font-bold text-[var(--text-main)]">5.0 / 5.0 Rating</span>
            <span className="text-[11px] text-[var(--text-muted)]">
              (Over 1,200 details across Kelowna &amp; Vernon)
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {CLIENT_REVIEWS.map((rev) => (
            <div key={rev.id} className="app-card p-3.5 sm:p-4 flex flex-col gap-2">
              <p className="text-xs text-[var(--text-muted)] italic leading-relaxed">
                "{rev.comment}"
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)] text-[11px]">
                <span className="font-bold text-[var(--text-main)]">{rev.author}</span>
                <span className="text-[var(--text-light)]">{rev.source}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. STICKY BOTTOM ACTION BAR (Exact match from screenshot) */}
      <div className="fixed bottom-16 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[var(--border-light)] py-2.5 px-4 shadow-lg">
        <div className="max-w-md md:max-w-xl mx-auto flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
              Selected Package
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-[var(--text-main)]">
                {currentSelectedPkg.title}
              </span>
              <span className="text-xs font-black text-[var(--color-primary)] font-mono">
                • {currentSelectedPkg.price}
              </span>
            </div>
          </div>

          <button
            onClick={() => onOpenBooking(currentSelectedPkg.id)}
            className="btn-primary text-xs px-4 py-2 font-bold shadow-md active:scale-95 shrink-0"
          >
            <span>Proceed to Schedule</span>
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  )
}
