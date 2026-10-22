import React, { useState, useEffect } from 'react'
import { TabType, ServiceItem, SavedVehicle, BookingRecord, UserProfile } from '@/types'
import { INITIAL_SAVED_VEHICLES, INITIAL_BOOKINGS } from '@/data/mockData'
import { Header } from '@/components/Header'
import { BottomNav } from '@/components/BottomNav'
import { HomeTab } from '@/components/tabs/HomeTab'
import { ServicesTab } from '@/components/tabs/ServicesTab'
import { NotificationsTab } from '@/components/tabs/NotificationsTab'
import { BookingsTab } from '@/components/tabs/BookingsTab'
import { ProfileTab } from '@/components/tabs/ProfileTab'
import { ServiceDetailModal } from '@/components/tabs/ServiceDetailModal'
import { AddVehicleModal } from '@/components/tabs/AddVehicleModal'
import { SavedVehiclesModal } from '@/components/SavedVehiclesModal'
import { BookingPage } from '@/components/BookingPage'
import { Login } from '@/components/Login'
import { Signup } from '@/components/Signup'
import { SplashScreen } from '@/components/SplashScreen'
import { OnboardingScreen } from '@/components/OnboardingScreen'
import { MembershipPage } from '@/components/MembershipPage'
import { useToast } from '@/context/ToastContext'
// STEP 1 INTEGRATION: Import Firebase auth and session state listener
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
// STEP 2 & 3 INTEGRATION: Import Firestore real-time listeners and mutations
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'

export const App: React.FC = () => {
  // Global Toast Hook for cross-application user notifications
  const { showToast } = useToast()

  const [currentTab, setCurrentTab] = useState<TabType>('home')
  const [previousTab, setPreviousTab] = useState<TabType>('home')
  const [showSplash, setShowSplash] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  // STEP 1 INTEGRATION: Firebase User state from Auth
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // STEP 2 INTEGRATION: Live user profile data fetched from Firestore 'users' collection
  const [userProfileData, setUserProfileData] = useState<{
    fullName?: string
    email?: string
    phone?: string
    city?: string
    address?: string
    postalCode?: string
    role?: string
  } | null>(null)

  // Persistent Saved Vehicles State (Synced with localStorage)
  const [savedVehicles, setSavedVehicles] = useState<SavedVehicle[]>(() => {
    try {
      const stored = localStorage.getItem('bentley_saved_vehicles')
      if (stored) return JSON.parse(stored)
    } catch {}
    return INITIAL_SAVED_VEHICLES
  })

  // Persistent Bookings State (Synced with localStorage)
  const [bookings, setBookings] = useState<BookingRecord[]>(() => {
    try {
      const stored = localStorage.getItem('bentley_bookings')
      if (stored) return JSON.parse(stored)
    } catch {}
    return INITIAL_BOOKINGS
  })

  // Active Vehicle State
  const [currentVehicle, setCurrentVehicle] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('bentley_active_vehicle')
      if (stored) return stored
    } catch {}
    return INITIAL_SAVED_VEHICLES[0]?.name || 'Audi A4 (5th Gen Facelift)'
  })

  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)
  const [isAddCarOpen, setIsAddCarOpen] = useState(false)
  const [isSavedVehiclesOpen, setIsSavedVehiclesOpen] = useState(false)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [bookingService, setBookingService] = useState<ServiceItem | null>(null)
  const [isMembershipOpen, setIsMembershipOpen] = useState(false)

  // Sync savedVehicles with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bentley_saved_vehicles', JSON.stringify(savedVehicles))
    } catch {}
  }, [savedVehicles])

  // Sync bookings with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bentley_bookings', JSON.stringify(bookings))
    } catch {}
  }, [bookings])

  // Sync currentVehicle with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bentley_active_vehicle', currentVehicle)
    } catch {}
  }, [currentVehicle])

  // STEP 1 INTEGRATION: Persistent Firebase Auth session listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
        // If user is already authenticated, close auth screens automatically
        setShowAuth(false)
      } else {
        setCurrentUser(null)
        setUserProfileData(null)
      }
    })
    return () => unsubscribe()
  }, [])

  // STEP 2 INTEGRATION: Real-time listener for Firestore 'users' document
  useEffect(() => {
    if (!currentUser) {
      setUserProfileData(null)
      return
    }

    // Subscribe to live updates of the logged-in user document in 'carwash' database
    const userDocRef = doc(db, 'users', currentUser.uid)
    const unsubDoc = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setUserProfileData(docSnap.data() as any)
        }
      },
      (error) => {
        console.error('Error fetching real-time user profile from Firestore:', error)
      }
    )

    return () => unsubDoc()
  }, [currentUser])

  // STEP 3 INTEGRATION: Real-time listener for user vehicles subcollection ('users/{uid}/vehicles')
  useEffect(() => {
    if (!currentUser) return

    const vehiclesColRef = collection(db, 'users', currentUser.uid, 'vehicles')
    const unsubVehicles = onSnapshot(
      vehiclesColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedVehicles: SavedVehicle[] = snapshot.docs.map((docSnap) => ({
            ...(docSnap.data() as SavedVehicle),
            id: docSnap.id,
          }))
          setSavedVehicles(loadedVehicles)
          // Set active vehicle if not currently in list
          if (loadedVehicles.length > 0) {
            const hasActive = loadedVehicles.some((v) => v.name === currentVehicle)
            if (!hasActive) {
              const primaryVeh = loadedVehicles.find((v) => v.isPrimary) || loadedVehicles[0]
              setCurrentVehicle(primaryVeh.name)
            }
          }
        }
      },
      (error) => {
        console.error('Error listening to user vehicles in Firestore:', error)
      }
    )

    return () => unsubVehicles()
  }, [currentUser])

  // STEP 4 INTEGRATION: Real-time listener for user bookings ('bookings' collection filtered by userId)
  useEffect(() => {
    if (!currentUser) return

    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('userId', '==', currentUser.uid)
    )

    const unsubBookings = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedBookings: BookingRecord[] = snapshot.docs.map((docSnap) => ({
            ...(docSnap.data() as BookingRecord),
            id: docSnap.id,
          }))
          // Sort latest bookings first
          loadedBookings.sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          )
          setBookings(loadedBookings)
        }
      },
      (error) => {
        console.error('Error listening to user bookings in Firestore:', error)
      }
    )

    return () => unsubBookings()
  }, [currentUser])

  const isAppReady = !showSplash && !showOnboarding && !showAuth

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

  // STEP 3 INTEGRATION: Save vehicle to Firestore subcollection & update local state
  const handleVehicleAdded = async (newVehicle: SavedVehicle) => {
    setSavedVehicles((prev) => [newVehicle, ...prev.filter((v) => v.id !== newVehicle.id)])
    setCurrentVehicle(newVehicle.name)
    // Toast notification for adding vehicle
    showToast(`${newVehicle.name} added to your garage!`, 'success')

    if (currentUser) {
      try {
        const vehicleDocRef = doc(db, 'users', currentUser.uid, 'vehicles', newVehicle.id)
        await setDoc(vehicleDocRef, {
          ...newVehicle,
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      } catch (err) {
        console.error('Failed to sync new vehicle to Firestore:', err)
      }
    }
  }

  const handleSelectVehicle = (vehicleName: string) => {
    setCurrentVehicle(vehicleName)
    setSavedVehicles((prev) =>
      prev.map((v) => ({
        ...v,
        isPrimary: v.name === vehicleName,
      }))
    )
    // Toast notification for switching active vehicle
    showToast(`Active vehicle switched to ${vehicleName}.`, 'info')
  }

  // STEP 3 INTEGRATION: Delete vehicle from Firestore & local state
  const handleDeleteVehicle = async (vehicleId: string) => {
    setSavedVehicles((prev) => {
      const remaining = prev.filter((v) => v.id !== vehicleId)
      const wasActive = prev.find((v) => v.id === vehicleId)?.name === currentVehicle
      if (wasActive && remaining.length > 0) {
        setCurrentVehicle(remaining[0].name)
      }
      return remaining
    })
    // Toast notification for vehicle deletion
    showToast('Vehicle removed successfully.', 'info')

    if (currentUser) {
      try {
        const vehicleDocRef = doc(db, 'users', currentUser.uid, 'vehicles', vehicleId)
        await deleteDoc(vehicleDocRef)
      } catch (err) {
        console.error('Failed to delete vehicle from Firestore:', err)
      }
    }
  }

  // STEP 4 INTEGRATION: Save booking to Firestore 'bookings' collection
  const handleBookingComplete = async (newBooking: BookingRecord) => {
    setBookings((prev) => [newBooking, ...prev])
    // Toast notification for successful booking creation
    const slotInfo = newBooking.date && newBooking.time ? ` for ${newBooking.date} at ${newBooking.time}` : ''
    showToast(`Your booking has been scheduled${slotInfo}!`, 'success')

    if (currentUser) {
      try {
        const bookingDocRef = doc(db, 'bookings', newBooking.id)
        await setDoc(bookingDocRef, {
          ...newBooking,
          userId: currentUser.uid,
          userEmail: currentUser.email || '',
          createdAt: newBooking.createdAt || new Date().toISOString(),
          serverTimestamp: serverTimestamp(),
        })
      } catch (err) {
        console.error('Failed to sync booking to Firestore:', err)
      }
    }
  }

  // STEP 4 INTEGRATION: Cancel booking in Firestore
  const handleCancelBooking = async (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
      )
    )
    // Toast notification for booking cancellation
    showToast(`Your booking #${bookingId.slice(0, 8)} has been cancelled.`, 'info')

    if (currentUser) {
      try {
        const bookingDocRef = doc(db, 'bookings', bookingId)
        await updateDoc(bookingDocRef, {
          status: 'cancelled',
          cancelledAt: serverTimestamp(),
        })
      } catch (err) {
        console.error('Failed to update booking status in Firestore:', err)
      }
    }
  }

  // STEP 4 INTEGRATION: Reschedule booking in Firestore
  const handleRescheduleBooking = async (
    bookingId: string,
    newDate: string,
    newTime: string
  ) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              date: newDate,
              time: newTime,
              status: 'scheduled' as const,
            }
          : b
      )
    )
    // Toast notification for appointment reschedule
    showToast('Appointment rescheduled successfully!', 'success')

    if (currentUser) {
      try {
        const bookingDocRef = doc(db, 'bookings', bookingId)
        await updateDoc(bookingDocRef, {
          date: newDate,
          time: newTime,
          status: 'scheduled',
          rescheduledAt: serverTimestamp(),
        })
      } catch (err) {
        console.error('Failed to reschedule booking in Firestore:', err)
      }
    }
  }

  // STEP 4 INTEGRATION: Rate and review booking in Firestore
  const handleRateBooking = async (
    bookingId: string,
    rating: number,
    review: string
  ) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, rating, review } : b))
    )
    // Toast notification for submitted review
    showToast('Thank you for rating our service!', 'success')

    if (currentUser) {
      try {
        const bookingDocRef = doc(db, 'bookings', bookingId)
        await updateDoc(bookingDocRef, {
          rating,
          review,
          ratedAt: serverTimestamp(),
        })
      } catch (err) {
        console.error('Failed to save rating in Firestore:', err)
      }
    }
  }

  // STEP 5 INTEGRATION: Update user profile document directly in Firestore 'users' collection
  const handleUpdateProfile = async (updated: UserProfile) => {
    // Toast notification for profile update
    showToast('Profile updated successfully!', 'success')

    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid)
        await updateDoc(userDocRef, {
          fullName: updated.name,
          phone: updated.phone,
          address: updated.address,
          city: updated.city || '',
          postalCode: updated.postalCode || '',
          avatar: updated.avatar,
          preferredVehicle: updated.preferredVehicle || '',
          updatedAt: serverTimestamp(),
        })
      } catch (err) {
        console.error('Failed to update user profile in Firestore:', err)
      }
    }
  }

  return (
    <div className="min-h-screen w-full bg-white flex justify-center selection:bg-primary selection:text-primary-foreground">
      {/* 1. Launch Splash Screen (Fixed 375x812 iPhone Layout) */}
      {showSplash && (
        <SplashScreen
          onFinish={() => {
            setShowSplash(false)
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
      {showAuth && authMode === 'login' && (
        <Login
          onLoginSuccess={(_user) => {
            setShowAuth(false)
            setCurrentTab('home')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onSwitchToSignup={() => setAuthMode('signup')}
          onSkip={() => {
            setShowAuth(false)
            setCurrentTab('home')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )}

      {showAuth && authMode === 'signup' && (
        <Signup
          onSignupSuccess={(_user) => {
            setShowAuth(false)
            setCurrentTab('home')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onSwitchToLogin={() => setAuthMode('login')}
          onSkip={() => {
            setShowAuth(false)
            setCurrentTab('home')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )}

      {/* Mobile, Tablet, iPad Pro & Desktop App Canvas */}
      <main
        className={`w-full max-w-full min-h-screen bg-white relative flex flex-col ${
          !isAppReady ? 'hidden' : ''
        }`}
      >
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
              onSelectVehicle={handleSelectVehicle}
              savedVehicles={savedVehicles}
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
              onCancelBooking={handleCancelBooking}
              onRescheduleBooking={handleRescheduleBooking}
              onRateBooking={handleRateBooking}
            />
          )}

          {currentTab === 'notifications' && (
            <NotificationsTab onBack={() => setCurrentTab(previousTab || 'home')} />
          )}

          {currentTab === 'profile' && (
            <ProfileTab
              onBack={() => setCurrentTab('home')}
              onOpenSavedVehicles={() => setIsSavedVehiclesOpen(true)}
              onNavigateToNotifications={() => navigateToTab('notifications')}
              onOpenBooking={() => navigateToTab('bookings')}
              onOpenMembership={() => setIsMembershipOpen(true)}
              savedVehiclesCount={savedVehicles.length}
              userProfile={
                currentUser
                  ? {
                      // STEP 2 INTEGRATION: Prefer real Firestore 'fullName' from 'users' collection, fallback to displayName/email
                      name:
                        userProfileData?.fullName ||
                        currentUser.displayName ||
                        currentUser.email?.split('@')[0] ||
                        'Member',
                      email: userProfileData?.email || currentUser.email || '',
                      phone: userProfileData?.phone || currentUser.phoneNumber || '+1 (998) 877-5561',
                      address:
                        userProfileData?.address ||
                        '21/22, 5th Avenue, Jamesford Road, Ontario, Canada',
                      city: userProfileData?.city || 'Ontario',
                      postalCode: userProfileData?.postalCode || 'L4B 1X9',
                      avatar:
                        currentUser.photoURL ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
                      preferredVehicle: currentVehicle,
                      membershipTier: 'VIP Platinum',
                    }
                  : undefined
              }
              onUpdateProfile={handleUpdateProfile}
              onLogout={async () => {
                // STEP 1 & 2 INTEGRATION: Complete Firebase sign-out and session teardown
                try {
                  await signOut(auth)
                } catch (e) {
                  console.error('Firebase Sign-out error:', e)
                }
                // Toast notification on logout
                showToast('You have been logged out.', 'info')
                // Reset local states and redirect to Login screen
                setCurrentUser(null)
                setUserProfileData(null)
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
            savedVehicles={savedVehicles}
            userProfile={
              currentUser
                ? {
                    name:
                      userProfileData?.fullName ||
                      currentUser.displayName ||
                      currentUser.email?.split('@')[0] ||
                      'Member',
                    email: userProfileData?.email || currentUser.email || '',
                    phone: userProfileData?.phone || currentUser.phoneNumber || '+1 (998) 877-5561',
                    address: userProfileData?.address || '21/22, 5th Avenue, Jamesford Road',
                    city: userProfileData?.city || 'Ontario',
                    postalCode: userProfileData?.postalCode || 'L4B 1X9',
                  }
                : undefined
            }
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

        {/* Dedicated My Garage / Saved Vehicles Management Screen */}
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

        {/* Multi-Step Add Vehicle Flow */}
        <AddVehicleModal
          isOpen={isAddCarOpen}
          onClose={() => setIsAddCarOpen(false)}
          onVehicleAdded={handleVehicleAdded}
        />

        {/* Dedicated Membership Plans Page */}
        {isMembershipOpen && (
          <MembershipPage
            onBack={() => setIsMembershipOpen(false)}
          />
        )}
      </main>
    </div>
  )
}

export default App
