/**
 * Signup Page
 * Manual signup + Google OAuth
 */
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Activity, ArrowRight, Chrome, CheckCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useNotification } from '@/context/NotificationContext'
import { ROUTES, GOOGLE_CLIENT_ID } from '@/constants'

function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'Contains uppercase', valid: /[A-Z]/.test(password) },
    { label: 'Contains number', valid: /\d/.test(password) },
  ]
  const strength = checks.filter((c) => c.valid).length
  const colors = ['bg-red-400', 'bg-amber-400', 'bg-teal-500']

  if (!password) return null

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? colors[strength - 1] : 'bg-slate-200'}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {checks.map((c) => (
          <span key={c.label} className={`text-xs flex items-center gap-1 ${c.valid ? 'text-teal-600' : 'text-slate-400'}`}>
            <CheckCircle className={`w-3 h-3 ${c.valid ? 'text-teal-500' : 'text-slate-300'}`} />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function SignupPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { signup } = useAuth()
  const { toast } = useNotification()
  const navigate = useNavigate()

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.fullName || !form.email || !form.password) {
      toast.error('Please fill all fields')
      return
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)
    try {
      await signup(form)
      toast.success('Account created! Complete your profile to get started.', { title: 'Welcome!' })
      navigate(ROUTES.COMPLETE_PROFILE, { replace: true })
    } catch (err) {
      const message = err.response?.data?.detail || 'Signup failed. Please try again.'
      toast.error(message, { title: 'Error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = () => {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: `${window.location.origin}/auth/google/callback`,
      response_type: 'code',
      scope: 'email profile',
      access_type: 'offline',
      prompt: 'consent',
    })
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  }

  return (
    <div className="min-h-screen bg-health-gradient flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link to={ROUTES.HOME} className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-slate-800">PulseSync AI</span>
        </Link>

        <div className="glass-card p-8 shadow-xl">
          <h1 className="font-display font-bold text-3xl text-slate-900 mb-2">Create account</h1>
          <p className="text-slate-500 mb-6">Start your AI healthcare journey</p>

          <button
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 hover:border-teal-300 bg-white py-3.5 rounded-xl font-medium text-slate-700 hover:bg-teal-50/50 transition-all duration-200 mb-5"
          >
            <Chrome className="w-5 h-5 text-blue-500" />
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-sm text-slate-400 font-medium">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
              <input
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Dr. Jane Doe"
                required
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800 placeholder-slate-400 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800 placeholder-slate-400 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  required
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800 placeholder-slate-400 bg-white pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            <p className="text-xs text-slate-500">
              By signing up, you agree to our{' '}
              <a href="#" className="text-teal-600 hover:underline">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-teal-600 hover:underline">Privacy Policy</a>.
            </p>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-4 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="text-teal-600 font-semibold hover:text-teal-700">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
