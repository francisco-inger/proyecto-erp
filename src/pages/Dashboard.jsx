/*
  Dashboard — appes.erp
  Vista principal. Muestra KPIs, gráfico de ventas, actividades recientes,
  inventario, top productos, resumen financiero, AI/Chatbot y acciones rápidas.
  Todos los datos se cargan desde dashboardService (API real → fallback).
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

function pct(current, prev) {
  if (!prev) return 0
  return (((current - prev) / prev) * 100).toFixed(1)
}

// ─── Hook: carga todos los bloques del dashboard en paralelo ─────────────────

function useDashboard() {
  const [state, setState] = useState({
    kpis: null, actividades: [], inventario: null,
    topProductos: [], financiero: null, salesChart: [],
    categorias: [], integraciones: [], loading: true, error: null,
  })

  useEffect(() => {
    let alive = true
    Promise.all([
      dashboardService.getKpis(),
      dashboardService.getActividades(),
      dashboardService.getInventario(),
      dashboardService.getTopProductos(),
      dashboardService.getFinanciero(),
      dashboardService.getSalesChart(),
      dashboardService.getCategorias(),
      dashboardService.getIntegraciones(),
    ])
      .then(([kpis, actividades, inventario, topProductos, financiero, salesChart, categorias, integraciones]) => {
        if (alive) setState({ kpis, actividades, inventario, topProductos, financiero, salesChart, categorias, integraciones, loading: false, error: null })
      })
      .catch((e) => { if (alive) setState((s) => ({ ...s, loading: false, error: e.message })) })
    return () => { alive = false }
  }, [])

  return state
}

// ─── Mini Sparkline (SVG inline) ──────────────────────────────────────────────

function Sparkline({ data, color = '#1F3A93', fill = 'rgba(31,58,147,0.08)' }) {
  if (!data || data.length < 2) return null
  const W = 300, H = 80
  const vals = data.map((d) => d.valor)
  const min = Math.min(...vals), max = Math.max(...vals)
  const range = max - min || 1
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W
    const y = H - ((v - min) / range) * (H - 8) - 4
    return `${x},${y}`
  })
  const poly = pts.join(' ')
  const area = `M${pts[0]} ${pts.map((p) => `L${p}`).join(' ')} L${W},${H} L0,${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="dash-sparkline" preserveAspectRatio="none">
      <path d={area} fill={fill} />
      <polyline points={poly} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  )
}

// ─── Mini Donut Chart (SVG inline) ────────────────────────────────────────────

function DonutChart({ categorias }) {
  const R = 52, cx = 70, cy = 70
  const circumference = 2 * Math.PI * R
  let offset = 0
  const strokes = categorias.map((cat) => {
    const dash = (cat.pct / 100) * circumference
    const gap = circumference - dash
    const el = (
      <circle
        key={cat.label}
        cx={cx} cy={cy} r={R}
        fill="none"
        stroke={cat.color}
        strokeWidth="20"
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    )
    offset += dash
    return el
  })
  return (
    <svg viewBox="0 0 140 140" className="dash-donut">
      {strokes}
    </svg>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, prev, icon, iconBg }) {
  const change = pct(value, prev)
  const positive = change >= 0
  return (
    <div className="dash-kpi-card">
      <div className="dash-kpi-icon" style={{ background: iconBg }}>{icon}</div>
      <div className="dash-kpi-info">
        <span className="dash-kpi-label">{label}</span>
        <span className="dash-kpi-value">{value}</span>
        <span className={`dash-kpi-change ${positive ? 'up' : 'down'}`}>
          {positive ? '▲' : '▼'} {Math.abs(change)}% vs mes anterior
        </span>
      </div>
    </div>
  )
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function Skeleton({ height = 80, radius = 8 }) {
  return <div className="dash-skeleton" style={{ height, borderRadius: radius }} />
}

// ─── Chatbot Widget ───────────────────────────────────────────────────────────

const QUICK_ACTIONS = ['Resumen de ventas', 'Top productos', 'Clientes nuevos', 'Estado de inventario']

function ChatbotWidget() {
  const [msgs, setMsgs] = useState([
    { from: 'bot', text: '¡Hola! Soy tu asistente inteligente. ¿En qué puedo ayudarte hoy?' }
  ])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  const send = (text) => {
    if (!text.trim()) return
    const userMsg = { from: 'user', text }
    const botMsg = { from: 'bot', text: `Consultando "${text}"... un momento.` }
    setMsgs((m) => [...m, userMsg, botMsg])
    setInput('')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  return (
    <div className="dash-chatbot">
      <div className="dash-chatbot-header">
        <div className="dash-chatbot-avatar">🤖</div>
        <div>
          <strong>AI / Chatbot</strong>
          <span className="dash-chatbot-status">● En línea</span>
        </div>
      </div>
      <div className="dash-chatbot-msgs">
        {msgs.map((m, i) => (
          <div key={i} className={`dash-chatbot-msg ${m.from}`}>{m.text}</div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="dash-chatbot-quick">
        {QUICK_ACTIONS.map((a) => (
          <button key={a} className="dash-chatbot-chip" onClick={() => send(a)}>{a}</button>
        ))}
      </div>
      <div className="dash-chatbot-input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder="Escribe tu pregunta..."
        />
        <button className="btn btn-primary" onClick={() => send(input)}>➤</button>
      </div>
    </div>
  )
}

// ─── Dashboard principal ──────────────────────────────────────────────────────

export function Dashboard() {
  const { user } = useAuth()
  const { kpis, actividades, inventario, topProductos, financiero, salesChart, categorias, integraciones, loading } = useDashboard()

  const [dateRange] = useState('01 - 31 May, 2025')

  const actividadIcon = { venta: '🛒', factura: '📄', cliente: '👤', pago: '💳' }

  return (
    <div className="dash-root">
      {/* ── Encabezado ── */}
      <div className="dash-header">
        <div>
          <h2 className="dash-title">Dashboard</h2>
          <p className="dash-subtitle">Resumen general de tu empresa</p>
        </div>
        <div className="dash-header-actions">
          <span className="dash-date-range">📅 {dateRange}</span>
          <button className="btn btn-secondary">⧖ Filtros</button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="dash-kpis">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={88} />)
        ) : kpis ? (
          <>
            <KpiCard label="Ventas del Mes"  value={fmtMoney(kpis.ventasMes?.value)}  prev={kpis.ventasMes?.prev}  icon="💲" iconBg="#E8F0FE" />
            <KpiCard label="Órdenes"          value={kpis.ordenes?.value}               prev={kpis.ordenes?.prev}    icon="🛒" iconBg="#E6F9F5" />
            <KpiCard label="Clientes"         value={kpis.clientes?.value?.toLocaleString()} prev={kpis.clientes?.prev} icon="👥" iconBg="#FEF3C7" />
            <KpiCard label="Ganancias"        value={fmtMoney(kpis.ganancias?.value)}   prev={kpis.ganancias?.prev}  icon="📈" iconBg="#EDE9FE" />
          </>
        ) : null}
      </div>

      {/* ── Fila central ── */}
      <div className="dash-mid-row">

        {/* Gráfico de ventas */}
        <div className="card dash-chart-card">
          <div className="dash-section-header">
            <strong>Ventas</strong>
            <select className="dash-select">
              <option>Este mes</option>
              <option>Mes anterior</option>
              <option>Últimos 3 meses</option>
            </select>
          </div>
          {loading ? <Skeleton height={140} /> : <Sparkline data={salesChart} />}
          <div className="dash-chart-axis">
            {[1, 5, 10, 15, 20, 25, 30].map((d) => (
              <span key={d}>{String(d).padStart(2, '0')}</span>
            ))}
          </div>
        </div>

        {/* Ventas por categoría */}
        <div className="card dash-donut-card">
          <div className="dash-section-header"><strong>Ventas por Categoría</strong></div>
          {loading ? <Skeleton height={140} /> : (
            <div className="dash-donut-wrap">
              <DonutChart categorias={categorias} />
              <ul className="dash-donut-legend">
                {categorias.map((c) => (
                  <li key={c.label}>
                    <span className="dash-dot" style={{ background: c.color }} />
                    {c.label} <b>{c.pct}%</b>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Chatbot */}
        <ChatbotWidget />
      </div>

      {/* ── Fila de tablas ── */}
      <div className="dash-tables-row">

        {/* Actividades recientes */}
        <div className="card">
          <div className="dash-section-header">
            <strong>Actividades Recientes</strong>
          </div>
          <ul className="dash-activity-list">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <li key={i}><Skeleton height={36} /></li>)
              : actividades.map((a) => (
                <li key={a.id} className="dash-activity-item">
                  <span className="dash-activity-icon">{actividadIcon[a.tipo] || '🔔'}</span>
                  <div className="dash-activity-body">
                    <span className="dash-activity-text">{a.texto}</span>
                    <span className="dash-activity-sub">{a.sub}</span>
                  </div>
                  <span className="dash-activity-hora">{a.hora}</span>
                </li>
              ))}
          </ul>
          <Link to="/ventas" className="dash-link-all">Ver todas las actividades →</Link>
        </div>

        {/* Inventario resumen */}
        <div className="card">
          <div className="dash-section-header"><strong>Inventario Resumen</strong></div>
          {loading ? <Skeleton height={120} /> : inventario ? (
            <ul className="dash-inv-list">
              <li><span>📦 Total Productos</span><b>{inventario.total?.toLocaleString()}</b></li>
              <li><span>✅ Stock Disponible</span><b className="c-success">{inventario.disponible?.toLocaleString()}</b></li>
              <li><span>⚠️ Stock Bajo</span><b className="c-warning">{inventario.stockBajo?.toLocaleString()}</b></li>
              <li><span>🔴 Sin Stock</span><b className="c-danger">{inventario.sinStock?.toLocaleString()}</b></li>
            </ul>
          ) : null}
          <Link to="/rrhh-inventario" className="dash-link-all">Ver inventario completo →</Link>
        </div>

        {/* Top Productos */}
        <div className="card">
          <div className="dash-section-header">
            <strong>Top Productos</strong>
            <select className="dash-select">
              <option>Este mes</option>
              <option>Mes anterior</option>
            </select>
          </div>
          <ul className="dash-top-list">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <li key={i}><Skeleton height={40} /></li>)
              : topProductos.map((p) => (
                <li key={p.nombre} className="dash-top-item">
                  <span className="dash-top-icon">{p.img}</span>
                  <div className="dash-top-body">
                    <span className="dash-top-name">{p.nombre}</span>
                    <span className="dash-top-price">{fmtMoney(p.precio)}</span>
                  </div>
                  <span className="dash-top-units">{p.unidades} uds.</span>
                </li>
              ))}
          </ul>
          <Link to="/ventas" className="dash-link-all">Ver todos los productos →</Link>
        </div>
      </div>

      {/* ── Fila inferior ── */}
      <div className="dash-bottom-row">

        {/* Resumen financiero */}
        <div className="card dash-financiero">
          <div className="dash-section-header"><strong>Resumen Financiero</strong></div>
          {loading ? <Skeleton height={80} /> : financiero ? (
            <div className="dash-fin-grid">
              <div>
                <label>Ingresos</label>
                <big>{fmtMoney(financiero.ingresos?.value)}</big>
                <span className="c-success">▲ {pct(financiero.ingresos?.value, financiero.ingresos?.prev)}%</span>
              </div>
              <div>
                <label>Gastos</label>
                <big>{fmtMoney(financiero.gastos?.value)}</big>
                <span className="c-danger">▲ {pct(financiero.gastos?.value, financiero.gastos?.prev)}%</span>
              </div>
              <div>
                <label>Utilidad Neta</label>
                <big>{fmtMoney(financiero.utilidad?.value)}</big>
                <span className="c-success">▲ {pct(financiero.utilidad?.value, financiero.utilidad?.prev)}%</span>
              </div>
              <div>
                <label>Margen de Beneficio</label>
                <big>{financiero.margen?.value}%</big>
                <span className="c-success">▲ {pct(financiero.margen?.value, financiero.margen?.prev)}%</span>
              </div>
            </div>
          ) : null}
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Link to="/reportes" className="btn btn-primary">Ver reporte financiero</Link>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="card dash-acciones">
          <div className="dash-section-header"><strong>Acciones Rápidas</strong></div>
          <div className="dash-acciones-grid">
            <Link to="/ventas"          className="dash-accion-btn">🛒<span>Nueva Venta</span></Link>
            <Link to="/crm"             className="dash-accion-btn">👤<span>Nuevo Cliente</span></Link>
            <Link to="/compras"         className="dash-accion-btn">🏷️<span>Nueva Compra</span></Link>
            <Link to="/finanzas"        className="dash-accion-btn">💰<span>Nuevo Gasto</span></Link>
            <Link to="/reportes"        className="dash-accion-btn">📊<span>Reporte de Ventas</span></Link>
            <Link to="/rrhh-inventario" className="dash-accion-btn c-warning">⚠️<span>Inventario Bajo</span></Link>
          </div>
        </div>

        {/* Integraciones */}
        <div className="card dash-integraciones">
          <div className="dash-section-header"><strong>Integraciones</strong></div>
          <div className="dash-int-grid">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={60} />)
              : integraciones.map((int) => (
                <div key={int.nombre} className="dash-int-item">
                  <span className="dash-int-icon">{int.icon}</span>
                  <span className="dash-int-name">{int.nombre}</span>
                  <span className="dash-int-status" style={{ color: int.color }}>{int.status}</span>
                </div>
              ))}
          </div>
          <Link to="/plugin-manager" className="dash-link-all">Ver todas las integraciones →</Link>
        </div>
      </div>
    </div>
  )
}
