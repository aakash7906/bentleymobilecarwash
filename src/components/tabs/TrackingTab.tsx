import React, { useState } from 'react'
import { TRACKING_TIMELINE_STAGES, BUSINESS_INFO } from '@/data/mockData'

interface TrackingTabProps {
  onCallTech?: () => void
  onMessageTech?: () => void
}

export const TrackingTab: React.FC<TrackingTabProps> = () => {
  const [smsAlerts, setSmsAlerts] = useState(true)
  const [pushPings, setPushPings] = useState(true)
  const [isCalling, setIsCalling] = useState(false)
  const [isMessaging, setIsMessaging] = useState(false)
  const [messageSent, setMessageSent] = useState(false)
  const [chatInput, setChatInput] = useState('')

  const handleCall = () => {
    setIsCalling(true)
    setTimeout(() => {
      window.open(`tel:${BUSINESS_INFO.phoneTel}`)
      setIsCalling(false)
    }, 400)
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    setMessageSent(true)
    setChatInput('')
    setTimeout(() => setMessageSent(false), 3000)
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* 1. TECH UPDATE LIVE GPS ALERT BANNER (Exact dark banner from screenshot) */}
      <div className="app-card-dark p-3.5 sm:p-4 shadow-lg flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-600/20 text-[var(--color-primary)] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">notifications_active</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-white">
                  Tech Update: Raheem is on the way!
                </span>
                <span className="badge-pill bg-red-600 text-white text-[9px] px-1.5 py-0.2 font-mono">
                  LIVE GPS
                </span>
              </div>
              <span className="text-[11px] text-[var(--text-on-dark-muted)]">
                Live tracking active • Estimated arrival at 10:56 AM
              </span>
            </div>
          </div>
        </div>

        {/* SMS & Push Toggle row */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-white/90">
          <label className="flex items-center gap-2 cursor-pointer">
            <span>SMS Alerts</span>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="accent-[var(--color-primary)] cursor-pointer w-4 h-4 rounded"
            />
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <span>Push Pings</span>
            <input
              type="checkbox"
              checked={pushPings}
              onChange={(e) => setPushPings(e.target.checked)}
              className="accent-[var(--color-primary)] cursor-pointer w-4 h-4 rounded"
            />
          </label>
        </div>
      </div>

      {/* 2. LIVE INTERACTIVE MAP CARD WITH REALISTIC KELOWNA ROUTE */}
      <div className="app-card overflow-hidden shadow-md flex flex-col border border-[var(--border-light)]">
        {/* Top Status Bar inside map container */}
        <div className="bg-white px-4 py-2.5 border-b border-[var(--border-light)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
            </span>
            <span className="material-symbols-outlined text-[15px] text-[var(--color-primary)]">
              schedule
            </span>
            <span>Arriving in 14 mins (2.4 km away)</span>
          </div>

          <button
            title="Recenter GPS"
            className="w-7 h-7 rounded-full bg-[var(--surface-alt)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">my_location</span>
          </button>
        </div>

        {/* Map Canvas Visual (High precision Kelowna downtown grid with route path) */}
        <div className="relative h-64 sm:h-72 w-full bg-[#eef1f4] overflow-hidden">
          {/* Kelowna City SVG Grid Simulation */}
          <svg
            className="w-full h-full object-cover"
            viewBox="0 0 400 240"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Water body (Okanagan Lake) on the left */}
            <path
              d="M 0,0 L 55,0 Q 65,120 40,240 L 0,240 Z"
              fill="#cbe3f7"
              stroke="#b5d6f2"
              strokeWidth="1"
            />
            <text x="12" y="125" fill="#588ab2" fontSize="9" fontWeight="bold" transform="rotate(-90 12,125)">
              OKANAGAN LAKE
            </text>

            {/* City Blocks & Road Grid */}
            <rect x="70" y="20" width="80" height="50" rx="4" fill="#ffffff" stroke="#e0e4e9" />
            <rect x="160" y="20" width="90" height="50" rx="4" fill="#ffffff" stroke="#e0e4e9" />
            <rect x="260" y="20" width="120" height="50" rx="4" fill="#ffffff" stroke="#e0e4e9" />

            <rect x="70" y="80" width="80" height="60" rx="4" fill="#ffffff" stroke="#e0e4e9" />
            <rect x="160" y="80" width="90" height="60" rx="4" fill="#ffffff" stroke="#e0e4e9" />
            <rect x="260" y="80" width="120" height="60" rx="4" fill="#ffffff" stroke="#e0e4e9" />

            <rect x="70" y="150" width="80" height="70" rx="4" fill="#ffffff" stroke="#e0e4e9" />
            <rect x="160" y="150" width="90" height="70" rx="4" fill="#ffffff" stroke="#e0e4e9" />
            <rect x="260" y="150" width="120" height="70" rx="4" fill="#ffffff" stroke="#e0e4e9" />

            {/* Street Names */}
            <text x="80" y="16" fill="#88929e" fontSize="7" fontWeight="bold">HIGHWAY 97</text>
            <text x="165" y="16" fill="#88929e" fontSize="7" fontWeight="bold">BERNARD AVE</text>
            <text x="68" y="105" fill="#88929e" fontSize="7" fontWeight="bold" transform="rotate(90 68,105)">WATER ST</text>

            {/* Animated Dashed Route Line */}
            <path
              d="M 130,195 L 130,85 L 290,85"
              fill="none"
              stroke="#d31826"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray="6,4"
              className="animate-pulse"
            />

            {/* Start Pin: Destination (Water St) */}
            <circle cx="130" cy="195" r="7" fill="#111418" stroke="#ffffff" strokeWidth="2" />
            <text x="130" y="198" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">1</text>
            <rect x="85" y="205" width="90" height="15" rx="3" fill="#111418" />
            <text x="130" y="215" fill="#ffffff" fontSize="6.5" fontWeight="bold" textAnchor="middle">
              1480 Water St (Porsche)
            </text>

            {/* End Pin: Mobile Van #04 with pulsating beacon */}
            <circle cx="210" cy="85" r="14" fill="rgba(211,24,38,0.2)" className="animate-ping" />
            <circle cx="210" cy="85" r="8" fill="#d31826" stroke="#ffffff" strokeWidth="2" />
            <rect x="165" y="58" width="90" height="16" rx="3" fill="#111418" />
            <text x="210" y="69" fill="#ffffff" fontSize="6.5" fontWeight="bold" textAnchor="middle">
              Bentley Mobile Van #04
            </text>
          </svg>

          {/* Floating Driver Profile Overlay inside Map Container */}
          <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3 rounded-[var(--radius-box-sm)] border border-[var(--border-light)] shadow-lg flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-[var(--border-light)] shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                    alt="Raheem - Lead Detailer"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[var(--status-green)] border-2 border-white" />
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-[var(--text-main)]">Raheem</span>
                    <span className="badge-pill bg-[var(--color-primary-light)] text-[var(--color-primary)] text-[9px] font-extrabold px-1.5 py-0.2 border border-[var(--color-primary-border)]">
                      PRO DETAILER
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    ★ 4.98 (340+ washes) • Van #04 (Ford Transit)
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Tech Contact Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCall}
                className="btn-primary py-2 text-xs font-bold active:scale-95"
              >
                <span className="material-symbols-outlined text-[15px]">call</span>
                <span>{isCalling ? 'Connecting...' : 'Call Tech'}</span>
              </button>

              <button
                onClick={() => setIsMessaging(!isMessaging)}
                className="btn-secondary py-2 text-xs font-bold active:scale-95"
              >
                <span className="material-symbols-outlined text-[15px]">chat</span>
                <span>Message</span>
              </button>
            </div>

            {/* Quick in-app message drawer if toggled */}
            {isMessaging && (
              <form onSubmit={handleSendMessage} className="pt-2 border-t border-[var(--border-subtle)] flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Note for Raheem..."
                  className="app-input px-2.5 py-1.5 text-xs flex-1"
                />
                <button type="submit" className="btn-primary px-3 py-1.5 text-xs font-bold">
                  Send
                </button>
              </form>
            )}
            {messageSent && (
              <span className="text-[10px] text-emerald-600 font-bold self-center">
                ✓ Message dispatched directly to Raheem's mobile rig tablet!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. 100% MOBILE & SELF-CONTAINED UNIT CARD */}
      <div className="app-card p-3.5 sm:p-4 flex items-start gap-3 border border-[var(--border-light)]">
        <div className="w-9 h-9 rounded-[var(--radius-box-sm)] bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[20px]">water_drop</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <h3 className="text-xs sm:text-sm font-extrabold text-[var(--text-main)]">
            100% Mobile &amp; Self-Contained Unit
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            Bentley Mobile Van #04 carries on-board deionized spot-free water, whisper-quiet generators, and biodegradable cleaning compounds. No water or power hookup needed from your residence.
          </p>
        </div>
      </div>

      {/* 4. SERVICE REAL-TIME TIMELINE (Exact replica from screenshot) */}
      <div className="app-card p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-extrabold text-[var(--text-main)]">
            Service Real-Time Timeline
          </h3>
          <span className="badge-pill bg-[var(--color-primary-light)] text-[var(--color-primary)] text-[10px] font-bold px-2 py-0.5 border border-[var(--color-primary-border)]">
            Stage 2 of 5
          </span>
        </div>

        <div className="flex flex-col relative pl-2">
          {TRACKING_TIMELINE_STAGES.map((stage, idx) => {
            const isLast = idx === TRACKING_TIMELINE_STAGES.length - 1

            return (
              <div key={stage.id} className="flex items-start gap-3 relative pb-4 last:pb-0">
                {/* Connecting Vertical Line */}
                {!isLast && (
                  <div
                    className={`absolute left-[13px] top-6 bottom-0 w-0.5 ${
                      stage.completed ? 'bg-[var(--text-main)]' : 'bg-[var(--border-light)]'
                    }`}
                  />
                )}

                {/* Stage Indicator Node */}
                <div className="relative z-10 shrink-0">
                  {stage.completed ? (
                    <div className="w-7 h-7 rounded-full bg-[var(--text-main)] text-white flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[15px]">check</span>
                    </div>
                  ) : stage.active ? (
                    <div className="relative flex items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-red-400 opacity-75" />
                      <div className="relative w-7 h-7 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-md">
                        <span className="w-2.5 h-2.5 rounded-full bg-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-white border border-[var(--border-light)] text-[var(--text-light)] flex items-center justify-center text-xs font-bold">
                      {stage.id}
                    </div>
                  )}
                </div>

                {/* Stage Text Content */}
                <div
                  className={`flex flex-col flex-1 ${
                    stage.active
                      ? 'p-3 rounded-[var(--radius-box-sm)] bg-[var(--color-primary-light)] border border-[var(--color-primary-border)]'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-extrabold ${
                          stage.active ? 'text-[var(--color-primary)]' : 'text-[var(--text-main)]'
                        }`}
                      >
                        {stage.title}
                      </span>
                      {stage.active && (
                        <span className="badge-pill bg-[var(--color-primary)] text-white text-[9px] px-1.5 py-0.2">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--text-light)] font-mono font-medium">
                      {stage.time}
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                    {stage.subtitle}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 5. ACTIVE BOOKING SUMMARY CARD */}
      <div className="app-card p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
            Active Booking
          </span>
          <span className="badge-pill bg-[var(--surface-alt)] text-[var(--text-main)] text-[10px] px-2 py-0.5 font-mono font-bold">
            BC • 924-KNA
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-black text-[var(--text-main)]">
          2023 Porsche Macan GTS
        </h3>

        {/* Inner package card */}
        <div className="app-card-subtle p-3.5 rounded-[var(--radius-box-sm)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[var(--radius-box-sm)] bg-[var(--color-primary)] text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[19px]">local_car_wash</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[var(--text-main)]">
                Supreme Wash Package
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                Exterior + Spot-Free + Triple Shine + Undercarriage
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-black text-[var(--text-main)] font-mono">$170</span>
            <span className="text-[9px] font-extrabold text-[var(--color-primary)] tracking-tight">
              PAID ONLINE
            </span>
          </div>
        </div>

        {/* Feature Tags (Code / Mono Pill style from screenshot) */}
        <div className="flex flex-wrap gap-1.5">
          {[
            'Exterior Hand Wash',
            'Tire Shine & Rim Scrub',
            'Triple Shine Polish',
            'Dash & Console Wipe',
            'Undercarriage Spray',
          ].map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-mono px-2 py-1 rounded bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Service Location */}
        <div className="flex items-start gap-2 text-xs pt-1 border-t border-[var(--border-subtle)]">
          <span className="material-symbols-outlined text-[16px] text-[var(--color-primary)] shrink-0 mt-0.5">
            location_on
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-[var(--text-light)]">
              Service Location
            </span>
            <span className="font-bold text-[var(--text-main)]">
              1480 Water St, Kelowna, BC V1Y 1J7
            </span>
          </div>
        </div>

        {/* Technician Special Notes */}
        <div className="p-3 rounded-[var(--radius-box-sm)] bg-[var(--surface-subtle)] border border-[var(--border-light)] flex items-start gap-2">
          <span className="material-symbols-outlined text-[16px] text-[var(--text-muted)] shrink-0 mt-0.5">
            key
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-[var(--text-light)]">
              Technician Special Notes
            </span>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
              "Key left in drop pouch by front door / park mobile unit directly in right bay of driveway."
            </p>
          </div>
        </div>

        {/* Footer Guarantee & Reschedule Row */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-xs">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <span className="material-symbols-outlined text-[16px] text-[var(--color-primary)]">
              verified_user
            </span>
            <span className="text-[11px] font-semibold">Bentley Quality Guarantee</span>
          </div>

          <a
            href={`tel:${BUSINESS_INFO.phoneTel}`}
            className="text-[11px] font-bold text-[var(--color-primary)] hover:underline flex items-center gap-0.5"
          >
            <span>Need to reschedule? Call office</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </a>
        </div>
      </div>
    </div>
  )
}
