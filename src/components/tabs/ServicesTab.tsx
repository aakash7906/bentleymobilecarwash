import React, { useState } from 'react'
import { ServiceItem } from '@/types'
import { SERVICES_CATALOG } from '@/data/mockData'

interface ServicesTabProps {
  onSelectService: (service: ServiceItem) => void
  onAddCar: () => void
  currentVehicle: string
}

export const ServicesTab: React.FC<ServicesTabProps> = ({
  onSelectService,
  onAddCar,
  currentVehicle,
}) => {
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
    <div className="flex flex-col w-full pb-28 px-5">
      {/* 1. Header Title */}
      <div className="py-2 text-center">
        <h1 className="text-lg font-bold text-[var(--text-main)]">Services</h1>
      </div>

      {/* 2. "My Vehicle" Selector Bar */}
      <div className="mt-3 flex flex-col gap-1.5">
        <span className="text-xs text-gray-500 font-medium">My Vehicle</span>

        <div className="relative w-full">
          {/* Red horizontal accent bar */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-[#dc2626] z-0" />

          {/* Central Pill with Red Border */}
          <div className="relative z-10 flex justify-center">
            <div className="inline-flex items-center bg-white border border-[#dc2626] rounded-full px-4 py-1.5 shadow-sm gap-3">
              <span className="text-xs sm:text-sm font-semibold text-[var(--text-main)]">
                {currentVehicle}
              </span>
              <span className="material-symbols-outlined text-[18px] text-gray-500">
                arrow_drop_down
              </span>

              {/* Red Circle Plus Button */}
              <button
                onClick={onAddCar}
                className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center hover:bg-[var(--color-primary-hover)] active:scale-90 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search Bar + Red Filter Button */}
      <div className="mt-5 flex items-center gap-2.5">
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
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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
      <section className="mt-6 flex flex-col gap-4">
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
