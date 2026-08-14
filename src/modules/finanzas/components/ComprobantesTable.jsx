import React, { useState, useMemo } from 'react'

export function ComprobantesTable({ comprobantes, onVerDetalle, onNuevoComprobante }) {
  const [activeTab, setActiveTab] = useState('Comprobantes Recientes')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  const tabs = [
    'Comprobantes Recientes',
    'Ingresos Recientes',
    'Gastos Recientes',
    'Transferencias',
  ]

  // Filtrado de datos por Tab, Búsqueda y Estado
  const filteredData = useMemo(() => {
    return (comprobantes || []).filter((item) => {
      // Filtro por Tab
      if (activeTab === 'Ingresos Recientes' && item.tipo !== 'Ingreso') return false
      if (activeTab === 'Gastos Recientes' && item.tipo !== 'Gasto') return false
      if (activeTab === 'Transferencias' && item.tipo !== 'Transferencia') return false

      // Filtro por Estado
      if (filterEstado !== 'Todos' && item.estado !== filterEstado) return false

      // Filtro por Búsqueda (Número, Descripción, Creador, Cuenta)
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase()
        const matchNumero = item.numero.toLowerCase().includes(query)
        const matchDesc = item.descripcion.toLowerCase().includes(query)
        const matchCreador = item.creadoPor.toLowerCase().includes(query)
        const matchCuenta = item.cuenta.toLowerCase().includes(query)
        if (!matchNumero && !matchDesc && !matchCreador && !matchCuenta) return false
      }

      return true
    })
  }, [comprobantes, activeTab, filterEstado, searchTerm])

  // Paginación
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage, pageSize])

  // Exportar a CSV
  const handleExportCSV = () => {
    const headers = ['# Comprobante', 'Tipo', 'Fecha', 'Descripción', 'Cuenta', 'Monto', 'Estado', 'Creado por']
    const rows = filteredData.map((c) => [
      c.numero,
      c.tipo,
      c.fecha,
      `"${c.descripcion}"`,
      `"${c.cuenta}"`,
      c.monto,
      c.estado,
      c.creadoPor,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `comprobantes_${activeTab.toLowerCase().replace(/ /g, '_')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getTipoBadgeClass = (tipo) => {
    switch (tipo) {
      case 'Ingreso':
        return 'badge-tipo-ingreso'
      case 'Gasto':
        return 'badge-tipo-gasto'
      case 'Transferencia':
        return 'badge-tipo-transferencia'
      default:
        return 'badge-tipo-default'
    }
  }

  const getEstadoBadgeClass = (estado) => {
    switch (estado) {
      case 'Aprobado':
        return 'badge-estado-aprobado'
      case 'Completado':
        return 'badge-estado-completado'
      case 'Pendiente':
        return 'badge-estado-pendiente'
      default:
        return 'badge-estado-default'
    }
  }

  const getMontoClass = (tipo) => {
    if (tipo === 'Ingreso') return 'monto-ingreso'
    if (tipo === 'Gasto') return 'monto-gasto'
    return 'monto-transferencia'
  }

  return (
    <div className="fn-table-section">
      {/* Barra superior de pestañas y herramientas */}
      <div className="fn-table-header-row">
        <div className="fn-table-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`fn-table-tab-btn ${activeTab === tab ? 'active-tab' : ''}`}
              onClick={() => {
                setActiveTab(tab)
                setCurrentPage(1)
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="fn-table-toolbar">
          <div className="fn-search-input-box">
            <span className="fn-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar comprobante..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="fn-search-input"
            />
          </div>

          <div className="fn-filter-dropdown-wrap">
            <button className="fn-tool-btn">
              <span>⚡</span> Filtros
            </button>
          </div>

          <button className="fn-tool-btn" onClick={handleExportCSV}>
            <span>📥</span> Exportar
          </button>
        </div>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="fn-table-responsive">
        <table className="fn-data-table">
          <thead>
            <tr>
              <th># Comprobante</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Cuenta</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Creado por</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: 'var(--color-ink-soft)' }}>
                  No se encontraron comprobantes para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr key={row.id} className="fn-table-row">
                  <td className="fn-td-numero">
                    <span className="fn-doc-icon">📄</span>
                    <a
                      href="#ver"
                      onClick={(e) => {
                        e.preventDefault()
                        onVerDetalle?.(row)
                      }}
                      className="fn-link-numero"
                    >
                      {row.numero}
                    </a>
                  </td>

                  <td>
                    <span className={`fn-badge-tipo ${getTipoBadgeClass(row.tipo)}`}>
                      {row.tipo}
                    </span>
                  </td>

                  <td className="fn-td-fecha">{row.fecha}</td>

                  <td className="fn-td-desc">{row.descripcion}</td>

                  <td className="fn-td-cuenta">{row.cuenta}</td>

                  <td className={`fn-td-monto ${getMontoClass(row.tipo)}`}>
                    RD$ {row.monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>

                  <td>
                    <span className={`fn-badge-estado ${getEstadoBadgeClass(row.estado)}`}>
                      {row.estado === 'Aprobado' && '✓ '}
                      {row.estado === 'Completado' && '✓ '}
                      {row.estado === 'Pendiente' && '⏳ '}
                      {row.estado}
                    </span>
                  </td>

                  <td className="fn-td-creador">{row.creadoPor}</td>

                  <td className="fn-td-acciones">
                    <button
                      className="fn-action-icon-btn"
                      title="Ver detalle"
                      onClick={() => onVerDetalle?.(row)}
                    >
                      👁️
                    </button>
                    <button
                      className="fn-action-icon-btn"
                      title="Más opciones"
                    >
                      ⋮
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer de Paginación */}
      <div className="fn-table-footer">
        <div className="fn-table-counter">
          Mostrando {filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} a{' '}
          {Math.min(currentPage * pageSize, filteredData.length)} de {filteredData.length} comprobantes
        </div>

        <div className="fn-pagination-controls">
          <button
            className="fn-page-nav-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          >
            ‹
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`fn-page-number-btn ${currentPage === page ? 'active-page' : ''}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}

          <button
            className="fn-page-nav-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}
