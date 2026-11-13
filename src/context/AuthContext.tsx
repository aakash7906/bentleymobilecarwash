import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { User, onAuthStateChanged, signOut, deleteUser } from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { UserProfile, AdminProfile, DriverProfile } from '@/types'
import { useToast } from './ToastContext'

export interface AuthContextType {
  currentUser: User | null
  isAuthLoading: boolean
  isResolvingRole: boolean
  currentRole: 'customer' | 'admin'
  setCurrentRole: (role: 'customer' | 'admin') => void
  authMode: 'login' | 'signup'
  setAuthMode: (mode: 'login' | 'signup') => void
  userProfileData: any
  setUserProfileData: React.Dispatch<React.SetStateAction<any>>
  adminProfile: AdminProfile
  setAdminProfile: React.Dispatch<React.SetStateAction<AdminProfile>>
  driverProfile: AdminProfile
  setDriverProfile: React.Dispatch<React.SetStateAction<AdminProfile>>
  detectedAddress: string
  detectedCity: string
  detectedPostalCode: string
  handleUpdateGlobalLocation: (
    addr: string,
    cityVal?: string,
    postalVal?: string,
    streetVal?: string
  ) => Promise<void>
  handleUpdateProfile: (updated: UserProfile) => Promise<void>
  handleUpdateAdminProfile: (updated: AdminProfile) => Promise<void>
  handleUpdateDriverProfile: (updated: AdminProfile) => Promise<void>
  handleLogout: () => Promise<void>
  handleDeleteAccount: () => Promise<boolean>
  isDeletingAccountRef: React.MutableRefObject<boolean>
}

export const ADMIN_EMAILS: string[] = [
  'bentleymobilecarwash@gmail.com',
  'support@bentleycarwash.com',
]

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.trim().toLowerCase())
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast()

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isResolvingRole, setIsResolvingRole] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  const [currentRole, setCurrentRole] = useState<'customer' | 'admin'>(() => {
    try {
      const stored = localStorage.getItem('bentley_current_role')
      if (stored === 'admin' || stored === 'driver') return 'admin'
      if (stored === 'customer') return 'customer'
    } catch {}
    return 'customer'
  })

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

  // Cached user profile state initialized instantly from localStorage
  const [userProfileData, setUserProfileData] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('bentley_user_profile_cache')
      if (stored) return JSON.parse(stored)
    } catch {}
    return null
  })

  // Synchronize user profile updates to local cache for instant 0ms hydration on refresh
  useEffect(() => {
    try {
      if (userProfileData) {
        localStorage.setItem('bentley_user_profile_cache', JSON.stringify(userProfileData))
      } else if (!currentUser) {
        localStorage.removeItem('bentley_user_profile_cache')
      }
    } catch {}
  }, [userProfileData, currentUser])

  const [adminProfile, setAdminProfile] = useState<AdminProfile>(() => {
    try {
      const stored = localStorage.getItem('bentley_admin_profile') || localStorage.getItem('bentley_driver_profile')
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
    } catch {}
    return {
      name: 'Bentley Admin',
      email: 'bentleymobilecarwash@gmail.com',
      phone: '',
      vanModel: 'Admin Mobile Unit',
      licensePlate: '',
      serviceArea: 'Ontario & Greater Toronto Area',
      adminLicenseNumber: '',
      bio: '',
      emergencyContact: '',
      avatar: '',
      isAvailable: true,
      rating: 5.0,
      totalJobs: 0,
    }
  })

  const isDeletingAccountRef = useRef(false)
  const userDocUnsubRef = useRef<(() => void) | null>(null)

  // Sync role to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bentley_current_role', currentRole)
    } catch {}
  }, [currentRole])

  // Persistent Firebase Auth session listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsResolvingRole(true)
        setCurrentUser(user)
        try {
          const userDocSnap = await getDoc(doc(db, 'users', user.uid))
          let isAdmin = isAdminEmail(user.email)
          if (userDocSnap.exists()) {
            const data = userDocSnap.data()
            if (data?.role === 'admin' || data?.role === 'driver') {
              isAdmin = true
            }
          }

          if (isAdmin) {
            setCurrentRole('admin')
            try {
              localStorage.setItem('bentley_current_role', 'admin')
            } catch {}
          } else {
            setCurrentRole('customer')
            try {
              localStorage.setItem('bentley_current_role', 'customer')
            } catch {}
          }
        } catch (err) {
          console.warn('Could not prefetch user role:', err)
          if (isAdminEmail(user.email)) {
            setCurrentRole('admin')
            try {
              localStorage.setItem('bentley_current_role', 'admin')
            } catch {}
          }
        } finally {
          setIsResolvingRole(false)
          setIsAuthLoading(false)
        }
      } else {
        setCurrentUser(null)
        setUserProfileData(null)
        setDetectedAddress('')
        try {
          localStorage.removeItem('bentley_user_profile_cache')
          localStorage.removeItem('bentley_detected_address')
          localStorage.removeItem('bentley_saved_vehicles')
          localStorage.removeItem('bentley_active_vehicle')
          localStorage.removeItem('bentley_current_tab')
          localStorage.removeItem('bentley_booking_open')
          localStorage.removeItem('bentley_booking_service')
          localStorage.removeItem('bentley_admin_tab')
          localStorage.removeItem('bentley_admin_current_tab')
          localStorage.removeItem('bentley_admin_orders_subtab')
          localStorage.removeItem('bentley_admin_map_booking_id')
          localStorage.removeItem('bentley_admin_profile_open')
          localStorage.removeItem('bentley_admin_profile')
          localStorage.removeItem('bentley_driver_tab')
          localStorage.removeItem('bentley_driver_current_tab')
          localStorage.removeItem('bentley_driver_orders_subtab')
          localStorage.removeItem('bentley_driver_map_booking_id')
          localStorage.removeItem('bentley_driver_profile_open')
          localStorage.removeItem('bentley_edit_profile_open')
          localStorage.removeItem('bentley_home_cart_open')
          localStorage.removeItem('bentley_customer_tracking_open')
          localStorage.removeItem('bentley_customer_tracking_id')
        } catch {}
        setIsResolvingRole(false)
        setIsAuthLoading(false)
      }
    })
    return () => unsubscribe()
  }, [])

  // Real-time listener for Firestore 'users' document
  useEffect(() => {
    if (!currentUser) {
      setUserProfileData(null)
      return
    }

    const userDocRef = doc(db, 'users', currentUser.uid)
    const unsubDoc = onSnapshot(
      userDocRef,
      async (docSnap) => {
        if (isDeletingAccountRef.current) return
        if (docSnap.exists()) {
          const data = docSnap.data() as any
          setUserProfileData(data)
          const isAdmin =
            data.role === 'admin' ||
            isAdminEmail(currentUser.email) ||
            isAdminEmail(data.email)

          if (isAdmin) {
            setCurrentRole('admin')
            try {
              localStorage.setItem('bentley_current_role', 'admin')
            } catch {}
            const adminEmail = data.email || currentUser.email || 'bentleymobilecarwash@gmail.com'
            const adminName =
              data.Name ||
              data.name ||
              data.fullName ||
              (adminEmail === 'support@bentleycarwash.com' ? 'Bentley Support Admin' : 'Bentley Admin')
            setAdminProfile((prev) => ({
              ...prev,
              name: adminName,
              email: adminEmail,
              phone: data.driverPhone || data.phone || prev.phone,
              vanModel:
                data.driverVan ||
                data.driverDetails?.vehicle ||
                data.driverDetails?.vanNumber ||
                'Admin Mobile Unit',
              licensePlate:
                data.driverPlate || data.driverDetails?.licensePlate || prev.licensePlate,
              serviceArea: data.serviceArea || prev.serviceArea,
              driverLicenseNumber: data.driverLicenseNumber || prev.driverLicenseNumber,
              avatar: (() => {
                const raw =
                  data.avatar !== undefined ? data.avatar : data.photoURL || prev.avatar || ''
                return raw && !raw.includes('unsplash.com') ? raw : ''
              })(),
            }))
          } else {
            setCurrentRole('customer')
            try {
              localStorage.setItem('bentley_current_role', 'customer')
            } catch {}
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

  // Unified global location updater
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
    } catch {}

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
        console.error('Failed to sync location to Firestore:', err)
      }
    }
  }

  // Update user profile
  const handleUpdateProfile = async (updated: UserProfile) => {
    showToast('Profile updated successfully!', 'success')

    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid)
        await setDoc(
          userDocRef,
          {
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
          },
          { merge: true }
        )
      } catch (err) {
        console.error('Failed to update user profile in Firestore:', err)
      }
    }
  }

  // Update admin profile
  const handleUpdateAdminProfile = async (updated: AdminProfile) => {
    setAdminProfile(updated)
    try {
      localStorage.setItem('bentley_admin_profile', JSON.stringify(updated))
      localStorage.setItem('bentley_driver_profile', JSON.stringify(updated))
    } catch {}

    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid)
        await setDoc(
          userDocRef,
          {
            Name: updated.name,
            name: updated.name,
            fullName: updated.name,
            phone: updated.phone,
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
              },
            },
            serviceArea: updated.serviceArea,
            adminLicenseNumber: updated.adminLicenseNumber || '',
            bio: updated.bio || '',
            avatar: updated.avatar,
            isAvailable: updated.isAvailable,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      } catch (err) {
        console.error('Failed to update admin profile in Firestore:', err)
      }
    }
  }

  const handleUpdateDriverProfile = handleUpdateAdminProfile

  // Logout handler
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
    try {
      localStorage.removeItem('bentley_user_profile_cache')
      localStorage.removeItem('bentley_detected_address')
      localStorage.removeItem('bentley_saved_vehicles')
      localStorage.removeItem('bentley_active_vehicle')
      localStorage.removeItem('bentley_current_tab')
      localStorage.removeItem('bentley_booking_open')
      localStorage.removeItem('bentley_booking_service')
      localStorage.removeItem('bentley_driver_tab')
      localStorage.removeItem('bentley_driver_current_tab')
      localStorage.removeItem('bentley_driver_orders_subtab')
      localStorage.removeItem('bentley_driver_map_booking_id')
      localStorage.removeItem('bentley_driver_profile_open')
      localStorage.removeItem('bentley_edit_profile_open')
      localStorage.removeItem('bentley_home_cart_open')
      localStorage.removeItem('bentley_customer_tracking_open')
      localStorage.removeItem('bentley_customer_tracking_id')
    } catch {}
    setCurrentRole('customer')
    setAuthMode('login')
  }

  // Delete account handler
  const handleDeleteAccount = async (): Promise<boolean> => {
    if (!currentUser) {
      try {
        localStorage.removeItem('bentley_user_profile_cache')
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
      try {
        const vehiclesRef = collection(db, 'users', uid, 'vehicles')
        const snap = await getDocs(vehiclesRef)
        const deleteVehiclePromises = snap.docs.map((d) => deleteDoc(d.ref))
        await Promise.all(deleteVehiclePromises)
      } catch (vehErr) {
        console.warn('Could not delete subcollection vehicles:', vehErr)
      }

      try {
        const userBookingsQuery = query(collection(db, 'bookings'), where('userId', '==', uid))
        const bookingsSnap = await getDocs(userBookingsQuery)
        const deleteBookingPromises = bookingsSnap.docs.map((d) => deleteDoc(d.ref))
        await Promise.all(deleteBookingPromises)
      } catch (bookErr) {
        console.warn('Could not delete user bookings from Firestore:', bookErr)
      }

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

      try {
        const userOrdersQuery = query(collection(db, 'orders'), where('userId', '==', uid))
        const ordersSnap = await getDocs(userOrdersQuery)
        const deleteOrderPromises = ordersSnap.docs.map((d) => deleteDoc(d.ref))
        await Promise.all(deleteOrderPromises)
      } catch (orderErr) {
        console.warn('Could not delete user orders from Firestore:', orderErr)
      }

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

      try {
        const userDocRef = doc(db, 'users', uid)
        await deleteDoc(userDocRef)
      } catch (docErr) {
        console.warn('Could not delete user document from Firestore:', docErr)
      }

      await deleteUser(currentUser)

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

      setCurrentUser(null)
      setUserProfileData(null)
      setDetectedAddress('')
      setCurrentRole('customer')
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

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthLoading,
        isResolvingRole,
        currentRole,
        setCurrentRole,
        authMode,
        setAuthMode,
        userProfileData,
        setUserProfileData,
        adminProfile,
        setAdminProfile,
        driverProfile: adminProfile,
        setDriverProfile: setAdminProfile,
        detectedAddress,
        detectedCity,
        detectedPostalCode,
        handleUpdateGlobalLocation,
        handleUpdateProfile,
        handleUpdateAdminProfile,
        handleUpdateDriverProfile,
        handleLogout,
        handleDeleteAccount,
        isDeletingAccountRef,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
