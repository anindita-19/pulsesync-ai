import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ROUTES } from '@/constants'
import LoadingScreen from '@/components/shared/LoadingScreen'

export default function PublicRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) return <LoadingScreen />

  if (isAuthenticated) {
    if (user && !user.profile_completed) {
      return <Navigate to={ROUTES.COMPLETE_PROFILE} replace />
    }
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return children
}
