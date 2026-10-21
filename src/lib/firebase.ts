import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Firebase Configuration from environment variables (with fallback to provided credentials)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAiQSYr5MlTd4576LnvbuF7gT-lfPlnM9I",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "nexen-platform.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nexen-platform",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "nexen-platform.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "47506994155",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:47506994155:web:914a520b3e147e7aac1fae",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-RMWG56C6DX",
}

// Initialize Firebase App (prevents re-initialization during hot reloading)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// Initialize core Firebase services for easy access across the project
export const auth = getAuth(app)
const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || 'carwash'

export const db = getFirestore(app, databaseId)
export const storage = getStorage(app)

// Initialize Firebase Analytics safely (only in browser environment supporting it)
export let analytics: ReturnType<typeof getAnalytics> | null = null
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app)
    }
  }).catch(() => {
    // Analytics not supported or blocked in current environment
  })
}

export default app
