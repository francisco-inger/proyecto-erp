/*
  MÓDULO AJUSTES · Manifest
  Auto-registro en el moduleRegistry del core de appes.erp
*/
import { registerModule } from '../../core/moduleRegistry'
import { AjustesHome } from './pages/AjustesHome'

registerModule({
  id: 'ajustes',
  name: 'Ajustes',
  path: '/ajustes',
  element: <AjustesHome />,
  color: 'var(--color-primary, #2563EB)',
  requiredRole: null, // Visible para usuarios autorizados
  enabled: true,
})
