import React, { useState } from 'react'
import {
  VEHICLE_BRANDS,
  SUBARU_MODELS,
  WRX_VARIANTS,
  WRX_YEARS,
  WRX_COLORS,
} from '@/data/mockData'

interface AddVehicleModalProps {
  isOpen: boolean
  onClose: () => void
  onVehicleAdded: (vehicleName: string) => void
}

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({
  isOpen,
  onClose,
  onVehicleAdded,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1)
  const [selectedBrand, setSelectedBrand] = useState('Subaru')
  const [selectedModel, setSelectedModel] = useState('WRX')
  const [selectedVariant, setSelectedVariant] = useState('Base')
  const [selectedYear, setSelectedYear] = useState('2022 – Present')
  const [selectedColor, setSelectedColor] = useState('Ignition Red')
  const [searchTerm, setSearchTerm] = useState('')

  if (!isOpen) return null

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as any)
    } else {
      onClose()
    }
  }

  const handleFinalAdd = () => {
    const fullName = `${selectedBrand} ${selectedModel} ${selectedVariant} (${selectedColor})`
    onVehicleAdded(fullName)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto animate-in slide-in-from-bottom duration-200">
      <div className="max-w-md md:max-w-xl mx-auto min-h-screen flex flex-col bg-white pb-10">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <button
            onClick={handleBack}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <h1 className="text-base font-bold text-gray-900 text-center flex-1">
            Add Vehicle
          </h1>
          <div className="w-9" />
        </div>

        {/* Multi-Step Selection Body */}
        <div className="p-5 flex flex-col gap-4">
          {/* STEP 1: SELECT BRAND */}
          {step === 1 && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-[#dc2626]">Select Brand</span>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search Brands..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#dc2626] pr-10"
                />
                <span className="material-symbols-outlined text-[18px] text-[#dc2626] absolute right-3 top-1/2 -translate-y-1/2">
                  search
                </span>
              </div>

              <div className="flex flex-col divide-y divide-gray-100 mt-2">
                {VEHICLE_BRANDS.filter((b) =>
                  b.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((brand, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedBrand(brand)
                      setSearchTerm('')
                      setStep(2)
                    }}
                    className="flex items-center gap-3 py-3 cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors"
                  >
                    <span className="w-1 h-4 bg-[#dc2626] rounded-full" />
                    <span className="text-sm font-semibold text-gray-900">
                      {brand}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: SELECT MODEL */}
          {step === 2 && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-[#dc2626]">Select Model</span>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Models..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#dc2626] pr-10"
                />
                <span className="material-symbols-outlined text-[18px] text-[#dc2626] absolute right-3 top-1/2 -translate-y-1/2">
                  search
                </span>
              </div>

              <h3 className="text-base font-bold text-[#dc2626] mt-2">
                {selectedBrand}
              </h3>

              <div className="flex flex-col divide-y divide-gray-100">
                {SUBARU_MODELS.map((model, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedModel(model)
                      setStep(3)
                    }}
                    className="flex items-center gap-3 py-3 cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors"
                  >
                    <span className="w-1 h-4 bg-[#dc2626] rounded-full" />
                    <span className="text-sm font-semibold text-gray-900">
                      {model}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: SELECT VARIANT */}
          {step === 3 && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-[#dc2626]">Select Variant</span>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Variant..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#dc2626] pr-10"
                />
                <span className="material-symbols-outlined text-[18px] text-[#dc2626] absolute right-3 top-1/2 -translate-y-1/2">
                  search
                </span>
              </div>

              <h3 className="text-base font-bold text-[#dc2626] mt-2">
                {selectedBrand} {selectedModel}
              </h3>

              <div className="flex flex-col divide-y divide-gray-100">
                {WRX_VARIANTS.map((variant, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedVariant(variant)
                      setStep(4)
                    }}
                    className="flex items-center gap-3 py-3 cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors"
                  >
                    <span className="w-1 h-4 bg-[#dc2626] rounded-full" />
                    <span className="text-sm font-semibold text-gray-900">
                      {variant}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: SELECT YEAR */}
          {step === 4 && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-[#dc2626]">Select Year</span>
              <h3 className="text-base font-bold text-[#dc2626] mt-1">
                {selectedBrand} {selectedModel} {selectedVariant}
              </h3>

              <div className="flex flex-col divide-y divide-gray-100 mt-2">
                {WRX_YEARS.map((yr, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedYear(yr)
                      setStep(5)
                    }}
                    className="flex items-center gap-3 py-3 cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors"
                  >
                    <span className="w-1 h-4 bg-[#dc2626] rounded-full" />
                    <span className="text-sm font-semibold text-gray-900">
                      {yr}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: SELECT COLOR */}
          {step === 5 && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-[#dc2626]">Select Color</span>
              <h3 className="text-base font-bold text-[#dc2626] mt-1">
                {selectedBrand} {selectedModel} {selectedVariant} {selectedYear}
              </h3>

              <div className="flex flex-col divide-y divide-gray-100 mt-2">
                {WRX_COLORS.map((col, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedColor(col)
                      setStep(6)
                    }}
                    className="flex items-center gap-3 py-3 cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors"
                  >
                    <span className="w-1 h-4 bg-[#dc2626] rounded-full" />
                    <span className="text-sm font-semibold text-gray-900">
                      {col}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: DIMENSIONS & CAPACITY SPECIFICATIONS + ADD VEHICLE */}
          {step === 6 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-bold text-[#dc2626] border-b border-gray-200 pb-2">
                {selectedBrand} {selectedModel} {selectedVariant} {selectedYear} {selectedColor}
              </h3>

              <span className="text-sm font-bold text-gray-900 underline decoration-gray-300 underline-offset-4">
                Dimensions &amp; Capacity
              </span>

              <div className="flex flex-col divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden text-xs">
                <div className="flex items-center justify-between p-3 bg-white">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-3.5 bg-[#dc2626] rounded-full" />
                    <span className="font-medium text-gray-800">Overall Length</span>
                  </div>
                  <span className="font-mono text-gray-600">183.8 in</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-3.5 bg-[#dc2626] rounded-full" />
                    <span className="font-medium text-gray-800">Overall Width</span>
                  </div>
                  <span className="font-mono text-gray-600">71.9 in</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-3.5 bg-[#dc2626] rounded-full" />
                    <span className="font-medium text-gray-800">Height</span>
                  </div>
                  <span className="font-mono text-gray-600">57.8 in</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-3.5 bg-[#dc2626] rounded-full" />
                    <span className="font-medium text-gray-800">Wheelbase</span>
                  </div>
                  <span className="font-mono text-gray-600">105.2 in</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-3.5 bg-[#dc2626] rounded-full" />
                    <span className="font-medium text-gray-800">Ground Clearance</span>
                  </div>
                  <span className="font-mono text-gray-600">5.4 in</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-3.5 bg-[#dc2626] rounded-full" />
                    <span className="font-medium text-gray-800">Curb Weight</span>
                  </div>
                  <span className="font-mono text-gray-600">~3,351 lbs</span>
                </div>
              </div>

              {/* Red Add Vehicle Final Button */}
              <button
                onClick={handleFinalAdd}
                className="w-full mt-3 py-3.5 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm font-bold shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer"
              >
                Add Vehicle
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
