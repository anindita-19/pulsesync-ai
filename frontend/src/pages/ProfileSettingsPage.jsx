/**
 * Profile Settings Page
 * View and edit user profile, health info, account settings
 */
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, User, Shield, Bell, Palette, CheckCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { useNotification } from '@/context/NotificationContext'
import userService from '@/services/userService'
import { QUERY_KEYS, BLOOD_GROUPS, GENDER_OPTIONS, LIFESTYLE_OPTIONS } from '@/constants'
import { Skeleton } from '@/components/ui/Skeleton'

function Section({ title, icon: Icon, children }) {
  return (
    <div className="glass-card p-6">
      <h3 className="font-display font-semibold text-slate-800 mb-5 flex items-center gap-2">
        <Icon className="w-4 h-4 text-teal-500" />
        {title}
      </h3>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputClass = 'w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-800 text-sm bg-white'

export default function ProfileSettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const { user, updateUser } = useAuth()
  const { toast } = useNotification()
  const queryClient = useQueryClient()

  const { data: profileData, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.PROFILE],
    queryFn: userService.getProfile,
  })

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    blood_group: '',
    allergies: '',
    existing_diseases: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    activity_level: '',
    diet_type: '',
    sleep_hours: '',
  })

  useEffect(() => {
    if (profileData) {
      setForm({
        full_name: profileData.full_name || '',
        email: profileData.email || '',
        age: profileData.profile?.age || '',
        gender: profileData.profile?.gender || '',
        height: profileData.profile?.height || '',
        weight: profileData.profile?.weight || '',
        blood_group: profileData.profile?.blood_group || '',
        allergies: profileData.profile?.allergies?.join(', ') || '',
        existing_diseases: profileData.profile?.existing_diseases?.join(', ') || '',
        emergency_contact_name: profileData.profile?.emergency_contact?.name || '',
        emergency_contact_phone: profileData.profile?.emergency_contact?.phone || '',
        emergency_contact_relation: profileData.profile?.emergency_contact?.relation || '',
        activity_level: profileData.profile?.lifestyle?.activity_level || '',
        diet_type: profileData.profile?.lifestyle?.diet_type || '',
        sleep_hours: profileData.profile?.lifestyle?.sleep_hours || '',
      })
    }
  }, [profileData])

  const updateMutation = useMutation({
    mutationFn: (data) => userService.updateProfile(data),
    onSuccess: (data) => {
      updateUser({ full_name: form.full_name })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] })
      toast.success('Profile updated successfully', { title: 'Saved' })
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const handleSave = () => {
    updateMutation.mutate({
      full_name: form.full_name,
      profile: {
        age: Number(form.age),
        gender: form.gender,
        height: Number(form.height),
        weight: Number(form.weight),
        blood_group: form.blood_group,
        allergies: form.allergies.split(',').map(s => s.trim()).filter(Boolean),
        existing_diseases: form.existing_diseases.split(',').map(s => s.trim()).filter(Boolean),
        emergency_contact: {
          name: form.emergency_contact_name,
          phone: form.emergency_contact_phone,
          relation: form.emergency_contact_relation,
        },
        lifestyle: {
          activity_level: form.activity_level,
          diet_type: form.diet_type,
          sleep_hours: form.sleep_hours,
        },
      },
    })
  }

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const tabs = [
    { id: 'profile', label: 'Personal Info', icon: User },
    { id: 'health', label: 'Health Data', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-display font-bold text-2xl text-slate-900">Profile Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your health profile and preferences</p>
      </motion.div>

      {/* Avatar section */}
      <div className="glass-card p-5 mb-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-display font-bold text-2xl shadow-md">
          {user?.full_name?.charAt(0) || 'U'}
        </div>
        <div>
          <p className="font-display font-bold text-slate-800 text-lg">{user?.full_name}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
          {profileData?.profile_completed && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold mt-1">
              <CheckCircle className="w-3.5 h-3.5" /> Profile Complete
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:block">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <Section title="Account Information" icon={User}>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name">
                <input type="text" value={form.full_name} onChange={set('full_name')} className={inputClass} />
              </Field>
              <Field label="Email Address">
                <input type="email" value={form.email} disabled className={`${inputClass} bg-slate-50 cursor-not-allowed`} />
              </Field>
            </div>
          </Section>

          <Section title="Body Metrics" icon={Shield}>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Age">
                <input type="number" value={form.age} onChange={set('age')} className={inputClass} />
              </Field>
              <Field label="Gender">
                <select value={form.gender} onChange={set('gender')} className={inputClass}>
                  <option value="">Select</option>
                  {GENDER_OPTIONS.map(g => <option key={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Height (cm)">
                <input type="number" value={form.height} onChange={set('height')} className={inputClass} />
              </Field>
              <Field label="Weight (kg)">
                <input type="number" value={form.weight} onChange={set('weight')} className={inputClass} />
              </Field>
            </div>
          </Section>
        </motion.div>
      )}

      {/* Health tab */}
      {activeTab === 'health' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <Section title="Medical Information" icon={Shield}>
            <div className="space-y-4">
              <Field label="Blood Group">
                <div className="grid grid-cols-4 gap-2">
                  {BLOOD_GROUPS.map((bg) => (
                    <button key={bg} type="button" onClick={() => setForm(p => ({ ...p, blood_group: bg }))}
                      className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${form.blood_group === bg ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-600'}`}>
                      {bg}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Allergies (comma-separated)">
                <input type="text" value={form.allergies} onChange={set('allergies')} placeholder="e.g. Penicillin, Peanuts" className={inputClass} />
              </Field>
              <Field label="Existing Conditions (comma-separated)">
                <input type="text" value={form.existing_diseases} onChange={set('existing_diseases')} placeholder="e.g. Diabetes, Hypertension" className={inputClass} />
              </Field>
            </div>
          </Section>

          <Section title="Emergency Contact" icon={Shield}>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Name">
                <input type="text" value={form.emergency_contact_name} onChange={set('emergency_contact_name')} className={inputClass} />
              </Field>
              <Field label="Phone">
                <input type="tel" value={form.emergency_contact_phone} onChange={set('emergency_contact_phone')} className={inputClass} />
              </Field>
              <Field label="Relationship">
                <input type="text" value={form.emergency_contact_relation} onChange={set('emergency_contact_relation')} className={inputClass} />
              </Field>
            </div>
          </Section>

          <Section title="Lifestyle" icon={Shield}>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Activity Level">
                <select value={form.activity_level} onChange={set('activity_level')} className={inputClass}>
                  <option value="">Select</option>
                  {LIFESTYLE_OPTIONS.activity.map(a => <option key={a}>{a}</option>)}
                </select>
              </Field>
              <Field label="Diet Type">
                <select value={form.diet_type} onChange={set('diet_type')} className={inputClass}>
                  <option value="">Select</option>
                  {LIFESTYLE_OPTIONS.diet.map(d => <option key={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Sleep Hours">
                <select value={form.sleep_hours} onChange={set('sleep_hours')} className={inputClass}>
                  <option value="">Select</option>
                  {LIFESTYLE_OPTIONS.sleep.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          </Section>
        </motion.div>
      )}

      {/* Notifications tab */}
      {activeTab === 'notifications' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Section title="Notification Preferences" icon={Bell}>
            <p className="text-sm text-slate-500 mb-4">Configure how and when you receive notifications</p>
            <div className="space-y-3">
              {[
                { label: 'AI Health Recommendations', desc: 'Get notified when new AI insights are ready' },
                { label: 'Report Analysis Complete', desc: 'When your uploaded reports finish AI analysis' },
                { label: 'Health Risk Alerts', desc: 'Important alerts about health risk changes' },
                { label: 'Weekly Health Summary', desc: 'A weekly digest of your health metrics' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:ring-2 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                  </label>
                </div>
              ))}
            </div>
          </Section>
        </motion.div>
      )}

      {/* Save button */}
      {activeTab !== 'notifications' && (
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            {updateMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      )}
    </div>
  )
}
