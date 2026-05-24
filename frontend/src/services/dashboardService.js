/**
 * Dashboard Service
 * Fetches all dashboard data - health score, metrics, summaries
 */
import apiClient from './apiClient'

export const dashboardService = {
  /**
   * Get full dashboard summary
   */
  getDashboardData: async () => {
    const response = await apiClient.get('/dashboard')
    return response.data
  },

  /**
   * Get health score
   */
  getHealthScore: async () => {
    const response = await apiClient.get('/dashboard/health-score')
    return response.data
  },

  /**
   * Get health metrics for charts
   */
  getHealthMetrics: async (period = '30d') => {
    const response = await apiClient.get('/dashboard/metrics', {
      params: { period },
    })
    return response.data
  },

  /**
   * Get AI recommendations
   */
  getAIRecommendations: async () => {
    const response = await apiClient.get('/dashboard/recommendations')
    return response.data
  },

  /**
   * Get recent activity feed
   */
  getRecentActivity: async (limit = 10) => {
    const response = await apiClient.get('/dashboard/activity', {
      params: { limit },
    })
    return response.data
  },

  /**
   * Get health risk indicators
   */
  getRiskIndicators: async () => {
    const response = await apiClient.get('/dashboard/risk-indicators')
    return response.data
  },
}

export default dashboardService
