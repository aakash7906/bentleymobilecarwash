import React, { useState, useEffect } from 'react'
import { TabType, ServiceItem, SavedVehicle, BookingRecord, BookingStatus, UserProfile, DriverProfile, CartItem } from '@/types'
import { INITIAL_SAVED_VEHICLES, INITIAL_BOOKINGS } from '@/data/mockData'
import { Header } from '@/components/Header'
import { BottomNav } from '@/components/BottomNav'
// Direct Page Imports
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
// import { MembershipPage } from '@/pages/Membership/MembershipPage'
import { DriverDashboard } from '@/pages/Driver/DriverDashboardPage'
import { useToast } from '@/context/ToastContext'
// STEP 1 INTEGRATION: Import Firebase auth and session state listener
import { auth, db } from '@/firebase'
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
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  // Live GPS address detected from Home tab, forwarded seamlessly to BookingPage
  const [detectedAddress, setDetectedAddress] = useState<string>(() => {
    try {
      return localStorage.getItem('bentley_detected_address') || ''
    } catch {
      return ''
    }
  })

  // Driver vs Customer active portal state
  const [currentRole, setCurrentRole] = useState<'customer' | 'driver'>(() => {
    try {
      const stored = localStorage.getItem('bentley_current_role')
      if (stored === 'driver' || stored === 'customer') return stored
    } catch { }
    return 'customer'
  })

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
    driverPhone?: string
    driverVan?: string
    driverPlate?: string
    serviceArea?: string
    driverLicenseNumber?: string
    bio?: string
    avatar?: string
    isAvailable?: boolean
    preferredVehicle?: string
    membershipTier?: string
  } | null>(null)

  // Driver Profile State (Synced with localStorage & Firestore)
  const [driverProfile, setDriverProfile] = useState<DriverProfile>(() => {
    try {
      const stored = localStorage.getItem('bentley_driver_profile')
      if (stored) return JSON.parse(stored)
    } catch { }
    return {
      name: 'Alex Rivera',
      email: 'driver@bentleycarwash.com',
      phone: '+1 (800) 555-9274',
      vanModel: 'Mercedes-Benz Sprinter 2500',
      licensePlate: 'BC-8492',
      serviceArea: 'Ontario & Greater Toronto Area',
      driverLicenseNumber: 'DL-ON-992014-B',
      bio: 'Certified IDA Mobile Detailing Specialist with 6+ years experience.',
      emergencyContact: '+1 (998) 555-0199',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      isAvailable: true,
      rating: 4.95,
      totalJobs: 142,
    }
  })

  // Persistent Saved Vehicles State (Synced with localStorage)
  const [savedVehicles, setSavedVehicles] = useState<SavedVehicle[]>(() => {
    try {
      const stored = localStorage.getItem('bentley_saved_vehicles')
      if (stored) return JSON.parse(stored)
    } catch { }
    return INITIAL_SAVED_VEHICLES
  })

  // Persistent Bookings State (Synced with localStorage)
  const [bookings, setBookings] = useState<BookingRecord[]>(() => {
    try {
      const stored = localStorage.getItem('bentley_bookings')
      if (stored) return JSON.parse(stored)
    } catch { }
    return INITIAL_BOOKINGS
  })

  // Active Vehicle State
  const [currentVehicle, setCurrentVehicle] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('bentley_active_vehicle')
      if (stored) return stored
    } catch { }
    return INITIAL_SAVED_VEHICLES[0]?.name || 'Audi A4 (5th Gen Facelift)'
  })

  // Global Shopping Cart State (Persisted in localStorage)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('bentley_cart_items')
      if (stored) return JSON.parse(stored)
    } catch { }
    return []
  })

  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)
  const [isAddCarOpen, setIsAddCarOpen] = useState(false)
  const [isSavedVehiclesOpen, setIsSavedVehiclesOpen] = useState(false)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [bookingService, setBookingService] = useState<ServiceItem | null>(null)
  const [_isMembershipOpen, setIsMembershipOpen] = useState(false)

  // Sync cartItems with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bentley_cart_items', JSON.stringify(cartItems))
    } catch { }
  }, [cartItems])

  // Sync savedVehicles with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bentley_saved_vehicles', JSON.stringify(savedVehicles))
    } catch { }
  }, [savedVehicles])

  // Sync bookings with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bentley_bookings', JSON.stringify(bookings))
    } catch { }
  }, [bookings])

  // Sync currentVehicle with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bentley_active_vehicle', currentVehicle)
    } catch { }
  }, [currentVehicle])

  // Sync currentRole with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bentley_current_role', currentRole)
    } catch { }
  }, [currentRole])

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
          const data = docSnap.data() as any
          setUserProfileData(data)
          if (data.role === 'driver') {
            setCurrentRole('driver')
            setDriverProfile((prev) => ({
              ...prev,
              name: data.fullName || prev.name,
              email: data.email || prev.email,
              phone: data.driverPhone || data.phone || prev.phone,
              vanModel: data.driverVan || data.driverDetails?.vehicle || data.driverDetails?.vanNumber || prev.vanModel,
              licensePlate: data.driverPlate || data.driverDetails?.licensePlate || prev.licensePlate,
              serviceArea: data.serviceArea || prev.serviceArea,
              driverLicenseNumber: data.driverLicenseNumber || prev.driverLicenseNumber,
              bio: data.bio || prev.bio,
              avatar: data.avatar || prev.avatar,
              isAvailable: data.isAvailable !== undefined ? data.isAvailable : prev.isAvailable,
            }))
          } else if (data.role === 'customer') {
            setCurrentRole('customer')
          }
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

  // STEP 4 INTEGRATION: Real-time listener for bookings ('bookings' collection filtered by userId for customers, all bookings for drivers)
  useEffect(() => {
    if (!currentUser) return

    const bookingsQuery =
      currentRole === 'driver'
        ? query(collection(db, 'bookings'))
        : query(collection(db, 'bookings'), where('userId', '==', currentUser.uid))

    const unsubBookings = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        const loadedBookings: BookingRecord[] = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as BookingRecord),
          id: docSnap.id,
        }))
        // Sort latest bookings first
        loadedBookings.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        )
        setBookings(loadedBookings)
      },
      (error) => {
        console.error('Error listening to user bookings in Firestore:', error)
      }
    )

    return () => unsubBookings()
  }, [currentUser, currentRole])

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
          phone: updated.phone || '',
          address: updated.address || '',
          city: updated.city || '',
          postalCode: updated.postalCode || '',
          avatar: updated.avatar || '',
          preferredVehicle: updated.preferredVehicle || '',
          membershipTier: updated.membershipTier || 'General Member',
          updatedAt: serverTimestamp(),
        })
      } catch (err) {
        console.error('Failed to update user profile in Firestore:', err)
      }
    }
  }

  // Driver update profile handler
  const handleUpdateDriverProfile = async (updated: DriverProfile) => {
    setDriverProfile(updated)
    try {
      localStorage.setItem('bentley_driver_profile', JSON.stringify(updated))
    } catch { }

    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid)
        await updateDoc(userDocRef, {
          fullName: updated.name,
          driverPhone: updated.phone,
          driverVan: updated.vanModel,
          driverPlate: updated.licensePlate,
          serviceArea: updated.serviceArea,
          driverLicenseNumber: updated.driverLicenseNumber || '',
          bio: updated.bio || '',
          avatar: updated.avatar,
          isAvailable: updated.isAvailable,
          updatedAt: serverTimestamp(),
        })
      } catch (err) {
        console.error('Failed to update driver profile in Firestore:', err)
      }
    }
  }

  // Driver accept order workflow handler
  const handleAcceptOrder = async (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
            ...b,
            status: 'accepted' as const,
            driverId: currentUser?.uid || 'drv-partner',
            driverName: driverProfile.name,
            driverPhone: driverProfile.phone,
            driverVehicle: driverProfile.vanModel,
            driverVanNumber: driverProfile.licensePlate,
            driverCoords: b.driverCoords || [-79.4035, 43.6635],
          }
          : b
      )
    )

    if (currentUser) {
      try {
        const bookingDocRef = doc(db, 'bookings', bookingId)
        await updateDoc(bookingDocRef, {
          status: 'accepted',
          driverId: currentUser.uid,
          driverName: driverProfile.name,
          driverPhone: driverProfile.phone,
          driverVehicle: driverProfile.vanModel,
          driverVanNumber: driverProfile.licensePlate,
          driverCoords: [-79.4035, 43.6635],
          acceptedAt: serverTimestamp(),
        })
      } catch (err) {
        console.error('Failed to accept booking in Firestore:', err)
      }
    }
  }

  // Driver update booking status (en_route, in_progress, completed) and live GPS coordinates
  const handleUpdateBookingStatus = async (
    bookingId: string,
    newStatus: BookingStatus,
    coords?: [number, number]
  ) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
            ...b,
            status: newStatus,
            ...(coords ? { driverCoords: coords } : {}),
          }
          : b
      )
    )

    if (currentUser) {
      try {
        const bookingDocRef = doc(db, 'bookings', bookingId)
        const updatePayload: Record<string, any> = {
          status: newStatus,
          updatedAt: serverTimestamp(),
        }
        if (coords) {
          updatePayload.driverCoords = coords
        }
        if (newStatus === 'completed') {
          updatePayload.completedAt = serverTimestamp()
        }
        await updateDoc(bookingDocRef, updatePayload)
      } catch (err) {
        console.error('Failed to update booking status in Firestore:', err)
      }
    }
  }

  // Unified Logout handler for both Customer and Driver portals
  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (e) {
      console.error('Firebase Sign-out error:', e)
    }
    showToast('You have been logged out.', 'info')
    setCurrentUser(null)
    setUserProfileData(null)
    setCurrentRole('customer')
    setAuthMode('login')
    setShowAuth(true)
  }

  // STEP 6 INTEGRATION: Save product order to Firestore 'orders' collection
  const handleCheckoutOrder = async (orderData: any): Promise<string> => {
    const orderId = `BCW-${Math.floor(10000 + Math.random() * 90000)}`
    if (currentUser) {
      try {
        const orderDocRef = doc(db, 'orders', orderId)
        await setDoc(orderDocRef, {
          id: orderId,
          userId: currentUser.uid,
          userEmail: currentUser.email || '',
          ...orderData,
          createdAt: orderData.createdAt || new Date().toISOString(),
          serverTimestamp: serverTimestamp(),
        })
      } catch (err) {
        console.error('Failed to sync product order to Firestore:', err)
      }
    }
    return orderId
  }

  // Cart operations
  const handleAddToCart = (product: any, quantity: number = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prev, { product, quantity }]
    })
    showToast(`${product.title} added to cart!`, 'success')
  }

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId))
    showToast('Item removed from cart.', 'info')
  }

  const handleClearCart = () => {
    setCartItems([])
  }

  return (
    <div className="min-h-screen w-full bg-white flex justify-center selection:bg-primary selection:text-primary-foreground">
      {/* 1. Launch Splash Screen (Fixed 375x812 iPhone Layout) */}
      {showSplash && (
        <SplashScreen
          onFinish={() => {
            setShowSplash(false)
            try {
              sessionStorage.setItem('bentley_splash_shown', 'true')
            } catch { }
          }}
          duration={2400}
          dismissible={true}
        />
      )}

      {/* 2. Launch Onboarding Screen (Drag-to-Right Next Slider) */}
      {showOnboarding && (
        <OnboardingScreen
          onNext={() => {
            setShowOnboarding(false)
            try {
              localStorage.setItem('bentley_onboarded', 'true')
            } catch { }
            setAuthMode('login')
            setShowAuth(true)
          }}
        />
      )}

      {/* 3. Launch Login & Signup Screen */}
      {showAuth && authMode === 'login' && (
        <Login
          initialRole={currentRole}
          onLoginSuccess={(user) => {
            setShowAuth(false)
            if (user?.role === 'driver') {
              setCurrentRole('driver')
            } else {
              setCurrentRole('customer')
              setCurrentTab('home')
            }
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onSwitchToSignup={(role) => {
            if (role) setCurrentRole(role)
            setAuthMode('signup')
          }}
          onSkip={() => {
            setShowAuth(false)
            setCurrentTab('home')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )}

      {showAuth && authMode === 'signup' && (
        <Signup
          initialRole={currentRole}
          onSignupSuccess={(user) => {
            setShowAuth(false)
            if (user?.role === 'driver') {
              setCurrentRole('driver')
            } else {
              setCurrentRole('customer')
              setCurrentTab('home')
            }
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onSwitchToLogin={(role) => {
            if (role) setCurrentRole(role)
            setAuthMode('login')
          }}
          onSkip={() => {
            setShowAuth(false)
            setCurrentTab('home')
            window.scrollTo({ top: 0, behavior: 'smooth' })
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
          />
        </div>
      )}

      {/* 5. Mobile, Tablet & Desktop App Canvas (Customer Portal) */}
      {isAppReady && currentRole === 'customer' && (
        <main
          className="w-full max-w-full min-h-screen bg-white relative flex flex-col"
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
                activeBookings={bookings}
                userProfile={
                  currentUser
                    ? {
                      name:
                        userProfileData?.fullName ||
                        currentUser.displayName ||
                        currentUser.email?.split('@')[0] ||
                        '',
                      email: userProfileData?.email || currentUser.email || '',
                      phone: userProfileData?.phone || currentUser.phoneNumber || '',
                      address: userProfileData?.address || '',
                      city: userProfileData?.city || '',
                      postalCode: userProfileData?.postalCode || '',
                    }
                    : undefined
                }
                cartItems={cartItems}
                onAddToCart={handleAddToCart}
                onUpdateCartQuantity={handleUpdateCartQuantity}
                onRemoveCartItem={handleRemoveCartItem}
                onClearCart={handleClearCart}
                onCheckoutOrder={handleCheckoutOrder}
                onOpenTracking={() => navigateToTab('bookings')}
                onUpdateLocation={(addr) => {
                  setDetectedAddress(addr)
                  try {
                    localStorage.setItem('bentley_detected_address', addr)
                  } catch { }
                }}
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
                savedVehiclesCount={savedVehicles.length}
                savedVehiclesList={savedVehicles.map((v) => v.name)}
                userProfile={
                  currentUser
                    ? {
                      name:
                        userProfileData?.fullName ||
                        currentUser.displayName ||
                        currentUser.email?.split('@')[0] ||
                        'Member',
                      email: userProfileData?.email || currentUser.email || '',
                      phone: userProfileData?.phone || currentUser.phoneNumber || '',
                      address: userProfileData?.address || detectedAddress || '',
                      city: userProfileData?.city || '',
                      postalCode: userProfileData?.postalCode || '',
                      avatar:
                        userProfileData?.avatar ||
                        currentUser.photoURL ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
                      preferredVehicle:
                        userProfileData?.preferredVehicle ||
                        (savedVehicles.length > 0 ? (savedVehicles.find((v) => v.isPrimary)?.name || savedVehicles[0].name) : currentVehicle) ||
                        '',
                      membershipTier: userProfileData?.membershipTier || 'General Member',
                    }
                    : undefined
                }
                onUpdateProfile={handleUpdateProfile}
                onLogout={handleLogout}
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
              userProfile={{
                name:
                  userProfileData?.fullName ||
                  currentUser?.displayName ||
                  currentUser?.email?.split('@')[0] ||
                  '',
                email: userProfileData?.email || currentUser?.email || '',
                phone: userProfileData?.phone || currentUser?.phoneNumber || '',
                address: userProfileData?.address || detectedAddress || '',
                city: userProfileData?.city || '',
                postalCode: userProfileData?.postalCode || '',
              }}
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

          {/* Dedicated Membership Plans Page - Temporarily commented out from UI */}
          {/*
          {isMembershipOpen && (
            <MembershipPage
              onBack={() => setIsMembershipOpen(false)}
              currentTier={userProfileData?.membershipTier || 'General Member'}
              onSelectMembership={async (planName: string) => {
                if (currentUser) {
                  try {
                    const userDocRef = doc(db, 'users', currentUser.uid)
                    await updateDoc(userDocRef, {
                      membershipTier: planName,
                      updatedAt: serverTimestamp(),
                    })
                  } catch (e) {
                    console.error('Failed to update membership tier in Firestore:', e)
                  }
                }
              }}
            />
          )}
          */}
        </main>
      )}
    </div>
  )
}

export default App
