import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Zap } from 'lucide-react'
import { ROUTES } from '@/constants'

export default function FloatingAIButton() {
  const navigate = useNavigate()

  return (
    <motion.button
      onClick={() => navigate(ROUTES.AI_ECOSYSTEM)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 300 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-30 flex items-center gap-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-5 py-3.5 rounded-2xl shadow-glow-lg hover:shadow-glow font-semibold text-sm"
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        <Brain className="w-5 h-5" />
      </motion.div>
      <span className="hidden sm:block">AI Assistant</span>
      <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
    </motion.button>
  )
}
