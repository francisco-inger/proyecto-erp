import React, { useState } from 'react'

export function ConciliacionesTab({ conciliaciones, onConciliar }) {
  const [successMsg, setSuccessMsg] = useState('')

  const handleConciliarClick = (cuentaNombre) => {
    onConciliar(cuentaNombre)
    setSuccessMsg(`¡Cuenta ${cuentaNombre} conciliada exitosamente con el extracto bancario!`)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  return (
    <div className="fn-submodule-container">
      <div className="fn-submodule-header">
        <div>
          <h3 className="fn-submodule-title">⚖️ Conciliación Bancaria</h3>
          <p className="fn-submodule-desc">
            Cuadre y verificación entre los extractos oficiales del banco y los registros contables del sistema.
          </p>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: '#ecfdf5', color: '#059669', padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #a7f3d0' }}>
          ✓ {successMsg}
        </div>
      )}

      <div className="fn-cuentas-grid">
        {conciliaciones.map((c) => {
          const isConciliado = c.estado === 'Conciliado'
          return (
            <div key={c.id} className="fn-cuenta-card" style={{ borderColor: isConciliado ? '#a7f3d0' : '#fed7aa' }}>
              <div className="fn-cuenta-top">
                <span style={{ fontSize: 22 }}>{isConciliado ? '✅' : '⏳'}</span>
                <span className={`fn-badge-estado ${isConciliado ? 'badge-estado-aprobado' : 'badge-estado-pendiente'}`}>
                  {c.estado}
                </span>
              </div>

              <div className="fn-cuenta-details">
                <h4 className="fn-cuenta-name">{c.cuenta}</h4>
                <span className="fn-cuenta-num">Período: {c.periodo}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '10px 0', fontSize: 12, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Saldo según Banco:</span>
                  <strong style={{ color: '#0f172a' }}>RD$ {c.saldoBanco.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Saldo en Libros:</span>
                  <strong style={{ color: '#0f172a' }}>RD$ {c.saldoLibros.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Diferencia:</span>
                  <strong style={{ color: c.diferencia === 0 ? '#16a34a' : '#dc2626' }}>
                    RD$ {c.diferencia.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>Última: {c.fechaUltimaConciliacion}</span>
                {!isConciliado ? (
                  <button className="fn-btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleConciliarClick(c.cuenta)}>
                    Conciliar Ahora
                  </button>
                ) : (
                  <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✓ Al día</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
