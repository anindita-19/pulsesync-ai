/**
 * WebSocket Manager
 * Manages WebSocket connection, reconnection, and event dispatching
 * for real-time features: chat streaming, agent activity, notifications
 */
import { WS_ENDPOINT, JWT_STORAGE_KEY } from '@/constants'

class WebSocketManager {
  constructor() {
    this.socket = null
    this.listeners = new Map()
    this.reconnectTimer = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 2000
    this.isConnecting = false
    this.currentSessionId = null
  }

  /**
   * Connect to WebSocket with auth token
   */
  connect(sessionId = null) {
    if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.OPEN)) {
      return
    }

    this.isConnecting = true
    this.currentSessionId = sessionId

    const token = localStorage.getItem(JWT_STORAGE_KEY)
    let url = `${WS_ENDPOINT}?token=${token}`
    if (sessionId) url += `&session_id=${sessionId}`

    this.socket = new WebSocket(url)

    this.socket.onopen = () => {
      console.log('[WebSocket] Connected')
      this.isConnecting = false
      this.reconnectAttempts = 0
      this.emit('connection_status', { connected: true })
    }

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.handleMessage(data)
      } catch (err) {
        console.error('[WebSocket] Failed to parse message:', err)
      }
    }

    this.socket.onclose = (event) => {
      console.log('[WebSocket] Disconnected', event.code)
      this.isConnecting = false
      this.emit('connection_status', { connected: false })

      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect()
      }
    }

    this.socket.onerror = (error) => {
      console.error('[WebSocket] Error:', error)
      this.isConnecting = false
      this.emit('error', { error })
    }
  }

  /**
   * Handle incoming messages and route to listeners
   */
  handleMessage(data) {
    const { type, payload } = data

    // Emit to specific type listeners
    this.emit(type, payload)

    // Also emit to wildcard listeners
    this.emit('*', data)
  }

  /**
   * Send a message to the server
   */
  send(type, payload) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }))
    } else {
      console.warn('[WebSocket] Cannot send - not connected')
    }
  }

  /**
   * Subscribe to an event type
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)

    // Return unsubscribe function
    return () => this.off(event, callback)
  }

  /**
   * Unsubscribe from an event type
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback)
    }
  }

  /**
   * Emit event to all listeners
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data)
        } catch (err) {
          console.error(`[WebSocket] Listener error for ${event}:`, err)
        }
      })
    }
  }

  /**
   * Schedule reconnection
   */
  scheduleReconnect() {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // exponential backoff
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      this.connect(this.currentSessionId)
    }, delay)
  }

  /**
   * Disconnect and clean up
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    this.reconnectAttempts = this.maxReconnectAttempts // prevent auto-reconnect

    if (this.socket) {
      this.socket.close(1000, 'User disconnect')
      this.socket = null
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN
  }
}

// Singleton instance
const wsManager = new WebSocketManager()
export default wsManager
