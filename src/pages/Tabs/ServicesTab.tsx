import React, { useState } from 'react'
import { ServiceItem, SavedVehicle } from '@/types'
import { SERVICES_CATALOG } from '@/data/mockData'

interface ServicesTabProps {
  onSelectService: (service: ServiceItem) => void
  onAddCar: () => void
  currentVehicle: string
  onSelectVehicle: (vehicle: string) => void
  savedVehicles?: SavedVehicle[]
}

export const ServicesTab: React.FC<ServicesTabProps> = ({
  onSelectService,
  onAddCar,
  currentVehicle,
  onSelectVehicle,
  savedVehicles,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  // Store user-selected tier overrides per service ID, defaulting to current active vehicle type
  const [selectedTiers, setSelectedTiers] = useState<Record<string, 'car' | 'suv' | 'truck'>>({})

  // Detect vehicle type from currentVehicle
  const activeVehicleObj = savedVehicles?.find((v) => v.name === currentVehicle)
  const activeVehicleCategory = activeVehicleObj?.type || 'Sedan'
  const defaultTier: 'car' | 'suv' | 'truck' =
    activeVehicleCategory === 'SUV'
      ? 'suv'
      : activeVehicleCategory === 'Truck' || activeVehicleCategory === 'Van'
      ? 'truck'
      : 'car'

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'Cleaning Packages', label: 'Cleaning Packages' },
    { id: 'Specialty', label: 'RV & Marine' },
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
      <div className="py-2 text-center screen-padding">
        <h1 className="text-lg font-bold text-[var(--text-main)]">Services</h1>
      </div>

      {/* 2. RED CONTOUR VEHICLE SELECTOR - Same as HomeTab */}
      <div className="relative w-full my-2 screen-padding flex items-center justify-center">
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
              stroke="var(--primary)"
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
            className="w-full bg-white border border-primary rounded-xl px-4 py-2.5 shadow-sm flex items-center justify-between cursor-pointer hover:bg-primary-light/50 active:scale-98 transition-all"
          >
            <span
              className={`text-xs sm:text-sm tracking-tight truncate ${
                currentVehicle ? 'font-semibold text-gray-900' : 'font-medium text-gray-400'
              }`}
            >
              {currentVehicle || 'Add your vehicle'}
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
              stroke="var(--primary)"
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
            <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
              {savedVehicles && savedVehicles.length > 0 ? (
                savedVehicles.map((veh) => (
                  <div
                    key={veh.id}
                    onClick={() => {
                      onSelectVehicle(veh.name)
                      setIsDropdownOpen(false)
                    }}
                    className={`flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer transition-colors ${
                      veh.name === currentVehicle
                        ? 'bg-primary-light text-primary font-bold'
                        : 'hover:bg-gray-50 text-gray-800 font-medium'
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm truncate">{veh.name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-gray-500 font-normal">{veh.type}</span>
                        {veh.licensePlate && (
                          <span className="text-[9px] font-mono font-bold bg-gray-100 text-gray-700 px-1.5 rounded">
                            {veh.licensePlate}
                          </span>
                        )}
                      </div>
                    </div>
                    {veh.name === currentVehicle && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 ml-2" />
                    )}
                  </div>
                ))
              ) : (
                <div className="py-2 px-3 text-xs text-gray-500">
                  No vehicles saved. Click Add Car to register.
                </div>
              )}
            </div>

            {/* Option to Add New Car */}
            <button
              onClick={() => {
                setIsDropdownOpen(false)
                onAddCar()
              }}
              className="mt-2 w-full py-2 rounded-xl border border-dashed border-primary text-primary hover:bg-primary-light text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>+ Add your vehicle</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Search Bar */}
      <div className="mt-4 screen-padding">
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Modifications..."
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary shadow-sm pr-10"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>
        </div>
      </div>

      {/* 4. Category Pills */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none screen-padding">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-white border border-primary text-primary hover:bg-primary-light'
              }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* 5. TOP SECTION: BENTLEY'S CLEANING PACKAGES (WITH PRICES) */}
      {(activeCategory === 'all' ||
        activeCategory === 'Cleaning Packages' ||
        activeCategory === 'Specialty') && (
        <section className="mt-6 flex flex-col gap-3 screen-padding">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-1 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
                  Bentley's Cleaning Packages
                </h2>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                All-inclusive mobile wash & detail packages with fixed vehicle pricing
              </p>
            </div>
            <a
              href="tel:250-351-9155"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline self-start sm:self-auto"
            >
              <span>📞 250-351-9155</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-1">
            {filteredServices
              .filter(
                (srv) =>
                  srv.category === 'Cleaning Packages' || srv.category === 'Specialty'
              )
              .map((service) => {
                const activeTier = service.tieredPricing
                  ? selectedTiers[service.id] || defaultTier
                  : null
                const displayedPrice =
                  activeTier && service.tieredPricing
                    ? `$${service.tieredPricing[activeTier]}.00`
                    : service.price
                const displayedNumeric =
                  activeTier && service.tieredPricing
                    ? service.tieredPricing[activeTier]
                    : service.priceNumeric

                const handleCardClick = () => {
                  const preparedService: ServiceItem = {
                    ...service,
                    price: displayedPrice,
                    priceNumeric: displayedNumeric,
                    vehicleModel: activeTier
                      ? `${activeTier === 'car' ? 'Car (Sedan/Coupe)' : activeTier === 'suv' ? 'SUV' : 'Truck'} (${currentVehicle})`
                      : service.vehicleModel,
                  }
                  onSelectService(preparedService)
                }

                return (
                  <div
                    key={service.id}
                    onClick={handleCardClick}
                    className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden flex flex-col cursor-pointer hover:shadow-md hover:border-primary/40 active:scale-[0.99] transition-all group"
                  >
                    {/* Image & Overlay Badges */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      />

                      {/* Top Badges */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                        {service.badge && (
                          <span className="px-2.5 py-1 rounded-lg bg-primary/95 text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-xs shadow-sm">
                            {service.badge}
                          </span>
                        )}
                        <span className="px-2.5 py-1 rounded-lg bg-black/75 text-white text-[10px] font-semibold tracking-wide backdrop-blur-xs ml-auto">
                          ⏱ {service.estTime}
                        </span>
                      </div>
                    </div>

                    {/* Information */}
                    <div className="p-4 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-primary-light text-primary text-[10px] font-bold tracking-wide">
                          {service.category}
                        </span>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 block leading-none mb-0.5">
                            {service.tieredPricing ? 'Vehicle Pricing' : 'Package Price'}
                          </span>
                          <span className="text-sm sm:text-base font-extrabold text-primary font-mono">
                            {displayedPrice}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors">
                        {service.title}
                      </h3>

                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>

                      {/* Interactive 3-Tier Vehicle Selector Pills (Car / SUV / Truck) */}
                      {service.tieredPricing && (
                        <div className="mt-1 flex items-center gap-1.5 p-1 bg-gray-50 rounded-xl border border-gray-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTiers((prev) => ({ ...prev, [service.id]: 'car' }))
                            }}
                            className={`flex-1 py-1.5 px-1 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                              activeTier === 'car'
                                ? 'bg-primary text-white shadow-xs'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                            title="Sedan, Coupe, Hatchback"
                          >
                            🚗 Car ${service.tieredPricing.car}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTiers((prev) => ({ ...prev, [service.id]: 'suv' }))
                            }}
                            className={`flex-1 py-1.5 px-1 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                              activeTier === 'suv'
                                ? 'bg-primary text-white shadow-xs'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                            title="Compact, Mid-size, Full-size SUV"
                          >
                            🚙 SUV ${service.tieredPricing.suv}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTiers((prev) => ({ ...prev, [service.id]: 'truck' }))
                            }}
                            className={`flex-1 py-1.5 px-1 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                              activeTier === 'truck'
                                ? 'bg-primary text-white shadow-xs'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                            title="Pickup Truck, Minivan, Passenger Van"
                          >
                            🛻 Truck ${service.tieredPricing.truck}
                          </button>
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCardClick()
                        }}
                        className="w-full mt-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all active:scale-98 cursor-pointer text-center shadow-xs"
                      >
                        Book Package &gt;
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        </section>
      )}

      {/* 6. BOTTOM SECTION: SERVICES (WITHOUT PRICE) */}
      {(activeCategory === 'all' ||
        (activeCategory !== 'Cleaning Packages' && activeCategory !== 'Specialty')) && (
        <section className="mt-8 flex flex-col gap-3 screen-padding">
          <div className="pb-1 border-b border-gray-100">
            <h2 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
              Individual Services
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Targeted treatments & specialized mobile services • Included in custom packages
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-1">
            {filteredServices
              .filter(
                (srv) =>
                  srv.category !== 'Cleaning Packages' && srv.category !== 'Specialty'
              )
              .map((service) => {
                const handleSelectIndividual = () => {
                  onSelectService({
                    ...service,
                    price: 'Included in Packages',
                    priceNumeric: 0,
                    vehicleModel: currentVehicle,
                  })
                }

                return (
                  <div
                    key={service.id}
                    onClick={handleSelectIndividual}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col cursor-pointer hover:shadow-md hover:border-gray-300 active:scale-[0.99] transition-all group"
                  >
                    {/* Image */}
                    <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      />
                    </div>

                    {/* Information (WITHOUT PRICE) */}
                    <div className="p-4 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors">
                          {service.title}
                        </h3>
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium shrink-0 flex items-center gap-1">
                          ⏱ {service.estTime}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectIndividual()
                        }}
                        className="w-full mt-1 py-2 rounded-xl bg-surface-alt hover:bg-[#e4e7eb] text-gray-700 text-xs font-semibold transition-all active:scale-98 cursor-pointer text-center"
                      >
                        View detail &gt;
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        </section>
      )}
    </div>
  )
}
