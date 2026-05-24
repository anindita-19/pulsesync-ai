/**
 * User & Profile Service
 */
import apiClient from './apiClient'

export const userService = {
  /**
   * Get user profile
   */
  getProfile: async () => {
    const response = await apiClient.get('/users/profile')
    return response.data
  },

  /**
   * Complete / update user profile
   */
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/users/profile', profileData)
    return response.data
  },

  /**
   * Complete profile (first time)
   */
  completeProfile: async (profileData) => {
    const response = await apiClient.post('/users/profile/complete', profileData)
    return response.data
  },

  /**
   * Get profile completion percentage
   */
  getProfileCompletion: async () => {
    const response = await apiClient.get('/users/profile/completion')
    return response.data
  },

  /**
   * Update user settings
   */
  updateSettings: async (settings) => {
    const response = await apiClient.put('/users/settings', settings)
    return response.data
  },

  /**
   * Get user settings
   */
  getSettings: async () => {
    const response = await apiClient.get('/users/settings')
    return response.data
  },

  /**
   * Get user notifications
   */
  getNotifications: async (page = 1, limit = 20) => {
    const response = await apiClient.get('/users/notifications', {
      params: { page, limit },
    })
    return response.data
  },

  /**
   * Mark notification as read
   */
  markNotificationRead: async (notificationId) => {
    const response = await apiClient.patch(`/users/notifications/${notificationId}/read`)
    return response.data
  },

  /**
   * Mark all notifications as read
   */
  markAllNotificationsRead: async () => {
    const response = await apiClient.patch('/users/notifications/read-all')
    return response.data
  },
}

export default userService
