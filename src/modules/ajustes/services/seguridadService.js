import { apiClient } from '../../../core/api/apiClient'
import { getTenantData, setTenantData, getActiveTenantId } from '../../../core/utils/formatters'

const STORAGE_USERS_KEY = 'erp_seguridad_users_v1'
const STORAGE_LOGS_KEY = 'erp_seguridad_audit_logs_v1'
const STORAGE_POLICIES_KEY = 'erp_seguridad_policies_v1'

const SEED_USERS = [
  { id: 'usr-1', nombre: 'Admin General', email: 'admin@appes.com', rol: 'ADMIN', estado: 'Activo', ultimoAcceso: 'Ahora', dosFactores: true, departamento: 'Tecnología' },
  { id: 'usr-2', nombre: 'Francisco Inger', email: 'francisco@appes.com', rol: 'ADMIN', estado: 'Activo', ultimoAcceso: 'Hace 5 min', dosFactores: true, departamento: 'Dirección General' },
]

const SEED_LOGS = []

const SEED_POLICIES = {
  dosFactoresObligatorio: true,
  longitudMinimaPassword: 8,
  requiereMayusculasNumeros: true,
  tiempoExpiracionSesionMin: 30,
  bloqueoIntentosFallidos: 3,
  registroAuditoriaCompleto: true,
}

export const seguridadService = {
  getUsuarios: async () => {
    try {
      const apiRes = await apiClient.get('/seguridad/usuarios')
      if (Array.isArray(apiRes) && apiRes.length > 0) return apiRes
    } catch (_) {}

    const tenantId = getActiveTenantId()
    const isGlobalAdmin = (tenantId === 'usr-1' || tenantId === 'usr-2' || tenantId === 'usr-admin-global')
    
    // Si es una empresa cliente, su lista de usuarios inicia solo con el usuario de sesión
    let defaultUsers = SEED_USERS
    if (!isGlobalAdmin) {
      try {
        const userRaw = localStorage.getItem('erp_user')
        if (userRaw) {
          const u = JSON.parse(userRaw)
          defaultUsers = [{
            id: u.id,
            nombre: u.name,
            email: u.email,
            rol: u.role || 'CLIENTE',
            estado: 'Activo',
            ultimoAcceso: 'Ahora',
            dosFactores: Boolean(u.dosFactores),
            departamento: u.departamento || 'Dirección',
          }]
        }
      } catch (_) {}
    }

    return getTenantData(STORAGE_USERS_KEY, defaultUsers)
  },

  createUsuario: async (nuevo) => {
    const actuales = await seguridadService.getUsuarios()
    const item = {
      id: `usr-${Date.now()}`,
      nombre: nuevo.nombre,
      email: nuevo.email,
      password: nuevo.password || 'Acceso2026!',
      rol: nuevo.rol || 'VENTAS',
      estado: nuevo.estado || 'Activo',
      ultimoAcceso: 'Nunca',
      dosFactores: Boolean(nuevo.dosFactores),
      departamento: nuevo.departamento || 'General',
    }
    const updated = [item, ...actuales]
    setTenantData(STORAGE_USERS_KEY, updated)
    seguridadService.registrarLog(`Creación de usuario: ${nuevo.email} (Rol: ${item.rol})`, 'Seguridad')
    return updated
  },

  updateUsuario: async (id, datos) => {
    const actuales = await seguridadService.getUsuarios()
    const updated = actuales.map(u => u.id === id ? { ...u, ...datos } : u)
    setTenantData(STORAGE_USERS_KEY, updated)
    seguridadService.registrarLog(`Modificación de usuario ID: ${id}`, 'Seguridad')
    return updated
  },

  deleteUsuario: async (id) => {
    const actuales = await seguridadService.getUsuarios()
    const updated = actuales.filter(u => u.id !== id)
    setTenantData(STORAGE_USERS_KEY, updated)
    seguridadService.registrarLog(`Eliminación de usuario ID: ${id}`, 'Seguridad')
    return updated
  },

  getAuditLogs: async () => {
    try {
      const apiLogs = await apiClient.get('/seguridad/logs')
      if (Array.isArray(apiLogs) && apiLogs.length > 0) return apiLogs
    } catch (_) {}

    return getTenantData(STORAGE_LOGS_KEY, SEED_LOGS)
  },

  registrarLog: (accion, modulo = 'Sistema', estado = 'Exitoso') => {
    try {
      const logs = getTenantData(STORAGE_LOGS_KEY, SEED_LOGS)
      const storedUser = localStorage.getItem('erp_user')
      const email = storedUser ? JSON.parse(storedUser).email : 'admin@appes.com'

      const nuevoLog = {
        id: `log-${Date.now()}`,
        usuario: email,
        accion,
        ip: '192.168.1.' + Math.floor(Math.random() * 150 + 10),
        fecha: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('es-DO'),
        modulo,
        estado,
      }

      const updated = [nuevoLog, ...logs].slice(0, 100)
      setTenantData(STORAGE_LOGS_KEY, updated)
    } catch (_) {}
  },

  getPolicies: () => {
    return getTenantData(STORAGE_POLICIES_KEY, SEED_POLICIES)
  },

  savePolicies: (policies) => {
    setTenantData(STORAGE_POLICIES_KEY, policies)
    seguridadService.registrarLog('Actualización de políticas de seguridad global', 'Seguridad')
    return policies
  }
}
