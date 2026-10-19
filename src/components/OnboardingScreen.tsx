import React, { useState } from 'react'
import truckWashBg from '@/assets/onboarding/truck-wash-clean.png'

export interface OnboardingScreenProps {
  /**
   * Callback fired when user clicks Next
   */
  onNext: () => void
  /**
   * Optional callback to go back
   */
  onBack?: () => void
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onNext }) => {
  const [isExiting, setIsExiting] = useState(false)

  const handleNext = () => {
    onNext()
  }

  return (
    <div
      className={`fixed inset-0 z-[9998] flex items-center justify-center bg-secondary/80 backdrop-blur-sm transition-opacity duration-300 ease-out ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 
        Responsive Mobile & Tablet App Container:
        - 100dvh on mobile
        - Fluid width up to max-w-md on mobile, md:max-w-xl on tablets to match the app frame
        - Framed smartphone/tablet view with rounded corners on desktop/tablet
      */}
      <div className="relative w-full max-w-md md:max-w-xl h-full min-h-[100dvh] sm:min-h-0 sm:h-[844px] md:h-[880px] sm:max-h-[94vh] sm:rounded-[36px] overflow-hidden select-none bg-secondary shadow-2xl flex flex-col justify-between p-5 min-[400px]:p-6 pb-10 min-[400px]:pb-14 sm:pb-16">
        {/* Full Screen Image: Clean Ford Truck with Water & Foam Wash */}
        <img
          src={truckWashBg}
          alt="Bentley Mobile Car Wash"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        />

        {/* Subtle Dark Vignette Gradients for High Readability across all aspect ratios */}
        <div className="absolute inset-x-0 top-0 h-72 sm:h-80 md:h-96 bg-gradient-to-b from-black/85 via-black/45 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-64 sm:h-72 md:h-80 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

        {/* =========================================================================
            TOP: HEADING TYPOGRAPHY
            Fluid typography adapting cleanly to small phones, modern phones, and tablets
            ========================================================================= */}
        <div className="relative z-20 pt-12 min-[400px]:pt-14 sm:pt-16 md:pt-20 px-2 sm:px-4 pointer-events-none">
          <h1
            className="font-medium text-white text-[32px] min-[370px]:text-[36px] min-[420px]:text-[40px] md:text-[44px] leading-[1.18] sm:leading-[1.2] tracking-normal select-none"
            style={{
              fontFamily: "'Urbanist', 'Plus Jakarta Sans', sans-serif",
              textShadow:
                '0.75px 0.75px 0px var(--primary), 1.3px 1.3px 0px var(--primary), 0px 2px 5px rgba(0, 0, 0, 0.45)',
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
            BOTTOM: NEXT BUTTON
            Sharp-cornered rectangular button raised upward with fluid responsive width
            ========================================================================= */}
        <div className="relative z-30 w-full max-w-[340px] min-[420px]:max-w-[370px] md:max-w-[420px] mx-auto mb-2 sm:mb-4">
          <button
            type="button"
            onClick={handleNext}
            className="w-full h-[50px] min-[400px]:h-[54px] rounded-none bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 text-primary-foreground font-semibold text-[17px] min-[400px]:text-[18px] md:text-[19px] shadow-lg shadow-primary/25 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40"
            aria-label="Next"
          >
            <span className="tracking-wide">Next</span>

            {/* Blinking / Moving Sequential Chevrons */}
            <div className="flex items-center gap-[1px] ml-0.5 text-white">
              <span className="animate-chevron-1 inline-flex items-center">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
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
                  strokeWidth="2.4"
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
                  strokeWidth="2.4"
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
    </div>
  )
}

export default OnboardingScreen
