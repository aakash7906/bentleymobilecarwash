import React, { useState } from 'react'
import { TabType } from '@/types'
import { Header } from '@/components/Header'
import { BottomNav } from '@/components/BottomNav'
import { ServicesTab } from '@/components/tabs/ServicesTab'
import { TrackingTab } from '@/components/tabs/TrackingTab'
import { GarageTab } from '@/components/tabs/GarageTab'
import { OpsHubTab } from '@/components/tabs/OpsHubTab'
import { BookingModal } from '@/components/BookingModal'
import { BroadcastModal } from '@/components/BroadcastModal'

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('services')
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false)
  const [bookingPackageId, setBookingPackageId] = useState('supreme-detail')
  const [activeBookingId, setActiveBookingId] = useState('#BM-6492')
  const [alertBannerVisible, setAlertBannerVisible] = useState(true)

  const handleOpenBooking = (pkgId: string = 'supreme-detail') => {
    setBookingPackageId(pkgId)
    setIsBookingOpen(true)
  }

  const handleConfirmBooking = (bookingData: {
    packageId: string
    packageName: string
    price: number
    date: string
    timeSlot: string
    vehicle: string
    address: string
    notes: string
  }) => {
    // Generate new unique booking ID
    const newId = '#BM-' + Math.floor(1000 + Math.random() * 9000)
    setActiveBookingId(newId)
    // Automatically transition to Tracking tab to show live technician route
    setCurrentTab('tracking')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen w-full bg-[var(--bg-canvas)] flex justify-center selection:bg-[var(--color-primary)] selection:text-white">
      {/* Mobile & Tablet App Canvas */}
      <main className="w-full max-w-md md:max-w-xl min-h-screen bg-[var(--bg-app)] relative shadow-2xl flex flex-col border-x border-[var(--border-light)]">
        {/* Sticky App Header */}
        <Header
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          activeBookingId={activeBookingId}
        />

        {/* Global Dispatcher Live Alert Strip (Optional) */}
        {currentTab === 'ops' && alertBannerVisible && (
          <div className="bg-red-600 text-white text-[11px] font-bold px-4 py-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              <span>Lake Country: 1 unassigned VIP booking requires tech allocation</span>
            </span>
            <button
              onClick={() => setAlertBannerVisible(false)}
              className="text-white/80 hover:text-white cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Tab Content Container */}
        <div className="flex-1 p-3.5 sm:p-4">
          {currentTab === 'services' && (
            <ServicesTab
              onOpenBooking={handleOpenBooking}
              onQuickInquiry={() => window.open('tel:+12503519155')}
            />
          )}

          {currentTab === 'tracking' && (
            <TrackingTab />
          )}

          {currentTab === 'garage' && (
            <GarageTab
              onScheduleForVehicle={handleOpenBooking}
            />
          )}

          {currentTab === 'ops' && (
            <OpsHubTab
              onSwitchToClient={() => setCurrentTab('services')}
              onNewBooking={() => handleOpenBooking('supreme-detail')}
              onBroadcastAlert={() => setIsBroadcastOpen(true)}
            />
          )}
        </div>

        {/* Bottom Navigation */}
        <BottomNav
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          trackingActive={true}
          pendingOpsCount={3}
        />

        {/* Interactive Booking Modal */}
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          initialPackageId={bookingPackageId}
          onConfirmBooking={handleConfirmBooking}
        />

        {/* Fleet Broadcast Modal */}
        <BroadcastModal
          isOpen={isBroadcastOpen}
          onClose={() => setIsBroadcastOpen(false)}
        />
      </main>
    </div>
  )
}

export default App
