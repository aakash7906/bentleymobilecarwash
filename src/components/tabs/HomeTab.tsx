import React, { useState } from 'react'
import { ServiceItem } from '@/types'
import { SERVICES_CATALOG, USER_SAVED_VEHICLES } from '@/data/mockData'
import logoBentley from '@/assets/Logo_Bentley.png'

// Category and Section Assets copied from home_ima
import catCarWashImg from '@/assets/home/cat-car-wash.png'
import catExteriorImg from '@/assets/home/cat-exterior.png'
import catInteriorImg from '@/assets/home/cat-interior.png'
import catTireShineImg from '@/assets/home/cat-tire-shine.png'
import recCarWashImg from '@/assets/home/rec-car-wash.png'
import shopTireShineImg from '@/assets/home/shop-tire-shine.png'
import { OrderTrackingMapPage } from '@/components/OrderTrackingMapPage'

interface HomeTabProps {
  onSelectService: (service: ServiceItem) => void
  onBookNow?: (service: ServiceItem) => void
  onAddCar: () => void
  currentVehicle: string
  onSelectVehicle: (vehicle: string) => void
  onOpenTracking?: () => void
}

export const HomeTab: React.FC<HomeTabProps> = ({
  onSelectService,
  onBookNow,
  onAddCar,
  currentVehicle,
  onSelectVehicle,
  onOpenTracking,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isTrackingMapOpen, setIsTrackingMapOpen] = useState(false)

  const handleAddToCart = (productName: string) => {
    setCartCount((prev) => prev + 1)
    setToastMessage(`Added "${productName}" to Cart!`)
    setTimeout(() => {
      setToastMessage(null)
    }, 2400)
  }

  // Recommended for you cards matching user screenshot
  const recommendedCards = [
    {
      id: 'rec-car-wash',
      title: 'Car Wash',
      category: 'Exterior Cleaning',
      price: '$50.00',
      image: recCarWashImg,
      serviceItem: {
        id: 'rec-car-wash',
        title: 'Car Wash',
        category: 'Exterior Cleaning',
        price: '$50.00',
        priceNumeric: 50,
        estTime: '30–45 mins',
        vehicleModel: currentVehicle,
        image: recCarWashImg,
        description:
          'Deep exterior foam wash using top-down gentle microfiber technique, wheel cleaning, tire degreasing, and streak-free chamois finish.',
        included: [
          'Gentle pH-balanced snow foam soak',
          'Wheel, rim, and wheel-well agitation',
          'Tire scrub & protective dressing',
          'Streak-free spot-free rinse & hand dry',
        ],
      } as ServiceItem,
    },
    {
      id: 'rec-tiger-body-kit',
      title: 'Tiger Body Kit',
      category: 'Body Kit',
      price: '$120.00',
      image: catExteriorImg,
      serviceItem: {
        id: 'rec-tiger-body-kit',
        title: 'Tiger Body Kit',
        category: 'Body Kit',
        price: '$120.00',
        priceNumeric: 120,
        estTime: '1.5–2 hrs',
        vehicleModel: currentVehicle,
        image: catExteriorImg,
        description:
          'Precision exterior aerodynamic kit fitting, front splitter alignment, side skirt reinforcement, and protective gloss sealing.',
        included: [
          'Aero kit fitment and test mounting',
          'Front lip & rear diffuser securement',
          'Paint protection seal on newly mounted parts',
          'Final torque check & alignment audit',
        ],
      } as ServiceItem,
    },
    {
      id: 'rec-interior-detail',
      title: 'Interior Detailing',
      category: 'Interior Cleaning',
      price: '$75.00',
      image: catInteriorImg,
      serviceItem: {
        id: 'rec-interior-detail',
        title: 'Interior Detailing',
        category: 'Interior Cleaning',
        price: '$75.00',
        priceNumeric: 75,
        estTime: '1–1.5 hrs',
        vehicleModel: currentVehicle,
        image: catInteriorImg,
        description:
          'Comprehensive cabin refresh including deep steam extraction, dashboard UV protection, crevice detailing, and odor neutralization.',
        included: [
          'High-power crevice vacuuming',
          'Upholstery shampoo & extraction',
          'Console & air vent steam sanitization',
          'Leather conditioner & UV coat',
        ],
      } as ServiceItem,
    },
  ]

  // Bentley Shop products matching screenshot
  const shopProducts = [
    {
      id: 'shop-tire-shine',
      title: 'Bentley 007 – Tire Shine',
      price: '$50.00',
      image: shopTireShineImg,
    },
    {
      id: 'shop-ceramic-spray',
      title: 'Bentley Gold Foam Wash',
      price: '$45.00',
      image: recCarWashImg,
    },
    {
      id: 'shop-microfiber',
      title: 'Bentley Ultra Detail Pack',
      price: '$35.00',
      image: catInteriorImg,
    },
  ]

  const handleSelectCategory = (catName: string) => {
    const found = SERVICES_CATALOG.find(
      (s) =>
        s.category.toLowerCase().includes(catName.toLowerCase()) ||
        s.title.toLowerCase().includes(catName.toLowerCase())
    )
    if (found) {
      onSelectService(found)
    } else {
      onSelectService(recommendedCards[0].serviceItem)
    }
  }

  return (
    <div className="flex flex-col w-full pb-32 relative select-none">
      {/* Toast Alert for Add to Cart */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 backdrop-blur-md text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-white/10 animate-in fade-in slide-in-from-top duration-200">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP HEADER: Bentley Mascot Logo & Red Action Buttons */}
      <div className="px-4 sm:px-5 pt-3 sm:pt-4 flex items-center justify-between">
        <img
          src={logoBentley}
          alt="Bentley Mobile Auto Detail & Car Wash"
          className="h-9 sm:h-11 md:h-12 w-auto object-contain cursor-pointer active:scale-95 transition-transform drop-shadow-sm"
        />
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Grid Layout Button */}
          <button
            type="button"
            className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-xl bg-[#dc2626] text-white flex items-center justify-center shadow-sm hover:bg-[#b91c1c] active:scale-95 transition-all cursor-pointer"
            title="Categories"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">grid_view</span>
          </button>

          {/* Shopping Cart Button */}
          <button
            type="button"
            className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-xl bg-[#dc2626] text-white flex items-center justify-center shadow-sm hover:bg-[#b91c1c] active:scale-95 transition-all relative cursor-pointer"
            title="Cart"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">shopping_cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-[#dc2626] text-[10px] font-bold flex items-center justify-center border border-[#dc2626] shadow-sm animate-pulse">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. LOCATION PILL BAR */}
      <div className="px-4 sm:px-5 mt-2.5 sm:mt-3">
        <div className="w-full bg-[#f4f5f7] border border-gray-200/70 rounded-xl py-2 px-3 sm:px-3.5 flex items-center gap-2 shadow-xs">
          <span className="material-symbols-outlined text-[#dc2626] text-[17px] sm:text-[19px] shrink-0">
            location_on
          </span>
          <span className="text-[11px] sm:text-xs font-medium text-gray-700 truncate tracking-tight">
            5th Avenue, Jamesford Road, Ontario...
          </span>
        </div>
      </div>

      {/* 3. HERO BLUEPRINT SECTION: Headline + Add Car */}
      <section className="relative w-full bg-grid-blueprint mt-2.5 sm:mt-3 py-3.5 sm:py-4 px-4 sm:px-5 overflow-hidden">
        <div className="relative z-10 flex items-center justify-between gap-2.5 sm:gap-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight leading-[1.18]">
            Find all your needs
            <br />
            for Car Care
          </h1>

          <button
            onClick={onAddCar}
            className="shrink-0 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#dc2626] text-white text-[11px] sm:text-xs font-bold shadow-md hover:bg-[#b91c1c] active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>+</span>
            <span>Add Car</span>
          </button>
        </div>
      </section>

      {/* 4. RED CONTOUR VEHICLE SELECTOR */}
      <div className="relative w-full px-4 sm:px-5 mt-1 z-20">
        {/* Left Downward Curved Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-9 overflow-hidden flex items-center pointer-events-none z-0">
          <svg className="w-full h-full" viewBox="0 0 20 36" preserveAspectRatio="none" fill="none">
            <path
              d="M 0,28 Q 10,12 20,12"
              stroke="#dc2626"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* Central Vehicle Dropdown */}
        <div className="relative z-10 w-full">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-white border border-[#dc2626] rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-sm flex items-center justify-between cursor-pointer hover:bg-red-50/20 active:scale-98 transition-all"
          >
            <span className="text-xs sm:text-sm font-semibold text-gray-900 tracking-tight truncate">
              {currentVehicle}
            </span>
            <svg
              className={`w-2.5 h-2.5 text-gray-900 transition-transform duration-200 shrink-0 ml-2 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
              viewBox="0 0 8 6"
              fill="currentColor"
            >
              <path d="M0 0 L8 0 L4 5 Z" />
            </svg>
          </button>

          {/* Saved Vehicles Dropdown */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white rounded-2xl border border-gray-200 shadow-xl p-3 flex flex-col gap-2 animate-in fade-in duration-150">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                YOUR VEHICLES
              </span>
              <div className="flex flex-col gap-1">
                {USER_SAVED_VEHICLES.map((v, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      onSelectVehicle(v)
                      setIsDropdownOpen(false)
                    }}
                    className={`flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer transition-colors ${
                      v === currentVehicle
                        ? 'bg-red-50 text-[#dc2626] font-bold'
                        : 'hover:bg-gray-50 text-gray-800 font-medium'
                    }`}
                  >
                    <span className="text-xs sm:text-sm">{v}</span>
                    {v === currentVehicle && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setIsDropdownOpen(false)
                  onAddCar()
                }}
                className="mt-1 w-full py-1.5 rounded-xl border border-dashed border-[#dc2626] text-[#dc2626] hover:bg-red-50 text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <span>+ Add another car</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Downward Curved Line */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-9 overflow-hidden flex items-center pointer-events-none z-0">
          <svg className="w-full h-full" viewBox="0 0 20 36" preserveAspectRatio="none" fill="none">
            <path
              d="M 0,12 Q 10,12 20,28"
              stroke="#dc2626"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>

      {/* 5. RED ACTION BANNER */}
      <div className="px-4 sm:px-5 mt-3 sm:mt-3.5">
        <div className="w-full bg-[#dc2626] rounded-xl h-9.5 sm:h-10 px-4 flex items-center text-white shadow-sm">
          <span className="material-symbols-outlined text-[19px] sm:text-[21px]">grid_view</span>
        </div>
      </div>

      {/* 6. 4 CATEGORY CARDS (2x2 Asymmetric Bento Grid) */}
      <div className="px-4 sm:px-5 mt-3 sm:mt-3.5 flex flex-col gap-2.5">
        {/* Row 1: Car Wash (~38%) + Exterior Detailing (~62%) */}
        <div className="flex items-center gap-2.5">
          {/* Card 1: Car Wash */}
          <div
            onClick={() => handleSelectCategory('Car Wash')}
            className="flex-[0.38] bg-[#f3f4f6] rounded-2xl p-2.5 sm:p-3 h-28 sm:h-32 md:h-36 flex flex-col justify-between overflow-hidden relative cursor-pointer hover:shadow-md transition-all active:scale-98 group"
          >
            <span className="text-xs sm:text-sm md:text-base font-bold text-gray-900 z-10 leading-tight">
              Car Wash
            </span>
            <div className="absolute right-0 bottom-0 w-20 sm:w-22 md:w-24 h-22 sm:h-24 md:h-26 overflow-hidden pointer-events-none">
              <img
                src={catCarWashImg}
                alt="Car Wash"
                className="w-full h-full object-cover object-bottom group-hover:scale-105 transition-transform"
              />
            </div>
          </div>

          {/* Card 2: Exterior Detailing */}
          <div
            onClick={() => handleSelectCategory('Exterior Detailing')}
            className="flex-[0.62] bg-[#f3f4f6] rounded-2xl p-2.5 sm:p-3 h-28 sm:h-32 md:h-36 flex flex-col justify-between overflow-hidden relative cursor-pointer hover:shadow-md transition-all active:scale-98 group"
          >
            <span className="text-xs sm:text-sm md:text-base font-bold text-gray-900 z-10 leading-tight">
              Exterior Detailing
            </span>
            <div className="absolute right-1 bottom-1 w-[80%] max-w-[190px] sm:max-w-[220px] md:max-w-[260px] h-15 sm:h-18 md:h-22 flex items-end justify-end pointer-events-none">
              <img
                src={catExteriorImg}
                alt="Exterior Detailing"
                className="w-full h-auto object-contain group-hover:scale-105 transition-transform"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Interior Detailing (~62%) + Tire Shine (~38%) */}
        <div className="flex items-center gap-2.5">
          {/* Card 3: Interior Detailing */}
          <div
            onClick={() => handleSelectCategory('Interior Detailing')}
            className="flex-[0.62] bg-[#f3f4f6] rounded-2xl p-2.5 sm:p-3 h-28 sm:h-32 md:h-36 flex flex-col justify-between overflow-hidden relative cursor-pointer hover:shadow-md transition-all active:scale-98 group"
          >
            <span className="text-xs sm:text-sm md:text-base font-bold text-gray-900 z-10 leading-tight">
              Interior Detailing
            </span>
            <div className="absolute right-0 bottom-0 left-0 h-15 sm:h-18 md:h-22 flex items-end overflow-hidden pointer-events-none">
              <img
                src={catInteriorImg}
                alt="Interior Detailing"
                className="w-full h-full object-cover object-center rounded-b-2xl group-hover:scale-105 transition-transform"
              />
            </div>
          </div>

          {/* Card 4: Tire Shine */}
          <div
            onClick={() => handleSelectCategory('Tire Shine')}
            className="flex-[0.38] bg-[#f3f4f6] rounded-2xl p-2.5 sm:p-3 h-28 sm:h-32 md:h-36 flex flex-col justify-between overflow-hidden relative cursor-pointer hover:shadow-md transition-all active:scale-98 group"
          >
            <span className="text-xs sm:text-sm md:text-base font-bold text-gray-900 z-10 leading-tight">
              Tire Shine
            </span>
            <div className="absolute right-0 bottom-0 w-18 sm:w-20 md:w-24 h-18 sm:h-20 md:h-24 overflow-hidden pointer-events-none">
              <img
                src={catTireShineImg}
                alt="Tire Shine"
                className="w-full h-full object-contain object-bottom-right group-hover:scale-105 transition-transform"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 7. "RECOMMENDED FOR YOU" SECTION */}
      <section className="mt-6 sm:mt-7 flex flex-col gap-3">
        <div className="px-4 sm:px-5 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
            Recommended for You
          </h2>
          <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium">Swipe &gt;</span>
        </div>

        {/* Horizontal Scrollable Cards Strip with smooth touch momentum scrolling */}
        <div className="flex items-stretch gap-3 sm:gap-3.5 overflow-x-auto overscroll-x-contain pb-3 pt-1 px-4 sm:px-5 scrollbar-none snap-x snap-mandatory">
          {recommendedCards.map((card) => (
            <div
              key={card.id}
              className="w-[240px] sm:w-[265px] md:w-[280px] shrink-0 snap-start bg-white rounded-2xl border border-gray-200/90 shadow-sm p-3 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              {/* Service Hero Image - Inset with padding and rounded corners */}
              <div className="relative h-34 sm:h-38 md:h-40 w-full overflow-hidden rounded-xl bg-slate-100 shadow-inner">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Indicator dots matching reference */}
              <div className="flex items-center justify-center gap-1 mt-2.5">
                <span className="w-3.5 h-1 bg-[#dc2626] rounded-full"></span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              </div>

              {/* Category Pill & Starting at Price */}
              <div className="mt-2 flex items-center justify-between gap-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#dc2626] text-white text-[10px] font-bold tracking-wide shrink-0">
                  {card.category}
                </span>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block leading-tight font-medium">
                    Starting at
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#dc2626]">
                    {card.price}
                  </span>
                </div>
              </div>

              {/* Service Title */}
              <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 line-clamp-1 mt-1">
                {card.title}
              </h3>

              {/* Side-by-Side Action Buttons: View Detail > & Book Now > */}
              <div className="flex items-center gap-2 mt-3 pt-1">
                <button
                  onClick={() => onSelectService(card.serviceItem)}
                  className="flex-1 py-2 px-1 rounded-full bg-[#f1f3f5] hover:bg-[#e4e7eb] text-[#dc2626] text-[11px] font-semibold transition-all active:scale-95 text-center cursor-pointer"
                >
                  View Detail &gt;
                </button>
                <button
                  onClick={() =>
                    onBookNow ? onBookNow(card.serviceItem) : onSelectService(card.serviceItem)
                  }
                  className="flex-1 py-2 px-1 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white text-[11px] font-bold transition-all active:scale-95 shadow-sm text-center cursor-pointer"
                >
                  Book Now &gt;
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. "BENTLEY SHOP" SECTION */}
      <section className="mt-5 sm:mt-6 flex flex-col gap-3">
        <div className="px-4 sm:px-5 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
            Bentley Shop
          </h2>
          <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium">Swipe &gt;</span>
        </div>

        {/* Horizontal Scrollable Shop Products Strip */}
        <div className="flex items-stretch gap-3 sm:gap-3.5 overflow-x-auto overscroll-x-contain pb-4 pt-1 px-4 sm:px-5 scrollbar-none snap-x snap-mandatory">
          {shopProducts.map((prod) => (
            <div
              key={prod.id}
              className="w-[240px] sm:w-[265px] md:w-[280px] shrink-0 snap-start bg-white rounded-2xl border border-gray-200/90 shadow-sm p-3 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              {/* Product Image */}
              <div className="relative h-34 sm:h-38 md:h-40 w-full overflow-hidden rounded-xl bg-slate-100 shadow-inner">
                <img
                  src={prod.image}
                  alt={prod.title}
                  className="w-full h-full object-cover object-top"
                />
              </div>

              {/* Indicator dots matching reference */}
              <div className="flex items-center justify-center gap-1 mt-2.5">
                <span className="w-3.5 h-1 bg-[#dc2626] rounded-full"></span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              </div>

              {/* Product Title & Price */}
              <div className="mt-2.5 flex items-center justify-between gap-1">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1">
                  {prod.title}
                </h3>
                <span className="text-xs sm:text-sm font-bold text-[#dc2626] shrink-0">
                  {prod.price}
                </span>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={() => handleAddToCart(prod.title)}
                className="mt-3 w-full py-2.5 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold transition-all active:scale-95 shadow-sm text-center cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Add to Cart &gt;</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 9. FLOATING BOTTOM STATUS POPUP PILL: Technician is Arriving (Reduced sleek size) */}
      <div className="fixed bottom-20 sm:bottom-21 left-0 right-0 z-30 pointer-events-none px-5 sm:px-6 animate-in slide-in-from-bottom duration-300">
        <div className="max-w-[340px] sm:max-w-sm mx-auto pointer-events-auto">
          <div
            onClick={() => {
              if (onOpenTracking) onOpenTracking()
              else setIsTrackingMapOpen(true)
            }}
            className="w-full bg-[#00c04b] hover:bg-[#00b044] text-white rounded-xl sm:rounded-2xl px-3.5 py-1.5 sm:py-2 shadow-lg flex items-center justify-between cursor-pointer active:scale-98 transition-all border border-emerald-400/40 filter drop-shadow-[0_6px_16px_rgba(0,192,75,0.25)]"
          >
            {/* Left Content */}
            <div className="flex flex-col items-start gap-0.5">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 border border-white/30 text-white text-[10px] font-medium leading-none">
                Car Wash
              </span>
              <span className="text-white font-bold text-xs sm:text-sm tracking-tight leading-tight mt-0.5">
                Technician is Arriving
              </span>
            </div>

            {/* Right Mins Countdown Card (Compact) */}
            <div className="w-11 sm:w-12 h-9.5 sm:h-10 bg-white rounded-xl flex flex-col items-center justify-center shadow-xs shrink-0 ml-2">
              <span className="text-[#00c04b] text-sm sm:text-base font-extrabold leading-none">
                33
              </span>
              <span className="text-[#00c04b] text-[9px] font-bold leading-tight">
                mins
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 10. Direct Order Tracking Map Modal from Floating Button */}
      {isTrackingMapOpen && (
        <OrderTrackingMapPage
          onBack={() => setIsTrackingMapOpen(false)}
          serviceTitle="Car Wash"
          serviceCategory="Exterior Cleaning"
          customerName="Steve Miller"
          customerPhone="998 877 5561"
          customerAddress={`21/22, 5th Avenue, Jamesford Road, Ontario,\nCanada`}
          technicianName="James Marlo"
        />
      )}
    </div>
  )
}
