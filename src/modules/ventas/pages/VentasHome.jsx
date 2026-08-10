export function VentasHome() {
  return (
    <div>
      <span className="badge" style={{ color: 'var(--color-ventas)', borderColor: 'var(--color-ventas)' }}>Módulo Ventas</span>
      <h2>Pedidos, cotizaciones y facturas</h2>
      <div className="card">
        <p>
          Aquí vive la UI del módulo de Ventas (Eliannys). Conecta con
          <code> POST /api/sales/orders</code> a través de
          <code> ventasService</code>.
        </p>
      </div>
    </div>
  )
}
