import React from 'react'
import { Link } from 'react-router-dom'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 pt-28">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-primary-container/10 text-primary-container flex items-center justify-center mx-auto border border-primary-container/20">
          <span className="material-symbols-outlined text-[32px]">directions_car</span>
        </div>
        <h1 className="text-6xl font-extrabold text-on-surface">404</h1>
        <h2 className="text-xl font-bold text-on-surface">Page Not Found</h2>
        <p className="text-sm text-secondary">
          The destination you are looking for does not exist. Let's redirect you back to the main homepage.
        </p>
        <Link to="/">
          <button className="mt-2 bg-primary-container hover:bg-primary text-on-primary font-bold px-6 py-3 rounded-lg shadow cursor-pointer transition-all">
            Back to Home
          </button>
        </Link>
      </div>
    </div>
  )
}
