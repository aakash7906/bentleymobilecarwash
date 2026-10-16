import React, { useState } from 'react'
import { ServiceItem } from '@/types'
import { SERVICES_CATALOG, USER_SAVED_VEHICLES } from '@/data/mockData'
import heroSportsCar from '@/assets/hero-sports-car.png'
import logoBentley from '@/assets/Logo_Bentley.png'

interface HomeTabProps {
  onSelectService: (service: ServiceItem) => void
  onAddCar: () => void
  currentVehicle: string
  onSelectVehicle: (vehicle: string) => void
}

export const HomeTab: React.FC<HomeTabProps> = ({
  onSelectService,
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

          {/* "+ Add Car" Red Pill Button */}
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

      {/* 4. "FOR YOU" SERVICE CARDS SECTION */}
      <section className="px-6 mt-6 flex flex-col gap-3.5">
        <h2 className="text-lg font-bold text-[var(--text-main)] tracking-tight">
          For You
        </h2>

        {/* Carousel / Cards Grid */}
        <div className="flex flex-col gap-5">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
            >
              {/* Service Hero Image */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover"
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              </div>

              {/* Card Information */}
              <div className="p-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-[#dc2626] text-white text-[10px] font-bold tracking-wide">
                    {service.category}
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 block">Starting at</span>
                    <span className="text-xs sm:text-sm font-bold text-[#dc2626] font-mono">
                      {service.price}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-gray-900">
                  {service.title}
                </h3>

                {/* "View detail >" Subtle Button */}
                <button
                  onClick={() => onSelectService(service)}
                  className="w-full mt-1 py-2 rounded-xl bg-[#f1f3f5] hover:bg-[#e4e7eb] text-gray-700 text-xs font-semibold transition-all active:scale-98 cursor-pointer text-center"
                >
                  View detail &gt;
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
