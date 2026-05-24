/**
 * AI Healthcare Ecosystem Page
 * Immersive full-page AI chat interface
 * Real WebSocket streaming + Redis Pub/Sub agent activity
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Send, Mic, MicOff, X, ArrowLeft, Zap, Activity,
  ChevronDown, Stethoscope, FileSearch, Leaf, Lightbulb, Loader2,
  RefreshCw, Shield, Volume2, VolumeX,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ROUTES, QUERY_KEYS, AI_AGENTS, EXPLANATION_LEVELS } from '@/constants'
import wsManager from '@/websocket/wsManager'
import chatService from '@/services/chatService'
import { useAuth } from '@/context/AuthContext'
import { useNotification } from '@/context/NotificationContext'
import { format } from 'date-fns'

// ─── Neural background canvas ──────────────────────────────────────────────────
function NeuralBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let nodes = []

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      initNodes()
    }

    function initNodes() {
      nodes = Array.from({ length: 40 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2,
      }))
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connections
      nodes.forEach((a, i) => {
        nodes.slice(i + 1).forEach((b) => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(20, 184, 166, ${0.15 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })

      // Draw nodes
      nodes.forEach((n) => {
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1

        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(20, 184, 166, ${n.alpha})`
        ctx.fill()
      })

      animId = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
    />
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-md rounded-2xl rounded-tl-sm w-fit border border-white/20">
      <Brain className="w-4 h-4 text-teal-300" />
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-teal-300 typing-dot"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Agent Activity Panel ──────────────────────────────────────────────────────
function AgentPanel({ agentStatuses }) {
  const agentIcons = {
    symptom: Stethoscope,
    analysis: Brain,
    report: FileSearch,
    nutrition: Leaf,
    recommendation: Lightbulb,
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          Agent Activity
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {AI_AGENTS.map((agent) => {
          const status = agentStatuses[agent.id] || { status: 'idle', message: 'Standby' }
          const Icon = agentIcons[agent.id] || Brain
          const isActive = status.status === 'active' || status.status === 'processing'

          return (
            <motion.div
              key={agent.id}
              layout
              className={`rounded-xl p-3 transition-all duration-300 ${
                isActive
                  ? 'bg-teal-500/20 border border-teal-400/30'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <motion.div
                  animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className={`w-2 h-2 rounded-full ${
                    status.status === 'active' ? 'bg-teal-400' :
                    status.status === 'processing' ? 'bg-amber-400' :
                    status.status === 'complete' ? 'bg-emerald-400' :
                    'bg-slate-500'
                  }`}
                />
                <Icon className="w-3.5 h-3.5 text-teal-300" />
                <span className="text-xs font-semibold text-white/80 truncate">{agent.name}</span>
              </div>
              <p className="text-xs text-white/50 pl-4 truncate">{status.message}</p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Confidence Meter ──────────────────────────────────────────────────────────
function ConfidenceMeter({ confidence }) {
  if (confidence === null || confidence === undefined) return null

  const pct = Math.round(confidence * 100)
  const color = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
  const label = pct >= 75 ? 'High' : pct >= 50 ? 'Medium' : 'Low'

  return (
    <div className="px-4 py-3 border-t border-white/10">
      <p className="text-xs text-white/50 mb-2 font-semibold uppercase tracking-wider">AI Confidence</p>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1 }}
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
        <span className="text-sm font-bold" style={{ color }}>{pct}%</span>
      </div>
      <p className="text-xs mt-1 font-semibold" style={{ color }}>{label} Confidence</p>
    </div>
  )
}

// ─── Chat Message ──────────────────────────────────────────────────────────────
function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mr-2 flex-shrink-0 mt-1 shadow-glow">
          <Brain className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`max-w-lg ${isUser ? 'chat-bubble-user' : 'bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl rounded-tl-sm px-4 py-3 text-white/90 text-sm leading-relaxed'}`}>
        {message.streaming ? (
          <span className="stream-cursor">{message.content}</span>
        ) : (
          message.content
        )}

        {message.explanation_level && !isUser && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <span className="text-xs text-white/40">
              {EXPLANATION_LEVELS.find(l => l.level === message.explanation_level)?.label} explanation
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Initialization Screen ─────────────────────────────────────────────────────
function EcosystemInit({ onEnter }) {
  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
      <NeuralBackground />
      <div className="relative z-10 text-center px-6">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-glow-lg"
        >
          <Brain className="w-12 h-12 text-white" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-display font-bold text-4xl text-white mb-3"
        >
          AI Healthcare Ecosystem
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-teal-300 text-lg mb-8"
        >
          Multi-agent health intelligence at your service
        </motion.p>

        {/* Agent initialization indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-wrap justify-center gap-3 mb-8"
        >
          {AI_AGENTS.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-sm text-teal-200"
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-teal-400"
              />
              {agent.name}
            </motion.div>
          ))}
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          onClick={onEnter}
          className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-lg px-10 py-4 rounded-2xl shadow-glow-lg hover:shadow-glow transition-all hover:scale-105 flex items-center gap-3 mx-auto"
        >
          <Zap className="w-5 h-5 fill-yellow-300 text-yellow-300" />
          Start AI Ecosystem
        </motion.button>
      </div>
    </div>
  )
}

// ─── Main Ecosystem Page ───────────────────────────────────────────────────────
export default function AIEcosystemPage() {
  const [initialized, setInitialized] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [agentStatuses, setAgentStatuses] = useState({})
  const [confidence, setConfidence] = useState(null)
  const [explanationLevel, setExplanationLevel] = useState(1)
  const [suggestions, setSuggestions] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState(null)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const { user } = useAuth()
  const { toast } = useNotification()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // ── Create chat session ──────────────────────────────────────────────────────
  const createSessionMutation = useMutation({
    mutationFn: chatService.createSession,
    onSuccess: (data) => {
      setSessionId(data.session_id)
      // Connect WebSocket with session
      wsManager.connect(data.session_id)
    },
    onError: () => {
      toast.error('Failed to initialize AI session', { title: 'Error' })
    },
  })

  // ── Load existing messages when session is ready ────────────────────────────
  const { data: messagesData } = useQuery({
    queryKey: [QUERY_KEYS.CHAT_MESSAGES, sessionId],
    queryFn: () => chatService.getMessages(sessionId),
    enabled: !!sessionId,
  })

  useEffect(() => {
    if (messagesData?.messages) {
      setMessages(messagesData.messages)
    }
  }, [messagesData])

  // ── WebSocket event handlers ─────────────────────────────────────────────────
  useEffect(() => {
    if (!initialized) return

    // Connection status
    const unsubStatus = wsManager.on('connection_status', ({ connected }) => {
      setWsConnected(connected)
    })

    // Agent activity from Redis Pub/Sub via WebSocket
    const unsubAgent = wsManager.on('agent_activity', (payload) => {
      setAgentStatuses((prev) => ({
        ...prev,
        [payload.agent_id]: {
          status: payload.status,
          message: payload.message,
        },
      }))
    })

    // Streaming token
    const unsubToken = wsManager.on('chat_token', (payload) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.message_id
            ? { ...m, content: m.content + payload.token, streaming: true }
            : m
        )
      )
    })

    // Stream complete
    const unsubComplete = wsManager.on('chat_complete', (payload) => {
      setIsTyping(false)
      setStreamingMessageId(null)
      setConfidence(payload.confidence)
      if (payload.suggestions) setSuggestions(payload.suggestions)

      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.message_id
            ? { ...m, streaming: false, content: payload.full_content || m.content }
            : m
        )
      )

      // Reset agent statuses
      setAgentStatuses({})
    })

    // Chat error
    const unsubError = wsManager.on('chat_error', (payload) => {
      setIsTyping(false)
      setStreamingMessageId(null)
      toast.error(payload.message || 'AI response error', { title: 'Error' })
    })

    return () => {
      unsubStatus()
      unsubAgent()
      unsubToken()
      unsubComplete()
      unsubError()
    }
  }, [initialized, toast])

  // ── Scroll to bottom on new messages ────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // ── Initialize ecosystem ─────────────────────────────────────────────────────
  const handleEnter = () => {
    setInitialized(true)
    createSessionMutation.mutate({ explanation_level: explanationLevel })
  }

  // ── Send message ─────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || !sessionId || isTyping) return

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }

    const aiMessageId = `ai-${Date.now()}`
    const aiPlaceholder = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      streaming: true,
      explanation_level: explanationLevel,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage, aiPlaceholder])
    setStreamingMessageId(aiMessageId)
    setInput('')
    setIsTyping(true)
    setSuggestions([])

    // Send via WebSocket
    if (wsManager.isConnected()) {
      wsManager.send('chat_message', {
        session_id: sessionId,
        content,
        explanation_level: explanationLevel,
        message_id: aiMessageId,
      })
    } else {
      // Fallback to REST API
      try {
        const response = await chatService.sendMessage(sessionId, content, { explanationLevel })
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId
              ? { ...m, content: response.content, streaming: false }
              : m
          )
        )
        setIsTyping(false)
        setConfidence(response.confidence)
        if (response.suggestions) setSuggestions(response.suggestions)
      } catch (err) {
        setIsTyping(false)
        toast.error('Failed to get AI response')
        setMessages((prev) => prev.filter((m) => m.id !== aiMessageId))
      }
    }
  }, [sessionId, isTyping, explanationLevel, toast])

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  // ── Voice input (Web Speech API) ─────────────────────────────────────────────
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.warning('Voice input not supported in this browser')
      return
    }
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInput(transcript)
    }
    recognition.onend = () => setIsRecording(false)
    recognition.onerror = () => setIsRecording(false)
    setIsRecording(true)
    recognition.start()
  }

  // ── New session ───────────────────────────────────────────────────────────────
  const startNewSession = () => {
    wsManager.disconnect()
    setMessages([])
    setSessionId(null)
    setAgentStatuses({})
    setConfidence(null)
    setSuggestions([])
    createSessionMutation.mutate({ explanation_level: explanationLevel })
  }

  // ── Init screen ──────────────────────────────────────────────────────────────
  if (!initialized) {
    return <EcosystemInit onEnter={handleEnter} />
  }

  return (
    <div className="fixed inset-0 bg-slate-950 flex overflow-hidden">
      <NeuralBackground />

      {/* ── Left Panel: Agent Activity ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-64 flex-col border-r border-white/10 relative z-10">
        <div className="px-4 py-4 border-b border-white/10 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-white text-sm">PulseSync AI</span>
          <div className={`ml-auto w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400' : 'bg-red-400'}`} title={wsConnected ? 'Connected' : 'Disconnected'} />
        </div>

        <div className="flex-1 overflow-hidden">
          <AgentPanel agentStatuses={agentStatuses} />
        </div>

        <ConfidenceMeter confidence={confidence} />

        {/* Back button */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* ── Main Chat Area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col relative z-10 min-w-0">
        {/* Chat header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="lg:hidden p-1.5 rounded-lg text-white/50 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display font-bold text-white text-base">AI Health Assistant</h1>
              <p className="text-xs text-teal-300">
                {createSessionMutation.isPending ? 'Initializing...' : wsConnected ? 'Live · Multi-agent active' : 'Connecting...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Explanation level selector */}
            <select
              value={explanationLevel}
              onChange={(e) => setExplanationLevel(Number(e.target.value))}
              className="text-xs bg-white/10 border border-white/20 text-white rounded-lg px-2 py-1.5 outline-none"
            >
              {EXPLANATION_LEVELS.map((l) => (
                <option key={l.level} value={l.level} className="bg-slate-800">
                  {l.label}
                </option>
              ))}
            </select>

            <button
              onClick={startNewSession}
              title="New session"
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-5 py-5 custom-scrollbar">
          {messages.length === 0 && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mb-4"
              >
                <Brain className="w-8 h-8 text-teal-400" />
              </motion.div>
              <h2 className="font-display font-bold text-xl text-white mb-2">Hello, {user?.full_name?.split(' ')[0]}</h2>
              <p className="text-white/50 text-sm max-w-sm">
                I'm your AI health assistant. Ask me about symptoms, your reports, medications, or anything health-related.
              </p>
            </motion.div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {isTyping && !streamingMessageId && (
            <div className="flex items-start gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mr-2 shadow-glow">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <TypingIndicator />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion chips */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="px-5 pb-3 flex flex-wrap gap-2"
            >
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-full transition-all hover:scale-105"
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        <div className="px-5 pb-5 bg-slate-900/50 backdrop-blur-md border-t border-white/10">
          <form onSubmit={handleSubmit} className="flex gap-3 mt-4">
            <div className="flex-1 flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={createSessionMutation.isPending ? 'Initializing session...' : 'Ask about your health, symptoms, or reports...'}
                disabled={createSessionMutation.isPending || isTyping}
                className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm"
              />
              <button
                type="button"
                onClick={toggleVoice}
                className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${isRecording ? 'text-red-400 bg-red-400/20' : 'text-white/40 hover:text-white'}`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isTyping || createSessionMutation.isPending}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 flex-shrink-0"
            >
              {isTyping ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </form>
          <p className="text-center text-xs text-white/20 mt-2">
            AI responses are for informational purposes only. Consult a doctor for medical advice.
          </p>
        </div>
      </div>

      {/* ── Right Panel: Health Context ────────────────────────────────── */}
      <div className="hidden xl:flex xl:w-56 flex-col border-l border-white/10 relative z-10">
        <div className="px-4 py-4 border-b border-white/10">
          <p className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Health Context
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-xs text-white/40 mb-1">Patient</p>
            <p className="text-sm font-semibold text-white">{user?.full_name}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-xs text-white/40 mb-1">Explanation Level</p>
            <p className="text-sm font-semibold text-teal-300">
              {EXPLANATION_LEVELS.find((l) => l.level === explanationLevel)?.label}
            </p>
            <p className="text-xs text-white/30 mt-0.5">
              {EXPLANATION_LEVELS.find((l) => l.level === explanationLevel)?.description}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-xs text-white/40 mb-1">Session</p>
            <p className="text-xs text-white/60 font-mono break-all">{sessionId?.slice(0, 16) || '—'}...</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-xs text-white/40 mb-2">Tips</p>
            {[
              'Describe symptoms in detail',
              'Mention duration & severity',
              'Ask to explain a report',
              'Request specialist advice',
            ].map((tip, i) => (
              <p key={i} className="text-xs text-white/40 mb-1 flex items-start gap-1.5">
                <span className="text-teal-500 flex-shrink-0">›</span>
                {tip}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
