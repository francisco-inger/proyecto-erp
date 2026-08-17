/*
  erpSyncEngine.js — Motor Central de Sincronización e Interconexión Reactiva del ERP
  Conecta bidireccionalmente los módulos:
  - Compras <-> Inventario <-> Finanzas <-> Dashboard
  - Ventas <-> Inventario <-> CRM <-> Finanzas <-> Dashboard
  - CRM (Oportunidades Ganadas) <-> Proyectos <-> Finanzas
  - Auditoría & Notificaciones en Tiempo Real
*/

import { getTenantData, setTenantData, getActiveTenantId } from '../utils/formatters'
import { cloudSync } from './cloudSyncService'

export const STORAGE_KEYS = {
  VENTAS: 'ventas_orders_v1',
  COMPRAS: 'compras_orders_v1',
  INVENTARIO_PRODS: 'appes_inventory_products_v1',
  INVENTARIO_MOVEMENTS: 'appes_inventory_movements_v1',
  CRM_CLIENTS: 'appes_crm_clients_v1',
  CRM_OPPORTUNITIES: 'appes_crm_opportunities_v1',
  FINANZAS: 'appes_erp_finanzas_data_v3',
  PROYECTOS: 'appes_proyectos_data_v1',
  AUDIT_LOGS: 'erp_seguridad_audit_logs_v1',
}

function safeGet(key, def = []) {
  try {
    return getTenantData(key, def)
  } catch {
    return def
  }
}

function safeSet(key, val) {
  try {
    setTenantData(key, val)
    // Sincronizar en la nube en segundo plano
    cloudSync.pushCollection(key, val)
  } catch (e) {
    console.error(`[erpSync] Error setting ${key}:`, e)
  }
}

export const erpSync = {
  /**
   * Emite un evento de sincronización a toda la aplicación
   */
  emit(type, detail = {}) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('erp:sync', {
          detail: {
            type,
            ...detail,
            timestamp: Date.now(),
          },
        })
      )
    }
  },

  /**
   * Suscribe un componente a los eventos de sincronización del ERP
   */
  subscribe(callback) {
    if (typeof window === 'undefined') return () => {}

    const handleSync = (e) => callback(e.detail)
    const handleStorage = (e) => callback({ type: 'storage_change', key: e.key, newValue: e.newValue })

    window.addEventListener('erp:sync', handleSync)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('erp:sync', handleSync)
      window.removeEventListener('storage', handleStorage)
    }
  },

  /**
   * 1. Sincronización al Crear/Actualizar/Recibir una ORDEN DE COMPRA
   */
  syncPurchaseOrder(order, action = 'update') {
    if (!order) return

    // A. Sincronización con INVENTARIO
    if (order.estado === 'Recibida') {
      const prods = safeGet(STORAGE_KEYS.INVENTARIO_PRODS, [])
      const movements = safeGet(STORAGE_KEYS.INVENTARIO_MOVEMENTS, [])
      const today = new Date().toLocaleDateString('es-DO')

      // Incrementar stock de productos o registrar entrada
      const items = order.items && order.items.length > 0 ? order.items : [
        { descripcion: `Insumos ${order.categoria || 'Generales'}`, cantidad: 10, precioUnitario: order.total / 10 }
      ]

      items.forEach((item) => {
        const qty = Number(item.cantidad) || 1
        const existingIdx = prods.findIndex(
          (p) => p.nombre.toLowerCase() === item.descripcion.toLowerCase() ||
                 (item.descripcion.toLowerCase().includes(p.nombre.toLowerCase()))
        )

        let prodNombre = item.descripcion
        if (existingIdx >= 0) {
          prods[existingIdx].stock = (Number(prods[existingIdx].stock) || 0) + qty
          prodNombre = prods[existingIdx].nombre
        } else {
          // Registrar nuevo producto en inventario
          const newId = prods.length + 1
          prods.push({
            id: newId,
            codigo: `COM-${100 + newId}`,
            nombre: item.descripcion,
            categoria: order.categoria || 'Insumos de Compra',
            stock: qty,
            stockMin: Math.max(5, Math.round(qty * 0.2)),
            costo: item.precioUnitario || (order.total / qty),
            precio: Math.round((item.precioUnitario || (order.total / qty)) * 1.35),
            almacen: 'Almacén Principal',
            ventasUds: 0,
            ingresos: 0,
            tendencia: [5, 8, 12, 10, 15, 20],
          })
        }

        // Registrar movimiento en Kardex de Inventario
        movements.unshift({
          id: Date.now() + Math.floor(Math.random() * 1000),
          tipo: 'Entrada',
          producto: prodNombre,
          almacen: 'Almacén Principal',
          cantidad: qty,
          fecha: today,
          usuario: 'Compras (Auto-Sync)',
          referencia: order.id,
        })
      })

      safeSet(STORAGE_KEYS.INVENTARIO_PRODS, prods)
      safeSet(STORAGE_KEYS.INVENTARIO_MOVEMENTS, movements.slice(0, 100))
    }

    // B. Sincronización con FINANZAS (Cuentas por Pagar / Egresos)
    const finanzasData = safeGet(STORAGE_KEYS.FINANZAS, null) || safeGet('appes_finanzas_data_v1', {})
    if (finanzasData) {
      if (!finanzasData.comprobantes) finanzasData.comprobantes = []

      const descMatch = `Orden de compra ${order.id}`
      const existingCompIdx = finanzasData.comprobantes.findIndex(
        (c) => c.descripcion && c.descripcion.includes(order.id)
      )

      const compItem = {
        id: `comp-oc-${order.id}`,
        numero: `B01-${Math.floor(10000000 + Math.random() * 90000000)}`,
        tipo: 'Egreso',
        fecha: order.fecha || new Date().toLocaleDateString('es-DO'),
        fechaRaw: new Date().toISOString().slice(0, 10),
        descripcion: `Compra ${order.id} - ${order.proveedor} (${order.categoria || 'Suministros'})`,
        cuenta: 'Banco BHD 820-987654',
        cuentaId: 'cta-2',
        monto: Number(order.total) || 0,
        estado: order.estado === 'Recibida' ? 'Aprobado' : order.estado === 'Cancelada' ? 'Anulado' : 'Pendiente',
        creadoPor: 'compras.sync',
        categoria: 'Compras & Suministros',
        clienteProveedor: order.proveedor,
      }

      if (action === 'delete') {
        finanzasData.comprobantes = finanzasData.comprobantes.filter((c) => !c.descripcion.includes(order.id))
      } else if (existingCompIdx >= 0) {
        finanzasData.comprobantes[existingCompIdx] = {
          ...finanzasData.comprobantes[existingCompIdx],
          ...compItem,
        }
      } else {
        finanzasData.comprobantes.unshift(compItem)
      }

      safeSet(STORAGE_KEYS.FINANZAS, finanzasData)
      safeSet('appes_finanzas_data_v1', finanzasData)
    }

    // C. Registrar en Auditoría del Sistema
    erpSync.addAuditLog('Compras', `Orden ${order.id} (${order.proveedor}) - Estado: ${order.estado}`)

    // D. Notificar al Dashboard y demás módulos
    erpSync.emit('purchase_order_synced', { order, action })
  },

  /**
   * 2. Sincronización al Crear/Confirmar/Despachar un PEDIDO DE VENTA
   */
  syncSaleOrder(order, action = 'update') {
    if (!order) return

    const totalMonto = Number(order.total) || 0
    const today = order.fecha || new Date().toISOString().slice(0, 10)

    // A. Sincronización con INVENTARIO (Descuento de stock en venta)
    if (order.estado === 'Confirmado' || order.estado === 'Enviado' || order.estado === 'Entregado') {
      const prods = safeGet(STORAGE_KEYS.INVENTARIO_PRODS, [])
      const movements = safeGet(STORAGE_KEYS.INVENTARIO_MOVEMENTS, [])

      if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        order.items.forEach(item => {
          const prodIdx = prods.findIndex(p => 
            p.id === item.id || 
            (p.nombre && item.producto && p.nombre.toLowerCase() === item.producto.toLowerCase()) ||
            (p.codigo && item.codigo && p.codigo.toLowerCase() === item.codigo.toLowerCase())
          )
          const qtyVendida = Number(item.cantidad) || 1
          const itemSubtotal = Number(item.subtotal) || (qtyVendida * (Number(item.precio) || 100))

          if (prodIdx >= 0) {
            prods[prodIdx].stock = Math.max(0, (Number(prods[prodIdx].stock) || 0) - qtyVendida)
            prods[prodIdx].ventasUds = (Number(prods[prodIdx].ventasUds) || 0) + qtyVendida
            prods[prodIdx].ingresos = (Number(prods[prodIdx].ingresos) || 0) + itemSubtotal

            movements.unshift({
              id: Date.now() + Math.floor(Math.random() * 1000),
              tipo: 'Salida',
              producto: prods[prodIdx].nombre,
              almacen: prods[prodIdx].almacen || 'Almacén Principal',
              cantidad: -qtyVendida,
              fecha: new Date().toLocaleDateString('es-DO'),
              usuario: 'Ventas (Auto-Sync)',
              referencia: order.numero || order.id,
            })
          }
        })
        safeSet(STORAGE_KEYS.INVENTARIO_PRODS, prods)
        safeSet(STORAGE_KEYS.INVENTARIO_MOVEMENTS, movements.slice(0, 100))
      } else if (prods.length > 0) {
        const prod = prods[0]
        const cantVendida = Math.max(1, Math.round(totalMonto / (prod.precio || 100)))
        prod.stock = Math.max(0, (Number(prod.stock) || 0) - cantVendida)
        prod.ventasUds = (Number(prod.ventasUds) || 0) + cantVendida
        prod.ingresos = (Number(prod.ingresos) || 0) + totalMonto

        movements.unshift({
          id: Date.now() + Math.floor(Math.random() * 1000),
          tipo: 'Salida',
          producto: prod.nombre,
          almacen: prod.almacen || 'Almacén Principal',
          cantidad: -cantVendida,
          fecha: new Date().toLocaleDateString('es-DO'),
          usuario: 'Ventas (Auto-Sync)',
          referencia: order.numero || order.id,
        })

        safeSet(STORAGE_KEYS.INVENTARIO_PRODS, prods)
        safeSet(STORAGE_KEYS.INVENTARIO_MOVEMENTS, movements.slice(0, 100))
      }
    }

    // B. Sincronización con CRM (Historial y Valor de Vida del Cliente)
    const clients = safeGet(STORAGE_KEYS.CRM_CLIENTS, [])
    const clientName = order.cliente
    if (clientName) {
      const clientIdx = clients.findIndex(
        (c) => c.nombre.toLowerCase() === clientName.toLowerCase()
      )

      if (clientIdx >= 0) {
        clients[clientIdx].totalVentas = (Number(clients[clientIdx].totalVentas) || 0) + totalMonto
        clients[clientIdx].pedidosCount = (Number(clients[clientIdx].pedidosCount) || 0) + 1
        clients[clientIdx].ultimoPedido = today
        clients[clientIdx].estado = 'Activo'
        clients[clientIdx].estadoTipo = 'success'
      } else {
        clients.push({
          id: Date.now(),
          nombre: clientName,
          contacto: 'Contacto Comercial',
          email: `ventas@${clientName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          telefono: '(809) 555-' + Math.floor(1000 + Math.random() * 9000),
          sector: 'Comercial / Farmacia',
          estado: 'Activo',
          estadoTipo: 'success',
          totalVentas: totalMonto,
          pedidosCount: 1,
          ultimoPedido: today,
        })
      }
      safeSet(STORAGE_KEYS.CRM_CLIENTS, clients)
    }

    // C. Sincronización con FINANZAS (Comprobante Fiscal de Ingreso B01/B02)
    const finanzasData = safeGet(STORAGE_KEYS.FINANZAS, null) || safeGet('appes_finanzas_data_v1', {})
    if (finanzasData) {
      if (!finanzasData.comprobantes) finanzasData.comprobantes = []

      const compItem = {
        id: `vta-comp-${order.id || order.numero}`,
        numero: `B02-${Math.floor(10000000 + Math.random() * 90000000)}`,
        tipo: 'Ingreso',
        fecha: new Date().toLocaleDateString('es-DO'),
        fechaRaw: today,
        descripcion: `Cobro pedido ${order.numero || order.id} - ${order.cliente}`,
        cuenta: 'Banco Popular 960-123456',
        cuentaId: 'cta-1',
        monto: totalMonto,
        estado: order.estado === 'Cancelado' ? 'Anulado' : order.estado === 'Pendiente' ? 'Pendiente' : 'Aprobado',
        creadoPor: 'ventas.sync',
        categoria: 'Ventas de Productos',
        clienteProveedor: order.cliente,
      }

      const existingIdx = finanzasData.comprobantes.findIndex(
        (c) => c.descripcion && c.descripcion.includes(order.numero || order.id)
      )

      if (action === 'delete') {
        finanzasData.comprobantes = finanzasData.comprobantes.filter(
          (c) => !c.descripcion.includes(order.numero || order.id)
        )
      } else if (existingIdx >= 0) {
        finanzasData.comprobantes[existingIdx] = {
          ...finanzasData.comprobantes[existingIdx],
          ...compItem,
        }
      } else {
        finanzasData.comprobantes.unshift(compItem)
      }

      safeSet(STORAGE_KEYS.FINANZAS, finanzasData)
      safeSet('appes_finanzas_data_v1', finanzasData)
    }

    // D. Registrar en Auditoría
    erpSync.addAuditLog('Ventas', `Pedido ${order.numero || order.id} (${order.cliente}) - Total: RD$ ${totalMonto}`)

    // E. Emitir evento a todos los módulos
    erpSync.emit('sale_order_synced', { order, action })
  },

  /**
   * 3. Sincronización de Oportunidades CRM Ganadas -> Proyectos & Ventas
   */
  syncCrmOpportunity(opportunity) {
    if (!opportunity) return

    if (opportunity.etapa === 'Cierre' || opportunity.probabilidad >= 90) {
      const proyectos = safeGet(STORAGE_KEYS.PROYECTOS, [])
      const yaExiste = proyectos.some(
        (p) => p.nombre.toLowerCase() === opportunity.nombre.toLowerCase()
      )

      if (!yaExiste) {
        const newProj = {
          id: `PRY-0${proyectos.length + 1}`,
          nombre: opportunity.nombre,
          cliente: opportunity.cliente,
          presupuesto: Number(opportunity.valor) || 500000,
          avance: 10,
          estado: 'En curso',
          fechaFin: opportunity.fechaCierre || '2026-10-31',
          responsable: 'Equipo Proyectos ERP',
        }
        proyectos.unshift(newProj)
        safeSet(STORAGE_KEYS.PROYECTOS, proyectos)
      }
    }

    erpSync.addAuditLog('CRM', `Oportunidad "${opportunity.nombre}" actualizada: ${opportunity.etapa}`)
    erpSync.emit('crm_opportunity_synced', { opportunity })
  },

  /**
   * 4. Registrador de Auditoría Global del ERP
   */
  addAuditLog(modulo, accion) {
    const logs = safeGet(STORAGE_KEYS.AUDIT_LOGS, [])
    const now = new Date()
    const newLog = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      modulo,
      accion,
      usuario: 'admin@appes.com',
      ip: '192.168.1.105',
      fecha: `${now.toLocaleDateString('es-DO')} ${now.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}`,
    }
    const updated = [newLog, ...logs].slice(0, 100)
    safeSet(STORAGE_KEYS.AUDIT_LOGS, updated)
  },

  /**
   * 5. Reconciliación Integral Automática (Corre al iniciar el ERP)
   */
  reconcileAll() {
    try {
      const rawCompras = safeGet(STORAGE_KEYS.COMPRAS, [])
      const rawVentas = safeGet(STORAGE_KEYS.VENTAS, [])
      const finanzas = safeGet(STORAGE_KEYS.FINANZAS, null)

      // Si Finanzas no tiene los comprobantes de Compras y Ventas, agregarlos
      if (finanzas && finanzas.comprobantes) {
        let changed = false

        rawCompras.forEach((oc) => {
          const yaExiste = finanzas.comprobantes.some(
            (c) => c.descripcion && c.descripcion.includes(oc.id)
          )
          if (!yaExiste) {
            finanzas.comprobantes.push({
              id: `comp-oc-${oc.id}`,
              numero: `B01-${Math.floor(10000000 + Math.random() * 90000000)}`,
              tipo: 'Egreso',
              fecha: oc.fecha,
              fechaRaw: new Date().toISOString().slice(0, 10),
              descripcion: `Compra ${oc.id} - ${oc.proveedor}`,
              cuenta: 'Banco BHD 820-987654',
              cuentaId: 'cta-2',
              monto: Number(oc.total) || 0,
              estado: oc.estado === 'Recibida' ? 'Aprobado' : oc.estado === 'Cancelada' ? 'Anulado' : 'Pendiente',
              creadoPor: 'compras.auto',
              categoria: 'Compras & Suministros',
              clienteProveedor: oc.proveedor,
            })
            changed = true
          }
        })

        rawVentas.forEach((v) => {
          const yaExiste = finanzas.comprobantes.some(
            (c) => c.descripcion && c.descripcion.includes(v.numero || v.id)
          )
          if (!yaExiste) {
            finanzas.comprobantes.push({
              id: `vta-comp-${v.id || v.numero}`,
              numero: `B02-${Math.floor(10000000 + Math.random() * 90000000)}`,
              tipo: 'Ingreso',
              fecha: v.fecha,
              fechaRaw: v.fecha,
              descripcion: `Cobro pedido ${v.numero || v.id} - ${v.cliente}`,
              cuenta: 'Banco Popular 960-123456',
              cuentaId: 'cta-1',
              monto: Number(v.total) || 0,
              estado: v.estado === 'Cancelado' ? 'Anulado' : 'Aprobado',
              creadoPor: 'ventas.auto',
              categoria: 'Ventas de Productos',
              clienteProveedor: v.cliente,
            })
            changed = true
          }
        })

        if (changed) {
          safeSet(STORAGE_KEYS.FINANZAS, finanzas)
          safeSet('appes_finanzas_data_v1', finanzas)
        }
      }
    } catch (e) {
      console.warn('[erpSync] Error in reconcileAll:', e)
    }
  },
}

// Ejecutar reconciliación inicial automática
erpSync.reconcileAll()
