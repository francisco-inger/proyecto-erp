import { registerModule } from '../../core/moduleRegistry'
import { ROLES } from '../../core/rbac/permissions'
import { CrmHome } from './pages/CrmHome'

registerModule({
  id: 'crm',
  name: 'CRM',
  path: '/crm',
  color: 'var(--color-crm)',
  requiredRole: ROLES.CRM,
  element: <CrmHome />,
})
