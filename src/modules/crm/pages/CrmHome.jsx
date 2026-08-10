export function CrmHome() {
  return (
    <div>
      <span className="badge" style={{ color: 'var(--color-crm)', borderColor: 'var(--color-crm)' }}>Módulo CRM</span>
      <h2>Clientes, oportunidades y contactos</h2>
      <div className="card">
        <p>
          UI del módulo CRM (Ediana). Conecta con <code>GET /api/crm/contacts</code>
          a través de <code>crmService</code>.
        </p>
      </div>
    </div>
  )
}
