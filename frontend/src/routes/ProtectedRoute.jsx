/**
 * Protected Route
 * Redirects to login if not authenticated
 * Redirects to complete-profile if profile not completed
 */
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ROUTES } from '@/constants'
import LoadingScreen from '@/components/shared/LoadingScreen'

export default function ProtectedRoute({ children, requireCompleteProfile = true }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  // If profile completion required but not completed
  if (requireCompleteProfile && user && !user.profile_completed) {
    return <Navigate to={ROUTES.COMPLETE_PROFILE} replace />
  }

  // If on complete-profile page but profile is already complete
  if (!requireCompleteProfile && user && user.profile_completed) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return children
}
