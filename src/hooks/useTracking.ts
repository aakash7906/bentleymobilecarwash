import { useState, useEffect } from 'react'

export interface VanTrackingStep {
  step: number
  title: string
  detail: string
  completed: boolean
  current: boolean
  timestamp: string
}

export function useTracking(initialStep = 2) {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep)

  const steps: VanTrackingStep[] = [
    {
      step: 1,
      title: 'Appointment Confirmed',
      detail: 'Assigned Van #04 - Marcus R. (Master Detailer)',
      completed: currentStepIndex >= 1,
      current: currentStepIndex === 1,
      timestamp: '08:45 AM',
    },
    {
      step: 2,
      title: 'Mobile Unit En Route',
      detail: 'Van loaded with deionized water & equipment. ETA 12 mins.',
      completed: currentStepIndex >= 2,
      current: currentStepIndex === 2,
      timestamp: '09:18 AM',
    },
    {
      step: 3,
      title: 'Arrived On-Site & Setup',
      detail: 'Vehicle walk-around inspection & prep completed.',
      completed: currentStepIndex >= 3,
      current: currentStepIndex === 3,
      timestamp: '09:32 AM',
    },
    {
      step: 4,
      title: 'Detailing In Progress',
      detail: 'Paint decontamination, leather conditioning & sealant cure.',
      completed: currentStepIndex >= 4,
      current: currentStepIndex === 4,
      timestamp: '10:05 AM',
    },
    {
      step: 5,
      title: 'White Glove Final Inspection',
      detail: 'Handover complete. Keys returned with scent card.',
      completed: currentStepIndex >= 5,
      current: currentStepIndex === 5,
      timestamp: '10:55 AM',
    },
  ]

  const nextStep = () => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length))
  }

  const prevStep = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 1))
  }

  return {
    currentStepIndex,
    steps,
    nextStep,
    prevStep,
    setCurrentStepIndex,
  }
}
