import React, { useState } from 'react'

export function NuevoComprobanteModal({ isOpen, onClose, onSave, cuentas }) {
  const [tipo, setTipo] = useState('Ingreso')
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [cuenta, setCuenta] = useState(cuentas?.[0]?.nombre || 'Banco Popular 960-123456')
  const [cuentaDestino, setCuentaDestino] = useState('Efectivo / Caja Chica')
  const [estado, setEstado] = useState('Aprobado')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!descripcion.trim()) {
      setError('Por favor ingresa una descripción para el comprobante.')
      return
    }
    if (!monto || Number(monto) <= 0) {
      setError('Por favor ingresa un monto válido mayor a 0.')
      return
    }

    onSave({
      tipo,
      descripcion,
      monto: Number(monto),
      cuenta,
      cuentaDestino: tipo === 'Transferencia' ? cuentaDestino : undefined,
      estado,
    })

    // Reset y cerrar
    setDescripcion('')
    setMonto('')
    setError('')
    onClose()
  }

  return (
    <div className="fn-modal-overlay" onClick={onClose}>
      <div className="fn-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="fn-modal-header">
          <div className="fn-modal-title-group">
            <span className="fn-modal-icon">📑</span>
            <h3>Nuevo Comprobante Financiero</h3>
          </div>
          <button className="fn-modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="fn-modal-form">
          {error && <div className="fn-form-error">{error}</div>}

          <div className="fn-form-row">
            <label className="fn-form-label">Tipo de Comprobante</label>
            <div className="fn-tipo-selector">
              {['Ingreso', 'Gasto', 'Transferencia'].map((t) => (
                <button
                  type="button"
                  key={t}
                  className={`fn-tipo-btn ${tipo === t ? 'selected-' + t.toLowerCase() : ''}`}
                  onClick={() => setTipo(t)}
                >
                  {t === 'Ingreso' && '📈 '}
                  {t === 'Gasto' && '📉 '}
                  {t === 'Transferencia' && '🔄 '}
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="fn-form-row">
            <label className="fn-form-label">Descripción o Concepto</label>
            <input
              type="text"
              className="fn-form-input"
              placeholder="Ej. Cobro factura FV-001245 / Compra de insumos"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
            />
          </div>

          <div className="fn-form-grid-2">
            <div className="fn-form-row">
              <label className="fn-form-label">Monto (RD$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="fn-form-input"
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
              />
            </div>

            <div className="fn-form-row">
              <label className="fn-form-label">Estado</label>
              <select
                className="fn-form-select"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="Aprobado">Aprobado</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Completado">Completado</option>
              </select>
            </div>
          </div>

          <div className="fn-form-row">
            <label className="fn-form-label">{tipo === 'Transferencia' ? 'Cuenta Origen' : 'Cuenta Financiera'}</label>
            <select
              className="fn-form-select"
              value={cuenta}
              onChange={(e) => setCuenta(e.target.value)}
            >
              {cuentas?.map((c) => (
                <option key={c.id} value={c.nombre}>{c.nombre}</option>
              )) || (
                <>
                  <option value="Banco Popular 960-123456">Banco Popular 960-123456</option>
                  <option value="Banco BHD 450-987654">Banco BHD 450-987654</option>
                  <option value="Efectivo / Caja Chica">Efectivo / Caja Chica</option>
                </>
              )}
            </select>
          </div>

          {tipo === 'Transferencia' && (
            <div className="fn-form-row">
              <label className="fn-form-label">Cuenta Destino</label>
              <select
                className="fn-form-select"
                value={cuentaDestino}
                onChange={(e) => setCuentaDestino(e.target.value)}
              >
                <option value="Efectivo / Caja Chica">Efectivo / Caja Chica</option>
                <option value="Banco Popular 960-123456">Banco Popular 960-123456</option>
                <option value="Banco BHD 450-987654">Banco BHD 450-987654</option>
              </select>
            </div>
          )}

          <div className="fn-modal-actions">
            <button type="button" className="fn-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="fn-btn-primary">
              Guardar Comprobante
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
