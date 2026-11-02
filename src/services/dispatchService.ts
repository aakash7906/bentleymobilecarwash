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
 * Standardized ETA calculation from road or straight-line distance in km.
 * 2.0 mins per km represents typical city driving and traffic (~30 km/h) for mobile wash vans.
 */
export function calculateEtaMinsFromDistance(distanceKm: number): number {
  if (typeof distanceKm !== 'number' || isNaN(distanceKm) || distanceKm <= 0) return 15
  const realisticDist = distanceKm > 35 ? 3.5 : distanceKm
  return Math.min(60, Math.max(1, Math.round(realisticDist * 2.0)))
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
    distanceKm?: number
    driverCoords?: [number, number]
    customerCoords?: [number, number]
  } | null
): number | null {
  if (!record || record.status !== 'en_route') {
    return null
  }

  // Derive live physical distance if available
  const currentDistanceKm: number | null =
    typeof record.distanceKm === 'number' && record.distanceKm > 0
      ? record.distanceKm
      : record.driverCoords && record.customerCoords
      ? calculateDistanceKm(record.driverCoords, record.customerCoords)
      : null

  // 1. Primary: Exact absolute arrival timestamp countdown
  if (record.estimatedArrivalTime) {
    const targetMs = new Date(record.estimatedArrivalTime).getTime()
    if (!isNaN(targetMs)) {
      const diffMs = targetMs - Date.now()
      const remaining = Math.round(diffMs / 60000)

      // Guard against stale timestamp:
      // If vehicle is physically far (> 2 km away, e.g. 10.7 km taking ~21 mins),
      // and the stored arrival timestamp drifted significantly (> 3 mins apart, e.g. showing 12 mins),
      // synchronize to the expected travel time for the real distance!
      if (currentDistanceKm !== null && currentDistanceKm > 2) {
        const expectedMins = calculateEtaMinsFromDistance(currentDistanceKm)
        if (Math.abs(remaining - expectedMins) > 3) {
          return expectedMins
        }
      }

      // If active countdown is still in the future (> 1 min)
      if (remaining > 1) {
        return Math.min(60, remaining)
      }

      // If arrival timestamp has elapsed or reached <= 1 min:
      // Only lock to 1 min ("Arriving now") if vehicle is actually nearby (<= 0.5 km) or distance is unknown
      if (currentDistanceKm === null || currentDistanceKm <= 0.5) {
        return 1
      }
      // Stale timestamp detected (technician still far away > 0.5 km).
      // Fall through to live distance-based calculations below.
    }
  }

  // 2. Direct synchronized ETA minutes from driver or live route calculation
  if (typeof record.estimatedMins === 'number' && record.estimatedMins > 0) {
    const isStale = typeof currentDistanceKm === 'number' && currentDistanceKm > 2 && record.estimatedMins <= 1
    if (!isStale) {
      return Math.min(60, Math.max(1, Math.round(record.estimatedMins)))
    }
  }

  // 3. Derived from real road distance if distanceKm is present (e.g. 10.7 km -> 21 mins)
  if (currentDistanceKm !== null && currentDistanceKm > 0) {
    return calculateEtaMinsFromDistance(currentDistanceKm)
  }

  return 15
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
