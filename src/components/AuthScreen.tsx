import React, { useState } from 'react'
import { Eye, EyeOff, Check } from 'lucide-react'
import logoBentley from '@/assets/Logo_Bentley.png'

interface AuthScreenProps {
  initialMode?: 'login' | 'signup'
  onLoginSuccess: (user: { name: string; email: string }) => void
  onSkip?: () => void
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = 'login',
  onLoginSuccess,
  onSkip,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('sarah@gmail.com')
  const [loginPassword, setLoginPassword] = useState('password123')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  // Signup Form States
  const [fullName, setFullName] = useState('John Doe')
  const [signupEmail, setSignupEmail] = useState('john.doe@example.com')
  const [signupPassword, setSignupPassword] = useState('password123')
  const [confirmPassword, setConfirmPassword] = useState('password123')
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(true)

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    onLoginSuccess({
      name: loginEmail.split('@')[0] || 'Sarah',
      email: loginEmail || 'sarah@gmail.com',
    })
  }

  const handleSignupSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    onLoginSuccess({
      name: fullName || 'John Doe',
      email: signupEmail || 'john.doe@example.com',
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto selection:bg-[#dc2626] selection:text-white">
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

          {/* ===================== 1. LOGIN MODE ===================== */}
          {mode === 'login' ? (
            <div className="w-full flex flex-col items-center animate-in fade-in duration-200">
              {/* Header Titles */}
              <h1 className="text-2xl sm:text-[26px] font-extrabold text-gray-950 text-center tracking-tight">
                Log in to your Account
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 font-normal text-center mt-1.5 mb-6">
                Welcome back, please enter your details.
              </p>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="w-full flex flex-col gap-4">
                {/* Email Address */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs sm:text-sm font-semibold text-gray-800">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 rounded-md border border-gray-200 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-[#dc2626] transition-colors"
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
                      className="w-full px-4 py-3 pr-11 rounded-md border border-gray-200 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-[#dc2626] transition-colors tracking-widest"
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
                      className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-colors ${
                        rememberMe ? 'bg-[#dc2626] text-white' : 'border border-gray-300 bg-white'
                      }`}
                    >
                      {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs font-semibold text-gray-700">Remember me</span>
                  </label>

                  {/* Forgot Password */}
                  <button
                    type="button"
                    onClick={() => alert('Password reset link sent to your email!')}
                    className="text-xs font-bold text-gray-900 hover:text-[#dc2626] transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Red Log In Button */}
                <button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault()
                    handleLoginSubmit()
                  }}
                  className="w-full mt-3 py-3.5 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm font-bold shadow-sm active:scale-[0.99] transition-all cursor-pointer text-center"
                >
                  Log in
                </button>
              </form>

              {/* Bottom Switch Link */}
              <div className="mt-7 text-xs sm:text-sm text-gray-800 text-center font-medium">
                <span>Don’t have an account? </span>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-[#dc2626] font-bold hover:underline cursor-pointer ml-0.5"
                >
                  Sign Up
                </button>
              </div>
            </div>
          ) : (
            /* ===================== 2. SIGN UP MODE ===================== */
            <div className="w-full flex flex-col items-center animate-in fade-in duration-200">
              {/* Header Titles */}
              <h1 className="text-2xl sm:text-[26px] font-extrabold text-gray-950 text-center tracking-tight">
                Create an Account
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 font-normal text-center mt-1.5 mb-5">
                Sign up now to get started with an account.
              </p>

              {/* Sign Up Form */}
              <form onSubmit={handleSignupSubmit} className="w-full flex flex-col gap-3.5">
                {/* Full Name* */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs sm:text-sm font-semibold text-gray-800">
                    Full Name<span className="text-[#dc2626]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-4 py-2.5 sm:py-3 rounded-md border border-[#dc2626] text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#dc2626] transition-colors"
                  />
                </div>

                {/* Email Address* */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs sm:text-sm font-semibold text-gray-800">
                    Email Address<span className="text-[#dc2626]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-2.5 sm:py-3 rounded-md border border-gray-200 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-[#dc2626] transition-colors"
                  />
                </div>

                {/* Password* */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs sm:text-sm font-semibold text-gray-800">
                    Password<span className="text-[#dc2626]">*</span>
                  </label>
                  <div className="relative w-full">
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Create password"
                      className="w-full px-4 py-2.5 sm:py-3 pr-11 rounded-md border border-gray-200 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-[#dc2626] transition-colors"
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
                    Confirm Password<span className="text-[#dc2626]">*</span>
                  </label>
                  <div className="relative w-full">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full px-4 py-2.5 sm:py-3 pr-11 rounded-md border border-gray-200 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-[#dc2626] transition-colors"
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
                      className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-colors shrink-0 ${
                        agreeTerms ? 'bg-[#dc2626] text-white' : 'border border-gray-300 bg-gray-100'
                      }`}
                    >
                      {agreeTerms && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      I have read and agree to the{' '}
                      <span className="text-[#dc2626] font-semibold underline cursor-pointer">
                        Terms of Service
                      </span>
                    </span>
                  </label>
                </div>

                {/* Red Get Started Button */}
                <button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault()
                    handleSignupSubmit()
                  }}
                  className="w-full mt-2.5 py-3.5 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm font-bold shadow-sm active:scale-[0.99] transition-all cursor-pointer text-center"
                >
                  Get Started
                </button>
              </form>

              {/* Bottom Switch Link */}
              <div className="mt-5 text-xs sm:text-sm text-gray-800 text-center font-medium">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-[#dc2626] font-bold hover:underline cursor-pointer ml-0.5"
                >
                  Log in
                </button>
              </div>
            </div>
          )}
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
