// Unified Geolocation & Reverse Geocoding Service
// Ensures 100% consistency between HomeTab and BookingPage

export interface GeoLocationResult {
  fullAddress: string
  street: string
  city: string
  state: string
  postalCode: string
  displayName: string
  coords: {
    latitude: number
    longitude: number
  }
}

/**
 * Reverse geocodes latitude & longitude into a consistent address structure
 */
export async function reverseGeocodeCoords(
  latitude: number,
  longitude: number
): Promise<GeoLocationResult> {
  let addr: Record<string, string> = {}
  let displayName = ''

  // 1. Try OpenStreetMap Nominatim reverse geocode (with 6.5s timeout)
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6500)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'en' },
        signal: controller.signal,
      }
    )
    clearTimeout(timeoutId)
    if (res.ok) {
      const data = await res.json()
      addr = data.address || {}
      displayName = data.display_name || ''
    }
  } catch {
    // Proceed to fallback
  }

  // 2. Fallback to BigDataCloud if Nominatim address details were incomplete
  if (!addr.city && !addr.town && !addr.suburb && !addr.postcode) {
    try {
      const fallbackRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      )
      if (fallbackRes.ok) {
        const bdc = await fallbackRes.json()
        addr.city = addr.city || bdc.city || bdc.locality || ''
        addr.state = addr.state || bdc.principalSubdivision || ''
        addr.postcode = addr.postcode || bdc.postcode || ''
        if (bdc.locality && bdc.locality !== addr.city) {
          addr.suburb = bdc.locality
        }
      }
    } catch {
      // Ignore fallback error
    }
  }

  const streetPart = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || ''
  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.county ||
    addr.state_district ||
    ''
  const state = addr.state || addr.province || addr.country || ''
  const postalCode = addr.postcode || addr.postal_code || ''

  // Standardized formatted address consistent with HomeTab
  const formatted = [streetPart, city, state].filter(Boolean).join(', ')
  let resolvedAddress = ''
  if (formatted) {
    resolvedAddress = formatted
  } else if (displayName) {
    resolvedAddress = displayName.split(',').slice(0, 3).map((s) => s.trim()).join(', ')
  } else {
    resolvedAddress = `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`
  }

  return {
    fullAddress: resolvedAddress,
    street: resolvedAddress,
    city: city,
    state: state,
    postalCode: postalCode,
    displayName: displayName,
    coords: { latitude, longitude },
  }
}

/**
 * Fetches live GPS coordinates and reverses to uniform address details
 */
export async function getLiveGPSLocation(): Promise<GeoLocationResult> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const result = await reverseGeocodeCoords(latitude, longitude)
          resolve(result)
        } catch (err) {
          reject(err)
        }
      },
      (err) => {
        let msg = 'Unable to fetch your location'
        if (err.code === 1) {
          msg = 'Location permission denied. Please allow GPS access.'
        } else if (err.code === 2) {
          msg = 'Location unavailable. Please check your GPS/network.'
        } else if (err.code === 3) {
          msg = 'Location request timed out. Please try again.'
        }
        reject(new Error(msg))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  })
}
