import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SeguridadView } from '../components/SeguridadView'
import { PlanEmpresarialView } from '../components/PlanEmpresarialView'
import './AjustesHome.css'

const TABS = [
  'General',
  'Empresa',
  'Módulos',
  'Usuarios y Roles',
  'Seguridad',
  'Notificaciones',
  'Automatizaciones',
  'Sistema',
]

const SETTINGS_SECTIONS = [
  {
    category: 'Configuración General',
    tab: 'General',
    items: [
      {
        id: 'pref_gen',
        icon: '⚙️',
        iconBg: '#EEF2FF',
        name: 'Preferencias Generales',
        desc: 'Configuración básica del sistema, idioma, moneda y zona horaria.',
        fields: [
          { label: 'Idioma del Sistema', type: 'select', options: ['Español (República Dominicana)', 'English (US)', 'Français'] },
          { label: 'Moneda Principal', type: 'select', options: ['RD$ - Peso Dominicano', 'USD - Dólar Estadounidense', 'EUR - Euro'] },
          { label: 'Zona Horaria', type: 'select', options: ['(GMT-04:00) Santo Domingo / La Paz', '(GMT-05:00) Bogotá / Lima', '(GMT-03:00) Buenos Aires'] },
        ]
      },
      {
        id: 'apariencia',
        icon: '🎨',
        iconBg: '#ECFDF5',
        name: 'Apariencia',
        desc: 'Personaliza la apariencia del sistema, tema, colores y logotipo.',
        fields: [
          { label: 'Tema de la Interfaz', type: 'select', options: ['Claro (Por defecto)', 'Oscuro', 'Automático según el sistema'] },
          { label: 'Color de Acento', type: 'select', options: ['Azul Real (#2563EB)', 'Índigo (#4F46E5)', 'Esmeralda (#10B981)', 'Púrpura (#8B5CF6)'] },
          { label: 'Densidad de Información', type: 'select', options: ['Cómoda (Recomendada)', 'Compacta'] },
        ]
      },
      {
        id: 'regionales',
        icon: '🌐',
        iconBg: '#EFF6FF',
        name: 'Regionales',
        desc: 'Configuración de idioma, formatos de fecha, hora y números.',
        fields: [
          { label: 'Formato de Fecha', type: 'select', options: ['DD/MM/YYYY (Ej: 30/05/2025)', 'MM/DD/YYYY', 'YYYY-MM-DD'] },
          { label: 'Separador Decimal', type: 'select', options: ['Punto (.) y Coma para miles', 'Coma (,) y Punto para miles'] },
          { label: 'Primer día de la semana', type: 'select', options: ['Lunes', 'Domingo'] },
        ]
      },
      {
        id: 'correos',
        icon: '✉️',
        iconBg: '#FFFBEB',
        name: 'Correos Electrónicos',
        desc: 'Configura el servidor SMTP, plantillas y preferencias de correo.',
        fields: [
          { label: 'Servidor SMTP', type: 'text', placeholder: 'smtp.appex-erp.com.do' },
          { label: 'Puerto SMTP', type: 'text', placeholder: '587' },
          { label: 'Correo Remitente', type: 'text', placeholder: 'notificaciones@appex.do' },
        ]
      },
      {
        id: 'documentos',
        icon: '📄',
        iconBg: '#FAF5FF',
        name: 'Documentos',
        desc: 'Numeración, plantillas, series y formatos de documentos.',
        fields: [
          { label: 'Prefijo de Facturas (NCF)', type: 'text', placeholder: 'B01, B02, B14, B15' },
          { label: 'Pie de Página en PDFs', type: 'textarea', placeholder: 'Gracias por su preferencia. RNC: 1-32-45678-9' },
        ]
      },
    ]
  },
  {
    category: 'Gestión de la Empresa',
    tab: 'Empresa',
    items: [
      {
        id: 'info_empresa',
        icon: '🏢',
        iconBg: '#EEF2FF',
        name: 'Información de la Empresa',
        desc: 'Datos generales, dirección, contacto e información fiscal.',
        fields: [
          { label: 'Razón Social', type: 'text', placeholder: 'APPEX Dominicana SRL' },
          { label: 'RNC / Cédula', type: 'text', placeholder: '1-31-89023-4' },
          { label: 'Teléfono Principal', type: 'text', placeholder: '(809) 555-0100' },
          { label: 'Dirección Fiscal', type: 'text', placeholder: 'Av. Winston Churchill #1099, Santo Domingo' },
        ]
      },
      {
        id: 'sucursales',
        icon: '📍',
        iconBg: '#ECFDF5',
        name: 'Sucursales',
        desc: 'Administra las sucursales y centros de operación.',
        fields: [
          { label: 'Sucursal Principal', type: 'text', placeholder: 'Sede Central - Santo Domingo' },
          { label: 'Sucursales Secundarias', type: 'textarea', placeholder: 'Sucursal Norte (Santiago)\nSucursal Este (Punta Cana)' },
        ]
      },
      {
        id: 'almacenes',
        icon: '📦',
        iconBg: '#FFFBEB',
        name: 'Almacenes',
        desc: 'Configura y gestiona los almacenes y ubicaciones.',
        fields: [
          { label: 'Almacén por defecto para Ventas', type: 'select', options: ['Almacén Principal', 'Sucursal Norte', 'Sucursal Este'] },
          { label: 'Permitir Stock Negativo', type: 'select', options: ['No (Bloquear venta si no hay stock)', 'Sí (Con advertencia)'] },
        ]
      },
      {
        id: 'departamentos',
        icon: '👥',
        iconBg: '#FAF5FF',
        name: 'Departamentos',
        desc: 'Administra los departamentos de la organización.',
        fields: [
          { label: 'Departamentos Registrados', type: 'textarea', placeholder: 'Ventas\nCompras\nTecnología\nRecursos Humanos\nFinanzas y Contabilidad' },
        ]
      },
      {
        id: 'centros_costo',
        icon: '💲',
        iconBg: '#ECFDF5',
        name: 'Centros de Costo',
        desc: 'Define y organiza los centros de costo de la empresa.',
        fields: [
          { label: 'Centro de Costo Principal', type: 'text', placeholder: 'CC-01 Operaciones Centrales' },
          { label: 'Habilitar imputación obligatoria en gastos', type: 'select', options: ['Sí', 'No'] },
        ]
      },
    ]
  },
  {
    category: 'Configuración de Módulos',
    tab: 'Módulos',
    items: [
      {
        id: 'mod_ventas',
        icon: '🛒',
        iconBg: '#EEF2FF',
        name: 'Ventas',
        desc: 'Configura documentos, impuestos, descuentos y comisiones.',
        fields: [
          { label: 'Tasa de ITBIS / IVA (%)', type: 'text', placeholder: '18.00' },
          { label: 'Límite de Descuento sin Autorización (%)', type: 'text', placeholder: '10.00' },
          { label: 'Estado Inicial de Nuevos Pedidos', type: 'select', options: ['Pendiente', 'Confirmado'] },
        ]
      },
      {
        id: 'mod_compras',
        icon: '🛍️',
        iconBg: '#EFF6FF',
        name: 'Compras',
        desc: 'Configura órdenes, recepción, impuestos y pagos.',
        fields: [
          { label: 'Requiere Aprobación para Compras mayores a', type: 'text', placeholder: 'RD$ 50,000.00' },
          { label: 'Alerta automática al recibir mercancía', type: 'select', options: ['Activada', 'Desactivada'] },
        ]
      },
      {
        id: 'mod_inventario',
        icon: '📦',
        iconBg: '#ECFDF5',
        name: 'Inventario',
        desc: 'Ajustes de stock, valuación, movimientos y alertas.',
        fields: [
          { label: 'Método de Valuación', type: 'select', options: ['Promedio Ponderado (Recomendado)', 'FIFO (Primeras Entradas, Primeras Salidas)', 'LIFO'] },
          { label: 'Alerta de Stock Mínimo', type: 'select', options: ['Notificar inmediatamente al llegar al umbral', 'Solo en resumen diario'] },
        ]
      },
      {
        id: 'mod_finanzas',
        icon: '💰',
        iconBg: '#FFFBEB',
        name: 'Finanzas',
        desc: 'Configura bancos, cuentas, métodos de pago y transferencias.',
        fields: [
          { label: 'Cuenta Bancaria Principal', type: 'text', placeholder: 'Banco Popular Dominicano - Cta #798234123' },
          { label: 'Control de Caja Chica diario', type: 'select', options: ['Obligatorio con arqueo al cierre', 'Opcional'] },
        ]
      },
      {
        id: 'mod_contabilidad',
        icon: '📑',
        iconBg: '#EEF2FF',
        name: 'Contabilidad',
        desc: 'Plan de cuentas, asientos, períodos y cierres contables.',
        fields: [
          { label: 'Estructura del Catálogo de Cuentas', type: 'select', options: ['Estándar DGII (República Dominicana)', 'NIIF para PYMES'] },
          { label: 'Generación automática de asientos en Ventas/Compras', type: 'select', options: ['Automática en tiempo real', 'Manual por lotes'] },
        ]
      },
    ]
  },
  {
    category: 'Usuarios y Seguridad',
    tab: 'Usuarios y Roles',
    items: [
      {
        id: 'usuarios',
        icon: '👤',
        iconBg: '#EFF6FF',
        name: 'Usuarios',
        desc: 'Gestiona usuarios del sistema y permisos de acceso.',
        fields: [
          { label: 'Total de Usuarios Activos', type: 'text', placeholder: '12 usuarios' },
          { label: 'Política de Contraseñas', type: 'select', options: ['Segura (Mínimo 8 caracteres, números y símbolos)', 'Estándar'] },
        ]
      },
      {
        id: 'roles_permisos',
        icon: '🛡️',
        iconBg: '#ECFDF5',
        name: 'Roles y Permisos',
        desc: 'Define roles y permisos por módulo y función.',
        fields: [
          { label: 'Roles Disponibles', type: 'textarea', placeholder: 'Admin (Acceso Total)\nVentas (Facturación y Clientes)\nCompras (Órdenes y Proveedores)\nRRHH (Personal y Nómina)\nAuditor (Solo Lectura)' },
        ]
      },
      {
        id: 'seguridad_acceso',
        icon: '🔒',
        iconBg: '#FFFBEB',
        name: 'Seguridad',
        desc: 'Políticas de contraseñas, sesiones y autenticación.',
        fields: [
          { label: 'Autenticación de Dos Factores (2FA)', type: 'select', options: ['Opcional', 'Obligatoria para Administradores', 'Desactivada'] },
          { label: 'Tiempo de Inactividad para Cerrar Sesión', type: 'select', options: ['30 minutos', '1 hora', '4 horas', 'Nunca'] },
        ]
      },
      {
        id: 'actividades_log',
        icon: '🔄',
        iconBg: '#EEF2FF',
        name: 'Actividades',
        desc: 'Historial de accesos y actividades en el sistema.',
        fields: [
          { label: 'Registro de Auditoría', type: 'select', options: ['Completo (Todas las acciones CRUD)', 'Solo inicios de sesión y cambios críticos'] },
        ]
      },
    ]
  },
  {
    category: 'Automatización y Comunicación',
    tab: 'Automatizaciones',
    items: [
      {
        id: 'notificaciones',
        icon: '🔔',
        iconBg: '#FFFBEB',
        name: 'Notificaciones',
        desc: 'Configura notificaciones del sistema y alertas.',
        fields: [
          { label: 'Canales de Notificación', type: 'select', options: ['En la aplicación y por Correo', 'Solo en la aplicación', 'Correo y WhatsApp'] },
        ]
      },
      {
        id: 'flujos_trabajo',
        icon: '🔀',
        iconBg: '#FAF5FF',
        name: 'Flujos de Trabajo',
        desc: 'Automatiza procesos y aprobaciones.',
        fields: [
          { label: 'Motor de Flujos', type: 'select', options: ['n8n Webhook Integrado', 'Motor Nativo ERP'] },
        ]
      },
      {
        id: 'integraciones_conf',
        icon: '🔗',
        iconBg: '#EFF6FF',
        name: 'Integraciones',
        desc: 'Conecta con aplicaciones y servicios externos.',
        fields: [
          { label: 'WhatsApp Business API', type: 'select', options: ['Conectado', 'Desconectado'] },
          { label: 'Meta Ads Webhook', type: 'text', placeholder: 'https://api.appex.do/webhooks/meta' },
        ]
      },
      {
        id: 'respaldos',
        icon: '☁️',
        iconBg: '#ECFDF5',
        name: 'Respaldos',
        desc: 'Configura respaldos automáticos y programados.',
        fields: [
          { label: 'Frecuencia de Respaldo', type: 'select', options: ['Diario a las 02:00 AM', 'Semanal', 'Manual'] },
          { label: 'Almacenamiento de Copias', type: 'select', options: ['Local + Nube Cifrada', 'Solo Servidor Local'] },
        ]
      },
      {
        id: 'import_export',
        icon: '⇅',
        iconBg: '#EEF2FF',
        name: 'Importar / Exportar',
        desc: 'Importa y exporta datos del sistema.',
        fields: [
          { label: 'Formato de Exportación Masiva', type: 'select', options: ['Excel (.xlsx)', 'CSV UTF-8', 'JSON Backup'] },
        ]
      },
    ]
  },
  {
    category: 'Sistema',
    tab: 'Sistema',
    items: [
      {
        id: 'info_sistema',
        icon: '💻',
        iconBg: '#EFF6FF',
        name: 'Información del Sistema',
        desc: 'Detalles de la versión y estado del sistema.',
        fields: [
          { label: 'Versión del ERP', type: 'text', placeholder: 'appes.erp v2.4.0 (Build 2026-08)' },
          { label: 'Base de Datos', type: 'text', placeholder: 'SQLite / EF Core (Conectado)' },
        ]
      },
      {
        id: 'licencia',
        icon: '🎖️',
        iconBg: '#ECFDF5',
        name: 'Licencia',
        desc: 'Información de la licencia y módulos activos.',
        fields: [
          { label: 'Plan Activo', type: 'text', placeholder: 'Plan Empresarial Avanzado (Ilimitado)' },
          { label: 'Vencimiento', type: 'text', placeholder: '31 de Diciembre, 2026' },
        ]
      },
      {
        id: 'mantenimiento',
        icon: '🛠️',
        iconBg: '#FFFBEB',
        name: 'Mantenimiento',
        desc: 'Herramientas de mantenimiento y diagnóstico.',
        fields: [
          { label: 'Optimizar Base de Datos', type: 'select', options: ['Ejecutar VACUUM y limpieza de caché', 'Comprobar integridad'] },
        ]
      },
      {
        id: 'logs_sistema',
        icon: '📋',
        iconBg: '#FAF5FF',
        name: 'Registros del Sistema',
        desc: 'Logs del sistema y registros de errores.',
        fields: [
          { label: 'Nivel de Logging', type: 'select', options: ['Information (Recomendado)', 'Debug', 'Warning & Error Only'] },
        ]
      },
    ]
  }
]

export function AjustesHome() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'General')
  const [search, setSearch] = useState('')
  const [activeModal, setActiveModal] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (tabFromUrl && TABS.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Filtrar secciones según la pestaña o la búsqueda
  const filteredSections = useMemo(() => {
    return SETTINGS_SECTIONS.map((section) => {
      let items = section.items

      if (search.trim()) {
        items = items.filter(
          (item) =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.desc.toLowerCase().includes(search.toLowerCase())
        )
      } else if (activeTab !== 'General') {
        if (section.tab !== activeTab) {
          return null
        }
      }

      if (items.length === 0) return null
      return { ...section, items }
    }).filter(Boolean)
  }, [activeTab, search])

  const handleSaveSetting = (e) => {
    e.preventDefault()
    showToast(`Configuración de "${activeModal.name}" guardada con éxito ✅`)
    setActiveModal(null)
  }

  const handleResetPreferences = () => {
    showToast('Preferencias restablecidas a los valores por defecto 🔄')
  }

  return (
    <div className="ajustes-page">
      {/* ── Encabezado ── */}
      <div className="ajustes-header">
        <div className="ajustes-header-left">
          <div className="ajustes-icon-box">⚙️</div>
          <div>
            <h1 className="ajustes-title">Ajustes & Seguridad</h1>
            <p className="ajustes-subtitle">Configura y personaliza tu sistema ERP y administra la seguridad y accesos.</p>
          </div>
        </div>

        <div className="ajustes-header-actions">
          <div className="ajustes-search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Buscar en ajustes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="ajustes-reset-btn" onClick={handleResetPreferences}>
            <span>🔄</span> Restablecer preferencias
          </button>
        </div>
      </div>

      {/* ── Pestañas de Navegación ── */}
      <div className="ajustes-tabs-bar">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`ajustes-tab-btn ${activeTab === tab && !search ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab)
              setSearchParams({ tab })
              setSearch('')
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* RENDERIZADO ESPECIAL PARA SEGURIDAD Y USUARIOS/ROLES */}
      {(activeTab === 'Seguridad' || activeTab === 'Usuarios y Roles') && !search ? (
        <div style={{ marginTop: 20 }}>
          <SeguridadView onShowToast={showToast} />
        </div>
      ) : activeTab === 'Sistema' && !search ? (
        <div style={{ marginTop: 20 }}>
          <PlanEmpresarialView onShowToast={showToast} />
        </div>
      ) : (
        /* ── Secciones de Ajustes ── */
        <div className="ajustes-sections">
          {filteredSections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
              <p style={{ fontSize: 16 }}>No se encontraron configuraciones para "{search}"</p>
            </div>
          ) : (
            filteredSections.map((section) => (
              <div key={section.category} className="ajustes-section-block">
                <h2 className="ajustes-section-title">{section.category}</h2>
                <div className="ajustes-cards-grid">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className="ajustes-card"
                      onClick={() => setActiveModal(item)}
                    >
                      <div
                        className="ajustes-card-icon-wrap"
                        style={{ background: item.iconBg }}
                      >
                        {item.icon}
                      </div>
                      <div className="ajustes-card-content">
                        <h3 className="ajustes-card-name">{item.name}</h3>
                        <p className="ajustes-card-desc">{item.desc}</p>
                      </div>
                      <span className="ajustes-card-arrow">›</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Modal de Configuración Interactiva ── */}
      {activeModal && (
        <div className="ajustes-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="ajustes-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ajustes-modal-header">
              <div className="ajustes-modal-header-left">
                <div
                  className="ajustes-card-icon-wrap"
                  style={{ background: activeModal.iconBg, width: 36, height: 36, fontSize: 16 }}
                >
                  {activeModal.icon}
                </div>
                <h3 className="ajustes-modal-title">{activeModal.name}</h3>
              </div>
              <button
                className="ajustes-modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSetting}>
              <div className="ajustes-modal-body">
                <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                  {activeModal.desc}
                </p>

                {activeModal.fields?.map((f, i) => (
                  <div key={i} className="ajustes-form-group">
                    <label>{f.label}</label>
                    {f.type === 'select' ? (
                      <select defaultValue={f.options[0]}>
                        {f.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : f.type === 'textarea' ? (
                      <textarea rows={3} placeholder={f.placeholder} defaultValue={f.placeholder} />
                    ) : (
                      <input type="text" placeholder={f.placeholder} defaultValue={f.placeholder} />
                    )}
                  </div>
                ))}
              </div>

              <div className="ajustes-modal-footer">
                <button
                  type="button"
                  className="ajustes-btn-cancel"
                  onClick={() => setActiveModal(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="ajustes-btn-save">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast de Confirmación ── */}
      {toast && <div className="ajustes-toast">{toast}</div>}
    </div>
  )
}
