import React, { useState, useEffect, useMemo } from 'react'
import {
  Users,
  Search,
  Phone,
  Mail,
  Car,
  Eye,
  X,
  Filter,
  MoreVertical,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase'
import { BookingRecord, ShopOrder } from '@/types'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { useToast } from '@/context/ToastContext'
import { CustomerDetailsView } from './CustomerDetailsPage'

export interface CustomerItem {
  id: string
  name: string
  email: string
  phone: string
  role: string
  avatar?: string
  createdAt?: any
  totalWashes: number
  totalDeliveries: number
  totalSpent: number
  vehicles: string[]
  lastActiveDate?: string
  bookingsList: BookingRecord[]
  ordersList: ShopOrder[]
}

export interface CustomersViewProps {
  bookings: BookingRecord[]
  shopOrders: ShopOrder[]
}

export type AdminCustomersViewProps = CustomersViewProps

export { CustomerDetailsView, CustomerDetailsPage } from './CustomerDetailsPage'
export type { CustomerDetailsViewProps } from './CustomerDetailsPage'

export const CustomersView: React.FC<CustomersViewProps> = ({
  bookings = [],
  shopOrders = [],
}) => {
  const { showToast } = useToast()
  const [rawUsers, setRawUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<'name' | 'spent' | 'washes' | 'recent'>('recent')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const pageSize = 10
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null)
  const [activeMenuCustomerId, setActiveMenuCustomerId] = useState<string | null>(null)
  const [customerToDelete, setCustomerToDelete] = useState<CustomerItem | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

  const handleOpenCustomerDetails = (customer: CustomerItem) => {
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('customer', customer.id)
      window.history.pushState({ adminCustomerDetail: true, customerId: customer.id }, '', url.toString())
    } catch {}
    setSelectedCustomer(customer)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackFromDetails = () => {
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('customer')
      url.searchParams.delete('customerId')
      if (window.history.state?.adminCustomerDetail) {
        window.history.back()
      } else {
        window.history.replaceState({}, '', url.toString())
        setSelectedCustomer(null)
      }
    } catch {
      setSelectedCustomer(null)
    }
  }

  // Close row action dropdown on outside click or ESC
  useEffect(() => {
    if (!activeMenuCustomerId) return
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-dropdown-container]')) {
        setActiveMenuCustomerId(null)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveMenuCustomerId(null)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeMenuCustomerId])

  // Handle customer deletion
  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return
    try {
      setIsDeleting(true)
      if (customerToDelete.id && !customerToDelete.id.startsWith('cust-')) {
        await deleteDoc(doc(db, 'users', customerToDelete.id))
      }
      showToast(`Customer "${customerToDelete.name}" deleted successfully.`, 'success')
      setCustomerToDelete(null)
    } catch (err: any) {
      console.error('Failed to delete customer:', err)
      showToast(err?.message || 'Failed to delete customer.', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  // Real-time listener for Firestore 'users' collection
  useEffect(() => {
    setIsLoading(true)
    const usersRef = collection(db, 'users')
    const unsub = onSnapshot(
      usersRef,
      (snapshot) => {
        const loaded: any[] = []
        snapshot.forEach((docSnap) => {
          loaded.push({
            id: docSnap.id,
            ...docSnap.data(),
          })
        })
        setRawUsers(loaded)
        setIsLoading(false)
      },
      (err) => {
        console.warn('Admin customers listener warning:', err)
        setIsLoading(false)
      }
    )

    return () => unsub()
  }, [])

  // Aggregate customer records from Firestore users, car wash bookings, and shop delivery orders
  const allCustomers = useMemo<CustomerItem[]>(() => {
    const customerMap = new Map<string, CustomerItem>()
    const emailToKey = new Map<string, string>()
    const phoneToKey = new Map<string, string>()

    const registerKeyLookup = (key: string, email?: string, phone?: string) => {
      if (email && email !== '—') {
        const clean = email.toLowerCase().trim()
        if (clean) emailToKey.set(clean, key)
      }
      if (phone) {
        const cleanDigits = phone.replace(/\D/g, '')
        if (cleanDigits.length >= 7) {
          phoneToKey.set(cleanDigits, key)
        }
      }
    }

    // 1. Seed from Firestore 'users' collection
    rawUsers.forEach((u, idx) => {
      const emailKey = (u.email || '').toLowerCase().trim()
      const key = u.id || emailKey || `user-${idx}`
      const name = u.name || u.fullName || u.Name || (emailKey ? emailKey.split('@')[0] : 'Customer')
      const phone = u.phone || u.phoneNumber || ''
      const role = u.role || 'customer'
      const avatar = u.avatar || u.photoURL || ''

      customerMap.set(key, {
        id: u.id || key,
        name,
        email: u.email || '—',
        phone,
        role,
        avatar,
        createdAt: u.createdAt,
        totalWashes: 0,
        totalDeliveries: 0,
        totalSpent: 0,
        vehicles: [],
        lastActiveDate: undefined,
        bookingsList: [],
        ordersList: [],
      })

      registerKeyLookup(key, u.email, phone)
    })

    // Instant O(1) Helper to find matching customer key
    const findCustomerKey = (userId?: string, email?: string, phone?: string): string | null => {
      if (userId && customerMap.has(userId)) return userId
      if (email && email !== '—') {
        const cleanEmail = email.toLowerCase().trim()
        const matched = emailToKey.get(cleanEmail)
        if (matched) return matched
      }
      if (phone) {
        const cleanPhone = phone.replace(/\D/g, '')
        if (cleanPhone.length >= 7) {
          const matched = phoneToKey.get(cleanPhone)
          if (matched) return matched
        }
      }
      return null
    }

    // 2. Correlate Wash Bookings
    bookings.forEach((b) => {
      const bUserId = (b as any).userId as string | undefined
      const matchedKey = findCustomerKey(bUserId, b.customerEmail, b.customerPhone)
      const key: string = matchedKey || bUserId || (b.customerEmail ? b.customerEmail.toLowerCase().trim() : `cust-booking-${b.id}`)

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          id: bUserId || key,
          name: b.customerName || 'Car Wash Customer',
          email: b.customerEmail || '—',
          phone: b.customerPhone || '',
          role: 'customer',
          totalWashes: 0,
          totalDeliveries: 0,
          totalSpent: 0,
          vehicles: [],
          lastActiveDate: undefined,
          bookingsList: [],
          ordersList: [],
        })
        registerKeyLookup(key, b.customerEmail, b.customerPhone)
      }

      const c = customerMap.get(key)!
      c.totalWashes += 1
      c.totalSpent += Number(b.totalNumeric || 0)
      if (b.vehicle && !c.vehicles.includes(b.vehicle)) {
        c.vehicles.push(b.vehicle)
      }
      c.bookingsList.push(b)

      if (b.date) {
        if (!c.lastActiveDate || new Date(b.date) > new Date(c.lastActiveDate)) {
          c.lastActiveDate = b.date
        }
      }
    })

    // 3. Correlate Shop Deliveries
    shopOrders.forEach((o) => {
      const matchedKey = findCustomerKey(o.userId, o.customerEmail || o.recipientPhone, o.customerPhone || o.recipientPhone)
      const key: string = matchedKey || o.userId || (o.customerEmail ? o.customerEmail.toLowerCase().trim() : `cust-order-${o.id}`)

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          id: o.userId || key,
          name: o.recipientName || o.customerName || 'Shop Customer',
          email: o.customerEmail || '—',
          phone: o.recipientPhone || o.customerPhone || '',
          role: 'customer',
          totalWashes: 0,
          totalDeliveries: 0,
          totalSpent: 0,
          vehicles: [],
          lastActiveDate: undefined,
          bookingsList: [],
          ordersList: [],
        })
        registerKeyLookup(key, o.customerEmail, o.recipientPhone || o.customerPhone)
      }

      const c = customerMap.get(key)!
      c.totalDeliveries += 1
      c.totalSpent += Number(o.grandTotal || 0)
      c.ordersList.push(o)

      const orderDate = o.createdAt?.toDate ? o.createdAt.toDate().toISOString().split('T')[0] : undefined
      if (orderDate) {
        if (!c.lastActiveDate || new Date(orderDate) > new Date(c.lastActiveDate)) {
          c.lastActiveDate = orderDate
        }
      }
    })

    return Array.from(customerMap.values())
  }, [rawUsers, bookings, shopOrders])

  // Sync selected customer from URL search params on load, refresh, or customer list update
  useEffect(() => {
    if (allCustomers.length === 0) return
    const params = new URLSearchParams(window.location.search)
    const customerIdFromUrl = params.get('customer') || params.get('customerId')
    if (customerIdFromUrl) {
      const found = allCustomers.find((c) => c.id === customerIdFromUrl)
      if (found && (!selectedCustomer || selectedCustomer.id !== found.id)) {
        setSelectedCustomer(found)
      }
    }
  }, [allCustomers])

  // Mobile Inbuilt Back Navigation & Browser History Synchronization
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const customerIdFromUrl = params.get('customer') || params.get('customerId')
      if (customerIdFromUrl && allCustomers.length > 0) {
        const found = allCustomers.find((c) => c.id === customerIdFromUrl)
        if (found) {
          setSelectedCustomer(found)
          return
        }
      }
      setSelectedCustomer(null)
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [allCustomers])

  // Filter & Search
  const filteredCustomers = useMemo(() => {
    let list = allCustomers

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.vehicles.some((v) => v.toLowerCase().includes(q))
      )
    }

    // Safe timestamp parser helper for sorting
    const parseSafeTime = (dateStr?: string) => {
      if (!dateStr) return 0
      const clean = String(dateStr).replace(/^(Today|Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*/i, '')
      const t = new Date(clean).getTime()
      return isNaN(t) ? 0 : t
    }

    // Sort
    return [...list].sort((a, b) => {
      let res = 0
      if (sortBy === 'name') {
        res = a.name.localeCompare(b.name)
      } else if (sortBy === 'spent') {
        res = a.totalSpent - b.totalSpent
      } else if (sortBy === 'washes') {
        res = (a.totalWashes + a.totalDeliveries) - (b.totalWashes + b.totalDeliveries)
      } else if (sortBy === 'recent') {
        res = parseSafeTime(a.lastActiveDate) - parseSafeTime(b.lastActiveDate)
      }
      return sortOrder === 'desc' ? -res : res
    })
  }, [allCustomers, searchQuery, sortBy, sortOrder])

  // Reset pagination when search or sorting changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, sortBy, sortOrder])

  // Paginated slice
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCustomers.slice(start, start + pageSize)
  }, [filteredCustomers, currentPage, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize))

  // Metrics summary: Customers active within the last 90 days or with placed orders
  const activeCustomersCount = useMemo(() => {
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
    return allCustomers.filter((c) => {
      if (c.lastActiveDate) {
        const clean = String(c.lastActiveDate).replace(/^(Today|Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*/i, '')
        const d = new Date(clean).getTime()
        if (!isNaN(d) && d >= ninetyDaysAgo) return true
      }
      return c.totalWashes > 0 || c.totalDeliveries > 0
    }).length
  }, [allCustomers])

  // If a customer is selected, render the dedicated Customer Details Page View
  if (selectedCustomer) {
    return (
      <CustomerDetailsView
        customer={selectedCustomer}
        onBack={handleBackFromDetails}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header & Quick Analytics Cards */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              <span>Customer Management</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <span>{allCustomers.length} Total Clients</span>
            </span>
          </div>
        </div>

        {/* High-level metrics row (Active Customers & Total Services) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-primary-light border border-primary-border flex items-center justify-center text-primary shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Customers</p>
              <h3 className="text-xl font-black text-gray-900 font-mono mt-0.5">
                {activeCustomersCount}
              </h3>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Services</p>
              <h3 className="text-xl font-black text-blue-600 font-mono mt-0.5">
                {bookings.length + shopOrders.length}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search & Compact Filter Controls (No outer card box) */}
      <div className="flex flex-row items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer, email, phone, car..."
            className="w-full h-10 pl-10 pr-9 rounded-xl bg-white border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Compact Auto-fit Sort Filter Dropdown */}
        <div className="w-auto shrink-0">
          <Select
            value={
              sortBy === 'recent'
                ? 'recent'
                : sortBy === 'spent'
                  ? 'spent'
                  : sortBy === 'washes'
                    ? 'washes'
                    : 'name'
            }
            onValueChange={(val) => {
              if (val === 'recent') {
                setSortBy('recent')
                setSortOrder('desc')
              } else if (val === 'spent') {
                setSortBy('spent')
                setSortOrder('desc')
              } else if (val === 'washes') {
                setSortBy('washes')
                setSortOrder('desc')
              } else if (val === 'name') {
                setSortBy('name')
                setSortOrder('asc')
              }
            }}
            options={[
              { value: 'recent', label: 'Most Recent' },
              { value: 'spent', label: 'Top Spenders' },
              { value: 'washes', label: 'Most Services (Washes + Shop)' },
              { value: 'name', label: 'Name (A-Z)' },
            ]}
            icon={<Filter className="w-3.5 h-3.5 text-primary shrink-0 stroke-[2.2]" />}
            triggerClassName="h-10 bg-white border-gray-200 text-gray-800 text-xs font-semibold shadow-2xs hover:bg-gray-50/70"
            className="w-auto shrink-0"
          />
        </div>
      </div>

      {/* 3. Customer Data Table */}
      {isLoading ? (
        <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs font-semibold">Loading customer records...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white border border-gray-200/80 p-8 flex flex-col items-center justify-center gap-3">
          <Users className="w-12 h-12 text-gray-300" />
          <h4 className="text-base font-bold text-gray-700">No Customers Found</h4>
          <p className="text-xs text-gray-500 max-w-sm">
            {searchQuery
              ? `No customer matching "${searchQuery}" was found. Try another search term.`
              : 'No customers are registered in the system yet.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CUSTOMER</TableHead>
                <TableHead>PHONE</TableHead>
                <TableHead>VEHICLES</TableHead>
                <TableHead className="text-center">WASHES</TableHead>
                <TableHead className="text-center">DELIVERIES</TableHead>
                <TableHead className="text-center">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.map((customer, idx) => {
                return (
                  <TableRow
                    key={customer.id}
                    onClick={() => handleOpenCustomerDetails(customer)}
                    className="cursor-pointer hover:bg-gray-50/80 transition-colors group"
                  >
                    {/* Customer Identity */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-light border border-primary-border/60 flex items-center justify-center text-primary font-black text-xs shrink-0 shadow-2xs">
                          {customer.avatar ? (
                            <img
                              src={customer.avatar}
                              alt={customer.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            customer.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-gray-900 text-xs truncate group-hover:text-primary transition-colors">
                            {customer.name}
                          </span>
                          <span className="text-[11px] text-gray-500 truncate">
                            {customer.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact Phone */}
                    <TableCell>
                      {customer.phone ? (
                        <span className="text-xs font-mono text-gray-700 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{customer.phone}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">—</span>
                      )}
                    </TableCell>

                    {/* Vehicles - Only 1 primary vehicle displayed */}
                    <TableCell>
                      {customer.vehicles.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 text-xs font-semibold max-w-[200px]">
                          <Car className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate" title={customer.vehicles[0]}>
                            {customer.vehicles[0]}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">—</span>
                      )}
                    </TableCell>

                    {/* Washes Count */}
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-bold bg-primary-light text-primary border border-primary-border/60">
                        {customer.totalWashes}
                      </span>
                    </TableCell>

                    {/* Deliveries Count */}
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {customer.totalDeliveries}
                      </span>
                    </TableCell>

                    {/* 3-Dot Actions Dropdown */}
                    <TableCell className="text-center">
                      <div className="relative inline-block text-left" data-dropdown-container>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveMenuCustomerId((prev) =>
                              prev === customer.id ? null : customer.id
                            )
                          }}
                          className={`p-1.5 rounded-xl border transition-all cursor-pointer ${activeMenuCustomerId === customer.id
                            ? 'bg-gray-100 border-gray-300 text-gray-900 shadow-2xs'
                            : 'border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                          title="Actions"
                          aria-label="Actions"
                        >
                          <MoreVertical className="w-4 h-4 stroke-[2.2]" />
                        </button>

                        {/* Floating Dropdown Menu */}
                        {activeMenuCustomerId === customer.id && (
                          <div
                            className={`absolute right-0 w-44 rounded-xl bg-white border border-gray-200/90 shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-100 ${idx >= paginatedCustomers.length - 2 && paginatedCustomers.length > 2
                              ? 'bottom-full mb-1.5 origin-bottom-right'
                              : 'top-full mt-1.5 origin-top-right'
                              }`}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveMenuCustomerId(null)
                                handleOpenCustomerDetails(customer)
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-primary flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-gray-400" />
                              <span>View Details</span>
                            </button>

                            <div className="my-1 border-t border-gray-100" />

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveMenuCustomerId(null)
                                setCustomerToDelete(customer)
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                              <span>Delete User</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* 4. Editorial Centered Pagination Component (10 items per page) */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCustomers.length}
            pageSize={pageSize}
            onPageChange={(p) => {
              setCurrentPage(p)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        </div>
      )}

      {/* 5. Delete Customer Confirmation Dialog */}
      {customerToDelete && (
        <Dialog
          isOpen={true}
          onClose={() => !isDeleting && setCustomerToDelete(null)}
          title="Delete Customer"
          maxWidth="sm"
        >
          <div className="flex flex-col gap-4 p-1 sm:p-2">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-bold text-gray-900">
                  Delete {customerToDelete.name}?
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {customerToDelete.id && customerToDelete.id.startsWith('cust-')
                    ? `This is a guest record generated from orders/bookings (${customerToDelete.email}). Removing it will clear it from the active customer view.`
                    : `Are you sure you want to delete this customer account? This will permanently remove their profile (${customerToDelete.email}) from the database.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteCustomer}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-xs font-bold text-white transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}

export const AdminCustomersView = CustomersView
export { CustomersView as CustomerManagementPage }
export default CustomersView
