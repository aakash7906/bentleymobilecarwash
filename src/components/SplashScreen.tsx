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
        Responsive Mobile App Container matching the main application canvas.
        Full viewport on mobile (100dvh), framed smartphone view on desktop.
      */}
      <div className="relative w-full max-w-md h-full min-h-[100dvh] sm:min-h-0 sm:h-[844px] sm:max-h-[92vh] sm:rounded-[36px] overflow-hidden shadow-2xl select-none bg-black cursor-pointer flex flex-col justify-end">
        {/* Base Image: Cockpit POV, Speed Tunnel, Bentley Emblem */}
        <img
          src={splashExactBg}
          alt="Bentley Mobile Wash Splash Screen"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        />

        {/* 
          Live Animated 8-Spoke Activity Indicator (Loader)
          Cleanly positioned in lower cockpit dashboard center, always perfectly aligned
        */}
        <div className="relative z-20 pointer-events-none flex items-center justify-center pb-16 sm:pb-20">
          <svg
            className="w-[36px] h-[36px] drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]"
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
      </div>
    </div>
  )
}

export default SplashScreen
