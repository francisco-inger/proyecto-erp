import { registerModule } from '../../core/moduleRegistry'
import { ROLES } from '../../core/rbac/permissions'
import { RrhhInventarioHome } from './pages/RrhhInventarioHome'

registerModule({
  id: 'rrhh-inventario',
  name: 'RR.HH. / Inventario',
  path: '/rrhh-inventario',
  color: 'var(--color-rrhh)',
  requiredRole: ROLES.RRHH,
  element: <RrhhInventarioHome />,
})
