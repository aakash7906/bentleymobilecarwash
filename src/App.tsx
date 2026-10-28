import React, { useState, useEffect } from 'react'
import { TabType, ServiceItem } from '@/types'
import { Header } from '@/components/Header'
import { BottomNav } from '@/components/BottomNav'

// Direct Page & Modal Imports
import { HomeTab } from '@/pages/Tabs/HomeTab'
import { ServicesTab } from '@/pages/Tabs/ServicesTab'
import { NotificationsTab } from '@/pages/Tabs/NotificationsTab'
import { BookingsTab } from '@/pages/Tabs/BookingsTab'
import { ProfileTab } from '@/pages/Tabs/ProfileTab'
import { AddVehicleModal } from '@/pages/Tabs/AddVehicleModal'
import { ServiceDetailModal } from '@/pages/Service/ServiceDetailModal'
import { BookingPage } from '@/pages/Booking/BookingPage'
import { SavedVehiclesModal } from '@/pages/Profile/SavedVehiclesModal'
import { Login } from '@/pages/Auth/LoginPage'
import { Signup } from '@/pages/Auth/SignupPage'
import { SplashScreen } from '@/pages/Auth/SplashScreen'
import { OnboardingScreen } from '@/pages/Auth/OnboardingPage'
import { ContactUsPage } from '@/pages/Contact/ContactUsPage'
import { AboutUsPage } from '@/pages/About/AboutUsPage'
import { DriverDashboard } from '@/pages/Driver/DriverDashboardPage'

// Context Providers & Custom Hooks
import {
  ToastProvider,
  Toaster,
  AuthProvider,
  VehicleProvider,
  BookingProvider,
  CartProvider,
  useAuth,
  useVehicles,
  useBookings,
  useCart,
} from '@/context'

const AppContent: React.FC = () => {
  // 1. Domain Contexts
  const {
    currentUser,
    isAuthLoading,
    isResolvingRole,
    currentRole,
    setCurrentRole,
    authMode,
    setAuthMode,
    userProfileData,
    driverProfile,
    detectedAddress,
    detectedCity,
    detectedPostalCode,
    handleUpdateGlobalLocation,
    handleUpdateProfile,
    handleUpdateDriverProfile,
    handleLogout,
    handleDeleteAccount,
  } = useAuth()

  const {
    savedVehicles,
    currentVehicle,
    handleVehicleAdded,
    handleSelectVehicle,
    handleDeleteVehicle,
  } = useVehicles()

  const {
    bookings,
    handleBookingComplete,
    handleCancelBooking,
    handleRescheduleBooking,
    handleRateBooking,
    handleAcceptOrder,
    handleUpdateBookingStatus,
  } = useBookings()

  const {
    cartItems,
    handleAddToCart,
    handleUpdateCartQuantity,
    handleRemoveCartItem,
    handleClearCart,
    handleCheckoutOrder,
  } = useCart()

  // 2. Local Navigation & Modal UI State
  const [currentTab, setCurrentTab] = useState<TabType>(() => {
    try {
      const stored = localStorage.getItem('bentley_current_tab')
      if (stored && ['home', 'services', 'notifications', 'bookings', 'profile'].includes(stored)) {
        return stored as TabType
      }
    } catch {}
    return 'home'
  })
  const [previousTab, setPreviousTab] = useState<TabType>('home')

  const [showSplash, setShowSplash] = useState(() => {
    try {
      return sessionStorage.getItem('bentley_splash_shown') !== 'true'
    } catch {
      return false
    }
  })

  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return localStorage.getItem('bentley_onboarded') !== 'true'
    } catch {
      return false
    }
  })

  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)
  const [isAddCarOpen, setIsAddCarOpen] = useState(false)
  const [isSavedVehiclesOpen, setIsSavedVehiclesOpen] = useState(false)
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bentley_booking_open') === 'true'
    } catch {
      return false
    }
  })

  const [bookingService, setBookingService] = useState<ServiceItem | null>(() => {
    try {
      const stored = localStorage.getItem('bentley_booking_service')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [_isMembershipOpen, setIsMembershipOpen] = useState(false)
  const [isContactUsOpen, setIsContactUsOpen] = useState(false)
  const [isAboutUsOpen, setIsAboutUsOpen] = useState(false)

  // Sync currentTab with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bentley_current_tab', currentTab)
    } catch {}
  }, [currentTab])

  // Sync isBookingOpen with localStorage
  useEffect(() => {
    try {
      if (isBookingOpen) {
        localStorage.setItem('bentley_booking_open', 'true')
      } else {
        localStorage.removeItem('bentley_booking_open')
      }
    } catch {}
  }, [isBookingOpen])

  // Sync bookingService with localStorage
  useEffect(() => {
    try {
      if (bookingService) {
        localStorage.setItem('bentley_booking_service', JSON.stringify(bookingService))
      } else {
        localStorage.removeItem('bentley_booking_service')
      }
    } catch {}
  }, [bookingService])

  const isAuthenticated = Boolean(currentUser)
  const isAppReady =
    !showSplash && !showOnboarding && !isAuthLoading && !isResolvingRole && isAuthenticated
  const showAuthScreen =
    !showSplash && !showOnboarding && !isAuthLoading && (!isAuthenticated || isResolvingRole)

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
  return (
    <div className="min-h-screen w-full bg-white flex justify-center selection:bg-primary selection:text-primary-foreground">
      {/* 1. Launch Splash Screen */}
      {showSplash && (
        <SplashScreen
          onFinish={() => {
            setShowSplash(false)
            try {
              sessionStorage.setItem('bentley_splash_shown', 'true')
            } catch {}
          }}
          duration={2400}
          dismissible={true}
        />
      )}

      {/* 2. Launch Onboarding Screen */}
      {showOnboarding && (
        <OnboardingScreen
          onNext={() => {
            setShowOnboarding(false)
            try {
              localStorage.setItem('bentley_onboarded', 'true')
            } catch {}
            setAuthMode('login')
          }}
        />
      )}

      {/* 3. Launch Login & Signup Screen */}
      {showAuthScreen && authMode === 'login' && (
        <Login
          initialRole={currentRole}
          onRoleChange={(role) => {
            setCurrentRole(role)
            try {
              localStorage.setItem('bentley_current_role', role)
            } catch {}
          }}
          onLoginSuccess={(user) => {
            if (user?.role === 'driver') {
              setCurrentRole('driver')
              try {
                localStorage.setItem('bentley_current_role', 'driver')
                localStorage.setItem('bentley_driver_current_tab', 'orders')
                localStorage.setItem('bentley_driver_orders_subtab', 'available')
                localStorage.removeItem('bentley_driver_profile_open')
                localStorage.removeItem('bentley_driver_map_booking_id')
              } catch {}
            } else {
              setCurrentRole('customer')
              setCurrentTab('home')
              try {
                localStorage.setItem('bentley_current_role', 'customer')
              } catch {}
            }
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onSwitchToSignup={(role) => {
            if (role) {
              setCurrentRole(role)
              try {
                localStorage.setItem('bentley_current_role', role)
              } catch {}
            }
            setCurrentTab('home')
            setAuthMode('signup')
          }}
        />
      )}

      {showAuthScreen && authMode === 'signup' && (
        <Signup
          initialRole={currentRole}
          onRoleChange={(role) => {
            setCurrentRole(role)
            try {
              localStorage.setItem('bentley_current_role', role)
            } catch {}
          }}
          onSignupSuccess={(user) => {
            if (user?.role === 'driver') {
              setCurrentRole('driver')
              try {
                localStorage.setItem('bentley_current_role', 'driver')
                localStorage.setItem('bentley_driver_current_tab', 'orders')
                localStorage.setItem('bentley_driver_orders_subtab', 'available')
                localStorage.removeItem('bentley_driver_profile_open')
                localStorage.removeItem('bentley_driver_map_booking_id')
              } catch {}
            } else {
              setCurrentRole('customer')
              setCurrentTab('home')
              try {
                localStorage.setItem('bentley_current_role', 'customer')
              } catch {}
            }
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onSwitchToLogin={(role) => {
            if (role) {
              setCurrentRole(role)
              try {
                localStorage.setItem('bentley_current_role', role)
              } catch {}
            }
            setCurrentTab('home')
            setAuthMode('login')
          }}
        />
      )}

      {/* 4. Dedicated Driver Partner Portal */}
      {isAppReady && currentRole === 'driver' && (
        <div className="w-full min-h-screen">
          <DriverDashboard
            bookings={bookings}
            onAcceptOrder={handleAcceptOrder}
            onUpdateStatus={handleUpdateBookingStatus}
            onLogout={handleLogout}
            driverName={driverProfile.name}
            driverEmail={driverProfile.email}
            driverProfile={driverProfile}
            onUpdateDriverProfile={handleUpdateDriverProfile}
            onDeleteAccount={handleDeleteAccount}
          />
        </div>
      )}

      {/* 5. Mobile, Tablet & Desktop App Canvas (Customer Portal) */}
      {isAppReady && currentRole === 'customer' && (
        <main className="w-full max-w-full min-h-screen bg-white relative flex flex-col">
          {/* Top Header */}
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
                onSelectVehicle={handleSelectVehicle}
                savedVehicles={savedVehicles}
                activeBookings={bookings}
                userProfile={
                  currentUser
                    ? {
                        name:
                          userProfileData?.Name ||
                          userProfileData?.fullName ||
                          currentUser.displayName ||
                          currentUser.email?.split('@')[0] ||
                          '',
                        email: userProfileData?.email || currentUser.email || '',
                        phone: userProfileData?.phone || currentUser.phoneNumber || '',
                        address:
                          userProfileData?.address ||
                          detectedAddress ||
                          userProfileData?.lastLocation ||
                          '',
                        lastLocation:
                          userProfileData?.lastLocation ||
                          detectedAddress ||
                          userProfileData?.address ||
                          '',
                        city: userProfileData?.city || detectedCity || '',
                        postalCode: userProfileData?.postalCode || detectedPostalCode || '',
                      }
                    : undefined
                }
                detectedAddress={
                  detectedAddress || userProfileData?.lastLocation || userProfileData?.address || ''
                }
                cartItems={cartItems}
                onAddToCart={handleAddToCart}
                onUpdateCartQuantity={handleUpdateCartQuantity}
                onRemoveCartItem={handleRemoveCartItem}
                onClearCart={handleClearCart}
                onCheckoutOrder={handleCheckoutOrder}
                onOpenTracking={() => navigateToTab('bookings')}
                onUpdateLocation={handleUpdateGlobalLocation}
              />
            )}

            {currentTab === 'services' && (
              <ServicesTab
                onSelectService={handleSelectService}
                onAddCar={() => setIsAddCarOpen(true)}
                currentVehicle={currentVehicle}
                onSelectVehicle={handleSelectVehicle}
                savedVehicles={savedVehicles}
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
                bookings={bookings}
                driverProfile={driverProfile}
                onCancelBooking={handleCancelBooking}
                onRescheduleBooking={handleRescheduleBooking}
                onRateBooking={handleRateBooking}
              />
            )}

            {currentTab === 'notifications' && (
              <NotificationsTab
                onBack={() => setCurrentTab(previousTab || 'home')}
                bookings={bookings}
              />
            )}

            {currentTab === 'profile' && (
              <ProfileTab
                onBack={() => setCurrentTab('home')}
                onOpenSavedVehicles={() => setIsSavedVehiclesOpen(true)}
                onNavigateToNotifications={() => navigateToTab('notifications')}
                onOpenBooking={() => navigateToTab('bookings')}
                onOpenMembership={() => setIsMembershipOpen(true)}
                onOpenContactUs={() => setIsContactUsOpen(true)}
                onOpenAboutUs={() => setIsAboutUsOpen(true)}
                savedVehiclesCount={savedVehicles.length}
                savedVehiclesList={savedVehicles.map((v) => v.name)}
                userProfile={
                  currentUser
                    ? {
                        name:
                          userProfileData?.Name ||
                          userProfileData?.name ||
                          userProfileData?.fullName ||
                          currentUser.displayName ||
                          currentUser.email?.split('@')[0] ||
                          'Member',
                        email: userProfileData?.email || currentUser.email || '',
                        phone: userProfileData?.phone || currentUser.phoneNumber || '',
                        address: userProfileData?.address || detectedAddress || '',
                        city: userProfileData?.city || '',
                        postalCode: userProfileData?.postalCode || '',
                        avatar: (() => {
                          const raw = userProfileData?.avatar || currentUser.photoURL || ''
                          return raw && !raw.includes('unsplash.com') ? raw : ''
                        })(),
                        preferredVehicle:
                          (userProfileData?.preferredVehicle &&
                          userProfileData.preferredVehicle !== 'Audi A4 (5th Gen Facelift)'
                            ? userProfileData.preferredVehicle
                            : '') ||
                          (savedVehicles.length > 0
                            ? savedVehicles.find((v) => v.isPrimary)?.name || savedVehicles[0].name
                            : currentVehicle && currentVehicle !== 'Audi A4 (5th Gen Facelift)'
                            ? currentVehicle
                            : '') ||
                          '',
                        membershipTier: userProfileData?.membershipTier || 'General Member',
                      }
                    : undefined
                }
                onUpdateProfile={handleUpdateProfile}
                onLogout={handleLogout}
                onDeleteAccount={handleDeleteAccount}
              />
            )}
          </div>

          {/* Curved Dark Bottom Navigation */}
          <BottomNav currentTab={currentTab} onTabChange={navigateToTab} />

          {/* Full Service Detail Modal */}
          {selectedService && (
            <ServiceDetailModal
              key={`${selectedService.id}-${selectedService.selectedTier || selectedService.priceNumeric}`}
              service={selectedService}
              onClose={() => setSelectedService(null)}
              onBookNow={handleBookNow}
            />
          )}

          {/* Booking Page Flow */}
          {isBookingOpen && (
            <BookingPage
              initialService={bookingService}
              currentVehicle={currentVehicle}
              savedVehicles={savedVehicles}
              userProfile={{
                name:
                  userProfileData?.Name ||
                  userProfileData?.name ||
                  userProfileData?.fullName ||
                  currentUser?.displayName ||
                  currentUser?.email?.split('@')[0] ||
                  '',
                email: userProfileData?.email || currentUser?.email || '',
                phone: userProfileData?.phone || currentUser?.phoneNumber || '',
                address:
                  userProfileData?.address ||
                  detectedAddress ||
                  userProfileData?.lastLocation ||
                  '',
                lastLocation:
                  userProfileData?.lastLocation ||
                  detectedAddress ||
                  userProfileData?.address ||
                  '',
                city: userProfileData?.city || detectedCity || '',
                postalCode: userProfileData?.postalCode || detectedPostalCode || '',
              }}
              onUpdateLocation={handleUpdateGlobalLocation}
              onSelectVehicle={handleSelectVehicle}
              onBack={() => setIsBookingOpen(false)}
              onBookingComplete={(newBooking) => {
                handleBookingComplete(newBooking)
              }}
              onTrackOrder={() => {
                setIsBookingOpen(false)
                setCurrentTab('bookings')
              }}
            />
          )}

          {/* Saved Vehicles Management Modal */}
          <SavedVehiclesModal
            isOpen={isSavedVehiclesOpen}
            onClose={() => setIsSavedVehiclesOpen(false)}
            vehicles={savedVehicles}
            currentVehicleName={currentVehicle}
            onSelectVehicle={handleSelectVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            onOpenAddVehicle={() => {
              setIsSavedVehiclesOpen(false)
              setIsAddCarOpen(true)
            }}
          />

          {/* Add Vehicle Modal */}
          <AddVehicleModal
            isOpen={isAddCarOpen}
            onClose={() => setIsAddCarOpen(false)}
            onVehicleAdded={handleVehicleAdded}
          />

          {/* Contact Us Modal */}
          <ContactUsPage
            isOpen={isContactUsOpen}
            onClose={() => setIsContactUsOpen(false)}
            userProfile={
              currentUser
                ? {
                    name:
                      userProfileData?.Name ||
                      userProfileData?.fullName ||
                      currentUser?.displayName ||
                      currentUser?.email?.split('@')[0] ||
                      '',
                    email: userProfileData?.email || currentUser?.email || '',
                    phone: userProfileData?.phone || currentUser?.phoneNumber || '',
                  }
                : undefined
            }
          />

          {/* About Us Modal */}
          <AboutUsPage
            isOpen={isAboutUsOpen}
            onClose={() => setIsAboutUsOpen(false)}
            onBookNow={() => {
              setIsAboutUsOpen(false)
              setIsBookingOpen(true)
            }}
            onContactUs={() => {
              setIsAboutUsOpen(false)
              setIsContactUsOpen(true)
            }}
          />
        </main>
      )}
    </div>
  )
}

/**
 * Top-level Application Root wrapping all domain context providers
 */
export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <VehicleProvider>
          <BookingProvider>
            <CartProvider>
              <AppContent />
              <Toaster />
            </CartProvider>
          </BookingProvider>
        </VehicleProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
