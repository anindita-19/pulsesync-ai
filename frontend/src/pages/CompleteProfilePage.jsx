/**
 * Complete Profile Page
 * Multi-step profile completion with progress bar
 * Required before accessing the dashboard
 */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, ChevronRight, ChevronLeft, Check, Plus, X } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { useNotification } from '@/context/NotificationContext'
import userService from '@/services/userService'
import { ROUTES, BLOOD_GROUPS, GENDER_OPTIONS, LIFESTYLE_OPTIONS } from '@/constants'

// ─── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  { id: 'basic', title: 'Basic Info', description: 'Age, gender & body metrics' },
  { id: 'medical', title: 'Medical History', description: 'Blood group, allergies & conditions' },
  { id: 'emergency', title: 'Emergency Contact', description: 'Who to contact in emergencies' },
  { id: 'lifestyle', title: 'Lifestyle', description: 'Daily habits & activity level' },
]

const STEP_WEIGHTS = { basic: 25, medical: 25, emergency: 25, lifestyle: 25 }

// ─── Tag Input ─────────────────────────────────────────────────────────────────
function TagInput({ values, onChange, placeholder }) {
  const [input, setInput] = useState('')

  const add = () => {
    const val = input.trim()
    if (val && !values.includes(val)) {
      onChange([...values, val])
    }
    setInput('')
  }

  const remove = (v) => onChange(values.filter((x) => x !== v))

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none text-sm bg-white"
        />
        <button type="button" onClick={add} className="px-4 py-2.5 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((v) => (
            <span key={v} className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 text-sm px-3 py-1 rounded-full border border-teal-100">
              {v}
              <button type="button" onClick={() => remove(v)} className="text-teal-400 hover:text-teal-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Form field ────────────────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CompleteProfilePage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [profile, setProfile] = useState({
    age: '',
    gender: '',
    height: '',
    weight: '',
    blood_group: '',
    allergies: [],
    existing_diseases: [],
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    activity_level: '',
    smoking_status: '',
    alcohol_consumption: '',
    diet_type: '',
    sleep_hours: '',
  })

  const { updateUser } = useAuth()
  const { toast } = useNotification()
  const navigate = useNavigate()

  // Calculate completion %
  const completedSteps = currentStep
  const completionPct = Math.round((completedSteps / STEPS.length) * 100)

  const updateProfile = (key, val) => setProfile((p) => ({ ...p, [key]: val }))

  const completeMutation = useMutation({
    mutationFn: userService.completeProfile,
    onSuccess: (data) => {
      updateUser({ profile_completed: true })
      toast.success('Profile completed! Welcome to PulseSync AI.', { title: 'All set!' })
      navigate(ROUTES.DASHBOARD)
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to save profile', { title: 'Error' })
    },
  })

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      // Submit
      completeMutation.mutate(profile)
    }
  }

  const handleBack = () => setCurrentStep((s) => s - 1)

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800 placeholder-slate-400 bg-white text-sm'
  const selectClass = `${inputClass} cursor-pointer`

  return (
    <div className="min-h-screen bg-health-gradient flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-slate-800 text-xl">PulseSync AI</span>
          </div>
          <h1 className="font-display font-bold text-3xl text-slate-900 mb-2">Complete Your Health Profile</h1>
          <p className="text-slate-500">Help us personalize your AI healthcare experience</p>
        </div>

        {/* Progress bar */}
        <div className="glass-card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700">Profile Completion</span>
            <span className="text-sm font-bold text-teal-600">{completionPct}%</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
            <motion.div
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
            />
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < currentStep
                      ? 'bg-teal-500 text-white'
                      : i === currentStep
                      ? 'bg-teal-100 text-teal-700 border-2 border-teal-400'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="hidden sm:block text-xs text-slate-500 font-medium">{step.title}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-colors ${i < currentStep ? 'bg-teal-400' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="glass-card p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="font-display font-bold text-xl text-slate-900">{STEPS[currentStep].title}</h2>
            <p className="text-slate-500 text-sm mt-1">{STEPS[currentStep].description}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* STEP 0: Basic Info */}
              {currentStep === 0 && (
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2 sm:col-span-1">
                    <Field label="Age" required>
                      <input type="number" min="1" max="120" value={profile.age} onChange={(e) => updateProfile('age', e.target.value)} placeholder="Years" className={inputClass} />
                    </Field>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Field label="Gender" required>
                      <select value={profile.gender} onChange={(e) => updateProfile('gender', e.target.value)} className={selectClass}>
                        <option value="">Select gender</option>
                        {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Field label="Height (cm)" required>
                      <input type="number" min="50" max="300" value={profile.height} onChange={(e) => updateProfile('height', e.target.value)} placeholder="cm" className={inputClass} />
                    </Field>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Field label="Weight (kg)" required>
                      <input type="number" min="1" max="500" value={profile.weight} onChange={(e) => updateProfile('weight', e.target.value)} placeholder="kg" className={inputClass} />
                    </Field>
                  </div>
                </div>
              )}

              {/* STEP 1: Medical */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <Field label="Blood Group" required>
                    <div className="grid grid-cols-4 gap-2">
                      {BLOOD_GROUPS.map((bg) => (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => updateProfile('blood_group', bg)}
                          className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${profile.blood_group === bg ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-600 hover:border-teal-300'}`}
                        >
                          {bg}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Allergies">
                    <TagInput values={profile.allergies} onChange={(v) => updateProfile('allergies', v)} placeholder="Type allergy and press Enter (e.g. Penicillin)" />
                  </Field>

                  <Field label="Existing Conditions / Diseases">
                    <TagInput values={profile.existing_diseases} onChange={(v) => updateProfile('existing_diseases', v)} placeholder="Type condition and press Enter (e.g. Diabetes)" />
                  </Field>
                </div>
              )}

              {/* STEP 2: Emergency Contact */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <Field label="Contact Name" required>
                    <input type="text" value={profile.emergency_contact_name} onChange={(e) => updateProfile('emergency_contact_name', e.target.value)} placeholder="Full name" className={inputClass} />
                  </Field>
                  <Field label="Phone Number" required>
                    <input type="tel" value={profile.emergency_contact_phone} onChange={(e) => updateProfile('emergency_contact_phone', e.target.value)} placeholder="+91 XXXXX XXXXX" className={inputClass} />
                  </Field>
                  <Field label="Relationship">
                    <input type="text" value={profile.emergency_contact_relation} onChange={(e) => updateProfile('emergency_contact_relation', e.target.value)} placeholder="e.g. Spouse, Parent, Sibling" className={inputClass} />
                  </Field>
                </div>
              )}

              {/* STEP 3: Lifestyle */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <Field label="Activity Level">
                    <select value={profile.activity_level} onChange={(e) => updateProfile('activity_level', e.target.value)} className={selectClass}>
                      <option value="">Select level</option>
                      {LIFESTYLE_OPTIONS.activity.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </Field>
                  <Field label="Smoking Status">
                    <select value={profile.smoking_status} onChange={(e) => updateProfile('smoking_status', e.target.value)} className={selectClass}>
                      <option value="">Select status</option>
                      {LIFESTYLE_OPTIONS.smoking.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Diet Type">
                    <select value={profile.diet_type} onChange={(e) => updateProfile('diet_type', e.target.value)} className={selectClass}>
                      <option value="">Select diet</option>
                      {LIFESTYLE_OPTIONS.diet.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>
                  <Field label="Average Sleep">
                    <select value={profile.sleep_hours} onChange={(e) => updateProfile('sleep_hours', e.target.value)} className={selectClass}>
                      <option value="">Select sleep hours</option>
                      {LIFESTYLE_OPTIONS.sleep.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="btn-secondary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={completeMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {completeMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : currentStep === STEPS.length - 1 ? (
                <>
                  Complete Profile
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
