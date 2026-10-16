import React, { createContext, useContext, useState, useEffect } from 'react'
import { VehicleCategory, CustomerDetails, VehicleDetails, Booking } from '@/types'
import { bookingService } from '@/services/bookingService'
import { PRICING_PACKAGES } from '@/data/mockData'

interface BookingStoreState {
  category: VehicleCategory
  packageId: string
  packageName: string
  date: string
  timeSlot: string
  vehicle: VehicleDetails
  customer: CustomerDetails
  totalPrice: number
  cartCount: number
  isBookingModalOpen: boolean
  recentBookings: Booking[]
  setCategory: (cat: VehicleCategory) => void
  setPackage: (pkgId: string, pkgName: string, price: number) => void
  setDateTime: (date: string, timeSlot: string) => void
  setVehicle: (vehicle: Partial<VehicleDetails>) => void
  setCustomer: (customer: Partial<CustomerDetails>) => void
  openBookingModal: (pkgId?: string, pkgName?: string, price?: number) => void
  closeBookingModal: () => void
  confirmBooking: () => Promise<Booking>
  resetBooking: () => void
  loadBookings: () => Promise<void>
}

const defaultVehicle: VehicleDetails = {
  category: 'sedan',
  make: '',
  model: '',
  year: new Date().getFullYear().toString(),
  color: '',
  licensePlate: '',
}

const defaultCustomer: CustomerDetails = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  city: 'Kelowna',
  zipCode: 'V1Y 1Y1',
  specialInstructions: '',
}

const BookingStoreContext = createContext<BookingStoreState | undefined>(undefined)

export const BookingStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [category, setCategoryState] = useState<VehicleCategory>('sedan')
  const [packageId, setPackageId] = useState<string>('protection')
  const [packageName, setPackageName] = useState<string>('Protection')
  const [totalPrice, setTotalPrice] = useState<number>(75)
  const [cartCount, setCartCount] = useState<number>(0)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false)

  const [date, setDate] = useState<string>(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [timeSlot, setTimeSlot] = useState<string>('10:00 AM – 12:00 PM')
  const [vehicle, setVehicleState] = useState<VehicleDetails>(defaultVehicle)
  const [customer, setCustomerState] = useState<CustomerDetails>(defaultCustomer)
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])

  const loadBookings = async () => {
    const list = await bookingService.getAllBookings()
    setRecentBookings(list)
  }

  useEffect(() => {
    loadBookings()
  }, [])

  const setCategory = (cat: VehicleCategory) => {
    setCategoryState(cat)
    setVehicleState((prev) => ({ ...prev, category: cat }))
  }

  const setPackage = (pkgId: string, pkgName: string, price: number) => {
    setPackageId(pkgId)
    setPackageName(pkgName)
    setTotalPrice(price)
  }

  const openBookingModal = (pkgId?: string, pkgName?: string, price?: number) => {
    if (pkgId && pkgName && price !== undefined) {
      setPackageId(pkgId)
      setPackageName(pkgName)
      setTotalPrice(price)
      setCartCount(1)
    }
    setIsBookingModalOpen(true)
  }

  const closeBookingModal = () => {
    setIsBookingModalOpen(false)
  }

  const setDateTime = (d: string, slot: string) => {
    setDate(d)
    setTimeSlot(slot)
  }

  const setVehicle = (updates: Partial<VehicleDetails>) => {
    setVehicleState((prev) => ({ ...prev, ...updates }))
  }

  const setCustomer = (updates: Partial<CustomerDetails>) => {
    setCustomerState((prev) => ({ ...prev, ...updates }))
  }

  const confirmBooking = async (): Promise<Booking> => {
    const newBooking = await bookingService.createBooking({
      customer,
      vehicle,
      packageId,
      packageName,
      selectedAddOns: [],
      date,
      timeSlot,
      totalPrice,
      paymentMethod: 'Pay After Inspection',
    })
    await loadBookings()
    setCartCount(0)
    return newBooking
  }

  const resetBooking = () => {
    setPackageId('protection')
    setPackageName('Protection')
    setTotalPrice(75)
    setVehicleState(defaultVehicle)
    setCustomerState(defaultCustomer)
  }

  return (
    <BookingStoreContext.Provider
      value={{
        category,
        packageId,
        packageName,
        date,
        timeSlot,
        vehicle,
        customer,
        totalPrice,
        cartCount,
        isBookingModalOpen,
        recentBookings,
        setCategory,
        setPackage,
        setDateTime,
        setVehicle,
        setCustomer,
        openBookingModal,
        closeBookingModal,
        confirmBooking,
        resetBooking,
        loadBookings,
      }}
    >
      {children}
    </BookingStoreContext.Provider>
  )
}

export function useBookingStore() {
  const context = useContext(BookingStoreContext)
  if (!context) {
    throw new Error('useBookingStore must be used within a BookingStoreProvider')
  }
  return context
}
