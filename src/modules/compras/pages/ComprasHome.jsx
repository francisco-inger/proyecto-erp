import { useState, useEffect } from 'react'
import { apiClient } from 'core/api/apiClient'

const FALLBACK = [
  { id: 'OC-001', proveedor: 'Distribuidora Tech SRL', total: 280000, estado: 'Recibida',   fecha: '2026-08-05' },
  { id: 'OC-002', proveedor: 'Electrónica Global SA',  total: 145000, estado: 'Pendiente',  fecha: '2026-08-07' },
  { id: 'OC-003', proveedor: 'Suministros Caribe',     total:  67500, estado: 'En Tránsito', fecha: '2026-08-09' },
]

export function ComprasHome() {
  const [ordenes, setOrdenes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/compras/ordenes')
      .then(setOrdenes)
      .catch(() => setOrdenes(FALLBACK))
      .finally(() => setLoading(false))
  }, [])

  const statusColor = { Recibida: 'var(--color-success)', Pendiente: 'var(--color-warning)', 'En Tránsito': 'var(--color-accent)' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>🏷️ Compras</h2>
          <p style={{ margin: 0 }}>Gestión de órdenes de compra y proveedores.</p>
        </div>
        <button className="btn btn-primary">+ Nueva Orden</button>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ color: 'var(--color-ink-faint)' }}>Cargando órdenes...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-line)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--color-ink-soft)', fontWeight: 600 }}>ID</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--color-ink-soft)', fontWeight: 600 }}>Proveedor</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--color-ink-soft)', fontWeight: 600 }}>Total</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--color-ink-soft)', fontWeight: 600 }}>Estado</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--color-ink-soft)', fontWeight: 600 }}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--color-line)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{o.id}</td>
                  <td style={{ padding: '10px 12px' }}>{o.proveedor}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>RD$ {o.total.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ color: statusColor[o.estado] || 'inherit', fontWeight: 600, fontSize: 12 }}>● {o.estado}</span>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-ink-faint)' }}>{o.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
