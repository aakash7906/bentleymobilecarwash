import React, { useState } from 'react'
import {
  BUSINESS_INFO,
  SIGNATURE_SERVICES,
  SPECIALIZED_TREATMENTS,
  PRICING_PACKAGES,
  SPECIALTY_RATES,
  MEMBERSHIP_PLANS,
  CLIENT_REVIEWS,
} from '@/data/mockData'
import { useBookingStore } from '@/store/bookingStore'
import { Input } from '@/components/ui/input'
import { HeroSection } from '@/components/hero/HeroSection'

export const HomePage: React.FC = () => {
  const {
    packageId,
    packageName,
    totalPrice,
    isBookingModalOpen,
    openBookingModal,
    closeBookingModal,
    confirmBooking,
    date,
    timeSlot,
    setDateTime,
    customer,
    setCustomer,
    vehicle,
    setVehicle,
  } = useBookingStore()

  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const [confirmedId, setConfirmedId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await confirmBooking()
      setConfirmedId(res.id)
      setBookingConfirmed(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    closeBookingModal()
    setBookingConfirmed(false)
  }

  return (
    <div className="flex flex-col w-full">
      {/* 1. HERO SECTION */}
      <HeroSection onScheduleWash={() => openBookingModal('protection', 'Protection', 75)} />

      {/* 2. VALUE PROPOSITION / ABOUT SECTION */}
      <section id="about" className="w-full bg-surface-container-lowest py-20 border-b border-surface-container">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Visual Column */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-xl overflow-hidden shadow-lg bg-surface-container border border-surface-container">
                <img
                  className="w-full h-[460px] object-cover"
                  alt="Professional mobile automotive technician washing luxury alloy wheel"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6dKpIYEkm1NVZrgvUMNrhpUH2N7UMumVHVUc__rR_8SK4i4KTVwV1PfCVMtVxVhQbFA6PqyF1PIvO7rFQ-KRH6PVR2WZvICJsdSVutRd1EpOaH2MK0-Q_Lqw-Fu8_HiUBjCcTqK76YL6sIBXmRsRpm6beaKvgwab9ax3F0TfjZhNuBTnxTsyhZS0pWpIBhlAjZEk7swmNGgd_habVoxF5LVPSkXs5I258ZkQBIL9fvsM_Auj5AvKi"
                />
              </div>
            </div>

            {/* Content Column */}
            <div className="lg:col-span-7 flex flex-col gap-5 lg:pl-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-widest text-primary-container font-extrabold">
                  Premium-Quality Services, Since {BUSINESS_INFO.foundedYear}
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface">
                  We Are Mobile Car Washing Company
                </h2>
              </div>

              <div className="bg-surface-container-low p-5 rounded-xl shadow-sm border border-surface-container">
                <p className="text-sm text-secondary leading-relaxed">
                  Bentley Mobile Auto Detail Car Wash Ltd. was founded in the year 2018 and launched out to the public in the year 2019. Our company is based upon our client availability time when booking a service with us. We make it easy and friendly to use our service with Bentley Mobile Auto Detail Car Wash Ltd. The unique things about us is that we come to your location even when you are at work as a client. Our service team need nothing but your vehicle. We are equipped with all tools and products to get the job done.
                </p>
              </div>

              {/* Feature Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="p-4 bg-surface-container-high rounded-xl flex flex-col gap-2">
                  <span className="material-symbols-outlined text-primary-container text-[26px]">water_drop</span>
                  <span className="text-sm font-bold text-on-surface">Eco-Tech Formula</span>
                  <span className="text-xs text-secondary leading-relaxed">
                    Zero runoff chemicals safe for residential driveways and office parks.
                  </span>
                </div>
                <div className="p-4 bg-surface-container-high rounded-xl flex flex-col gap-2">
                  <span className="material-symbols-outlined text-primary-container text-[26px]">
                    precision_manufacturing
                  </span>
                  <span className="text-sm font-bold text-on-surface">Fully Self-Sustained</span>
                  <span className="text-xs text-secondary leading-relaxed">
                    Independent power & water units onboard. We need zero hookups.
                  </span>
                </div>
                <div className="p-4 bg-surface-container-high rounded-xl flex flex-col gap-2">
                  <span className="material-symbols-outlined text-primary-container text-[26px]">calendar_month</span>
                  <span className="text-sm font-bold text-on-surface">Flexible Timelines</span>
                  <span className="text-xs text-secondary leading-relaxed">
                    Book while you work, relax at home, or run meetings effortlessly.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE SERVICES SHOWCASE */}
      <section id="services" className="w-full bg-surface-container py-20 border-b border-surface-container">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto gap-2">
            <span className="text-xs uppercase tracking-widest text-primary-container font-extrabold">
              Comprehensive Auto Care
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface">
              Our Signature Services
            </h2>
            <p className="text-sm text-secondary">
              We provide different variations of services which ranges from exterior hand wash to interior detailing with quality work.
            </p>
          </div>

          {/* 3 Primary Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SIGNATURE_SERVICES.map((srv) => (
              <div
                key={srv.id}
                className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-md flex flex-col hover:-translate-y-1 transition-all border border-surface-container"
              >
                <div className="h-56 overflow-hidden">
                  <img
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    alt={srv.title}
                    src={srv.image}
                  />
                </div>
                <div className="p-6 flex flex-col gap-2 grow justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-on-surface">{srv.title}</h3>
                      <span className="text-sm font-extrabold text-primary-container">
                        {srv.price}
                      </span>
                    </div>
                    <p className="text-xs text-secondary mt-2 leading-relaxed">
                      {srv.description}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      openBookingModal(
                        srv.id,
                        srv.title,
                        srv.id === 'exterior' ? 50 : srv.id === 'interior' ? 75 : 140
                      )
                    }
                    className={`mt-4 text-center py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${srv.highlighted
                      ? 'bg-primary-container hover:bg-primary text-on-primary shadow'
                      : 'bg-surface-container hover:bg-primary-container hover:text-on-primary text-on-surface'
                      }`}
                  >
                    {srv.ctaText}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Specialized Automotive Treatments Grid */}
          <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl shadow-sm border border-surface-container mt-2">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-on-surface">Specialized Automotive Treatments</h3>
                <p className="text-xs text-secondary mt-0.5">
                  Targeted enhancements engineered for longevity and exceptional aesthetic gloss.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {SPECIALIZED_TREATMENTS.map((treat, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-surface-container-low rounded-xl flex flex-col items-center text-center gap-1.5 hover:bg-surface-container-high transition-colors border border-surface-container"
                >
                  <span className="material-symbols-outlined text-primary-container text-[28px]">
                    {treat.icon}
                  </span>
                  <span className="text-xs font-bold text-on-surface">{treat.title}</span>
                  <span className="text-[11px] text-secondary">{treat.subtitle}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRICING & PACKAGES */}
      <section id="pricing" className="w-full bg-surface-container-lowest py-20 border-b border-surface-container">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
          <div className="flex flex-col items-center text-center max-w-xl mx-auto gap-2">
            <span className="text-xs uppercase tracking-widest text-primary-container font-extrabold">
              Transparent Rates
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface">
              Pricing & Packages
            </h2>
            <p className="text-sm text-secondary">Simple, upfront pricing. No hidden fees or unexpected water surcharge.</p>
          </div>

          {/* Pricing Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {PRICING_PACKAGES.map((pkg) => {
              const isPopular = pkg.popular
              return (
                <div
                  key={pkg.id}
                  className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all relative ${isPopular
                    ? 'bg-primary-container text-on-primary shadow-2xl lg:-translate-y-2'
                    : 'bg-surface-container-low text-on-surface shadow-sm hover:shadow-md border border-surface-container'
                    }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-4 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase shadow-md">
                      Most Popular
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col">
                      <h3 className={`text-2xl font-bold ${isPopular ? 'text-on-primary' : 'text-on-surface'}`}>
                        {pkg.name}
                      </h3>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className={`text-4xl font-extrabold ${isPopular ? 'text-on-primary' : 'text-on-surface'}`}>
                          ${pkg.price}
                        </span>
                        <span className={`text-xs ${isPopular ? 'text-on-primary/80' : 'text-secondary'}`}>
                          {pkg.unit}
                        </span>
                      </div>
                    </div>

                    {/* Bar Motif */}
                    <div
                      className={`h-2 w-full rounded-full my-1 ${isPopular
                        ? 'bg-gradient-to-r from-on-primary to-on-primary/20'
                        : 'bg-gradient-to-r from-primary-container to-primary-container/20'
                        }`}
                    />

                    <ul className={`flex flex-col gap-2 text-xs mt-2 ${isPopular ? 'text-on-primary' : 'text-on-surface'}`}>
                      {pkg.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-[18px] ${isPopular ? 'text-on-primary' : 'text-primary-container'}`}>
                            check
                          </span>
                          <span>{feat}</span>
                        </li>
                      ))}
                      {pkg.excludedFeatures?.map((ex, i) => (
                        <li key={i} className="flex items-center gap-2 text-secondary/50">
                          <span className="material-symbols-outlined text-[18px]">close</span>
                          <del>{ex}</del>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => openBookingModal(pkg.id, pkg.name, pkg.price)}
                    className={`mt-8 block text-center py-3 rounded-lg text-sm font-bold transition-colors cursor-pointer ${isPopular
                      ? 'bg-surface-container-lowest text-primary-container shadow-lg hover:bg-surface-container-low'
                      : pkg.id === 'deluxe'
                        ? 'bg-primary-container hover:bg-primary text-on-primary'
                        : 'bg-surface-container-highest hover:bg-surface-container-high text-on-surface'
                      }`}
                  >
                    {pkg.ctaText}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Specialty Vehicle Rates Strip */}
          <div className="bg-surface-container p-6 rounded-2xl shadow-sm flex flex-col gap-4 border border-surface-container">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-[24px]">stars</span>
                <span className="text-base font-bold text-on-surface">
                  Specialty Vehicle & Deep Restoration Fleet Rates
                </span>
              </div>
              <span className="text-xs text-secondary hidden sm:inline">
                Custom quotes available for fleet accounts
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {SPECIALTY_RATES.map((spec, i) => (
                <div key={i} className="bg-surface-container-lowest p-3.5 rounded-xl flex flex-col border border-surface-container">
                  <span className="text-secondary text-[11px] uppercase tracking-wide font-bold">
                    {spec.name}
                  </span>
                  <span className="font-extrabold text-xl text-on-surface mt-1">{spec.price}</span>
                  <span className="text-[11px] text-secondary mt-0.5">{spec.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. VIP MEMBERSHIPS */}
      <section id="memberships" className="w-full bg-surface-container-high py-20 border-b border-surface-container">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="flex flex-col gap-1 max-w-xl">
              <span className="text-xs uppercase tracking-widest text-primary-container font-extrabold">
                Frequent Wash Club
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface">
                VIP Membership & Fleet Savings
              </h2>
              <p className="text-sm text-secondary">
                Lock in regular monthly maintenance and ensure your vehicles maintain maximum resale value without booking manually every time.
              </p>
            </div>
            <div className="bg-primary-container text-on-primary px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-md">
              <span className="material-symbols-outlined text-[24px]">verified</span>
              <div>
                <span className="text-xs block font-bold">Unlimited Wash Pass</span>
                <span className="text-[11px] text-primary-fixed">Get Plan & Save With Us</span>
              </div>
            </div>
          </div>

          {/* Membership Cards Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {MEMBERSHIP_PLANS.map((plan) => {
              const isElite = plan.popular
              return (
                <div
                  key={plan.id}
                  className={`bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-md flex flex-col justify-between border ${isElite ? 'border-2 border-primary-container shadow-xl' : 'border-surface-container'
                    }`}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded text-xs uppercase tracking-wide font-extrabold ${plan.tier === 'Gold Tier'
                          ? 'bg-amber-100 text-amber-900'
                          : isElite
                            ? 'bg-primary-container text-on-primary'
                            : 'bg-secondary-container text-on-secondary-container'
                          }`}
                      >
                        {plan.tier}
                      </span>
                      <span
                        className={`material-symbols-outlined text-[24px] ${plan.tier === 'Gold Tier'
                          ? 'text-amber-500'
                          : isElite
                            ? 'text-primary-container'
                            : 'text-secondary'
                          }`}
                      >
                        {plan.tier === 'Gold Tier' ? 'workspace_premium' : isElite ? 'diamond' : 'tune'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-on-surface">{plan.name}</h3>
                      <p className="text-3xl font-extrabold text-on-surface mt-1">{plan.price}</p>
                      <span className="text-secondary text-xs">{plan.duration}</span>
                    </div>

                    <ul className="flex flex-col gap-2 text-xs text-on-surface mt-1">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary-container text-[18px]">
                            check
                          </span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => openBookingModal(plan.id, plan.name, plan.price === '$1,200' ? 1200 : 1500)}
                    className={`mt-8 block text-center py-3 rounded-lg text-sm font-bold transition-colors cursor-pointer ${isElite
                      ? 'bg-primary-container hover:bg-primary text-on-primary shadow'
                      : 'bg-surface-container-high hover:bg-surface-container text-on-surface'
                      }`}
                  >
                    {plan.ctaText}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section id="reviews" className="w-full bg-surface-container py-20 border-b border-surface-container">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
          <div className="flex flex-col items-center text-center max-w-xl mx-auto gap-2">
            <span className="text-xs uppercase tracking-widest text-primary-container font-extrabold">
              Happy Cars, Happy Clients
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface">
              Client Reviews & Testimonials
            </h2>
            <p className="text-sm text-secondary">
              Read authentic feedback directly from car owners across Kelowna.
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CLIENT_REVIEWS.map((rev) => (
              <div
                key={rev.id}
                className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex flex-col justify-between border border-surface-container"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center text-amber-500">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-on-surface italic leading-relaxed">
                    "{rev.comment}"
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 mt-2 border-t border-surface-container">
                  <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface font-extrabold text-xs">
                    {rev.avatarInitial}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">{rev.author}</span>
                    <span className="text-[11px] text-secondary">{rev.locationOrType}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FINAL CONVERSION BANNER */}
      <section id="contact" className="w-full bg-inverse-surface text-inverse-on-surface py-20 relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-primary-container/20 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-surface-container-lowest/10 backdrop-blur-md rounded-2xl p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 border border-white/10">
            <div className="flex flex-col gap-2 max-w-xl text-center lg:text-left">
              <span className="text-xs uppercase tracking-widest text-primary-fixed-dim font-extrabold">
                Ready for That Fresh Showroom Feeling?
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-surface">
                Book Your Mobile Wash Today
              </h2>
              <p className="text-sm text-secondary-fixed-dim leading-relaxed">
                Serving Kelowna, West Kelowna, Lake Country & Peachland. Simply pick a time, leave us your location, and we take care of the rest.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <button
                onClick={() => openBookingModal('protection', 'Protection', 75)}
                className="w-full sm:w-auto bg-primary-container hover:bg-primary text-on-primary font-bold text-sm px-8 py-4 rounded-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                <span>Online Reservation</span>
              </button>
              <a
                className="w-full sm:w-auto bg-surface-container-lowest text-on-surface hover:bg-surface-container-high font-bold text-sm px-8 py-4 rounded-lg shadow transition-all flex items-center justify-center gap-2"
                href={`tel:${BUSINESS_INFO.phoneTel}`}
              >
                <span className="material-symbols-outlined text-primary-container text-[20px]">call</span>
                <span>Call {BUSINESS_INFO.phone}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 8. INTERACTIVE BOOKING / RESERVATION MODAL */}
      {isBookingModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal()
          }}
        >
          <div className="relative w-full max-w-lg bg-surface-container-lowest border border-surface-container rounded-2xl shadow-2xl p-6 text-on-surface max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            {/* Header */}
            <div className="mb-4 pr-6">
              <h2 className="text-2xl font-bold text-on-surface">
                {bookingConfirmed ? 'Appointment Reserved!' : 'Schedule Mobile Unit'}
              </h2>
              <p className="text-xs text-secondary mt-1">
                {bookingConfirmed
                  ? 'Your mobile unit has been dispatched to the schedule.'
                  : `Complete your booking for ${packageName} ($${totalPrice}).`}
              </p>
            </div>

            {bookingConfirmed ? (
              <div className="p-5 rounded-xl bg-surface-container-low border border-surface-container space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-surface-container">
                  <span className="text-secondary">Booking Reference:</span>
                  <span className="font-mono text-primary-container font-extrabold text-sm">
                    {confirmedId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Service Date:</span>
                  <span className="font-bold text-on-surface">{date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Arrival Window:</span>
                  <span className="font-bold text-on-surface">{timeSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Selected Package:</span>
                  <span className="font-bold text-on-surface">{packageName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Service Address:</span>
                  <span className="font-bold text-on-surface">
                    {customer.address}, {customer.city}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-surface-container font-bold text-sm">
                  <span>Estimated Price:</span>
                  <span className="text-primary-container font-extrabold">${totalPrice}</span>
                </div>
                <p className="text-[11px] text-secondary pt-1">
                  * Zero upfront payment. Card / cash payment after on-site quality inspection.
                </p>

                <div className="pt-3">
                  <button
                    onClick={handleCloseModal}
                    className="w-full bg-primary-container hover:bg-primary text-on-primary font-bold py-3 rounded-lg shadow cursor-pointer transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-on-surface block mb-1">
                      Full Name *
                    </label>
                    <Input
                      placeholder="Your Name"
                      value={customer.fullName}
                      onChange={(e) => setCustomer({ fullName: e.target.value })}
                      required
                      className="bg-surface-container-lowest border-surface-container text-on-surface"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-on-surface block mb-1">
                      Phone *
                    </label>
                    <Input
                      placeholder="(250) 000-0000"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ phone: e.target.value })}
                      required
                      className="bg-surface-container-lowest border-surface-container text-on-surface"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={customer.email}
                    onChange={(e) => setCustomer({ email: e.target.value })}
                    required
                    className="bg-surface-container-lowest border-surface-container text-on-surface"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-on-surface block mb-1">
                      Street Address (Home/Office) *
                    </label>
                    <Input
                      placeholder="e.g. 1420 Water St"
                      value={customer.address}
                      onChange={(e) => setCustomer({ address: e.target.value })}
                      required
                      className="bg-surface-container-lowest border-surface-container text-on-surface"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-on-surface block mb-1">
                      City (Okanagan Area) *
                    </label>
                    <Input
                      placeholder="Kelowna"
                      value={customer.city}
                      onChange={(e) => setCustomer({ city: e.target.value })}
                      required
                      className="bg-surface-container-lowest border-surface-container text-on-surface"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-on-surface block mb-1">
                      Vehicle Year, Make & Model *
                    </label>
                    <Input
                      placeholder="e.g. 2023 Honda CRV"
                      value={vehicle.make}
                      onChange={(e) => setVehicle({ make: e.target.value })}
                      required
                      className="bg-surface-container-lowest border-surface-container text-on-surface"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-on-surface block mb-1">
                      Desired Date *
                    </label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDateTime(e.target.value, timeSlot)}
                      required
                      className="bg-surface-container-lowest border-surface-container text-on-surface"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex items-center justify-between text-xs">
                  <span className="font-semibold text-secondary">Service Package:</span>
                  <span className="font-extrabold text-primary-container text-sm">
                    {packageName} • ${totalPrice}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary-container hover:bg-primary text-on-primary font-bold py-3 rounded-lg shadow cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Reserving...' : `Confirm Reservation • $${totalPrice}`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
