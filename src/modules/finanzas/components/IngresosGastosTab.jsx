import React, { useState, useMemo } from 'react'

export function IngresosGastosTab({ tipo, items, cuentas, onNuevoItem }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCat, setFilterCat] = useState('Todas')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const isIngreso = tipo === 'Ingreso'
  const lista = useMemo(() => {
    return (items || []).filter((i) => i.tipo === tipo)
  }, [items, tipo])

  const totalMonto = useMemo(() => {
    return lista.reduce((acc, i) => acc + (i.monto || 0), 0)
  }, [lista])

  const categorias = useMemo(() => {
    const set = new Set(lista.map((i) => i.categoria).filter(Boolean))
    return ['Todas', ...Array.from(set)]
  }, [lista])

  const filtrados = useMemo(() => {
    return lista.filter((i) => {
      if (filterCat !== 'Todas' && i.categoria !== filterCat) return false
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase()
        const matchNum = i.numero?.toLowerCase().includes(q)
        const matchDesc = i.descripcion?.toLowerCase().includes(q)
        const matchCli = i.clienteProveedor?.toLowerCase().includes(q)
        if (!matchNum && !matchDesc && !matchCli) return false
      }
      return true
    })
  }, [lista, filterCat, searchTerm])

  // Form states
  const [formDesc, setFormDesc] = useState('')
  const [formMonto, setFormMonto] = useState('')
  const [formCuenta, setFormCuenta] = useState(cuentas?.[0]?.nombre || 'Banco Popular 960-123456')
  const [formCat, setFormCat] = useState(isIngreso ? 'Ventas de Software' : 'Suministros')
  const [formTercero, setFormTercero] = useState('')

  const handleCrear = (e) => {
    e.preventDefault()
    onNuevoItem({
      tipo,
      descripcion: formDesc,
      monto: Number(formMonto),
      cuenta: formCuenta,
      categoria: formCat,
      clienteProveedor: formTercero || (isIngreso ? 'Cliente General' : 'Proveedor General'),
      estado: 'Aprobado',
    })
    setIsModalOpen(false)
    setFormDesc('')
    setFormMonto('')
    setFormTercero('')
  }

  return (
    <div className="fn-submodule-container">
      <div className="fn-submodule-header">
        <div>
          <h3 className="fn-submodule-title">
            {isIngreso ? '📈 Gestión de Ingresos y Cobros' : '📉 Control de Gastos y Egresos'}
          </h3>
          <p className="fn-submodule-desc">
            {isIngreso
              ? 'Registro y seguimiento de entradas de capital, cobranzas a clientes y ventas cobradas.'
              : 'Monitoreo de pagos a proveedores, costos operativos, nóminas y gastos generales.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className={`fn-badge-total-saldo ${isIngreso ? 'badge-ingreso-total' : 'badge-gasto-total'}`}>
            Total {isIngreso ? 'Ingresos' : 'Gastos'}:{' '}
            <strong>RD$ {totalMonto.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
          </div>
          <button className="fn-btn-primary" onClick={() => setIsModalOpen(true)}>
            <span>+</span> Nuevo {tipo}
          </button>
        </div>
      </div>

      {/* Barra de herramientas */}
      <div className="fn-table-section">
        <div className="fn-table-header-row">
          <div className="fn-search-input-box" style={{ width: 280 }}>
            <span className="fn-search-icon">🔍</span>
            <input
              type="text"
              placeholder={`Buscar por comprobante, ${isIngreso ? 'cliente' : 'proveedor'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="fn-search-input"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Categoría:</span>
            <select
              className="fn-period-select"
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            >
              {categorias.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="fn-table-responsive">
          <table className="fn-data-table">
            <thead>
              <tr>
                <th># Comprobante</th>
                <th>Fecha</th>
                <th>{isIngreso ? 'Cliente' : 'Proveedor'}</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Cuenta Afectada</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    No hay registros disponibles.
                  </td>
                </tr>
              ) : (
                filtrados.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: '#2563eb' }}>{item.numero}</td>
                    <td>{item.fecha}</td>
                    <td style={{ fontWeight: 600 }}>{item.clienteProveedor}</td>
                    <td>
                      <span className="fn-badge-cat">{item.categoria}</span>
                    </td>
                    <td>{item.descripcion}</td>
                    <td>{item.cuenta}</td>
                    <td style={{ fontWeight: 700, color: isIngreso ? '#16a34a' : '#dc2626' }}>
                      RD$ {item.monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className={`fn-badge-estado badge-estado-${item.estado.toLowerCase()}`}>
                        {item.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Ingreso / Gasto */}
      {isModalOpen && (
        <div className="fn-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="fn-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="fn-modal-header">
              <div className="fn-modal-title-group">
                <span>{isIngreso ? '📈' : '📉'}</span>
                <h3>Registrar Nuevo {tipo}</h3>
              </div>
              <button className="fn-modal-close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCrear} className="fn-modal-form">
              <div className="fn-form-row">
                <label className="fn-form-label">{isIngreso ? 'Cliente / Entidad' : 'Proveedor / Beneficiario'}</label>
                <input
                  type="text"
                  className="fn-form-input"
                  placeholder={isIngreso ? 'Ej. Inversiones Globales SAS' : 'Ej. Claro Dominicana'}
                  value={formTercero}
                  onChange={(e) => setFormTercero(e.target.value)}
                  required
                />
              </div>

              <div className="fn-form-grid-2">
                <div className="fn-form-row">
                  <label className="fn-form-label">Categoría</label>
                  <input
                    type="text"
                    className="fn-form-input"
                    placeholder="Ej. Ventas, Suministros, Servicios"
                    value={formCat}
                    onChange={(e) => setFormCat(e.target.value)}
                    required
                  />
                </div>

                <div className="fn-form-row">
                  <label className="fn-form-label">Monto (RD$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="fn-form-input"
                    placeholder="0.00"
                    value={formMonto}
                    onChange={(e) => setFormMonto(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="fn-form-row">
                <label className="fn-form-label">Descripción</label>
                <input
                  type="text"
                  className="fn-form-input"
                  placeholder="Detalle o concepto..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  required
                />
              </div>

              <div className="fn-form-row">
                <label className="fn-form-label">Cuenta de Destino / Origen</label>
                <select
                  className="fn-form-select"
                  value={formCuenta}
                  onChange={(e) => setFormCuenta(e.target.value)}
                >
                  {cuentas?.map((c) => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="fn-modal-actions">
                <button type="button" className="fn-btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="fn-btn-primary">
                  Registrar {tipo}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
