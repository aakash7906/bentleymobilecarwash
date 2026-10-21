import React, { useState } from 'react'
import { Eye, EyeOff, Check, Loader2 } from 'lucide-react'
import logoBentley from '@/assets/Logo_Bentley.png'
// STEP 1 INTEGRATION: Import Firebase auth and registration functions
import { auth, db } from '@/lib/firebase'
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth'
// STEP 2 INTEGRATION: Import Firestore methods to create user documents
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

export interface SignupProps {
  onSignupSuccess: (user: { name: string; email: string; uid?: string }) => void
  onSwitchToLogin?: () => void
  onSkip?: () => void
}

export const Signup: React.FC<SignupProps> = ({
  onSignupSuccess,
  onSwitchToLogin,
  onSkip,
}) => {
  // Signup Form States
  const [fullName, setFullName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(true)

  // STEP 1 INTEGRATION: Loading and error message states
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // STEP 1 & 2 INTEGRATION: Real Firebase User Registration + Firestore Document Creation
  const handleSignupSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!fullName.trim() || !signupEmail.trim() || !signupPassword) {
      setErrorMessage('Please fill in all required fields.')
      return
    }

    if (signupPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.')
      return
    }

    if (signupPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.')
      return
    }

    if (!agreeTerms) {
      setErrorMessage('Please accept the Terms of Service to proceed.')
      return
    }

    setLoading(true)
    setErrorMessage(null)

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
        role: 'customer',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // -------------------------------------------------------------
      // Step 2.4: Trigger App Success Callback to continue user session
      // -------------------------------------------------------------
      onSignupSuccess({
        name: fullName.trim(),
        email: user.email || signupEmail,
        uid: user.uid,
      })
    } catch (err: any) {
      console.error('Firebase Signup Error:', err)
      if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered. Please log in instead.')
      } else if (err.code === 'auth/invalid-email') {
        setErrorMessage('Invalid email format. Please check your email address.')
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage('Password is too weak. Please use a stronger password.')
      } else {
        setErrorMessage(err.message || 'Failed to create account. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // STEP 1 INTEGRATION: Google Sign-in for Signup screen as well
  const handleGoogleSignUp = async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      onSignupSuccess({
        name: user.displayName || 'Google User',
        email: user.email || '',
        uid: user.uid,
      })
    } catch (err: any) {
      console.error('Firebase Google Signup Error:', err)
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMessage(err.message || 'Google sign-up failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-md md:max-w-xl mx-auto min-h-screen flex flex-col justify-between px-6 pt-10 pb-8 bg-white">

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

          {/* Sign Up Mode */}
          <div className="w-full flex flex-col items-center animate-in fade-in duration-200">
            {/* Header Titles */}
            <h1 className="text-2xl sm:text-[26px] font-extrabold text-gray-950 text-center tracking-tight">
              Create an Account
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-normal text-center mt-1.5 mb-5">
              Sign up now to get started with an account.
            </p>

            {/* STEP 1 INTEGRATION: Error alert banner */}
            {errorMessage && (
              <div className="w-full mb-3.5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium animate-in fade-in">
                {errorMessage}
              </div>
            )}

            {/* Sign Up Form */}
            <form onSubmit={handleSignupSubmit} className="w-full flex flex-col gap-3.5">
              {/* Full Name* */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-gray-800">
                  Full Name<span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-4 py-2.5 sm:py-3 rounded-md border border-gray-200 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Email Address* */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-gray-800">
                  Email Address<span className="text-primary">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 sm:py-3 rounded-md border border-gray-200 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Password* */}
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-gray-800">
                  Password<span className="text-primary">*</span>
                </label>
                <div className="relative w-full">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Create password (min. 6 characters)"
                    className="w-full px-4 py-2.5 sm:py-3 pr-11 rounded-md border border-gray-200 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
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
                <label className="text-xs sm:text-sm font-semibold text-gray-800">
                  Confirm Password<span className="text-primary">*</span>
                </label>
                <div className="relative w-full">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-4 py-2.5 sm:py-3 pr-11 rounded-md border border-gray-200 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
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
                  <span className="text-xs font-medium text-gray-600">
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
                className="w-full mt-2.5 py-3.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-bold shadow-sm active:scale-[0.99] transition-all cursor-pointer text-center flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? 'Creating Account...' : 'Get Started'}</span>
              </button>

              {/* STEP 1 INTEGRATION: Divider */}
              {/* <div className="flex items-center my-0.5">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-3 text-xs text-gray-400 font-medium">OR</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div> */}

              {/* STEP 1 INTEGRATION: Continue with Google Button */}
              {/* <button
                type="button"
                onClick={handleGoogleSignUp}
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
                <span>Sign up with Google</span>
              </button> */}
            </form>

            {/* Bottom Switch Link */}
            {onSwitchToLogin && (
              <div className="mt-5 text-xs sm:text-sm text-gray-800 text-center font-medium">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-primary font-bold hover:underline cursor-pointer ml-0.5"
                >
                  Log in
                </button>
              </div>
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
