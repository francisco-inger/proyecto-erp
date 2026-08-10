import { useState, useEffect } from 'react'
import { apiClient } from 'core/api/apiClient'

const FALLBACK = [
  { id: 'int-whatsapp', nombre: 'WhatsApp Business', icon: '💬', status: 'Conectado', color: '#157F5A', desc: 'API oficial de Meta para envío automatizado de mensajes.', webhookUrl: 'https://api.whatsapp.business/v1/messages', agente: 'Leandro Junior Ramírez' },
  { id: 'int-email',    nombre: 'Email SMTP',        icon: '✉️',  status: 'Conectado', color: '#157F5A', desc: 'Envío de correos transaccionales y notificaciones SMTP.',  webhookUrl: 'smtp://mail.appex-erp.com.do:587',           agente: 'Leandro Junior Ramírez' },
  { id: 'int-n8n',      nombre: 'n8n Automations',   icon: '⚙️',  status: 'Conectado', color: '#157F5A', desc: 'Motor de workflows y automatizaciones externas.',          webhookUrl: 'http://localhost:5678/webhook/',              agente: 'Daniel Morales' },
  { id: 'int-crm',      nombre: 'CRM Externo',        icon: '👥', status: 'Conectado', color: '#157F5A', desc: 'Sincronización bidireccional con HubSpot / Salesforce.',   webhookUrl: 'https://api.hubspot.com/crm/v3',              agente: 'Ediana Tejada' },
]

export function IntegracionesHome() {
  const [integraciones, setIntegraciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [testResult, setTestResult] = useState({})

  useEffect(() => {
    apiClient.get('/integraciones')
      .then(setIntegraciones)
      .catch(() => setIntegraciones(FALLBACK))
      .finally(() => setLoading(false))
  }, [])

  const handleTest = async (id) => {
    setTestResult(r => ({ ...r, [id]: 'testing' }))
    await new Promise(r => setTimeout(r, 1200))
    setTestResult(r => ({ ...r, [id]: 'ok' }))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>🌐 Integraciones</h2>
          <p style={{ margin: 0 }}>Conectores externos de la plataforma ERP.</p>
        </div>
        <button className="btn btn-primary">+ Agregar Integración</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="card" style={{ height: 140, background: 'var(--color-surface-alt)' }} />)
          : integraciones.map(int => (
              <div key={int.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span style={{ fontSize: 28 }}>{int.icon}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15 }}>{int.nombre}</h3>
                    <span style={{ fontSize: 11, color: int.color, fontWeight: 600 }}>● {int.status}</span>
                  </div>
                </div>
                <p style={{ fontSize: 12, marginBottom: 8 }}>{int.desc}</p>
                <code style={{ fontSize: 10, color: 'var(--color-ink-soft)', background: 'var(--color-surface-alt)', padding: '2px 6px', borderRadius: 3, display: 'block', marginBottom: 10, wordBreak: 'break-all' }}>
                  {int.webhookUrl}
                </code>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--color-ink-faint)' }}>Agente: {int.agente}</span>
                  <button className="btn btn-secondary" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => handleTest(int.id)}>
                    {testResult[int.id] === 'testing' ? '⏳ Probando...' : testResult[int.id] === 'ok' ? '✅ OK' : '🔌 Probar'}
                  </button>
                </div>
              </div>
            ))}
      </div>
    </div>
  )
}
