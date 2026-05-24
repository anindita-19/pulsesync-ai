/**
 * Auth Context
 * Global authentication state management
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import authService from '@/services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Try to get fresh user data
          const userData = await authService.getCurrentUser()
          setUser(userData)
          setIsAuthenticated(true)
        }
      } catch (error) {
        // Token might be expired - clear auth
        authService.clearTokens()
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password)
    setUser(data.user)
    setIsAuthenticated(true)
    return data
  }, [])

  const signup = useCallback(async (formData) => {
    const data = await authService.signup(formData)
    // After signup, store tokens and set user
    if (data.access_token) {
      authService.storeTokens(data.access_token, data.refresh_token)
      authService.storeUser(data.user)
      setUser(data.user)
      setIsAuthenticated(true)
    }
    return data
  }, [])

  const googleLogin = useCallback(async (code) => {
    const data = await authService.googleLogin(code)
    setUser(data.user)
    setIsAuthenticated(true)
    return data
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates }
      authService.storeUser(updated)
      return updated
    })
  }, [])

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    googleLogin,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
