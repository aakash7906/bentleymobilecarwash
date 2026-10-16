import React, { useState } from 'react'
import onboardingTruckBg from '@/assets/onboarding/onboarding-truck-bg.png'

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
    setIsExiting(true)
    setTimeout(() => {
      onNext()
    }, 280)
  }

  return (
    <div
      className={`fixed inset-0 z-[9998] flex items-center justify-center bg-black transition-opacity duration-300 ease-out ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 
        Responsive Mobile App Container matching the app frame:
        - 100dvh on mobile
        - Framed smartphone view with rounded borders on desktop/tablet
      */}
      <div className="relative w-full max-w-[390px] h-full min-h-[100dvh] sm:min-h-0 sm:h-[844px] sm:max-h-[94vh] sm:rounded-[36px] overflow-hidden select-none bg-black shadow-2xl">
        {/* Full Screen Image: Silver Ford Truck with "A Spotless Car Shine, Just a Tap Away." */}
        <img
          src={onboardingTruckBg}
          alt="A Spotless Car Shine, Just a Tap Away."
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        />

        {/* Interactive "Next >>>" Button Hit Area & Touch Feedback */}
        <div className="absolute left-[24px] right-[24px] bottom-[54px] z-30">
          <button
            type="button"
            onClick={handleNext}
            className="w-full h-[52px] rounded-xl bg-transparent hover:bg-white/10 active:bg-black/20 active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Next"
          />
        </div>
      </div>
    </div>
  )
}

export default OnboardingScreen
