import React, { useState, useEffect } from 'react'
import {
  ChevronLeft,
  Package,
  ShoppingBag,
  Truck,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  Receipt,
  X,
  ExternalLink,
  Search,
  ArrowRight,
  User,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import { ShopOrder, ShopOrderStatus } from '@/types'
import { getRemainingEtaMinutes } from '@/services/dispatchService'
import { auth, db } from '@/firebase'
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

interface OrdersPageProps {
  isOpen: boolean
  onClose: () => void
  onContinueShopping?: () => void
  userProfile?: {
    name?: string
    email?: string
    phone?: string
  }
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  isOpen,
  onClose,
  onContinueShopping,
  userProfile,
}) => {
  const { showToast } = useToast()
  const [orders, setOrders] = useState<ShopOrder[]>(() => {
    try {
      const stored = localStorage.getItem('bentley_user_orders')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) return parsed
      }
    } catch { }
    return []
  })

  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'delivered'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null)
  const [, setWallClockTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setWallClockTick((t) => t + 1), 10000)
    return () => clearInterval(timer)
  }, [])
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // Real-time synchronization with Firestore 'orders' collection
  useEffect(() => {
    if (!isOpen) return

    const currentUser = auth.currentUser
    const userEmail = currentUser?.email || userProfile?.email || ''
    const userId = currentUser?.uid || ''

    const ordersQuery = userId
      ? query(collection(db, 'orders'), where('userId', '==', userId))
      : userEmail
      ? query(collection(db, 'orders'), where('customerEmail', '==', userEmail))
      : null

    if (!ordersQuery) {
      setOrders([])
      return
    }

    // Listen to current user's orders securely
    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const myOrders: ShopOrder[] = snapshot.docs.map((d) => {
          const data = d.data() as any
          return {
            ...data,
            id: d.id,
            status: (data.status || 'pending') as ShopOrderStatus,
            grandTotal: data.grandTotal || '0.00',
            items: Array.isArray(data.items) ? data.items : [],
            totalItemsCount: data.totalItemsCount || (Array.isArray(data.items) ? data.items.reduce((s: number, i: any) => s + (i.quantity || 1), 0) : 1),
          }
        })

        // Sort newest first
        myOrders.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime()
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime()
          return timeB - timeA
        })

        setOrders(myOrders)
      },
      (err) => {
        console.warn('Orders listener error:', err)
      }
    )

    return () => unsubscribe()
  }, [isOpen, userProfile])

  if (!isOpen) return null

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    // 1. Status Filter
    if (activeFilter === 'active') {
      if (['delivered', 'cancelled'].includes(order.status)) return false
    } else if (activeFilter === 'delivered') {
      if (order.status !== 'delivered') return false
    }

    // 2. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchesId = order.id.toLowerCase().includes(q)
      const matchesItem = order.items?.some((i) =>
        i.product?.title?.toLowerCase().includes(q)
      )
      const matchesAddr = order.shippingAddress?.toLowerCase().includes(q)
      return matchesId || matchesItem || matchesAddr
    }

    return true
  })

  // Format date helper
  const formatOrderDate = (dateVal: any): string => {
    if (!dateVal) return 'Recently Placed'
    try {
      const d = dateVal.toDate ? dateVal.toDate() : new Date(dateVal)
      if (isNaN(d.getTime())) return 'Recently Placed'
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Recently Placed'
    }
  }

  // Handle Cancel Order
  const handleCancelOrder = async () => {
    if (!cancellingOrderId) return
    setIsCancelling(true)

    try {
      const orderDocRef = doc(db, 'orders', cancellingOrderId)
      await updateDoc(orderDocRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
      })

      setOrders((prev) =>
        prev.map((o) => (o.id === cancellingOrderId ? { ...o, status: 'cancelled' } : o))
      )
      showToast(`Order #${cancellingOrderId.slice(-6).toUpperCase()} has been cancelled.`, 'info')
      if (selectedOrder?.id === cancellingOrderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : null))
      }
    } catch (err) {
      console.error('Failed to cancel order:', err)
      showToast('Could not cancel order. Please contact dispatch support.', 'error')
    } finally {
      setIsCancelling(false)
      setIsCancelConfirmOpen(false)
      setCancellingOrderId(null)
    }
  }

  const renderStatusBadge = (status: ShopOrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-primary-light text-primary text-[10px] font-bold border border-primary-border/60 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Pending Dispatch
          </span>
        )
      case 'accepted':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold border border-teal-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            Driver Assigned
          </span>
        )
      case 'en_route':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
            Driver En Route
          </span>
        )
      case 'delivered':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Delivered
          </span>
        )
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold border border-red-200">
            Cancelled
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto animate-in slide-in-from-bottom duration-200">
      <div className="w-full max-w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto min-h-screen flex flex-col bg-white pb-32">
        {/* 1. TOP HEADER */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-4 sm:px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-surface-alt active:scale-95 transition-all cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-gray-900 tracking-tight">
              My Shop Orders
            </h1>
            {orders.length > 0 && (
              <span className="px-2 py-0.5 rounded-sm bg-primary-light text-primary text-[11px] font-bold border border-primary/20">
                {orders.length} {orders.length === 1 ? 'order' : 'orders'}
              </span>
            )}
          </div>

          <div className="w-9" />
        </header>

        {/* 2. SUB-BAR: SEARCH & FILTER TABS */}
        <div className="p-4 sm:p-5 flex flex-col gap-3.5 border-b border-gray-100 bg-surface-alt/40">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, Order ID, or address..."
              className="w-full bg-white border border-gray-200/90 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-primary shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Segmented Controls */}
          <div className="bg-white p-1 rounded-xl border border-gray-200 flex items-center shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeFilter === 'all'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              All ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('active')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeFilter === 'active'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Active ({orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('delivered')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeFilter === 'delivered'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Delivered ({orders.filter((o) => o.status === 'delivered').length})
            </button>
          </div>
        </div>

        {/* 3. ORDER LIST CONTENT */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col gap-4">
          {filteredOrders.length === 0 ? (
            /* EMPTY STATE */
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-300">
              <div className="w-20 h-20 rounded-3xl bg-surface-alt border border-gray-200 flex items-center justify-center text-gray-400 shadow-sm mb-4">
                <ShoppingBag className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
                {searchQuery ? 'No matching orders found' : 'No Shop Orders Yet'}
              </h2>
              <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
                {searchQuery
                  ? 'Try searching with a different term or clear the search filter.'
                  : 'Explore official Bentley ceramic coatings, shampoos, and detailing accessories for home delivery.'}
              </p>
              {!searchQuery && (
                <Button
                  type="button"
                  variant="default"
                  size="default"
                  onClick={() => {
                    onClose()
                    if (onContinueShopping) onContinueShopping()
                  }}
                  className="mt-5 rounded-sm bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Browse Bentley Shop</span>
                </Button>
              )}
            </div>
          ) : (
            /* POPULATED ORDERS LIST */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.map((order) => {
                const isDelivered = order.status === 'delivered'
                const isPending = order.status === 'pending'
                const isEnRoute = order.status === 'en_route'
                const isAccepted = order.status === 'accepted'

                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
                  >
                    {/* Top Row: Order ID, Date & Status */}
                    <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-extrabold text-gray-900 tracking-tight">
                          #BW-{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {formatOrderDate(order.createdAt)}
                        </span>
                      </div>
                      {renderStatusBadge(order.status)}
                    </div>

                    {/* Assigned Driver Pill (if driver accepted) */}
                    {(isAccepted || isEnRoute || isDelivered) && order.driverName && (
                      <div className="p-2.5 rounded-xl bg-surface-subtle border border-gray-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                            {order.driverName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block text-xs">
                              {order.driverName}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {isDelivered ? 'Hand-delivered to your door' : isEnRoute ? `Driver en route • Arriving in ~${getRemainingEtaMinutes(order) || 10} mins` : 'Assigned delivery driver'}
                            </span>
                          </div>
                        </div>

                        {order.driverPhone && !isDelivered && (
                          <a
                            href={`tel:${order.driverPhone}`}
                            className="w-7 h-7 rounded-full bg-white border border-primary/20 flex items-center justify-center text-primary hover:bg-primary-light shrink-0"
                            title="Call Driver"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Items Preview Strip */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Purchased Items ({order.totalItemsCount || order.items.length})
                      </span>
                      <div className="flex flex-col gap-2">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-surface-alt/70 border border-gray-100"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-white border border-gray-200/80 p-0.5 shrink-0 flex items-center justify-center">
                                <img
                                  src={item.product?.image}
                                  alt={item.product?.title}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="truncate">
                                <span className="text-xs font-bold text-gray-900 block truncate">
                                  {item.product?.title || 'Detailing Product'}
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono">
                                  Qty: {item.quantity} × ${item.product?.priceNumeric?.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            <span className="text-xs font-bold font-mono text-primary shrink-0">
                              ${((item.product?.priceNumeric || 0) * (item.quantity || 1)).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Address Row */}
                    <div className="flex items-start gap-1.5 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-gray-800 block text-[11px] truncate">
                          {order.customerName} {order.customerPhone ? `• ${order.customerPhone}` : ''}
                        </span>
                        <span className="text-[10px] text-gray-500 block truncate">
                          {order.shippingAddress}
                        </span>
                      </div>
                    </div>

                    {/* Price & Action Row */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-gray-400">
                          Total Amount (COD)
                        </span>
                        <span className="text-base font-extrabold text-primary font-mono leading-tight">
                          ${typeof order.grandTotal === 'number' ? order.grandTotal.toFixed(2) : order.grandTotal}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isPending && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCancellingOrderId(order.id)
                              setIsCancelConfirmOpen(true)
                            }}
                            className="h-8 border-gray-200 text-red-600 hover:bg-red-50 text-[11px] font-bold cursor-pointer"
                          >
                            Cancel
                          </Button>
                        )}

                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          className="h-8 bg-primary hover:bg-primary-hover text-white text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <span>Order Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. ORDER DETAILS DRAWER / MODAL */}
      <Dialog
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        zIndex="z-60"
        position="bottom-sheet"
        maxWidth="md"
        contentClassName="p-5 sm:p-6 max-h-[90vh] overflow-y-auto"
      >
        {selectedOrder && (
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-gray-900 tracking-tight">
                  Order Details
                </span>
                <span className="font-mono text-xs text-primary font-bold bg-primary-light px-2 py-0.5 rounded-sm">
                  #BW-{selectedOrder.id.slice(-6).toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-surface-alt hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Progress Stepper */}
            <div className="p-3.5 rounded-2xl bg-surface-alt border border-gray-200 flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Delivery Status
              </span>
              <div className="flex items-center justify-between pt-1">
                <div className="flex flex-col items-center text-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${selectedOrder.status !== 'cancelled' ? 'bg-primary text-white' : 'bg-red-500 text-white'
                    }`}>
                    1
                  </div>
                  <span className="text-[9px] font-bold mt-1 text-gray-700">Order Placed</span>
                </div>
                <div className={`flex-1 h-0.5 mx-1 ${['accepted', 'en_route', 'delivered'].includes(selectedOrder.status) ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                <div className="flex flex-col items-center text-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${['accepted', 'en_route', 'delivered'].includes(selectedOrder.status) ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                    2
                  </div>
                  <span className="text-[9px] font-bold mt-1 text-gray-700">Driver Assigned</span>
                </div>
                <div className={`flex-1 h-0.5 mx-1 ${['en_route', 'delivered'].includes(selectedOrder.status) ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                <div className="flex flex-col items-center text-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${['en_route', 'delivered'].includes(selectedOrder.status) ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                    3
                  </div>
                  <span className="text-[9px] font-bold mt-1 text-gray-700">En Route</span>
                </div>
                <div className={`flex-1 h-0.5 mx-1 ${selectedOrder.status === 'delivered' ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                <div className="flex flex-col items-center text-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${selectedOrder.status === 'delivered' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                    4
                  </div>
                  <span className="text-[9px] font-bold mt-1 text-gray-700">Delivered</span>
                </div>
              </div>
            </div>

            {/* Delivery Driver Strip */}
            {selectedOrder.driverName && (
              <div className="p-3 rounded-2xl bg-surface-subtle border border-gray-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                    {selectedOrder.driverName.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block text-xs">
                      {selectedOrder.driverName}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {selectedOrder.status === 'en_route' ? `Arriving in ~${getRemainingEtaMinutes(selectedOrder) || 10} mins • ${selectedOrder.driverVanNumber || 'Mobile Dispatch'}` : (selectedOrder.driverVanNumber || 'Mobile Dispatch Unit')}
                    </span>
                  </div>
                </div>

                {selectedOrder.driverPhone && (
                  <a
                    href={`tel:${selectedOrder.driverPhone}`}
                    className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call Driver</span>
                  </a>
                )}
              </div>
            )}

            {/* Delivery Destination */}
            <div className="p-3.5 rounded-2xl bg-white border border-gray-200 flex flex-col gap-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Delivery Location
              </span>
              <span className="font-bold text-gray-900">
                {selectedOrder.customerName} {selectedOrder.customerPhone ? `(${selectedOrder.customerPhone})` : ''}
              </span>
              <span className="text-gray-600 text-xs mt-0.5">
                {selectedOrder.shippingAddress}
              </span>
              {selectedOrder.deliveryNotes && (
                <span className="text-[11px] text-gray-500 italic mt-1">
                  Note: {selectedOrder.deliveryNotes}
                </span>
              )}
            </div>

            {/* Itemized Products */}
            <div className="p-3.5 rounded-2xl bg-white border border-gray-200 flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Order Items ({selectedOrder.totalItemsCount || selectedOrder.items.length})
              </span>
              <div className="flex flex-col gap-2">
                {selectedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={item.product?.image}
                        alt={item.product?.title}
                        className="w-9 h-9 rounded-lg object-contain bg-slate-50 border border-gray-200 p-0.5"
                      />
                      <div>
                        <span className="font-semibold text-gray-900 block text-xs">
                          {item.product?.title}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          Qty: {item.quantity} × ${item.product?.priceNumeric?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-gray-900">
                      ${((item.product?.priceNumeric || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="pt-2 border-t border-gray-100 flex flex-col gap-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">${Number(selectedOrder.itemsSubtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Technician Dispatch Delivery</span>
                  <span className="text-emerald-600 font-semibold">
                    {Number(selectedOrder.shippingFee || 0) === 0 ? 'FREE' : `$${Number(selectedOrder.shippingFee).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes (5% GST)</span>
                  <span className="font-mono">${Number(selectedOrder.taxFee || 0).toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between font-extrabold text-sm text-gray-900">
                  <span>Total Due (COD)</span>
                  <span className="font-mono text-primary text-base">
                    ${typeof selectedOrder.grandTotal === 'number' ? selectedOrder.grandTotal.toFixed(2) : selectedOrder.grandTotal}
                  </span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <Button
              type="button"
              variant="default"
              size="default"
              onClick={() => setSelectedOrder(null)}
              className="w-full h-11 rounded-sm bg-neutral-900 hover:bg-black text-white font-extrabold text-xs cursor-pointer shadow-md"
            >
              Close Details
            </Button>
          </div>
        )}
      </Dialog>

      {/* 5. CANCEL CONFIRMATION DIALOG */}
      <Dialog
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        maxWidth="sm"
        title="Cancel Order"
      >
        <div className="flex flex-col gap-3 pt-1">
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Are you sure you want to cancel this order?</span>
              <span className="text-[11px] text-red-800">
                This will cancel your pending shop delivery request immediately.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCancelConfirmOpen(false)}
              className="flex-1 h-9 border-gray-200 text-gray-700 font-bold text-xs cursor-pointer"
            >
              Keep Order
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={isCancelling}
              onClick={handleCancelOrder}
              className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs cursor-pointer disabled:opacity-60"
            >
              {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
