import React, { useState } from 'react'
import { ServiceItem } from '@/types'
import { SERVICES_CATALOG, USER_SAVED_VEHICLES } from '@/data/mockData'

interface ServicesTabProps {
  onSelectService: (service: ServiceItem) => void
  onAddCar: () => void
  currentVehicle: string
  onSelectVehicle: (vehicle: string) => void
}

export const ServicesTab: React.FC<ServicesTabProps> = ({
  onSelectService,
  onAddCar,
  currentVehicle,
  onSelectVehicle,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'Exterior Cleaning', label: 'Exterior Cleaning' },
    { id: 'Interior Cleaning', label: 'Interior Cleaning' },
    { id: 'Paint Protection', label: 'Paint Protection' },
    { id: 'Fleet Services', label: 'Fleet Services' },
  ]

  const filteredServices = SERVICES_CATALOG.filter((srv) => {
    const matchesCategory =
      activeCategory === 'all' || srv.category === activeCategory
    const matchesSearch =
      srv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="flex flex-col w-full pb-28">
      {/* 1. Header Title */}
      <div className="py-2 text-center px-5">
        <h1 className="text-lg font-bold text-[var(--text-main)]">Services</h1>
      </div>

      {/* 2. RED CONTOUR VEHICLE SELECTOR - Same as HomeTab */}
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

        {/* Central Vehicle Dropdown Pill */}
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
              <span>+ Add another car</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Search Bar + Red Filter Button */}
      <div className="mt-4 flex items-center gap-2.5 px-6">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Modifications..."
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#dc2626] shadow-sm pr-10"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#dc2626]">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>
        </div>

        {/* Red Filter Button */}
        <button
          onClick={() => setActiveCategory('all')}
          className="w-10 h-10 rounded-xl bg-[#dc2626] text-white flex items-center justify-center shadow-md hover:bg-[#b91c1c] active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">tune</span>
        </button>
      </div>

      {/* 4. Category Pills */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none px-6">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#dc2626] text-white shadow-sm'
                  : 'bg-white border border-[#dc2626] text-[#dc2626] hover:bg-red-50'
              }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* 5. "Recommended" Section */}
      <section className="mt-6 flex flex-col gap-4 px-6">
        <h2 className="text-lg font-bold text-[var(--text-main)] tracking-tight">
          Recommended
        </h2>

        <div className="flex flex-col gap-5">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              onClick={() => onSelectService(service)}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col cursor-pointer hover:shadow-md active:scale-[0.99] transition-all group"
            >
              {/* Image */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              </div>

              {/* Information */}
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

                <h3 className="text-base font-bold text-gray-900 group-hover:text-[#dc2626] transition-colors">
                  {service.title}
                </h3>

                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                  {service.description}
                </p>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectService(service)
                  }}
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
