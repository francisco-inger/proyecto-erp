/*
  Dashboard — appes.erp
  Vista principal rediseñada según el mockup de referencia.
  Muestra KPIs con Sparklines, gráfico de ventas suavizado, ventas por categoría (Donut),
  asistente IA/Chatbot, actividades, inventario, top productos, financiero, integraciones y acciones rápidas.
*/
import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../core/auth/AuthContext'
import { dashboardService } from './dashboardService'
import { erpSync } from '../core/sync/erpSyncEngine'
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
  const [kpis, setKpis] = useState({
    ventasMes: { value: 1250000, prev: 1108000 },
    ordenes: { value: 320, prev: 296 },
    clientes: { value: 1245, prev: 1073 },
    ganancias: { value: 250000, prev: 226500 },
  })
  const [actividades, setActividades] = useState([])
  const [inventarioSummary, setInventarioSummary] = useState({ total: 1245, disponible: 890, stockBajo: 120, sinStock: 35 })
  const [topProductos, setTopProductos] = useState([])
  const [financieroSummary, setFinancieroSummary] = useState({
    ingresos: { value: 1250000 },
    gastos: { value: 850000 },
    utilidad: { value: 400000 },
    margen: { value: 32 },
  })

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

  const refreshAll = async () => {
    try {
      const [kpiRes, actRes, invRes, topRes, finRes] = await Promise.all([
        dashboardService.getKpis(),
        dashboardService.getActividades(),
        dashboardService.getInventario(),
        dashboardService.getTopProductos(),
        dashboardService.getFinanciero(),
      ])
      if (kpiRes) setKpis(kpiRes)
      if (actRes) setActividades(actRes)
      if (invRes) setInventarioSummary(invRes)
      if (topRes) setTopProductos(topRes)
      if (finRes) setFinancieroSummary(finRes)
    } catch (e) {
      console.warn('[Dashboard] Error fetching dynamic data:', e)
    }
  }

  useEffect(() => {
    refreshAll()
    const unsubscribe = erpSync.subscribe(() => {
      refreshAll()
    })
    return () => unsubscribe()
  }, [])

  return (
    <div className="dash-container">
      {/* ── Hero Banner Panorámico Ejecutivo (Misma Secuencia de Color Azul Real del Login) ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
        borderRadius: 20,
        padding: '30px 36px',
        boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.35)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        color: '#FFFFFF'
      }}>
        {/* Imagen panorámica de fondo superpuesta en la parte derecha */}
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

        {/* Fila Superior del Hero */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, position: 'relative', zIndex: 2 }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#93C5FD',
              padding: '4px 14px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: 10,
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              <span>✦</span> PANEL DE CONTROL · APPEX ERP
            </div>

            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              Buenos días, <span style={{ color: '#60A5FA' }}>{user?.name || 'Administrador'}</span>
            </h1>
            <p style={{ margin: '6px 0 16px', fontSize: 13, color: '#CBD5E1', fontWeight: 500 }}>
              {new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            {/* Badges de Estado */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16, 185, 129, 0.2)', color: '#A7F3D0', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                Conexión SQLite Activa
              </span>
              <span style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                Todos los 11 módulos en línea
              </span>
              <span style={{ background: 'rgba(37, 99, 235, 0.3)', color: '#BFDBFE', border: '1px solid rgba(37, 99, 235, 0.5)', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                Ciclo Fiscal 2026
              </span>
            </div>
          </div>

          {/* Tarjetas Flotantes de Estado Derecho */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 260 }}>
            {/* Tarjeta 1: Eficiencia */}
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: 14, padding: '12px 18px' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#93C5FD', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                EFICIENCIA OPERATIVA
              </span>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: '2px 0 1px' }}>
                +18.4%
              </div>
              <span style={{ fontSize: 10, color: '#CBD5E1' }}>Automatización de procesos</span>
            </div>

            {/* Tarjeta 2: Seguridad */}
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: 14, padding: '12px 18px' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#FCD34D', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                SEGURIDAD DE DATOS
              </span>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#34D399', margin: '2px 0 1px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🛡️</span> Protegido
              </div>
              <span style={{ fontSize: 10, color: '#CBD5E1' }}>Encriptación JWT y 2FA activos</span>
            </div>
          </div>
        </div>

        {/* Barra de Operaciones Rápidas */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 14,
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          position: 'relative',
          zIndex: 2
        }}>
          <div>
            <strong style={{ fontSize: 13, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#FB923C' }}>⚡</span> Operaciones Rápidas de Gestión Empresarial
            </strong>
            <span style={{ fontSize: 11, color: '#94A3B8' }}>Acceda de inmediato a los procesos diarios más utilizados</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Link to="/ventas" style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 2px 6px rgba(37,99,235,0.4)' }}>
              🛒 Facturar Venta
            </Link>
            <Link to="/compras" style={{ background: 'rgba(255,255,255,0.15)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.25)', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              🛍️ Orden de Compra
            </Link>
            <Link to="/rrhh" style={{ background: 'rgba(255,255,255,0.15)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.25)', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              👤 Asistencia / RRHH
            </Link>
            <Link to="/ajustes?tab=Sistema" style={{ background: 'rgba(255,255,255,0.15)', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.25)', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              ⚙️ Ajustes del Sistema
            </Link>
          </div>
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
              <h3 className="dash-kpi-number">{fmtMoney(kpis.ventasMes?.value ?? 1250000)}</h3>
              <span className="dash-kpi-badge success">
                ↑ 12.5% <small>sincronizado</small>
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
              <span className="dash-kpi-title">Órdenes Activas</span>
              <h3 className="dash-kpi-number">{kpis.ordenes?.value ?? 32}</h3>
              <span className="dash-kpi-badge success">
                ↑ 8.1% <small>en tiempo real</small>
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
              <span className="dash-kpi-title">Clientes CRM</span>
              <h3 className="dash-kpi-number">{kpis.clientes?.value ?? 12}</h3>
              <span className="dash-kpi-badge success">
                ↑ 16% <small>cartera activa</small>
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
              <span className="dash-kpi-title">Ganancias Estimadas</span>
              <h3 className="dash-kpi-number">{fmtMoney(kpis.ganancias?.value ?? 250000)}</h3>
              <span className="dash-kpi-badge success">
                ↑ 10.3% <small>margen operativo</small>
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
            {(actividades.length > 0 ? actividades : [
              { id: 1, tipo: 'venta', texto: 'Nueva venta confirmada en sistema', sub: 'Cliente: Farmacia Los Hidalgos', hora: 'Hoy' },
              { id: 2, tipo: 'factura', texto: 'Comprobante de Ingreso generado', sub: 'Cuenta: Banco Popular', hora: 'Hoy' },
              { id: 3, tipo: 'pago', texto: 'Orden de Compra procesada', sub: 'Proveedor: Distribuidora Tech', hora: 'Hoy' },
              { id: 4, tipo: 'cliente', texto: 'Auditoría de seguridad y 2FA activa', sub: 'Usuario: admin@appes.com', hora: 'Hoy' },
            ]).slice(0, 4).map((act, i) => (
              <li key={i} className="dash-list-item">
                <div className={`dash-item-icon ${act.tipo === 'venta' ? 'green' : act.tipo === 'pago' ? 'purple' : act.tipo === 'factura' ? 'blue' : 'orange'}`}>
                  {act.tipo === 'venta' ? '🛒' : act.tipo === 'pago' ? '💳' : act.tipo === 'factura' ? '📄' : '👤'}
                </div>
                <div className="dash-item-content">
                  <span className="dash-item-title">{act.texto}</span>
                  <span className="dash-item-sub">{act.sub}</span>
                </div>
                <span className="dash-item-time">{act.hora}</span>
              </li>
            ))}
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
              <strong className="dash-inv-val">{inventarioSummary.total ?? 1245}</strong>
            </li>
            <li className="dash-inv-row">
              <span className="dash-inv-label">✅ Stock Disponible</span>
              <strong className="dash-inv-val text-success">{inventarioSummary.disponible ?? 890}</strong>
            </li>
            <li className="dash-inv-row">
              <span className="dash-inv-label">⚠️ Stock Bajo</span>
              <strong className="dash-inv-val text-warning">{inventarioSummary.stockBajo ?? 120}</strong>
            </li>
            <li className="dash-inv-row">
              <span className="dash-inv-label">🔴 Sin Stock</span>
              <strong className="dash-inv-val text-danger">{inventarioSummary.sinStock ?? 35}</strong>
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
            {(topProductos.length > 0 ? topProductos : [
              { nombre: 'Paracetamol 500mg (Caja 100)', precio: 125, unidades: 140, img: '💊' },
              { nombre: 'Amoxicilina 500mg (Frasco)', precio: 220, unidades: 110, img: '💊' },
              { nombre: 'Alcohol 70% Desnaturalizado', precio: 85, unidades: 95, img: '🧪' },
              { nombre: 'Vitamina C 1000mg Efervescente', precio: 340, unidades: 75, img: '📦' },
            ]).slice(0, 4).map((p, i) => (
              <li key={i} className="dash-list-item">
                <div className="dash-prod-thumb">{p.img || '📦'}</div>
                <div className="dash-item-content">
                  <span className="dash-item-title">{p.nombre}</span>
                  <span className="dash-item-sub">{fmtMoney(p.precio)}</span>
                </div>
                <span className="dash-prod-units">{p.unidades} uds.</span>
              </li>
            ))}
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
                <strong>{fmtMoney(financieroSummary.ingresos?.value ?? 1250000)}</strong>
                <span className="dash-pct-tag success">↑ 12.5%</span>
              </div>
            </div>
            <div className="dash-fin-row">
              <span className="dash-fin-label">Gastos</span>
              <div className="dash-fin-values">
                <strong>{fmtMoney(financieroSummary.gastos?.value ?? 850000)}</strong>
                <span className="dash-pct-tag danger">↓ 5.2%</span>
              </div>
            </div>
            <div className="dash-fin-row">
              <span className="dash-fin-label">Utilidad Neta</span>
              <div className="dash-fin-values">
                <strong>{fmtMoney(financieroSummary.utilidad?.value ?? 400000)}</strong>
                <span className="dash-pct-tag success">↑ 18.7%</span>
              </div>
            </div>
            <div className="dash-fin-row">
              <span className="dash-fin-label">Margen de Beneficio</span>
              <div className="dash-fin-values">
                <strong>{financieroSummary.margen?.value ?? 32}%</strong>
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

      {/* ── Sección Institucional & Pie de Página Corporativo ── */}
      <div className="dash-corporate-section">
        {/* Banner de Identidad Corporativa: Misión, Visión y Valores */}
        <div className="dash-corporate-card">
          <div className="dash-corporate-header">
            <div className="dash-corporate-badge">
              <span>🏢</span> IDENTIDAD & CULTURA CORPORATIVA
            </div>
            <h2 className="dash-corporate-title">Misión, Visión y Valores Empresariales</h2>
            <p className="dash-corporate-desc">
              Impulsando la transformación digital y la excelencia operativa de las organizaciones mediante tecnología de clase mundial.
            </p>
          </div>

          <div className="dash-mv-grid">
            {/* Tarjeta de Misión */}
            <div className="dash-mv-card mission">
              <div className="dash-mv-icon-wrap">
                <span className="dash-mv-icon">🎯</span>
                <span className="dash-mv-tag">Propósito Fundamental</span>
              </div>
              <h3 className="dash-mv-heading">Nuestra Misión</h3>
              <p className="dash-mv-text">
                Proveer a las empresas una suite de gestión empresarial inteligente, escalable e integrada que automatice procesos críticos, optimice la toma de decisiones basada en datos y potencie la productividad de cada equipo de trabajo.
              </p>
            </div>

            {/* Tarjeta de Visión */}
            <div className="dash-mv-card vision">
              <div className="dash-mv-icon-wrap">
                <span className="dash-mv-icon">🔭</span>
                <span className="dash-mv-tag">Destino Estratégico</span>
              </div>
              <h3 className="dash-mv-heading">Nuestra Visión</h3>
              <p className="dash-mv-text">
                Consolidarnos como la plataforma ERP en la nube y ecosistema de inteligencia de negocios líder en la República Dominicana y el Caribe, reconocida por su innovación continua, seguridad de nivel bancario y excelencia en el servicio al cliente.
              </p>
            </div>
          </div>

          {/* Valores Corporativos */}
          <div className="dash-values-wrapper">
            <div className="dash-values-header">
              <span className="dash-values-title">✨ Nuestros Valores Fundamentales</span>
            </div>
            <div className="dash-values-grid">
              <div className="dash-val-item">
                <div className="dash-val-icon-box blue">💡</div>
                <div className="dash-val-content">
                  <strong>Innovación Continua</strong>
                  <p>Desarrollamos soluciones vanguardistas adaptadas a los retos empresariales del futuro.</p>
                </div>
              </div>

              <div className="dash-val-item">
                <div className="dash-val-icon-box green">🛡️</div>
                <div className="dash-val-content">
                  <strong>Integridad & Seguridad</strong>
                  <p>Protegemos la confidencialidad, trazabilidad y máxima seguridad de cada dato corporativo.</p>
                </div>
              </div>

              <div className="dash-val-item">
                <div className="dash-val-icon-box purple">🤝</div>
                <div className="dash-val-content">
                  <strong>Compromiso con el Cliente</strong>
                  <p>Acompañamos estratégicamente a cada organización para asegurar su éxito y crecimiento continuo.</p>
                </div>
              </div>

              <div className="dash-val-item">
                <div className="dash-val-icon-box orange">⚡</div>
                <div className="dash-val-content">
                  <strong>Agilidad & Eficiencia</strong>
                  <p>Optimizamos tiempos de respuesta y simplificamos operaciones complejas con fluidez.</p>
                </div>
              </div>

              <div className="dash-val-item">
                <div className="dash-val-icon-box pink">🏆</div>
                <div className="dash-val-content">
                  <strong>Excelencia & Calidad</strong>
                  <p>Mantenemos los más altos estándares globales en ingeniería de software y soporte técnico.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ubicación & Canales de Contacto Directo */}
        <div className="dash-location-grid">
          {/* Tarjeta de Ubicación Geográfica */}
          <div className="card dash-location-card">
            <div className="dash-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>📍</span>
                <strong>Sede Principal & Ubicación</strong>
              </div>
              <span className="dash-status-pill green">Sede Operativa</span>
            </div>

            <div className="dash-location-body">
              <div className="dash-location-address-box">
                <div className="dash-location-icon">🏢</div>
                <div className="dash-location-info">
                  <strong>APPEX Technologies & Enterprise Suite</strong>
                  <p>Av. Winston Churchill #109, Torre Empresarial Blue Mall, Piso 14, Sector Piantini, Santo Domingo, Distrito Nacional, República Dominicana.</p>
                  <span className="dash-location-postal">Código Postal: 10148 · Coordenadas: 18.4721° N, 69.9405° W</span>
                </div>
              </div>

              <div className="dash-sedes-row">
                <div className="dash-sede-chip active">
                  <span className="sede-dot" /> Santo Domingo (Headquarters)
                </div>
                <div className="dash-sede-chip">
                  <span className="sede-dot" /> Santiago de los Caballeros (Tech Hub)
                </div>
                <div className="dash-sede-chip">
                  <span className="sede-dot" /> Miami, FL (Enlace Internacional)
                </div>
              </div>

              <div className="dash-location-actions">
                <a
                  href="https://maps.google.com/?q=Torre+Empresarial+Blue+Mall+Santo+Domingo"
                  target="_blank"
                  rel="noreferrer"
                  className="dash-maps-btn"
                >
                  🗺️ Abrir Ubicación en Google Maps
                </a>
              </div>
            </div>
          </div>

          {/* Tarjeta de Contacto y Horarios */}
          <div className="card dash-location-card">
            <div className="dash-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>📞</span>
                <strong>Contacto & Soporte Corporativo</strong>
              </div>
              <span className="dash-status-pill blue">Atención 24/7</span>
            </div>

            <div className="dash-contact-list">
              <div className="dash-contact-item">
                <div className="dash-contact-icon">📱</div>
                <div>
                  <span className="dash-contact-label">Central Telefónica / PBX</span>
                  <strong className="dash-contact-val">+1 (809) 555-0199 / +1 (809) 555-0200</strong>
                </div>
              </div>

              <div className="dash-contact-item">
                <div className="dash-contact-icon">✉️</div>
                <div>
                  <span className="dash-contact-label">Correo Electrónico Oficial</span>
                  <strong className="dash-contact-val">contacto@appes.erp · soporte@appes.erp</strong>
                </div>
              </div>

              <div className="dash-contact-item">
                <div className="dash-contact-icon">🕒</div>
                <div>
                  <span className="dash-contact-label">Horario de Operaciones</span>
                  <strong className="dash-contact-val">Lunes a Viernes: 8:00 AM – 6:00 PM | Sábados: 9:00 AM – 1:00 PM</strong>
                </div>
              </div>

              <div className="dash-contact-item">
                <div className="dash-contact-icon">🛡️</div>
                <div>
                  <span className="dash-contact-label">Soporte Técnico de Emergencia</span>
                  <strong className="dash-contact-val">Mesa de ayuda crítica y monitoreo de servidores activo 24/7</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Barra de Pie de Página Final del Sistema ── */}
        <footer className="dash-footer-bar">
          <div className="dash-footer-left">
            <span className="dash-footer-logo">APPEX.ERP</span>
            <span className="dash-footer-version">Enterprise Suite · v2026.4.0</span>
            <span className="dash-footer-divider">|</span>
            <span className="dash-footer-uptime">
              <span className="uptime-dot" /> Todos los sistemas operativos (99.99% Uptime)
            </span>
          </div>

          <div className="dash-footer-right">
            <span>© 2026 APPEX Technologies SRL. Todos los derechos reservados.</span>
          </div>
        </footer>
      </div>
    </div>
  )
}


