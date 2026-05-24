/**
 * Medical History Service
 */
import apiClient from './apiClient'

export const historyService = {
  /**
   * Get complete medical history timeline
   */
  getTimeline: async ({ page = 1, limit = 20, type = null } = {}) => {
    const response = await apiClient.get('/history/timeline', {
      params: { page, limit, type },
    })
    return response.data
  },

  /**
   * Add symptom log
   */
  logSymptom: async (symptomData) => {
    const response = await apiClient.post('/history/symptoms', symptomData)
    return response.data
  },

  /**
   * Get symptom history
   */
  getSymptomHistory: async ({ page = 1, limit = 20 } = {}) => {
    const response = await apiClient.get('/history/symptoms', {
      params: { page, limit },
    })
    return response.data
  },

  /**
   * Add medication
   */
  addMedication: async (medicationData) => {
    const response = await apiClient.post('/history/medications', medicationData)
    return response.data
  },

  /**
   * Get medication history
   */
  getMedications: async ({ page = 1, limit = 20, active = null } = {}) => {
    const params = { page, limit }
    if (active !== null) params.active = active
    const response = await apiClient.get('/history/medications', { params })
    return response.data
  },

  /**
   * Get health trend analytics
   */
  getHealthTrends: async (period = '90d') => {
    const response = await apiClient.get('/history/trends', {
      params: { period },
    })
    return response.data
  },

  /**
   * Get risk analytics
   */
  getRiskAnalytics: async () => {
    const response = await apiClient.get('/history/risk-analytics')
    return response.data
  },
}

export default historyService
