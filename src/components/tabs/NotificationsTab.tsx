import React from 'react'
import { NOTIFICATIONS_DATA } from '@/data/mockData'

interface NotificationsTabProps {
  onBack: () => void
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col w-full pb-28 px-5">

      <div className="mt-4 flex flex-col gap-4">
        <span className="text-xs font-semibold text-gray-800">May 30</span>

        {NOTIFICATIONS_DATA.map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-2xl bg-[#f4f4f5] border-l-4 border-l-[#dc2626] flex flex-col gap-1 shadow-sm"
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
