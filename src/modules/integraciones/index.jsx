/*
  Módulo Integraciones — se auto-registra en el core.
  Responsable: Leandro Junior Ramírez Alcántara (Integraciones)
*/
import { registerModule } from '../../core/moduleRegistry'
import { ROLES } from '../../core/rbac/permissions'
import { IntegracionesHome } from './pages/IntegracionesHome'

registerModule({
  id: 'integraciones',
  name: 'Integraciones',
  path: '/integraciones',
  color: 'var(--color-success)',
  requiredRole: ROLES.ADMIN,
  element: <IntegracionesHome />,
})
