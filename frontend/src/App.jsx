/**
 * PulseSync AI - Root Application
 * Providers, routing, and global layout
 */
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider } from '@/context/AuthContext'
import { NotificationProvider } from '@/context/NotificationContext'
import ProtectedRoute from '@/routes/ProtectedRoute'
import PublicRoute from '@/routes/PublicRoute'
import ToastContainer from '@/components/ui/ToastContainer'
import ErrorBoundary from '@/components/shared/ErrorBoundary'

// Public pages
import LandingPage from '@/pages/LandingPage'
import GoogleCallbackPage from '@/pages/GoogleCallbackPage'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import AboutPage from '@/pages/AboutPage'
import ContactPage from '@/pages/ContactPage'

// Auth flow pages
import CompleteProfilePage from '@/pages/CompleteProfilePage'

// Private pages
import DashboardPage from '@/pages/DashboardPage'
import ProfileSettingsPage from '@/pages/ProfileSettingsPage'
import MedicalReportsPage from '@/pages/MedicalReportsPage'
import MedicalHistoryPage from '@/pages/MedicalHistoryPage'
import NearbyHospitalsPage from '@/pages/NearbyHospitalsPage'
import AIEcosystemPage from '@/pages/AIEcosystemPage'

// Layouts
import DashboardLayout from '@/layouts/DashboardLayout'

import { ROUTES } from '@/constants'

export default function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AuthProvider>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public routes */}
              <Route path={ROUTES.HOME} element={<LandingPage />} />
              <Route path={ROUTES.ABOUT} element={<AboutPage />} />
              <Route path={ROUTES.CONTACT} element={<ContactPage />} />

              {/* Auth routes - redirect to dashboard if already logged in */}
              <Route
                path={ROUTES.LOGIN}
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path={ROUTES.SIGNUP}
                element={
                  <PublicRoute>
                    <SignupPage />
                  </PublicRoute>
                }
              />

              {/* Profile completion - requires auth but not complete profile */}
              <Route
                path={ROUTES.COMPLETE_PROFILE}
                element={
                  <ProtectedRoute requireCompleteProfile={false}>
                    <CompleteProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Private routes - requires auth AND complete profile */}
              <Route
                element={
                  <ProtectedRoute requireCompleteProfile={true}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
                <Route path={ROUTES.PROFILE_SETTINGS} element={<ProfileSettingsPage />} />
                <Route path={ROUTES.MEDICAL_REPORTS} element={<MedicalReportsPage />} />
                <Route path={ROUTES.MEDICAL_HISTORY} element={<MedicalHistoryPage />} />
                <Route path={ROUTES.NEARBY_HOSPITALS} element={<NearbyHospitalsPage />} />
              </Route>

              {/* AI Ecosystem - full page, own layout */}
              <Route
                path={ROUTES.AI_ECOSYSTEM}
                element={
                  <ProtectedRoute requireCompleteProfile={true}>
                    <AIEcosystemPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              {/* Google OAuth callback */}
              <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
            </Routes>
          </AnimatePresence>

          {/* Global toast notifications */}
          <ToastContainer />
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  )
}
