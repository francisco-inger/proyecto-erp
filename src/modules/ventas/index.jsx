/*
  Manifest del mÃ³dulo Ventas â€” se auto-registra en el core.
  Este es el ÃšNICO archivo que el resto de la app necesita importar
  para "instalar" el mÃ³dulo (ver src/App.jsx).
*/
import { registerModule } from '../../core/moduleRegistry'
import { ROLES } from '../../core/rbac/permissions'
import VentasHome from './pages/VentasHome'

registerModule({
  id: 'ventas',
  name: 'Ventas',
  path: '/ventas',
  color: 'var(--color-ventas)',
  requiredRole: ROLES.VENTAS,
  element: <VentasHome />,
})
