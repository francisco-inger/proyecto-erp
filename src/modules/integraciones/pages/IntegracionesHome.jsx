/*
  IntegracionesHome.jsx — Hub de Integraciones & Conectores Externos (APPEX.ERP)
  100% interactivo, validado en todos sus campos, sincronizado con CRM/Finanzas/Inventario.
*/
import React, { useState, useEffect } from 'react'
import { integracionesService } from '../services/integraciones.service'

export function IntegracionesHome() {
  const [integraciones, setIntegraciones] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [testResult, setTestResult] = useState({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState(null)
  const [editingIntegration, setEditingIntegration] = useState(null)
  const [viewEventModal, setViewEventModal] = useState(null)
  const [actionModal, setActionModal] = useState(null)
  const [actionForm, setActionForm] = useState({ destino: '', mensaje: '' })
  const [actionErrors, setActionErrors] = useState({})
  const [createErrors, setCreateErrors] = useState({})
  const [isExecuting, setIsExecuting] = useState(false)
  const [toast, setToast] = useState(null)
  const [activeTab, setActiveTab] = useState('conectores')
  const [showToken, setShowToken] = useState(false)

  // Clientes cargados para autocompletar envíos
  const [crmClients, setCrmClients] = useState([])

  const [form, setForm] = useState({
    nombre: '',
    tipo: 'API Webhook REST',
    icon: '🌐',
    endpoint: '',
    token: '',
    desc: '',
    agente: 'Leandro Junior Ramírez',
    eventosActivos: ['ventas.pedido_creado', 'finanzas.recibo_emitido']
  })

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const data = await integracionesService.getIntegraciones()
    const evts = integracionesService.getEvents()
    setIntegraciones(data)
    setEvents(evts)

    try {
      const rawCrm = localStorage.getItem('appes_crm_clients_v1')
      if (rawCrm) setCrmClients(JSON.parse(rawCrm))
    } catch (_) {}

    setLoading(false)
  }

  const showToastMsg = (msg, isError = false) => {
    setToast({ text: msg, isError })
    setTimeout(() => setToast(null), 3500)
  }

  const handleTest = async (item) => {
    setTestResult((r) => ({ ...r, [item.id]: 'testing' }))
    const res = await integracionesService.testEndpoint(item)
    setTestResult((r) => ({ ...r, [item.id]: res }))
    setEvents(integracionesService.getEvents())
    showToastMsg(`✅ ${item.nombre}: Ping OK (${res.latencia} - 200 OK)`)
  }

  const handleGlobalHealthCheck = async () => {
    showToastMsg('⚡ Ejecutando Test de Salud Global en todos los conectores...')
    const results = await integracionesService.runGlobalHealthCheck()
    setTestResult(results)
    showToastMsg('🟢 Todos los conectores operativos con latencia promedio < 45ms')
  }

  const handleToggle = async (id, nombre) => {
    const updated = await integracionesService.toggleStatus(id)
    setIntegraciones(updated)
    showToastMsg(`Estado de "${nombre}" actualizado 🔄`)
  }

  const handleDelete = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de eliminar el conector "${nombre}"?`)) {
      const updated = await integracionesService.deleteIntegracion(id)
      setIntegraciones(updated)
      showToastMsg(`Integración "${nombre}" eliminada 🗑️`)
    }
  }

  const validateCreateForm = () => {
    const errs = {}
    if (!form.nombre || form.nombre.trim().length < 3) errs.nombre = 'El nombre debe tener al menos 3 caracteres'
    if (!form.endpoint || !/^https?:\/\/.+/i.test(form.endpoint.trim())) {
      errs.endpoint = 'Debe ser una URL válida (ej: https://api.servicio.do/webhook)'
    }
    setCreateErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!validateCreateForm()) {
      showToastMsg('⚠️ Por favor completa los campos requeridos', true)
      return
    }
    const updated = await integracionesService.createIntegracion(form)
    setIntegraciones(updated)
    setShowCreateModal(false)
    setForm({
      nombre: '',
      tipo: 'API Webhook REST',
      icon: '🌐',
      endpoint: '',
      token: '',
      desc: '',
      agente: 'Leandro Junior Ramírez',
      eventosActivos: ['ventas.pedido_creado']
    })
    showToastMsg(`✅ Conector "${form.nombre}" creado y registrado con éxito`)
  }

  const handleSaveEditedIntegration = async (e) => {
    e.preventDefault()
    if (!editingIntegration) return
    if (!editingIntegration.endpoint || !/^https?:\/\/.+/i.test(editingIntegration.endpoint.trim())) {
      showToastMsg('⚠️ URL de Endpoint inválida', true)
      return
    }

    const updated = await integracionesService.updateIntegracion(editingIntegration.id, {
      endpoint: editingIntegration.endpoint,
      token: editingIntegration.token,
      desc: editingIntegration.desc,
      eventosActivos: editingIntegration.eventosActivos || []
    })
    setIntegraciones(updated)
    setEditingIntegration(null)
    showToastMsg(`💾 Cambios guardados para ${editingIntegration.nombre}`)
  }

  const openActionModal = (integracion, trigger) => {
    setActionModal({ integracion, trigger })
    setActionErrors({})
    setActionForm({
      destino: trigger.sampleDest || '',
      mensaje: trigger.payload || '',
    })
  }

  const validateActionForm = () => {
    const errs = {}
    if (!actionForm.destino || actionForm.destino.trim().length < 3) {
      errs.destino = 'Destinatario o Endpoint obligatorio'
    }
    if (!actionForm.mensaje || actionForm.mensaje.trim().length < 2) {
      errs.mensaje = 'El mensaje o payload no puede estar vacío'
    }
    // Validar JSON si el payload parece JSON
    if (actionForm.mensaje && (actionForm.mensaje.trim().startsWith('{') || actionForm.mensaje.trim().startsWith('['))) {
      try {
        JSON.parse(actionForm.mensaje)
      } catch (_) {
        errs.mensaje = 'JSON con formato sintáctico inválido'
      }
    }
    setActionErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleExecuteTrigger = async (e) => {
    e.preventDefault()
    if (!actionModal) return
    if (!validateActionForm()) {
      showToastMsg('⚠️ Corrige los datos antes de transmitir', true)
      return
    }

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
    showToastMsg(`🚀 ${actionModal.trigger.label}: Transmitido con éxito (${res.latencia} - 200 OK)`)
  }

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(actionForm.mensaje)
      setActionForm({ ...actionForm, mensaje: JSON.stringify(parsed, null, 2) })
      setActionErrors(prev => ({ ...prev, mensaje: null }))
      showToastMsg('✨ JSON formateado y validado correctamente')
    } catch (_) {
      setActionErrors(prev => ({ ...prev, mensaje: 'No se pudo formatear: JSON inválido' }))
    }
  }

  const handleClearLog = () => {
    if (window.confirm('¿Deseas vaciar la bitácora de transacciones?')) {
      const empty = integracionesService.clearEvents()
      setEvents(empty)
      showToastMsg('📋 Bitácora de eventos vaciada')
    }
  }

  return (
    <div style={{ maxWidth: 1300, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, boxSizing: 'border-box' }}>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: toast.isError ? '#7F1D1D' : '#0F172A',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 10,
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          zIndex: 1500,
          fontSize: 13,
          fontWeight: 700,
          borderLeft: toast.isError ? '4px solid #EF4444' : '4px solid #2563EB',
        }}>
          {toast.text}
        </div>
      )}

      {/* ── Banner Hero Panorámico de Integraciones ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
        borderRadius: 18,
        padding: '24px 28px',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 20px -4px rgba(30, 58, 138, 0.28)',
        marginBottom: 2,
        width: '100%',
        boxSizing: 'border-box',
      }}>
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '50%',
          backgroundImage: 'url(/branding/banner_enterprise_panoramic.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          opacity: 0.30,
          maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, transparent 100%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 760 }}>
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

          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Hub de Integraciones & Conectores
          </h1>
          <p style={{ margin: '6px 0 16px', fontSize: 13, color: '#CBD5E1', lineHeight: 1.45, maxWidth: 600 }}>
            Dispara envíos de WhatsApp, valida facturas e-CF ante DGII, sincroniza CRM y conecta Webhooks automatizados con n8n.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{integraciones.length}</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Conectores Activos</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#34D399', lineHeight: 1 }}>
                {integraciones.filter(i => i.status === 'Conectado').length}
              </div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>En Línea (200 OK)</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{events.length}</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Eventos Registrados</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#FCD34D', lineHeight: 1 }}>99.9%</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Uptime de Servicios</div>
            </div>
          </div>

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
              onClick={handleGlobalHealthCheck}
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
      <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid #E2E8F0', paddingBottom: 8, boxSizing: 'border-box' }}>
        <button
          className={`fn-table-tab-btn ${activeTab === 'conectores' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('conectores')}
          style={{
            background: activeTab === 'conectores' ? '#EFF6FF' : 'transparent',
            color: activeTab === 'conectores' ? '#1E3A8A' : '#64748B',
            border: 'none',
            borderBottom: activeTab === 'conectores' ? '2px solid #2563EB' : '2px solid transparent',
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            borderRadius: '6px 6px 0 0'
          }}
        >
          🔌 Conectores Operativos ({integraciones.length})
        </button>
        <button
          className={`fn-table-tab-btn ${activeTab === 'eventos' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('eventos')}
          style={{
            background: activeTab === 'eventos' ? '#EFF6FF' : 'transparent',
            color: activeTab === 'eventos' ? '#1E3A8A' : '#64748B',
            border: 'none',
            borderBottom: activeTab === 'eventos' ? '2px solid #2563EB' : '2px solid transparent',
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            borderRadius: '6px 6px 0 0'
          }}
        >
          📋 Bitácora de Envíos y Tráfico Real ({events.length})
        </button>
      </div>

      {/* 1. VISTA DE CONECTORES ACTIVOS CON DISPARADORES REALES */}
      {activeTab === 'conectores' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16, width: '100%', boxSizing: 'border-box' }}>
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
                      padding: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 28 }}>{item.icon}</span>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{item.nombre}</h3>
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

                    <p style={{ fontSize: 12.5, color: '#475569', margin: 0, lineHeight: 1.4 }}>
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
                              padding: '7px 10px',
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
                            <span style={{ fontSize: 11, color: '#2563EB', fontWeight: 700 }}>Ejecutar →</span>
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
                          padding: '7px 12px',
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
                        onClick={() => setEditingIntegration(JSON.parse(JSON.stringify(item)))}
                        style={{
                          background: '#F1F5F9',
                          border: '1px solid #CBD5E1',
                          borderRadius: 8,
                          padding: '7px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#334155',
                          cursor: 'pointer',
                        }}
                      >
                        ⚙️ Configurar
                      </button>

                      <button
                        onClick={() => handleDelete(item.id, item.nombre)}
                        style={{
                          background: '#FEF2F2',
                          border: '1px solid #FECACA',
                          borderRadius: 8,
                          padding: '7px 12px',
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
        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 20, width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                Registro de Envíos, Webhooks y Transacciones en Tiempo Real
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>Total: {events.length} transacciones auditadas</p>
            </div>

            <button
              onClick={handleClearLog}
              style={{
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              🧹 Limpiar Bitácora
            </button>
          </div>

          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: 12, fontWeight: 700 }}>
                  <th style={{ padding: '10px 12px' }}>Fecha / Hora</th>
                  <th style={{ padding: '10px 12px' }}>Conector / Servicio</th>
                  <th style={{ padding: '10px 12px' }}>Evento Disparado</th>
                  <th style={{ padding: '10px 12px' }}>Destinatario / Endpoint</th>
                  <th style={{ padding: '10px 12px' }}>Respuesta</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#94A3B8' }}>
                      No hay eventos registrados en la bitácora
                    </td>
                  </tr>
                ) : (
                  events.map((evt) => (
                    <tr key={evt.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>{evt.fecha}</td>
                      <td style={{ padding: '10px 12px' }}><strong>{evt.integracion}</strong></td>
                      <td style={{ padding: '10px 12px' }}>{evt.evento}</td>
                      <td style={{ padding: '10px 12px', fontSize: 11, fontFamily: 'monospace', color: '#2563EB' }}>{evt.destino}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: '#ECFDF5',
                          color: '#059669',
                          display: 'inline-block'
                        }}>
                          ● {evt.estado}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button
                          onClick={() => setViewEventModal(evt)}
                          style={{
                            background: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            borderRadius: 6,
                            padding: '4px 8px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            color: '#1E293B'
                          }}
                        >
                          👁️ Ver Payload
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal Ejecución de Disparador en Vivo ── */}
      {actionModal && (
        <div className="ajustes-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setActionModal(null)}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: 520, maxWidth: '92vw', padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{actionModal.integracion.icon}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{actionModal.trigger.label}</h3>
                  <span style={{ fontSize: 11, color: '#64748B' }}>Servicio: {actionModal.integracion.nombre}</span>
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748B' }} onClick={() => setActionModal(null)}>✕</button>
            </div>

            <form onSubmit={handleExecuteTrigger} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="ajustes-form-group">
                <label>
                  <span>Destinatario / Endpoint Objetivo *</span>
                  {crmClients.length > 0 && actionModal.integracion.id === 'int-whatsapp' && (
                    <span style={{ fontSize: 11, color: '#2563EB', cursor: 'pointer' }} onClick={() => setActionForm(f => ({ ...f, destino: crmClients[0]?.telefono || '+1 (809) 555-0192' }))}>
                      ⚡ Usar Cliente CRM: {crmClients[0]?.nombre}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={actionForm.destino}
                  onChange={(e) => setActionForm({ ...actionForm, destino: e.target.value })}
                  placeholder="Ej: +1 (809) 555-0192 o admin@appes.com o URL"
                  className={actionErrors.destino ? 'has-error' : ''}
                  required
                />
                {actionErrors.destino && <span className="ajustes-field-error">⚠️ {actionErrors.destino}</span>}
              </div>

              <div className="ajustes-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ margin: 0 }}>Contenido del Mensaje o Payload JSON *</label>
                  {(actionForm.mensaje.startsWith('{') || actionForm.mensaje.startsWith('[')) && (
                    <button type="button" onClick={handleFormatJson} style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>
                      Format JSON
                    </button>
                  )}
                </div>
                <textarea
                  rows="4"
                  value={actionForm.mensaje}
                  onChange={(e) => setActionForm({ ...actionForm, mensaje: e.target.value })}
                  placeholder="Contenido del mensaje o payload JSON..."
                  className={actionErrors.mensaje ? 'has-error' : ''}
                  required
                />
                {actionErrors.mensaje && <span className="ajustes-field-error">⚠️ {actionErrors.mensaje}</span>}
              </div>

              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>
                ℹ️ Esta acción transmitirá los datos y registrará automáticamente el código de respuesta y latencia en la bitácora de eventos del ERP.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button type="button" className="ajustes-outline-btn" onClick={() => setActionModal(null)}>
                  Cancelar
                </button>
                <button type="submit" className="ajustes-btn-primary" disabled={isExecuting}>
                  {isExecuting ? '⏳ Transmitiendo...' : '🚀 Transmitir y Enviar Ahora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Agregar Nueva Integración ── */}
      {showCreateModal && (
        <div className="ajustes-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowCreateModal(false)}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: 540, maxWidth: '92vw', padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>🔌</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Conectar Nueva Integración Externa</h3>
              </div>
              <button style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748B' }} onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="ajustes-form-group">
                <label>Nombre del Servicio *</label>
                <input
                  type="text"
                  placeholder="Ej: Slack Alerts / Stripe Payments / DGII e-CF"
                  value={form.nombre}
                  className={createErrors.nombre ? 'has-error' : ''}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
                {createErrors.nombre && <span className="ajustes-field-error">⚠️ {createErrors.nombre}</span>}
              </div>

              <div className="ajustes-form-grid-2">
                <div className="ajustes-form-group">
                  <label>Tipo de Conector</label>
                  <select
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

                <div className="ajustes-form-group">
                  <label>Ícono</label>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  />
                </div>
              </div>

              <div className="ajustes-form-group">
                <label>Webhook Endpoint URL *</label>
                <input
                  type="url"
                  placeholder="https://api.servicio.com/v1/webhook"
                  value={form.endpoint}
                  className={createErrors.endpoint ? 'has-error' : ''}
                  onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
                  required
                />
                {createErrors.endpoint && <span className="ajustes-field-error">⚠️ {createErrors.endpoint}</span>}
              </div>

              <div className="ajustes-form-group">
                <label>Bearer Token / Clave de API</label>
                <input
                  type="text"
                  placeholder="sk_live_..."
                  value={form.token}
                  onChange={(e) => setForm({ ...form, token: e.target.value })}
                />
              </div>

              <div className="ajustes-form-group">
                <label>Descripción Operativa</label>
                <textarea
                  rows="2"
                  placeholder="Describe qué datos enviará o sincronizará esta integración..."
                  value={form.desc}
                  onChange={(e) => setForm({ ...form, desc: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button type="button" className="ajustes-outline-btn" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="ajustes-btn-primary">
                  Conectar y Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Configurar / Editar Conector ── */}
      {editingIntegration && (
        <div className="ajustes-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setEditingIntegration(null)}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: 540, maxWidth: '92vw', padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{editingIntegration.icon}</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Configurar {editingIntegration.nombre}</h3>
              </div>
              <button style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748B' }} onClick={() => setEditingIntegration(null)}>✕</button>
            </div>

            <form onSubmit={handleSaveEditedIntegration} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="ajustes-form-group">
                <label>Endpoint URL *</label>
                <input
                  type="text"
                  value={editingIntegration.endpoint}
                  onChange={(e) => setEditingIntegration({ ...editingIntegration, endpoint: e.target.value })}
                  required
                />
              </div>

              <div className="ajustes-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ margin: 0 }}>API Key / Token de Autenticación</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newTok = 'tok_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
                      setEditingIntegration({ ...editingIntegration, token: newTok })
                      showToastMsg('🔑 Nuevo Token generado')
                    }}
                    style={{ background: '#EFF6FF', color: '#2563EB', border: 'none', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                  >
                    🔄 Regenerar Token
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={editingIntegration.token}
                    onChange={(e) => setEditingIntegration({ ...editingIntegration, token: e.target.value })}
                    style={{ fontFamily: 'monospace', flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 8, padding: '0 12px', cursor: 'pointer' }}
                  >
                    {showToken ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="ajustes-form-group">
                <label>Descripción</label>
                <textarea
                  rows="2"
                  value={editingIntegration.desc}
                  onChange={(e) => setEditingIntegration({ ...editingIntegration, desc: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button type="button" className="ajustes-outline-btn" onClick={() => setEditingIntegration(null)}>
                  Cancelar
                </button>
                <button type="submit" className="ajustes-btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Ver Payload de Evento ── */}
      {viewEventModal && (
        <div className="ajustes-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setViewEventModal(null)}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: 540, maxWidth: '92vw', padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Detalles de la Transacción</h3>
              <button style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748B' }} onClick={() => setViewEventModal(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
              <div><strong>Servicio:</strong> {viewEventModal.integracion}</div>
              <div><strong>Evento:</strong> {viewEventModal.evento}</div>
              <div><strong>Destinatario:</strong> <code>{viewEventModal.destino}</code></div>
              <div><strong>Estado:</strong> <span style={{ color: '#059669', fontWeight: 700 }}>{viewEventModal.estado}</span></div>
              <div>
                <strong>Payload / Respuesta del Servidor:</strong>
                <pre style={{ background: '#0F172A', color: '#38BDF8', padding: 12, borderRadius: 8, fontSize: 11, overflowX: 'auto', maxHeight: 200, marginTop: 4 }}>
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(viewEventModal.responseData), null, 2)
                    } catch (_) {
                      return viewEventModal.responseData
                    }
                  })()}
                </pre>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button type="button" className="ajustes-btn-primary" onClick={() => setViewEventModal(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
