import React, { useState } from 'react'
import { SavedVehicle } from '@/types'
import { ChevronLeft, Plus, Trash2, CheckCircle2, ShieldCheck, Car } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'

interface SavedVehiclesModalProps {
  isOpen: boolean
  onClose: () => void
  vehicles: SavedVehicle[]
  currentVehicleName: string
  onSelectVehicle: (vehicleName: string) => void
  onDeleteVehicle: (vehicleId: string) => void
  onOpenAddVehicle: () => void
}

export const SavedVehiclesModal: React.FC<SavedVehiclesModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  currentVehicleName,
  onSelectVehicle,
  onDeleteVehicle,
  onOpenAddVehicle,
}) => {
  const [vehicleToDelete, setVehicleToDelete] = useState<SavedVehicle | null>(null)

  if (!isOpen) return null

  const handleSetActive = (vehicle: SavedVehicle) => {
    onSelectVehicle(vehicle.name)
  }

  const confirmDelete = () => {
    if (vehicleToDelete) {
      onDeleteVehicle(vehicleToDelete.id)
      setVehicleToDelete(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-center animate-in fade-in duration-200">
      <div className="w-full min-h-screen bg-[#f7f9fb] flex flex-col shadow-2xl relative overflow-y-auto">
        {/* 1. TOP HEADER */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-gray-200/80 bg-white shadow-xs flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
            title="Back"
          >
            <ChevronLeft className="w-5 h-5 text-gray-800" />
          </button>

          <div className="flex flex-col items-center">
            <h1 className="text-base font-bold text-gray-900 tracking-tight leading-tight">
              My Garage
            </h1>
            <span className="text-[11px] font-medium text-gray-500">
              {vehicles.length} {vehicles.length === 1 ? 'Registered Vehicle' : 'Registered Vehicles'}
            </span>
          </div>

          <button
            onClick={onOpenAddVehicle}
            className="w-9 h-9 rounded-full bg-primary text-primary-foreground shadow-xs flex items-center justify-center hover:bg-primary-hover active:scale-95 transition-all cursor-pointer"
            title="Add New Vehicle"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* 2. BODY CONTENT */}
        <div className="p-4 sm:p-5 flex flex-col gap-4 flex-1">        

          {/* Vehicle Cards List */}
          <div className="flex flex-col gap-3">
            {vehicles.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-gray-200/80 shadow-xs flex flex-col items-center text-center gap-3 animate-in fade-in">
                <div className="w-16 h-16 rounded-2xl bg-surface-alt flex items-center justify-center text-gray-400">
                  <Car className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Your Garage is Empty</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">
                    Add your car, SUV, or truck to unlock personalized detailing prices and save your license plate.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenAddVehicle}
                  className="mt-2 px-5 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Your Vehicle</span>
                </button>
              </div>
            ) : (
              vehicles.map((veh) => {
                const isActive = veh.name === currentVehicleName

              return (
                <div
                  key={veh.id}
                  className={`bg-white rounded-2xl p-4 border transition-all shadow-xs relative flex flex-col gap-3 ${
                    isActive
                      ? 'border-status-active ring-1 ring-status-active/30'
                      : 'border-gray-200/80 hover:border-gray-300'
                  }`}
                >
                  {/* Top Row: Car Icon + Name + Active Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-status-active/10 text-status-active'
                            : 'bg-surface-alt text-gray-700'
                        }`}
                      >
                        <Car className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          {veh.brand} {veh.year ? `• ${veh.year}` : ''}
                        </span>
                        <h3 className="text-sm font-bold text-gray-900 leading-snug">
                          {veh.name}
                        </h3>
                      </div>
                    </div>

                    {/* Active Badge */}
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-active/10 text-status-active text-[11px] font-bold border border-status-active/20 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-active animate-ping" />
                        Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetActive(veh)}
                        className="text-[11px] font-bold text-primary hover:text-primary-hover bg-primary-light hover:bg-primary/15 px-2.5 py-1 rounded-full border border-primary-border/40 transition-colors cursor-pointer shrink-0"
                      >
                        Select
                      </button>
                    )}
                  </div>

                  {/* Attributes & Specs Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {/* Vehicle Type / Size Tier */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-surface-alt text-gray-700 text-[11px] font-semibold border border-gray-200/60">
                      <span className="material-symbols-outlined text-[13px]">directions_car</span>
                      {veh.type}
                    </span>

                    {/* License Plate */}
                    {veh.licensePlate && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-gray-900 text-white text-[11px] font-mono font-bold tracking-wider">
                        <span className="material-symbols-outlined text-[12px] text-gray-400">badge</span>
                        {veh.licensePlate}
                      </span>
                    )}

                    {/* Color */}
                    {veh.color && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-surface-alt text-gray-700 text-[11px] font-medium border border-gray-200/60">
                        <span className="w-2 h-2 rounded-full bg-gray-500 border border-white" />
                        {veh.color}
                      </span>
                    )}

                    {/* Variant */}
                    {veh.variant && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-surface-alt text-gray-600 text-[10px] font-medium">
                        {veh.variant}
                      </span>
                    )}
                  </div>

                  {/* Bottom Action Row */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">
                      {isActive ? 'Currently detailing this vehicle' : 'Tap to wash this vehicle'}
                    </span>

                    <div className="flex items-center gap-2">
                      {vehicles.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setVehicleToDelete(veh)}
                          className="w-8 h-8 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-light flex items-center justify-center transition-colors cursor-pointer"
                          title="Remove Vehicle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

          {/* Quick Add Button Card */}
          <button
            type="button"
            onClick={onOpenAddVehicle}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-300 hover:border-primary bg-white/60 hover:bg-primary-light/40 flex items-center justify-center gap-2 text-gray-700 hover:text-primary font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Another Vehicle to Garage</span>
          </button>
        </div>

        {/* 3. DELETE CONFIRMATION MODAL */}
        <Dialog
          isOpen={!!vehicleToDelete}
          onClose={() => setVehicleToDelete(null)}
          zIndex="z-60"
          maxWidth="xs"
          icon={<Trash2 className="w-6 h-6" />}
          iconVariant="primary"
          title="Remove Vehicle?"
          description={
            vehicleToDelete ? (
              <>
                Are you sure you want to delete <span className="font-semibold text-gray-800">"{vehicleToDelete.name}"</span> from your saved vehicles?
              </>
            ) : undefined
          }
        >
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setVehicleToDelete(null)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              Delete
            </button>
          </div>
        </Dialog>
      </div>
    </div>
  )
}
