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
import { SplashScreen } from '@/components/SplashScreen'
import { OnboardingScreen } from '@/components/OnboardingScreen'

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('home')
  const [showSplash, setShowSplash] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
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
      {/* 1. Launch Splash Screen (Fixed 375x812 iPhone Layout) */}
      {showSplash && (
        <SplashScreen
          onFinish={() => {
            setShowSplash(false)
            setShowOnboarding(true)
          }}
          duration={2800}
          dismissible={true}
        />
      )}

      {/* 2. Launch Onboarding Screen (Drag-to-Right Next Slider) */}
      {showOnboarding && (
        <OnboardingScreen
          onNext={() => setShowOnboarding(false)}
        />
      )}

      {/* Mobile & Tablet App Canvas */}
      <main className="w-full max-w-md md:max-w-xl min-h-screen bg-white relative shadow-2xl flex flex-col border-x border-gray-100">
        {/* Top Header (Rendered on non-home tabs; HomeTab integrates the logo seamlessly into the top blueprint grid) */}
        {currentTab !== 'home' && (
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
        )}

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
              onSelectVehicle={setCurrentVehicle}
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
