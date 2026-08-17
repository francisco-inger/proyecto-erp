/*
  formatters.js — Utilidades universales de formateo fiscal, monetario y telefónico para República Dominicana (DGII)
*/

/**
 * Formatea un RNC (9 dígitos) o Cédula (11 dígitos) en tiempo real
 * Ejemplo: "131890234" -> "1-31-89023-4"
 * Ejemplo: "00112345678" -> "001-1234567-8"
 */
export function formatRNC(value) {
  if (!value) return ''
  const clean = String(value).replace(/\D/g, '').slice(0, 11)
  
  if (clean.length <= 9) {
    // Formato RNC Corporativo: X-XX-XXXXX-X
    if (clean.length <= 1) return clean
    if (clean.length <= 3) return `${clean.slice(0, 1)}-${clean.slice(1)}`
    if (clean.length <= 8) return `${clean.slice(0, 1)}-${clean.slice(1, 3)}-${clean.slice(3)}`
    return `${clean.slice(0, 1)}-${clean.slice(1, 3)}-${clean.slice(3, 8)}-${clean.slice(8, 9)}`
  } else {
    // Formato Cédula Personal: XXX-XXXXXXX-X
    if (clean.length <= 3) return clean
    if (clean.length <= 10) return `${clean.slice(0, 3)}-${clean.slice(3)}`
    return `${clean.slice(0, 3)}-${clean.slice(3, 10)}-${clean.slice(10, 11)}`
  }
}

/**
 * Formatea un número telefónico dominicano (+1 809/829/849)
 * Ejemplo: "8095550100" -> "(809) 555-0100"
 */
export function formatPhone(value) {
  if (!value) return ''
  const clean = String(value).replace(/\D/g, '').slice(0, 10)
  if (clean.length <= 3) return clean
  if (clean.length <= 6) return `(${clean.slice(0, 3)}) ${clean.slice(3)}`
  return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6, 10)}`
}

/**
 * Obtiene el ID del Tenant (Empresa) del usuario actualmente en sesión.
 * Si es el administrador original ('admin', 'usr-1', 'usr-2'), usa el espacio global 'admin'.
 * Para cualquier usuario/empresa registrada, usa su ID único ('usr-XXX' o 'tenant_XXX').
 */
export function getActiveTenantId() {
  try {
    const userRaw = localStorage.getItem('erp_user')
    if (userRaw) {
      const user = JSON.parse(userRaw)
      // Si es un usuario del sistema principal (admin o personal de la empresa principal)
      const email = (user.email || '').toLowerCase()
      if (
        user.id === 'usr-1' ||
        user.id === 'usr-2' ||
        user.id === 'usr-3' ||
        user.id === 'usr-4' ||
        user.id === 'usr-5' ||
        user.id === 'usr-6' ||
        user.id === 'usr-7' ||
        email.endsWith('@appes.com') ||
        email === 'admin@appes.com' ||
        email === 'francisco@appes.com' ||
        user.role === 'ADMIN' && !user.tenantId
      ) {
        return 'usr-admin-global'
      }

      if (user.tenantId) return user.tenantId
      if (user.id) return user.id
      if (user.email) return user.email.toLowerCase().replace(/[^a-z0-9]/g, '_')
    }
  } catch (_) {}
  return 'usr-admin-global'
}

/**
 * Genera una clave de almacenamiento con prefijo de tenant para garantizar aislamiento total
 */
export function getTenantKey(baseKey) {
  const tenantId = getActiveTenantId()
  return `tenant_${tenantId}_${baseKey}`
}

/**
 * Lee datos aislados por empresa. Si no existen, devuelve el valor por defecto provisto (ej. [])
 */
export function getTenantData(baseKey, defaultValue = []) {
  try {
    const key = getTenantKey(baseKey)
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length > 0) return parsed
    }
    
    // Si el usuario es el sistema principal y no hay datos con prefijo tenant_, leer la clave base histórica
    const tenantId = getActiveTenantId()
    if (tenantId === 'usr-admin-global' || tenantId.startsWith('usr-1') || tenantId.startsWith('usr-2')) {
      const legacyRaw = localStorage.getItem(baseKey)
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw)
        if (Array.isArray(legacyParsed) && legacyParsed.length > 0) return legacyParsed
        if (legacyParsed && typeof legacyParsed === 'object' && !Array.isArray(legacyParsed) && Object.keys(legacyParsed).length > 0) return legacyParsed
      }
    }
  } catch (_) {}
  return defaultValue
}

/**
 * Guarda datos aislados estrictamente para la empresa en sesión
 */
export function setTenantData(baseKey, data) {
  try {
    const key = getTenantKey(baseKey)
    localStorage.setItem(key, JSON.stringify(data))
    
    // Si es admin principal también sincronizar legacy
    const tenantId = getActiveTenantId()
    if (tenantId === 'usr-1' || tenantId === 'usr-2') {
      localStorage.setItem(baseKey, JSON.stringify(data))
    }
  } catch (err) {
    console.error(`Error saving tenant data for ${baseKey}:`, err)
  }
}

/**
 * Obtiene los datos fiscales y corporativos de la empresa asociada al usuario actual o ajustes globales
 */
export function getEmpresaActiva() {
  try {
    const userRaw = localStorage.getItem('erp_user')
    const user = userRaw ? JSON.parse(userRaw) : null

    // Si el usuario en sesión es Administrador principal del sistema o del dominio principal
    const tenantId = getActiveTenantId()
    const isGlobalAdmin = (
      tenantId === 'usr-admin-global' ||
      tenantId === 'usr-1' ||
      tenantId === 'usr-2' ||
      tenantId === 'usr-3' ||
      tenantId === 'usr-4' ||
      tenantId === 'usr-5' ||
      tenantId === 'usr-6' ||
      tenantId === 'usr-7' ||
      (user?.email && user.email.toLowerCase().endsWith('@appes.com')) ||
      (user?.role === 'ADMIN' && (!user?.companyName || user.companyName === 'General' || user.companyName === 'Tecnología' || user.companyName === 'el punto aquel'))
    )

    if (isGlobalAdmin) {
      return {
        razonSocial: 'APPEX Dominicana SRL',
        nombreComercial: 'APPEX ERP',
        rnc: '1-31-89023-4',
        telefono: '(809) 555-0100',
        direccion: 'Torre Empresarial Blue Mall, Piso 14, Piantini, Santo Domingo',
        email: 'contacto@appes.com',
        ciudad: 'Santo Domingo',
        moneda: 'DOP',
        sector: 'Tecnología & Enterprise',
      }
    }

    // 1. Si existe configuración de empresa guardada para este tenant específico
    const settings = getTenantData('appes_erp_global_settings_v2', null) || {}

    const nombreEmpresa = settings.razonSocial || settings.nombreComercial || user?.companyName || user?.departamento || 'Mi Empresa'
    const rnc = settings.rnc || '1-31-00000-0'
    const telefono = settings.telefono || settings.telefonoPrincipal || '(809) 000-0000'
    const direccion = settings.direccion || settings.direccionFiscal || 'República Dominicana'
    const email = settings.emailCorporativo || settings.emailContacto || user?.email || 'contacto@empresa.do'

    return {
      razonSocial: nombreEmpresa,
      nombreComercial: settings.nombreComercial || nombreEmpresa,
      rnc,
      telefono,
      direccion,
      email,
      ciudad: settings.ciudad || 'Santo Domingo',
      moneda: settings.monedaPrincipal || 'DOP',
      sector: settings.sector || 'General',
    }
  } catch (_) {}

  return {
    razonSocial: 'APPEX Dominicana SRL',
    nombreComercial: 'APPEX ERP',
    rnc: '1-31-89023-4',
    telefono: '(809) 555-0100',
    direccion: 'Santo Domingo, República Dominicana',
    email: 'contacto@appex.do',
    ciudad: 'Santo Domingo',
    moneda: 'DOP',
    sector: 'General',
  }
}

/**
 * Obtiene la tasa oficial de cambio configurada en Ajustes (o valor por defecto)
 */
export function getExchangeRate() {
  try {
    const raw = localStorage.getItem('appes_erp_global_settings_v2')
    if (raw) {
      const settings = JSON.parse(raw)
      return {
        usd: Number(settings.tasaDolar) || 60.25,
        eur: Number(settings.tasaEuro) || 65.10,
      }
    }
  } catch (_) {}
  return { usd: 60.25, eur: 65.10 }
}

/**
 * Convierte montos en USD o EUR a Pesos Dominicanos (DOP)
 */
export function convertToDOP(amount, currency = 'DOP') {
  const num = Number(amount) || 0
  const rates = getExchangeRate()
  if (currency === 'USD') return num * rates.usd
  if (currency === 'EUR') return num * rates.eur
  return num
}

/**
 * Formatea un valor monetario en DOP
 */
export function formatMoneyDOP(val) {
  return 'RD$ ' + Number(val || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Valida si una contraseña cumple con las políticas de seguridad:
 * - Mínimo 8 caracteres
 * - Al menos 1 mayúscula
 * - Al menos 1 minúscula
 * - Al menos 1 número
 * - Al menos 1 carácter especial (@, $, !, %, *, ?, &, #, ., -, _)
 */
export function validateStrongPassword(password) {
  if (!password || password.length < 8) {
    return 'La contraseña debe contener al menos 8 caracteres.'
  }
  if (!/[A-Z]/.test(password)) {
    return 'Debe contener al menos una letra mayúscula (A-Z).'
  }
  if (!/[a-z]/.test(password)) {
    return 'Debe contener al menos una letra minúscula (a-z).'
  }
  if (!/[0-9]/.test(password)) {
    return 'Debe contener al menos un número (0-9).'
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return 'Debe contener al menos un carácter especial (ej. !@#$%&*).'
  }
  return null // Válida
}

/**
 * Formatea el número de tarjeta en bloques de 4 dígitos: "4242 4242 4242 4242"
 */
export function formatCardNumber(value) {
  if (!value) return ''
  const clean = String(value).replace(/\D/g, '').slice(0, 16)
  return clean.replace(/(\d{4})(?=\d)/g, '$1 ')
}

/**
 * Formatea la fecha de expiración de tarjeta: "MM/AA"
 */
export function formatCardExpiry(value) {
  if (!value) return ''
  const clean = String(value).replace(/\D/g, '').slice(0, 4)
  if (clean.length <= 2) return clean
  return `${clean.slice(0, 2)}/${clean.slice(2, 4)}`
}

/**
 * Formatea el código CVC/CVV (máximo 4 dígitos numéricos)
 */
export function formatCardCVC(value) {
  if (!value) return ''
  return String(value).replace(/\D/g, '').slice(0, 4)
}
