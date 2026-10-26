import React from 'react'
import { BookingRecord } from '@/types'
import { NOTIFICATIONS_DATA } from '@/data/mockData'
import { Bell, Calendar, CheckCircle2, Navigation, Sparkles } from 'lucide-react'

interface NotificationsTabProps {
  onBack: () => void
  bookings?: BookingRecord[]
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({ bookings = [] }) => {
  // Generate dynamic live notifications based on user bookings
  const liveBookingNotifications = bookings.slice(0, 5).map((b) => {
    let icon = Calendar
    let title = `Booking Scheduled: ${b.title}`
    let desc = `Scheduled for ${b.vehicle} at ${b.address} (${b.date} at ${b.time}).`
    let time = b.date || 'Recent'

    if (b.status === 'en_route') {
      icon = Navigation
      title = `Technician En Route!`
      desc = `${b.driverName || b.technicianName || 'Your technician'} is on the way to ${b.address} with the mobile detailing unit.`
      time = 'Live now'
    } else if (b.status === 'in_progress') {
      icon = Sparkles
      title = `Wash In Progress`
      desc = `Service underway on your ${b.vehicle}. Foam wash and detailing active.`
      time = 'In Progress'
    } else if (b.status === 'completed') {
      icon = CheckCircle2
      title = `Service Completed: ${b.title}`
      desc = `Your ${b.vehicle} is spotless and protected. Thank you for choosing Bentley!`
      time = b.date || 'Completed'
    }

    return {
      id: `live-${b.id}`,
      title,
      description: desc,
      time,
      icon,
      isLive: true,
    }
  })

  return (
    <div className="flex flex-col w-full pb-28 screen-padding">
      {/* Dynamic Activity Header */}
      <div className="mt-3 flex items-center justify-between pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-gray-900">Activity &amp; Updates</h2>
        </div>
        <span className="text-[11px] text-gray-400">
          {liveBookingNotifications.length + NOTIFICATIONS_DATA.length} alerts
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3.5">
        {liveBookingNotifications.length > 0 && (
          <>
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Live Order Activity
            </span>

            {liveBookingNotifications.map((item) => {
              const IconComp = item.icon
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-white border border-gray-200/90 shadow-xs flex items-start gap-3 hover:border-primary/40 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <IconComp className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="flex flex-col flex-1 gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-gray-900">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-primary font-bold font-mono">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </>
        )}

        <span className="text-xs font-semibold text-gray-700 mt-2">
          System &amp; Care Announcements
        </span>

        {NOTIFICATIONS_DATA.map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-2xl bg-surface-alt border border-gray-200/60 flex flex-col gap-1 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-gray-900">
                {item.title}
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                {item.time}
              </span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
