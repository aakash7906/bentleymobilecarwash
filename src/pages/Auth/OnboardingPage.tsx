import React, { useState } from 'react'
import truckWashBg from '@/assets/onboarding/truck-wash-clean.png'

export interface OnboardingScreenProps {
  /**
   * Callback fired when user clicks Next / Get Started
   */
  onNext: () => void
  /**
   * Optional callback to go back
   */
  onBack?: () => void
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onNext, onBack }) => {
  const [isExiting, setIsExiting] = useState(false)

  const handleNext = () => {
    setIsExiting(true)
    setTimeout(() => {
      onNext()
    }, 250)
  }

  return (
    <div
      className={`fixed inset-0 z-[9998] w-full h-full min-h-[100dvh] overflow-hidden select-none bg-black flex flex-col justify-between transition-opacity duration-300 ease-out ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))',
        paddingBottom: 'max(1.75rem, env(safe-area-inset-bottom, 1.75rem))',
      }}
    >
      {/* Background Image: High-res Truck Wash with optimized responsive focal point */}
      <img
        src={truckWashBg}
        alt="Bentley Mobile Car Wash"
        className="absolute inset-0 w-full h-full object-cover object-[center_35%] md:object-center pointer-events-none"
        loading="eager"
      />

      {/* Multi-layered Vignette Gradients for crisp readability on all mobile & tablet screens */}
      <div className="absolute inset-x-0 top-0 h-64 sm:h-80 md:h-96 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-80 sm:h-96 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none" />

      {/* =========================================================================
          TOP: BRANDING & HEADING (Mobile & Tablet Fluid)
          ========================================================================= */}
      <div className="relative z-20 w-full max-w-xl mx-auto px-6 sm:px-8 md:px-12 pt-4 sm:pt-6 md:pt-8 flex flex-col items-start pointer-events-none">

        {/* Heading Typography */}
        <h1
          className="font-bold text-white text-[32px] min-[380px]:text-[36px] sm:text-[42px] md:text-[48px] leading-[1.15] sm:leading-[1.18] tracking-tight select-none"
          style={{
            fontFamily: "'Urbanist', 'Plus Jakarta Sans', sans-serif",
            textShadow:
              '0.75px 0.75px 0px var(--primary), 1.3px 1.3px 0px var(--primary), 0px 3px 8px rgba(0, 0, 0, 0.6)',
          }}
        >
          A Spotless Car
          <br />
          Shine, Just a
          <br />
          Tap Away.
        </h1>
      </div>

      {/* =========================================================================
          BOTTOM: ACTION BUTTON & CONTROLS (Mobile Safe Area & Tablet Centered)
          ========================================================================= */}
      <div className="relative z-30 w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto px-6 sm:px-8">
        <button
          type="button"
          onClick={handleNext}
          className="w-full h-[52px] min-[400px]:h-[56px] rounded-none bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 text-primary-foreground font-semibold text-[17px] min-[400px]:text-[18px] md:text-[19px] shadow-xl shadow-primary/30 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40"
          aria-label="Next"
        >
          <span className="tracking-wide">Next</span>

          {/* Sequential Animated Chevrons */}
          <div className="flex items-center gap-[2px] ml-0.5 text-white">
            <span className="animate-chevron-1 inline-flex items-center">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
            <span className="animate-chevron-2 inline-flex items-center">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
            <span className="animate-chevron-3 inline-flex items-center">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
          </div>
        </button>
      </div>
    </div>
  )
}

export const OnboardingPage = OnboardingScreen
export default OnboardingScreen

