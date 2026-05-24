/**
 * Hospitals Service
 * Location-based hospital discovery, specialist search
 */
import apiClient from './apiClient'

export const hospitalsService = {
  /**
   * Get nearby hospitals by coordinates
   */
  getNearbyHospitals: async ({ lat, lng, radius = 10, type = null, page = 1, limit = 20 } = {}) => {
    const params = { lat, lng, radius, page, limit }
    if (type) params.type = type

    const response = await apiClient.get('/hospitals/nearby', { params })
    return response.data
  },

  /**
   * Search hospitals by name or city
   */
  searchHospitals: async ({ query, lat = null, lng = null, page = 1, limit = 20 } = {}) => {
    const response = await apiClient.get('/hospitals/search', {
      params: { query, lat, lng, page, limit },
    })
    return response.data
  },

  /**
   * Get hospital details
   */
  getHospital: async (hospitalId) => {
    const response = await apiClient.get(`/hospitals/${hospitalId}`)
    return response.data
  },

  /**
   * Get specialist recommendations based on health profile
   */
  getSpecialistRecommendations: async ({ lat, lng } = {}) => {
    const response = await apiClient.get('/hospitals/specialist-recommendations', {
      params: { lat, lng },
    })
    return response.data
  },

  /**
   * Get emergency hospitals (highest priority)
   */
  getEmergencyHospitals: async ({ lat, lng } = {}) => {
    const response = await apiClient.get('/hospitals/emergency', {
      params: { lat, lng },
    })
    return response.data
  },
}

export default hospitalsService
