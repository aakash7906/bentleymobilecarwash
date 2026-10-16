import React, { useState } from 'react'
import { ServiceItem } from '@/types'
import { SERVICES_CATALOG, USER_SAVED_VEHICLES } from '@/data/mockData'
import heroSportsCar from '@/assets/hero-sports-car.png'
import logoBentley from '@/assets/Logo_Bentley.png'

interface HomeTabProps {
  onSelectService: (service: ServiceItem) => void
  onBookNow?: (service: ServiceItem) => void
  onAddCar: () => void
  currentVehicle: string
  onSelectVehicle: (vehicle: string) => void
}

export const HomeTab: React.FC<HomeTabProps> = ({
  onSelectService,
  onBookNow,
  onAddCar,
  currentVehicle,
  onSelectVehicle,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredServices = SERVICES_CATALOG.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col w-full pb-28">
      {/* 1. HERO SECTION WITH BLUEPRINT GRID BACKGROUND (Extends to top of page) */}
      <section className="relative w-full bg-grid-blueprint pt-4 pb-12 px-5 overflow-hidden">
        {/* Bentley Logo at Top */}
        <div className="mb-5">
          <img
            src={logoBentley}
            alt="Bentley Mobile Wash"
            className="h-11 w-auto object-contain filter drop-shadow-sm cursor-pointer active:scale-95 transition-transform"
          />
        </div>

        <div className="relative z-10 flex flex-col items-start max-w-[65%]">
          {/* Main Headline */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] tracking-tight leading-[1.15]">
            Find your favourite
            <br />
            Modifications
          </h1>

          {/* "Add Car" Red Pill Button */}
          <button
            onClick={onAddCar}
            className="mt-8 translate-y-8 px-4 py-1.5 rounded-full bg-[var(--color-primary)] text-white text-xs font-semibold shadow-md hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            <span>Add Car</span>
          </button>
        </div>

        {/* Hero Sports Car Cutout Graphic Overflowing on the Right */}
        <div className="absolute -right-10 bottom-2 w-64 sm:w-72 pointer-events-none z-0">
          <img
            src={heroSportsCar}
            alt="Custom Modified Sports Car"
            className="w-full h-auto object-contain filter drop-shadow-lg"
          />
        </div>
      </section>

      {/* 2. RED CONTOUR VEHICLE SELECTOR - Reduced width, matching search bar */}
      <div className="relative w-full my-2 px-8 flex items-center justify-center">
        {/* Left Downward Curved Line in margin */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-9 overflow-hidden flex items-center pointer-events-none z-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 32 36"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M 0,28 Q 18,12 32,12"
              stroke="#dc2626"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* Central Vehicle Dropdown Pill - Same width & roundness as search bar */}
        <div className="relative z-10 w-full">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-white border border-[#dc2626] rounded-xl px-4 py-2.5 shadow-sm flex items-center justify-between cursor-pointer hover:bg-red-50/20 active:scale-98 transition-all"
          >
            <span className="text-xs sm:text-sm font-semibold text-gray-900 tracking-tight">
              {currentVehicle}
            </span>
            <svg
              className={`w-2.5 h-2.5 text-gray-900 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
              viewBox="0 0 8 6"
              fill="currentColor"
            >
              <path d="M0 0 L8 0 L4 5 Z" />
            </svg>
          </button>
        </div>

        {/* Right Downward Curved Line in margin */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-9 overflow-hidden flex items-center pointer-events-none z-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 32 36"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M 0,12 Q 14,12 32,28"
              stroke="#dc2626"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* Dropdown Menu for Saved Vehicles */}
        {isDropdownOpen && (
          <div className="absolute left-8 right-8 top-12 z-30 bg-white rounded-2xl border border-gray-200 shadow-xl p-4 flex flex-col gap-2.5 animate-in fade-in duration-150">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              YOUR VEHICLES
            </span>
            <div className="flex flex-col gap-2">
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

            {/* Option to Add New Car */}
            <button
              onClick={() => {
                setIsDropdownOpen(false)
                onAddCar()
              }}
              className="mt-2 w-full py-2 rounded-xl border border-dashed border-[#dc2626] text-[#dc2626] hover:bg-red-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span> Add another car</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. SEARCH BAR - Reduced width, matching vehicle selector */}
      <div className="px-8 mt-2">
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Modifications..."
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#dc2626] focus:ring-1 focus:ring-[#dc2626] shadow-sm transition-all pr-10"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#dc2626]">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>
        </div>
      </div>

      {/* 4. "FOR YOU" SERVICE CARDS SECTION - Horizontally Scrollable */}
      <section className="mt-6 flex flex-col gap-3.5">
        <div className="px-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-main)] tracking-tight">
            For You
          </h2>
          <span className="text-[11px] text-gray-400 font-medium">Swipe &gt;</span>
        </div>

        {/* Horizontal Scrollable Cards Strip with proper padding on the left */}
        <div className="flex items-stretch gap-3.5 overflow-x-auto pb-4 pt-1 px-5 scrollbar-none snap-x snap-mandatory">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="w-[260px] sm:w-[275px] shrink-0 snap-start bg-white rounded-2xl border border-gray-200/90 shadow-sm p-3 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              {/* Service Hero Image - Inset with padding and rounded corners */}
              <div className="relative h-36 sm:h-40 w-full overflow-hidden rounded-xl bg-slate-100 shadow-inner">
                <img
                  src={service.image}
                  alt={service.title}
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
                  {service.category}
                </span>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block leading-tight font-medium">
                    Starting at
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#dc2626]">
                    {service.price}
                  </span>
                </div>
              </div>

              {/* Service Title */}
              <h3 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-1 mt-1">
                {service.title}
              </h3>

              {/* Side-by-Side Action Buttons: View Detail > & Book Now > */}
              <div className="flex items-center gap-2 mt-3 pt-1">
                <button
                  onClick={() => onSelectService(service)}
                  className="flex-1 py-2 px-1 rounded-full bg-[#f1f3f5] hover:bg-[#e4e7eb] text-[#dc2626] text-[11px] font-semibold transition-all active:scale-95 text-center cursor-pointer"
                >
                  View Detail &gt;
                </button>
                <button
                  onClick={() => (onBookNow ? onBookNow(service) : onSelectService(service))}
                  className="flex-1 py-2 px-1 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] text-white text-[11px] font-bold transition-all active:scale-95 shadow-sm text-center cursor-pointer"
                >
                  Book Now &gt;
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
