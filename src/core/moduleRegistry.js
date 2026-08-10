/*
  CORE · Plugin Manager (moduleRegistry)

  Este archivo es el ÚNICO punto donde el core "conoce" que existen módulos,
  y aun así no importa su código directamente: cada módulo se registra a sí
  mismo llamando a registerModule() desde su propio index.js.

  Esto es lo que hace que el core sea independiente de los módulos:
    - El core NO importa nada de /modules/*.
    - Los módulos SÍ importan utilidades del core (apiClient, rbac, estilos).
    - La composición ocurre en src/App.jsx, que es el único archivo que
      conoce la lista completa de módulos instalados.

  Cada módulo debe exportar un "manifest" con esta forma:
  {
    id: 'ventas',
    name: 'Ventas',
    path: '/ventas',
    color: 'var(--color-ventas)',
    requiredRole: ROLES.VENTAS,      // null = visible para todos
    element: <VentasHome />,          // componente raíz del módulo
    enabled: true,                    // permite desinstalar sin borrar código
  }
*/

const registry = new Map()

export function registerModule(manifest) {
  if (!manifest?.id) {
    throw new Error('Un módulo debe registrarse con un "id" único.')
  }
  registry.set(manifest.id, { enabled: true, ...manifest })
}

export function getModules() {
  return Array.from(registry.values())
}

export function getEnabledModules() {
  return getModules().filter((m) => m.enabled)
}

export function setModuleEnabled(id, enabled) {
  const mod = registry.get(id)
  if (mod) registry.set(id, { ...mod, enabled })
}
