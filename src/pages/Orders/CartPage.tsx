import React, { useState } from 'react'
import {
  ChevronLeft,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Tag,
  Truck,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  ArrowRight,
  MapPin,
  Clock,
  X,
  Check,
} from 'lucide-react'
import { CartItem, DeliveryAddress } from '@/types'
import { useToast } from '@/context/ToastContext'
import { StripeCardForm } from '@/components/StripeCardForm'
import { processStripePayment, StripeCardDetails } from '@/stripe/stripeClient'
import { DeliveryAddressModal } from '@/components/DeliveryAddressModal'

interface CartPageProps {
  isOpen: boolean
  items: CartItem[]
  onClose: () => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onClearCart: () => void
  onCheckoutSuccess?: (orderId: string, total: string) => void
  onContinueShopping?: () => void
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

export const CartPage: React.FC<CartPageProps> = ({
  isOpen,
  items,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckoutSuccess,
  onContinueShopping,
  userProfile,
  onCheckoutOrder,
}) => {
  // Global Toast Hook
  const { showToast } = useToast()

  const [promoCode, setPromoCode] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null)

  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card')
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [placedOrderId, setPlacedOrderId] = useState('')
  const [stripeCardDetails, setStripeCardDetails] = useState<StripeCardDetails>({
    cardNumber: '',
    cardholderName: userProfile?.name || '',
    expiry: '',
    cvc: '',
    postalCode: userProfile?.postalCode || '',
  })
  const [isCardValid, setIsCardValid] = useState(false)
  const [stripeReceiptInfo, setStripeReceiptInfo] = useState<{ id?: string; brand?: string; last4?: string } | null>(null)

  // Delivery Address Selection & Editing State
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

  if (!isOpen) return null

  // Financial calculations
  const totalItemsCount = items.reduce((acc, curr) => acc + curr.quantity, 0)
  const itemsSubtotal = items.reduce(
    (acc, curr) => acc + curr.product.priceNumeric * curr.quantity,
    0
  )
  const discountAmount = itemsSubtotal * discountPercent
  const freeShippingThreshold = 50
  const isFreeShipping = itemsSubtotal >= freeShippingThreshold || items.length === 0
  const shippingFee = isFreeShipping ? 0 : 5.99
  const taxableAmount = Math.max(0, itemsSubtotal - discountAmount)
  const taxFee = taxableAmount * 0.05
  const grandTotal = Math.max(0, taxableAmount + shippingFee + taxFee).toFixed(2)

  const progressPercentage = Math.min(
    100,
    Math.round((itemsSubtotal / freeShippingThreshold) * 100)
  )

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault()
    setPromoError(null)
    setPromoSuccess(null)

    const cleaned = promoCode.trim().toUpperCase()
    if (!cleaned) {
      setPromoError('Please enter a coupon code')
      showToast('Please enter a coupon code', 'warning')
      return
    }

    if (cleaned === 'BENTLEY10' || cleaned === 'VIP10') {
      setDiscountPercent(0.1)
      setPromoSuccess('Promo code "BENTLEY10" applied: 10% OFF!')
      showToast('Promo code BENTLEY10 applied! 10% saved.', 'success')
    } else if (cleaned === 'BENTLEY20') {
      setDiscountPercent(0.2)
      setPromoSuccess('Promo code "BENTLEY20" applied: 20% OFF!')
      showToast('Promo code BENTLEY20 applied! $15 saved.', 'success')
    } else if (cleaned === 'FREESHIP') {
      setDiscountPercent(0.05)
      setPromoSuccess('Special 5% loyalty coupon applied!')
      showToast('Special 5% loyalty coupon applied!', 'success')
    } else {
      setPromoError('Invalid coupon code. Try "BENTLEY10"')
      showToast('Invalid or expired promo code.', 'error')
    }
  }

  const handleConfirmOrder = async () => {
    let stripeTx: any = null

    if (paymentMethod === 'card') {
      if (!isCardValid) {
        showToast('Please enter complete & valid card details for Stripe payment.', 'error')
        return
      }

      setIsProcessing(true)
      try {
        const stripeRes = await processStripePayment(
          parseFloat(grandTotal),
          'cad',
          stripeCardDetails,
          {
            orderType: 'cart_checkout',
            customerName: userProfile?.name || 'Customer',
            customerEmail: userProfile?.email || '',
          }
        )

        if (!stripeRes.success) {
          setIsProcessing(false)
          showToast(stripeRes.error || 'Stripe card payment failed.', 'error')
          return
        }

        stripeTx = stripeRes
        setStripeReceiptInfo({
          id: stripeRes.paymentIntentId,
          brand: stripeRes.cardBrand,
          last4: stripeRes.last4,
        })
      } catch (err: any) {
        setIsProcessing(false)
        showToast(err?.message || 'Payment processing error.', 'error')
        return
      }
    } else {
      setIsProcessing(true)
    }

    const fallbackId = `#BCW-${Math.floor(10000 + Math.random() * 90000)}`

    try {
      let finalOrderId = fallbackId
      if (onCheckoutOrder) {
        const orderData = {
          items,
          itemsSubtotal,
          discountAmount,
          shippingFee,
          taxFee,
          grandTotal,
          paymentMethod:
            paymentMethod === 'card'
              ? `Stripe Card (•••• ${stripeTx?.last4 || stripeCardDetails.cardNumber.slice(-4) || '4242'})`
              : 'Cash / COD',
          paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
          stripePaymentId: stripeTx?.paymentIntentId,
          cardBrand: stripeTx?.cardBrand,
          cardLast4: stripeTx?.last4,
          shippingAddress: `${selectedAddress.streetAddress}, ${selectedAddress.city} ${selectedAddress.postalCode}`,
          deliveryNotes: selectedAddress.deliveryNotes || '',
          customerName: selectedAddress.recipientName || userProfile?.name || 'Customer',
          customerEmail: userProfile?.email || '',
          customerPhone: selectedAddress.phone || userProfile?.phone || '',
          createdAt: new Date().toISOString(),
        }
        finalOrderId = await onCheckoutOrder(orderData)
      } else {
        await new Promise((r) => setTimeout(r, 600))
      }

      setPlacedOrderId(finalOrderId)
      setIsProcessing(false)
      setOrderComplete(true)
      showToast(`Order ${finalOrderId} placed successfully!`, 'success')
      if (onCheckoutSuccess) {
        onCheckoutSuccess(finalOrderId, grandTotal)
      }
    } catch (e) {
      setIsProcessing(false)
      showToast('Failed to place order. Please try again.', 'error')
    }
  }

  const handleFinishCheckout = () => {
    onClearCart()
    setShowCheckoutModal(false)
    setOrderComplete(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto animate-in slide-in-from-bottom duration-200">
      <div className="w-full max-w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto min-h-screen flex flex-col bg-white pb-36">
        {/* 1. TOP HEADER */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-4 sm:px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-surface-alt active:scale-95 transition-all cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-gray-900 tracking-tight">
              My Shopping Cart
            </h1>
            {totalItemsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary-light text-primary text-[11px] font-bold border border-primary/20">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>

          {items.length > 0 ? (
            <button
              onClick={onClearCart}
              className="text-xs font-semibold text-gray-400 hover:text-primary transition-colors cursor-pointer"
              title="Clear Cart"
            >
              Clear
            </button>
          ) : (
            <div className="w-9" />
          )}
        </header>

        {/* 2. BODY CONTENT */}
        {items.length === 0 ? (
          /* EMPTY CART STATE */
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center animate-in fade-in duration-300">
            <div className="w-20 h-20 rounded-3xl bg-surface-alt border border-gray-200/80 flex items-center justify-center text-gray-400 shadow-sm mb-4">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
              Your Cart is Empty
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5 max-w-xs leading-relaxed">
              Explore official Bentley detailing chemicals, ceramic sprays, and merchandise to keep your vehicle in pristine condition.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose()
                if (onContinueShopping) onContinueShopping()
              }}
              className="mt-6 px-6 py-3 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground text-xs sm:text-sm font-bold shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Explore Bentley Shop</span>
              <ArrowRight className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        ) : (
          /* POPULATED CART */
          <div className="p-4 sm:p-5 flex flex-col gap-4">
            {/* Delivery Destination Pill */}
            <div
              onClick={() => setIsAddressModalOpen(true)}
              className="bg-surface-alt rounded-2xl p-3 border border-gray-200/80 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-primary shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="truncate">
                  <span className="text-[11px] font-bold text-gray-800 block truncate">
                    Delivering to {selectedAddress.streetAddress}, {selectedAddress.city}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Hand-delivered by your service technician • Tap to change
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0 ml-2">
                Change
              </span>
            </div>

            {/* Free Shipping Progress Indicator */}
            <div className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-xs flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                  <Truck className="w-4 h-4 text-primary" />
                  <span>
                    {isFreeShipping ? (
                      <strong className="text-emerald-600">
                        Unlocked FREE Express Delivery!
                      </strong>
                    ) : (
                      <>
                        Add{' '}
                        <strong className="text-primary font-mono">
                          ${(freeShippingThreshold - itemsSubtotal).toFixed(2)}
                        </strong>{' '}
                        more for FREE delivery
                      </>
                    )}
                  </span>
                </div>
                <span className="text-[11px] font-bold font-mono text-gray-500">
                  {progressPercentage}%
                </span>
              </div>
              {/* Progress Track */}
              <div className="w-full h-2 rounded-full bg-surface-alt overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex flex-col gap-3">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
                Cart Items ({totalItemsCount})
              </h2>

              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-white rounded-2xl border border-gray-200 p-3 shadow-xs flex gap-3 items-center hover:shadow-sm transition-shadow"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-center p-1.5 shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                          {item.product.title}
                        </h3>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                          {item.product.volume || item.product.category}
                        </p>
                      </div>

                      {/* Delete item button */}
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-gray-400 hover:text-primary transition-colors p-1 -mr-1 cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Price & Quantity Stepper */}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs sm:text-sm font-extrabold text-primary font-mono">
                        ${(item.product.priceNumeric * item.quantity).toFixed(2)}
                      </span>

                      {/* Stepper */}
                      <div className="flex items-center gap-1.5 bg-surface-alt rounded-xl p-1 border border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity > 1) {
                              onUpdateQuantity(item.product.id, item.quantity - 1)
                            } else {
                              onRemoveItem(item.product.id)
                            }
                          }}
                          className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity < 15) {
                              onUpdateQuantity(item.product.id, item.quantity + 1)
                            }
                          }}
                          className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Promo Code Input */}
            <div className="bg-surface-alt rounded-2xl p-3 border border-gray-200/80">
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Coupon code (e.g. BENTLEY10)"
                    className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-3 text-xs uppercase font-semibold text-gray-800 placeholder:normal-case placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary-hover text-secondary-foreground text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  Apply
                </button>
              </form>

              {promoSuccess && (
                <p className="text-[11px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  {promoSuccess}
                </p>
              )}
              {promoError && (
                <p className="text-[11px] text-primary font-semibold mt-2">
                  {promoError}
                </p>
              )}
            </div>

            {/* Order Cost Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col gap-2 text-xs">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
                Order Summary
              </h3>
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal</span>
                <span className="font-mono font-semibold">${itemsSubtotal.toFixed(2)}</span>
              </div>

              {discountPercent > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Promo Discount ({(discountPercent * 100).toFixed(0)}%)</span>
                  <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Technician Dispatch Delivery</span>
                <span className="font-semibold text-emerald-600">
                  {shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}
                </span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Estimated Taxes (5%)</span>
                <span className="font-mono">${taxFee.toFixed(2)}</span>
              </div>

              <div className="pt-2.5 mt-1 border-t border-gray-200 flex justify-between font-extrabold text-sm sm:text-base text-gray-900">
                <span>Total Amount</span>
                <span className="text-primary font-mono text-base sm:text-lg">
                  ${grandTotal}
                </span>
              </div>
            </div>

            {/* Quality & Return Guarantee */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 font-medium py-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Official Bentley Certified Products • 30-Day Guarantee</span>
            </div>
          </div>
        )}

        {/* 3. STICKY BOTTOM CHECKOUT BAR */}
        {items.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-4 sm:px-5 py-3 shadow-lg">
            <div className="w-full max-w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Total Payment
                </span>
                <span className="text-xl font-extrabold text-primary font-mono leading-tight">
                  ${grandTotal}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowCheckoutModal(true)}
                className="flex-1 py-3.5 px-5 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground text-xs sm:text-sm font-extrabold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. CHECKOUT MODAL OVERLAY */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 animate-in slide-in-from-bottom duration-200 max-h-[90vh] overflow-y-auto">
            {!orderComplete ? (
              <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-gray-900">
                      Confirm &amp; Place Order
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-light px-2 py-0.5 rounded-full">
                      Cart Checkout
                    </span>
                  </div>
                  <button
                    onClick={() => setShowCheckoutModal(false)}
                    className="w-8 h-8 rounded-full bg-surface-alt hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Items Summary Strip */}
                <div className="flex flex-col gap-2 bg-surface-alt p-3 rounded-2xl border border-gray-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
                    Selected Items ({totalItemsCount})
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                    {items.map((item) => (
                      <div
                        key={item.product.id}
                        className="relative w-12 h-12 rounded-xl bg-white border border-gray-200 p-1 shrink-0 flex items-center justify-center"
                        title={item.product.title}
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.title}
                          className="w-full h-full object-contain"
                        />
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary text-secondary-foreground text-[9px] font-bold flex items-center justify-center shadow-xs">
                          {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Location */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700">
                      Delivery Address
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

                {/* Payment Option */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700 block mb-1.5">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        paymentMethod === 'card'
                          ? 'border-primary bg-primary-light text-primary'
                          : 'border-gray-200 bg-surface-alt text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span className="text-xs font-bold">Credit / Debit Card</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        paymentMethod === 'cod'
                          ? 'border-primary bg-primary-light text-primary'
                          : 'border-gray-200 bg-surface-alt text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="text-xs font-bold">Cash / COD</span>
                      <span className="text-[10px] text-gray-500">On Delivery</span>
                    </button>
                  </div>

                  {/* Embedded Stripe Card Form */}
                  {paymentMethod === 'card' && (
                    <div className="mt-2.5 animate-in fade-in duration-200">
                      <StripeCardForm
                        onChange={(details, isValid) => {
                          setStripeCardDetails(details)
                          setIsCardValid(isValid)
                        }}
                        disabled={isProcessing}
                        initialName={userProfile?.name || ''}
                        initialPostal={userProfile?.postalCode || ''}
                      />
                    </div>
                  )}
                </div>

                {/* Payment Total Callout */}
                <div className="bg-surface-alt p-3 rounded-2xl border border-gray-200 flex justify-between items-center text-xs">
                  <span className="text-gray-600 font-medium">Final Chargeable Total</span>
                  <span className="text-base font-extrabold text-primary font-mono">
                    ${grandTotal}
                  </span>
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
                      <span>Authorizing Payment...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Pay ${grandTotal} &amp; Complete</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* ORDER CELEBRATION VIEW */
              <div className="flex flex-col items-center text-center py-4 gap-3 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-400 flex items-center justify-center text-emerald-600 shadow-sm animate-bounce">
                  <CheckCircle2 className="w-9 h-9 text-emerald-600" />
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">
                    Order Confirmed!
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">
                    Your cart items have been booked. A Bentley detailing technician will deliver them to your address!
                  </p>
                </div>

                <div className="w-full bg-surface-alt rounded-2xl p-3 border border-gray-200 text-left flex flex-col gap-1.5 text-xs mt-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order ID:</span>
                    <span className="font-mono font-bold text-gray-900">{placedOrderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Items Ordered:</span>
                    <span className="font-semibold text-gray-900">
                      {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount Paid:</span>
                    <span className="font-mono font-bold text-primary">
                      ${grandTotal}
                    </span>
                  </div>
                  {stripeReceiptInfo?.id && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Stripe Payment:</span>
                      <span className="font-mono font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Paid ({stripeReceiptInfo.brand || 'Card'} •••• {stripeReceiptInfo.last4 || '4242'})
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery Status:</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Dispatched with next service
                    </span>
                  </div>
                </div>

                <div className="w-full flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleFinishCheckout}
                    className="w-full py-3 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    Done &amp; Return to Home
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
export default CartPage
