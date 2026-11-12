import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react'
import { TabType, ServiceItem } from '@/types'
import { Header } from '@/components/Header'
import { BottomNav } from '@/components/BottomNav'
import { SmartAppBanner } from '@/components/common/SmartAppBanner'

// Instant Frame-0 Shell Skeletons (Eagerly loaded for zero-blank-screen refresh)
import { HomeTab } from '@/pages/Tabs/HomeTab'
import { HomeTabSkeleton, DriverDashboardSkeleton } from '@/components/ui/skeleton'

// Lazy-Loaded Feature Slices & Modals for High-Performance Code Splitting
const ServicesTab = lazy(() => import('@/pages/Tabs/ServicesTab').then(m => ({ default: m.ServicesTab })))
const NotificationsTab = lazy(() => import('@/pages/Tabs/NotificationsTab').then(m => ({ default: m.NotificationsTab })))
const BookingsTab = lazy(() => import('@/pages/Tabs/BookingsTab').then(m => ({ default: m.BookingsTab })))
const ProfileTab = lazy(() => import('@/pages/Tabs/ProfileTab').then(m => ({ default: m.ProfileTab })))

const DriverDashboard = lazy(() => import('@/pages/Driver/DriverDashboardPage').then(m => ({ default: m.DriverDashboard })))
const BookingPage = lazy(() => import('@/pages/Booking/BookingPage').then(m => ({ default: m.BookingPage })))
const ServiceDetailModal = lazy(() => import('@/components/modals').then(m => ({ default: m.ServiceDetailModal })))
const SavedVehiclesModal = lazy(() => import('@/components/modals').then(m => ({ default: m.SavedVehiclesModal })))
const AddVehicleModal = lazy(() => import('@/components/modals').then(m => ({ default: m.AddVehicleModal })))
const ContactUsPage = lazy(() => import('@/pages/Contact/ContactUsPage').then(m => ({ default: m.ContactUsPage })))
const AboutUsPage = lazy(() => import('@/pages/About/AboutUsPage').then(m => ({ default: m.AboutUsPage })))

const Login = lazy(() => import('@/pages/Auth/LoginPage').then(m => ({ default: m.Login })))
const Signup = lazy(() => import('@/pages/Auth/SignupPage').then(m => ({ default: m.Signup })))
const SplashScreen = lazy(() => import('@/pages/Auth/SplashScreen').then(m => ({ default: m.SplashScreen })))
const OnboardingScreen = lazy(() => import('@/pages/Auth/OnboardingPage').then(m => ({ default: m.OnboardingScreen })))

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

  // Active shop delivery orders consumed cleanly from CartContext (no raw Firestore queries here)
  const {
    cartItems,
    activeShopOrders,
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

  // Handle smart deep-link query parameters from email redirects (?open=booking, ?open=order)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const openTarget = params.get('open')
      if (openTarget === 'booking') {
        setCurrentTab('bookings')
      } else if (openTarget === 'order') {
        setCurrentTab('home')
      }
    } catch {}
  }, [])

  // Sync navigation states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bentley_current_tab', currentTab)
    } catch {}
  }, [currentTab])

  useEffect(() => {
    try {
      if (isBookingOpen) {
        localStorage.setItem('bentley_booking_open', 'true')
      } else {
        localStorage.removeItem('bentley_booking_open')
      }
    } catch {}
  }, [isBookingOpen])

  useEffect(() => {
    try {
      if (bookingService) {
        localStorage.setItem('bentley_booking_service', JSON.stringify(bookingService))
      } else {
        localStorage.removeItem('bentley_booking_service')
      }
    } catch {}
  }, [bookingService])

  // =========================================================================
  // 3. MOBILE HARDWARE & GESTURE BACK BUTTON INTERCEPTION
  // =========================================================================
  useEffect(() => {
    const handlePopState = () => {
      // Close active modals in LIFO order rather than exiting the web app
      if (selectedService) {
        setSelectedService(null)
        return
      }
      if (isBookingOpen) {
        setIsBookingOpen(false)
        return
      }
      if (isSavedVehiclesOpen) {
        setIsSavedVehiclesOpen(false)
        return
      }
      if (isAddCarOpen) {
        setIsAddCarOpen(false)
        return
      }
      if (isContactUsOpen) {
        setIsContactUsOpen(false)
        return
      }
      if (isAboutUsOpen) {
        setIsAboutUsOpen(false)
        return
      }
      if (currentTab !== 'home') {
        setCurrentTab('home')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [
    selectedService,
    isBookingOpen,
    isSavedVehiclesOpen,
    isAddCarOpen,
    isContactUsOpen,
    isAboutUsOpen,
    currentTab,
  ])

  const pushModalHistory = () => {
    try {
      window.history.pushState({ modal: true }, '')
    } catch {}
  }

  // =========================================================================
  // 4. UNIFIED NORMALIZED USER PROFILE (Single Source of Truth)
  // =========================================================================
  const normalizedUserProfile = useMemo(() => {
    if (!currentUser && !userProfileData) return undefined
    return {
      name:
        userProfileData?.Name ||
        userProfileData?.name ||
        userProfileData?.fullName ||
        currentUser?.displayName ||
        currentUser?.email?.split('@')[0] ||
        'Member',
      email: userProfileData?.email || currentUser?.email || '',
      phone: userProfileData?.phone || currentUser?.phoneNumber || '',
      address: userProfileData?.address || detectedAddress || userProfileData?.lastLocation || '',
      lastLocation: userProfileData?.lastLocation || detectedAddress || userProfileData?.address || '',
      city: userProfileData?.city || detectedCity || '',
      postalCode: userProfileData?.postalCode || detectedPostalCode || '',
      avatar: (() => {
        const raw = userProfileData?.avatar || currentUser?.photoURL || ''
        return raw && !raw.includes('unsplash.com') ? raw : ''
      })(),
      preferredVehicle:
        (userProfileData?.preferredVehicle && userProfileData.preferredVehicle !== 'Audi A4 (5th Gen Facelift)'
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
  }, [currentUser, userProfileData, detectedAddress, detectedCity, detectedPostalCode, savedVehicles, currentVehicle])

  const isAuthenticated = Boolean(currentUser)
  const isAuthResolving = isAuthLoading || isResolvingRole
  const isAppReady = !showSplash && !showOnboarding && !isAuthResolving && isAuthenticated
  const showAuthScreen = !showSplash && !showOnboarding && !isAuthResolving && !isAuthenticated

  const navigateToTab = (tab: TabType) => {
    setPreviousTab(currentTab)
    setCurrentTab(tab)
  }

  const handleSelectService = (service: ServiceItem) => {
    pushModalHistory()
    setSelectedService(service)
  }

  const handleBookNow = (service: ServiceItem) => {
    pushModalHistory()
    setBookingService(service)
    setSelectedService(null)
    setIsBookingOpen(true)
  }

  return (
    <div className="min-h-[100dvh] w-full bg-white flex justify-center selection:bg-primary selection:text-primary-foreground pb-[env(safe-area-inset-bottom)]">
      {/* 1. Launch Splash Screen */}
      {showSplash && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {/* 2. Launch Onboarding Screen */}
      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingScreen
            onNext={() => {
              setShowOnboarding(false)
              try {
                localStorage.setItem('bentley_onboarded', 'true')
              } catch {}
              setAuthMode('login')
            }}
          />
        </Suspense>
      )}

      {/* 3. ZERO-DELAY FRAME-0 SKELETON (Renders instantly on refresh during Auth handshake) */}
      {!showSplash && !showOnboarding && isAuthResolving && (
        <div className="w-full min-h-[100dvh] bg-white flex flex-col animate-in fade-in duration-200">
          {currentRole === 'driver' ? (
            <DriverDashboardSkeleton />
          ) : (
            <main className="w-full max-w-full min-h-[100dvh] bg-white relative flex flex-col">
              <div className="flex-1 w-full">
                <HomeTabSkeleton />
              </div>
              <BottomNav currentTab={currentTab} onTabChange={navigateToTab} />
            </main>
          )}
        </div>
      )}

      {/* 4. Launch Login & Signup Screen */}
      {showAuthScreen && authMode === 'login' && (
        <Suspense fallback={<HomeTabSkeleton />}>
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
        </Suspense>
      )}

      {showAuthScreen && authMode === 'signup' && (
        <Suspense fallback={<HomeTabSkeleton />}>
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
        </Suspense>
      )}

      {/* 5. Dedicated Driver Partner Portal */}
      {isAppReady && currentRole === 'driver' && (
        <div className="w-full min-h-[100dvh]">
          <Suspense fallback={<DriverDashboardSkeleton />}>
            <DriverDashboard
              bookings={bookings}
              onAcceptOrder={handleAcceptOrder}
              onUpdateStatus={handleUpdateBookingStatus}
              onCancelBooking={handleCancelBooking}
              onLogout={handleLogout}
              driverName={driverProfile.name}
              driverEmail={driverProfile.email}
              driverProfile={driverProfile}
              onUpdateDriverProfile={handleUpdateDriverProfile}
              onDeleteAccount={handleDeleteAccount}
            />
          </Suspense>
        </div>
      )}

      {/* 6. Mobile, Tablet & Desktop App Canvas (Customer Portal) */}
      {isAppReady && currentRole === 'customer' && (
        <main className="w-full max-w-full min-h-[100dvh] bg-white relative flex flex-col">
          <SmartAppBanner />
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
                onAddCar={() => {
                  pushModalHistory()
                  setIsAddCarOpen(true)
                }}
                currentVehicle={currentVehicle}
                onSelectVehicle={handleSelectVehicle}
                savedVehicles={savedVehicles}
                activeBookings={bookings}
                activeShopOrders={activeShopOrders}
                userProfile={normalizedUserProfile}
                detectedAddress={
                  detectedAddress || userProfileData?.lastLocation || userProfileData?.address || ''
                }
                cartItems={cartItems}
                onAddToCart={handleAddToCart}
                onUpdateCartQuantity={handleUpdateCartQuantity}
                onRemoveCartItem={handleRemoveCartItem}
                onClearCart={handleClearCart}
                onCheckoutOrder={handleCheckoutOrder}
                onUpdateLocation={handleUpdateGlobalLocation}
              />
            )}

            {currentTab === 'services' && (
              <Suspense fallback={<HomeTabSkeleton />}>
                <ServicesTab
                  onSelectService={handleSelectService}
                  onAddCar={() => {
                    pushModalHistory()
                    setIsAddCarOpen(true)
                  }}
                  currentVehicle={currentVehicle}
                  onSelectVehicle={handleSelectVehicle}
                  savedVehicles={savedVehicles}
                />
              </Suspense>
            )}

            {currentTab === 'bookings' && (
              <Suspense fallback={<HomeTabSkeleton />}>
                <BookingsTab
                  onBack={() => setCurrentTab('home')}
                  onBookAgain={(service) => {
                    pushModalHistory()
                    setBookingService(service)
                    setIsBookingOpen(true)
                  }}
                  onViewServiceDetail={(service) => {
                    pushModalHistory()
                    setSelectedService(service)
                  }}
                  currentVehicle={currentVehicle}
                  bookings={bookings}
                  driverProfile={driverProfile}
                  onCancelBooking={handleCancelBooking}
                  onRescheduleBooking={handleRescheduleBooking}
                  onRateBooking={handleRateBooking}
                />
              </Suspense>
            )}

            {currentTab === 'notifications' && (
              <Suspense fallback={<HomeTabSkeleton />}>
                <NotificationsTab
                  onBack={() => setCurrentTab(previousTab || 'home')}
                  bookings={bookings}
                />
              </Suspense>
            )}

            {currentTab === 'profile' && (
              <Suspense fallback={<HomeTabSkeleton />}>
                <ProfileTab
                  onBack={() => setCurrentTab('home')}
                  onOpenSavedVehicles={() => {
                    pushModalHistory()
                    setIsSavedVehiclesOpen(true)
                  }}
                  onNavigateToNotifications={() => navigateToTab('notifications')}
                  onOpenBooking={() => navigateToTab('bookings')}
                  onOpenMembership={() => {
                    pushModalHistory()
                    setIsMembershipOpen(true)
                  }}
                  onOpenContactUs={() => {
                    pushModalHistory()
                    setIsContactUsOpen(true)
                  }}
                  onOpenAboutUs={() => {
                    pushModalHistory()
                    setIsAboutUsOpen(true)
                  }}
                  savedVehiclesCount={savedVehicles.length}
                  savedVehiclesList={savedVehicles.map((v) => v.name)}
                  userProfile={normalizedUserProfile}
                  onUpdateProfile={handleUpdateProfile}
                  onLogout={handleLogout}
                  onDeleteAccount={handleDeleteAccount}
                />
              </Suspense>
            )}
          </div>

          {/* Curved Dark Bottom Navigation */}
          <BottomNav currentTab={currentTab} onTabChange={navigateToTab} />

          {/* Full Service Detail Modal */}
          {selectedService && (
            <Suspense fallback={null}>
              <ServiceDetailModal
                key={`${selectedService.id}-${selectedService.selectedTier || selectedService.priceNumeric}`}
                service={selectedService}
                onClose={() => setSelectedService(null)}
                onBookNow={handleBookNow}
              />
            </Suspense>
          )}

          {/* Booking Page Flow */}
          {isBookingOpen && (
            <Suspense fallback={null}>
              <BookingPage
                initialService={bookingService}
                currentVehicle={currentVehicle}
                savedVehicles={savedVehicles}
                userProfile={normalizedUserProfile}
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
            </Suspense>
          )}

          {/* Saved Vehicles Management Modal */}
          {isSavedVehiclesOpen && (
            <Suspense fallback={null}>
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
            </Suspense>
          )}

          {/* Add Vehicle Modal */}
          {isAddCarOpen && (
            <Suspense fallback={null}>
              <AddVehicleModal
                isOpen={isAddCarOpen}
                onClose={() => setIsAddCarOpen(false)}
                onVehicleAdded={handleVehicleAdded}
              />
            </Suspense>
          )}

          {/* Contact Us Modal */}
          {isContactUsOpen && (
            <Suspense fallback={null}>
              <ContactUsPage
                isOpen={isContactUsOpen}
                onClose={() => setIsContactUsOpen(false)}
                userProfile={normalizedUserProfile}
              />
            </Suspense>
          )}

          {/* About Us Modal */}
          {isAboutUsOpen && (
            <Suspense fallback={null}>
              <AboutUsPage
                isOpen={isAboutUsOpen}
                onClose={() => setIsAboutUsOpen(false)}
                onBookNow={() => {
                  setIsAboutUsOpen(false)
                  pushModalHistory()
                  setIsBookingOpen(true)
                }}
                onContactUs={() => {
                  setIsAboutUsOpen(false)
                  pushModalHistory()
                  setIsContactUsOpen(true)
                }}
              />
            </Suspense>
          )}
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
