/*
  CORE · Plugin Manager (moduleRegistry)

  Este archivo es el ÚNICO punto donde el core "conoce" que existen módulos,
  y aun así no importa su código directamente: cada módulo se registra a sí
  mismo llamando a registerModule() desde su propio index.js.
*/

import { getTenantData, setTenantData } from './utils/formatters'

const STORAGE_KEY = 'appes_erp_global_settings_v2'
const registry = new Map()

// Helper para mapear IDs del registry con las keys de settings.modulos
function getSettingsKey(id) {
  if (id === 'rrhh-inventario' || id === 'inventario') return 'inventario'
  if (id === 'plugin-manager' || id === 'plugins') return 'plugins'
  return id
}

function getStoredModuleState(id) {
  try {
    const settings = getTenantData(STORAGE_KEY, null)
    if (settings && settings.modulos) {
      const key = getSettingsKey(id)
      if (typeof settings.modulos[key] === 'boolean') {
        return settings.modulos[key]
      }
    }
  } catch (_) {}
  return true
}

export function registerModule(manifest) {
  if (!manifest?.id) {
    throw new Error('Un módulo debe registrarse con un "id" único.')
  }
  const isEnabled = getStoredModuleState(manifest.id)
  registry.set(manifest.id, { enabled: isEnabled, ...manifest, enabled: isEnabled })
}

export function getModules() {
  return Array.from(registry.values())
}

export function getEnabledModules() {
  return getModules().filter((m) => {
    // Si es ajustes, siempre debe estar habilitado para poder reconfigurar
    if (m.id === 'ajustes') return true
    return m.enabled !== false && getStoredModuleState(m.id) !== false
  })
}

export function setModuleEnabled(id, enabled) {
  const mod = registry.get(id)
  if (mod) {
    registry.set(id, { ...mod, enabled })
  }
  
  // Guardar en tenant settings
  try {
    const settings = getTenantData(STORAGE_KEY, {}) || {}
    const modulos = { ...(settings.modulos || {}) }
    const key = getSettingsKey(id)
    modulos[key] = enabled
    setTenantData(STORAGE_KEY, { ...settings, modulos })
  } catch (_) {}

  // Disparar evento reactivo para toda la aplicación
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('erp:modules_changed', { detail: { id, enabled } }))
  }
}

