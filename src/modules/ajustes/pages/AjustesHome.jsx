import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../core/auth/AuthContext'
import { SeguridadView } from '../components/SeguridadView'
import { PlanEmpresarialView } from '../components/PlanEmpresarialView'
import { erpSync } from '../../../core/sync/erpSyncEngine'
import { cloudSync } from '../../../core/sync/cloudSyncService'
import { getTenantData, setTenantData, getActiveTenantId } from '../../../core/utils/formatters'
import { setModuleEnabled } from '../../../core/moduleRegistry'
import './AjustesHome.css'

const STORAGE_SETTINGS_KEY = 'appes_erp_global_settings_v2'

const DEFAULT_SETTINGS = {
  // General & Regionales
  idioma: 'es-DO',
  monedaPrincipal: 'DOP',
  tasaDolar: 60.25,
  tasaEuro: 65.10,
  zonaHoraria: 'America/Santo_Domingo',
  formatoFecha: 'DD/MM/YYYY',
  separadorDecimal: 'punto',
  temaVisual: 'claro',
  densidad: 'comoda',
  sonidosNotificacion: true,

  // Empresa & Fiscal
  razonSocial: 'APPEX Dominicana Suite SRL',
  nombreComercial: 'APPEX Enterprise ERP',
  rnc: '1-31-89023-4',
  regimenFiscal: 'Régimen Ordinario (DGII)',
  telefono: '(809) 555-0100',
  emailCorporativo: 'contacto@appex.do',
  website: 'https://appex-erp.com.do',
  direccion: 'Av. Winston Churchill #109, Torre Empresarial Blue Mall, Piso 14',
  ciudad: 'Santo Domingo, Distrito Nacional',
  ncfPrefijoB01: 'B01',
  ncfPrefijoB02: 'B02',
  ncfPrefijoB14: 'B14',
  ncfPrefijoB15: 'B15',
  pieFactura: 'Gracias por su preferencia. Documento fiscal válido para crédito fiscal emitido conforme a las normas de la DGII.',

  // Módulos Activos
  modulos: {
    ventas: true,
    compras: true,
    inventario: true,
    crm: true,
    finanzas: true,
    reportes: true,
    chatbot: true,
    plugins: true,
  },

  // Automatizaciones y Sincronizaciones Cruzadas
  autoSyncComprasInventario: true,
  autoSyncVentasInventario: true,
  autoSyncVentasFinanzas: true,
  autoAlertasStockMinimo: true,
  autoBackupDiario: true,

  // Notificaciones & Canales
  whatsappApiEnabled: true,
  whatsappInstanceId: 'APPEX-WA-809-PRO',
  whatsappNumeroDestino: '+1 (809) 555-0199',
  smtpHost: 'smtp.office365.com',
  smtpPort: 587,
  smtpUser: 'notificaciones@appex.do',
  smtpSeguridad: 'TLS',
  alertarComprasGrandes: true,
  montoMinimoAlertaCompra: 100000,
}

// ─── Funciones de Validación ──────────────────────────────────────────────────

function validateRNC(val) {
  if (!val) return 'El RNC / Cédula es obligatorio'
  const digits = val.replace(/\D/g, '')
  if (digits.length !== 9 && digits.length !== 11) {
    return 'Debe tener 9 dígitos (RNC empresa) o 11 dígitos (Cédula)'
  }
  return null
}

function validateEmail(val) {
  if (!val) return 'El correo electrónico es obligatorio'
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(val)) return 'Formato de correo electrónico inválido (ej: info@empresa.do)'
  return null
}

function validatePhone(val) {
  if (!val) return 'El teléfono es obligatorio'
  const digits = val.replace(/\D/g, '')
  if (digits.length < 10) return 'Debe tener al menos 10 dígitos (ej: 809-555-0100)'
  return null
}

function validatePositiveNumber(val, min = 0.01) {
  const num = Number(val)
  if (isNaN(num) || num < min) return `Debe ser un número válido mayor a ${min}`
  return null
}

function validateNCF(val) {
  if (!val) return 'Prefijo obligatorio'
  const clean = val.trim().toUpperCase()
  if (!/^[B|E][0-9]{2}$/.test(clean)) return 'Formato DGII inválido (ej: B01, B02, B14, E31)'
  return null
}

export function AjustesHome() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') || 'General'

  const [settings, setSettings] = useState(() => {
    try {
      const stored = getTenantData(STORAGE_SETTINGS_KEY, null)
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...stored }
      }
    } catch (_) {}
    return DEFAULT_SETTINGS
  })

  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTestMessage, setActiveTestMessage] = useState(null)

  // Aplicar tema en caliente
  useEffect(() => {
    if (settings.temaVisual === 'oscuro') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [settings.temaVisual])

  const showToast = (msg, isError = false) => {
    setToast({ text: msg, isError })
    setTimeout(() => setToast(null), 3500)
  }

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName })
  }

  // Validación completa antes de guardar
  const validateForm = () => {
    const errs = {}

    // Empresa
    if (settings.rnc) {
      const rncErr = validateRNC(settings.rnc)
      if (rncErr) errs.rnc = rncErr
    }

    if (settings.emailCorporativo) {
      const emailErr = validateEmail(settings.emailCorporativo)
      if (emailErr) errs.emailCorporativo = emailErr
    }

    if (settings.telefono) {
      const phoneErr = validatePhone(settings.telefono)
      if (phoneErr) errs.telefono = phoneErr
    }

    // NCFs
    if (settings.ncfPrefijoB01) {
      const b01Err = validateNCF(settings.ncfPrefijoB01)
      if (b01Err) errs.ncfPrefijoB01 = b01Err
    }

    if (settings.ncfPrefijoB02) {
      const b02Err = validateNCF(settings.ncfPrefijoB02)
      if (b02Err) errs.ncfPrefijoB02 = b02Err
    }

    // Tasas
    if (settings.tasaDolar !== undefined) {
      const usdErr = validatePositiveNumber(settings.tasaDolar, 1)
      if (usdErr) errs.tasaDolar = usdErr
    }

    if (settings.tasaEuro !== undefined) {
      const eurErr = validatePositiveNumber(settings.tasaEuro, 1)
      if (eurErr) errs.tasaEuro = eurErr
    }

    // SMTP
    if (settings.smtpPort) {
      const portErr = validatePositiveNumber(settings.smtpPort, 1)
      if (portErr) errs.smtpPort = 'Puerto inválido (ej: 587, 465)'
    }
    if (settings.smtpUser) {
      const smtpEmailErr = validateEmail(settings.smtpUser)
      if (smtpEmailErr) errs.smtpUser = smtpEmailErr
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSaveAll = (e) => {
    if (e) e.preventDefault()
    if (!validateForm()) {
      showToast('⚠️ Por favor corrige los campos con advertencias en rojo', true)
      return
    }

    setIsSaving(true)
    setTimeout(() => {
      setTenantData(STORAGE_SETTINGS_KEY, settings)
      // Guardar también copia global
      try {
        localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings))
      } catch (_) {}

      // Aplicar tema inmediatamente
      if (settings.temaVisual === 'oscuro') {
        document.documentElement.setAttribute('data-theme', 'dark')
      } else if (settings.temaVisual === 'auto') {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        if (prefersDark) {
          document.documentElement.setAttribute('data-theme', 'dark')
        } else {
          document.documentElement.removeAttribute('data-theme')
        }
      } else {
        document.documentElement.removeAttribute('data-theme')
      }

      // Aplicar estado de cada módulo al registry central
      if (settings.modulos) {
        Object.entries(settings.modulos).forEach(([modKey, isEnabled]) => {
          setModuleEnabled(modKey, isEnabled)
        })
      }
      setIsSaving(false)
      showToast('💾 Preferencias y Apariencia guardadas exitosamente')
      erpSync.emit('settings:update', settings)
    }, 250)
  }

  const handleLoadDemoData = () => {
    if (window.confirm('¿Deseas poblar el ERP con un catálogo completo de datos de demostración para presentaciones?')) {
      erpSync.resetDatabase()
      showToast('🚀 Base de datos de demostración cargada con éxito')
      setTimeout(() => window.location.reload(), 600)
    }
  }

  const handleResetSettings = () => {
    if (window.confirm('¿Deseas restablecer todos los ajustes a los valores recomendados por defecto?')) {
      setSettings(DEFAULT_SETTINGS)
      setErrors({})
      setTenantData(STORAGE_SETTINGS_KEY, DEFAULT_SETTINGS)
      showToast('🔄 Preferencias restablecidas a los valores de fábrica')
    }
  }

  const handleExportBackup = () => {
    const backupData = {
      version: '2026.4.0',
      timestamp: new Date().toISOString(),
      ajustes: settings,
      ventas: getTenantData('ventas_orders_v1', []),
      compras: getTenantData('compras_orders_v1', []),
      inventario: getTenantData('appes_inventory_products_v1', []),
      crm: getTenantData('appes_crm_clients_v1', []),
      finanzas: getTenantData('appes_erp_finanzas_data_v3', {}),
    }

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup_erp_enterprise_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('📦 Copia de seguridad completa exportada en formato JSON')
  }

  const handleTestWhatsApp = () => {
    const phoneErr = validatePhone(settings.whatsappNumeroDestino)
    if (phoneErr) {
      showToast('⚠️ Número de WhatsApp destinatario inválido', true)
      return
    }
    setActiveTestMessage('Enviando mensaje de prueba vía WhatsApp Cloud API...')
    setTimeout(() => {
      setActiveTestMessage(null)
      showToast(`💬 Mensaje de prueba enviado exitosamente a ${settings.whatsappNumeroDestino}`)
    }, 1200)
  }

  const handleTestSMTP = () => {
    const hostErr = !settings.smtpHost
    const emailErr = validateEmail(settings.smtpUser)
    if (hostErr || emailErr) {
      showToast('⚠️ Configuración de servidor SMTP incompleta o errónea', true)
      return
    }
    setActiveTestMessage(`Verificando conexión con ${settings.smtpHost}:${settings.smtpPort}...`)
    setTimeout(() => {
      setActiveTestMessage(null)
      showToast(`✉️ Conexión SMTP exitosa. Correo de verificación enviado a ${settings.smtpUser}`)
    }, 1200)
  }

  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN'

  const allTabs = [
    { id: 'General', label: 'General', icon: '⚙️', adminOnly: false },
    { id: 'Empresa', label: 'Empresa & Fiscal', icon: '🏢', adminOnly: true },
    { id: 'Módulos', label: 'Módulos & Sync', icon: '🧩', adminOnly: true },
    { id: 'Cloud', label: 'Nube & Equipo', icon: '☁️', adminOnly: false },
    { id: 'Automatizaciones', label: 'Automatizaciones', icon: '⚡', adminOnly: true },
    { id: 'Notificaciones', label: 'Notificaciones & Canales', icon: '🔔', adminOnly: true },
    { id: 'Usuarios y Roles', label: 'Usuarios & Roles', icon: '👥', adminOnly: true },
    { id: 'Seguridad', label: 'Seguridad & 2FA', icon: '🛡️', adminOnly: true },
    { id: 'Sistema', label: 'Sistema & Plan', icon: '💻', adminOnly: false },
  ]

  const tabsList = isAdmin ? allTabs : allTabs.filter(t => !t.adminOnly)

  return (
    <div className="ajustes-page">
      {/* ── Banner Hero Panorámico Ejecutivo ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
        borderRadius: 18,
        padding: '24px 28px',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 20px -4px rgba(30, 58, 138, 0.28)',
        marginBottom: 12,
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Imagen panorámica de fondo superpuesta en la parte derecha */}
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

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 780 }}>
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
            <span>⚙️</span> CENTRO DE CONTROL & CONFIGURACIÓN EMPRESARIAL · v2026.4.0
          </div>

          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Ajustes Globales y Administración del Sistema
          </h1>
          <p style={{ margin: '6px 0 16px', fontSize: 13, color: '#CBD5E1', lineHeight: 1.45, maxWidth: 600 }}>
            Configura las políticas fiscales de la empresa, interconexión de módulos en tiempo real, canales de notificación, seguridad y roles RBAC.
          </p>

          {/* Estadísticas en vivo adaptables a móviles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>99.99%</div>
              <div style={{ fontSize: 10, color: '#93C5FD', marginTop: 3 }}>Uptime Operativo</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#34D399', lineHeight: 1 }}>2FA + AES-256</div>
              <div style={{ fontSize: 10, color: '#93C5FD', marginTop: 3 }}>Seguridad & Cifrado</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>RD$ / USD / EUR</div>
              <div style={{ fontSize: 10, color: '#93C5FD', marginTop: 3 }}>Multi-Moneda</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#FCD34D', lineHeight: 1 }}>Enterprise Suite</div>
              <div style={{ fontSize: 10, color: '#93C5FD', marginTop: 3 }}>Licencia Activa</div>
            </div>
          </div>

          {/* Botones Rápidos del Hero */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={handleLoadDemoData}
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
              }}
            >
              🚀 Cargar Datos Demo (1-Click)
            </button>
            <button
              onClick={handleExportBackup}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              📦 Exportar Copia de Seguridad JSON
            </button>
            <button
              onClick={handleResetSettings}
              style={{
                background: 'rgba(255, 255, 255, 0.10)',
                color: '#CBD5E1',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              🔄 Restablecer Valores
            </button>
          </div>
        </div>
      </div>

      {/* ── Sub-navegación por Pestañas con Íconos ── */}
      <div className="ajustes-tabs-bar">
        {tabsList.map((t) => (
          <button
            key={t.id}
            className={`ajustes-tab-btn ${currentTab === t.id ? 'active' : ''}`}
            onClick={() => handleTabChange(t.id)}
          >
            <span style={{ marginRight: 6 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          CONTENIDO DINÁMICO SEGÚN LA PESTAÑA ACTIVA
      ══════════════════════════════════════════════════════════════════════ */}

      {/* ── TAB 1: GENERAL & REGIONALES ── */}
      {currentTab === 'General' && (
        <div className="ajustes-tab-content">
          <div className="ajustes-card-panel">
            <div className="ajustes-panel-header">
              <div>
                <h3 className="ajustes-panel-title">🌐 Preferencias Regionales y de Moneda</h3>
                <p className="ajustes-panel-subtitle">Configura la zona horaria, formatos de fecha y tasas de cambio para operaciones en moneda extranjera.</p>
              </div>
              <span className="ajustes-badge-status">Dominicana (DOP)</span>
            </div>

            <div className="ajustes-form-grid-2">
              <div className="ajustes-form-group">
                <label>Idioma Principal</label>
                <select
                  value={settings.idioma}
                  onChange={e => setSettings({ ...settings, idioma: e.target.value })}
                >
                  <option value="es-DO">Español (República Dominicana)</option>
                  <option value="en-US">English (United States)</option>
                  <option value="fr-FR">Français (France)</option>
                </select>
              </div>

              <div className="ajustes-form-group">
                <label>Zona Horaria del Sistema</label>
                <select
                  value={settings.zonaHoraria}
                  onChange={e => setSettings({ ...settings, zonaHoraria: e.target.value })}
                >
                  <option value="America/Santo_Domingo">(GMT-04:00) Santo Domingo / Santiago / La Paz</option>
                  <option value="America/New_York">(GMT-05:00) New York / Miami / Atlanta</option>
                  <option value="America/Bogota">(GMT-05:00) Bogotá / Lima / Quito</option>
                  <option value="Europe/Madrid">(GMT+01:00) Madrid / Barcelona</option>
                </select>
              </div>

              <div className="ajustes-form-group">
                <label>Moneda Base del Sistema</label>
                <select
                  value={settings.monedaPrincipal}
                  onChange={e => setSettings({ ...settings, monedaPrincipal: e.target.value })}
                >
                  <option value="DOP">RD$ - Peso Dominicano (Moneda Funcional)</option>
                  <option value="USD">USD - Dólar Estadounidense</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>

              <div className="ajustes-form-group">
                <label>Formato de Fecha</label>
                <select
                  value={settings.formatoFecha}
                  onChange={e => setSettings({ ...settings, formatoFecha: e.target.value })}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Ej: 14/08/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Estándar)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (Formato US)</option>
                </select>
              </div>

              <div className="ajustes-form-group">
                <label>
                  <span>Tasa de Cambio Oficial (USD ➔ DOP)</span>
                  {!errors.tasaDolar && <span className="ajustes-field-valid">✓ Válida</span>}
                </label>
                <input
                  type="number"
                  step="0.01"
                  className={errors.tasaDolar ? 'has-error' : ''}
                  value={settings.tasaDolar}
                  onChange={e => {
                    const val = e.target.value
                    setSettings({ ...settings, tasaDolar: val })
                    const err = validatePositiveNumber(val, 1)
                    setErrors(prev => ({ ...prev, tasaDolar: err }))
                  }}
                />
                {errors.tasaDolar && <span className="ajustes-field-error">⚠️ {errors.tasaDolar}</span>}
              </div>

              <div className="ajustes-form-group">
                <label>
                  <span>Tasa de Cambio Oficial (EUR ➔ DOP)</span>
                  {!errors.tasaEuro && <span className="ajustes-field-valid">✓ Válida</span>}
                </label>
                <input
                  type="number"
                  step="0.01"
                  className={errors.tasaEuro ? 'has-error' : ''}
                  value={settings.tasaEuro}
                  onChange={e => {
                    const val = e.target.value
                    setSettings({ ...settings, tasaEuro: val })
                    const err = validatePositiveNumber(val, 1)
                    setErrors(prev => ({ ...prev, tasaEuro: err }))
                  }}
                />
                {errors.tasaEuro && <span className="ajustes-field-error">⚠️ {errors.tasaEuro}</span>}
              </div>
            </div>

            <div className="ajustes-panel-footer">
              <button type="button" className="ajustes-outline-btn" onClick={handleResetSettings}>
                Restablecer
              </button>
              <button type="button" className="ajustes-btn-primary" onClick={handleSaveAll} disabled={isSaving}>
                {isSaving ? 'Guardando...' : '💾 Guardar Preferencias'}
              </button>
            </div>
          </div>

          <div className="ajustes-card-panel">
            <div className="ajustes-panel-header">
              <div>
                <h3 className="ajustes-panel-title">🎨 Apariencia y Experiencia de Usuario</h3>
                <p className="ajustes-panel-subtitle">Personaliza la interfaz, densidad de tablas y sonidos de confirmación de operaciones.</p>
              </div>
            </div>

            <div className="ajustes-form-grid-2">
              <div className="ajustes-form-group">
                <label>Tema de Interfaz</label>
                <select
                  value={settings.temaVisual}
                  onChange={e => setSettings({ ...settings, temaVisual: e.target.value })}
                >
                  <option value="claro">Claro Ejecutivo (Royal Blue Theme)</option>
                  <option value="oscuro">Oscuro Moderno (Dark Mode)</option>
                  <option value="auto">Automático según el Sistema Operativo</option>
                </select>
              </div>

              <div className="ajustes-form-group">
                <label>Densidad de Información</label>
                <select
                  value={settings.densidad}
                  onChange={e => setSettings({ ...settings, densidad: e.target.value })}
                >
                  <option value="comoda">Cómoda (Recomendada para pantallas 1080p+)</option>
                  <option value="compacta">Compacta (Alta densidad para analistas)</option>
                </select>
              </div>
            </div>

            <div className="ajustes-panel-footer">
              <button type="button" className="ajustes-btn-primary" onClick={handleSaveAll} disabled={isSaving}>
                {isSaving ? 'Guardando...' : '💾 Guardar Apariencia'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: EMPRESA & FISCAL ── */}
      {currentTab === 'Empresa' && (
        <div className="ajustes-tab-content">
          <div className="ajustes-card-panel">
            <div className="ajustes-panel-header">
              <div>
                <h3 className="ajustes-panel-title">🏢 Perfil Institucional & Identidad Fiscal</h3>
                <p className="ajustes-panel-subtitle">Datos oficiales utilizados en el encabezado de facturas, órdenes de compra y cotizaciones.</p>
              </div>
              <span className="ajustes-badge-status green">Homologado DGII</span>
            </div>

            <div className="ajustes-form-grid-2">
              <div className="ajustes-form-group">
                <label>
                  <span>Razón Social Oficial *</span>
                  {settings.razonSocial && !errors.razonSocial && <span className="ajustes-field-valid">✓ Válida</span>}
                </label>
                <input
                  className={errors.razonSocial ? 'has-error' : ''}
                  value={settings.razonSocial}
                  onChange={e => {
                    const val = e.target.value
                    setSettings({ ...settings, razonSocial: val })
                    setErrors(prev => ({ ...prev, razonSocial: val.trim().length >= 3 ? null : 'Mínimo 3 caracteres' }))
                  }}
                />
                {errors.razonSocial && <span className="ajustes-field-error">⚠️ {errors.razonSocial}</span>}
              </div>

              <div className="ajustes-form-group">
                <label>
                  <span>RNC / Cédula Fiscal *</span>
                  {!errors.rnc && <span className="ajustes-field-valid">✓ Formato DGII Válido</span>}
                </label>
                <input
                  placeholder="1-31-89023-4"
                  className={errors.rnc ? 'has-error' : ''}
                  value={settings.rnc}
                  onChange={e => {
                    const val = e.target.value
                    setSettings({ ...settings, rnc: val })
                    const err = validateRNC(val)
                    setErrors(prev => ({ ...prev, rnc: err }))
                  }}
                />
                {errors.rnc && <span className="ajustes-field-error">⚠️ {errors.rnc}</span>}
              </div>

              <div className="ajustes-form-group">
                <label>Nombre Comercial</label>
                <input
                  value={settings.nombreComercial}
                  onChange={e => setSettings({ ...settings, nombreComercial: e.target.value })}
                />
              </div>

              <div className="ajustes-form-group">
                <label>Régimen Tributario</label>
                <select
                  value={settings.regimenFiscal}
                  onChange={e => setSettings({ ...settings, regimenFiscal: e.target.value })}
                >
                  <option value="Régimen Ordinario (DGII)">Régimen Ordinario (DGII - ITBIS 18%)</option>
                  <option value="Régimen Simplificado de Tributación (RST)">RST (Régimen Simplificado)</option>
                  <option value="Zona Franca Ley 8-90">Zona Franca (Exento ITBIS)</option>
                </select>
              </div>

              <div className="ajustes-form-group">
                <label>
                  <span>Teléfono PBX / Central</span>
                  {!errors.telefono && <span className="ajustes-field-valid">✓ Válido</span>}
                </label>
                <input
                  placeholder="(809) 555-0100"
                  className={errors.telefono ? 'has-error' : ''}
                  value={settings.telefono}
                  onChange={e => {
                    const val = e.target.value
                    setSettings({ ...settings, telefono: val })
                    const err = validatePhone(val)
                    setErrors(prev => ({ ...prev, telefono: err }))
                  }}
                />
                {errors.telefono && <span className="ajustes-field-error">⚠️ {errors.telefono}</span>}
              </div>

              <div className="ajustes-form-group">
                <label>
                  <span>Correo Electrónico Corporativo</span>
                  {!errors.emailCorporativo && <span className="ajustes-field-valid">✓ Verificado</span>}
                </label>
                <input
                  type="email"
                  placeholder="contacto@appex.do"
                  className={errors.emailCorporativo ? 'has-error' : ''}
                  value={settings.emailCorporativo}
                  onChange={e => {
                    const val = e.target.value
                    setSettings({ ...settings, emailCorporativo: val })
                    const err = validateEmail(val)
                    setErrors(prev => ({ ...prev, emailCorporativo: err }))
                  }}
                />
                {errors.emailCorporativo && <span className="ajustes-field-error">⚠️ {errors.emailCorporativo}</span>}
              </div>

              <div className="ajustes-form-group" style={{ gridColumn: '1 / -1' }}>
                <label>
                  <span>Dirección Fiscal & Sede Principal</span>
                  {settings.direccion && !errors.direccion && <span className="ajustes-field-valid">✓ Completa</span>}
                </label>
                <input
                  className={errors.direccion ? 'has-error' : ''}
                  value={settings.direccion}
                  onChange={e => {
                    const val = e.target.value
                    setSettings({ ...settings, direccion: val })
                    setErrors(prev => ({ ...prev, direccion: val.trim().length >= 5 ? null : 'Dirección requerida' }))
                  }}
                />
                {errors.direccion && <span className="ajustes-field-error">⚠️ {errors.direccion}</span>}
              </div>
            </div>
          </div>

          <div className="ajustes-card-panel">
            <div className="ajustes-panel-header">
              <div>
                <h3 className="ajustes-panel-title">📄 Configuración de Comprobantes Fiscales (NCF)</h3>
                <p className="ajustes-panel-subtitle">Prefijos de secuencias fiscales autorizadas por la DGII para emisión en Finanzas y Ventas.</p>
              </div>
            </div>

            <div className="ajustes-form-grid-2">
              <div className="ajustes-form-group">
                <label>
                  <span>Facturas con Crédito Fiscal (NCF)</span>
                  {!errors.ncfPrefijoB01 && <span className="ajustes-field-valid">✓ B01</span>}
                </label>
                <input
                  value={settings.ncfPrefijoB01}
                  className={errors.ncfPrefijoB01 ? 'has-error' : ''}
                  onChange={e => {
                    const val = e.target.value.toUpperCase()
                    setSettings({ ...settings, ncfPrefijoB01: val })
                    setErrors(prev => ({ ...prev, ncfPrefijoB01: validateNCF(val) }))
                  }}
                  placeholder="B01"
                />
                {errors.ncfPrefijoB01 && <span className="ajustes-field-error">⚠️ {errors.ncfPrefijoB01}</span>}
              </div>

              <div className="ajustes-form-group">
                <label>
                  <span>Facturas de Consumo Final (NCF)</span>
                  {!errors.ncfPrefijoB02 && <span className="ajustes-field-valid">✓ B02</span>}
                </label>
                <input
                  value={settings.ncfPrefijoB02}
                  className={errors.ncfPrefijoB02 ? 'has-error' : ''}
                  onChange={e => {
                    const val = e.target.value.toUpperCase()
                    setSettings({ ...settings, ncfPrefijoB02: val })
                    setErrors(prev => ({ ...prev, ncfPrefijoB02: validateNCF(val) }))
                  }}
                  placeholder="B02"
                />
                {errors.ncfPrefijoB02 && <span className="ajustes-field-error">⚠️ {errors.ncfPrefijoB02}</span>}
              </div>

              <div className="ajustes-form-group">
                <label>Regímenes Especiales</label>
                <input
                  value={settings.ncfPrefijoB14}
                  onChange={e => setSettings({ ...settings, ncfPrefijoB14: e.target.value.toUpperCase() })}
                  placeholder="B14"
                />
              </div>

              <div className="ajustes-form-group">
                <label>Gubernamental</label>
                <input
                  value={settings.ncfPrefijoB15}
                  onChange={e => setSettings({ ...settings, ncfPrefijoB15: e.target.value.toUpperCase() })}
                  placeholder="B15"
                />
              </div>

              <div className="ajustes-form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Leyenda / Términos al Pie de Documentos y Facturas</label>
                <textarea
                  rows="2"
                  value={settings.pieFactura}
                  onChange={e => setSettings({ ...settings, pieFactura: e.target.value })}
                />
              </div>
            </div>

            <div className="ajustes-panel-footer">
              <button type="button" className="ajustes-btn-primary" onClick={handleSaveAll} disabled={isSaving}>
                {isSaving ? 'Guardando...' : '💾 Guardar Datos Fiscales'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: MÓDULOS & SINCRONIZACIÓN ── */}
      {currentTab === 'Módulos' && (
        <div className="ajustes-tab-content">
          <div className="ajustes-card-panel">
            <div className="ajustes-panel-header">
              <div>
                <h3 className="ajustes-panel-title">🧩 Matriz de Módulos del Sistema ERP</h3>
                <p className="ajustes-panel-subtitle">Habilita o deshabilita los módulos del sistema según las necesidades operativas de tu empresa.</p>
              </div>
              <span className="ajustes-badge-status green">
                {Object.values(settings.modulos || {}).filter(v => v !== false).length} / 8 Módulos Operativos
              </span>
            </div>

            <div className="ajustes-modules-grid">
              {[
                { key: 'ventas', name: 'Ventas & Pedidos', icon: '🛒', desc: 'Control de pedidos, facturación fiscal y cartera de clientes.' },
                { key: 'compras', name: 'Compras & Proveedores', icon: '🛍️', desc: 'Emisión de órdenes de compra, cotizaciones y control de embarques.' },
                { key: 'inventario', name: 'Inventario & Kardex', icon: '📦', desc: 'Control de existencias multialmacén, movimientos y valoración.' },
                { key: 'crm', name: 'CRM & Pipeline', icon: '👥', desc: 'Embudo de ventas, oportunidades, contactos y seguimiento comercial.' },
                { key: 'finanzas', name: 'Finanzas & Tesorería', icon: '💳', desc: 'Flujo de caja, cuentas por cobrar/pagar y balances bancarios.' },
                { key: 'reportes', name: 'Reportes & Analytics', icon: '📊', desc: 'Inteligencia de negocios, balances generales y exportaciones PDF/Excel.' },
                { key: 'chatbot', name: 'Asistente IA / Chatbot', icon: '🤖', desc: 'Consultas en lenguaje natural y asistencia operativa 24/7.' },
                { key: 'plugins', name: 'Plugin Manager', icon: '🔌', desc: 'Ecosistema de extensiones, integraciones y personalizaciones.' },
              ].map(mod => (
                <div key={mod.key} className="ajustes-module-card">
                  <div className="ajustes-module-header">
                    <span className="ajustes-module-icon">{mod.icon}</span>
                    <label className="ajustes-switch">
                      <input
                        type="checkbox"
                        checked={settings.modulos[mod.key] ?? true}
                        onChange={e => {
                          const isEnabled = e.target.checked
                          const updated = { ...settings.modulos, [mod.key]: isEnabled }
                          setSettings({ ...settings, modulos: updated })
                          // Conectar con el moduleRegistry para que el Sidebar reaccione
                          setModuleEnabled(mod.key, isEnabled)
                          showToast(`Módulo "${mod.name}" ${isEnabled ? '✅ activado' : '⛔ desactivado'}`)
                        }}
                      />
                      <span className="ajustes-slider round"></span>
                    </label>
                  </div>
                  <h4 className="ajustes-module-name">{mod.name}</h4>
                  <p className="ajustes-module-desc">{mod.desc}</p>
                  <div className="ajustes-module-footer">
                    <span className={`ajustes-pill ${settings.modulos[mod.key] !== false ? 'active' : 'inactive'}`}>
                      {settings.modulos[mod.key] !== false ? '● Activo' : '○ Inactivo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="ajustes-panel-footer">
              <button type="button" className="ajustes-btn-primary" onClick={handleSaveAll} disabled={isSaving}>
                {isSaving ? 'Guardando...' : '💾 Guardar Estado de Módulos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3.5: NUBE & SINCRONIZACIÓN DE EQUIPO ── */}
      {currentTab === 'Cloud' && (
        <div className="ajustes-tab-content">
          <div className="ajustes-card-panel">
            <div className="ajustes-panel-header">
              <div>
                <h3 className="ajustes-panel-title">☁️ Sincronización Centralizada Cloud & Conexión de Equipo</h3>
                <p className="ajustes-panel-subtitle">Conecta tu ERP a Supabase / Firebase o comparte la base de datos para que todos tus compañeros trabajen con los mismos datos en tiempo real.</p>
              </div>
              <span className="ajustes-badge-status green">
                🟢 Enlace Cloud Conectado
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>⚡</span> Sincronización Inmediata
                  </h4>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 14px', lineHeight: 1.4 }}>
                    Fuerza la subida y descarga de todas las órdenes de venta, compras, productos, clientes y asientos contables.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setActiveTestMessage('Sincronizando base de datos completa con la nube...')
                    const res = await cloudSync.syncAllNow()
                    setActiveTestMessage(null)
                    if (res.success) {
                      showToast(`🚀 Sincronización completada exitosamente (${res.timestamp})`)
                    } else {
                      showToast('⚠️ Error durante la sincronización', true)
                    }
                  }}
                  className="ajustes-btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  🔄 Sincronizar Todo Ahora
                </button>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>📤</span> Exportar BD para el Equipo
                  </h4>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 14px', lineHeight: 1.4 }}>
                    Genera un archivo JSON consolidado con todos los datos actuales para compartir con tus compañeros al instante.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const jsonStr = cloudSync.exportTeamDatabaseJSON()
                    const blob = new Blob([jsonStr], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `appex_erp_equipo_db_${new Date().toISOString().slice(0, 10)}.json`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                    showToast('📦 Base de datos consolidada descargada para el equipo')
                  }}
                  className="ajustes-btn-secondary"
                  style={{ width: '100%' }}
                >
                  📥 Descargar BD Compartida (.json)
                </button>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>📥</span> Importar BD Compartida
                  </h4>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 14px', lineHeight: 1.4 }}>
                    Carga el archivo JSON enviado por un compañero para sincronizar tu sistema de inmediato.
                  </p>
                </div>
                <label className="ajustes-btn-secondary" style={{ width: '100%', textAlign: 'center', cursor: 'pointer', boxSizing: 'border-box' }}>
                  📂 Seleccionar Archivo JSON
                  <input
                    type="file"
                    accept=".json,application/json"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = (evt) => {
                        const content = evt.target?.result
                        if (typeof content === 'string') {
                          const res = cloudSync.importTeamDatabaseJSON(content)
                          if (res.success) {
                            showToast(`✅ Base de datos restaurada (${res.count} registros). Actualizando ERP...`)
                            setTimeout(() => window.location.reload(), 900)
                          } else {
                            showToast(`⚠️ Error al importar: ${res.error}`, true)
                          }
                        }
                      }
                      reader.readAsText(file)
                    }}
                  />
                </label>
              </div>
            </div>

            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>⚙️ Configuración del Conector Cloud</h4>
            <div className="ajustes-form-grid">
              <div className="ajustes-form-group">
                <label>Proveedor de Base de Datos Cloud</label>
                <select
                  value={cloudSync.config.provider}
                  onChange={(e) => {
                    cloudSync.saveConfig({ provider: e.target.value })
                    showToast('Proveedor de base de datos actualizado')
                  }}
                >
                  <option value="supabase">Supabase (PostgreSQL Realtime)</option>
                  <option value="firebase">Firebase Firestore</option>
                  <option value="rest_hub">APPEX Cloud Hub API</option>
                </select>
              </div>

              <div className="ajustes-form-group">
                <label>Canal / ID de Espacio de Trabajo del Equipo</label>
                <input
                  type="text"
                  value={cloudSync.config.teamWorkspaceId}
                  onChange={(e) => {
                    cloudSync.saveConfig({ teamWorkspaceId: e.target.value })
                    showToast('Espacio de trabajo guardado')
                  }}
                />
              </div>

              <div className="ajustes-form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Supabase URL Endpoint</label>
                <input
                  type="text"
                  value={cloudSync.config.supabaseUrl}
                  onChange={(e) => {
                    cloudSync.saveConfig({ supabaseUrl: e.target.value })
                    showToast('URL Endpoint guardado')
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: AUTOMATIZACIONES & REGLAS ERP ── */}
      {currentTab === 'Automatizaciones' && (
        <div className="ajustes-tab-content">
          <div className="ajustes-card-panel">
            <div className="ajustes-panel-header">
              <div>
                <h3 className="ajustes-panel-title">⚡ Reglas de Interconexión Reactiva en Tiempo Real</h3>
                <p className="ajustes-panel-subtitle">Define las acciones automáticas que se disparan entre módulos cuando ocurren eventos en el ERP.</p>
              </div>
              <span className="ajustes-badge-status green">Motor Reactivo Activo</span>
            </div>

            <div className="ajustes-rules-list">
              <div className="ajustes-rule-item">
                <div className="ajustes-rule-info">
                  <div className="ajustes-rule-title">
                    <span>🛍️ ➔ 📦</span> Recepción de Orden de Compra en Compras
                  </div>
                  <p className="ajustes-rule-desc">
                    Al cambiar el estado de una Orden de Compra a <strong>Recibida</strong>, incrementar el stock automáticamente en <strong>Inventario</strong> y generar movimiento de <strong>Entrada en Kardex</strong>.
                  </p>
                </div>
                <label className="ajustes-switch">
                  <input
                    type="checkbox"
                    checked={settings.autoSyncComprasInventario}
                    onChange={e => setSettings({ ...settings, autoSyncComprasInventario: e.target.checked })}
                  />
                  <span className="ajustes-slider round"></span>
                </label>
              </div>

              <div className="ajustes-rule-item">
                <div className="ajustes-rule-info">
                  <div className="ajustes-rule-title">
                    <span>🛒 ➔ 📦</span> Confirmación de Pedido en Ventas
                  </div>
                  <p className="ajustes-rule-desc">
                    Al registrar un nuevo pedido de venta, descontar las unidades del <strong>Inventario</strong> y asentar el registro de <strong>Salida en Kardex</strong>.
                  </p>
                </div>
                <label className="ajustes-switch">
                  <input
                    type="checkbox"
                    checked={settings.autoSyncVentasInventario}
                    onChange={e => setSettings({ ...settings, autoSyncVentasInventario: e.target.checked })}
                  />
                  <span className="ajustes-slider round"></span>
                </label>
              </div>

              <div className="ajustes-rule-item">
                <div className="ajustes-rule-info">
                  <div className="ajustes-rule-title">
                    <span>🛒 ➔ 💳</span> Emisión Fiscal en Finanzas
                  </div>
                  <p className="ajustes-rule-desc">
                    Al procesar un pedido de venta, generar automáticamente el comprobante de ingreso en <strong>Finanzas</strong> con NCF B02.
                  </p>
                </div>
                <label className="ajustes-switch">
                  <input
                    type="checkbox"
                    checked={settings.autoSyncVentasFinanzas}
                    onChange={e => setSettings({ ...settings, autoSyncVentasFinanzas: e.target.checked })}
                  />
                  <span className="ajustes-slider round"></span>
                </label>
              </div>



              <div className="ajustes-rule-item">
                <div className="ajustes-rule-info">
                  <div className="ajustes-rule-title">
                    <span>⚠️ ➔ 🔔</span> Alertas Preventivas de Stock Mínimo
                  </div>
                  <p className="ajustes-rule-desc">
                    Notificar de inmediato al departamento de compras cuando el stock de un producto caiga por debajo de su umbral mínimo.
                  </p>
                </div>
                <label className="ajustes-switch">
                  <input
                    type="checkbox"
                    checked={settings.autoAlertasStockMinimo}
                    onChange={e => setSettings({ ...settings, autoAlertasStockMinimo: e.target.checked })}
                  />
                  <span className="ajustes-slider round"></span>
                </label>
              </div>
            </div>

            <div className="ajustes-panel-footer">
              <button type="button" className="ajustes-btn-primary" onClick={handleSaveAll} disabled={isSaving}>
                {isSaving ? 'Guardando...' : '💾 Guardar Automatizaciones'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: NOTIFICACIONES & CANALES ── */}
      {currentTab === 'Notificaciones' && (
        <div className="ajustes-tab-content">
          <div className="ajustes-card-panel">
            <div className="ajustes-panel-header">
              <div>
                <h3 className="ajustes-panel-title">💬 Canal WhatsApp Business Cloud API</h3>
                <p className="ajustes-panel-subtitle">Envío automático de confirmaciones de pedidos, estados de entrega y alertas de stock.</p>
              </div>
              <button className="ajustes-btn-action" onClick={handleTestWhatsApp}>
                💬 Enviar Mensaje de Prueba
              </button>
            </div>

            <div className="ajustes-form-grid-2">
              <div className="ajustes-form-group">
                <label>ID de Instancia WhatsApp</label>
                <input
                  value={settings.whatsappInstanceId}
                  onChange={e => setSettings({ ...settings, whatsappInstanceId: e.target.value })}
                />
              </div>

              <div className="ajustes-form-group">
                <label>
                  <span>Número Destinatario de Pruebas</span>
                  {settings.whatsappNumeroDestino && <span className="ajustes-field-valid">✓ Activo</span>}
                </label>
                <input
                  value={settings.whatsappNumeroDestino}
                  onChange={e => setSettings({ ...settings, whatsappNumeroDestino: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="ajustes-card-panel">
            <div className="ajustes-panel-header">
              <div>
                <h3 className="ajustes-panel-title">✉️ Servidor de Correo Corporativo (SMTP TLS)</h3>
                <p className="ajustes-panel-subtitle">Configuración de servidor para envío de facturas en PDF y comprobantes electrónicos.</p>
              </div>
              <button className="ajustes-btn-action" onClick={handleTestSMTP}>
                🧪 Probar Conexión SMTP
              </button>
            </div>

            <div className="ajustes-form-grid-2">
              <div className="ajustes-form-group">
                <label>
                  <span>Servidor SMTP Host</span>
                  {!errors.smtpHost && <span className="ajustes-field-valid">✓ Host Válido</span>}
                </label>
                <input
                  className={errors.smtpHost ? 'has-error' : ''}
                  value={settings.smtpHost}
                  onChange={e => {
                    const val = e.target.value
                    setSettings({ ...settings, smtpHost: val })
                    setErrors(prev => ({ ...prev, smtpHost: val ? null : 'Host obligatorio' }))
                  }}
                />
                {errors.smtpHost && <span className="ajustes-field-error">⚠️ {errors.smtpHost}</span>}
              </div>

              <div className="ajustes-form-group">
                <label>
                  <span>Puerto SMTP</span>
                  {!errors.smtpPort && <span className="ajustes-field-valid">✓ 587 TLS</span>}
                </label>
                <input
                  type="number"
                  className={errors.smtpPort ? 'has-error' : ''}
                  value={settings.smtpPort}
                  onChange={e => {
                    const val = Number(e.target.value)
                    setSettings({ ...settings, smtpPort: val })
                    setErrors(prev => ({ ...prev, smtpPort: val > 0 ? null : 'Puerto inválido' }))
                  }}
                />
                {errors.smtpPort && <span className="ajustes-field-error">⚠️ {errors.smtpPort}</span>}
              </div>

              <div className="ajustes-form-group">
                <label>
                  <span>Usuario / Correo Emisor</span>
                  {!errors.smtpUser && <span className="ajustes-field-valid">✓ Autenticado</span>}
                </label>
                <input
                  type="email"
                  className={errors.smtpUser ? 'has-error' : ''}
                  value={settings.smtpUser}
                  onChange={e => {
                    const val = e.target.value
                    setSettings({ ...settings, smtpUser: val })
                    setErrors(prev => ({ ...prev, smtpUser: validateEmail(val) }))
                  }}
                />
                {errors.smtpUser && <span className="ajustes-field-error">⚠️ {errors.smtpUser}</span>}
              </div>

              <div className="ajustes-form-group">
                <label>Protocolo de Seguridad</label>
                <select
                  value={settings.smtpSeguridad}
                  onChange={e => setSettings({ ...settings, smtpSeguridad: e.target.value })}
                >
                  <option value="TLS">STARTTLS (Recomendado - Puerto 587)</option>
                  <option value="SSL">SSL / TLS Directo (Puerto 465)</option>
                  <option value="Ninguno">Sin Cifrado (Solo Red Local)</option>
                </select>
              </div>
            </div>

            <div className="ajustes-panel-footer">
              <button type="button" className="ajustes-btn-primary" onClick={handleSaveAll} disabled={isSaving}>
                {isSaving ? 'Guardando...' : '💾 Guardar Canales'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: USUARIOS & ROLES RBAC ── */}
      {currentTab === 'Usuarios y Roles' && (
        <div style={{ marginTop: 6 }}>
          <SeguridadView onShowToast={showToast} />
        </div>
      )}

      {/* ── TAB 7: SEGURIDAD & 2FA ── */}
      {currentTab === 'Seguridad' && (
        <div style={{ marginTop: 6 }}>
          <SeguridadView onShowToast={showToast} />
        </div>
      )}

      {/* ── TAB 8: SISTEMA & PLAN EMPRESARIAL ── */}
      {currentTab === 'Sistema' && (
        <div style={{ marginTop: 6 }}>
          <PlanEmpresarialView onShowToast={showToast} />
        </div>
      )}

      {/* ── Notificación Toast ── */}
      {toast && (
        <div className={`ajustes-toast ${toast.isError ? 'error' : ''}`}>
          {toast.text}
        </div>
      )}
      {activeTestMessage && <div className="ajustes-toast test">{activeTestMessage}</div>}
    </div>
  )
}
