export type TabType = 'services' | 'tracking' | 'garage' | 'ops'

export interface DetailPackage {
  id: string
  title: string
  price: string
  priceNumeric: number
  badge: string
  kelownaChoice?: boolean
  image: string
  description: string
  features: string[]
  ctaText: string
  highlighted?: boolean
  category: 'all' | 'exterior' | 'interior' | 'ceramic' | 'specialty'
}

export interface MembershipPass {
  id: string
  title: string
  price: string
  badge?: string
  washesIncluded: string
  features: string[]
  ctaText: string
  highlighted?: boolean
}

export interface ClientReview {
  id: string
  author: string
  source: string
  location: string
  rating: number
  comment: string
  verified?: boolean
}

export interface CustomerVehicle {
  id: string
  year: string
  make: string
  model: string
  plate: string
  color: string
  lastWashDate?: string
  recommendedPackage: string
  reason: string
}

export type BookingStatus =
  | 'confirmed'
  | 'on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'completed'

export interface DispatchBooking {
  id: string
  time: string
  packageTitle: string
  price: number
  customerName: string
  customerPhone: string
  vehicle: string
  address: string
  status: BookingStatus
  driverName?: string
  driverVan?: string
  driverEta?: string
  unassigned?: boolean
  notes?: string
  immediateAction?: boolean
  preAuthorized?: boolean
  paidOnline?: boolean
  paymentMethod?: string
  photoVerified?: {
    thumbnail: string
    note: string
    time: string
  }
}

export interface TimelineStage {
  id: number
  title: string
  time: string
  subtitle: string
  active?: boolean
  completed?: boolean
}
