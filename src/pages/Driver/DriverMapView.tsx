import React, { useState, useEffect, useRef } from 'react'
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

  // Default coordinate anchors (Ontario, Canada demo region or booking coords)
  const defaultCustomerCoords: [number, number] = booking.customerCoords || [-79.3832, 43.6532]
  const defaultDriverCoords: [number, number] = booking.driverCoords || [-79.4035, 43.6635]

  // Waypoints along route
  const routeWaypoints: [number, number][] = [
    defaultDriverCoords,
    [-79.3995, 43.6625],
    [-79.3955, 43.659],
    [-79.391, 43.6565],
    [-79.387, 43.6545],
    defaultCustomerCoords,
  ]

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [driverPos, setDriverPos] = useState<[number, number]>(defaultDriverCoords)
  const [isSimulating, setIsSimulating] = useState(false)
  const [etaMins, setEtaMins] = useState(booking.estimatedMins || 7)
  const [distanceKm, setDistanceKm] = useState(booking.distanceKm || 2.8)
  const [showSmsModal, setShowSmsModal] = useState(false)
  const [washTimerSeconds, setWashTimerSeconds] = useState(0)

  // Current status
  const currentStatus = booking.status

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

          mapRef.current?.flyTo({
            center: nextPos,
            zoom: 15,
            duration: 1000,
          })

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

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto shadow-2xl overflow-hidden animate-in fade-in duration-200">
      {/* 1. TOP HEADER & NAVIGATION HUD */}
      <div className="bg-secondary text-secondary-foreground px-4 py-3.5 flex items-center justify-between z-20 shrink-0 shadow-md">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Driver Navigation Mode
          </span>
          <h2 className="text-sm font-bold text-white truncate max-w-[220px]">
            {booking.customerName} • {booking.vehicle}
          </h2>
        </div>

        {/* Turn-by-Turn Badge */}
        <div className="bg-primary/90 px-2.5 py-1 rounded-lg text-white flex items-center gap-1.5 shadow-xs">
          <Navigation className="w-3.5 h-3.5 fill-white" />
          <span className="text-xs font-mono font-bold">{etaMins}m</span>
        </div>
      </div>

      {/* 2. DIRECTION INSTRUCTION BANNER */}
      <div className="bg-primary-light border-b border-primary-border/40 px-4 py-2.5 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
            <Navigation className="w-4 h-4 fill-white" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-bold text-gray-900 truncate">
              {currentStepIndex >= routeWaypoints.length - 1
                ? 'Arrived at Customer Address!'
                : `In 350m, head toward ${booking.address.split(',')[0] || 'destination'}`}
            </span>
            <span className="text-[10px] text-gray-500">
              {distanceKm} km remaining • ETA ~{etaMins} mins
            </span>
          </div>
        </div>

        {/* Action controls: Device GPS + Simulation */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleUseLiveGPS}
            className="p-1.5 rounded-md bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 transition-all cursor-pointer shadow-xs"
            title="Locate via device GPS"
          >
            <LocateFixed className="w-3.5 h-3.5 text-primary" />
          </button>

          <button
            type="button"
            onClick={() => setIsSimulating(!isSimulating)}
            className="px-2.5 py-1 rounded-md bg-secondary hover:bg-black text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Simulate driver movement along route"
          >
            {isSimulating ? (
              <>
                <Pause className="w-3 h-3 fill-white" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-white" />
                <span>Simulate</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. STEP PROGRESS BAR */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-between text-[11px] font-bold z-10">
        <div className="flex items-center gap-1 text-gray-900">
          <span
            className={`w-2 h-2 rounded-full ${
              currentStatus === 'accepted' ? 'bg-primary' : 'bg-emerald-500'
            }`}
          />
          <span>1. Accepted</span>
        </div>
        <span className="text-gray-300">→</span>
        <div
          className={`flex items-center gap-1 ${
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
        <span className="text-gray-300">→</span>
        <div
          className={`flex items-center gap-1 ${
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
        <span className="text-gray-300">→</span>
        <div
          className={`flex items-center gap-1 ${
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

      {/* 4. INTERACTIVE MAP VIEWPORT */}
      <div className="flex-1 w-full relative z-0">
        <Map
          ref={mapRef}
          center={driverPos}
          zoom={14}
          pitch={35}
          className="w-full h-full"
        >
          <MapControls
            position="top-right"
            onRecenter={() => {
              if (mapRef.current) {
                mapRef.current.flyTo({ center: driverPos, zoom: 15, duration: 600 })
              }
            }}
          />

          {/* Route path from Driver to Customer */}
          <MapRoute
            coordinates={routeWaypoints}
            color="#dc2626"
            width={5}
            opacity={0.88}
          />

          {/* Customer Location Pin */}
          <MapMarker longitude={defaultCustomerCoords[0]} latitude={defaultCustomerCoords[1]}>
            <div className="flex flex-col items-center group cursor-pointer">
              <div className="px-2 py-0.5 rounded-full bg-secondary text-white text-[9px] font-bold shadow-md mb-1 whitespace-nowrap">
                👤 {booking.customerName}
              </div>
              <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-lg ring-4 ring-primary/25 animate-bounce">
                <Car className="w-5 h-5 text-white" />
              </div>
            </div>
          </MapMarker>

          {/* Driver Van Marker */}
          <MapMarker longitude={driverPos[0]} latitude={driverPos[1]}>
            <div className="flex flex-col items-center cursor-pointer">
              <div className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold shadow-md mb-1 whitespace-nowrap flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>Van (You)</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center shadow-xl ring-4 ring-emerald-400/40">
                <Navigation className="w-5 h-5 text-emerald-400 fill-emerald-400 rotate-45" />
              </div>
            </div>
          </MapMarker>
        </Map>
      </div>

      {/* 5. DRIVER CONTROL PANEL BOTTOM SHEET */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-xl z-20 flex flex-col gap-3">
        {/* Customer & Order Summary Card */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary-light border border-primary-border/60 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {booking.customerName.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-900">{booking.customerName}</span>
              <span className="text-[11px] text-gray-500 font-medium">
                {booking.vehicle} ({booking.licensePlate || 'Plate: BC-8492'})
              </span>
              <span className="text-[10px] text-primary font-semibold truncate max-w-[200px]">
                {booking.address}
              </span>
            </div>
          </div>

          {/* External Maps & Contact Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openGoogleMapsDirections}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center border border-gray-200 transition-colors shadow-xs"
              title="Open directions in Google Maps"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <a
              href={`tel:${booking.customerPhone}`}
              className="w-9 h-9 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200 transition-colors shadow-xs"
              title="Call Customer"
            >
              <Phone className="w-4 h-4 fill-emerald-600" />
            </a>
            <button
              type="button"
              onClick={() => setShowSmsModal(true)}
              className="w-9 h-9 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200 transition-colors shadow-xs"
              title="Send Quick SMS"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Service Details & Live Stopwatch */}
        <div className="flex items-center justify-between text-xs bg-surface-subtle p-2.5 rounded-xl border border-gray-100">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Package</span>
            <span className="font-bold text-gray-900">{booking.title}</span>
          </div>

          {currentStatus === 'in_progress' && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span className="font-mono font-bold text-xs">
                Washing: {formatTimer(washTimerSeconds)}
              </span>
            </div>
          )}

          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Total Fee</span>
            <span className="font-extrabold text-primary font-mono">{booking.price}</span>
          </div>
        </div>

        {/* Status Transition Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          {currentStatus === 'accepted' && (
            <button
              type="button"
              onClick={() => handleStepStatus('en_route')}
              className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Navigation className="w-4 h-4 fill-white" />
              <span>Start Driving (Mark En Route)</span>
            </button>
          )}

          {currentStatus === 'en_route' && (
            <button
              type="button"
              onClick={() => handleStepStatus('in_progress')}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
              className="flex-1 py-3 rounded-xl bg-secondary hover:bg-black text-white text-xs font-bold shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Finish Wash & Complete Order</span>
            </button>
          )}

          {currentStatus === 'completed' && (
            <div className="w-full py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Service Successfully Completed</span>
            </div>
          )}
        </div>
      </div>

      {/* 6. QUICK SMS TEMPLATES MODAL */}
      {showSmsModal && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold text-gray-900">Send Quick SMS</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowSmsModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Select a pre-made update template to text {booking.customerName}:
            </p>

            <div className="mt-3 flex flex-col gap-2">
              {smsTemplates.map((tmpl, idx) => (
                <a
                  key={idx}
                  href={`sms:${booking.customerPhone}?body=${encodeURIComponent(tmpl)}`}
                  onClick={() => setShowSmsModal(false)}
                  className="p-3 rounded-xl border border-gray-200 hover:border-primary/60 hover:bg-primary-light/30 text-xs text-gray-800 transition-all cursor-pointer flex items-center justify-between gap-2"
                >
                  <span className="line-clamp-2">{tmpl}</span>
                  <Send className="w-3.5 h-3.5 text-primary shrink-0" />
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
