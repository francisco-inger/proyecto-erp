/*
  CORE · RBAC (control de acceso basado en roles)
  Define los roles del sistema y qué módulos puede ver cada uno.
  Los módulos NO deciden quién los ve: solo declaran su propio
  "requiredRole" en su manifest (ver moduleRegistry.js) y el core
  decide, de forma centralizada, si se muestran o no.
*/

export const ROLES = {
  ADMIN: 'admin',
  VENTAS: 'ventas',
  CRM: 'crm',
  RRHH: 'rrhh',
  SOPORTE: 'soporte',
}

// Jerarquía simple: admin ve todo. Cada otro rol ve su propio módulo
// más los módulos marcados como "público" (ej. chatbot).
export function canAccess(userRole, requiredRole) {
  if (!requiredRole) return true // módulo público dentro del ERP
  if (userRole === ROLES.ADMIN) return true
  return userRole === requiredRole
}
