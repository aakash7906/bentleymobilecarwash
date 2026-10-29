import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Truck,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  Navigation,
  Eye,
  X,
  ExternalLink,
  MessageSquare,
  Radio,
  History,
  Calendar,
  Package,
  ShoppingBag,
} from 'lucide-react'
import logoBentley from '@/assets/Logo_Bentley.png'
import { BookingRecord, BookingStatus, DriverProfile, PaymentCollectionData, ShopOrder, ShopOrderStatus } from '@/types'
import { computeEstimatedArrivalTime } from '@/services/dispatchService'
import { auth, db } from '@/firebase'
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { DriverMapView } from './DriverMapView'
import { DriverProfilePage } from './DriverProfilePage'
import { useToast } from '@/context/ToastContext'
import { Dialog } from '@/components/ui/dialog'
import { CodPaymentModal } from '@/components/CodPaymentModal'
import { DriverBottomNav, DriverTabType } from '@/components/DriverBottomNav'

interface DriverDashboardProps {
  bookings: BookingRecord[]
  onAcceptOrder: (bookingId: string) => void
  onUpdateStatus: (
    bookingId: string,
    newStatus: BookingStatus,
    coords?: [number, number],
    paymentData?: PaymentCollectionData,
    trackingData?: {
      estimatedMins?: number
      estimatedArrivalTime?: string
      distanceKm?: number
    }
  ) => void
  onLogout: () => void
  driverName?: string
  driverEmail?: string
  driverProfile?: DriverProfile
  onUpdateDriverProfile?: (updated: DriverProfile) => void
  onDeleteAccount?: () => Promise<boolean | void>
}

const DEFAULT_DRIVER_PROFILE: DriverProfile = {
  name: '',
  email: '',
  phone: '',
  vanModel: 'Mobile Detailing Unit',
  licensePlate: '',
  serviceArea: 'Ontario, Canada',
  driverLicenseNumber: '',
  emergencyContact: '',
  avatar: '',
  isAvailable: true,
  rating: 5.0,
  totalJobs: 0,
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({
  bookings,
  onAcceptOrder,
  onUpdateStatus,
  onLogout,
  driverName = '',
  driverEmail = '',
  driverProfile: externalProfile,
  onUpdateDriverProfile,
  onDeleteAccount,
}) => {
  const { showToast } = useToast()

  // 1. PRIMARY DRIVER NAVIGATION TABS: 'orders' | 'history' | 'profile'
  // Always default to 'orders' on fresh load or login so driver lands directly on Live Requests
  const [driverTab, setDriverTab] = useState<DriverTabType>(() => {
    try {
      const stored = localStorage.getItem('bentley_driver_current_tab')
      if (stored === 'orders' || stored === 'history') {
        return stored as DriverTabType
      }
    } catch {}
    return 'orders'
  })

  // 2. SUB-TAB INSIDE ORDERS: 'available' (Live Requests) | 'active' (My Active)
  const [ordersSubTab, setOrdersSubTab] = useState<'available' | 'active'>(() => {
    try {
      const stored = localStorage.getItem('bentley_driver_orders_subtab')
      if (stored === 'available' || stored === 'active') {
        return stored
      }
    } catch {}
    return 'available'
  })

  const [selectedBookingForMap, setSelectedBookingForMap] = useState<BookingRecord | null>(() => {
    try {
      const savedId = localStorage.getItem('bentley_driver_map_booking_id')
      if (savedId && Array.isArray(bookings)) {
        const found = bookings.find((b) => b.id === savedId)
        if (found && found.status !== 'completed' && found.status !== 'cancelled') {
          return found
        }
      }
    } catch {}
    return null
  })

  const [selectedDetailBooking, setSelectedDetailBooking] = useState<BookingRecord | null>(null)
  const [selectedDetailShopOrder, setSelectedDetailShopOrder] = useState<ShopOrder | null>(null)
  const [codPaymentBooking, setCodPaymentBooking] = useState<BookingRecord | null>(null)

  // Persist driver navigation tabs
  React.useEffect(() => {
    try {
      localStorage.setItem('bentley_driver_current_tab', driverTab)
    } catch {}
  }, [driverTab])

  React.useEffect(() => {
    try {
      localStorage.setItem('bentley_driver_orders_subtab', ordersSubTab)
    } catch {}
  }, [ordersSubTab])

  // Persist driver map view state
  React.useEffect(() => {
    try {
      if (selectedBookingForMap) {
        localStorage.setItem('bentley_driver_map_booking_id', selectedBookingForMap.id)
      } else {
        localStorage.removeItem('bentley_driver_map_booking_id')
      }
    } catch {}
  }, [selectedBookingForMap])

  // Restore driver map view if bookings load asynchronously after reload
  React.useEffect(() => {
    if (!selectedBookingForMap && bookings.length > 0) {
      try {
        const savedId = localStorage.getItem('bentley_driver_map_booking_id')
        if (savedId) {
          const found = bookings.find((b) => b.id === savedId)
          if (found && found.status !== 'completed' && found.status !== 'cancelled') {
            setSelectedBookingForMap(found)
          } else if (found && (found.status === 'completed' || found.status === 'cancelled')) {
            localStorage.removeItem('bentley_driver_map_booking_id')
          }
        }
      } catch {}
    }
  }, [bookings, selectedBookingForMap])

  // Clean up legacy profile open flag from localStorage to prevent unexpected modal popup
  React.useEffect(() => {
    try {
      localStorage.removeItem('bentley_driver_profile_open')
    } catch {}
  }, [])

  const sanitizeAvatar = (url?: string) => {
    if (!url) return ''
    if (url.includes('unsplash.com')) return ''
    return url
  }

  const formatDeliveredDate = (val: any): string => {
    if (!val) return 'Completed'
    try {
      let date: Date | null = null
      if (typeof val?.toDate === 'function') {
        date = val.toDate()
      } else if (val?.seconds) {
        date = new Date(val.seconds * 1000)
      } else if (typeof val === 'string' || typeof val === 'number') {
        date = new Date(val)
      } else if (val instanceof Date) {
        date = val
      }
      if (date && !isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      }
    } catch {}
    return 'Completed'
  }

  // Live Driver Profile
  const [profile, setProfile] = useState<DriverProfile>(() => {
    if (externalProfile) {
      return {
        ...externalProfile,
        avatar: sanitizeAvatar(externalProfile.avatar),
      }
    }
    try {
      const stored = localStorage.getItem('bentley_driver_profile')
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          ...parsed,
          avatar: sanitizeAvatar(parsed.avatar),
        }
      }
    } catch {}
    return {
      ...DEFAULT_DRIVER_PROFILE,
      name: driverName || 'Driver Partner',
      email: driverEmail || 'driver@bentleycarwash.com',
    }
  })

  // Sync external profile props with internal state
  React.useEffect(() => {
    if (externalProfile) {
      setProfile((prev) => ({
        ...prev,
        ...externalProfile,
        avatar: sanitizeAvatar(externalProfile.avatar || prev.avatar),
      }))
    }
  }, [externalProfile])

  // Filter Bookings by Status & Driver Assignment
  const availableOrders = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.status === 'pending' ||
          (b.status === 'scheduled' && !b.driverId && !b.driverName)
      ),
    [bookings]
  )

  const myActiveOrders = useMemo(
    () =>
      bookings.filter((b) => {
        const isActive =
          b.status === 'accepted' || b.status === 'en_route' || b.status === 'in_progress'
        if (!isActive) return false
        return (
          !b.driverName ||
          b.driverName === profile.name ||
          b.driverPhone === profile.phone ||
          b.technicianName === profile.name
        )
      }),
    [bookings, profile.name, profile.phone]
  )

  const completedOrders = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.status === 'completed' &&
          (!b.driverName ||
            b.driverName === profile.name ||
            b.driverPhone === profile.phone ||
            b.technicianName === profile.name)
      ),
    [bookings, profile.name, profile.phone]
  )

  // Real-time standalone shop delivery orders from Firestore
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([])
  const [jobCategoryFilter, setJobCategoryFilter] = useState<'all' | 'washes' | 'deliveries'>('all')
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<'all' | 'washes' | 'deliveries'>('all')

  useEffect(() => {
    const ordersRef = collection(db, 'orders')
    const unsub = onSnapshot(
      ordersRef,
      (snapshot) => {
        const loaded: ShopOrder[] = snapshot.docs.map((d) => ({
          ...(d.data() as any),
          id: d.id,
          status: (d.data().status || 'pending') as ShopOrderStatus,
          items: Array.isArray(d.data().items) ? d.data().items : [],
          grandTotal: d.data().grandTotal || '0.00',
        }))
        setShopOrders(loaded)
      },
      (err) => console.warn('Driver shop orders listener warning:', err)
    )
    return () => unsub()
  }, [])

  // Filter available standalone shop delivery orders
  const availableShopOrders = useMemo(
    () =>
      shopOrders.filter(
        (o) =>
          o.status === 'pending' &&
          !o.driverId &&
          o.deliveryType !== 'technician_carwash_dispatch'
      ),
    [shopOrders]
  )

  // Active driver shop delivery orders
  const myActiveShopOrders = useMemo(
    () =>
      shopOrders.filter((o) => {
        const isActive = o.status === 'accepted' || o.status === 'en_route'
        if (!isActive) return false
        return (
          o.driverId === auth.currentUser?.uid ||
          o.driverName === profile.name ||
          o.driverPhone === profile.phone
        )
      }),
    [shopOrders, profile.name, profile.phone]
  )

  // Completed driver shop delivery orders
  const completedShopOrders = useMemo(
    () =>
      shopOrders.filter(
        (o) =>
          o.status === 'delivered' &&
          (o.driverId === auth.currentUser?.uid ||
            o.driverName === profile.name ||
            o.driverPhone === profile.phone ||
            (!o.driverId && !o.driverName))
      ),
    [shopOrders, profile.name, profile.phone]
  )

  // Handle Driver Accepting Shop Delivery
  const handleAcceptShopOrder = async (order: ShopOrder) => {
    try {
      const orderRef = doc(db, 'orders', order.id)
      await updateDoc(orderRef, {
        status: 'accepted',
        driverId: auth.currentUser?.uid || 'driver-current',
        driverName: profile.name,
        driverPhone: profile.phone,
        driverVanNumber: profile.vanModel || profile.licensePlate || 'Mobile Detailing Van',
        driverAvatar: profile.avatar || '',
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      showToast(`Shop order #${order.id.slice(-6).toUpperCase()} accepted for delivery!`, 'success')
      setOrdersSubTab('active')
    } catch (err) {
      console.error('Failed to accept shop order:', err)
      showToast('Could not accept delivery. Please try again.', 'error')
    }
  }

  // Helper to convert ShopOrder to BookingRecord for DriverMapView
  const shopOrderToBookingRecord = useCallback((order: ShopOrder): BookingRecord => ({
    id: order.id,
    title: `Shop Delivery (${order.items?.length || 1} items)`,
    category: 'Shop Delivery',
    vehicle: 'Delivery Package',
    image: order.items?.[0]?.product?.image || '',
    price: `$${Number(order.grandTotal).toFixed(2)}`,
    totalNumeric: Number(order.grandTotal) || 0,
    date: 'Today',
    time: 'Now',
    status: order.status === 'en_route' ? 'en_route' : 'accepted',
    locationType: 'mobile',
    address: order.deliveryAddress || order.shippingAddress || '',
    customerName: order.recipientName || order.customerName,
    customerPhone: order.recipientPhone || order.customerPhone || '',
    driverName: profile.name,
    driverPhone: profile.phone,
    driverVanNumber: profile.licensePlate || profile.vanModel,
    driverCoords: order.driverCoords,
    customerCoords: order.customerCoords,
    estimatedMins: order.estimatedMins,
    estimatedArrivalTime: order.estimatedArrivalTime,
    distanceKm: order.distanceKm,
    createdAt: order.createdAt,
  }), [profile])

  // Handle Driver Updating Shop Order Delivery Status with live GPS & ETA tracking support
  const handleUpdateShopOrderStatus = async (
    orderId: string,
    newStatus: ShopOrderStatus,
    coords?: [number, number],
    trackingData?: {
      estimatedMins?: number
      estimatedArrivalTime?: string
      distanceKm?: number
    }
  ) => {
    try {
      const orderRef = doc(db, 'orders', orderId)
      const updateData: any = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      }
      if (newStatus === 'en_route') {
        const estMins = trackingData?.estimatedMins || 10
        updateData.estimatedMins = estMins
        updateData.estimatedArrivalTime =
          trackingData?.estimatedArrivalTime || computeEstimatedArrivalTime(estMins)
        if (coords) updateData.driverCoords = coords
        if (trackingData?.distanceKm !== undefined) updateData.distanceKm = trackingData.distanceKm
      }
      if (newStatus === 'delivered') {
        updateData.paymentStatus = 'paid'
        updateData.deliveredAt = serverTimestamp()
        updateData.paymentCollectedBy = profile.name
        updateData.paymentCollectedAt = serverTimestamp()
        updateData.estimatedMins = 0
      }
      await updateDoc(orderRef, updateData)
      showToast(newStatus === 'delivered' ? 'Order delivered and payment collected!' : `Delivery status updated to ${newStatus}`, 'success')
    } catch (err) {
      console.error('Failed to update delivery status:', err)
      showToast('Failed to update delivery status.', 'error')
    }
  }

  // Handle saving driver profile updates
  const handleSaveProfile = (updated: DriverProfile) => {
    const cleaned = {
      ...updated,
      avatar: sanitizeAvatar(updated.avatar),
    }
    setProfile(cleaned)
    try {
      localStorage.setItem('bentley_driver_profile', JSON.stringify(cleaned))
    } catch {}

    if (onUpdateDriverProfile) {
      onUpdateDriverProfile(cleaned)
    }
  }

  // Handle accepting order
  const handleAccept = (booking: BookingRecord) => {
    onAcceptOrder(booking.id)
    showToast(`Order #${booking.id} accepted! Opening live route navigation.`, 'success')
    // Seamlessly focus on My Active
    setOrdersSubTab('active')
    // Open map right away for live dispatch
    setSelectedBookingForMap({
      ...booking,
      status: 'accepted',
      driverName: profile.name,
      driverPhone: profile.phone,
      driverVanNumber: profile.licensePlate,
      driverVehicle: profile.vanModel,
    })
  }

  return (
    <div className="w-full min-h-screen bg-canvas flex flex-col selection:bg-primary selection:text-primary-foreground">
      {/* 1. DRIVER PROFILE PAGE / MODAL */}
      <DriverProfilePage
        isOpen={driverTab === 'profile'}
        onClose={() => setDriverTab('orders')}
        profile={profile}
        onSave={handleSaveProfile}
        onLogout={onLogout}
        onDeleteAccount={onDeleteAccount}
        completedJobsCount={completedOrders.length}
      />

      {/* 2. DRIVER MAP MODAL */}
      {selectedBookingForMap && (() => {
        const isShopOrder = shopOrders.some((o) => o.id === selectedBookingForMap.id)
        const currentShopOrder = isShopOrder ? shopOrders.find((o) => o.id === selectedBookingForMap.id) : null
        const targetBooking = isShopOrder && currentShopOrder
          ? shopOrderToBookingRecord(currentShopOrder)
          : bookings.find((b) => b.id === selectedBookingForMap.id) || selectedBookingForMap

        return (
          <DriverMapView
            booking={targetBooking}
            onBack={() => setSelectedBookingForMap(null)}
            onUpdateStatus={(id: string, status: BookingStatus, coords?: [number, number], paymentData?: PaymentCollectionData, trackingData?: any) => {
              if (isShopOrder) {
                const shopStatus: ShopOrderStatus =
                  status === 'completed'
                    ? 'delivered'
                    : status === 'in_progress' || status === 'en_route'
                    ? 'en_route'
                    : 'accepted'
                handleUpdateShopOrderStatus(id, shopStatus, coords, trackingData)
                if (status === 'completed') {
                  setSelectedBookingForMap(null)
                  showToast('Delivery completed! Order marked delivered.', 'success')
                }
              } else {
                onUpdateStatus(id, status, coords, paymentData, trackingData)
                if (status === 'completed') {
                  setSelectedBookingForMap(null)
                  showToast('Wash completed! Order recorded in history.', 'success')
                }
              }
            }}
            driverProfile={profile}
          />
        )
      })()}

      {/* 3. ORDER DETAILS MODAL */}
      <Dialog
        isOpen={!!selectedDetailBooking}
        onClose={() => setSelectedDetailBooking(null)}
        zIndex="z-60"
        position="center"
        maxWidth="md"
        contentClassName="p-5 sm:p-6"
      >
        {selectedDetailBooking && (
          <>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-gray-900">Order Information</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailBooking(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-xs">
              <div className="p-3.5 bg-surface-subtle rounded-2xl border border-gray-100 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Customer</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-900">
                    {selectedDetailBooking.customerName}
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${selectedDetailBooking.customerPhone}`}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold hover:bg-emerald-100 flex items-center gap-1 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 fill-emerald-600" />
                      <span>Call</span>
                    </a>
                    <a
                      href={`sms:${selectedDetailBooking.customerPhone}`}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold hover:bg-blue-100 flex items-center gap-1 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>SMS</span>
                    </a>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1 text-gray-600">
                  <span className="truncate max-w-[260px]">{selectedDetailBooking.address}</span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedDetailBooking.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-bold hover:underline inline-flex items-center gap-0.5 shrink-0"
                  >
                    <span>Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="p-3.5 bg-surface-subtle rounded-2xl border border-gray-100 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  Vehicle & Service
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{selectedDetailBooking.vehicle}</span>
                  <span className="font-mono font-bold text-primary text-sm">
                    {selectedDetailBooking.price}
                  </span>
                </div>
                <span className="text-gray-600">Service: {selectedDetailBooking.title}</span>
                {selectedDetailBooking.licensePlate && (
                  <span className="text-gray-500 text-[11px]">
                    Plate: {selectedDetailBooking.licensePlate}
                  </span>
                )}
                {selectedDetailBooking.addons && selectedDetailBooking.addons.length > 0 && (
                  <div className="mt-1 pt-1 border-t border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Add-ons:</span>
                    <ul className="list-disc list-inside text-gray-700 mt-0.5">
                      {selectedDetailBooking.addons.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl text-gray-700">
                <span className="font-medium">Appointment:</span>
                <span className="font-bold">
                  {selectedDetailBooking.date} • {selectedDetailBooking.time}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl text-gray-700">
                <span className="font-medium">Payment Mode:</span>
                <span className="font-bold">
                  {selectedDetailBooking.paymentMethod || 'Cash on Delivery (COD)'}
                </span>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              {selectedDetailBooking.status === 'pending' ||
              (selectedDetailBooking.status === 'scheduled' && !selectedDetailBooking.driverId) ? (
                <button
                  type="button"
                  onClick={() => {
                    handleAccept(selectedDetailBooking)
                    setSelectedDetailBooking(null)
                  }}
                  className="w-full py-3 rounded-2xl bg-primary hover:bg-primary-hover active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Order & Start Delivery</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBookingForMap(selectedDetailBooking)
                    setSelectedDetailBooking(null)
                  }}
                  className="w-full py-3 rounded-2xl bg-secondary hover:bg-neutral-900 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Navigation className="w-4 h-4 fill-white" />
                  <span>Open Live Map & Route</span>
                </button>
              )}
            </div>
          </>
        )}
      </Dialog>

      {/* 3.1 SHOP ORDER DETAILS MODAL */}
      <Dialog
        isOpen={!!selectedDetailShopOrder}
        onClose={() => setSelectedDetailShopOrder(null)}
        zIndex="z-60"
        position="center"
        maxWidth="md"
        contentClassName="p-5 sm:p-6"
      >
        {selectedDetailShopOrder && (
          <>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-gray-900">
                  Shop Delivery #{selectedDetailShopOrder.id.slice(-6).toUpperCase()}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailShopOrder(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-xs">
              {/* Customer & Address */}
              <div className="p-3.5 bg-surface-subtle rounded-2xl border border-gray-100 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Customer & Delivery Location</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-900">
                    {selectedDetailShopOrder.recipientName || selectedDetailShopOrder.customerName || 'Customer'}
                  </span>
                  {(selectedDetailShopOrder.recipientPhone || selectedDetailShopOrder.customerPhone) && (
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${selectedDetailShopOrder.recipientPhone || selectedDetailShopOrder.customerPhone}`}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold hover:bg-emerald-100 flex items-center gap-1 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 fill-emerald-600" />
                        <span>Call</span>
                      </a>
                      <a
                        href={`sms:${selectedDetailShopOrder.recipientPhone || selectedDetailShopOrder.customerPhone}`}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold hover:bg-blue-100 flex items-center gap-1 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>SMS</span>
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1 text-gray-600">
                  <span className="truncate max-w-[260px]">
                    {selectedDetailShopOrder.deliveryAddress || selectedDetailShopOrder.shippingAddress || 'Address on file'}
                    {selectedDetailShopOrder.deliveryCity ? `, ${selectedDetailShopOrder.deliveryCity}` : ''}
                  </span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedDetailShopOrder.deliveryAddress || selectedDetailShopOrder.shippingAddress || '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-bold hover:underline inline-flex items-center gap-0.5 shrink-0"
                  >
                    <span>Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Items List */}
              <div className="p-3.5 bg-surface-subtle rounded-2xl border border-gray-100 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  Purchased Products ({selectedDetailShopOrder.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0} items)
                </span>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {selectedDetailShopOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 bg-white p-2 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.product?.image ? (
                          <img src={item.product.image} alt={item.product.title} className="w-9 h-9 rounded-lg object-cover border border-gray-100 shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center text-primary shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-gray-900 text-xs truncate">{item.product?.title || 'Product'}</span>
                          <span className="text-[11px] text-gray-500">Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-gray-900 text-xs shrink-0">
                        ${((Number(item.product?.priceNumeric || 0) || Number(String(item.product?.price || '').replace(/[^0-9.]/g, '')) || 0) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Payment Method */}
              <div className="p-3.5 bg-surface-subtle rounded-2xl border border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Payment Method</span>
                  <div className="text-xs font-bold text-gray-900 capitalize mt-0.5">
                    {selectedDetailShopOrder.paymentMethod === 'cod' ? 'Cash on Delivery (Collect Cash)' : (selectedDetailShopOrder.paymentMethod || 'Prepaid')}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Grand Total</span>
                  <div className="text-base font-black text-primary font-mono">
                    ${Number(selectedDetailShopOrder.grandTotal).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-100">
              {selectedDetailShopOrder.status === 'pending' ? (
                <button
                  type="button"
                  onClick={() => {
                    handleAcceptShopOrder(selectedDetailShopOrder)
                    setSelectedDetailShopOrder(null)
                  }}
                  className="w-full py-3 rounded-2xl bg-primary hover:bg-primary-hover active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Package className="w-4 h-4" />
                  <span>Accept Shop Delivery</span>
                </button>
              ) : selectedDetailShopOrder.status === 'accepted' ? (
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateShopOrderStatus(selectedDetailShopOrder.id, 'en_route')
                    setSelectedDetailShopOrder(null)
                  }}
                  className="w-full py-3 rounded-2xl bg-primary hover:bg-primary-hover active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Mark En Route</span>
                </button>
              ) : selectedDetailShopOrder.status === 'en_route' ? (
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateShopOrderStatus(selectedDetailShopOrder.id, 'delivered')
                    setSelectedDetailShopOrder(null)
                  }}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Delivered & Confirm Cash Collected</span>
                </button>
              ) : selectedDetailShopOrder.status === 'delivered' ? (
                <div className="w-full py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Delivery Fulfilled & Payment Collected</span>
                </div>
              ) : null}
            </div>
          </>
        )}
      </Dialog>

      {/* 4. MAIN RESPONSIVE DASHBOARD LAYOUT */}
      <main className="w-full max-w-full min-h-screen bg-canvas flex flex-col pb-32">
        {/* TOP RESPONSIVE HEADER: Logo on Left (Profile icon only in Bottom Navbar) */}
        <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-2xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between">
            {/* Top Left: Bentley Logo */}
            <div className="flex items-center gap-2.5">
              <img
                src={logoBentley}
                alt="Bentley Mobile Car Wash"
                className="h-9 sm:h-10 w-auto object-contain filter drop-shadow-xs"
              />
            </div>
          </div>
        </header>

        {/* RESPONSIVE ORDER CARDS CONTAINER */}
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 flex-1">
          {/* TAB 1: ORDERS WORKSPACE (Live Requests & My Active) */}
          {driverTab === 'orders' && (
            <div className="flex flex-col gap-5">
              {/* Top Sub-tab Switcher Pills */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-3">
                <div className="inline-flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-2xl border border-gray-200/80 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      setOrdersSubTab('available')
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      ordersSubTab === 'available'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Radio className={`w-3.5 h-3.5 ${ordersSubTab === 'available' ? 'animate-pulse' : ''}`} />
                    <span>Live Requests</span>
                    <span
                      className={`min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-black rounded-full leading-none ${
                        ordersSubTab === 'available'
                          ? 'bg-white text-primary'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {availableOrders.length + availableShopOrders.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOrdersSubTab('active')
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      ordersSubTab === 'active'
                        ? 'bg-secondary text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>My Active</span>
                    <span
                      className={`min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-black rounded-full leading-none ${
                        ordersSubTab === 'active'
                          ? 'bg-white text-secondary'
                          : 'bg-secondary/10 text-secondary'
                      }`}
                    >
                      {myActiveOrders.length + myActiveShopOrders.length}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-gray-100/90 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setJobCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      jobCategoryFilter === 'all'
                        ? 'bg-white text-gray-900 shadow-2xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    All Jobs ({ordersSubTab === 'available' ? availableOrders.length + availableShopOrders.length : myActiveOrders.length + myActiveShopOrders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setJobCategoryFilter('washes')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      jobCategoryFilter === 'washes'
                        ? 'bg-white text-primary shadow-2xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Washes ({ordersSubTab === 'available' ? availableOrders.length : myActiveOrders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setJobCategoryFilter('deliveries')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      jobCategoryFilter === 'deliveries'
                        ? 'bg-white text-primary shadow-2xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Shop Deliveries ({ordersSubTab === 'available' ? availableShopOrders.length : myActiveShopOrders.length})
                  </button>
                </div>

                <div className="text-[11px] text-gray-500 font-medium">
                  {ordersSubTab === 'available'
                    ? `${
                        jobCategoryFilter === 'all'
                          ? availableOrders.length + availableShopOrders.length
                          : jobCategoryFilter === 'washes'
                          ? availableOrders.length
                          : availableShopOrders.length
                      } incoming customer requests`
                    : `${
                        jobCategoryFilter === 'all'
                          ? myActiveOrders.length + myActiveShopOrders.length
                          : jobCategoryFilter === 'washes'
                          ? myActiveOrders.length
                          : myActiveShopOrders.length
                      } orders currently assigned to you`}
                </div>
              </div>

              {/* Sub-tab 1: Available Live Orders */}
              {ordersSubTab === 'available' && (
                <>
                  {((jobCategoryFilter === 'washes' && availableOrders.length === 0) ||
                    (jobCategoryFilter === 'deliveries' && availableShopOrders.length === 0) ||
                    (jobCategoryFilter === 'all' && availableOrders.length === 0 && availableShopOrders.length === 0)) ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-xs">
                      <CheckCircle2 className="w-12 h-12 text-gray-300 mb-2 stroke-[1.5]" />
                      <span className="text-base font-bold text-gray-800">
                        {jobCategoryFilter === 'deliveries'
                          ? 'No pending shop deliveries right now'
                          : jobCategoryFilter === 'washes'
                          ? 'No pending car washes right now'
                          : 'No pending orders right now'}
                      </span>
                      <p className="text-xs text-gray-400 mt-1 max-w-sm">
                        {jobCategoryFilter === 'deliveries'
                          ? 'Real-time customer shop product orders will appear here automatically.'
                          : 'New customer car wash and detailing requests will appear here in real-time.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                      {/* Available Washes */}
                      {(jobCategoryFilter === 'all' || jobCategoryFilter === 'washes') &&
                        availableOrders.map((booking) => (
                          <div
                            key={booking.id}
                            className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3.5"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-light border border-primary-border/60 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                  {booking.customerName.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs sm:text-sm font-bold text-gray-900">
                                    {booking.customerName}
                                  </span>
                                  <span className="text-[11px] text-gray-500 font-medium">
                                    {booking.vehicle} ({booking.vehicleType || 'Vehicle'})
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end">
                                <span className="text-sm sm:text-base font-black text-primary font-mono">
                                  {booking.price}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 mt-0.5">
                                  {booking.distanceKm ? `${booking.distanceKm} km away` : 'Available'}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5 text-xs text-gray-600 bg-surface-subtle p-3 rounded-2xl border border-gray-100">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span className="truncate">{booking.address}</span>
                              </div>
                              <div className="flex items-center justify-between text-gray-500 text-[11px]">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  <span>{booking.date} at {booking.time}</span>
                                </span>
                                <span className="font-semibold text-gray-700">{booking.title}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setSelectedDetailBooking(booking)}
                                className="px-3.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                title="View Order Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Details</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAccept(booking)}
                                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-98 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Accept Request</span>
                              </button>
                            </div>
                          </div>
                        ))}

                      {/* Available Shop Deliveries */}
                      {(jobCategoryFilter === 'all' || jobCategoryFilter === 'deliveries') &&
                        availableShopOrders.map((order) => {
                          const totalItems = order.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0
                          return (
                            <div
                              key={order.id}
                              className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3.5 relative overflow-hidden"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-primary-light border border-primary-border/60 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                    <Package className="w-5 h-5" />
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs sm:text-sm font-bold text-gray-900">
                                        {order.recipientName || order.customerName || 'Customer'}
                                      </span>
                                      <span className="px-2 py-0.2 rounded-full bg-primary-light text-primary border border-primary-border/60 text-[10px] font-bold uppercase tracking-wider">
                                        Shop Delivery
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-gray-500 font-medium">
                                      {totalItems} {totalItems === 1 ? 'item' : 'items'} to deliver
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end">
                                  <span className="text-sm sm:text-base font-black text-primary font-mono">
                                    ${Number(order.grandTotal).toFixed(2)}
                                  </span>
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 mt-0.5">
                                    {order.paymentMethod === 'cod' ? 'Collect COD' : 'Prepaid'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1.5 text-xs text-gray-600 bg-surface-subtle p-3 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span className="truncate">
                                    {order.deliveryAddress}{order.deliveryCity ? `, ${order.deliveryCity}` : ''}
                                  </span>
                                </div>

                                <div className="mt-1 pt-1.5 border-t border-gray-200/60 flex items-center gap-1.5 overflow-x-auto py-0.5">
                                  {order.items?.slice(0, 3).map((item, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 text-[11px] bg-white px-2 py-0.5 rounded-md border border-gray-200 text-gray-700 font-medium shrink-0">
                                      <span className="font-bold text-primary">{item.quantity}x</span>
                                      <span className="truncate max-w-[110px]">{item.product?.title || 'Product'}</span>
                                    </span>
                                  ))}
                                  {(order.items?.length || 0) > 3 && (
                                    <span className="text-[10px] text-gray-400 font-bold shrink-0">
                                      +{order.items.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedDetailShopOrder(order)}
                                  className="px-3.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                  title="View Order Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Details</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleAcceptShopOrder(order)}
                                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-98 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Accept Delivery</span>
                                </button>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </>
              )}

              {/* Sub-tab 2: My Active Accepted Orders */}
              {ordersSubTab === 'active' && (
                <>
                  {((jobCategoryFilter === 'washes' && myActiveOrders.length === 0) ||
                    (jobCategoryFilter === 'deliveries' && myActiveShopOrders.length === 0) ||
                    (jobCategoryFilter === 'all' && myActiveOrders.length === 0 && myActiveShopOrders.length === 0)) ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-xs">
                      <Truck className="w-12 h-12 text-gray-300 mb-2 stroke-[1.5]" />
                      <span className="text-base font-bold text-gray-800">
                        {jobCategoryFilter === 'deliveries'
                          ? 'No active shop deliveries in progress'
                          : jobCategoryFilter === 'washes'
                          ? 'No active washes in progress'
                          : 'No active jobs in progress'}
                      </span>
                      <p className="text-xs text-gray-400 mt-1 max-w-sm">
                        Accept a live order from the "Live Requests" tab to start your delivery route.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                      {/* Active Washes */}
                      {(jobCategoryFilter === 'all' || jobCategoryFilter === 'washes') &&
                        myActiveOrders.map((booking) => (
                          <div
                            key={booking.id}
                            className="p-4 sm:p-5 rounded-3xl bg-white border-2 border-primary/20 shadow-md flex flex-col justify-between gap-3.5 relative overflow-hidden"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 uppercase flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                  <span>{booking.status.replace('_', ' ')}</span>
                                </span>
                              </div>
                              <span className="text-sm sm:text-base font-black text-primary font-mono">
                                {booking.price}
                              </span>
                            </div>

                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-sm font-bold text-gray-900">{booking.customerName}</h3>
                                <p className="text-xs text-gray-500 font-medium">{booking.vehicle}</p>
                                <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[220px]">
                                  {booking.address}
                                </p>
                              </div>
                            </div>

                            {/* Progress Flow Actions */}
                            <div className="flex flex-col gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setSelectedBookingForMap(booking)}
                                className="w-full py-2.5 rounded-xl bg-secondary hover:bg-neutral-900 active:scale-98 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                              >
                                <Navigation className="w-3.5 h-3.5 fill-white" />
                                <span>Open Live Map & Route</span>
                              </button>

                              <div className="grid grid-cols-2 gap-2">
                                {booking.status === 'accepted' && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdateStatus(booking.id, 'en_route')}
                                    className="w-full py-2 rounded-xl bg-primary hover:bg-primary-hover active:scale-98 text-white text-[11px] font-bold transition-all cursor-pointer"
                                  >
                                    Mark En Route
                                  </button>
                                )}

                                {booking.status === 'en_route' && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdateStatus(booking.id, 'in_progress')}
                                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-[11px] font-bold transition-all cursor-pointer"
                                  >
                                    Start Washing
                                  </button>
                                )}

                                {booking.status === 'in_progress' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (
                                        !booking.paymentStatus ||
                                        booking.paymentStatus !== 'paid' ||
                                        booking.paymentMethod?.toLowerCase().includes('cash') ||
                                        booking.paymentMethod?.toLowerCase().includes('delivery') ||
                                        booking.paymentMethod?.toLowerCase().includes('completion')
                                      ) {
                                        setCodPaymentBooking(booking)
                                      } else {
                                        onUpdateStatus(booking.id, 'completed')
                                        showToast('Service marked as completed!', 'success')
                                      }
                                    }}
                                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-[11px] font-bold transition-all cursor-pointer col-span-2 shadow-xs"
                                  >
                                    Complete Service & Collect COD
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setSelectedDetailBooking(booking)}
                                  className={`py-2 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-98 text-gray-700 text-[11px] font-bold transition-all cursor-pointer ${
                                    booking.status === 'in_progress' ? 'hidden' : ''
                                  }`}
                                >
                                  Details
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                      {/* Active Shop Deliveries */}
                      {(jobCategoryFilter === 'all' || jobCategoryFilter === 'deliveries') &&
                        myActiveShopOrders.map((order) => {
                          const totalItems = order.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0
                          return (
                            <div
                              key={order.id}
                              className="p-4 sm:p-5 rounded-3xl bg-white border-2 border-primary/20 shadow-md flex flex-col justify-between gap-3.5 relative overflow-hidden"
                            >
                              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-0.5 rounded-full bg-primary-light text-primary text-[10px] font-bold border border-primary-border/60 uppercase flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                                    <span>Shop: {order.status.replace('_', ' ')}</span>
                                  </span>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="text-sm sm:text-base font-black text-primary font-mono">
                                    ${Number(order.grandTotal).toFixed(2)}
                                  </span>
                                  <span className="text-[10px] font-bold text-gray-500">
                                    {order.paymentMethod === 'cod' ? 'Collect COD' : 'Prepaid'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-gray-900">
                                      {order.recipientName || order.customerName || 'Customer'}
                                    </h3>
                                    {(order.recipientPhone || order.customerPhone) && (
                                      <a
                                        href={`tel:${order.recipientPhone || order.customerPhone}`}
                                        className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                                        title="Call recipient"
                                      >
                                        <Phone className="w-3 h-3 fill-emerald-600" />
                                      </a>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                                    {totalItems} {totalItems === 1 ? 'item' : 'items'} to deliver
                                  </p>
                                  <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[220px]">
                                    {order.deliveryAddress}{order.deliveryCity ? `, ${order.deliveryCity}` : ''}
                                  </p>
                                </div>
                              </div>

                              {/* Progress Flow Actions */}
                              <div className="flex flex-col gap-2 pt-1">
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedBookingForMap(shopOrderToBookingRecord(order))}
                                    className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-98 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                                  >
                                    <Navigation className="w-3.5 h-3.5 fill-white" />
                                    <span>Live In-App Map</span>
                                  </button>
                                  <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.deliveryAddress || order.shippingAddress || '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full py-2.5 rounded-xl bg-secondary hover:bg-neutral-900 active:scale-98 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>Google Maps</span>
                                  </a>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  {order.status === 'accepted' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateShopOrderStatus(order.id, 'en_route')}
                                      className="w-full py-2 rounded-xl bg-primary hover:bg-primary-hover active:scale-98 text-white text-[11px] font-bold transition-all cursor-pointer"
                                    >
                                      Mark En Route
                                    </button>
                                  )}

                                  {order.status === 'en_route' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateShopOrderStatus(order.id, 'delivered')}
                                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-[11px] font-bold transition-all cursor-pointer"
                                    >
                                      Delivered & Cash
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => setSelectedDetailShopOrder(order)}
                                    className={`py-2 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-98 text-gray-700 text-[11px] font-bold transition-all cursor-pointer ${
                                      order.status === 'en_route' ? 'col-span-1' : 'col-span-1'
                                    }`}
                                  >
                                    Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 2: COMPLETED HISTORY WORKSPACE */}
          {driverTab === 'history' && (
            <div className="flex flex-col gap-5">
              {/* Summary Header */}
              <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
                    <History className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">Completed Jobs & Orders</h3>
                    <p className="text-xs text-gray-500">Record of all your fulfilled washes & Bentley shop deliveries</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{completedOrders.length} Washes</span>
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold text-xs flex items-center gap-1.5 shadow-2xs">
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                    <span>{completedShopOrders.length} Deliveries</span>
                  </span>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-1.5 bg-gray-100/90 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setHistoryCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      historyCategoryFilter === 'all'
                        ? 'bg-white text-gray-900 shadow-2xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    All ({completedOrders.length + completedShopOrders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryCategoryFilter('washes')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      historyCategoryFilter === 'washes'
                        ? 'bg-white text-primary shadow-2xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Washes ({completedOrders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryCategoryFilter('deliveries')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      historyCategoryFilter === 'deliveries'
                        ? 'bg-white text-primary shadow-2xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Shop Deliveries ({completedShopOrders.length})
                  </button>
                </div>

                <div className="text-[11px] text-gray-500 font-medium">
                  Showing{' '}
                  {historyCategoryFilter === 'all'
                    ? `${completedOrders.length + completedShopOrders.length} total fulfilled dispatches`
                    : historyCategoryFilter === 'washes'
                    ? `${completedOrders.length} fulfilled car wash services`
                    : `${completedShopOrders.length} delivered shop orders`}
                </div>
              </div>

              {/* Empty state condition */}
              {((historyCategoryFilter === 'washes' && completedOrders.length === 0) ||
                (historyCategoryFilter === 'deliveries' && completedShopOrders.length === 0) ||
                (historyCategoryFilter === 'all' && completedOrders.length === 0 && completedShopOrders.length === 0)) ? (
                <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-xs">
                  <CheckCircle2 className="w-12 h-12 text-gray-300 mb-2 stroke-[1.5]" />
                  <span className="text-base font-bold text-gray-800">
                    {historyCategoryFilter === 'deliveries'
                      ? 'No completed shop deliveries yet'
                      : historyCategoryFilter === 'washes'
                      ? 'No completed car washes yet'
                      : 'No completed jobs yet'}
                  </span>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm">
                    {historyCategoryFilter === 'deliveries'
                      ? 'Fulfilled Bentley Shop product dispatches will appear here with order summaries and COD collection details.'
                      : 'Completed car washes and shop deliveries will be recorded here with delivery receipts and COD collection status.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {/* 1. Washes */}
                  {(historyCategoryFilter === 'all' || historyCategoryFilter === 'washes') &&
                    completedOrders.map((booking) => (
                      <div
                        key={booking.id}
                        className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs sm:text-sm font-bold text-gray-900 truncate max-w-[180px]">
                              {booking.title}
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-emerald-600 font-mono">
                            +{booking.price}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 bg-surface-subtle p-2.5 rounded-2xl">
                          <span>Customer: <strong className="text-gray-800">{booking.customerName}</strong></span>
                          <span className="truncate">{booking.vehicle}</span>
                        </div>

                        <div className="text-[11px] text-gray-400 truncate">
                          {booking.address}
                        </div>

                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                          <span className="text-gray-400">Completed: {booking.date}</span>
                          <div className="flex items-center gap-1.5">
                            {booking.paymentStatus === 'paid' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Paid ({booking.paymentCollectedMethod || 'Cash'}) ✓
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Payment Pending
                              </span>
                            )}
                            <span className="text-emerald-600 font-bold">Fulfilled ✓</span>
                          </div>
                        </div>
                      </div>
                    ))}

                  {/* 2. Shop Product Deliveries */}
                  {(historyCategoryFilter === 'all' || historyCategoryFilter === 'deliveries') &&
                    completedShopOrders.map((order) => {
                      const totalItems = order.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0
                      return (
                        <div
                          key={order.id}
                          className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col justify-between gap-3 relative"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <ShoppingBag className="w-4 h-4 text-emerald-600" />
                              <span className="text-xs sm:text-sm font-bold text-gray-900 truncate max-w-[180px]">
                                Shop #{order.id.slice(-6).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-emerald-600 font-mono">
                              +${Number(order.grandTotal).toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500 bg-surface-subtle p-2.5 rounded-2xl">
                            <span>Customer: <strong className="text-gray-800">{order.recipientName || order.customerName || 'Customer'}</strong></span>
                            <span className="text-gray-600 font-medium">
                              {totalItems} {totalItems === 1 ? 'item' : 'items'}
                            </span>
                          </div>

                          {/* Preview product items */}
                          {order.items && order.items.length > 0 && (
                            <div className="text-[11px] text-gray-500 bg-gray-50/90 px-2.5 py-1.5 rounded-xl truncate">
                              📦 {order.items.map(i => `${i.product?.title || (i as any).name || 'Product'} (x${i.quantity || 1})`).join(', ')}
                            </div>
                          )}

                          <div className="text-[11px] text-gray-400 truncate">
                            {order.deliveryAddress || order.shippingAddress || 'Address on file'}{order.deliveryCity ? `, ${order.deliveryCity}` : ''}
                          </div>

                          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                            <span className="text-gray-400">
                              Completed: {formatDeliveredDate(order.deliveredAt || order.updatedAt || order.createdAt)}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Paid ({order.paymentMethod === 'cod' ? 'Cash' : (order.paymentMethod || 'Cash')}) ✓
                              </span>
                              <span className="text-emerald-600 font-bold">Delivered ✓</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedDetailShopOrder(order)}
                            className="mt-0.5 w-full py-2 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-98 text-gray-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Delivery Details</span>
                          </button>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 5. BOTTOM NAVIGATION TABS (Visible across Orders, History, and Profile) */}
      {!selectedBookingForMap && (
        <DriverBottomNav
          currentTab={driverTab}
          onTabChange={(tab) => {
            setDriverTab(tab)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          ordersBadge={availableOrders.length + availableShopOrders.length}
          historyBadge={completedOrders.length + completedShopOrders.length}
        />
      )}

      {/* COD Payment Confirmation Modal */}
      {codPaymentBooking && (
        <CodPaymentModal
          isOpen={!!codPaymentBooking}
          onClose={() => setCodPaymentBooking(null)}
          booking={codPaymentBooking}
          driverName={profile.name}
          onConfirmPayment={(paymentData) => {
            onUpdateStatus(codPaymentBooking.id, 'completed', undefined, paymentData)
            setCodPaymentBooking(null)
            showToast(
              paymentData.paymentStatus === 'paid'
                ? `Payment recorded via ${paymentData.paymentCollectedMethod || 'Cash'} & order completed!`
                : 'Order marked as completed (Payment Pending).',
              'success'
            )
          }}
        />
      )}
    </div>
  )
}

export const DriverDashboardPage = DriverDashboard
export default DriverDashboard
