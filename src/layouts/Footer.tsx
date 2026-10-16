import React from 'react'
import { BUSINESS_INFO } from '@/data/mockData'
import { useBookingStore } from '@/store/bookingStore'
import bentleyLuxuryLogo from '@/assets/bentley-luxury-logo.png'

export const Footer: React.FC = () => {
  const { openBookingModal } = useBookingStore()

  return (
    <footer className="w-full bg-surface-container-lowest border-t border-surface-container mt-16">
      {/* Upper 4 Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Col */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <img
                src={bentleyLuxuryLogo}
                alt="Bentley Mobile Auto Detail"
                className="h-14 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(220,38,38,0.25)]"
              />
              <div className="flex flex-col">
                <span className="font-extrabold text-lg uppercase tracking-tight text-on-surface">
                  Bentley
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                  Mobile Auto Detail
                </span>
              </div>
            </div>
            <p className="text-sm text-secondary leading-relaxed">
              Kelowna's premier luxury on-demand mobile detailing experience. We deliver ceramic coating, paint correction, interior sanitation, and pristine showroom finishes right to your doorstep.
            </p>
            <div className="flex items-center gap-2">
              <a
                aria-label="Facebook"
                className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-primary-container hover:text-on-primary flex items-center justify-center text-on-surface transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-[18px]">public</span>
              </a>
              <a
                aria-label="Instagram"
                className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-primary-container hover:text-on-primary flex items-center justify-center text-on-surface transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-base text-on-surface uppercase tracking-wider">
              Navigation
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-secondary">
              <li>
                <a className="hover:text-primary-container transition-colors" href="#home">
                  Home
                </a>
              </li>
              <li>
                <a className="hover:text-primary-container transition-colors" href="#about">
                  About Us
                </a>
              </li>
              <li>
                <a className="hover:text-primary-container transition-colors" href="#services">
                  Services & Packages
                </a>
              </li>
              <li>
                <a className="hover:text-primary-container transition-colors" href="#pricing">
                  Pricing & Rates
                </a>
              </li>
              <li>
                <a className="hover:text-primary-container transition-colors" href="#memberships">
                  VIP Memberships
                </a>
              </li>
              <li>
                <a className="hover:text-primary-container transition-colors" href="#reviews">
                  Customer Reviews
                </a>
              </li>
              <li>
                <a className="hover:text-primary-container transition-colors" href="#contact">
                  Contact & Inquiries
                </a>
              </li>
            </ul>
          </div>

          {/* Coverage & Hours */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-base text-on-surface uppercase tracking-wider">
              Coverage & Hours
            </h3>
            <div className="flex flex-col gap-3 text-sm text-secondary">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary-container text-[20px] shrink-0 mt-0.5">
                  pin_drop
                </span>
                <div>
                  <span className="font-bold text-on-surface block text-xs uppercase tracking-wide">
                    Service Area
                  </span>
                  <span>{BUSINESS_INFO.coverageAreas}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary-container text-[20px] shrink-0 mt-0.5">
                  schedule
                </span>
                <div>
                  <span className="font-bold text-on-surface block text-xs uppercase tracking-wide">
                    Operating Hours
                  </span>
                  <span>Mon-Sat: 9:00 am – 5:00 pm</span>
                  <span className="block text-error font-medium">Sunday: Closed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Contact */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-base text-on-surface uppercase tracking-wider">
              Direct Contact
            </h3>
            <div className="flex flex-col gap-2 text-sm text-secondary">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-[18px]">
                  call
                </span>
                <a
                  className="hover:text-primary-container font-semibold transition-colors"
                  href={`tel:${BUSINESS_INFO.phoneTel}`}
                >
                  {BUSINESS_INFO.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-[18px]">
                  mail
                </span>
                <a
                  className="hover:text-primary-container transition-colors"
                  href={`mailto:${BUSINESS_INFO.email}`}
                >
                  {BUSINESS_INFO.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-[18px]">
                  location_city
                </span>
                <span>{BUSINESS_INFO.location}</span>
              </div>
              <div className="mt-2">
                <button
                  onClick={() => openBookingModal()}
                  className="w-full bg-surface-container-high hover:bg-primary-container hover:text-on-primary text-on-surface font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">event_available</span>
                  <span>Schedule Mobile Unit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULL-WIDTH SIGNATURE RED COPYRIGHT FOOTER BAR (Mirroring User Screenshot) */}
      <div className="w-full bg-primary-container text-on-primary py-4 px-4 text-center text-sm font-semibold tracking-wide shadow-inner">
        <p>{BUSINESS_INFO.copyright}</p>
      </div>
    </footer>
  )
}
