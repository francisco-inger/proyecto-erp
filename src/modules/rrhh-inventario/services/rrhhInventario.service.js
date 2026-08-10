/*
  MÓDULO RR.HH. / INVENTARIO · servicio
  Propietario: Benjamin Serrano Aristy (según matriz de requisitos).
*/
import { apiClient } from '../../../core/api/apiClient'

export const rrhhInventarioService = {
  listEmployees: () => apiClient.get('/rrhh/employees'),
  listInventory: () => apiClient.get('/inventario/items'),
}
