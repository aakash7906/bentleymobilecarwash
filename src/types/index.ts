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
  badge?: string
  tieredPricing?: {
    car: number
    suv: number
    truck: number
  }
  selectedTier?: 'car' | 'suv' | 'truck'
  isSpecialty?: boolean
}

export type VehicleCategory = 'Sedan' | 'SUV' | 'Truck' | 'Coupe' | 'Van' | 'Hatchback' | 'RV' | 'Boat'

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

export interface DeliveryAddress {
  id: string
  label: string
  recipientName: string
  streetAddress: string
  city: string
  postalCode: string
  phone?: string
  deliveryNotes?: string
  isDefault?: boolean
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
  savedAddresses?: DeliveryAddress[]
}

export interface DriverProfile {
  name: string
  email: string
  phone: string
  vanModel: string
  licensePlate: string
  serviceArea: string
  driverLicenseNumber?: string
  bio?: string
  avatar: string
  isAvailable?: boolean
  rating?: number
  totalJobs?: number
  emergencyContact?: string
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
  driverAvatar?: string
  driverCoords?: [number, number]
  customerCoords?: [number, number]
  distanceKm?: number
  estimatedMins?: number
  addons?: string[]
  paymentMethod?: string
  stripePaymentId?: string
  paymentStatus?: 'pending' | 'paid' | 'failed'
  paymentCollectedBy?: string
  paymentCollectedAt?: string
  paymentCollectedMethod?: 'Cash' | 'Card POS' | 'E-Transfer' | string
  paymentNotes?: string
  cardBrand?: string
  cardLast4?: string
  frequency?: 'one_time' | 'biweekly' | 'monthly'
  serviceItem?: ServiceItem
  createdAt: any
  rating?: number
  review?: string
}

export interface PaymentCollectionData {
  paymentStatus: 'paid' | 'pending'
  paymentCollectedBy?: string
  paymentCollectedAt?: string
  paymentCollectedMethod?: 'Cash' | 'Card POS' | 'E-Transfer' | string
  paymentNotes?: string
}
