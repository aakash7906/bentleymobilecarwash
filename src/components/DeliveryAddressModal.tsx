import React, { useState } from 'react'
import {
  MapPin,
  Home,
  Briefcase,
  Building2,
  Plus,
  Check,
  X,
  Edit2,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { DeliveryAddress } from '@/types'

interface DeliveryAddressModalProps {
  isOpen: boolean
  onClose: () => void
  currentAddress: DeliveryAddress
  onSelectAddress: (address: DeliveryAddress) => void
  userName?: string
  userPhone?: string
}

export const DeliveryAddressModal: React.FC<DeliveryAddressModalProps> = ({
  isOpen,
  onClose,
  currentAddress,
  onSelectAddress,
  userName = 'Member',
  userPhone = '',
}) => {
  // Pre-load default addresses from localStorage or defaults
  const [addresses, setAddresses] = useState<DeliveryAddress[]>(() => {
    try {
      const stored = localStorage.getItem('bentley_saved_delivery_addresses')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch { }

    return [
      {
        id: 'addr-home',
        label: 'Home',
        recipientName: currentAddress?.recipientName || userName || 'Customer',
        streetAddress: currentAddress?.streetAddress || '1420 Water Street, Apt 304',
        city: currentAddress?.city || 'Kelowna, BC',
        postalCode: currentAddress?.postalCode || 'V1Y 1J4',
        phone: currentAddress?.phone || userPhone || '(250) 555-0192',
        deliveryNotes: 'Buzz 304 at front lobby, technician can park in visitor bay',
        isDefault: true,
      },
      {
        id: 'addr-work',
        label: 'Office / Work',
        recipientName: userName || 'Customer',
        streetAddress: '1630 Dickson Ave, Landmark 6',
        city: 'Kelowna, BC',
        postalCode: 'V1Y 9Y2',
        phone: userPhone || '(250) 555-0192',
        deliveryNotes: 'Leave with 4th floor reception or call on arrival',
        isDefault: false,
      },
      {
        id: 'addr-studio',
        label: 'Bentley Studio Pickup',
        recipientName: 'Bentley Express Concierge',
        streetAddress: '1450 Ellis St (Bentley Mobile Car Wash Hub)',
        city: 'Kelowna, BC',
        postalCode: 'V1Y 2A4',
        deliveryNotes: 'Direct handoff at studio detailing bay',
        isDefault: false,
      },
    ]
  })

  const [selectedId, setSelectedId] = useState<string>(currentAddress?.id || 'addr-home')
  const [isEditingNew, setIsEditingNew] = useState(false)

  // Form fields for adding/editing address
  const [formLabel, setFormLabel] = useState<'Home' | 'Office' | 'Other'>('Home')
  const [formName, setFormName] = useState(userName || '')
  const [formPhone, setFormPhone] = useState(userPhone || '')
  const [formStreet, setFormStreet] = useState('')
  const [formCity, setFormCity] = useState('Kelowna, BC')
  const [formPostal, setFormPostal] = useState('V1Y 1J4')
  const [formNotes, setFormNotes] = useState('')
  const [formError, setFormError] = useState('')

  if (!isOpen) return null

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formStreet.trim()) {
      setFormError('Please enter a street address.')
      return
    }
    if (!formCity.trim()) {
      setFormError('Please enter a city.')
      return
    }

    const newAddr: DeliveryAddress = {
      id: `addr-${Date.now()}`,
      label: formLabel,
      recipientName: formName.trim() || userName || 'Customer',
      streetAddress: formStreet.trim(),
      city: formCity.trim(),
      postalCode: formPostal.trim() || 'V1Y 1A1',
      phone: formPhone.trim() || userPhone,
      deliveryNotes: formNotes.trim(),
      isDefault: false,
    }

    const updatedList = [newAddr, ...addresses]
    setAddresses(updatedList)
    setSelectedId(newAddr.id)
    try {
      localStorage.setItem('bentley_saved_delivery_addresses', JSON.stringify(updatedList))
    } catch { }

    setIsEditingNew(false)
    setFormStreet('')
    setFormNotes('')
    setFormError('')
  }

  const handleConfirmSelection = () => {
    const chosen = addresses.find((a) => a.id === selectedId) || addresses[0]
    if (chosen) {
      onSelectAddress(chosen)
      onClose()
    }
  }

  const getLabelIcon = (label: string) => {
    const l = label.toLowerCase()
    if (l.includes('home')) return <Home className="w-4 h-4 text-primary" />
    if (l.includes('work') || l.includes('office')) return <Briefcase className="w-4 h-4 text-primary" />
    return <Building2 className="w-4 h-4 text-primary" />
  }

  return (
    <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 animate-in slide-in-from-bottom duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-gray-900">
                Choose Delivery Address
              </h2>
              <p className="text-[11px] text-gray-500">
                Hand-delivered by Bentley certified technicians
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-alt hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-0.5">
          {/* New Address Form Toggle */}
          {!isEditingNew ? (
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Saved Locations ({addresses.length})
              </span>
              <button
                type="button"
                onClick={() => setIsEditingNew(true)}
                className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Address</span>
              </button>
            </div>
          ) : (
            <div className="bg-surface-alt rounded-2xl p-4 border border-primary/30 animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Add Delivery Destination</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingNew(false)}
                  className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer font-semibold"
                >
                  Cancel
                </button>
              </div>

              {formError && (
                <div className="text-[11px] font-semibold text-rose-600 bg-rose-50 p-2 rounded-lg mb-2.5">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveNewAddress} className="space-y-2.5">
                {/* Location Tag */}
                <div className="flex gap-2">
                  {(['Home', 'Office', 'Other'] as const).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setFormLabel(tag)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${formLabel === tag
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. John Bentley"
                      className="w-full text-xs font-medium text-gray-800 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="(250) 555-0199"
                      className="w-full text-xs font-medium text-gray-800 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Street Address &amp; Suite / Unit *
                  </label>
                  <input
                    type="text"
                    required
                    value={formStreet}
                    onChange={(e) => setFormStreet(e.target.value)}
                    placeholder="e.g. 1420 Water St, Unit 4B"
                    className="w-full text-xs font-medium text-gray-800 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">
                      City, Province *
                    </label>
                    <input
                      type="text"
                      required
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      placeholder="Kelowna, BC"
                      className="w-full text-xs font-medium text-gray-800 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={formPostal}
                      onChange={(e) => setFormPostal(e.target.value)}
                      placeholder="V1Y 1J4"
                      className="w-full text-xs font-medium text-gray-800 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Delivery / Gate / Concierge Instructions
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. Leave with building security or call on arrival"
                    className="w-full text-xs font-medium text-gray-800 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-primary"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Location</span>
                </button>
              </form>
            </div>
          )}

          {/* Address List */}
          <div className="space-y-2.5">
            {addresses.map((addr) => {
              const isSelected = selectedId === addr.id
              return (
                <div
                  key={addr.id}
                  onClick={() => setSelectedId(addr.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${isSelected
                      ? 'border-primary bg-primary-light/40 ring-1 ring-primary'
                      : 'border-gray-200 bg-white hover:bg-surface-alt'
                    }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-surface-alt text-gray-600'
                      }`}
                  >
                    {getLabelIcon(addr.label)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Primary
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-gray-800 mt-1 leading-snug">
                      {addr.recipientName} {addr.phone ? `• ${addr.phone}` : ''}
                    </p>
                    <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                      {addr.streetAddress}, {addr.city} {addr.postalCode}
                    </p>
                    {addr.deliveryNotes && (
                      <p className="text-[10px] text-gray-400 mt-1 italic">
                        Note: {addr.deliveryNotes}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-3 rounded-full bg-surface-alt hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmSelection}
            className="flex-1 py-3 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground text-xs sm:text-sm font-extrabold shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Confirm &amp; Use Address</span>
            <ArrowRight className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  )
}
export default DeliveryAddressModal
