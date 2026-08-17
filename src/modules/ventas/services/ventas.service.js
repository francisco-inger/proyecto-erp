import { apiClient } from '../../../core/api/apiClient'
import { erpSync } from '../../../core/sync/erpSyncEngine'
import { getTenantData, setTenantData, getActiveTenantId } from '../../../core/utils/formatters'

const STORAGE_KEY = 'ventas_orders_v1'

const SEED_ORDERS = [
  { id: '1', numero: 'PED-1001', cliente: 'Farmacia Los Hidalgos', fecha: '2025-05-20', fechaCreacion: '2025-05-20', estado: 'Confirmado', total: 125000, observaciones: 'Entrega prioritaria en almacén central' },
  { id: '2', numero: 'PED-1002', cliente: 'Centro Médico Real', fecha: '2025-05-19', fechaCreacion: '2025-05-19', estado: 'Enviado', total: 98000, observaciones: 'Factura con comprobante gubernamental' },
  { id: '3', numero: 'PED-1003', cliente: 'Distribuidora San Rafael', fecha: '2025-05-18', fechaCreacion: '2025-05-18', estado: 'Entregado', total: 75000, observaciones: 'Pago verificado contra entrega' },
  { id: '4', numero: 'PED-1004', cliente: 'Clínica Abreu', fecha: '2025-05-17', fechaCreacion: '2025-05-17', estado: 'Pendiente', total: 62000, observaciones: 'Pendiente de confirmación de crédito' },
  { id: '5', numero: 'PED-1005', cliente: 'Farmacia Carol', fecha: '2025-05-16', fechaCreacion: '2025-05-16', estado: 'Confirmado', total: 58000, observaciones: 'Despacho conjunto con pedido 1001' },
]

function getLocalOrders() {
  const tenantId = getActiveTenantId()
  const current = getTenantData(STORAGE_KEY, null)
  if (Array.isArray(current) && current.length > 0) {
    return current
  }
  // Inicializar con pedidos seed si aún no tiene datos
  setTenantData(STORAGE_KEY, SEED_ORDERS)
  return SEED_ORDERS
}

function saveLocalOrders(orders) {
  setTenantData(STORAGE_KEY, orders)
}

export const ventasService = {
  listOrders: async () => {
    try {
      const res = await apiClient.get('/sales/orders')
      if (Array.isArray(res) && res.length > 0) return res
    } catch (_) {}
    return getLocalOrders()
  },

  createOrder: async (order) => {
    let created = null
    try {
      const res = await apiClient.post('/sales/orders', order)
      if (res && res.id) created = res
    } catch (_) {}

    if (!created) {
      created = {
        ...order,
        id: String(Date.now()),
        numero: order.numero || `PED-${Math.floor(1000 + Math.random() * 9000)}`,
        fecha: order.fecha || new Date().toISOString().slice(0, 10),
        fechaCreacion: new Date().toISOString(),
        estado: order.estado || 'Pendiente',
        total: Number(order.total) || 0,
      }
    }
    const current = getLocalOrders()
    const updated = [created, ...current.filter(o => o.id !== created.id)]
    saveLocalOrders(updated)
    erpSync.syncSaleOrder(created, 'create')
    return created
  },

  updateOrderStatus: async (id, estado) => {
    let updatedObj = null
    try {
      const res = await apiClient.patch(`/sales/orders/${id}/status`, { estado })
      if (res && res.id) updatedObj = res
    } catch (_) {}

    const current = getLocalOrders()
    const updated = current.map(o => {
      if (String(o.id) === String(id)) {
        const item = { ...o, estado }
        if (!updatedObj) updatedObj = item
        return item
      }
      return o
    })
    saveLocalOrders(updated)
    if (updatedObj) {
      erpSync.syncSaleOrder(updatedObj, 'status_change')
    }
    return updatedObj
  },

  deleteOrder: async (id) => {
    const current = getLocalOrders()
    const target = current.find(o => o.id === id)
    const updated = current.filter(o => o.id !== id)
    saveLocalOrders(updated)
    if (target) {
      erpSync.syncSaleOrder(target, 'delete')
    }
    return updated
  }
}
