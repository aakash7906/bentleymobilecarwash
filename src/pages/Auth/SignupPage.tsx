import React, { useState } from 'react'
import { Eye, EyeOff, Loader2, Truck, Check } from 'lucide-react'
import logoBentley from '@/assets/Logo_Bentley.png'
import { useToast } from '@/context/ToastContext'
// STEP 1 INTEGRATION: Import Firebase auth and registration functions
import { auth, db } from '@/firebase'
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth'
// STEP 2 INTEGRATION: Import Firestore methods to create user documents
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'

export interface SignupProps {
  onSignupSuccess: (user: { name: string; email: string; uid?: string; role?: 'customer' | 'driver' }) => void
  onSwitchToLogin?: (role?: 'customer' | 'driver') => void
  initialRole?: 'customer' | 'driver'
}

export const Signup: React.FC<SignupProps> = ({
  onSignupSuccess,
  onSwitchToLogin,
  initialRole = 'customer',
}) => {
  // Global Toast Hook
  const { showToast } = useToast()
  // Role State (Customer vs Driver)
  const [selectedRole, setSelectedRole] = useState<'customer' | 'driver'>(initialRole)

  // Signup Form States
  const [fullName, setFullName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Driver-specific fields
  const [driverPhone, setDriverPhone] = useState('')
  const [driverVan, setDriverVan] = useState('')
  const [driverPlate, setDriverPlate] = useState('')

  // Loading state
  const [loading, setLoading] = useState(false)

  // Field errors state for inline warning below inputs
  const [errors, setErrors] = useState<{
    fullName?: string
    email?: string
    password?: string
    confirmPassword?: string
    driverPhone?: string
    driverVan?: string
    driverPlate?: string
  }>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // -------------------------------------------------------------
  // VALIDATION HELPER: RFC 5322 Standard Email Regex Pattern
  // Validates standard formats: name@domain.tld, disallows spaces & invalid chars
  // -------------------------------------------------------------
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/
    return emailRegex.test(email.trim())
  }

  // -------------------------------------------------------------
  // VALIDATION HELPER: Strict Password Criteria Checker
  // Requirements: Minimum 6 chars, at least 1 letter and at least 1 digit
  // -------------------------------------------------------------
  const validatePasswordStrength = (password: string): { isValid: boolean; message?: string } => {
    if (password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters' }
    }
    if (!/[A-Za-z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one letter' }
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' }
    }
    return { isValid: true }
  }

  // STEP 1 & 2 INTEGRATION: Real Firebase User Registration + Firestore Document Creation
  const handleSignupSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    const newTouched: Record<string, boolean> = {
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    }
    if (selectedRole === 'driver') {
      newTouched.driverPhone = true
      newTouched.driverVan = true
      newTouched.driverPlate = true
    }
    setTouched(newTouched)

    const newErrors: typeof errors = {}

    if (!fullName.trim()) {
      newErrors.fullName = 'Please enter your full name'
    }

    if (!signupEmail.trim()) {
      newErrors.email = 'Please enter your email address'
    } else if (!isValidEmail(signupEmail)) {
      newErrors.email = 'Please enter a valid email address'
    }

    const passwordValidation = validatePasswordStrength(signupPassword)
    if (!signupPassword) {
      newErrors.password = 'Please enter a password'
    } else if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (signupPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (selectedRole === 'driver') {
      if (!driverPhone.trim()) newErrors.driverPhone = 'Please enter phone number'
      if (!driverVan.trim()) newErrors.driverVan = 'Please enter van/unit ID'
      if (!driverPlate.trim()) newErrors.driverPlate = 'Please enter license plate'
    }

    setErrors(newErrors)

    // Trigger toast for the first error encountered
    const firstErrorMessage =
      newErrors.fullName ||
      newErrors.email ||
      newErrors.password ||
      newErrors.confirmPassword ||
      newErrors.driverPhone ||
      newErrors.driverVan ||
      newErrors.driverPlate

    if (firstErrorMessage) {
      showToast(firstErrorMessage, 'error')
      return
    }


    setLoading(true)

    try {
      // -------------------------------------------------------------
      // Step 2.1: Create user in Firebase Authentication (Step 1)
      // -------------------------------------------------------------
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        signupEmail.trim(),
        signupPassword
      )
      const user = userCredential.user

      // -------------------------------------------------------------
      // Step 2.2: Update Display Name in Firebase Auth Profile
      // -------------------------------------------------------------
      await updateProfile(user, {
        displayName: fullName.trim(),
      })

      // -------------------------------------------------------------
      // Step 2.3: Create User Profile Document in Firestore ('users' collection)
      // -------------------------------------------------------------
      const rawUserPayload: Record<string, any> = {
        uid: user.uid,
        Name: fullName.trim(),
        name: fullName.trim(),
        fullName: fullName.trim(),
        email: user.email || signupEmail.trim(),
        phone: driverPhone.trim() || '+1 (800) 555-9274',
        role: selectedRole,
        driverPhone: selectedRole === 'driver' ? driverPhone.trim() : undefined,
        driverVan: selectedRole === 'driver' ? driverVan.trim() : undefined,
        driverPlate: selectedRole === 'driver' ? driverPlate.trim() : undefined,
        driverDetails: selectedRole === 'driver' ? {
          vanNumber: driverVan.trim() || 'Van #04',
          licensePlate: driverPlate.trim() || 'BC-9042-DRV',
          vehicle: 'Ford Transit Mobile Detailing Unit',
          rating: 5.0,
          active: true,
        } : undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      // Filter out undefined fields because Firestore rejects undefined values
      const sanitizedUserPayload = Object.fromEntries(
        Object.entries(rawUserPayload).filter(([_, v]) => v !== undefined)
      )

      await setDoc(doc(db, 'users', user.uid), sanitizedUserPayload)

      // Show Success Toast Notification before triggering session redirect
      showToast('Account created successfully! Welcome to Bentley Car Wash.', 'success')

      // -------------------------------------------------------------
      // Step 2.4: Trigger App Success Callback to continue user session
      // -------------------------------------------------------------
      setTimeout(() => {
        onSignupSuccess({
          name: fullName.trim(),
          email: user.email || signupEmail,
          uid: user.uid,
          role: selectedRole,
        })
      }, 700)
    } catch (err: any) {
      console.error('Firebase Signup Error:', err)
      if (err.code === 'auth/email-already-in-use') {
        const errorMsg = 'This email is already registered. Please log in instead.'
        setErrors((prev) => ({ ...prev, email: errorMsg }))
        showToast(errorMsg, 'error')
      } else if (err.code === 'auth/invalid-email') {
        const errorMsg = 'Please enter a valid email address.'
        setErrors((prev) => ({ ...prev, email: errorMsg }))
        showToast(errorMsg, 'error')
      } else if (err.code === 'auth/weak-password') {
        const errorMsg = 'Password is too weak. Please include letters and numbers.'
        setErrors((prev) => ({ ...prev, password: errorMsg }))
        showToast(errorMsg, 'error')
      } else {
        showToast(err.message || 'Failed to create account. Please try again.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  // STEP 1 INTEGRATION: Google Sign-in for Signup screen
  const _handleGoogleSignUp = async () => {
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      // Ensure user document exists in Firestore
      const userDocRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userDocRef)
      if (!userDoc.exists()) {
        const rawGoogleData: Record<string, any> = {
          uid: user.uid,
          Name: user.displayName || 'Member',
          name: user.displayName || 'Google User',
          fullName: user.displayName || 'Google User',
          email: user.email || '',
          phone: '',
          role: selectedRole,
          driverPhone: selectedRole === 'driver' ? driverPhone.trim() : undefined,
          driverVan: selectedRole === 'driver' ? driverVan.trim() : undefined,
          driverPlate: selectedRole === 'driver' ? driverPlate.trim() : undefined,
          driverDetails: selectedRole === 'driver' ? {
            vanNumber: driverVan.trim() || 'Van #04',
            licensePlate: driverPlate.trim() || 'BC-9042-DRV',
            vehicle: 'Ford Transit Mobile Detailing Unit',
            rating: 5.0,
            active: true,
          } : undefined,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
        const sanitizedGoogleData = Object.fromEntries(
          Object.entries(rawGoogleData).filter(([_, v]) => v !== undefined)
        )
        await setDoc(userDocRef, sanitizedGoogleData, { merge: true })
      }

      showToast('Google registration successful! Welcome.', 'success')
      setTimeout(() => {
        onSignupSuccess({
          name: user.displayName || 'Google User',
          email: user.email || '',
          uid: user.uid,
          role: selectedRole,
        })
      }, 600)
    } catch (err: any) {
      console.error('Firebase Google Signup Error:', err)
      if (err.code !== 'auth/popup-closed-by-user') {
        showToast(err.message || 'Google sign-up failed. Please try again.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-app)] overflow-y-auto selection:bg-[var(--primary)] selection:text-[var(--primary-foreground)] flex justify-center items-center py-6 sm:py-10 px-4 sm:px-6">
      <div className="w-full max-w-[440px] sm:max-w-md md:max-w-lg lg:max-w-xl flex flex-col justify-between py-2 sm:py-6 bg-[var(--bg-app)] my-auto">

        {/* Top Section with Mascot Logo */}
        <div className="flex flex-col items-center w-full">
          {/* Bentley Mascot Logo */}
          <div className="w-28 h-20 min-[380px]:w-36 min-[380px]:h-24 sm:w-40 sm:h-28 md:w-44 md:h-32 flex items-center justify-center mb-3 sm:mb-4">
            <img
              src={logoBentley}
              alt="Bentley Mobile Auto Detail Car Wash"
              className="w-full h-full object-contain filter drop-shadow-sm"
            />
          </div>

          {/* Sign Up Mode */}
          <div className="w-full flex flex-col items-center animate-in fade-in duration-200">
            {/* Header Titles */}
            <h1 className="text-xl min-[380px]:text-2xl sm:text-[26px] md:text-3xl font-extrabold text-[var(--text-main)] text-center tracking-tight">
              {selectedRole === 'driver' ? 'Driver Partner Registration' : 'Create an Account'}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-[var(--text-muted)] font-normal text-center mt-1.5 mb-4 sm:mb-5">
              {selectedRole === 'driver'
                ? 'Register your mobile wash vehicle and start accepting customer jobs.'
                : 'Sign up now to get started with an account.'}
            </p>

            {/* Sign Up Form */}
            <form onSubmit={handleSignupSubmit} noValidate className="w-full flex flex-col gap-3 sm:gap-3.5 md:gap-4">
              {/* Full Name* */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm md:text-sm font-semibold text-[var(--text-main)]">
                  {selectedRole === 'driver' ? 'Driver Full Name' : 'Full Name'}<span className="text-[var(--primary)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    if (errors.fullName) {
                      setErrors((prev) => ({ ...prev, fullName: undefined }))
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
                  placeholder={selectedRole === 'driver' ? 'e.g. Alex Rivera' : 'Enter full name'}
                  className={`w-full px-3.5 sm:px-4 py-2.5 sm:py-3 md:py-3.5 rounded-[var(--radius-input)] border text-sm md:text-base text-[var(--text-main)] bg-[var(--bg-app)] placeholder-[var(--text-light)] focus:outline-none transition-colors ${touched.fullName && errors.fullName
                    ? 'border-[var(--primary)] focus:border-[var(--primary)]'
                    : 'border-[var(--border-light)] focus:border-[var(--primary)]'
                    }`}
                />
                {touched.fullName && errors.fullName && (
                  <p className="text-xs sm:text-sm text-[var(--primary)] font-normal mt-0.5 animate-in fade-in duration-150">
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Extra Driver Fields when selectedRole === 'driver' */}
              {selectedRole === 'driver' && (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-[var(--text-main)]">
                        Phone Number<span className="text-[var(--primary)]">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={driverPhone}
                        onChange={(e) => {
                          setDriverPhone(e.target.value)
                          if (errors.driverPhone) {
                            setErrors((prev) => ({ ...prev, driverPhone: undefined }))
                          }
                        }}
                        onBlur={() => {
                          setTouched((prev) => ({ ...prev, driverPhone: true }))
                          if (!driverPhone.trim()) {
                            setErrors((prev) => ({ ...prev, driverPhone: 'Please enter phone number' }))
                          } else {
                            setErrors((prev) => ({ ...prev, driverPhone: undefined }))
                          }
                        }}
                        placeholder="+1 (800) 555-9274"
                        className={`w-full px-3.5 py-2.5 rounded-[var(--radius-input)] border text-sm text-[var(--text-main)] bg-[var(--bg-app)] placeholder-[var(--text-light)] focus:outline-none transition-colors ${touched.driverPhone && errors.driverPhone
                          ? 'border-[var(--primary)] focus:border-[var(--primary)]'
                          : 'border-[var(--border-light)] focus:border-[var(--primary)]'
                          }`}
                      />
                      {touched.driverPhone && errors.driverPhone && (
                        <p className="text-xs text-[var(--primary)] font-normal mt-0.5 animate-in fade-in duration-150">
                          {errors.driverPhone}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-[var(--text-main)]">
                        Van / Unit ID<span className="text-[var(--primary)]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={driverVan}
                        onChange={(e) => {
                          setDriverVan(e.target.value)
                          if (errors.driverVan) {
                            setErrors((prev) => ({ ...prev, driverVan: undefined }))
                          }
                        }}
                        onBlur={() => {
                          setTouched((prev) => ({ ...prev, driverVan: true }))
                          if (!driverVan.trim()) {
                            setErrors((prev) => ({ ...prev, driverVan: 'Please enter van/unit ID' }))
                          } else {
                            setErrors((prev) => ({ ...prev, driverVan: undefined }))
                          }
                        }}
                        placeholder="e.g. Van #04"
                        className={`w-full px-3.5 py-2.5 rounded-[var(--radius-input)] border text-sm text-[var(--text-main)] bg-[var(--bg-app)] placeholder-[var(--text-light)] focus:outline-none transition-colors ${touched.driverVan && errors.driverVan
                          ? 'border-[var(--primary)] focus:border-[var(--primary)]'
                          : 'border-[var(--border-light)] focus:border-[var(--primary)]'
                          }`}
                      />
                      {touched.driverVan && errors.driverVan && (
                        <p className="text-xs text-[var(--primary)] font-normal mt-0.5 animate-in fade-in duration-150">
                          {errors.driverVan}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-[var(--text-main)]">
                      Vehicle License Plate<span className="text-[var(--primary)]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={driverPlate}
                      onChange={(e) => {
                        setDriverPlate(e.target.value)
                        if (errors.driverPlate) {
                          setErrors((prev) => ({ ...prev, driverPlate: undefined }))
                        }
                      }}
                      onBlur={() => {
                        setTouched((prev) => ({ ...prev, driverPlate: true }))
                        if (!driverPlate.trim()) {
                          setErrors((prev) => ({ ...prev, driverPlate: 'Please enter license plate' }))
                        } else {
                          setErrors((prev) => ({ ...prev, driverPlate: undefined }))
                        }
                      }}
                      placeholder="e.g. BC-9042-DRV"
                      className={`w-full px-4 py-2.5 rounded-[var(--radius-input)] border text-sm text-[var(--text-main)] bg-[var(--bg-app)] placeholder-[var(--text-light)] focus:outline-none transition-colors uppercase font-mono ${touched.driverPlate && errors.driverPlate
                        ? 'border-[var(--primary)] focus:border-[var(--primary)]'
                        : 'border-[var(--border-light)] focus:border-[var(--primary)]'
                        }`}
                    />
                    {touched.driverPlate && errors.driverPlate && (
                      <p className="text-xs text-[var(--primary)] font-normal mt-0.5 animate-in fade-in duration-150">
                        {errors.driverPlate}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Email Address* */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm md:text-sm font-semibold text-[var(--text-main)]">
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
                    } else {
                      setErrors((prev) => ({ ...prev, email: undefined }))
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
                  placeholder="name@example.com"
                  className={`w-full px-3.5 sm:px-4 py-2.5 sm:py-3 md:py-3.5 rounded-[var(--radius-input)] border text-sm md:text-base text-[var(--text-main)] bg-[var(--bg-app)] placeholder-[var(--text-light)] focus:outline-none transition-colors ${errors.email
                    ? 'border-[var(--primary)] focus:border-[var(--primary)]'
                    : 'border-[var(--border-light)] focus:border-[var(--primary)]'
                    }`}
                />
                {errors.email && (
                  <p className="text-xs sm:text-sm text-[var(--primary)] font-normal mt-1 animate-in fade-in duration-150">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password* */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm md:text-sm font-semibold text-[var(--text-main)]">
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
                        const strength = validatePasswordStrength(val)
                        if (!strength.isValid) {
                          setErrors((prev) => ({ ...prev, password: strength.message }))
                        } else {
                          setErrors((prev) => ({ ...prev, password: undefined }))
                        }
                      } else if (touched.password) {
                        setErrors((prev) => ({ ...prev, password: 'Please enter a password' }))
                      } else {
                        setErrors((prev) => ({ ...prev, password: undefined }))
                      }
                      // Revalidate confirmPassword if already typed
                      if (confirmPassword) {
                        if (val !== confirmPassword) {
                          setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }))
                        } else {
                          setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                        }
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, password: true }))
                      const strength = validatePasswordStrength(signupPassword)
                      if (!signupPassword) {
                        setErrors((prev) => ({ ...prev, password: 'Please enter a password' }))
                      } else if (!strength.isValid) {
                        setErrors((prev) => ({ ...prev, password: strength.message }))
                      } else {
                        setErrors((prev) => ({ ...prev, password: undefined }))
                      }
                    }}
                    placeholder="Create password (min. 6 characters)"
                    className={`w-full px-3.5 sm:px-4 py-2.5 sm:py-3 md:py-3.5 pr-11 rounded-[var(--radius-input)] border text-sm md:text-base text-[var(--text-main)] bg-[var(--bg-app)] placeholder-[var(--text-light)] focus:outline-none transition-colors ${errors.password
                      ? 'border-[var(--primary)] focus:border-[var(--primary)]'
                      : 'border-[var(--border-light)] focus:border-[var(--primary)]'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-light)] hover:text-[var(--text-muted)] cursor-pointer p-1"
                    aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignupPassword ? (
                      <EyeOff className="w-4 h-4 stroke-[1.8]" />
                    ) : (
                      <Eye className="w-4 h-4 stroke-[1.8]" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs sm:text-sm text-[var(--primary)] font-normal mt-1 animate-in fade-in duration-150">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password* */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm md:text-sm font-semibold text-[var(--text-main)]">
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
                      if (val) {
                        if (signupPassword !== val) {
                          setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }))
                        } else {
                          setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                        }
                      } else if (touched.confirmPassword) {
                        setErrors((prev) => ({ ...prev, confirmPassword: 'Please confirm your password' }))
                      } else {
                        setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, confirmPassword: true }))
                      if (!confirmPassword) {
                        setErrors((prev) => ({ ...prev, confirmPassword: 'Please confirm your password' }))
                      } else if (signupPassword !== confirmPassword) {
                        setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }))
                      } else {
                        setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                      }
                    }}
                    placeholder="Repeat password"
                    className={`w-full px-3.5 sm:px-4 py-2.5 sm:py-3 md:py-3.5 pr-11 rounded-[var(--radius-input)] border text-sm md:text-base text-[var(--text-main)] bg-[var(--bg-app)] placeholder-[var(--text-light)] focus:outline-none transition-colors ${errors.confirmPassword
                      ? 'border-[var(--primary)] focus:border-[var(--primary)]'
                      : 'border-[var(--border-light)] focus:border-[var(--primary)]'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-light)] hover:text-[var(--text-muted)] cursor-pointer p-1"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 stroke-[1.8]" />
                    ) : (
                      <Eye className="w-4 h-4 stroke-[1.8]" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs sm:text-sm text-[var(--primary)] font-normal mt-1 animate-in fade-in duration-150">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>


              {/* Red Get Started Button with Loading State */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 sm:mt-3 py-3 sm:py-3.5 md:py-4 rounded-[var(--radius-btn)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] text-sm sm:text-base font-bold shadow-sm active:scale-[0.99] transition-all cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? 'Creating Account...' : 'Get Started'}</span>
              </button>
            </form>

            {/* Bottom Switch Link */}
            {onSwitchToLogin && (
              <div className="mt-5 text-xs sm:text-sm text-[var(--text-main)] text-center font-medium">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => onSwitchToLogin(selectedRole)}
                  className="text-[var(--primary)] font-bold hover:underline cursor-pointer ml-0.5"
                >
                  Log in
                </button>
              </div>
            )}

            {/* Driver Portal Switcher Link */}
            {selectedRole === 'customer' ? (
              <button
                type="button"
                onClick={() => setSelectedRole('driver')}
                className="mt-3.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer flex items-center justify-center gap-1.5 py-1"
              >
                <Truck className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>Want to drive with us? Register as Driver Partner →</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedRole('customer')}
                className="mt-3.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer py-1"
              >
                ← Back to Customer Registration
              </button>
            )}
          </div>
        </div>


      </div>
    </div>
  )
}

export const SignupScreen = Signup
export const SignupPage = Signup
export default Signup
