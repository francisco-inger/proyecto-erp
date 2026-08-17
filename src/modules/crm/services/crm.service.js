import { apiClient } from '../../../core/api/apiClient'
import { erpSync } from '../../../core/sync/erpSyncEngine'
import { getTenantData, setTenantData, getActiveTenantId } from '../../../core/utils/formatters'

const STORAGE_KEYS = {
  CLIENTS: 'appes_crm_clients_v1',
  OPPORTUNITIES: 'appes_crm_opportunities_v1',
  CONTACTS: 'appes_crm_contacts_v1',
  ACTIVITIES: 'appes_crm_activities_v1',
}

const DEFAULT_CLIENTS = [
  { id: 1, nombre: 'Tech Solutions SRL', contacto: 'Juan Pérez', email: 'contacto@techsolutions.do', telefono: '(809) 555-0192', sector: 'Tecnología', estado: 'Activo', estadoTipo: 'success' },
  { id: 2, nombre: 'Distribuidora XYZ', contacto: 'María Rodríguez', email: 'mrodriguez@distxyz.com', telefono: '(809) 555-0144', sector: 'Comercio', estado: 'Activo', estadoTipo: 'success' },
  { id: 3, nombre: 'Comercial ABC', contacto: 'Carlos Gómez', email: 'cgomez@comercialabc.com', telefono: '(809) 555-0188', sector: 'Retail', estado: 'Pendiente', estadoTipo: 'warning' },
  { id: 4, nombre: 'Servicios Integrales RD', contacto: 'Ana López', email: 'alopez@serviciosrd.com', telefono: '(829) 555-0123', sector: 'Servicios', estado: 'Activo', estadoTipo: 'success' },
  { id: 5, nombre: 'Industria del Caribe', contacto: 'Pedro Martínez', email: 'pmartinez@indcaribe.do', telefono: '(809) 555-0199', sector: 'Manufactura', estado: 'Inactivo', estadoTipo: 'danger' },
]

const DEFAULT_OPPORTUNITIES = [
  { id: 1, nombre: 'Implementación ERP', cliente: 'Tech Solutions SRL', valor: 850000, etapa: 'Propuesta', etapaColor: 'success', probabilidad: 70, fechaCierre: '2025-06-15' },
  { id: 2, nombre: 'Consultoría Estratégica', cliente: 'Comercial ABC', valor: 650000, etapa: 'Negociación', etapaColor: 'warning', probabilidad: 85, fechaCierre: '2025-06-10' },
  { id: 3, nombre: 'Sistema de Inventario', cliente: 'Distribuidora XYZ', valor: 420000, etapa: 'Calificación', etapaColor: 'purple', probabilidad: 50, fechaCierre: '2025-06-25' },
  { id: 4, nombre: 'Desarrollo a Medida', cliente: 'Servicios Integrales RD', valor: 1200000, etapa: 'Propuesta', etapaColor: 'success', probabilidad: 60, fechaCierre: '2025-07-01' },
  { id: 5, nombre: 'Soporte y Mantenimiento', cliente: 'Industria del Caribe', valor: 180000, etapa: 'Prospección', etapaColor: 'blue', probabilidad: 30, fechaCierre: '2025-07-15' },
  { id: 6, nombre: 'Integración Pasarela de Pagos', cliente: 'Tech Solutions SRL', valor: 350000, etapa: 'Cierre', etapaColor: 'success', probabilidad: 95, fechaCierre: '2025-05-31' },
]

const DEFAULT_CONTACTS = [
  { id: 1, iniciales: 'JP', nombre: 'Juan Pérez', empresa: 'Tech Solutions SRL', cargo: 'Gerente General', email: 'jperez@techsolutions.do', telefono: '(809) 555-0192' },
  { id: 2, iniciales: 'MR', nombre: 'María Rodríguez', empresa: 'Distribuidora XYZ', cargo: 'Directora Comercial', email: 'mrodriguez@distxyz.com', telefono: '(809) 555-0144' },
  { id: 3, iniciales: 'CG', nombre: 'Carlos Gómez', empresa: 'Comercial ABC', cargo: 'Gerente de Ventas', email: 'cgomez@comercialabc.com', telefono: '(809) 555-0188' },
  { id: 4, iniciales: 'AL', nombre: 'Ana López', empresa: 'Servicios Integrales RD', cargo: 'Coordinadora', email: 'alopez@serviciosrd.com', telefono: '(829) 555-0123' },
  { id: 5, iniciales: 'PM', nombre: 'Pedro Martínez', empresa: 'Industria del Caribe', cargo: 'Director Operaciones', email: 'pmartinez@indcaribe.do', telefono: '(809) 555-0199' },
]

const DEFAULT_ACTIVITIES = [
  { id: 1, tipo: 'call', titulo: 'Llamada con Juan Pérez', sub: 'Cliente: Tech Solutions SRL', hora: '10:30 a. m.', iconColor: 'green', completada: true },
  { id: 2, tipo: 'meeting', titulo: 'Reunión de presentación', sub: 'Oportunidad: Sistema ERP', hora: 'Ayer', iconColor: 'purple', completada: true },
  { id: 3, tipo: 'email', titulo: 'Email de seguimiento', sub: 'Cliente: Distribuidora XYZ', hora: 'Ayer', iconColor: 'orange', completada: false },
  { id: 4, tipo: 'proposal', titulo: 'Propuesta enviada', sub: 'Oportunidad: Consultoría IT', hora: '2 días', iconColor: 'blue', completada: false },
]

function getStored(key, def) {
  const tenantId = getActiveTenantId()
  const defaultVal = (tenantId === 'usr-1' || tenantId === 'usr-2' || tenantId === 'usr-admin-global') ? def : []
  return getTenantData(key, defaultVal)
}

function setStored(key, val) {
  setTenantData(key, val)
}

export const crmService = {
  // ── Clientes ──
  listClients: async () => {
    return getStored(STORAGE_KEYS.CLIENTS, DEFAULT_CLIENTS)
  },

  addClient: async (client) => {
    let created = null
    try {
      const res = await apiClient.post('/clientes', {
        rnc_cedula: client.rnc || client.rnc_cedula || '',
        nombre_empresa: client.nombre || client.nombre_empresa,
        contacto_principal: client.contacto || client.contacto_principal,
        email: client.email,
        telefono: client.telefono,
        direccion: client.direccion || '',
        sector: client.sector || 'Comercial',
        limite_credito: client.limite_credito || 0,
        estado: client.estado || 'Activo',
      })
      if (res && res.id) created = res
    } catch (_) {}

    const clients = getStored(STORAGE_KEYS.CLIENTS, DEFAULT_CLIENTS)
    const newClient = {
      id: created?.id || Date.now(),
      estadoTipo: client.estado === 'Activo' ? 'success' : client.estado === 'Pendiente' ? 'warning' : 'danger',
      ...client,
    }
    const updated = [newClient, ...clients.filter(c => c.id !== newClient.id)]
    setStored(STORAGE_KEYS.CLIENTS, updated)
    erpSync.emit('client_updated', { client: newClient })
    return newClient
  },

  updateClientStatus: async (id, newStatus) => {
    const clients = getStored(STORAGE_KEYS.CLIENTS, DEFAULT_CLIENTS)
    const updated = clients.map((c) =>
      c.id === id
        ? {
            ...c,
            estado: newStatus,
            estadoTipo: newStatus === 'Activo' ? 'success' : newStatus === 'Pendiente' ? 'warning' : 'danger',
          }
        : c
    )
    setStored(STORAGE_KEYS.CLIENTS, updated)
    erpSync.emit('client_updated', { id, status: newStatus })
    return updated
  },

  deleteClient: async (id) => {
    const clients = getStored(STORAGE_KEYS.CLIENTS, DEFAULT_CLIENTS)
    const updated = clients.filter((c) => c.id !== id)
    setStored(STORAGE_KEYS.CLIENTS, updated)
    erpSync.emit('client_updated', { id, deleted: true })
    return updated
  },

  // ── Oportunidades ──
  listOpportunities: async () => {
    return getStored(STORAGE_KEYS.OPPORTUNITIES, DEFAULT_OPPORTUNITIES)
  },

  addOpportunity: async (opp) => {
    const opps = getStored(STORAGE_KEYS.OPPORTUNITIES, DEFAULT_OPPORTUNITIES)
    const colorMap = {
      Prospección: 'blue',
      Calificación: 'purple',
      Propuesta: 'success',
      Negociación: 'warning',
      Cierre: 'success',
    }
    const newOpp = {
      id: Date.now(),
      etapaColor: colorMap[opp.etapa] || 'blue',
      probabilidad: opp.probabilidad || 50,
      ...opp,
    }
    const updated = [newOpp, ...opps]
    setStored(STORAGE_KEYS.OPPORTUNITIES, updated)
    erpSync.syncCrmOpportunity(newOpp)
    return newOpp
  },

  updateOpportunityStage: async (id, newStage) => {
    const opps = getStored(STORAGE_KEYS.OPPORTUNITIES, DEFAULT_OPPORTUNITIES)
    const colorMap = {
      Prospección: 'blue',
      Calificación: 'purple',
      Propuesta: 'success',
      Negociación: 'warning',
      Cierre: 'success',
    }
    let updatedOpp = null
    const updated = opps.map((o) => {
      if (o.id === id) {
        const item = { ...o, etapa: newStage, etapaColor: colorMap[newStage] || 'blue' }
        updatedOpp = item
        return item
      }
      return o
    })
    setStored(STORAGE_KEYS.OPPORTUNITIES, updated)
    if (updatedOpp) {
      erpSync.syncCrmOpportunity(updatedOpp)
    }
    return updated
  },

  // ── Contactos ──
  listContacts: async () => {
    return getStored(STORAGE_KEYS.CONTACTS, DEFAULT_CONTACTS)
  },

  addContact: async (contact) => {
    const contacts = getStored(STORAGE_KEYS.CONTACTS, DEFAULT_CONTACTS)
    const initials = contact.nombre
      ? contact.nombre
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : 'CT'
    const newContact = {
      id: Date.now(),
      iniciales: initials,
      ...contact,
    }
    const updated = [newContact, ...contacts]
    setStored(STORAGE_KEYS.CONTACTS, updated)
    return newContact
  },

  deleteContact: async (id) => {
    const contacts = getStored(STORAGE_KEYS.CONTACTS, DEFAULT_CONTACTS)
    const updated = contacts.filter((c) => c.id !== id)
    setStored(STORAGE_KEYS.CONTACTS, updated)
    return updated
  },

  // ── Actividades ──
  listActivities: async () => {
    return getStored(STORAGE_KEYS.ACTIVITIES, DEFAULT_ACTIVITIES)
  },

  addActivity: async (act) => {
    const activities = getStored(STORAGE_KEYS.ACTIVITIES, DEFAULT_ACTIVITIES)
    const colorMap = { call: 'green', meeting: 'purple', email: 'orange', proposal: 'blue' }
    const newAct = {
      id: Date.now(),
      hora: 'Hace un momento',
      iconColor: colorMap[act.tipo] || 'blue',
      completada: false,
      ...act,
    }
    const updated = [newAct, ...activities]
    setStored(STORAGE_KEYS.ACTIVITIES, updated)
    return newAct
  },

  toggleActivity: async (id) => {
    const activities = getStored(STORAGE_KEYS.ACTIVITIES, DEFAULT_ACTIVITIES)
    const updated = activities.map((a) => (a.id === id ? { ...a, completada: !a.completada } : a))
    setStored(STORAGE_KEYS.ACTIVITIES, updated)
    return updated
  },

  // ── Fuentes & Embudo ──
  getSources: async () => {
    return [
      { label: 'Referidos', pct: 35, color: '#2563EB' },
      { label: 'Sitio Web', pct: 25, color: '#10B981' },
      { label: 'Redes Sociales', pct: 20, color: '#F97316' },
      { label: 'Llamadas', pct: 15, color: '#FBBF24' },
      { label: 'Otros', pct: 5, color: '#94A3B8' },
    ]
  },
}


