import React, { useState, useEffect } from 'react'
import { CreditCard, Lock, ShieldCheck, Check, Sparkles } from 'lucide-react'
import { StripeCardDetails, detectCardBrand } from '@/stripe/stripeClient'

interface StripeCardFormProps {
  onChange: (details: StripeCardDetails, isValid: boolean) => void
  disabled?: boolean
  initialName?: string
  initialPostal?: string
}

export const StripeCardForm: React.FC<StripeCardFormProps> = ({
  onChange,
  disabled = false,
  initialName = '',
  initialPostal = '',
}) => {
  const [cardNumber, setCardNumber] = useState('')
  const [cardholderName, setCardholderName] = useState(initialName)
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')

  // Card formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 16) val = val.slice(0, 16)
    // Add space every 4 digits
    const formatted = val.match(/.{1,4}/g)?.join(' ') || val
    setCardNumber(formatted)
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 4) val = val.slice(0, 4)
    if (val.length >= 2) {
      val = val.slice(0, 2) + '/' + val.slice(2)
    }
    setExpiry(val)
  }

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 4) val = val.slice(0, 4)
    setCvc(val)
  }

  // Quick fill test card
  const handleFillTestCard = () => {
    setCardNumber('4242 4242 4242 4242')
    setCardholderName(cardholderName || 'John Bentley')
    setExpiry('12/28')
    setCvc('123')
  }

  const brand = detectCardBrand(cardNumber)

  // Validation
  const rawNumber = cardNumber.replace(/\s+/g, '')
  const isValid =
    rawNumber.length >= 15 &&
    expiry.length === 5 &&
    cvc.length >= 3 &&
    cardholderName.trim().length >= 2

  useEffect(() => {
    onChange(
      {
        cardNumber,
        cardholderName,
        expiry,
        cvc,
        postalCode: initialPostal,
      },
      isValid
    )
  }, [cardNumber, cardholderName, expiry, cvc, initialPostal, isValid])

  return (
    <div className="w-full flex flex-col gap-3 p-3.5 sm:p-4 rounded-2xl bg-surface-alt border border-primary/20 shadow-xs animate-in fade-in duration-200">
      {/* Stripe Header with Security Badge */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200/80">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-xs tracking-tight text-[#635BFF] flex items-center gap-1">
            <CreditCard className="w-4 h-4 text-[#635BFF]" />
            stripe
          </span>
          <span className="text-[10px] text-gray-500 font-medium">Secured Checkout</span>
        </div>

        <button
          type="button"
          onClick={handleFillTestCard}
          className="text-[10px] font-bold text-primary hover:text-primary-hover flex items-center gap-1 bg-primary-light px-2 py-0.5 rounded-md cursor-pointer transition-colors"
          title="Autofill standard Stripe 4242 test card"
        >
          <Sparkles className="w-3 h-3 text-primary" />
          <span>Fill Test Card</span>
        </button>
      </div>

      {/* Cardholder Name */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
          Cardholder Full Name
        </label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="e.g. Johnathan Bentley"
          disabled={disabled}
          className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
        />
      </div>

      {/* Card Number with Brand Badge */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
            Card Number
          </label>
          <span className="text-[10px] font-bold text-gray-700 bg-white border border-gray-200 px-1.5 py-0.2 rounded font-mono">
            {brand}
          </span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={cardNumber}
            onChange={handleCardNumberChange}
            placeholder="4242 •••• •••• 4242"
            disabled={disabled}
            className="w-full pl-3 pr-9 py-2 rounded-xl bg-white border border-gray-200 text-xs font-mono font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Expiration and CVC */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
            Expires
          </label>
          <input
            type="text"
            value={expiry}
            onChange={handleExpiryChange}
            placeholder="MM/YY"
            disabled={disabled}
            className="w-full px-2.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-mono font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-center"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
            CVC
          </label>
          <input
            type="password"
            value={cvc}
            onChange={handleCvcChange}
            placeholder="•••"
            disabled={disabled}
            maxLength={4}
            className="w-full px-2.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-mono font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-center"
          />
        </div>
      </div>

      {/* Security Endorsement */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
        <div className="flex items-center gap-1 text-emerald-600 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>256-bit SSL encrypted payment</span>
        </div>
        {isValid && (
          <div className="flex items-center gap-1 text-emerald-600 font-bold">
            <Check className="w-3 h-3 stroke-[3]" />
            <span>Card Ready</span>
          </div>
        )}
      </div>
    </div>
  )
}
export default StripeCardForm
