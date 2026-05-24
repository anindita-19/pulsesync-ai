/**
 * Google OAuth Callback Handler
 * Receives the authorization code from Google and exchanges it for tokens
 */
import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useNotification } from '@/context/NotificationContext'
import { ROUTES } from '@/constants'

export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('Processing Google sign-in...')
  const { googleLogin } = useAuth()
  const { toast } = useNotification()
  const navigate = useNavigate()

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      toast.error('Google sign-in was cancelled or failed', { title: 'Auth Error' })
      navigate(ROUTES.LOGIN)
      return
    }

    if (!code) {
      toast.error('No authorization code received from Google')
      navigate(ROUTES.LOGIN)
      return
    }

    const exchange = async () => {
      try {
        setStatus('Signing you in...')
        const data = await googleLogin(code)
        toast.success('Signed in with Google!', { title: 'Welcome!' })

        if (data.user?.profile_completed) {
          navigate(ROUTES.DASHBOARD, { replace: true })
        } else {
          navigate(ROUTES.COMPLETE_PROFILE, { replace: true })
        }
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Google sign-in failed', { title: 'Error' })
        navigate(ROUTES.LOGIN, { replace: true })
      }
    }

    exchange()
  }, [])

  return (
    <div className="min-h-screen bg-health-gradient flex items-center justify-center">
      <div className="text-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-glow"
        >
          <Activity className="w-8 h-8 text-white" />
        </motion.div>
        <p className="text-slate-600 font-medium">{status}</p>
        <div className="flex justify-center gap-1 mt-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-teal-400"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
