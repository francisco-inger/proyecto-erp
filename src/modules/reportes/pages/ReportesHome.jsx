import { useState, useEffect } from 'react'
import { apiClient } from 'core/api/apiClient'
import { dashboardService } from '../../../pages/dashboardService'

function MiniBar({ data }) {
  if (!data?.length) return null
  const max = Math.max(...data.map(d => d.valor))
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 100 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{
            width: '100%',
            height: `${(d.valor / max) * 90}%`,
            background: 'var(--color-accent)',
            borderRadius: '2px 2px 0 0',
            opacity: i === data.length - 1 ? 1 : 0.5,
            minHeight: 4
          }} />
          {i % 5 === 0 && <span style={{ fontSize: 9, color: 'var(--color-ink-faint)' }}>{d.dia}</span>}
        </div>
      ))}
    </div>
  )
}

export function ReportesHome() {
  const [salesChart, setSalesChart] = useState([])
  const [financiero, setFinanciero] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([dashboardService.getSalesChart(), dashboardService.getFinanciero()])
      .then(([sc, fin]) => { setSalesChart(sc); setFinanciero(fin) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const reportes = [
    { nombre: 'Ventas por Período',     icon: '📈', desc: 'Análisis de ventas mensual y comparativo.' },
    { nombre: 'Estado de Inventario',   icon: '📦', desc: 'Niveles de stock, rotación y productos críticos.' },
    { nombre: 'Cartera de Clientes',    icon: '👥', desc: 'Segmentación y comportamiento de clientes.' },
    { nombre: 'Flujo de Caja',          icon: '💰', desc: 'Ingresos vs gastos proyectados a 90 días.' },
    { nombre: 'Análisis de Compras',    icon: '🏷️', desc: 'Proveedores, tiempos de entrega y costos.' },
    { nombre: 'Rendimiento de Agentes', icon: '🤖', desc: 'Actividad y métricas de los 10 agentes IA.' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>📊 Reportes & Analytics</h2>
          <p style={{ margin: 0 }}>Datos en tiempo real desde PostgreSQL.</p>
        </div>
        <button className="btn btn-primary">📥 Exportar PDF</button>
      </div>

      {/* Gráfico de ventas */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <strong>Ventas — Últimos 30 días</strong>
          {financiero && (
            <span style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>
              Total: <b>RD$ {financiero.ingresos?.value?.toLocaleString()}</b>
            </span>
          )}
        </div>
        {loading ? <div style={{ height: 100, background: 'var(--color-surface-alt)', borderRadius: 6 }} /> : <MiniBar data={salesChart} />}
      </div>

      {/* Resumen financiero */}
      {financiero && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Ingresos',   value: financiero.ingresos?.value,  color: 'var(--color-success)' },
            { label: 'Gastos',     value: financiero.gastos?.value,    color: 'var(--color-danger)' },
            { label: 'Utilidad',   value: financiero.utilidad?.value,  color: 'var(--color-accent)' },
            { label: 'Margen',     value: `${financiero.margen?.value}%`, color: 'var(--color-ink)' },
          ].map(k => (
            <div key={k.label} className="card" style={{ textAlign: 'center', padding: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--color-ink-soft)' }}>{k.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: k.color }}>
                {typeof k.value === 'string' ? k.value : `RD$ ${k.value?.toLocaleString()}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reportes disponibles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {reportes.map(r => (
          <div key={r.nombre} className="card" style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-card)'}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{r.icon}</div>
            <h4 style={{ marginBottom: 4 }}>{r.nombre}</h4>
            <p style={{ fontSize: 12, margin: 0 }}>{r.desc}</p>
            <button className="btn btn-secondary" style={{ marginTop: 12, width: '100%', fontSize: 12 }}>
              Generar Reporte
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
