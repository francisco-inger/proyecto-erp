/*
  Módulo Finanzas — se auto-registra en el core.
  Responsable: Kendry Suero De Los Santos (Analytics & Reportes)
*/
import { registerModule } from '../../core/moduleRegistry'
import { ROLES } from '../../core/rbac/permissions'
import { FinanzasHome } from './pages/FinanzasHome'

registerModule({
  id: 'finanzas',
  name: 'Finanzas',
  path: '/finanzas',
  color: 'var(--color-success)',
  requiredRole: ROLES.ADMIN,
  element: <FinanzasHome />,
})
