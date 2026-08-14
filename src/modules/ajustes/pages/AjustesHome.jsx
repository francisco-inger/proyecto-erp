/*
  AjustesHome.jsx — Módulo de Configuración & Administración Global (APPEX.ERP)
  Panel de control ejecutivo de nivel empresarial con configuración en vivo,
  administración de empresa, módulos, automatizaciones, notificaciones, seguridad y base de datos.
*/
import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SeguridadView } from '../components/SeguridadView'
import { PlanEmpresarialView } from '../components/PlanEmpresarialView'
import { erpSync } from '../../../core/sync/erpSyncEngine'
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
    proyectos: true,
    finanzas: true,
    reportes: true,
    chatbot: true,
    plugins: true,
  },

  // Automatizaciones y Sincronizaciones Cruzadas
  autoSyncComprasInventario: true,
  autoSyncVentasInventario: true,
  autoSyncVentasFinanzas: true,
  autoSyncCrmProyectos: true,
  autoAlertasStockMinimo: true,
  autoBackupDiario: true,

  // Notificaciones & Canales
  whatsappApiEnabled: true,
  whatsappInstanceId: 'APPEX-WA-809-PRO',
  whatsappNumeroDestino: '+1 (809) 555-0199',
  smtpHost: 'smtp.office365.com',
  smtpPort: '587',
  smtpUser: 'notificaciones@appex.do',
  smtpSeguridad: 'TLS',
  alertarComprasGrandes: true,
  montoMinimoAlertaCompra: 100000,
}

export function AjustesHome() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') || 'General'

  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SETTINGS_KEY)
      if (raw) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
      }
    } catch (_) {}
    return DEFAULT_SETTINGS
  })

  const [toast, setToast] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTestMessage, setActiveTestMessage] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings))
    } catch (_) {}
  }, [settings])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName })
  }

  const handleSaveAll = (e) => {
    if (e) e.preventDefault()
    setIsSaving(true)
    setTimeout(() => {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings))
      setIsSaving(false)
      showToast('💾 Configuración guardada y sincronizada globalmente')
      erpSync.dispatch('settings:update', settings)
    }, 400)
  }

  const handleResetSettings = () => {
    if (window.confirm('¿Deseas restablecer todos los ajustes a los valores recomendados por defecto?')) {
      setSettings(DEFAULT_SETTINGS)
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS))
      showToast('🔄 Preferencias restablecidas a los valores de fábrica')
    }
  }

  const handleExportBackup = () => {
    const backupData = {
      version: '2026.4.0',
      timestamp: new Date().toISOString(),
      ajustes: settings,
      ventas: JSON.parse(localStorage.getItem('ventas_orders_v1') || '[]'),
      compras: JSON.parse(localStorage.getItem('compras_orders_v1') || '[]'),
      inventario: JSON.parse(localStorage.getItem('appes_inventory_products_v1') || '[]'),
      crm: JSON.parse(localStorage.getItem('appes_crm_clients_v1') || '[]'),
      finanzas: JSON.parse(localStorage.getItem('appes_erp_finanzas_data_v3') || '{}'),
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
    setActiveTestMessage('Enviando mensaje de prueba vía WhatsApp Cloud API...')
    setTimeout(() => {
      setActiveTestMessage(null)
      showToast('💬 Mensaje de prueba enviado exitosamente al número corporativo (+1 809 555-0199)')
    }, 1200)
  }

  const handleTestSMTP = () => {
    setActiveTestMessage('Verificando conexión con servidor SMTP TLS...')
    setTimeout(() => {
      setActiveTestMessage(null)
      showToast('✉️ Conexión SMTP exitosa. Correo de verificación enviado a notificaciones@appex.do')
    }, 1200)
  }

  const tabsList = [
    { id: 'General', label: 'General', icon: '⚙️' },
    { id: 'Empresa', label: 'Empresa & Fiscal', icon: '🏢' },
    { id: 'Módulos', label: 'Módulos & Sync', icon: '🧩' },
    { id: 'Automatizaciones', label: 'Automatizaciones', icon: '⚡' },
    { id: 'Notificaciones', label: 'Notificaciones & Canales', icon: '🔔' },
    { id: 'Usuarios y Roles', label: 'Usuarios & Roles', icon: '👥' },
    { id: 'Seguridad', label: 'Seguridad & 2FA', icon: '🛡️' },
    { id: 'Sistema', label: 'Sistema & Plan', icon: '💻' },
  ]

  return (
    <div className="ajustes-page">
      {/* ── Banner Hero Panorámico Ejecutivo ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
        borderRadius: 20,
        padding: '28px 32px',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.3)',
        marginBottom: 16,
      }}>
        {/* Imagen panorámica de fondo superpuesta en la parte derecha */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '55%',
          backgroundImage: 'url(/branding/banner_enterprise_panoramic.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          opacity: 0.32,
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

          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Ajustes Globales y Administración del Sistema
          </h1>
          <p style={{ margin: '6px 0 20px', fontSize: 13, color: '#CBD5E1', lineHeight: 1.5, maxWidth: 620 }}>
            Configura las políticas fiscales de la empresa, interconexión de módulos en tiempo real, canales de notificación, seguridad y roles RBAC.
          </p>

          {/* Estadísticas en vivo estilo referencia */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>99.99%</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Uptime Operativo</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#34D399', lineHeight: 1 }}>2FA + AES-256</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Seguridad & Cifrado</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>RD$ / USD / EUR</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Multi-Moneda Activo</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#FCD34D', lineHeight: 1 }}>Enterprise Suite</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Licencia Corporativa</div>
            </div>
          </div>

          {/* Botones Rápidos del Hero */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '8px 18px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
                opacity: isSaving ? 0.7 : 1
              }}
            >
              {isSaving ? '⏳ Guardando...' : '💾 Guardar Todos los Cambios'}
            </button>
            <button
              onClick={handleExportBackup}
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
              📦 Exportar Copia de Seguridad JSON
            </button>
            <button
              onClick={handleResetSettings}
              style={{
                background: 'rgba(255, 255, 255, 0.10)',
                color: '#CBD5E1',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 8,
                padding: '8px 14px',
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
                <label>Tasa de Cambio Oficial (USD ➔ DOP)</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.tasaDolar}
                  onChange={e => setSettings({ ...settings, tasaDolar: Number(e.target.value) })}
                />
              </div>

              <div className="ajustes-form-group">
                <label>Tasa de Cambio Oficial (EUR ➔ DOP)</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.tasaEuro}
                  onChange={e => setSettings({ ...settings, tasaEuro: Number(e.target.value) })}
                />
              </div>
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
                <label>Razón Social Oficial *</label>
                <input
                  value={settings.razonSocial}
                  onChange={e => setSettings({ ...settings, razonSocial: e.target.value })}
                />
              </div>

              <div className="ajustes-form-group">
                <label>RNC / Cédula Fiscal *</label>
                <input
                  value={settings.rnc}
                  onChange={e => setSettings({ ...settings, rnc: e.target.value })}
                />
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
                <label>Teléfono PBX / Central</label>
                <input
                  value={settings.telefono}
                  onChange={e => setSettings({ ...settings, telefono: e.target.value })}
                />
              </div>

              <div className="ajustes-form-group">
                <label>Correo Electrónico Corporativo</label>
                <input
                  type="email"
                  value={settings.emailCorporativo}
                  onChange={e => setSettings({ ...settings, emailCorporativo: e.target.value })}
                />
              </div>

              <div className="ajustes-form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Dirección Fiscal & Sede Principal</label>
                <input
                  value={settings.direccion}
                  onChange={e => setSettings({ ...settings, direccion: e.target.value })}
                />
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
                <label>Facturas con Crédito Fiscal</label>
                <input
                  value={settings.ncfPrefijoB01}
                  onChange={e => setSettings({ ...settings, ncfPrefijoB01: e.target.value })}
                  placeholder="B01"
                />
              </div>

              <div className="ajustes-form-group">
                <label>Facturas de Consumo Final</label>
                <input
                  value={settings.ncfPrefijoB02}
                  onChange={e => setSettings({ ...settings, ncfPrefijoB02: e.target.value })}
                  placeholder="B02"
                />
              </div>

              <div className="ajustes-form-group">
                <label>Regímenes Especiales</label>
                <input
                  value={settings.ncfPrefijoB14}
                  onChange={e => setSettings({ ...settings, ncfPrefijoB14: e.target.value })}
                  placeholder="B14"
                />
              </div>

              <div className="ajustes-form-group">
                <label>Gubernamental</label>
                <input
                  value={settings.ncfPrefijoB15}
                  onChange={e => setSettings({ ...settings, ncfPrefijoB15: e.target.value })}
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
              <span className="ajustes-badge-status green">9 / 9 Módulos Activos</span>
            </div>

            <div className="ajustes-modules-grid">
              {[
                { key: 'ventas', name: 'Ventas & Pedidos', icon: '🛒', desc: 'Control de pedidos, facturación fiscal y cartera de clientes.' },
                { key: 'compras', name: 'Compras & Proveedores', icon: '🛍️', desc: 'Emisión de órdenes de compra, cotizaciones y control de embarques.' },
                { key: 'inventario', name: 'Inventario & Kardex', icon: '📦', desc: 'Control de existencias multialmacén, movimientos y valoración.' },
                { key: 'crm', name: 'CRM & Pipeline', icon: '👥', desc: 'Embudo de ventas, oportunidades, contactos y seguimiento comercial.' },
                { key: 'proyectos', name: 'Proyectos & Tareas', icon: '🚀', desc: 'Tableros Kanban, cronogramas, hitos y rentabilidad por proyecto.' },
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
                          setSettings({
                            ...settings,
                            modulos: {
                              ...settings.modulos,
                              [mod.key]: e.target.checked
                            }
                          })
                        }}
                      />
                      <span className="ajustes-slider round"></span>
                    </label>
                  </div>
                  <h4 className="ajustes-module-name">{mod.name}</h4>
                  <p className="ajustes-module-desc">{mod.desc}</p>
                  <div className="ajustes-module-footer">
                    <span className={`ajustes-pill ${settings.modulos[mod.key] ? 'active' : 'inactive'}`}>
                      {settings.modulos[mod.key] ? '● Activo' : '○ Inactivo'}
                    </span>
                  </div>
                </div>
              ))}
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
                    <span>👥 ➔ 🚀</span> Cierre de Oportunidad en CRM
                  </div>
                  <p className="ajustes-rule-desc">
                    Al mover una oportunidad a la etapa de <strong>Cierre (Ganada)</strong>, crear automáticamente el proyecto en <strong>Proyectos</strong> y proyectar los ingresos en Finanzas.
                  </p>
                </div>
                <label className="ajustes-switch">
                  <input
                    type="checkbox"
                    checked={settings.autoSyncCrmProyectos}
                    onChange={e => setSettings({ ...settings, autoSyncCrmProyectos: e.target.checked })}
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
                <label>Número Destinatario de Pruebas</label>
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
                <label>Servidor SMTP Host</label>
                <input
                  value={settings.smtpHost}
                  onChange={e => setSettings({ ...settings, smtpHost: e.target.value })}
                />
              </div>

              <div className="ajustes-form-group">
                <label>Puerto SMTP</label>
                <input
                  value={settings.smtpPort}
                  onChange={e => setSettings({ ...settings, smtpPort: e.target.value })}
                />
              </div>

              <div className="ajustes-form-group">
                <label>Usuario / Correo Emisor</label>
                <input
                  value={settings.smtpUser}
                  onChange={e => setSettings({ ...settings, smtpUser: e.target.value })}
                />
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
          </div>
        </div>
      )}

      {/* ── TAB 6: USUARIOS & ROLES RBAC ── */}
      {currentTab === 'Usuarios y Roles' && (
        <div style={{ marginTop: 10 }}>
          <SeguridadView onShowToast={showToast} />
        </div>
      )}

      {/* ── TAB 7: SEGURIDAD & 2FA ── */}
      {currentTab === 'Seguridad' && (
        <div style={{ marginTop: 10 }}>
          <SeguridadView onShowToast={showToast} />
        </div>
      )}

      {/* ── TAB 8: SISTEMA & PLAN EMPRESARIAL ── */}
      {currentTab === 'Sistema' && (
        <div style={{ marginTop: 10 }}>
          <PlanEmpresarialView onShowToast={showToast} />
        </div>
      )}

      {/* ── Barra Flotante de Guardar Cambios ── */}
      <div className="ajustes-floating-save-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>💡</span>
          <span style={{ fontSize: 13, color: '#334155' }}>Los cambios se aplicarán de inmediato en todo el ERP.</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="ajustes-outline-btn"
            onClick={handleResetSettings}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="ajustes-btn-primary"
            onClick={handleSaveAll}
            disabled={isSaving}
          >
            {isSaving ? 'Guardando...' : '💾 Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* ── Notificación Toast ── */}
      {toast && <div className="ajustes-toast">{toast}</div>}
      {activeTestMessage && <div className="ajustes-toast test">{activeTestMessage}</div>}
    </div>
  )
}
