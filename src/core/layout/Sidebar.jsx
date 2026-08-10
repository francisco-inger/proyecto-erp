import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { canAccess } from '../rbac/permissions'
import { getEnabledModules } from '../moduleRegistry'

/* Orden y íconos del sidebar, alineados al mockup del proyecto */
const MODULE_ICONS = {
  ventas:          '🛒',
  compras:         '🏷️',
  'rrhh-inventario': '📦',
  crm:             '👥',
  finanzas:        '💰',
  proyectos:       '📁',
  reportes:        '📊',
  chatbot:         '🤖',
  integraciones:   '🌐',
  'plugin-manager':'🧩',
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
      <div>
        <div className="sidebar-brand">appes.erp</div>
        <div style={{ fontSize: 11, color: 'var(--color-ink-faint)', marginTop: -14, marginBottom: 'var(--space-5)', paddingLeft: 2 }}>
          ERP Inteligente y Modular
        </div>
      </div>

      <NavLink to="/" end className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
        🏠 Dashboard
      </NavLink>

      {modules.map((mod) => (
        <NavLink
          key={mod.id}
          to={mod.path}
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          {MODULE_ICONS[mod.id] ?? '⬡'} {mod.name}
        </NavLink>
      ))}
    </aside>
  )
}

