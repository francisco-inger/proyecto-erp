import React, { useState, useMemo } from 'react'
import './EnterprisePickerModal.css'

/**
 * EnterprisePicker: Selector universal con escritura directa + modal de exploración detallada.
 *
 * Props:
 * - label: string
 * - value: string | number
 * - onChange: (val: string, itemObj?: any) => void
 * - placeholder?: string
 * - required?: boolean
 * - items: Array<any>
 * - searchFields?: string[] (e.g. ['nombre', 'cargo', 'departamento', 'email'])
 * - displayField?: string (default 'nombre')
 * - subtitleField?: string (default 'cargo' or 'departamento')
 * - idField?: string (default 'id' or 'nombre')
 * - filterField?: string (e.g. 'departamento' or 'categoria' or 'sector')
 * - filterLabel?: string
 * - modalTitle?: string
 * - columns?: Array<{ header: string, field?: string, render?: (item: any) => any }>
 * - icon?: string
 */
export function EnterprisePicker({
  label,
  value,
  onChange,
  placeholder = 'Escriba o busque...',
  required = false,
  items = [],
  searchFields = ['nombre', 'cargo', 'departamento', 'email', 'codigo', 'cliente', 'proveedor'],
  displayField = 'nombre',
  subtitleField,
  idField = 'id',
  filterField,
  filterLabel = 'Categoría',
  modalTitle = 'Directorio de Selección',
  columns,
  icon = '👤',
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalSearch, setModalSearch] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('Todos')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  // Encontrar el objeto seleccionado si existe
  const selectedItem = useMemo(() => {
    if (!value) return null
    return items.find(
      (it) =>
        String(it[idField] || it[displayField]) === String(value) ||
        it[displayField] === value
    )
  }, [value, items, idField, displayField])

  // Opciones de filtro para el modal
  const filterOptions = useMemo(() => {
    if (!filterField) return []
    const raw = items.map((i) => i[filterField]).filter(Boolean)
    return ['Todos', ...new Set(raw)]
  }, [items, filterField])

  // Filtrado de items dentro del modal
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchFilter =
        !filterField ||
        selectedFilter === 'Todos' ||
        String(item[filterField]) === String(selectedFilter)

      if (!matchFilter) return false

      if (!modalSearch.trim()) return true
      const term = modalSearch.toLowerCase()
      return searchFields.some((f) => {
        const val = item[f]
        return val && String(val).toLowerCase().includes(term)
      })
    })
  }, [items, filterField, selectedFilter, modalSearch, searchFields])

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, currentPage, pageSize])

  const handleSelect = (item) => {
    const mainVal = item[displayField] || item[idField]
    onChange(mainVal, item)
    setIsModalOpen(false)
  }

  const handleClear = () => {
    onChange('', null)
  }

  // Columnas por defecto si no se especifican
  const defaultColumns = [
    {
      header: 'Registro',
      render: (item) => {
        const title = item[displayField] || item.nombre || item.codigo || '—'
        const sub = subtitleField ? item[subtitleField] : item.cargo || item.departamento || item.email || item.categoria || ''
        const initials = title.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="ep-avatar">{initials || icon}</div>
            <div>
              <div style={{ fontWeight: 700, color: '#0F172A' }}>{title}</div>
              {sub && <div style={{ fontSize: 11, color: '#64748B' }}>{sub}</div>}
            </div>
          </div>
        )
      },
    },
    {
      header: 'Detalle',
      render: (item) => (
        <span style={{ color: '#475569' }}>
          {item.departamento || item.categoria || item.sector || item.rnc || item.estado || '—'}
        </span>
      ),
    },
    {
      header: 'Información Extra',
      render: (item) => (
        <span style={{ color: '#64748B', fontSize: 11 }}>
          {item.email || item.telefono || (item.precio ? `RD$ ${Number(item.precio).toLocaleString('es-DO')}` : '') || (item.stock !== undefined ? `Stock: ${item.stock}` : '') || item.tipoContrato || '—'}
        </span>
      ),
    },
  ]

  const activeColumns = columns || defaultColumns

  return (
    <div className="ep-picker-field">
      {label && (
        <div className="ep-picker-label">
          <span>{label}</span>
        </div>
      )}

      {selectedItem ? (
        <div className="ep-selected-card">
          <div className="ep-selected-info">
            <div className="ep-avatar">
              {String(selectedItem[displayField] || 'OK')
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <div className="ep-selected-title">
                {selectedItem[displayField]}
              </div>
              <div className="ep-selected-subtitle">
                {subtitleField ? selectedItem[subtitleField] : (selectedItem.cargo || selectedItem.departamento || selectedItem.email || selectedItem.sector || selectedItem.categoria || 'Seleccionado')}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              type="button"
              className="ep-browse-btn"
              style={{ padding: '4px 8px', fontSize: 11 }}
              onClick={() => setIsModalOpen(true)}
            >
              Cambiar
            </button>
            <button
              type="button"
              className="ep-clear-btn"
              title="Quitar selección"
              onClick={handleClear}
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div className="ep-input-wrapper">
          <input
            type="text"
            className="ep-text-input"
            value={value || ''}
            placeholder={placeholder}
            required={required}
            onChange={(e) => onChange(e.target.value)}
          />
          <button
            type="button"
            className="ep-browse-btn"
            onClick={() => setIsModalOpen(true)}
          >
            <span>{icon}</span>
            <span>Explorar...</span>
          </button>
        </div>
      )}

      {/* Modal de Búsqueda y Selección */}
      {isModalOpen && (
        <div className="ep-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="ep-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ep-modal-header">
              <h3>
                <span>{icon}</span> {modalTitle}
              </h3>
              <button className="ep-modal-close" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="ep-modal-toolbar">
              <div className="ep-modal-search">
                <span>🔍</span>
                <input
                  autoFocus
                  placeholder="Buscar por nombre, cargo, código, depto, email..."
                  value={modalSearch}
                  onChange={(e) => {
                    setModalSearch(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>

              {filterOptions.length > 0 && (
                <select
                  className="ep-modal-filter-select"
                  value={selectedFilter}
                  onChange={(e) => {
                    setSelectedFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                >
                  {filterOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {filterLabel}: {opt}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="ep-modal-body">
              {paginatedItems.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                  <strong>No se encontraron registros</strong>
                  <p style={{ fontSize: 12, margin: '4px 0 0' }}>
                    Pruebe con otro término de búsqueda o escriba el nombre directamente en el campo.
                  </p>
                </div>
              ) : (
                <table className="ep-table">
                  <thead>
                    <tr>
                      {activeColumns.map((col, idx) => (
                        <th key={idx}>{col.header}</th>
                      ))}
                      <th style={{ textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item, idx) => (
                      <tr key={item[idField] || idx} onClick={() => handleSelect(item)}>
                        {activeColumns.map((col, cIdx) => (
                          <td key={cIdx}>
                            {col.render ? col.render(item) : item[col.field] || '—'}
                          </td>
                        ))}
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="ep-select-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelect(item)
                            }}
                          >
                            Seleccionar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="ep-modal-footer">
              <span>
                Mostrando {paginatedItems.length} de {filteredItems.length} registros
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  className="ep-browse-btn"
                  style={{ padding: '4px 10px', fontSize: 11 }}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  ‹ Anterior
                </button>
                <span>
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  className="ep-browse-btn"
                  style={{ padding: '4px 10px', fontSize: 11 }}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Siguiente ›
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default EnterprisePicker
