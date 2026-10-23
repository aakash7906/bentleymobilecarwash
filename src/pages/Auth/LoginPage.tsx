import React, { useState } from 'react'
import { Eye, EyeOff, Check, Loader2, Truck } from 'lucide-react'
import logoBentley from '@/assets/Logo_Bentley.png'
import { useToast } from '@/context/ToastContext'
// STEP 1 INTEGRATION: Import Firebase auth & Firestore instances and methods
import { auth, db } from '@/firebase'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

export interface LoginProps {
  onLoginSuccess: (user: { name: string; email: string; uid?: string; role?: 'customer' | 'driver' }) => void
  onSwitchToSignup?: (role?: 'customer' | 'driver') => void
  onSkip?: () => void
  initialRole?: 'customer' | 'driver'
}

export const Login: React.FC<LoginProps> = ({
  onLoginSuccess,
  onSwitchToSignup,
  onSkip,
  initialRole = 'customer',
}) => {
  // Global Toast Hook
  const { showToast } = useToast()
  // Role State (Customer vs Driver)
  const [selectedRole, setSelectedRole] = useState<'customer' | 'driver'>(initialRole)

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  // Loading state
  const [loading, setLoading] = useState(false)

  // Field errors state for inline warning under inputs
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({})

  // -------------------------------------------------------------
  // VALIDATION HELPER: Standard Email Regex Pattern
  // -------------------------------------------------------------
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/
    return emailRegex.test(email.trim())
  }

  // STEP 1 INTEGRATION: Real Firebase Email & Password Sign-in handler with Validation & Toasters
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    // Mark all as touched on submit
    setTouched({ email: true, password: true })

    const newErrors: { email?: string; password?: string } = {}
    if (!loginEmail.trim()) {
      newErrors.email = 'Please enter your email address'
    } else if (!isValidEmail(loginEmail)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!loginPassword) {
      newErrors.password = 'Please enter your password'
    } else if (loginPassword.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)

    // 1. Check if any errors
    if (newErrors.email) {
      showToast(newErrors.email, 'error')
      return
    }
    if (newErrors.password) {
      showToast(newErrors.password, 'error')
      return
    }

    setLoading(true)

    try {
      // Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword)
      const user = userCredential.user

      // Retrieve actual registered role from Firestore
      let resolvedRole: 'customer' | 'driver' = selectedRole
      try {
        const userDocRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userDocRef)
        if (userDoc.exists()) {
          const data = userDoc.data()
          if (data?.role === 'driver' || data?.role === 'customer') {
            resolvedRole = data.role
          }
        } else {
          // Self-heal: Ensure user document exists in Firestore
          await setDoc(userDocRef, {
            uid: user.uid,
            fullName: user.displayName || user.email?.split('@')[0] || (selectedRole === 'driver' ? 'Driver Partner' : 'Member'),
            email: user.email || loginEmail.trim(),
            phone: user.phoneNumber || '+1 (800) 555-9274',
            role: selectedRole,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }, { merge: true })
        }
      } catch (err) {
        console.warn('Could not read user role from Firestore, defaulting to selected tab:', err)
      }

      // Success Toast Notification
      showToast('Login successful! Welcome back.', 'success')

      // Notify parent on successful login with real Firebase User data & role after brief pause
      setTimeout(() => {
        onLoginSuccess({
          name: user.displayName || user.email?.split('@')[0] || (resolvedRole === 'driver' ? 'Driver Partner' : 'Member'),
          email: user.email || loginEmail,
          uid: user.uid,
          role: resolvedRole,
        })
      }, 600)
    } catch (err: any) {
      console.error('Firebase Login Error:', err)
      // User-friendly error message mapping with Toaster AND inline input warning
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        const errorMsg = 'Invalid email or password. Please verify and try again.'
        setErrors({
          email: 'Invalid email or password',
          password: 'Wrong password or account does not exist',
        })
        showToast(errorMsg, 'error')
      } else if (err.code === 'auth/invalid-email') {
        const errorMsg = 'Invalid email address format. Please check your email.'
        setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }))
        showToast(errorMsg, 'error')
      } else if (err.code === 'auth/too-many-requests') {
        showToast('Too many failed attempts. Please try again in a few minutes.', 'error')
      } else if (err.code === 'auth/network-request-failed') {
        showToast('Network error. Please check your internet connection.', 'error')
      } else {
        showToast(err.message || 'Failed to login. Please try again.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  // STEP 1 INTEGRATION: Real Firebase Google Sign-In with popup
  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      // Retrieve actual registered role from Firestore
      let resolvedRole: 'customer' | 'driver' = selectedRole
      try {
        const userDocRef = doc(db, 'users', user.uid)
        const userDoc = await getDoc(userDocRef)
        if (userDoc.exists()) {
          const data = userDoc.data()
          if (data?.role === 'driver' || data?.role === 'customer') {
            resolvedRole = data.role
          }
        } else {
          // Self-heal: Ensure user document exists in Firestore
          await setDoc(userDocRef, {
            uid: user.uid,
            fullName: user.displayName || 'Member',
            email: user.email || '',
            phone: user.phoneNumber || '+1 (800) 555-9274',
            role: selectedRole,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }, { merge: true })
        }
      } catch (err) {
        console.warn('Could not read user role from Firestore:', err)
      }

      showToast('Google sign-in successful!', 'success')
      setTimeout(() => {
        onLoginSuccess({
          name: user.displayName || 'Google User',
          email: user.email || '',
          uid: user.uid,
          role: resolvedRole,
        })
      }, 600)
    } catch (err: any) {
      console.error('Firebase Google Sign-In Error:', err)
      if (err.code !== 'auth/popup-closed-by-user') {
        showToast(err.message || 'Google sign-in failed. Please try again.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  // STEP 1 INTEGRATION: Real Firebase Password Reset Email with Toasters
  const handleForgotPassword = async () => {
    if (!loginEmail.trim()) {
      showToast('Please enter your email address to reset password.', 'error')
      return
    }

    if (!isValidEmail(loginEmail)) {
      showToast('Please enter a valid email address to receive reset link.', 'error')
      return
    }

    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, loginEmail.trim())
      showToast('Password reset link sent to your email! Check your inbox.', 'success')
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        showToast('No registered account found with this email address.', 'error')
      } else {
        showToast(err.message || 'Failed to send password reset email.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-app)] overflow-y-auto selection:bg-[var(--primary)] selection:text-[var(--primary-foreground)] flex justify-center items-center py-6 sm:py-10 px-4 sm:px-6">
      <div className="w-full max-w-[420px] sm:max-w-md md:max-w-lg lg:max-w-xl flex flex-col justify-between py-2 sm:py-6 bg-[var(--bg-app)] my-auto">

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

          {/* Login Form Section */}
          <div className="w-full flex flex-col items-center animate-in fade-in duration-200">
            {/* Header Titles */}
            <h1 className="text-xl min-[380px]:text-2xl sm:text-[26px] md:text-3xl font-extrabold text-[var(--text-main)] text-center tracking-tight">
              {selectedRole === 'driver' ? 'Driver Partner Login' : 'Log in to your Account'}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-[var(--text-muted)] font-normal text-center mt-1.5 mb-4 sm:mb-6">
              {selectedRole === 'driver'
                ? 'Sign in to access live car wash requests.'
                : 'Welcome back, please enter your details.'}
            </p>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} noValidate className="w-full flex flex-col gap-3.5 sm:gap-4 md:gap-5">
              {/* Email Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs sm:text-sm md:text-sm font-semibold text-[var(--text-main)]">
                  {selectedRole === 'driver' ? 'Driver Email Address' : 'Email Address'}
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => {
                    const val = e.target.value
                    setLoginEmail(val)
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
                    if (!loginEmail.trim()) {
                      setErrors((prev) => ({ ...prev, email: 'Please enter your email address' }))
                    } else if (!isValidEmail(loginEmail)) {
                      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }))
                    } else {
                      setErrors((prev) => ({ ...prev, email: undefined }))
                    }
                  }}
                  placeholder={selectedRole === 'driver' ? 'driver@bentleycarwash.com' : 'Enter your email'}
                  className={`w-full px-3.5 sm:px-4 py-2.5 sm:py-3 md:py-3.5 rounded-[var(--radius-input)] border text-sm md:text-base text-[var(--text-main)] bg-[var(--bg-app)] placeholder-[var(--text-light)] focus:outline-none transition-colors ${
                    errors.email
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

              {/* Password with Eye Toggle */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs sm:text-sm md:text-sm font-semibold text-[var(--text-main)]">
                  Password
                </label>
                <div className="relative w-full">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => {
                      const val = e.target.value
                      setLoginPassword(val)
                      if (val) {
                        if (val.length < 6) {
                          setErrors((prev) => ({ ...prev, password: 'Password must be at least 6 characters' }))
                        } else {
                          setErrors((prev) => ({ ...prev, password: undefined }))
                        }
                      } else if (touched.password) {
                        setErrors((prev) => ({ ...prev, password: 'Please enter your password' }))
                      } else {
                        setErrors((prev) => ({ ...prev, password: undefined }))
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, password: true }))
                      if (!loginPassword) {
                        setErrors((prev) => ({ ...prev, password: 'Please enter your password' }))
                      } else if (loginPassword.length < 6) {
                        setErrors((prev) => ({ ...prev, password: 'Password must be at least 6 characters' }))
                      } else {
                        setErrors((prev) => ({ ...prev, password: undefined }))
                      }
                    }}
                    placeholder="Enter password"
                    className={`w-full px-3.5 sm:px-4 py-2.5 sm:py-3 md:py-3.5 pr-11 rounded-[var(--radius-input)] border text-sm md:text-base text-[var(--text-main)] bg-[var(--bg-app)] placeholder-[var(--text-light)] focus:outline-none transition-colors tracking-widest ${
                      errors.password
                        ? 'border-[var(--primary)] focus:border-[var(--primary)]'
                        : 'border-[var(--border-light)] focus:border-[var(--primary)]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-light)] hover:text-[var(--text-muted)] cursor-pointer p-1"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? (
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

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between pt-1">
                {/* Remember Me Checkbox */}
                <label
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <div
                    className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-colors ${
                      rememberMe
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                        : 'border border-[var(--border-light)] bg-[var(--bg-app)]'
                    }`}
                  >
                    {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-[var(--text-main)]">Remember me</span>
                </label>

                {/* Forgot Password */}
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs sm:text-sm font-bold text-[var(--text-main)] hover:text-[var(--primary)] transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Red Log In Button with Loading State */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 sm:mt-3 py-3 sm:py-3.5 md:py-4 rounded-[var(--radius-btn)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] text-sm sm:text-base font-bold shadow-sm active:scale-[0.99] transition-all cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? 'Signing in...' : 'Log in'}</span>
              </button>
            </form>

            {/* Bottom Switch Link */}
            {onSwitchToSignup && (
              <div className="mt-6 text-xs sm:text-sm text-[var(--text-main)] text-center font-medium">
                <span>{selectedRole === 'driver' ? 'New driver partner? ' : 'Don’t have an account? '}</span>
                <button
                  type="button"
                  onClick={() => onSwitchToSignup(selectedRole)}
                  className="text-[var(--primary)] font-bold hover:underline cursor-pointer ml-0.5"
                >
                  {selectedRole === 'driver' ? 'Register as Driver' : 'Sign Up'}
                </button>
              </div>
            )}

            {/* Quick Driver Portal Switcher Link (Visible in Customer mode) */}
            {selectedRole === 'customer' ? (
              <button
                type="button"
                onClick={() => setSelectedRole('driver')}
                className="mt-4 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer flex items-center justify-center gap-1.5 py-1"
              >
                <Truck className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span> Login to Driver Portal →</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedRole('customer')}
                className="mt-4 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer py-1"
              >
                ← Back to Customer Login
              </button>
            )}
          </div>
        </div>

        {/* Optional Skip / Continue as Guest */}
        {onSkip && (
          <div className="w-full text-center mt-6">
            <button
              onClick={onSkip}
              className="text-xs font-semibold text-[var(--text-light)] hover:text-[var(--text-muted)] transition-colors cursor-pointer py-1"
            >
              Skip and explore as guest →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export const LoginScreen = Login
export const LoginPage = Login
export default Login
