import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { BookingStoreProvider } from '@/store/bookingStore'

export const App: React.FC = () => {
  return (
    <BookingStoreProvider>
      <RouterProvider router={router} />
    </BookingStoreProvider>
  )
}

export default App
