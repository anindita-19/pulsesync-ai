/**
 * AI Chat & Ecosystem Service
 * Session management, message persistence, agent queries
 */
import apiClient from './apiClient'

export const chatService = {
  /**
   * Create a new chat session
   */
  createSession: async (metadata = {}) => {
    const response = await apiClient.post('/chat/sessions', metadata)
    return response.data
  },

  /**
   * Get all chat sessions
   */
  getSessions: async ({ page = 1, limit = 20 } = {}) => {
    const response = await apiClient.get('/chat/sessions', {
      params: { page, limit },
    })
    return response.data
  },

  /**
   * Get single session with messages
   */
  getSession: async (sessionId) => {
    const response = await apiClient.get(`/chat/sessions/${sessionId}`)
    return response.data
  },

  /**
   * Delete a session
   */
  deleteSession: async (sessionId) => {
    const response = await apiClient.delete(`/chat/sessions/${sessionId}`)
    return response.data
  },

  /**
   * Get messages for a session
   */
  getMessages: async (sessionId, { page = 1, limit = 50 } = {}) => {
    const response = await apiClient.get(`/chat/sessions/${sessionId}/messages`, {
      params: { page, limit },
    })
    return response.data
  },

  /**
   * Send a message (non-streaming fallback)
   */
  sendMessage: async (sessionId, content, options = {}) => {
    const response = await apiClient.post(`/chat/sessions/${sessionId}/messages`, {
      content,
      explanation_level: options.explanationLevel || 1,
      context: options.context || {},
    })
    return response.data
  },

  /**
   * Get agent activity for a session
   */
  getAgentActivity: async (sessionId) => {
    const response = await apiClient.get(`/chat/sessions/${sessionId}/agents`)
    return response.data
  },

  /**
   * Get AI suggestions / chips for conversation
   */
  getSuggestions: async (sessionId) => {
    const response = await apiClient.get(`/chat/sessions/${sessionId}/suggestions`)
    return response.data
  },
}

export default chatService
