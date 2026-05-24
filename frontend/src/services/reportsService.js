/**
 * Medical Reports Service
 * Handles report uploads, fetching, deletion
 */
import apiClient from './apiClient'

export const reportsService = {
  /**
   * Upload a medical report
   * File is sent as FormData to backend which handles Cloudinary upload
   */
  uploadReport: async (file, metadata, onUploadProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('report_type', metadata.reportType)
    formData.append('report_date', metadata.reportDate)
    if (metadata.notes) formData.append('notes', metadata.notes)
    if (metadata.doctorName) formData.append('doctor_name', metadata.doctorName)
    if (metadata.hospitalName) formData.append('hospital_name', metadata.hospitalName)

    const response = await apiClient.post('/reports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onUploadProgress(percent)
        }
      },
    })
    return response.data
  },

  /**
   * Get all reports for current user
   */
  getReports: async ({ page = 1, limit = 10, type = null, search = null } = {}) => {
    const params = { page, limit }
    if (type) params.type = type
    if (search) params.search = search

    const response = await apiClient.get('/reports', { params })
    return response.data
  },

  /**
   * Get single report detail
   */
  getReport: async (reportId) => {
    const response = await apiClient.get(`/reports/${reportId}`)
    return response.data
  },

  /**
   * Delete a report
   */
  deleteReport: async (reportId) => {
    const response = await apiClient.delete(`/reports/${reportId}`)
    return response.data
  },

  /**
   * Get report analysis (if analyzed by AI)
   */
  getReportAnalysis: async (reportId) => {
    const response = await apiClient.get(`/reports/${reportId}/analysis`)
    return response.data
  },

  /**
   * Request AI analysis for a report
   */
  requestAnalysis: async (reportId) => {
    const response = await apiClient.post(`/reports/${reportId}/analyze`)
    return response.data
  },

  /**
   * Get report timeline
   */
  getReportTimeline: async () => {
    const response = await apiClient.get('/reports/timeline')
    return response.data
  },
}

export default reportsService
