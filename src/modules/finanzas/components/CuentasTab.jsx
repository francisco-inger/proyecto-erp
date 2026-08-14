import React, { useState } from 'react'

export function CuentasTab({ cuentas, onNuevaCuenta, movimientos }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [banco, setBanco] = useState('Banco Popular Dominicano')
  const [tipo, setTipo] = useState('Cuenta Corriente')
  const [numeroCuenta, setNumeroCuenta] = useState('')
  const [saldoInicial, setSaldoInicial] = useState('')
  const [titular, setTitular] = useState('APPES ERP SRL')
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null)

  const handleCrear = (e) => {
    e.preventDefault()
    onNuevaCuenta({
      banco,
      tipo,
      numeroCuenta,
      saldoInicial: Number(saldoInicial) || 0,
      titular,
      moneda: 'DOP',
    })
    setIsModalOpen(false)
    setNumeroCuenta('')
    setSaldoInicial('')
  }

  const saldoTotal = cuentas.reduce((acc, c) => acc + c.saldo, 0)

  return (
    <div className="fn-submodule-container">
      {/* Barra de título y acción de cuentas */}
      <div className="fn-submodule-header">
        <div>
          <h3 className="fn-submodule-title">🏦 Cuentas Bancarias y Cajas</h3>
          <p className="fn-submodule-desc">
            Administra tus cuentas corrientes, de ahorros y fondos fijos de caja chica.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="fn-badge-total-saldo">
            Saldo Consolidado: <strong>RD$ {saldoTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
          </div>
          <button className="fn-btn-primary" onClick={() => setIsModalOpen(true)}>
            <span>+</span> Nueva Cuenta
          </button>
        </div>
      </div>

      {/* Grid de Cuentas */}
      <div className="fn-cuentas-grid">
        {cuentas.map((cta) => (
          <div
            key={cta.id}
            className={`fn-cuenta-card ${cuentaSeleccionada?.id === cta.id ? 'active-cuenta-card' : ''}`}
            onClick={() => setCuentaSeleccionada(cta)}
          >
            <div className="fn-cuenta-top">
              <div className="fn-cuenta-icon-box">
                <span className="fn-cuenta-icon">{cta.icono}</span>
              </div>
              <span className="fn-cuenta-status-badge">{cta.estado}</span>
            </div>

            <div className="fn-cuenta-details">
              <h4 className="fn-cuenta-name">{cta.banco}</h4>
              <span className="fn-cuenta-num">{cta.numeroCuenta}</span>
              <span className="fn-cuenta-type">{cta.tipo} • {cta.moneda}</span>
            </div>

            <div className="fn-cuenta-bottom">
              <span className="fn-cuenta-balance-label">Saldo Disponible</span>
              <div className="fn-cuenta-balance">
                RD$ {cta.saldo.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Movimientos de la cuenta seleccionada */}
      {cuentaSeleccionada && (
        <div className="fn-table-section" style={{ marginTop: 20 }}>
          <div className="fn-table-header-row">
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
              Movimientos de: <span style={{ color: '#2563eb' }}>{cuentaSeleccionada.nombre}</span>
            </h4>
            <button className="fn-btn-secondary" onClick={() => setCuentaSeleccionada(null)}>
              Cerrar Vista de Cuenta
            </button>
          </div>

          <div className="fn-table-responsive">
            <table className="fn-data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th># Comprobante</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {movimientos
                  ?.filter((m) => m.cuenta === cuentaSeleccionada.nombre || m.cuentaDestino === cuentaSeleccionada.nombre)
                  .map((m) => (
                    <tr key={m.id}>
                      <td>{m.fecha}</td>
                      <td style={{ fontWeight: 600, color: '#2563eb' }}>{m.numero}</td>
                      <td>
                        <span className={`fn-badge-tipo badge-tipo-${m.tipo.toLowerCase()}`}>{m.tipo}</span>
                      </td>
                      <td>{m.descripcion}</td>
                      <td style={{ fontWeight: 700, color: m.tipo === 'Ingreso' ? '#16a34a' : '#dc2626' }}>
                        RD$ {m.monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className={`fn-badge-estado badge-estado-${m.estado.toLowerCase()}`}>{m.estado}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nueva Cuenta */}
      {isModalOpen && (
        <div className="fn-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="fn-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="fn-modal-header">
              <div className="fn-modal-title-group">
                <span>🏦</span>
                <h3>Registrar Nueva Cuenta Bancaria</h3>
              </div>
              <button className="fn-modal-close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCrear} className="fn-modal-form">
              <div className="fn-form-row">
                <label className="fn-form-label">Institución Financiera / Banco</label>
                <select
                  className="fn-form-select"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                >
                  <option value="Banco Popular Dominicano">Banco Popular Dominicano</option>
                  <option value="Banco BHD">Banco BHD</option>
                  <option value="Banreservas">Banreservas</option>
                  <option value="Scotiabank">Scotiabank</option>
                  <option value="Banco Santa Cruz">Banco Santa Cruz</option>
                  <option value="Caja Chica / Efectivo">Caja Chica / Efectivo</option>
                </select>
              </div>

              <div className="fn-form-grid-2">
                <div className="fn-form-row">
                  <label className="fn-form-label">Tipo de Cuenta</label>
                  <select
                    className="fn-form-select"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                  >
                    <option value="Cuenta Corriente">Cuenta Corriente</option>
                    <option value="Cuenta de Ahorros">Cuenta de Ahorros</option>
                    <option value="Efectivo">Efectivo</option>
                  </select>
                </div>

                <div className="fn-form-row">
                  <label className="fn-form-label">Número de Cuenta</label>
                  <input
                    type="text"
                    className="fn-form-input"
                    placeholder="Ej. 960-123456-7"
                    value={numeroCuenta}
                    onChange={(e) => setNumeroCuenta(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="fn-form-grid-2">
                <div className="fn-form-row">
                  <label className="fn-form-label">Saldo Inicial (RD$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="fn-form-input"
                    placeholder="0.00"
                    value={saldoInicial}
                    onChange={(e) => setSaldoInicial(e.target.value)}
                    required
                  />
                </div>

                <div className="fn-form-row">
                  <label className="fn-form-label">Titular de la Cuenta</label>
                  <input
                    type="text"
                    className="fn-form-input"
                    value={titular}
                    onChange={(e) => setTitular(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="fn-modal-actions">
                <button type="button" className="fn-btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="fn-btn-primary">
                  Crear Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
