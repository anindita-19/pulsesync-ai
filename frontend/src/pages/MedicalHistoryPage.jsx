/**
 * Medical History Page
 * Visual timeline, symptom/medication history, trend charts
 * All data from backend APIs
 */
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Clock, Activity, FileText, Pill, AlertTriangle, Brain,
  TrendingUp, TrendingDown, ChevronDown, ChevronUp, Filter, Plus,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import historyService from '@/services/historyService'
import { QUERY_KEYS } from '@/constants'
import EmptyState from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'

// ─── Timeline event type config ────────────────────────────────────────────────
const EVENT_CONFIG = {
  report_upload: { icon: FileText, color: 'sky', label: 'Report' },
  symptom: { icon: Activity, color: 'teal', label: 'Symptom' },
  medication: { icon: Pill, color: 'violet', label: 'Medication' },
  ai_interaction: { icon: Brain, color: 'cyan', label: 'AI Session' },
  health_alert: { icon: AlertTriangle, color: 'amber', label: 'Alert' },
}

// ─── Timeline Event Item ───────────────────────────────────────────────────────
function TimelineEvent({ event, index }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = EVENT_CONFIG[event.type] || EVENT_CONFIG.symptom
  const Icon = cfg.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex gap-4 group"
    >
      {/* Line & dot */}
      <div className="flex flex-col items-center">
        <div className={`w-9 h-9 rounded-xl bg-${cfg.color}-50 border-2 border-${cfg.color}-200 flex items-center justify-center flex-shrink-0 z-10`}>
          <Icon className={`w-4 h-4 text-${cfg.color}-500`} />
        </div>
        <div className="w-0.5 bg-slate-100 flex-1 mt-1 mb-1 min-h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-5 -mt-1">
        <div
          className="glass-card p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-${cfg.color}-50 text-${cfg.color}-600`}>
                  {cfg.label}
                </span>
                <span className="text-xs text-slate-400">
                  {event.created_at ? format(new Date(event.created_at), 'MMM d, yyyy · h:mm a') : ''}
                </span>
              </div>
              <p className="font-semibold text-slate-800 text-sm mt-1">{event.title}</p>
              {!expanded && event.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{event.description}</p>
              )}
            </div>
            {event.description && (
              <button className="ml-3 text-slate-400 hover:text-slate-600 flex-shrink-0">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>

          {expanded && event.description && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-slate-100"
            >
              <p className="text-sm text-slate-600 leading-relaxed">{event.description}</p>
              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {Object.entries(event.metadata).map(([k, v]) => (
                    <div key={k} className="bg-slate-50 rounded-lg px-3 py-1.5">
                      <p className="text-xs text-slate-400 capitalize">{k.replace(/_/g, ' ')}</p>
                      <p className="text-sm font-medium text-slate-700">{String(v)}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MedicalHistoryPage() {
  const [activeTab, setActiveTab] = useState('timeline')
  const [timelineFilter, setTimelineFilter] = useState('')
  const [trendPeriod, setTrendPeriod] = useState('90d')

  const { data: timelineData, isLoading: timelineLoading } = useQuery({
    queryKey: [QUERY_KEYS.HISTORY, timelineFilter],
    queryFn: () => historyService.getTimeline({ type: timelineFilter || null, limit: 30 }),
  })

  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['health-trends', trendPeriod],
    queryFn: () => historyService.getHealthTrends(trendPeriod),
  })

  const { data: riskData, isLoading: riskLoading } = useQuery({
    queryKey: ['risk-analytics'],
    queryFn: historyService.getRiskAnalytics,
  })

  const { data: medicationsData, isLoading: medLoading } = useQuery({
    queryKey: ['medications'],
    queryFn: () => historyService.getMedications({ active: true }),
  })

  const events = timelineData?.events || []
  const trendChartData = trendsData?.chart_data || []
  const riskFactors = riskData?.risk_factors || []
  const medications = medicationsData?.medications || []

  const tabs = [
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'trends', label: 'Health Trends', icon: TrendingUp },
    { id: 'medications', label: 'Medications', icon: Pill },
    { id: 'risks', label: 'Risk Analysis', icon: AlertTriangle },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display font-bold text-2xl text-slate-900">Medical History</h1>
        <p className="text-slate-500 text-sm mt-0.5">Your complete health journey in one place</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:block">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── TIMELINE TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'timeline' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Filter */}
            <div className="flex items-center gap-3 mb-5">
              <Filter className="w-4 h-4 text-slate-400" />
              <div className="flex gap-2 flex-wrap">
                {[{ value: '', label: 'All Events' }, ...Object.entries(EVENT_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTimelineFilter(opt.value)}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
                      timelineFilter === opt.value
                        ? 'bg-teal-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline */}
            {timelineLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
                    <Skeleton className="flex-1 h-20 rounded-2xl" />
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <EmptyState icon={Clock} title="No history yet" description="Your health events will appear here as you use PulseSync AI." />
            ) : (
              <div>
                {events.map((event, i) => (
                  <TimelineEvent key={event._id || i} event={event} index={i} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar summary */}
          <div className="space-y-4">
            {riskLoading ? (
              <div className="glass-card p-6">
                <Skeleton className="h-5 w-32 mb-4" />
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
                </div>
              </div>
            ) : (
              <div className="glass-card p-6">
                <h3 className="font-display font-semibold text-slate-800 mb-4">Risk Overview</h3>
                {riskFactors.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No risk data available</p>
                ) : (
                  <div className="space-y-2">
                    {riskFactors.map((r, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">{r.factor}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${r.score >= 70 ? 'bg-red-400' : r.score >= 40 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                              style={{ width: `${r.score}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-500">{r.score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Active Medications summary */}
            <div className="glass-card p-6">
              <h3 className="font-display font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Pill className="w-4 h-4 text-violet-500" />
                Active Medications
              </h3>
              {medLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 rounded-lg" />)}
                </div>
              ) : medications.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No active medications</p>
              ) : (
                <div className="space-y-2">
                  {medications.slice(0, 4).map((m, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{m.name}</p>
                        <p className="text-xs text-slate-400">{m.dosage} · {m.frequency}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TRENDS TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'trends' && (
        <div className="space-y-5">
          <div className="flex justify-end gap-2">
            {['30d', '90d', '180d', '1y'].map((p) => (
              <button
                key={p}
                onClick={() => setTrendPeriod(p)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
                  trendPeriod === p ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {trendsLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="glass-card p-6 h-64 animate-pulse bg-slate-100 rounded-2xl" />
              ))}
            </div>
          ) : trendChartData.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No trend data yet" description="Upload reports and log symptoms to see health trends over time." />
          ) : (
            <>
              <div className="glass-card p-6">
                <h3 className="font-display font-semibold text-slate-800 mb-4">Health Score Over Time</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="health_score" name="Health Score" stroke="#14b8a6" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-6">
                <h3 className="font-display font-semibold text-slate-800 mb-4">Activity Breakdown</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="reports" name="Reports" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="symptoms" name="Symptoms" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ai_sessions" name="AI Sessions" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── MEDICATIONS TAB ───────────────────────────────────────────────── */}
      {activeTab === 'medications' && (
        <div>
          {medLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
            </div>
          ) : medications.length === 0 ? (
            <EmptyState icon={Pill} title="No medications logged" description="Add your current and past medications to your health record." />
          ) : (
            <div className="space-y-3">
              {medications.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                      <Pill className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{m.name}</p>
                      <p className="text-sm text-slate-500">{m.dosage} · {m.frequency}</p>
                      {m.prescribed_by && <p className="text-xs text-slate-400">Dr. {m.prescribed_by}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${m.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {m.active ? 'Active' : 'Inactive'}
                    </span>
                    {m.end_date && (
                      <p className="text-xs text-slate-400 mt-1">Until {format(new Date(m.end_date), 'MMM d, yyyy')}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── RISKS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'risks' && (
        <div className="grid md:grid-cols-2 gap-5">
          {riskLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
          ) : riskFactors.length === 0 ? (
            <div className="md:col-span-2">
              <EmptyState icon={AlertTriangle} title="No risk data" description="Complete your health profile to enable AI risk analysis." />
            </div>
          ) : riskFactors.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-800">{r.factor}</h4>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  r.score >= 70 ? 'bg-red-100 text-red-700' :
                  r.score >= 40 ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {r.score >= 70 ? 'High' : r.score >= 40 ? 'Medium' : 'Low'} Risk
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${r.score}%` }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  className={`h-full rounded-full ${r.score >= 70 ? 'bg-red-400' : r.score >= 40 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                />
              </div>
              <p className="text-xs text-slate-500">{r.description}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
