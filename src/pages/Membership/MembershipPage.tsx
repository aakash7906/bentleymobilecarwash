import React, { useState } from 'react'
import { ChevronLeft, Check, Phone, Mail, X, ShieldCheck } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { Dialog } from '@/components/ui/dialog'

export interface MembershipPlan {
  id: string
  name: string
  description: string
  price: string
  washesCount?: number
  validity: string
  image: string
  fallbackImage: string
  features: string[]
  badge?: string
}

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'gold',
    name: 'Gold Membership',
    description: 'Our Gold Membership provides $1200 for 5 washes.',
    price: '$1200',
    washesCount: 5,
    validity: 'Valid for 3 months from issue date',
    image: '/membership/95fda802914acec1b3f98e1223a37d7969ef11ae.webp',
    fallbackImage: '/membership/95fda802914acec1b3f98e1223a37d7969ef11ae.png',
    badge: 'Popular',
    features: [
      '5 Complete premium mobile auto washes & details',
      'Valid for 3 months from the date issued',
      'Priority scheduling & weekend availability',
      'Eco-friendly water & power on-site provided',
      'Transferable to any family vehicle',
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum Membership',
    description: 'Our Platinum Membership provides $1500 for 8 washes.',
    price: '$1500',
    washesCount: 8,
    validity: 'Valid for 3 months from issue date',
    image: '/membership/c19277a5438f57fbc596fe0cd0eb6fde7202f81e.webp',
    fallbackImage: '/membership/c19277a5438f57fbc596fe0cd0eb6fde7202f81e.png',
    badge: 'Best Value',
    features: [
      '8 Comprehensive executive auto details & washes',
      'Includes premium exterior wax & wheel ceramic coating',
      'Valid for 3 months from the date issued',
      'VIP booking queue with 24/7 hotline support',
      'Free interior ozone odor elimination treatment',
    ],
  },
  {
    id: 'general',
    name: 'General Membership',
    description:
      'It gives you up to 4months of service whenever you want to call us for more info on our membership card and how it works.',
    price: 'Custom',
    validity: 'Up to 4 months of flexible service',
    image: '/membership/920d4193c6bbb23d4395b508e6efc2131d389b9a.webp',
    fallbackImage: '/membership/920d4193c6bbb23d4395b508e6efc2131d389b9a.png',
    features: [
      'Up to 4 months of flexible detailing whenever you need',
      'Customized package suited to your vehicle fleet or family',
      'Direct line to Bentley scheduling team',
      'Special discounted add-on service rates',
      'Complete satisfaction guarantee',
    ],
  },
]

/**
 * Preloads all membership card images in memory for 0ms delay when opened
 */
export const preloadMembershipImages = () => {
  if (typeof window === 'undefined') return
  MEMBERSHIP_PLANS.forEach((plan) => {
    const img = new Image()
    img.src = plan.image
  })
}


interface MembershipPageProps {
  onBack: () => void
  onContactSupport?: () => void
  onSelectMembership?: (planName: string) => void
  currentTier?: string
}

export const MembershipPage: React.FC<MembershipPageProps> = ({
  onBack,
  onSelectMembership,
  currentTier,
}) => {
  // Global Toast Hook
  const { showToast } = useToast()
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null)
  const [inquirySuccess, setInquirySuccess] = useState(false)

  const handleSelectPlan = (plan: MembershipPlan) => {
    setSelectedPlan(plan)
    setInquirySuccess(false)
  }

  const handlePurchaseInquiry = () => {
    setInquirySuccess(true)
    const planName = selectedPlan?.name || 'Membership'
    if (onSelectMembership) {
      onSelectMembership(planName)
    }
    setTimeout(() => {
      // Auto close modal after brief confirmation and trigger global toast
      setInquirySuccess(false)
      setSelectedPlan(null)
      showToast(`Subscribed to ${planName}! Your profile membership is updated.`, 'success')
      onBack()
    }, 1000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto animate-in slide-in-from-right duration-200">
      <div className="w-full max-w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto min-h-screen flex flex-col bg-white">
        {/* Top Header */}
        <div className="sticky top-0 z-30 bg-white px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
          <button
            onClick={onBack}
            aria-label="Go back"
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white text-gray-800 hover:bg-gray-50 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-gray-800 stroke-[2.2]" />
          </button>

          <h1 className="text-lg font-bold text-gray-900 tracking-tight text-center flex-1 pr-10">
            Membership
          </h1>
        </div>

        {/* Content Section */}
        <div className="px-5 pt-6 pb-16 flex flex-col">
          {/* Subtitle Intro */}
          <p className="text-[15px] sm:text-base font-medium text-gray-800 leading-snug tracking-tight mb-6">
            Our Membership card gives you the opportunity to any one of our great services of your
            choice.
          </p>

          {/* Membership Cards List */}
          <div className="flex flex-col gap-4">
            {MEMBERSHIP_PLANS.map((plan) => (
              <div
                key={plan.id}
                onClick={() => handleSelectPlan(plan)}
                className="group relative w-full rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-hover p-5 sm:p-6 text-white shadow-md hover:shadow-xl active:scale-[0.99] transition-all cursor-pointer overflow-hidden"
              >
                {/* Subtle Geometric Grid Background Pattern (matching design) */}
                <div
                  className="absolute inset-0 opacity-[0.07] pointer-events-none"
                  style={{
                    backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
                    backgroundSize: '18px 18px',
                  }}
                />

                {/* Soft glow radial highlight */}
                <div className="absolute top-0 right-1/4 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between gap-3">
                  {/* Left Column: Title and Description */}
                  <div className="flex-1 flex flex-col justify-center pr-1">
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-white tracking-tight leading-tight drop-shadow-sm">
                      {plan.name}
                    </h2>
                    <p className="text-xs sm:text-[13px] text-white/95 font-medium leading-relaxed mt-2.5">
                      {plan.description}
                    </p>
                  </div>

                  {/* Right Column: Angled Membership Card Image */}
                  <div className="w-32 sm:w-40 shrink-0 flex items-center justify-center">
                    <picture>
                      <source srcSet={plan.image} type="image/webp" />
                      <img
                        src={plan.fallbackImage}
                        alt={plan.name}
                        loading="eager"
                        decoding="async"
                        width={160}
                        height={120}
                        className="w-full h-auto object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.35)] group-hover:scale-105 transition-transform duration-300"
                      />
                    </picture>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Help & Concierge Box */}
          <div className="mt-8 p-4 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-900">Need a custom fleet card?</span>
                <span className="text-[11px] text-gray-500">
                  Call our team to set up a personalized wash schedule.
                </span>
              </div>
            </div>
            <a
              href="tel:+12502580035"
              className="px-3.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary-hover text-secondary-foreground text-xs font-semibold transition-colors shrink-0"
            >
              Call Us
            </a>
          </div>

          {/* iOS Home Indicator spacer */}
          <div className="w-32 h-1 bg-gray-200 rounded-full mx-auto mt-12 mb-2" />
        </div>
      </div>

      {/* Plan Details & Purchase Inquiry Modal */}
      <Dialog
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        position="bottom-sheet"
        maxWidth="md"
        contentClassName="p-6 max-h-[90vh] overflow-y-auto flex flex-col"
      >
        {selectedPlan && (
          <>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-gray-900">{selectedPlan.name}</h3>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Card Banner */}
            <div className="mt-4 rounded-xl bg-gradient-to-r from-primary to-primary-hover p-4 text-white flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-red-200">
                  {selectedPlan.validity}
                </span>
                <div className="text-2xl font-black mt-0.5">{selectedPlan.price}</div>
              </div>
              <picture className="w-24 shrink-0 flex items-center justify-end">
                <source srcSet={selectedPlan.image} type="image/webp" />
                <img
                  src={selectedPlan.fallbackImage}
                  alt={selectedPlan.name}
                  loading="eager"
                  decoding="async"
                  width={96}
                  height={72}
                  className="w-24 h-auto object-contain filter drop-shadow-md"
                />
              </picture>
            </div>

            {/* Features List */}
            <div className="mt-5 flex flex-col gap-2.5">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                What's Included:
              </span>
              {selectedPlan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-700">
                  <div className="w-4 h-4 rounded-full bg-primary-light text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* Contact concierge options */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <a
                  href="tel:+12503519155"
                  className="flex-1 py-2.5 px-3 rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-gray-600" />
                  <span>Call (250) 351-9155</span>
                </a>
                <a
                  href="mailto:bentleymobilecarwash@gmail.com"
                  className="flex-1 py-2.5 px-3 rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-gray-600" />
                  <span>Email Bentley</span>
                </a>
              </div>

              {/* Purchase / Inquire Button */}
              <button
                onClick={handlePurchaseInquiry}
                disabled={inquirySuccess}
                className="w-full py-3.5 rounded-lg bg-primary hover:bg-primary-hover active:scale-[0.99] text-primary-foreground text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {inquirySuccess ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Inquiry Sent! We will contact you shortly.</span>
                  </>
                ) : (
                  <span>Request Membership Card</span>
                )}
              </button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  )
}
