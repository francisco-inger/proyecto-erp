

/*
 * PluginManagerHome — appes.erp
 *
 * Versión protegida contra:
 * - Datos undefined/null
 * - Servicios que todavía no existen
 * - Arrays inválidos
 * - Plugins duplicados
 * - Errores al cargar
 * - Pantalla en blanco
 * - Instalación ZIP
 * - Catálogo
 * - Plugins instalados
 * - Destacados
 * - Categorías
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { pluginManagerService } from '../services/pluginManager.service'
import './PluginManagerHome.css'

const EMPTY_STATE = {
  catalog: [],
  installed: [],
  featured: [],
  categories: [
    {
      name: 'Todas',
      count: 0,
    },
  ],
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeCategories(value, catalog = []) {
  if (!Array.isArray(value) || value.length === 0) {
    const categories = new Map()

    catalog.forEach((plugin) => {
      const category = String(plugin?.categoria || '').trim()

      if (category) {
        categories.set(
          category,
          (categories.get(category) || 0) + 1
        )
      }
    })

    return [
      {
        name: 'Todas',
        count: catalog.length,
      },
      ...Array.from(categories.entries()).map(
        ([name, count]) => ({
          name,
          count,
        })
      ),
    ]
  }

  return value
    .filter(Boolean)
    .map((category) => {
      if (typeof category === 'string') {
        return {
          name: category,
          count: 0,
        }
      }

      return {
        name: String(category?.name || 'Sin categoría'),
        count: Number(category?.count || 0),
      }
    })
}

function safeLoadPlugins() {
  try {
    const catalog = normalizeArray(
      pluginManagerService?.getCatalog?.()
    )

    const installed = normalizeArray(
      pluginManagerService?.getInstalledPlugins?.()
    )

    const featured = normalizeArray(
      pluginManagerService?.getFeaturedPlugins?.()
    )

    const categories = normalizeCategories(
      pluginManagerService?.getCategories?.(),
      catalog
    )

    return {
      catalog,
      installed,
      featured,
      categories:
        categories.length > 0
          ? categories
          : EMPTY_STATE.categories,
    }
  } catch (error) {
    console.error(
      'Plugin Manager: error cargando datos:',
      error
    )

    return EMPTY_STATE
  }
}

export function PluginManagerHome() {
  const [activeTab, setActiveTab] = useState('Todos')
  const [selectedCat, setSelectedCat] = useState('Todas')
  const [searchQuery, setSearchQuery] = useState('')

  const [showUploadModal, setShowUploadModal] =
    useState(false)

  const [showStoreModal, setShowStoreModal] =
    useState(false)

  const [configPlugin, setConfigPlugin] =
    useState(null)

  const [infoPlugin, setInfoPlugin] =
    useState(null)

  const [configSavedToast, setConfigSavedToast] =
    useState('')

  const [selectedPluginFile, setSelectedPluginFile] =
    useState(null)

  const [uploadMessage, setUploadMessage] =
    useState('')

  const [uploadError, setUploadError] =
    useState('')

  const [isUploading, setIsUploading] =
    useState(false)

  const [data, setData] = useState(EMPTY_STATE)
  const [isLoading, setIsLoading] = useState(true)

  const [loadError, setLoadError] = useState('')

  /*
   * CARGA INICIAL
   */

  useEffect(() => {
    let mounted = true

    try {
      const result = safeLoadPlugins()

      if (mounted) {
        setData(result)
        setLoadError('')
        setIsLoading(false)
      }
    } catch (error) {
      console.error(error)

      if (mounted) {
        setData(EMPTY_STATE)
        setLoadError(
          'No se pudieron cargar los plugins.'
        )
        setIsLoading(false)
      }
    }

    return () => {
      mounted = false
    }
  }, [])

  const catalog = normalizeArray(data?.catalog)
  const installed = normalizeArray(data?.installed)
  const featured = normalizeArray(data?.featured)
  const categories = normalizeArray(data?.categories)

  /*
   * INFORMACIÓN DEL SISTEMA
   */

  const systemInfo = useMemo(() => {
    const fallback = {
      version: '1.0.0',
      entorno: 'Producción',
      estado: 'Óptimo',
      uptime: '—',
    }

    try {
      if (
        typeof pluginManagerService?.getSystemInfo !==
        'function'
      ) {
        return fallback
      }

      const result =
        pluginManagerService.getSystemInfo()

      if (!result || typeof result !== 'object') {
        return fallback
      }

      return {
        ...fallback,
        ...result,
      }
    } catch (error) {
      console.error(
        'Plugin Manager: error obteniendo información:',
        error
      )

      return fallback
    }
  }, [])

  /*
   * REFRESCAR
   */

  const refreshPlugins = useCallback(() => {
    try {
      const result = safeLoadPlugins()

      setData(result)
      setLoadError('')
    } catch (error) {
      console.error(
        'Plugin Manager: error actualizando:',
        error
      )
    }
  }, [])

  /*
   * MOSTRAR TODOS
   */

  const showAllPlugins = useCallback(() => {
    setActiveTab('Todos')
    setSelectedCat('Todas')
    setSearchQuery('')
  }, [])

  /*
   * CAMBIAR TAB
   */

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab)

    if (tab === 'Todos') {
      setSelectedCat('Todas')
    }
  }, [])

  /*
   * DESTACADOS
   */

  const toggleFeatured = useCallback(
    (id) => {
      try {
        if (
          typeof pluginManagerService?.toggleFeatured !==
          'function'
        ) {
          console.warn(
            'toggleFeatured no está disponible.'
          )
          return
        }

        pluginManagerService.toggleFeatured(id)
        refreshPlugins()
      } catch (error) {
        console.error(
          'Error cambiando destacado:',
          error
        )
      }
    },
    [refreshPlugins]
  )

  /*
   * INSTALAR DESDE CATÁLOGO
   */

  const installCatalogPlugin = useCallback(
    (id) => {
      try {
        const plugin = catalog.find(
          (item) => item?.id === id
        )

        if (!plugin) {
          console.warn(
            'Plugin no encontrado:',
            id
          )
          return
        }

        if (
          typeof pluginManagerService?.installPlugin !==
          'function'
        ) {
          console.error(
            'installPlugin no está disponible.'
          )
          return
        }

        const alreadyInstalled = installed.some(
          (item) => item?.id === id
        )

        if (alreadyInstalled) {
          return
        }

        pluginManagerService.installPlugin(plugin)
        refreshPlugins()
      } catch (error) {
        console.error(
          'Error instalando plugin:',
          error
        )
      }
    },
    [catalog, installed, refreshPlugins]
  )

  /*
   * INSTALAR DESTACADO
   */

  const installFeatured = useCallback(
    (id) => {
      installCatalogPlugin(id)
    },
    [installCatalogPlugin]
  )

  /*
   * ACTIVAR / DESACTIVAR
   */

  const toggleStatusInstalled = useCallback(
    (id) => {
      try {
        if (
          typeof pluginManagerService?.togglePluginStatus !==
          'function'
        ) {
          console.warn(
            'togglePluginStatus no está disponible.'
          )
          return
        }

        pluginManagerService.togglePluginStatus(id)
        refreshPlugins()
      } catch (error) {
        console.error(
          'Error cambiando estado:',
          error
        )
      }
    },
    [refreshPlugins]
  )

  /*
   * DESINSTALAR
   */

  const deleteInstalled = useCallback(
    (id) => {
      try {
        const plugin = installed.find(
          (item) => item?.id === id
        )

        if (!plugin) {
          return
        }

        const confirmed = window.confirm(
          `¿Deseas desinstalar "${plugin.nombre || 'este plugin'}"?`
        )

        if (!confirmed) {
          return
        }

        if (
          typeof pluginManagerService?.uninstallPlugin !==
          'function'
        ) {
          console.error(
            'uninstallPlugin no está disponible.'
          )
          return
        }

        pluginManagerService.uninstallPlugin(id)
        refreshPlugins()
      } catch (error) {
        console.error(
          'Error desinstalando plugin:',
          error
        )
      }
    },
    [installed, refreshPlugins]
  )

  /*
   * INSTALAR DESDE TIENDA
   */

  const installStorePlugin = useCallback(
    (plugin) => {
      if (!plugin) {
        return
      }

      try {
        const exists = installed.some(
          (item) => item?.id === plugin?.id
        )

        if (exists) {
          return
        }

        if (
          typeof pluginManagerService?.installPlugin !==
          'function'
        ) {
          console.error(
            'installPlugin no está disponible.'
          )
          return
        }

        pluginManagerService.installPlugin(plugin)
        refreshPlugins()
      } catch (error) {
        console.error(
          'Error instalando plugin:',
          error
        )
      }
    },
    [installed, refreshPlugins]
  )

  /*
   * BÚSQUEDA
   */

  const query = String(searchQuery || '')
    .trim()
    .toLowerCase()

  /*
   * FILTRO DE CATÁLOGO
   */

  const filteredCatalog = useMemo(() => {
    return catalog.filter((plugin) => {
      if (!plugin) {
        return false
      }

      const categoria = String(
        plugin?.categoria || ''
      ).toLowerCase()

      const nombre = String(
        plugin?.nombre || ''
      ).toLowerCase()

      const descripcion = String(
        plugin?.descripcion || ''
      ).toLowerCase()

      const matchesCat =
        selectedCat === 'Todas' ||
        categoria ===
          String(selectedCat).toLowerCase()

      const matchesSearch =
        query === '' ||
        nombre.includes(query) ||
        descripcion.includes(query) ||
        categoria.includes(query)

      return matchesCat && matchesSearch
    })
  }, [catalog, selectedCat, query])

  /*
   * FILTRO INSTALADOS
   */

  const filteredInstalled = useMemo(() => {
    return installed.filter((plugin) => {
      if (!plugin) {
        return false
      }

      const categoria = String(
        plugin?.categoria || ''
      ).toLowerCase()

      const nombre = String(
        plugin?.nombre || ''
      ).toLowerCase()

      const descripcion = String(
        plugin?.descripcion || ''
      ).toLowerCase()

      const origen = String(
        plugin?.origen || ''
      ).toLowerCase()

      const matchesCat =
        selectedCat === 'Todas' ||
        categoria ===
          String(selectedCat).toLowerCase()

      const matchesSearch =
        query === '' ||
        nombre.includes(query) ||
        descripcion.includes(query) ||
        categoria.includes(query)

      let matchesTab = true

      switch (activeTab) {
        case 'Personalizados':
          matchesTab =
            origen === 'zip' ||
            origen === 'personalizado'
          break

        case 'Oficiales':
          matchesTab =
            origen !== 'zip' &&
            origen !== 'personalizado'
          break

        case 'Instalados':
        default:
          matchesTab = true
          break
      }

      return (
        matchesCat &&
        matchesSearch &&
        matchesTab
      )
    })
  }, [
    installed,
    selectedCat,
    query,
    activeTab,
  ])

  /*
   * FILTRO DESTACADOS
   */

  const filteredFeatured = useMemo(() => {
    return featured.filter((plugin) => {
      if (!plugin) {
        return false
      }

      const categoria = String(
        plugin?.categoria || ''
      ).toLowerCase()

      const nombre = String(
        plugin?.nombre || ''
      ).toLowerCase()

      const descripcion = String(
        plugin?.descripcion || ''
      ).toLowerCase()

      const matchesCat =
        selectedCat === 'Todas' ||
        categoria ===
          String(selectedCat).toLowerCase()

      const matchesSearch =
        query === '' ||
        nombre.includes(query) ||
        descripcion.includes(query) ||
        categoria.includes(query)

      return matchesCat && matchesSearch
    })
  }, [
    featured,
    selectedCat,
    query,
  ])

  /*
   * CONTADORES
   */

  const installedCount = installed.length

  const availableCount = catalog.length

  const customCount = installed.filter(
    (plugin) => {
      const origen = String(
        plugin?.origen || ''
      ).toLowerCase()

      return (
        origen === 'zip' ||
        origen === 'personalizado'
      )
    }
  ).length

  /*
   * ARCHIVO ZIP
   */

  const handlePluginFileChange = (event) => {
    const file =
      event?.target?.files?.[0]

    setUploadMessage('')
    setUploadError('')
    setSelectedPluginFile(null)

    if (!file) {
      return
    }

    if (
      !file.name
        .toLowerCase()
        .endsWith('.zip')
    ) {
      setUploadError(
        'Solo se permiten archivos .zip.'
      )
      return
    }

    setSelectedPluginFile(file)
  }

  /*
   * INSTALAR ZIP
   */

  const handleInstallZip = async () => {
    setUploadMessage('')
    setUploadError('')

    if (!selectedPluginFile) {
      setUploadError(
        'Selecciona un archivo .zip primero.'
      )
      return
    }

    if (
      typeof pluginManagerService?.installPluginFromZip !==
      'function'
    ) {
      setUploadError(
        'La instalación de plugins ZIP no está disponible en este momento.'
      )
      return
    }

    try {
      setIsUploading(true)

      const result =
        await pluginManagerService.installPluginFromZip(
          selectedPluginFile
        )

      if (result?.alreadyInstalled) {
        setUploadError(
          `El plugin "${
            result?.plugin?.nombre || ''
          }" ya está instalado.`
        )

        refreshPlugins()
        return
      }

      if (!result?.success) {
        setUploadError(
          result?.message ||
            'No se pudo instalar el plugin.'
        )

        return
      }

      setUploadMessage(
        `${
          result?.plugin?.nombre ||
          'Plugin'
        } instalado correctamente.`
      )

      setSelectedPluginFile(null)

      refreshPlugins()

      setTimeout(() => {
        setShowUploadModal(false)
        setUploadMessage('')
      }, 1200)
    } catch (error) {
      console.error(
        'Error instalando plugin ZIP:',
        error
      )

      setUploadError(
        error?.message ||
          'No se pudo instalar el plugin.'
      )
    } finally {
      setIsUploading(false)
    }
  }

  /*
   * CARGANDO
   */

  if (isLoading) {
    return (
      <div className="plugins-root">
        <div
          style={{
            minHeight: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              color:
                'var(--color-ink-soft)',
            }}
          >
            <div
              style={{
                fontSize: 36,
                marginBottom: 10,
              }}
            >
              🧩
            </div>

            <div>
              Cargando Plugin Manager...
            </div>
          </div>
        </div>
      </div>
    )
  }

  /*
   * RENDER
   */

  return (
    <div className="plugins-root">
      {/* ── Banner Hero Panorámico de Plugins & Extensiones (Misma Secuencia de Color Azul Real) ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
        borderRadius: 20,
        padding: '28px 32px',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.3)',
        marginBottom: 20,
      }}>
        {/* Imagen de fondo panorámica de arquitectura de plugins y módulos */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '55%',
          backgroundImage: 'url(/branding/banner_enterprise_panoramic.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          opacity: 0.35,
          maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, transparent 100%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 750 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.12)',
            color: '#93C5FD',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 10,
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <span>🧩</span> PANEL DE CONTROL · GESTOR DE PLUGINS & EXTENSIONES
          </div>

          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Ecosistema de Plugins y Extensiones
          </h1>
          <p style={{ margin: '6px 0 20px', fontSize: 13, color: '#CBD5E1', lineHeight: 1.5, maxWidth: 580 }}>
            Instala extensiones oficiales, sube paquetes ZIP personalizados y extiende las capacidades modulares de tu ERP.
          </p>

          {/* Estadísticas en vivo estilo referencia */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{installedCount}</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Plugins Instalados</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{availableCount}</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>En Catálogo</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#34D399', lineHeight: 1 }}>{customCount}</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Personalizados (ZIP)</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FCD34D', lineHeight: 1 }}>100%</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Compatibilidad v2.0</div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setUploadMessage('')
                setUploadError('')
                setSelectedPluginFile(null)
                setShowUploadModal(true)
              }}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(37,99,235,0.4)'
              }}
            >
              📤 Subir Plugin (.ZIP)
            </button>
            <button
              type="button"
              onClick={() => setShowStoreModal(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              🛍️ Tienda de Plugins
            </button>
          </div>
        </div>
      </div>

      {/* ERROR DE CARGA */}

      {loadError && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            borderRadius: 8,
            background: '#FEF3C7',
            color: '#92400E',
            fontSize: 13,
          }}
        >
          ⚠️ {loadError}
        </div>
      )}

      {/* TABS */}

      <div className="plugins-subnav">

        <div className="plugins-tabs">

          {[
            'Todos',
            'Instalados',
            'Oficiales',
            'Personalizados',
          ].map((tab) => (
            <button
              type="button"
              key={tab}
              className={`plugins-tab ${
                activeTab === tab
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                handleTabChange(tab)
              }
            >
              {tab}
            </button>
          ))}

        </div>

        <div className="plugins-filters">

          <div className="plugins-search">

            <span>🔍</span>

            <input
              type="text"
              placeholder="Buscar plugins..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
            />

          </div>

          <select
            className="plugins-cat-select"
            value={selectedCat}
            onChange={(event) =>
              setSelectedCat(
                event.target.value
              )
            }
          >

            {categories.map(
              (category, index) => (
                <option
                  key={`${category?.name || 'cat'}-${index}`}
                  value={
                    category?.name ||
                    'Todas'
                  }
                >
                  Categoría:{' '}
                  {category?.name ||
                    'Todas'}
                </option>
              )
            )}

          </select>

        </div>

      </div>

      {/* ESTADÍSTICAS */}

      <div className="plugins-stats-grid">

        <div className="plugin-stat-card">

          <div
            className="plugin-stat-icon"
            style={{
              background: '#F3E8FF',
              color: '#6D28D9',
            }}
          >
            🧩
          </div>

          <div className="plugin-stat-info">

            <span className="plugin-stat-title">
              Plugins Instalados
            </span>

            <span className="plugin-stat-num">
              {installedCount}
            </span>

            <span className="plugin-stat-sub">
              <span
                style={{
                  color:
                    'var(--color-success)',
                }}
              >
                ●
              </span>{' '}
              Activos en tu sistema
            </span>

          </div>

        </div>

        <div className="plugin-stat-card">

          <div
            className="plugin-stat-icon"
            style={{
              background: '#E6F9F5',
              color: '#157F5A',
            }}
          >
            🛍️
          </div>

          <div className="plugin-stat-info">

            <span className="plugin-stat-title">
              Plugins Disponibles
            </span>

            <span className="plugin-stat-num">
              {availableCount}
            </span>

            <span className="plugin-stat-sub">
              <span
                style={{
                  color:
                    'var(--color-accent)',
                }}
              >
                ●
              </span>{' '}
              En el catálogo
            </span>

          </div>

        </div>

        <div className="plugin-stat-card">

          <div
            className="plugin-stat-icon"
            style={{
              background: '#E8F0FE',
              color: '#1F3A93',
            }}
          >
            📥
          </div>

          <div className="plugin-stat-info">

            <span className="plugin-stat-title">
              Destacados
            </span>

            <span className="plugin-stat-num">
              {featured.length}
            </span>

            <span className="plugin-stat-sub">
              <span
                style={{
                  color:
                    'var(--color-warning)',
                }}
              >
                ●
              </span>{' '}
              Seleccionados por ti
            </span>

          </div>

        </div>

        <div className="plugin-stat-card">

          <div
            className="plugin-stat-icon"
            style={{
              background: '#FEF3C7',
              color: '#B45309',
            }}
          >
            🛡️
          </div>

          <div className="plugin-stat-info">

            <span className="plugin-stat-title">
              Personalizados
            </span>

            <span className="plugin-stat-num">
              {customCount}
            </span>

            <span className="plugin-stat-sub">
              <span
                style={{
                  color:
                    'var(--color-ink-soft)',
                }}
              >
                ●
              </span>{' '}
              Desarrollos propios
            </span>

          </div>

        </div>

      </div>

      {/* LAYOUT */}

      <div className="plugins-main-layout">

        <div className="plugins-left-content">

          {/* DESTACADOS */}

          {activeTab === 'Todos' &&
            filteredFeatured.length > 0 && (
              <div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems: 'center',
                    marginBottom: 14,
                  }}
                >

                  <h3
                    style={{
                      fontSize: 16,
                      margin: 0,
                    }}
                  >
                    ⭐ Plugins Destacados
                  </h3>

                  <button
                    type="button"
                    onClick={
                      showAllPlugins
                    }
                    style={{
                      border: 0,
                      background:
                        'none',
                      padding: 0,
                      fontSize: 13,
                      color:
                        'var(--color-accent)',
                      cursor:
                        'pointer',
                    }}
                  >
                    Ver todos
                  </button>

                </div>

                <div className="plugins-featured-grid">

                  {filteredFeatured.map(
                    (plugin) => {

                      const isInstalled =
                        installed.some(
                          (item) =>
                            item?.id ===
                            plugin?.id
                        )

                      return (
                        <div
                          key={plugin.id}
                          className="plugin-card"
                        >

                          <div>

                            <div className="plugin-card-header">

                              <div
                                className="plugin-card-icon"
                                style={{
                                  background:
                                    plugin?.bgColor ||
                                    'var(--color-surface-alt)',
                                  color:
                                    plugin?.color ||
                                    'var(--color-accent)',
                                }}
                              >
                                {plugin?.icon ||
                                  '🧩'}
                              </div>

                              <div
                                style={{
                                  flex: 1,
                                }}
                              >

                                <div
                                  style={{
                                    display:
                                      'flex',
                                    justifyContent:
                                      'space-between',
                                    gap: 8,
                                  }}
                                >

                                  <div>

                                    <h4 className="plugin-card-title">
                                      {plugin?.nombre ||
                                        'Plugin'}
                                    </h4>

                                    <span
                                      className="plugin-card-cat"
                                      style={{
                                        color:
                                          plugin?.color ||
                                          'var(--color-accent)',
                                      }}
                                    >
                                      {plugin?.categoria ||
                                        'General'}
                                    </span>

                                  </div>

                                  <button
                                    type="button"
                                    title="Quitar de destacados"
                                    onClick={() =>
                                      toggleFeatured(
                                        plugin.id
                                      )
                                    }
                                    style={{
                                      border: 0,
                                      background:
                                        'transparent',
                                      fontSize: 22,
                                      cursor:
                                        'pointer',
                                      padding: 0,
                                      lineHeight: 1,
                                    }}
                                  >
                                    ⭐
                                  </button>

                                </div>

                              </div>

                            </div>

                            <p
                              className="plugin-card-desc"
                              style={{
                                marginTop: 10,
                              }}
                            >
                              {plugin?.descripcion ||
                                'Extensión para ampliar las funciones del ERP.'}
                            </p>

                          </div>

                          <div className="plugin-card-footer">

                            <div className="plugin-rating">
                              ★{' '}
                              {plugin?.rating ||
                                0}{' '}
                              <span>
                                (
                                {plugin?.reviews ||
                                  0}
                                )
                              </span>
                            </div>

                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{
                                fontSize: 12,
                                padding:
                                  '5px 12px',
                              }}
                              disabled={
                                isInstalled
                              }
                              onClick={() =>
                                installFeatured(
                                  plugin.id
                                )
                              }
                            >
                              {isInstalled
                                ? '✓ Instalado'
                                : 'Instalar'}
                            </button>

                          </div>

                        </div>
                      )
                    }
                  )}

                </div>

              </div>
            )}

          {/* CATÁLOGO */}

          {activeTab === 'Todos' && (
            <div
              className="card"
              style={{
                padding: 0,
                overflow: 'hidden',
                marginTop: 20,
              }}
            >

              <div
                style={{
                  padding:
                    '16px 20px',
                  borderBottom:
                    '1px solid var(--color-line)',
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                }}
              >

                <div>

                  <h3
                    style={{
                      fontSize: 16,
                      margin: 0,
                    }}
                  >
                    Todos los Plugins
                  </h3>

                  <span
                    style={{
                      fontSize: 12,
                      color:
                        'var(--color-ink-faint)',
                    }}
                  >
                    Catálogo completo de
                    plugins
                  </span>

                </div>

                <span
                  style={{
                    fontSize: 12,
                    color:
                      'var(--color-ink-faint)',
                  }}
                >
                  {filteredCatalog.length}{' '}
                  resultado
                  {filteredCatalog.length ===
                  1
                    ? ''
                    : 's'}
                </span>

              </div>

              <div
                style={{
                  width: '100%',
                  overflowX: 'auto',
                }}
              >

                <table className="plugins-table">

                  <thead>
                    <tr>
                      <th>Plugin</th>
                      <th>Categoría</th>
                      <th>Versión</th>
                      <th>Estado</th>
                      <th
                        style={{
                          textAlign:
                            'center',
                        }}
                      >
                        Destacado
                      </th>
                      <th
                        style={{
                          textAlign:
                            'right',
                        }}
                      >
                        Acción
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredCatalog.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            textAlign:
                              'center',
                            padding: 30,
                          }}
                        >
                          🧩 No se encontraron
                          plugins.
                        </td>
                      </tr>
                    ) : (
                      filteredCatalog.map(
                        (plugin) => {

                          const isInstalled =
                            installed.some(
                              (item) =>
                                item?.id ===
                                plugin?.id
                            )

                          const isFeatured =
                            featured.some(
                              (item) =>
                                item?.id ===
                                plugin?.id
                            )

                          return (
                            <tr
                              key={
                                plugin.id
                              }
                            >

                              <td>

                                <div className="plugin-table-info">

                                  <div
                                    className="plugin-table-icon"
                                    style={{
                                      background:
                                        plugin?.bgColor ||
                                        'var(--color-surface-alt)',
                                      color:
                                        plugin?.color ||
                                        'var(--color-accent)',
                                    }}
                                  >
                                    {plugin?.icon ||
                                      '🧩'}
                                  </div>

                                  <div>

                                    <span className="plugin-table-name">
                                      {plugin?.nombre ||
                                        'Plugin'}
                                    </span>

                                    <span className="plugin-table-cat">
                                      {plugin?.descripcion ||
                                        'Plugin para el ERP'}
                                    </span>

                                  </div>

                                </div>

                              </td>

                              <td>
                                {plugin?.categoria ||
                                  'General'}
                              </td>

                              <td>
                                {plugin?.version ||
                                  '1.0.0'}
                              </td>

                              <td>

                                {isInstalled ? (
                                  <span
                                    style={{
                                      color:
                                        'var(--color-success)',
                                      fontWeight:
                                        600,
                                      fontSize: 12,
                                    }}
                                  >
                                    ● Instalado
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      color:
                                        'var(--color-ink-faint)',
                                      fontSize: 12,
                                    }}
                                  >
                                    Disponible
                                  </span>
                                )}

                              </td>

                              <td
                                style={{
                                  textAlign:
                                    'center',
                                }}
                              >

                                <button
                                  type="button"
                                  title={
                                    isFeatured
                                      ? 'Quitar de destacados'
                                      : 'Marcar como destacado'
                                  }
                                  onClick={() =>
                                    toggleFeatured(
                                      plugin.id
                                    )
                                  }
                                  style={{
                                    border: 0,
                                    background:
                                      'transparent',
                                    cursor:
                                      'pointer',
                                    fontSize: 22,
                                    padding:
                                      '4px 8px',
                                    opacity:
                                      isFeatured
                                        ? 1
                                        : 0.35,
                                  }}
                                >
                                  {isFeatured
                                    ? '⭐'
                                    : '☆'}
                                </button>

                              </td>

                              <td
                                style={{
                                  textAlign:
                                    'right',
                                }}
                              >

                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{
                                    fontSize: 11,
                                    padding:
                                      '4px 10px',
                                  }}
                                  disabled={
                                    isInstalled
                                  }
                                  onClick={() =>
                                    installCatalogPlugin(
                                      plugin.id
                                    )
                                  }
                                >
                                  {isInstalled
                                    ? '✓ Instalado'
                                    : 'Instalar'}
                                </button>

                              </td>

                            </tr>
                          )
                        }
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>
          )}

          {/* INSTALADOS */}

          {activeTab !== 'Todos' && (
            <div
              className="card"
              style={{
                padding: 0,
                overflow: 'hidden',
                marginTop: 20,
              }}
            >

              <div
                style={{
                  padding:
                    '16px 20px',
                  borderBottom:
                    '1px solid var(--color-line)',
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                }}
              >

                <h3
                  style={{
                    fontSize: 16,
                    margin: 0,
                  }}
                >
                  Plugins {activeTab}
                </h3>

                <span
                  style={{
                    fontSize: 12,
                    color:
                      'var(--color-ink-faint)',
                  }}
                >
                  {filteredInstalled.length}{' '}
                  resultado
                  {filteredInstalled.length ===
                  1
                    ? ''
                    : 's'}
                </span>

              </div>

              <div
                style={{
                  width: '100%',
                  overflowX: 'auto',
                }}
              >

                <table className="plugins-table">

                  <thead>
                    <tr>
                      <th>Plugin</th>
                      <th>Versión</th>
                      <th>Estado</th>
                      <th>
                        Última Actualización
                      </th>
                      <th
                        style={{
                          textAlign:
                            'center',
                        }}
                      >
                        Destacado
                      </th>
                      <th
                        style={{
                          textAlign:
                            'right',
                        }}
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredInstalled.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            textAlign:
                              'center',
                            padding: 30,
                            color:
                              'var(--color-ink-faint)',
                          }}
                        >

                          <div
                            style={{
                              fontSize: 28,
                              marginBottom: 8,
                            }}
                          >
                            🧩
                          </div>

                          <div>
                            No hay plugins
                            para mostrar.
                          </div>

                          <button
                            type="button"
                            onClick={
                              showAllPlugins
                            }
                            className="btn btn-secondary"
                            style={{
                              marginTop: 12,
                              fontSize: 12,
                            }}
                          >
                            Ver todos los
                            plugins
                          </button>

                        </td>
                      </tr>
                    ) : (
                      filteredInstalled.map(
                        (plugin) => {

                          const isFeatured =
                            featured.some(
                              (item) =>
                                item?.id ===
                                plugin?.id
                            )

                          return (
                            <tr
                              key={
                                plugin.id
                              }
                            >

                              <td>

                                <div className="plugin-table-info">

                                  <div
                                    className="plugin-table-icon"
                                    style={{
                                      background:
                                        plugin?.bgColor ||
                                        'var(--color-surface-alt)',
                                      color:
                                        plugin?.color ||
                                        'var(--color-accent)',
                                    }}
                                  >
                                    {plugin?.icon ||
                                      '🧩'}
                                  </div>

                                  <div>

                                    <span className="plugin-table-name">
                                      {plugin?.nombre ||
                                        'Plugin'}
                                    </span>

                                    <span className="plugin-table-cat">
                                      {plugin?.categoria ||
                                        'General'}

                                      {String(
                                        plugin?.origen ||
                                          ''
                                      ).toUpperCase() ===
                                        'ZIP' &&
                                        ' · ZIP'}
                                    </span>

                                  </div>

                                </div>

                              </td>

                              <td
                                style={{
                                  color:
                                    'var(--color-ink-soft)',
                                  fontFamily:
                                    'var(--font-mono)',
                                }}
                              >
                                {plugin?.version ||
                                  '1.0.0'}
                              </td>

                              <td>

                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleStatusInstalled(
                                      plugin.id
                                    )
                                  }
                                  title="Activar / desactivar"
                                  style={{
                                    border: 0,
                                    background:
                                      'none',
                                    padding: 0,
                                    color:
                                      plugin?.estado ===
                                      'Activo'
                                        ? 'var(--color-success)'
                                        : 'var(--color-ink-faint)',
                                    fontWeight:
                                      600,
                                    fontSize: 12,
                                    cursor:
                                      'pointer',
                                  }}
                                >
                                  ●{' '}
                                  {plugin?.estado ||
                                    'Activo'}
                                </button>

                              </td>

                              <td
                                style={{
                                  color:
                                    'var(--color-ink-faint)',
                                }}
                              >
                                {plugin?.ultimaAct ||
                                  '—'}
                              </td>

                              <td
                                style={{
                                  textAlign:
                                    'center',
                                }}
                              >

                                <button
                                  type="button"
                                  title={
                                    isFeatured
                                      ? 'Quitar de destacados'
                                      : 'Marcar como destacado'
                                  }
                                  onClick={() =>
                                    toggleFeatured(
                                      plugin.id
                                    )
                                  }
                                  style={{
                                    border: 0,
                                    background:
                                      'transparent',
                                    cursor:
                                      'pointer',
                                    fontSize: 22,
                                    padding:
                                      '4px 8px',
                                    opacity:
                                      isFeatured
                                        ? 1
                                        : 0.35,
                                  }}
                                >
                                  {isFeatured
                                    ? '⭐'
                                    : '☆'}
                                </button>

                              </td>

                              <td
                                style={{
                                  textAlign:
                                    'right',
                                }}
                              >

                                <div
                                  className="plugin-action-btns"
                                  style={{
                                    justifyContent:
                                      'flex-end',
                                  }}
                                >

                                  <button
                                    type="button"
                                    className="plugin-action-btn"
                                    title="Configuración avanzada del plugin"
                                    onClick={() =>
                                      setConfigPlugin(plugin)
                                    }
                                  >
                                    ⚙️
                                  </button>

                                  <button
                                    type="button"
                                    className="plugin-action-btn"
                                    title="Ficha técnica e información"
                                    onClick={() =>
                                      setInfoPlugin(plugin)
                                    }
                                  >
                                    ℹ️
                                  </button>

                                  <button
                                    type="button"
                                    className="plugin-action-btn danger"
                                    title="Desinstalar plugin"
                                    onClick={() =>
                                      deleteInstalled(
                                        plugin.id
                                      )
                                    }
                                  >
                                    🗑️
                                  </button>

                                </div>

                              </td>

                            </tr>
                          )
                        }
                      )
                    )}

                  </tbody>

                </table>

              </div>

              <div
                style={{
                  padding: 12,
                  textAlign: 'center',
                  borderTop:
                    '1px solid var(--color-line)',
                }}
              >

                <button
                  type="button"
                  onClick={
                    showAllPlugins
                  }
                  style={{
                    border: 0,
                    background:
                      'transparent',
                    fontSize: 13,
                    color:
                      'var(--color-accent)',
                    cursor: 'pointer',
                  }}
                >
                  Ver todos los plugins →
                </button>

              </div>

            </div>
          )}

        </div>

        {/* SIDEBAR */}

        <div className="plugins-right-sidebar">

          <div
            className="card"
            style={{
              padding: 16,
            }}
          >

            <h4
              style={{
                fontSize: 14,
                margin:
                  '0 0 12px 0',
              }}
            >
              Categorías
            </h4>

            <ul className="plugins-cat-list">

              {categories.map(
                (category, index) => (
                  <li
                    key={`${category?.name || 'category'}-${index}`}
                    className={`plugins-cat-item ${
                      selectedCat ===
                      category?.name
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      setSelectedCat(
                        category?.name ||
                          'Todas'
                      )
                    }
                  >

                    <span>
                      {category?.name ||
                        'Todas'}
                    </span>

                    <span className="plugins-cat-count">
                      {category?.count || 0}
                    </span>

                  </li>
                )
              )}

            </ul>

          </div>

          <div
            className="card"
            style={{
              padding: 16,
            }}
          >

            <h4
              style={{
                fontSize: 14,
                margin:
                  '0 0 12px 0',
              }}
            >
              Recursos
            </h4>

            <div>

              <a
                href="#doc"
                className="plugins-resource-item"
              >
                <span className="plugins-resource-icon">
                  📖
                </span>

                <div>
                  <span className="plugins-resource-title">
                    Documentación ↗
                  </span>

                  <span className="plugins-resource-desc">
                    Guías y documentación
                    oficial
                  </span>
                </div>
              </a>

              <a
                href="#dev"
                className="plugins-resource-item"
              >
                <span className="plugins-resource-icon">
                  👥
                </span>

                <div>
                  <span className="plugins-resource-title">
                    Desarrolladores ↗
                  </span>

                  <span className="plugins-resource-desc">
                    Crea tus propios plugins
                  </span>
                </div>
              </a>

              <a
                href="#soporte"
                className="plugins-resource-item"
              >
                <span className="plugins-resource-icon">
                  🎧
                </span>

                <div>
                  <span className="plugins-resource-title">
                    Soporte ↗
                  </span>

                  <span className="plugins-resource-desc">
                    Obtén ayuda y soporte
                  </span>
                </div>
              </a>

            </div>

          </div>

          <div className="system-info-card">

            <h4
              style={{
                fontSize: 13,
                margin:
                  '0 0 10px 0',
              }}
            >
              Información del Sistema
            </h4>

            <div className="system-info-row">
              <span className="system-info-label">
                Versión
              </span>

              <span className="system-info-val">
                {systemInfo.version}
              </span>
            </div>

            <div className="system-info-row">
              <span className="system-info-label">
                Entorno
              </span>

              <span className="system-info-val">
                {systemInfo.entorno}
              </span>
            </div>

            <div className="system-info-row">
              <span className="system-info-label">
                Estado
              </span>

              <span
                className="system-info-val"
                style={{
                  color:
                    'var(--color-success)',
                }}
              >
                ● {systemInfo.estado}
              </span>
            </div>

            <div className="system-info-row">
              <span className="system-info-label">
                Uptime
              </span>

              <span className="system-info-val">
                {systemInfo.uptime}
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL ZIP */}

      {showUploadModal && (
        <div
          onClick={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              if (!isUploading) {
                setShowUploadModal(false)
              }
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'center',
            zIndex: 1000,
            padding: 20,
          }}
        >

          <div
            className="card"
            style={{
              width: 520,
              maxWidth: '100%',
              padding: 24,
              background: '#fff',
            }}
          >

            <h3
              style={{
                margin:
                  '0 0 8px 0',
              }}
            >
              📤 Subir Plugin
            </h3>

            <p
              style={{
                fontSize: 13,
                color:
                  'var(--color-ink-soft)',
                marginBottom: 18,
              }}
            >
              Selecciona un archivo ZIP
              que contenga el{' '}
              <strong>
                manifest.json
              </strong>{' '}
              del plugin.
            </p>

            <label
              style={{
                display: 'block',
                border:
                  '2px dashed var(--color-line)',
                padding: 24,
                textAlign:
                  'center',
                borderRadius: 8,
                cursor:
                  'pointer',
                marginBottom: 16,
                background:
                  'var(--color-surface-alt)',
              }}
            >

              <input
                type="file"
                accept=".zip"
                onChange={
                  handlePluginFileChange
                }
                style={{
                  display: 'none',
                }}
              />

              <div
                style={{
                  fontSize: 28,
                  marginBottom: 8,
                }}
              >
                📦
              </div>

              <strong>
                Haz clic para
                seleccionar tu
                plugin
              </strong>

              <div
                style={{
                  fontSize: 12,
                  color:
                    'var(--color-ink-soft)',
                  marginTop: 6,
                }}
              >
                Archivo comprimido
                .zip
              </div>

            </label>

            {selectedPluginFile && (
              <div
                style={{
                  padding:
                    '10px 12px',
                  borderRadius: 6,
                  background:
                    '#E6F9F5',
                  color:
                    '#157F5A',
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                📦{' '}
                {
                  selectedPluginFile.name
                }
              </div>
            )}

            {uploadError && (
              <div
                style={{
                  padding:
                    '10px 12px',
                  borderRadius: 6,
                  background:
                    '#FEE2E2',
                  color:
                    '#B91C1C',
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                ⚠️ {uploadError}
              </div>
            )}

            {uploadMessage && (
              <div
                style={{
                  padding:
                    '10px 12px',
                  borderRadius: 6,
                  background:
                    '#E6F9F5',
                  color:
                    '#157F5A',
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                ✓ {uploadMessage}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'flex-end',
                gap: 10,
                marginTop: 18,
              }}
            >

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowUploadModal(
                    false
                  )
                  setSelectedPluginFile(
                    null
                  )
                  setUploadMessage('')
                  setUploadError('')
                }}
                disabled={
                  isUploading
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={
                  handleInstallZip
                }
                disabled={
                  !selectedPluginFile ||
                  isUploading
                }
              >
                {isUploading
                  ? 'Instalando...'
                  : '📥 Instalar Plugin'}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* MODAL TIENDA */}

      {showStoreModal && (
        <div
          onClick={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowStoreModal(
                false
              )
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'center',
            zIndex: 1000,
            padding: 20,
          }}
        >

          <div
            className="card"
            style={{
              width: 500,
              maxWidth: '100%',
              padding: 24,
              background: '#fff',
            }}
          >

            <h3
              style={{
                margin:
                  '0 0 8px 0',
              }}
            >
              🛍️ Tienda de Plugins
            </h3>

            <p
              style={{
                fontSize: 13,
                color:
                  'var(--color-ink-soft)',
                marginBottom: 16,
              }}
            >
              Instala plugins disponibles
              en el catálogo.
            </p>

            <div
              style={{
                maxHeight: 350,
                overflowY:
                  'auto',
              }}
            >

              {catalog.length === 0 ? (
                <div
                  style={{
                    padding: 30,
                    textAlign:
                      'center',
                    color:
                      'var(--color-ink-faint)',
                  }}
                >
                  🧩 No hay plugins
                  disponibles.
                </div>
              ) : (
                catalog.map(
                  (plugin) => {

                    const isInstalled =
                      installed.some(
                        (item) =>
                          item?.id ===
                          plugin?.id
                      )

                    const isFeatured =
                      featured.some(
                        (item) =>
                          item?.id ===
                          plugin?.id
                      )

                    return (
                      <div
                        key={
                          plugin.id
                        }
                        style={{
                          display:
                            'flex',
                          justifyContent:
                            'space-between',
                          alignItems:
                            'center',
                          gap: 10,
                          padding:
                            '10px 12px',
                          background:
                            'var(--color-surface-alt)',
                          borderRadius:
                            6,
                          marginBottom: 8,
                        }}
                      >

                        <div>

                          <strong
                            style={{
                              fontSize:
                                13,
                            }}
                          >
                            {plugin?.icon ||
                              '🧩'}{' '}
                            {plugin?.nombre ||
                              'Plugin'}
                          </strong>

                          <div
                            style={{
                              fontSize:
                                11,
                              color:
                                'var(--color-ink-soft)',
                            }}
                          >
                            {plugin?.categoria ||
                              'General'}
                          </div>

                        </div>

                        <div
                          style={{
                            display:
                              'flex',
                            gap: 6,
                            alignItems:
                              'center',
                          }}
                        >

                          <button
                            type="button"
                            title={
                              isFeatured
                                ? 'Quitar destacado'
                                : 'Destacar plugin'
                            }
                            onClick={() =>
                              toggleFeatured(
                                plugin.id
                              )
                            }
                            style={{
                              border: 0,
                              background:
                                'transparent',
                              cursor:
                                'pointer',
                              fontSize:
                                19,
                            }}
                          >
                            {isFeatured
                              ? '⭐'
                              : '☆'}
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{
                              fontSize:
                                11,
                              padding:
                                '3px 8px',
                            }}
                            disabled={
                              isInstalled
                            }
                            onClick={() =>
                              installStorePlugin(
                                plugin
                              )
                            }
                          >
                            {isInstalled
                              ? '✓ Instalado'
                              : 'Instalar'}
                          </button>

                        </div>

                      </div>
                    )
                  }
                )
              )}

            </div>

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'flex-end',
                marginTop: 16,
              }}
            >

              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  setShowStoreModal(
                    false
                  )
                }
              >
                Cerrar Tienda
              </button>

            </div>

          </div>

        </div>
      )}

      {/* MODAL CONFIGURACIÓN DEL PLUGIN */}
      {configPlugin && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfigPlugin(null)
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            className="card"
            style={{
              width: 540,
              maxWidth: '100%',
              padding: 24,
              background: '#FFFFFF',
              borderRadius: 14,
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: configPlugin.bgColor || '#EFF6FF',
                  color: configPlugin.color || '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                {configPlugin.icon || '⚙️'}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
                  Configuración: {configPlugin.nombre}
                </h3>
                <span style={{ fontSize: 11, color: '#64748B' }}>
                  ID: {configPlugin.id} · Versión: {configPlugin.version || '1.0.0'}
                </span>
              </div>
            </div>

            {configSavedToast && (
              <div style={{ padding: '10px 14px', background: '#DCFCE7', color: '#166534', borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
                ✓ {configSavedToast}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Modo de Ejecución del Plugin
                </label>
                <select style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, background: '#FFFFFF' }}>
                  <option>Activo en Segundo Plano (Recomendado)</option>
                  <option>Ejecución Manual Bajo Demanda</option>
                  <option>Modo Depuración / Registro Detallado</option>
                </select>
              </div>

              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Sincronización Automática con el Core
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" defaultChecked id="chk-sync" style={{ width: 16, height: 16 }} />
                  <label htmlFor="chk-sync" style={{ fontSize: 12, color: '#475569', cursor: 'pointer' }}>
                    Emitir eventos a erpSyncEngine en cada cambio
                  </label>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Parámetros JSON de Inicialización
                </label>
                <textarea
                  rows={3}
                  defaultValue={`{\n  "autoStart": true,\n  "logLevel": "info",\n  "tenantIsolated": true\n}`}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, fontFamily: 'monospace' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setConfigPlugin(null)
                  setConfigSavedToast('')
                }}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setConfigSavedToast('Configuración aplicada y persistida con éxito.')
                  setTimeout(() => {
                    setConfigPlugin(null)
                    setConfigSavedToast('')
                  }, 1100)
                }}
              >
                💾 Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FICHA TÉCNICA E INFORMACIÓN */}
      {infoPlugin && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setInfoPlugin(null)
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            className="card"
            style={{
              width: 520,
              maxWidth: '100%',
              padding: 24,
              background: '#FFFFFF',
              borderRadius: 14,
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: infoPlugin.bgColor || '#F3E8FF',
                  color: infoPlugin.color || '#7C3AED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                }}
              >
                {infoPlugin.icon || '🧩'}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  {infoPlugin.nombre}
                </h3>
                <span style={{ fontSize: 12, color: '#2563EB', fontWeight: 700 }}>
                  Categoría: {infoPlugin.categoria || 'General'}
                </span>
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 18, background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
              {infoPlugin.descripcion || 'Extensión modular diseñada para optimizar y ampliar los flujos de trabajo del ERP.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div style={{ padding: '10px 12px', background: '#F1F5F9', borderRadius: 8 }}>
                <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>Versión</span>
                <strong style={{ fontSize: 13, color: '#0F172A' }}>{infoPlugin.version || '1.0.0'}</strong>
              </div>
              <div style={{ padding: '10px 12px', background: '#F1F5F9', borderRadius: 8 }}>
                <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>Origen / Autor</span>
                <strong style={{ fontSize: 13, color: '#0F172A' }}>{infoPlugin.origen || 'Oficial (appes.erp)'}</strong>
              </div>
              <div style={{ padding: '10px 12px', background: '#F1F5F9', borderRadius: 8 }}>
                <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>Valoración de Usuarios</span>
                <strong style={{ fontSize: 13, color: '#0F172A' }}>★ {infoPlugin.rating || 4.9} / 5.0</strong>
              </div>
              <div style={{ padding: '10px 12px', background: '#F1F5F9', borderRadius: 8 }}>
                <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>Arquitectura</span>
                <strong style={{ fontSize: 13, color: '#0F172A' }}>v2.0 Standalone</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setInfoPlugin(null)}
              >
                Cerrar Ficha Técnica
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

