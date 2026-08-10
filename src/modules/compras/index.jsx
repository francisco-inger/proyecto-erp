/*
  Módulo Compras — se auto-registra en el core.
  Responsable: Eliannys Hernández Guzmán (Backend & Plugins)
*/
import { registerModule } from '../../core/moduleRegistry'
import { ROLES } from '../../core/rbac/permissions'
import { ComprasHome } from './pages/ComprasHome'

registerModule({
  id: 'compras',
  name: 'Compras',
  path: '/compras',
  color: 'var(--color-ventas)',
  requiredRole: ROLES.ADMIN,
  element: <ComprasHome />,
})
