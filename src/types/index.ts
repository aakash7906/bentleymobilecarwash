export type TabType = 'home' | 'services' | 'bookings' | 'notifications' | 'profile'

export interface ServiceItem {
  id: string
  title: string
  category: string
  price: string
  priceNumeric: number
  estTime: string
  vehicleModel: string
  image: string
  description: string
  included: string[]
}

export interface VehicleOption {
  id: string
  brand: string
  model: string
  year?: string
  color?: string
}

export interface ModificationNotification {
  id: string
  date: string
  time: string
  title: string
  description: string
}
