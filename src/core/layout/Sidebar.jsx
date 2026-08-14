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
          <div className="sidebar-brand-logo">
            <span className="sidebar-brand-name">appes.erp</span>
          </div>
          <div className="sidebar-brand-tag">
            ERP Inteligente y Productivo
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
          onClick={() => setShowPlanModal(true)}
          style={{ cursor: 'pointer' }}
        >
          Ver detalles
        </button>
      </div>

      {/* Modal Interactivo de Detalles del Plan Empresarial */}
      {showPlanModal && (
        <div
          onClick={() => setShowPlanModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              maxWidth: 520,
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              border: '1px solid #E2E8F0',
            }}
          >
            {/* Header del Modal */}
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F8FAFC',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>👑</span>
                <div>
                  <strong style={{ fontSize: 16, color: '#0F172A', display: 'block' }}>Plan Empresarial Avanzado</strong>
                  <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 700 }}>● Licencia Corporativa Ilimitada</span>
                </div>
              </div>
              <button
                onClick={() => setShowPlanModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, color: '#94A3B8', cursor: 'pointer', padding: 4 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Resumen de Capacidad y Recursos */}
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1E40AF' }}>Consumo Global de Recursos</span>
                  <strong style={{ fontSize: 12, color: '#1E40AF' }}>68% Utilizado</strong>
                </div>
                <div style={{ background: '#DBEAFE', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: '68%', height: '100%', background: '#2563EB', borderRadius: 6 }} />
                </div>
              </div>

              {/* Grid de Métricas del Sistema */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Base de Datos</span>
                  <strong style={{ color: '#0F172A', fontSize: 14 }}>SQLite / EF Core</strong>
                  <span style={{ fontSize: 10, color: '#16A34A', display: 'block', marginTop: 2 }}>✓ Saludable y Conectada</span>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Módulos Habilitados</span>
                  <strong style={{ color: '#0F172A', fontSize: 14 }}>11 / 11 Módulos</strong>
                  <span style={{ fontSize: 10, color: '#2563EB', display: 'block', marginTop: 2 }}>Todos activos</span>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Almacenamiento en Disco</span>
                  <strong style={{ color: '#0F172A', fontSize: 14 }}>340 MB / 50 GB</strong>
                  <span style={{ fontSize: 10, color: '#64748B', display: 'block', marginTop: 2 }}>Capacidad de sobra</span>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Vigencia de Licencia</span>
                  <strong style={{ color: '#0F172A', fontSize: 14 }}>31 Dic 2026</strong>
                  <span style={{ fontSize: 10, color: '#16A34A', display: 'block', marginTop: 2 }}>Renovación automática</span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button
                  onClick={() => {
                    setShowPlanModal(false)
                    navigate('/ajustes?tab=Sistema')
                  }}
                  style={{
                    flex: 1,
                    background: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ⚙️ Gestionar en Ajustes del Sistema
                </button>
                <button
                  onClick={() => setShowPlanModal(false)}
                  style={{
                    background: '#F1F5F9',
                    color: '#334155',
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '10px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}



