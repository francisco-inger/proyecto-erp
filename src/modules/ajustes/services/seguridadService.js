/*
  seguridadService.js — Servicio Central de Seguridad, Usuarios, Roles y Auditoría
  Sincronizado con API Backend y Almacenamiento Reactivo con base de datos SQLite / Mock.
*/
import { apiClient } from '../../../core/api/apiClient'

const STORAGE_USERS_KEY = 'erp_seguridad_users_v1'
const STORAGE_LOGS_KEY = 'erp_seguridad_audit_logs_v1'
const STORAGE_POLICIES_KEY = 'erp_seguridad_policies_v1'

const SEED_USERS = [
  { id: 'usr-1', nombre: 'Admin General', email: 'admin@appes.com', rol: 'ADMIN', estado: 'Activo', ultimoAcceso: 'Ahora', dosFactores: true, departamento: 'Tecnología' },
  { id: 'usr-2', nombre: 'Francisco Inger', email: 'francisco@appes.com', rol: 'ADMIN', estado: 'Activo', ultimoAcceso: 'Hace 5 min', dosFactores: true, departamento: 'Dirección General' },
  { id: 'usr-3', nombre: 'Ana Martínez', email: 'ana.martinez@appes.com', rol: 'VENTAS', estado: 'Activo', ultimoAcceso: 'Hoy 09:30 AM', dosFactores: false, departamento: 'Ventas' },
  { id: 'usr-4', nombre: 'Carlos Hernández', email: 'carlos.h@appes.com', rol: 'ADMIN', estado: 'Activo', ultimoAcceso: 'Hoy 08:15 AM', dosFactores: true, departamento: 'Finanzas' },
  { id: 'usr-5', nombre: 'María Rodríguez', email: 'maria.r@appes.com', rol: 'SOPORTE', estado: 'Activo', ultimoAcceso: 'Ayer 04:20 PM', dosFactores: false, departamento: 'Compras' },
  { id: 'usr-6', nombre: 'Laura Jiménez', email: 'laura.j@appes.com', rol: 'RRHH', estado: 'Activo', ultimoAcceso: 'Ayer 11:00 AM', dosFactores: true, departamento: 'Recursos Humanos' },
  { id: 'usr-7', nombre: 'Ediana Tejada', email: 'ediana.t@appes.com', rol: 'CRM', estado: 'Activo', ultimoAcceso: 'Ayer 02:45 PM', dosFactores: false, departamento: 'Comercial' },
]

const SEED_LOGS = [
  { id: 'log-1', usuario: 'admin@appes.com', accion: 'Inicio de sesión exitoso (2FA)', ip: '192.168.1.104', fecha: 'Hoy 09:42 AM', modulo: 'Seguridad', estado: 'Exitoso' },
  { id: 'log-2', usuario: 'francisco@appes.com', accion: 'Aprobación de Comprobante Finanzas #FV-000101', ip: '190.166.45.12', fecha: 'Hoy 09:15 AM', modulo: 'Finanzas', estado: 'Exitoso' },
  { id: 'log-3', usuario: 'ana.martinez@appes.com', accion: 'Creación de Pedido de Ventas #PED-019', ip: '192.168.1.55', fecha: 'Hoy 08:30 AM', modulo: 'Ventas', estado: 'Exitoso' },
  { id: 'log-4', usuario: 'desconocido@185.220.101.4', accion: 'Intento de inicio de sesión fallido', ip: '185.220.101.4', fecha: 'Ayer 11:55 PM', modulo: 'Auth', estado: 'Bloqueado' },
  { id: 'log-5', usuario: 'carlos.h@appes.com', accion: 'Exportación de Balances Financieros (CSV)', ip: '192.168.1.80', fecha: 'Ayer 04:10 PM', modulo: 'Finanzas', estado: 'Exitoso' },
]

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

    try {
      const raw = localStorage.getItem(STORAGE_USERS_KEY)
      if (raw) return JSON.parse(raw)
    } catch (_) {}

    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(SEED_USERS))
    return SEED_USERS
  },

  createUsuario: async (nuevo) => {
    const actuales = await seguridadService.getUsuarios()
    const item = {
      id: `usr-${Date.now()}`,
      nombre: nuevo.nombre,
      email: nuevo.email,
      rol: nuevo.rol || 'VENTAS',
      estado: nuevo.estado || 'Activo',
      ultimoAcceso: 'Nunca',
      dosFactores: Boolean(nuevo.dosFactores),
      departamento: nuevo.departamento || 'General',
    }
    const updated = [item, ...actuales]
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated))
    seguridadService.registrarLog(`Creación de usuario: ${nuevo.email}`, 'Seguridad')
    return updated
  },

  updateUsuario: async (id, datos) => {
    const actuales = await seguridadService.getUsuarios()
    const updated = actuales.map(u => u.id === id ? { ...u, ...datos } : u)
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated))
    seguridadService.registrarLog(`Modificación de usuario ID: ${id}`, 'Seguridad')
    return updated
  },

  deleteUsuario: async (id) => {
    const actuales = await seguridadService.getUsuarios()
    const updated = actuales.filter(u => u.id !== id)
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated))
    seguridadService.registrarLog(`Eliminación de usuario ID: ${id}`, 'Seguridad')
    return updated
  },

  getAuditLogs: async () => {
    try {
      const apiLogs = await apiClient.get('/seguridad/logs')
      if (Array.isArray(apiLogs) && apiLogs.length > 0) return apiLogs
    } catch (_) {}

    try {
      const raw = localStorage.getItem(STORAGE_LOGS_KEY)
      if (raw) return JSON.parse(raw)
    } catch (_) {}

    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(SEED_LOGS))
    return SEED_LOGS
  },

  registrarLog: (accion, modulo = 'Sistema', estado = 'Exitoso') => {
    try {
      const raw = localStorage.getItem(STORAGE_LOGS_KEY)
      const logs = raw ? JSON.parse(raw) : SEED_LOGS
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
      localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(updated))
    } catch (_) {}
  },

  getPolicies: () => {
    try {
      const raw = localStorage.getItem(STORAGE_POLICIES_KEY)
      if (raw) return JSON.parse(raw)
    } catch (_) {}
    localStorage.setItem(STORAGE_POLICIES_KEY, JSON.stringify(SEED_POLICIES))
    return SEED_POLICIES
  },

  savePolicies: (policies) => {
    localStorage.setItem(STORAGE_POLICIES_KEY, JSON.stringify(policies))
    seguridadService.registrarLog('Actualización de políticas de seguridad global', 'Seguridad')
    return policies
  }
}
