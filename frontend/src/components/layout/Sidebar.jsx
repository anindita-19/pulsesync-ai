/**
 * Sidebar Navigation
 */
import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, FileText, Clock, MapPin, Brain,
  Settings, LogOut, ChevronLeft, Activity, Zap,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ROUTES } from '@/constants'

const navItems = [
  { to: ROUTES.DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
  { to: ROUTES.MEDICAL_REPORTS, icon: FileText, label: 'Medical Reports' },
  { to: ROUTES.MEDICAL_HISTORY, icon: Clock, label: 'Medical History' },
  { to: ROUTES.NEARBY_HOSPITALS, icon: MapPin, label: 'Nearby Hospitals' },
  { to: ROUTES.AI_ECOSYSTEM, icon: Brain, label: 'AI Ecosystem', highlight: true },
]

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, type: 'spring', stiffness: 300, damping: 25 },
  }),
}

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-md">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-slate-800 text-lg">PulseSync</span>
          <span className="text-xs font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">AI</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors lg:flex hidden"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* User brief */}
      {user && (
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Navigation</p>

        {navItems.map((item, index) => (
          <motion.div
            key={item.to}
            custom={index}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''} ${
                  item.highlight
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 hover:text-white hover:bg-none'
                    : ''
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      item.highlight ? 'text-white' : isActive ? 'text-teal-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                  {item.highlight && (
                    <span className="ml-auto">
                      <Zap className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                    </span>
                  )}
                </>
              )}
            </NavLink>
          </motion.div>
        ))}

        <div className="pt-4">
          <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Account</p>
          <NavLink
            to={ROUTES.PROFILE_SETTINGS}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <Settings className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>Settings</span>
          </NavLink>
        </div>
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="sidebar-item w-full text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}
