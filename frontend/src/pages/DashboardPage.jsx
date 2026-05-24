/**
 * Dashboard Page
 * Personal Health Command Center
 * All data fetched from backend APIs
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity, Brain, FileText, MapPin, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Clock, Zap, Heart, ArrowRight,
  BarChart2, Shield,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { ROUTES, QUERY_KEYS } from '@/constants'
import dashboardService from '@/services/dashboardService'
import { SkeletonCard, SkeletonChart } from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { format } from 'date-fns'

// ─── Health Score Ring ─────────────────────────────────────────────────────────
function HealthScoreRing({ score, isLoading }) {
  if (isLoading) return <SkeletonCard className="col-span-1" />

  const circumference = 2 * Math.PI * 54
  const strokeDash = score ? (score / 100) * circumference : 0
  const color = score >= 75 ? '#14b8a6' : score >= 50 ? '#f59e0b' : '#ef4444'
  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Fair' : 'Needs Attention'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-6 flex flex-col items-center justify-center text-center"
    >
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Health Score</p>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <motion.circle
            cx="60" cy="60" r="54" fill="none"
            stroke={color} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - strokeDash }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-display font-bold text-slate-800">{score ?? '--'}</span>
          <span className="text-xs text-slate-500">/100</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold" style={{ color }}>{label}</p>
    </motion.div>
  )
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, unit, trend, icon: Icon, color, isLoading }) {
  if (isLoading) return <SkeletonCard />
  const isPositive = trend >= 0
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="metric-card"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-50`}>
          <Icon className={`w-5 h-5 text-${color}-500`} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold flex items-center gap-0.5 ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-display font-bold text-slate-800">
        {value ?? '--'}<span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>
      </p>
      <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
    </motion.div>
  )
}

// ─── Recent Report Card ────────────────────────────────────────────────────────
function ReportItem({ report }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
        <FileText className="w-4 h-4 text-sky-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700 truncate">{report.report_type}</p>
        <p className="text-xs text-slate-400">
          {report.report_date ? format(new Date(report.report_date), 'MMM d, yyyy') : 'No date'}
        </p>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
        report.analysis_status === 'completed'
          ? 'bg-emerald-50 text-emerald-600'
          : 'bg-amber-50 text-amber-600'
      }`}>
        {report.analysis_status === 'completed' ? 'Analyzed' : 'Pending'}
      </span>
    </div>
  )
}

// ─── Recommendation Card ───────────────────────────────────────────────────────
function RecommendationCard({ recommendation }) {
  const icons = { low: CheckCircle, medium: AlertTriangle, high: AlertTriangle }
  const colors = { low: 'emerald', medium: 'amber', high: 'red' }
  const priority = recommendation.priority || 'low'
  const Icon = icons[priority]
  const color = colors[priority]

  return (
    <div className={`flex gap-3 p-4 rounded-xl bg-${color}-50 border border-${color}-100`}>
      <Icon className={`w-5 h-5 text-${color}-500 flex-shrink-0 mt-0.5`} />
      <div>
        <p className="text-sm font-semibold text-slate-700">{recommendation.title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{recommendation.description}</p>
      </div>
    </div>
  )
}

// ─── Activity Feed Item ────────────────────────────────────────────────────────
function ActivityItem({ activity }) {
  const iconMap = {
    report_upload: { icon: FileText, color: 'sky' },
    ai_interaction: { icon: Brain, color: 'teal' },
    symptom_log: { icon: Activity, color: 'emerald' },
    profile_update: { icon: Shield, color: 'violet' },
  }
  const { icon: Icon, color } = iconMap[activity.type] || { icon: Clock, color: 'slate' }

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className={`w-8 h-8 rounded-lg bg-${color}-50 flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon className={`w-4 h-4 text-${color}-500`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700">{activity.description}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {activity.created_at ? format(new Date(activity.created_at), 'MMM d, h:mm a') : ''}
        </p>
      </div>
    </div>
  )
}

// ─── Custom chart tooltip ──────────────────────────────────────────────────────
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

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth()

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD],
    queryFn: dashboardService.getDashboardData,
  })

  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: [QUERY_KEYS.HEALTH_METRICS, '30d'],
    queryFn: () => dashboardService.getHealthMetrics('30d'),
  })

  const { data: recommendationsData, isLoading: recLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: dashboardService.getAIRecommendations,
  })

  const { data: activityData, isLoading: actLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: () => dashboardService.getRecentActivity(8),
  })

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const summary = dashData?.summary || {}
  const chartData = metricsData?.chart_data || []
  const reports = dashData?.recent_reports || []
  const recommendations = recommendationsData?.recommendations || []
  const activities = activityData?.activities || []
  const riskIndicators = dashData?.risk_indicators || []

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900">
            {greeting()}, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Here's your health overview for today</p>
        </div>
        <Link to={ROUTES.AI_ECOSYSTEM} className="btn-primary flex items-center gap-2 self-start sm:self-auto text-sm py-2.5">
          <Zap className="w-4 h-4" />
          Start AI Analysis
        </Link>
      </motion.div>

      {/* Top metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthScoreRing score={summary.health_score} isLoading={dashLoading} />
        <MetricCard label="BMI" value={summary.bmi} unit="" trend={summary.bmi_trend} icon={Activity} color="teal" isLoading={dashLoading} />
        <MetricCard label="Reports Uploaded" value={summary.total_reports} unit="files" icon={FileText} color="sky" isLoading={dashLoading} />
        <MetricCard label="AI Interactions" value={summary.ai_interactions} unit="sessions" icon={Brain} color="violet" isLoading={dashLoading} />
      </div>

      {/* Health trend chart + Risk indicators */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2">
          {metricsLoading ? (
            <SkeletonChart className="h-72" />
          ) : chartData.length === 0 ? (
            <div className="glass-card p-6 h-72 flex items-center justify-center">
              <EmptyState icon={BarChart2} title="No health data yet" description="Upload reports and log symptoms to see your health trends." />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-slate-800">Health Score Trend</h3>
                <span className="text-xs text-slate-400 font-medium">Last 30 days</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="score" name="Health Score" stroke="#14b8a6" strokeWidth={2.5} fill="url(#healthGrad)" dot={false} activeDot={{ r: 5, fill: '#14b8a6' }} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>

        {/* Risk indicators */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6"
        >
          <h3 className="font-display font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-500" />
            Risk Indicators
          </h3>
          {dashLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : riskIndicators.length === 0 ? (
            <EmptyState icon={Shield} title="No risk data" description="Complete your profile to see risk indicators." />
          ) : (
            <div className="space-y-2">
              {riskIndicators.map((r, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${
                  r.level === 'low' ? 'bg-emerald-50' : r.level === 'medium' ? 'bg-amber-50' : 'bg-red-50'
                }`}>
                  <span className="text-sm font-medium text-slate-700">{r.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    r.level === 'low' ? 'text-emerald-700 bg-emerald-100' :
                    r.level === 'medium' ? 'text-amber-700 bg-amber-100' :
                    'text-red-700 bg-red-100'
                  }`}>
                    {r.level?.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom row: reports, recommendations, activity */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent Reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-slate-800">Recent Reports</h3>
            <Link to={ROUTES.MEDICAL_REPORTS} className="text-xs text-teal-600 font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {dashLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />)}
            </div>
          ) : reports.length === 0 ? (
            <EmptyState icon={FileText} title="No reports yet" description="Upload your first medical report." action={() => {}} actionLabel="Upload Report" />
          ) : (
            <div>
              {reports.map((r) => <ReportItem key={r._id} report={r} />)}
            </div>
          )}
        </motion.div>

        {/* AI Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-slate-800 flex items-center gap-2">
              <Brain className="w-4 h-4 text-teal-500" />
              AI Recommendations
            </h3>
          </div>
          {recLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : recommendations.length === 0 ? (
            <EmptyState icon={Brain} title="No recommendations yet" description="Interact with the AI ecosystem to get personalized insights." />
          ) : (
            <div className="space-y-3">
              {recommendations.slice(0, 4).map((r, i) => (
                <RecommendationCard key={i} recommendation={r} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="font-display font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-500" />
            Recent Activity
          </h3>
          {actLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />)}
            </div>
          ) : activities.length === 0 ? (
            <EmptyState icon={Clock} title="No activity yet" description="Your health activity feed will appear here." />
          ) : (
            <div>
              {activities.map((a, i) => <ActivityItem key={i} activity={a} />)}
            </div>
          )}
        </motion.div>
      </div>

      {/* Nearby hospitals teaser */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
              <MapPin className="w-6 h-6 text-teal-500" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-800">Find Nearby Healthcare</h3>
              <p className="text-sm text-slate-500">Locate hospitals and specialists based on your location</p>
            </div>
          </div>
          <Link to={ROUTES.NEARBY_HOSPITALS} className="btn-primary flex items-center gap-2 text-sm py-2.5">
            Explore <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
