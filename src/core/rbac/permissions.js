/*
  CORE · RBAC & Licenciamiento de Planes SaaS
  Control de acceso según el Rol del usuario y el Plan adquirido por el Cliente:
  - Rol ADMIN (Proveedor / Administrador General del ERP): Acceso total a todo el sistema, ajustes, auditoría y código.
  - Rol CLIENTE (Cliente Comprador): Ve su portal corporativo y únicamente los módulos incluidos en su plan contratado.
*/

export const ROLES = {
  ADMIN: 'admin',
  CLIENTE: 'cliente',
  VENTAS: 'ventas',
  CRM: 'crm',
  RRHH: 'rrhh',
  SOPORTE: 'soporte',
}

export const PLAN_MODULES = {
  plan_startup: ['ventas', 'crm', 'rrhh-inventario', 'reportes', 'chatbot'],
  plan_profesional: ['ventas', 'compras', 'crm', 'rrhh-inventario', 'finanzas', 'reportes', 'chatbot'],
  plan_enterprise: ['ventas', 'compras', 'crm', 'rrhh-inventario', 'rrhh', 'finanzas', 'reportes', 'chatbot', 'integraciones', 'plugin-manager', 'ajustes'],
}

/**
 * Obtiene el plan activo guardado en el sistema o del usuario en sesión
 */
export function getActivePlan() {
  try {
    // 1. Verificar si el usuario en sesión tiene un plan contratado
    const userRaw = localStorage.getItem('erp_user')
    if (userRaw) {
      const user = JSON.parse(userRaw)
      if (user.planContratado && PLAN_MODULES[user.planContratado]) {
        const nombres = {
          plan_startup: 'Plan Básico',
          plan_profesional: 'Plan Profesional',
          plan_enterprise: 'Plan Enterprise Suite',
        }
        return {
          planId: user.planContratado,
          planNombre: nombres[user.planContratado] || 'Plan Activo',
          planBadge: 'Suscripción Activa',
          estado: 'Activo',
          maxUsuarios: user.planContratado === 'plan_enterprise' ? 999 : user.planContratado === 'plan_profesional' ? 10 : 2,
          espacioGB: user.planContratado === 'plan_enterprise' ? 50 : 10,
        }
      }
    }

    // 2. Verificar suscripción global guardada
    const raw = localStorage.getItem('appes_active_plan_subscription_v1')
    if (raw) return JSON.parse(raw)
  } catch (_) {}

  return {
    planId: 'plan_profesional',
    planNombre: 'Plan Profesional',
    planBadge: 'Activo',
    estado: 'Activo',
    maxUsuarios: 10,
    espacioGB: 20,
  }
}

/**
 * Determina si el usuario actual tiene acceso a un módulo específico
 */
export function canAccess(userRole, moduleId) {
  const uRole = String(userRole || 'admin').toLowerCase()
  
  // 1. El Proveedor / Administrador General (admin) tiene acceso total e irrestricto
  if (uRole === 'admin') return true

  // 2. Si es un Cliente (rol: cliente / comprador), validar contra los módulos incluidos en su plan contratado
  const activePlan = getActivePlan()
  const allowedInPlan = PLAN_MODULES[activePlan.planId] || PLAN_MODULES.plan_enterprise

  if (uRole === 'cliente') {
    // El cliente no tiene acceso a la administración técnica profunda de ajustes del proveedor
    if (moduleId === 'plugin-manager') return false
    return allowedInPlan.includes(moduleId)
  }

  // 3. Roles departamentales
  if (uRole === 'ventas') return ['ventas', 'crm', 'chatbot'].includes(moduleId)
  if (uRole === 'crm') return ['crm', 'proyectos', 'chatbot'].includes(moduleId)
  if (uRole === 'rrhh') return ['rrhh', 'rrhh-inventario', 'chatbot'].includes(moduleId)
  if (uRole === 'soporte') return ['chatbot', 'reportes', 'integraciones'].includes(moduleId)

  return true
}
