import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../core/auth/AuthContext'
import { erpSync } from '../core/sync/erpSyncEngine'
import { formatCardNumber, formatCardExpiry, formatCardCVC } from '../core/utils/formatters'
import './Onboarding.css'

const PLANES_DISPONIBLES = [
  {
    id: 'plan_startup',
    nombre: 'Plan Básico',
    icono: '🏢',
    precioMensual: 49,
    precioAnual: 39,
    target: 'Para consultorios independientes o 1 consultorio.',
    features: [
      'Hasta 2 Médicos Especialistas',
      '1 Consultorio Físico',
      'Hasta 1,500 Pacientes',
      'Agenda Médica Digital',
      'Facturación básica y NCF',
    ]
  },
  {
    id: 'plan_profesional',
    nombre: 'Plan Profesional',
    icono: '💼',
    popular: true,
    precioMensual: 129,
    precioAnual: 99,
    target: 'Para centros médicos medianos y policlínicas.',
    features: [
      'Hasta 10 Médicos Especialistas',
      'Hasta 5 Consultorios Físicos',
      'Expedientes de Pacientes Ilimitados',
      'Agenda Multi-Consultorio con Estados',
      'NCF Completo + Control de Cajas',
      'Soporte Prioritario WhatsApp',
    ]
  },
  {
    id: 'plan_enterprise',
    nombre: 'Plan Enterprise Suite',
    icono: '🛡️',
    precioMensual: 299,
    precioAnual: 249,
    target: 'Para redes hospitalarias y franquicias médicas.',
    features: [
      'Médicos y Especialistas Ilimitados',
      'Sucursales y Consultorios Ilimitados',
      'Almacenamiento Clínico Ilimitado',
      'Multi-Empresa + Multi-Caja simultánea',
      'Roles personalizados y Auditoría forense',
      'Account Manager dedicado 24/7',
    ]
  }
]

export function OnboardingPlan() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [selectedPlan, setSelectedPlan] = useState('plan_profesional')
  const [billingPeriod, setBillingPeriod] = useState('monthly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Formulario de Pago con Tarjeta con valores iniciales limpios
  const [cardForm, setCardForm] = useState({
    cardName: user?.name || '',
    cardNumber: '',
    expDate: '',
    cvv: '',
  })

  const planInfo = PLANES_DISPONIBLES.find(p => p.id === selectedPlan) || PLANES_DISPONIBLES[1]
  const precioFinal = billingPeriod === 'annual' ? planInfo.precioAnual : planInfo.precioMensual
  const totalCobro = billingPeriod === 'annual' ? precioFinal * 12 : precioFinal

  const handleProcessPayment = (e) => {
    e.preventDefault()
    setError('')

    // Validaciones estrictas de campos de pago
    if (!cardForm.cardName.trim()) {
      setError('Por favor ingresa el nombre del titular de la tarjeta.')
      return
    }

    const cleanCard = cardForm.cardNumber.replace(/\s/g, '')
    if (cleanCard.length < 15) {
      setError('El número de tarjeta debe tener entre 15 y 16 dígitos válidos.')
      return
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardForm.expDate)) {
      setError('La fecha de expiración debe tener el formato MM/AA válido (ej. 12/28).')
      return
    }

    if (cardForm.cvv.length < 3) {
      setError('El código CVC / CVV debe contener al menos 3 dígitos.')
      return
    }

    setLoading(true)

    setTimeout(() => {
      try {
        const ultimos4 = cleanCard.slice(-4)

        // 1. Guardar la suscripción en el registro de usuarios
        const rawUsers = localStorage.getItem('erp_seguridad_users_v1')
        if (rawUsers) {
          const users = JSON.parse(rawUsers)
          const updated = users.map(u => {
            if (u.email === user?.email || u.id === user?.id) {
              return {
                ...u,
                planContratado: selectedPlan,
                periodoSuscripcion: billingPeriod,
                fechaPago: new Date().toISOString(),
                montoPagado: totalCobro,
                tarjetaUltimos4: ultimos4,
                tarjetaTitular: cardForm.cardName,
              }
            }
            return u
          })
          localStorage.setItem('erp_seguridad_users_v1', JSON.stringify(updated))
        }

        // 2. Generar comprobante automático en Finanzas (Ingreso por suscripción SaaS)
        erpSync.notifyFinancialMovement({
          concepto: `Cobro Tarjeta (•••• ${ultimos4}) · Suscripción ${planInfo.nombre} (${user?.name || 'Cliente'})`,
          monto: totalCobro * 60.25,
          tipo: 'Ingreso',
          origen: 'Pasarela de Pago Online (Tarjeta de Crédito)',
          cuenta: 'Banco Popular Dominicano (DOP)',
        })

        // 3. Registrar cliente en CRM si no existe
        const rawCrm = localStorage.getItem('appes_crm_clients_v1')
        const crmClients = rawCrm ? JSON.parse(rawCrm) : []
        if (!crmClients.find(c => c.email === user?.email)) {
          const newCrmClient = {
            id: `cli-${Date.now()}`,
            nombre: cardForm.cardName || user?.name || 'Cliente Suscrito',
            contacto: user?.name || 'Titular',
            email: user?.email || 'cliente@appes.com',
            telefono: '(809) 555-0100',
            sector: 'Salud & Medicina',
            estado: 'Activo',
            plan: planInfo.nombre,
            totalComprado: totalCobro * 60.25,
            fechaRegistro: new Date().toLocaleDateString('es-DO'),
          }
          localStorage.setItem('appes_crm_clients_v1', JSON.stringify([newCrmClient, ...crmClients]))
        }

        setLoading(false)
        // Redirigir obligatoriamente al Paso 2: Configuración de la Empresa
        navigate('/onboarding-empresa')
      } catch (err) {
        setError('Ocurrió un problema al procesar el cobro. Intenta nuevamente.')
        setLoading(false)
      }
    }, 1200)
  }

  return (
    <div className="onboarding-shell">
      {/* ── Topbar de Progreso ── */}
      <header className="onboarding-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/branding/logo_appex.jpg" alt="APPEX Logo" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <strong style={{ fontSize: 16, color: '#0F172A' }}>APPEX<span style={{ color: '#2563EB' }}>.ERP</span></strong>
        </div>

        <div className="onboarding-steps-indicator">
          <div className="onboarding-step-badge active">
            <span className="onboarding-step-num">1</span>
            <span>Selección de Plan & Pago</span>
          </div>
          <div className="onboarding-step-line" />
          <div className="onboarding-step-badge">
            <span className="onboarding-step-num">2</span>
            <span>Configuración Inicial de Empresa</span>
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
          Paso Obligatorio
        </div>
      </header>

      {/* ── Contenido Central ── */}
      <main className="onboarding-container">
        <div className="onboarding-card">
          <div className="onboarding-header">
            <h1 className="onboarding-title">Paso 1: Selecciona tu Plan y Activa tu Cuenta</h1>
            <p className="onboarding-subtitle">
              Elige el plan ideal para tu clínica y completa los datos de pago seguro con tarjeta para continuar.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 18 }}>
              <button
                type="button"
                className={`landing-toggle-btn ${billingPeriod === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingPeriod('monthly')}
              >
                Facturación Mensual
              </button>
              <button
                type="button"
                className={`landing-toggle-btn ${billingPeriod === 'annual' ? 'active' : ''}`}
                onClick={() => setBillingPeriod('annual')}
              >
                Facturación Anual <span className="landing-save-pill">15% OFF</span>
              </button>
            </div>
          </div>

          {/* Grid de Planes */}
          <div className="onboarding-plans-grid">
            {PLANES_DISPONIBLES.map(plan => {
              const isSelected = selectedPlan === plan.id
              const precio = billingPeriod === 'annual' ? plan.precioAnual : plan.precioMensual

              return (
                <div
                  key={plan.id}
                  className={`onboarding-plan-card ${isSelected ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <span style={{
                      position: 'absolute',
                      top: -10,
                      right: 16,
                      background: '#2563EB',
                      color: '#FFFFFF',
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 10,
                      textTransform: 'uppercase',
                    }}>
                      Recomendado
                    </span>
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 24 }}>{plan.icono}</span>
                      <input
                        type="radio"
                        name="plan"
                        checked={isSelected}
                        onChange={() => setSelectedPlan(plan.id)}
                        style={{ width: 18, height: 18, accentColor: '#2563EB' }}
                      />
                    </div>
                    <strong style={{ fontSize: 17, color: '#0F172A', display: 'block' }}>{plan.nombre}</strong>
                    <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 12px', minHeight: 34 }}>{plan.target}</p>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A' }}>
                      ${precio} <small style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>USD/mes</small>
                    </div>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                    {plan.features.slice(0, 4).map((f, i) => (
                      <li key={i} style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#10B981', fontWeight: 800 }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          {/* Formulario de Pago con Tarjeta */}
          <form onSubmit={handleProcessPayment} className="onboarding-card-form">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
              <div>
                <strong style={{ fontSize: 15, color: '#0F172A' }}>💳 Pago Seguro con Tarjeta de Crédito / Débito</strong>
                <div style={{ fontSize: 12, color: '#64748B' }}>Procesamiento cifrado con certificado de seguridad SSL 256-bit</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#2563EB', background: '#EFF6FF', padding: '6px 12px', borderRadius: 8 }}>
                Total a Cobrar: ${totalCobro} USD
              </div>
            </div>

            <div className="onboarding-field">
              <label>NOMBRE EN LA TARJETA *</label>
              <input
                type="text"
                required
                placeholder="Nombre del Titular"
                value={cardForm.cardName}
                onChange={e => setCardForm({ ...cardForm, cardName: e.target.value })}
              />
            </div>

            <div className="onboarding-form-grid-2">
              <div className="onboarding-field">
                <label>NÚMERO DE TARJETA *</label>
                <input
                  type="text"
                  required
                  placeholder="4000 1234 5678 9010"
                  maxLength={19}
                  value={cardForm.cardNumber}
                  onChange={e => setCardForm({ ...cardForm, cardNumber: formatCardNumber(e.target.value) })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="onboarding-field">
                  <label>EXPIRACIÓN (MM/AA) *</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/AA"
                    maxLength={5}
                    value={cardForm.expDate}
                    onChange={e => setCardForm({ ...cardForm, expDate: formatCardExpiry(e.target.value) })}
                  />
                </div>
                <div className="onboarding-field">
                  <label>CVC / CVV *</label>
                  <input
                    type="text"
                    required
                    placeholder="123"
                    maxLength={4}
                    value={cardForm.cvv}
                    onChange={e => setCardForm({ ...cardForm, cvv: formatCardCVC(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '10px', borderRadius: 8, color: '#DC2626', fontSize: 12, marginBottom: 10 }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className="onboarding-submit-btn"
              disabled={loading}
            >
              <span>🔒</span>
              {loading ? 'Validando tarjeta y procesando pago...' : `Pagar $${totalCobro} USD y Continuar a Configuración`}
            </button>

            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: '#94A3B8' }}>
              🔒 Transacción 100% segura. Tus datos de facturación se procesan de forma cifrada.
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
