import { useState, useEffect } from 'react'
import { proyectosService } from '../services/proyectos.service'

const statusColor = {
  'En curso': '#2563EB',
  'Revisión': '#F59E0B',
  'Completado': '#10B981',
}

function ProgressBar({ value }) {
  return (
    <div style={{ background: '#E2E8F0', borderRadius: 6, height: 8, overflow: 'hidden' }}>
      <div
        style={{
          width: `${Math.min(value, 100)}%`,
          height: '100%',
          background: value >= 100 ? '#10B981' : '#2563EB',
          borderRadius: 6,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  )
}

export function ProyectosHome() {
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    cliente: '',
    presupuesto: '',
    fechaFin: new Date().toISOString().slice(0, 10),
  })

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const data = await proyectosService.getProyectos()
    setProyectos(data)
    setLoading(false)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.nombre || !form.cliente) return
    await proyectosService.createProyecto(form)
    await load()
    setShowModal(false)
    setForm({
      nombre: '',
      cliente: '',
      presupuesto: '',
      fechaFin: new Date().toISOString().slice(0, 10),
    })
  }

  const handleUpdateProgress = async (id, currentAvance) => {
    const nuevo = Math.min(currentAvance + 20, 100)
    await proyectosService.updateAvance(id, nuevo)
    await load()
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '18px 24px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0F172A' }}>📁 Gestión de Proyectos</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
            Seguimiento de entregables sincronizado con Oportunidades Ganadas de CRM y Facturación.
          </p>
        </div>
        <button className="fn-btn-primary" onClick={() => setShowModal(true)}>
          + Nuevo Proyecto
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card" style={{ height: 160, background: '#F8FAFC' }} />
            ))
          : proyectos.map((p) => (
              <div
                key={p.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 12,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: 6 }}>
                    {p.id}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: statusColor[p.estado] || '#64748B' }}>
                    ● {p.estado}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: 16, margin: '0 0 4px', fontWeight: 700, color: '#0F172A' }}>{p.nombre}</h3>
                  <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                    Cliente: <strong style={{ color: '#1E293B' }}>{p.cliente}</strong>
                  </p>
                  {p.presupuesto && (
                    <p style={{ fontSize: 12, color: '#10B981', fontWeight: 700, margin: '4px 0 0' }}>
                      Presupuesto: RD$ {Number(p.presupuesto).toLocaleString('en-US')}
                    </p>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: '#64748B' }}>Avance de Entrega</span>
                    <strong style={{ color: '#0F172A' }}>{p.avance}%</strong>
                  </div>
                  <ProgressBar value={p.avance} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: 10, fontSize: 11, color: '#94A3B8' }}>
                  <span>Entrega: {p.fechaFin}</span>
                  {p.avance < 100 && (
                    <button
                      style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 600, color: '#2563EB', cursor: 'pointer' }}
                      onClick={() => handleUpdateProgress(p.id, p.avance)}
                    >
                      + Avanzar +20%
                    </button>
                  )}
                </div>
              </div>
            ))}
      </div>

      {showModal && (
        <div className="fn-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="fn-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="fn-modal-header">
              <div className="fn-modal-title-group">
                <span>📁</span>
                <h3>Registrar Nuevo Proyecto</h3>
              </div>
              <button className="fn-modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreate} className="fn-modal-form">
              <div className="fn-form-row">
                <label className="fn-form-label">Nombre del Proyecto</label>
                <input
                  type="text"
                  className="fn-form-input"
                  placeholder="Ej. Plataforma E-commerce B2B"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="fn-form-row">
                <label className="fn-form-label">Cliente</label>
                <input
                  type="text"
                  className="fn-form-input"
                  placeholder="Ej. Tech Solutions SRL"
                  value={form.cliente}
                  onChange={(e) => setForm({ ...form, cliente: e.target.value })}
                  required
                />
              </div>

              <div className="fn-form-grid-2">
                <div className="fn-form-row">
                  <label className="fn-form-label">Presupuesto (RD$)</label>
                  <input
                    type="number"
                    className="fn-form-input"
                    placeholder="0.00"
                    value={form.presupuesto}
                    onChange={(e) => setForm({ ...form, presupuesto: e.target.value })}
                  />
                </div>

                <div className="fn-form-row">
                  <label className="fn-form-label">Fecha Límite</label>
                  <input
                    type="date"
                    className="fn-form-input"
                    value={form.fechaFin}
                    onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
                  />
                </div>
              </div>

              <div className="fn-modal-actions">
                <button type="button" className="fn-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="fn-btn-primary">
                  Crear Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
