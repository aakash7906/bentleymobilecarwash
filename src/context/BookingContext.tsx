import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { cleanUndefined } from '@/firebase/CloudFirestore/SetData'
import { BookingRecord, BookingStatus, PaymentCollectionData } from '@/types'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

export interface BookingContextType {
  bookings: BookingRecord[]
  setBookings: React.Dispatch<React.SetStateAction<BookingRecord[]>>
  handleBookingComplete: (newBooking: BookingRecord) => Promise<void>
  handleCancelBooking: (bookingId: string) => Promise<void>
  handleRescheduleBooking: (
    bookingId: string,
    newDate: string,
    newTime: string
  ) => Promise<void>
  handleRateBooking: (
    bookingId: string,
    rating: number,
    review: string
  ) => Promise<void>
  handleAcceptOrder: (bookingId: string) => Promise<void>
  handleUpdateBookingStatus: (
    bookingId: string,
    newStatus: BookingStatus,
    coords?: [number, number],
    paymentData?: PaymentCollectionData
  ) => Promise<void>
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

export const useBookings = (): BookingContextType => {
  const context = useContext(BookingContext)
  if (!context) {
    throw new Error('useBookings must be used within a BookingProvider')
  }
  return context
}

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, currentRole, driverProfile } = useAuth()
  const { showToast } = useToast()

  const [bookings, setBookings] = useState<BookingRecord[]>(() => {
    try {
      const stored = localStorage.getItem('bentley_bookings')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
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
    } catch {}
    return []
  })

  // Sync bookings with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bentley_bookings', JSON.stringify(bookings))
    } catch {}
  }, [bookings])

  // Reset when user logs out
  useEffect(() => {
    if (!currentUser) {
      setBookings([])
    }
  }, [currentUser])

  // Real-time listener for bookings
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

        loadedBookings.sort((a, b) => {
          const timeA = a.createdAt?.toDate
            ? a.createdAt.toDate().getTime()
            : new Date(a.createdAt || 0).getTime()
          const timeB = b.createdAt?.toDate
            ? b.createdAt.toDate().getTime()
            : new Date(b.createdAt || 0).getTime()
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

  // Save new booking
  const handleBookingComplete = async (newBooking: BookingRecord) => {
    setBookings((prev) => [newBooking, ...prev])
    const slotInfo =
      newBooking.date && newBooking.time ? ` for ${newBooking.date} at ${newBooking.time}` : ''
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

        // If booking contains bundled shop items, dynamically record in Firestore orders collection
        if (newBooking.shopItems && newBooking.shopItems.length > 0) {
          try {
            const orderDocRef = doc(collection(db, 'orders'))
            const orderPayload = cleanUndefined({
              id: orderDocRef.id,
              bookingId: newBooking.id,
              items: newBooking.shopItems,
              totalItemsCount: newBooking.shopItems.reduce((acc, c) => acc + c.quantity, 0),
              itemsSubtotal: newBooking.shopItemsTotal || 0,
              discountAmount: 0,
              shippingFee: 0,
              taxFee: Number(((newBooking.shopItemsTotal || 0) * 0.05).toFixed(2)),
              grandTotal: Number(((newBooking.shopItemsTotal || 0) * 1.05).toFixed(2)),
              paymentMethod: newBooking.paymentMethod || 'Cash on Delivery (COD)',
              paymentStatus: newBooking.paymentStatus || 'pending',
              deliveryType: 'technician_carwash_dispatch',
              shippingAddress: newBooking.address,
              customerName: newBooking.customerName,
              customerPhone: newBooking.customerPhone,
              customerEmail: newBooking.customerEmail || currentUser.email || '',
              userId: currentUser.uid,
              createdAt: serverTimestamp(),
            })
            await setDoc(orderDocRef, orderPayload)
          } catch (orderErr) {
            console.warn('Could not mirror shop items into orders collection:', orderErr)
          }
        }
      } catch (err) {
        console.error('Failed to sync booking to Firestore:', err)
      }
    }
  }

  // Cancel booking
  const handleCancelBooking = async (bookingId: string) => {
    const existing = bookings.find((b) => b.id === bookingId)
    if (existing && (existing.status === 'en_route' || existing.status === 'in_progress')) {
      showToast('Cancellation not allowed once technician starts riding or service has begun.', 'error')
      return
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' as const } : b))
    )
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

  // Reschedule booking
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

  // Rate booking
  const handleRateBooking = async (bookingId: string, rating: number, review: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, rating, review } : b))
    )
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

  // Driver accept order
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

  // Driver update booking status
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
                      (!b.paymentMethod ||
                        b.paymentMethod.toLowerCase().includes('completion') ||
                        b.paymentMethod.toLowerCase().includes('delivery'))
                        ? `Cash on Delivery (${paymentData.paymentCollectedMethod || 'Cash'} Collected)`
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
          if (paymentData.paymentCollectedBy)
            updatePayload.paymentCollectedBy = paymentData.paymentCollectedBy
          if (paymentData.paymentCollectedAt)
            updatePayload.paymentCollectedAt = paymentData.paymentCollectedAt
          if (paymentData.paymentCollectedMethod)
            updatePayload.paymentCollectedMethod = paymentData.paymentCollectedMethod
          if (paymentData.paymentNotes)
            updatePayload.paymentNotes = paymentData.paymentNotes
          const existing = bookings.find((b) => b.id === bookingId)
          if (
            paymentData.paymentStatus === 'paid' &&
            (!existing?.paymentMethod ||
              existing.paymentMethod.toLowerCase().includes('completion') ||
              existing.paymentMethod.toLowerCase().includes('delivery'))
          ) {
            updatePayload.paymentMethod = `Cash on Delivery (${paymentData.paymentCollectedMethod || 'Cash'} Collected)`
          }
        }
        await updateDoc(bookingDocRef, updatePayload)
      } catch (err) {
        console.error('Failed to update booking status in Firestore:', err)
      }
    }
  }

  return (
    <BookingContext.Provider
      value={{
        bookings,
        setBookings,
        handleBookingComplete,
        handleCancelBooking,
        handleRescheduleBooking,
        handleRateBooking,
        handleAcceptOrder,
        handleUpdateBookingStatus,
      }}
    >
      {children}
    </BookingContext.Provider>
  )
}
