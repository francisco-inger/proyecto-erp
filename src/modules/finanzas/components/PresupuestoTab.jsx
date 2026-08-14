import React, { useState } from 'react'

export function PresupuestoTab({ presupuestos, onNuevoPresupuesto }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [categoria, setCategoria] = useState('')
  const [monto, setMonto] = useState('')
  const [departamento, setDepartamento] = useState('Operaciones')

  const totalPresupuestado = (presupuestos || []).reduce((acc, p) => acc + (p.presupuestado || 0), 0)
  const totalEjecutado = (presupuestos || []).reduce((acc, p) => acc + (p.ejecutado || 0), 0)
  const porcentajeGlobal = totalPresupuestado > 0 ? Math.round((totalEjecutado / totalPresupuestado) * 100) : 0

  const handleCrear = (e) => {
    e.preventDefault()
    if (!categoria || !monto) return
    onNuevoPresupuesto({
      categoria,
      presupuestado: Number(monto),
      departamento,
    })
    setIsModalOpen(false)
    setCategoria('')
    setMonto('')
  }

  return (
    <div className="fn-submodule-container">
      <div className="fn-submodule-header">
        <div>
          <h3 className="fn-submodule-title">🎯 Control y Planificación Presupuestaria</h3>
          <p className="fn-submodule-desc">
            Asignación de techos de gasto por departamento y comparación en vivo con la ejecución real.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="fn-badge-total-saldo">
            Ejecución Global: <strong>{porcentajeGlobal}%</strong> (RD$ {totalEjecutado.toLocaleString('en-US')} / RD$ {totalPresupuestado.toLocaleString('en-US')})
          </div>
          <button className="fn-btn-primary" onClick={() => setIsModalOpen(true)}>
            <span>+</span> Nueva Partida
          </button>
        </div>
      </div>

      <div className="fn-table-section">
        <div className="fn-table-responsive">
          <table className="fn-data-table">
            <thead>
              <tr>
                <th>Categoría / Rubro</th>
                <th>Departamento</th>
                <th>Presupuesto Asignado</th>
                <th>Gasto Ejecutado</th>
                <th>Disponible</th>
                <th style={{ width: 200 }}>% Consumo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {presupuestos.map((p) => {
                const pct = p.presupuestado > 0 ? Math.round((p.ejecutado / p.presupuestado) * 100) : 0
                const disponible = p.presupuestado - p.ejecutado
                const isOver = disponible < 0
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{p.categoria}</td>
                    <td>{p.departamento}</td>
                    <td style={{ fontWeight: 600 }}>RD$ {p.presupuestado.toLocaleString('en-US')}</td>
                    <td style={{ fontWeight: 700, color: isOver ? '#dc2626' : '#2563eb' }}>
                      RD$ {p.ejecutado.toLocaleString('en-US')}
                    </td>
                    <td style={{ fontWeight: 600, color: isOver ? '#dc2626' : '#16a34a' }}>
                      RD$ {disponible.toLocaleString('en-US')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.min(pct, 100)}%`,
                              height: '100%',
                              background: pct > 90 ? '#dc2626' : pct > 75 ? '#f59e0b' : '#10b981',
                              borderRadius: 4,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, minWidth: 35 }}>{pct}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`fn-badge-estado ${isOver ? 'badge-estado-pendiente' : 'badge-estado-aprobado'}`}>
                        {isOver ? '⚠️ Excedido' : '✓ En Rango'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fn-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="fn-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="fn-modal-header">
              <div className="fn-modal-title-group">
                <span>🎯</span>
                <h3>Nueva Partida Presupuestaria</h3>
              </div>
              <button className="fn-modal-close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCrear} className="fn-modal-form">
              <div className="fn-form-row">
                <label className="fn-form-label">Nombre del Rubro o Categoría</label>
                <input
                  type="text"
                  className="fn-form-input"
                  placeholder="Ej. Publicidad Digital, Viáticos, Infraestructura"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  required
                />
              </div>

              <div className="fn-form-grid-2">
                <div className="fn-form-row">
                  <label className="fn-form-label">Departamento</label>
                  <select
                    className="fn-form-select"
                    value={departamento}
                    onChange={(e) => setDepartamento(e.target.value)}
                  >
                    <option value="Operaciones">Operaciones</option>
                    <option value="Administración">Administración</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                    <option value="Ventas y Marketing">Ventas y Marketing</option>
                    <option value="TI y Desarrollo">TI y Desarrollo</option>
                  </select>
                </div>

                <div className="fn-form-row">
                  <label className="fn-form-label">Límite Presupuestado (RD$)</label>
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
              </div>

              <div className="fn-modal-actions">
                <button type="button" className="fn-btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="fn-btn-primary">
                  Crear Presupuesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
