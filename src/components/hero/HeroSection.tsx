import React from 'react'
import { BUSINESS_INFO } from '@/data/mockData'
import heroRealisticBg from '@/assets/hero-realistic-bg.jpg'

interface HeroSectionProps {
  onScheduleWash: () => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onScheduleWash }) => {
  return (
    <section
      id="home"
      className="relative w-full overflow-hidden scroll-mt-32 min-h-screen pt-32 sm:pt-36 lg:pt-40 pb-16 lg:pb-20 flex items-center"
    >
      {/* 1. Photorealistic Mobile Car Wash Background with Blur */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src={heroRealisticBg}
          alt="Professional Mobile Car Wash and Detailing Service in Kelowna, BC"
          className="w-full h-full object-cover object-[75%_center] lg:object-[65%_center] select-none filter blur-[1.5px] scale-102 transform"
        />

        {/* Cinematic dark contrast vignette on the left for maximum text legibility & punch */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 via-45% to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent via-20% to-transparent pointer-events-none" />
      </div>

      {/* 2. Left-Placed & Left-Aligned Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-start">
        <div className="max-w-xl lg:max-w-2xl flex flex-col items-start text-left gap-5 sm:gap-6 z-10 py-10 sm:py-14">
          {/* Main Headline with high-contrast text */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[62px] font-black text-white tracking-tight leading-[1.08] text-left drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
            <span>A Clean Car Is</span>
            <br />
            <span className="relative inline-block text-[#ff4d4f] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] mt-1">
              A Happy Car
              <span className="absolute -bottom-1.5 left-0 w-full h-[4px] bg-[#dc2626] shadow-[0_0_12px_rgba(220,38,38,0.8)] rounded-full" />
            </span>
          </h1>

          {/* Subtitle with high-contrast bright text */}
          <p className="text-sm sm:text-base md:text-lg text-white/95 font-medium max-w-xl leading-relaxed text-left drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
            Premium, environmentally friendly mobile car wash &amp; precision detailing brought directly to your doorstep in Kelowna, BC. We do the work while you live your life.
          </p>

          {/* Action Buttons (CTAs) */}
          <div className="flex flex-wrap items-center justify-start gap-3.5 sm:gap-4 pt-2">
            <button
              onClick={onScheduleWash}
              className="bg-primary-container hover:bg-primary text-on-primary font-bold text-sm sm:text-base px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl shadow-[0_8px_24px_rgba(220,38,38,0.45)] hover:shadow-[0_12px_28px_rgba(220,38,38,0.6)] transition-all flex items-center gap-2 transform hover:-translate-y-0.5 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">calendar_month</span>
              <span>Schedule a Wash</span>
            </button>

            <a
              href={`tel:${BUSINESS_INFO.phoneTel}`}
              className="bg-white hover:bg-surface-container-low text-gray-900 font-bold text-sm sm:text-base px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 border border-white/60 backdrop-blur-md transform hover:-translate-y-0.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-primary-container text-[20px] sm:text-[22px]">call</span>
              <span>{BUSINESS_INFO.phone}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
