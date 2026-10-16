import React, { useState, useEffect } from 'react'
import { BUSINESS_INFO } from '@/data/mockData'
import { useBookingStore } from '@/store/bookingStore'
import bentleyLuxuryLogo from '@/assets/bentley-luxury-logo.png'

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [isScrolled, setIsScrolled] = useState(false)
  const { openBookingModal } = useBookingStore()

  const navItems = [
    { label: 'Home', href: '#home', id: 'home', icon: 'home' },
    { label: 'About', href: '#about', id: 'about', icon: 'info' },
    { label: 'Services', href: '#services', id: 'services', icon: 'local_car_wash' },
    { label: 'Pricing & Packages', href: '#pricing', id: 'pricing', icon: 'sell' },
    { label: 'Memberships', href: '#memberships', id: 'memberships', icon: 'card_membership' },
    { label: 'Reviews', href: '#reviews', id: 'reviews', icon: 'star' },
    { label: 'Contact', href: '#contact', id: 'contact', icon: 'call' },
  ]

  // Track scroll position for dynamic shadow / glass effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (id: string, href: string) => {
    setActiveSection(id)
    setMobileMenuOpen(false)
    if (href === '#home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50 transition-all duration-300">
      {/* 1. Top Announcement & Contact Bar */}
      <div className="w-full bg-[#1b1e20] text-gray-200 text-[11px] sm:text-[12px] font-medium border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-9 sm:h-10">
          {/* Left Info: Phone, Email, Location */}
          <div className="flex items-center gap-4 sm:gap-6">
            <a
              href={`tel:${BUSINESS_INFO.phoneTel}`}
              className="flex items-center gap-1.5 text-gray-200 hover:text-white transition-colors group"
            >
              <span className="material-symbols-outlined text-primary-container text-[15px] group-hover:scale-110 transition-transform">
                call
              </span>
              <span className="font-semibold">{BUSINESS_INFO.phone}</span>
            </a>

            <div className="hidden md:flex items-center gap-1.5 text-gray-300">
              <span className="material-symbols-outlined text-primary-container text-[15px]">
                location_on
              </span>
              <span>{BUSINESS_INFO.location}</span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 text-gray-300">
              <span className="material-symbols-outlined text-primary-container text-[15px]">
                mail
              </span>
              <a
                href={`mailto:${BUSINESS_INFO.email}`}
                className="hover:text-white transition-colors"
              >
                {BUSINESS_INFO.email}
              </a>
            </div>
          </div>

          {/* Right Info: Live Fleet Status & Hours */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-gray-300">
              <span className="material-symbols-outlined text-primary-container text-[15px]">
                schedule
              </span>
              <span>{BUSINESS_INFO.hours.split('|')[0].trim()}</span>
            </div>

            {/* Pulsing Live Fleet Status Pill */}
            <div className="inline-flex items-center gap-2 bg-white/10 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white border border-white/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="tracking-wide uppercase text-[10px]">Mobile Rig Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Luxury Glass Navigation Bar */}
      <div
        className={`w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] border-b border-gray-200/80 py-2'
            : 'bg-white/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.04)] border-b border-gray-100 py-3'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault()
              handleNavClick('home', '#home')
            }}
            className="flex items-center gap-3.5 group cursor-pointer"
          >
            <div className="relative flex items-center justify-center p-1 rounded-xl bg-gradient-to-br from-white to-gray-50 border border-gray-200/60 shadow-xs group-hover:shadow-md transition-all">
              <img
                src={bentleyLuxuryLogo}
                alt="Bentley Mobile Auto Detail Crest"
                className="h-11 sm:h-12 md:h-13 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(220,38,38,0.25)] group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl sm:text-2xl uppercase tracking-wider text-gray-950 leading-tight">
                  Bentley
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container mb-0.5" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-primary-container">
                Mobile Auto Detail
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 lg:gap-1.5 font-semibold text-sm">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault()
                  handleNavClick(item.id, item.href)
                }}
                className={`transition-all duration-200 px-3.5 py-2 rounded-xl text-sm ${
                  activeSection === item.id
                    ? 'bg-primary-container text-white font-bold shadow-md shadow-red-500/25'
                    : 'text-gray-700 hover:text-gray-950 hover:bg-gray-100/90'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Quick Hotline Pill (Large Screens) */}
            <a
              href={`tel:${BUSINESS_INFO.phoneTel}`}
              className="hidden lg:flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-800 px-3.5 py-2 rounded-xl border border-gray-200/70 transition-all text-xs font-bold shadow-2xs group"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[16px]">phone_in_talk</span>
              </div>
              <span className="font-semibold">{BUSINESS_INFO.phone}</span>
            </a>

            {/* Book Wash Primary CTA */}
            <button
              onClick={() => openBookingModal()}
              className="bg-gradient-to-r from-primary to-primary-container hover:from-primary-container hover:to-primary text-white font-bold text-xs sm:text-sm px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-[0_6px_20px_rgba(220,38,38,0.3)] hover:shadow-[0_8px_25px_rgba(220,38,38,0.45)] transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              <span className="tracking-wide">Book Wash</span>
            </button>

            {/* Mobile Drawer Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <span className="material-symbols-outlined text-[24px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Responsive Mobile Drawer / Navigation Sheet */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white/98 backdrop-blur-2xl border-b border-gray-200 px-4 sm:px-6 py-5 shadow-2xl animate-in slide-in-from-top-3 duration-200">
          <div className="flex flex-col gap-1.5 pb-4">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault()
                  handleNavClick(item.id, item.href)
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeSection === item.id
                    ? 'bg-primary-container text-white font-bold shadow-md shadow-red-500/20'
                    : 'text-gray-800 hover:bg-gray-100 hover:text-gray-950'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] opacity-80">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </a>
            ))}
          </div>

          {/* Quick Action Card in Mobile Menu */}
          <div className="pt-4 border-t border-gray-200 flex flex-col gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                openBookingModal()
              }}
              className="w-full bg-gradient-to-r from-primary to-primary-container text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              <span>Book Online Reservation</span>
            </button>

            <a
              href={`tel:${BUSINESS_INFO.phoneTel}`}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
            >
              <span className="material-symbols-outlined text-primary-container text-[18px]">
                call
              </span>
              <span>Direct Dispatch: {BUSINESS_INFO.phone}</span>
            </a>

            <div className="text-center pt-1 text-[11px] text-gray-500 font-medium">
              <span>{BUSINESS_INFO.hours}</span>
              <br />
              <span>Serving Kelowna, West Kelowna & Okanagan</span>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
