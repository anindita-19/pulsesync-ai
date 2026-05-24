/**
 * Landing Page
 * Premium healthcare AI platform homepage
 */
import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import {
  Activity, Brain, FileText, MapPin, Shield, Zap, Star, ArrowRight,
  ChevronRight, Heart, Microscope, Stethoscope, Users, TrendingUp,
  Lock, Clock, CheckCircle, Play,
} from 'lucide-react'
import { ROUTES, APP_NAME } from '@/constants'

// ─── Public Navbar ─────────────────────────────────────────────────────────────
function PublicNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to={ROUTES.HOME} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-sm">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-slate-800 text-lg">PulseSync</span>
          <span className="text-sm font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">AI</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to={ROUTES.ABOUT} className="text-sm text-slate-600 hover:text-teal-600 font-medium transition-colors">About</Link>
          <Link to={ROUTES.CONTACT} className="text-sm text-slate-600 hover:text-teal-600 font-medium transition-colors">Contact</Link>
          <Link to={ROUTES.LOGIN} className="text-sm text-slate-600 hover:text-teal-600 font-medium transition-colors">Sign In</Link>
          <Link to={ROUTES.SIGNUP} className="btn-primary text-sm py-2 px-5">
            Get Started Free
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ─── Animated Blob ─────────────────────────────────────────────────────────────
function GradientBlob({ className, color = 'teal', delay = 0 }) {
  const colors = {
    teal: 'from-teal-300/30 to-cyan-300/20',
    blue: 'from-sky-300/30 to-blue-300/20',
    purple: 'from-violet-300/20 to-purple-300/20',
  }
  return (
    <motion.div
      animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
      transition={{ repeat: Infinity, duration: 12 + delay, ease: 'easeInOut', delay }}
      className={`absolute rounded-full bg-gradient-to-br ${colors[color]} blur-3xl ${className}`}
    />
  )
}

// ─── Feature Card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, color = 'teal', delay = 0 }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  const colorMap = {
    teal: 'from-teal-500 to-cyan-500 bg-teal-50',
    blue: 'from-sky-500 to-blue-500 bg-sky-50',
    purple: 'from-violet-500 to-purple-500 bg-violet-50',
    green: 'from-emerald-500 to-teal-500 bg-emerald-50',
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="glass-card p-6 hover:shadow-glow transition-all duration-300 hover:-translate-y-1 group"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color].split(' ')[0]} ${colorMap[color].split(' ')[1]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-display font-semibold text-slate-800 text-lg mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </motion.div>
  )
}

// ─── Stats Card ────────────────────────────────────────────────────────────────
function StatCard({ value, label, icon: Icon }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ type: 'spring', stiffness: 200 }}
      className="text-center"
    >
      <div className="text-3xl font-display font-bold gradient-text mb-1">{value}</div>
      <div className="text-sm text-slate-500 font-medium">{label}</div>
    </motion.div>
  )
}

// ─── Testimonial Card ──────────────────────────────────────────────────────────
function TestimonialCard({ name, role, content, rating }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card p-6"
    >
      <div className="flex gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
        ))}
      </div>
      <p className="text-slate-600 text-sm leading-relaxed mb-4">"{content}"</p>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
          {name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm">{name}</p>
          <p className="text-xs text-slate-500">{role}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Step Card ─────────────────────────────────────────────────────────────────
function StepCard({ step, title, description, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="flex gap-4 items-start"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-glow">
        {step}
      </div>
      <div>
        <h4 className="font-semibold text-slate-800 mb-1">{title}</h4>
        <p className="text-slate-500 text-sm">{description}</p>
      </div>
    </motion.div>
  )
}

// ─── Main Landing Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <PublicNavbar />

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background blobs */}
        <GradientBlob className="w-[600px] h-[600px] -top-40 -right-40" color="teal" />
        <GradientBlob className="w-[400px] h-[400px] bottom-0 left-0" color="blue" delay={2} />
        <GradientBlob className="w-[300px] h-[300px] top-1/2 left-1/3" color="purple" delay={4} />

        <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Hero text */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 text-teal-700 text-sm font-semibold px-4 py-2 rounded-full mb-6"
              >
                <Zap className="w-3.5 h-3.5 text-teal-500 fill-teal-500" />
                AI-Powered Healthcare Platform
              </motion.div>

              <h1 className="font-display font-bold text-5xl lg:text-6xl text-slate-900 leading-tight mb-6">
                Your Personal{' '}
                <span className="gradient-text">AI Health</span>{' '}
                Intelligence
              </h1>

              <p className="text-slate-500 text-xl leading-relaxed mb-8 max-w-lg">
                PulseSync AI analyzes your health data, understands your medical reports, and provides intelligent, personalized healthcare insights — 24/7.
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                <Link to={ROUTES.SIGNUP} className="btn-primary flex items-center gap-2">
                  Start AI Analysis
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to={ROUTES.ABOUT} className="btn-secondary flex items-center gap-2">
                  <Play className="w-4 h-4 fill-current" />
                  See How It Works
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-500" />
                  HIPAA Compliant
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-500" />
                  End-to-End Encrypted
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-500" />
                  Free to Start
                </div>
              </div>
            </motion.div>

            {/* Hero visual - animated health UI */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
              className="relative hidden lg:block"
            >
              {/* Main dashboard preview card */}
              <div className="glass-card p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Health Score</p>
                    <p className="text-3xl font-display font-bold gradient-text">87/100</p>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center"
                  >
                    <Heart className="w-6 h-6 text-teal-500 fill-teal-100" />
                  </motion.div>
                </div>

                {/* Mini chart bars */}
                <div className="flex items-end gap-1.5 h-16 mb-4">
                  {[60, 75, 65, 80, 72, 87, 82, 90, 85, 87].map((v, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${v}%` }}
                      transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
                      className="flex-1 rounded-t-sm bg-gradient-to-t from-teal-500 to-cyan-400 opacity-80"
                    />
                  ))}
                </div>

                {/* Agent status */}
                <div className="space-y-2">
                  {['Symptom Analysis', 'Report Scan', 'Risk Assessment'].map((label, i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + i * 0.2 }}
                      className="flex items-center gap-2 text-xs text-slate-600"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }}
                        className="w-2 h-2 rounded-full bg-teal-400"
                      />
                      {label}
                      <span className="ml-auto text-teal-600 font-medium">Active</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Floating secondary cards */}
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="absolute -top-8 -left-8 glass-card p-4 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">AI Recommendation</p>
                    <p className="text-xs text-slate-500">3 new insights ready</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [5, -5, 5] }}
                transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                className="absolute -bottom-4 -right-8 glass-card p-4 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Risk Level</p>
                    <p className="text-xs text-emerald-600 font-medium">Low Risk</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-r from-teal-500 to-cyan-500">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '50K+', label: 'Active Users' },
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '2M+', label: 'Reports Analyzed' },
              { value: '4.9★', label: 'User Rating' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-display font-bold text-white mb-1">{stat.value}</div>
                <div className="text-teal-100 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-health-gradient">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Platform Features</span>
            <h2 className="font-display font-bold text-4xl text-slate-900 mt-2 mb-4">
              Everything You Need for{' '}
              <span className="gradient-text">Smart Healthcare</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              A complete AI-powered health intelligence platform built for modern healthcare needs.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon={Brain} title="AI Health Analysis" description="Multi-agent AI analyzes your symptoms, reports, and history to provide comprehensive, personalized health insights." color="teal" delay={0} />
            <FeatureCard icon={FileText} title="Smart Report Analysis" description="Upload medical reports — PDFs, lab results, imaging — and get instant AI-powered summaries and interpretations." color="blue" delay={0.1} />
            <FeatureCard icon={Activity} title="Real-time Health Monitoring" description="Track your health metrics over time with dynamic charts and receive proactive alerts for concerning trends." color="purple" delay={0.2} />
            <FeatureCard icon={MapPin} title="Nearby Hospitals" description="Locate hospitals and specialist clinics near you based on your health needs and location in real-time." color="green" delay={0.3} />
            <FeatureCard icon={Shield} title="Privacy-First Design" description="Your health data is end-to-end encrypted and HIPAA compliant. You own your data, always." color="teal" delay={0.4} />
            <FeatureCard icon={Clock} title="Medical Timeline" description="A complete visual timeline of your entire health journey — medications, symptoms, reports, and doctor visits." color="blue" delay={0.5} />
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">How It Works</span>
              <h2 className="font-display font-bold text-4xl text-slate-900 mt-2 mb-8">
                Your Health Journey in{' '}
                <span className="gradient-text">4 Simple Steps</span>
              </h2>

              <div className="space-y-6">
                <StepCard step="01" title="Create Your Health Profile" description="Complete your medical profile including health history, allergies, and lifestyle information." delay={0} />
                <StepCard step="02" title="Upload Your Reports" description="Securely upload lab reports, prescriptions, imaging results — any medical document." delay={0.1} />
                <StepCard step="03" title="Activate AI Analysis" description="Our multi-agent AI ecosystem analyzes your complete health picture in real-time." delay={0.2} />
                <StepCard step="04" title="Get Intelligent Insights" description="Receive personalized recommendations, risk alerts, and specialist suggestions powered by AI." delay={0.3} />
              </div>
            </motion.div>

            {/* AI Ecosystem visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="glass-card p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-cyan-50 opacity-50" />
                <div className="relative z-10">
                  <p className="text-sm font-semibold text-slate-600 mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-teal-500" />
                    AI Ecosystem Live Activity
                  </p>
                  <div className="space-y-3">
                    {[
                      { label: 'Symptom Agent', status: 'Analyzing...', color: 'teal' },
                      { label: 'Report Analysis Agent', status: 'Scanning PDF...', color: 'sky' },
                      { label: 'Nutrition Agent', status: 'Generating insights...', color: 'emerald' },
                      { label: 'Risk Assessment Agent', status: 'Complete ✓', color: 'violet' },
                    ].map((agent, i) => (
                      <motion.div
                        key={agent.label}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.15 }}
                        className="flex items-center justify-between bg-white/70 rounded-xl px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            animate={agent.status.includes('✓') ? {} : { scale: [1, 1.4, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className={`w-2.5 h-2.5 rounded-full bg-${agent.color}-400`}
                          />
                          <span className="text-sm font-medium text-slate-700">{agent.label}</span>
                        </div>
                        <span className={`text-xs text-${agent.color}-600 font-medium`}>{agent.status}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-health-gradient">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-display font-bold text-4xl text-slate-900 mb-4">
              Trusted by Thousands of{' '}
              <span className="gradient-text">Health-Conscious People</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard
              name="Sarah Mitchell"
              role="Chronic Condition Patient"
              content="PulseSync AI helped me understand my lab reports in plain language. The AI recommendations were spot on and helped me have more informed conversations with my doctor."
              rating={5}
            />
            <TestimonialCard
              name="Dr. Rajesh Kumar"
              role="General Practitioner"
              content="I recommend this to my patients who want to stay on top of their health. The medical history timeline is incredibly useful for tracking long-term health trends."
              rating={5}
            />
            <TestimonialCard
              name="Priya Sharma"
              role="Health Enthusiast"
              content="The AI ecosystem is next level. It's like having a personal health advisor available 24/7. The report upload feature alone saved me hours of confusion."
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-white relative overflow-hidden">
        <GradientBlob className="w-[500px] h-[500px] -bottom-20 left-1/2 -translate-x-1/2" color="teal" />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display font-bold text-5xl text-slate-900 mb-6">
              Start Your{' '}
              <span className="gradient-text">Health Journey</span>{' '}
              Today
            </h2>
            <p className="text-slate-500 text-xl mb-8">
              Join thousands of people taking control of their health with AI-powered intelligence.
            </p>
            <Link to={ROUTES.SIGNUP} className="btn-primary inline-flex items-center gap-2 text-base px-8 py-4">
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <span className="font-display font-bold text-white text-lg">PulseSync AI</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                AI-powered healthcare intelligence platform for modern, proactive health management.
              </p>
            </div>

            {[
              { title: 'Product', links: ['Features', 'AI Ecosystem', 'Security', 'Pricing'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'HIPAA Compliance', 'Cookie Policy'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-white text-sm mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-slate-500 hover:text-teal-400 transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-600">© 2025 PulseSync AI. All rights reserved.</p>
            <p className="text-sm text-slate-600">Made with ❤️ for better healthcare</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
