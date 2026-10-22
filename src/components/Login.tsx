import React, { useState } from 'react'
import { Eye, EyeOff, Check, Loader2, Truck, Sparkles, ShieldCheck } from 'lucide-react'
import logoBentley from '@/assets/Logo_Bentley.png'
import { useToast } from '@/context/ToastContext'
// STEP 1 INTEGRATION: Import Firebase auth instance and auth methods
import { auth } from '@/firebase'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth'

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

  // STEP 1 INTEGRATION: Loading state
  const [loading, setLoading] = useState(false)

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

    // 1. Mandatory Fields Validation
    if (!loginEmail.trim() || !loginPassword) {
      showToast('Please enter both your email and password.', 'error')
      return
    }

    // 2. Client-side Email Format Validation
    if (!isValidEmail(loginEmail)) {
      showToast('Please enter a valid email address (e.g. name@example.com).', 'error')
      return
    }

    // 3. Password Minimum Length Pre-Check
    if (loginPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error')
      return
    }

    setLoading(true)

    try {
      // Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword)
      const user = userCredential.user

      // Success Toast Notification
      showToast('Login successful! Welcome back.', 'success')

      // Notify parent on successful login with real Firebase User data & role after brief pause
      setTimeout(() => {
        onLoginSuccess({
          name: user.displayName || user.email?.split('@')[0] || (selectedRole === 'driver' ? 'Driver Partner' : 'Member'),
          email: user.email || loginEmail,
          uid: user.uid,
          role: selectedRole,
        })
      }, 600)
    } catch (err: any) {
      console.error('Firebase Login Error:', err)
      // User-friendly error message mapping with Toaster
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        showToast('Invalid email or password. Please verify and try again.', 'error')
      } else if (err.code === 'auth/invalid-email') {
        showToast('Invalid email address format. Please check your email.', 'error')
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

      showToast('Google sign-in successful!', 'success')
      setTimeout(() => {
        onLoginSuccess({
          name: user.displayName || 'Google User',
          email: user.email || '',
          uid: user.uid,
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
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto selection:bg-primary selection:text-primary-foreground flex justify-center">
      <div className="w-full max-w-md min-h-screen flex flex-col justify-between px-6 pt-10 pb-8 bg-white">

        {/* Top Section with Mascot Logo */}
        <div className="flex flex-col items-center w-full">
          {/* Bentley Mascot Logo */}
          <div className="w-36 h-28 flex items-center justify-center mb-4">
            <img
              src={logoBentley}
              alt="Bentley Mobile Auto Detail Car Wash"
              className="w-full h-full object-contain filter drop-shadow-sm"
            />
          </div>

          {/* Login Form Section */}
          <div className="w-full flex flex-col items-center animate-in fade-in duration-200">
            {/* Header Titles */}
            <h1 className="text-2xl sm:text-[26px] font-extrabold text-gray-950 text-center tracking-tight">
              {selectedRole === 'driver' ? 'Driver Partner Login' : 'Log in to your Account'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-normal text-center mt-1.5 mb-5">
              {selectedRole === 'driver'
                ? 'Sign in to access live car wash requests.'
                : 'Welcome back, please enter your details.'}
            </p>
            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="w-full flex flex-col gap-4">
              {/* Email Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs sm:text-sm font-semibold text-gray-800">
                  {selectedRole === 'driver' ? 'Driver Email Address' : 'Email Address'}
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder={selectedRole === 'driver' ? 'driver@bentleycarwash.com' : 'Enter your email'}
                  className="w-full px-4 py-3 rounded-md border border-gray-200 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Password with Eye Toggle */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs sm:text-sm font-semibold text-gray-800">
                  Password
                </label>
                <div className="relative w-full">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 pr-11 rounded-md border border-gray-200 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4 stroke-[1.8]" />
                    ) : (
                      <Eye className="w-4 h-4 stroke-[1.8]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between pt-1">
                {/* Remember Me Checkbox */}
                <label
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <div
                    className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-colors ${rememberMe ? 'bg-primary text-primary-foreground' : 'border border-gray-300 bg-white'
                      }`}
                  >
                    {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-xs font-semibold text-gray-700">Remember me</span>
                </label>

                {/* Forgot Password */}
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-bold text-gray-900 hover:text-primary transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Red Log In Button with Loading State */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-bold shadow-sm active:scale-[0.99] transition-all cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? 'Signing in...' : 'Log in'}</span>
              </button>

              {/* STEP 1 INTEGRATION: Divider */}
              {/* <div className="flex items-center my-1">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-3 text-xs text-gray-400 font-medium">OR</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div> */}

              {/* STEP 1 INTEGRATION: Continue with Google Button */}
              {/* <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-800 text-xs sm:text-sm font-semibold shadow-xs active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2.5 bg-white disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button> */}
            </form>

            {/* Bottom Switch Link */}
            {onSwitchToSignup && (
              <div className="mt-6 text-xs sm:text-sm text-gray-800 text-center font-medium">
                <span>{selectedRole === 'driver' ? 'New driver partner? ' : 'Don’t have an account? '}</span>
                <button
                  type="button"
                  onClick={() => onSwitchToSignup(selectedRole)}
                  className="text-primary font-bold hover:underline cursor-pointer ml-0.5"
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
                className="mt-4 text-xs font-bold text-gray-700 hover:text-primary transition-colors cursor-pointer flex items-center justify-center gap-1.5 py-1"
              >
                <Truck className="w-3.5 h-3.5 text-primary" />
                <span> Login to Driver Portal →</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedRole('customer')}
                className="mt-4 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer py-1"
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

export const LoginScreen = Login
