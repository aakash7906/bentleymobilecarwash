import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const ANDROID_PACKAGE = 'com.uxdlab.bentelyMobileAutoDetailCarWash'
const IOS_BUNDLE_ID = 'com.uxdlab.bentlycarwash'

export const SmartAppBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [storeUrl, setStoreUrl] = useState('')
  const [platform, setPlatform] = useState<'android' | 'ios' | null>(null)

  useEffect(() => {
    // Only show on mobile devices
    const userAgent = navigator.userAgent || ''
    const isAndroid = /Android/i.test(userAgent)
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent)

    if (!isAndroid && !isIOS) return

    // Check if dismissed in this session
    try {
      if (sessionStorage.getItem('bentley_app_banner_dismissed') === 'true') {
        return
      }
    } catch {}

    if (isAndroid) {
      setPlatform('android')
      setStoreUrl(`https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`)
      setIsVisible(true)
    } else if (isIOS) {
      setPlatform('ios')
      setStoreUrl(`https://apps.apple.com/app/${IOS_BUNDLE_ID}`)
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    try {
      sessionStorage.setItem('bentley_app_banner_dismissed', 'true')
    } catch {}
  }

  const handleOpenApp = () => {
    if (platform === 'android') {
      // Try opening the native app via Android Intent, fallback to Play Store
      const intentUrl = `intent://bentleymobilecarwash.pages.dev${window.location.search}#Intent;scheme=https;package=${ANDROID_PACKAGE};S.browser_fallback_url=${encodeURIComponent(storeUrl)};end;`
      window.location.href = intentUrl
    } else if (platform === 'ios') {
      // Try custom scheme, fallback to App Store
      window.location.href = storeUrl
    }
  }

  if (!isVisible) return null

  return (
    <div className="w-full bg-[#0f172a] text-white px-3 py-2.5 flex items-center justify-between gap-2.5 text-xs shadow-md border-b border-gray-800 z-50 animate-in slide-in-from-top duration-200">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
          aria-label="Close app banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <img
          src="/favicon.png"
          alt="Bentley App"
          className="w-9 h-9 rounded-xl object-contain bg-white/10 p-1 border border-white/10 shrink-0"
        />

        <div className="flex flex-col min-w-0 leading-tight">
          <span className="font-extrabold text-white text-[12px] truncate">
            Bentley Car Wash App
          </span>
          <span className="text-[10px] text-gray-300 truncate">
            {platform === 'android' ? 'Available on Google Play' : 'Available on App Store'}
          </span>
        </div>
      </div>

      <button
        onClick={handleOpenApp}
        className="px-3.5 py-1.5 rounded-full bg-primary hover:bg-primary-hover text-white text-[11px] font-bold tracking-wide shrink-0 transition-all shadow-sm active:scale-95 cursor-pointer"
      >
        OPEN APP
      </button>
    </div>
  )
}
