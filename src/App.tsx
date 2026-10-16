import React, { useState } from 'react'
import { TabType, ServiceItem } from '@/types'
import { Header } from '@/components/Header'
import { BottomNav } from '@/components/BottomNav'
import { HomeTab } from '@/components/tabs/HomeTab'
import { ServicesTab } from '@/components/tabs/ServicesTab'
import { NotificationsTab } from '@/components/tabs/NotificationsTab'
import { ProfileTab } from '@/components/tabs/ProfileTab'
import { ServiceDetailModal } from '@/components/tabs/ServiceDetailModal'
import { AddVehicleModal } from '@/components/tabs/AddVehicleModal'

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('home')
  const [currentVehicle, setCurrentVehicle] = useState('Audi R8 GT')
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)
  const [isAddCarOpen, setIsAddCarOpen] = useState(false)

  const handleSelectService = (service: ServiceItem) => {
    setSelectedService(service)
  }

  const handleBookNow = (service: ServiceItem) => {
    alert(`Booking confirmed for ${service.title} on ${currentVehicle}!`)
  }

  const handleVehicleAdded = (newVehicle: string) => {
    setCurrentVehicle(newVehicle)
  }

  return (
    <div className="min-h-screen w-full bg-[var(--bg-canvas)] flex justify-center selection:bg-[#dc2626] selection:text-white">
      {/* Mobile & Tablet App Canvas */}
      <main className="w-full max-w-md md:max-w-xl min-h-screen bg-white relative shadow-2xl flex flex-col border-x border-gray-100">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          showBack={currentTab === 'notifications' || currentTab === 'profile'}
          title={
            currentTab === 'notifications'
              ? 'Notification'
              : currentTab === 'profile'
              ? 'Profile'
              : currentTab === 'services'
              ? 'Services'
              : undefined
          }
          onBack={() => setCurrentTab('home')}
        />

        {/* Tab Content */}
        <div className="flex-1 w-full">
          {currentTab === 'home' && (
            <HomeTab
              onSelectService={handleSelectService}
              onAddCar={() => setIsAddCarOpen(true)}
              currentVehicle={currentVehicle}
              onSelectVehicle={setCurrentVehicle}
            />
          )}

          {currentTab === 'services' && (
            <ServicesTab
              onSelectService={handleSelectService}
              onAddCar={() => setIsAddCarOpen(true)}
              currentVehicle={currentVehicle}
            />
          )}

          {currentTab === 'notifications' && (
            <NotificationsTab onBack={() => setCurrentTab('home')} />
          )}

          {currentTab === 'profile' && (
            <ProfileTab
              onBack={() => setCurrentTab('home')}
              onOpenSavedVehicles={() => setIsAddCarOpen(true)}
            />
          )}
        </div>

        {/* Curved Dark Bottom Navigation */}
        <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />

        {/* Full Service Detail & Order Summary Modal */}
        <ServiceDetailModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onBookNow={handleBookNow}
        />

        {/* Multi-Step Add Vehicle Flow */}
        <AddVehicleModal
          isOpen={isAddCarOpen}
          onClose={() => setIsAddCarOpen(false)}
          onVehicleAdded={handleVehicleAdded}
        />
      </main>
    </div>
  )
}

export default App
