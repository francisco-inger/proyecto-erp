import { registerModule } from '../../core/moduleRegistry'
import { ROLES } from '../../core/rbac/permissions'
import { PluginManagerHome } from './pages/PluginManagerHome'

registerModule({
  id: 'plugin-manager',
  name: 'Plugins',
  path: '/plugins',
  color: 'var(--color-plugins)',
  requiredRole: ROLES.ADMIN,
  element: <PluginManagerHome />,
})
