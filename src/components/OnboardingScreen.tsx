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
  const maxDragRef = useRe  const maxDragRef = useRef(268)

  // Calculate available drag width on mount and resize
  useEffect(() => {
    const updateMaxDrag = () => {
      if (trackRef.current) {
        const trackWidth = trackRef.current.clientWidth
        // 48px handle + 4px padding each side = 56px
        maxDragRef.current = Math.max(100, trackWidth - 56)
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
    // Threshold: 70% of slider distance
    if (currentDragXRef.current >= max * 0.7) {
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
      className={`fixed inset-0 z-[9998] flex items-center justify-center bg-black transition-opacity duration-350 ease-out ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
    >
      {/* 
        Standard 375px x 812px iPhone Container
        Matches exact Figma specification
      */}
      <div
        className="relative w-full max-w-[375px] h-[812px] max-h-screen overflow-hidden shadow-2xl select-none bg-black flex flex-col"
        style={{
          aspectRatio: '375 / 812',
        }}
      >
        {/* Background: Cinematic Porsche Sports Car with reflections */}
        <img
          src={onboardingBg}
          alt="Bentley Mobile Wash Onboarding"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Subtle Dark Vignette at Top for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/75 pointer-events-none" />

        {/* =========================================================================
            TOP: IPHONE STATUS BAR (Top: 0px, Height: 44px)
            ========================================================================= */}
        <div
          className="absolute top-0 left-0 right-0 h-[44px] z-30 flex items-center justify-between px-6 pointer-events-none"
          style={{ width: '100%' }}
        >
          {/* Time: 9:41 */}
          <span className="text-[15px] font-semibold tracking-tight text-white font-sans drop-shadow-sm">
            9:41
          </span>

          {/* Right: Cellular, Wi-Fi, Battery */}
          <div className="flex items-center gap-1.5 text-white">
            {/* 4 stepped cellular bars */}
            <div className="flex items-end gap-[1.5px] h-[10.67px] mr-0.5">
              <span className="w-[3px] h-[4px] bg-white rounded-[0.5px]" />
              <span className="w-[3px] h-[6px] bg-white rounded-[0.5px]" />
              <span className="w-[3px] h-[8.33px] bg-white rounded-[0.5px]" />
              <span className="w-[3px] h-[10.67px] bg-white rounded-[0.5px]" />
            </div>

            {/* Wi-Fi Icon */}
            <svg
              className="w-[15.3px] h-[11px] fill-current"
              viewBox="0 0 16 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8 12C9.10457 12 10 11.1046 10 10C10 8.89543 9.10457 8 8 8C6.89543 8 6 8.89543 6 10C6 11.1046 6.89543 12 8 12ZM12.7279 6.2721C11.4721 5.0163 9.7721 4.228 7.99997 4.228C6.22784 4.228 4.52784 5.0163 3.27204 6.2721C2.97915 6.565 2.50428 6.565 2.21138 6.2721C1.91849 5.97921 1.91849 5.50434 2.21138 5.21144C3.74317 3.67966 5.81934 2.7143 7.99997 2.7143C10.1806 2.7143 12.2568 3.67966 13.7886 5.21144C14.0815 5.50434 14.0815 5.97921 13.7886 6.2721C13.4957 6.565 13.0208 6.565 12.7279 6.2721ZM15.799 3.201C13.7313 1.13334 10.9313 0 7.99997 0C5.06864 0 2.26864 1.13334 0.200947 3.201C-0.0669824 3.46893 -0.0669824 3.9038 0.200947 4.17173C0.468877 4.43966 0.903748 4.43966 1.17168 4.17173C3.00067 2.34274 5.43867 1.4143 7.99997 1.4143C10.5613 1.4143 12.9993 2.34274 14.8283 4.17173C15.0962 4.43966 15.5311 4.43966 15.799 4.17173C16.0669 3.9038 16.0669 3.46893 15.799 3.201Z"
                fill="white"
              />
            </svg>

            {/* Battery Icon */}
            <div className="relative flex items-center ml-0.5">
              <div className="w-[22px] h-[11.33px] rounded-[2.67px] border border-white/40 p-[1.5px] flex items-center">
                <div className="w-[15px] h-[6.5px] bg-white rounded-[1.33px]" />
              </div>
              <div className="w-[1.33px] h-[4px] bg-white/40 rounded-r-[1px] ml-[1px]" />
            </div>
          </div>
        </div>

        {/* =========================================================================
            HEADING TYPOGRAPHY
            Exact Figma Specification:
            position: absolute; width: 260px; height: 172px; left: 26px; top: 87px;
            font-family: 'Urbanist'; font-weight: 600; font-size: 36px; line-height: 43px;
            color: #FFFFFF;
            ========================================================================= */}
        <div
          className="absolute z-20 pointer-events-none flex flex-col justify-center animate-fade-in"
          style={{
            left: '26px',
            top: '87px',
            width: '260px',
            height: '172px',
          }}
        >
          <h1
            className="font-urbanist font-semibold text-[36px] leading-[43px] text-white tracking-[-0.02em] select-none"
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
            Where user drags red car circular button to the right to proceed
            ========================================================================= */}
        <div
          className="absolute z-30 left-1/2 -translate-x-1/2 w-[324px]"
          style={{
            bottom: '52px',
          }}
        >
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
              className={`relative z-10 w-[48px] h-[48px] rounded-full bg-red-600 shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing transform transition-transform ${isDragging ? 'scale-105 shadow-red-500/50' : 'scale-100 hover:scale-102'
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

        {/* =========================================================================
            BOTTOM: IPHONE HOME INDICATOR
            width: 134px; height: 5px; bottom: 8px;
            ========================================================================= */}
        <div
          className="absolute z-30 bg-white rounded-full pointer-events-none shadow-sm left-1/2 -translate-x-1/2"
          style={{
            width: '134px',
            height: '5px',
            bottom: '8px',
          }}
        />
