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

export interface ProductItem {
  id: string
  title: string
  subtitle?: string
  category: string
  price: string
  priceNumeric: number
  originalPrice?: string
  rating: number
  reviewsCount: number
  image: string
  description: string
  features: string[]
  inStock: boolean
  volume?: string
  badge?: string
}

export interface CartItem {
  product: ProductItem
  quantity: number
}

export interface UserProfile {
  name: string
  email: string
  phone: string
  address: string
  city?: string
  postalCode?: string
  avatar: string
  preferredVehicle?: string
  membershipTier?: string
}


