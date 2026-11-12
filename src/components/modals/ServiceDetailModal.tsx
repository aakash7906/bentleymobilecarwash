import React, { useState, useEffect } from 'react'
import { ChevronLeft, Check, ArrowRight } from 'lucide-react'
import { ServiceItem } from '@/types'

interface ServiceDetailModalProps {
  service: ServiceItem | null
  onClose: () => void
  onBookNow: (service: ServiceItem) => void
}

const resolveInitialTier = (srv: ServiceItem | null): 'car' | 'suv' | 'truck' => {
  if (!srv) return 'car'
  if (srv.selectedTier) return srv.selectedTier
  if (srv.tieredPricing && srv.priceNumeric) {
    if (srv.priceNumeric === srv.tieredPricing.suv) return 'suv'
    if (srv.priceNumeric === srv.tieredPricing.truck) return 'truck'
    if (srv.priceNumeric === srv.tieredPricing.car) return 'car'
  }
  const vm = (srv.vehicleModel || '').toLowerCase()
  if (vm.startsWith('suv') || vm.includes('suv')) return 'suv'
  if (vm.startsWith('truck') || vm.includes('truck') || vm.includes('van')) return 'truck'
  return 'car'
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  onBookNow,
}) => {
  const [isOrderSummary, setIsOrderSummary] = useState(false)
  const [booked, setBooked] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'car' | 'suv' | 'truck'>(() =>
    resolveInitialTier(service)
  )

  useEffect(() => {
    if (service) {
      setSelectedTier(resolveInitialTier(service))
      setIsOrderSummary(false)
      setBooked(false)
    }
  }, [service?.id, service?.selectedTier, service?.priceNumeric, service?.vehicleModel])

  if (!service) return null

  const isPremiumDetail = service.id === 'premium-detail' && !!service.tieredPricing

  const isPackage =
    service.category === 'Cleaning Packages' ||
    service.category === 'Specialty'

  const activePrice =
    isPremiumDetail && service.tieredPricing && service.tieredPricing[selectedTier]
      ? `$${service.tieredPricing[selectedTier]}.00+`
      : service.price
  const activeNumeric =
    isPremiumDetail && service.tieredPricing && service.tieredPricing[selectedTier]
      ? service.tieredPricing[selectedTier]
      : service.priceNumeric

  const handleAction = () => {
    const preparedService: ServiceItem = {
      ...service,
      selectedTier: isPremiumDetail ? selectedTier : undefined,
      price: isPremiumDetail ? activePrice : service.price,
      priceNumeric: isPremiumDetail ? (activeNumeric ?? 0) : (service.priceNumeric ?? 0),
      vehicleModel: isPremiumDetail
        ? selectedTier === 'car'
          ? 'Car (Sedan/Coupe/Hatchback)'
          : selectedTier === 'suv'
          ? 'SUV'
          : 'Truck / Van'
        : service.vehicleModel || 'Standard Package',
    }
    onBookNow(preparedService)
    setIsOrderSummary(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto animate-in slide-in-from-bottom duration-200">
      <div className="w-full max-w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto min-h-screen flex flex-col bg-white pb-12">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <button
            onClick={() => {
              if (isOrderSummary) {
                setIsOrderSummary(false)
              } else {
                onClose()
              }
            }}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-base font-bold text-gray-900 text-center flex-1">
            {isOrderSummary ? 'Order Summary' : service.title}
          </h1>
          <div className="w-9" />
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-4">
          {isPackage ? (
            <>
              {/* Service Image */}
              <div className="relative h-56 w-full rounded-2xl overflow-hidden bg-slate-100">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover"
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
                {service.badge && (
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-primary/95 text-white text-[11px] font-bold tracking-wider uppercase backdrop-blur-xs shadow-sm">
                    {service.badge}
                  </span>
                )}
                <span className="absolute top-3 right-3 px-3 py-1 rounded-lg bg-black/70 text-white text-[11px] font-semibold tracking-wide backdrop-blur-xs">
                  ⏱ {service.estTime}
                </span>
              </div>

              {/* Pricing & Category - Only packages have prices */}
              <div className="flex items-center justify-between pt-1">
                <span className="px-3 py-1 rounded-full bg-primary-light text-primary text-[11px] font-bold">
                  {service.category}
                </span>
                <div className="text-right">
                  <span className="text-[11px] text-gray-500 block">
                    {isPremiumDetail ? 'Vehicle Pricing' : 'Package Price'}
                  </span>
                  <span className="text-lg font-bold text-primary font-mono">
                    {activePrice}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">{service.title}</h2>
              </div>

              {/* Tiered Vehicle Selector if applicable - ONLY FOR PREMIUM DETAIL */}
              {isPremiumDetail && service.tieredPricing && (
                <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-900">Select Vehicle Category:</span>
                    <span className="text-[10px] text-amber-800 font-medium tracking-tight">Prices may vary depending on vehicle</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTier('car')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-0.5 border transition-all cursor-pointer ${
                        selectedTier === 'car'
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-base">🚗</span>
                      <span>Car</span>
                      <span className="text-[11px] opacity-90 font-mono">${service.tieredPricing.car}+</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTier('suv')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-0.5 border transition-all cursor-pointer ${
                        selectedTier === 'suv'
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-base">🚙</span>
                      <span>SUV</span>
                      <span className="text-[11px] opacity-90 font-mono">${service.tieredPricing.suv}+</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTier('truck')}
                      className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-0.5 border transition-all cursor-pointer ${
                        selectedTier === 'truck'
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-base">🛻</span>
                      <span>Truck / Van</span>
                      <span className="text-[11px] opacity-90 font-mono">${service.tieredPricing.truck}+</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Button: Cleaning Packages */}
              <div className="py-2">
                <button
                  onClick={handleAction}
                  disabled={booked}
                  className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-bold shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {booked ? (
                    <span>✓ Appointment Confirmed!</span>
                  ) : isOrderSummary ? (
                    <>
                      <span>Book Now</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  ) : (
                    <span>Book This Package</span>
                  )}
                </button>
              </div>

              {/* Service Description (hidden for deluxe & supreme to strictly show only flyer details) */}
              {service.id !== 'deluxe-package' && service.id !== 'supreme-package' && (
                <div className="flex flex-col gap-1.5 pt-2">
                  <h3 className="text-sm font-bold text-gray-900 underline decoration-gray-300 underline-offset-4">
                    Service Description
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed mt-1">
                    {service.description}
                  </p>
                </div>
              )}

              {/* What's Included */}
              <div className="flex flex-col gap-2 pt-2">
                <h3 className="text-sm font-bold text-gray-900 underline decoration-gray-300 underline-offset-4">
                  What's Included
                </h3>
                <ul className="flex flex-col gap-2 mt-1">
                  {service.included.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2.5 text-xs text-gray-700">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            /* Individual Services: ONLY image, title, and description (matching attached image) */
            <div className="flex flex-col gap-4">
              <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden bg-slate-100 border border-gray-100 shadow-xs">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover"
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-[#3d1822] tracking-tight">
                {service.title}
              </h2>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {service.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
