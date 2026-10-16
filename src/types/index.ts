export type VehicleCategory = 'sedan' | 'suv' | 'truck' | 'exotic' | 'fleet'

export interface ServicePackage {
  id: string
  name: string
  price: number
  unit: string
  popular?: boolean
  features: string[]
  excludedFeatures?: string[]
  ctaText: string
}

export interface SpecialtyService {
  name: string
  price: string
  description: string
}

export interface MembershipPlan {
  id: string
  name: string
  tier: string
  price: string
  duration: string
  popular?: boolean
  features: string[]
  ctaText: string
}

export interface Testimonial {
  id: string
  author: string
  locationOrType: string
  rating: number
  comment: string
  avatarInitial: string
}

export interface Treatment {
  title: string
  subtitle: string
  icon: string
}

export interface CustomerDetails {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  zipCode: string
  specialInstructions?: string
}

export interface VehicleDetails {
  category: VehicleCategory
  make: string
  model: string
  year: string
  color: string
  licensePlate?: string
}

export interface Booking {
  id: string
  createdAt: string
  customer: CustomerDetails
  vehicle: VehicleDetails
  packageId: string
  packageName: string
  selectedAddOns: string[]
  date: string
  timeSlot: string
  totalPrice: number
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed'
  technicianName?: string
  paymentMethod: string
}
