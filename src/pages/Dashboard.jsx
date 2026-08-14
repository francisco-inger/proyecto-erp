/*
  Dashboard — appes.erp
  Vista principal rediseñada según el mockup de referencia.
  Muestra KPIs con Sparklines, gráfico de ventas suavizado, ventas por categoría (Donut),
  asistente IA/Chatbot, actividades, inventario, top productos, financiero, integraciones y acciones rápidas.
*/
import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../core/auth/AuthContext'
import { dashboardService } from './dashboardService'
import { Link } from 'react-router-dom'
import './Dashboard.css'

// ─── Utilidades ───────────────────────────────────────────────────────────────

function fmtMoney(n) {
  if (n === undefined || n === null) return '—'
  return 'RD$ ' + Number(n).toLocaleString('es-DO')
}

// ─── Mini Sparkline SVG (Curva suave con gradiente) ──────────────────────────

function Sparkline({ data, color = '#2563EB', fillId = 'blueGradient' }) {
  if (!data || data.length < 2) return null
  const W = 180, H = 45
  const vals = data.map((d) => d.valor)
  const min = Math.min(...vals), max = Math.max(...vals)
  const range = max - min || 1

  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W
    const y = H - ((v - min) / range) * (H - 10) - 5
    return { x, y }
  })

  // Generar curva beziér suave
  let dPath = `M ${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i]
    const next = pts[i + 1]
    const mx = (curr.x + next.x) / 2
    dPath += ` C ${mx},${curr.y} ${mx},${next.y} ${next.x},${next.y}`
  }

  const areaPath = `${dPath} L ${W},${H} L 0,${H} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="dash-sparkline-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${fillId})`} />
      <path d={dPath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

// ─── Gráfico de Ventas Principal (Curva suave con nodos) ─────────────────────

function MainSalesChart() {
  // 12 puntos de control para la curva del mes
  const points = [
    { x: 20, y: 190, val: '60k', day: '01' },
    { x: 80, y: 160, val: '90k', day: '05' },
    { x: 120, y: 130, val: '120k', day: '' },
    { x: 160, y: 175, val: '80k', day: '' },
    { x: 200, y: 140, val: '110k', day: '10' },
    { x: 240, y: 140, val: '110k', day: '' },
    { x: 280, y: 100, val: '150k', day: '15' },
    { x: 320, y: 70, val: '180k', day: '' },
    { x: 360, y: 110, val: '140k', day: '' },
    { x: 400, y: 125, val: '125k', day: '20' },
    { x: 440, y: 90, val: '160k', day: '' },
    { x: 480, y: 125, val: '130k', day: '25' },
    { x: 520, y: 125, val: '130k', day: '' },
    { x: 580, y: 40, val: '220k', day: '30' },
  ]

  const W = 600, H = 220

  let dPath = `M ${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i]
    const next = points[i + 1]
    const mx = (curr.x + next.x) / 2
    dPath += ` C ${mx},${curr.y} ${mx},${next.y} ${next.x},${next.y}`
  }

  const areaPath = `${dPath} L ${W},${H} L ${points[0].x},${H} Z`

  return (
    <div className="dash-main-chart-wrapper">
      <div className="dash-chart-y-axis">
        <span>250k</span>
        <span>200k</span>
        <span>150k</span>
        <span>100k</span>
        <span>50k</span>
        <span>0</span>
      </div>
      <div className="dash-chart-svg-container">
        <svg viewBox={`0 0 ${W} ${H}`} className="dash-main-chart-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="mainAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Guías horizontales */}
          {[20, 60, 100, 140, 180, 210].map((yVal, idx) => (
            <line key={idx} x1="0" y1={yVal} x2={W} y2={yVal} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
          ))}

          <path d={areaPath} fill="url(#mainAreaGradient)" />
          <path d={dPath} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />

          {/* Nodos de datos */}
          {points.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r="4.5"
              fill="#FFFFFF"
              stroke="#2563EB"
              strokeWidth="2.5"
              className="dash-chart-dot"
            />
          ))}
        </svg>
        <div className="dash-chart-x-axis">
          <span>01</span>
          <span>05</span>
          <span>10</span>
          <span>15</span>
          <span>20</span>
          <span>25</span>
          <span>30</span>
        </div>
      </div>
    </div>
  )
}

// ─── Mini Donut Chart SVG ─────────────────────────────────────────────────────

function CategoryDonutChart() {
  const categories = [
    { label: 'Productos', pct: 45, color: '#2563EB' },
    { label: 'Servicios', pct: 25, color: '#059669' },
    { label: 'Suscripciones', pct: 20, color: '#D97706' },
    { label: 'Otros', pct: 10, color: '#94A3B8' },
  ]

  const R = 48, cx = 65, cy = 65
  const circumference = 2 * Math.PI * R
  let offset = 0

  const arcs = categories.map((cat) => {
    const dash = (cat.pct / 100) * circumference
    const gap = circumference - dash
    const strokeDashoffset = -offset
    offset += dash
    return (
      <circle
        key={cat.label}
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke={cat.color}
        strokeWidth="18"
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={strokeDashoffset}
      />
    )
  })

  return (
    <div className="dash-donut-content">
      <svg viewBox="0 0 130 130" className="dash-donut-svg">
        {arcs}
      </svg>
      <ul className="dash-donut-legend">
        {categories.map((c) => (
          <li key={c.label}>
            <span className="dash-legend-dot" style={{ background: c.color }} />
            <span className="dash-legend-name">{c.label}</span>
            <span className="dash-legend-pct">{c.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Chatbot Widget ───────────────────────────────────────────────────────────

function ChatbotWidget() {
  const [msgs, setMsgs] = useState([
    { from: 'bot', text: '¡Hola! Soy tu asistente inteligente. ¿En qué puedo ayudarte hoy?' }
  ])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  const send = (text) => {
    if (!text.trim()) return
    const userMsg = { from: 'user', text }
    const botMsg = { from: 'bot', text: `Procesando "${text}"... Generando resumen en tiempo real.` }
    setMsgs((m) => [...m, userMsg, botMsg])
    setInput('')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const quickActions = ['Resumen de ventas', 'Top productos', 'Clientes nuevos', 'Estado de inventario']

  return (
    <div className="card dash-chatbot-card">
      <div className="dash-chatbot-header">
        <div className="dash-chatbot-title">
          <span className="dash-chatbot-icon">🤖</span>
          <div>
            <strong>Asistente IA / Chatbot</strong>
          </div>
        </div>
        <span className="dash-chatbot-online">● En línea</span>
      </div>

      <div className="dash-chatbot-body">
        <div className="dash-chatbot-msg-container">
          {msgs.map((m, i) => (
            <div key={i} className={`dash-chatbot-bubble ${m.from}`}>
              {m.from === 'bot' && <span className="dash-bot-avatar">🤖</span>}
              <div className="dash-bubble-text">{m.text}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="dash-chatbot-chips">
          {quickActions.map((act) => (
            <button key={act} className="dash-chip-btn" onClick={() => send(act)}>
              {act}
            </button>
          ))}
        </div>
      </div>

      <div className="dash-chatbot-input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder="Escribe tu pregunta..."
        />
        <button className="dash-send-btn" onClick={() => send(input)}>
          ➤
        </button>
      </div>
    </div>
  )
}

// ─── Dashboard Principal ──────────────────────────────────────────────────────

export function Dashboard() {
  const { user } = useAuth()
  const [salesSparkData] = useState([
    { valor: 80000 }, { valor: 95000 }, { valor: 88000 }, { valor: 110000 },
    { valor: 105000 }, { valor: 125000 }, { valor: 140000 }
  ])
  const [ordersSparkData] = useState([
    { valor: 280 }, { valor: 290 }, { valor: 310 }, { valor: 300 },
    { valor: 320 }, { valor: 315 }, { valor: 340 }
  ])
  const [clientsSparkData] = useState([
    { valor: 1050 }, { valor: 1100 }, { valor: 1120 }, { valor: 1180 },
    { valor: 1200 }, { valor: 1220 }, { valor: 1245 }
  ])
  const [profitSparkData] = useState([
    { valor: 210000 }, { valor: 220000 }, { valor: 215000 }, { valor: 235000 },
    { valor: 240000 }, { valor: 245000 }, { valor: 250000 }
  ])

  return (
    <div className="dash-container">
      {/* ── Encabezado & Hero Banner Ejecutivo ── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        padding: '24px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ zIndex: 2, maxWidth: 650 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFF6FF', color: '#2563EB', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
            <span>🏢</span> PLATAFORMA EMPRESARIAL APPEX ERP
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Panel Ejecutivo & Control Operativo
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
            Monitoreo en tiempo real de finanzas, ventas, inventario multialmacén y cumplimiento tributario ante la DGII.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, zIndex: 2 }}>
          <div className="dash-date-btn">
            📅 <span>01 - 31 May, 2025</span> ▾
          </div>
          <button className="dash-filter-btn" onClick={() => alert('Filtros ejecutivos aplicados')}>
            ⚡ Filtros
          </button>
        </div>
      </div>

      {/* ── 4 Tarjetas KPI Superiores con Sparklines ── */}
      <div className="dash-kpi-grid">
        {/* KPI 1: Ventas */}
        <div className="card dash-kpi-box">
          <div className="dash-kpi-top">
            <div className="dash-kpi-circle-icon blue">
              💲
            </div>
            <div className="dash-kpi-details">
              <span className="dash-kpi-title">Ventas del Mes</span>
              <h3 className="dash-kpi-number">RD$ 1,250,000</h3>
              <span className="dash-kpi-badge success">
                ↑ 12.5% <small>vs mes anterior</small>
              </span>
            </div>
          </div>
          <div className="dash-kpi-sparkline">
            <Sparkline data={salesSparkData} color="#2563EB" fillId="blueSpark" />
          </div>
        </div>

        {/* KPI 2: Órdenes */}
        <div className="card dash-kpi-box">
          <div className="dash-kpi-top">
            <div className="dash-kpi-circle-icon green">
              🛒
            </div>
            <div className="dash-kpi-details">
              <span className="dash-kpi-title">Órdenes</span>
              <h3 className="dash-kpi-number">320</h3>
              <span className="dash-kpi-badge success">
                ↑ 8.1% <small>vs mes anterior</small>
              </span>
            </div>
          </div>
          <div className="dash-kpi-sparkline">
            <Sparkline data={ordersSparkData} color="#059669" fillId="greenSpark" />
          </div>
        </div>

        {/* KPI 3: Clientes */}
        <div className="card dash-kpi-box">
          <div className="dash-kpi-top">
            <div className="dash-kpi-circle-icon orange">
              👥
            </div>
            <div className="dash-kpi-details">
              <span className="dash-kpi-title">Clientes</span>
              <h3 className="dash-kpi-number">1,245</h3>
              <span className="dash-kpi-badge success">
                ↑ 16% <small>vs mes anterior</small>
              </span>
            </div>
          </div>
          <div className="dash-kpi-sparkline">
            <Sparkline data={clientsSparkData} color="#D97706" fillId="orangeSpark" />
          </div>
        </div>

        {/* KPI 4: Ganancias */}
        <div className="card dash-kpi-box">
          <div className="dash-kpi-top">
            <div className="dash-kpi-circle-icon purple">
              📈
            </div>
            <div className="dash-kpi-details">
              <span className="dash-kpi-title">Ganancias</span>
              <h3 className="dash-kpi-number">RD$ 250,000</h3>
              <span className="dash-kpi-badge success">
                ↑ 10.3% <small>vs mes anterior</small>
              </span>
            </div>
          </div>
          <div className="dash-kpi-sparkline">
            <Sparkline data={profitSparkData} color="#7C3AED" fillId="purpleSpark" />
          </div>
        </div>
      </div>

      {/* ── Fila Central (3 Bloques) ── */}
      <div className="dash-middle-grid">
        {/* Bloque 1: Ventas (Line Chart) */}
        <div className="card dash-chart-card">
          <div className="dash-card-header">
            <strong>Ventas</strong>
            <select className="dash-dropdown-select">
              <option>Este mes</option>
              <option>Mes anterior</option>
            </select>
          </div>
          <MainSalesChart />
        </div>

        {/* Bloque 2: Ventas por Categoría (Donut) */}
        <div className="card dash-donut-card">
          <div className="dash-card-header">
            <strong>Ventas por Categoría</strong>
          </div>
          <CategoryDonutChart />
        </div>

        {/* Bloque 3: Chatbot IA */}
        <ChatbotWidget />
      </div>

      {/* ── Fila de Tablas y Listas (4 Bloques) ── */}
      <div className="dash-summary-row">
        {/* Actividades Recientes */}
        <div className="card dash-summary-card">
          <div className="dash-card-header">
            <strong>Actividades Recientes</strong>
            <Link to="/ventas" className="dash-header-link">Ver todas</Link>
          </div>
          <ul className="dash-list">
            <li className="dash-list-item">
              <div className="dash-item-icon green">🛒</div>
              <div className="dash-item-content">
                <span className="dash-item-title">Nueva venta #VTA-2025-001</span>
                <span className="dash-item-sub">Cliente: Juan Pérez</span>
              </div>
              <span className="dash-item-time">06:00 p.m.</span>
            </li>
            <li className="dash-list-item">
              <div className="dash-item-icon blue">📄</div>
              <div className="dash-item-content">
                <span className="dash-item-title">Factura generada #FAC-2025-001</span>
                <span className="dash-item-sub">Cliente: Empresa ABC</span>
              </div>
              <span className="dash-item-time">05:00 p.m.</span>
            </li>
            <li className="dash-list-item">
              <div className="dash-item-icon orange">👤</div>
              <div className="dash-item-content">
                <span className="dash-item-title">Nuevo cliente registrado</span>
                <span className="dash-item-sub">María Rodríguez</span>
              </div>
              <span className="dash-item-time">Ayer</span>
            </li>
            <li className="dash-list-item">
              <div className="dash-item-icon purple">💳</div>
              <div className="dash-item-content">
                <span className="dash-item-title">Pago recibido #PAY-2025-001</span>
                <span className="dash-item-sub">Cliente: Constructora XYZ</span>
              </div>
              <span className="dash-item-time">Ayer</span>
            </li>
          </ul>
        </div>

        {/* Inventario Resumen */}
        <div className="card dash-summary-card">
          <div className="dash-card-header">
            <strong>Inventario Resumen</strong>
          </div>
          <ul className="dash-inv-grid-list">
            <li className="dash-inv-row">
              <span className="dash-inv-label">📦 Total Productos</span>
              <strong className="dash-inv-val">1,245</strong>
            </li>
            <li className="dash-inv-row">
              <span className="dash-inv-label">✅ Stock Disponible</span>
              <strong className="dash-inv-val text-success">890</strong>
            </li>
            <li className="dash-inv-row">
              <span className="dash-inv-label">⚠️ Stock Bajo</span>
              <strong className="dash-inv-val text-warning">120</strong>
            </li>
            <li className="dash-inv-row">
              <span className="dash-inv-label">🔴 Sin Stock</span>
              <strong className="dash-inv-val text-danger">35</strong>
            </li>
          </ul>
          <Link to="/rrhh-inventario" className="dash-bottom-link">
            Ver inventario completo →
          </Link>
        </div>

        {/* Top Productos */}
        <div className="card dash-summary-card">
          <div className="dash-card-header">
            <strong>Top Productos</strong>
            <select className="dash-dropdown-select">
              <option>Este mes</option>
            </select>
          </div>
          <ul className="dash-list">
            <li className="dash-list-item">
              <div className="dash-prod-thumb">💻</div>
              <div className="dash-item-content">
                <span className="dash-item-title">Laptop Dell Inspiron</span>
                <span className="dash-item-sub">RD$ 45,000</span>
              </div>
              <span className="dash-prod-units">120 uds.</span>
            </li>
            <li className="dash-list-item">
              <div className="dash-prod-thumb">📱</div>
              <div className="dash-item-content">
                <span className="dash-item-title">iPhone 15 Pro</span>
                <span className="dash-item-sub">RD$ 65,000</span>
              </div>
              <span className="dash-prod-units">85 uds.</span>
            </li>
            <li className="dash-list-item">
              <div className="dash-prod-thumb">🎧</div>
              <div className="dash-item-content">
                <span className="dash-item-title">Auriculares Sony WH-1000XM5</span>
                <span className="dash-item-sub">RD$ 12,530</span>
              </div>
              <span className="dash-prod-units">150 uds.</span>
            </li>
            <li className="dash-list-item">
              <div className="dash-prod-thumb">🖥️</div>
              <div className="dash-item-content">
                <span className="dash-item-title">Monitor LG 24"</span>
                <span className="dash-item-sub">RD$ 18,000</span>
              </div>
              <span className="dash-prod-units">65 uds.</span>
            </li>
          </ul>
          <Link to="/ventas" className="dash-bottom-link">
            Ver todos los productos →
          </Link>
        </div>

        {/* Resumen Financiero */}
        <div className="card dash-summary-card">
          <div className="dash-card-header">
            <strong>Resumen Financiero</strong>
            <select className="dash-dropdown-select">
              <option>Este mes</option>
            </select>
          </div>
          <div className="dash-fin-rows">
            <div className="dash-fin-row">
              <span className="dash-fin-label">Ingresos</span>
              <div className="dash-fin-values">
                <strong>RD$ 1,250,000</strong>
                <span className="dash-pct-tag success">↑ 12.5%</span>
              </div>
            </div>
            <div className="dash-fin-row">
              <span className="dash-fin-label">Gastos</span>
              <div className="dash-fin-values">
                <strong>RD$ 850,000</strong>
                <span className="dash-pct-tag danger">↓ 5.2%</span>
              </div>
            </div>
            <div className="dash-fin-row">
              <span className="dash-fin-label">Utilidad Neta</span>
              <div className="dash-fin-values">
                <strong>RD$ 400,000</strong>
                <span className="dash-pct-tag success">↑ 18.7%</span>
              </div>
            </div>
            <div className="dash-fin-row">
              <span className="dash-fin-label">Margen de Beneficio</span>
              <div className="dash-fin-values">
                <strong>32%</strong>
                <span className="dash-pct-tag success">↑ 6.2%</span>
              </div>
            </div>
          </div>
          <Link to="/reportes" className="dash-bottom-link">
            Ver reporte financiero →
          </Link>
        </div>
      </div>

      {/* ── Fila Inferior (Integraciones & Acciones Rápidas) ── */}
      <div className="dash-bottom-grid">
        {/* Integraciones */}
        <div className="card dash-bottom-card">
          <div className="dash-card-header">
            <strong>Integraciones</strong>
          </div>
          <div className="dash-int-grid">
            <div className="dash-int-box">
              <span className="dash-int-logo">💬</span>
              <div>
                <strong className="dash-int-title">WhatsApp</strong>
                <span className="dash-int-status green">Conectado</span>
              </div>
            </div>
            <div className="dash-int-box">
              <span className="dash-int-logo">✉️</span>
              <div>
                <strong className="dash-int-title">Email</strong>
                <span className="dash-int-status green">Conectado</span>
              </div>
            </div>
            <div className="dash-int-box">
              <span className="dash-int-logo">⚙️</span>
              <div>
                <strong className="dash-int-title">n8n</strong>
                <span className="dash-int-status green">Conectado</span>
              </div>
            </div>
            <div className="dash-int-box">
              <span className="dash-int-logo">👥</span>
              <div>
                <strong className="dash-int-title">CRM</strong>
                <span className="dash-int-status green">Conectado</span>
              </div>
            </div>
          </div>
          <Link to="/plugin-manager" className="dash-bottom-link text-center">
            Ver todas las integraciones →
          </Link>
        </div>

        {/* Acciones Rápidas */}
        <div className="card dash-bottom-card">
          <div className="dash-card-header">
            <strong>Acciones Rápidas</strong>
          </div>
          <div className="dash-quick-grid">
            <Link to="/ventas" className="dash-quick-card blue">
              <span className="dash-quick-icon">🛒</span>
              <span>Nueva Venta</span>
            </Link>
            <Link to="/crm" className="dash-quick-card green">
              <span className="dash-quick-icon">👤</span>
              <span>Nuevo Cliente</span>
            </Link>
            <Link to="/compras" className="dash-quick-card orange">
              <span className="dash-quick-icon">🛍️</span>
              <span>Nueva Compra</span>
            </Link>
            <Link to="/finanzas" className="dash-quick-card pink">
              <span className="dash-quick-icon">💰</span>
              <span>Nuevo Gasto</span>
            </Link>
            <Link to="/reportes" className="dash-quick-card purple">
              <span className="dash-quick-icon">📊</span>
              <span>Reporte de Ventas</span>
            </Link>
            <Link to="/rrhh-inventario" className="dash-quick-card amber">
              <span className="dash-quick-icon">⚠️</span>
              <span>Inventario Bajo</span>
            </Link>
          </div>
          <span className="dash-sub-note">
            Personaliza tus accesos rápidos en ajustes →
          </span>
        </div>
      </div>
    </div>
  )
}

