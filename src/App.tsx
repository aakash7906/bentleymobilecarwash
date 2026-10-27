import React, { useState, useEffect } from 'react'
import { TabType, ServiceItem, SavedVehicle, BookingRecord, BookingStatus, UserProfile, DriverProfile, CartItem, PaymentCollectionData } from '@/types'
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
import { ContactUsPage } from '@/pages/Contact/ContactUsPage'
import { AboutUsPage } from '@/pages/About/AboutUsPage'
import { DriverDashboard } from '@/pages/Driver/DriverDashboardPage'
import { useToast } from '@/context/ToastContext'
// STEP 1 INTEGRATION: Import Firebase auth and session state listener
import { auth, db } from '@/firebase'
import { cleanUndefined } from '@/firebase/CloudFirestore/SetData'
import { onAuthStateChanged, signOut, deleteUser, User } from 'firebase/auth'
// STEP 2 & 3 INTEGRATION: Import Firestore real-time listeners and mutations
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  deleteField,
  serverTimestamp,
} from 'firebase/firestore'

export const App: React.FC = () => {
  // Global Toast Hook for cross-application user notifications
  const { showToast } = useToast()

  const [currentTab, setCurrentTab] = useState<TabType>(() => {
    try {
      const stored = localStorage.getItem('bentley_current_tab')
      if (stored && ['home', 'services', 'notifications', 'bookings', 'profile'].includes(stored)) {
        return stored as TabType
      }
    } catch { }
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
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  // Live GPS address detected from Home tab, forwarded seamlessly to BookingPage
  const [detectedAddress, setDetectedAddress] = useState<string>(() => {
    try {
      return localStorage.getItem('bentley_detected_address') || ''
    } catch {
      return ''
    }
  })
  const [detectedCity, setDetectedCity] = useState<string>(() => {
    try {
      return localStorage.getItem('bentley_detected_city') || ''
    } catch {
      return ''
    }
  })
  const [detectedPostalCode, setDetectedPostalCode] = useState<string>(() => {
    try {
      return localStorage.getItem('bentley_detected_postal') || ''
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
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  // STEP 2 INTEGRATION: Live user profile data fetched from Firestore 'users' collection
  const [userProfileData, setUserProfileData] = useState<{
    Name?: string
    name?: string
    fullName?: string
    email?: string
    phone?: string
    city?: string
    address?: string
    lastLocation?: string
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
    vehicles?: Record<string, SavedVehicle>
  } | null>(null)

  // Driver Profile State (Synced with localStorage & Firestore)
  const [driverProfile, setDriverProfile] = useState<DriverProfile>(() => {
    try {
      const stored = localStorage.getItem('bentley_driver_profile')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.avatar && parsed.avatar.includes('unsplash.com')) {
          parsed.avatar = ''
        }
        if (parsed.name === 'Alex Rivera') {
          parsed.name = ''
        }
        if (parsed.phone === '+1 (800) 555-9274') {
          parsed.phone = ''
        }
        if (parsed.licensePlate === 'BC-8492') {
          parsed.licensePlate = ''
        }
        return parsed
      }
    } catch { }
    return {
      name: '',
      email: '',
      phone: '',
      vanModel: 'Mobile Detailing Unit',
      licensePlate: '',
      serviceArea: 'Ontario & Greater Toronto Area',
      driverLicenseNumber: '',
      bio: '',
      emergencyContact: '',
      avatar: '',
      isAvailable: true,
      rating: 5.0,
      totalJobs: 0,
    }
  })

  // Persistent Saved Vehicles State (Synced with localStorage & Firestore - only dynamic user vehicles)
  const [savedVehicles, setSavedVehicles] = useState<SavedVehicle[]>(() => {
    try {
      const stored = localStorage.getItem('bentley_saved_vehicles')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          return parsed.filter((v) => v && !v.id?.startsWith('veh-'))
        }
      }
    } catch { }
    return []
  })

  // Persistent Bookings State (Synced with localStorage & Firestore - only real user bookings)
  const [bookings, setBookings] = useState<BookingRecord[]>(() => {
    try {
      const stored = localStorage.getItem('bentley_bookings')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          // Filter out obsolete seeded mock bookings and purge static placeholder technician names
          const sanitized = parsed
            .filter(
              (b) => b && !['bkg-101', 'bkg-102', 'bkg-103', 'bkg-104', 'bkg-105'].includes(b.id)
            )
            .map((b) => {
              let updated = { ...b }
              if (updated.driverName && updated.driverName.toLowerCase() === 'alex rivera') {
                updated.driverName = ''
              }
              if (updated.technicianName && updated.technicianName.toLowerCase() === 'alex rivera') {
                updated.technicianName = ''
              }
              if (updated.driverPhone && updated.driverPhone.includes('555-9274')) {
                updated.driverPhone = ''
              }
              if (updated.driverVanNumber && updated.driverVanNumber.includes('BC-8492')) {
                updated.driverVanNumber = ''
              }
              return updated
            })
          localStorage.setItem('bentley_bookings', JSON.stringify(sanitized))
          return sanitized
        }
      }
    } catch { }
    return []
  })

  // Active Vehicle State (Dynamic)
  const [currentVehicle, setCurrentVehicle] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('bentley_active_vehicle')
      if (stored && stored !== 'Audi A4 (5th Gen Facelift)') return stored
    } catch { }
    return ''
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

  // Tracks if the user's cart has been initialized/merged from Firestore for this session
  const syncedUserCartRef = React.useRef<string | null>(null)
  const isDeletingAccountRef = React.useRef(false)
  const userDocUnsubRef = React.useRef<(() => void) | null>(null)

  // Sync cartItems with localStorage and Cloud Firestore (when user is logged in)
  useEffect(() => {
    try {
      localStorage.setItem('bentley_cart_items', JSON.stringify(cartItems))
    } catch { }

    // If user is logged in and their initial cart sync has completed, update Firestore
    if (currentUser && syncedUserCartRef.current === currentUser.uid && !isDeletingAccountRef.current) {
      const userDocRef = doc(db, 'users', currentUser.uid)
      setDoc(userDocRef, { cart: cartItems, updatedAt: serverTimestamp() }, { merge: true }).catch((err) => {
        console.warn('Failed to sync cart update to Firestore:', err)
      })
    }
  }, [cartItems, currentUser])

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

  // Sync currentTab with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bentley_current_tab', currentTab)
    } catch { }
  }, [currentTab])

  // Sync isBookingOpen with localStorage
  useEffect(() => {
    try {
      if (isBookingOpen) {
        localStorage.setItem('bentley_booking_open', 'true')
      } else {
        localStorage.removeItem('bentley_booking_open')
      }
    } catch { }
  }, [isBookingOpen])

  // Sync bookingService with localStorage
  useEffect(() => {
    try {
      if (bookingService) {
        localStorage.setItem('bentley_booking_service', JSON.stringify(bookingService))
      } else {
        localStorage.removeItem('bentley_booking_service')
      }
    } catch { }
  }, [bookingService])

  // STEP 1 INTEGRATION: Persistent Firebase Auth session listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
        // Keep active tab on refresh; do not forcefully reset to 'home'
      } else {
        setCurrentUser(null)
        setUserProfileData(null)
        setDetectedAddress('')
        setSavedVehicles([])
        setCurrentVehicle('')
        setCurrentTab('home')
        try {
          localStorage.removeItem('bentley_detected_address')
          localStorage.removeItem('bentley_saved_vehicles')
          localStorage.removeItem('bentley_active_vehicle')
          localStorage.removeItem('bentley_current_tab')
          localStorage.removeItem('bentley_booking_open')
          localStorage.removeItem('bentley_booking_service')
          localStorage.removeItem('bentley_driver_tab')
          localStorage.removeItem('bentley_driver_map_booking_id')
          localStorage.removeItem('bentley_driver_profile_open')
          localStorage.removeItem('bentley_edit_profile_open')
          localStorage.removeItem('bentley_home_cart_open')
          localStorage.removeItem('bentley_customer_tracking_open')
          localStorage.removeItem('bentley_customer_tracking_id')
        } catch { }
        syncedUserCartRef.current = null
      }
      setIsAuthLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // STEP 2 INTEGRATION: Real-time listener for Firestore 'users' document
  useEffect(() => {
    if (!currentUser) {
      setUserProfileData(null)
      syncedUserCartRef.current = null
      return
    }

    // Subscribe to live updates of the logged-in user document in 'carwash' database
    const userDocRef = doc(db, 'users', currentUser.uid)
    const unsubDoc = onSnapshot(
      userDocRef,
      async (docSnap) => {
        if (isDeletingAccountRef.current) return
        if (docSnap.exists()) {
          const data = docSnap.data() as any
          setUserProfileData(data)
          if (data.role === 'driver') {
            setCurrentRole('driver')
            setDriverProfile((prev) => ({
              ...prev,
              name: data.Name || data.name || data.fullName || prev.name,
              email: data.email || prev.email,
              phone: data.driverPhone || data.phone || prev.phone,
              vanModel: data.driverVan || data.driverDetails?.vehicle || data.driverDetails?.vanNumber || prev.vanModel,
              licensePlate: data.driverPlate || data.driverDetails?.licensePlate || prev.licensePlate,
              serviceArea: data.serviceArea || prev.serviceArea,
              driverLicenseNumber: data.driverLicenseNumber || prev.driverLicenseNumber,
              avatar: (() => {
                const raw = data.avatar !== undefined ? data.avatar : (data.photoURL || prev.avatar || '')
                return raw && !raw.includes('unsplash.com') ? raw : ''
              })(),
            }))
          } else if (data.role === 'customer') {
            setCurrentRole('customer')
          }

          // DYNAMIC VEHICLES MAP SYNC:
          // Read vehicles directly from key-value pair (object/map) in user document
          if (data.vehicles && typeof data.vehicles === 'object') {
            const mapVehicles = (Object.values(data.vehicles) as SavedVehicle[]).filter(
              (v) => v && !v.id?.startsWith('veh-')
            )
            setSavedVehicles(mapVehicles)
            if (mapVehicles.length > 0) {
              const hasActive = mapVehicles.some((v) => v.name === currentVehicle)
              if (!hasActive) {
                const primaryVeh = mapVehicles.find((v) => v.isPrimary) || mapVehicles[0]
                setCurrentVehicle(data.preferredVehicle || primaryVeh.name)
              }
            } else {
              setCurrentVehicle('')
            }
          } else {
            setSavedVehicles([])
            setCurrentVehicle('')
          }

          // CART SYNC ON LOGIN:
          // Merge local cart and remote Firestore cloud cart seamlessly
          if (syncedUserCartRef.current !== currentUser.uid) {
            syncedUserCartRef.current = currentUser.uid
            const cloudCart: CartItem[] = Array.isArray(data.cart) ? data.cart : []

            setCartItems((localCart) => {
              if (localCart && localCart.length > 0) {
                const mergedMap = new Map<string, CartItem>()
                // Populate from remote cloud cart
                cloudCart.forEach((item) => {
                  if (item?.product?.id) {
                    mergedMap.set(item.product.id, item)
                  }
                })
                // Merge active local items (combine or take maximum quantity)
                localCart.forEach((localItem) => {
                  if (localItem?.product?.id) {
                    const existing = mergedMap.get(localItem.product.id)
                    if (existing) {
                      mergedMap.set(localItem.product.id, {
                        ...existing,
                        quantity: Math.max(existing.quantity, localItem.quantity),
                      })
                    } else {
                      mergedMap.set(localItem.product.id, localItem)
                    }
                  }
                })

                const merged = Array.from(mergedMap.values())
                // Push merged state back to user's Firestore document
                setDoc(
                  userDocRef,
                  { cart: merged, updatedAt: serverTimestamp() },
                  { merge: true }
                ).catch((err) => {
                  console.warn('Failed to sync merged cart to Firestore:', err)
                })
                return merged
              } else if (cloudCart.length > 0) {
                // If local cart is empty, restore saved cloud cart for the user
                return cloudCart
              }
              return localCart
            })
          }
        } else {
          setUserProfileData(null)
        }
      },
      (error) => {
        if (!isDeletingAccountRef.current) {
          console.error('Error fetching real-time user profile from Firestore:', error)
        }
      }
    )

    userDocUnsubRef.current = unsubDoc
    return () => {
      unsubDoc()
      userDocUnsubRef.current = null
    }
  }, [currentUser])

  // STEP 3 INTEGRATION: Real-time listener for user vehicles subcollection ('users/{uid}/vehicles') (fallback/sync)
  useEffect(() => {
    if (!currentUser) return

    const vehiclesColRef = collection(db, 'users', currentUser.uid, 'vehicles')
    const unsubVehicles = onSnapshot(
      vehiclesColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedVehicles: SavedVehicle[] = snapshot.docs
            .map((docSnap) => ({
              ...(docSnap.data() as SavedVehicle),
              id: docSnap.id,
            }))
            .filter((v) => v && !v.id?.startsWith('veh-'))
          setSavedVehicles((prev) => {
            const merged = [...prev.filter((v) => !v.id?.startsWith('veh-'))]
            loadedVehicles.forEach((v) => {
              if (!merged.some((m) => m.id === v.id)) {
                merged.push(v)
              }
            })
            return merged
          })
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
        // Sort latest bookings first (handles Firestore Timestamp, string date, or null)
        loadedBookings.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime()
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime()
          return timeB - timeA
        })
        setBookings((prev) => {
          if (
            prev.length === loadedBookings.length &&
            prev.every((p, idx) => {
              const n = loadedBookings[idx]
              return (
                p.id === n.id &&
                p.status === n.status &&
                p.paymentStatus === n.paymentStatus &&
                p.driverCoords?.[0] === n.driverCoords?.[0] &&
                p.driverCoords?.[1] === n.driverCoords?.[1]
              )
            })
          ) {
            return prev
          }
          return loadedBookings
        })
      },
      (error) => {
        console.error('Error listening to bookings in Firestore:', error)
      }
    )

    return () => unsubBookings()
  }, [currentUser, currentRole])

  // STEP 3.5 INTEGRATION: Automatically sync locally added vehicles to Firestore on login
  useEffect(() => {
    if (!currentUser || isDeletingAccountRef.current) return

    const realVehicles = savedVehicles.filter((v) => v && !v.id?.startsWith('veh-'))
    if (realVehicles.length > 0) {
      const userDocRef = doc(db, 'users', currentUser.uid)
      const vehiclesMap: Record<string, any> = {}
      realVehicles.forEach((v) => {
        const cleanV = Object.fromEntries(
          Object.entries(v).filter(([_, val]) => val !== undefined)
        )
        vehiclesMap[v.id] = cleanV
      })

      setDoc(
        userDocRef,
        {
          vehicles: vehiclesMap,
          preferredVehicle: currentVehicle || realVehicles[0].name,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((err) => {
        console.warn('Could not sync user vehicles to Firestore upon login:', err)
      })
    }
  }, [currentUser?.uid])

  const isAuthenticated = Boolean(currentUser)
  const isAppReady = !showSplash && !showOnboarding && !isAuthLoading && isAuthenticated
  const showAuthScreen = !showSplash && !showOnboarding && !isAuthLoading && !isAuthenticated

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

  // Unified global location updater (keeps HomeTab, BookingPage, localStorage & Firestore in sync)
  const handleUpdateGlobalLocation = async (
    addr: string,
    cityVal?: string,
    postalVal?: string,
    streetVal?: string
  ) => {
    setDetectedAddress(addr)
    if (cityVal) setDetectedCity(cityVal)
    if (postalVal) setDetectedPostalCode(postalVal)

    try {
      localStorage.setItem('bentley_detected_address', addr)
      if (cityVal) localStorage.setItem('bentley_detected_city', cityVal)
      if (postalVal) localStorage.setItem('bentley_detected_postal', postalVal)
    } catch { }

    setUserProfileData((prev: any) => ({
      ...prev,
      lastLocation: addr,
      address: streetVal || addr,
      city: cityVal || prev?.city || '',
      postalCode: postalVal || prev?.postalCode || '',
    }))

    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid)
        await setDoc(
          userDocRef,
          {
            lastLocation: addr,
            address: streetVal || addr,
            city: cityVal || '',
            postalCode: postalVal || '',
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      } catch (err) {
        console.error('Failed to sync location to Firestore in App:', err)
      }
    }
  }

  // STEP 3 INTEGRATION: Save vehicle to Firestore as key-value pair (object/map) in user document
  const handleVehicleAdded = async (newVehicle: SavedVehicle) => {
    const updatedVehicle: SavedVehicle = {
      ...newVehicle,
      isPrimary: true,
    }

    // 1. Update local state immediately for instant responsive UI
    setSavedVehicles((prev) => [
      updatedVehicle,
      ...prev.filter((v) => v.id !== newVehicle.id).map((v) => ({ ...v, isPrimary: false })),
    ])
    setCurrentVehicle(updatedVehicle.name)
    showToast(`${updatedVehicle.name} added to your garage!`, 'success')

    // 2. Persist to Firestore inside users collection document under 'vehicles' key-value pair map
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid)

        // Clean object without any undefined fields
        const cleanVehicle: Record<string, any> = {
          id: updatedVehicle.id,
          name: updatedVehicle.name,
          brand: updatedVehicle.brand || '',
          model: updatedVehicle.model || '',
          year: updatedVehicle.year || '',
          color: updatedVehicle.color || '',
          type: updatedVehicle.type || '',
          isPrimary: true,
          createdAt: new Date().toISOString(),
        }
        if (updatedVehicle.variant) cleanVehicle.variant = updatedVehicle.variant
        if (updatedVehicle.licensePlate) cleanVehicle.licensePlate = updatedVehicle.licensePlate
        if (updatedVehicle.specs) cleanVehicle.specs = updatedVehicle.specs

        // Store as key-value pair in user document
        await setDoc(
          userDocRef,
          {
            vehicles: {
              [cleanVehicle.id]: cleanVehicle,
            },
            preferredVehicle: cleanVehicle.name,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )

        // Also sync to subcollection for backward compatibility
        const vehicleDocRef = doc(db, 'users', currentUser.uid, 'vehicles', cleanVehicle.id)
        await setDoc(
          vehicleDocRef,
          {
            ...cleanVehicle,
            userId: currentUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      } catch (err) {
        console.error('Failed to sync new vehicle to Firestore:', err)
      }
    }
  }

  const handleSelectVehicle = async (vehicleName: string) => {
    setCurrentVehicle(vehicleName)
    const updated = savedVehicles.map((v) => ({
      ...v,
      isPrimary: v.name === vehicleName,
    }))
    setSavedVehicles(updated)
    // Toast notification for switching active vehicle
    showToast(`Active vehicle switched to ${vehicleName}.`, 'info')

    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid)
        const vehiclesMap: Record<string, any> = {}
        updated.forEach((v) => {
          const cleanV = Object.fromEntries(
            Object.entries(v).filter(([_, val]) => val !== undefined)
          )
          vehiclesMap[v.id] = cleanV
        })
        await setDoc(
          userDocRef,
          {
            vehicles: vehiclesMap,
            preferredVehicle: vehicleName,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      } catch (err) {
        console.error('Failed to sync active vehicle to Firestore:', err)
      }
    }
  }

  // STEP 3 INTEGRATION: Delete vehicle from Firestore key-value map & local state
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
        const userDocRef = doc(db, 'users', currentUser.uid)
        // Remove key from vehicles key-value map in user document
        await updateDoc(userDocRef, {
          [`vehicles.${vehicleId}`]: deleteField(),
          updatedAt: serverTimestamp(),
        })

        // Also delete from subcollection for backward compatibility
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
        const payload = cleanUndefined({
          ...newBooking,
          licensePlate: newBooking.licensePlate || '',
          userId: currentUser.uid,
          userEmail: currentUser.email || '',
          createdAt: serverTimestamp(),
          serverTimestamp: serverTimestamp(),
        })
        await setDoc(bookingDocRef, payload)
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
        await setDoc(userDocRef, {
          Name: updated.name,
          name: updated.name,
          fullName: updated.name,
          phone: updated.phone || '',
          address: updated.address || '',
          city: updated.city || '',
          postalCode: updated.postalCode || '',
          avatar: updated.avatar || '',
          preferredVehicle: updated.preferredVehicle || '',
          membershipTier: updated.membershipTier || 'General Member',
          updatedAt: serverTimestamp(),
        }, { merge: true })
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
        await setDoc(userDocRef, {
          Name: updated.name,
          name: updated.name,
          fullName: updated.name,
          driverPhone: updated.phone,
          driverVan: updated.vanModel,
          driverPlate: updated.licensePlate,
          vehicles: {
            [`van-${currentUser.uid.slice(0, 6)}`]: {
              id: `van-${currentUser.uid.slice(0, 6)}`,
              name: updated.vanModel,
              brand: updated.vanModel.split(' ')[0] || 'Van',
              model: updated.vanModel,
              licensePlate: updated.licensePlate,
              type: 'Van',
              isPrimary: true,
              color: 'White',
              updatedAt: new Date().toISOString(),
            }
          },
          serviceArea: updated.serviceArea,
          driverLicenseNumber: updated.driverLicenseNumber || '',
          bio: updated.bio || '',
          avatar: updated.avatar,
          isAvailable: updated.isAvailable,
          updatedAt: serverTimestamp(),
        }, { merge: true })
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
            driverAvatar: driverProfile.avatar || '',
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
          driverAvatar: driverProfile.avatar || '',
          driverCoords: [-79.4035, 43.6635],
          acceptedAt: serverTimestamp(),
        })
      } catch (err) {
        console.error('Failed to accept booking in Firestore:', err)
      }
    }
  }

  // Driver update booking status (en_route, in_progress, completed), live GPS coordinates & COD payment collection
  const handleUpdateBookingStatus = async (
    bookingId: string,
    newStatus: BookingStatus,
    coords?: [number, number],
    paymentData?: PaymentCollectionData
  ) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
            ...b,
            status: newStatus,
            ...(coords ? { driverCoords: coords } : {}),
            ...(paymentData
              ? {
                paymentStatus: paymentData.paymentStatus || b.paymentStatus,
                paymentCollectedBy: paymentData.paymentCollectedBy,
                paymentCollectedAt: paymentData.paymentCollectedAt,
                paymentCollectedMethod: paymentData.paymentCollectedMethod,
                paymentNotes: paymentData.paymentNotes,
                paymentMethod:
                  paymentData.paymentStatus === 'paid' &&
                  (!b.paymentMethod || b.paymentMethod.toLowerCase().includes('completion'))
                    ? `Pay on Completion (${paymentData.paymentCollectedMethod || 'Cash'} Collected)`
                    : b.paymentMethod,
              }
              : {}),
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
        if (paymentData) {
          if (paymentData.paymentStatus) updatePayload.paymentStatus = paymentData.paymentStatus
          if (paymentData.paymentCollectedBy) updatePayload.paymentCollectedBy = paymentData.paymentCollectedBy
          if (paymentData.paymentCollectedAt) updatePayload.paymentCollectedAt = paymentData.paymentCollectedAt
          if (paymentData.paymentCollectedMethod) updatePayload.paymentCollectedMethod = paymentData.paymentCollectedMethod
          if (paymentData.paymentNotes) updatePayload.paymentNotes = paymentData.paymentNotes
          const existing = bookings.find((b) => b.id === bookingId)
          if (
            paymentData.paymentStatus === 'paid' &&
            (!existing?.paymentMethod || existing.paymentMethod.toLowerCase().includes('completion'))
          ) {
            updatePayload.paymentMethod = `Pay on Completion (${paymentData.paymentCollectedMethod || 'Cash'} Collected)`
          }
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
    setDetectedAddress('')
    setSavedVehicles([])
    setCurrentVehicle('')
    try {
      localStorage.removeItem('bentley_detected_address')
      localStorage.removeItem('bentley_saved_vehicles')
      localStorage.removeItem('bentley_active_vehicle')
      localStorage.removeItem('bentley_current_tab')
      localStorage.removeItem('bentley_booking_open')
      localStorage.removeItem('bentley_booking_service')
      localStorage.removeItem('bentley_driver_tab')
      localStorage.removeItem('bentley_driver_map_booking_id')
      localStorage.removeItem('bentley_driver_profile_open')
      localStorage.removeItem('bentley_edit_profile_open')
      localStorage.removeItem('bentley_home_cart_open')
      localStorage.removeItem('bentley_customer_tracking_open')
      localStorage.removeItem('bentley_customer_tracking_id')
    } catch { }
    setCurrentRole('customer')
    setCurrentTab('home')
    setAuthMode('login')
  }

  const handleDeleteAccount = async (): Promise<boolean> => {
    if (!currentUser) {
      try {
        localStorage.removeItem('bentley_user_profile')
        localStorage.removeItem('bentley_driver_profile')
        localStorage.removeItem('bentley_saved_vehicles')
        localStorage.removeItem('bentley_active_vehicle')
        localStorage.removeItem('bentley_cart_items')
        localStorage.removeItem('bentley_bookings')
        localStorage.removeItem('bentley_current_role')
        localStorage.removeItem('bentley_detected_address')
      } catch {}
      showToast('Profile and local account data deleted.', 'info')
      handleLogout()
      return true
    }

    isDeletingAccountRef.current = true
    if (userDocUnsubRef.current) {
      userDocUnsubRef.current()
      userDocUnsubRef.current = null
    }

    const uid = currentUser.uid
    const userEmail = currentUser.email?.trim() || userProfileData?.email?.trim() || ''

    try {
      // 1. Delete only this user's vehicles subcollection ('users/{uid}/vehicles')
      try {
        const vehiclesRef = collection(db, 'users', uid, 'vehicles')
        const snap = await getDocs(vehiclesRef)
        const deleteVehiclePromises = snap.docs.map((d) => deleteDoc(d.ref))
        await Promise.all(deleteVehiclePromises)
      } catch (vehErr) {
        console.warn('Could not delete subcollection vehicles:', vehErr)
      }

      // 2. Delete only this user's bookings from 'bookings' collection (where userId == uid)
      try {
        const userBookingsQuery = query(collection(db, 'bookings'), where('userId', '==', uid))
        const bookingsSnap = await getDocs(userBookingsQuery)
        const deleteBookingPromises = bookingsSnap.docs.map((d) => deleteDoc(d.ref))
        await Promise.all(deleteBookingPromises)
      } catch (bookErr) {
        console.warn('Could not delete user bookings from Firestore:', bookErr)
      }

      // Fallback: Also check if any bookings were recorded with userEmail
      if (userEmail) {
        try {
          const emailBookingsQuery = query(collection(db, 'bookings'), where('userEmail', '==', userEmail))
          const emailBookingsSnap = await getDocs(emailBookingsQuery)
          const deleteEmailBookingPromises = emailBookingsSnap.docs.map((d) => deleteDoc(d.ref))
          await Promise.all(deleteEmailBookingPromises)
        } catch (emailBookErr) {
          console.warn('Could not delete email-matched bookings:', emailBookErr)
        }
      }

      // 3. Delete only this user's product orders from 'orders' collection (where userId == uid)
      try {
        const userOrdersQuery = query(collection(db, 'orders'), where('userId', '==', uid))
        const ordersSnap = await getDocs(userOrdersQuery)
        const deleteOrderPromises = ordersSnap.docs.map((d) => deleteDoc(d.ref))
        await Promise.all(deleteOrderPromises)
      } catch (orderErr) {
        console.warn('Could not delete user orders from Firestore:', orderErr)
      }

      // Fallback: Also check if any orders were recorded with userEmail
      if (userEmail) {
        try {
          const emailOrdersQuery = query(collection(db, 'orders'), where('userEmail', '==', userEmail))
          const emailOrdersSnap = await getDocs(emailOrdersQuery)
          const deleteEmailOrderPromises = emailOrdersSnap.docs.map((d) => deleteDoc(d.ref))
          await Promise.all(deleteEmailOrderPromises)
        } catch (emailOrderErr) {
          console.warn('Could not delete email-matched orders:', emailOrderErr)
        }
      }

      // 4. Delete only this user's inquiries from 'inquiries' collection (where email == userEmail)
      if (userEmail) {
        try {
          const userInquiriesQuery = query(collection(db, 'inquiries'), where('email', '==', userEmail))
          const inquiriesSnap = await getDocs(userInquiriesQuery)
          const deleteInquiryPromises = inquiriesSnap.docs.map((d) => deleteDoc(d.ref))
          await Promise.all(deleteInquiryPromises)
        } catch (inqErr) {
          console.warn('Could not delete user inquiries:', inqErr)
        }
      }

      // 5. Delete only this user's profile document from 'users' collection ('users/{uid}')
      try {
        const userDocRef = doc(db, 'users', uid)
        await deleteDoc(userDocRef)
      } catch (docErr) {
        console.warn('Could not delete user document from Firestore:', docErr)
      }

      // 6. Delete user from Firebase Authentication
      await deleteUser(currentUser)

      // 7. Clean up local storage
      try {
        localStorage.removeItem('bentley_user_profile')
        localStorage.removeItem('bentley_driver_profile')
        localStorage.removeItem('bentley_saved_vehicles')
        localStorage.removeItem('bentley_active_vehicle')
        localStorage.removeItem('bentley_cart_items')
        localStorage.removeItem('bentley_bookings')
        localStorage.removeItem('bentley_current_role')
        localStorage.removeItem('bentley_detected_address')
      } catch {}

      // 8. Reset local state
      setCurrentUser(null)
      setUserProfileData(null)
      setDetectedAddress('')
      setSavedVehicles([])
      setBookings([])
      setCartItems([])
      setCurrentVehicle('')
      setCurrentRole('customer')
      setCurrentTab('home')

      showToast('Your account and data have been permanently deleted.', 'info')
      setAuthMode('login')
      isDeletingAccountRef.current = false
      return true
    } catch (err: any) {
      isDeletingAccountRef.current = false
      console.error('Account deletion error:', err)
      if (err.code === 'auth/requires-recent-login') {
        showToast('For security reasons, please log in again before deleting your account.', 'warning')
        try {
          await signOut(auth)
        } catch {}
        setCurrentUser(null)
        setAuthMode('login')
        return false
      }
      showToast(err.message || 'Failed to delete account. Please try again.', 'error')
      return false
    }
  }

  // STEP 6 INTEGRATION: Save product order to Firestore 'orders' collection using original Firestore document ID
  const handleCheckoutOrder = async (orderData: any): Promise<string> => {
    try {
      // Use Firestore's native auto-generated document ID
      const orderDocRef = doc(collection(db, 'orders'))
      const orderId = orderDocRef.id

      const payload = cleanUndefined({
        ...orderData,
        id: orderId,
        userId: currentUser ? currentUser.uid : '',
        userEmail: currentUser?.email || orderData.customerEmail || '',
        createdAt: serverTimestamp(),
        serverTimestamp: serverTimestamp(),
      })
      await setDoc(orderDocRef, payload)
      return orderId
    } catch (err) {
      console.error('Failed to sync product order to Firestore:', err)
      // Even in error, generate a genuine Firestore doc ID
      const fallbackDocRef = doc(collection(db, 'orders'))
      return fallbackDocRef.id
    }
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
          }}
        />
      )}

      {/* 3. Launch Login & Signup Screen (Authentication Required) */}
      {showAuthScreen && authMode === 'login' && (
        <Login
          initialRole={currentRole}
          onLoginSuccess={(user) => {
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
            setCurrentTab('home')
            setAuthMode('signup')
          }}
        />
      )}

      {showAuthScreen && authMode === 'signup' && (
        <Signup
          initialRole={currentRole}
          onSignupSuccess={(user) => {
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
                        userProfileData?.Name ||
                        userProfileData?.fullName ||
                        currentUser.displayName ||
                        currentUser.email?.split('@')[0] ||
                        '',
                      email: userProfileData?.email || currentUser.email || '',
                      phone: userProfileData?.phone || currentUser.phoneNumber || '',
                      address: userProfileData?.address || detectedAddress || userProfileData?.lastLocation || '',
                      lastLocation: userProfileData?.lastLocation || detectedAddress || userProfileData?.address || '',
                      city: userProfileData?.city || detectedCity || '',
                      postalCode: userProfileData?.postalCode || detectedPostalCode || '',
                    }
                    : undefined
                }
                detectedAddress={detectedAddress || userProfileData?.lastLocation || userProfileData?.address || ''}
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
                        (userProfileData?.preferredVehicle && userProfileData.preferredVehicle !== 'Audi A4 (5th Gen Facelift)'
                          ? userProfileData.preferredVehicle
                          : '') ||
                        (savedVehicles.length > 0
                          ? (savedVehicles.find((v) => v.isPrimary)?.name || savedVehicles[0].name)
                          : (currentVehicle && currentVehicle !== 'Audi A4 (5th Gen Facelift)' ? currentVehicle : '')) ||
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

          {/* Full Service Detail & Order Summary Modal */}
          {selectedService && (
            <ServiceDetailModal
              key={`${selectedService.id}-${selectedService.selectedTier || selectedService.priceNumeric}`}
              service={selectedService}
              onClose={() => setSelectedService(null)}
              onBookNow={handleBookNow}
            />
          )}

          {/* Dedicated Full Booking Page Flow */}
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
                address: userProfileData?.address || detectedAddress || userProfileData?.lastLocation || '',
                lastLocation: userProfileData?.lastLocation || detectedAddress || userProfileData?.address || '',
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

          {/* Dedicated Contact Us Full Page Modal */}
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

          {/* Dedicated About Us Full Page Modal */}
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
