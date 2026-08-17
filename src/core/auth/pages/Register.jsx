import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { validateStrongPassword, setTenantData, getTenantKey } from '../../../core/utils/formatters'
import './Login.css'

const REGISTER_STEP_CACHE_KEY = 'erp_registration_wizard_state_v1'

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  // ── Recuperar estado previo en caché del navegador ──
  const cachedState = (() => {
    try {
      const raw = localStorage.getItem(REGISTER_STEP_CACHE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch (_) {
      return null
    }
  })()

  // ── Control de Pasos (1: Cuenta, 2: Plan & Pago, 3: Empresa) ──
  const [currentStep, setCurrentStep] = useState(() => cachedState?.currentStep || 1)

  // Paso 1: Datos de Usuario
  const [form, setForm] = useState(() => cachedState?.form || { name: '', email: '', password: '', company: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [registeredUser, setRegisteredUser] = useState(() => cachedState?.registeredUser || null)

  // Paso 2: Elección de Plan y Simulación de Pago
  const [billingPeriod, setBillingPeriod] = useState(() => cachedState?.billingPeriod || 'monthly') // monthly | annual
  const [selectedPlan, setSelectedPlan] = useState(() => cachedState?.selectedPlan || 'clinica') // emprendedor | clinica | enterprise
  const [paymentForm, setPaymentForm] = useState(() => cachedState?.paymentForm || {
    cardName: '',
    cardNumber: '',
    cardExp: '',
    cardCvc: '',
    paymentMethod: 'card', // card | transfer
  })

  // Paso 3: Configuración Inicial de la Empresa
  const [companySettings, setCompanySettings] = useState(() => cachedState?.companySettings || {
    razonSocial: '',
    nombreComercial: '',
    rnc: '',
    telefono: '',
    direccion: '',
    ciudad: 'Santo Domingo',
    monedaPrincipal: 'DOP',
    regimenFiscal: 'Régimen Ordinario (DGII)',
  })

  // Guardar en caché del navegador en cada cambio
  useEffect(() => {
    try {
      localStorage.setItem(REGISTER_STEP_CACHE_KEY, JSON.stringify({
        currentStep,
        form: { ...form, password: form.password ? '••••••••' : '' },
        registeredUser,
        billingPeriod,
        selectedPlan,
        paymentForm: { ...paymentForm, cardCvc: '' },
        companySettings,
      }))
    } catch (_) {}
  }, [currentStep, form, registeredUser, billingPeriod, selectedPlan, paymentForm, companySettings])

  function updateForm(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  // ── Máscaras de Entrada para Pago ──
  function handleCardNumberChange(e) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16)
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ')
    setPaymentForm(p => ({ ...p, cardNumber: formatted }))
  }

  function handleCardExpChange(e) {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4)
    if (raw.length >= 2) {
      const month = parseInt(raw.slice(0, 2), 10)
      if (month > 12) raw = '12' + raw.slice(2)
      if (month === 0) raw = '01' + raw.slice(2)
      raw = raw.slice(0, 2) + '/' + raw.slice(2)
    }
    setPaymentForm(p => ({ ...p, cardExp: raw }))
  }

  function handleCardCvcChange(e) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4)
    setPaymentForm(p => ({ ...p, cardCvc: raw }))
  }

  function handleRncChange(e) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 9)
    let formatted = raw
    if (raw.length > 1 && raw.length <= 3) {
      formatted = `${raw.slice(0, 1)}-${raw.slice(1)}`
    } else if (raw.length > 3) {
      formatted = `${raw.slice(0, 1)}-${raw.slice(1, 3)}-${raw.slice(3)}`
    }
    setCompanySettings(c => ({ ...c, rnc: formatted }))
  }

  function handleTelefonoChange(e) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10)
    let formatted = raw
    if (raw.length > 3 && raw.length <= 6) {
      formatted = `(${raw.slice(0, 3)}) ${raw.slice(3)}`
    } else if (raw.length > 6) {
      formatted = `(${raw.slice(0, 3)}) ${raw.slice(3, 6)}-${raw.slice(6)}`
    }
    setCompanySettings(c => ({ ...c, telefono: formatted }))
  }

  function updateCompany(field) {
    return (e) => setCompanySettings((f) => ({ ...f, [field]: e.target.value }))
  }

  // ── 1. PROCESAR CREACIÓN DE CUENTA (Paso 1 -> Paso 2) ──
  async function handleStep1Submit(e) {
    e.preventDefault()
    setError('')

    const passError = validateStrongPassword(form.password)
    if (passError) {
      setError(passError)
      return
    }

    setLoading(true)

    try {
      const newUser = await register(form)
      setRegisteredUser(newUser)
      setCompanySettings(prev => ({
        ...prev,
        razonSocial: form.company || prev.razonSocial || '',
        nombreComercial: form.company || prev.nombreComercial || '',
      }))
      setCurrentStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── 2. PROCESAR PAGO Y CONTRATACIÓN DE PLAN (Paso 2 -> Paso 3) ──
  async function handleStep2Submit(e) {
    e.preventDefault()
    setError('')

    // Validaciones estrictas de tarjeta
    if (!paymentForm.cardName.trim()) {
      setError('Por favor ingresa el nombre impreso en la tarjeta.')
      return
    }
    const cleanCard = paymentForm.cardNumber.replace(/\s/g, '')
    if (cleanCard.length < 15 || cleanCard.length > 16) {
      setError('El número de tarjeta debe contener entre 15 y 16 dígitos válidos.')
      return
    }
    if (!paymentForm.cardExp || !paymentForm.cardExp.includes('/') || paymentForm.cardExp.length !== 5) {
      setError('Ingresa una fecha de expiración válida en formato MM/AA.')
      return
    }
    const [expM, expY] = paymentForm.cardExp.split('/')
    const currentYear = new Date().getFullYear() % 100
    if (parseInt(expY, 10) < currentYear) {
      setError('La tarjeta ingresada está vencida.')
      return
    }
    if (!paymentForm.cardCvc || paymentForm.cardCvc.length < 3) {
      setError('El código de seguridad CVC debe tener 3 o 4 dígitos.')
      return
    }

    setLoading(true)

    try {
      // Registrar plan contratado en los datos del usuario
      const rawUsers = localStorage.getItem('erp_seguridad_users_v1')
      const users = rawUsers ? JSON.parse(rawUsers) : []
      const updatedUsers = users.map(u => {
        if (u.id === registeredUser?.id || u.email.toLowerCase() === form.email.toLowerCase()) {
          return {
            ...u,
            planContratado: selectedPlan,
            periodoPlan: billingPeriod,
            planActivo: true,
            pagoRegistrado: true,
            fechaPago: new Date().toLocaleDateString('es-DO'),
          }
        }
        return u
      })
      localStorage.setItem('erp_seguridad_users_v1', JSON.stringify(updatedUsers))

      // Avanzar al Paso 3
      setCurrentStep(3)
    } catch (err) {
      setError('Error al procesar el plan seleccionado: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── 3. GUARDAR CONFIGURACIÓN DE EMPRESA Y ACCEDER AL DASHBOARD (Paso 3 -> Dashboard) ──
  async function handleStep3Submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Guardar ajustes de la empresa aislados en el Tenant
      const settingsPayload = {
        idioma: 'es-DO',
        monedaPrincipal: companySettings.monedaPrincipal || 'DOP',
        tasaDolar: 60.25,
        tasaEuro: 65.10,
        zonaHoraria: 'America/Santo_Domingo',
        formatoFecha: 'DD/MM/YYYY',
        separadorDecimal: 'punto',
        temaVisual: 'claro',
        densidad: 'comoda',
        sonidosNotificacion: true,
        razonSocial: companySettings.razonSocial || form.company || 'Mi Empresa SRL',
        nombreComercial: companySettings.nombreComercial || form.company || 'Mi Empresa',
        rnc: companySettings.rnc || '0-00-00000-0',
        regimenFiscal: companySettings.regimenFiscal || 'Régimen Ordinario (DGII)',
        telefono: companySettings.telefono || '(809) 000-0000',
        emailCorporativo: form.email,
        website: '',
        direccion: companySettings.direccion || 'República Dominicana',
        ciudad: companySettings.ciudad || 'Santo Domingo',
        ncfPrefijoB01: 'B01',
        ncfPrefijoB02: 'B02',
        ncfPrefijoB14: 'B14',
        ncfPrefijoB15: 'B15',
        pieFactura: 'Documento fiscal emitido conforme a las normas de la DGII.',
        plan: selectedPlan,
        empresaConfigurada: true,
      }

      setTenantData('appes_erp_global_settings_v2', settingsPayload)

      // Actualizar sesión del usuario
      const storedUserRaw = localStorage.getItem('erp_user')
      if (storedUserRaw) {
        const currentUser = JSON.parse(storedUserRaw)
        const updatedSession = {
          ...currentUser,
          empresaConfigurada: true,
          companyName: companySettings.nombreComercial || form.company,
          plan: selectedPlan,
        }
        localStorage.setItem('erp_user', JSON.stringify(updatedSession))
      }

      // Limpiar caché del wizard tras completarlo con éxito
      localStorage.removeItem(REGISTER_STEP_CACHE_KEY)

      // Redirigir al Dashboard principal con sus módulos limpios
      navigate('/dashboard')
    } catch (err) {
      setError('Error al guardar la configuración: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Planes de precios
  const plans = [
    {
      id: 'emprendedor',
      name: 'Plan Emprendedor',
      price: billingPeriod === 'annual' ? 39 : 49,
      period: 'USD / mes',
      desc: 'Ideal para profesionales o negocios independientes.',
      features: ['Hasta 3 Usuarios', 'Ventas & Facturación NCF', 'Inventario Básico', 'Soporte Estándar'],
      popular: false,
    },
    {
      id: 'clinica',
      name: 'Plan Empresarial Pro',
      price: billingPeriod === 'annual' ? 99 : 129,
      period: 'USD / mes',
      desc: 'Para empresas en crecimiento con múltiples áreas.',
      features: ['Hasta 15 Usuarios', 'Todos los Módulos Activos', 'Multi-Almacén & Kardex', 'Finanzas & DGII Completo', 'Soporte Prioritario'],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Plan Enterprise Suite',
      price: billingPeriod === 'annual' ? 249 : 299,
      period: 'USD / mes',
      desc: 'Para corporaciones y operaciones a gran escala.',
      features: ['Usuarios Ilimitados', 'IA Chatbot Ilimitado', 'Multi-Empresa & Sucursales', 'API & Integraciones', 'Account Manager 24/7'],
      popular: false,
    },
  ]

  return (
    <div className="auth-split-wrapper" style={{ minHeight: '100vh', display: 'flex' }}>
      {/* ── Panel Izquierdo: Flujo de 3 Pasos ── */}
      <div className="auth-split-form-side" style={{ flex: '1 1 600px', maxWidth: currentStep === 2 ? 800 : 540, transition: 'max-width 0.3s ease' }}>
        <div>
          {/* Logo Corporativo */}
          <div className="auth-split-brand">
            <img
              src="/branding/logo_appex.jpg"
              alt="APPEX Logo"
              className="auth-split-logo-img"
            />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                APPEX<span style={{ color: '#2563EB' }}>.ERP</span>
              </div>
              <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Sistema de Gestión Empresarial
              </div>
            </div>
          </div>

          {/* Barra de Progreso de 3 Pasos */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
            padding: '14px 16px',
            background: '#F8FAFC',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: currentStep >= 1 ? 1 : 0.4 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: currentStep >= 1 ? '#2563EB' : '#CBD5E1',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 12
              }}>
                {currentStep > 1 ? '✓' : '1'}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: currentStep >= 1 ? '#0F172A' : '#64748B' }}>
                Cuenta
              </span>
            </div>

            <div style={{ flex: 1, height: 2, background: currentStep >= 2 ? '#2563EB' : '#E2E8F0', margin: '0 8px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: currentStep >= 2 ? 1 : 0.4 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: currentStep >= 2 ? '#2563EB' : '#CBD5E1',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 12
              }}>
                {currentStep > 2 ? '✓' : '2'}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: currentStep >= 2 ? '#0F172A' : '#64748B' }}>
                Plan & Pago
              </span>
            </div>

            <div style={{ flex: 1, height: 2, background: currentStep >= 3 ? '#2563EB' : '#E2E8F0', margin: '0 8px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: currentStep >= 3 ? 1 : 0.4 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: currentStep >= 3 ? '#2563EB' : '#CBD5E1',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 12
              }}>
                3
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: currentStep >= 3 ? '#0F172A' : '#64748B' }}>
                Empresa
              </span>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              PASO 1: CREACIÓN DE CUENTA
          ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div>
              <h1 className="auth-split-title">Paso 1: Crear Cuenta</h1>
              <p className="auth-split-sub">Ingresa tus credenciales de acceso para registrarte.</p>

              <form onSubmit={handleStep1Submit}>
                <div className="auth-split-field">
                  <label htmlFor="name">NOMBRE COMPLETO</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Lic. Juan Pérez"
                    value={form.name}
                    onChange={updateForm('name')}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="auth-split-field">
                  <label htmlFor="company">EMPRESA / RAZÓN SOCIAL INICIAL</label>
                  <input
                    id="company"
                    type="text"
                    placeholder="Tech Solutions SRL"
                    value={form.company}
                    onChange={updateForm('company')}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="auth-split-field">
                  <label htmlFor="email">CORREO ELECTRÓNICO (LOGIN)</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="contacto@techsolutions.do"
                    value={form.email}
                    onChange={updateForm('email')}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="auth-split-field">
                  <label htmlFor="password">CONTRASEÑA ROBUSTA *</label>
                  <div className="auth-split-pass-wrap">
                    <input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Mín. 8 caracteres (A-Z, a-z, 0-9, !@#)"
                      value={form.password}
                      onChange={updateForm('password')}
                      disabled={loading}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="auth-split-toggle-pass"
                      onClick={() => setShowPass(v => !v)}
                      tabIndex={-1}
                      aria-label="Ver u ocultar contraseña"
                    >
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 4,
                    marginTop: 6,
                    fontSize: 11,
                    color: '#64748B'
                  }}>
                    <span style={{ color: form.password.length >= 8 ? '#16A34A' : '#94A3B8', fontWeight: 600 }}>
                      {form.password.length >= 8 ? '✓' : '○'} Mín. 8 caracteres
                    </span>
                    <span style={{ color: /[A-Z]/.test(form.password) ? '#16A34A' : '#94A3B8', fontWeight: 600 }}>
                      {/[A-Z]/.test(form.password) ? '✓' : '○'} 1 Mayúscula (A-Z)
                    </span>
                    <span style={{ color: /[0-9]/.test(form.password) ? '#16A34A' : '#94A3B8', fontWeight: 600 }}>
                      {/[0-9]/.test(form.password) ? '✓' : '○'} 1 Número (0-9)
                    </span>
                    <span style={{ color: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(form.password) ? '#16A34A' : '#94A3B8', fontWeight: 600 }}>
                      {/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(form.password) ? '✓' : '○'} 1 Especial (!@#$)
                    </span>
                  </div>
                </div>

                {error && (
                  <div style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: 12,
                    color: '#DC2626',
                    fontWeight: 600,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="auth-split-btn-primary"
                  disabled={loading}
                >
                  <span>Siguiente: Elegir Plan & Pago →</span>
                </button>
              </form>

              {/* Separador */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                margin: '22px 0 16px',
                color: '#94A3B8',
                fontSize: 11,
                fontWeight: 600
              }}>
                <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
                <span>¿Ya tienes cuenta?</span>
                <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
              </div>

              <Link to="/login" className="auth-split-btn-outline">
                <span>🔒</span> Iniciar Sesión con mi Cuenta
              </Link>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              PASO 2: ELEGIR PLAN Y PAGAR
          ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div>
              <h1 className="auth-split-title">Paso 2: Seleccionar Plan y Pago</h1>
              <p className="auth-split-sub">Elige el plan que mejor se adapte a tu empresa y procesa la activación.</p>

              {/* Switch Facturación */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20,
                background: '#F1F5F9',
                padding: '6px',
                borderRadius: 10,
                width: 'fit-content',
                margin: '0 auto 20px',
              }}>
                <button
                  type="button"
                  onClick={() => setBillingPeriod('monthly')}
                  style={{
                    border: 'none',
                    background: billingPeriod === 'monthly' ? '#FFFFFF' : 'transparent',
                    color: billingPeriod === 'monthly' ? '#0F172A' : '#64748B',
                    fontWeight: 700,
                    fontSize: 12,
                    padding: '6px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    boxShadow: billingPeriod === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  Mensual
                </button>
                <button
                  type="button"
                  onClick={() => setBillingPeriod('annual')}
                  style={{
                    border: 'none',
                    background: billingPeriod === 'annual' ? '#FFFFFF' : 'transparent',
                    color: billingPeriod === 'annual' ? '#0F172A' : '#64748B',
                    fontWeight: 700,
                    fontSize: 12,
                    padding: '6px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    boxShadow: billingPeriod === 'annual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  Anual <span style={{ color: '#16A34A', fontSize: 10 }}>(-20% OFF)</span>
                </button>
              </div>

              {/* Grid de Planes */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14,
                marginBottom: 24,
              }}>
                {plans.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id)}
                    style={{
                      border: selectedPlan === p.id ? '2px solid #2563EB' : '1px solid #E2E8F0',
                      background: selectedPlan === p.id ? '#EFF6FF' : '#FFFFFF',
                      borderRadius: 12,
                      padding: '16px',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {p.popular && (
                      <div style={{
                        position: 'absolute',
                        top: -10,
                        right: 12,
                        background: '#2563EB',
                        color: '#FFF',
                        fontSize: 9,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 20,
                      }}>
                        MÁS POPULAR
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{p.name}</h4>
                      <input
                        type="radio"
                        name="planSelection"
                        checked={selectedPlan === p.id}
                        onChange={() => setSelectedPlan(p.id)}
                      />
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                      ${p.price} <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>{p.period}</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 10px', lineHeight: 1.3 }}>{p.desc}</p>
                    <ul style={{ padding: 0, margin: 0, listStyle: 'none', fontSize: 11, color: '#334155', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {p.features.map((f, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#16A34A', fontWeight: 800 }}>✓</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Formulario de Pago / Tarjeta */}
              <form onSubmit={handleStep2Submit} style={{ background: '#F8FAFC', padding: '18px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>💳</span> Datos de Facturación & Pago
                </h4>

                <div className="auth-split-field">
                  <label>NOMBRE EN LA TARJETA</label>
                  <input
                    type="text"
                    placeholder="Juan Pérez"
                    value={paymentForm.cardName}
                    onChange={updatePayment('cardName')}
                    required
                  />
                </div>

                <div className="auth-split-field">
                  <label>NÚMERO DE TARJETA (DÉBITO / CRÉDITO)</label>
                  <input
                    type="text"
                    placeholder="4532 0000 0000 8890"
                    value={paymentForm.cardNumber}
                    onChange={handleCardNumberChange}
                    maxLength={19}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="auth-split-field">
                    <label>EXPIRACIÓN (MM/AA)</label>
                    <input
                      type="text"
                      placeholder="12/28"
                      value={paymentForm.cardExp}
                      onChange={handleCardExpChange}
                      maxLength={5}
                      required
                    />
                  </div>
                  <div className="auth-split-field">
                    <label>CVC / CWW</label>
                    <input
                      type="password"
                      placeholder="•••"
                      value={paymentForm.cardCvc}
                      onChange={handleCardCvcChange}
                      maxLength={4}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div style={{ color: '#DC2626', fontSize: 12, fontWeight: 600, margin: '8px 0' }}>
                    ⚠️ {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="auth-split-btn-outline"
                    style={{ flex: 1 }}
                  >
                    ← Volver
                  </button>
                  <button
                    type="submit"
                    className="auth-split-btn-primary"
                    style={{ flex: 2 }}
                    disabled={loading}
                  >
                    <span>🔒</span> {loading ? 'Procesando...' : 'Pagar & Continuar →'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              PASO 3: CONFIGURACIÓN INICIAL DE LA EMPRESA
          ═══════════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div>
              <h1 className="auth-split-title">Paso 3: Configurar mi Empresa</h1>
              <p className="auth-split-sub">Completa los datos fiscales de tu empresa para emitir facturas y configurar tus módulos.</p>

              <form onSubmit={handleStep3Submit}>
                <div className="auth-split-field">
                  <label htmlFor="razonSocial">RAZÓN SOCIAL / NOMBRE LEGAL *</label>
                  <input
                    id="razonSocial"
                    type="text"
                    placeholder="Tech Solutions SRL"
                    value={companySettings.razonSocial}
                    onChange={updateCompany('razonSocial')}
                    required
                  />
                </div>

                <div className="auth-split-field">
                  <label htmlFor="nombreComercial">NOMBRE COMERCIAL *</label>
                  <input
                    id="nombreComercial"
                    type="text"
                    placeholder="Tech Solutions"
                    value={companySettings.nombreComercial}
                    onChange={updateCompany('nombreComercial')}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="auth-split-field">
                    <label htmlFor="rnc">RNC / IDENTIFICACIÓN FISCAL *</label>
                    <input
                      id="rnc"
                      type="text"
                      placeholder="1-31-00000-0"
                      value={companySettings.rnc}
                      onChange={handleRncChange}
                      maxLength={11}
                      required
                    />
                  </div>
                  <div className="auth-split-field">
                    <label htmlFor="telefono">TELÉFONO DE CONTACTO</label>
                    <input
                      id="telefono"
                      type="text"
                      placeholder="(809) 555-0100"
                      value={companySettings.telefono}
                      onChange={handleTelefonoChange}
                      maxLength={14}
                    />
                  </div>
                </div>

                <div className="auth-split-field">
                  <label htmlFor="direccion">DIRECCIÓN FISCAL</label>
                  <input
                    id="direccion"
                    type="text"
                    placeholder="Av. Principal #100"
                    value={companySettings.direccion}
                    onChange={updateCompany('direccion')}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="auth-split-field">
                    <label htmlFor="ciudad">CIUDAD / PROVINCIA</label>
                    <input
                      id="ciudad"
                      type="text"
                      placeholder="Santo Domingo"
                      value={companySettings.ciudad}
                      onChange={updateCompany('ciudad')}
                    />
                  </div>
                  <div className="auth-split-field">
                    <label htmlFor="moneda">MONEDA PRINCIPAL</label>
                    <select
                      id="moneda"
                      value={companySettings.monedaPrincipal}
                      onChange={updateCompany('monedaPrincipal')}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid #CBD5E1',
                        fontSize: 13,
                        fontWeight: 600,
                        background: '#FFFFFF',
                      }}
                    >
                      <option value="DOP">Pesos Dominicanos (DOP / RD$)</option>
                      <option value="USD">Dólares Estadounidenses (USD / $)</option>
                      <option value="EUR">Euros (EUR / €)</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <div style={{ color: '#DC2626', fontSize: 12, fontWeight: 600, margin: '8px 0' }}>
                    ⚠️ {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="auth-split-btn-outline"
                    style={{ flex: 1 }}
                  >
                    ← Volver al Plan
                  </button>
                  <button
                    type="submit"
                    className="auth-split-btn-primary"
                    style={{ flex: 2 }}
                    disabled={loading}
                  >
                    <span>🚀</span> {loading ? 'Finalizando...' : 'Finalizar y Entrar al ERP →'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer legal */}
        <div style={{ paddingTop: 20, textAlign: 'center', fontSize: 11, color: '#94A3B8' }}>
          Sistema de Gestión Empresarial v2.0 · Plataforma Multi-Tenant Segura
        </div>
      </div>

      {/* ── Panel Derecho: Hero con Imagen Corporativa y Mensaje ── */}
      <div className="auth-split-hero-side" style={{ flex: '1 1 400px' }}>
        <div className="auth-split-hero-overlay" />
        <div className="auth-split-hero-content">
          <h2 className="auth-split-hero-title">
            Tu Empresa en una Plataforma Integral.
          </h2>
          <p className="auth-split-hero-desc">
            Gestiona compras, ventas, inventario, finanzas y clientes con la máxima precisión, elegancia y seguridad.
          </p>
        </div>
      </div>
    </div>
  )
}

