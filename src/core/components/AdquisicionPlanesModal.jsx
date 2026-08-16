/*
  AdquisicionPlanesModal.jsx — Flujo Profesional de Adquisición y Upgrade de Planes SaaS
  Permite al cliente explorar, comparar y adquirir planes:
  - Básico / Startup (RD$ 2,450/mes o US$ 45)
  - Profesional / Crecimiento (RD$ 5,900/mes o US$ 99)
  - Corporativo Enterprise Suite (RD$ 12,500/mes o US$ 210)
  
  Sincronización Total con el ERP:
  - Guarda y activa la licencia en el almacenamiento global del sistema
  - Sincroniza al cliente comprador en el módulo CRM
  - Registra el comprobante contable de ingreso/suscripción en Finanzas
  - Genera registro en Auditoría del Sistema
*/

import React, { useState } from 'react'
import { erpSync } from '../sync/erpSyncEngine'
import { EnterprisePicker } from './EnterprisePickerModal'

export const PLANES_SISTEMA = [
  {
    id: 'plan_startup',
    nombre: 'Plan Startup',
    subtitulo: 'Para emprendedores y pequeños comercios',
    precioDOP: 2450,
    precioUSD: 45,
    icono: '🚀',
    color: '#0284C7',
    badge: 'Inicial',
    features: [
      'Hasta 3 usuarios con roles',
      'Facturación de Ventas & POS',
      'Control de Stock de Inventario',
      'Gestión básica de Clientes CRM',
      'Soporte por Correo Electrónico',
      '5 GB de Almacenamiento Seguro'
    ],
    modulosPermitidos: ['ventas', 'crm', 'rrhh-inventario'],
    maxUsuarios: 3,
    espacioGB: 5,
  },
  {
    id: 'plan_profesional',
    nombre: 'Plan Profesional',
    subtitulo: 'Para empresas en constante expansión',
    precioDOP: 5900,
    precioUSD: 99,
    icono: '⭐',
    color: '#2563EB',
    badge: 'Más Popular',
    popular: true,
    features: [
      'Hasta 10 usuarios simultáneos',
      'Todos los módulos comerciales (Ventas, Compras, CRM)',
      'Finanzas, Flujo de Caja y Bancos',
      'Proyectos & Tareas de Equipo',
      'Alertas automáticas por WhatsApp Cloud',
      '20 GB de Almacenamiento NVMe',
      'Soporte Prioritario WhatsApp / Email'
    ],
    modulosPermitidos: ['ventas', 'compras', 'crm', 'rrhh-inventario', 'finanzas', 'proyectos', 'reportes'],
    maxUsuarios: 10,
    espacioGB: 20,
  },
  {
    id: 'plan_enterprise',
    nombre: 'Plan Enterprise Suite',
    subtitulo: 'Control integral y multi-sucursal corporativo',
    precioDOP: 12500,
    precioUSD: 210,
    icono: '👑',
    color: '#7C3AED',
    badge: 'Corporativo',
    features: [
      'Usuarios Ilimitados sin restricciones',
      'Los 11 Módulos Habilitados + AI Chatbot',
      'Recursos Humanos, Asistencia y Nómina',
      'Integraciones API (DGII, Bancos, Webhooks)',
      'Copias de Seguridad Automáticas Diarias',
      '50 GB NVMe + Auditoría de Seguridad',
      'Gerente de Cuenta & Soporte 24/7 SLA'
    ],
    modulosPermitidos: ['ventas', 'compras', 'crm', 'rrhh-inventario', 'rrhh', 'finanzas', 'proyectos', 'reportes', 'chatbot', 'integraciones', 'plugin-manager', 'ajustes'],
    maxUsuarios: 999,
    espacioGB: 50,
  }
]

export function AdquisicionPlanesModal({ isOpen, onClose, currentPlanId = 'plan_enterprise', onPlanActivated }) {
  const [selectedPlan, setSelectedPlan] = useState(
    PLANES_SISTEMA.find(p => p.id === currentPlanId) || PLANES_SISTEMA[1]
  )
  const [billingCycle, setBillingCycle] = useState('mensual') // 'mensual' | 'anual' (15% desc)
  const [step, setStep] = useState(1) // 1: Seleccionar Plan | 2: Datos del Cliente & Pago | 3: Confirmación Exitosa

  // Formulario de Adquisición
  const [clientForm, setClientForm] = useState({
    razonSocial: 'Tech Solutions SRL',
    rnc: '1-31-89234-5',
    contactoNombre: 'Lic. Juan Pérez',
    email: 'contacto@techsolutions.do',
    password: 'Cliente2026!',
    telefono: '(809) 555-0192',
    metodoPago: 'Transferencia Bancaria', // 'Transferencia Bancaria' | 'Tarjeta de Crédito / Débito' | 'Cheque Comercial'
    bancoDestino: 'Banco BHD León (Cta Corriente: 820-987654)',
    comentarios: 'Contrato corporativo para implementación inmediata.',
  })

  const [isProcessing, setIsProcessing] = useState(false)
  const [orderConfirmed, setOrderConfirmed] = useState(null)

  if (!isOpen) return null

  // Cálculo de Precios con Descuento Anual
  const discountRate = billingCycle === 'anual' ? 0.85 : 1
  const priceDOP = Math.round(selectedPlan.precioDOP * (billingCycle === 'anual' ? 12 * discountRate : 1))
  const priceUSD = Math.round(selectedPlan.precioUSD * (billingCycle === 'anual' ? 12 * discountRate : 1))

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan)
    setStep(2)
  }

  const handleConfirmPurchase = async (e) => {
    e.preventDefault()
    setIsProcessing(true)

    const orderId = `SUB-${Math.floor(100000 + Math.random() * 900000)}`
    const today = new Date().toLocaleDateString('es-DO')
    const expirationDate = new Date()
    expirationDate.setMonth(expirationDate.getMonth() + (billingCycle === 'anual' ? 12 : 1))
    const renovacionStr = expirationDate.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })

    // 1. Guardar y activar Licencia en Storage Global
    const activeLicenseData = {
      orderId,
      planId: selectedPlan.id,
      planNombre: selectedPlan.nombre,
      planBadge: selectedPlan.badge,
      billingCycle,
      totalDOP: priceDOP,
      totalUSD: priceUSD,
      fechaActivacion: today,
      fechaRenovacion: renovacionStr,
      cliente: clientForm.razonSocial,
      rnc: clientForm.rnc,
      email: clientForm.email,
      telefono: clientForm.telefono,
      metodoPago: clientForm.metodoPago,
      estado: 'Activo',
      maxUsuarios: selectedPlan.maxUsuarios,
      espacioGB: selectedPlan.espacioGB,
    }

    try {
      localStorage.setItem('appes_active_plan_subscription_v1', JSON.stringify(activeLicenseData))
    } catch (_) {}

    // 2. Sincronizar Cliente en CRM
    try {
      const rawClients = localStorage.getItem('appes_crm_clients_v1')
      const clients = rawClients ? JSON.parse(rawClients) : []
      const existingClientIdx = clients.findIndex(c => c.nombre.toLowerCase() === clientForm.razonSocial.toLowerCase())
      
      if (existingClientIdx >= 0) {
        clients[existingClientIdx].totalVentas = (Number(clients[existingClientIdx].totalVentas) || 0) + priceDOP
        clients[existingClientIdx].estado = 'Activo'
      } else {
        clients.unshift({
          id: Date.now(),
          nombre: clientForm.razonSocial,
          contacto: clientForm.contactoNombre,
          email: clientForm.email,
          telefono: clientForm.telefono,
          sector: 'Suscripción SaaS / Software',
          estado: 'Activo',
          estadoTipo: 'success',
          totalVentas: priceDOP,
          pedidosCount: 1,
          ultimoPedido: today,
        })
      }
      localStorage.setItem('appes_crm_clients_v1', JSON.stringify(clients))
    } catch (_) {}

    // 3. Sincronizar Comprobante de Ingreso en FINANZAS
    try {
      const rawFin = localStorage.getItem('appes_erp_finanzas_data_v3')
      if (rawFin) {
        const finanzas = JSON.parse(rawFin)
        if (!finanzas.comprobantes) finanzas.comprobantes = []

        finanzas.comprobantes.unshift({
          id: `sub-comp-${orderId}`,
          numero: `B02-${Math.floor(10000000 + Math.random() * 90000000)}`,
          tipo: 'Ingreso',
          fecha: today,
          fechaRaw: new Date().toISOString().slice(0, 10),
          descripcion: `Suscripción ${selectedPlan.nombre} (${billingCycle.toUpperCase()}) - ${clientForm.razonSocial}`,
          cuenta: clientForm.metodoPago.includes('Tarjeta') ? 'Tarjeta Corporativa' : 'Banco Popular 960-123456',
          cuentaId: 'cta-1',
          monto: priceDOP,
          estado: 'Aprobado',
          creadoPor: 'planes.subscription.sync',
          categoria: 'Suscripciones y Licencias SaaS',
          clienteProveedor: clientForm.razonSocial,
        })
        localStorage.setItem('appes_erp_finanzas_data_v3', JSON.stringify(finanzas))
      }
    } catch (_) {}

    // 4. Crear o Actualizar las Credenciales de Usuario del Cliente en la Base de Datos de Usuarios
    try {
      const rawUsers = localStorage.getItem('erp_seguridad_users_v1')
      const users = rawUsers ? JSON.parse(rawUsers) : []
      const existingUserIdx = users.findIndex(u => u.email.toLowerCase() === clientForm.email.toLowerCase())
      
      const newClientUserData = {
        id: `usr-client-${Date.now()}`,
        nombre: clientForm.contactoNombre || clientForm.razonSocial,
        email: clientForm.email,
        password: clientForm.password || 'Cliente2026!',
        rol: 'CLIENTE',
        departamento: clientForm.razonSocial,
        estado: 'Pendiente', // Requiere aprobación del Administrador
        dosFactores: false,
        ultimoAcceso: 'Nunca',
      }

      if (existingUserIdx >= 0) {
        users[existingUserIdx] = {
          ...users[existingUserIdx],
          ...newClientUserData,
          password: clientForm.password || users[existingUserIdx].password,
          estado: 'Pendiente',
        }
      } else {
        users.push(newClientUserData)
      }
      localStorage.setItem('erp_seguridad_users_v1', JSON.stringify(users))
    } catch (_) {}

    // 5. Registrar en Auditoría y Emitir Evento Global
    erpSync.addAuditLog(
      'Suscripciones',
      `Activación de ${selectedPlan.nombre} (${billingCycle}) por ${clientForm.razonSocial} (Usuario creado: ${clientForm.email}) - Total: RD$ ${priceDOP.toLocaleString('es-DO')}`
    )
    erpSync.emit('plan_subscription_updated', activeLicenseData)

    setTimeout(() => {
      setIsProcessing(false)
      setOrderConfirmed(activeLicenseData)
      setStep(3)
      onPlanActivated?.(activeLicenseData)
    }, 800)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(5px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 20,
        width: '100%',
        maxWidth: step === 1 ? 940 : 640,
        maxHeight: '92vh',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'epSlideUp 0.22s ease-out',
      }}>
        {/* Encabezado del Modal */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>👑</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                {step === 1 ? 'Adquirir / Cambiar Plan de Suscripción' : step === 2 ? 'Formulario de Facturación & Activación' : '¡Suscripción Activada con Éxito!'}
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#94A3B8' }}>
                {step === 1 ? 'Selecciona el nivel de licenciamiento que mejor se adapte al tamaño de tu empresa' : step === 2 ? `Completando adquisición de ${selectedPlan.nombre}` : 'Los módulos y capacidades han sido actualizados en todo el sistema'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: 8,
              width: 32,
              height: 32,
              color: '#FFFFFF',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', maxHeight: 'calc(92vh - 140px)' }}>
          {/* PASO 1: COMPARACIÓN Y SELECCIÓN DE PLANES */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Selector de Ciclo de Facturación */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: billingCycle === 'mensual' ? '#0F172A' : '#64748B' }}>
                  Facturación Mensual
                </span>
                <button
                  type="button"
                  onClick={() => setBillingCycle(b => b === 'mensual' ? 'anual' : 'mensual')}
                  style={{
                    width: 52,
                    height: 28,
                    borderRadius: 14,
                    background: billingCycle === 'anual' ? '#2563EB' : '#CBD5E1',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s',
                    padding: 2,
                  }}
                >
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    background: '#FFFFFF',
                    transform: billingCycle === 'anual' ? 'translateX(24px)' : 'translateX(0)',
                    transition: 'transform 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: billingCycle === 'anual' ? '#2563EB' : '#64748B' }}>
                    Facturación Anual
                  </span>
                  <span style={{
                    background: '#DCFCE7',
                    color: '#166534',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 800,
                  }}>
                    Ahorra 15%
                  </span>
                </div>
              </div>

              {/* Cuadrícula de Tarjetas de Planes */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 16,
              }}>
                {PLANES_SISTEMA.map((plan) => {
                  const isCurrent = plan.id === currentPlanId
                  const isSel = selectedPlan.id === plan.id
                  const planPriceDOP = Math.round(plan.precioDOP * (billingCycle === 'anual' ? 12 * 0.85 : 1))

                  return (
                    <div
                      key={plan.id}
                      style={{
                        background: '#FFFFFF',
                        border: isSel ? `2px solid ${plan.color}` : '1px solid #E2E8F0',
                        borderRadius: 16,
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: isSel ? `0 10px 25px -5px ${plan.color}25` : '0 2px 4px rgba(0,0,0,0.03)',
                        position: 'relative',
                        transition: 'all 0.2s',
                      }}
                    >
                      {plan.popular && (
                        <div style={{
                          position: 'absolute',
                          top: -10,
                          right: 20,
                          background: '#2563EB',
                          color: '#FFFFFF',
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: 10,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}>
                          Recomendado
                        </div>
                      )}

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <span style={{ fontSize: 24 }}>{plan.icono}</span>
                          <div>
                            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                              {plan.nombre}
                            </h4>
                            <span style={{ fontSize: 11, color: '#64748B' }}>{plan.subtitulo}</span>
                          </div>
                        </div>

                        {/* Precios */}
                        <div style={{ margin: '14px 0', borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>
                              RD$ {planPriceDOP.toLocaleString('es-DO')}
                            </span>
                            <span style={{ fontSize: 12, color: '#64748B' }}>
                              /{billingCycle === 'anual' ? 'año' : 'mes'}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                            Equivalente a aprox. US$ {plan.precioUSD}/mes
                          </div>
                        </div>

                        {/* Lista de Características */}
                        <ul style={{
                          margin: 0,
                          padding: 0,
                          listStyle: 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          fontSize: 12,
                          color: '#334155',
                        }}>
                          {plan.features.map((feat, idx) => (
                            <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                              <span style={{ color: '#16A34A', fontWeight: 800 }}>✓</span>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Botón de Selección */}
                      <button
                        type="button"
                        onClick={() => handleSelectPlan(plan)}
                        style={{
                          marginTop: 20,
                          background: isSel ? plan.color : '#F8FAFC',
                          color: isSel ? '#FFFFFF' : '#0F172A',
                          border: isSel ? 'none' : '1px solid #CBD5E1',
                          borderRadius: 10,
                          padding: '10px 14px',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {isCurrent ? 'Plan Actual · Renovar' : `Elegir ${plan.nombre}`}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* PASO 2: FORMULARIO DE FACTURACIÓN Y ACTIVACIÓN */}
          {step === 2 && (
            <form onSubmit={handleConfirmPurchase} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Tarjeta Resumen del Plan Seleccionado */}
              <div style={{
                background: '#F8FAFC',
                border: `1px solid #E2E8F0`,
                borderRadius: 14,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{selectedPlan.icono}</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                      {selectedPlan.nombre} ({billingCycle.toUpperCase()})
                    </h4>
                    <span style={{ fontSize: 12, color: '#64748B' }}>
                      {selectedPlan.features.length} beneficios incluidos · Facturación {billingCycle}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#2563EB' }}>
                    RD$ {priceDOP.toLocaleString('es-DO')}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Cambiar plan
                  </button>
                </div>
              </div>

              {/* Datos de la Empresa / Cliente */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                <div className="compras-form-group">
                  <label>Razón Social / Nombre Comercial</label>
                  <input
                    required
                    type="text"
                    value={clientForm.razonSocial}
                    onChange={e => setClientForm({ ...clientForm, razonSocial: e.target.value })}
                  />
                </div>
                <div className="compras-form-group">
                  <label>RNC / Cédula Fiscal</label>
                  <input
                    required
                    type="text"
                    value={clientForm.rnc}
                    onChange={e => setClientForm({ ...clientForm, rnc: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                <div className="compras-form-group">
                  <label>Nombre del Responsable / Contacto</label>
                  <input
                    required
                    type="text"
                    value={clientForm.contactoNombre}
                    onChange={e => setClientForm({ ...clientForm, contactoNombre: e.target.value })}
                  />
                </div>
                <div className="compras-form-group">
                  <label>Correo Electrónico (Usuario de Acceso)</label>
                  <input
                    required
                    type="email"
                    value={clientForm.email}
                    onChange={e => setClientForm({ ...clientForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                <div className="compras-form-group">
                  <label>Contraseña de Acceso al ERP</label>
                  <input
                    required
                    type="text"
                    value={clientForm.password}
                    onChange={e => setClientForm({ ...clientForm, password: e.target.value })}
                  />
                </div>
                <div className="compras-form-group">
                  <label>Teléfono de Contacto</label>
                  <input
                    required
                    type="text"
                    value={clientForm.telefono}
                    onChange={e => setClientForm({ ...clientForm, telefono: e.target.value })}
                  />
                </div>
              </div>

              <div className="compras-form-group">
                <label>Método de Pago</label>
                <select
                  value={clientForm.metodoPago}
                  onChange={e => setClientForm({ ...clientForm, metodoPago: e.target.value })}
                >
                  <option value="Transferencia Bancaria">🏦 Transferencia Bancaria (BHD / Popular / Banreservas)</option>
                  <option value="Tarjeta de Crédito / Débito">💳 Tarjeta de Crédito / Débito (Visa / Mastercard)</option>
                  <option value="Cheque Comercial">📄 Cheque Comercial / Depósito Directo</option>
                </select>
              </div>

              <div className="compras-form-group">
                <label>Notas Adicionales de la Orden / Requerimientos</label>
                <textarea
                  rows="2"
                  value={clientForm.comentarios}
                  onChange={e => setClientForm({ ...clientForm, comentarios: e.target.value })}
                  placeholder="Detalles sobre implementación, migración o factura con crédito fiscal..."
                />
              </div>

              {/* Botones de Acción */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #E2E8F0',
                paddingTop: 18,
                marginTop: 6,
              }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '10px 18px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Volver a Planes
                </button>

                <button
                  type="submit"
                  disabled={isProcessing}
                  style={{
                    background: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 24px',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                  }}
                >
                  {isProcessing ? 'Activando Suscripción...' : `Confirmar y Activar ${selectedPlan.nombre}`}
                </button>
              </div>
            </form>
          )}

          {/* PASO 3: CONFIRMACIÓN Y COMPROBANTE DE ACTIVACIÓN */}
          {step === 3 && orderConfirmed && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, padding: '10px 0' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#DCFCE7',
                color: '#16A34A',
                fontSize: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                ✓
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#0F172A' }}>
                  ¡Plan {orderConfirmed.planNombre} Activado!
                </h3>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748B' }}>
                  Referencia de Suscripción: <strong>{orderConfirmed.orderId}</strong> · Vigencia hasta: <strong>{orderConfirmed.fechaRenovacion}</strong>
                </p>
              </div>

              {/* Resumen de Sincronización Automática */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '14px 18px',
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                fontSize: 12,
                color: '#334155',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Cliente Facturado:</span>
                  <strong>{orderConfirmed.cliente} ({orderConfirmed.rnc})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Monto Total Registrado:</span>
                  <strong style={{ color: '#059669' }}>RD$ {orderConfirmed.totalDOP.toLocaleString('es-DO')} ({orderConfirmed.billingCycle})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Usuario de Acceso Creado:</span>
                  <strong style={{ color: '#2563EB' }}>{orderConfirmed.email}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Contraseña Asignada:</span>
                  <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{clientForm.password}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Comprobante Finanzas:</span>
                  <span style={{ color: '#2563EB', fontWeight: 600 }}>Generado automáticamente en módulo Finanzas</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CRM & Facturación:</span>
                  <span style={{ color: '#2563EB', fontWeight: 600 }}>Vinculado a directorio de clientes CRM</span>
                </div>
              </div>

              <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: '#92400E', textAlign: 'left', width: '100%' }}>
                ⏳ <strong>Esperando Aprobación de Acceso:</strong> La cuenta ha sido registrada en el sistema. El Administrador del ERP debe conceder el acceso desde el módulo de Seguridad para que el usuario pueda ingresar.
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 28px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: 8,
                }}
              >
                Cerrar y Continuar en el ERP
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
