import React, { useEffect, useState } from 'react'
import splashExactBg from '@/assets/splash/splash-exact-bg.png'

export interface SplashScreenProps {
  /**
   * Callback fired when the splash sequence finishes or is dismissed
   */
  onFinish?: () => void
  /**
   * Auto dismiss duration in milliseconds (default: 3000ms)
   */
  duration?: number
  /**
   * Allow user to tap/click anywhere to skip immediately
   */
  dismissible?: boolean
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  duration = 3000,
  dismissible = true,
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isFadingOut, setIsFadingOut] = useState(false)

  useEffect(() => {
    if (!duration || duration <= 0) return

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true)
    }, duration - 400)

    const finishTimer = setTimeout(() => {
      setIsVisible(false)
      onFinish?.()
    }, duration)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(finishTimer)
    }
  }, [duration, onFinish])

  const handleDismiss = () => {
    if (!dismissible) return
    setIsFadingOut(true)
    setTimeout(() => {
      setIsVisible(false)
      onFinish?.()
    }, 300)
  }

  if (!isVisible) return null

  // 8 radial spokes matching authentic Figma iOS Activity Indicator
  const spokes = [
    { rotate: 0, opacity: 1.0 },
    { rotate: 45, opacity: 0.875 },
    { rotate: 90, opacity: 0.75 },
    { rotate: 135, opacity: 0.625 },
    { rotate: 180, opacity: 0.5 },
    { rotate: 225, opacity: 0.375 },
    { rotate: 270, opacity: 0.25 },
    { rotate: 315, opacity: 0.125 },
  ]

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-300 ease-in-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      onClick={handleDismiss}
      title={dismissible ? 'Tap anywhere to continue' : undefined}
    >
      {/* 
        Mobile-Friendly Screen Container:
        - 100dvh (dynamic viewport height) ensures no tearing, overflowing or clipping on real phones
        - w-full on mobile, max-w-md on tablet/desktop with smooth centering
      */}
      <div className="relative w-full max-w-md h-[100dvh] overflow-hidden select-none bg-black cursor-pointer flex flex-col justify-between shadow-2xl">
        {/* Clean Background Image (Status bar removed from top) */}
        <img
          src={splashExactBg}
          alt="Bentley Mobile Wash Splash Screen"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        />

        {/* Top spacer (Status bar removed - native device status bar displays naturally) */}
        <div className="relative z-10 w-full h-12" />

        {/* 
          Bottom: Live Animated 8-Spoke Activity Indicator (Loader)
          Positioned adaptively in the lower cockpit area between the driver's knees
        */}
        <div className="relative z-20 pb-20 sm:pb-24 flex items-center justify-center pointer-events-none w-full">
          <svg
            className="w-9 h-9 drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]"
            viewBox="0 0 36 36"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g>
              {/* Native SVG rotation around center (18, 18) for flawless 60fps spinning */}
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 18 18"
                to="360 18 18"
                dur="1s"
                repeatCount="indefinite"
              />
              {spokes.map((spoke, idx) => (
                <rect
                  key={idx}
                  x="16.5"
                  y="4.5"
                  width="3"
                  height="8.5"
                  rx="1.5"
                  fill="#FFFFFF"
                  opacity={spoke.opacity}
                  transform={`rotate(${spoke.rotate} 18 18)`}
                />
              ))}
            </g>
          </svg>
        </div>

        {/* Bottom subtle home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 w-32 h-1 bg-white/70 rounded-full pointer-events-none" />
      </div>
    </div>
  )
}

export default SplashScreen
