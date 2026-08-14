/*
  ChatbotHome.jsx — Módulo AI Chatbot (appes.erp)
  Asistente inteligente con integración real a Groq AI API + contexto ERP,
  historial interactivo deslizable, guardado automático de conversaciones y cambio de sesión.
*/
import { useState, useRef, useEffect } from 'react'
import { sendMessageToGroq } from '../services/groqService'
import './ChatbotHome.css'

const STORAGE_CHAT_SESSIONS = 'appes_chatbot_history_sessions_v1'

const DEFAULT_SESSIONS = [
  {
    id: 'ses-1',
    topic: 'Ventas y Flujo de Mayo',
    summary: '¿Cuáles fueron las ventas totales de este mes y el balance neto?',
    fecha: '30/05/2025 10:25 AM',
    messages: [
      { id: '1', type: 'user', text: '¿Cuáles fueron las ventas totales de este mes?' },
      { id: '2', type: 'bot', text: 'Las ventas totales registradas en el ERP para este período ascienden a **RD$ 1,250,000**, con una utilidad neta estimada de **RD$ 400,000** (margen de ganancia del **32%**).', fromAI: true }
    ]
  },
  {
    id: 'ses-2',
    topic: 'Inventario y Stock Crítico',
    summary: 'Consulta de productos con stock bajo o necesidad de reabastecimiento',
    fecha: '30/05/2025 09:15 AM',
    messages: [
      { id: '3', type: 'user', text: '¿Qué productos tienen stock bajo?' },
      { id: '4', type: 'bot', text: 'Se detectaron niveles críticos en:\n• **Loratadina 10mg** (15 uds)\n• **Omeprazol 20mg** (18 uds)\n• **Complejo B** (8 uds)\nSe sugiere emitir una orden de compra en el módulo de Compras.', fromAI: true }
    ]
  },
  {
    id: 'ses-3',
    topic: 'Cuentas por Cobrar y DGII',
    summary: 'Estado de facturas con NCF y saldos pendientes de clientes',
    fecha: '29/05/2025 04:45 PM',
    messages: [
      { id: '5', type: 'user', text: '¿Cuál es el estado de cuentas por cobrar?' },
      { id: '6', type: 'bot', text: 'El balance total de cuentas por cobrar es de **RD$ 620,000**, distribuidos en: **57% al día**, **24% por vencer** y **19% vencidas**.', fromAI: true }
    ]
  }
]

const SUGGESTIONS = [
  '¿Cuáles fueron las ventas totales de este mes?',
  'Muéstrame los productos más vendidos',
  '¿Cuál es el estado de cuentas por cobrar?',
  'Resumen de gastos por categoría',
  '¿Qué productos tienen stock bajo?',
]

const QUICK_ACTIONS = [
  { icon: '📊', title: 'Generar reporte de ventas', sub: 'Crea un reporte con ventas detallado', prompt: 'Genera un reporte de ventas detallado del mes actual con todos los KPIs importantes' },
  { icon: '📈', title: 'Análisis financiero', sub: 'Resumen financiero y flujo de caja', prompt: 'Muéstrame un análisis financiero completo incluyendo ingresos, gastos y flujo de caja' },
  { icon: '📦', title: 'Estado de inventario', sub: 'Consulta niveles y movimientos', prompt: 'Cuál es el estado actual del inventario? Muéstrame productos con stock bajo o crítico' },
  { icon: '👥', title: 'Clientes nuevos', sub: 'Últimos clientes registrados', prompt: 'Muéstrame los últimos clientes registrados en el sistema y su actividad reciente' },
  { icon: '⏳', title: 'Órdenes pendientes', sub: 'Lista de órdenes por entregar', prompt: 'Lista todas las órdenes de compra pendientes de entrega con sus proveedores y montos' },
]

const CAPABILITIES = [
  { icon: '📈', title: 'Análisis y reportes', desc: 'Genera reportes personalizados, análisis de ventas, finanzas y más.', link: 'Ejemplos →', prompt: 'Genera un análisis de ventas detallado con los datos del sistema' },
  { icon: '💲', title: 'Métricas y KPIs', desc: 'Obtén indicadores clave y métricas de rendimiento en tiempo real.', link: 'Ejemplos →', prompt: 'Muéstrame los KPIs principales del negocio: ventas, compras y empleados' },
  { icon: '📦', title: 'Inventario', desc: 'Consulta stock, productos, movimientos y niveles de inventario.', link: 'Ejemplos →', prompt: 'Cuál es el estado del inventario y qué productos tienen stock crítico' },
  { icon: '👥', title: 'Clientes y ventas', desc: 'Información de clientes, ventas, pedidos y oportunidades.', link: 'Ejemplos →', prompt: 'Dame información de las ventas y clientes más importantes del sistema' },
  { icon: '📑', title: 'Finanzas', desc: 'Estado de cuentas, flujo de caja, gastos e ingresos.', link: 'Ejemplos →', prompt: 'Muéstrame el estado financiero con ingresos, gastos y balance neto' },
  { icon: '🏷️', title: 'Compras y proveedores', desc: 'Órdenes de compra, proveedores y pagos pendientes.', link: 'Ejemplos →', prompt: 'Lista las órdenes de compra y proveedores registrados en el sistema' },
]

export function ChatbotHome() {
  const [sessions, setSessions] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [messages, setMessages] = useState([
    { id: 'welcome', type: 'bot', text: null, isWelcome: true },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [aiMode, setAiMode] = useState(null)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Cargar sesiones de historial guardadas
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_CHAT_SESSIONS)
      if (raw) {
        setSessions(JSON.parse(raw))
      } else {
        localStorage.setItem(STORAGE_CHAT_SESSIONS, JSON.stringify(DEFAULT_SESSIONS))
        setSessions(DEFAULT_SESSIONS)
      }
    } catch (_) {
      setSessions(DEFAULT_SESSIONS)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const showToastMsg = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleNewChat = () => {
    setCurrentSessionId(null)
    setMessages([{ id: 'welcome', type: 'bot', text: null, isWelcome: true }])
    showToastMsg('✨ Nuevo chat iniciado')
    setShowHistoryModal(false)
  }

  const handleLoadSession = (session) => {
    setCurrentSessionId(session.id)
    setMessages([
      { id: 'welcome', type: 'bot', text: null, isWelcome: true },
      ...session.messages
    ])
    setShowHistoryModal(false)
    showToastMsg(`📂 Conversación cargada: "${session.topic}"`)
  }

  const handleDeleteSession = (e, id) => {
    e.stopPropagation()
    const updated = sessions.filter(s => s.id !== id)
    setSessions(updated)
    localStorage.setItem(STORAGE_CHAT_SESSIONS, JSON.stringify(updated))
    if (currentSessionId === id) {
      handleNewChat()
    }
    showToastMsg('🗑️ Conversación eliminada del historial')
  }

  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg || isTyping) return

    const userMsg = { id: Date.now(), type: 'user', text: msg }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    setIsTyping(true)

    try {
      const history = nextMessages.filter(m => !m.isWelcome)
      const result = await sendMessageToGroq(msg, history)

      const botMsg = {
        id: Date.now() + 1,
        type: 'bot',
        text: result.text,
        fromAI: result.success,
        model: result.model,
      }

      const finalMessages = [...nextMessages, botMsg]
      setMessages(finalMessages)
      setAiMode(result.success)

      // Guardar o actualizar sesión en el historial
      const currentTopic = msg.length > 35 ? msg.slice(0, 35) + '...' : msg
      const cleanHistory = finalMessages.filter(m => !m.isWelcome)

      let updatedSessions = [...sessions]
      if (currentSessionId) {
        updatedSessions = updatedSessions.map(s => {
          if (s.id === currentSessionId) {
            return { ...s, messages: cleanHistory, summary: msg }
          }
          return s
        })
      } else {
        const newId = `ses-${Date.now()}`
        setCurrentSessionId(newId)
        const newSession = {
          id: newId,
          topic: currentTopic,
          summary: msg,
          fecha: new Date().toLocaleDateString('es-DO', { hour: '2-digit', minute: '2-digit' }),
          messages: cleanHistory
        }
        updatedSessions = [newSession, ...updatedSessions]
      }

      setSessions(updatedSessions)
      localStorage.setItem(STORAGE_CHAT_SESSIONS, JSON.stringify(updatedSessions))
    } catch (error) {
      const errMsg = {
        id: Date.now() + 1,
        type: 'bot',
        text: `⚠️ Error al procesar tu consulta: ${error.message}. Por favor intenta nuevamente.`,
        fromAI: false,
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatBotText = (text) => {
    return text
      .split('\n')
      .map((line, i) => (
        <span key={i}>
          {line.split(/\*\*(.*?)\*\*/).map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      ))
  }

  return (
    <div className="chat-page">
      {/* ── Banner Hero Panorámico de AI Chatbot (Misma Secuencia de Color Azul Real) ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
        borderRadius: 20,
        padding: '26px 30px',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.3)',
        marginBottom: 16,
      }}>
        {/* Imagen de fondo panorámica de inteligencia artificial */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '55%',
          backgroundImage: 'url(/branding/banner_enterprise_panoramic.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          opacity: 0.35,
          maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, transparent 100%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 750 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.12)',
            color: '#93C5FD',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 10,
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <span>✨</span> PANEL DE CONTROL · ASISTENTE COGNITIVO GROQ AI
          </div>

          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Asistente Inteligente & NLP
          </h1>
          <p style={{ margin: '6px 0 16px', fontSize: 13, color: '#CBD5E1', lineHeight: 1.5, maxWidth: 580 }}>
            Consulta métricas, genera reportes instantáneos y analiza ventas, inventario y finanzas en lenguaje natural.
          </p>

          {/* Estadísticas en vivo estilo referencia */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{sessions.length} Sesiones</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Historial Guardado</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 20 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#34D399', lineHeight: 1 }}>Groq LLaMA 3.3</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Modelo NLP Activo</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 20 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#FCD34D', lineHeight: 1 }}>11 Módulos</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Contexto Conectado</div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowHistoryModal(true)}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(37,99,235,0.4)'
              }}
            >
              🕐 Historial de Chats ({sessions.length})
            </button>
            <button
              onClick={handleNewChat}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              ✨ Nuevo Chat
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs de Navegación del Asistente ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#FFFFFF',
        padding: '12px 18px',
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        marginBottom: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🤖</span> Estado del Motor:
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '3px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            Groq LLaMA 3.3 (Sincronizado con BD)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="chat-history-btn"
            onClick={() => setShowHistoryModal(true)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>🕐</span> Historial ({sessions.length})
          </button>
          <button
            onClick={handleNewChat}
            style={{
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span>+</span> Nuevo Chat
          </button>
        </div>
      </div>

      {/* ── Contenedor Principal: Chat y Sidebar ordenados ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        {/* ── Panel Izquierdo (Chat y Mensajes) ── */}
        <div className="chat-main">

        {/* Área de Mensajes */}
        <div className="chat-messages-area">
          <div className="chat-welcome-msg">
            <div className="chat-bot-avatar">🤖</div>
            <div className="chat-welcome-bubble">
              <h3>¡Hola! Soy el asistente del ERP. ¿En qué te puedo ayudar hoy?</h3>
              <p>Puedo ayudarte con análisis, reportes, métricas y cualquier duda sobre tu negocio. Tengo acceso en tiempo real a los datos de ventas, compras, inventario y finanzas.</p>
            </div>
          </div>

          {/* Historial de mensajes */}
          {messages.filter(m => !m.isWelcome).map(msg => (
            <div key={msg.id} className={msg.type === 'user' ? 'chat-msg-user' : 'chat-msg-bot'}>
              {msg.type === 'bot' && (
                <div className="chat-bot-mini-avatar">🤖</div>
              )}
              <div className={msg.type === 'user' ? 'chat-msg-user-bubble' : 'chat-msg-bot-bubble'}>
                {msg.type === 'bot' ? formatBotText(msg.text) : msg.text}
                {msg.type === 'bot' && msg.fromAI !== undefined && (
                  <div style={{ marginTop: 6, fontSize: 9, color: msg.fromAI ? '#059669' : '#B45309', fontWeight: 600 }}>
                    {msg.fromAI ? `✦ Groq AI (${msg.model || 'llama-3.1-8b-instant'})` : '✦ Modo local (datos del ERP)'}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chat-msg-bot">
              <div className="chat-bot-mini-avatar">🤖</div>
              <div className="chat-msg-bot-bubble">
                <div className="chat-typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input de Mensaje */}
        <div className="chat-input-wrap">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Escribe tu mensaje o pregunta... (Enter para enviar)"
            value={input}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={handleKeyDown}
            maxLength={1000}
          />
          <span className="chat-char-count">{input.length}/1000</span>
          <button className="chat-attach-btn" title="Adjuntar archivo" onClick={() => showToastMsg('Función de adjuntar lista')}>📎</button>
          <button
            className="chat-send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isTyping}
          >
            {isTyping ? '⏳ Procesando...' : '➤ Enviar'}
          </button>
        </div>

        {/* Capacidades del Bot */}
        <div className="chat-capabilities">
          <h4>Lo que puedo hacer por ti</h4>
          <div className="chat-caps-grid">
            {CAPABILITIES.map(c => (
              <div
                key={c.title}
                className="chat-cap-card"
                onClick={() => sendMessage(c.prompt)}
              >
                <span className="chat-cap-icon">{c.icon}</span>
                <span className="chat-cap-title">{c.title}</span>
                <span className="chat-cap-desc">{c.desc}</span>
                <span className="chat-cap-link">{c.link}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel Derecho (Sidebar) ── */}
      <div className="chat-sidebar">
        {/* Sugerencias Populares */}
        <div className="chat-sidebar-card">
          <h4>Sugerencias populares</h4>
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              className="chat-suggestion-btn"
              onClick={() => sendMessage(s)}
            >
              <span>{s}</span>
              <span>→</span>
            </button>
          ))}
        </div>

        {/* Acciones Rápidas */}
        <div className="chat-sidebar-card">
          <h4>Acciones rápidas</h4>
          {QUICK_ACTIONS.map((qa, i) => (
            <button
              key={i}
              className="chat-quick-action"
              onClick={() => sendMessage(qa.prompt)}
            >
              <div className="chat-qa-left">
                <span className="chat-qa-icon">{qa.icon}</span>
                <div>
                  <span className="chat-qa-title">{qa.title}</span>
                  <span className="chat-qa-sub">{qa.sub}</span>
                </div>
              </div>
              <span style={{ color: '#94A3B8', fontSize: 12 }}>›</span>
            </button>
          ))}
        </div>

        {/* Información del Asistente */}
        <div className="chat-sidebar-card">
          <h4>Información del asistente</h4>
          <div className="chat-info-row">
            <span className="chat-info-key">🤖 Modelo de IA</span>
            <span className="chat-info-val">Llama 3.1 8B</span>
          </div>
          <div className="chat-info-row">
            <span className="chat-info-key">⚡ Proveedor</span>
            <span className="chat-info-val">Groq Cloud / Local</span>
          </div>
          <div className="chat-info-row">
            <span className="chat-info-key">💾 Base de datos</span>
            <span className="chat-info-val">appes_erp_prod</span>
          </div>
          <div className="chat-info-row">
            <span className="chat-info-key">🔄 Sincronización</span>
            <span className="chat-info-val">En tiempo real</span>
          </div>
          <div className="chat-status-badge">
            <span className="chat-status-dot" />
            Sistema conectado y operativo
          </div>
        </div>
      </div>
      </div>

      {/* ── Modal Interactivo de Historial de Chats ── */}
      {showHistoryModal && (
        <div
          onClick={() => setShowHistoryModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1400,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              maxWidth: 620,
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              border: '1px solid #E2E8F0',
            }}
          >
            {/* Header del Modal */}
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F8FAFC',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>🕐</span>
                <div>
                  <strong style={{ fontSize: 16, color: '#0F172A', display: 'block' }}>Historial de Conversaciones</strong>
                  <span style={{ fontSize: 11, color: '#64748B' }}>Selecciona cualquier chat anterior para retomarlo</span>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, color: '#94A3B8', cursor: 'pointer', padding: 4 }}
              >
                ✕
              </button>
            </div>

            {/* Listado de Sesiones de Chat */}
            <div style={{ padding: 18, maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sessions.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#94A3B8' }}>
                  No hay conversaciones previas registradas.
                </div>
              ) : (
                sessions.map((ses) => (
                  <div
                    key={ses.id}
                    onClick={() => handleLoadSession(ses)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: `1px solid ${currentSessionId === ses.id ? '#93C5FD' : '#E2E8F0'}`,
                      background: currentSessionId === ses.id ? '#EFF6FF' : '#F8FAFC',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 120ms',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563EB'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = currentSessionId === ses.id ? '#93C5FD' : '#E2E8F0'}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{ses.topic}</span>
                        <span style={{ fontSize: 10, color: '#64748B', background: '#E2E8F0', padding: '1px 6px', borderRadius: 4 }}>
                          {ses.messages?.length || 0} msgs
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ses.summary}
                      </p>
                      <span style={{ fontSize: 10, color: '#94A3B8', marginTop: 2, display: 'block' }}>{ses.fecha}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 10 }}>
                      <button
                        onClick={(e) => handleDeleteSession(e, ses.id)}
                        style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, color: '#DC2626', padding: '5px 8px', fontSize: 11, cursor: 'pointer' }}
                        title="Eliminar del historial"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Modal */}
            <div style={{ padding: '14px 22px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
              <button
                onClick={handleNewChat}
                style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                + Iniciar Nueva Conversación
              </button>
              <button
                onClick={() => setShowHistoryModal(false)}
                style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 1500,
          animation: 'fadeIn 200ms ease',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
