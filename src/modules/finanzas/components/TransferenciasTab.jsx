import React, { useState } from 'react'

export function TransferenciasTab({ comprobantes, cuentas, onNuevaTransferencia }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [cuentaOrigen, setCuentaOrigen] = useState(cuentas?.[0]?.nombre || 'Banco Popular 960-123456')
  const [cuentaDestino, setCuentaDestino] = useState(cuentas?.[1]?.nombre || 'Banco BHD 450-987654')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [error, setError] = useState('')

  const transferencias = (comprobantes || []).filter((c) => c.tipo === 'Transferencia')
  const totalTransferido = transferencias.reduce((acc, t) => acc + (t.monto || 0), 0)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (cuentaOrigen === cuentaDestino) {
      setError('La cuenta origen y la cuenta destino deben ser diferentes.')
      return
    }
    if (!monto || Number(monto) <= 0) {
      setError('Ingresa un monto válido mayor a 0.')
      return
    }

    const ctaOrigenObj = cuentas.find((c) => c.nombre === cuentaOrigen)
    if (ctaOrigenObj && ctaOrigenObj.saldo < Number(monto)) {
      setError(`Fondos insuficientes en ${cuentaOrigen}. Saldo disponible: RD$ ${ctaOrigenObj.saldo.toLocaleString('en-US')}`)
      return
    }

    onNuevaTransferencia({
      tipo: 'Transferencia',
      descripcion: descripcion || `Traspaso de fondos de ${cuentaOrigen} a ${cuentaDestino}`,
      monto: Number(monto),
      cuenta: cuentaOrigen,
      cuentaDestino: cuentaDestino,
      estado: 'Completado',
      categoria: 'Rebalanceo de Cuentas',
    })

    setIsModalOpen(false)
    setMonto('')
    setDescripcion('')
    setError('')
  }

  return (
    <div className="fn-submodule-container">
      <div className="fn-submodule-header">
        <div>
          <h3 className="fn-submodule-title">🔄 Transferencias entre Cuentas</h3>
          <p className="fn-submodule-desc">
            Gestiona movimientos de fondos, traspasos interbancarios y reposiciones de caja chica.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="fn-badge-total-saldo" style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}>
            Total Traspasos: <strong>RD$ {totalTransferido.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
          </div>
          <button className="fn-btn-primary" onClick={() => setIsModalOpen(true)}>
            <span>+</span> Nueva Transferencia
          </button>
        </div>
      </div>

      <div className="fn-table-section">
        <div className="fn-table-responsive">
          <table className="fn-data-table">
            <thead>
              <tr>
                <th># Comprobante</th>
                <th>Fecha</th>
                <th>Cuenta Origen</th>
                <th></th>
                <th>Cuenta Destino</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Operador</th>
              </tr>
            </thead>
            <tbody>
              {transferencias.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    No hay transferencias registradas.
                  </td>
                </tr>
              ) : (
                transferencias.map((tr) => (
                  <tr key={tr.id}>
                    <td style={{ fontWeight: 600, color: '#2563eb' }}>{tr.numero}</td>
                    <td>{tr.fecha}</td>
                    <td style={{ fontWeight: 600, color: '#dc2626' }}>{tr.cuenta}</td>
                    <td style={{ textAlign: 'center', fontSize: 16 }}>➔</td>
                    <td style={{ fontWeight: 600, color: '#16a34a' }}>{tr.cuentaDestino || 'Caja Chica'}</td>
                    <td>{tr.descripcion}</td>
                    <td style={{ fontWeight: 700, color: '#2563eb' }}>
                      RD$ {tr.monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className="fn-badge-estado badge-estado-completado">
                        ✓ {tr.estado}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: 12 }}>{tr.creadoPor}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Transferencia */}
      {isModalOpen && (
        <div className="fn-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="fn-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="fn-modal-header">
              <div className="fn-modal-title-group">
                <span>🔄</span>
                <h3>Realizar Transferencia de Fondos</h3>
              </div>
              <button className="fn-modal-close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="fn-modal-form">
              {error && <div className="fn-form-error">{error}</div>}

              <div className="fn-form-row">
                <label className="fn-form-label">Cuenta Origen (Débito)</label>
                <select
                  className="fn-form-select"
                  value={cuentaOrigen}
                  onChange={(e) => setCuentaOrigen(e.target.value)}
                >
                  {cuentas.map((c) => (
                    <option key={c.id} value={c.nombre}>
                      {c.nombre} (Saldo: RD$ {c.saldo.toLocaleString('en-US')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="fn-form-row">
                <label className="fn-form-label">Cuenta Destino (Crédito)</label>
                <select
                  className="fn-form-select"
                  value={cuentaDestino}
                  onChange={(e) => setCuentaDestino(e.target.value)}
                >
                  {cuentas.map((c) => (
                    <option key={c.id} value={c.nombre}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fn-form-row">
                <label className="fn-form-label">Monto a Transferir (RD$)</label>
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
                <label className="fn-form-label">Concepto / Motivo</label>
                <input
                  type="text"
                  className="fn-form-input"
                  placeholder="Ej. Traspaso para pago de nómina quincenal"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div className="fn-modal-actions">
                <button type="button" className="fn-btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="fn-btn-primary">
                  Ejecutar Transferencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
