/**
 * Authentication Service
 * Handles login, signup, Google OAuth, token management
 */
import apiClient from './apiClient'
import { JWT_STORAGE_KEY, REFRESH_TOKEN_KEY, USER_STORAGE_KEY } from '@/constants'

export const authService = {
  /**
   * Manual signup
   */
  signup: async (data) => {
    const response = await apiClient.post('/auth/signup', {
      full_name: data.fullName,
      email: data.email,
      password: data.password,
    })
    return response.data
  },

  /**
   * Manual login
   */
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password })
    const { access_token, refresh_token, user } = response.data
    authService.storeTokens(access_token, refresh_token)
    authService.storeUser(user)
    return response.data
  },

  /**
   * Google OAuth - exchange code for tokens
   */
  googleLogin: async (code) => {
    const response = await apiClient.post('/auth/google', { code })
    const { access_token, refresh_token, user } = response.data
    authService.storeTokens(access_token, refresh_token)
    authService.storeUser(user)
    return response.data
  },

  /**
   * Logout
   */
  logout: async () => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      authService.clearTokens()
    }
  },

  /**
   * Refresh access token
   */
  refreshToken: async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    const response = await apiClient.post('/auth/refresh', {
      refresh_token: refreshToken,
    })
    const { access_token } = response.data
    localStorage.setItem(JWT_STORAGE_KEY, access_token)
    return access_token
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me')
    authService.storeUser(response.data)
    return response.data
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem(JWT_STORAGE_KEY)
  },

  /**
   * Get stored user from localStorage
   */
  getStoredUser: () => {
    try {
      const user = localStorage.getItem(USER_STORAGE_KEY)
      return user ? JSON.parse(user) : null
    } catch {
      return null
    }
  },

  /**
   * Store auth tokens
   */
  storeTokens: (accessToken, refreshToken) => {
    localStorage.setItem(JWT_STORAGE_KEY, accessToken)
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    }
  },

  /**
   * Store user data
   */
  storeUser: (user) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  },

  /**
   * Clear all auth data
   */
  clearTokens: () => {
    localStorage.removeItem(JWT_STORAGE_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
  },
}

export default authService
