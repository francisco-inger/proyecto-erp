import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { canAccess } from '../rbac/permissions'
import { getEnabledModules } from '../moduleRegistry'
import { getEmpresaActiva } from '../utils/formatters'
import { AdquisicionPlanesModal } from '../components/AdquisicionPlanesModal'
import { usePWA } from '../hooks/usePWA'
import { PWAInstallBanner } from '../components/PWAInstallBanner'

/* Iconografía SVG empresarial de alta definición y precisión vectorial */
function NavIcon({ name, size = 18, color = 'currentColor' }) {
  const icons = {
    dashboard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
    ventas: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
    compras: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </svg>
    ),
    'rrhh-inventario': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m7.5 4.27 9 5.15" />
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
    rrhh: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    finanzas: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    crm: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    proyectos: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      </svg>
    ),
    reportes: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
    chatbot: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2" />
        <path d="M20 14h2" />
        <path d="M15 13v2" />
        <path d="M9 13v2" />
      </svg>
    ),
    integraciones: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
    'plugin-manager': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4" />
        <path d="m4.93 4.93 2.83 2.83" />
        <path d="M2 12h4" />
        <path d="m4.93 19.07 2.83-2.83" />
        <path d="M12 22v-4" />
        <path d="m19.07 19.07-2.83-2.83" />
        <path d="M22 12h-4" />
        <path d="m19.07 4.93-2.83 2.83" />
      </svg>
    ),
    ajustes: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    ),
    chevronDown: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 9 6 6 6-6" />
      </svg>
    ),
    chevronUp: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m18 15-6-6-6 6" />
      </svg>
    ),
    crown: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
      </svg>
    ),
    collapse: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 3v18" />
        <path d="m14 15 3-3-3-3" />
      </svg>
    ),
    expand: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 3v18" />
        <path d="m16 9-3 3 3 3" />
      </svg>
    )
  }

  return icons[name] || (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

const MODULE_NAMES = {
  'rrhh-inventario': 'Inventario & Stock',
  'plugin-manager': 'Plugins & Extensiones',
  chatbot: 'Asistente IA Cloud',
  crm: 'Clientes & CRM',
  reportes: 'Reportes & Analítica',
  rrhh: 'Gestión Humana & Nómina',
  ventas: 'Ventas & Facturación',
  compras: 'Compras & Proveedores',
  finanzas: 'Finanzas & Contabilidad',
  proyectos: 'Proyectos & Tareas',
  integraciones: 'Integraciones & API',
  ajustes: 'Ajustes & Configuración',
}

const SUBMENUS = {
  'rrhh-inventario': [
    { label: 'Resumen General', tab: 'Resumen' },
    { label: 'Catálogo Productos', tab: 'Productos' },
    { label: 'Categorías', tab: 'Categorías' },
    { label: 'Almacenes', tab: 'Almacenes' },
    { label: 'Movimientos Stock', tab: 'Movimientos' },
    { label: 'Ajustes de Inventario', tab: 'Ajustes' },
    { label: 'Kardex Valorizado', tab: 'Kardex' },
  ],
  rrhh: [
    { label: 'Resumen RRHH', tab: 'Resumen RRHH', badge: 'Pro' },
    { label: 'Nómina & Empleados', tab: 'Empleados' },
    { label: 'Control Asistencia', tab: 'Asistencia' },
    { label: 'Procesamiento Nómina', tab: 'Nómina' },
    { label: 'Gestión Vacaciones', tab: 'Vacaciones' },
    { label: 'Evaluación Desempeño', tab: 'Desempeño' },
    { label: 'Reclutamiento', tab: 'Reclutamiento' },
  ],
  finanzas: [
    { label: 'Tablero Financiero', tab: 'Resumen' },
    { label: 'Cuentas Bancarias', tab: 'Cuentas' },
    { label: 'Comprobantes DGII', tab: 'Comprobantes' },
    { label: 'Ingresos y Cobros', tab: 'Ingresos' },
    { label: 'Gastos Operativos', tab: 'Gastos' },
    { label: 'Transferencias', tab: 'Transferencias' },
    { label: 'Conciliación Bancaria', tab: 'Conciliaciones' },
    { label: 'Reporte de Impuestos', tab: 'Impuestos' },
    { label: 'Presupuestos Anuales', tab: 'Presupuestos' },
  ],
  ventas: [
    { label: 'Panel Comercial', tab: 'Resumen' },
    { label: 'Facturas Emitidas', tab: 'Facturas' },
    { label: 'Nueva Venta / POS', tab: 'Nueva Venta' },
    { label: 'Cotizaciones Activas', tab: 'Cotizaciones' },
    { label: 'Control de Cobros', tab: 'Cobros' },
    { label: 'Comprobantes NCF', tab: 'NCF' },
  ],
  compras: [
    { label: 'Panel de Abastecimiento', tab: 'Resumen' },
    { label: 'Órdenes de Compra', tab: 'Ordenes' },
    { label: 'Generar Orden', tab: 'Nueva' },
    { label: 'Directorio Proveedores', tab: 'Proveedores' },
    { label: 'Facturas por Pagar', tab: 'Facturas' },
    { label: 'Recepción de Mercancía', tab: 'Recepcion' },
  ],
}

const MODULE_GROUPS = [
  {
    id: 'operations',
    title: 'Operaciones Comerciales',
    moduleIds: ['ventas', 'compras', 'rrhh-inventario', 'crm'],
  },
  {
    id: 'management',
    title: 'Gestión & Finanzas',
    moduleIds: ['finanzas', 'rrhh', 'proyectos', 'reportes'],
  },
  {
    id: 'system',
    title: 'Plataforma & Core',
    moduleIds: ['chatbot', 'integraciones', 'plugin-manager', 'ajustes'],
  },
]

export function Sidebar({ isMobileOpen, onCloseMobile, isCollapsed = false, onToggleCollapse }) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [openSubmenus, setOpenSubmenus] = useState(() => {
    // Abrir automáticamente el submenú de la ruta activa
    const activeKey = location.pathname.replace('/', '')
    return activeKey ? { [activeKey]: true } : { ventas: true }
  })
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [empresa, setEmpresa] = useState(() => getEmpresaActiva())
  const [modulesVersion, setModulesVersion] = useState(0)

  useEffect(() => {
    const handlePluginChange = () => setModulesVersion((v) => v + 1)
    window.addEventListener('erp:plugins_changed', handlePluginChange)
    return () => window.removeEventListener('erp:plugins_changed', handlePluginChange)
  }, [])

  useEffect(() => {
    const handleStorage = () => setEmpresa(getEmpresaActiva())
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const currentTab = searchParams.get('tab') || ''
  const modules = getEnabledModules().filter((mod) => canAccess(user?.role, mod.id))

  const toggleSubmenu = (modId, e) => {
    if (e) e.stopPropagation()
    setOpenSubmenus((prev) => ({ ...prev, [modId]: !prev[modId] }))
  }

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-top">
        {/* Header de Marca y Empresa */}
        <div className="sidebar-brand-container">
          {!isCollapsed ? (
            <div className="sidebar-brand-logo">
              <div className="sidebar-brand-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="sidebar-brand-info">
                <span className="sidebar-brand-name">{empresa?.nombre || 'APPEX ERP'}</span>
                <span className="sidebar-brand-tag">{empresa?.rnc ? `RNC ${empresa.rnc}` : 'Enterprise Cloud'}</span>
              </div>
            </div>
          ) : (
            <div className="sidebar-brand-icon-collapsed" title="APPEX ERP">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}

          {/* Botón para Plegar/Desplegar la Barra Lateral */}
          {onToggleCollapse && (
            <button
              className="sidebar-collapse-toggle-btn"
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expandir barra lateral' : 'Plegar barra lateral'}
              aria-label="Plegar / Desplegar barra lateral"
            >
              <NavIcon name={isCollapsed ? 'collapse' : 'expand'} size={15} />
            </button>
          )}

          {/* Botón de cierre en vista móvil */}
          {onCloseMobile && (
            <button
              className="sidebar-mobile-close-btn"
              onClick={onCloseMobile}
              title="Cerrar Menú"
            >
              ✕
            </button>
          )}
        </div>

        {/* Navegación Principal */}
        <nav className="sidebar-nav">
          {/* Dashboard Directo */}
          <NavLink
            to="/"
            end
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title={isCollapsed ? 'Dashboard Principal' : undefined}
          >
            <span className="sidebar-icon">
              <NavIcon name="dashboard" size={19} />
            </span>
            {!isCollapsed && <span className="sidebar-label">Dashboard Principal</span>}
          </NavLink>

          {/* Secciones agrupadas para máxima elegancia y orden */}
          {MODULE_GROUPS.map((group) => {
            const groupModules = modules.filter((m) => group.moduleIds.includes(m.id))
            if (groupModules.length === 0) return null

            return (
              <div key={group.id} className="sidebar-section">
                {!isCollapsed && <div className="sidebar-section-title">{group.title}</div>}

                {groupModules.map((mod) => {
                  const hasSubmenu = SUBMENUS[mod.id]
                  const isParentActive = location.pathname === mod.path
                  const isOpen = openSubmenus[mod.id]

                  if (hasSubmenu) {
                    return (
                      <div key={mod.id} className="sidebar-group">
                        <div
                          className={`sidebar-link sidebar-parent-link ${isParentActive ? 'active-parent' : ''}`}
                          title={isCollapsed ? (MODULE_NAMES[mod.id] ?? mod.name) : undefined}
                          onClick={() => {
                            const defaultTab = mod.id === 'rrhh' ? 'Resumen RRHH' : 'Resumen'
                            if (!isParentActive) {
                              navigate(`${mod.path}?tab=${encodeURIComponent(defaultTab)}`)
                            }
                            setOpenSubmenus((prev) => ({ ...prev, [mod.id]: !prev[mod.id] }))
                          }}
                        >
                          <div className="sidebar-link-content">
                            <span className="sidebar-icon">
                              <NavIcon name={mod.id} size={19} />
                            </span>
                            {!isCollapsed && <span className="sidebar-label">{MODULE_NAMES[mod.id] ?? mod.name}</span>}
                          </div>
                          {!isCollapsed && (
                            <button
                              className="sidebar-chevron-btn"
                              onClick={(e) => toggleSubmenu(mod.id, e)}
                              title={isOpen ? 'Contraer submenú' : 'Expandir submenú'}
                            >
                              <NavIcon name={isOpen ? 'chevronUp' : 'chevronDown'} size={13} />
                            </button>
                          )}
                        </div>

                        {/* Submenú desplegable estilizado */}
                        {isOpen && !isCollapsed && (
                          <div className="sidebar-submenu">
                            {hasSubmenu.map((sub) => {
                              const activeTabNormalized = (currentTab || '').trim().toLowerCase()
                              const subTabNormalized = (sub.tab || sub.label || '').trim().toLowerCase()
                              const isSubActive = isParentActive && (
                                activeTabNormalized === subTabNormalized ||
                                (subTabNormalized === 'categorías' && activeTabNormalized === 'categorias') ||
                                (subTabNormalized === 'ajustes' && activeTabNormalized === 'ajustes de stock')
                              )

                              return (
                                <div
                                  key={sub.label}
                                  className={`sidebar-sublink ${isSubActive ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    navigate(`${mod.path}?tab=${encodeURIComponent(sub.tab)}`)
                                  }}
                                >
                                  <span className="sidebar-sublink-bullet" />
                                  <span className="sidebar-sublink-text">{sub.label}</span>
                                  {sub.badge && <span className="sidebar-sub-badge">{sub.badge}</span>}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  }

                  return (
                    <NavLink
                      key={mod.id}
                      to={mod.path}
                      className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                      title={isCollapsed ? (MODULE_NAMES[mod.id] ?? mod.name) : undefined}
                    >
                      <span className="sidebar-icon">
                        <NavIcon name={mod.id} size={19} />
                      </span>
                      {!isCollapsed && <span className="sidebar-label">{MODULE_NAMES[mod.id] ?? mod.name}</span>}
                    </NavLink>
                  )
                })}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Tarjeta inferior del plan contratado y estado de la empresa */}
      {(() => {
        let activePlan = null
        try {
          const raw = localStorage.getItem('appes_active_plan_subscription_v1')
          if (raw) activePlan = JSON.parse(raw)
        } catch (_) {}
        const planName = activePlan?.planNombre || 'Enterprise Suite Cloud'
        const planBadge = activePlan?.planBadge || 'Corporativo'

        if (isCollapsed) {
          return (
            <div
              className="sidebar-plan-card-collapsed"
              onClick={() => setShowPlanModal(true)}
              title={`${planName} · Gestionar Plan`}
            >
              <NavIcon name="crown" size={18} />
            </div>
          )
        }

        return (
          <div className="sidebar-plan-card">
            <div className="sidebar-plan-header">
              <div className="sidebar-plan-title">
                <NavIcon name="crown" size={16} />
                <strong>{planName}</strong>
              </div>
              <span className="sidebar-plan-badge">{planBadge}</span>
            </div>

            <div className="sidebar-plan-usage">
              <div className="sidebar-plan-usage-label">
                <span>Módulos activos</span>
                <strong>{modules.length} de 12</strong>
              </div>
              <div className="sidebar-plan-progress-bg">
                <div className="sidebar-plan-progress-fill" style={{ width: `${Math.min(100, (modules.length / 12) * 100)}%` }} />
              </div>
            </div>

            <button
              className="sidebar-plan-btn"
              onClick={() => setShowPlanModal(true)}
              title="Administrar suscripción y módulos corporativos"
            >
              Gestionar Plan
            </button>
          </div>
        )
      })()}

      {/* Modal interactivo de Planes */}
      <AdquisicionPlanesModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        onPlanActivated={() => setShowPlanModal(false)}
      />
    </aside>
  )
}
