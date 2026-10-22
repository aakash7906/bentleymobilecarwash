import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Map, MapMarker, MapRoute, MapControls, type MapRef } from '@/components/ui/map'

const mapStyles = {
  default: undefined,
  openstreetmap: 'https://tiles.openfreemap.org/styles/bright',
  openstreetmap3d: 'https://tiles.openfreemap.org/styles/liberty',
}

type StyleKey = keyof typeof mapStyles

// Coordinates for customer address & approaching technician van
const CUSTOMER_COORDS: [number, number] = [-79.3832, 43.6532]
const TECHNICIAN_COORDS: [number, number] = [-79.4035, 43.6635]
const TRACKING_ROUTE: [number, number][] = [
  [-79.4035, 43.6635],
  [-79.3985, 43.6620],
  [-79.3950, 43.6585],
  [-79.3905, 43.6565],
  [-79.3860, 43.6545],
  [-79.3832, 43.6532],
]

import { BookingStatus, BookingRecord } from '@/types'

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
  serviceTitle = 'Car Wash',
  serviceCategory = 'Exterior Cleaning',
  customerName = 'Sarah Jenkins',
  customerPhone = '+1 (998) 877-5561',
  customerAddress = '21/22, 5th Avenue, Jamesford Road, Ontario, Canada',
  technicianName = 'Alex Rivera',
  driverCoords,
  customerCoords,
  driverVanNumber = 'Van #04',
  driverPhone = '+1 (800) 555-9274',
  bookingStatus = 'en_route',
  booking,
}) => {
  const activeTechnicianCoords: [number, number] = driverCoords || booking?.driverCoords || TECHNICIAN_COORDS
  const activeCustomerCoords: [number, number] = customerCoords || booking?.customerCoords || CUSTOMER_COORDS
  const activeTechName = technicianName || booking?.driverName || booking?.technicianName || 'Alex Rivera'
  const activeStatus = bookingStatus || booking?.status || 'en_route'

  const activeRoute = [
    activeTechnicianCoords,
    [-79.3985, 43.6620] as [number, number],
    [-79.3950, 43.6585] as [number, number],
    [-79.3905, 43.6565] as [number, number],
    [-79.3860, 43.6545] as [number, number],
    activeCustomerCoords,
  ]
  const mapRef = useRef<MapRef>(null)
  const [style, setStyle] = useState<StyleKey>('default')
  const selectedStyle = mapStyles[style]
  const is3D = style === 'openstreetmap3d'

  useEffect(() => {
    mapRef.current?.easeTo({ pitch: is3D ? 60 : 25, duration: 600 })
  }, [is3D])

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isCallOpen, setIsCallOpen] = useState(false)
  const [isSupportOpen, setIsSupportOpen] = useState(false)
  const [callDuration, setCallDuration] = useState(14)
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'technician',
      text: `Hello ${customerName}! I'm on 5th Avenue with the mobile wash unit. Arriving in ~10 mins!`,
      time: '02:22 PM',
    },
  ])
  const [inputMsg, setInputMsg] = useState('')

  const handleSendMessage = () => {
    if (!inputMsg.trim()) return
    const newMsg = {
      sender: 'user',
      text: inputMsg.trim(),
      time: 'Just now',
    }
    setChatMessages((prev) => [...prev, newMsg])
    setInputMsg('')

    // Simulated technician response
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'technician',
          text: 'Got it! Setting up the water & power system right away.',
          time: 'Just now',
        },
      ])
    }, 1200)
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
            {serviceTitle}
          </span>
          <h1 className="text-base sm:text-lg font-bold text-status-active tracking-tight leading-tight">
            Technician is Arriving
          </h1>
        </div>

        {/* Empty placeholder to center title */}
        <div className="w-10" />
      </div>

      {/* 2. REAL INTERACTIVE MAPCN MAP SECTION */}
      <div className="relative w-full flex-1 min-h-[380px] sm:min-h-[440px] bg-slate-100 overflow-hidden select-none border-b border-gray-200/50">
        <Map
          ref={mapRef}
          center={activeCustomerCoords}
          zoom={14.1}
          pitch={25}
          styles={
            selectedStyle
              ? { light: selectedStyle, dark: selectedStyle }
              : undefined
          }
          className="w-full h-full min-h-[380px] sm:min-h-[440px]"
        >
          {/* Driving Route Polyline from Technician Van to Customer */}
          <MapRoute
            id="order-tracking-route"
            coordinates={activeRoute}
            color="var(--primary)"
            width={5.5}
            opacity={0.9}
          />

          {/* Technician Mobile Wash Van Live Marker */}
          <MapMarker longitude={activeTechnicianCoords[0]} latitude={activeTechnicianCoords[1]}>
            <div className="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
              {/* Outer Pulsing Green Beacon */}
              <div className="absolute w-12 h-12 rounded-full bg-status-active/30 animate-ping pointer-events-none" />
              {/* Van Bubble */}
              <div className="w-10 h-10 rounded-full bg-status-active text-white border-2 border-white shadow-xl flex items-center justify-center transform hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">local_shipping</span>
              </div>
              {/* Van Tooltip Pill */}
              <div className="absolute -top-7 px-2 py-0.5 rounded-md bg-secondary text-white text-[9px] font-bold shadow-md whitespace-nowrap pointer-events-none">
                {activeTechName} • {driverVanNumber}
              </div>
            </div>
          </MapMarker>

          {/* Customer Destination House Pin Marker */}
          <MapMarker longitude={activeCustomerCoords[0]} latitude={activeCustomerCoords[1]}>
            <div className="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
              {/* Destination Beacon Ping */}
              <div className="absolute w-11 h-11 rounded-full bg-primary/30 animate-ping pointer-events-none" />
              {/* Red Pin Bubble */}
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground border-2 border-white shadow-xl flex items-center justify-center transform hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[17px]">home</span>
              </div>
              {/* Destination Tooltip Pill */}
              <div className="absolute -top-7 px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[9px] font-bold shadow-md whitespace-nowrap pointer-events-none">
                Your Vehicle Location
              </div>
            </div>
          </MapMarker>

          {/* Minimalist Controls */}
          <MapControls position="bottom-right" />
        </Map>

        {/* Map Style Switcher (Default Carto, OpenStreetMap, OpenStreetMap 3D) */}
        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center bg-white/95 backdrop-blur-md rounded-xl border border-gray-200/80 shadow-md px-2.5 py-1.5 gap-1.5 transition-all hover:bg-white">
            <span className="material-symbols-outlined text-[15px] text-gray-600">layers</span>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as StyleKey)}
              className="bg-transparent text-gray-800 text-[11px] font-semibold focus:outline-none cursor-pointer pr-0.5"
              aria-label="Select Map Style"
            >
              <option value="default">Default (Carto)</option>
              <option value="openstreetmap">OpenStreetMap</option>
              <option value="openstreetmap3d">OpenStreetMap 3D</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM CARDS SECTION - Sits directly beneath the expanded map */}
      <div className="bg-surface-subtle px-4 sm:px-5 pt-3 pb-6 flex flex-col gap-3 shrink-0 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        {/* Live Distance & ETA Status Bar (Shifted below the map) */}
        <div className="bg-white rounded-2xl px-4 py-2.5 border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-active opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-active" />
            </span>
            <span className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight">
              {technicianName} is ~8 mins away
            </span>
          </div>
          <span className="text-xs font-semibold text-gray-500 font-mono bg-surface-alt px-2.5 py-0.5 rounded-full">
            2.4 km
          </span>
        </div>

        {/* Card 1: Technician Info */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Technician Avatar */}
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
              alt={technicianName}
              className="w-12 h-12 rounded-full object-cover border border-gray-100 shadow-xs"
            />
            <div className="flex flex-col">
              <h3 className="font-bold text-sm sm:text-base text-gray-900 leading-tight">
                {technicianName}
              </h3>
              <span className="text-xs font-semibold text-status-active mt-0.5">
                Verified Technician
              </span>
            </div>
          </div>

          {/* Action Buttons: Chat & Call */}
          <div className="flex items-center gap-2">
            {/* Chat Button */}
            <button
              onClick={() => setIsChatOpen(true)}
              className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-200/70 flex items-center justify-center text-primary hover:bg-primary-light/60 active:scale-95 transition-all shadow-xs cursor-pointer"
              title="Message Technician"
            >
              <span className="material-symbols-outlined text-[20px]">chat</span>
            </button>

            {/* Call Button */}
            <button
              onClick={() => setIsCallOpen(true)}
              className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-200/70 flex items-center justify-center text-primary hover:bg-primary-light/60 active:scale-95 transition-all shadow-xs cursor-pointer"
              title="Call Technician"
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
            </button>
          </div>
        </div>

        {/* Card 2: Address Information */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col items-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
            ADDRESS
          </span>
          <div className="w-full border-b border-dashed border-gray-300 mt-2 mb-2.5" />
          <div className="w-full text-left flex flex-col gap-0.5">
            <h4 className="font-bold text-sm text-gray-900">
              {customerName}, {customerPhone}
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">
              {customerAddress}
            </p>
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
      {isChatOpen && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-end justify-center p-0 animate-in fade-in duration-200">
          <div className="w-full max-w-md md:max-w-xl bg-white rounded-t-3xl p-5 shadow-2xl flex flex-col h-[65vh] animate-in slide-in-from-bottom duration-250">
            {/* Chat Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                  alt={technicianName}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">{technicianName}</span>
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
                placeholder="Type a message to James..."
                className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleSendMessage}
                className="px-3.5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-[#b91c1c] active:scale-95 transition-all cursor-pointer flex items-center justify-center"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: CALL SIMULATION */}
      {isCallOpen && (
        <div className="fixed inset-0 z-60 bg-gray-950/90 backdrop-blur-md flex flex-col items-center justify-between p-8 text-white animate-in zoom-in-95 duration-200">
          <div className="pt-12 flex flex-col items-center text-center">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
              alt={technicianName}
              className="w-24 h-24 rounded-full object-cover border-4 border-white/20 shadow-2xl mb-4"
            />
            <h2 className="text-xl font-bold">{technicianName}</h2>
            <span className="text-xs text-gray-400 mt-1">Bentley Mobile Service Lead</span>
            <span className="text-xs font-mono text-emerald-400 mt-2 font-semibold">
              00:{callDuration < 10 ? `0${callDuration}` : callDuration}
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
      {isSupportOpen && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-end justify-center p-0 animate-in fade-in duration-200">
          <div className="w-full max-w-md md:max-w-xl bg-white rounded-t-3xl p-5 shadow-2xl flex flex-col gap-3.5 animate-in slide-in-from-bottom duration-250">
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
          </div>
        </div>
      )}
    </div>
  )
}
