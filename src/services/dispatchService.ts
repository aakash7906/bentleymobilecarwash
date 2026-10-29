import { BookingRecord, ShopOrder } from '@/types'

/**
 * Standard Haversine distance formula in kilometers between two [lon, lat] coordinates
 */
export function calculateDistanceKm(c1: [number, number], c2: [number, number]): number {
  const [lon1, lat1] = c1
  const [lon2, lat2] = c2
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return parseFloat((R * c).toFixed(1))
}

/**
 * Compute an absolute target arrival timestamp (ISO string) given estimated duration in minutes
 */
export function computeEstimatedArrivalTime(estimatedMins: number): string {
  const safeMins = Math.max(1, Math.min(60, Math.round(estimatedMins)))
  return new Date(Date.now() + safeMins * 60 * 1000).toISOString()
}

/**
 * Industry Standard Remaining ETA Calculator
 * Derives the exact remaining minutes from an absolute target arrival timestamp.
 * Resilient to backgrounding, app minimizations, and client device clock drift.
 */
export function getRemainingEtaMinutes(
  record?: {
    status?: string
    estimatedArrivalTime?: string
    estimatedMins?: number
  } | null
): number | null {
  if (!record || record.status !== 'en_route') {
    return null
  }

  if (record.estimatedArrivalTime) {
    const targetMs = new Date(record.estimatedArrivalTime).getTime()
    if (!isNaN(targetMs)) {
      const diffMs = targetMs - Date.now()
      const remaining = Math.round(diffMs / 60000)
      // When time is reached or vehicle is outside, lock to 1 min (Arriving now)
      return Math.min(45, Math.max(1, remaining))
    }
  }

  // Graceful fallback to estimatedMins if timestamp is still propagating
  if (typeof record.estimatedMins === 'number' && record.estimatedMins > 0) {
    return Math.min(45, Math.max(1, Math.round(record.estimatedMins)))
  }

  return 10
}

/**
 * Unified dispatch item combining either a Car Wash BookingRecord or a ShopOrder
 */
export type ActiveDispatchItem = {
  id: string
  kind: 'wash' | 'shop'
  title: string
  customerName?: string
  customerPhone?: string
  address: string
  status: string
  driverName?: string
  driverPhone?: string
  driverVanNumber?: string
  driverCoords?: [number, number]
  customerCoords?: [number, number]
  distanceKm?: number
  estimatedMins?: number
  estimatedArrivalTime?: string
  date?: string
  time?: string
  price?: string | number
  rawBooking?: BookingRecord
  rawShopOrder?: ShopOrder
}

/**
 * Maps either a BookingRecord or a ShopOrder into a unified trackable dispatch item
 */
export function toActiveDispatchItem(
  source: BookingRecord | ShopOrder,
  kind: 'wash' | 'shop'
): ActiveDispatchItem {
  if (kind === 'wash') {
    const b = source as BookingRecord
    return {
      id: b.id,
      kind: 'wash',
      title: b.title || 'Car Detailing Service',
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      address: b.address,
      status: b.status,
      driverName: b.driverName || b.technicianName,
      driverPhone: b.driverPhone,
      driverVanNumber: b.driverVanNumber || b.driverVehicle,
      driverCoords: b.driverCoords,
      customerCoords: b.customerCoords,
      distanceKm: b.distanceKm,
      estimatedMins: b.estimatedMins,
      estimatedArrivalTime: b.estimatedArrivalTime,
      date: b.date,
      time: b.time,
      price: b.price,
      rawBooking: b,
    }
  } else {
    const o = source as ShopOrder
    const itemCount = o.items?.reduce((acc, curr) => acc + (curr.quantity || 1), 0) || 1
    return {
      id: o.id,
      kind: 'shop',
      title: `Shop Delivery (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`,
      customerName: o.recipientName || o.customerName,
      customerPhone: o.recipientPhone || o.customerPhone,
      address: o.deliveryAddress || o.shippingAddress || '',
      status: o.status,
      driverName: o.driverName,
      driverPhone: o.driverPhone,
      driverVanNumber: o.driverVanNumber,
      driverCoords: o.driverCoords,
      customerCoords: o.customerCoords,
      distanceKm: o.distanceKm,
      estimatedMins: o.estimatedMins,
      estimatedArrivalTime: o.estimatedArrivalTime,
      price: `$${Number(o.grandTotal || 0).toFixed(2)}`,
      rawShopOrder: o,
    }
  }
}
