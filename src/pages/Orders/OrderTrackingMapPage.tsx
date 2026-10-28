import React, { useState, useEffect, useRef, useMemo } from 'react'
import { ChevronLeft, Navigation, User, Layers, Car, Calendar, Clock, Phone, Sparkles, Package } from 'lucide-react'
import { Map, MapMarker, MapRoute, MapControls, type MapRef } from '@/components/ui/map'
import { BookingStatus, BookingRecord } from '@/types'
import { Dialog } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'

const mapStyles = {
  default: undefined,
  openstreetmap: 'https://tiles.openfreemap.org/styles/bright',
  openstreetmap3d: 'https://tiles.openfreemap.org/styles/liberty',
}

type StyleKey = keyof typeof mapStyles

const mapStyleOptions = [
  { label: 'Default (Carto)', value: 'default' },
  { label: 'OpenStreetMap', value: 'openstreetmap' },
  { label: 'OpenStreetMap 3D', value: 'openstreetmap3d' },
]

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

// Generate smooth curved road fallback polyline between technician and customer
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

interface OrderTrackingMapPageProps {
  onBack: () => void
  serviceTitle?: string
  serviceCategory?: string
  customerName?: string
  customerPhone?: string
  customerAddress?: string
  technicianName?: string
  driverCoords?: [number, number]
  customerCoords?: [number, number]
  driverVanNumber?: string
  driverPhone?: string
  bookingStatus?: BookingStatus
  booking?: BookingRecord
}

export const OrderTrackingMapPage: React.FC<OrderTrackingMapPageProps> = ({
  onBack,
  serviceTitle,
  serviceCategory,
  customerName,
  customerPhone,
  customerAddress,
  technicianName,
  driverCoords,
  customerCoords,
  driverVanNumber,
  driverPhone,
  bookingStatus,
  booking,
}) => {
  // 1. Dynamic Stored Profiles & State
  const dynamicDriverProfile = useMemo(() => {
    try {
      const stored = localStorage.getItem('bentley_driver_profile')
      if (stored) return JSON.parse(stored)
    } catch {}
    return null
  }, [])

  const dynamicUserProfile = useMemo(() => {
    try {
      const stored = localStorage.getItem('bentley_user_profile')
      if (stored) return JSON.parse(stored)
    } catch {}
    return null
  }, [])

  // Dynamic Driver / Technician information (Strictly real driver - reject static placeholder 'Alex Rivera')
  const realDriverName = useMemo(() => {
    const rawName = (booking?.driverName || technicianName || booking?.technicianName || dynamicDriverProfile?.name || '').trim()
    if (rawName && rawName.toLowerCase() !== 'alex rivera') {
      return rawName
    }
    return ''
  }, [booking?.driverName, technicianName, booking?.technicianName, dynamicDriverProfile?.name])

  const hasRealDriver = Boolean(realDriverName)
  const displayTechName = hasRealDriver ? realDriverName : 'Certified Technician'

  const activeTechAvatar = useMemo(() => {
    if (booking?.driverAvatar && !booking.driverAvatar.includes('unsplash.com')) {
      return booking.driverAvatar
    }
    if (dynamicDriverProfile?.avatar && !dynamicDriverProfile.avatar.includes('unsplash.com')) {
      return dynamicDriverProfile.avatar
    }
    return ''
  }, [booking?.driverAvatar, dynamicDriverProfile?.avatar])

  const activeDriverPhone = useMemo(() => {
    const rawPhone = (booking?.driverPhone || driverPhone || dynamicDriverProfile?.phone || '').trim()
    if (rawPhone && !rawPhone.includes('555-9274')) {
      return rawPhone
    }
    return ''
  }, [booking?.driverPhone, driverPhone, dynamicDriverProfile?.phone])

  const activeVan = useMemo(() => {
    let van = (booking?.driverVanNumber || driverVanNumber || booking?.driverVehicle || '').trim()
    if (!van && dynamicDriverProfile?.vanModel) {
      van = `${dynamicDriverProfile.vanModel}${dynamicDriverProfile.licensePlate ? ` (${dynamicDriverProfile.licensePlate})` : ''}`.trim()
    }
    if (!van || van === 'BC-8492' || van.includes('BC-8492')) {
      return 'Mobile Detailing Unit'
    }
    return van
  }, [booking?.driverVanNumber, driverVanNumber, booking?.driverVehicle, dynamicDriverProfile])

  // Dynamic Customer & Service Details
  const activeTitle = booking?.title || serviceTitle || 'Car Wash Service'
  const activeCategory = booking?.category || serviceCategory || 'Detailing Tier'
  const activeCustomer =
    booking?.customerName || customerName || dynamicUserProfile?.name || 'Customer'
  const activePhone =
    booking?.customerPhone || customerPhone || dynamicUserProfile?.phone || ''
  const activeAddress =
    booking?.address || customerAddress || dynamicUserProfile?.address || 'Address on file'
  const activeStatus = booking?.status || bookingStatus || 'en_route'

  // Dynamic Customer Vehicle Details (Distinct from technician's service unit)
  const activeVehicle = booking?.vehicle || dynamicUserProfile?.preferredVehicle || ''
  const activeVehiclePlate = booking?.licensePlate || ''
  const activeVehicleType = booking?.vehicleType || ''

  // Dynamic Pricing & Payment Summary
  const activePrice = booking?.price || (booking?.totalNumeric ? `$${booking.totalNumeric.toFixed(2)}` : '')
  const activePaymentMethod = booking?.paymentMethod || (booking?.paymentStatus === 'paid' ? 'Cash Collected (Paid)' : 'Cash on Delivery')
  const activeDate = booking?.date || 'Today'
  const activeTime = booking?.time || ''

  // Only allow live tracking if an active order is in flight
  const isDriverAccepted = Boolean(
    activeStatus === 'accepted' ||
      activeStatus === 'en_route' ||
      activeStatus === 'in_progress' ||
      activeStatus === 'completed' ||
      hasRealDriver
  )

  // 2. Dynamic Customer Coordinates (Geocoded from real address)
  const initialCustomerCoords = useMemo<[number, number]>(() => {
    if (booking?.customerCoords) return booking.customerCoords
    if (customerCoords) return customerCoords
    return [77.391, 28.5355]
  }, [booking?.customerCoords, customerCoords])

  const [customerCoordsState, setCustomerCoordsState] = useState<[number, number]>(
    initialCustomerCoords
  )

  // Real-time Geocoder for accurate latitude & longitude from the address text
  useEffect(() => {
    if (booking?.customerCoords) {
      setCustomerCoordsState(booking.customerCoords)
      return
    }
    if (customerCoords) {
      setCustomerCoordsState(customerCoords)
      return
    }

    let active = true
    const fetchGeocode = async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          activeAddress
        )}&limit=1`
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
        const data = await res.json()
        if (active && data && data.length > 0) {
          const lat = parseFloat(data[0].lat)
          const lon = parseFloat(data[0].lon)
          if (!isNaN(lat) && !isNaN(lon)) {
            setCustomerCoordsState([lon, lat])
          }
        }
      } catch (err) {
        console.warn('Geocoding notice:', err)
      }
    }

    fetchGeocode()
    return () => {
      active = false
    }
  }, [activeAddress, booking?.customerCoords, customerCoords])

  // 3. Dynamic Technician Coordinates (Positioned in the same city/locality ~2km away)
  const [technicianCoordsState, setTechnicianCoordsState] = useState<[number, number]>(() => {
    if (booking?.driverCoords && calculateDistanceKm(booking.driverCoords, initialCustomerCoords) < 30) {
      return booking.driverCoords
    }
    if (driverCoords && calculateDistanceKm(driverCoords, initialCustomerCoords) < 30) {
      return driverCoords
    }
    // Place technician van ~1.8 km to 2.2 km away on a nearby road in the customer's city
    return [initialCustomerCoords[0] - 0.015, initialCustomerCoords[1] + 0.012]
  })

  // Synchronize technician position if customer address changes to a completely different region
  useEffect(() => {
    const dist = calculateDistanceKm(technicianCoordsState, customerCoordsState)
    if (dist > 30) {
      // Re-anchor technician in the same city/region
      setTechnicianCoordsState([
        customerCoordsState[0] - 0.015,
        customerCoordsState[1] + 0.012,
      ])
    }
  }, [customerCoordsState])

  // 4. Dynamic Driving Route (OSRM Real Street Network)
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>(() =>
    generateCurvedRoute(technicianCoordsState, customerCoordsState)
  )

  const [liveDistanceKm, setLiveDistanceKm] = useState<number>(() => {
    if (booking?.distanceKm) return booking.distanceKm
    return calculateDistanceKm(technicianCoordsState, customerCoordsState) || 2.4
  })

  const [liveEstimatedMins, setLiveEstimatedMins] = useState<number>(() => {
    if (booking?.estimatedMins && booking.estimatedMins > 0 && booking.estimatedMins <= 45) return booking.estimatedMins
    return Math.min(30, Math.max(3, Math.round(liveDistanceKm * 2.8))) || 8
  })

  // Fetch real-world turn-by-turn road route from OSRM
  useEffect(() => {
    let isSubscribed = true
    const controller = new AbortController()

    const fetchRealRoute = async () => {
      const [techLon, techLat] = technicianCoordsState
      const [custLon, custLat] = customerCoordsState

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${techLon},${techLat};${custLon},${custLat}?overview=full&geometries=geojson`
        const res = await fetch(url, { signal: controller.signal })
        const data = await res.json()

        if (isSubscribed && data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0]
          if (route.geometry?.coordinates?.length >= 2) {
            setRouteCoordinates(route.geometry.coordinates)
          }
          const km = parseFloat((route.distance / 1000).toFixed(1))
          const mins = Math.min(30, Math.max(1, Math.round(route.duration / 60)))
          setLiveDistanceKm(km)
          setLiveEstimatedMins(mins)
        } else if (isSubscribed) {
          // Smooth curved fallback
          setRouteCoordinates(generateCurvedRoute(technicianCoordsState, customerCoordsState))
          const dist = calculateDistanceKm(technicianCoordsState, customerCoordsState)
          const realisticDist = dist > 35 ? 3.2 : dist
          setLiveDistanceKm(parseFloat(realisticDist.toFixed(1)))
          setLiveEstimatedMins(Math.min(30, Math.max(2, Math.round(realisticDist * 2.5))))
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return
        if (isSubscribed) {
          setRouteCoordinates(generateCurvedRoute(technicianCoordsState, customerCoordsState))
        }
      }
    }

    fetchRealRoute()
    return () => {
      isSubscribed = false
      controller.abort()
    }
  }, [technicianCoordsState, customerCoordsState])

  // 5. Live Simulation: Van dynamically drives towards customer when status is 'en_route'
  useEffect(() => {
    if (activeStatus !== 'en_route' || routeCoordinates.length < 3) return

    let stepIndex = 0
    const movementInterval = setInterval(() => {
      stepIndex++
      if (stepIndex < routeCoordinates.length - 1) {
        const nextCoord = routeCoordinates[stepIndex]
        setTechnicianCoordsState(nextCoord)
        const remainingFraction = 1 - stepIndex / (routeCoordinates.length - 1)
        setLiveDistanceKm(parseFloat((liveDistanceKm * remainingFraction).toFixed(1)))
        setLiveEstimatedMins(Math.max(1, Math.round(liveEstimatedMins * remainingFraction)))
      }
    }, 4500)

    return () => clearInterval(movementInterval)
  }, [activeStatus, routeCoordinates])

  // Map Controls & Style
  const mapRef = useRef<MapRef>(null)
  const [style, setStyle] = useState<StyleKey>('default')
  const selectedStyle = mapStyles[style]
  const is3D = style === 'openstreetmap3d'
  const [isExploreMode, setIsExploreMode] = useState(false)

  useEffect(() => {
    mapRef.current?.easeTo({ pitch: is3D ? 60 : 0, duration: 600 })
  }, [is3D])

  // Fly to new customer coordinates when geocoded
  useEffect(() => {
    if (mapRef.current && !isExploreMode) {
      mapRef.current.easeTo({
        center: customerCoordsState,
        zoom: 14.2,
        duration: 900,
      })
    }
  }, [customerCoordsState, isExploreMode])

  // Modals & Chat State
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isCallOpen, setIsCallOpen] = useState(false)
  const [isSupportOpen, setIsSupportOpen] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  // Real-time ticking call duration timer
  useEffect(() => {
    let timer: any = null
    if (isCallOpen) {
      setCallDuration(1)
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    } else {
      setCallDuration(0)
    }
    return () => clearInterval(timer)
  }, [isCallOpen])

  // Dynamic context-aware Chat Messages
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([])
  const [inputMsg, setInputMsg] = useState('')

  useEffect(() => {
    const addressName = activeAddress.split(',')[0] || 'your location'
    setChatMessages([
      {
        sender: 'technician',
        text: `Hello ${activeCustomer}! I'm on the way to ${addressName} with your mobile wash unit. Arriving in ~${liveEstimatedMins} mins!`,
        time: 'Just now',
      },
    ])
  }, [activeCustomer, activeAddress, liveEstimatedMins])

  const handleSendMessage = () => {
    if (!inputMsg.trim()) return
    const userText = inputMsg.trim()
    const newMsg = {
      sender: 'user',
      text: userText,
      time: 'Just now',
    }
    setChatMessages((prev) => [...prev, newMsg])
    setInputMsg('')

    // Context-aware dynamic technician reply
    setTimeout(() => {
      const lower = userText.toLowerCase()
      let reply = `Got it, ${activeCustomer}! Setting up the wash equipment right away.`
      if (lower.includes('driveway') || lower.includes('park')) {
        reply = `Understood! I will pull our mobile wash unit into the driveway safely.`
      } else if (lower.includes('gate') || lower.includes('code')) {
        reply = `Thank you! Gate instructions received and noted on my dispatch terminal.`
      } else if (lower.includes('outside') || lower.includes('meet')) {
        reply = `Great! I will look out for you outside in approximately ~${liveEstimatedMins} mins.`
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'technician',
          text: reply,
          time: 'Just now',
        },
      ])
    }, 1100)
  }

  if (!isDriverAccepted) {
    return (
      <Dialog
        isOpen={true}
        onClose={onBack}
        maxWidth="md"
        icon={<span className="material-symbols-outlined text-[32px] animate-pulse">hourglass_top</span>}
        iconVariant="warning"
        title="Waiting for Driver to Accept"
        description={`Your booking ${booking?.id ? `#${booking.id}` : ''} has been scheduled. Live map tracking and technician details will unlock here as soon as a certified technician accepts your booking.`}
      >
        <button
          type="button"
          onClick={onBack}
          className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary-hover active:scale-98 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
        >
          Return to Bookings
        </button>
      </Dialog>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-surface-subtle flex flex-col overflow-y-auto w-full max-w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto shadow-2xl animate-in slide-in-from-right duration-250">
      {/* 1. TOP HEADER */}
      <div className="bg-white/95 backdrop-blur-md px-5 pt-3.5 pb-3 border-b border-gray-100 flex items-center justify-between z-20 shrink-0">
        {/* Circular Back Button */}
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-gray-200/80 shadow-xs flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
          title="Back"
        >
          <ChevronLeft className="w-5 h-5 text-gray-800 stroke-[2.4]" />
        </button>

        {/* Center Title with Category Pill */}
        <div className="flex flex-col items-center">
          <span className="px-3 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-medium tracking-tight mb-0.5">
            {activeTitle} • {activeCategory}
          </span>
          <h1 className="text-base sm:text-lg font-bold text-status-active tracking-tight leading-tight">
            {activeStatus === 'in_progress'
              ? 'Detailing in Progress'
              : activeStatus === 'en_route'
              ? hasRealDriver
                ? `${realDriverName} is Arriving`
                : 'Technician is Arriving'
              : activeStatus === 'completed'
              ? 'Wash Completed'
              : hasRealDriver
              ? `${realDriverName} Assigned`
              : 'Technician Assigned'}
          </h1>
        </div>

        {/* Empty placeholder to center title */}
        <div className="w-10" />
      </div>

      {/* 2. REAL INTERACTIVE MAP SECTION */}
      <div
        className="relative w-full flex-1 min-h-[380px] sm:min-h-[440px] bg-slate-100 overflow-hidden select-none border-b border-gray-200/50"
        style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
      >
        <Map
          ref={mapRef}
          center={customerCoordsState}
          zoom={14.2}
          pitch={is3D ? 60 : 0}
          followUser={!isExploreMode}
          onUserInteract={(interacting) => setIsExploreMode(interacting)}
          styles={
            selectedStyle
              ? { light: selectedStyle, dark: selectedStyle }
              : undefined
          }
          className="w-full h-full min-h-[380px] sm:min-h-[440px]"
        >
          {/* Dynamic Driving Route Polyline from Technician Van to Customer */}
          <MapRoute
            id="order-tracking-route"
            coordinates={routeCoordinates}
            color="var(--primary)"
            width={5.5}
            opacity={0.9}
          />

          {/* Technician Mobile Wash Van Live Marker */}
          <MapMarker longitude={technicianCoordsState[0]} latitude={technicianCoordsState[1]}>
            <div className="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 group pointer-events-none">
              {/* Outer Pulsing Green Beacon */}
              <div className="absolute w-12 h-12 rounded-full bg-status-active/30 animate-ping pointer-events-none" />
              {/* Van Bubble */}
              <div className="w-10 h-10 rounded-full bg-status-active text-white border-2 border-white shadow-xl flex items-center justify-center pointer-events-auto cursor-pointer transform hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">local_shipping</span>
              </div>
              {/* Van Tooltip Pill */}
              <div className="absolute -top-7 px-2 py-0.5 rounded-md bg-secondary text-white text-[9px] font-bold shadow-md whitespace-nowrap pointer-events-none">
                {hasRealDriver ? `${realDriverName} • ${activeVan}` : `Technician • ${activeVan}`}
              </div>
            </div>
          </MapMarker>

          {/* Customer Destination House Pin Marker */}
          <MapMarker longitude={customerCoordsState[0]} latitude={customerCoordsState[1]}>
            <div className="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 group pointer-events-none">
              {/* Destination Beacon Ping */}
              <div className="absolute w-11 h-11 rounded-full bg-primary/30 animate-ping pointer-events-none" />
              {/* Red Pin Bubble */}
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground border-2 border-white shadow-xl flex items-center justify-center pointer-events-auto cursor-pointer transform hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[17px]">home</span>
              </div>
              {/* Destination Tooltip Pill */}
              <div className="absolute -top-7 px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[9px] font-bold shadow-md whitespace-nowrap pointer-events-none">
                {activeVehicle ? `${activeVehicle} Location` : 'Your Vehicle Location'}
              </div>
            </div>
          </MapMarker>

          {/* Minimalist Controls */}
          <MapControls position="bottom-right" />
        </Map>

        {/* Floating Re-Center Button (Appears during Explore Mode) */}
        {isExploreMode && (
          <button
            type="button"
            onClick={() => {
              setIsExploreMode(false)
              mapRef.current?.flyTo({
                center: technicianCoordsState,
                zoom: 14.5,
                duration: 800,
              })
            }}
            className="absolute bottom-4 left-4 z-20 px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-lg text-xs font-bold text-gray-900 flex items-center gap-1.5 hover:bg-white active:scale-95 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2"
          >
            <Navigation className="w-3.5 h-3.5 text-primary fill-primary" />
            <span>Re-Center Van</span>
          </button>
        )}

        {/* Map Style Switcher (Default Carto, OpenStreetMap, OpenStreetMap 3D) */}
        <div className="absolute top-3 right-3 z-10 w-44 sm:w-48">
          <Select
            value={style}
            onValueChange={(val) => setStyle(val as StyleKey)}
            options={mapStyleOptions}
            icon={<Layers className="w-3.5 h-3.5 text-gray-600" />}
            triggerClassName="h-9 py-1.5 pl-9 pr-2.5 bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-md rounded-xl text-xs font-bold text-gray-800 hover:bg-white"
            contentClassName="right-0 left-auto min-w-[190px] rounded-xl border border-gray-200/90 shadow-xl"
          />
        </div>
      </div>

      {/* 3. BOTTOM CARDS SECTION */}
      <div className="bg-surface-subtle px-4 sm:px-5 pt-3 pb-6 flex flex-col gap-3 shrink-0 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        {/* Live Distance & ETA Status Bar */}
        <div className="bg-white rounded-2xl px-4 py-2.5 border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-active opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-active" />
            </span>
            <span className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight">
              {hasRealDriver ? `${realDriverName} is ~${liveEstimatedMins} mins away` : `Technician is ~${liveEstimatedMins} mins away`}
            </span>
          </div>
          <span className="text-xs font-semibold text-gray-500 font-mono bg-surface-alt px-2.5 py-0.5 rounded-full">
            {liveDistanceKm} km
          </span>
        </div>

        {/* Card 1: Technician Info */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Technician Avatar or Initials or Icon */}
            <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 shadow-xs bg-primary/10 flex items-center justify-center shrink-0">
              {activeTechAvatar ? (
                <img
                  src={activeTechAvatar}
                  alt={displayTechName}
                  className="w-full h-full object-cover"
                />
              ) : hasRealDriver ? (
                <span className="font-black text-sm text-primary">
                  {realDriverName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </span>
              ) : (
                <User className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="flex flex-col">
              <h3 className="font-bold text-sm sm:text-base text-gray-900 leading-tight">
                {displayTechName}
              </h3>
              <span className="text-xs font-semibold text-status-active mt-0.5">
                Verified Technician • {activeVan}
              </span>
              {activeDriverPhone && (
                <span className="text-[11px] text-gray-500 font-mono mt-0.5">
                  Direct: {activeDriverPhone}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons: Chat & Call */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsChatOpen(true)}
              className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-200/70 flex items-center justify-center text-primary hover:bg-primary-light/60 active:scale-95 transition-all shadow-xs cursor-pointer"
              title="Message Technician"
            >
              <span className="material-symbols-outlined text-[20px]">chat</span>
            </button>

            {activeDriverPhone ? (
              <a
                href={`tel:${activeDriverPhone.replace(/[^0-9+]/g, '')}`}
                className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-200/70 flex items-center justify-center text-primary hover:bg-primary-light/60 active:scale-95 transition-all shadow-xs cursor-pointer"
                title={`Call ${displayTechName}`}
              >
                <span className="material-symbols-outlined text-[20px]">call</span>
              </a>
            ) : (
              <button
                onClick={() => setIsCallOpen(true)}
                className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-200/70 flex items-center justify-center text-primary hover:bg-primary-light/60 active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Call Technician"
              >
                <span className="material-symbols-outlined text-[20px]">call</span>
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Registered Target Vehicle & Service Breakdown */}
        {activeVehicle && (
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200/70 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                <Car className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Target Service Vehicle
                </span>
                <span className="font-bold text-xs sm:text-sm text-gray-900 mt-0.5">
                  {activeVehicle}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
                  {activeVehiclePlate && (
                    <span className="font-mono font-bold bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-700">
                      Plate: {activeVehiclePlate}
                    </span>
                  )}
                  {activeVehicleType && (
                    <span className="text-[10px] bg-primary/5 text-primary font-semibold px-1.5 py-0.5 rounded">
                      {activeVehicleType}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {activePrice && (
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Total
                </span>
                <span className="font-mono font-black text-sm sm:text-base text-gray-900 mt-0.5">
                  {activePrice}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">
                  {activePaymentMethod}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Card 3: Address & Appointment Schedule */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col items-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
            SERVICE ADDRESS
          </span>
          <div className="w-full border-b border-dashed border-gray-300 mt-2 mb-2.5" />
          <div className="w-full text-left flex flex-col gap-0.5">
            <h4 className="font-bold text-sm text-gray-900">
              {activeCustomer}{activePhone ? `, ${activePhone}` : ''}
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">
              {activeAddress}
            </p>
            {booking?.shopItems && booking.shopItems.length > 0 && (
              <div className="w-full mt-2.5 pt-2 border-t border-amber-200/60 bg-amber-50/60 p-2.5 rounded-xl text-xs flex flex-col gap-1">
                <span className="font-bold text-amber-950 flex items-center gap-1.5 text-[11px]">
                  <Package className="w-3.5 h-3.5 text-amber-600" />
                  <span>Bundled Shop Products (Delivered by Tech):</span>
                </span>
                <ul className="text-gray-700 text-[11px] space-y-0.5">
                  {booking.shopItems.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center">
                      <span>• {item.product.title} <strong className="text-amber-900">×{item.quantity}</strong></span>
                      <span className="font-mono text-gray-500">${(item.product.priceNumeric * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(activeDate || activeTime) && (
              <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-gray-100 text-[11px] text-gray-600 font-medium">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{activeDate}</span>
                </span>
                {activeTime && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{activeTime}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Need Help? Customer Support */}
        <div
          onClick={() => setIsSupportOpen(true)}
          className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/80 shadow-xs flex items-center justify-between hover:bg-gray-50/80 cursor-pointer active:scale-98 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-200/70 flex items-center justify-center text-primary shadow-xs">
              <span className="material-symbols-outlined text-[22px]">support_agent</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-primary leading-tight">
                Need Help?
              </span>
              <span className="text-xs text-gray-500 mt-0.5">
                Contact Customer Support &gt;
              </span>
            </div>
          </div>

          <span className="material-symbols-outlined text-gray-800 text-[20px]">
            arrow_forward
          </span>
        </div>
      </div>

      {/* 4. MODAL: IN-APP CHAT WITH TECHNICIAN */}
      <Dialog
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        position="bottom-sheet"
        zIndex="z-60"
        maxWidth="xl"
        contentClassName="h-[65vh] p-5 shadow-2xl flex flex-col"
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
              {activeTechAvatar ? (
                <img
                  src={activeTechAvatar}
                  alt={displayTechName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">{displayTechName}</span>
              <span className="text-[10px] text-emerald-600 font-medium">● Online</span>
            </div>
          </div>
          <button
            onClick={() => setIsChatOpen(false)}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3 min-h-[220px]">
          {chatMessages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                m.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs ${
                  m.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-xs'
                    : 'bg-gray-100 text-gray-800 rounded-bl-xs'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[9px] text-gray-400 mt-1 px-1">{m.time}</span>
            </div>
          ))}
        </div>

        {/* Quick Replies */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {['Park in driveway', 'Gate code is #1234', 'I will meet you outside'].map(
            (quick, i) => (
              <button
                key={i}
                onClick={() => {
                  setInputMsg(quick)
                }}
                className="shrink-0 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[11px] hover:bg-gray-200 active:scale-95 cursor-pointer"
              >
                {quick}
              </button>
            )
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-2 flex items-center gap-2 border-t border-gray-100">
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={`Type a message to ${displayTechName}...`}
            className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleSendMessage}
            className="px-3.5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-[#b91c1c] active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          >
            Send
          </button>
        </div>
      </Dialog>

      {/* 5. MODAL: CALL SIMULATION */}
      {isCallOpen && (
        <div className="fixed inset-0 z-60 bg-gray-950/90 backdrop-blur-md flex flex-col items-center justify-between p-8 text-white animate-in zoom-in-95 duration-200">
          <div className="pt-12 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl mb-4 bg-white/10 flex items-center justify-center">
              {activeTechAvatar ? (
                <img
                  src={activeTechAvatar}
                  alt={displayTechName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-white/70" />
              )}
            </div>
            <h2 className="text-xl font-bold">{displayTechName}</h2>
            <span className="text-xs text-gray-300 mt-1">{activeVan}</span>
            {activeDriverPhone && (
              <a
                href={`tel:${activeDriverPhone.replace(/[^0-9+]/g, '')}`}
                className="mt-3 px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Direct Dial: {activeDriverPhone}</span>
              </a>
            )}
            <span className="text-xs font-mono text-emerald-400 mt-2 font-semibold">
              {Math.floor(callDuration / 60)
                .toString()
                .padStart(2, '0')}
              :
              {(callDuration % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <div className="w-full max-w-xs flex flex-col gap-6 items-center pb-8">
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => alert('Microphone Muted')}
                className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[22px]">mic_off</span>
              </button>
              <button
                onClick={() => alert('Speakerphone enabled')}
                className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[22px]">volume_up</span>
              </button>
            </div>

            {/* End Call Button */}
            <button
              onClick={() => setIsCallOpen(false)}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl cursor-pointer transition-all active:scale-90"
              title="End Call"
            >
              <span className="material-symbols-outlined text-[28px]">call_end</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. MODAL: CUSTOMER SUPPORT */}
      <Dialog
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        position="bottom-sheet"
        zIndex="z-60"
        maxWidth="xl"
        contentClassName="p-5 shadow-2xl flex flex-col gap-3.5"
      >
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">
              support_agent
            </span>
            <span className="text-sm font-bold text-gray-900">Bentley Concierge Help</span>
          </div>
          <button
            onClick={() => setIsSupportOpen(false)}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Need assistance with your booking or want to update special instructions? Our team is available 7 days a week.
        </p>

        <a
          href="tel:+12503519155"
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary-hover active:scale-98 transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">call</span>
          <span>Call Support Hotline: (250) 351-9155</span>
        </a>

        <button
          onClick={() => {
            setIsSupportOpen(false)
            setIsChatOpen(true)
          }}
          className="w-full py-3 rounded-xl bg-gray-100 text-gray-800 text-xs font-semibold hover:bg-gray-200 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">chat</span>
          <span>Message Technician Directly</span>
        </button>
      </Dialog>
    </div>
  )
}
