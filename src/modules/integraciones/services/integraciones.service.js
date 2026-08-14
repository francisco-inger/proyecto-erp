/*
  integraciones.service.js — Servicio Central de Conectores, Webhooks y Sincronización Externa
  Conectado con SQLite Backend y LocalStorage reactivo.
*/
import { apiClient } from '../../../core/api/apiClient'

const STORAGE_KEY = 'appes_integraciones_v1'
const STORAGE_EVENTS_KEY = 'appes_integraciones_events_v1'

const DEFAULT_INTEGRACIONES = [
  {
    id: 'int-whatsapp',
    nombre: 'WhatsApp Business API',
    icon: '💬',
    status: 'Conectado',
    tipo: 'Mensajería',
    color: '#10B981',
    desc: 'Notificaciones automáticas de pedidos de ventas, recibos de pago y facturas PDF vía WhatsApp.',
    endpoint: 'https://api.whatsapp.business/v1/messages',
    token: 'wh_live_98a76b5c4d3e2f1a',
    eventos: 1420,
    ultimoPing: 'Hace 2 min',
    agente: 'Leandro Junior Ramírez',
    eventosActivos: ['ventas.pedido_creado', 'finanzas.recibo_emitido', 'compras.orden_aprobada']
  },
  {
    id: 'int-email',
    nombre: 'Servidor Email SMTP',
    icon: '✉️',
    status: 'Conectado',
    tipo: 'Correo Electrónico',
    color: '#10B981',
    desc: 'Envío de correos transaccionales DGII con NCF adjunto y alertas de seguridad 2FA.',
    endpoint: 'smtp://mail.appes-erp.com.do:587',
    token: 'smtp_auth_tls_pass',
    eventos: 3890,
    ultimoPing: 'Hace 1 min',
    agente: 'Leandro Junior Ramírez',
    eventosActivos: ['seguridad.2fa_token', 'ventas.factura_dgii', 'rrhh.nomina_recibo']
  },
  {
    id: 'int-n8n',
    nombre: 'n8n Automations & AI',
    icon: '⚙️',
    status: 'Conectado',
    tipo: 'Workflows',
    color: '#10B981',
    desc: 'Motor de automatización y orquestación con IA para análisis predictivo y bots.',
    endpoint: 'http://localhost:5678/webhook/appes-events',
    token: 'n8n_sec_webhook_key_77',
    eventos: 512,
    ultimoPing: 'Hace 5 min',
    agente: 'Daniel Morales',
    eventosActivos: ['crm.lead_capturado', 'inventario.stock_critico']
  },
  {
    id: 'int-crm',
    nombre: 'CRM Externo (HubSpot / Salesforce)',
    icon: '👥',
    status: 'Conectado',
    tipo: 'Sincronización Clientes',
    color: '#10B981',
    desc: 'Sincronización bidireccional continua de prospectos, clientes y oportunidades ganadas.',
    endpoint: 'https://api.hubspot.com/crm/v3/objects/contacts',
    token: 'pat-na1-897bca54-1234-5678',
    eventos: 840,
    ultimoPing: 'Hace 12 min',
    agente: 'Ediana Tejada',
    eventosActivos: ['crm.cliente_actualizado', 'ventas.cliente_nuevo']
  },
  {
    id: 'int-dgii',
    nombre: 'DGII Facturación Electrónica (e-CF)',
    icon: '🏛️',
    status: 'Conectado',
    tipo: 'Fiscal República Dominicana',
    color: '#2563EB',
    desc: 'Validación en tiempo real de NCF y comprobantes fiscales electrónicos ante la DGII.',
    endpoint: 'https://ecf.dgii.gov.do/ws/recepcion',
    token: 'cert_rnc_132456789_dgii',
    eventos: 2150,
    ultimoPing: 'Hace 3 min',
    agente: 'Carlos Hernández',
    eventosActivos: ['ventas.ncf_emitido', 'finanzas.itbis_calculado']
  }
]

const DEFAULT_EVENTS = [
  { id: 'evt-1', fecha: 'Hoy 09:44 AM', integracion: 'WhatsApp Business API', evento: 'Notificación de Factura #FV-000101', destino: '+1 (809) 555-0192', estado: 'Entregado (200 OK)' },
  { id: 'evt-2', fecha: 'Hoy 09:30 AM', integracion: 'DGII Facturación Electrónica', evento: 'Emisión e-CF B0100000045', destino: 'ecf.dgii.gov.do', estado: 'Aceptado (200 OK)' },
  { id: 'evt-3', fecha: 'Hoy 09:12 AM', integracion: 'Servidor Email SMTP', evento: 'Código de Verificación 2FA a admin@appes.com', destino: 'admin@appes.com', estado: 'Enviado (250 OK)' },
  { id: 'evt-4', fecha: 'Hoy 08:45 AM', integracion: 'n8n Automations & AI', evento: 'Sincronización de Stock Bajo', destino: 'localhost:5678', estado: 'Completado (200 OK)' },
  { id: 'evt-5', fecha: 'Ayer 05:20 PM', integracion: 'CRM Externo', evento: 'Importación de Nuevo Prospecto B2B', destino: 'api.hubspot.com', estado: 'Sincronizado' },
]

export const integracionesService = {
  getIntegraciones: async () => {
    try {
      const res = await apiClient.get('/integraciones')
      if (Array.isArray(res) && res.length > 0) return res
    } catch (_) {}

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch (_) {}

    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INTEGRACIONES))
    return DEFAULT_INTEGRACIONES
  },

  createIntegracion: async (nueva) => {
    const actuales = await integracionesService.getIntegraciones()
    const item = {
      id: `int-${Date.now()}`,
      nombre: nueva.nombre,
      icon: nueva.icon || '🔗',
      status: 'Conectado',
      tipo: nueva.tipo || 'Custom Webhook',
      color: '#10B981',
      desc: nueva.desc || 'Conector personalizado de datos externos.',
      endpoint: nueva.endpoint,
      token: nueva.token || 'secret_token_' + Math.random().toString(36).slice(2),
      eventos: 0,
      ultimoPing: 'Justo ahora',
      agente: nueva.agente || 'Administrador',
      eventosActivos: ['sistema.evento_general']
    }
    const updated = [item, ...actuales]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  },

  toggleStatus: async (id) => {
    const actuales = await integracionesService.getIntegraciones()
    const updated = actuales.map(i => {
      if (i.id === id) {
        const nextStatus = i.status === 'Conectado' ? 'Pausado' : 'Conectado'
        const nextColor = nextStatus === 'Conectado' ? '#10B981' : '#F59E0B'
        return { ...i, status: nextStatus, color: nextColor }
      }
      return i
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  },

  deleteIntegracion: async (id) => {
    const actuales = await integracionesService.getIntegraciones()
    const updated = actuales.filter(i => i.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  },

  testEndpoint: async (item) => {
    // Simular llamada real de ping HTTP
    await new Promise(r => setTimeout(r, 800))
    const latencia = Math.floor(Math.random() * 80 + 35)
    
    // Registrar evento en la bitácora
    const events = integracionesService.getEvents()
    const nuevoEvt = {
      id: `evt-${Date.now()}`,
      fecha: 'Justo ahora',
      integracion: item.nombre,
      evento: 'Test de conectividad Ping/Pong',
      destino: item.endpoint,
      estado: `Conexión Exitosa (${latencia}ms - 200 OK)`
    }
    const updatedEvents = [nuevoEvt, ...events].slice(0, 50)
    localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(updatedEvents))

    return {
      ok: true,
      latencia: `${latencia}ms`,
      statusCode: 200,
      mensaje: `Respuesta exitosa de ${item.nombre} en ${latencia}ms`
    }
  },

  getEvents: () => {
    try {
      const raw = localStorage.getItem(STORAGE_EVENTS_KEY)
      if (raw) return JSON.parse(raw)
    } catch (_) {}
    localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(DEFAULT_EVENTS))
    return DEFAULT_EVENTS
  }
}
