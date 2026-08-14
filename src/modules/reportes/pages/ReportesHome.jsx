/*
  ReportesHome.jsx — Módulo de Reportes & Analytics (appes.erp)
  Fidelidad exacta a la maqueta de referencia con gráficos SVG dinámicos y métricas interactivas.
*/
import { useState } from 'react'
import './ReportesHome.css'

function money(n) {
  return 'RD$ ' + Number(n || 0).toLocaleString('es-DO')
}

// ── Gráfico de Curva de Ventas SVG (Últimos 30 días) ──────────────────────────

function SalesTrendCurve() {
  const points = [
    { x: 30, y: 120, label: '1 May' },
    { x: 60, y: 100 },
    { x: 90, y: 95 },
    { x: 120, y: 90, label: '6 May' },
    { x: 150, y: 98 },
    { x: 180, y: 78 },
    { x: 210, y: 85, label: '11 May' },
    { x: 240, y: 65 },
    { x: 270, y: 70 },
    { x: 300, y: 40, label: '16 May', val: 'RD$ 540,000' },
    { x: 330, y: 50 },
    { x: 360, y: 45, label: '21 May' },
    { x: 390, y: 55 },
    { x: 420, y: 70, label: '26 May' },
    { x: 450, y: 68 },
    { x: 480, y: 50, label: '30 May' },
  ]

  const d = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`
  }, '')

  const areaD = `${d} L 480,150 L 30,150 Z`

  return (
    <div className="rep-line-chart-wrap">
      <svg viewBox="0 0 510 160" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="repSalesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Ejes y líneas guía horizontales */}
        <line x1="30" y1="30" x2="480" y2="30" stroke="#F1F5F9" strokeDasharray="3 3" />
        <line x1="30" y1="60" x2="480" y2="60" stroke="#F1F5F9" strokeDasharray="3 3" />
        <line x1="30" y1="90" x2="480" y2="90" stroke="#F1F5F9" strokeDasharray="3 3" />
        <line x1="30" y1="120" x2="480" y2="120" stroke="#F1F5F9" strokeDasharray="3 3" />
        <line x1="30" y1="150" x2="480" y2="150" stroke="#E2E8F0" />

        {/* Etiquetas del eje Y */}
        <text x="5" y="34" fontSize="8" fill="#94A3B8">1.0M</text>
        <text x="5" y="64" fontSize="8" fill="#94A3B8">800K</text>
        <text x="5" y="94" fontSize="8" fill="#94A3B8">600K</text>
        <text x="5" y="124" fontSize="8" fill="#94A3B8">400K</text>
        <text x="5" y="152" fontSize="8" fill="#94A3B8">0</text>

        {/* Área sombreada */}
        <path d={areaD} fill="url(#repSalesGrad)" />

        {/* Línea principal */}
        <path d={d} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Puntos y etiquetas del eje X */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
            {p.label && (
              <text x={p.x} y="158" fontSize="8" fill="#94A3B8" textAnchor="middle">{p.label}</text>
            )}
          </g>
        ))}
      </svg>

      {/* Tooltip flotante en 16 May */}
      <div className="rep-line-badge-tooltip">
        <small>16 May, 2025</small>
        <strong>RD$ 540,000</strong>
      </div>
    </div>
  )
}

// ── Gráfico Donut de Categorías ───────────────────────────────────────────────

function CategoryDonut() {
  const R = 44, cx = 55, cy = 55
  const circ = 2 * Math.PI * R
  // Electrónicos 42%, Hogar 25%, Moda 15%, Deportes 10%, Otros 8%
  const segs = [
    { name: 'Electrónicos', pct: 42, color: '#3B82F6', val: 'RD$ 882,000' },
    { name: 'Hogar', pct: 25, color: '#06B6D4', val: 'RD$ 525,000' },
    { name: 'Moda', pct: 15, color: '#EC4899', val: 'RD$ 315,000' },
    { name: 'Deportes', pct: 10, color: '#EF4444', val: 'RD$ 210,000' },
    { name: 'Otros', pct: 8, color: '#F59E0B', val: 'RD$ 168,000' },
  ]

  let offset = 0

  return (
    <div className="rep-donut-flex">
      <div className="rep-donut-svg-wrap">
        <svg viewBox="0 0 110 110" style={{ width: 110, height: 110, transform: 'rotate(-90deg)' }}>
          {segs.map((s, idx) => {
            const len = (s.pct / 100) * circ
            const el = (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="14"
                strokeDasharray={`${len} ${circ - len}`}
                strokeDashoffset={-offset}
              />
            )
            offset += len
            return el
          })}
          <circle cx={cx} cy={cy} r={36} fill="#FFFFFF" />
        </svg>
        <div className="rep-donut-center">
          <small>Total</small>
          <strong>RD$ 2.1M</strong>
        </div>
      </div>

      <ul className="rep-donut-legend">
        {segs.map(s => (
          <li key={s.name}>
            <span>
              <span className="rep-donut-dot" style={{ background: s.color }} />
              <span style={{ color: '#64748B' }}>{s.name}</span>
            </span>
            <strong>{s.val}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Gráfico Donut de Gastos por Categoría ──────────────────────────────────────

function ExpensesDonut() {
  const R = 44, cx = 55, cy = 55
  const circ = 2 * Math.PI * R
  const segs = [
    { name: 'Operativos', pct: 40, color: '#3B82F6', val: 'RD$ 340,000' },
    { name: 'Administrativos', pct: 25, color: '#06B6D4', val: 'RD$ 212,500' },
    { name: 'Ventas & Marketing', pct: 20, color: '#EC4899', val: 'RD$ 170,000' },
    { name: 'Financieros', pct: 10, color: '#EF4444', val: 'RD$ 85,000' },
    { name: 'Otros', pct: 5, color: '#F59E0B', val: 'RD$ 42,500' },
  ]

  let offset = 0

  return (
    <div className="rep-donut-flex">
      <div className="rep-donut-svg-wrap">
        <svg viewBox="0 0 110 110" style={{ width: 110, height: 110, transform: 'rotate(-90deg)' }}>
          {segs.map((s, idx) => {
            const len = (s.pct / 100) * circ
            const el = (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="14"
                strokeDasharray={`${len} ${circ - len}`}
                strokeDashoffset={-offset}
              />
            )
            offset += len
            return el
          })}
          <circle cx={cx} cy={cy} r={36} fill="#FFFFFF" />
        </svg>
        <div className="rep-donut-center">
          <small>Total</small>
          <strong>RD$ 850K</strong>
        </div>
      </div>

      <ul className="rep-donut-legend">
        {segs.map(s => (
          <li key={s.name}>
            <span>
              <span className="rep-donut-dot" style={{ background: s.color }} />
              <span style={{ color: '#64748B' }}>{s.name}</span>
            </span>
            <strong>{s.val}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Mini Sparkline SVG para Tendencia ──────────────────────────────────────────

function Sparkline({ isUp = true }) {
  const points = isUp ? '0,14 10,12 20,8 30,10 40,4 50,2' : '0,4 10,6 20,10 30,8 40,12 50,14'
  const color = isUp ? '#10B981' : '#EF4444'

  return (
    <svg width="50" height="16" style={{ overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

// ── Componente Principal ReportesHome ──────────────────────────────────────────

export function ReportesHome() {
  const [toast, setToast] = useState(null)

  const showToastMsg = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleExportPDF = () => {
    showToastMsg('Generando y exportando reporte en PDF...')
  }

  return (
    <div className="rep-container">
      {/* ── Encabezado Principal ── */}
      <div className="rep-header-row">
        <div className="rep-title-box">
          <div className="rep-title-row">
            <span style={{ fontSize: 22 }}>📊</span>
            <h1 className="rep-main-title">Reportes & Analytics</h1>
          </div>
          <p className="rep-subtitle">Datos en tiempo real para una toma de decisiones inteligente.</p>
        </div>

        <div className="rep-header-actions">
          <div className="rep-date-picker-btn">
            📅 <span>01 - 30 May, 2025</span> ▾
          </div>
          <button className="rep-outline-btn" onClick={() => showToastMsg('Filtros avanzados aplicados')}>
            ⚡ Filtros
          </button>
          <button className="rep-btn-primary" onClick={handleExportPDF}>
            📥 Exportar PDF
          </button>
        </div>
      </div>

      {/* ── 6 KPI Cards Superiores ── */}
      <div className="rep-kpi-grid">
        {/* KPI 1 */}
        <div className="rep-kpi-card">
          <div className="rep-kpi-top">
            <div className="rep-kpi-icon green">💲</div>
            <span className="rep-kpi-label">Ingresos Totales</span>
          </div>
          <h3 className="rep-kpi-value">{money(1250000)}</h3>
          <span className="rep-kpi-trend up">↑ 18.2% vs período anterior</span>
        </div>

        {/* KPI 2 */}
        <div className="rep-kpi-card">
          <div className="rep-kpi-top">
            <div className="rep-kpi-icon red">📉</div>
            <span className="rep-kpi-label">Gastos Totales</span>
          </div>
          <h3 className="rep-kpi-value">{money(850000)}</h3>
          <span className="rep-kpi-trend down">↑ 12.1% vs período anterior</span>
        </div>

        {/* KPI 3 */}
        <div className="rep-kpi-card">
          <div className="rep-kpi-top">
            <div className="rep-kpi-icon blue">💼</div>
            <span className="rep-kpi-label">Utilidad Neta</span>
          </div>
          <h3 className="rep-kpi-value">{money(400000)}</h3>
          <span className="rep-kpi-trend up">↑ 22.4% vs período anterior</span>
        </div>

        {/* KPI 4 */}
        <div className="rep-kpi-card">
          <div className="rep-kpi-top">
            <div className="rep-kpi-icon orange">📊</div>
            <span className="rep-kpi-label">Margen de Ganancia</span>
          </div>
          <h3 className="rep-kpi-value">32%</h3>
          <span className="rep-kpi-trend up">↑ 5% vs período anterior</span>
        </div>

        {/* KPI 5 */}
        <div className="rep-kpi-card">
          <div className="rep-kpi-top">
            <div className="rep-kpi-icon purple">🛒</div>
            <span className="rep-kpi-label">Ventas Totales</span>
          </div>
          <h3 className="rep-kpi-value">{money(2100000)}</h3>
          <span className="rep-kpi-trend up">↑ 15.3% vs período anterior</span>
        </div>

        {/* KPI 6 */}
        <div className="rep-kpi-card">
          <div className="rep-kpi-top">
            <div className="rep-kpi-icon cyan">📋</div>
            <span className="rep-kpi-label">Órdenes de Venta</span>
          </div>
          <h3 className="rep-kpi-value">156</h3>
          <span className="rep-kpi-trend up">↑ 8.6% vs período anterior</span>
        </div>
      </div>

      {/* ── Fila 1 de Gráficos (3 Columnas) ── */}
      <div className="rep-grid-3">
        {/* Ventas — Últimos 30 días */}
        <div className="rep-card">
          <div className="rep-card-header">
            <strong>Ventas — Últimos 30 días</strong>
            <small>Total: <strong>RD$ 1,250,000</strong></small>
          </div>
          <SalesTrendCurve />
        </div>

        {/* Ventas por Categoría */}
        <div className="rep-card">
          <div className="rep-card-header">
            <strong>Ventas por Categoría</strong>
          </div>
          <CategoryDonut />
        </div>

        {/* Ventas por Canal */}
        <div className="rep-card">
          <div className="rep-card-header">
            <strong>Ventas por Canal</strong>
          </div>
          <div className="rep-channel-list">
            {[
              { canal: 'Tienda Online', val: 'RD$ 840,000', pct: 40, color: '#3B82F6' },
              { canal: 'Tienda Física', val: 'RD$ 630,000', pct: 30, color: '#10B981' },
              { canal: 'Distribuidores', val: 'RD$ 420,000', pct: 20, color: '#8B5CF6' },
              { canal: 'Marketplace', val: 'RD$ 210,000', pct: 10, color: '#F97316' },
            ].map(c => (
              <div key={c.canal} className="rep-channel-row">
                <div className="rep-channel-info">
                  <span>{c.canal}</span>
                  <span><strong>{c.val}</strong> <small>({c.pct}%)</small></span>
                </div>
                <div className="rep-progress-bg">
                  <div className="rep-progress-fill" style={{ width: `${c.pct * 2.5}%`, background: c.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Fila 2 de Gráficos (4 Columnas) ── */}
      <div className="rep-grid-4">
        {/* Resumen Financiero */}
        <div className="rep-card">
          <div className="rep-card-header">
            <strong>Resumen Financiero</strong>
          </div>
          <div className="rep-fin-list">
            <div className="rep-fin-item">
              <span className="rep-fin-name"><span className="rep-fin-name-icon">🏦</span> Activos Totales</span>
              <span className="rep-fin-val">{money(3450000)} <small style={{ color: '#059669', fontSize: 10 }}>↑ 9.5%</small></span>
            </div>
            <div className="rep-fin-item">
              <span className="rep-fin-name"><span className="rep-fin-name-icon">📑</span> Pasivos Totales</span>
              <span className="rep-fin-val">{money(1230000)} <small style={{ color: '#DC2626', fontSize: 10 }}>▼ 4.2%</small></span>
            </div>
            <div className="rep-fin-item">
              <span className="rep-fin-name"><span className="rep-fin-name-icon">🏛️</span> Patrimonio Neto</span>
              <span className="rep-fin-val">{money(2220000)} <small style={{ color: '#059669', fontSize: 10 }}>↑ 13.7%</small></span>
            </div>
            <div className="rep-fin-item">
              <span className="rep-fin-name"><span className="rep-fin-name-icon">💵</span> Flujo de Caja</span>
              <span className="rep-fin-val">{money(320000)} <small style={{ color: '#059669', fontSize: 10 }}>↑ 8.9%</small></span>
            </div>
          </div>
          <small style={{ fontSize: 9, color: '#94A3B8', marginTop: 4 }}>Actualizado al 30 May, 2025</small>
        </div>

        {/* Gastos por Categoría */}
        <div className="rep-card">
          <div className="rep-card-header">
            <strong>Gastos por Categoría</strong>
          </div>
          <ExpensesDonut />
        </div>

        {/* Cuentas por Cobrar */}
        <div className="rep-card">
          <div className="rep-card-header">
            <strong>Cuentas por Cobrar</strong>
          </div>
          <h3 className="rep-acc-top-val">{money(620000)}</h3>
          <span className="rep-acc-sub">↑ 16.3% vs período anterior</span>
          <div className="rep-acc-chips">
            <div className="rep-acc-chip-col">
              <small>Vencidas</small>
              <strong>RD$ 120,000</strong>
              <span className="red">● 19%</span>
            </div>
            <div className="rep-acc-chip-col">
              <small>Por Vencer</small>
              <strong>RD$ 150,000</strong>
              <span className="orange">● 24%</span>
            </div>
            <div className="rep-acc-chip-col">
              <small>Al Día</small>
              <strong>RD$ 350,000</strong>
              <span className="green">● 57%</span>
            </div>
          </div>
          <small style={{ fontSize: 9, color: '#94A3B8', marginTop: 4 }}>Total clientes: 45</small>
        </div>

        {/* Cuentas por Pagar */}
        <div className="rep-card">
          <div className="rep-card-header">
            <strong>Cuentas por Pagar</strong>
          </div>
          <h3 className="rep-acc-top-val">{money(280000)}</h3>
          <span className="rep-acc-sub red">▼ 8.7% vs período anterior</span>
          <div className="rep-acc-chips">
            <div className="rep-acc-chip-col">
              <small>Vencidas</small>
              <strong>RD$ 60,000</strong>
              <span className="red">● 21%</span>
            </div>
            <div className="rep-acc-chip-col">
              <small>Por Vencer</small>
              <strong>RD$ 80,000</strong>
              <span className="orange">● 29%</span>
            </div>
            <div className="rep-acc-chip-col">
              <small>Al Día</small>
              <strong>RD$ 140,000</strong>
              <span className="green">● 50%</span>
            </div>
          </div>
          <small style={{ fontSize: 9, color: '#94A3B8', marginTop: 4 }}>Total proveedores: 28</small>
        </div>
      </div>

      {/* ── Fila 3 Inferior: 3 Tablas ── */}
      <div className="rep-grid-bottom">
        {/* Top 5 Productos Más Vendidos */}
        <div className="rep-card">
          <div className="rep-card-header">
            <strong>Top 5 Productos Más Vendidos</strong>
          </div>
          <table className="rep-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Ventas (RD$)</th>
                <th>Unidades</th>
                <th>Tendencia</th>
              </tr>
            </thead>
            <tbody>
              {[
                { prod: 'Smartphone XYZ', cat: 'Electrónicos', ventas: 245000, uds: 120, icon: '📱' },
                { prod: 'Laptop Pro 15', cat: 'Electrónicos', ventas: 198000, uds: 45, icon: '💻' },
                { prod: 'Sofá Modular', cat: 'Hogar', ventas: 156000, uds: 30, icon: '🛋️' },
                { prod: 'Zapatillas Runner', cat: 'Deportes', ventas: 98000, uds: 80, icon: '👟' },
                { prod: 'Camisa Casual', cat: 'Moda', ventas: 75000, uds: 200, icon: '👔' },
              ].map(p => (
                <tr key={p.prod}>
                  <td>
                    <div className="rep-prod-cell">
                      <span className="rep-prod-icon">{p.icon}</span>
                      <span>{p.prod}</span>
                    </div>
                  </td>
                  <td style={{ color: '#64748B' }}>{p.cat}</td>
                  <td><strong>{money(p.ventas)}</strong></td>
                  <td>{p.uds}</td>
                  <td><Sparkline isUp={p.prod !== 'Camisa Casual'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <span className="rep-footer-link" onClick={() => showToastMsg('Cargando reporte de productos...')}>
            Ver reporte completo
          </span>
        </div>

        {/* Ventas por Vendedor */}
        <div className="rep-card">
          <div className="rep-card-header">
            <strong>Ventas por Vendedor</strong>
          </div>
          <table className="rep-table">
            <thead>
              <tr>
                <th>Vendedor</th>
                <th>Ventas (RD$)</th>
                <th>Órdenes</th>
                <th>Comisión</th>
              </tr>
            </thead>
            <tbody>
              {[
                { nom: 'Ana Martínez', ventas: 320000, ord: 28, com: 16000, in: 'AM' },
                { nom: 'Juan Pérez', ventas: 280000, ord: 24, com: 14000, in: 'JP' },
                { nom: 'María Rodríguez', ventas: 250000, ord: 22, com: 12500, in: 'MR' },
                { nom: 'Luis Gómez', ventas: 210000, ord: 18, com: 10500, in: 'LG' },
                { nom: 'Carlos Hernández', ventas: 180000, ord: 16, com: 9000, in: 'CH' },
              ].map(v => (
                <tr key={v.nom}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="rep-avatar">{v.in}</div>
                      <strong>{v.nom}</strong>
                    </div>
                  </td>
                  <td><strong>{money(v.ventas)}</strong></td>
                  <td>{v.ord}</td>
                  <td style={{ color: '#059669', fontWeight: 600 }}>{money(v.com)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <span className="rep-footer-link" onClick={() => showToastMsg('Cargando reporte de vendedores...')}>
            Ver reporte completo
          </span>
        </div>

        {/* Actividad Reciente */}
        <div className="rep-card">
          <div className="rep-card-header">
            <strong>Actividad Reciente</strong>
          </div>
          <div className="rep-act-list">
            {[
              { icon: '📄', desc: 'Nueva orden de venta #ORD-1056', monto: 'RD$ 25,000', time: 'Hace 10 min' },
              { icon: '💰', desc: 'Pago recibido de Cliente ABC', monto: 'RD$ 15,000', time: 'Hace 35 min' },
              { icon: '🧾', desc: 'Nueva factura #FAC-2089', monto: 'RD$ 18,500', time: 'Hace 1 hora' },
              { icon: '🏢', desc: 'Gasto registrado - Alquiler', monto: 'RD$ 22,000', time: 'Hace 2 horas' },
              { icon: '👥', desc: 'Nuevo proveedor registrado (Tech Supplies SRL)', monto: '', time: 'Hace 3 horas' },
            ].map((a, i) => (
              <div key={i} className="rep-act-item">
                <div className="rep-act-left">
                  <span className="rep-act-icon">{a.icon}</span>
                  <div>
                    <div className="rep-act-desc">{a.desc}</div>
                    {a.monto && <strong style={{ fontSize: 10, color: '#2563EB' }}>{a.monto}</strong>}
                  </div>
                </div>
                <span className="rep-act-time">{a.time}</span>
              </div>
            ))}
          </div>
          <span className="rep-footer-link" onClick={() => showToastMsg('Cargando historial de actividad...')}>
            Ver toda la actividad
          </span>
        </div>
      </div>

      {/* Toast */}
      {toast && <div className="rep-toast">{toast}</div>}
    </div>
  )
}
