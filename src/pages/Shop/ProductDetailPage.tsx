import React, { useState } from 'react'
import {
  ChevronLeft,
  Share2,
  ShoppingCart,
  Check,
  Truck,
  Plus,
  Minus,
  CheckCircle2,
  X,
  CreditCard,
  MapPin,
  Clock,
  ArrowRight,
  Banknote,
} from 'lucide-react'
import { ProductItem, DeliveryAddress } from '@/types'
import { isValidPhone } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'
import { DeliveryAddressModal } from '@/components/DeliveryAddressModal'
import { db } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

interface ProductDetailPageProps {
  product: ProductItem | null
  onClose: () => void
  onAddToCart: (product: ProductItem, quantity: number) => void
  onBuyNowSuccess?: (product: ProductItem, quantity: number) => void
  cartCount?: number
  onOpenCart?: () => void
  userProfile?: {
    name?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    postalCode?: string
  }
  onCheckoutOrder?: (orderData: any) => Promise<string>
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNowSuccess,
  cartCount = 0,
  onOpenCart,
  userProfile,
  onCheckoutOrder,
}) => {
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'specs'>('overview')
  const [showBuyModal, setShowBuyModal] = useState(false)
  const paymentMethod = 'cod'
  const [orderComplete, setOrderComplete] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [confirmedOrderId, setConfirmedOrderId] = useState('')
  const { showToast } = useToast()

  // Delivery Address State
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress>(() => ({
    id: 'addr-default',
    label: 'Home',
    recipientName: userProfile?.name || 'Customer',
    streetAddress: userProfile?.address || '1420 Water Street, Apt 304',
    city: userProfile?.city || 'Kelowna, BC',
    postalCode: userProfile?.postalCode || 'V1Y 1J4',
    phone: userProfile?.phone || '(250) 555-0192',
    isDefault: true,
  }))
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)

  // Sync address if userProfile is loaded from Firestore
  React.useEffect(() => {
    if (userProfile?.address) {
      setSelectedAddress((prev) => ({
        ...prev,
        recipientName: userProfile.name || prev.recipientName,
        streetAddress: userProfile.address || prev.streetAddress,
        city: userProfile.city || prev.city,
        postalCode: userProfile.postalCode || prev.postalCode,
        phone: userProfile.phone || prev.phone,
      }))
    }
  }, [userProfile])

  if (!product) return null

  const unitPrice = product.priceNumeric
  const subtotal = (unitPrice * quantity).toFixed(2)
  const shippingFee = unitPrice * quantity >= 50 ? 0 : 5.99
  const taxFee = ((unitPrice * quantity) * 0.05).toFixed(2)
  const grandTotal = (unitPrice * quantity + shippingFee + parseFloat(taxFee)).toFixed(2)

  const handleDecreaseQty = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1)
  }

  const handleIncreaseQty = () => {
    if (quantity < 20) setQuantity((prev) => prev + 1)
  }

  const handleAddToCartClick = () => {
    onAddToCart(product, quantity)
  }

  const handleBuyNowClick = () => {
    setShowBuyModal(true)
  }

  const handleConfirmOrder = async () => {
    if (!product) {
      showToast('No product selected.', 'error')
      return
    }
    if (!selectedAddress.streetAddress || selectedAddress.streetAddress.trim().length < 5) {
      showToast('Please enter a complete street address (at least 5 characters).', 'error')
      return
    }
    if (!selectedAddress.recipientName || selectedAddress.recipientName.trim().length < 2) {
      showToast('Please enter a recipient name (at least 2 characters).', 'error')
      return
    }
    if (!selectedAddress.phone || !isValidPhone(selectedAddress.phone)) {
      showToast('Please enter a valid 10-digit phone number for delivery.', 'error')
      return
    }
    setIsProcessing(true)

    const originalDocRef = doc(collection(db, 'orders'))
    let finalOrderId = originalDocRef.id

    try {
      if (onCheckoutOrder) {
        const orderData = {
          items: [{ product, quantity }],
          totalItemsCount: quantity,
          itemsSubtotal: parseFloat(subtotal),
          discountAmount: 0,
          shippingFee,
          taxFee: parseFloat(taxFee),
          grandTotal,
          paymentMethod: 'Cash on Delivery (COD)',
          paymentStatus: 'pending',
          shippingAddress: `${selectedAddress.streetAddress}, ${selectedAddress.city} ${selectedAddress.postalCode}`,
          deliveryNotes: selectedAddress.deliveryNotes || '',
          customerName: selectedAddress.recipientName || userProfile?.name || 'Customer',
          customerEmail: userProfile?.email || '',
          customerPhone: selectedAddress.phone || userProfile?.phone || '',
          createdAt: new Date().toISOString(),
          orderType: 'direct_buy_now',
        }
        finalOrderId = await onCheckoutOrder(orderData)
      } else {
        await new Promise((r) => setTimeout(r, 600))
        const originalDocRef = doc(collection(db, 'orders'))
        finalOrderId = originalDocRef.id
      }

      setConfirmedOrderId(finalOrderId)
      setIsProcessing(false)
      setOrderComplete(true)
      showToast(`Order ${finalOrderId} placed successfully!`, 'success')

      if (onBuyNowSuccess) {
        onBuyNowSuccess(product, quantity)
      }
    } catch (err: any) {
      setIsProcessing(false)
      showToast(err?.message || 'Could not place order. Please try again.', 'error')
    }
  }

  const handleCloseAll = () => {
    setShowBuyModal(false)
    setOrderComplete(false)
    onClose()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description,
          url: window.location.href,
        })
      } catch {
        // user cancelled or unsupported
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto animate-in slide-in-from-bottom duration-200">
      <div className="w-full max-w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto min-h-screen flex flex-col bg-white pb-32">
        {/* 1. TOP HEADER */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-4 sm:px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-surface-alt active:scale-95 transition-all cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Bentley Shop
            </span>
            <h1 className="text-sm font-bold text-gray-900 truncate max-w-[200px] text-center">
              {product.title}
            </h1>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-surface-alt active:scale-95 transition-all cursor-pointer"
              title="Share"
            >
              <Share2 className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={onOpenCart || handleAddToCartClick}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs hover:bg-primary-hover active:scale-95 transition-all relative cursor-pointer"
              title="Cart"
            >
              <ShoppingCart className="w-4 h-4 text-primary-foreground" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-primary text-[10px] font-bold flex items-center justify-center border border-primary shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* 2. HERO IMAGE CONTAINER */}
        <div className="p-4 sm:p-5">
          <div className="relative w-full aspect-square sm:h-80 rounded-3xl overflow-hidden bg-slate-50 border border-gray-100 shadow-sm flex items-center justify-center">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-contain p-2 sm:p-4 hover:scale-105 transition-transform duration-300"
            />

            {/* Badges */}
            <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 items-start">
              {product.badge && (
                <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold uppercase tracking-wider shadow-sm flex items-center">
                  {product.badge}
                </span>
              )}
              {product.volume && (
                <span className="px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-semibold tracking-tight shadow-xs">
                  {product.volume}
                </span>
              )}
            </div>

            {/* In-Stock Indicator */}
            <div className="absolute bottom-3.5 right-3.5">
              <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm border border-emerald-200 text-emerald-700 text-[10px] font-bold flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                In Stock &amp; Ready
              </span>
            </div>
          </div>
        </div>

        {/* 3. PRODUCT ESSENTIAL INFO */}
        <div className="px-4 sm:px-5 flex flex-col gap-3">
          {/* Title & Subtitle */}
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight leading-snug">
              {product.title}
            </h2>
            {product.subtitle && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
                {product.subtitle}
              </p>
            )}
          </div>

          {/* Pricing Row */}
          <div className="flex items-baseline gap-2.5 pt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-primary font-mono tracking-tight">
              {product.price}
            </span>
          </div>

          {/* Fast Delivery Callout */}
          <div className="bg-surface-alt rounded-2xl p-3 border border-gray-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-primary shadow-xs">
                <Truck className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 block">
                  Same-Day Mobile Car Wash Delivery
                </span>
                <span className="text-[11px] text-gray-500">
                  Technician delivers during service or express dispatch
                </span>
              </div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="pt-2">
            <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-2">
              Select Quantity
            </label>
            <div className="flex items-center justify-between bg-surface-alt rounded-2xl p-2 border border-gray-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDecreaseQty}
                  disabled={quantity <= 1}
                  className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold text-base text-gray-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncreaseQty}
                  disabled={quantity >= 10}
                  className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="text-right pr-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-wide block font-semibold">
                  Subtotal
                </span>
                <span className="text-base font-extrabold text-primary font-mono">
                  ${subtotal}
                </span>
              </div>
            </div>
          </div>

          {/* 4. TABS: Overview / Features / Specs */}
          <div className="mt-2">
            <div className="flex border-b border-gray-200 gap-6">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`pb-2.5 text-xs font-bold tracking-tight border-b-2 cursor-pointer transition-all ${
                  activeTab === 'overview'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('features')}
                className={`pb-2.5 text-xs font-bold tracking-tight border-b-2 cursor-pointer transition-all ${
                  activeTab === 'features'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                Key Features
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`pb-2.5 text-xs font-bold tracking-tight border-b-2 cursor-pointer transition-all ${
                  activeTab === 'specs'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                Specifications
              </button>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="py-3 text-xs sm:text-sm text-gray-600 leading-relaxed">
                <p>{product.description}</p>
              </div>
            )}

            {/* Tab 2: Features */}
            {activeTab === 'features' && (
              <div className="py-3 flex flex-col gap-2">
                {product.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 bg-surface-alt p-2.5 rounded-xl border border-gray-200/60"
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-xs text-gray-700 font-medium leading-relaxed">
                      {feat}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Specs */}
            {activeTab === 'specs' && (
              <div className="py-3 flex flex-col gap-2">
                <div className="flex justify-between py-1.5 border-b border-gray-100 text-xs">
                  <span className="text-gray-500">Brand</span>
                  <span className="font-semibold text-gray-900">
                    Bentley Mobile Auto Detail
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100 text-xs">
                  <span className="text-gray-500">Category</span>
                  <span className="font-semibold text-gray-900">{product.category}</span>
                </div>
                {product.volume && (
                  <div className="flex justify-between py-1.5 border-b border-gray-100 text-xs">
                    <span className="text-gray-500">Volume / Size</span>
                    <span className="font-semibold text-gray-900">{product.volume}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-b border-gray-100 text-xs">
                  <span className="text-gray-500">Availability</span>
                  <span className="font-semibold text-emerald-600">Immediate Dispatch</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100 text-xs">
                  <span className="text-gray-500">Origin</span>
                  <span className="font-semibold text-gray-900">Ontario, Canada</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5. STICKY BOTTOM ACTION BAR */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-4 sm:px-5 py-3 shadow-lg">
          <div className="w-full max-w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto flex items-center gap-3">
            {/* Price Preview */}
            <div className="flex flex-col shrink-0">
              <span className="text-[10px] text-gray-500 font-semibold uppercase">
                Total ({quantity} item{quantity > 1 ? 's' : ''})
              </span>
              <span className="text-lg sm:text-xl font-extrabold text-primary font-mono leading-none mt-0.5">
                ${subtotal}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex-1 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddToCartClick}
                className="flex-1 bg-surface-alt hover:bg-gray-200 text-secondary text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-gray-300 h-10"
              >
                <ShoppingCart className="w-4 h-4 text-secondary" />
                <span>Add to Cart</span>
              </Button>

              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleBuyNowClick}
                className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-md h-10"
              >
                <span>Buy Now</span>
                <ArrowRight className="w-4 h-4 text-primary-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. INSTANT BUY NOW / CHECKOUT MODAL */}
      <Dialog
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        zIndex="z-60"
        position="bottom-sheet"
        maxWidth="md"
        contentClassName="p-5 sm:p-6 max-h-[90vh] overflow-y-auto"
      >
        {!orderComplete ? (
              <div className="flex flex-col gap-4">
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-gray-900">
                      Express Checkout
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-light px-2 py-0.5 rounded-sm">
                      Instant
                    </span>
                  </div>
                  <button
                    onClick={() => setShowBuyModal(false)}
                    className="w-8 h-8 rounded-full bg-surface-alt hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Item Summary */}
                <div className="flex items-center gap-3 bg-surface-alt p-3 rounded-2xl border border-gray-200">
                  <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-gray-900 truncate">
                      {product.title}
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Qty: {quantity} • {product.volume || product.category}
                    </p>
                    <span className="text-xs font-extrabold text-primary font-mono">
                      ${subtotal}
                    </span>
                  </div>
                </div>

                {/* Delivery Location */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
                      Deliver To
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddressModalOpen(true)}
                      className="text-[11px] font-bold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Change Address</span>
                    </button>
                  </div>
                  <div
                    onClick={() => setIsAddressModalOpen(true)}
                    className="bg-surface-alt hover:bg-gray-100 p-3 rounded-2xl border border-gray-200 flex items-start gap-2.5 cursor-pointer transition-all"
                  >
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {selectedAddress.recipientName} ({selectedAddress.label})
                        </span>
                        <span className="text-[10px] text-primary font-bold bg-primary-light px-2 py-0.5 rounded-full border border-primary/20 shrink-0 ml-2">
                          Edit / Change
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-0.5 truncate">
                        {selectedAddress.streetAddress}, {selectedAddress.city} {selectedAddress.postalCode}
                      </p>
                      {selectedAddress.deliveryNotes && (
                        <p className="text-[10px] text-gray-400 mt-0.5 italic truncate">
                          Note: {selectedAddress.deliveryNotes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700 block mb-1.5">
                    Select Payment Method
                  </label>
                  <div className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-50/50 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900">Cash on Delivery (COD)</span>
                        <span className="text-[10px] text-gray-600">Pay cash upon technician arrival</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                      COD Only
                    </span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-surface-alt p-3 rounded-2xl border border-gray-200 flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Items Subtotal</span>
                    <span className="font-mono">${subtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Estimated Tax (5%)</span>
                    <span className="font-mono">${taxFee}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Mobile Dispatch Delivery</span>
                    <span className="font-semibold text-emerald-600">
                      {shippingFee === 0 ? 'FREE' : `$${shippingFee}`}
                    </span>
                  </div>
                  <div className="pt-2 mt-1 border-t border-gray-200 flex justify-between font-bold text-sm text-gray-900">
                    <span>Total Amount</span>
                    <span className="text-primary font-mono font-extrabold">
                      ${grandTotal}
                    </span>
                  </div>
                </div>

                {/* Confirm Pay Button */}
                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground font-extrabold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Placing COD Order...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm Order (Cash on Delivery)</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Order Completed Celebration View */
              <div className="flex flex-col items-center text-center py-4 gap-3 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-400 flex items-center justify-center text-emerald-600 shadow-sm animate-bounce">
                  <CheckCircle2 className="w-9 h-9 text-emerald-600" />
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">
                    Order Placed Successfully!
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">
                    Thank you for ordering official Bentley detailing care products. Your technician will bring this item directly to your scheduled wash!
                  </p>
                </div>

                {/* Order Details Card */}
                <div className="w-full bg-surface-alt rounded-2xl p-3 border border-gray-200 text-left flex flex-col gap-1.5 text-xs mt-1">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-500 shrink-0">Order ID:</span>
                    <span className="font-mono font-bold text-gray-900 break-all text-right text-[11px]">{confirmedOrderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Product:</span>
                    <span className="font-semibold text-gray-900 truncate max-w-[180px]">
                      {product.title}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount Due:</span>
                    <span className="font-mono font-bold text-primary">
                      ${grandTotal} CAD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Option:</span>
                    <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Cash on Delivery (Pay on arrival)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Estimated Delivery:</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Within 1-2 hours
                    </span>
                  </div>
                </div>

                <div className="w-full flex flex-col gap-2 pt-2">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleCloseAll}
                    className="w-full rounded-sm bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-sm active:scale-95 transition-all cursor-pointer h-10"
                  >
                    Continue Shopping
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCloseAll}
                    className="w-full rounded-sm bg-surface-alt hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-all cursor-pointer h-9"
                  >
                    Back to Home
                  </Button>
                </div>
              </div>
            )}
      </Dialog>
      {/* Address Selection Modal */}
      <DeliveryAddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        currentAddress={selectedAddress}
        onSelectAddress={(newAddr) => {
          setSelectedAddress(newAddr)
          showToast(`Delivery destination set to ${newAddr.label}!`, 'success')
        }}
        userName={userProfile?.name}
        userPhone={userProfile?.phone}
      />
    </div>
  )
}
export default ProductDetailPage
