/*
  Módulo Reportes — se auto-registra en el core.
  Responsable: Kendry Suero De Los Santos (Analytics & Reportes)
*/
import { registerModule } from '../../core/moduleRegistry'
import { ROLES } from '../../core/rbac/permissions'
import { ReportesHome } from './pages/ReportesHome'

registerModule({
  id: 'reportes',
  name: 'Reportes',
  path: '/reportes',
  color: 'var(--color-crm)',
  requiredRole: ROLES.ADMIN,
  element: <ReportesHome />,
})
