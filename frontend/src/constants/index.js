// Application-wide constants for PulseSync AI

export const APP_NAME = 'PulseSync AI'
export const APP_TAGLINE = 'Your AI-Powered Healthcare Intelligence Platform'

// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
export const API_VERSION = '/api/v1'
export const API_URL = `${API_BASE_URL}${API_VERSION}`

// WebSocket
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'
export const WS_ENDPOINT = `${WS_BASE_URL}/ws`

// Google OAuth
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

// Cloudinary
export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || ''
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ''

// Auth
export const JWT_STORAGE_KEY = 'pulsesync_token'
export const REFRESH_TOKEN_KEY = 'pulsesync_refresh_token'
export const USER_STORAGE_KEY = 'pulsesync_user'

// Routes
export const ROUTES = {
  // Public
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  LOGIN: '/login',
  SIGNUP: '/signup',
  // Auth flow
  COMPLETE_PROFILE: '/complete-profile',
  // Private
  DASHBOARD: '/dashboard',
  PROFILE_SETTINGS: '/settings/profile',
  MEDICAL_REPORTS: '/reports',
  MEDICAL_HISTORY: '/history',
  NEARBY_HOSPITALS: '/hospitals',
  AI_ECOSYSTEM: '/ai-ecosystem',
}

// Blood groups
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

// Gender options
export const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

// Lifestyle options
export const LIFESTYLE_OPTIONS = {
  activity: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Athlete'],
  smoking: ['Non-smoker', 'Former smoker', 'Occasional smoker', 'Regular smoker'],
  alcohol: ['None', 'Occasional', 'Moderate', 'Regular'],
  diet: ['Regular', 'Vegetarian', 'Vegan', 'Keto', 'Mediterranean', 'Other'],
  sleep: ['Less than 5h', '5-6h', '6-7h', '7-8h', '8-9h', 'More than 9h'],
}

// Report types
export const REPORT_TYPES = [
  'Blood Test',
  'X-Ray',
  'MRI',
  'CT Scan',
  'ECG/EKG',
  'Ultrasound',
  'Prescription',
  'Pathology',
  'Radiology',
  'Consultation Notes',
  'Discharge Summary',
  'Other',
]

// Agent names for ecosystem
export const AI_AGENTS = [
  { id: 'symptom', name: 'Symptom Agent', color: 'teal', icon: 'Stethoscope' },
  { id: 'analysis', name: 'Medical Analysis Agent', color: 'blue', icon: 'Brain' },
  { id: 'report', name: 'Report Analysis Agent', color: 'cyan', icon: 'FileSearch' },
  { id: 'nutrition', name: 'Nutrition Agent', color: 'green', icon: 'Leaf' },
  { id: 'recommendation', name: 'Recommendation Agent', color: 'purple', icon: 'Lightbulb' },
]

// Explanation levels
export const EXPLANATION_LEVELS = [
  { level: 1, label: 'Basic', description: 'Simple terms for everyone' },
  { level: 2, label: 'Simplified', description: 'Clear medical context' },
  { level: 3, label: 'Detailed', description: 'Full clinical detail' },
]

// Health risk levels
export const RISK_LEVELS = {
  LOW: { label: 'Low Risk', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  MEDIUM: { label: 'Medium Risk', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  HIGH: { label: 'High Risk', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
}

// File upload limits
export const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
export const ACCEPTED_REPORT_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
}

// Notification types
export const NOTIFICATION_TYPES = {
  REPORT_READY: 'report_ready',
  AI_RECOMMENDATION: 'ai_recommendation',
  HEALTH_ALERT: 'health_alert',
  APPOINTMENT_REMINDER: 'appointment_reminder',
  SYSTEM: 'system',
}

// Pagination
export const DEFAULT_PAGE_SIZE = 10

// Query keys for React Query
export const QUERY_KEYS = {
  USER: 'user',
  PROFILE: 'profile',
  DASHBOARD: 'dashboard',
  REPORTS: 'reports',
  REPORT_DETAIL: 'report-detail',
  HISTORY: 'medical-history',
  HOSPITALS: 'hospitals',
  NOTIFICATIONS: 'notifications',
  HEALTH_METRICS: 'health-metrics',
  CHAT_SESSIONS: 'chat-sessions',
  CHAT_MESSAGES: 'chat-messages',
}
