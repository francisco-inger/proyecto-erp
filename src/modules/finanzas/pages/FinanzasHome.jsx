import { useState, useEffect } from 'react'
import { apiClient } from 'core/api/apiClient'

const FALLBACK_MOVIMIENTOS = [
  { id: 'TXN-001', descripcion: 'Venta #VTA-1001',       tipo: 'Ingreso', monto:  125000, fecha: '2026-08-08' },
  { id: 'TXN-002', descripcion: 'Pago proveedor OC-001', tipo: 'Gasto',   monto:  -48000, fecha: '2026-08-07' },
  { id: 'TXN-003', descripcion: 'Suscripción SaaS',      tipo: 'Gasto',   monto:   -5500, fecha: '2026-08-06' },
  { id: 'TXN-004', descripcion: 'Venta #VTA-1002',       tipo: 'Ingreso', monto:   84500, fecha: '2026-08-05' },
]

export function FinanzasHome() {
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/finanzas/movimientos')
      .then(setMovimientos)
      .catch(() => setMovimientos(FALLBACK_MOVIMIENTOS))
      .finally(() => setLoading(false))
  }, [])

  const ingresos = movimientos.filter(m => m.monto > 0).reduce((a, m) => a + m.monto, 0)
  const gastos   = movimientos.filter(m => m.monto < 0).reduce((a, m) => a + Math.abs(m.monto), 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>💰 Finanzas</h2>
          <p style={{ margin: 0 }}>Control de ingresos, gastos y flujo de caja.</p>
        </div>
        <button className="btn btn-primary">+ Nuevo Movimiento</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>Ingresos</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-success)' }}>RD$ {ingresos.toLocaleString()}</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>Gastos</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-danger)' }}>RD$ {gastos.toLocaleString()}</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>Utilidad Neta</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>RD$ {(ingresos - gastos).toLocaleString()}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Movimientos Recientes</h3>
        {loading ? <p style={{ color: 'var(--color-ink-faint)' }}>Cargando...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-line)' }}>
                {['ID', 'Descripción', 'Tipo', 'Monto', 'Fecha'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--color-ink-soft)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movimientos.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--color-line)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{m.id}</td>
                  <td style={{ padding: '10px 12px' }}>{m.descripcion}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ color: m.monto > 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>{m.tipo}</span>
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: m.monto > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    RD$ {Math.abs(m.monto).toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-ink-faint)' }}>{m.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
