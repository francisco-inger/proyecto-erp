/*
  ChatbotHome.jsx — Módulo AI Chatbot (APPEX.ERP)
  Asistente inteligente con presentación corporativa de Servicios, integración con Groq AI API + contexto ERP,
  historial interactivo deslizable, guardado automático de conversaciones y cambio de sesión.
*/
import React, { useState, useRef, useEffect } from 'react'
import { sendMessageToGroq, generateDirectDbResponse, NUESTROS_SERVICIOS } from '../services/groqService'
import './ChatbotHome.css'

const STORAGE_CHAT_SESSIONS = 'appes_chatbot_history_sessions_v1'

const DEFAULT_SESSIONS = [
  {
    id: 'ses-1',
    topic: 'Ventas y Facturación DGII',
    summary: '¿Cuáles fueron las ventas totales de este mes y el balance neto?',
    fecha: '30/05/2026 10:25 AM',
    messages: [
      { id: '1', type: 'user', text: '¿Cuáles fueron las ventas totales de este mes?' },
      { id: '2', type: 'bot', text: 'Las ventas totales registradas en el ERP para este período ascienden a **RD$ 1,250,000**, con una utilidad neta estimada de **RD$ 400,000** (margen de ganancia del **32%**).', fromAI: true }
    ]
  },
  {
    id: 'ses-2',
    topic: 'Inventario y Stock Crítico',
    summary: 'Consulta de productos con stock bajo o necesidad de reabastecimiento',
    fecha: '30/05/2026 09:15 AM',
    messages: [
      { id: '3', type: 'user', text: '¿Qué productos tienen stock bajo?' },
      { id: '4', type: 'bot', text: 'Se detectaron niveles críticos en:\n• **Loratadina 10mg** (15 uds)\n• **Omeprazol 20mg** (18 uds)\n• **Complejo B** (8 uds)\nSe sugiere emitir una orden de compra en el módulo de Compras.', fromAI: true }
    ]
  },
  {
    id: 'ses-3',
    topic: 'Nuestros Servicios Empresariales',
    summary: 'Portafolio de soluciones corporativas y facturación e-CF',
    fecha: '29/05/2026 04:45 PM',
    messages: [
      { id: '5', type: 'user', text: '¿Qué servicios ofrece la empresa?' },
      { id: '6', type: 'bot', text: 'Ofrecemos una suite integral de 8 módulos: **Ventas & DGII e-CF**, **Compras**, **Inventario Multialmacén**, **CRM**, **Proyectos Kanban**, **Finanzas & Bancos**, **Reportes BI** e **Integraciones WhatsApp/SMTP**.', fromAI: true }
    ]
  }
]

const SUGGESTIONS = [
  '¿Qué servicios ofrece la empresa?',
  '¿Cuáles fueron las ventas totales de este mes?',
  'Muéstrame los productos con stock bajo',
  '¿Cuál es el saldo total en cuentas bancarias?',
  '¿Cómo funciona la facturación electrónica DGII?',
  'Resumen financiero y margen de utilidad',
]

const QUICK_ACTIONS = [
  { icon: '🌟', title: 'Nuestros Servicios', sub: 'Conoce todas las soluciones del ERP', prompt: '¿Cuáles son todos los servicios y soluciones que ofrece APPEX Enterprise Suite?' },
  { icon: '📊', title: 'Generar reporte de ventas', sub: 'Crea un reporte con ventas detallado', prompt: 'Genera un reporte de ventas detallado del mes actual con todos los KPIs importantes' },
  { icon: '📈', title: 'Análisis financiero', sub: 'Resumen financiero y flujo de caja', prompt: 'Muéstrame un análisis financiero completo incluyendo ingresos, gastos y flujo de caja' },
  { icon: '📦', title: 'Estado de inventario', sub: 'Consulta niveles y movimientos', prompt: '¿Cuál es el estado actual del inventario? Muéstrame productos con stock bajo o crítico' },
  { icon: '👥', title: 'Clientes y CRM', sub: 'Cartera y oportunidades activas', prompt: 'Muéstrame los clientes registrados en el CRM y el valor del pipeline comercial' },
  { icon: '🏛️', title: 'Facturación Fiscal DGII', sub: 'NCF e-CF y comprobantes fiscales', prompt: 'Explícame cómo funciona la emisión de comprobantes fiscales e-CF y NCF B01/B02 en el sistema' },
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
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

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
    setIsTyping(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const historyForApi = nextMessages.filter(m => !m.isWelcome)
      const res = await sendMessageToGroq(msg, historyForApi)

      const botText = res.text || generateDirectDbResponse(msg)
      const botMsg = {
        id: Date.now() + 1,
        type: 'bot',
        text: botText,
        fromAI: res.success,
        model: res.model
      }

      const finalMessages = [...nextMessages, botMsg]
      setMessages(finalMessages)

      // Guardar en sesión de historial
      const topic = msg.length > 35 ? msg.slice(0, 35) + '...' : msg
      const newSession = {
        id: currentSessionId || `ses-${Date.now()}`,
        topic,
        summary: botText.slice(0, 75) + '...',
        fecha: new Date().toLocaleString('es-DO', { dateStyle: 'short', timeStyle: 'short' }),
        messages: finalMessages.filter(m => !m.isWelcome)
      }

      const updatedSessions = [newSession, ...sessions.filter(s => s.id !== newSession.id)].slice(0, 20)
      setSessions(updatedSessions)
      setCurrentSessionId(newSession.id)
      localStorage.setItem(STORAGE_CHAT_SESSIONS, JSON.stringify(updatedSessions))
    } catch (_) {
      const fallbackText = generateDirectDbResponse(msg)
      const botMsg = {
        id: Date.now() + 1,
        type: 'bot',
        text: fallbackText,
        fromAI: false
      }
      setMessages([...nextMessages, botMsg])
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
    if (!text) return ''
    return text.split('\n').map((line, idx) => {
      let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      return (
        <span key={idx} style={{ display: 'block', minHeight: line.trim() === '' ? '8px' : 'auto' }} dangerouslySetInnerHTML={{ __html: formatted }} />
      )
    })
  }

  return (
    <div style={{ maxWidth: 1300, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, boxSizing: 'border-box' }}>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 10,
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          zIndex: 1500,
          fontSize: 13,
          fontWeight: 700,
          borderLeft: '4px solid #2563EB',
        }}>
          {toast}
        </div>
      )}

      {/* ── Banner Hero Panorámico ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
        borderRadius: 18,
        padding: '24px 28px',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 20px -4px rgba(30, 58, 138, 0.28)',
        marginBottom: 2,
        width: '100%',
        boxSizing: 'border-box',
      }}>
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '50%',
          backgroundImage: 'url(/branding/banner_enterprise_panoramic.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          opacity: 0.30,
          maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, transparent 100%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 760 }}>
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
            <span>🤖</span> ASISTENTE VIRTUAL IA & ASESOR CORPORATIVO · v2026.4.0
          </div>

          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Asistente IA, Consultas de Negocio & Servicios
          </h1>
          <p style={{ margin: '6px 0 16px', fontSize: 13, color: '#CBD5E1', lineHeight: 1.45, maxWidth: 600 }}>
            Pregunta libremente sobre nuestros servicios empresariales o consulta métricas y reportes en tiempo real extraídos directamente de la base de datos de tu empresa.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => sendMessage('¿Qué servicios ofrece la empresa?')}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(37,99,235,0.4)'
              }}
            >
              🌟 Ver Nuestros Servicios
            </button>
            <button
              onClick={() => setShowHistoryModal(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              🕐 Historial de Chats ({sessions.length})
            </button>
            <button
              onClick={handleNewChat}
              style={{
                background: 'rgba(255, 255, 255, 0.10)',
                color: '#CBD5E1',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 600,
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

      {/* ── Contenedor Principal: Chat y Sidebar ordenados ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start', width: '100%', boxSizing: 'border-box' }}>
        {/* ── Panel Izquierdo (Chat y Mensajes) ── */}
        <div className="chat-main" style={{ width: '100%', boxSizing: 'border-box' }}>

          {/* Área de Mensajes */}
          <div className="chat-messages-area" style={{ maxHeight: '620px', overflowY: 'auto' }}>
            {/* Mensaje de Bienvenida con Portafolio de Servicios */}
            <div className="chat-welcome-msg">
              <div className="chat-bot-avatar">🤖</div>
              <div className="chat-welcome-bubble" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 18 }}>
                <h3 style={{ margin: '0 0 6px', fontSize: 16, color: '#0F172A', fontWeight: 800 }}>
                  ¡Hola! Bienvenido a APPEX Enterprise Suite.
                </h3>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                  Soy tu <strong>Asistente Virtual Inteligente</strong>. Estoy disponible 24/7 para responder cualquier pregunta, asesorarte sobre nuestras soluciones corporativas y consultar en tiempo real las ventas, inventario, finanzas y clientes de tu empresa.
                </p>

                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#1E3A8A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    🌟 NUESTROS SERVICIOS EMPRESARIALES:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
                    {NUESTROS_SERVICIOS.map(s => (
                      <div
                        key={s.id}
                        onClick={() => sendMessage(`Cuéntame más sobre el servicio de ${s.nombre}`)}
                        style={{
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: 8,
                          padding: '8px 10px',
                          cursor: 'pointer',
                          transition: 'all 120ms',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 3
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.background = '#EFF6FF'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                          <span>{s.icono}</span>
                          <span>{s.nombre}</span>
                        </div>
                        <span style={{ fontSize: 11, color: '#64748B', lineHeight: 1.3 }}>
                          {s.descripcion.slice(0, 70)}...
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
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
                      {msg.fromAI ? `✦ Motor IA Cloud (${msg.model || 'llama-3.1-8b-instant'})` : '✦ Motor NLP Local (Base de Datos en Vivo)'}
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
          <div className="chat-input-wrap" style={{ marginTop: 10 }}>
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Hazme cualquier pregunta sobre servicios, ventas, inventario, finanzas o DGII... (Enter para enviar)"
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
            <button
              className="chat-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
            >
              {isTyping ? '⏳...' : '➤ Enviar'}
            </button>
          </div>
        </div>

        {/* ── Panel Derecho (Sidebar de Sugerencias & Acciones) ── */}
        <div className="chat-sidebar" style={{ width: '100%', boxSizing: 'border-box' }}>
          {/* Sugerencias Rápidas */}
          <div className="chat-sidebar-card" style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 800, color: '#0F172A' }}>💡 Preguntas Sugeridas</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="chat-suggestion-btn"
                  onClick={() => sendMessage(s)}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    padding: '8px 10px',
                    fontSize: 12,
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 600
                  }}
                >
                  <span>{s}</span>
                  <span style={{ color: '#2563EB' }}>→</span>
                </button>
              ))}
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="chat-sidebar-card" style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 16, marginTop: 12 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 800, color: '#0F172A' }}>⚡ Atajos del Sistema</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {QUICK_ACTIONS.map((qa, i) => (
                <button
                  key={i}
                  className="chat-quick-action"
                  onClick={() => sendMessage(qa.prompt)}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    padding: '8px 10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{qa.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{qa.title}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{qa.sub}</div>
                    </div>
                  </div>
                  <span style={{ color: '#94A3B8', fontSize: 14 }}>›</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal Historial de Conversaciones ── */}
      {showHistoryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowHistoryModal(false)}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: 560, maxWidth: '92vw', padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>🕐 Historial de Consultas IA</h3>
              <button style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748B' }} onClick={() => setShowHistoryModal(false)}>✕</button>
            </div>

            <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#94A3B8' }}>No hay chats guardados</div>
              ) : (
                sessions.map(s => (
                  <div
                    key={s.id}
                    onClick={() => handleLoadSession(s)}
                    style={{
                      background: currentSessionId === s.id ? '#EFF6FF' : '#F8FAFC',
                      border: currentSessionId === s.id ? '1px solid #3B82F6' : '1px solid #E2E8F0',
                      borderRadius: 10,
                      padding: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{s.topic}</div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{s.fecha}</div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 14 }}
                      title="Eliminar sesión"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                type="button"
                className="ajustes-btn-primary"
                onClick={() => setShowHistoryModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
