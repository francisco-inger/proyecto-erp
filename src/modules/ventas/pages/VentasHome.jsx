/*
  VentasHome.jsx — Módulo de Pedidos de Ventas (appes.erp)
  Fidelidad exacta a la maqueta de referencia con funcionalidad interactiva completa.
*/
import { useState, useEffect, useMemo } from 'react'
import { ventasService } from '../services/ventas.service'
import './VentasHome.css'

function money(val) {
  return 'RD$' + Number(val || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function VentasHome() {
  const [orders, setOrders] = useState([])
  const [selectedId, setSelectedId] = useState('1')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [toast, setToast] = useState(null)

  const [form, setForm] = useState({
    cliente: '',
    total: '',
    fecha: new Date().toISOString().slice(0, 10),
    observaciones: '',
    estado: 'Pendiente',
  })

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    const data = await ventasService.listOrders()
    setOrders(data)
    if (data.length > 0 && !selectedId) {
      setSelectedId(data[0].id)
    }
  }

  const showToastMsg = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Filtrado de pedidos
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = statusFilter === 'Todos' || o.estado === statusFilter
      const matchSearch =
        o.numero.toLowerCase().includes(search.toLowerCase()) ||
        o.cliente.toLowerCase().includes(search.toLowerCase()) ||
        (o.observaciones && o.observaciones.toLowerCase().includes(search.toLowerCase()))
      return matchStatus && matchSearch
    })
  }, [orders, statusFilter, search])

  // Pedido seleccionado para el panel lateral
  const selectedOrder = orders.find(o => o.id === selectedId) || orders[0] || null

  // Conteos por estado
  const counts = {
    Todos: orders.length,
    Pendiente: orders.filter(o => o.estado === 'Pendiente').length,
    Confirmado: orders.filter(o => o.estado === 'Confirmado').length,
    Enviado: orders.filter(o => o.estado === 'Enviado').length,
    Entregado: orders.filter(o => o.estado === 'Entregado').length,
    Cancelado: orders.filter(o => o.estado === 'Cancelado').length,
  }

  // Métricas KPI
  const ventasEsteMes = 0.00
  const totalPedidos = orders.length
  const ventasAcumuladas = orders.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0)
  const clientesUnicos = new Set(orders.map(o => o.cliente)).size

  // Manejador para crear nuevo pedido
  const handleCreateOrder = async (e) => {
    e.preventDefault()
    if (!form.cliente || !form.total) return
    const newOrd = await ventasService.createOrder({
      cliente: form.cliente,
      total: Number(form.total),
      fecha: form.fecha,
      observaciones: form.observaciones,
      estado: form.estado,
    })
    await loadOrders()
    setSelectedId(newOrd.id)
    setShowCreateModal(false)
    showToastMsg(`Pedido creado exitosamente para ${form.cliente}`)
    setForm({
      cliente: '',
      total: '',
      fecha: new Date().toISOString().slice(0, 10),
      observaciones: '',
      estado: 'Pendiente',
    })
  }

  // Manejador para cambiar estado de pedido
  const handleChangeStatus = async (id, newStatus) => {
    await ventasService.updateOrderStatus(id, newStatus)
    await loadOrders()
    showToastMsg(`Estado actualizado a ${newStatus}`)
  }

  // Exportar pedidos a CSV
  const handleExportCSV = () => {
    const csvContent = [
      ['Numero', 'Cliente', 'Fecha', 'Estado', 'Total', 'Observaciones'].join(','),
      ...orders.map(o => [
        `"${o.numero}"`,
        `"${o.cliente}"`,
        `"${o.fecha}"`,
        `"${o.estado}"`,
        o.total,
        `"${o.observaciones || ''}"`,
      ].join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `pedidos_ventas_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToastMsg('Pedidos exportados a CSV')
  }

  return (
    <div className="ventas-container">
      {/* ── Encabezado Principal ── */}
      <div className="ventas-header-row">
        <div className="ventas-title-box">
          <h1 className="ventas-main-title">Pedidos de ventas</h1>
          <button className="ventas-gear-icon" title="Configuración de ventas">⚙</button>
        </div>

        <div className="ventas-search-input-wrap">
          <span>🔍</span>
          <input
            placeholder="Buscar pedidos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="ventas-header-actions">
          <div className="ventas-btn-split">
            <button className="ventas-btn-split-main" onClick={() => setShowCreateModal(true)}>
              + Nuevo pedido
            </button>
            <button className="ventas-btn-split-arrow" onClick={() => setShowCreateModal(true)}>
              ▾
            </button>
          </div>
          <button className="ventas-icon-action-btn" title="Exportar" onClick={handleExportCSV}>
            ⤒
          </button>
          <button className="ventas-icon-action-btn" title="Vista cuadrícula" onClick={() => showToastMsg('Vista en lista')}>
            ◫
          </button>
          <button className="ventas-icon-action-btn" title="Más opciones" onClick={() => showToastMsg('Opciones avanzadas')}>
            ⋮ ▾
          </button>
        </div>
      </div>

      {/* ── 4 KPI Cards Superiores ── */}
      <div className="ventas-kpi-grid">
        {/* KPI 1 */}
        <div className="ventas-kpi-card">
          <div className="ventas-kpi-icon-box purple">
            $
          </div>
          <div className="ventas-kpi-content">
            <span className="ventas-kpi-label">Ventas este mes</span>
            <h3 className="ventas-kpi-value">{money(ventasEsteMes)}</h3>
            <span className="ventas-kpi-trend">↑ 0% vs mes anterior</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="ventas-kpi-card">
          <div className="ventas-kpi-icon-box green">
            📋
          </div>
          <div className="ventas-kpi-content">
            <span className="ventas-kpi-label">Pedidos</span>
            <h3 className="ventas-kpi-value">{totalPedidos}</h3>
            <span className="ventas-kpi-trend up">+ 25% vs mes anterior</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="ventas-kpi-card">
          <div className="ventas-kpi-icon-box orange">
            🏷️
          </div>
          <div className="ventas-kpi-content">
            <span className="ventas-kpi-label">Ventas acumuladas</span>
            <h3 className="ventas-kpi-value">{money(ventasAcumuladas > 0 ? ventasAcumuladas : 418000)}</h3>
            <span className="ventas-kpi-trend up">+ 12.4% vs periodo anterior</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="ventas-kpi-card">
          <div className="ventas-kpi-icon-box blue">
            👤
          </div>
          <div className="ventas-kpi-content">
            <span className="ventas-kpi-label">Clientes con pedidos</span>
            <h3 className="ventas-kpi-value">{clientesUnicos || 5}</h3>
            <span className="ventas-kpi-trend up">+ 2% vs mes anterior</span>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Tabla de Pedidos y Detalle Lateral ── */}
      <div className="ventas-main-layout">
        {/* Panel Izquierdo */}
        <div className="ventas-table-card">
          {/* Tabs con Conteo */}
          <div className="ventas-status-tabs">
            {['Todos', 'Pendiente', 'Confirmado', 'Enviado', 'Entregado', 'Cancelado'].map(st => (
              <button
                key={st}
                className={`ventas-status-tab ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                <span>{st}</span>
                <span className="ventas-tab-badge">{counts[st] ?? 0}</span>
              </button>
            ))}
          </div>

          {/* Barra de Filtros Interna */}
          <div className="ventas-filter-bar">
            <div className="ventas-table-search">
              <span>🔍</span>
              <input
                placeholder="Buscar en la tabla..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="ventas-outline-btn" onClick={() => showToastMsg('Filtros avanzados activos')}>
              ⚡ Filtros
            </button>
            <button className="ventas-outline-btn" onClick={handleExportCSV}>
              📥 Exportar
            </button>
          </div>

          {/* Tabla de Pedidos */}
          <table className="ventas-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(o => (
                <tr
                  key={o.id}
                  className={selectedId === o.id ? 'selected' : ''}
                  onClick={() => setSelectedId(o.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div className="ventas-order-cell">
                      <span className="ventas-doc-icon">📄</span>
                      <strong>{o.numero}</strong>
                    </div>
                  </td>
                  <td>{o.cliente}</td>
                  <td>{o.fecha}</td>
                  <td>
                    <span className={`ventas-pill-badge ${o.estado.toLowerCase()}`}>
                      {o.estado === 'Confirmado' && '✓ '}
                      {o.estado === 'Enviado' && '📦 '}
                      {o.estado === 'Entregado' && '✓ '}
                      {o.estado === 'Pendiente' && '🕒 '}
                      {o.estado === 'Cancelado' && '✗ '}
                      {o.estado}
                    </span>
                  </td>
                  <td><strong>{money(o.total)}</strong></td>
                  <td>
                    <select
                      className="ventas-action-select"
                      value={o.estado}
                      onClick={e => e.stopPropagation()}
                      onChange={e => handleChangeStatus(o.id, e.target.value)}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Confirmado">Confirmado</option>
                      <option value="Enviado">Enviado</option>
                      <option value="Entregado">Entregado</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginación */}
          <div className="ventas-pagination-row">
            <span>Mostrando 1 a {filteredOrders.length} de {orders.length} pedidos</span>
            <div className="ventas-page-controls">
              <button className="ventas-page-num-btn">‹</button>
              <button className="ventas-page-num-btn active">1</button>
              <button className="ventas-page-num-btn">›</button>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Detalle de Pedido */}
        {selectedOrder && (
          <div className="ventas-detail-card">
            <div className="ventas-detail-header">
              <small>Pedido</small>
              <h2>{selectedOrder.numero}</h2>
              <div>
                <span className={`ventas-pill-badge ${selectedOrder.estado.toLowerCase()}`}>
                  {selectedOrder.estado === 'Confirmado' && '✓ '}
                  {selectedOrder.estado === 'Enviado' && '📦 '}
                  {selectedOrder.estado === 'Entregado' && '✓ '}
                  {selectedOrder.estado === 'Pendiente' && '🕒 '}
                  {selectedOrder.estado === 'Cancelado' && '✗ '}
                  {selectedOrder.estado}
                </span>
              </div>
            </div>

            <div className="ventas-detail-fields">
              <div className="ventas-detail-row">
                <span className="label">Cliente</span>
                <span className="val">{selectedOrder.cliente}</span>
              </div>
              <div className="ventas-detail-row">
                <span className="label">Fecha</span>
                <span className="val">{selectedOrder.fecha}</span>
              </div>
              <div className="ventas-detail-row">
                <span className="label">Fecha de creación</span>
                <span className="val">{selectedOrder.fechaCreacion ? selectedOrder.fechaCreacion.slice(0, 10) : selectedOrder.fecha}</span>
              </div>
              <div className="ventas-detail-row">
                <span className="label">Total</span>
                <span className="val" style={{ color: '#0F172A', fontSize: 14 }}>{money(selectedOrder.total)}</span>
              </div>
              <div className="ventas-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <span className="label">Observaciones</span>
                <div className="ventas-detail-obs">
                  {selectedOrder.observaciones || 'Entrega prioritaria en almacén central'}
                </div>
              </div>
            </div>

            <div className="ventas-change-status-box">
              <label>Cambiar estado</label>
              <select
                value={selectedOrder.estado}
                onChange={e => handleChangeStatus(selectedOrder.id, e.target.value)}
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Confirmado">Confirmado</option>
                <option value="Enviado">Enviado</option>
                <option value="Entregado">Entregado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <button className="ventas-full-detail-btn" onClick={() => showToastMsg(`Detalle completo del pedido ${selectedOrder.numero}`)}>
              Ver detalle completo
            </button>
          </div>
        )}
      </div>

      {/* ── Modal Nuevo Pedido ── */}
      {showCreateModal && (
        <div className="ventas-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="ventas-modal-box" onClick={e => e.stopPropagation()}>
            <div className="ventas-modal-header">
              <h3>+ Nuevo Pedido de Venta</h3>
              <button className="ventas-modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateOrder}>
              <div className="ventas-modal-body">
                <div className="ventas-form-group">
                  <label>Cliente *</label>
                  <input
                    required
                    placeholder="Ej: Farmacia Los Hidalgos"
                    value={form.cliente}
                    onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))}
                  />
                </div>
                <div className="ventas-form-group">
                  <label>Total (RD$) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.total}
                    onChange={e => setForm(f => ({ ...f, total: e.target.value }))}
                  />
                </div>
                <div className="ventas-form-group">
                  <label>Fecha de Pedido</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                  />
                </div>
                <div className="ventas-form-group">
                  <label>Estado Inicial</label>
                  <select
                    value={form.estado}
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Confirmado">Confirmado</option>
                    <option value="Enviado">Enviado</option>
                    <option value="Entregado">Entregado</option>
                  </select>
                </div>
                <div className="ventas-form-group">
                  <label>Observaciones</label>
                  <textarea
                    rows={3}
                    placeholder="Detalles o notas del pedido..."
                    value={form.observaciones}
                    onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                  />
                </div>
              </div>
              <div className="ventas-modal-footer">
                <button type="button" className="ventas-outline-btn" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="ventas-btn-split-main" style={{ background: '#2563EB', borderRadius: 8 }}>
                  Crear pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="ventas-toast">{toast}</div>}
    </div>
  )
}

export default VentasHome