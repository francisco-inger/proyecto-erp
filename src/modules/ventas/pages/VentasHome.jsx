import { useEffect, useMemo, useRef, useState } from 'react'
import { ventasService } from '../services/ventas.service'
import './VentasHome.css'

const STATUS = [
  'Todos',
  'Pendiente',
  'Confirmado',
  'Enviado',
  'Entregado',
  'Cancelado',
]

const STATUS_META = {
  Pendiente: { tone: 'warning', icon: '◷' },
  Confirmado: { tone: 'success', icon: '✓' },
  Enviado: { tone: 'info', icon: '→' },
  Entregado: { tone: 'done', icon: '✓✓' },
  Cancelado: { tone: 'danger', icon: '×' },
}

function normalizeOrder(raw, index = 0) {
  const total = Number(raw?.total ?? 0)

  return {
    id: raw?.id ?? `local-${index}`,
    numero: raw?.numero || `PED-${raw?.id ?? index}`,
    cliente: raw?.cliente || 'Sin cliente',
    fecha: raw?.fecha || raw?.fechaCreacion || null,
    fechaCreacion: raw?.fechaCreacion || raw?.fecha || null,
    estado: raw?.estado || 'Pendiente',
    total: Number.isFinite(total) ? total : 0,
    observaciones: raw?.observaciones || '',
  }
}

function normalizeOrders(payload) {
  if (Array.isArray(payload)) {
    return payload.map(normalizeOrder)
  }

  if (payload && typeof payload === 'object') {
    for (const value of [
      payload.value,
      payload.orders,
      payload.data,
      payload.results,
    ]) {
      if (Array.isArray(value)) {
        return value.map(normalizeOrder)
      }
    }
  }

  return []
}

function money(value) {
  return Number(value || 0).toLocaleString('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
  })
}

function formatDate(value) {
  if (!value) return '—'

  const d = new Date(value)

  if (Number.isNaN(d.getTime())) {
    return '—'
  }

  return d.toLocaleDateString('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function StatusBadge({ status }) {
  const meta =
    STATUS_META[status] || {
      tone: 'neutral',
      icon: '•',
    }

  return (
    <span className={`ventas-status ventas-status-${meta.tone}`}>
      <span>{meta.icon}</span>
      {status}
    </span>
  )
}

function SearchIcon() {
  return (
    <span className="ventas-icon" aria-hidden="true">
      ⌕
    </span>
  )
}

export function VentasHome() {
  const [orders, setOrders] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('Todos')
  const [groupBy, setGroupBy] = useState('none')

  const [favoritesOnly, setFavoritesOnly] = useState(false)

  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('ventas_favorites') || '[]'
      )
    } catch {
      return []
    }
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const [importing, setImporting] = useState(false)

  const [form, setForm] = useState({
    cliente: '',
    total: '',
    fecha: '',
    observaciones: '',
  })

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const importRef = useRef(null)

  async function loadOrders(selectFirst = false) {
    setLoading(true)
    setError('')

    try {
      const payload = await ventasService.listOrders()
      const data = normalizeOrders(payload)

      setOrders(data)

      if (selectFirst || selectedId == null) {
        setSelectedId(data[0]?.id ?? null)
      } else if (
        selectedId &&
        !data.some(order => order.id === selectedId)
      ) {
        setSelectedId(data[0]?.id ?? null)
      }
    } catch (e) {
      setError(
        e?.message ||
        'No se pudieron cargar los pedidos.'
      )

      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders(true)
  }, [])

  useEffect(() => {
    localStorage.setItem(
      'ventas_favorites',
      JSON.stringify(favorites)
    )
  }, [favorites])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return orders.filter(order => {
      const text = `
        ${order.numero}
        ${order.cliente}
        ${order.estado}
        ${order.observaciones}
      `.toLowerCase()

      const matchesSearch =
        !q || text.includes(q)

      const matchesStatus =
        status === 'Todos' ||
        order.estado === status

      const matchesFavorite =
        !favoritesOnly ||
        favorites.includes(order.id)

      return (
        matchesSearch &&
        matchesStatus &&
        matchesFavorite
      )
    })
  }, [
    orders,
    search,
    status,
    favoritesOnly,
    favorites,
  ])

  const selected =
    orders.find(order => order.id === selectedId) ||
    null

  const stats = useMemo(() => {
    const now = new Date()

    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const thisMonth = orders.filter(order => {
      const d = new Date(order.fecha)

      return (
        !Number.isNaN(d.getTime()) &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      )
    })

    const uniqueClients = new Set(
      orders
        .map(order =>
          order.cliente.trim().toLowerCase()
        )
        .filter(Boolean)
    )

    return {
      total: orders.length,

      revenue: orders.reduce(
        (sum, order) =>
          sum + order.total,
        0
      ),

      monthRevenue:
        thisMonth.reduce(
          (sum, order) =>
            sum + order.total,
          0
        ),

      pending: orders.filter(
        order =>
          order.estado === 'Pendiente'
      ).length,

      confirmed: orders.filter(
        order =>
          order.estado === 'Confirmado'
      ).length,

      delivered: orders.filter(
        order =>
          order.estado === 'Entregado'
      ).length,

      clients: uniqueClients.size,
    }
  }, [orders])

  const chart = useMemo(() => {
    const now = new Date()

    const months = Array.from(
      { length: 6 },
      (_, index) => {
        const d = new Date(
          now.getFullYear(),
          now.getMonth() - 5 + index,
          1
        )

        return {
          key: `${d.getFullYear()}-${d.getMonth()}`,

          label: d
            .toLocaleDateString(
              'es-DO',
              { month: 'short' }
            )
            .replace('.', ''),

          value: 0,
        }
      }
    )

    for (const order of orders) {
      const d = new Date(order.fecha)

      if (Number.isNaN(d.getTime())) {
        continue
      }

      const item = months.find(
        month =>
          month.key ===
          `${d.getFullYear()}-${d.getMonth()}`
      )

      if (item) {
        item.value += order.total
      }
    }

    const max = Math.max(
      ...months.map(month => month.value),
      1
    )

    return {
      months,
      max,
    }
  }, [orders])

  const grouped = useMemo(() => {
    if (groupBy === 'none') {
      return [
        {
          key: '',
          label: '',
          rows: filtered,
        },
      ]
    }

    const map = new Map()

    filtered.forEach(order => {
      const key =
        groupBy === 'status'
          ? order.estado
          : order.cliente

      if (!map.has(key)) {
        map.set(key, [])
      }

      map.get(key).push(order)
    })

    return [...map.entries()].map(
      ([key, rows]) => ({
        key,
        label: key,
        rows,
      })
    )
  }, [filtered, groupBy])

  function toggleFavorite(id) {
    setFavorites(current =>
      current.includes(id)
        ? current.filter(
            value => value !== id
          )
        : [...current, id]
    )
  }

  async function createOrder(event) {
    event.preventDefault()

    setSaveError('')

    const cliente =
      form.cliente.trim()

    const total =
      Number(form.total)

    if (!cliente) {
      setSaveError(
        'El cliente es obligatorio.'
      )
      return
    }

    if (
      !Number.isFinite(total) ||
      total < 0
    ) {
      setSaveError(
        'El total debe ser un número válido mayor o igual a 0.'
      )
      return
    }

    setSaving(true)

    try {
      const payload = {
        cliente,
        total,

        observaciones:
          form.observaciones.trim() ||
          null,

        ...(form.fecha
          ? {
              fecha:
                new Date(
                  `${form.fecha}T12:00:00`
                ).toISOString(),
            }
          : {}),
      }

      await ventasService.createOrder(
        payload
      )

      setShowCreate(false)

      setForm({
        cliente: '',
        total: '',
        fecha: '',
        observaciones: '',
      })

      await loadOrders(true)
    } catch (e) {
      setSaveError(
        e?.message ||
        'No se pudo crear el pedido.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(
    id,
    nextStatus
  ) {
    setError('')

    try {
      await ventasService.updateOrderStatus(
        id,
        nextStatus
      )

      setOrders(current =>
        current.map(order =>
          order.id === id
            ? {
                ...order,
                estado: nextStatus,
              }
            : order
        )
      )
    } catch (e) {
      setError(
        e?.message ||
        'No se pudo actualizar el estado.'
      )
    }
  }

  function exportCsv() {
    const header = [
      'id',
      'numero',
      'cliente',
      'fecha',
      'estado',
      'total',
      'observaciones',
    ]

    const rows = orders.map(order =>
      header
        .map(key => {
          const value =
            key === 'fecha'
              ? order.fecha || ''
              : order[key] ?? ''

          return `"${String(value)
            .replaceAll('"', '""')}"`
        })
        .join(',')
    )

    const csv = [
      header.join(','),
      ...rows,
    ].join('\n')

    const blob = new Blob(
      [csv],
      {
        type:
          'text/csv;charset=utf-8;',
      }
    )

    const url =
      URL.createObjectURL(blob)

    const a =
      document.createElement('a')

    a.href = url

    a.download =
      `pedidos-ventas-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`

    a.click()

    URL.revokeObjectURL(url)
  }

  async function importCsv(file) {
    if (!file) return

    setImporting(true)
    setError('')

    try {
      const text =
        await file.text()

      const lines =
        text
          .split(/\r?\n/)
          .filter(Boolean)

      if (lines.length < 2) {
        throw new Error(
          'El CSV debe tener encabezado y al menos un registro.'
        )
      }

      const headers =
        lines[0]
          .split(',')
          .map(header =>
            header
              .trim()
              .replace(
                /^"|"$/g,
                ''
              )
              .toLowerCase()
          )

      const indexOf =
        name =>
          headers.indexOf(name)

      if (
        indexOf('cliente') === -1 ||
        indexOf('total') === -1
      ) {
        throw new Error(
          'El CSV necesita las columnas: cliente,total.'
        )
      }

      for (
        const line of lines.slice(1)
      ) {
        const columns =
          line
            .split(',')
            .map(value =>
              value
                .trim()
                .replace(
                  /^"|"$/g,
                  ''
                )
                .replaceAll(
                  '""',
                  '"'
                )
            )

        const cliente =
          columns[indexOf('cliente')]

        const total =
          Number(
            columns[indexOf('total')]
          )

        if (
          !cliente ||
          !Number.isFinite(total)
        ) {
          continue
        }

        await ventasService.createOrder({
          cliente,
          total,

          fecha:
            indexOf('fecha') >= 0 &&
            columns[indexOf('fecha')]
              ? columns[indexOf('fecha')]
              : undefined,

          observaciones:
            indexOf('observaciones') >= 0
              ? columns[
                  indexOf(
                    'observaciones'
                  )
                ] || null
              : null,
        })
      }

      setShowImport(false)

      await loadOrders(true)
    } catch (e) {
      setError(
        e?.message ||
        'No se pudo importar el archivo.'
      )
    } finally {
      setImporting(false)

      if (importRef.current) {
        importRef.current.value = ''
      }
    }
  }

  return (
    <div className="ventas-page">

      <header className="ventas-topbar">

        <div className="ventas-heading">

          <div className="ventas-app-mark">
            ◈
          </div>

          <div>
            <span>Ventas</span>

            <h1>
              Pedidos de ventas

              <button
                type="button"
                className="gear-btn"
                title="Configuración"
              >
                ⚙
              </button>
            </h1>
          </div>

        </div>

        <div className="global-search">
          <SearchIcon />

          <input
            placeholder="Buscar..."
            value={search}
            onChange={e =>
              setSearch(e.target.value)
            }
          />
        </div>

        <div className="top-actions">

          <button
            type="button"
            onClick={() => {
              setSaveError('')
              setShowCreate(true)
            }}
            title="Nuevo pedido"
          >
            +
          </button>

          <button
            type="button"
            title="Notificaciones"
          >
            ♧
          </button>

          <button
            type="button"
            title="Opciones"
          >
            ▣
          </button>

          <span className="user-avatar">
            E
          </span>

          <button
            type="button"
            title="Cerrar"
          >
            ⌄
          </button>

        </div>

      </header>

      {error && (
        <div className="ventas-alert error">

          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              setError('')
            }
          >
            ×
          </button>

        </div>
      )}

      <div className="ventas-commandbar">

        <div className="command-left">

          <button
            className="btn primary"
            type="button"
            onClick={() => {
              setSaveError('')
              setShowCreate(true)
            }}
          >
            Nuevo
          </button>

          <button
            className="btn"
            type="button"
            onClick={() =>
              setShowImport(true)
            }
          >
            Importar
          </button>

          <button
            className="btn icon-only"
            type="button"
            title="Exportar CSV"
            onClick={exportCsv}
          >
            ⇩
          </button>

        </div>

        <div className="command-right">

          <label className="search-control">

            <SearchIcon />

            <input
              value={search}
              onChange={e =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Buscar pedidos..."
            />

          </label>

          <select
            className="btn select-btn"
            value={status}
            onChange={e =>
              setStatus(
                e.target.value
              )
            }
          >
            {STATUS.map(item => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

          <select
            className="btn select-btn"
            value={groupBy}
            onChange={e =>
              setGroupBy(
                e.target.value
              )
            }
          >
            <option value="none">
              Agrupar por
            </option>

            <option value="status">
              Estado
            </option>

            <option value="client">
              Cliente
            </option>
          </select>

          <button
            className={`btn ${
              favoritesOnly
                ? 'selected'
                : ''
            }`}
            type="button"
            onClick={() =>
              setFavoritesOnly(
                value => !value
              )
            }
          >
            ☆ Favoritos
          </button>

        </div>

      </div>

      <section className="kpi-grid">

        <article className="kpi">

          <div className="kpi-icon purple">
            $
          </div>

          <div>
            <small>
              Ventas este mes
            </small>

            <strong>
              {money(
                stats.monthRevenue
              )}
            </strong>

            <span>
              Pedidos del mes actual
            </span>
          </div>

        </article>

        <article className="kpi">

          <div className="kpi-icon green">
            ▣
          </div>

          <div>
            <small>
              Pedidos
            </small>

            <strong>
              {stats.total}
            </strong>

            <span>
              {stats.pending} pendientes
            </span>
          </div>

        </article>

        <article className="kpi">

          <div className="kpi-icon orange">
            ◈
          </div>

          <div>
            <small>
              Ventas acumuladas
            </small>

            <strong>
              {money(
                stats.revenue
              )}
            </strong>

            <span>
              Basado en pedidos registrados
            </span>
          </div>

        </article>

        <article className="kpi">

          <div className="kpi-icon blue">
            ♙
          </div>

          <div>
            <small>
              Clientes con pedidos
            </small>

            <strong>
              {stats.clients}
            </strong>

            <span>
              Clientes distintos en ventas
            </span>
          </div>

        </article>

      </section>

      <div className="ventas-main-grid">

        <section className="orders-panel">

          <nav className="status-tabs">

            {STATUS.map(item => (

              <button
                key={item}
                type="button"
                className={
                  status === item
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setStatus(item)
                }
              >
                {item}

                <b>
                  {item === 'Todos'
                    ? orders.length
                    : orders.filter(
                        order =>
                          order.estado ===
                          item
                      ).length}
                </b>

              </button>

            ))}

          </nav>

          {loading ? (

            <div className="state-box">
              Cargando pedidos desde la base de datos...
            </div>

          ) : filtered.length === 0 ? (

            <div className="state-box">

              <strong>
                No hay pedidos para mostrar.
              </strong>

              <span>
                Ajusta los filtros o crea un pedido.
              </span>

              <button
                className="btn primary"
                type="button"
                onClick={() => {
                  setSaveError('')
                  setShowCreate(true)
                }}
              >
                Nuevo pedido
              </button>

            </div>

          ) : (

            <div className="table-wrap">

              {grouped.map(group => (

                <div
                  key={group.key || 'all'}
                  className="order-group"
                >

                  {group.label && (
                    <div className="order-group-title">
                      {group.label}
                      <span>
                        {group.rows.length}
                      </span>
                    </div>
                  )}

                  <table className="ventas-table">

                    <thead>
                      <tr>
                        <th></th>
                        <th>Pedido</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Total</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>

                    <tbody>

                      {group.rows.map(order => (

                        <tr
                          key={order.id}
                          className={
                            selectedId === order.id
                              ? 'selected-row'
                              : ''
                          }
                          onClick={() =>
                            setSelectedId(
                              order.id
                            )
                          }
                        >

                          <td>

                            <button
                              type="button"
                              className={`favorite-btn ${
                                favorites.includes(
                                  order.id
                                )
                                  ? 'favorite-active'
                                  : ''
                              }`}
                              onClick={event => {
                                event.stopPropagation()
                                toggleFavorite(
                                  order.id
                                )
                              }}
                              title="Favorito"
                            >
                              {favorites.includes(
                                order.id
                              )
                                ? '★'
                                : '☆'}
                            </button>

                          </td>

                          <td>
                            <strong>
                              {order.numero}
                            </strong>
                          </td>

                          <td>
                            {order.cliente}
                          </td>

                          <td>
                            {formatDate(
                              order.fecha
                            )}
                          </td>

                          <td>

                            <StatusBadge
                              status={
                                order.estado
                              }
                            />

                          </td>

                          <td>
                            <strong>
                              {money(
                                order.total
                              )}
                            </strong>
                          </td>

                          <td>

                            <select
                              className="status-select"
                              value={
                                order.estado
                              }
                              onClick={event =>
                                event.stopPropagation()
                              }
                              onChange={event =>
                                changeStatus(
                                  order.id,
                                  event.target.value
                                )
                              }
                            >
                              {STATUS
                                .filter(
                                  value =>
                                    value !==
                                    'Todos'
                                )
                                .map(value => (
                                  <option
                                    key={value}
                                    value={value}
                                  >
                                    {value}
                                  </option>
                                ))}
                            </select>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              ))}

            </div>

          )}

        </section>

        <aside className="order-detail-panel">

          {selected ? (

            <>

              <div className="detail-header">

                <div>
                  <small>
                    Pedido
                  </small>

                  <h2>
                    {selected.numero}
                  </h2>
                </div>

                <StatusBadge
                  status={
                    selected.estado
                  }
                />

              </div>

              <div className="detail-content">

                <div className="detail-field">
                  <span>Cliente</span>
                  <strong>
                    {selected.cliente}
                  </strong>
                </div>

                <div className="detail-field">
                  <span>Fecha</span>
                  <strong>
                    {formatDate(
                      selected.fecha
                    )}
                  </strong>
                </div>

                <div className="detail-field">
                  <span>Fecha de creación</span>
                  <strong>
                    {formatDate(
                      selected.fechaCreacion
                    )}
                  </strong>
                </div>

                <div className="detail-total">
                  <span>Total</span>
                  <strong>
                    {money(
                      selected.total
                    )}
                  </strong>
                </div>

                <div className="detail-field">
                  <span>Observaciones</span>

                  <p>
                    {selected.observaciones ||
                      'Sin observaciones'}
                  </p>
                </div>

                <div className="detail-actions">

                  <label>
                    Cambiar estado
                  </label>

                  <select
                    className="status-select large"
                    value={
                      selected.estado
                    }
                    onChange={event =>
                      changeStatus(
                        selected.id,
                        event.target.value
                      )
                    }
                  >
                    {STATUS
                      .filter(
                        value =>
                          value !==
                          'Todos'
                      )
                      .map(value => (
                        <option
                          key={value}
                          value={value}
                        >
                          {value}
                        </option>
                      ))}
                  </select>

                </div>

              </div>

            </>

          ) : (

            <div className="state-box">
              Selecciona un pedido para ver sus detalles.
            </div>

          )}

        </aside>

      </div>

      {showCreate && (

        <div
          className="ventas-modal-overlay"
          onMouseDown={event => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowCreate(false)
            }
          }}
        >

          <form
            className="ventas-modal"
            onSubmit={createOrder}
          >

            <div className="modal-header">

              <div>
                <small>
                  Ventas
                </small>

                <h2>
                  Nuevo pedido
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreate(false)
                }
              >
                ×
              </button>

            </div>

            {saveError && (
              <div className="ventas-alert error">
                {saveError}
              </div>
            )}

            <label>
              Cliente

              <input
                value={form.cliente}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    cliente:
                      event.target.value,
                  }))
                }
                placeholder="Nombre del cliente"
                autoFocus
              />
            </label>

            <label>
              Total

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.total}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    total:
                      event.target.value,
                  }))
                }
                placeholder="0.00"
              />
            </label>

            <label>
              Fecha

              <input
                type="date"
                value={form.fecha}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    fecha:
                      event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Observaciones

              <textarea
                rows="4"
                value={
                  form.observaciones
                }
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    observaciones:
                      event.target.value,
                  }))
                }
                placeholder="Observaciones del pedido"
              />
            </label>

            <div className="modal-actions">

              <button
                type="button"
                className="btn"
                onClick={() =>
                  setShowCreate(false)
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn primary"
                disabled={saving}
              >
                {saving
                  ? 'Guardando...'
                  : 'Crear pedido'}
              </button>

            </div>

          </form>

        </div>

      )}

      {showImport && (

        <div
          className="ventas-modal-overlay"
          onMouseDown={event => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowImport(false)
            }
          }}
        >

          <div className="ventas-modal">

            <div className="modal-header">

              <div>
                <small>
                  Ventas
                </small>

                <h2>
                  Importar pedidos
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowImport(false)
                }
              >
                ×
              </button>

            </div>

            <p>
              Selecciona un archivo CSV con
              las columnas <strong>cliente</strong>
              y <strong>total</strong>.
            </p>

            <input
              ref={importRef}
              type="file"
              accept=".csv,text/csv"
              disabled={importing}
              onChange={event =>
                importCsv(
                  event.target.files?.[0]
                )
              }
            />

            {importing && (
              <div className="state-box">
                Importando pedidos...
              </div>
            )}

            <div className="modal-actions">

              <button
                type="button"
                className="btn"
                disabled={importing}
                onClick={() =>
                  setShowImport(false)
                }
              >
                Cerrar
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}

export default VentasHome