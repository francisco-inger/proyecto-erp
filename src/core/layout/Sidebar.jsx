import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { canAccess } from '../rbac/permissions'
import { getEnabledModules } from '../moduleRegistry'

/* Orden y íconos del sidebar, alineados al mockup del proyecto */
const MODULE_ICONS = {
  ventas:          '🛒',
  compras:         '🛍️',
  'rrhh-inventario': '📦',
  crm:             '👥',
  finanzas:        '💲',
  proyectos:       '📁',
  reportes:        '📊',
  chatbot:         '🤖',
  integraciones:   '🔗',
  'plugin-manager':'🧩',
}

const MODULE_NAMES = {
  'rrhh-inventario': 'Inventario',
  'plugin-manager': 'Plugins',
  chatbot: 'Asistente IA',
}

const MODULE_ORDER = ['ventas','compras','rrhh-inventario','crm','finanzas','proyectos','reportes','chatbot','integraciones','plugin-manager']

export function Sidebar() {
  const { user } = useAuth()
  const all = getEnabledModules().filter((m) => canAccess(user?.role, m.requiredRole))
  /* Ordena los módulos según MODULE_ORDER; los que no están en la lista van al final */
  const modules = [...all].sort((a, b) => {
    const ia = MODULE_ORDER.indexOf(a.id)
    const ib = MODULE_ORDER.indexOf(b.id)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand-container">
          <div className="sidebar-brand-logo">
            <span className="sidebar-brand-name">appes.erp</span>
          </div>
          <div className="sidebar-brand-tag">
            ERP Inteligente y Modular
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <span className="sidebar-icon">🏠</span> Dashboard
          </NavLink>

          {modules.map((mod) => (
            <NavLink
              key={mod.id}
              to={mod.path}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <span className="sidebar-icon">{MODULE_ICONS[mod.id] ?? '⬡'}</span>
              <span>{MODULE_NAMES[mod.id] ?? mod.name}</span>
            </NavLink>
          ))}
          
          <div className="sidebar-link inactive-link">
            <span className="sidebar-icon">⚙️</span> Ajustes
          </div>
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

        <button className="sidebar-plan-btn">
          Ver detalles
        </button>
      </div>
    </aside>
  )
}


