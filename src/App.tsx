import React, { useState } from 'react'
import { TabType, ServiceItem } from '@/types'
import { Header } from '@/components/Header'
import { BottomNav } from '@/components/BottomNav'
import { HomeTab } from '@/components/tabs/HomeTab'
import { ServicesTab } from '@/components/tabs/ServicesTab'
import { NotificationsTab } from '@/components/tabs/NotificationsTab'
import { BookingsTab } from '@/components/tabs/BookingsTab'
import { ProfileTab } from '@/components/tabs/ProfileTab'
import { ServiceDetailModal } from '@/components/tabs/ServiceDetailModal'
import { AddVehicleModal } from '@/components/tabs/AddVehicleModal'
import { BookingPage } from '@/components/BookingPage'
import { AuthScreen } from '@/components/AuthScreen'
import { SplashScreen } from '@/components/SplashScreen'
import { OnboardingScreen } from '@/components/OnboardingScreen'

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('home')
  const [previousTab, setPreviousTab] = useState<TabType>('home')
  const [showSplash, setShowSplash] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [currentVehicle, setCurrentVehicle] = useState('Audi R8 GT')
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)
  const [isAddCarOpen, setIsAddCarOpen] = useState(false)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [bookingService, setBookingService] = useState<ServiceItem | null>(null)

  const navigateToTab = (tab: TabType) => {
    setPreviousTab(currentTab)
    setCurrentTab(tab)
  }

  const handleSelectService = (service: ServiceItem) => {
    setSelectedService(service)
  }

  const handleBookNow = (service: ServiceItem) => {
    setBookingService(service)
    setSelectedService(null)
    setIsBookingOpen(true)
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
          onNext={() => {
            setShowOnboarding(false)
            setAuthMode('login')
            setShowAuth(true)
          }}
        />
      )}

      {/* 3. Launch Login & Signup Screen */}
      {showAuth && (
        <AuthScreen
          initialMode={authMode}
          onLoginSuccess={(_user) => {
            setShowAuth(false)
            setCurrentTab('home')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onSkip={() => {
            setShowAuth(false)
            setCurrentTab('home')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )}

      {/* Mobile & Tablet App Canvas */}
      <main className="w-full max-w-md md:max-w-xl min-h-screen bg-white relative shadow-2xl flex flex-col border-x border-gray-100">
        {/* Top Header (Rendered on non-home & non-bookings tabs; HomeTab & BookingsTab integrate their own headers) */}
        {currentTab !== 'home' && currentTab !== 'bookings' && (
          <Header
            currentTab={currentTab}
            onTabChange={navigateToTab}
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
            onBack={() => setCurrentTab(previousTab || 'home')}
          />
        )}

        {/* Tab Content */}
        <div className="flex-1 w-full">
          {currentTab === 'home' && (
            <HomeTab
              onSelectService={handleSelectService}
              onBookNow={handleBookNow}
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

          {currentTab === 'bookings' && (
            <BookingsTab
              onBack={() => setCurrentTab('home')}
              onBookAgain={(service) => {
                setBookingService(service)
                setIsBookingOpen(true)
              }}
              onViewServiceDetail={(service) => {
                setSelectedService(service)
              }}
              currentVehicle={currentVehicle}
            />
          )}

          {currentTab === 'notifications' && (
            <NotificationsTab onBack={() => setCurrentTab(previousTab || 'home')} />
          )}

          {currentTab === 'profile' && (
            <ProfileTab
              onBack={() => setCurrentTab('home')}
              onOpenSavedVehicles={() => setIsAddCarOpen(true)}
              onNavigateToNotifications={() => navigateToTab('notifications')}
              onOpenBooking={() => navigateToTab('bookings')}
              onLogout={() => {
                setAuthMode('login')
                setShowAuth(true)
              }}
            />
          )}
        </div>

        {/* Curved Dark Bottom Navigation */}
        <BottomNav currentTab={currentTab} onTabChange={navigateToTab} />

        {/* Full Service Detail & Order Summary Modal */}
        <ServiceDetailModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onBookNow={handleBookNow}
        />

        {/* Dedicated Full Booking Page Flow */}
        {isBookingOpen && (
          <BookingPage
            initialService={bookingService}
            currentVehicle={currentVehicle}
            onBack={() => setIsBookingOpen(false)}
            onBookingComplete={() => {
              // Redirect to home when confirmed
              setCurrentTab('home')
            }}
          />
        )}

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
