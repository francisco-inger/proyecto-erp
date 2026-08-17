import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { canAccess } from '../rbac/permissions'
import { getEnabledModules } from '../moduleRegistry'
import { getEmpresaActiva } from '../utils/formatters'
import { AdquisicionPlanesModal } from '../components/AdquisicionPlanesModal'
import { usePWA } from '../hooks/usePWA'
import { PWAInstallBanner } from '../components/PWAInstallBanner'

/* Orden y íconos del sidebar, alineados al mockup del proyecto */
const MODULE_ICONS = {
  ventas:          '🛒',
  compras:         '🛍️',
  'rrhh-inventario': '📦',
  rrhh:            '👤',
  crm:             '👥',
  finanzas:        '💲',
  proyectos:       '📁',
  reportes:        '📊',
  chatbot:         '🤖',
  integraciones:   '🔗',
  'plugin-manager':'🧩',
  ajustes:         '⚙️',
}

const MODULE_NAMES = {
  'rrhh-inventario': 'Inventario',
  'plugin-manager': 'Plugins',
  chatbot: 'AI Chatbot',
  crm: 'Clientes (CRM)',
  reportes: 'Reportes & Analytics',
  rrhh: 'RRHH',
  ajustes: 'Ajustes',
}

const SUBMENUS = {
  'rrhh-inventario': [
    { label: 'Resumen', tab: 'Resumen' },
    { label: 'Productos', tab: 'Productos' },
    { label: 'Categorías', tab: 'Categorías' },
    { label: 'Almacenes', tab: 'Almacenes' },
    { label: 'Movimientos', tab: 'Movimientos' },
    { label: 'Ajustes de Stock', tab: 'Ajustes' },
    { label: 'Kardex', tab: 'Kardex' },
  ],
  rrhh: [
    { label: 'Resumen RRHH', tab: 'Resumen RRHH', badge: 'Nuevo' },
    { label: 'Empleados', tab: 'Empleados' },
    { label: 'Asistencia', tab: 'Asistencia' },
    { label: 'Nómina', tab: 'Nómina' },
    { label: 'Vacaciones', tab: 'Vacaciones' },
    { label: 'Desempeño', tab: 'Desempeño' },
    { label: 'Reclutamiento', tab: 'Reclutamiento' },
  ],
  finanzas: [
    { label: 'Resumen', tab: 'Resumen' },
    { label: 'Cuentas', tab: 'Cuentas' },
    { label: 'Comprobantes', tab: 'Comprobantes' },
    { label: 'Ingresos', tab: 'Ingresos' },
    { label: 'Gastos', tab: 'Gastos' },
    { label: 'Transferencias', tab: 'Transferencias' },
    { label: 'Conciliaciones', tab: 'Conciliaciones' },
    { label: 'Impuestos DGII', tab: 'Impuestos' },
    { label: 'Monedas & Tasas', tab: 'Monedas' },
    { label: 'Presupuestos', tab: 'Presupuestos' },
    { label: 'Reporte Financiero', tab: 'Reportes' },
  ],
  ventas: [
    { label: 'Resumen', tab: 'Resumen' },
    { label: 'Facturas', tab: 'Facturas' },
    { label: 'Nueva Venta', tab: 'Nueva Venta' },
    { label: 'Cotizaciones', tab: 'Cotizaciones' },
    { label: 'Cobros', tab: 'Cobros' },
    { label: 'Comprobantes NCF', tab: 'NCF' },
  ],
  compras: [
    { label: 'Resumen', tab: 'Resumen' },
    { label: 'Órdenes de Compra', tab: 'Ordenes' },
    { label: 'Nueva Orden', tab: 'Nueva' },
    { label: 'Proveedores', tab: 'Proveedores' },
    { label: 'Facturas Proveedor', tab: 'Facturas' },
    { label: 'Recepción Stock', tab: 'Recepcion' },
  ],
}

const MODULE_ORDER = ['ventas','compras','rrhh-inventario','rrhh','finanzas','crm','reportes','chatbot','integraciones','plugin-manager','ajustes']

export function Sidebar({ isMobileOpen, onCloseMobile, isCollapsed = false, onToggleCollapse }) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [openSubmenus, setOpenSubmenus] = useState({})
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [showPWAModal, setShowPWAModal] = useState(false)
  const [empresa, setEmpresa] = useState(() => getEmpresaActiva())

  const [modulesVersion, setModulesVersion] = useState(0)

  useEffect(() => {
    setEmpresa(getEmpresaActiva())
  }, [user, location.pathname])

  useEffect(() => {
    const handleModuleChange = () => setModulesVersion((v) => v + 1)
    window.addEventListener('erp:modules_changed', handleModuleChange)
    return () => window.removeEventListener('erp:modules_changed', handleModuleChange)
  }, [])

  const all = getEnabledModules().filter((m) => canAccess(user?.role, m.id))
  const modules = [...all].sort((a, b) => {
    const ia = MODULE_ORDER.indexOf(a.id)
    const ib = MODULE_ORDER.indexOf(b.id)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

  const currentTab = searchParams.get('tab') || 'Resumen'
  const { isInstallable, isInstalled, promptInstall } = usePWA()

  const toggleSubmenu = (modId, e) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenSubmenus((prev) => ({ ...prev, [modId]: !prev[modId] }))
  }

  return (
    <aside className={`sidebar ${isMobileOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-top">
        <div className="sidebar-brand-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="sidebar-brand-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/branding/logo_appex.jpg"
              alt="APPEX ERP Logo"
              style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: 2, flexShrink: 0 }}
            />
            {!isCollapsed && (
              <div style={{ overflow: 'hidden' }}>
                <span className="sidebar-brand-name" style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'block', lineHeight: 1.2, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: 120 }} title={empresa.razonSocial}>
                  {empresa.nombreComercial || empresa.razonSocial}
                </span>
                <span className="sidebar-brand-tag" style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>
                  RNC: {empresa.rnc}
                </span>
              </div>
            )}
          </div>

          {/* Botón para Plegar/Desplegar la Barra Lateral */}
          {onToggleCollapse && (
            <button
              className="sidebar-collapse-toggle-btn"
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Desplegar barra lateral' : 'Plegar barra lateral'}
              aria-label="Plegar / Desplegar barra lateral"
            >
              {isCollapsed ? '▶' : '◀'}
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

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            title={isCollapsed ? 'Dashboard' : undefined}
          >
            <span className="sidebar-icon">🏠</span>
            {!isCollapsed && <span>Dashboard</span>}
          </NavLink>

          {modules.map((mod) => {
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
                      <span className="sidebar-icon">{MODULE_ICONS[mod.id] ?? '⬡'}</span>
                      {!isCollapsed && <span className="sidebar-mod-name">{MODULE_NAMES[mod.id] ?? mod.name}</span>}
                    </div>
                    {!isCollapsed && (
                      <button
                        className="sidebar-chevron-btn"
                        onClick={(e) => toggleSubmenu(mod.id, e)}
                        title={isOpen ? 'Colapsar' : 'Expandir'}
                      >
                        {isOpen ? '⌃' : '⌄'}
                      </button>
                    )}
                  </div>

                  {/* Submenú desplegable (visible si está abierto y no colapsado) */}
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
                            <span>{sub.label}</span>
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
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                title={isCollapsed ? (MODULE_NAMES[mod.id] ?? mod.name) : undefined}
                style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
              >
                <span className="sidebar-icon">{MODULE_ICONS[mod.id] ?? '⬡'}</span>
                {!isCollapsed && <span>{MODULE_NAMES[mod.id] ?? mod.name}</span>}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Tarjeta inferior del plan contratado */}
      {(() => {
        let activePlan = null
        try {
          const raw = localStorage.getItem('appes_active_plan_subscription_v1')
          if (raw) activePlan = JSON.parse(raw)
        } catch (_) {}
        const planName = activePlan?.planNombre || 'Plan Enterprise Suite'
        const planBadge = activePlan?.planBadge || 'Corporativo'

        if (isCollapsed) {
          return (
            <div
              className="sidebar-plan-card-collapsed"
              onClick={() => setShowPlanModal(true)}
              title={`${planName} · Clic para gestionar plan`}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '10px 0',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 18,
              }}
            >
              👑
            </div>
          )
        }

        return (
          <div className="sidebar-plan-card">
            <div className="sidebar-plan-header">
              <div className="sidebar-plan-title">
                <span className="sidebar-plan-crown">👑</span>
                <strong style={{ fontSize: 12 }}>{planName}</strong>
              </div>
              <span className="sidebar-plan-badge">{planBadge}</span>
            </div>

            <div className="sidebar-plan-usage">
              <div className="sidebar-plan-usage-label">
                <span>{user?.role === 'cliente' ? 'Módulos de tu Plan' : 'Uso del sistema'}</span>
                <strong>{modules.length} activos</strong>
              </div>
              <div className="sidebar-plan-progress-bg">
                <div className="sidebar-plan-progress-fill" style={{ width: `${Math.min(100, (modules.length / 11) * 100)}%` }} />
              </div>
            </div>

            <button
              className="sidebar-plan-btn"
              onClick={() => setShowPlanModal(true)}
              style={{ cursor: 'pointer' }}
              title="Ver planes disponibles, renovar o mejorar suscripción"
            >
              {user?.role === 'cliente' ? 'Mejorar mi Plan' : 'Gestionar Planes'}
            </button>
          </div>
        )
      })()}

      {/* Modal interactivo de Adquisición de Planes */}
      <AdquisicionPlanesModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        onPlanActivated={() => {
          setShowPlanModal(false)
        }}
      />
    </aside>
  )
}



