import React, { useState } from 'react'
import { ChevronLeft } from 'lucide-react'

interface OrderTrackingMapPageProps {
  onBack: () => void
  serviceTitle?: string
  serviceCategory?: string
  customerName?: string
  customerPhone?: string
  customerAddress?: string
  technicianName?: string
}

export const OrderTrackingMapPage: React.FC<OrderTrackingMapPageProps> = ({
  onBack,
  serviceTitle = 'Car Wash',
  serviceCategory = 'Exterior Cleaning',
  customerName = 'Steve Miller',
  customerPhone = '998 877 5561',
  customerAddress = '21/22, 5th Avenue, Jamesford Road, Ontario,\nCanada',
  technicianName = 'James Marlo',
}) => {
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
    <div className="fixed inset-0 z-50 bg-[#f7f9fb] flex flex-col justify-between overflow-y-auto max-w-md md:max-w-xl mx-auto shadow-2xl animate-in slide-in-from-right duration-250">
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
          <h1 className="text-base sm:text-lg font-bold text-[#16a34a] tracking-tight leading-tight">
            Technician is Arriving
          </h1>
        </div>

        {/* Empty placeholder to center title */}
        <div className="w-10" />
      </div>

      {/* 2. INTERACTIVE VECTOR MAP SECTION */}
      <div className="relative w-full h-[320px] sm:h-[360px] bg-[#ebf1f5] overflow-hidden select-none border-b border-gray-200/50">
        <svg
          className="w-full h-full object-cover"
          viewBox="0 0 400 340"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base Map City Ground */}
          <rect width="400" height="340" fill="#eef2f5" />

          {/* Green Park Areas */}
          {/* Park 1: Top Left */}
          <path d="M -10,-10 L 125,-10 L 110,65 L -10,80 Z" fill="#c3edb6" />
          {/* Park 2: Mid Left */}
          <path d="M 20,120 L 75,108 L 85,155 L 15,165 Z" fill="#c3edb6" />
          {/* Park 3: Center Mid */}
          <path d="M 130,115 L 178,115 L 185,152 L 140,165 Z" fill="#c3edb6" />
          {/* Park 4: Center Bottom */}
          <path d="M 110,210 L 170,180 L 180,240 L 120,255 Z" fill="#c3edb6" />
          {/* Park 5: Bottom Left */}
          <path d="M -10,230 L 60,205 L 75,270 L -10,290 Z" fill="#c3edb6" />
          {/* Park 6: Top Right Block */}
          <path d="M 280,30 L 375,0 L 410,80 L 325,120 Z" fill="#c3edb6" />
          {/* Park 7: Mid Right Block */}
          <path d="M 260,190 L 335,160 L 380,230 L 290,265 Z" fill="#c3edb6" />
          {/* Park 8: Bottom Right */}
          <path d="M 270,270 L 380,250 L 410,320 L 295,350 Z" fill="#c3edb6" />

          {/* Secondary White City Streets Network */}
          <g stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
            {/* Horizontal / Diagonal local streets */}
            <path d="M -10,40 L 120,30 L 260,125 L 360,95 L 410,110" />
            <path d="M -10,105 L 110,95 L 150,170 L 240,140" />
            <path d="M 30,140 L 110,140 L 115,115" />
            <path d="M -10,180 L 30,140" />
            <path d="M 30,140 L 70,220 L 140,200 L 270,300" />
            <path d="M 10,270 L 120,240 L 170,310 L 290,270" />
            <path d="M 160,80 L 280,30 L 380,50" />
            <path d="M 230,170 L 360,140 L 410,180" />
            <path d="M 280,220 L 410,180" />
            <path d="M 220,280 L 360,240 L 410,280" />
            <path d="M 80,0 L 95,110 L 80,180" />
            <path d="M 140,50 L 150,120 L 135,210" />
            <path d="M 210,0 L 220,90 L 200,160" />
            <path d="M 320,0 L 340,100 L 330,180" />
            <path d="M 380,80 L 390,200 L 370,300" />
          </g>

          {/* Blue Diagonal River */}
          <path
            d="M 370,-30 Q 330,60 260,155 T 90,360"
            stroke="#38bdf8"
            strokeWidth="26"
            fill="none"
            strokeLinecap="round"
          />
          {/* River Water Texture / Inner Stream */}
          <path
            d="M 370,-30 Q 330,60 260,155 T 90,360"
            stroke="#0284c7"
            strokeWidth="2"
            fill="none"
            strokeDasharray="8 12"
            opacity="0.4"
          />

          {/* White Bridge Crossings */}
          <line x1="245" y1="140" x2="275" y2="170" stroke="#ffffff" strokeWidth="8" strokeLinecap="square" />
          <line x1="160" y1="230" x2="190" y2="260" stroke="#ffffff" strokeWidth="8" strokeLinecap="square" />

          {/* Primary Golden / Orange Arterial Avenues */}
          <g stroke="#f6ad55" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 125,-10 L 105,100 L 145,210 L 165,350" strokeWidth="7" />
            <path d="M -10,38 L 260,125 L 410,20" strokeWidth="5.5" />
            <path d="M 245,60 L 395,130" strokeWidth="6" />
            <path d="M 50,340 L 410,125" strokeWidth="5.5" />
          </g>

          {/* ROUTE POLYLINE (From starting point to customer location) */}
          <path
            d="M -10,180 L 30,140 L 70,150 L 105,140 L 115,115"
            stroke="#111827"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* DESTINATION PIN (Matches attached image) */}
          <g transform="translate(115, 100)">
            {/* Animated Beacon Ping */}
            <circle cx="0" cy="0" r="12" fill="#ef4444" opacity="0.35" className="animate-ping" />
            <circle cx="0" cy="0" r="6" fill="#ef4444" opacity="0.4" />

            {/* Red Teardrop Location Pin */}
            <path
              d="M 0,-18 C -7,-18 -12,-13 -12,-6 C -12,2 0,10 0,10 C 0,10 12,2 12,-6 C 12,-13 7,-18 0,-18 Z"
              fill="#dc2626"
              filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.3))"
            />
            {/* Pin Center White Dot */}
            <circle cx="0" cy="-7" r="4.5" fill="#ffffff" />
            <circle cx="0" cy="-7" r="2.2" fill="#dc2626" />

            {/* Red destination dot on street */}
            <circle cx="0" cy="14" r="2.5" fill="#dc2626" />
          </g>

          {/* Current Technician Van Position on Route */}
          <g transform="translate(30, 140)">
            <circle cx="0" cy="0" r="14" fill="#16a34a" opacity="0.25" className="animate-pulse" />
            <circle cx="0" cy="0" r="8" fill="#16a34a" stroke="#ffffff" strokeWidth="2" />
          </g>
        </svg>

        {/* Live Distance & ETA Floating Badge */}
        <div className="absolute top-3 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-gray-200/80 shadow-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold text-gray-900 tracking-tight">
            James is ~8 mins away
          </span>
          <span className="text-[10px] text-gray-400 font-medium font-mono">• 2.4 km</span>
        </div>

        {/* Map Control Buttons (Recenter & Zoom) */}
        <div className="absolute bottom-3 right-4 flex flex-col gap-1.5">
          <button
            onClick={() => alert('Centering on technician vehicle')}
            className="w-9 h-9 rounded-xl bg-white shadow-md border border-gray-200/80 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
            title="Recenter"
          >
            <span className="material-symbols-outlined text-[19px] text-[#dc2626]">
              my_location
            </span>
          </button>
        </div>
      </div>

      {/* 3. BOTTOM CARDS SECTION */}
      <div className="bg-[#f7f9fb] px-4 sm:px-5 py-4 flex flex-col gap-3 flex-1 justify-end">
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
              <span className="text-xs font-semibold text-[#16a34a] mt-0.5">
                Verified Technician
              </span>
            </div>
          </div>

          {/* Action Buttons: Chat & Call */}
          <div className="flex items-center gap-2">
            {/* Chat Button */}
            <button
              onClick={() => setIsChatOpen(true)}
              className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-200/70 flex items-center justify-center text-[#dc2626] hover:bg-red-50/60 active:scale-95 transition-all shadow-xs cursor-pointer"
              title="Message Technician"
            >
              <span className="material-symbols-outlined text-[20px]">chat</span>
            </button>

            {/* Call Button */}
            <button
              onClick={() => setIsCallOpen(true)}
              className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-200/70 flex items-center justify-center text-[#dc2626] hover:bg-red-50/60 active:scale-95 transition-all shadow-xs cursor-pointer"
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
            <div className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-200/70 flex items-center justify-center text-[#dc2626] shadow-xs">
              <span className="material-symbols-outlined text-[22px]">support_agent</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-[#dc2626] leading-tight">
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
          <div className="w-full max-w-md bg-white rounded-t-3xl p-5 shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-250">
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
                        ? 'bg-[#dc2626] text-white rounded-br-xs'
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
                className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#dc2626]"
              />
              <button
                onClick={handleSendMessage}
                className="px-3.5 py-2.5 rounded-xl bg-[#dc2626] text-white text-xs font-bold hover:bg-[#b91c1c] active:scale-95 transition-all cursor-pointer flex items-center justify-center"
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
          <div className="w-full max-w-md bg-white rounded-t-3xl p-5 shadow-2xl flex flex-col gap-3.5 animate-in slide-in-from-bottom duration-250">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#dc2626] text-[22px]">
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
              className="w-full py-3 rounded-xl bg-[#dc2626] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#b91c1c] active:scale-98 transition-all shadow-sm"
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
