import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import {
  doc,
  collection,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { cleanUndefined } from '@/firebase/CloudFirestore/SetData'
import { CartItem } from '@/types'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

export interface CartContextType {
  cartItems: CartItem[]
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>
  handleAddToCart: (product: any, quantity?: number) => void
  handleUpdateCartQuantity: (productId: string, quantity: number) => void
  handleRemoveCartItem: (productId: string) => void
  handleClearCart: () => void
  handleCheckoutOrder: (orderData: any) => Promise<string>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCart = (): CartContextType => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfileData, isDeletingAccountRef } = useAuth()
  const { showToast } = useToast()

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('bentley_cart_items')
      if (stored) return JSON.parse(stored)
    } catch {}
    return []
  })

  const syncedUserCartRef = useRef<string | null>(null)

  // Sync cartItems with localStorage and Cloud Firestore
  useEffect(() => {
    try {
      localStorage.setItem('bentley_cart_items', JSON.stringify(cartItems))
    } catch {}

    if (
      currentUser &&
      syncedUserCartRef.current === currentUser.uid &&
      !isDeletingAccountRef.current
    ) {
      const userDocRef = doc(db, 'users', currentUser.uid)
      setDoc(
        userDocRef,
        { cart: cartItems, updatedAt: serverTimestamp() },
        { merge: true }
      ).catch((err) => {
        console.warn('Failed to sync cart update to Firestore:', err)
      })
    }
  }, [cartItems, currentUser])

  // Reset or merge cart on login
  useEffect(() => {
    if (!currentUser) {
      syncedUserCartRef.current = null
      return
    }

    if (userProfileData && syncedUserCartRef.current !== currentUser.uid) {
      syncedUserCartRef.current = currentUser.uid
      const cloudCart: CartItem[] = Array.isArray(userProfileData.cart)
        ? userProfileData.cart
        : []

      setCartItems((localCart) => {
        if (localCart && localCart.length > 0) {
          const mergedMap = new Map<string, CartItem>()
          cloudCart.forEach((item) => {
            if (item?.product?.id) {
              mergedMap.set(item.product.id, item)
            }
          })
          localCart.forEach((localItem) => {
            if (localItem?.product?.id) {
              const existing = mergedMap.get(localItem.product.id)
              if (existing) {
                mergedMap.set(localItem.product.id, {
                  ...existing,
                  quantity: Math.max(existing.quantity, localItem.quantity),
                })
              } else {
                mergedMap.set(localItem.product.id, localItem)
              }
            }
          })

          const merged = Array.from(mergedMap.values())
          const userDocRef = doc(db, 'users', currentUser.uid)
          setDoc(
            userDocRef,
            { cart: merged, updatedAt: serverTimestamp() },
            { merge: true }
          ).catch((err) => {
            console.warn('Failed to sync merged cart to Firestore:', err)
          })
          return merged
        } else if (cloudCart.length > 0) {
          return cloudCart
        }
        return localCart
      })
    }
  }, [currentUser, userProfileData])

  // Add to cart
  const handleAddToCart = (product: any, quantity: number = 1) => {
    if (!product || !product.id) return
    const safeQty = Math.max(1, Math.min(50, Math.floor(Number(quantity) || 1)))
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        const nextQty = Math.min(50, existing.quantity + safeQty)
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: nextQty }
            : item
        )
      }
      return [...prev, { product, quantity: safeQty }]
    })
    showToast(`${product.title} added to cart!`, 'success')
  }

  // Update quantity
  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }

  // Remove item
  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId))
    showToast('Item removed from cart.', 'info')
  }

  // Clear cart
  const handleClearCart = () => {
    setCartItems([])
  }

  // Checkout order
  const handleCheckoutOrder = async (orderData: any): Promise<string> => {
    try {
      const orderDocRef = doc(collection(db, 'orders'))
      const orderId = orderDocRef.id

      const payload = cleanUndefined({
        ...orderData,
        id: orderId,
        userId: currentUser ? currentUser.uid : '',
        userEmail: currentUser?.email || orderData.customerEmail || '',
        createdAt: serverTimestamp(),
        serverTimestamp: serverTimestamp(),
      })
      await setDoc(orderDocRef, payload)
      return orderId
    } catch (err) {
      console.error('Failed to sync product order to Firestore:', err)
      const fallbackDocRef = doc(collection(db, 'orders'))
      return fallbackDocRef.id
    }
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        setCartItems,
        handleAddToCart,
        handleUpdateCartQuantity,
        handleRemoveCartItem,
        handleClearCart,
        handleCheckoutOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
