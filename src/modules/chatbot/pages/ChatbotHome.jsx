/*
  ChatbotHome.jsx — Módulo AI Chatbot (appes.erp)
  Asistente inteligente con interfaz de chat interactiva, sugerencias rápidas y chats recientes.
*/
import { useState, useRef, useEffect } from 'react'
import './ChatbotHome.css'

const INITIAL_MESSAGES = [
  {
    id: 'welcome',
    type: 'bot',
    text: null,
    isWelcome: true,
  },
]

const SUGGESTIONS = [
  '¿Cuáles fueron las ventas totales de este mes?',
  'Muéstrame los productos más vendidos',
  '¿Cuál es el estado de cuentas por cobrar?',
  'Resumen de gastos por categoría',
  '¿Qué productos tienen stock bajo?',
]

const QUICK_ACTIONS = [
  { icon: '📊', title: 'Generar reporte de ventas', sub: 'Crea un reporte con ventas detallado', prompt: 'Genera un reporte de ventas detallado del mes actual' },
  { icon: '📈', title: 'Análisis financiero', sub: 'Resumen financiero y flujo de caja', prompt: 'Muéstrame un análisis financiero completo con flujo de caja' },
  { icon: '📦', title: 'Estado de inventario', sub: 'Consulta niveles y movimientos', prompt: 'Muéstrame el estado actual del inventario con niveles de stock' },
  { icon: '👥', title: 'Clientes nuevos', sub: 'Últimos clientes registrados', prompt: '¿Cuáles son los últimos clientes registrados en el CRM?' },
  { icon: '⏳', title: 'Órdenes pendientes', sub: 'Lista de órdenes por entregar', prompt: '¿Cuáles son las órdenes de compra pendientes de entrega?' },
]

const HISTORY = [
  { id: 1, topic: 'Ventas del mes', summary: 'Análisis de ventas de mayo 2025 por categoría y canal', fecha: '30/05/2025 10:25 AM' },
  { id: 2, topic: 'Inventario bajo', summary: 'Productos con stock bajo y sugerencias de compra', fecha: '30/05/2025 09:15 AM' },
  { id: 3, topic: 'Flujo de caja', summary: 'Flujo de caja proyectado para los próximos 30 días', fecha: '29/05/2025 04:45 PM' },
]

const CAPABILITIES = [
  { icon: '📈', title: 'Análisis y reportes', desc: 'Genera reportes personalizados, análisis de ventas, finanzas y más.', link: 'Ejemplos →' },
  { icon: '💲', title: 'Métricas y KPIs', desc: 'Obtén indicadores clave y métricas de rendimiento en tiempo real.', link: 'Ejemplos →' },
  { icon: '📦', title: 'Inventario', desc: 'Consulta stock, productos, movimientos y niveles de inventario.', link: 'Ejemplos →' },
  { icon: '👥', title: 'Clientes y ventas', desc: 'Información de clientes, ventas, pedidos y oportunidades.', link: 'Ejemplos →' },
  { icon: '📑', title: 'Finanzas', desc: 'Estado de cuentas, flujo de caja, gastos e ingresos.', link: 'Ejemplos →' },
  { icon: '🏷️', title: 'Compras y proveedores', desc: 'Órdenes de compra, proveedores y pagos pendientes.', link: 'Ejemplos →' },
]

// Respuestas inteligentes simuladas basadas en palabras clave
function generateBotResponse(msg) {
  const m = msg.toLowerCase()

  if (m.includes('venta') || m.includes('pedido')) {
    return '📊 **Resumen de Ventas del Mes:**\n\n• **Total acumulado:** RD$ 1,250,000\n• **Órdenes completadas:** 142\n• **Órdenes pendientes:** 14\n• **Crecimiento vs mes anterior:** ↑ 18.2%\n\nLos productos más vendidos son **Smartphone XYZ** y **Laptop Pro 15**. ¿Deseas ver el desglose por canal o categoría?'
  }

  if (m.includes('inventario') || m.includes('stock') || m.includes('producto')) {
    return '📦 **Estado del Inventario:**\n\n• **Total de SKUs activos:** 1,247\n• **Productos con stock bajo (< 10 uds):** 23\n• **Valor total en inventario:** RD$ 8,450,000\n\n⚠️ **Productos críticos:** Auriculares Bluetooth (2 uds), Teclado Mecánico (1 ud), Monitor 27" (0 uds).\n\n¿Deseas que genere una orden de compra sugerida?'
  }

  if (m.includes('cobrar') || m.includes('financier') || m.includes('flujo') || m.includes('gasto') || m.includes('ingreso')) {
    return '💰 **Resumen Financiero:**\n\n• **Ingresos Totales:** RD$ 1,250,000 ↑ 18.2%\n• **Gastos Totales:** RD$ 850,000 ↑ 12.1%\n• **Utilidad Neta:** RD$ 400,000 ↑ 22.4%\n• **Margen de Ganancia:** 32%\n\n**Cuentas por Cobrar:** RD$ 620,000\n• Vencidas: RD$ 120,000 (19%)\n• Por vencer: RD$ 150,000 (24%)\n• Al día: RD$ 350,000 (57%)'
  }

  if (m.includes('cliente') || m.includes('crm') || m.includes('registrado')) {
    return '👥 **Últimos Clientes Registrados:**\n\n1. **Farmacia San Pedro** — Registrado hace 2 horas\n2. **Clínica Los Robles** — Registrado hace 5 horas\n3. **Distribuidora Central RD** — Registrado ayer\n4. **Supermercado La Unión** — Registrado hace 2 días\n\n**Total de clientes activos:** 247\n**Nuevos este mes:** 18\n\n¿Deseas ver información detallada de alguno?'
  }

  if (m.includes('compra') || m.includes('proveedor') || m.includes('orden')) {
    return '🏷️ **Órdenes de Compra Pendientes:**\n\n1. **OC-002** — Electrónica Global SA — RD$ 145,000 — *Pendiente*\n2. **OC-007** — Soluciones IT del Caribe — RD$ 115,000 — *Pendiente*\n3. **OC-008** — Plásticos & Envases SRL — RD$ 47,500 — *En Tránsito*\n\n**Total en órdenes abiertas:** RD$ 307,500\n\n¿Deseas aprobar alguna orden o ver más detalles?'
  }

  if (m.includes('reporte') || m.includes('análisis') || m.includes('pdf')) {
    return '📊 **Generando Reporte de Ventas...**\n\nEl reporte incluirá:\n• Resumen ejecutivo del período\n• Ventas por canal y categoría\n• Top 10 productos más vendidos\n• Comparativa vs período anterior\n• Proyecciones para el próximo mes\n\n✅ Reporte listo para exportar. ¿Prefieres formato **PDF** o **Excel**?'
  }

  if (m.includes('hola') || m.includes('buenas') || m.includes('buenos')) {
    return '¡Hola! 👋 Soy el asistente inteligente de **appes.erp**. Puedo ayudarte con:\n\n• 📊 Análisis de ventas y reportes\n• 📦 Consultas de inventario y stock\n• 💰 Resumen financiero y flujo de caja\n• 👥 Información de clientes y CRM\n• 🏷️ Órdenes de compra y proveedores\n\n¿En qué puedo ayudarte hoy?'
  }

  return `He procesado tu consulta: *"${msg}"*\n\nBasándome en los datos del sistema, estoy analizando la información relevante. Para obtener una respuesta más precisa, puedes:\n\n• Especificar el período de tiempo (ej: "ventas de mayo 2025")\n• Indicar el módulo específico (ventas, inventario, finanzas)\n• Usar las sugerencias del panel lateral\n\n¿Deseas que te muestre algún reporte específico?`
}

export function ChatbotHome() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showHistory, setShowHistory] = useState(true)
  const [toast, setToast] = useState(null)
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
    if (!msg) return

    const userMsg = { id: Date.now(), type: 'user', text: msg }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simular delay de respuesta del bot
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800))

    const botResponse = generateBotResponse(msg)
    const botMsg = { id: Date.now() + 1, type: 'bot', text: botResponse }
    setMessages(prev => [...prev, botMsg])
    setIsTyping(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Formatear texto del bot con negrita y saltos de línea
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
            <button className="chat-history-btn" onClick={() => setShowHistory(h => !h)}>
              🕐 Historial de chats
            </button>
          </div>
        </div>

        {/* Área de Mensajes */}
        <div className="chat-messages-area">
          {/* Mensaje de bienvenida */}
          <div className="chat-welcome-msg">
            <div className="chat-bot-avatar">🤖</div>
            <div className="chat-welcome-bubble">
              <h3>¡ Hola! Soy el asistente del ERP. ¿En qué te puedo ayudar hoy?</h3>
              <p>Puedo ayudarte con análisis, reportes, métricas y cualquier duda sobre tu negocio.</p>
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
            placeholder="Escribe tu mensaje o pregunta..."
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
            ➤ Enviar
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
                onClick={() => {
                  const prompts = {
                    'Análisis y reportes': 'Genera un análisis de ventas detallado',
                    'Métricas y KPIs': 'Muéstrame los KPIs principales del negocio',
                    'Inventario': 'Cuál es el estado actual del inventario',
                    'Clientes y ventas': 'Muéstrame información de los clientes y ventas',
                    'Finanzas': 'Muéstrame el flujo de caja y estado financiero',
                    'Compras y proveedores': 'Lista las órdenes de compra pendientes',
                  }
                  sendMessage(prompts[c.title] || c.title)
                }}
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
            <span className="chat-info-val">GPT-4o</span>
          </div>
          <div className="chat-info-row">
            <span className="chat-info-key">💾 Base de datos</span>
            <span className="chat-info-val">appes_erp_prod</span>
          </div>
          <div className="chat-info-row">
            <span className="chat-info-key">🔄 Última actualización</span>
            <span className="chat-info-val">30/05/2025 10:30 AM</span>
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
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
