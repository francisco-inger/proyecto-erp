/*
  Módulo Proyectos — se auto-registra en el core.
  Responsable: Daniel Morales (IA & Automación)
*/
import { registerModule } from '../../core/moduleRegistry'
import { ROLES } from '../../core/rbac/permissions'
import { ProyectosHome } from './pages/ProyectosHome'

registerModule({
  id: 'proyectos',
  name: 'Proyectos',
  path: '/proyectos',
  color: 'var(--color-chatbot)',
  requiredRole: null,
  element: <ProyectosHome />,
})
