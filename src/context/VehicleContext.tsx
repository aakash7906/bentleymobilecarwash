import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  deleteField,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { SavedVehicle } from '@/types'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

export interface VehicleContextType {
  savedVehicles: SavedVehicle[]
  currentVehicle: string
  setSavedVehicles: React.Dispatch<React.SetStateAction<SavedVehicle[]>>
  setCurrentVehicle: React.Dispatch<React.SetStateAction<string>>
  handleVehicleAdded: (newVehicle: SavedVehicle) => Promise<void>
  handleSelectVehicle: (vehicleName: string, vehicleId?: string) => Promise<void>
  handleDeleteVehicle: (vehicleId: string) => Promise<void>
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined)

export const useVehicles = (): VehicleContextType => {
  const context = useContext(VehicleContext)
  if (!context) {
    throw new Error('useVehicles must be used within a VehicleProvider')
  }
  return context
}

export const VehicleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfileData, isDeletingAccountRef } = useAuth()
  const { showToast } = useToast()

  const [savedVehicles, setSavedVehicles] = useState<SavedVehicle[]>(() => {
    try {
      const stored = localStorage.getItem('bentley_saved_vehicles')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          return parsed.filter((v) => v && v.id !== 'veh-1' && v.id !== 'veh-2')
        }
      }
    } catch {}
    return []
  })

  const [currentVehicle, setCurrentVehicle] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('bentley_active_vehicle')
      if (stored && stored !== 'Audi A4 (5th Gen Facelift)') return stored
    } catch {}
    return ''
  })

  // Sync savedVehicles with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bentley_saved_vehicles', JSON.stringify(savedVehicles))
    } catch {}
  }, [savedVehicles])

  // Sync currentVehicle with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bentley_active_vehicle', currentVehicle)
    } catch {}
  }, [currentVehicle])

  // Reset when user logs out
  useEffect(() => {
    if (!currentUser) {
      setSavedVehicles([])
      setCurrentVehicle('')
    }
  }, [currentUser])

  // Sync vehicles map from userProfileData
  useEffect(() => {
    if (!currentUser || !userProfileData) return

    if (userProfileData.vehicles && typeof userProfileData.vehicles === 'object') {
      const mapVehicles = (Object.values(userProfileData.vehicles) as SavedVehicle[]).filter(
        (v) => v && v.id !== 'veh-1' && v.id !== 'veh-2'
      )
      if (mapVehicles.length > 0) {
        // Enforce strictly ONE primary vehicle based on v.id and current/preferred vehicle
        let foundPrimary = false
        const normalizedVehicles = mapVehicles.map((v) => {
          const isMatch =
            (currentVehicle && (v.name === currentVehicle || v.id === currentVehicle)) ||
            (userProfileData.preferredVehicle && (v.name === userProfileData.preferredVehicle || v.id === userProfileData.preferredVehicle))
          if (isMatch && !foundPrimary) {
            foundPrimary = true
            return { ...v, isPrimary: true }
          }
          return { ...v, isPrimary: false }
        })
        if (!foundPrimary && normalizedVehicles.length > 0) {
          normalizedVehicles[0].isPrimary = true
        }

        // Always sort primary vehicle to index 0 (top)
        const sortedVehicles = [...normalizedVehicles].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
        setSavedVehicles(sortedVehicles)
        const activeVeh = sortedVehicles.find((v) => v.isPrimary) || sortedVehicles[0]
        setCurrentVehicle(activeVeh ? activeVeh.name : '')
      } else {
        setSavedVehicles([])
        setCurrentVehicle('')
      }
    }
  }, [userProfileData, currentUser])

  // Real-time listener for user vehicles subcollection ('users/{uid}/vehicles') (fallback/sync)
  useEffect(() => {
    if (!currentUser) return

    const vehiclesColRef = collection(db, 'users', currentUser.uid, 'vehicles')
    const unsubVehicles = onSnapshot(
      vehiclesColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedVehicles: SavedVehicle[] = snapshot.docs
            .map((docSnap) => ({
              ...(docSnap.data() as SavedVehicle),
              id: docSnap.id,
            }))
            .filter((v) => v && v.id !== 'veh-1' && v.id !== 'veh-2')

          setSavedVehicles((prev) => {
            const merged = [...prev.filter((v) => v && v.id !== 'veh-1' && v.id !== 'veh-2')]
            loadedVehicles.forEach((v) => {
              if (!merged.some((m) => m.id === v.id)) {
                merged.push(v)
              }
            })
            return merged
          })

          if (loadedVehicles.length > 0) {
            let foundPrimary = false
            setSavedVehicles((prev) => {
              const merged = [...prev.filter((v) => v && v.id !== 'veh-1' && v.id !== 'veh-2')]
              loadedVehicles.forEach((v) => {
                if (!merged.some((m) => m.id === v.id)) {
                  merged.push(v)
                }
              })
              return merged.map((v) => {
                const isMatch = v.name === currentVehicle || v.id === currentVehicle
                if (isMatch && !foundPrimary) {
                  foundPrimary = true
                  return { ...v, isPrimary: true }
                }
                return { ...v, isPrimary: false }
              })
            })
          }
        }
      },
      (error) => {
        console.error('Error listening to user vehicles in Firestore:', error)
      }
    )

    return () => unsubVehicles()
  }, [currentUser])

  // Automatically sync locally added vehicles to Firestore on login
  useEffect(() => {
    if (!currentUser || isDeletingAccountRef.current) return

    const realVehicles = savedVehicles.filter((v) => v && v.id !== 'veh-1' && v.id !== 'veh-2')
    if (realVehicles.length > 0) {
      const userDocRef = doc(db, 'users', currentUser.uid)
      const vehiclesMap: Record<string, any> = {}
      realVehicles.forEach((v) => {
        const cleanV = Object.fromEntries(
          Object.entries(v).filter(([_, val]) => val !== undefined)
        )
        vehiclesMap[v.id] = cleanV
      })

      setDoc(
        userDocRef,
        {
          vehicles: vehiclesMap,
          preferredVehicle: currentVehicle || realVehicles[0].name,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((err) => {
        console.warn('Could not sync user vehicles to Firestore upon login:', err)
      })
    }
  }, [currentUser?.uid])

  // Add vehicle
  const handleVehicleAdded = async (newVehicle: SavedVehicle) => {
    // 1. Validation: Duplicate License Plate check
    if (newVehicle.licensePlate && newVehicle.licensePlate.trim()) {
      const cleanPlate = newVehicle.licensePlate.trim().toUpperCase()
      const isAlreadyRegistered = savedVehicles.some(
        (v) => v.licensePlate && v.licensePlate.trim().toUpperCase() === cleanPlate
      )
      if (isAlreadyRegistered) {
        showToast('Yeh gadi (License Plate) pehle se aapke garage me registered hai!', 'error')
        return
      }
    }

    const updatedVehicle: SavedVehicle = {
      ...newVehicle,
      isPrimary: true,
    }

    const updatedList: SavedVehicle[] = [
      updatedVehicle,
      ...savedVehicles.filter((v) => v.id !== newVehicle.id).map((v) => ({ ...v, isPrimary: false })),
    ]

    setSavedVehicles(updatedList)
    setCurrentVehicle(updatedVehicle.name)
    showToast(`${updatedVehicle.name} added to your garage!`, 'success')

    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid)
        const cleanVehicle: Record<string, any> = {
          id: updatedVehicle.id,
          name: updatedVehicle.name,
          brand: updatedVehicle.brand || '',
          model: updatedVehicle.model || '',
          year: updatedVehicle.year || '',
          color: updatedVehicle.color || '',
          type: updatedVehicle.type || '',
          isPrimary: true,
          createdAt: new Date().toISOString(),
        }
        if (updatedVehicle.variant) cleanVehicle.variant = updatedVehicle.variant
        if (updatedVehicle.licensePlate) cleanVehicle.licensePlate = updatedVehicle.licensePlate
        if (updatedVehicle.specs) cleanVehicle.specs = updatedVehicle.specs

        const vehiclesMap: Record<string, any> = {}
        updatedList.forEach((v) => {
          const cleanV = Object.fromEntries(
            Object.entries(v).filter(([_, val]) => val !== undefined)
          )
          vehiclesMap[v.id] = cleanV
        })

        await setDoc(
          userDocRef,
          {
            vehicles: vehiclesMap,
            preferredVehicle: cleanVehicle.name,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )

        const vehicleDocRef = doc(db, 'users', currentUser.uid, 'vehicles', cleanVehicle.id)
        await setDoc(
          vehicleDocRef,
          {
            ...cleanVehicle,
            userId: currentUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      } catch (err) {
        console.error('Failed to sync new vehicle to Firestore:', err)
      }
    }
  }

  // Select active vehicle (Identified by v.id and license number)
  const handleSelectVehicle = async (vehicleName: string, vehicleId?: string) => {
    // Find the exact targeted vehicle by v.id first, then by licensePlate, then by name
    const target = savedVehicles.find((v) =>
      (vehicleId && v.id === vehicleId) ||
      (v.id === vehicleName) ||
      (v.licensePlate && v.licensePlate.toUpperCase() === vehicleName.toUpperCase()) ||
      v.name === vehicleName
    )

    const activeId = target ? target.id : vehicleId || vehicleName
    const activeName = target ? target.name : vehicleName

    setCurrentVehicle(activeName)

    // Strictly enforce that ONLY the targeted vehicle gets isPrimary: true
    const updated = savedVehicles.map((v) => ({
      ...v,
      isPrimary: v.id === activeId,
    }))
    // Always sort the newly selected primary vehicle to index 0 (top)
    const sorted = [...updated].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
    setSavedVehicles(sorted)
    showToast(`Active vehicle switched to ${activeName}.`, 'info')

    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid)
        const vehiclesMap: Record<string, any> = {}
        updated.forEach((v) => {
          const cleanV = Object.fromEntries(
            Object.entries(v).filter(([_, val]) => val !== undefined)
          )
          vehiclesMap[v.id] = cleanV
        })
        await setDoc(
          userDocRef,
          {
            vehicles: vehiclesMap,
            preferredVehicle: vehicleName,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      } catch (err) {
        console.error('Failed to sync active vehicle to Firestore:', err)
      }
    }
  }

  // Delete vehicle
  const handleDeleteVehicle = async (vehicleId: string) => {
    setSavedVehicles((prev) => {
      const remaining = prev.filter((v) => v.id !== vehicleId)
      const wasActive = prev.find((v) => v.id === vehicleId)?.name === currentVehicle
      if (wasActive && remaining.length > 0) {
        setCurrentVehicle(remaining[0].name)
      }
      return remaining
    })
    showToast('Vehicle removed successfully.', 'info')

    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid)
        await updateDoc(userDocRef, {
          [`vehicles.${vehicleId}`]: deleteField(),
          updatedAt: serverTimestamp(),
        })

        const vehicleDocRef = doc(db, 'users', currentUser.uid, 'vehicles', vehicleId)
        await deleteDoc(vehicleDocRef)
      } catch (err) {
        console.error('Failed to delete vehicle from Firestore:', err)
      }
    }
  }

  return (
    <VehicleContext.Provider
      value={{
        savedVehicles,
        currentVehicle,
        setSavedVehicles,
        setCurrentVehicle,
        handleVehicleAdded,
        handleSelectVehicle,
        handleDeleteVehicle,
      }}
    >
      {children}
    </VehicleContext.Provider>
  )
}
