/*
  MÓDULO VENTAS · servicio
  Propietaria: Eliannys Hernandez Guzman.
  Todas las llamadas HTTP de este módulo pasan por el apiClient del core,
  nunca por fetch()/axios directo.
*/

import { apiClient } from '../../../core/api/apiClient'

export const ventasService = {
  listOrders: () =>
    apiClient.get('/sales/orders'),

  createOrder: (order) =>
    apiClient.post('/sales/orders', order),

  updateOrderStatus: (id, estado) =>
    apiClient.patch(`/sales/orders/${id}/status`, {
      estado,
    }),
}