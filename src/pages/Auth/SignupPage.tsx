import React, { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import logoBentley from '@/assets/Logo_Bentley.png'
import { useToast } from '@/context/ToastContext'
import { isAdminEmail } from '@/context/AuthContext'
import { auth, db } from '@/firebase'
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'

export interface SignupProps {
  onSignupSuccess: (user: { name: string; email: string; uid?: string; role?: 'customer' | 'admin' }) => void
  onSwitchToLogin?: () => void
  onRoleChange?: (role: 'customer' | 'admin') => void
  initialRole?: 'customer' | 'admin'
}

export const Signup: React.FC<SignupProps> = ({
  onSignupSuccess,
  onSwitchToLogin,
}) => {
  const { showToast } = useToast()

  // Signup Form States
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Loading state
  const [loading, setLoading] = useState(false)

  // Field errors state
  const [errors, setErrors] = useState<{
    fullName?: string
    phone?: string
    email?: string
    password?: string
    confirmPassword?: string
  }>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/
    return emailRegex.test(email.trim())
  }

  const isValidPhone = (input: string): boolean => {
    const cleaned = input.replace(/\D/g, '')
    return cleaned.length >= 10
  }

  const handleSignupSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    const newTouched: Record<string, boolean> = {
      fullName: true,
      phone: true,
      email: true,
      password: true,
      confirmPassword: true,
    }
    setTouched(newTouched)

    const newErrors: Record<string, string> = {}

    if (!fullName.trim()) {
      newErrors.fullName = 'Please enter your full name'
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters'
    }

    if (!phone.trim()) {
      newErrors.phone = 'Please enter your phone number'
    } else if (!isValidPhone(phone)) {
      newErrors.phone = 'Please enter a valid phone number (at least 10 digits)'
    }

    if (!signupEmail.trim()) {
      newErrors.email = 'Please enter your email address'
    } else if (!isValidEmail(signupEmail)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!signupPassword) {
      newErrors.password = 'Please enter a password'
    } else if (signupPassword.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (signupPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)

    const firstErrorMessage =
      newErrors.fullName ||
      newErrors.phone ||
      newErrors.email ||
      newErrors.password ||
      newErrors.confirmPassword

    if (firstErrorMessage) {
      showToast(firstErrorMessage, 'error')
      return
    }

    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        signupEmail.trim(),
        signupPassword
      )
      const user = userCredential.user

      await updateProfile(user, {
        displayName: fullName.trim(),
      })

      const rawUserPayload: Record<string, any> = {
        uid: user.uid,
        Name: fullName.trim(),
        name: fullName.trim(),
        fullName: fullName.trim(),
        email: user.email || signupEmail.trim(),
        phone: phone.trim(),
        role: 'customer',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await setDoc(doc(db, 'users', user.uid), rawUserPayload)

      try {
        localStorage.setItem('bentley_current_role', 'customer')
      } catch {}

      showToast('Account created successfully! Welcome to Bentley Car Wash.', 'success')

      onSignupSuccess({
        name: fullName.trim(),
        email: user.email || signupEmail.trim(),
        uid: user.uid,
        role: 'customer',
      })
    } catch (err: any) {
      console.error('Firebase Signup Error:', err)
      if (err.code === 'auth/email-already-in-use') {
        const errorMsg = 'An account with this email already exists. Please log in instead.'
        setErrors((prev) => ({ ...prev, email: 'Email is already registered' }))
        showToast(errorMsg, 'error')
      } else if (err.code === 'auth/invalid-email') {
        const errorMsg = 'Invalid email address format. Please check your email.'
        setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }))
        showToast(errorMsg, 'error')
      } else if (err.code === 'auth/weak-password') {
        const errorMsg = 'Password is too weak. Please use at least 6 characters.'
        setErrors((prev) => ({ ...prev, password: 'Password must be at least 6 characters' }))
        showToast(errorMsg, 'error')
      } else if (err.code === 'auth/network-request-failed') {
        showToast('Network error. Please check your internet connection.', 'error')
      } else {
        showToast(err.message || 'Failed to create account. Please try again.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[var(--bg-app)] flex flex-col items-center justify-center screen-padding py-6 sm:py-8 md:py-12">
      <div className="w-full max-w-[420px] sm:max-w-[440px] md:max-w-[480px] flex flex-col items-center">
        {/* Top Section with Mascot Logo */}
        <div className="flex flex-col items-center w-full">
          <div className="w-24 h-16 min-[380px]:w-28 min-[380px]:h-20 sm:w-32 sm:h-24 md:w-36 md:h-28 flex items-center justify-center mb-2 sm:mb-3">
            <img
              src={logoBentley}
              alt="Bentley Mobile Auto Detail Car Wash"
              className="w-full h-full object-contain filter drop-shadow-sm"
            />
          </div>

          {/* Form Header */}
          <div className="w-full flex flex-col items-center animate-in fade-in duration-200">
            <h1 className="text-xl min-[380px]:text-2xl sm:text-[26px] md:text-3xl font-extrabold text-[var(--text-main)] text-center tracking-tight">
              Create an Account
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-[var(--text-muted)] font-normal text-center mt-1 sm:mt-1.5 mb-3 sm:mb-5">
              Join Bentley for fast, premium mobile detailing.
            </p>

            {/* Signup Form */}
            <form onSubmit={handleSignupSubmit} noValidate className="w-full flex flex-col gap-3 sm:gap-3.5">
              {/* Full Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-[var(--text-main)]">
                  Full Name<span className="text-[var(--primary)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    const val = e.target.value
                    setFullName(val)
                    if (val.trim()) {
                      setErrors((prev) => ({ ...prev, fullName: undefined }))
                    } else if (touched.fullName) {
                      setErrors((prev) => ({ ...prev, fullName: 'Please enter your full name' }))
                    }
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, fullName: true }))
                    if (!fullName.trim()) {
                      setErrors((prev) => ({ ...prev, fullName: 'Please enter your full name' }))
                    } else {
                      setErrors((prev) => ({ ...prev, fullName: undefined }))
                    }
                  }}
                  placeholder="Enter full name"
                  className={`w-full px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-[var(--radius-input)] border text-sm text-[var(--text-main)] bg-[var(--bg-app)] placeholder-[var(--text-light)] focus:outline-none transition-colors ${
                    errors.fullName
                      ? 'border-[var(--primary)] focus:border-[var(--primary)]'
                      : 'border-[var(--border-light)] focus:border-[var(--primary)]'
                  }`}
                />
                {errors.fullName && (
                  <p className="text-xs text-[var(--primary)] font-normal mt-0.5 animate-in fade-in duration-150">
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-[var(--text-main)]">
                  Phone Number<span className="text-[var(--primary)]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value
                    setPhone(val)
                    if (val.trim()) {
                      if (!isValidPhone(val)) {
                        setErrors((prev) => ({
                          ...prev,
                          phone: 'Please enter a valid phone number (at least 10 digits)',
                        }))
                      } else {
                        setErrors((prev) => ({ ...prev, phone: undefined }))
                      }
                    } else if (touched.phone) {
                      setErrors((prev) => ({
                        ...prev,
                        phone: 'Please enter your phone number',
                      }))
                    }
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, phone: true }))
                    if (!phone.trim()) {
                      setErrors((prev) => ({
                        ...prev,
                        phone: 'Please enter your phone number',
                      }))
                    } else if (!isValidPhone(phone)) {
                      setErrors((prev) => ({
                        ...prev,
                        phone: 'Please enter a valid phone number (at least 10 digits)',
                      }))
                    } else {
                      setErrors((prev) => ({ ...prev, phone: undefined }))
                    }
                  }}
                  placeholder="(250) 000-0000"
                  className={`w-full px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-[var(--radius-input)] border text-sm text-[var(--text-main)] bg-[var(--bg-app)] placeholder-[var(--text-light)] focus:outline-none transition-colors ${
                    errors.phone
                      ? 'border-[var(--primary)] focus:border-[var(--primary)]'
                      : 'border-[var(--border-light)] focus:border-[var(--primary)]'
                  }`}
                />
                {errors.phone && (
                  <p className="text-xs text-[var(--primary)] font-normal mt-0.5 animate-in fade-in duration-150">
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-[var(--text-main)]">
                  Email Address<span className="text-[var(--primary)]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => {
                    const val = e.target.value
                    setSignupEmail(val)
                    if (val.trim()) {
                      if (!isValidEmail(val)) {
                        setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }))
                      } else {
                        setErrors((prev) => ({ ...prev, email: undefined }))
                      }
                    } else if (touched.email) {
                      setErrors((prev) => ({ ...prev, email: 'Please enter your email address' }))
                    }
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, email: true }))
                    if (!signupEmail.trim()) {
                      setErrors((prev) => ({ ...prev, email: 'Please enter your email address' }))
                    } else if (!isValidEmail(signupEmail)) {
                      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }))
                    } else {
                      setErrors((prev) => ({ ...prev, email: undefined }))
                    }
                  }}
                  placeholder="Enter your email"
                  className={`w-full px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-[var(--radius-input)] border text-sm text-[var(--text-main)] bg-[var(--bg-app)] placeholder-[var(--text-light)] focus:outline-none transition-colors ${
                    errors.email
                      ? 'border-[var(--primary)] focus:border-[var(--primary)]'
                      : 'border-[var(--border-light)] focus:border-[var(--primary)]'
                  }`}
                />
                {errors.email && (
                  <p className="text-xs text-[var(--primary)] font-normal mt-0.5 animate-in fade-in duration-150">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-[var(--text-main)]">
                  Password<span className="text-[var(--primary)]">*</span>
                </label>
                <div className="relative w-full">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    value={signupPassword}
                    onChange={(e) => {
                      const val = e.target.value
                      setSignupPassword(val)
                      if (val) {
                        if (val.length < 6) {
                          setErrors((prev) => ({ ...prev, password: 'Password must be at least 6 characters' }))
                        } else {
                          setErrors((prev) => ({ ...prev, password: undefined }))
                        }
                      }
                    }}
                    placeholder="At least 6 characters"
                    className={`w-full px-3.5 sm:px-4 py-2 sm:py-2.5 pr-11 rounded-[var(--radius-input)] border text-sm text-[var(--text-main)] bg-[var(--bg-app)] placeholder-[var(--text-light)] focus:outline-none transition-colors tracking-widest ${
                      errors.password
                        ? 'border-[var(--primary)] focus:border-[var(--primary)]'
                        : 'border-[var(--border-light)] focus:border-[var(--primary)]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-light)] hover:text-[var(--text-muted)] cursor-pointer p-1"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4 stroke-[1.8]" /> : <Eye className="w-4 h-4 stroke-[1.8]" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-[var(--primary)] font-normal mt-0.5 animate-in fade-in duration-150">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-[var(--text-main)]">
                  Confirm Password<span className="text-[var(--primary)]">*</span>
                </label>
                <div className="relative w-full">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      const val = e.target.value
                      setConfirmPassword(val)
                      if (val && signupPassword && val !== signupPassword) {
                        setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }))
                      } else {
                        setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                      }
                    }}
                    placeholder="Re-enter password"
                    className={`w-full px-3.5 sm:px-4 py-2 sm:py-2.5 pr-11 rounded-[var(--radius-input)] border text-sm text-[var(--text-main)] bg-[var(--bg-app)] placeholder-[var(--text-light)] focus:outline-none transition-colors tracking-widest ${
                      errors.confirmPassword
                        ? 'border-[var(--primary)] focus:border-[var(--primary)]'
                        : 'border-[var(--border-light)] focus:border-[var(--primary)]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-light)] hover:text-[var(--text-muted)] cursor-pointer p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4 stroke-[1.8]" /> : <Eye className="w-4 h-4 stroke-[1.8]" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-[var(--primary)] font-normal mt-0.5 animate-in fade-in duration-150">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Red Sign Up Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 sm:mt-3 py-3 sm:py-3.5 rounded-[var(--radius-btn)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] text-sm sm:text-base font-bold shadow-sm active:scale-[0.99] transition-all cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? 'Creating account...' : 'Create Account'}</span>
              </button>
            </form>

            {/* Bottom Switch Link */}
            {onSwitchToLogin && (
              <div className="mt-4 sm:mt-5 text-xs sm:text-sm text-[var(--text-main)] text-center font-medium">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => onSwitchToLogin()}
                  className="text-[var(--primary)] font-bold hover:underline cursor-pointer ml-0.5"
                >
                  Log in
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const SignupScreen = Signup
export const SignupPage = Signup
