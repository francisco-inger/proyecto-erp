import { useEffect, useMemo, useState } from 'react'
import { ventasService } from '../services/ventas.service'
import './VentasHome.css'

const ORDER_STATUS = ['Todos', 'Pendiente', 'Confirmado', 'Enviado', 'Entregado', 'Cancelado']

const EMPTY_FORM = {
  customerName: '',
  customerEmail: '',
  status: 'Pendiente',
  total: '',
  notes: '',
}

function normalizeOrder(rawOrder, index = 0) {
  const source = rawOrder && typeof rawOrder === 'object' ? rawOrder : {}

  const totalValue = Number(source.total ?? source.amount ?? source.totalAmount ?? 0)

  return {
    id: source.id ?? source._id ?? `pedido-${index + 1}`,
    customerName:
      source.customerName ||
      source.customer ||
      source.cliente ||
      source.clientName ||
      source.name ||
      'Cliente sin nombre',
    customerEmail: source.customerEmail || source.email || '',
    status: String(source.status || source.estado || 'Pendiente'),
    total: Number.isFinite(totalValue) ? totalValue : 0,
    createdAt:
      source.createdAt ||
      source.created_at ||
      source.fecha ||
      source.fechaCreacion ||
      source.date ||
      new Date().toISOString(),
    notes: source.notes || source.observations || source.observaciones || 'Sin observaciones',
    items: Array.isArray(source.items) ? source.items : [],
  }
}

function normalizeOrders(payload) {
  if (Array.isArray(payload)) {
    return payload.map((order, index) => normalizeOrder(order, index))
  }

  if (payload && typeof payload === 'object') {
    const candidates = [payload.orders, payload.data, payload.results]

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate.map((order, index) => normalizeOrder(order, index))
      }
    }
  }

  return []
}

export function VentasHome() {
  const [orders, setOrders] = useState([])
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formState, setFormState] = useState(EMPTY_FORM)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadOrders() {
      try {
        setLoading(true)
        setLoadError('')

        const response = await ventasService.listOrders()

        if (!isMounted) return

        const normalized = normalizeOrders(response)
        setOrders(normalized)
        setSelectedOrderId((current) => current || normalized[0]?.id || '')
      } catch (error) {
        if (!isMounted) return
        setOrders([])
        setLoadError(error?.message || 'No se pudieron cargar los pedidos.')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadOrders()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'Todos' || order.status === statusFilter
      const text = `${order.id} ${order.customerName} ${order.customerEmail}`.toLowerCase()
      const matchesQuery = !query || text.includes(query)
      return matchesStatus && matchesQuery
    })
  }, [orders, searchTerm, statusFilter])

  useEffect(() => {
    if (!filteredOrders.length) {
      setSelectedOrderId('')
      return
    }

    const currentExists = filteredOrders.some((order) => order.id === selectedOrderId)
    if (!currentExists) {
      setSelectedOrderId(filteredOrders[0].id)
    }
  }, [filteredOrders, selectedOrderId])

  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) || filteredOrders[0] || null

  const summary = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0)
    const pendings = orders.filter((order) => order.status === 'Pendiente').length
    const confirmed = orders.filter((order) => order.status === 'Confirmado').length
    const sent = orders.filter((order) => order.status === 'Enviado').length
    const completed = orders.filter((order) => order.status === 'Entregado').length

    return {
      totalOrders: orders.length,
      totalRevenue,
      pendings,
      confirmed,
      sent,
      completed,
    }
  }, [orders])

  const statusBreakdown = useMemo(() => {
    const countByStatus = ORDER_STATUS.filter((status) => status !== 'Todos').map((status) => ({
      status,
      count: orders.filter((order) => order.status === status).length,
    }))

    return countByStatus
  }, [orders])

  const quotePreview = [
    { id: 'COT-2041', customer: 'Northwind', total: 2650, status: 'Pendiente' },
    { id: 'COT-2042', customer: 'Apex Labs', total: 3320, status: 'Aprobada' },
    { id: 'COT-2043', customer: 'Luma Studio', total: 1485, status: 'Borrador' },
  ]

  const invoicePreview = [
    { id: 'FAC-9901', customer: 'Giro Financiero', total: 4400, status: 'Pagada' },
    { id: 'FAC-9902', customer: 'CloudX', total: 2780, status: 'Pendiente' },
    { id: 'FAC-9903', customer: 'Grupo Verde', total: 1840, status: 'En revisión' },
  ]

  function handleInputChange(event) {
    const { name, value } = event.target
    setFormState((current) => ({ ...current, [name]: value }))
  }

  async function handleCreateOrder(event) {
    event.preventDefault()

    setCreateError('')
    setCreateSuccess('')

    const payload = {
      customerName: formState.customerName.trim(),
      customerEmail: formState.customerEmail.trim(),
      status: formState.status,
      total: Number(formState.total) || 0,
      notes: formState.notes.trim(),
    }

    if (!payload.customerName) {
      setCreateError('Necesitas indicar el cliente del pedido.')
      return
    }

    try {
      setCreating(true)
      const response = await ventasService.createOrder(payload)

      const newOrder = normalizeOrders([response])[0] || {
        ...payload,
        id: `pedido-${Date.now()}`,
        createdAt: new Date().toISOString(),
        items: [],
      }

      setOrders((current) => [newOrder, ...current])
      setSelectedOrderId(newOrder.id)
      setFormState(EMPTY_FORM)
      setShowCreateModal(false)
      setCreateSuccess('Pedido creado correctamente.')
    } catch (error) {
      setCreateError(error?.message || 'No se pudo crear el pedido.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="ventas-page">
      <header className="ventas-header">
        <div>
          <span className="badge ventas-badge">Ventas</span>
          <h1>Panel de ventas</h1>
        </div>

        <button className="primary-button" onClick={() => setShowCreateModal(true)}>
          + Nuevo pedido
        </button>
      </header>

      {loadError ? (
        <div className="alert alert-error">{loadError}</div>
      ) : null}

      {createSuccess ? (
        <div className="alert alert-success">{createSuccess}</div>
      ) : null}

      <section className="summary-grid">
        <article className="summary-card accent-blue">
          <span>Total pedidos</span>
          <strong>{summary.totalOrders}</strong>
          <small>Activos en el ciclo</small>
        </article>

        <article className="summary-card accent-green">
          <span>Ingresos</span>
          <strong>$ {summary.totalRevenue.toLocaleString('es-ES', { maximumFractionDigits: 2 })}</strong>
          <small>Base de ventas</small>
        </article>

        <article className="summary-card accent-gold">
          <span>Pendientes</span>
          <strong>{summary.pendings}</strong>
          <small>Esperando confirmación</small>
        </article>

        <article className="summary-card accent-purple">
          <span>Entregados</span>
          <strong>{summary.completed}</strong>
          <small>Finalizados</small>
        </article>
      </section>

      <div className="ventas-content">
        <section className="panel panel-table">
          <div className="panel-header">
            <div>
              <h2>Pedidos</h2>
              <p>Gestión del pipeline de ventas</p>
            </div>

            <div className="filters-row">
              <input
                type="search"
                value={searchTerm}
                placeholder="Buscar cliente o pedido"
                onChange={(event) => setSearchTerm(event.target.value)}
              />

              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                {ORDER_STATUS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="state-card">Cargando pedidos...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="state-card empty-state">
              <strong>No hay pedidos para mostrar.</strong>
              <span>Usa “Nuevo pedido” para crear el primero.</span>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className={selectedOrder?.id === order.id ? 'selected-row' : ''}
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <td>#{order.id}</td>
                      <td>{order.customerName}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString('es-ES')}</td>
                      <td>
                        <span className={`status-pill status-${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>$ {Number(order.total || 0).toLocaleString('es-ES', { maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="panel detail-panel">
          <div className="panel-header compact">
            <div>
              <h2>Detalle</h2>
              <p>Vista del pedido seleccionado</p>
            </div>
          </div>

          {selectedOrder ? (
            <>
              <div className="detail-topbar">
                <span className="muted-label">Pedido</span>
                <strong>#{selectedOrder.id}</strong>
              </div>

              <div className="detail-block">
                <h3>{selectedOrder.customerName}</h3>
                <p>{selectedOrder.customerEmail || 'Sin correo registrado'}</p>
              </div>

              <div className="detail-grid">
                <div>
                  <span>Estado</span>
                  <strong>{selectedOrder.status}</strong>
                </div>
                <div>
                  <span>Fecha</span>
                  <strong>{new Date(selectedOrder.createdAt).toLocaleDateString('es-ES')}</strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>$ {Number(selectedOrder.total || 0).toLocaleString('es-ES', { maximumFractionDigits: 2 })}</strong>
                </div>
                <div>
                  <span>Artículos</span>
                  <strong>{selectedOrder.items.length || 0}</strong>
                </div>
              </div>

              <div className="detail-notes">
                <h4>Notas</h4>
                <p>{selectedOrder.notes || 'Sin observaciones para este pedido.'}</p>
              </div>
            </>
          ) : (
            <div className="state-card">Selecciona un pedido para ver sus detalles.</div>
          )}

          <div className="status-panel">
            <h3>Estado de pedidos</h3>
            <div className="status-list">
              {statusBreakdown.map((item) => (
                <div key={item.status} className="status-item">
                  <div className="status-head">
                    <span>{item.status}</span>
                    <strong>{item.count}</strong>
                  </div>
                  <div className="progress-bar">
                    <span style={{ width: `${orders.length ? (item.count / orders.length) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <section className="secondary-grid">
        <article className="panel mini-panel">
          <div className="panel-header compact">
            <div>
              <h2>Cotizaciones</h2>
              <p>Preparado para un endpoint futuro</p>
            </div>
          </div>

          <ul className="mini-list">
            {quotePreview.map((quote) => (
              <li key={quote.id}>
                <div>
                  <strong>{quote.id}</strong>
                  <span>{quote.customer}</span>
                </div>
                <div>
                  <b>$ {quote.total.toLocaleString('es-ES')}</b>
                  <em>{quote.status}</em>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel mini-panel">
          <div className="panel-header compact">
            <div>
              <h2>Facturas</h2>
              <p>Preparado para un endpoint futuro</p>
            </div>
          </div>

          <ul className="mini-list">
            {invoicePreview.map((invoice) => (
              <li key={invoice.id}>
                <div>
                  <strong>{invoice.id}</strong>
                  <span>{invoice.customer}</span>
                </div>
                <div>
                  <b>$ {invoice.total.toLocaleString('es-ES')}</b>
                  <em>{invoice.status}</em>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      {showCreateModal ? (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header compact">
              <div>
                <h2>Crear pedido</h2>
                <p>Se envía a /api/sales/orders</p>
              </div>
            </div>

            <form onSubmit={handleCreateOrder} className="order-form">
              <div className="field-grid">
                <label>
                  <span>Cliente</span>
                  <input
                    name="customerName"
                    value={formState.customerName}
                    onChange={handleInputChange}
                    placeholder="Nombre del cliente"
                  />
                </label>

                <label>
                  <span>Email</span>
                  <input
                    name="customerEmail"
                    type="email"
                    value={formState.customerEmail}
                    onChange={handleInputChange}
                    placeholder="cliente@correo.com"
                  />
                </label>

                <label>
                  <span>Estado</span>
                  <select name="status" value={formState.status} onChange={handleInputChange}>
                    {ORDER_STATUS.filter((status) => status !== 'Todos').map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Total</span>
                  <input
                    name="total"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.total}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </label>
              </div>

              <label>
                <span>Notas</span>
                <textarea
                  name="notes"
                  value={formState.notes}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Información adicional del pedido"
                />
              </label>

              {createError ? <div className="alert alert-error">{createError}</div> : null}

              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="primary-button" disabled={creating}>
                  {creating ? 'Creando...' : 'Crear pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
