import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { canAccess } from '../rbac/permissions'
import { getEnabledModules } from '../moduleRegistry'

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
    { label: 'Categorias', tab: 'Categorías' },
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
    { label: 'Reportes', tab: 'Reportes' },
    { label: 'Presupuesto', tab: 'Presupuesto' },
  ],
}

const MODULE_ORDER = ['ventas','compras','rrhh-inventario','rrhh','finanzas','crm','proyectos','reportes','chatbot','integraciones','plugin-manager','ajustes']

export function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [openSubmenus, setOpenSubmenus] = useState({
    'rrhh-inventario': true,
    finanzas: true,
  })
  const [showPlanModal, setShowPlanModal] = useState(false)

  // Auto-expandir submenú si la ruta activa coincide
  useEffect(() => {
    if (location.pathname.includes('inventario') || location.pathname.includes('rrhh-inventario')) {
      setOpenSubmenus((prev) => ({ ...prev, 'rrhh-inventario': true }))
    }
    if (location.pathname === '/rrhh' || location.pathname.startsWith('/rrhh?')) {
      setOpenSubmenus((prev) => ({ ...prev, rrhh: true }))
    }
    if (location.pathname === '/finanzas' || location.pathname.startsWith('/finanzas?')) {
      setOpenSubmenus((prev) => ({ ...prev, finanzas: true }))
    }
  }, [location.pathname])

  const all = getEnabledModules().filter((m) => canAccess(user?.role, m.requiredRole))
  const modules = [...all].sort((a, b) => {
    const ia = MODULE_ORDER.indexOf(a.id)
    const ib = MODULE_ORDER.indexOf(b.id)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

  const currentTab = searchParams.get('tab') || 'Resumen'

  const toggleSubmenu = (modId, e) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenSubmenus((prev) => ({ ...prev, [modId]: !prev[modId] }))
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand-container">
          <div className="sidebar-brand-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/src/assets/branding/logo_appex.jpg"
              alt="APPEX ERP Logo"
              style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'contain', background: '#F8FAFC', border: '1px solid #E2E8F0' }}
            />
            <div>
              <span className="sidebar-brand-name" style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', display: 'block', lineHeight: 1.2 }}>
                APPEX<span style={{ color: '#2563EB' }}>.ERP</span>
              </span>
              <span className="sidebar-brand-tag" style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>
                Enterprise Suite 2026
              </span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <span className="sidebar-icon">🏠</span> Dashboard
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
                    onClick={() => {
                      const defaultTab = mod.id === 'rrhh' ? 'Resumen RRHH' : 'Resumen'
                      if (!isParentActive) navigate(`${mod.path}?tab=${encodeURIComponent(defaultTab)}`)
                      setOpenSubmenus((prev) => ({ ...prev, [mod.id]: true }))
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                      <span className="sidebar-icon">{MODULE_ICONS[mod.id] ?? '⬡'}</span>
                      <span className="sidebar-mod-name">{MODULE_NAMES[mod.id] ?? mod.name}</span>
                    </div>
                    <button
                      className="sidebar-chevron-btn"
                      onClick={(e) => toggleSubmenu(mod.id, e)}
                      title={isOpen ? 'Colapsar' : 'Expandir'}
                    >
                      {isOpen ? '⌃' : '⌄'}
                    </button>
                  </div>

                  {/* Submenú desplegable */}
                  {isOpen && (
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
              >
                <span className="sidebar-icon">{MODULE_ICONS[mod.id] ?? '⬡'}</span>
                <span>{MODULE_NAMES[mod.id] ?? mod.name}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Tarjeta inferior del plan empresarial */}
      <div className="sidebar-plan-card">
        <div className="sidebar-plan-header">
          <div className="sidebar-plan-title">
            <span className="sidebar-plan-crown">👑</span>
            <strong>Plan Empresarial</strong>
          </div>
          <span className="sidebar-plan-badge">Avanzado</span>
        </div>

        <div className="sidebar-plan-usage">
          <div className="sidebar-plan-usage-label">
            <span>Uso del sistema</span>
            <strong>68%</strong>
          </div>
          <div className="sidebar-plan-progress-bg">
            <div className="sidebar-plan-progress-fill" style={{ width: '68%' }} />
          </div>
        </div>

        <button
          className="sidebar-plan-btn"
          onClick={() => navigate('/ajustes?tab=Sistema')}
          style={{ cursor: 'pointer' }}
          title="Ver recursos, estado de base de datos y licencia"
        >
          Ver detalles
        </button>
      </div>
    </aside>
  )
}



