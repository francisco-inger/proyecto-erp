import { useState, useEffect } from 'react'
import { apiClient } from 'core/api/apiClient'

const FALLBACK = [
  { id: 'PRY-01', nombre: 'ERP Web Launch',        cliente: 'Interno',           avance: 75, estado: 'En curso',   fechaFin: '2026-08-21' },
  { id: 'PRY-02', nombre: 'App Móvil v1.0',         cliente: 'Interno',           avance: 40, estado: 'En curso',   fechaFin: '2026-09-10' },
  { id: 'PRY-03', nombre: 'Integración WhatsApp',   cliente: 'Distribuidora Tech', avance: 90, estado: 'Revisión',   fechaFin: '2026-08-15' },
  { id: 'PRY-04', nombre: 'Migración de Datos BD',  cliente: 'Constructora XYZ',  avance: 100, estado: 'Completado', fechaFin: '2026-08-01' },
]

const statusColor = { 'En curso': 'var(--color-accent)', 'Revisión': 'var(--color-warning)', Completado: 'var(--color-success)' }

function ProgressBar({ value }) {
  return (
    <div style={{ background: 'var(--color-surface-alt)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
      <div style={{
        width: `${value}%`, height: '100%',
        background: value >= 100 ? 'var(--color-success)' : 'var(--color-accent)',
        borderRadius: 4, transition: 'width 0.6s ease'
      }} />
    </div>
  )
}

export function ProyectosHome() {
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/proyectos')
      .then(setProyectos)
      .catch(() => setProyectos(FALLBACK))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>📁 Proyectos</h2>
          <p style={{ margin: 0 }}>Gestión y seguimiento de proyectos activos.</p>
        </div>
        <button className="btn btn-primary">+ Nuevo Proyecto</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card" style={{ height: 120, background: 'var(--color-surface-alt)', animation: 'shimmer 1.5s infinite' }} />
            ))
          : proyectos.map((p) => (
              <div key={p.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-ink-faint)' }}>{p.id}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: statusColor[p.estado] }}>● {p.estado}</span>
                </div>
                <h3 style={{ fontSize: 15, margin: '0 0 4px' }}>{p.nombre}</h3>
                <p style={{ fontSize: 12, marginBottom: 12 }}>Cliente: {p.cliente} · Entrega: {p.fechaFin}</p>
                <ProgressBar value={p.avance} />
                <div style={{ fontSize: 12, textAlign: 'right', color: 'var(--color-ink-soft)', marginTop: 4 }}>{p.avance}%</div>
              </div>
            ))}
      </div>
    </div>
  )
}
