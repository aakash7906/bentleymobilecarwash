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

export type VehicleCategory = 'Sedan' | 'SUV' | 'Truck' | 'Coupe' | 'Van' | 'Hatchback'

export interface SavedVehicle {
  id: string
  name: string
  brand: string
  model: string
  year?: string
  variant?: string
  color?: string
  type: VehicleCategory
  licensePlate?: string
  isPrimary?: boolean
  notes?: string
  specs?: {
    length?: string
    width?: string
    height?: string
    wheelbase?: string
    groundClearance?: string
    curbWeight?: string
  }
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

export type UserRole = 'customer' | 'driver' | 'admin'

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'scheduled'
  | 'en_route'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface BookingRecord {
  id: string
  title: string
  category: string
  vehicle: string
  vehicleType?: VehicleCategory
  licensePlate?: string
  image: string
  price: string
  totalNumeric: number
  date: string
  time: string
  status: BookingStatus
  locationType: 'mobile' | 'shop'
  address: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  technicianName?: string
  driverId?: string
  driverName?: string
  driverPhone?: string
  driverVehicle?: string
  driverVanNumber?: string
  driverCoords?: [number, number]
  customerCoords?: [number, number]
  distanceKm?: number
  estimatedMins?: number
  addons?: string[]
  paymentMethod?: string
  frequency?: 'one_time' | 'biweekly' | 'monthly'
  serviceItem?: ServiceItem
  createdAt: string
  rating?: number
  review?: string
}



