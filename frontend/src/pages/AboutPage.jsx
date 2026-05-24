/**
 * About Page
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, Brain, Shield, Users, ArrowRight, Heart, Zap, Globe } from 'lucide-react'
import { ROUTES } from '@/constants'

function PublicNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to={ROUTES.HOME} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-slate-800">PulseSync AI</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to={ROUTES.LOGIN} className="text-sm text-slate-600 hover:text-teal-600 font-medium">Sign In</Link>
          <Link to={ROUTES.SIGNUP} className="btn-primary text-sm py-2 px-5">Get Started</Link>
        </div>
      </div>
    </nav>
  )
}

export function AboutPage() {
  const values = [
    { icon: Shield, title: 'Privacy First', desc: 'Your health data is yours. End-to-end encrypted, HIPAA compliant, never sold.' },
    { icon: Brain, title: 'AI-Powered', desc: 'Multi-agent AI provides personalized, context-aware health intelligence.' },
    { icon: Heart, title: 'Patient-Centric', desc: 'Designed to empower patients — not replace doctors, but help you understand your health.' },
    { icon: Globe, title: 'Accessible', desc: 'Healthcare intelligence for everyone, regardless of background or location.' },
  ]

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <div className="pt-24 pb-16">
        <section className="max-w-4xl mx-auto px-6 text-center py-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block bg-teal-50 text-teal-600 font-semibold text-sm px-4 py-2 rounded-full mb-6">About PulseSync AI</span>
            <h1 className="font-display font-bold text-5xl text-slate-900 mb-6 leading-tight">
              Reimagining Healthcare<br />
              <span className="gradient-text">with Artificial Intelligence</span>
            </h1>
            <p className="text-slate-500 text-xl leading-relaxed max-w-2xl mx-auto">
              PulseSync AI was built with a single mission: to give every person the tools to understand, track, and optimize their health with the power of AI.
            </p>
          </motion.div>
        </section>

        <section className="bg-health-gradient py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="font-display font-bold text-3xl text-slate-900 text-center mb-12">Our Core Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((v, i) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-6 text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                    <v.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-display font-semibold text-slate-800 mb-2">{v.title}</h3>
                  <p className="text-sm text-slate-500">{v.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="font-display font-bold text-3xl text-slate-900 mb-6">Ready to take control of your health?</h2>
          <Link to={ROUTES.SIGNUP} className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </section>
      </div>
    </div>
  )
}

export function ContactPage() {
  const [form, setForm] = React.useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // In production, send to backend contact API
    setSubmitted(true)
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none text-slate-800 text-sm bg-white'

  return (
    <div className="min-h-screen bg-health-gradient">
      <PublicNavbar />
      <div className="pt-24 max-w-2xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display font-bold text-4xl text-slate-900 mb-3 text-center">Get in Touch</h1>
          <p className="text-slate-500 text-center mb-10">Have questions? We're here to help.</p>

          {submitted ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card p-12 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-teal-500" />
              </div>
              <h2 className="font-display font-bold text-2xl text-slate-900 mb-2">Message Sent!</h2>
              <p className="text-slate-500">We'll get back to you within 24 hours.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card p-8 space-y-4 shadow-xl">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Your Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputClass} placeholder="jane@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject</label>
                <input type="text" required value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className={inputClass} placeholder="How can we help?" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message</label>
                <textarea required value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={5} className={`${inputClass} resize-none`} placeholder="Tell us more..." />
              </div>
              <button type="submit" className="w-full btn-primary py-3.5">Send Message</button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default AboutPage
