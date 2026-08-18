import React, { useState } from 'react'
import { EnterprisePicker } from '../../../core/components/EnterprisePickerModal'

export function NuevoComprobanteModal({ isOpen, onClose, onSave, cuentas }) {
  const [tipo, setTipo] = useState('Ingreso')
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [cuenta, setCuenta] = useState(cuentas?.[0]?.nombre || 'Banco Popular 960-123456')
  const [cuentaDestino, setCuentaDestino] = useState('Efectivo / Caja Chica')
  const [estado, setEstado] = useState('Aprobado')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const listadoCuentas = cuentas && cuentas.length > 0 ? cuentas : [
    { id: '1', nombre: 'Banco Popular 960-123456', banco: 'Banco Popular', tipo: 'Cuenta Corriente', balance: 1450000 },
    { id: '2', nombre: 'Banco BHD 450-987654', banco: 'Banco BHD', tipo: 'Cuenta Ahorros', balance: 820000 },
    { id: '3', nombre: 'Efectivo / Caja Chica', banco: 'Tesorería', tipo: 'Caja Operativa', balance: 65000 },
  ]

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

        <form onSubmit={handleSubmit}>
          <div className="fn-modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              <EnterprisePicker
                label={tipo === 'Transferencia' ? 'Cuenta Origen' : 'Cuenta Financiera / Banco'}
                required
                value={cuenta}
                onChange={(val) => setCuenta(val)}
                items={listadoCuentas}
                displayField="nombre"
                subtitleField="tipo"
                modalTitle="Directorio de Cuentas Bancarias y Cajas"
                icon="🏦"
                placeholder="Escriba o explore cuenta bancaria..."
              />
            </div>

            {tipo === 'Transferencia' && (
              <div className="fn-form-row">
                <EnterprisePicker
                  label="Cuenta Destino"
                  required
                  value={cuentaDestino}
                  onChange={(val) => setCuentaDestino(val)}
                  items={listadoCuentas}
                  displayField="nombre"
                  subtitleField="tipo"
                  modalTitle="Directorio de Cuentas Destino"
                  icon="🔄"
                  placeholder="Escriba o explore cuenta destino..."
                />
              </div>
            )}
          </div>

          <div className="fn-modal-actions" style={{ padding: '16px 24px', borderTop: '1px solid #F1F5F9', background: '#F8FAFC', margin: 0 }}>
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
