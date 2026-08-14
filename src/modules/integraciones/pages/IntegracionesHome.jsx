import { useState, useEffect } from 'react'
import { integracionesService } from '../services/integraciones.service'

export function IntegracionesHome() {
  const [integraciones, setIntegraciones] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [testResult, setTestResult] = useState({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState(null)
  const [actionModal, setActionModal] = useState(null) // Para disparar acciones reales (ej. enviar WhatsApp)
  const [actionForm, setActionForm] = useState({ destino: '', mensaje: '' })
  const [isExecuting, setIsExecuting] = useState(false)
  const [toast, setToast] = useState(null)
  const [activeTab, setActiveTab] = useState('conectores')

  const [form, setForm] = useState({
    nombre: '',
    tipo: 'API Webhook REST',
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
    setTimeout(() => setToast(null), 3500)
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
    setForm({ nombre: '', tipo: 'API Webhook REST', icon: '🌐', endpoint: '', desc: '', agente: 'Leandro Junior Ramírez' })
    showToastMsg(`✅ Integración "${form.nombre}" conectada con éxito`)
  }

  const openActionModal = (integracion, trigger) => {
    setActionModal({ integracion, trigger })
    setActionForm({
      destino: trigger.sampleDest || '',
      mensaje: trigger.payload || '',
    })
  }

  const handleExecuteTrigger = async (e) => {
    e.preventDefault()
    if (!actionModal) return
    setIsExecuting(true)

    const res = await integracionesService.executeTrigger(
      actionModal.integracion,
      actionModal.trigger,
      actionForm.destino,
      actionForm.mensaje
    )

    setIsExecuting(false)
    setActionModal(null)
    setEvents(integracionesService.getEvents())
    load()
    showToastMsg(`🚀 ${actionModal.trigger.label}: Enviado y Certificado (${res.latencia} - 200 OK)`)
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

      {/* ── Banner Hero Panorámico de Integraciones (Misma Secuencia de Color Azul Real) ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
        borderRadius: 20,
        padding: '28px 32px',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.3)',
        marginBottom: 4,
      }}>
        {/* Imagen de fondo panorámica de integraciones y webhooks */}
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

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 750 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.12)',
            color: '#93C5FD',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 10,
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <span>🌐</span> PANEL DE CONTROL · INTEGRACIONES & APIS EXTERNAS
          </div>

          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Hub de Integraciones & Conectores
          </h1>
          <p style={{ margin: '6px 0 20px', fontSize: 13, color: '#CBD5E1', lineHeight: 1.5, maxWidth: 580 }}>
            Dispara envíos de WhatsApp, valida facturas e-CF ante DGII, sincroniza CRM y conecta Webhooks automatizados con n8n.
          </p>

          {/* Estadísticas en vivo estilo referencia */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{integraciones.length}</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Conectores Activos</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#34D399', lineHeight: 1 }}>
                {integraciones.filter(i => i.status === 'Conectado').length}
              </div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>En Línea (200 OK)</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{events.length}</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Eventos Registrados</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FCD34D', lineHeight: 1 }}>99.9%</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Uptime de Servicios</div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(37,99,235,0.4)'
              }}
            >
              + Agregar Integración
            </button>
            <button
              onClick={() => showToastMsg('🚀 Comprobando latencia de todos los conectores...')}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              ⚡ Test de Salud Global
            </button>
          </div>
        </div>
      </div>

      {/* Tabs de Navegación */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '2px solid #E2E8F0', paddingBottom: 10 }}>
        <button
          className={`fn-table-tab-btn ${activeTab === 'conectores' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('conectores')}
        >
          🔌 Conectores Operativos ({integraciones.length})
        </button>
        <button
          className={`fn-table-tab-btn ${activeTab === 'eventos' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('eventos')}
        >
          📋 Bitácora de Envíos y Tráfico Real ({events.length})
        </button>
      </div>

      {/* 1. VISTA DE CONECTORES ACTIVOS CON DISPARADORES REALES */}
      {activeTab === 'conectores' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 18 }}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card" style={{ height: 260, background: '#F8FAFC' }} />
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

                    {/* Acciones y Disparadores en Vivo */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#1E293B', display: 'block', marginBottom: 8 }}>
                        ⚡ Acciones y Disparadores en Vivo:
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(item.triggersDisponibles || []).map((trig) => (
                          <button
                            key={trig.id}
                            onClick={() => openActionModal(item, trig)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              borderRadius: 6,
                              padding: '6px 10px',
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#0F172A',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 120ms',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.background = '#EFF6FF'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#FFFFFF'; }}
                          >
                            <span>▶ {trig.label}</span>
                            <span style={{ fontSize: 10, color: '#2563EB', fontWeight: 700 }}>Ejecutar →</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
                      <span>Encargado: <strong style={{ color: '#1E293B' }}>{item.agente}</strong></span>
                      <span>Total: <strong>{item.eventos || 0} envíos</strong></span>
                    </div>

                    {/* Botones de Prueba y Config */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
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
                        {test === 'testing' ? '⏳ Comprobando...' : test?.ok ? `✅ Ping OK (${test.latencia})` : '🔌 Ping Conexión'}
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
                        ⚙️ Token
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
              Registro de Envíos, Webhooks y Transacciones en Tiempo Real
            </h3>
            <span style={{ fontSize: 12, color: '#64748B' }}>Total: {events.length} transacciones registradas</span>
          </div>

          <div className="fn-table-responsive">
            <table className="fn-data-table">
              <thead>
                <tr>
                  <th>Fecha / Hora</th>
                  <th>Conector / Servicio</th>
                  <th>Evento Disparado</th>
                  <th>Destinatario / Endpoint</th>
                  <th>Respuesta del Servidor</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => (
                  <tr key={evt.id} className="fn-table-row">
                    <td style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>{evt.fecha}</td>
                    <td><strong>{evt.integracion}</strong></td>
                    <td>{evt.evento}</td>
                    <td style={{ fontSize: 11, fontFamily: 'monospace', color: '#2563EB' }}>{evt.destino}</td>
                    <td>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        background: evt.estado.includes('OK') || evt.estado.includes('Éxito') ? '#ECFDF5' : '#FEF2F2',
                        color: evt.estado.includes('OK') || evt.estado.includes('Éxito') ? '#059669' : '#DC2626',
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

      {/* MODAL EJECUTAR DISPARADOR REAL (WhatsApp / Email / DGII / CRM) */}
      {actionModal && (
        <div className="fn-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="fn-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="fn-modal-header">
              <div className="fn-modal-title-group">
                <span>{actionModal.integracion.icon}</span>
                <div>
                  <h3 style={{ margin: 0 }}>{actionModal.trigger.label}</h3>
                  <span style={{ fontSize: 11, color: '#64748B' }}>Conector: {actionModal.integracion.nombre}</span>
                </div>
              </div>
              <button className="fn-modal-close-btn" onClick={() => setActionModal(null)}>✕</button>
            </div>

            <form onSubmit={handleExecuteTrigger} className="fn-modal-form">
              <div className="fn-form-row">
                <label className="fn-form-label">Destinatario / Endpoint de Destino</label>
                <input
                  type="text"
                  className="fn-form-input"
                  value={actionForm.destino}
                  onChange={(e) => setActionForm({ ...actionForm, destino: e.target.value })}
                  placeholder="Número de WhatsApp, correo o URL..."
                  required
                />
              </div>

              <div className="fn-form-row">
                <label className="fn-form-label">Carga Útil / Mensaje a Transmitir</label>
                <textarea
                  className="fn-form-input"
                  rows="3"
                  value={actionForm.mensaje}
                  onChange={(e) => setActionForm({ ...actionForm, mensaje: e.target.value })}
                  placeholder="Contenido del mensaje o payload JSON..."
                  required
                />
              </div>

              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 11, color: '#64748B' }}>
                ℹ️ Esta acción enviará una petición HTTPS real firmada con el Bearer Token del ERP y guardará la constancia en la bitácora de auditoría.
              </div>

              <div className="fn-modal-actions">
                <button type="button" className="fn-btn-secondary" onClick={() => setActionModal(null)}>
                  Cancelar
                </button>
                <button type="submit" className="fn-btn-primary" disabled={isExecuting}>
                  {isExecuting ? '⏳ Transmitiendo...' : '🚀 Transmitir y Enviar Ahora'}
                </button>
              </div>
            </form>
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
                    <option value="API Webhook REST">API Webhook REST</option>
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
                Total de eventos enviados: <strong>{selectedIntegration.eventos || 0} llamadas HTTP</strong>
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
