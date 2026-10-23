import React from 'react'
import {
  ChevronLeft,
  Sparkles,
  Leaf,
  Wrench,
  Droplets,
  Car,
  Gauge,
  ShoppingBag,
  Clock,
  ShieldCheck,
  MapPin,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Phone,
  Zap,
} from 'lucide-react'
import logoBentley from '@/assets/Logo_Bentley.png'

interface AboutUsPageProps {
  isOpen: boolean
  onClose: () => void
  onBookNow?: () => void
  onContactUs?: () => void
  onShopProducts?: () => void
}

export const AboutUsPage: React.FC<AboutUsPageProps> = ({
  isOpen,
  onClose,
  onBookNow,
  onContactUs,
  onShopProducts,
}) => {
  if (!isOpen) return null

  // 6 Specialized Pillars from Reference
  const pillars = [
    {
      icon: Leaf,
      iconBg: 'bg-emerald-500',
      title: 'Eco-Friendly Practices',
      description:
        'We use biodegradable, earth-safe cleaning formulas and water-conscious techniques to protect both your paintwork and the beautiful Okanagan environment.',
      tag: 'Environment First',
    },
    {
      icon: Droplets,
      iconBg: 'bg-blue-500',
      title: 'Personalized Hand Wash',
      description:
        'Meticulous two-bucket hand wash with ultra-soft microfiber mitts. A customized touch that automated tunnels simply cannot replicate.',
      tag: '100% Scratch-Free',
    },
    {
      icon: Car,
      iconBg: 'bg-primary',
      title: 'Deep Interior Clean',
      description:
        'Comprehensive interior sanitization, steam carpet extraction, leather conditioning, and odor neutralization that protects your vehicle’s resale value.',
      tag: 'Showroom Interior',
    },
    {
      icon: Gauge,
      iconBg: 'bg-amber-500',
      title: 'Engine Bay Cleaning',
      description:
        'Professional engine degreasing and protective dressing to remove grime, prevent corrosion, maintain cooling performance, and prevent costly repairs.',
      tag: 'Peak Performance',
    },
    {
      icon: Wrench,
      iconBg: 'bg-purple-600',
      title: 'Mobile Oil Change',
      description:
        'Complete engine oil and filter replacement performed on-site at your location. Routine maintenance handled seamlessly alongside your detailing.',
      tag: 'Total Convenience',
    },
    {
      icon: ShoppingBag,
      iconBg: 'bg-neutral-900',
      title: 'Proprietary Care Products',
      description:
        'We engineer and bottle our own professional-grade detailing chemicals. Used in our mobile fleet and available on our store and Amazon.',
      tag: 'Shop Direct',
    },
  ]

  // Stats Highlights
  const stats = [
    { label: 'Founded', value: '2018', sub: 'Public Launch 2019' },
    { label: 'Self-Sufficient', value: '100%', sub: 'Own Water & Power' },
    { label: 'Okanagan Valley', value: 'Kelowna', sub: 'Mobile Dispatch' },
    { label: 'Formulas', value: 'Eco-Safe', sub: 'Biodegradable' },
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full border border-gray-200/90 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer shadow-xs"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-base sm:text-lg font-bold text-gray-900 text-center flex-1">
          About Us
        </h1>
        <div className="w-10" />
      </header>

      {/* Main Content Body */}
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 flex flex-col gap-6">

        {/* Hero Section */}
        <div className="text-center flex flex-col items-center gap-3 pt-2">


          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight max-w-lg">
            Bentley Mobile Auto Detail Car Wash Ltd.
          </h2>

          <p className="text-xs sm:text-sm text-gray-500 max-w-md leading-relaxed">
            Founded in 2018 and launched to the public in 2019, Bentley Mobile Auto Detail is built around your schedule. We deliver luxury detailing directly to your driveway, office, or workplace.
          </p>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-surface-subtle border border-gray-200/80 text-center flex flex-col items-center justify-center gap-0.5 hover:bg-white hover:shadow-xs transition-all"
            >
              <span className="text-lg sm:text-xl font-black text-primary tracking-tight">
                {stat.value}
              </span>
              <span className="text-xs font-bold text-gray-900 leading-tight">
                {stat.label}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                {stat.sub}
              </span>
            </div>
          ))}
        </div>

        {/* Our Story Card (Clean, Realistic & Project-Aligned) */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-gray-200/90 shadow-2xs flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center text-primary">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block leading-tight">
                  Heritage &amp; Mission
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-gray-900 leading-tight">
                  Our Story
                </h3>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-surface-alt text-gray-700 border border-gray-200">
              Est. 2018
            </span>
          </div>

          {/* Narrative Body */}
          <div className="flex flex-col gap-2">
            <h4 className="text-sm sm:text-base font-bold text-gray-950">
              We Need Nothing But Your Vehicle
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Bentley Mobile Auto Detail Car Wash Ltd. was founded in the year 2018 and officially launched in 2019. The unique thing about our service is that <strong>we come to your exact location</strong> — even while you are at work.
            </p>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Our mobile units arrive 100% self-contained with our own spot-free deionized water, electric power, and professional equipment. You don't need to hook up a single hose or cord. We leave every job site with a fresh vehicle and a smiling client across Kelowna and the Okanagan Valley.
            </p>
          </div>

          {/* 3 Realistic On-Site Capability Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-surface-subtle border border-gray-200/70 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Droplets className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-gray-900 leading-tight">Deionized Water</span>
                <span className="text-[11px] text-gray-500">Spot-free wash onboard</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-surface-subtle border border-gray-200/70 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                <Zap className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-gray-900 leading-tight">Silent Power</span>
                <span className="text-[11px] text-gray-500">No external outlet needed</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-surface-subtle border border-gray-200/70 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-gray-900 leading-tight">Fully Insured</span>
                <span className="text-[11px] text-gray-500">Licensed Okanagan team</span>
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
                Why Choose Bentley?
              </h3>
              <p className="text-xs text-gray-500">
                Craftsmanship, convenience, and eco-conscious car care
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5" /> Certified Quality
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-2xs flex flex-col gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary-light text-primary flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                Ultimate Convenience
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Book around your availability. We arrive at your home or workplace with zero disruption to your day.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-2xs flex flex-col gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
                <Leaf className="w-5 h-5" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                Eco-Friendly Practices
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Non-toxic, biodegradable chemicals and closed-loop wash processes minimize environmental impact.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-2xs flex flex-col gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                Trusted Reputation
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Hundreds of 5-star reviews from Okanagan vehicle owners. High quality of work is always guaranteed.
              </p>
            </div>
          </div>
        </div>

        {/* 6 Specialized Services Pillars */}
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
              Our Core Services &amp; Products
            </h3>
            <p className="text-xs text-gray-500">
              Personalized automotive care from bumper to bumper
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pillars.map((item, idx) => {
              const IconComp = item.icon
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-2xs hover:shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between gap-2.5 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl ${item.iconBg} text-white flex items-center justify-center shrink-0 shadow-sm shadow-gray-200 group-hover:scale-105 transition-transform`}
                      >
                        <IconComp className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-primary">
                          {item.tag}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Service Region & Location Info */}
        <div className="bg-surface-subtle border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Service Coverage</p>
              <p className="text-[11px] text-gray-500">Kelowna, West Kelowna, Lake Country &amp; Okanagan Valley, BC</p>
            </div>
          </div>
          <div className="text-[11px] text-gray-500 font-medium">
            Mon-Sat: 9:00 am – 5:00 pm • Sunday: Closed
          </div>
        </div>

        {/* Action Callout */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
          {onBookNow && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onBookNow()
              }}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Car className="w-4 h-4" />
              <span>Book a Mobile Wash</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {onContactUs && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onContactUs()
              }}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4 text-primary" />
              <span>Contact Bentley Team</span>
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

export default AboutUsPage
