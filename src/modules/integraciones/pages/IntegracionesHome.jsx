import { useState, useEffect } from 'react'
import { integracionesService } from '../services/integraciones.service'

export function IntegracionesHome() {
  const [integraciones, setIntegraciones] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [testResult, setTestResult] = useState({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState(null)
  const [toast, setToast] = useState(null)
  const [activeTab, setActiveTab] = useState('conectores')

  const [form, setForm] = useState({
    nombre: '',
    tipo: 'API Webhook',
    icon: '🌐',
    endpoint: '',
    desc: '',
    agente: 'Leandro Junior Ramírez',
  })

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const data = await integracionesService.getIntegraciones()
    const evts = integracionesService.getEvents()
    setIntegraciones(data)
    setEvents(evts)
    setLoading(false)
  }

  const showToastMsg = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleTest = async (item) => {
    setTestResult((r) => ({ ...r, [item.id]: 'testing' }))
    const res = await integracionesService.testEndpoint(item)
    setTestResult((r) => ({ ...r, [item.id]: res }))
    setEvents(integracionesService.getEvents())
    showToastMsg(`✅ ${item.nombre}: Conexión exitosa (${res.latencia} - 200 OK)`)
  }

  const handleToggle = async (id, nombre) => {
    const updated = await integracionesService.toggleStatus(id)
    setIntegraciones(updated)
    showToastMsg(`Estado de "${nombre}" actualizado 🔄`)
  }

  const handleDelete = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de eliminar el conector ${nombre}?`)) {
      const updated = await integracionesService.deleteIntegracion(id)
      setIntegraciones(updated)
      showToastMsg(`Integración "${nombre}" eliminada 🗑️`)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.nombre || !form.endpoint) return
    const updated = await integracionesService.createIntegracion(form)
    setIntegraciones(updated)
    setShowCreateModal(false)
    setForm({ nombre: '', tipo: 'API Webhook', icon: '🌐', endpoint: '', desc: '', agente: 'Leandro Junior Ramírez' })
    showToastMsg(`✅ Integración "${form.nombre}" conectada con éxito`)
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
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
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 1500,
          fontSize: 13,
          fontWeight: 600,
        }}>
          {toast}
        </div>
      )}

      {/* Encabezado Superior */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#FFFFFF',
        padding: '20px 24px',
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}>
            🌐
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0F172A' }}>
              Integraciones & Webhooks
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
              Conectores externos, API de mensajería, e-CF DGII y automatizaciones en tiempo real.
            </p>
          </div>
        </div>

        <button
          className="fn-btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <span>+</span> Agregar Integración
        </button>
      </div>

      {/* Tabs de Navegación */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '2px solid #E2E8F0', paddingBottom: 10 }}>
        <button
          className={`fn-table-tab-btn ${activeTab === 'conectores' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('conectores')}
        >
          🔌 Conectores Activos ({integraciones.length})
        </button>
        <button
          className={`fn-table-tab-btn ${activeTab === 'eventos' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('eventos')}
        >
          📋 Bitácora de Tráfico y Webhooks ({events.length})
        </button>
      </div>

      {/* 1. VISTA DE CONECTORES ACTIVOS */}
      {activeTab === 'conectores' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card" style={{ height: 220, background: '#F8FAFC' }} />
              ))
            : integraciones.map((item) => {
                const test = testResult[item.id]
                return (
                  <div
                    key={item.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: 14,
                      padding: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 32 }}>{item.icon}</span>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{item.nombre}</h3>
                          <span style={{ fontSize: 11, color: item.status === 'Conectado' ? '#10B981' : '#F59E0B', fontWeight: 700 }}>
                            ● {item.status} ({item.tipo})
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggle(item.id, item.nombre)}
                        style={{
                          background: item.status === 'Conectado' ? '#ECFDF5' : '#FEF3C7',
                          color: item.status === 'Conectado' ? '#059669' : '#D97706',
                          border: 'none',
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {item.status === 'Conectado' ? 'Pausar' : 'Activar'}
                      </button>
                    </div>

                    <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: '1.4' }}>
                      {item.desc}
                    </p>

                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', display: 'block', textTransform: 'uppercase' }}>
                        Endpoint / Webhook URL:
                      </span>
                      <code style={{ fontSize: 11, color: '#2563EB', wordBreak: 'break-all', fontWeight: 600 }}>
                        {item.endpoint}
                      </code>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                      <span>Encargado: <strong style={{ color: '#1E293B' }}>{item.agente}</strong></span>
                      <span>Ping: {item.ultimoPing}</span>
                    </div>

                    {/* Botones de Acción */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button
                        onClick={() => handleTest(item)}
                        disabled={test === 'testing'}
                        style={{
                          flex: 1,
                          background: test?.ok ? '#10B981' : '#2563EB',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: test === 'testing' ? 'wait' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        {test === 'testing' ? '⏳ Enviando Ping...' : test?.ok ? `✅ OK (${test.latencia})` : '🔌 Probar Conexión'}
                      </button>

                      <button
                        onClick={() => setSelectedIntegration(item)}
                        style={{
                          background: '#F1F5F9',
                          border: '1px solid #CBD5E1',
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#334155',
                          cursor: 'pointer',
                        }}
                      >
                        ⚙️ Config
                      </button>

                      <button
                        onClick={() => handleDelete(item.id, item.nombre)}
                        style={{
                          background: '#FEF2F2',
                          border: '1px solid #FECACA',
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#DC2626',
                          cursor: 'pointer',
                        }}
                        title="Eliminar integración"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )
              })}
        </div>
      )}

      {/* 2. VISTA DE BITÁCORA DE TRÁFICO Y EVENTOS */}
      {activeTab === 'eventos' && (
        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
            Registro de Envíos y Webhooks en Tiempo Real
          </h3>
          <div className="fn-table-responsive">
            <table className="fn-data-table">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Integración</th>
                  <th>Evento Disparado</th>
                  <th>Destino / Endpoint</th>
                  <th>Respuesta HTTP</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => (
                  <tr key={evt.id} className="fn-table-row">
                    <td style={{ fontSize: 12, color: '#64748B' }}>{evt.fecha}</td>
                    <td><strong>{evt.integracion}</strong></td>
                    <td>{evt.evento}</td>
                    <td style={{ fontSize: 11, fontFamily: 'monospace', color: '#2563EB' }}>{evt.destino}</td>
                    <td>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        background: evt.estado.includes('OK') || evt.estado.includes('Sincronizado') ? '#ECFDF5' : '#FEF2F2',
                        color: evt.estado.includes('OK') || evt.estado.includes('Sincronizado') ? '#059669' : '#DC2626',
                      }}>
                        {evt.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Agregar Nueva Integración */}
      {showCreateModal && (
        <div className="fn-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="fn-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="fn-modal-header">
              <div className="fn-modal-title-group">
                <span>🔌</span>
                <h3>Conectar Nueva Integración Externa</h3>
              </div>
              <button className="fn-modal-close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreate} className="fn-modal-form">
              <div className="fn-form-row">
                <label className="fn-form-label">Nombre del Servicio</label>
                <input
                  type="text"
                  className="fn-form-input"
                  placeholder="Ej. Slack Bot / Stripe Payments / DGII e-CF"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="fn-form-grid-2">
                <div className="fn-form-row">
                  <label className="fn-form-label">Tipo de Conector</label>
                  <select
                    className="fn-form-input"
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    <option value="API Webhook">API Webhook REST</option>
                    <option value="Mensajería / SMS">Mensajería / SMS</option>
                    <option value="Pasarela de Pago">Pasarela de Pago</option>
                    <option value="Fiscal / DGII">Fiscal / DGII</option>
                    <option value="Automatización AI">Automatización AI</option>
                  </select>
                </div>

                <div className="fn-form-row">
                  <label className="fn-form-label">Ícono Representativo</label>
                  <input
                    type="text"
                    className="fn-form-input"
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  />
                </div>
              </div>

              <div className="fn-form-row">
                <label className="fn-form-label">Webhook Endpoint URL</label>
                <input
                  type="url"
                  className="fn-form-input"
                  placeholder="https://api.servicio.com/v1/webhook"
                  value={form.endpoint}
                  onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
                  required
                />
              </div>

              <div className="fn-form-row">
                <label className="fn-form-label">Descripción Operativa</label>
                <textarea
                  className="fn-form-input"
                  rows="2"
                  placeholder="Describe qué datos enviará o sincronizará esta integración..."
                  value={form.desc}
                  onChange={(e) => setForm({ ...form, desc: e.target.value })}
                />
              </div>

              <div className="fn-modal-actions">
                <button type="button" className="fn-btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="fn-btn-primary">
                  Conectar y Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Configuración Detallada */}
      {selectedIntegration && (
        <div className="fn-modal-overlay" onClick={() => setSelectedIntegration(null)}>
          <div className="fn-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="fn-modal-header">
              <div className="fn-modal-title-group">
                <span>{selectedIntegration.icon}</span>
                <h3>Ajustes de {selectedIntegration.nombre}</h3>
              </div>
              <button className="fn-modal-close-btn" onClick={() => setSelectedIntegration(null)}>✕</button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="fn-form-label">Bearer Token / API Key</label>
                <input
                  type="text"
                  className="fn-form-input"
                  value={selectedIntegration.token}
                  readOnly
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label className="fn-form-label">Eventos Suscritos del ERP</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  {(selectedIntegration.eventosActivos || []).map((ev) => (
                    <span key={ev} style={{ background: '#EFF6FF', color: '#2563EB', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                      ⚡ {ev}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, color: '#64748B' }}>
                Total de eventos enviados: <strong>{selectedIntegration.eventos} llamadas HTTP</strong>
              </div>
            </div>

            <div className="fn-modal-actions" style={{ padding: 16, background: '#F8FAFC' }}>
              <button type="button" className="fn-btn-primary" onClick={() => setSelectedIntegration(null)}>
                Cerrar Ajustes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
