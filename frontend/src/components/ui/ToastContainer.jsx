import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useNotification } from '@/context/NotificationContext'

const icons = {
  success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  info: <Info className="w-5 h-5 text-sky-500" />,
}

const colors = {
  success: 'border-l-4 border-emerald-500',
  error: 'border-l-4 border-red-500',
  warning: 'border-l-4 border-amber-500',
  info: 'border-l-4 border-sky-500',
}

export default function ToastContainer() {
  const { notifications, removeNotification } = useNotification()

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`bg-white rounded-xl shadow-xl pointer-events-auto flex items-start gap-3 p-4 ${colors[n.type]}`}
          >
            <div className="flex-shrink-0 mt-0.5">{icons[n.type]}</div>
            <div className="flex-1 min-w-0">
              {n.title && <p className="font-semibold text-slate-800 text-sm">{n.title}</p>}
              <p className="text-slate-600 text-sm">{n.message}</p>
            </div>
            <button
              onClick={() => removeNotification(n.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
