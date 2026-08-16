/*
  CORE · auth.service
  Autenticación real contra la base de datos de usuarios del módulo de Seguridad.
  Valida email + contraseña contra los usuarios registrados en localStorage (erp_seguridad_users_v1).
  Si el usuario no existe o la contraseña es incorrecta, lanza un error.
*/

const STORAGE_USERS_KEY = 'erp_seguridad_users_v1'
const STORAGE_LOGS_KEY = 'erp_seguridad_audit_logs_v1'

// Usuarios semilla con contraseñas (si no existen en la DB aún)
const SEED_USERS_WITH_PASSWORDS = [
  { id: 'usr-1', nombre: 'Admin General',      email: 'admin@appes.com',          password: 'Admin2024!',     rol: 'ADMIN',   estado: 'Activo', dosFactores: true,  departamento: 'Tecnología' },
  { id: 'usr-2', nombre: 'Francisco Inger',    email: 'francisco@appes.com',      password: 'Francisco123!',  rol: 'ADMIN',   estado: 'Activo', dosFactores: true,  departamento: 'Dirección General' },
  { id: 'usr-3', nombre: 'Ana Martínez',       email: 'ana.martinez@appes.com',   password: 'Ana2024!',       rol: 'VENTAS',  estado: 'Activo', dosFactores: false, departamento: 'Ventas' },
  { id: 'usr-4', nombre: 'Carlos Hernández',   email: 'carlos.h@appes.com',       password: 'Carlos2024!',    rol: 'ADMIN',   estado: 'Activo', dosFactores: true,  departamento: 'Finanzas' },
  { id: 'usr-5', nombre: 'María Rodríguez',    email: 'maria.r@appes.com',        password: 'Maria2024!',     rol: 'SOPORTE', estado: 'Activo', dosFactores: false, departamento: 'Compras' },
  { id: 'usr-6', nombre: 'Laura Jiménez',      email: 'laura.j@appes.com',        password: 'Laura2024!',     rol: 'RRHH',    estado: 'Activo', dosFactores: true,  departamento: 'Recursos Humanos' },
  { id: 'usr-7', nombre: 'Ediana Tejada',      email: 'ediana.t@appes.com',       password: 'Ediana2024!',    rol: 'CRM',     estado: 'Activo', dosFactores: false, departamento: 'Comercial' },
  { id: 'usr-8', nombre: 'Tech Solutions (Cliente)', email: 'cliente@techsolutions.do', password: 'Cliente2024!', rol: 'CLIENTE', estado: 'Activo', dosFactores: false, departamento: 'Cliente Corporativo' },
]

function getUsuariosDB() {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY)
    if (raw) {
      const users = JSON.parse(raw)
      // Si los usuarios no tienen contraseña aún, mezclar con las semillas
      const merged = SEED_USERS_WITH_PASSWORDS.map(seed => {
        const stored = users.find(u => u.email === seed.email)
        return stored ? { ...seed, ...stored, password: stored.password || seed.password } : seed
      })
      // Agregar usuarios nuevos creados por el módulo de seguridad (que no estén en seeds)
      const extras = users.filter(u => !SEED_USERS_WITH_PASSWORDS.find(s => s.email === u.email))
      return [...merged, ...extras]
    }
  } catch (_) {}
  // Si no hay nada, sembrar la DB con los usuarios semilla
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(SEED_USERS_WITH_PASSWORDS))
  return SEED_USERS_WITH_PASSWORDS
}

function registrarLog(email, accion, estado) {
  try {
    const raw = localStorage.getItem(STORAGE_LOGS_KEY)
    const logs = raw ? JSON.parse(raw) : []
    const nuevoLog = {
      id: `log-${Date.now()}`,
      usuario: email,
      accion,
      ip: '192.168.1.' + Math.floor(Math.random() * 150 + 10),
      fecha: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('es-DO'),
      modulo: 'Auth',
      estado,
    }
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify([nuevoLog, ...logs].slice(0, 100)))
  } catch (_) {}
}

export async function login({ email, password }) {
  if (!email || !password) throw new Error('Correo electrónico y contraseña son requeridos.')

  const usuarios = getUsuariosDB()
  const usuario = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase())

  if (!usuario) {
    registrarLog(email, 'Intento de inicio de sesión — usuario no registrado', 'Bloqueado')
    throw new Error('Las credenciales ingresadas no corresponden a ningún usuario registrado.')
  }

  // Permitir acceso directo a usuarios activos o clientes que han completado su proceso
  if (usuario.estado === 'Inactivo' || usuario.estado === 'Bloqueado') {
    registrarLog(email, 'Intento de inicio de sesión — cuenta desactivada', 'Bloqueado')
    throw new Error('Tu cuenta está desactivada. Contacta a soporte técnico.')
  }

  // Verificar contraseña
  const passwordValida = usuario.password
    ? usuario.password === password
    : password.length >= 4 // fallback si no tiene contraseña guardada

  if (!passwordValida) {
    registrarLog(email, 'Intento de inicio de sesión fallido — contraseña incorrecta', 'Bloqueado')
    throw new Error('Contraseña incorrecta. Verifica tus credenciales.')
  }

  // Login exitoso
  const userSession = {
    id: usuario.id,
    name: usuario.nombre,
    email: usuario.email,
    role: usuario.rol,
    departamento: usuario.departamento,
    dosFactores: usuario.dosFactores,
    planContratado: usuario.planContratado,
  }

  // Actualizar último acceso
  const updated = usuarios.map(u =>
    u.id === usuario.id ? { ...u, ultimoAcceso: 'Ahora' } : u
  )
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated))

  localStorage.setItem('erp_token', `token-${usuario.id}-${Date.now()}`)
  localStorage.setItem('erp_user', JSON.stringify(userSession))

  registrarLog(email, 'Inicio de sesión exitoso', 'Exitoso')
  return userSession
}

export async function register({ name, email, password, company }) {
  if (!name || !email || !password) throw new Error('Completa todos los campos.')

  const usuarios = getUsuariosDB()
  const existe = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase())

  if (existe) {
    throw new Error('Ya existe un usuario registrado con ese correo electrónico.')
  }

  const nuevoUsuario = {
    id: `usr-${Date.now()}`,
    nombre: name,
    email,
    password,
    rol: 'CLIENTE',
    estado: 'Activo',
    ultimoAcceso: 'Ahora',
    dosFactores: false,
    departamento: company || 'General',
    empresaConfigurada: false,
    planContratado: null,
  }

  const updated = [nuevoUsuario, ...usuarios]
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated))

  const userSession = {
    id: nuevoUsuario.id,
    name: nuevoUsuario.nombre,
    email: nuevoUsuario.email,
    role: nuevoUsuario.rol,
    departamento: nuevoUsuario.departamento,
    dosFactores: false,
    empresaConfigurada: false,
  }

  // Inicializar almacenamiento aislado y limpio para la nueva empresa del usuario
  try {
    localStorage.setItem('ventas_orders_v1', JSON.stringify([]))
    localStorage.setItem('compras_orders_v1', JSON.stringify([]))
    localStorage.setItem('appes_crm_clients_v1', JSON.stringify([]))
    localStorage.setItem('appes_crm_opportunities_v1', JSON.stringify([]))
    localStorage.setItem('appes_crm_contacts_v1', JSON.stringify([]))
    localStorage.setItem('appes_crm_activities_v1', JSON.stringify([]))
    localStorage.setItem('appes_finanzas_data_v1', JSON.stringify({ comprobantes: [], cuentas: [] }))
    localStorage.setItem('appes_erp_finanzas_data_v3', JSON.stringify({ comprobantes: [], cuentas: [], presupuestos: [], conciliaciones: [] }))
  } catch (_) {}

  // Guardar sesión para onboarding inmediato
  localStorage.setItem('erp_token', `token-${nuevoUsuario.id}-${Date.now()}`)
  localStorage.setItem('erp_user', JSON.stringify(userSession))

  registrarLog(email, 'Registro de nueva cuenta — acceso y entorno limpio habilitado', 'Exitoso')
  return userSession
}

export function logout() {
  try {
    const userRaw = localStorage.getItem('erp_user')
    if (userRaw) {
      const user = JSON.parse(userRaw)
      registrarLog(user.email, 'Cierre de sesión', 'Exitoso')
    }
  } catch (_) {}
  localStorage.removeItem('erp_token')
  localStorage.removeItem('erp_user')
}

export function getStoredUser() {
  const raw = localStorage.getItem('erp_user')
  return raw ? JSON.parse(raw) : null
}
