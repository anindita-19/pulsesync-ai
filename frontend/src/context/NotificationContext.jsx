/**
 * Notification Context
 * Global toast/notification system
 */
import React, { createContext, useContext, useState, useCallback } from 'react'

const NotificationContext = createContext(null)

let notificationId = 0

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((notification) => {
    const id = ++notificationId
    const newNotification = {
      id,
      type: 'info', // info | success | warning | error
      duration: 5000,
      ...notification,
    }

    setNotifications((prev) => [...prev, newNotification])

    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const toast = {
    success: (message, options = {}) =>
      addNotification({ type: 'success', message, ...options }),
    error: (message, options = {}) =>
      addNotification({ type: 'error', message, ...options }),
    warning: (message, options = {}) =>
      addNotification({ type: 'warning', message, ...options }),
    info: (message, options = {}) =>
      addNotification({ type: 'info', message, ...options }),
  }

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, toast }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}

export default NotificationContext
