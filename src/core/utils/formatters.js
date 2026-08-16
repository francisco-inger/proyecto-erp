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
