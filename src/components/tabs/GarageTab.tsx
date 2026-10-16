import React, { useState } from 'react'
import { SAVED_VEHICLE } from '@/data/mockData'

interface GarageTabProps {
  onScheduleForVehicle: (pkgId: string) => void
}

export const GarageTab: React.FC<GarageTabProps> = ({ onScheduleForVehicle }) => {
  const [vehicles, setVehicles] = useState([
    SAVED_VEHICLE,
    {
      id: 'v2',
      year: '2024',
      make: 'Ford',
      model: 'F-150 Lightning',
      plate: 'BC • 712-WXB',
      color: 'Antimatter Blue',
      lastWashDate: '1 month ago',
      recommendedPackage: 'Deluxe Clean',
      reason: 'Road salt & interior floor liner flush',
    },
  ])

  const [isAdding, setIsAdding] = useState(false)
  const [newMake, setNewMake] = useState('')
  const [newModel, setNewModel] = useState('')
  const [newPlate, setNewPlate] = useState('')

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMake || !newModel) return

    setVehicles((prev) => [
      ...prev,
      {
        id: 'v' + (prev.length + 1),
        year: '2024',
        make: newMake,
        model: newModel,
        plate: newPlate || 'BC • NEW-RIG',
        color: 'Obsidian Black',
        lastWashDate: 'Never',
        recommendedPackage: 'Supreme Detail',
        reason: 'New vehicle initial paint seal',
      },
    ])
    setNewMake('')
    setNewModel('')
    setNewPlate('')
    setIsAdding(false)
  }

  return (
    <div className="flex flex-col gap-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight">
            My Garage
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Manage your household vehicles, maintenance history, and quick detailing locks.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="btn-primary text-xs px-3 py-1.5 font-bold shadow-sm"
        >
          <span className="material-symbols-outlined text-[15px]">add</span>
          <span>Add Car</span>
        </button>
      </div>

      {/* Add vehicle form drawer */}
      {isAdding && (
        <form onSubmit={handleAddVehicle} className="app-card p-4 flex flex-col gap-3 border-[var(--color-primary)]">
          <span className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
            Register New Vehicle
          </span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={newMake}
              onChange={(e) => setNewMake(e.target.value)}
              placeholder="Make (e.g. BMW)"
              className="app-input px-3 py-1.5 text-xs"
              required
            />
            <input
              type="text"
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              placeholder="Model (e.g. X5 M)"
              className="app-input px-3 py-1.5 text-xs"
              required
            />
          </div>
          <input
            type="text"
            value={newPlate}
            onChange={(e) => setNewPlate(e.target.value)}
            placeholder="License Plate (e.g. BC • 334-LMN)"
            className="app-input px-3 py-1.5 text-xs font-mono"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="btn-secondary text-xs px-3 py-1"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs px-3 py-1">
              Save Vehicle
            </button>
          </div>
        </form>
      )}

      {/* Vehicles List */}
      <div className="flex flex-col gap-4">
        {vehicles.map((v) => (
          <div key={v.id} className="app-card p-4 sm:p-5 flex flex-col gap-3.5 border border-[var(--border-light)]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-[var(--radius-box-sm)] bg-[var(--surface-alt)] flex items-center justify-center text-[var(--color-primary)]">
                  <span className="material-symbols-outlined text-[24px]">directions_car</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-extrabold text-[var(--text-main)]">
                      {v.year} {v.make} {v.model}
                    </span>
                    <span className="badge-pill bg-[var(--surface-alt)] text-[var(--text-muted)] text-[10px] px-2 py-0.5 font-mono font-bold">
                      {v.plate}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">
                    Color: {v.color} • Last washed: {v.lastWashDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Vehicle health & maintenance tags */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[var(--border-subtle)]">
              <div className="p-2.5 rounded-[var(--radius-box-sm)] bg-[var(--surface-subtle)] flex flex-col">
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">
                  Ceramic Sealant
                </span>
                <span className="font-bold text-emerald-600 mt-0.5">85% Active Hydrophobic</span>
              </div>
              <div className="p-2.5 rounded-[var(--radius-box-sm)] bg-[var(--surface-subtle)] flex flex-col">
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">
                  Recommended Service
                </span>
                <span className="font-bold text-[var(--color-primary)] mt-0.5">{v.recommendedPackage}</span>
              </div>
            </div>

            <button
              onClick={() => onScheduleForVehicle('supreme-detail')}
              className="btn-primary py-2 text-xs font-bold w-full"
            >
              Schedule Mobile Wash for this Vehicle
            </button>
          </div>
        ))}
      </div>

      {/* Detailing History */}
      <div className="app-card p-4 sm:p-5 flex flex-col gap-3">
        <h3 className="text-sm font-extrabold text-[var(--text-main)]">
          Completed Service Receipts &amp; Guarantees
        </h3>
        <div className="flex flex-col divide-y divide-[var(--border-subtle)] text-xs">
          <div className="flex items-center justify-between py-2.5">
            <div className="flex flex-col">
              <span className="font-bold text-[var(--text-main)]">#BM-5891 • Supreme Wash</span>
              <span className="text-[11px] text-[var(--text-muted)]">Completed by Raheem (Van 4) • Kelowna</span>
            </div>
            <button
              onClick={() => alert('Downloading PDF invoice for #BM-5891...')}
              className="text-[var(--color-primary)] font-bold hover:underline"
            >
              Receipt PDF
            </button>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <div className="flex flex-col">
              <span className="font-bold text-[var(--text-main)]">#BM-5210 • Deluxe Clean + Pet De-Hair</span>
              <span className="text-[11px] text-[var(--text-muted)]">Completed by Marcus (Van 2) • West Kelowna</span>
            </div>
            <button
              onClick={() => alert('Downloading PDF invoice for #BM-5210...')}
              className="text-[var(--color-primary)] font-bold hover:underline"
            >
              Receipt PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
