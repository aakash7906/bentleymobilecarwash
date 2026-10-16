import React, { useState, useRef, useEffect, useCallback } from 'react'
import onboardingBg from '@/assets/onboarding/onboarding-car-bg.png'
import sliderHandleImg from '@/assets/onboarding/slider-handle.png'

export interface OnboardingScreenProps {
  /**
   * Callback fired when user completes onboarding (drags to right or clicks next)
   */
  onNext: () => void
  /**
   * Optional callback to go back
   */
  onBack?: () => void
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onNext,
}) => {
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const trackRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const currentDragXRef = useRef(0)
  const maxDragRef = useRef(260)

  // Calculate available drag width adaptively on mount and window resize
  useEffect(() => {
    const updateMaxDrag = () => {
      if (trackRef.current) {
        const trackWidth = trackRef.current.clientWidth
        // 48px handle + 4px padding each side = 56px
        maxDragRef.current = Math.max(80, trackWidth - 56)
      }
    }
    updateMaxDrag()
    window.addEventListener('resize', updateMaxDrag)
    return () => window.removeEventListener('resize', updateMaxDrag)
  }, [])

  const triggerNext = useCallback(() => {
    setIsCompleted(true)
    setIsExiting(true)
    setTimeout(() => {
      onNext()
    }, 350)
  }, [onNext])

  // Mouse & Touch Drag Handlers
  const handlePointerDown = (clientX: number) => {
    if (isCompleted) return
    setIsDragging(true)
    startXRef.current = clientX - currentDragXRef.current
  }

  const handlePointerMove = useCallback(
    (clientX: number) => {
      if (!isDragging || isCompleted) return
      const max = maxDragRef.current
      const newX = Math.max(0, Math.min(max, clientX - startXRef.current))
      currentDragXRef.current = newX
      setDragX(newX)

      // If dragged 90% across, auto trigger
      if (newX >= max * 0.92) {
        setIsDragging(false)
        setDragX(max)
        triggerNext()
      }
    },
    [isDragging, isCompleted, triggerNext]
  )

  const handlePointerUp = useCallback(() => {
    if (!isDragging || isCompleted) return
    setIsDragging(false)
    const max = maxDragRef.current
    // Threshold: 68% of slider distance
    if (currentDragXRef.current >= max * 0.68) {
      setDragX(max)
      triggerNext()
    } else {
      // Spring reset
      currentDragXRef.current = 0
      setDragX(0)
    }
  }, [isDragging, isCompleted, triggerNext])

  // Global listeners for smooth dragging outside element bounds
  useEffect(() => {
    if (!isDragging) return

    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX)
    const onMouseUp = () => handlePointerUp()
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handlePointerMove(e.touches[0].clientX)
    }
    const onTouchEnd = () => handlePointerUp()

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [isDragging, handlePointerMove, handlePointerUp])

  // Drag progress percentage (0 to 1)
  const dragProgress = maxDragRef.current > 0 ? dragX / maxDragRef.current : 0

  return (
    <div
      className={`fixed inset-0 z-[9998] flex items-center justify-center bg-black transition-opacity duration-350 ease-out ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 
        Mobile-First Screen Container:
        - h-[100dvh] (dynamic viewport height) prevents browser address bar tearing / overflow
        - w-full on mobile, max-w-md on tablet/desktop
        - flex flex-col justify-between provides natural, responsive vertical spacing on any phone
      */}
      <div className="relative w-full max-w-md h-[100dvh] overflow-hidden select-none bg-black flex flex-col justify-between p-6 sm:p-8 shadow-2xl">
        {/* Background: Cinematic Porsche Sports Car with reflections (top status bar removed) */}
        <img
          src={onboardingBg}
          alt="Bentley Mobile Wash Onboarding"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        />

        {/* Subtle Dark Vignette at Top and Bottom for Text & Slider Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/75 pointer-events-none" />

        {/* =========================================================================
            TOP: HEADING TYPOGRAPHY
            Fluid, responsive typography in Google Font 'Urbanist'
            Adapts smoothly to small and large mobile viewports without collision
            ========================================================================= */}
        <div className="relative z-20 pt-10 sm:pt-14 max-w-[310px] pointer-events-none">
          <h1
            className="font-urbanist font-semibold text-[32px] sm:text-[36px] leading-[1.2] text-white tracking-[-0.02em] select-none drop-shadow-md"
            style={{
              fontFamily: "'Urbanist', sans-serif",
            }}
          >
            The Spirit of
            <br />
            Performance,
            <br />
            Customization,
            <br />
            and Personality.
          </h1>
        </div>

        {/* =========================================================================
            BOTTOM: INTERACTIVE DRAG-TO-RIGHT "NEXT" SLIDER
            Adaptive width, smooth physics, touch & mouse drag
            ========================================================================= */}
        <div className="relative z-30 pb-4 sm:pb-6 w-full max-w-[340px] mx-auto">
          {/* Slider Pill Track */}
          <div
            ref={trackRef}
            className="relative h-[56px] w-full rounded-full bg-[#1b1f24]/85 backdrop-blur-md border border-white/25 shadow-2xl p-1 flex items-center select-none overflow-hidden cursor-pointer"
            onClick={(e) => {
              // Clicking near right side also advances for accessibility
              const rect = e.currentTarget.getBoundingClientRect()
              if (e.clientX - rect.left > rect.width * 0.45) {
                triggerNext()
              }
            }}
          >
            {/* Dynamic Active Progress Track Fill */}
            <div
              className="absolute left-1 top-1 bottom-1 rounded-full bg-red-600/35 pointer-events-none transition-all duration-75"
              style={{
                width: `${dragX + 48}px`,
              }}
            />

            {/* Centered "Next" Text & Right Chevrons */}
            <div
              className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none transition-opacity duration-150"
              style={{
                opacity: Math.max(0.15, 1 - dragProgress * 1.3),
              }}
            >
              {/* Spacer so Next is centered */}
              <div className="w-10" />

              {/* Next Label */}
              <span className="font-urbanist text-[17px] font-semibold text-white tracking-wide">
                Next
              </span>

              {/* Triple Animated Chevrons: >>> */}
              <div className="flex items-center text-white/90 text-sm font-bold tracking-tighter">
                <span className="animate-chevron-1">›</span>
                <span className="animate-chevron-2">›</span>
                <span className="animate-chevron-3">›</span>
              </div>
            </div>

            {/* 
              Draggable Circular Red Button Handle 
              Contains sports car graphic
            */}
            <div
              className={`relative z-10 w-[48px] h-[48px] rounded-full bg-red-600 shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing transform transition-transform ${
                isDragging ? 'scale-105 shadow-red-500/50' : 'scale-100 hover:scale-102'
              }`}
              style={{
                transform: `translateX(${dragX}px)`,
                transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
                handlePointerDown(e.clientX)
              }}
              onTouchStart={(e) => {
                e.stopPropagation()
                if (e.touches[0]) handlePointerDown(e.touches[0].clientX)
              }}
            >
              {/* Red button circular glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-red-700 to-red-500 shadow-inner" />

              {/* Convertible Sports Car Icon */}
              <img
                src={sliderHandleImg}
                alt="Car Icon"
                className="w-full h-full object-contain p-0.5 relative z-10 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Bottom subtle home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 w-32 h-1 bg-white/70 rounded-full pointer-events-none" />
      </div>
    </div>
  )
}

export default OnboardingScreen
