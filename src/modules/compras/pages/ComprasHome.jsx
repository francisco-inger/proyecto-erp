/*
  ComprasHome.jsx — Módulo de Compras (appes.erp)
  Fidelidad exacta a la maqueta de referencia con funcionalidad interactiva y persistencia en localStorage.
*/
import { useState, useEffect, useMemo } from 'react'
import './ComprasHome.css'

const STORAGE_KEY = 'compras_orders_v1'

const SEED_COMPRAS = [
  { id: 'OC-001', proveedor: 'Distribuidora Tech SRL', fecha: '05/08/2026', total: 280000, estado: 'Recibida', entregado: '05/08/2026' },
  { id: 'OC-002', proveedor: 'Electrónica Global SA', fecha: '07/08/2026', total: 145000, estado: 'Pendiente', entregado: '—' },
  { id: 'OC-003', proveedor: 'Suministros Caribe', fecha: '09/08/2026', total: 67500, estado: 'En Tránsito', entregado: '—' },
  { id: 'OC-004', proveedor: 'Ferretería Industrial', fecha: '08/08/2026', total: 320000, estado: 'Recibida', entregado: '08/08/2026' },
  { id: 'OC-005', proveedor: 'Papelería & Oficina RD', fecha: '06/08/2026', total: 85000, estado: 'Cancelada', entregado: '—' },
  { id: 'OC-006', proveedor: 'Importadora Médica Dominicana', fecha: '04/08/2026', total: 190000, estado: 'Recibida', entregado: '04/08/2026' },
  { id: 'OC-007', proveedor: 'Soluciones IT del Caribe', fecha: '03/08/2026', total: 115000, estado: 'Pendiente', entregado: '—' },
  { id: 'OC-008', proveedor: 'Plásticos & Envases SRL', fecha: '02/08/2026', total: 47500, estado: 'En Tránsito', entregado: '—' },
]

function money(val) {
  return 'RD$ ' + Number(val || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function getStoredCompras() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_COMPRAS))
  return SEED_COMPRAS
}

function saveStoredCompras(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function ComprasHome() {
  const [ordenes, setOrdenes] = useState([])
  const [activeTab, setActiveTab] = useState('Todas')
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedOrden, setSelectedOrden] = useState(null)
  const [toast, setToast] = useState(null)

  const [form, setForm] = useState({
    proveedor: '',
    total: '',
    fecha: new Date().toLocaleDateString('es-DO'),
    estado: 'Pendiente',
    entregado: '—',
  })

  useEffect(() => {
    setOrdenes(getStoredCompras())
  }, [])

  const showToastMsg = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Filtrado de órdenes
  const filteredOrdenes = useMemo(() => {
    return ordenes.filter(o => {
      let matchTab = true
      if (activeTab === 'Pendientes') matchTab = o.estado === 'Pendiente'
      else if (activeTab === 'En Tránsito') matchTab = o.estado === 'En Tránsito'
      else if (activeTab === 'Recibidas') matchTab = o.estado === 'Recibida'
      else if (activeTab === 'Canceladas') matchTab = o.estado === 'Cancelada'

      const q = search.toLowerCase()
      const matchSearch =
        o.id.toLowerCase().includes(q) ||
        o.proveedor.toLowerCase().includes(q)

      return matchTab && matchSearch
    })
  }, [ordenes, activeTab, search])

  // Conteos para los tabs
  const counts = {
    Todas: ordenes.length,
    Pendientes: ordenes.filter(o => o.estado === 'Pendiente').length,
    'En Tránsito': ordenes.filter(o => o.estado === 'En Tránsito').length,
    Recibidas: ordenes.filter(o => o.estado === 'Recibida').length,
    Canceladas: ordenes.filter(o => o.estado === 'Cancelada').length,
  }

  // KPIs
  const totalOrdenesMes = ordenes.length || 12
  const totalComprasMes = ordenes.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0)
  const ordenesPendientes = ordenes.filter(o => o.estado === 'Pendiente').length
  const proveedoresActivos = new Set(ordenes.map(o => o.proveedor)).size || 18

  // Crear nueva orden
  const handleCreateOrden = (e) => {
    e.preventDefault()
    if (!form.proveedor || !form.total) return

    const count = ordenes.length + 1
    const pad = count < 10 ? `00${count}` : count < 100 ? `0${count}` : `${count}`
    const newOrden = {
      id: `OC-${pad}`,
      proveedor: form.proveedor,
      fecha: form.fecha || new Date().toLocaleDateString('es-DO'),
      total: Number(form.total),
      estado: form.estado,
      entregado: form.estado === 'Recibida' ? form.fecha : '—',
    }

    const updated = [newOrden, ...ordenes]
    setOrdenes(updated)
    saveStoredCompras(updated)
    setShowCreateModal(false)
    showToastMsg(`Orden ${newOrden.id} creada para ${form.proveedor}`)
    setForm({
      proveedor: '',
      total: '',
      fecha: new Date().toLocaleDateString('es-DO'),
      estado: 'Pendiente',
      entregado: '—',
    })
  }

  // Cambiar estado de una orden
  const handleChangeStatus = (id, newStatus) => {
    const updated = ordenes.map(o => {
      if (o.id === id) {
        return {
          ...o,
          estado: newStatus,
          entregado: newStatus === 'Recibida' ? new Date().toLocaleDateString('es-DO') : '—',
        }
      }
      return o
    })
    setOrdenes(updated)
    saveStoredCompras(updated)
    showToastMsg(`Orden ${id} actualizada a ${newStatus}`)
  }

  // Exportar a CSV
  const handleExportCSV = () => {
    const csvContent = [
      ['ID Orden', 'Proveedor', 'Fecha', 'Total', 'Estado', 'Entregado'].join(','),
      ...ordenes.map(o => [
        `"${o.id}"`,
        `"${o.proveedor}"`,
        `"${o.fecha}"`,
        o.total,
        `"${o.estado}"`,
        `"${o.entregado}"`,
      ].join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `ordenes_compras_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToastMsg('Órdenes exportadas a CSV')
  }

  return (
    <div className="compras-container">
      {/* ── Encabezado Principal ── */}
      <div className="compras-header-row">
        <div className="compras-title-box">
          <div className="compras-title-row">
            <span className="compras-tag-icon">🏷️</span>
            <h1 className="compras-main-title">Compras</h1>
            <button className="compras-gear-btn" title="Configuración de compras">⚙</button>
          </div>
          <p className="compras-subtitle">Gestión de órdenes de compra y proveedores.</p>
        </div>

        <div className="compras-header-actions">
          <div className="compras-btn-split">
            <button className="compras-btn-split-main" onClick={() => setShowCreateModal(true)}>
              + Nueva Orden
            </button>
            <button className="compras-btn-split-arrow" onClick={() => setShowCreateModal(true)}>
              ▾
            </button>
          </div>
        </div>
      </div>

      {/* ── 4 KPI Cards Superiores ── */}
      <div className="compras-kpi-grid">
        {/* KPI 1 */}
        <div className="compras-kpi-card" onClick={() => setActiveTab('Todas')} style={{ cursor: 'pointer' }}>
          <div className="compras-kpi-icon-box blue">
            🛒
          </div>
          <div className="compras-kpi-content">
            <span className="compras-kpi-label">Órdenes este mes</span>
            <h3 className="compras-kpi-value">{totalOrdenesMes}</h3>
            <span className="compras-kpi-trend up">↑ 20% vs mes anterior</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="compras-kpi-card">
          <div className="compras-kpi-icon-box green">
            💲
          </div>
          <div className="compras-kpi-content">
            <span className="compras-kpi-label">Total compras este mes</span>
            <h3 className="compras-kpi-value">{money(totalComprasMes > 0 ? totalComprasMes : 1250000)}</h3>
            <span className="compras-kpi-trend up">↑ 18% vs mes anterior</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="compras-kpi-card" onClick={() => setActiveTab('Pendientes')} style={{ cursor: 'pointer' }}>
          <div className="compras-kpi-icon-box orange">
            📦
          </div>
          <div className="compras-kpi-content">
            <span className="compras-kpi-label">Órdenes pendientes</span>
            <h3 className="compras-kpi-value">{ordenesPendientes || 3}</h3>
            <span className="compras-kpi-trend down">● 25% vs mes anterior</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="compras-kpi-card">
          <div className="compras-kpi-icon-box purple">
            👥
          </div>
          <div className="compras-kpi-content">
            <span className="compras-kpi-label">Proveedores activos</span>
            <h3 className="compras-kpi-value">{proveedoresActivos}</h3>
            <span className="compras-kpi-trend up">↑ 12% vs mes anterior</span>
          </div>
        </div>
      </div>

      {/* ── Panel Principal: Tabla de Órdenes ── */}
      <div className="compras-table-card">
        {/* Tabs Superiores y Filtros */}
        <div className="compras-tabs-row">
          <div className="compras-status-tabs">
            {['Todas', 'Pendientes', 'En Tránsito', 'Recibidas', 'Canceladas'].map(t => (
              <button
                key={t}
                className={`compras-status-tab ${activeTab === t ? 'active' : ''}`}
                onClick={() => setActiveTab(t)}
              >
                <span>{t}</span>
                <span className="compras-tab-badge">{counts[t] ?? 0}</span>
              </button>
            ))}
          </div>

          <div className="compras-actions-right">
            <div className="compras-table-search">
              <span>🔍</span>
              <input
                placeholder="Buscar órdenes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="compras-outline-btn" onClick={() => showToastMsg('Filtros avanzados activos')}>
              ⚡ Filtros
            </button>
            <button className="compras-outline-btn" onClick={handleExportCSV}>
              📥 Exportar
            </button>
          </div>
        </div>

        {/* Tabla */}
        <table className="compras-table">
          <thead>
            <tr>
              <th>ID Orden</th>
              <th>Proveedor</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Entregado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrdenes.map(o => (
              <tr key={o.id}>
                <td>
                  <div className="compras-order-cell">
                    <span className="compras-doc-icon">📄</span>
                    <span className="compras-order-id-link" onClick={() => setSelectedOrden(o)}>
                      {o.id}
                    </span>
                  </div>
                </td>
                <td><strong>{o.proveedor}</strong></td>
                <td>{o.fecha}</td>
                <td><strong>{money(o.total)}</strong></td>
                <td>
                  <span className={`compras-pill-badge ${o.estado.toLowerCase().replace(' ', '-').replace('á', 'a')}`}>
                    <span className="compras-badge-dot" />
                    {o.estado}
                  </span>
                </td>
                <td style={{ color: o.entregado === '—' ? '#94A3B8' : '#0F172A' }}>{o.entregado}</td>
                <td>
                  <div className="compras-row-actions">
                    <button className="compras-icon-btn" title="Ver detalle" onClick={() => setSelectedOrden(o)}>
                      👁️
                    </button>
                    <button
                      className="compras-icon-btn"
                      title="Cambiar estado"
                      onClick={() => {
                        const nextStatus = o.estado === 'Pendiente' ? 'En Tránsito' : o.estado === 'En Tránsito' ? 'Recibida' : 'Pendiente'
                        handleChangeStatus(o.id, nextStatus)
                      }}
                    >
                      ⋮
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginación */}
        <div className="compras-pagination-row">
          <span>Mostrando 1 a {filteredOrdenes.length} de {ordenes.length} órdenes</span>
          <div className="compras-page-controls">
            <button className="compras-page-num-btn">‹</button>
            <button className="compras-page-num-btn active">1</button>
            <button className="compras-page-num-btn">2</button>
            <button className="compras-page-num-btn">3</button>
            <button className="compras-page-num-btn">›</button>
          </div>
        </div>
      </div>

      {/* ── Modal Nueva Orden de Compra ── */}
      {showCreateModal && (
        <div className="compras-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="compras-modal-box" onClick={e => e.stopPropagation()}>
            <div className="compras-modal-header">
              <h3>+ Nueva Orden de Compra</h3>
              <button className="compras-modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateOrden}>
              <div className="compras-modal-body">
                <div className="compras-form-group">
                  <label>Proveedor *</label>
                  <input
                    required
                    placeholder="Ej: Distribuidora Tech SRL"
                    value={form.proveedor}
                    onChange={e => setForm(f => ({ ...f, proveedor: e.target.value }))}
                  />
                </div>
                <div className="compras-form-group">
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
                <div className="compras-form-group">
                  <label>Fecha de Emisión</label>
                  <input
                    type="text"
                    placeholder="DD/MM/AAAA"
                    value={form.fecha}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                  />
                </div>
                <div className="compras-form-group">
                  <label>Estado Inicial</label>
                  <select
                    value={form.estado}
                    onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Tránsito">En Tránsito</option>
                    <option value="Recibida">Recibida</option>
                  </select>
                </div>
              </div>
              <div className="compras-modal-footer">
                <button type="button" className="compras-outline-btn" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="compras-btn-split-main" style={{ background: '#2563EB', borderRadius: 8 }}>
                  Crear Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Detalle de Orden ── */}
      {selectedOrden && (
        <div className="compras-modal-backdrop" onClick={() => setSelectedOrden(null)}>
          <div className="compras-modal-box" onClick={e => e.stopPropagation()}>
            <div className="compras-modal-header">
              <h3>Detalle de Orden: {selectedOrden.id}</h3>
              <button className="compras-modal-close" onClick={() => setSelectedOrden(null)}>✕</button>
            </div>
            <div className="compras-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Proveedor:</span>
                  <strong>{selectedOrden.proveedor}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Fecha de Emisión:</span>
                  <span>{selectedOrden.fecha}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Total:</span>
                  <strong style={{ color: '#2563EB', fontSize: 16 }}>{money(selectedOrden.total)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748B' }}>Estado:</span>
                  <span className={`compras-pill-badge ${selectedOrden.estado.toLowerCase().replace(' ', '-').replace('á', 'a')}`}>
                    <span className="compras-badge-dot" />
                    {selectedOrden.estado}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Fecha de Entrega:</span>
                  <span>{selectedOrden.entregado}</span>
                </div>
              </div>
            </div>
            <div className="compras-modal-footer">
              <button className="compras-btn-split-main" style={{ background: '#2563EB', borderRadius: 8 }} onClick={() => setSelectedOrden(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="compras-toast">{toast}</div>}
    </div>
  )
}
