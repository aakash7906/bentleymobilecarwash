import React, { useState } from 'react'
import { ServiceItem, ProductItem, CartItem, SavedVehicle, BookingRecord } from '@/types'
import { SERVICES_CATALOG } from '@/data/mockData'
import { BENTLEY_PRODUCTS } from '@/data/productsData'
import logoBentley from '@/assets/Logo_Bentley.png'

// Category and Section Assets from src/assets/home
import catCarWashImg from '@/assets/home/wheel-brush-clean.png'
import catExteriorImg from '@/assets/home/cat-exterior.png'
import catInteriorImg from '@/assets/home/cat-interior.png'
import catTireShineImg from '@/assets/home/cat-tire-shine.png'
import recCarWashImg from '@/assets/home/rec-car-wash.png'
import shopTireShineImg from '@/assets/home/shop-tire-shine.jpg'
import { OrderTrackingMapPage } from '@/pages/Orders/OrderTrackingMapPage'
import { ProductDetailPage } from '@/pages/Shop/ProductDetailPage'
import { CartPage } from '@/pages/Orders/CartPage'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/button'
import { auth, db } from '@/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { getLiveGPSLocation } from '@/services/locationService'

interface HomeTabProps {
  onSelectService: (service: ServiceItem) => void
  onBookNow?: (service: ServiceItem) => void
  onAddCar: () => void
  currentVehicle: string
  onSelectVehicle: (vehicle: string) => void
  onOpenTracking?: (booking?: BookingRecord) => void
  savedVehicles?: SavedVehicle[]
  activeBookings?: BookingRecord[]
  userProfile?: {
    name?: string
    email?: string
    phone?: string
    address?: string
    lastLocation?: string
    city?: string
    postalCode?: string
  }
  cartItems: CartItem[]
  onAddToCart: (product: ProductItem, quantity?: number) => void
  onUpdateCartQuantity: (productId: string, quantity: number) => void
  onRemoveCartItem: (productId: string) => void
  onClearCart: () => void
  onCheckoutOrder?: (orderData: any) => Promise<string>
  detectedAddress?: string
  onUpdateLocation?: (address: string, city?: string, postalCode?: string, street?: string) => void
}

function calculateDistanceKm(c1: [number, number], c2: [number, number]): number {
  const R = 6371
  const dLat = ((c2[1] - c1[1]) * Math.PI) / 180
  const dLon = ((c2[0] - c1[0]) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1[1] * Math.PI) / 180) *
      Math.cos((c2[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return parseFloat((R * c).toFixed(1))
}

export const HomeTab: React.FC<HomeTabProps> = ({
  onSelectService,
  onBookNow,
  onAddCar,
  currentVehicle,
  onSelectVehicle,
  onOpenTracking,
  savedVehicles,
  activeBookings = [],
  userProfile,
  cartItems,
  onAddToCart,
  onUpdateCartQuantity,
  onRemoveCartItem,
  onClearCart,
  onCheckoutOrder,
  detectedAddress,
  onUpdateLocation,
}) => {
  // Global Toast Hook
  const { showToast } = useToast()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isTrackingMapOpen, setIsTrackingMapOpen] = useState(false)
  const [selectedTrackingBooking, setSelectedTrackingBooking] = useState<BookingRecord | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(() => {
    try {
      return localStorage.getItem('bentley_home_cart_open') === 'true'
    } catch {
      return false
    }
  })

  // Persist cart open state across refreshes
  React.useEffect(() => {
    try {
      if (isCartOpen) {
        localStorage.setItem('bentley_home_cart_open', 'true')
      } else {
        localStorage.removeItem('bentley_home_cart_open')
      }
    } catch { }
  }, [isCartOpen])

  const [currentAddress, setCurrentAddress] = useState(
    detectedAddress || userProfile?.lastLocation || userProfile?.address || ''
  )
  const [isLocating, setIsLocating] = useState(false)
  // Dynamic driving ETA state for en_route booking (in minutes)
  const [dynamicDrivingEtaMins, setDynamicDrivingEtaMins] = useState<number | null>(() => {
    const enRouteBooking = activeBookings.find((b) => b.status === 'en_route')
    if (
      enRouteBooking &&
      typeof enRouteBooking.estimatedMins === 'number' &&
      enRouteBooking.estimatedMins > 0 &&
      enRouteBooking.estimatedMins <= 45
    ) {
      return enRouteBooking.estimatedMins
    }
    return enRouteBooking ? 10 : null
  })

  // Calculate live dynamic ETA when driver accepts and starts driving (en_route)
  React.useEffect(() => {
    const enRouteBooking = activeBookings.find((b) => b.status === 'en_route')
    if (!enRouteBooking) {
      setDynamicDrivingEtaMins(null)
      return
    }

    if (
      typeof enRouteBooking.estimatedMins === 'number' &&
      enRouteBooking.estimatedMins > 0 &&
      enRouteBooking.estimatedMins <= 45
    ) {
      setDynamicDrivingEtaMins(enRouteBooking.estimatedMins)
      return
    }

    // Resolve customer coordinates (defaulting to Kelowna service area if missing)
    const customerCoords = enRouteBooking.customerCoords || [-119.496, 49.888]
    let driverCoords = enRouteBooking.driverCoords || [customerCoords[0] - 0.015, customerCoords[1] + 0.012]

    // If driver and customer are > 35km apart (e.g. cross-province coordinates or device location testing),
    // anchor technician in the customer's locality (~2km away) so ETA is realistic and consistent
    const rawDistanceKm = calculateDistanceKm(driverCoords, customerCoords)
    if (rawDistanceKm > 35) {
      driverCoords = [customerCoords[0] - 0.015, customerCoords[1] + 0.012]
    }

    let isSubscribed = true
    const controller = new AbortController()

    const fetchLiveRouteEta = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${driverCoords[0]},${driverCoords[1]};${customerCoords[0]},${customerCoords[1]}?overview=false`
        const res = await fetch(url, { signal: controller.signal })
        const data = await res.json()
        if (isSubscribed && data.code === 'Ok' && data.routes?.[0]?.duration) {
          const rawMins = Math.round(data.routes[0].duration / 60)
          // Ensure ETA in minutes is realistic (mobile dispatch is between 2 and 30 mins)
          const mins = Math.min(30, Math.max(2, rawMins))
          setDynamicDrivingEtaMins(mins)
          return
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return
      }
      if (isSubscribed) {
        const distKm = calculateDistanceKm(driverCoords, customerCoords)
        const calculatedMins = Math.min(30, Math.max(3, Math.round(distKm * 2.2)))
        setDynamicDrivingEtaMins(calculatedMins)
      }
    }

    fetchLiveRouteEta()
    return () => {
      isSubscribed = false
      controller.abort()
    }
  }, [activeBookings])

  // Sync user address if detectedAddress or userProfile updates
  React.useEffect(() => {
    const savedLoc = detectedAddress || userProfile?.lastLocation || userProfile?.address || ''
    if (savedLoc) {
      setCurrentAddress(savedLoc)
    }
  }, [detectedAddress, userProfile?.lastLocation, userProfile?.address])

  // Fetch live user GPS location & reverse geocode to address (100% matched with BookingPage)
  const handleFetchLiveLocation = async () => {
    setIsLocating(true)
    showToast('Detecting your live location...', 'info', 2000)

    try {
      const result = await getLiveGPSLocation()
      setCurrentAddress(result.fullAddress)
      showToast(`Location detected: ${result.fullAddress}`, 'success')
      onUpdateLocation?.(result.fullAddress, result.city, result.postalCode, result.street)

      if (auth.currentUser) {
        try {
          const userDocRef = doc(db, 'users', auth.currentUser.uid)
          await setDoc(
            userDocRef,
            {
              lastLocation: result.fullAddress,
              address: result.street,
              city: result.city,
              postalCode: result.postalCode,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          )
        } catch (err) {
          console.error('Failed to save location to Firestore in HomeTab:', err)
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'Unable to fetch your location', 'error')
    } finally {
      setIsLocating(false)
    }
  }

  const cartCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0)

  const handleAddToCart = (product: ProductItem, quantity: number = 1) => {
    onAddToCart(product, quantity)
  }

  // Detect vehicle type for vehicle-aware pricing
  const activeVehicleObj = savedVehicles?.find((v) => v.name === currentVehicle)
  const activeVehicleType = activeVehicleObj?.type || 'Sedan'
  const premiumPriceNumeric =
    activeVehicleType === 'SUV'
      ? 240
      : activeVehicleType === 'Truck' || activeVehicleType === 'Van'
        ? 280
        : 190

  // Recommended for you cards featuring Bentley's Official Cleaning Packages
  const supremeItem = SERVICES_CATALOG.find((s) => s.id === 'supreme-package') || SERVICES_CATALOG[1]
  const deluxeItem = SERVICES_CATALOG.find((s) => s.id === 'deluxe-package') || SERVICES_CATALOG[0]
  const premiumItem = SERVICES_CATALOG.find((s) => s.id === 'premium-detail') || SERVICES_CATALOG[2]

  const recommendedCards: {
    id: string
    title: string
    category: string
    price: string
    image: string
    badge: string
    serviceItem: ServiceItem
  }[] = [
    {
      id: supremeItem.id,
      title: supremeItem.title,
      category: supremeItem.category,
      price: supremeItem.price,
      image: supremeItem.image,
      badge: 'Best Value',
      serviceItem: {
        ...supremeItem,
        vehicleModel: currentVehicle,
      },
    },
    {
      id: premiumItem.id,
      title: premiumItem.title,
      category: premiumItem.category,
      price: `$${premiumPriceNumeric}.00`,
      image: premiumItem.image,
      badge: `${activeVehicleType} Rate`,
      serviceItem: {
        ...premiumItem,
        selectedTier: (activeVehicleType === 'SUV'
          ? 'suv'
          : activeVehicleType === 'Truck' || activeVehicleType === 'Van'
            ? 'truck'
            : 'car') as 'car' | 'suv' | 'truck',
        price: `$${premiumPriceNumeric}.00`,
        priceNumeric: premiumPriceNumeric,
        vehicleModel: `${activeVehicleType}${currentVehicle ? ` (${currentVehicle})` : ''}`,
      },
    },
    {
      id: deluxeItem.id,
      title: deluxeItem.title,
      category: deluxeItem.category,
      price: deluxeItem.price,
      image: deluxeItem.image,
      badge: 'Popular',
      serviceItem: {
        ...deluxeItem,
        vehicleModel: currentVehicle,
      },
    },
  ]

  // Bentley Shop authentic products from src/assets/products
  const shopProducts = BENTLEY_PRODUCTS

  const handleSelectCategory = (catName: string) => {
    const found = SERVICES_CATALOG.find(
      (s) =>
        s.category.toLowerCase().includes(catName.toLowerCase()) ||
        s.title.toLowerCase().includes(catName.toLowerCase())
    )
    if (found) {
      onSelectService(found)
    } else {
      onSelectService(recommendedCards[0].serviceItem)
    }
  }

  return (
    <div className="flex flex-col w-full pb-32 relative select-none">
      {/* 1. TOP HEADER: Bentley Mascot Logo & Red Action Buttons */}
      <div className="screen-padding pt-3 sm:pt-4 flex items-center justify-between">
        <img
          src={logoBentley}
          alt="Bentley Mobile Auto Detail & Car Wash"
          className="h-9 sm:h-11 md:h-12 w-auto object-contain cursor-pointer active:scale-95 transition-transform drop-shadow-sm"
        />
        <div className="flex items-center gap-2 sm:gap-2.5">

          {/* Shopping Cart Button */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:bg-primary-hover active:scale-95 transition-all relative cursor-pointer"
            title="Shopping Cart"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">shopping_cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-primary text-[10px] font-bold flex items-center justify-center border border-primary shadow-sm animate-pulse">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. LOCATION BAR (Interactive Live GPS Detection) */}
      <div className="screen-padding mt-2.5 sm:mt-3">
        <button
          type="button"
          onClick={handleFetchLiveLocation}
          disabled={isLocating}
          className="w-full bg-surface-alt hover:bg-gray-200/60 border border-gray-200/70 rounded-xl py-2 px-3 sm:px-3.5 flex items-center justify-between shadow-xs transition-all active:scale-[0.99] text-left group cursor-pointer"
          title="Click to detect your live location"
          aria-label="Detect your live location"
        >
          <div className="flex items-center gap-2 overflow-hidden mr-2">
            <span
              className={`material-symbols-outlined text-primary text-[18px] sm:text-[20px] shrink-0 transition-transform ${isLocating ? 'animate-spin' : 'group-hover:scale-110'
                }`}
            >
              {isLocating ? 'sync' : 'location_on'}
            </span>
            <span
              className={`text-[11px] sm:text-xs truncate tracking-tight ${
                !isLocating && !currentAddress
                  ? 'text-gray-400 font-normal'
                  : 'text-gray-700 font-medium'
              }`}
            >
              {isLocating ? 'Detecting your live location...' : (currentAddress || 'Select your location')}
            </span>
          </div>

          <span className="text-[10px] font-bold text-primary tracking-tight shrink-0 bg-primary-light px-2 py-0.5 rounded-md border border-primary-border/40 group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex items-center gap-1">
            {isLocating && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />}
            <span>{isLocating ? 'Locating...' : 'Locate'}</span>
          </span>
        </button>
      </div>

      {/* 3. HERO BLUEPRINT SECTION: Headline + Add Car */}
      <section className="relative w-full bg-grid-blueprint mt-2.5 sm:mt-3 py-3.5 sm:py-4 screen-padding overflow-hidden">
        <div className="relative z-10 flex items-center justify-between gap-2.5 sm:gap-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-secondary tracking-tight leading-[1.18]">
            Find all your needs
            <br />
            for Car Care
          </h1>

          <Button
            onClick={onAddCar}
            variant="default"
            size="sm"
            className="shrink-0 px-3.5 sm:px-4 bg-primary text-primary-foreground text-[11px] sm:text-xs font-bold shadow-md hover:bg-primary-hover active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>+</span>
            <span>Add Car</span>
          </Button>
        </div>
      </section>

      {/* 4. RED CONTOUR VEHICLE SELECTOR */}
      <div className="relative w-full screen-padding mt-1.5 z-20">
        {/* Left Downward Curved Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-9 overflow-hidden flex items-center pointer-events-none z-0">
          <svg className="w-full h-full" viewBox="0 0 20 36" preserveAspectRatio="none" fill="none">
            <path
              d="M 0,28 Q 10,12 20,12"
              stroke="var(--primary)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* Central Vehicle Dropdown */}
        <div className="relative z-10 w-full">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-white border border-primary rounded-xl px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-sm flex items-center justify-between cursor-pointer hover:bg-primary-light/50 active:scale-98 transition-all"
          >
            <span
              className={`text-xs sm:text-sm tracking-tight truncate ${
                currentVehicle ? 'font-semibold text-gray-900' : 'font-medium text-gray-400'
              }`}
            >
              {currentVehicle || 'Add your vehicle'}
            </span>
            <svg
              className={`w-2.5 h-2.5 text-gray-900 transition-transform duration-200 shrink-0 ml-2 ${isDropdownOpen ? 'rotate-180' : ''
                }`}
              viewBox="0 0 8 6"
              fill="currentColor"
            >
              <path d="M0 0 L8 0 L4 5 Z" />
            </svg>
          </button>

          {/* Saved Vehicles Dropdown */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white rounded-2xl border border-gray-200 shadow-xl p-3 flex flex-col gap-2 animate-in fade-in duration-150">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                YOUR VEHICLES
              </span>
              <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                {savedVehicles && savedVehicles.length > 0 ? (
                  savedVehicles.map((veh) => (
                    <div
                      key={veh.id}
                      onClick={() => {
                        onSelectVehicle(veh.name)
                        setIsDropdownOpen(false)
                      }}
                      className={`flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer transition-colors ${veh.name === currentVehicle
                          ? 'bg-primary-light text-primary font-bold'
                          : 'hover:bg-gray-50 text-gray-800 font-medium'
                        }`}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm truncate">{veh.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-gray-500 font-normal">{veh.type}</span>
                          {veh.licensePlate && (
                            <span className="text-[10px] font-mono font-semibold text-primary">
                              • {veh.licensePlate}
                            </span>
                          )}
                        </div>
                      </div>
                      {veh.isPrimary && (
                        <span className="text-[9px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-sm shrink-0">
                          Primary
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-2 px-3 text-xs text-gray-500">
                    No vehicles saved. Click Add Car to register.
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false)
                  onAddCar()
                }}
                className="mt-1 w-full py-1.5 rounded-xl border border-dashed border-primary text-primary hover:bg-primary-light text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <span>+ Add your vehicle</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Downward Curved Line */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-9 overflow-hidden flex items-center pointer-events-none z-0">
          <svg className="w-full h-full" viewBox="0 0 20 36" preserveAspectRatio="none" fill="none">
            <path
              d="M 0,12 Q 10,12 20,28"
              stroke="var(--primary)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>


      {/* 6. 4 CATEGORY CARDS (2x2 Asymmetric Bento Grid matching reference design) */}
      <div className="screen-padding mt-5 sm:mt-6 flex flex-col gap-2.5">
        {/* Row 1: Car Wash (~38%) + Exterior Detailing (~62%) */}
        <div className="flex items-center gap-2.5">
          {/* Card 1: Car Wash */}
          <div
            onClick={() => handleSelectCategory('Car Wash')}
            className="flex-[0.38] bg-surface-alt hover:bg-gray-200 rounded-[20px] p-3 sm:p-4 h-32 sm:h-36 md:h-40 flex flex-col justify-between overflow-hidden relative cursor-pointer hover:shadow-md transition-all active:scale-[0.98] group"
          >
            <span className="font-['Urbanist',sans-serif] text-sm sm:text-base md:text-lg font-bold text-secondary z-10 leading-tight">
              Car Wash
            </span>
            <div className="absolute -right-2 -bottom-2 w-26 sm:w-30 md:w-36 h-24 sm:h-28 md:h-32 overflow-hidden pointer-events-none flex items-end justify-end">
              <img
                src={catCarWashImg}
                alt="Car Wash"
                className="w-full h-full object-contain object-top group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
              />
            </div>
          </div>

          {/* Card 2: Exterior Detailing */}
          <div
            onClick={() => handleSelectCategory('Exterior Detailing')}
            className="flex-[0.62] bg-surface-alt hover:bg-gray-200 rounded-[20px] p-3 sm:p-4 h-32 sm:h-36 md:h-40 flex flex-col justify-between overflow-hidden relative cursor-pointer hover:shadow-md transition-all active:scale-[0.98] group"
          >
            <span className="font-['Urbanist',sans-serif] text-sm sm:text-base md:text-lg font-bold text-secondary z-10 leading-tight">
              Exterior Detailing
            </span>
            <div className="absolute right-1 bottom-1 w-[85%] max-w-[210px] sm:max-w-[250px] md:max-w-[280px] h-20 sm:h-24 md:h-28 pointer-events-none flex items-end justify-end">
              <img
                src={catExteriorImg}
                alt="Exterior Detailing"
                className="w-full h-auto max-h-full object-contain object-bottom-right group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Interior Detailing (~62%) + Tire Shine (~38%) */}
        <div className="flex items-center gap-2.5">
          {/* Card 3: Interior Detailing */}
          <div
            onClick={() => handleSelectCategory('Interior Detailing')}
            className="flex-[0.62] bg-surface-alt hover:bg-gray-200 rounded-[20px] p-3 sm:p-4 h-32 sm:h-36 md:h-40 flex flex-col justify-between overflow-hidden relative cursor-pointer hover:shadow-md transition-all active:scale-[0.98] group"
          >
            <span className="font-['Urbanist',sans-serif] text-sm sm:text-base md:text-lg font-bold text-secondary z-10 leading-tight">
              Interior Detailing
            </span>
            <div className="absolute right-0 bottom-0 left-0 h-16 sm:h-20 md:h-24 pointer-events-none flex items-end overflow-hidden">
              <img
                src={catInteriorImg}
                alt="Interior Detailing"
                className="w-full h-full object-cover object-bottom rounded-b-[20px] group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Card 4: Tire Shine */}
          <div
            onClick={() => handleSelectCategory('Tire Shine')}
            className="flex-[0.38] bg-surface-alt hover:bg-gray-200 rounded-[20px] p-3 sm:p-4 h-32 sm:h-36 md:h-40 flex flex-col justify-between overflow-hidden relative cursor-pointer hover:shadow-md transition-all active:scale-[0.98] group"
          >
            <span className="font-['Urbanist',sans-serif] text-sm sm:text-base md:text-lg font-bold text-secondary z-10 leading-tight">
              Tire Shine
            </span>
            <div className="absolute -right-2 -bottom-2 w-24 sm:w-28 md:w-34 h-22 sm:h-26 md:h-30 pointer-events-none flex items-end justify-end overflow-hidden">
              <img
                src={catTireShineImg}
                alt="Tire Shine"
                className="w-full h-full object-contain object-bottom-right group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 7. "RECOMMENDED FOR YOU" SECTION */}
      <section className="mt-5 sm:mt-6 flex flex-col gap-3">
        <div className="screen-padding flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
            Recommended for You
          </h2>
          <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium">more &gt;</span>
        </div>

        {/* Horizontal Scrollable Cards Strip with smooth touch momentum scrolling */}
        <div className="flex items-stretch gap-3 sm:gap-3.5 overflow-x-auto overscroll-x-contain pb-3.5 pt-1.5 px-4 sm:px-5 scroll-px-4 sm:scroll-px-5 scrollbar-none snap-x snap-mandatory">
          {recommendedCards.map((card) => (
            <div
              key={card.id}
              className="w-[240px] sm:w-[265px] md:w-[280px] shrink-0 snap-start bg-white rounded-2xl border border-gray-200/90 shadow-sm p-3 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              {/* Service Hero Image - Inset with padding and rounded corners */}
              <div className="relative h-34 sm:h-38 md:h-40 w-full overflow-hidden rounded-xl bg-slate-100 shadow-inner">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Category Pill & Starting at Price */}
              <div className="mt-2.5 flex items-center justify-between gap-1">
                <span className="px-2.5 py-0.5 rounded-sm bg-primary text-primary-foreground text-[10px] font-bold tracking-wide shrink-0">
                  {card.category}
                </span>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block leading-tight font-medium">
                    Starting at
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-primary">
                    {card.price}
                  </span>
                </div>
              </div>

              {/* Service Title */}
              <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 line-clamp-1 mt-1">
                {card.title}
              </h3>

              {/* Side-by-Side Action Buttons: View Detail > & Book Now > */}
              <div className="flex items-center gap-2 mt-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectService(card.serviceItem)}
                  className="flex-1 bg-surface-alt hover:bg-gray-200 text-primary border border-gray-200/80 text-[11px] font-semibold cursor-pointer"
                >
                  View Detail &gt;
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() =>
                    onBookNow ? onBookNow(card.serviceItem) : onSelectService(card.serviceItem)
                  }
                  className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground text-[11px] font-bold shadow-xs cursor-pointer"
                >
                  Book Now &gt;
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. "BENTLEY SHOP" SECTION */}
      <section className="mt-5 sm:mt-6 flex flex-col gap-3">
        <div className="screen-padding flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              Bentley Shop
            </h2>
          </div>
          <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium">more &gt;</span>
        </div>

        {/* Horizontal Scrollable Shop Products Strip */}
        <div className="flex items-stretch gap-3 sm:gap-3.5 overflow-x-auto overscroll-x-contain pb-3.5 pt-1.5 px-4 sm:px-5 scroll-px-4 sm:scroll-px-5 scrollbar-none snap-x snap-mandatory">
          {shopProducts.map((prod) => (
            <div
              key={prod.id}
              onClick={() => setSelectedProduct(prod)}
              className="w-[245px] sm:w-[270px] md:w-[285px] shrink-0 snap-start bg-white rounded-2xl border border-gray-200/90 shadow-sm p-3 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer group"
            >
              {/* Product Image Container */}
              <div className="relative h-40 sm:h-44 md:h-48 w-full overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center p-2 border border-gray-100">
                <img
                  src={prod.image}
                  alt={prod.title}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />

                {/* Badge Overlay */}
                {prod.badge && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-sm bg-primary text-primary-foreground text-[9px] font-extrabold uppercase tracking-wider shadow-xs">
                    {prod.badge}
                  </span>
                )}

                {/* Volume Pill Overlay */}
                {prod.volume && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-sm bg-secondary text-secondary-foreground text-[9px] font-semibold tracking-tight shadow-xs">
                    {prod.volume}
                  </span>
                )}
              </div>

              {/* Category & Rating */}
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                  {prod.category}
                </span>
                <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                  ★ {prod.rating}
                </span>
              </div>

              {/* Product Title & Price */}
              <div className="mt-1 flex items-start justify-between gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                  {prod.title}
                </h3>
                <span className="text-xs sm:text-sm font-extrabold text-primary shrink-0 font-mono">
                  {prod.price}
                </span>
              </div>

              {/* Action Buttons: View Details & Add to Cart */}
              <div className="flex items-center gap-2 mt-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedProduct(prod)
                  }}
                  className="flex-1 bg-surface-alt hover:bg-gray-200 text-secondary border border-gray-200/80 text-[11px] font-semibold cursor-pointer"
                >
                  Details &gt;
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddToCart(prod, 1)
                  }}
                  className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground text-[11px] font-bold shadow-xs cursor-pointer"
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. FLOATING BOTTOM STATUS POPUP PILL: Dynamic Technician Status & Real-time ETA */}
      {(() => {
        // Resolve active booking with priority to en_route -> in_progress -> accepted -> scheduled -> pending
        const liveBooking =
          activeBookings.find((b) => b.status === 'en_route') ||
          activeBookings.find((b) => b.status === 'in_progress') ||
          activeBookings.find((b) => b.status === 'accepted') ||
          activeBookings.find((b) => b.status === 'scheduled') ||
          activeBookings.find((b) => b.status === 'pending')

        if (!liveBooking) return null

        // ONLY show time when driver accepted the booking and started driving (en_route)
        const isDriving = liveBooking.status === 'en_route'
        const rawDriver = (liveBooking.driverName || liveBooking.technicianName || '').trim()
        const hasRealDriver = Boolean(rawDriver && rawDriver.toLowerCase() !== 'alex rivera')
        const driverName = hasRealDriver ? rawDriver : ''

        let statusLabel = 'Appointment Scheduled'
        if (liveBooking.status === 'en_route') {
          statusLabel = hasRealDriver ? `${driverName} is Arriving` : 'Technician is Arriving'
        } else if (liveBooking.status === 'in_progress') {
          statusLabel = 'Detailing in Progress'
        } else if (liveBooking.status === 'accepted') {
          statusLabel = hasRealDriver ? `${driverName} Assigned` : 'Technician Assigned'
        } else if (liveBooking.status === 'pending') {
          statusLabel = 'Awaiting Driver Acceptance'
        }

        // Dynamic time strictly in minutes (only when driver has accepted & started driving, no spikes or 1/6949 fluctuation)
        const rawMins =
          typeof liveBooking.estimatedMins === 'number' &&
          liveBooking.estimatedMins > 0 &&
          liveBooking.estimatedMins <= 45
            ? liveBooking.estimatedMins
            : dynamicDrivingEtaMins

        // Ensure time is always a consistent, realistic number of minutes (e.g. 8-15 mins, no 1 or 6949 spikes)
        const dynamicMins = isDriving
          ? Math.min(30, Math.max(2, rawMins || 10))
          : null

        const statusBadgeText =
          liveBooking.status === 'accepted'
            ? 'Accepted'
            : liveBooking.status === 'in_progress'
              ? 'In Progress'
              : liveBooking.status === 'scheduled'
                ? 'Scheduled'
                : 'Pending'

        return (
          <div className="fixed bottom-20 sm:bottom-21 left-0 right-0 z-30 pointer-events-none px-5 sm:px-6 animate-in slide-in-from-bottom duration-300">
            <div className="w-full max-w-[360px] sm:max-w-md mx-auto pointer-events-auto">
              <div
                onClick={() => {
                  setSelectedTrackingBooking(liveBooking)
                  if (onOpenTracking) {
                    onOpenTracking(liveBooking)
                  } else {
                    setIsTrackingMapOpen(true)
                  }
                }}
                className="w-full bg-status-active hover:bg-status-active-hover text-white rounded-xl sm:rounded-2xl px-3.5 py-1.5 sm:py-2 shadow-lg flex items-center justify-between cursor-pointer active:scale-98 transition-all border border-white/25 filter drop-shadow-[0_6px_16px_var(--status-active-glow)]"
              >
                {/* Left Content */}
                <div className="flex flex-col items-start gap-0.5">
                  <span className="px-2.5 py-0.5 rounded-sm bg-white/20 border border-white/30 text-white text-[10px] font-medium leading-none">
                    {liveBooking.title || 'Car Wash'}
                  </span>
                  <span className="text-white font-bold text-xs sm:text-sm tracking-tight leading-tight mt-0.5">
                    {statusLabel}
                  </span>
                </div>

                {/* Right Content: Dynamic Countdown ONLY when driving, otherwise Booking Status */}
                {isDriving && dynamicMins ? (
                  <div className="w-11 sm:w-12 h-9.5 sm:h-10 bg-white rounded-xl flex flex-col items-center justify-center shadow-xs shrink-0 ml-2">
                    <span className="text-status-active text-sm sm:text-base font-extrabold leading-none">
                      {dynamicMins}
                    </span>
                    <span className="text-status-active text-[9px] font-bold leading-tight">
                      mins
                    </span>
                  </div>
                ) : (
                  <div className="h-9.5 sm:h-10 px-3 bg-white rounded-xl flex items-center justify-center shadow-xs shrink-0 ml-2">
                    <span className="text-status-active text-[11px] sm:text-xs font-black tracking-wide uppercase leading-none">
                      {statusBadgeText}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* 10. Direct Order Tracking Map Modal from Floating Button */}
      {isTrackingMapOpen && (() => {
        const currentTrackingBooking =
          selectedTrackingBooking ||
          activeBookings.find(
            (b) =>
              (b.status === 'en_route' || b.status === 'in_progress' || b.status === 'accepted') &&
              Boolean(b.driverName || b.technicianName)
          ) ||
          activeBookings[0]

        return (
          <OrderTrackingMapPage
            onBack={() => {
              setIsTrackingMapOpen(false)
              setSelectedTrackingBooking(null)
            }}
            booking={currentTrackingBooking}
            serviceTitle={currentTrackingBooking?.title}
            serviceCategory={currentTrackingBooking?.category}
            customerName={currentTrackingBooking?.customerName || userProfile?.name}
            customerPhone={currentTrackingBooking?.customerPhone || userProfile?.phone}
            customerAddress={currentTrackingBooking?.address || userProfile?.address || currentAddress}
            technicianName={
              currentTrackingBooking?.driverName && currentTrackingBooking.driverName.toLowerCase() !== 'alex rivera'
                ? currentTrackingBooking.driverName
                : currentTrackingBooking?.technicianName && currentTrackingBooking.technicianName.toLowerCase() !== 'alex rivera'
                  ? currentTrackingBooking.technicianName
                  : undefined
            }
            driverCoords={currentTrackingBooking?.driverCoords}
            customerCoords={currentTrackingBooking?.customerCoords}
            driverVanNumber={currentTrackingBooking?.driverVanNumber}
            driverPhone={currentTrackingBooking?.driverPhone}
            bookingStatus={currentTrackingBooking?.status}
          />
        )
      })()}

      {/* 11. Dedicated Product Detail Page Modal */}
      {selectedProduct && (
        <ProductDetailPage
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(prod, qty) => {
            handleAddToCart(prod, qty)
          }}
          onBuyNowSuccess={() => {
            // Real order was placed through checkout
          }}
          cartCount={cartCount}
          onOpenCart={() => {
            setSelectedProduct(null)
            setIsCartOpen(true)
          }}
          userProfile={userProfile}
          onCheckoutOrder={onCheckoutOrder}
        />
      )}

      {/* 12. Dedicated Shopping Cart Page Modal */}
      <CartPage
        isOpen={isCartOpen}
        items={cartItems}
        userProfile={userProfile}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={onUpdateCartQuantity}
        onRemoveItem={onRemoveCartItem}
        onClearCart={onClearCart}
        onCheckoutSuccess={(orderId, total) => {
          showToast(`Order ${orderId} placed for $${total}!`, 'success')
        }}
        onCheckoutOrder={onCheckoutOrder}
        onContinueShopping={() => setIsCartOpen(false)}
      />
    </div>
  )
}
