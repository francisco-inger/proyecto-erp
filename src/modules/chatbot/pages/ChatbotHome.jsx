/*
  ChatbotHome.jsx — Módulo AI Chatbot (appes.erp)
  Asistente inteligente con integración real a Groq AI API + contexto ERP
*/
import { useState, useRef, useEffect } from 'react'
import { sendMessageToGroq } from '../services/groqService'
import './ChatbotHome.css'

// ── Datos estáticos del módulo ──────────────────────────────────────────────

const INITIAL_MESSAGES = [
  { id: 'welcome', type: 'bot', text: null, isWelcome: true },
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

const HISTORY = [
  { id: 1, topic: 'Ventas del mes', summary: 'Análisis de ventas de mayo 2025 por categoría y canal', fecha: '30/05/2025 10:25 AM' },
  { id: 2, topic: 'Inventario bajo', summary: 'Productos con stock bajo y sugerencias de compra', fecha: '30/05/2025 09:15 AM' },
  { id: 3, topic: 'Flujo de caja', summary: 'Flujo de caja proyectado para los próximos 30 días', fecha: '29/05/2025 04:45 PM' },
]

const CAPABILITIES = [
  { icon: '📈', title: 'Análisis y reportes', desc: 'Genera reportes personalizados, análisis de ventas, finanzas y más.', link: 'Ejemplos →', prompt: 'Genera un análisis de ventas detallado con los datos del sistema' },
  { icon: '💲', title: 'Métricas y KPIs', desc: 'Obtén indicadores clave y métricas de rendimiento en tiempo real.', link: 'Ejemplos →', prompt: 'Muéstrame los KPIs principales del negocio: ventas, compras y empleados' },
  { icon: '📦', title: 'Inventario', desc: 'Consulta stock, productos, movimientos y niveles de inventario.', link: 'Ejemplos →', prompt: 'Cuál es el estado del inventario y qué productos tienen stock crítico' },
  { icon: '👥', title: 'Clientes y ventas', desc: 'Información de clientes, ventas, pedidos y oportunidades.', link: 'Ejemplos →', prompt: 'Dame información de las ventas y clientes más importantes del sistema' },
  { icon: '📑', title: 'Finanzas', desc: 'Estado de cuentas, flujo de caja, gastos e ingresos.', link: 'Ejemplos →', prompt: 'Muéstrame el estado financiero con ingresos, gastos y balance neto' },
  { icon: '🏷️', title: 'Compras y proveedores', desc: 'Órdenes de compra, proveedores y pagos pendientes.', link: 'Ejemplos →', prompt: 'Lista las órdenes de compra y proveedores registrados en el sistema' },
]

// ── Componente Principal ────────────────────────────────────────────────────

export function ChatbotHome() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showHistory, setShowHistory] = useState(true)
  const [toast, setToast] = useState(null)
  const [aiMode, setAiMode] = useState(null) // null=sin respuesta aún, true=Groq, false=local
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const showToastMsg = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg || isTyping) return

    const userMsg = { id: Date.now(), type: 'user', text: msg }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    setIsTyping(true)

    try {
      // Historial de mensajes sin el mensaje de bienvenida
      const history = messages.filter(m => !m.isWelcome)

      // Llamar a Groq API con contexto del ERP desde localStorage
      const result = await sendMessageToGroq(msg, history)

      const botMsg = {
        id: Date.now() + 1,
        type: 'bot',
        text: result.text,
        fromAI: result.success,
        model: result.model,
      }

      setMessages(prev => [...prev, botMsg])
      setAiMode(result.success)
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

  // Formatear texto del bot: convierte **negrita** y saltos de línea
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
      {/* ── Panel Izquierdo (Principal) ── */}
      <div className="chat-main">

        {/* Breadcrumb y Título */}
        <div>
          <div className="chat-breadcrumb">Módulo AI / Chatbot</div>
          <div className="chat-title-row" style={{ marginTop: 4 }}>
            <div>
              <h1 className="chat-title">
                Asistente inteligente <span style={{ fontSize: 20 }}>✨</span>
              </h1>
              <p className="chat-subtitle">Tu asistente de IA para obtener información, análisis y respuestas sobre tu ERP.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Indicador de modo AI */}
              {aiMode === true && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '4px 10px', borderRadius: 6 }}>
                  🤖 Groq AI activo
                </span>
              )}
              {aiMode === false && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#B45309', background: '#FFFBEB', padding: '4px 10px', borderRadius: 6 }}>
                  💾 Modo local
                </span>
              )}
              <button className="chat-history-btn" onClick={() => setShowHistory(h => !h)}>
                🕐 Historial de chats
              </button>
            </div>
          </div>
        </div>

        {/* Área de Mensajes */}
        <div className="chat-messages-area">
          {/* Mensaje de bienvenida del bot */}
          <div className="chat-welcome-msg">
            <div className="chat-bot-avatar">🤖</div>
            <div className="chat-welcome-bubble">
              <h3>¡Hola! Soy el asistente del ERP. ¿En qué te puedo ayudar hoy?</h3>
              <p>Puedo ayudarte con análisis, reportes, métricas y cualquier duda sobre tu negocio. Tengo acceso en tiempo real a los datos de ventas, compras, inventario y RRHH.</p>
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
                {/* Badge AI/Local en mensajes del bot */}
                {msg.type === 'bot' && msg.fromAI !== undefined && (
                  <div style={{ marginTop: 6, fontSize: 9, color: msg.fromAI ? '#059669' : '#B45309', fontWeight: 600 }}>
                    {msg.fromAI ? `✦ Groq AI (${msg.model || 'llama-3.1-8b-instant'})` : '✦ Modo local (datos del ERP)'}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Indicador de escritura */}
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
          <button className="chat-attach-btn" title="Adjuntar archivo" onClick={() => showToastMsg('Función de adjuntar próximamente')}>📎</button>
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

        {/* Chats Recientes */}
        {showHistory && (
          <div className="chat-history-card">
            <h4>Chats recientes</h4>
            <table className="chat-history-table">
              <thead>
                <tr>
                  <th>Tema</th>
                  <th>Resumen</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {HISTORY.map(h => (
                  <tr key={h.id}>
                    <td><span className="chat-hist-topic">{h.topic}</span></td>
                    <td>
                      <button
                        className="chat-hist-summary"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                        onClick={() => sendMessage(h.summary)}
                      >
                        {h.summary}
                      </button>
                    </td>
                    <td style={{ color: '#94A3B8', whiteSpace: 'nowrap' }}>{h.fecha}</td>
                    <td>
                      <button
                        className="chat-hist-icon-btn"
                        title="Retomar chat"
                        onClick={() => {
                          sendMessage(h.summary)
                          showToastMsg(`Retomando chat: "${h.topic}"`)
                        }}
                      >
                        💬
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="chat-see-all">
              <button onClick={() => showToastMsg('Cargando historial completo...')}>
                Ver todo el historial
              </button>
            </div>
          </div>
        )}
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
          <button className="chat-see-more" onClick={() => showToastMsg('Mostrando más sugerencias...')}>
            Ver más sugerencias
          </button>
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
            <span className="chat-info-val">Groq Cloud</span>
          </div>
          <div className="chat-info-row">
            <span className="chat-info-key">💾 Base de datos</span>
            <span className="chat-info-val">appes_erp_prod</span>
          </div>
          <div className="chat-info-row">
            <span className="chat-info-key">🔄 Datos sincronizados</span>
            <span className="chat-info-val">En tiempo real</span>
          </div>
          <div className="chat-status-badge">
            <span className="chat-status-dot" />
            Sistema conectado y funcionando correctamente
          </div>
        </div>
      </div>

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
          zIndex: 1100,
          animation: 'fadeIn 200ms ease',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
