import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  ChevronLeft,
  Navigation,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  MapPin,
  Car,
  ExternalLink,
  Send,
  X,
  Check,
  Truck,
  Loader2,
  Package,
} from 'lucide-react'
import { BookingRecord, BookingStatus, DriverProfile, PaymentCollectionData } from '@/types'
import { computeEstimatedArrivalTime } from '@/services/dispatchService'
import { Map, MapMarker, MapRoute, MapControls, type MapRef } from '@/components/ui/map'
import { Dialog } from '@/components/ui/dialog'
import { CodPaymentModal } from '@/components/CodPaymentModal'

// Haversine formula to compute distance in km
function calculateDistanceKm(coord1: [number, number], coord2: [number, number]): number {
  const [lon1, lat1] = coord1
  const [lon2, lat2] = coord2
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

// Generate smooth curved road fallback polyline between driver and customer
function generateCurvedRoute(start: [number, number], end: [number, number]): [number, number][] {
  const points: [number, number][] = []
  const steps = 6
  const midLon = (start[0] + end[0]) / 2 + (end[1] - start[1]) * 0.12
  const midLat = (start[1] + end[1]) / 2 + (start[0] - end[0]) * 0.12

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const lon = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * midLon + t * t * end[0]
    const lat = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * midLat + t * t * end[1]
    points.push([parseFloat(lon.toFixed(5)), parseFloat(lat.toFixed(5))])
  }
  return points
}

export interface DriverMapViewProps {
  booking: BookingRecord
  onBack: () => void
  onUpdateStatus: (
    bookingId: string,
    newStatus: BookingStatus,
    coords?: [number, number],
    paymentData?: PaymentCollectionData,
    trackingData?: {
      estimatedMins?: number
      estimatedArrivalTime?: string
      distanceKm?: number
    }
  ) => void
  driverProfile?: DriverProfile
}

export const DriverMapView: React.FC<DriverMapViewProps> = ({
  booking,
  onBack,
  onUpdateStatus,
  driverProfile,
}) => {
  const mapRef = useRef<MapRef>(null)
  const [isCodModalOpen, setIsCodModalOpen] = useState(false)

  // 1. Dynamic Driver Details (No static fallback strings)
  const driverName =
    booking.driverName ||
    booking.technicianName ||
    driverProfile?.name ||
    'Assigned Driver'

  const driverPhone =
    booking.driverPhone ||
    driverProfile?.phone ||
    ''

  const driverVanNumber =
    booking.driverVanNumber ||
    booking.driverVehicle ||
    driverProfile?.vanModel ||
    driverProfile?.licensePlate ||
    'Mobile Detailing Van'

  const driverAvatar =
    booking.driverAvatar && !booking.driverAvatar.includes('unsplash.com')
      ? booking.driverAvatar
      : driverProfile?.avatar && !driverProfile.avatar.includes('unsplash.com')
        ? driverProfile.avatar
        : ''

  // 2. Dynamic Customer Coordinates (Resolved purely from booking record or dynamic Nominatim geocoder)
  const [customerCoords, setCustomerCoords] = useState<[number, number] | null>(() => {
    return booking.customerCoords || null
  })
  const [isGeocoding, setIsGeocoding] = useState<boolean>(!booking.customerCoords)

  // Direct Nominatim geocoder without any pre-configured city anchors
  useEffect(() => {
    if (booking.customerCoords) {
      setCustomerCoords(booking.customerCoords)
      setIsGeocoding(false)
      return
    }

    if (!booking.address) {
      setIsGeocoding(false)
      return
    }

    let active = true
    setIsGeocoding(true)

    const fetchGeocode = async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          booking.address
        )}&limit=1`
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
        const data = await res.json()
        if (active && data && data.length > 0) {
          const lat = parseFloat(data[0].lat)
          const lon = parseFloat(data[0].lon)
          if (!isNaN(lat) && !isNaN(lon)) {
            const resolvedCoords: [number, number] = [lon, lat]
            setCustomerCoords(resolvedCoords)

            // Fly map to show customer destination if available
            if (mapRef.current && !isExploreModeRef.current) {
              mapRef.current.flyTo({ center: resolvedCoords, zoom: 14, duration: 1000 })
            }
          }
        }
      } catch (err) {
        console.warn('Nominatim geocoding notice:', err)
      } finally {
        if (active) setIsGeocoding(false)
      }
    }

    fetchGeocode()
    return () => {
      active = false
    }
  }, [booking.address, booking.customerCoords])

  // 3. Dynamic Driver Position
  const [driverPos, setDriverPos] = useState<[number, number]>(() => {
    if (booking.driverCoords) return booking.driverCoords
    return [0, 0]
  })
  const [hasDriverLocation, setHasDriverLocation] = useState<boolean>(() => {
    return Boolean(
      booking.driverCoords &&
      (booking.driverCoords[0] !== 0 || booking.driverCoords[1] !== 0)
    )
  })

  // GPS Tracking State
  const [isGpsActive, setIsGpsActive] = useState(false)
  const [lastGpsSyncTime, setLastGpsSyncTime] = useState<Date | null>(null)
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null)

  // Dynamic Navigation & Route State
  const [routeWaypoints, setRouteWaypoints] = useState<[number, number][]>([])
  const [distanceKm, setDistanceKm] = useState<number>(() => {
    return booking.distanceKm || 0
  })
  const [etaMins, setEtaMins] = useState<number>(() => {
    return booking.estimatedMins || 0
  })

  // Explore & Interaction state
  const [isExploreMode, setIsExploreMode] = useState(false)
  const isExploreModeRef = useRef(false)
  useEffect(() => {
    isExploreModeRef.current = isExploreMode
  }, [isExploreMode])

  // Modals & Wash Stopwatch
  const [showSmsModal, setShowSmsModal] = useState(false)
  const [washTimerSeconds, setWashTimerSeconds] = useState(0)
  const [isSimulating, setIsSimulating] = useState(false)
  const [simStepIndex, setSimStepIndex] = useState(0)

  // Current booking status
  const currentStatus = booking.status

  // Keep onUpdateStatus in a ref to avoid re-triggering GPS effect on parent re-renders
  const onUpdateStatusRef = useRef(onUpdateStatus)
  useEffect(() => {
    onUpdateStatusRef.current = onUpdateStatus
  })
  const lastBroadcastCoordsRef = useRef<[number, number] | null>(null)

  // =========================================================================
  // 4. CONTINUOUS LIVE DEVICE GPS LOCATION FETCH (EVERY 3 SECONDS)
  // =========================================================================
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsErrorMsg('Device does not support GPS')
      return
    }

    let isMounted = true

    const fetchLiveGpsLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!isMounted) return
          const newCoords: [number, number] = [pos.coords.longitude, pos.coords.latitude]
          setDriverPos(newCoords)
          setHasDriverLocation(true)
          setIsGpsActive(true)
          setGpsErrorMsg(null)
          setLastGpsSyncTime(new Date())

          // Broadcast real-time location to parent and Firestore only if moved > 10m to avoid update loops
          const lastCoords = lastBroadcastCoordsRef.current
          const movedEnough = !lastCoords || calculateDistanceKm(lastCoords, newCoords) > 0.01
          if (movedEnough) {
            lastBroadcastCoordsRef.current = newCoords
            const tracking = currentStatus === 'en_route' ? {
              estimatedMins: etaMins || undefined,
              estimatedArrivalTime: etaMins ? computeEstimatedArrivalTime(etaMins) : undefined,
              distanceKm: distanceKm || undefined,
            } : undefined
            onUpdateStatusRef.current?.(booking.id, currentStatus, newCoords, undefined, tracking)
          }

          // Smoothly pan camera if driver is not manually exploring
          if (!isExploreModeRef.current && mapRef.current) {
            mapRef.current.flyTo({
              center: newCoords,
              zoom: 15,
              duration: 900,
            })
          }
        },
        (err) => {
          if (!isMounted) return
          console.warn('Live device GPS update warning:', err.message)
          if (err.code === 1) {
            setGpsErrorMsg('GPS permission denied')
            setIsGpsActive(false)
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 2500,
          timeout: 2800,
        }
      )
    }

    // Immediate first fetch on mount
    fetchLiveGpsLocation()

    // Regular interval: 3 seconds (3000ms)
    const intervalId = setInterval(fetchLiveGpsLocation, 3000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [booking.id, currentStatus])

  // Trigger map resize on mount and window resize
  useEffect(() => {
    const handleResize = () => {
      mapRef.current?.resize()
    }
    window.addEventListener('resize', handleResize)
    const timer = setTimeout(() => {
      mapRef.current?.resize()
    }, 250)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timer)
    }
  }, [])

  // Throttling & In-flight tracking for route fetching to prevent network flooding
  const lastFetchedPosRef = useRef<[number, number] | null>(null)
  const lastFetchTimeRef = useRef<number>(0)
  const isFetchingRouteRef = useRef<boolean>(false)
  const activeAbortControllerRef = useRef<AbortController | null>(null)

  // =========================================================================
  // 5. DYNAMIC ROUTE & DYNAMIC ETA CALCULATION (OSRM + Real Road Network)
  // =========================================================================
  useEffect(() => {
    if (!customerCoords || !hasDriverLocation) return

    let isSubscribed = true

    const [dLon, dLat] = driverPos
    const [cLon, cLat] = customerCoords

    // If at same spot or already finished
    if (Math.abs(dLon - cLon) < 0.0002 && Math.abs(dLat - cLat) < 0.0002) {
      setRouteWaypoints([driverPos, customerCoords])
      setDistanceKm(0)
      setEtaMins(0)
      return
    }

    // Always update live distance & ETA calculation based on real distance mathematically
    const currentDist = calculateDistanceKm(driverPos, customerCoords)
    const realisticDist = currentDist > 35 ? 3.2 : currentDist
    const liveCalculatedMins =
      currentStatus === 'in_progress' || currentStatus === 'completed'
        ? 0
        : Math.min(30, Math.max(1, Math.round(realisticDist * 2.2)))

    setDistanceKm(parseFloat(realisticDist.toFixed(1)))
    setEtaMins(liveCalculatedMins)

    // Throttling check:
    // If we already have routeWaypoints and driver hasn't moved > 40 meters, or last fetch < 15s ago:
    const now = Date.now()
    if (lastFetchedPosRef.current && routeWaypoints.length > 1) {
      const movedKm = calculateDistanceKm(lastFetchedPosRef.current, driverPos)
      if (movedKm < 0.04 || now - lastFetchTimeRef.current < 15000) {
        return
      }
    }

    // If an OSRM request is already running, don't overlap
    if (isFetchingRouteRef.current) return

    // Cancel any previous in-flight request
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort()
    }
    const controller = new AbortController()
    activeAbortControllerRef.current = controller

    const fetchRealRoute = async () => {
      isFetchingRouteRef.current = true
      lastFetchTimeRef.current = Date.now()
      lastFetchedPosRef.current = driverPos

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${dLon},${dLat};${cLon},${cLat}?overview=full&geometries=geojson`
        const res = await fetch(url, { signal: controller.signal })
        const data = await res.json()

        if (isSubscribed && data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0]
          if (route.geometry?.coordinates?.length >= 2) {
            setRouteWaypoints(route.geometry.coordinates)
          }

          if (typeof route.distance === 'number') {
            const dist = parseFloat((route.distance / 1000).toFixed(1))
            setDistanceKm(dist)

                        if (currentStatus === 'in_progress' || currentStatus === 'completed') {
              setEtaMins(0)
            } else {
              const mins = Math.min(30, Math.max(1, Math.round(route.duration / 60)))
              setEtaMins(mins)

              // Synchronize calculated ETA and distance with Firestore
              if (currentStatus === 'en_route') {
                const arrivalTime = computeEstimatedArrivalTime(mins)
                onUpdateStatusRef.current?.(booking.id, 'en_route', driverPos, undefined, {
                  estimatedMins: mins,
                  estimatedArrivalTime: arrivalTime,
                  distanceKm: dist,
                })
              }
            }
            return
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          // If fetch fails (rate limit/offline), use smooth curved fallback without spamming console
          if (isSubscribed && routeWaypoints.length === 0) {
            setRouteWaypoints(generateCurvedRoute(driverPos, customerCoords))
          }
        }
      } finally {
        isFetchingRouteRef.current = false
      }

      // Initial Fallback if no waypoints exist yet
      if (isSubscribed && routeWaypoints.length === 0) {
        setRouteWaypoints(generateCurvedRoute(driverPos, customerCoords))
      }
    }

    fetchRealRoute()
    return () => {
      isSubscribed = false
      controller.abort()
    }
  }, [driverPos, customerCoords, currentStatus, hasDriverLocation, routeWaypoints.length])

  // Elapsed wash service stopwatch when in_progress
  useEffect(() => {
    let washInterval: any = null
    if (currentStatus === 'in_progress') {
      washInterval = setInterval(() => {
        setWashTimerSeconds((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(washInterval)
  }, [currentStatus])

  // Optional simulation movement for testing
  useEffect(() => {
    let timer: any = null
    if (isSimulating && routeWaypoints.length > 1) {
      timer = setInterval(() => {
        setSimStepIndex((prev) => {
          if (prev >= routeWaypoints.length - 1) {
            setIsSimulating(false)
            onUpdateStatus(booking.id, 'in_progress', customerCoords || driverPos)
            return prev
          }
          const nextIndex = prev + 1
          const nextPos = routeWaypoints[nextIndex]
          setDriverPos(nextPos)
          const remainingFraction = 1 - nextIndex / (routeWaypoints.length - 1)
          const newEta = Math.max(1, Math.round(etaMins * remainingFraction))
          const newDist = parseFloat((distanceKm * remainingFraction).toFixed(1))
          setEtaMins(newEta)
          setDistanceKm(newDist)
          onUpdateStatus(booking.id, 'en_route', nextPos, undefined, {
            estimatedMins: newEta,
            estimatedArrivalTime: computeEstimatedArrivalTime(newEta),
            distanceKm: newDist,
          })

          if (!isExploreModeRef.current) {
            mapRef.current?.flyTo({
              center: nextPos,
              zoom: 15,
              duration: 1000,
            })
          }
          return nextIndex
        })
      }, 2500)
    }
    return () => clearInterval(timer)
  }, [isSimulating, routeWaypoints, booking.id, onUpdateStatus, customerCoords, driverPos])

    const handleStepStatus = (newStatus: BookingStatus, paymentData?: PaymentCollectionData) => {
    const tracking = newStatus === 'en_route' ? {
      estimatedMins: etaMins || (distanceKm ? Math.round(distanceKm * 1.12) : 15),
      estimatedArrivalTime: computeEstimatedArrivalTime(etaMins || (distanceKm ? Math.round(distanceKm * 1.12) : 15)),
      distanceKm: distanceKm || undefined,
    } : undefined
    onUpdateStatus(booking.id, newStatus, driverPos, paymentData, tracking)
  }

  // Manual GPS trigger
  const handleUseLiveGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude]
          setDriverPos(coords)
          setHasDriverLocation(true)
          setIsGpsActive(true)
          setGpsErrorMsg(null)
          setLastGpsSyncTime(new Date())
          onUpdateStatus(booking.id, currentStatus, coords)
          setIsExploreMode(false)
          mapRef.current?.flyTo({ center: coords, zoom: 16, duration: 900 })
        },
        (err) => {
          console.warn('Geolocation access failed:', err.message)
          setGpsErrorMsg('GPS access failed')
        },
        { enableHighAccuracy: true }
      )
    }
  }

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const openGoogleMapsDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      booking.address
    )}`
    window.open(url, '_blank')
  }

  // Google Maps-grade smooth re-center and auto-follow resumption
  const handleRecenterToDriver = useCallback(() => {
    setIsExploreMode(false)
    const target =
      hasDriverLocation && (driverPos[0] !== 0 || driverPos[1] !== 0)
        ? driverPos
        : customerCoords || [77.209, 28.6139]

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: target,
        zoom: 15.5,
        bearing: 0,
        pitch: 35,
        duration: 800,
        essential: true,
      })
    }
  }, [hasDriverLocation, driverPos, customerCoords])

  // Dynamic Turn-by-Turn Instruction Text
  const nextInstructionText = useMemo(() => {
    if (isGeocoding && !customerCoords) {
      return `Locating customer address via satellite geocoder...`
    }
    if (currentStatus === 'accepted') {
      return `Ready to depart for ${booking.customerName} (${booking.address.split(',')[0] || 'destination'})`
    }
    if (currentStatus === 'en_route') {
      if (distanceKm <= 0.05 && distanceKm > 0) {
        return `You have arrived outside ${booking.address.split(',')[0] || 'destination'}!`
      }
      return `En route to ${booking.address.split(',')[0] || 'destination'}`
    }
    if (currentStatus === 'in_progress') {
      return `Wash active at ${booking.address.split(',')[0] || 'customer location'}`
    }
    return `Service completed for ${booking.customerName}`
  }, [currentStatus, booking.customerName, booking.address, distanceKm, isGeocoding, customerCoords])

  // Dynamic SMS Templates
  const smsTemplates = useMemo(
    () => [
      `Hi ${booking.customerName}, this is ${driverName} from Bentley Mobile Car Wash. I'm on my way to your location! approximate: ~${etaMins} mins (${distanceKm} km away).`,
      `Hi ${booking.customerName}, I have arrived outside ${booking.address.split(',')[0] || 'your address'} with the mobile detailing van and am ready to start washing your ${booking.vehicle}.`,
      `Hi ${booking.customerName}, your ${booking.title} wash & detailing is successfully completed! Please let me know if you would like to inspect. Thank you!`,
    ],
    [booking.customerName, booking.address, booking.vehicle, booking.title, driverName, etaMins, distanceKm]
  )

  // Render Action Button
  const renderActionButton = (isFullWidth = true) => {
    return (
      <div className={`flex items-center gap-2 ${isFullWidth ? 'w-full' : ''}`}>
        {currentStatus === 'accepted' && (
          <button
            type="button"
            onClick={() => handleStepStatus('en_route')}
            className="w-full py-3.5 px-4 rounded-2xl bg-primary hover:bg-primary-hover active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Navigation className="w-4 h-4 fill-white" />
            <span>Start Driving (Mark En Route)</span>
          </button>
        )}

        {currentStatus === 'en_route' && (
          <button
            type="button"
            onClick={() => handleStepStatus('in_progress')}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>I Have Arrived • Start Wash</span>
          </button>
        )}

        {currentStatus === 'in_progress' && (
          <button
            type="button"
            onClick={() => {
              const isCodPending =
                booking.paymentStatus !== 'paid' ||
                Boolean(booking.paymentMethod?.toLowerCase().includes('completion'))
              if (isCodPending) {
                setIsCodModalOpen(true)
              } else {
                handleStepStatus('completed')
                onBack()
              }
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-secondary hover:bg-black active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Finish Wash & Complete Order</span>
          </button>
        )}

        {currentStatus === 'completed' && (
          <div className="w-full py-3 px-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Service Successfully Completed</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-canvas flex flex-col w-full h-full overflow-hidden animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* 1. TOP GLOBAL NAVIGATION HUD HEADER                     */}
      {/* ======================================================== */}
      <header className="bg-secondary text-secondary-foreground px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between z-30 shrink-0 shadow-md">
        {/* Left: Back button & Order Header */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
            title="Return to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-white leading-tight truncate">
              {booking.customerName || 'Customer'}
            </h2>
          </div>
        </div>

        {/* Right: Live GPS Connection Status Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live GPS</span>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN BODY CONTENT (Split: Map + Bottom/Sidebar)        */}
      {/* ======================================================== */}
      <div className="flex-1 w-full flex flex-col lg:flex-row overflow-hidden relative">
        {/* MOBILE & TABLET INSTRUCTION BANNER (< lg) */}
        <div className="lg:hidden bg-primary-light border-b border-primary-border/40 px-3.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
              <Navigation className="w-3.5 h-3.5 fill-white" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-gray-900 truncate">
                {nextInstructionText}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">
                {isGeocoding && !customerCoords ? (
                  <span className="text-amber-600 flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    Geocoding address...
                  </span>
                ) : (
                  `Estimated Arrival: ~${etaMins} mins`
                )}
              </span>
            </div>
          </div>

          <div className="text-[11px] font-bold font-mono text-primary shrink-0 bg-white/80 border border-primary-border/60 px-2.5 py-0.5 rounded-md">
            {isGeocoding && !customerCoords ? '...' : `${distanceKm} km`}
          </div>
        </div>

        {/* MOBILE & TABLET STEP PROGRESS (< lg) */}
        <div className="lg:hidden bg-white border-b border-gray-100 px-3 sm:px-4 py-2 flex items-center justify-between text-[10px] sm:text-[11px] font-bold z-10 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 text-gray-900 shrink-0">
            <span
              className={`w-2 h-2 rounded-full ${currentStatus === 'accepted' ? 'bg-primary' : 'bg-emerald-500'
                }`}
            />
            <span>1. Accepted</span>
          </div>
          <span className="text-gray-300 mx-1">→</span>
          <div
            className={`flex items-center gap-1 shrink-0 ${currentStatus === 'en_route'
              ? 'text-primary'
              : currentStatus === 'in_progress' || currentStatus === 'completed'
                ? 'text-emerald-600'
                : 'text-gray-400'
              }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${currentStatus === 'en_route'
                ? 'bg-primary animate-ping'
                : currentStatus === 'in_progress' || currentStatus === 'completed'
                  ? 'bg-emerald-500'
                  : 'bg-gray-300'
                }`}
            />
            <span>2. En Route</span>
          </div>
          <span className="text-gray-300 mx-1">→</span>
          <div
            className={`flex items-center gap-1 shrink-0 ${currentStatus === 'in_progress'
              ? 'text-emerald-600 font-black'
              : currentStatus === 'completed'
                ? 'text-emerald-600'
                : 'text-gray-400'
              }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${currentStatus === 'in_progress'
                ? 'bg-emerald-500 animate-pulse'
                : currentStatus === 'completed'
                  ? 'bg-emerald-500'
                  : 'bg-gray-300'
                }`}
            />
            <span>3. Washing</span>
          </div>
          <span className="text-gray-300 mx-1">→</span>
          <div
            className={`flex items-center gap-1 shrink-0 ${currentStatus === 'completed' ? 'text-emerald-600' : 'text-gray-400'
              }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${currentStatus === 'completed' ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
            />
            <span>4. Done</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* INTERACTIVE MAP VIEWPORT (Center & Flex-1)               */}
        {/* ======================================================== */}
        <div
          className="flex-1 w-full h-full relative z-0 min-h-[260px] overflow-hidden"
          style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
        >
          {/* Desktop Turn-by-Turn HUD Floating Card (>= lg) */}
          <div className="hidden lg:flex absolute top-4 left-4 z-20 max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-3.5 items-center justify-between gap-3 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                <Navigation className="w-5 h-5 fill-white" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-gray-900 truncate">
                  {nextInstructionText}
                </span>
                <span className="text-[11px] text-gray-500 font-medium">
                  {isGeocoding && !customerCoords ? (
                    <span className="text-amber-600 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Geocoding customer location via Nominatim...
                    </span>
                  ) : (
                    `${distanceKm} km remaining • Dynamic ETA ~${etaMins} mins`
                  )}
                </span>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold px-2.5 py-1.5 rounded-xl shrink-0">
              {currentStatus === 'in_progress'
                ? 'At Site'
                : currentStatus === 'completed'
                  ? 'Done'
                  : isGeocoding && !customerCoords
                    ? '...'
                    : `${etaMins} min`}
            </div>
          </div>

          {/* Interactive Map Canvas */}
          <Map
            ref={mapRef}
            center={
              hasDriverLocation
                ? driverPos
                : customerCoords || [77.209, 28.6139]
            }
            zoom={hasDriverLocation || customerCoords ? 14 : 3}
            pitch={35}
            className="w-full h-full"
            followUser={!isExploreMode}
            onUserInteract={(interacting) => {
              if (interacting) {
                setIsExploreMode(true)
              }
            }}
          >
            <MapControls
              position="top-right"
              onRecenter={handleRecenterToDriver}
            />

            {/* Dynamic Route polyline from Driver to Customer */}
            {customerCoords && routeWaypoints.length >= 2 && (
              <MapRoute
                coordinates={routeWaypoints}
                color="#dc2626"
                width={5}
                opacity={0.88}
              />
            )}

            {/* Customer Location Destination Pin (Rendered once resolved by Nominatim) */}
            {customerCoords && (
              <MapMarker longitude={customerCoords[0]} latitude={customerCoords[1]}>
                <div className="flex flex-col items-center group pointer-events-none select-none">
                  <div className="px-2.5 py-0.5 rounded-full bg-secondary text-white text-[9px] font-bold shadow-md mb-1 whitespace-nowrap pointer-events-none border border-white/20">
                    👤 {booking.customerName} • {booking.vehicle}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-lg ring-4 ring-primary/25 animate-bounce pointer-events-auto cursor-pointer">
                    <Car className="w-5 h-5 text-white" />
                  </div>
                </div>
              </MapMarker>
            )}

            {/* Driver Live Van Pin (Dynamic driver & device position) */}
            {hasDriverLocation && (
              <MapMarker longitude={driverPos[0]} latitude={driverPos[1]}>
                <div className="flex flex-col items-center pointer-events-none select-none">
                  <div className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold shadow-md mb-1 whitespace-nowrap flex items-center gap-1.5 pointer-events-none border border-white/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span>
                      {driverName} ({driverVanNumber})
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center shadow-xl ring-4 ring-emerald-400/40 pointer-events-auto cursor-pointer">
                    <Navigation className="w-5 h-5 text-emerald-400 fill-emerald-400 rotate-45" />
                  </div>
                </div>
              </MapMarker>
            )}
          </Map>

          {/* Floating Re-Center / Resume Navigation Button (Appears during Explore Mode) */}
          {isExploreMode && (
            <button
              type="button"
              onClick={handleRecenterToDriver}
              className="absolute bottom-4 left-4 z-20 px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-lg text-xs font-bold text-gray-900 flex items-center gap-1.5 hover:bg-white active:scale-95 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2"
            >
              <Navigation className="w-3.5 h-3.5 text-primary fill-primary" />
              <span>Resume Auto-Follow</span>
            </button>
          )}
        </div>

        {/* ======================================================== */}
        {/* MOBILE DRIVER CONTROL PANEL (Bottom Sheet for < lg)     */}
        {/* ======================================================== */}
        <div className="lg:hidden bg-white border-t border-gray-200/80 p-3.5 sm:p-4 shadow-xl z-20 flex flex-col gap-2.5 sm:gap-3 shrink-0">


          {booking.shopItems && booking.shopItems.length > 0 && (
            <div className="p-2.5 rounded-xl bg-surface-subtle border border-gray-200 text-xs flex flex-col gap-1.5 shadow-2xs">
              <div className="flex items-center justify-between font-bold text-gray-900">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Package className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Hand-Deliver Shop Products ({booking.shopItems.reduce((a, c) => a + c.quantity, 0)})</span>
                </span>
                <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-extrabold uppercase">
                  With Wash
                </span>
              </div>
              <ul className="text-gray-700 text-[11px] space-y-0.5 pt-1 border-t border-gray-100">
                {booking.shopItems.map((item, idx) => (
                  <li key={idx} className="flex justify-between items-center">
                    <span>• {item.product.title} <strong className="text-gray-900">×{item.quantity}</strong></span>
                    <span className="font-mono text-gray-600 font-semibold">${(item.product.priceNumeric * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Customer & Quick Contact Row */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-primary-light border border-primary-border/60 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {booking.customerName.charAt(0)}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-gray-900 truncate">
                  {booking.customerName}
                </span>
                <span className="text-[11px] text-gray-500 font-medium truncate">
                  {booking.vehicle}{' '}
                  {booking.licensePlate ? `(${booking.licensePlate})` : ''}
                </span>
                <span className="text-[10px] text-primary font-semibold truncate max-w-[200px] sm:max-w-xs">
                  {booking.address}
                </span>
              </div>
            </div>

            {/* Contact Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={openGoogleMapsDirections}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center border border-gray-200 transition-colors shadow-2xs"
                title="Google Maps"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <a
                href={`tel:${booking.customerPhone}`}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200 transition-colors shadow-2xs"
                title="Call Customer"
              >
                <Phone className="w-4 h-4 fill-emerald-600" />
              </a>
              <button
                type="button"
                onClick={() => setShowSmsModal(true)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200 transition-colors shadow-2xs"
                title="Quick SMS"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Package, Dynamic ETA & Live Timer */}
          <div className="flex items-center justify-between text-xs bg-surface-subtle p-2 sm:p-2.5 rounded-xl border border-gray-100">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Package</span>
              <span className="font-bold text-gray-900 text-xs truncate max-w-[130px] sm:max-w-xs">
                {booking.title}
              </span>
            </div>

            {currentStatus === 'in_progress' ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span className="font-mono font-bold text-xs">
                  {formatTimer(washTimerSeconds)}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Est. Arrival</span>
                <span className="font-bold text-emerald-700 font-mono text-xs">
                  {isGeocoding && !customerCoords ? '...' : `~${etaMins} mins`}
                </span>
              </div>
            )}

            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Total Fee</span>
              <span className="font-extrabold text-primary font-mono text-xs sm:text-sm">
                {booking.price}
              </span>
            </div>
          </div>

          {/* Status Action Button */}
          {renderActionButton(true)}
        </div>

        {/* ======================================================== */}
        {/* DESKTOP DISPATCH SIDEBAR (>= lg)                          */}
        {/* ======================================================== */}
        <aside className="hidden lg:flex w-96 xl:w-[420px] 2xl:w-[450px] bg-white border-l border-gray-200/80 shadow-2xl flex-col justify-between overflow-y-auto p-5 xl:p-6 z-20 shrink-0">
          <div className="flex flex-col gap-4">
            {/* Sidebar Title & Order ID */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
                  Dispatch Route
                </h3>
                <span className="text-xs text-gray-500">Order ID: #{booking.id}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-700 capitalize">
                  {currentStatus.replace('_', ' ')}
                </span>
              </div>
            </div>



            {/* Service Progression Pipeline */}
            <div className="flex flex-col gap-2 bg-surface-subtle p-3 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Service Progression
              </span>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${currentStatus === 'accepted'
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                >
                  <span className="text-[10px] font-bold">1. Accept</span>
                  {currentStatus !== 'accepted' && <Check className="w-3 h-3 text-emerald-600" />}
                </div>

                <div
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${currentStatus === 'en_route'
                    ? 'bg-primary text-white border-primary shadow-xs animate-pulse'
                    : currentStatus === 'in_progress' || currentStatus === 'completed'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-white border-gray-200 text-gray-400'
                    }`}
                >
                  <span className="text-[10px] font-bold">2. En Route</span>
                  {(currentStatus === 'in_progress' || currentStatus === 'completed') && (
                    <Check className="w-3 h-3 text-emerald-600" />
                  )}
                </div>

                <div
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${currentStatus === 'in_progress'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : currentStatus === 'completed'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-white border-gray-200 text-gray-400'
                    }`}
                >
                  <span className="text-[10px] font-bold">3. Wash</span>
                  {currentStatus === 'completed' && <Check className="w-3 h-3 text-emerald-600" />}
                </div>

                <div
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${currentStatus === 'completed'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-400'
                    }`}
                >
                  <span className="text-[10px] font-bold">4. Done</span>
                  {currentStatus === 'completed' && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
            </div>

            {/* Dynamic Driver Information Card */}
            <div className="p-3.5 bg-white rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                {driverAvatar ? (
                  <img
                    src={driverAvatar}
                    alt={driverName}
                    className="w-11 h-11 rounded-full object-cover border border-emerald-200 shadow-xs"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {driverName.charAt(0)}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                    <span>{driverName}</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200">
                      Assigned Driver
                    </span>
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {driverVanNumber}
                  </span>
                  {driverPhone && (
                    <span className="text-[10px] text-gray-400 font-mono">
                      {driverPhone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Customer Information Card */}
            <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-xs flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary-light border border-primary-border/60 flex items-center justify-center text-primary font-bold text-base shrink-0">
                    {booking.customerName.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">{booking.customerName}</span>
                    <span className="text-xs text-gray-500 font-medium">
                      {booking.vehicle}{' '}
                      {booking.licensePlate ? `• Plate: ${booking.licensePlate}` : ''}
                    </span>
                  </div>
                </div>

                <span className="text-base font-extrabold text-primary font-mono">
                  {booking.price}
                </span>
              </div>

              <div className="flex items-start gap-2 text-xs text-gray-600 bg-surface-subtle p-2.5 rounded-xl border border-gray-100">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-medium leading-relaxed">{booking.address}</span>
                  {isGeocoding && !customerCoords ? (
                    <span className="text-[10px] text-amber-600 flex items-center gap-1 mt-0.5">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      Geocoding exact destination via Nominatim...
                    </span>
                  ) : customerCoords ? (
                    <span className="text-[10px] text-emerald-600 font-mono mt-0.5">
                      ✓ Resolved: {customerCoords[1].toFixed(4)}°N, {customerCoords[0].toFixed(4)}°E
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <a
                  href={`tel:${booking.customerPhone}`}
                  className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 fill-emerald-600" />
                  <span>Call</span>
                </a>

                <button
                  type="button"
                  onClick={() => setShowSmsModal(true)}
                  className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>SMS</span>
                </button>

                <button
                  type="button"
                  onClick={openGoogleMapsDirections}
                  className="py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Maps</span>
                </button>
              </div>
            </div>

            {/* Dynamic Package & Booking Details Card */}
            <div className="p-4 bg-surface-subtle rounded-2xl border border-gray-100 flex flex-col gap-2.5 text-xs">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Booking Information
              </span>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Service:</span>
                <span className="font-bold text-gray-900">{booking.title}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Scheduled:</span>
                <span className="font-bold text-gray-900">
                  {booking.date} at {booking.time}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Payment:</span>
                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                  <span>{booking.paymentMethod || 'Cash on Delivery (COD)'}</span>
                  {booking.paymentStatus === 'paid' ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      PAID
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800">
                      PENDING
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Service Type:</span>
                <span className="font-bold text-gray-900">
                  {booking.locationType === 'mobile'
                    ? 'Mobile Detailing (Doorstep)'
                    : 'In-Shop Service'}
                </span>
              </div>



              {booking.shopItems && booking.shopItems.length > 0 && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between text-amber-950 font-bold mb-1">
                    <span className="text-[10px] uppercase flex items-center gap-1 text-amber-700">
                      <Package className="w-3 h-3" />
                      <span>Hand-Deliver Shop Items ({booking.shopItems.reduce((a, c) => a + (c.quantity || 1), 0)}):</span>
                    </span>
                    <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-extrabold uppercase">
                      With Wash
                    </span>
                  </div>
                  <ul className="text-[11px] text-gray-700 space-y-0.5">
                    {booking.shopItems.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center bg-amber-50/60 px-2 py-0.5 rounded">
                        <span>• {item.product.title} <strong className="text-amber-900">×{item.quantity}</strong></span>
                        <span className="font-mono text-gray-500">${((item.product.priceNumeric || 0) * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Desktop Live Stopwatch (When in_progress) */}
            {currentStatus === 'in_progress' && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600 animate-spin" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-emerald-900">
                      Wash In Progress
                    </span>
                    <span className="text-[10px] text-emerald-700">
                      Tracking active service duration
                    </span>
                  </div>
                </div>
                <span className="text-lg font-mono font-black text-emerald-800">
                  {formatTimer(washTimerSeconds)}
                </span>
              </div>
            )}
          </div>

          {/* Desktop Sidebar Bottom Action Button */}
          <div className="pt-4 mt-3 border-t border-gray-100 flex flex-col gap-2">
            {renderActionButton(true)}
            <button
              type="button"
              onClick={onBack}
              className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-98 text-gray-700 text-xs font-bold transition-all text-center cursor-pointer"
            >
              Exit to Dashboard
            </button>
          </div>
        </aside>
      </div>

      {/* ======================================================== */}
      {/* 3. QUICK SMS TEMPLATES MODAL                            */}
      {/* ======================================================== */}
      <Dialog
        isOpen={showSmsModal}
        onClose={() => setShowSmsModal(false)}
        zIndex="z-60"
        maxWidth="md"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-bold text-gray-900">Send Quick SMS</h4>
          </div>
          <button
            type="button"
            onClick={() => setShowSmsModal(false)}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2.5">
          Select a dynamic update template to text {booking.customerName} ({booking.customerPhone}):
        </p>

        <div className="mt-3.5 flex flex-col gap-2">
          {smsTemplates.map((tmpl, idx) => (
            <a
              key={idx}
              href={`sms:${booking.customerPhone}?body=${encodeURIComponent(tmpl)}`}
              onClick={() => setShowSmsModal(false)}
              className="p-3 sm:p-3.5 rounded-2xl border border-gray-200 hover:border-primary/60 hover:bg-primary-light/30 text-xs text-gray-800 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-98"
            >
              <span className="line-clamp-2 leading-relaxed">{tmpl}</span>
              <Send className="w-4 h-4 text-primary shrink-0" />
            </a>
          ))}
        </div>
      </Dialog>

      {/* COD Payment Confirmation Modal */}
      <CodPaymentModal
        isOpen={isCodModalOpen}
        onClose={() => setIsCodModalOpen(false)}
        booking={booking}
        driverName={driverName}
        onConfirmPayment={(paymentData) => {
          handleStepStatus('completed', paymentData)
          onBack()
        }}
      />
    </div>
  )
}

export default DriverMapView
