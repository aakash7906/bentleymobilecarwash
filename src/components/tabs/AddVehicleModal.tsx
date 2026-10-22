import React, { useState, useMemo } from 'react'
import {
  VEHICLE_BRANDS,
  BRAND_MODELS_MAP,
  VEHICLE_CATEGORIES,
  WRX_YEARS,
  WRX_COLORS,
} from '@/data/mockData'
import { SavedVehicle, VehicleCategory } from '@/types'
import { ChevronLeft, Car, Check, ShieldCheck, Sparkle as _unusedSparkle, Layers } from 'lucide-react'

interface AddVehicleModalProps {
  isOpen: boolean
  onClose: () => void
  onVehicleAdded: (vehicle: SavedVehicle) => void
}

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({
  isOpen,
  onClose,
  onVehicleAdded,
}) => {
  const [mode, setMode] = useState<'guided' | 'quick'>('guided')
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1)

  // Vehicle attributes
  const [selectedBrand, setSelectedBrand] = useState('Audi')
  const [customBrand, setCustomBrand] = useState('')
  const [selectedModel, setSelectedModel] = useState('A4')
  const [customModel, setCustomModel] = useState('')
  const [selectedVariant, setSelectedVariant] = useState('S-Line Quattro')
  const [selectedType, setSelectedType] = useState<VehicleCategory>('Sedan')
  const [selectedYear, setSelectedYear] = useState('2023')
  const [selectedColor, setSelectedColor] = useState('Daytona Gray')
  const [licensePlate, setLicensePlate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  if (!isOpen) return null

  // Available models for currently selected brand
  const effectiveBrand = customBrand.trim() || selectedBrand
  const availableModels = BRAND_MODELS_MAP[selectedBrand] || ['Standard', 'Sport', 'Luxury', 'Custom']

  const handleBack = () => {
    if (step > 1 && mode === 'guided') {
      setStep((step - 1) as any)
    } else {
      onClose()
    }
  }

  const handleFinalAdd = () => {
    const brand = customBrand.trim() || selectedBrand
    const model = customModel.trim() || selectedModel
    const name = `${brand} ${model}${selectedVariant ? ` (${selectedVariant})` : ''}`

    const newVehicle: SavedVehicle = {
      id: `veh-${Date.now()}`,
      name,
      brand,
      model,
      year: selectedYear,
      variant: selectedVariant || undefined,
      color: selectedColor,
      type: selectedType,
      licensePlate: licensePlate.trim().toUpperCase() || undefined,
      isPrimary: true,
      specs: {
        length: '183.8 in',
        width: '71.9 in',
        height: '57.8 in',
        wheelbase: '105.2 in',
        groundClearance: '5.4 in',
        curbWeight: '~3,350 lbs',
      },
    }

    onVehicleAdded(newVehicle)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-center overflow-y-auto animate-in slide-in-from-bottom duration-200">
      <div className="w-full max-w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl min-h-screen bg-white flex flex-col pb-10 shadow-2xl">
        {/* Top Header */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="w-9 h-9 rounded-full border border-gray-200/80 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
            title="Back"
          >
            <ChevronLeft className="w-5 h-5 text-gray-800" />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-base font-bold text-gray-900 text-center">
              Add Vehicle
            </h1>
            <span className="text-[11px] text-gray-500 font-medium">
              {mode === 'guided' ? `Step ${step} of 6` : 'Quick Registration'}
            </span>
          </div>
          <div className="w-9" />
        </div>

        {/* Guided vs Quick Mode Segmented Pill */}
        <div className="px-5 pt-3">
          <div className="bg-surface-alt p-1 rounded-xl flex items-center border border-gray-200/60">
            <button
              type="button"
              onClick={() => setMode('guided')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'guided'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Guided Steps
            </button>
            <button
              type="button"
              onClick={() => setMode('quick')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'quick'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Quick Add
            </button>
          </div>
        </div>

        {/* Mode 1: Quick Add Form */}
        {mode === 'quick' ? (
          <div className="p-5 flex flex-col gap-4">
            <div className="bg-primary-light/50 border border-primary-border/40 rounded-2xl p-3.5 flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[20px]">info</span>
              <span className="text-xs text-gray-700">
                Quickly register your vehicle details for eco-friendly mobile detailing.
              </span>
            </div>

            <div className="flex flex-col gap-3.5">
              {/* Brand & Model */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">Make / Brand</label>
                  <input
                    type="text"
                    value={effectiveBrand}
                    onChange={(e) => {
                      setCustomBrand(e.target.value)
                      setSelectedBrand(e.target.value)
                    }}
                    placeholder="e.g. Audi, BMW"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">Model</label>
                  <input
                    type="text"
                    value={customModel || selectedModel}
                    onChange={(e) => {
                      setCustomModel(e.target.value)
                      setSelectedModel(e.target.value)
                    }}
                    placeholder="e.g. A4, 3 Series"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Year & Body Type */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2015', '2010'].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">Body Type (Size)</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as VehicleCategory)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {VEHICLE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Paint Color & License Plate */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">Paint Color</label>
                  <input
                    type="text"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    placeholder="e.g. Daytona Gray"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">License Plate (Optional)</label>
                  <input
                    type="text"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    placeholder="e.g. BC-8492-KW"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-gray-900 uppercase focus:outline-none focus:border-primary placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleFinalAdd}
                className="w-full mt-4 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer"
              >
                Save Vehicle to Garage
              </button>
            </div>
          </div>
        ) : (
          /* Mode 2: Multi-Step Guided Selection */
          <div className="p-5 flex flex-col gap-4">
            {/* STEP 1: SELECT BRAND */}
            {step === 1 && (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-primary">Select Brand</span>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search Brands (e.g. Audi, BMW, Honda)..."
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary pr-10"
                  />
                  <span className="material-symbols-outlined text-[18px] text-primary absolute right-3 top-1/2 -translate-y-1/2">
                    search
                  </span>
                </div>

                <div className="flex flex-col divide-y divide-gray-100 mt-2 max-h-[420px] overflow-y-auto">
                  {VEHICLE_BRANDS.filter((b) =>
                    b.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((brand, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedBrand(brand)
                        setCustomBrand('')
                        const brandModels = BRAND_MODELS_MAP[brand]
                        if (brandModels && brandModels.length > 0) {
                          setSelectedModel(brandModels[0])
                        }
                        setSearchTerm('')
                        setStep(2)
                      }}
                      className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-1.5 h-4 bg-primary rounded-full" />
                        <span className="text-sm font-semibold text-gray-900">
                          {brand}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-gray-400">chevron_right</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: SELECT MODEL */}
            {step === 2 && (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-primary">Select Model</span>
                <h3 className="text-base font-bold text-gray-900 mt-1">
                  {effectiveBrand}
                </h3>

                <div className="flex flex-col divide-y divide-gray-100">
                  {availableModels.map((model, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedModel(model)
                        setCustomModel('')
                        setStep(3)
                      }}
                      className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-1.5 h-4 bg-primary rounded-full" />
                        <span className="text-sm font-semibold text-gray-900">
                          {model}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-gray-400">chevron_right</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: SELECT BODY TYPE / SIZING TIER */}
            {step === 3 && (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-primary">Select Vehicle Body Type</span>
                <h3 className="text-sm font-bold text-gray-900 mt-1">
                  {effectiveBrand} {selectedModel}
                </h3>
                <span className="text-[11px] text-gray-500">
                  Vehicle size allows mobile technicians to allocate proper washing wash duration and foam volume.
                </span>

                <div className="grid grid-cols-2 gap-2.5 mt-2">
                  {VEHICLE_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedType(cat)
                        setStep(4)
                      }}
                      className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        selectedType === cat
                          ? 'border-primary bg-primary-light text-primary font-bold'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      <Car className="w-5 h-5 text-primary" />
                      <span className="text-xs">{cat}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: SELECT YEAR */}
            {step === 4 && (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-primary">Select Production Year</span>
                <h3 className="text-sm font-bold text-gray-900 mt-1">
                  {effectiveBrand} {selectedModel} ({selectedType})
                </h3>

                <div className="grid grid-cols-3 gap-2 mt-2">
                  {['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', 'Classic'].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => {
                        setSelectedYear(yr)
                        setStep(5)
                      }}
                      className={`py-2.5 px-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        selectedYear === yr
                          ? 'border-primary bg-primary-light text-primary font-bold'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: COLOR & LICENSE PLATE */}
            {step === 5 && (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-primary">Select Color &amp; Plate</span>
                <h3 className="text-sm font-bold text-gray-900 mt-1">
                  {effectiveBrand} {selectedModel} • {selectedYear}
                </h3>

                <span className="text-xs font-bold text-gray-700 mt-2">Factory / Paint Color</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Daytona Gray',
                    'Glacier White',
                    'Mythos Black',
                    'Ignition Red',
                    'Navarra Blue',
                    'Sonic Silver',
                  ].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSelectedColor(col)}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 cursor-pointer transition-all ${
                        selectedColor === col
                          ? 'border-primary bg-primary-light text-primary font-bold'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-500 border border-white" />
                      <span className="truncate">{col}</span>
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-1 mt-3">
                  <label className="text-xs font-bold text-gray-700">License Plate (Optional)</label>
                  <input
                    type="text"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    placeholder="e.g. BC-8492-KW"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-gray-900 uppercase focus:outline-none focus:border-primary placeholder:font-normal"
                  />
                  <span className="text-[11px] text-gray-400">
                    Allows the mobile wash technician to easily spot your car at your home or office.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(6)}
                  className="w-full mt-3 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Continue to Review
                </button>
              </div>
            )}

            {/* STEP 6: REVIEW & ADD TO GARAGE */}
            {step === 6 && (
              <div className="flex flex-col gap-4">
                <div className="bg-surface-alt rounded-2xl p-4 border border-gray-200/80 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      VEHICLE READY TO SAVE
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-status-active/15 text-status-active text-[10px] font-bold">
                      {selectedType}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900">
                    {effectiveBrand} {selectedModel}
                  </h3>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-gray-600">
                    <span>Year: {selectedYear}</span>
                    <span>•</span>
                    <span>Color: {selectedColor}</span>
                    {licensePlate && (
                      <>
                        <span>•</span>
                        <span className="font-mono font-bold text-gray-900">Plate: {licensePlate.toUpperCase()}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Dimensions specs */}
                <div className="flex flex-col divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden text-xs">
                  <div className="flex items-center justify-between p-3 bg-white">
                    <span className="font-medium text-gray-800">Body Size Class</span>
                    <span className="font-semibold text-gray-900">{selectedType}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white">
                    <span className="font-medium text-gray-800">Ground Clearance</span>
                    <span className="font-mono text-gray-600">5.4 in</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white">
                    <span className="font-medium text-gray-800">Curb Weight</span>
                    <span className="font-mono text-gray-600">~3,350 lbs</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleFinalAdd}
                  className="w-full mt-2 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer"
                >
                  Save Vehicle to Garage
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
