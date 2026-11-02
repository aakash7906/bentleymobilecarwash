import React from 'react'
import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean
}

/**
 * Base reusable Skeleton element with optional shimmer effect
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  shimmer = true,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-md bg-gray-200/80 relative overflow-hidden',
        shimmer
          ? 'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.6s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent'
          : 'animate-pulse',
        className
      )}
      {...props}
    />
  )
}

/**
 * Full page skeleton matching User Home Page (HomeTab.tsx)
 */
export const HomeTabSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col w-full pb-28 sm:pb-32 select-none animate-in fade-in duration-300">
      {/* 1. Header Skeleton */}
      <div className="screen-padding pt-3 sm:pt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Skeleton className="h-9 sm:h-11 w-11 sm:w-14 rounded-xl" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-28 sm:w-36 rounded" />
            <Skeleton className="h-2.5 w-20 sm:w-28 rounded" />
          </div>
        </div>
        <Skeleton className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-xl shrink-0" />
      </div>

      {/* 2. Location Bar Skeleton */}
      <div className="screen-padding mt-2.5 sm:mt-3">
        <div className="w-full bg-surface-alt border border-gray-200/60 rounded-xl py-2 px-3 sm:px-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 mr-2">
            <Skeleton className="w-4 h-4 rounded-full shrink-0" />
            <Skeleton className="h-3.5 w-44 rounded" />
          </div>
          <Skeleton className="w-14 h-5 rounded-md shrink-0" />
        </div>
      </div>

      {/* 3. Hero Header Section Skeleton */}
      <div className="screen-padding mt-4 sm:mt-5 flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-5 sm:h-6 w-48 sm:w-64 rounded-md" />
          <Skeleton className="h-4 sm:h-5 w-32 sm:w-44 rounded-md" />
        </div>
        <Skeleton className="h-8 w-22 sm:w-26 rounded-xl shrink-0" />
      </div>

      {/* 4. Vehicle Dropdown Selector Skeleton */}
      <div className="screen-padding mt-3">
        <Skeleton className="w-full h-11 rounded-2xl" />
      </div>

      {/* 5. Category Quick Grid Skeleton (4 Cards) */}
      <div className="screen-padding mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-3 rounded-2xl bg-surface-alt border border-gray-200/60 flex flex-col items-center justify-between gap-2 h-28"
          >
            <Skeleton className="h-3.5 w-20 rounded" />
            <Skeleton className="h-14 w-20 rounded-xl" />
          </div>
        ))}
      </div>

      {/* 6. Recommended For You Carousel Skeleton */}
      <div className="mt-6">
        <div className="screen-padding flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-40 rounded-md" />
          <Skeleton className="h-3.5 w-12 rounded" />
        </div>
        <div className="screen-padding flex gap-3 overflow-hidden">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="min-w-[260px] sm:min-w-[300px] flex-1 rounded-3xl bg-surface-alt border border-gray-200/60 p-3.5 flex flex-col gap-3"
            >
              <Skeleton className="h-36 w-full rounded-2xl" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-14 rounded" />
              </div>
              <Skeleton className="h-3 w-40 rounded" />
              <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-6 w-20 rounded" />
                <Skeleton className="h-9 w-24 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Shop Products Grid Skeleton */}
      <div className="screen-padding mt-6">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-36 rounded-md" />
          <Skeleton className="h-3.5 w-14 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-3 rounded-2xl bg-surface-alt border border-gray-200/60 flex flex-col gap-2.5"
            >
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-8 w-full rounded-lg mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Full page skeleton matching Driver Dashboard (DriverDashboardPage.tsx)
 */
export const DriverDashboardSkeleton: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-gray-50/70 pb-28 select-none animate-in fade-in duration-300">
      {/* 1. Driver Header Skeleton */}
      <div className="bg-white border-b border-gray-200/80 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Skeleton className="h-9 sm:h-10 w-11 sm:w-12 rounded-xl" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-28 sm:w-36 rounded" />
            <Skeleton className="h-2.5 w-18 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="w-9 h-9 rounded-full" />
        </div>
      </div>

      {/* 2. Driver Stats Grid Skeleton */}
      <div className="px-4 sm:px-6 mt-4 grid grid-cols-3 gap-2.5 sm:gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-3 sm:p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex flex-col gap-1.5 items-center justify-center text-center"
          >
            <Skeleton className="h-3 w-14 rounded" />
            <Skeleton className="h-5 sm:h-6 w-16 rounded-md" />
            <Skeleton className="h-2.5 w-12 rounded" />
          </div>
        ))}
      </div>

      {/* 3. Tab Filter Bar Skeleton */}
      <div className="px-4 sm:px-6 mt-4 flex items-center gap-2">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 flex-1 rounded-xl" />
      </div>

      {/* 4. Requests / Orders List Skeleton */}
      <div className="px-4 sm:px-6 mt-4 flex flex-col gap-3.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col gap-3"
          >
            {/* Order Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <Skeleton className="h-6 w-16 rounded-md" />
            </div>

            {/* Service & Customer */}
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-44 rounded" />
              <div className="flex items-center gap-2">
                <Skeleton className="w-3.5 h-3.5 rounded-full" />
                <Skeleton className="h-3 w-32 rounded" />
              </div>
            </div>

            {/* Address */}
            <div className="bg-surface-subtle p-3 rounded-2xl flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded-full shrink-0" />
              <Skeleton className="h-3.5 w-full rounded" />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-11 flex-1 rounded-xl" />
              <Skeleton className="h-11 w-24 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
