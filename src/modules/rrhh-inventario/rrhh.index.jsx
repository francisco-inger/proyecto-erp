import { registerModule } from '../../core/moduleRegistry'
import { ROLES } from '../../core/rbac/permissions'
import { RrhhHome } from './pages/RrhhHome'

registerModule({
  id: 'rrhh',
  name: 'RRHH',
  path: '/rrhh',
  color: '#4F46E5',
  requiredRole: ROLES.RRHH,
  element: <RrhhHome />,
})
