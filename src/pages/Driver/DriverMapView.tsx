import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  ChevronLeft,
  Navigation,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  MapPin,
  Car,
  Play,
  Pause,
  Sparkles,
  ExternalLink,
  LocateFixed,
  Send,
  X,
  Check,
} from 'lucide-react'
import { BookingRecord, BookingStatus } from '@/types'
import { Map, MapMarker, MapRoute, MapControls, type MapRef } from '@/components/ui/map'

interface DriverMapViewProps {
  booking: BookingRecord
  onBack: () => void
  onUpdateStatus: (bookingId: string, newStatus: BookingStatus, coords?: [number, number]) => void
}

export const DriverMapView: React.FC<DriverMapViewProps> = ({
  booking,
  onBack,
  onUpdateStatus,
}) => {
  const mapRef = useRef<MapRef>(null)

  // Default coordinate anchors (Ontario demo region or booking coords)
  const defaultCustomerCoords = useMemo<[number, number]>(() => {
    return booking.customerCoords || [-79.3832, 43.6532]
  }, [booking.customerCoords])

  const defaultDriverCoords = useMemo<[number, number]>(() => {
    return booking.driverCoords || [-79.4035, 43.6635]
  }, [booking.driverCoords])

  // Waypoints along route
  const routeWaypoints = useMemo<[number, number][]>(
    () => [
      defaultDriverCoords,
      [-79.3995, 43.6625],
      [-79.3955, 43.659],
      [-79.391, 43.6565],
      [-79.387, 43.6545],
      defaultCustomerCoords,
    ],
    [defaultDriverCoords, defaultCustomerCoords]
  )

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [driverPos, setDriverPos] = useState<[number, number]>(defaultDriverCoords)
  const [isSimulating, setIsSimulating] = useState(false)
  const [etaMins, setEtaMins] = useState(booking.estimatedMins || 7)
  const [distanceKm, setDistanceKm] = useState(booking.distanceKm || 2.8)
  const [showSmsModal, setShowSmsModal] = useState(false)
  const [washTimerSeconds, setWashTimerSeconds] = useState(0)
  const [isExploreMode, setIsExploreMode] = useState(false)
  const isExploreModeRef = useRef(false)
  useEffect(() => {
    isExploreModeRef.current = isExploreMode
  }, [isExploreMode])

  // Current status
  const currentStatus = booking.status

  // Trigger map resize on mount and window resize for responsive canvas rendering
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

  // Elapsed wash service timer when in_progress
  useEffect(() => {
    let washInterval: any = null
    if (currentStatus === 'in_progress') {
      washInterval = setInterval(() => {
        setWashTimerSeconds((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(washInterval)
  }, [currentStatus])

  // Simulation movement timer
  useEffect(() => {
    let timer: any = null
    if (isSimulating) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= routeWaypoints.length - 1) {
            setIsSimulating(false)
            // Arrived at destination
            onUpdateStatus(booking.id, 'in_progress', defaultCustomerCoords)
            return prev
          }
          const nextIndex = prev + 1
          const nextPos = routeWaypoints[nextIndex]
          setDriverPos(nextPos)
          onUpdateStatus(booking.id, 'en_route', nextPos)

          // Recalculate remaining distance/ETA
          const remainingPct = 1 - nextIndex / (routeWaypoints.length - 1)
          setDistanceKm(parseFloat((2.8 * remainingPct).toFixed(1)))
          setEtaMins(Math.max(1, Math.round(7 * remainingPct)))

          // Only auto-follow camera if driver is not actively exploring the map
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
  }, [isSimulating, booking.id, onUpdateStatus, routeWaypoints, defaultCustomerCoords])

  const handleStepStatus = (newStatus: BookingStatus) => {
    onUpdateStatus(booking.id, newStatus, driverPos)
  }

  // Live GPS device location hook
  const handleUseLiveGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude]
          setDriverPos(coords)
          onUpdateStatus(booking.id, currentStatus, coords)
          mapRef.current?.flyTo({ center: coords, zoom: 16, duration: 1000 })
        },
        (err) => {
          console.warn('Geolocation access failed or denied:', err)
        }
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

  const smsTemplates = [
    `Hi ${booking.customerName}, I'm on my way for your Bentley Mobile Car Wash! ETA ~${etaMins} mins.`,
    `Hi ${booking.customerName}, I have arrived outside your location and am ready to start washing.`,
    `Hi ${booking.customerName}, your wash & detailing is complete! Please let me know if you'd like to inspect.`,
  ]

  // Next direction text helper
  const nextInstructionText =
    currentStepIndex >= routeWaypoints.length - 1
      ? 'Arrived at Customer Address!'
      : `In 350m, head toward ${booking.address.split(',')[0] || 'destination'}`

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
              handleStepStatus('completed')
              onBack()
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-secondary hover:bg-black active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
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
      {/* 1. TOP GLOBAL NAVIGATION HUD HEADER (Responsive for all screens) */}
      <header className="bg-secondary text-secondary-foreground px-3.5 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between z-30 shrink-0 shadow-md">
        {/* Left: Back button & Mode */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
            title="Return to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Driver Navigation Mode</span>
            </span>
            <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-[190px] sm:max-w-xs md:max-w-md">
              {booking.customerName} • {booking.vehicle}
            </h2>
          </div>
        </div>

        {/* Center: Vehicle & Destination (Hidden on small mobile, visible on tablet/desktop) */}
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl max-w-sm truncate">
          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="truncate">{booking.address}</span>
        </div>

        {/* Right: Controls & ETA Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Live GPS button */}
          <button
            type="button"
            onClick={handleUseLiveGPS}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all cursor-pointer"
            title="Locate via device GPS"
          >
            <LocateFixed className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Simulation Toggle */}
          <button
            type="button"
            onClick={() => setIsSimulating(!isSimulating)}
            className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Simulate route travel"
          >
            {isSimulating ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-white" />
                <span className="hidden sm:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span className="hidden sm:inline">Simulate</span>
              </>
            )}
          </button>

          {/* ETA Badge */}
          <div className="bg-primary px-2.5 sm:px-3 py-1.5 rounded-xl text-white flex items-center gap-1.5 shadow-sm">
            <Navigation className="w-3.5 h-3.5 fill-white" />
            <span className="text-xs font-mono font-bold">{etaMins}m</span>
          </div>
        </div>
      </header>

      {/* 2. MAIN BODY CONTENT (Responsive Split: Map + Bottom Sheet on Mobile, Map + Sidebar on Desktop) */}
      <div className="flex-1 w-full flex flex-col lg:flex-row overflow-hidden relative">
        {/* ======================================================== */}
        {/* MOBILE & TABLET INSTRUCTION BANNER (< lg)                */}
        {/* ======================================================== */}
        <div className="lg:hidden bg-primary-light border-b border-primary-border/40 px-3.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
              <Navigation className="w-3.5 h-3.5 fill-white" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-gray-900 truncate">
                {nextInstructionText}
              </span>
              <span className="text-[10px] text-gray-500">
                {distanceKm} km remaining • ETA ~{etaMins} mins
              </span>
            </div>
          </div>

          <div className="text-[11px] font-bold font-mono text-primary shrink-0 bg-white/80 border border-primary-border/60 px-2 py-0.5 rounded-md">
            {distanceKm} km
          </div>
        </div>

        {/* ======================================================== */}
        {/* MOBILE & TABLET STEP PROGRESS (< lg)                     */}
        {/* ======================================================== */}
        <div className="lg:hidden bg-white border-b border-gray-100 px-3 sm:px-4 py-2 flex items-center justify-between text-[10px] sm:text-[11px] font-bold z-10 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 text-gray-900 shrink-0">
            <span
              className={`w-2 h-2 rounded-full ${
                currentStatus === 'accepted' ? 'bg-primary' : 'bg-emerald-500'
              }`}
            />
            <span>1. Accepted</span>
          </div>
          <span className="text-gray-300 mx-1">→</span>
          <div
            className={`flex items-center gap-1 shrink-0 ${
              currentStatus === 'en_route'
                ? 'text-primary'
                : currentStatus === 'in_progress' || currentStatus === 'completed'
                ? 'text-emerald-600'
                : 'text-gray-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                currentStatus === 'en_route'
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
            className={`flex items-center gap-1 shrink-0 ${
              currentStatus === 'in_progress'
                ? 'text-emerald-600 font-black'
                : currentStatus === 'completed'
                ? 'text-emerald-600'
                : 'text-gray-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                currentStatus === 'in_progress'
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
            className={`flex items-center gap-1 shrink-0 ${
              currentStatus === 'completed' ? 'text-emerald-600' : 'text-gray-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                currentStatus === 'completed' ? 'bg-emerald-500' : 'bg-gray-300'
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
          <div className="hidden lg:flex absolute top-4 left-4 z-20 max-w-sm bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-3.5 items-center justify-between gap-3 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                <Navigation className="w-5 h-5 fill-white" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-gray-900 truncate">
                  {nextInstructionText}
                </span>
                <span className="text-[11px] text-gray-500">
                  {distanceKm} km remaining • ETA ~{etaMins} mins
                </span>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg shrink-0">
              {etaMins} min
            </div>
          </div>

          <Map
            ref={mapRef}
            center={driverPos}
            zoom={14}
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
              onRecenter={() => {
                setIsExploreMode(false)
                if (mapRef.current) {
                  mapRef.current.flyTo({ center: driverPos, zoom: 15, duration: 600 })
                }
              }}
            />

            {/* Route polyline from Driver to Customer */}
            <MapRoute
              coordinates={routeWaypoints}
              color="#dc2626"
              width={5}
              opacity={0.88}
            />

            {/* Customer Location Destination Pin */}
            <MapMarker longitude={defaultCustomerCoords[0]} latitude={defaultCustomerCoords[1]}>
              <div className="flex flex-col items-center group pointer-events-none select-none">
                <div className="px-2 py-0.5 rounded-full bg-secondary text-white text-[9px] font-bold shadow-md mb-1 whitespace-nowrap pointer-events-none">
                  👤 {booking.customerName}
                </div>
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-lg ring-4 ring-primary/25 animate-bounce pointer-events-auto cursor-pointer">
                  <Car className="w-5 h-5 text-white" />
                </div>
              </div>
            </MapMarker>

            {/* Driver Live Van Pin */}
            <MapMarker longitude={driverPos[0]} latitude={driverPos[1]}>
              <div className="flex flex-col items-center pointer-events-none select-none">
                <div className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold shadow-md mb-1 whitespace-nowrap flex items-center gap-1 pointer-events-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>Van (You)</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center shadow-xl ring-4 ring-emerald-400/40 pointer-events-auto cursor-pointer">
                  <Navigation className="w-5 h-5 text-emerald-400 fill-emerald-400 rotate-45" />
                </div>
              </div>
            </MapMarker>
          </Map>

          {/* Floating Re-Center / Resume Navigation Button (Appears during Explore Mode) */}
          {isExploreMode && (
            <button
              type="button"
              onClick={() => {
                setIsExploreMode(false)
                mapRef.current?.flyTo({
                  center: driverPos,
                  zoom: 15,
                  duration: 800,
                })
              }}
              className="absolute bottom-4 left-4 z-20 px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-lg text-xs font-bold text-gray-900 flex items-center gap-1.5 hover:bg-white active:scale-95 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2"
            >
              <Navigation className="w-3.5 h-3.5 text-primary fill-primary" />
              <span>Resume Navigation</span>
            </button>
          )}
        </div>

        {/* ======================================================== */}
        {/* MOBILE DRIVER CONTROL PANEL (Bottom Sheet for < lg)     */}
        {/* ======================================================== */}
        <div className="lg:hidden bg-white border-t border-gray-200/80 p-3.5 sm:p-4 shadow-xl z-20 flex flex-col gap-2.5 sm:gap-3 shrink-0">
          {/* Customer & Quick Contact Row */}
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-primary-light border border-primary-border/60 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {booking.customerName.charAt(0)}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-gray-900 truncate">
                  {booking.customerName}
                </span>
                <span className="text-[11px] text-gray-500 font-medium truncate">
                  {booking.vehicle} ({booking.licensePlate || 'Plate: BC-8492'})
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

          {/* Package & Live Timer */}
          <div className="flex items-center justify-between text-xs bg-surface-subtle p-2 sm:p-2.5 rounded-xl border border-gray-100">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Package</span>
              <span className="font-bold text-gray-900 text-xs truncate max-w-[140px] sm:max-w-xs">
                {booking.title}
              </span>
            </div>

            {currentStatus === 'in_progress' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span className="font-mono font-bold text-xs">
                  {formatTimer(washTimerSeconds)}
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
          <div className="flex flex-col gap-5">
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

            {/* Desktop Step Pipeline Cards */}
            <div className="flex flex-col gap-2 bg-surface-subtle p-3 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Service Progression
              </span>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                    currentStatus === 'accepted'
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <span className="text-[10px] font-bold">1. Accept</span>
                  {currentStatus !== 'accepted' && <Check className="w-3 h-3 text-emerald-600" />}
                </div>

                <div
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                    currentStatus === 'en_route'
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
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                    currentStatus === 'in_progress'
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
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                    currentStatus === 'completed'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white border-gray-200 text-gray-400'
                  }`}
                >
                  <span className="text-[10px] font-bold">4. Done</span>
                  {currentStatus === 'completed' && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
            </div>

            {/* Desktop Customer Information Card */}
            <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-xs flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-light border border-primary-border/60 flex items-center justify-center text-primary font-bold text-base shrink-0">
                    {booking.customerName.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">{booking.customerName}</span>
                    <span className="text-xs text-gray-500 font-medium">
                      {booking.vehicle} • {booking.licensePlate || 'Plate: BC-8492'}
                    </span>
                  </div>
                </div>

                <span className="text-base font-extrabold text-primary font-mono">
                  {booking.price}
                </span>
              </div>

              <div className="flex items-start gap-2 text-xs text-gray-600 bg-surface-subtle p-2.5 rounded-xl border border-gray-100">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{booking.address}</span>
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

            {/* Desktop Package & Booking Details Card */}
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
                <span className="font-bold text-gray-900">
                  {booking.paymentMethod || 'Pay on Completion'}
                </span>
              </div>

              {booking.addons && booking.addons.length > 0 && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Add-ons:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {booking.addons.map((add, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700 text-[11px]"
                      >
                        {add}
                      </span>
                    ))}
                  </div>
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
          <div className="pt-5 mt-4 border-t border-gray-100 flex flex-col gap-2">
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

      {/* 3. QUICK SMS TEMPLATES MODAL */}
      {showSmsModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200">
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
              Select a pre-made update template to text {booking.customerName}:
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
          </div>
        </div>
      )}
    </div>
  )
}

export default DriverMapView
