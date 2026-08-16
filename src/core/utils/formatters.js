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
 * Obtiene los datos fiscales y corporativos de la empresa asociada al usuario actual o ajustes globales
 */
export function getEmpresaActiva() {
  try {
    const userRaw = localStorage.getItem('erp_user')
    const user = userRaw ? JSON.parse(userRaw) : null

    // 1. Si existe configuración de empresa guardada
    const rawSettings = localStorage.getItem('appes_erp_global_settings_v2')
    const settings = rawSettings ? JSON.parse(rawSettings) : {}

    const nombreEmpresa = settings.razonSocial || settings.nombreComercial || user?.departamento || user?.name || 'APPEX Dominicana SRL'
    const rnc = settings.rnc || '1-31-89023-4'
    const telefono = settings.telefono || settings.telefonoPrincipal || '(809) 555-0100'
    const direccion = settings.direccion || settings.direccionFiscal || 'Santo Domingo, República Dominicana'
    const email = settings.emailCorporativo || settings.emailContacto || user?.email || 'contacto@empresa.com'

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
