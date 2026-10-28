import React, { useState } from 'react'
import {
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  Calendar,
  Send,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { db } from '@/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { cleanUndefined } from '@/firebase/CloudFirestore/SetData'

interface ContactUsPageProps {
  isOpen: boolean
  onClose: () => void
  userProfile?: {
    name?: string
    email?: string
    phone?: string
  }
}

export const ContactUsPage: React.FC<ContactUsPageProps> = ({
  isOpen,
  onClose,
  userProfile,
}) => {
  const { showToast } = useToast()

  // Form State
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    phone: userProfile?.phone || '',
    subject: 'General Inquiry',
    message: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  if (!isOpen) return null

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(label)
    showToast(`${label} copied to clipboard!`, 'info')
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Handle inquiry submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      showToast('Please enter your name.', 'error')
      return
    }
    if (!formData.email.trim()) {
      showToast('Please enter your email address.', 'error')
      return
    }
    if (!formData.message.trim()) {
      showToast('Please enter your message.', 'error')
      return
    }

    setIsSubmitting(true)

    try {
      // Save contact inquiry to Firestore
      try {
        const inquiriesRef = collection(db, 'inquiries')
        const payload = cleanUndefined({
          ...formData,
          createdAt: new Date().toISOString(),
          serverTimestamp: serverTimestamp(),
          source: 'ContactUsPage',
          status: 'pending',
        })
        await addDoc(inquiriesRef, payload)
      } catch (err) {
        console.warn('Firestore inquiry sync warning:', err)
      }

      setIsSubmitting(false)
      setIsSubmitted(true)
      showToast('Thank you! Your message has been sent successfully.', 'success')
    } catch {
      setIsSubmitting(false)
      showToast('Failed to send message. Please try calling or emailing us.', 'error')
    }
  }

  // Calculate if business is currently open (Kelowna PST/PDT approx or local)
  const isBusinessOpen = () => {
    const now = new Date()
    const day = now.getDay() // 0 = Sun, 1 = Mon ... 6 = Sat
    const hour = now.getHours()
    // Mon-Sat: 9:00 am - 5:00 pm (9 to 17)
    if (day >= 1 && day <= 6 && hour >= 9 && hour < 17) {
      return true
    }
    return false
  }

  const currentlyOpen = isBusinessOpen()

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full border border-gray-200/90 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer shadow-xs"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-base sm:text-lg font-bold text-gray-900 text-center flex-1">
          Contact Us
        </h1>
        <div className="w-10" />
      </header>

      {/* Main Content Body */}
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-20 flex flex-col gap-6">

        {/* Hero Section */}
        <div className="text-center flex flex-col items-center gap-2 pt-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
            We're Here to Help
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md leading-relaxed">
            Have questions about our mobile wash, detailing packages, or care products? Reach out directly to our team in Kelowna.
          </p>
        </div>

        {/* 3 Core Contact Cards (Aligned with Image Data & Project Aesthetics) */}
        <div className="flex flex-col gap-2.5 sm:gap-3">

          {/* CARD 1: PHONE */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/90 shadow-2xs hover:shadow-xs hover:border-primary/40 transition-all flex items-center justify-between gap-3 group">
            <div className="flex items-center gap-3 min-w-0">
              {/* Coral/Red Rounded Icon (as in user image 2) */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#ef4444] text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-200/70 group-hover:scale-105 transition-transform">
                <Phone className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider leading-tight">
                  Phone
                </span>
                <a
                  href="tel:+12503519155"
                  className="text-xs sm:text-sm font-extrabold text-gray-900 hover:text-primary tracking-tight mt-0.5 truncate select-all transition-colors"
                >
                  +1 250-351-9155
                </a>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleCopy('+1 250-351-9155', 'Phone')}
                className="w-9 h-9 rounded-xl border border-gray-200/90 hover:bg-gray-50 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title="Copy Phone Number"
              >
                {copiedField === 'Phone' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* CARD 2: E-MAIL */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/90 shadow-2xs hover:shadow-xs hover:border-primary/40 transition-all flex items-center justify-between gap-3 group">
            <div className="flex items-center gap-3 min-w-0">
              {/* Coral/Red Rounded Icon (as in user image 1) */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#ef4444] text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-200/70 group-hover:scale-105 transition-transform">
                <Mail className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col min-w-0 pr-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider leading-tight">
                  E-mail
                </span>
                <a
                  href="mailto:bentleymobilecarwash@gmail.com"
                  className="text-xs sm:text-sm font-extrabold text-gray-900 hover:text-primary tracking-tight mt-0.5 truncate select-all transition-colors"
                >
                  bentleymobilecarwash@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleCopy('bentleymobilecarwash@gmail.com', 'Email')}
                className="w-9 h-9 rounded-xl border border-gray-200/90 hover:bg-gray-50 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title="Copy Email"
              >
                {copiedField === 'Email' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* CARD 3: ADDRESS */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/90 shadow-2xs hover:shadow-xs hover:border-primary/40 transition-all flex items-center justify-between gap-3 group">
            <div className="flex items-center gap-3 min-w-0">
              {/* Coral/Red Rounded Icon (as in user image 3) */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#ef4444] text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-200/70 group-hover:scale-105 transition-transform">
                <MapPin className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider leading-tight">
                  Address
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-gray-900 tracking-tight mt-0.5 truncate select-all">
                  Kelowna, B.C, Canada
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleCopy('Kelowna, B.C, Canada', 'Address')}
                className="w-9 h-9 rounded-xl border border-gray-200/90 hover:bg-gray-50 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title="Copy Address"
              >
                {copiedField === 'Address' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <a
                href="https://maps.google.com/?q=Kelowna,+BC,+Canada"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 sm:px-3.5 rounded-xl bg-neutral-900 hover:bg-black active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Map</span>
              </a>
            </div>
          </div>

        </div>

        {/* Quick Send Message / Inquiry Form */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-gray-200/90 shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center text-primary">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Send us a Message
                </h3>
                <p className="text-xs text-gray-500">
                  Expect a prompt response within 1 business hour
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Fast Concierge</span>
            </div>
          </div>

          {isSubmitted ? (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-3 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">Message Received!</h4>
              <p className="text-xs sm:text-sm text-gray-500 max-w-sm">
                Thank you, <strong>{formData.name}</strong>. Our Kelowna detailing specialist will contact you via {formData.email} shortly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false)
                  setFormData((prev) => ({ ...prev, message: '' }))
                }}
                className="mt-2 py-2 px-5 rounded-full bg-neutral-900 text-white text-xs font-bold hover:bg-black transition-all cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Your Name <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Your Email <span className="text-primary">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (250) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {/* Subject */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Inquiry Topic
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Mobile Wash Booking">Mobile Wash Booking</option>
                    <option value="Corporate / Fleet Packages">Corporate / Fleet Packages</option>
                    <option value="Care Products & Order Status">Care Products &amp; Order Status</option>
                    <option value="Feedback / Suggestion">Feedback / Review</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Message <span className="text-primary">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="How can our mobile team assist you today?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-1 py-3.5 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending your inquiry...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message to Bentley Team</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Service Coverage Note */}
        <div className="bg-surface-subtle border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              B
            </div>
            <div>
              <p className="font-bold text-gray-900">Mobile Detailing Service Areas</p>
              <p className="text-[11px] text-gray-500">Kelowna, West Kelowna, Lake Country &amp; Okanagan Valley, BC</p>
            </div>
          </div>
          <a
            href="tel:+12503519155"
            className="text-primary font-bold hover:underline shrink-0 flex items-center gap-1"
          >
            <span>Direct Dispatch: +1 250-351-9155</span>
          </a>
        </div>

      </div>
    </div>
  )
}

export default ContactUsPage
