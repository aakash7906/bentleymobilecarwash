import React, { useEffect, useState } from 'react'
import logoBentley from '@/assets/splash/bentley-logo-hd.png'

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

  // 8 radial spokes matching authentic circulating activity indicator
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
      className={`fixed inset-0 z-[9999] w-full h-full min-h-screen flex items-center justify-center select-none cursor-pointer overflow-hidden transition-opacity duration-300 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      onClick={handleDismiss}
      title={dismissible ? 'Tap anywhere to continue' : undefined}
      style={{
        background:
          'radial-gradient(circle at 50% 48%, var(--surface-subtle) 0%, var(--bg-canvas) 60%, var(--border-light) 100%)',
      }}
    >
      {/*
        Full Screen Responsive Splash Container:
        - 100% width and 100% height across all mobile, tablet, iPad, and desktop viewports
        - Zero letterboxing, zero outer gray frames or borders
      */}
      <div className="relative w-full h-full min-h-screen flex flex-col items-center justify-center p-6">
        {/* Center Section: HD Mascot Logo */}
        <div className="flex flex-col items-center justify-center w-full flex-1 relative px-4">
          <div className="w-60 min-[380px]:w-68 sm:w-80 md:w-96 max-w-[82%] flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
            <img
              src={logoBentley}
              alt="Bentley Mobile Auto Detail Car Wash"
              className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
            />
          </div>

          {/* Primary Circulating Activity Indicator: Driven by text-primary token */}
          <div className="absolute bottom-28 min-[400px]:bottom-36 sm:bottom-40 md:bottom-44 flex items-center justify-center">
            <svg
              className="w-9 h-9 min-[400px]:w-10 min-[400px]:h-10 text-primary"
              viewBox="0 0 36 36"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Loading..."
            >
              <g>
                {/* Native SVG rotation around center (18, 18) for smooth 60fps spinning */}
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 18 18"
                  to="360 18 18"
                  dur="0.9s"
                  repeatCount="indefinite"
                />
                {spokes.map((spoke, idx) => (
                  <rect
                    key={idx}
                    x="16.25"
                    y="3.5"
                    width="3.5"
                    height="9"
                    rx="1.75"
                    fill="currentColor"
                    opacity={spoke.opacity}
                    transform={`rotate(${spoke.rotate} 18 18)`}
                  />
                ))}
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SplashScreen
