/*
  PluginManagerHome — appes.erp
  Sección principal del Plugin Manager & Marketplace.
  Mapea exactamente la interfaz del diseño de Plugins:
  KPIs, pestañas, plugins destacados, tabla de plugins instalados,
  categorías de la barra lateral, recursos y estado del sistema.
*/
import { useState } from 'react'
import { pluginManagerService } from '../services/pluginManager.service'
import './PluginManagerHome.css'

export function PluginManagerHome() {
  const [activeTab, setActiveTab] = useState('Todos')
  const [selectedCat, setSelectedCat] = useState('Todas')
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showStoreModal, setShowStoreModal] = useState(false)

  // Datos desde el servicio
  const [featured, setFeatured] = useState(() => pluginManagerService.getFeaturedPlugins())
  const [installed, setInstalled] = useState(() => pluginManagerService.getInstalledPlugins())
  const categories = pluginManagerService.getCategories()
  const systemInfo = pluginManagerService.getSystemInfo()

  // Alternar instalación de plugin destacado
  const toggleInstallFeatured = (id) => {
    setFeatured((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextInstalado = !item.instalado
          if (nextInstalado) {
            // Agregar a instalados
            setInstalled((inst) => [
              ...inst,
              {
                id: item.id,
                nombre: item.nombre,
                categoria: item.categoria,
                color: item.color,
                icon: item.icon,
                version: '1.0.0',
                estado: 'Activo',
                ultimaAct: 'Hoy',
              },
            ])
          } else {
            // Remover de instalados
            setInstalled((inst) => inst.filter((x) => x.id !== id))
          }
          return { ...item, instalado: nextInstalado }
        }
        return item
      })
    )
  }

  // Alternar estado de plugin instalado (Activo / Inactivo)
  const toggleStatusInstalled = (id) => {
    setInstalled((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, estado: item.estado === 'Activo' ? 'Inactivo' : 'Activo' } : item
      )
    )
  }

  // Eliminar plugin instalado
  const deleteInstalled = (id) => {
    setInstalled((prev) => prev.filter((item) => item.id !== id))
  }

  // Filtrado de plugins destacados
  const filteredFeatured = featured.filter((item) => {
    const matchesCat = selectedCat === 'Todas' || item.categoria.toLowerCase() === selectedCat.toLowerCase()
    const matchesSearch = item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || item.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  // Filtrado de plugins instalados
  const filteredInstalled = installed.filter((item) => {
    const matchesCat = selectedCat === 'Todas' || item.categoria.toLowerCase() === selectedCat.toLowerCase()
    const matchesSearch = item.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  return (
    <div className="plugins-root">
      {/* ── Encabezado ── */}
      <div className="plugins-header">
        <div>
          <h2 className="plugins-title">Plugins</h2>
          <p className="plugins-subtitle">Extiende y personaliza tu ERP</p>
        </div>
        <div className="plugins-header-actions">
          <button className="btn btn-secondary" onClick={() => setShowUploadModal(true)}>
            📤 Subir Plugin
          </button>
          <button className="btn btn-primary" onClick={() => setShowStoreModal(true)}>
            🛍️ Tienda de Plugins
          </button>
        </div>
      </div>

      {/* ── Barra de Pestañas y Filtros ── */}
      <div className="plugins-subnav">
        <div className="plugins-tabs">
          {['Todos', 'Instalados', 'Oficiales', 'Personalizados'].map((tab) => (
            <button
              key={tab}
              className={`plugins-tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
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
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="plugins-cat-select"
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                Categoría: {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Tarjetas KPI de Estadísticas (4 Stat Cards) ── */}
      <div className="plugins-stats-grid">
        <div className="plugin-stat-card">
          <div className="plugin-stat-icon" style={{ background: '#F3E8FF', color: '#6D28D9' }}>
            🧩
          </div>
          <div className="plugin-stat-info">
            <span className="plugin-stat-title">Plugins Instalados</span>
            <span className="plugin-stat-num">{installed.length}</span>
            <span className="plugin-stat-sub">
              <span style={{ color: 'var(--color-success)' }}>●</span> Activos en tu sistema
            </span>
          </div>
        </div>

        <div className="plugin-stat-card">
          <div className="plugin-stat-icon" style={{ background: '#E6F9F5', color: '#157F5A' }}>
            🛍️
          </div>
          <div className="plugin-stat-info">
            <span className="plugin-stat-title">Plugins Disponibles</span>
            <span className="plugin-stat-num">48</span>
            <span className="plugin-stat-sub">
              <span style={{ color: 'var(--color-accent)' }}>●</span> En la tienda oficial
            </span>
          </div>
        </div>

        <div className="plugin-stat-card">
          <div className="plugin-stat-icon" style={{ background: '#E8F0FE', color: '#1F3A93' }}>
            📥
          </div>
          <div className="plugin-stat-info">
            <span className="plugin-stat-title">Actualizaciones</span>
            <span className="plugin-stat-num">3</span>
            <span className="plugin-stat-sub">
              <span style={{ color: 'var(--color-warning)' }}>●</span> Actualizaciones disponibles
            </span>
          </div>
        </div>

        <div className="plugin-stat-card">
          <div className="plugin-stat-icon" style={{ background: '#FEF3C7', color: '#B45309' }}>
            🛡️
          </div>
          <div className="plugin-stat-info">
            <span className="plugin-stat-title">Personalizados</span>
            <span className="plugin-stat-num">5</span>
            <span className="plugin-stat-sub">
              <span style={{ color: 'var(--color-ink-soft)' }}>●</span> Desarrollos propios
            </span>
          </div>
        </div>
      </div>

      {/* ── Disposición Principal (Contenido Izquierdo + Barra Lateral Derecha) ── */}
      <div className="plugins-main-layout">
        <div className="plugins-left-content">
          {/* Plugins Destacados */}
          {activeTab !== 'Instalados' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 16, margin: 0 }}>Plugins Destacados</h3>
                <a href="#ver-todos" style={{ fontSize: 13, color: 'var(--color-accent)' }}>
                  Ver todos
                </a>
              </div>

              <div className="plugins-featured-grid">
                {filteredFeatured.map((p) => (
                  <div key={p.id} className="plugin-card">
                    <div>
                      <div className="plugin-card-header">
                        <div className="plugin-card-icon" style={{ background: p.bgColor, color: p.color }}>
                          {p.icon}
                        </div>
                        <div>
                          <h4 className="plugin-card-title">{p.nombre}</h4>
                          <span className="plugin-card-cat" style={{ color: p.color }}>
                            {p.categoria}
                          </span>
                        </div>
                      </div>
                      <p className="plugin-card-desc" style={{ marginTop: 10 }}>
                        {p.descripcion}
                      </p>
                    </div>

                    <div className="plugin-card-footer">
                      <div className="plugin-rating">
                        ★ {p.rating} <span>({p.reviews})</span>
                      </div>
                      <button
                        className={`btn ${p.instalado ? 'btn-secondary' : 'btn-secondary'}`}
                        style={{ fontSize: 12, padding: '5px 12px' }}
                        onClick={() => toggleInstallFeatured(p.id)}
                      >
                        {p.instalado ? '✓ Instalado' : 'Instalar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabla de Plugins Instalados */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-line)' }}>
              <h3 style={{ fontSize: 16, margin: 0 }}>Plugins Instalados</h3>
            </div>

            <table className="plugins-table">
              <thead>
                <tr>
                  <th>Plugin</th>
                  <th>Versión</th>
                  <th>Estado</th>
                  <th>Última Actualización</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstalled.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--color-ink-faint)' }}>
                      No hay plugins instalados en esta categoría.
                    </td>
                  </tr>
                ) : (
                  filteredInstalled.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="plugin-table-info">
                          <div className="plugin-table-icon" style={{ background: 'var(--color-surface-alt)', color: p.color }}>
                            {p.icon}
                          </div>
                          <div>
                            <span className="plugin-table-name">{p.nombre}</span>
                            <span className="plugin-table-cat">{p.categoria}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-ink-soft)', fontFamily: 'var(--font-mono)' }}>{p.version}</td>
                      <td>
                        <span
                          style={{
                            color: p.estado === 'Activo' ? 'var(--color-success)' : 'var(--color-ink-faint)',
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                          onClick={() => toggleStatusInstalled(p.id)}
                          title="Haz clic para activar/desactivar"
                        >
                          ● {p.estado}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-ink-faint)' }}>{p.ultimaAct}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="plugin-action-btns" style={{ justifyContent: 'flex-end' }}>
                          <button className="plugin-action-btn" title="Configuración">
                            ⚙️
                          </button>
                          <button className="plugin-action-btn" title="Información">
                            ℹ️
                          </button>
                          <button
                            className="plugin-action-btn danger"
                            title="Desinstalar plugin"
                            onClick={() => deleteInstalled(p.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--color-line)' }}>
              <a href="#todos-instalados" style={{ fontSize: 13, color: 'var(--color-accent)' }}>
                Ver todos los plugins instalados →
              </a>
            </div>
          </div>
        </div>

        {/* ── Barra Lateral Derecha (Categorías, Recursos y Estado) ── */}
        <div className="plugins-right-sidebar">
          {/* Categorías */}
          <div className="card" style={{ padding: 16 }}>
            <h4 style={{ fontSize: 14, margin: '0 0 12px 0' }}>Categorías</h4>
            <ul className="plugins-cat-list">
              {categories.map((cat) => (
                <li
                  key={cat.name}
                  className={`plugins-cat-item${selectedCat === cat.name ? ' active' : ''}`}
                  onClick={() => setSelectedCat(cat.name)}
                >
                  <span>{cat.name}</span>
                  <span className="plugins-cat-count">{cat.count}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recursos */}
          <div className="card" style={{ padding: 16 }}>
            <h4 style={{ fontSize: 14, margin: '0 0 12px 0' }}>Recursos</h4>
            <div>
              <a href="#doc" className="plugins-resource-item">
                <span className="plugins-resource-icon">📖</span>
                <div>
                  <span className="plugins-resource-title">Documentación ↗</span>
                  <span className="plugins-resource-desc">Guías y documentación oficial</span>
                </div>
              </a>
              <a href="#dev" className="plugins-resource-item">
                <span className="plugins-resource-icon">👥</span>
                <div>
                  <span className="plugins-resource-title">Desarrolladores ↗</span>
                  <span className="plugins-resource-desc">Crea tus propios plugins</span>
                </div>
              </a>
              <a href="#soporte" className="plugins-resource-item">
                <span className="plugins-resource-icon">🎧</span>
                <div>
                  <span className="plugins-resource-title">Soporte ↗</span>
                  <span className="plugins-resource-desc">Obtén ayuda y soporte</span>
                </div>
              </a>
            </div>
          </div>

          {/* Información del Sistema */}
          <div className="system-info-card">
            <h4 style={{ fontSize: 13, margin: '0 0 10px 0' }}>Información del Sistema</h4>
            <div className="system-info-row">
              <span className="system-info-label">Versión</span>
              <span className="system-info-val">{systemInfo.version}</span>
            </div>
            <div className="system-info-row">
              <span className="system-info-label">Entorno</span>
              <span className="system-info-val">{systemInfo.entorno}</span>
            </div>
            <div className="system-info-row">
              <span className="system-info-label">Estado</span>
              <span className="system-info-val" style={{ color: 'var(--color-success)' }}>
                ● {systemInfo.estado}
              </span>
            </div>
            <div className="system-info-row">
              <span className="system-info-label">Uptime</span>
              <span className="system-info-val">{systemInfo.uptime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal: Subir Plugin ── */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 420, padding: 24, background: '#fff' }}>
            <h3 style={{ margin: '0 0 8px 0' }}>Subir Plugin Personalizado</h3>
            <p style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 16 }}>
              Sube un paquete comprimido <code>.zip</code> con el manifiesto y código de tu plugin.
            </p>
            <div style={{ border: '2px dashed var(--color-line)', padding: 24, textAlign: 'center', borderRadius: 8, cursor: 'pointer', marginBottom: 16 }}>
              📁 Haz clic o arrastra tu archivo .zip aquí
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => setShowUploadModal(false)}>Subir e Instalar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Tienda de Plugins ── */}
      {showStoreModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 500, padding: 24, background: '#fff' }}>
            <h3 style={{ margin: '0 0 8px 0' }}>🛍️ Tienda de Plugins Oficial</h3>
            <p style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 16 }}>
              Explora más de 48 extensiones verificadas para ampliar las funciones de tu ERP.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-surface-alt)', borderRadius: 4 }}>
                <span>📦 Facturación Electrónica NCF</span>
                <button className="btn btn-secondary" style={{ fontSize: 11, padding: '3px 8px' }}>Instalar</button>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-surface-alt)', borderRadius: 4 }}>
                <span>💬 Conector WhatsApp Business API</span>
                <button className="btn btn-secondary" style={{ fontSize: 11, padding: '3px 8px' }}>Instalar</button>
              </li>
            </ul>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setShowStoreModal(false)}>Cerrar Tienda</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
