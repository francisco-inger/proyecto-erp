

/*
 * pluginManager.service.js — appes.erp
 *
 * Gestiona:
 * - Catálogo completo de plugins
 * - Plugins instalados
 * - Plugins destacados
 * - Categorías
 * - Persistencia
 * - Instalación
 * - Desinstalación
 * - Activación / desactivación
 * - ZIP
 * - Prevención de duplicados
 */

import { getModules, setModuleEnabled } from 'core/moduleRegistry'
import JSZip from 'jszip'

// ============================================================
// CATÁLOGO OFICIAL
// ============================================================

const OFFICIAL_CATALOG = [
  {
    id: 'contabilidad',
    nombre: 'Contabilidad',
    categoria: 'Finanzas',
    color: '#6D28D9',
    bgColor: '#F3E8FF',
    icon: '💰',
    descripcion: 'Gestiona la contabilidad y las operaciones financieras del ERP.',
    version: '1.0.0',
    origen: 'Oficial',
    autor: 'appes.erp',
    rating: 4.8,
    reviews: 124,
  },

  {
    id: 'ventas-core',
    nombre: 'Ventas',
    categoria: 'Ventas',
    color: '#2563EB',
    bgColor: '#E8F0FE',
    icon: '🛒',
    descripcion: 'Gestiona ventas, facturación y operaciones comerciales.',
    version: '1.0.0',
    origen: 'Oficial',
    autor: 'appes.erp',
    rating: 4.9,
    reviews: 210,
  },

  {
    id: 'inventario-core',
    nombre: 'Inventario',
    categoria: 'Inventario',
    color: '#157F5A',
    bgColor: '#E6F9F5',
    icon: '📦',
    descripcion: 'Controla productos, existencias, movimientos y stock.',
    version: '1.0.0',
    origen: 'Oficial',
    autor: 'appes.erp',
    rating: 4.7,
    reviews: 98,
  },

  {
    id: 'crm-core',
    nombre: 'CRM',
    categoria: 'CRM',
    color: '#7C3AED',
    bgColor: '#F3E8FF',
    icon: '👥',
    descripcion: 'Administra clientes, contactos y relaciones comerciales.',
    version: '1.0.0',
    origen: 'Oficial',
    autor: 'appes.erp',
    rating: 4.6,
    reviews: 87,
  },

  {
    id: 'reportes-avanzados',
    nombre: 'Reportes Avanzados',
    categoria: 'Reportes',
    color: '#1F3A93',
    bgColor: '#E8F0FE',
    icon: '📊',
    descripcion: 'Genera reportes avanzados para analizar el rendimiento del ERP.',
    version: '1.0.0',
    origen: 'Oficial',
    autor: 'appes.erp',
    rating: 4.8,
    reviews: 76,
  },

  {
    id: 'manufactura',
    nombre: 'Manufactura',
    categoria: 'Manufactura',
    color: '#B45309',
    bgColor: '#FEF3C7',
    icon: '🏭',
    descripcion: 'Gestiona procesos de fabricación, producción y órdenes.',
    version: '1.0.0',
    origen: 'Oficial',
    autor: 'appes.erp',
    rating: 4.5,
    reviews: 54,
  },

  {
    id: 'recursos-humanos-pro',
    nombre: 'Recursos Humanos Pro',
    categoria: 'RRHH',
    color: '#DB2777',
    bgColor: '#FCE7F3',
    icon: '🧑‍💼',
    descripcion: 'Administra empleados, recursos humanos y procesos internos.',
    version: '1.0.0',
    origen: 'Oficial',
    autor: 'appes.erp',
    rating: 4.7,
    reviews: 65,
  },

  {
    id: 'compras',
    nombre: 'Compras',
    categoria: 'Ventas',
    color: '#0891B2',
    bgColor: '#CFFAFE',
    icon: '🛍️',
    descripcion: 'Gestiona proveedores, órdenes de compra y adquisiciones.',
    version: '1.0.0',
    origen: 'Oficial',
    autor: 'appes.erp',
    rating: 4.6,
    reviews: 61,
  },

  {
    id: 'integraciones',
    nombre: 'Integraciones',
    categoria: 'Integraciones',
    color: '#4F46E5',
    bgColor: '#EEF2FF',
    icon: '🔗',
    descripcion: 'Conecta el ERP con servicios y plataformas externas.',
    version: '1.0.0',
    origen: 'Oficial',
    autor: 'appes.erp',
    rating: 4.5,
    reviews: 42,
  },
]

// ============================================================
// CLAVES LOCAL STORAGE
// ============================================================

const STORAGE_KEY = 'appes_erp_installed_plugins'
const FEATURED_STORAGE_KEY = 'appes_erp_featured_plugins'

// ============================================================
// UTILIDADES
// ============================================================

const isBrowser = () =>
  typeof window !== 'undefined' &&
  typeof window.localStorage !== 'undefined'

const removeDuplicates = (plugins = []) => {
  const map = new Map()

  for (const plugin of plugins) {
    if (!plugin || !plugin.id) {
      continue
    }

    const id = String(plugin.id)

    if (!map.has(id)) {
      map.set(id, {
        ...plugin,
        id,
      })
    }
  }

  return Array.from(map.values())
}

const normalizeCoreModule = (module) => {
  if (!module) {
    return null
  }

  const id =
    module.id ||
    module.key ||
    module.name ||
    module.nombre

  if (!id) {
    return null
  }

  return {
    id: String(id),

    nombre:
      module.nombre ||
      module.name ||
      module.label ||
      String(id),

    categoria:
      module.categoria ||
      module.category ||
      'Utilidades',

    color:
      module.color ||
      '#6D28D9',

    bgColor:
      module.bgColor ||
      '#F3E8FF',

    icon:
      module.icon ||
      module.icono ||
      '🧩',

    descripcion:
      module.descripcion ||
      module.description ||
      'Módulo disponible para el ERP.',

    rating:
      Number(module.rating) || 0,

    reviews:
      Number(module.reviews) || 0,

    version:
      module.version ||
      '1.0.0',

    origen:
      module.origen ||
      module.origin ||
      'Oficial',

    autor:
      module.autor ||
      module.author ||
      'appes.erp',
  }
}

// ============================================================
// INSTALADOS INICIALES
// ============================================================

const createInitialPlugins = () => {
  const initialIds = [
    'contabilidad',
    'ventas-core',
    'inventario-core',
    'crm-core',
    'reportes-avanzados',
    'manufactura',
    'recursos-humanos-pro',
  ]

  return OFFICIAL_CATALOG
    .filter((plugin) =>
      initialIds.includes(plugin.id)
    )
    .map((plugin) => ({
      ...plugin,

      estado: 'Activo',

      ultimaAct:
        plugin.id === 'manufactura' ||
        plugin.id === 'recursos-humanos-pro'
          ? 'Hoy'
          : '15 May 2025',
    }))
}

// ============================================================
// STORAGE — INSTALADOS
// ============================================================

const readInstalledPlugins = () => {
  try {
    if (!isBrowser()) {
      return createInitialPlugins()
    }

    const stored =
      window.localStorage.getItem(STORAGE_KEY)

    if (!stored) {
      const initial =
        createInitialPlugins()

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(initial)
      )

      return initial
    }

    const parsed =
      JSON.parse(stored)

    if (!Array.isArray(parsed)) {
      const initial =
        createInitialPlugins()

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(initial)
      )

      return initial
    }

    const unique =
      removeDuplicates(parsed)

    /*
     * Si el storage existe pero está vacío,
     * usamos los plugins iniciales.
     *
     * Esto evita que una instalación anterior
     * con datos vacíos deje el sistema sin plugins.
     */
    if (unique.length === 0) {
      const initial =
        createInitialPlugins()

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(initial)
      )

      return initial
    }

    if (
      unique.length !==
      parsed.length
    ) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(unique)
      )
    }

    return unique
  } catch (error) {
    console.error(
      'Plugin Manager: error leyendo instalados:',
      error
    )

    return createInitialPlugins()
  }
}

const saveInstalledPlugins = (
  plugins = []
) => {
  const unique =
    removeDuplicates(plugins)

  try {
    if (isBrowser()) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(unique)
      )
    }
  } catch (error) {
    console.error(
      'Plugin Manager: error guardando instalados:',
      error
    )
  }

  return unique
}

// ============================================================
// STORAGE — DESTACADOS
// ============================================================

const readFeaturedIds = () => {
  try {
    if (!isBrowser()) {
      return []
    }

    const stored =
      window.localStorage.getItem(
        FEATURED_STORAGE_KEY
      )

    if (!stored) {
      return []
    }

    const parsed =
      JSON.parse(stored)

    if (!Array.isArray(parsed)) {
      return []
    }

    return [
      ...new Set(
        parsed
          .filter(
            (id) =>
              typeof id === 'string'
          )
          .map((id) => id.trim())
          .filter(Boolean)
      ),
    ]
  } catch (error) {
    console.error(
      'Plugin Manager: error leyendo destacados:',
      error
    )

    return []
  }
}

const saveFeaturedIds = (
  ids = []
) => {
  const unique = [
    ...new Set(
      ids
        .filter(
          (id) =>
            typeof id === 'string'
        )
        .map((id) => id.trim())
        .filter(Boolean)
    ),
  ]

  try {
    if (isBrowser()) {
      window.localStorage.setItem(
        FEATURED_STORAGE_KEY,
        JSON.stringify(unique)
      )
    }
  } catch (error) {
    console.error(
      'Plugin Manager: error guardando destacados:',
      error
    )
  }

  return unique
}

// ============================================================
// CATÁLOGO COMPLETO
// ============================================================

const getFullCatalog = () => {
  const map = new Map()

  /*
   * 1. Catálogo oficial
   */

  for (const plugin of OFFICIAL_CATALOG) {
    if (!plugin?.id) {
      continue
    }

    map.set(
      String(plugin.id),
      {
        ...plugin,
        id: String(plugin.id),
      }
    )
  }

  /*
   * 2. Módulos reales registrados en el core
   *
   * El core nunca se modifica.
   */

  try {
    const modules =
      getModules()

    if (Array.isArray(modules)) {
      for (const module of modules) {
        const normalized =
          normalizeCoreModule(module)

        if (!normalized) {
          continue
        }

        const existing =
          map.get(normalized.id)

        map.set(
          normalized.id,
          {
            ...(existing || {}),
            ...normalized,
          }
        )
      }
    }
  } catch (error) {
    console.error(
      'Plugin Manager: error sincronizando core:',
      error
    )
  }

  /*
   * 3. Plugins instalados por ZIP
   */

  const installed =
    readInstalledPlugins()

  for (const plugin of installed) {
    if (!plugin?.id) {
      continue
    }

    const id =
      String(plugin.id)

    const existing =
      map.get(id)

    map.set(
      id,
      {
        ...(existing || {}),
        ...plugin,
        id,
      }
    )
  }

  return removeDuplicates(
    Array.from(map.values())
  )
}

// ============================================================
// ESTADO
// ============================================================

const readPluginState = () => {
  const catalog =
    getFullCatalog()

  const installed =
    readInstalledPlugins()

  const featuredIds =
    readFeaturedIds()

  const installedIds =
    new Set(
      installed.map(
        (plugin) =>
          String(plugin.id)
      )
    )

  const featuredSet =
    new Set(featuredIds)

  const catalogWithState =
    catalog.map((plugin) => ({
      ...plugin,

      instalado:
        installedIds.has(
          String(plugin.id)
        ),

      destacado:
        featuredSet.has(
          String(plugin.id)
        ),
    }))

  return {
    catalog: catalogWithState,
    installed,
    featuredIds,
    installedIds,
    featuredSet,
  }
}

// ============================================================
// SERVICIO
// ============================================================

export const pluginManagerService = {

  // ==========================================================
  // CATÁLOGO
  // ==========================================================

  getCatalog: () => {
    try {
      return readPluginState().catalog
    } catch (error) {
      console.error(
        'Plugin Manager: error obteniendo catálogo:',
        error
      )

      return []
    }
  },

  // ==========================================================
  // MÓDULOS CORE
  // ==========================================================

  getCoreModules: () => {
    try {
      const modules =
        getModules()

      return Array.isArray(modules)
        ? modules
        : []
    } catch (error) {
      console.error(
        'Plugin Manager: error obteniendo módulos:',
        error
      )

      return []
    }
  },

  toggleCoreModule: (
    id,
    enabled
  ) => {
    try {
      setModuleEnabled(
        id,
        enabled
      )

      return true
    } catch (error) {
      console.error(
        'Plugin Manager: error cambiando módulo:',
        error
      )

      return false
    }
  },

  // ==========================================================
  // DESTACADOS
  // ==========================================================

  getFeaturedPlugins: () => {
    try {
      const state =
        readPluginState()

      return state.catalog.filter(
        (plugin) =>
          state.featuredSet.has(
            String(plugin.id)
          )
      )
    } catch (error) {
      console.error(
        'Plugin Manager: error obteniendo destacados:',
        error
      )

      return []
    }
  },

  isPluginFeatured: (id) => {
    if (!id) {
      return false
    }

    return readFeaturedIds().includes(
      String(id)
    )
  },

  toggleFeatured: (id) => {
    if (!id) {
      return readFeaturedIds()
    }

    const normalizedId =
      String(id)

    const ids =
      readFeaturedIds()

    const exists =
      ids.includes(normalizedId)

    const updated =
      exists
        ? ids.filter(
            (item) =>
              item !== normalizedId
          )
        : [
            ...ids,
            normalizedId,
          ]

    return saveFeaturedIds(
      updated
    )
  },

  addFeatured: (id) => {
    if (!id) {
      return readFeaturedIds()
    }

    const normalizedId =
      String(id)

    const ids =
      readFeaturedIds()

    if (!ids.includes(normalizedId)) {
      ids.push(normalizedId)
    }

    return saveFeaturedIds(ids)
  },

  removeFeatured: (id) => {
    if (!id) {
      return readFeaturedIds()
    }

    const normalizedId =
      String(id)

    const ids =
      readFeaturedIds()

    return saveFeaturedIds(
      ids.filter(
        (item) =>
          item !== normalizedId
      )
    )
  },

  // ==========================================================
  // INSTALADOS
  // ==========================================================

  getInstalledPlugins: () => {
    try {
      const state =
        readPluginState()

      return state.installed.map(
        (plugin) => ({
          ...plugin,

          destacado:
            state.featuredSet.has(
              String(plugin.id)
            ),
        })
      )
    } catch (error) {
      console.error(
        'Plugin Manager: error obteniendo instalados:',
        error
      )

      return []
    }
  },

  isPluginInstalled: (id) => {
    if (!id) {
      return false
    }

    return readInstalledPlugins().some(
      (plugin) =>
        String(plugin.id) ===
        String(id)
    )
  },

  // ==========================================================
  // INSTALAR
  // ==========================================================

  installPlugin: (plugin) => {
    if (
      !plugin ||
      !plugin.id
    ) {
      console.error(
        'Plugin Manager: plugin inválido.'
      )

      return readInstalledPlugins()
    }

    const installed =
      readInstalledPlugins()

    const normalizedId =
      String(plugin.id)

    const exists =
      installed.some(
        (item) =>
          String(item.id) ===
          normalizedId
      )

    /*
     * PREVENCIÓN DE DUPLICADOS
     */

    if (exists) {
      return installed
    }

    const newPlugin = {
      id: normalizedId,

      nombre:
        plugin.nombre ||
        'Plugin',

      categoria:
        plugin.categoria ||
        'Utilidades',

      color:
        plugin.color ||
        '#6D28D9',

      bgColor:
        plugin.bgColor ||
        '#F3E8FF',

      icon:
        plugin.icon ||
        '🧩',

      version:
        plugin.version ||
        '1.0.0',

      estado:
        'Activo',

      ultimaAct:
        'Hoy',

      descripcion:
        plugin.descripcion ||
        '',

      autor:
        plugin.autor ||
        'appes.erp',

      origen:
        plugin.origen ||
        'Oficial',

      rating:
        Number(plugin.rating) || 0,

      reviews:
        Number(plugin.reviews) || 0,
    }

    return saveInstalledPlugins([
      ...installed,
      newPlugin,
    ])
  },

  // ==========================================================
  // INSTALAR POR ID
  // ==========================================================

  installPluginById: (id) => {
    if (!id) {
      return readInstalledPlugins()
    }

    const catalog =
      getFullCatalog()

    const plugin =
      catalog.find(
        (item) =>
          String(item.id) ===
          String(id)
      )

    if (!plugin) {
      console.error(
        `No existe el plugin: ${id}`
      )

      return readInstalledPlugins()
    }

    return pluginManagerService.installPlugin(
      plugin
    )
  },

  // ==========================================================
  // ZIP
  // ==========================================================

  installPluginFromZip:
    async (file) => {

      if (!file) {
        throw new Error(
          'No se seleccionó ningún archivo.'
        )
      }

      if (
        !file.name ||
        !file.name
          .toLowerCase()
          .endsWith('.zip')
      ) {
        throw new Error(
          'Solo se permiten archivos .zip.'
        )
      }

      let zip

      try {
        zip =
          await JSZip.loadAsync(file)
      } catch (error) {
        console.error(
          'Plugin Manager: error leyendo ZIP:',
          error
        )

        throw new Error(
          'El archivo ZIP no es válido o está dañado.'
        )
      }

      let manifestFile = null

      for (
        const path of Object.keys(zip.files)
      ) {
        const entry =
          zip.files[path]

        if (
          path
            .toLowerCase()
            .endsWith('manifest.json') &&
          !entry.dir
        ) {
          manifestFile = entry
          break
        }
      }

      if (!manifestFile) {
        throw new Error(
          'El plugin no contiene un manifest.json.'
        )
      }

      const manifestText =
        await manifestFile.async('text')

      let manifest

      try {
        manifest =
          JSON.parse(manifestText)
      } catch (error) {
        console.error(
          'Plugin Manager: manifest inválido:',
          error
        )

        throw new Error(
          'El manifest.json no tiene un formato JSON válido.'
        )
      }

      if (
        !manifest.id ||
        typeof manifest.id !== 'string' ||
        !manifest.id.trim()
      ) {
        throw new Error(
          'El manifest.json debe contener un "id" válido.'
        )
      }

      if (
        !manifest.nombre ||
        typeof manifest.nombre !== 'string' ||
        !manifest.nombre.trim()
      ) {
        throw new Error(
          'El manifest.json debe contener un "nombre" válido.'
        )
      }

      const normalizedId =
        manifest.id.trim()

      const installed =
        readInstalledPlugins()

      const existing =
        installed.find(
          (plugin) =>
            String(plugin.id) ===
            normalizedId
        )

      /*
       * NO DUPLICAR ZIP
       */

      if (existing) {
        return {
          success: false,
          alreadyInstalled: true,
          plugin: existing,
          plugins: installed,
          message:
            `El plugin "${manifest.nombre}" ya está instalado.`,
        }
      }

      const newPlugin = {
        id:
          normalizedId,

        nombre:
          manifest.nombre.trim(),

        categoria:
          manifest.categoria ||
          'Utilidades',

        color:
          manifest.color ||
          '#6D28D9',

        bgColor:
          manifest.bgColor ||
          '#F3E8FF',

        icon:
          manifest.icon ||
          '🧩',

        version:
          manifest.version ||
          '1.0.0',

        estado:
          'Activo',

        ultimaAct:
          'Hoy',

        descripcion:
          manifest.descripcion ||
          '',

        autor:
          manifest.autor ||
          'Desconocido',

        origen:
          'ZIP',

        archivo:
          file.name,

        rating:
          Number(manifest.rating) || 0,

        reviews:
          Number(manifest.reviews) || 0,
      }

      const updated =
        saveInstalledPlugins([
          ...installed,
          newPlugin,
        ])

      return {
        success: true,
        alreadyInstalled: false,
        plugin: newPlugin,
        plugins: updated,
        message:
          'Plugin instalado correctamente.',
      }
    },

  // ==========================================================
  // DESINSTALAR
  // ==========================================================

  uninstallPlugin: (id) => {
    if (!id) {
      return readInstalledPlugins()
    }

    const normalizedId =
      String(id)

    const installed =
      readInstalledPlugins()

    const filtered =
      installed.filter(
        (plugin) =>
          String(plugin.id) !==
          normalizedId
      )

    pluginManagerService.removeFeatured(
      normalizedId
    )

    return saveInstalledPlugins(
      filtered
    )
  },

  // ==========================================================
  // TOGGLE ESTADO
  // ==========================================================

  togglePluginStatus: (id) => {
    if (!id) {
      return readInstalledPlugins()
    }

    const normalizedId =
      String(id)

    const installed =
      readInstalledPlugins()

    const updated =
      installed.map(
        (plugin) =>
          String(plugin.id) ===
          normalizedId
            ? {
                ...plugin,
                estado:
                  plugin.estado ===
                  'Activo'
                    ? 'Inactivo'
                    : 'Activo',
              }
            : plugin
      )

    return saveInstalledPlugins(
      updated
    )
  },

  // ==========================================================
  // ACTIVAR
  // ==========================================================

  enablePlugin: (id) => {
    if (!id) {
      return readInstalledPlugins()
    }

    const normalizedId =
      String(id)

    const installed =
      readInstalledPlugins()

    const updated =
      installed.map(
        (plugin) =>
          String(plugin.id) ===
          normalizedId
            ? {
                ...plugin,
                estado:
                  'Activo',
              }
            : plugin
      )

    return saveInstalledPlugins(
      updated
    )
  },

  // ==========================================================
  // DESACTIVAR
  // ==========================================================

  disablePlugin: (id) => {
    if (!id) {
      return readInstalledPlugins()
    }

    const normalizedId =
      String(id)

    const installed =
      readInstalledPlugins()

    const updated =
      installed.map(
        (plugin) =>
          String(plugin.id) ===
          normalizedId
            ? {
                ...plugin,
                estado:
                  'Inactivo',
              }
            : plugin
      )

    return saveInstalledPlugins(
      updated
    )
  },

  // ==========================================================
  // CATEGORÍAS
  // ==========================================================

  getCategories: () => {
    try {
      const catalog =
        getFullCatalog()

      const counts = {}

      for (const plugin of catalog) {
        const category =
          String(
            plugin?.categoria ||
            'Utilidades'
          ).trim() ||
          'Utilidades'

        counts[category] =
          (counts[category] || 0) + 1
      }

      const categories = [
        {
          name: 'Todas',
          count:
            catalog.length,
        },
      ]

      const order = [
        'Ventas',
        'Finanzas',
        'Inventario',
        'CRM',
        'RRHH',
        'Manufactura',
        'Reportes',
        'Integraciones',
        'Utilidades',
      ]

      for (const category of order) {
        if (
          counts[category] > 0
        ) {
          categories.push({
            name: category,
            count:
              counts[category],
          })
        }
      }

      for (
        const category of Object.keys(counts)
      ) {
        const exists =
          categories.some(
            (item) =>
              item.name ===
              category
          )

        if (!exists) {
          categories.push({
            name: category,
            count:
              counts[category],
          })
        }
      }

      return categories
    } catch (error) {
      console.error(
        'Plugin Manager: error obteniendo categorías:',
        error
      )

      return [
        {
          name: 'Todas',
          count: 0,
        },
      ]
    }
  },

  // ==========================================================
  // INFORMACIÓN SISTEMA
  // ==========================================================

  getSystemInfo: () => ({
    version: '1.0.0',
    entorno: 'Producción',
    estado: 'Óptimo',
    uptime: '15d 4h 32m',
  }),
}

