import { Booking, ServicePackage } from '@/types'
import { PRICING_PACKAGES } from '@/data/mockData'

const LOCAL_STORAGE_KEY = 'bentley_bookings_store'

export const bookingService = {
  createBooking: async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<Booking> => {
    const newBooking: Booking = {
      ...bookingData,
      id: 'BWC-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
      status: 'confirmed',
      technicianName: 'Bentley Certified Detailer (Kelowna Rig #01)',
    }

    try {
      const existing = localStorage.getItem(LOCAL_STORAGE_KEY)
      const list: Booking[] = existing ? JSON.parse(existing) : []
      list.unshift(newBooking)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list))
    } catch (e) {
      console.error('Failed to save to local storage', e)
    }

    return newBooking
  },

  getAllBookings: async (): Promise<Booking[]> => {
    try {
      const existing = localStorage.getItem(LOCAL_STORAGE_KEY)
      return existing ? JSON.parse(existing) : []
    } catch {
      return []
    }
  },

  getPackageById: (id: string): ServicePackage | undefined => {
    return PRICING_PACKAGES.find((p) => p.id === id)
  },
}
