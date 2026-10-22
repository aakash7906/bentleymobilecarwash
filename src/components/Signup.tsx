import React, { useState } from 'react'
import { Eye, EyeOff, Check, Loader2, Truck } from 'lucide-react'
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
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

export interface SignupProps {
  onSignupSuccess: (user: { name: string; email: string; uid?: string; role?: 'customer' | 'driver' }) => void
  onSwitchToLogin?: (role?: 'customer' | 'driver') => void
  onSkip?: () => void
  initialRole?: 'customer' | 'driver'
}

export const Signup: React.FC<SignupProps> = ({
  onSignupSuccess,
  onSwitchToLogin,
  onSkip,
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
  const [agreeTerms, setAgreeTerms] = useState(true)

  // Driver-specific fields
  const [driverPhone, setDriverPhone] = useState('')
  const [driverVan, setDriverVan] = useState('')
  const [driverPlate, setDriverPlate] = useState('')

  // STEP 1 INTEGRATION: Loading state
  const [loading, setLoading] = useState(false)

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
      return { isValid: false, message: 'Password must be at least 6 characters long.' }
    }
    if (!/[A-Za-z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one letter.' }
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number.' }
    }
    return { isValid: true }
  }

  // STEP 1 & 2 INTEGRATION: Real Firebase User Registration + Firestore Document Creation
  const handleSignupSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    // 1. Mandatory Fields Check
    if (!fullName.trim() || !signupEmail.trim() || !signupPassword) {
      showToast('Please fill in all required fields.', 'error')
      return
    }

    // 2. Strict Email Regex Validation
    if (!isValidEmail(signupEmail)) {
      showToast('Please enter a valid email address (e.g., name@example.com).', 'error')
      return
    }

    // 3. Password Complexity & Length Validation
    const passwordValidation = validatePasswordStrength(signupPassword)
    if (!passwordValidation.isValid) {
      showToast(passwordValidation.message || 'Password does not meet requirements.', 'error')
      return
    }

    // 4. Password Confirmation Equality Check
    if (signupPassword !== confirmPassword) {
      showToast('Passwords do not match. Please verify and re-type.', 'error')
      return
    }

    // 5. Terms of Service Acceptance
    if (!agreeTerms) {
      showToast('Please accept the Terms of Service to proceed.', 'error')
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
      // Database: 'carwash'
      // Document ID: user.uid
      // -------------------------------------------------------------
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        fullName: fullName.trim(),
        email: user.email || signupEmail.trim(),
        phone: driverPhone.trim() || '+1 (800) 555-9274',
        role: selectedRole,
        driverDetails: selectedRole === 'driver' ? {
          vanNumber: driverVan.trim() || 'Van #04',
          licensePlate: driverPlate.trim() || 'BC-9042-DRV',
          vehicle: 'Ford Transit Mobile Detailing Unit',
          rating: 5.0,
          active: true,
        } : undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

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
        showToast('This email is already registered. Please log in instead.', 'error')
      } else if (err.code === 'auth/invalid-email') {
        showToast('Invalid email format. Please check your email address.', 'error')
      } else if (err.code === 'auth/weak-password') {
        showToast('Password is too weak. Please include letters and numbers.', 'error')
      } else {
        showToast(err.message || 'Failed to create account. Please try again.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  // STEP 1 INTEGRATION: Google Sign-in for Signup screen as well
  const handleGoogleSignUp = async () => {
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      showToast('Google registration successful! Welcome.', 'success')
      setTimeout(() => {
        onSignupSuccess({
          name: user.displayName || 'Google User',
          email: user.email || '',
          uid: user.uid,
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
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto selection:bg-primary selection:text-primary-foreground flex justify-center items-center py-6 sm:py-10 px-4 sm:px-6">
      <div className="w-full max-w-[440px] sm:max-w-md md:max-w-lg lg:max-w-xl flex flex-col justify-between py-2 sm:py-6 bg-white my-auto">

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
            <h1 className="text-xl min-[380px]:text-2xl sm:text-[26px] md:text-3xl font-extrabold text-gray-950 text-center tracking-tight">
              {selectedRole === 'driver' ? 'Driver Partner Registration' : 'Create an Account'}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-500 font-normal text-center mt-1.5 mb-4 sm:mb-5">
              {selectedRole === 'driver'
                ? 'Register your mobile wash vehicle and start accepting customer jobs.'
                : 'Sign up now to get started with an account.'}
            </p>

            {/* Sign Up Form */}
            <form onSubmit={handleSignupSubmit} className="w-full flex flex-col gap-3 sm:gap-3.5 md:gap-4">
              {/* Full Name* */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm md:text-sm font-semibold text-gray-800">
                  {selectedRole === 'driver' ? 'Driver Full Name' : 'Full Name'}<span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={selectedRole === 'driver' ? 'e.g. Alex Rivera' : 'Enter full name'}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 md:py-3.5 rounded-lg border border-gray-200 text-sm md:text-base text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Extra Driver Fields when selectedRole === 'driver' */}
              {selectedRole === 'driver' && (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-gray-800">
                        Phone Number<span className="text-primary">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={driverPhone}
                        onChange={(e) => setDriverPhone(e.target.value)}
                        placeholder="+1 (800) 555-9274"
                        className="w-full px-3.5 py-2.5 rounded-md border border-gray-200 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-gray-800">
                        Van / Unit ID<span className="text-primary">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={driverVan}
                        onChange={(e) => setDriverVan(e.target.value)}
                        placeholder="e.g. Van #04"
                        className="w-full px-3.5 py-2.5 rounded-md border border-gray-200 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-800">
                      Vehicle License Plate<span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={driverPlate}
                      onChange={(e) => setDriverPlate(e.target.value)}
                      placeholder="e.g. BC-9042-DRV"
                      className="w-full px-4 py-2.5 rounded-md border border-gray-200 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors uppercase font-mono"
                    />
                  </div>
                </>
              )}

              {/* Email Address* */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm md:text-sm font-semibold text-gray-800">
                  Email Address<span className="text-primary">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 md:py-3.5 rounded-lg border border-gray-200 text-sm md:text-base text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Password* */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm md:text-sm font-semibold text-gray-800">
                  Password<span className="text-primary">*</span>
                </label>
                <div className="relative w-full">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Create password (min. 6 characters)"
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 md:py-3.5 pr-11 rounded-lg border border-gray-200 text-sm md:text-base text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                  >
                    {showSignupPassword ? (
                      <EyeOff className="w-4 h-4 stroke-[1.8]" />
                    ) : (
                      <Eye className="w-4 h-4 stroke-[1.8]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password* */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm md:text-sm font-semibold text-gray-800">
                  Confirm Password<span className="text-primary">*</span>
                </label>
                <div className="relative w-full">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 md:py-3.5 pr-11 rounded-lg border border-gray-200 text-sm md:text-base text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 stroke-[1.8]" />
                    ) : (
                      <Eye className="w-4 h-4 stroke-[1.8]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Terms of Service Checkbox */}
              <div className="flex items-center gap-2.5 pt-1">
                <label
                  onClick={() => setAgreeTerms(!agreeTerms)}
                  className="flex items-center gap-2.5 cursor-pointer select-none"
                >
                  <div
                    className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-colors shrink-0 ${agreeTerms ? 'bg-primary text-primary-foreground' : 'border border-gray-300 bg-gray-100'
                      }`}
                  >
                    {agreeTerms && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-600">
                    I have read and agree to the{' '}
                    <span className="text-primary font-semibold underline cursor-pointer">
                      Terms of Service
                    </span>
                  </span>
                </label>
              </div>

              {/* Red Get Started Button with Loading State */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 sm:mt-3 py-3 sm:py-3.5 md:py-4 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-sm sm:text-base font-bold shadow-sm active:scale-[0.99] transition-all cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? 'Creating Account...' : 'Get Started'}</span>
              </button>
            </form>

            {/* Bottom Switch Link */}
            {onSwitchToLogin && (
              <div className="mt-5 text-xs sm:text-sm text-gray-800 text-center font-medium">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => onSwitchToLogin(selectedRole)}
                  className="text-primary font-bold hover:underline cursor-pointer ml-0.5"
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
                className="mt-3.5 text-xs font-bold text-gray-700 hover:text-primary transition-colors cursor-pointer flex items-center justify-center gap-1.5 py-1"
              >
                <Truck className="w-3.5 h-3.5 text-primary" />
                <span>Want to drive with us? Register as Driver Partner →</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedRole('customer')}
                className="mt-3.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer py-1"
              >
                ← Back to Customer Registration
              </button>
            )}
          </div>
        </div>

        {/* Optional Skip / Continue as Guest */}
        {onSkip && (
          <div className="w-full text-center mt-6">
            <button
              onClick={onSkip}
              className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors cursor-pointer py-1"
            >
              Skip and explore as guest →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export const SignupScreen = Signup
