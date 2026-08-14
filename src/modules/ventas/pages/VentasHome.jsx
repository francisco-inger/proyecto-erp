import { useEffect, useMemo, useRef, useState } from 'react'
import { ventasService } from '../services/ventas.service'
import './VentasHome.css'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const STATUS = [
  'Todos',
  'Pendiente',
  'Confirmado',
  'Enviado',
  'Entregado',
  'Cancelado',
]

const STATUS_META = {
  Pendiente: {
    tone: 'warning',
    label: 'Pendiente',
  },
  Confirmado: {
    tone: 'success',
    label: 'Confirmado',
  },
  Enviado: {
    tone: 'info',
    label: 'Enviado',
  },
  Entregado: {
    tone: 'done',
    label: 'Entregado',
  },
  Cancelado: {
    tone: 'danger',
    label: 'Cancelado',
  },
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
  if (!value) return 'â€”'

  const d = new Date(value)

  if (Number.isNaN(d.getTime())) {
    return 'â€”'
  }

  return d.toLocaleDateString('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatMonth(value) {
  return value
    .toLocaleDateString('es-DO', {
      month: 'short',
    })
    .replace('.', '')
    .slice(0, 3)
}

function StatusBadge({ status }) {
  const meta =
    STATUS_META[status] || {
      tone: 'neutral',
      label: status || 'Sin estado',
    }

  return (
    <span className={`ov-badge ov-badge-${meta.tone}`}>
      <span className="ov-badge-dot" />
      {meta.label}
    </span>
  )
}

/* ---------------------------------------------------------
   ICONS (SVG inline, sin dependencias externas)
--------------------------------------------------------- */

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 5 5" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20V9" />
      <path d="m7 13 5-5 5 5" />
      <path d="M5 4h14" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 11a8 8 0 0 0-14.9-4" />
      <path d="M4 5v5h5" />
      <path d="M4 13a8 8 0 0 0 14.9 4" />
      <path d="M20 19v-5h-5" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 10 5 5 5-5" />
    </svg>
  )
}

function StarIcon({ active = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={active ? 'ov-star-filled' : ''}
    >
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  )
}

function GroupIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="4.5" width="7" height="7" rx="1.3" />
      <rect x="13.5" y="4.5" width="7" height="7" rx="1.3" />
      <rect x="3.5" y="14.5" width="7" height="7" rx="1.3" />
      <rect x="13.5" y="14.5" width="7" height="7" rx="1.3" />
    </svg>
  )
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 16 6-6 4 4 6-8" />
      <path d="M14 6h6v6" />
    </svg>
  )
}

function OrdersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="3.5" width="16" height="17" rx="1.6" />
      <path d="M8 8.5h8M8 12.5h8M8 16.5h5" />
    </svg>
  )
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="6" width="17" height="13" rx="1.8" />
      <path d="M3.5 10h17" />
      <circle cx="16.5" cy="14" r="1.1" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c.6-3.2 3-5 5.5-5s4.9 1.8 5.5 5" />
      <circle cx="17" cy="9.5" r="2.3" />
      <path d="M15.8 14.2c2 .3 3.6 1.9 4 4.6" />
    </svg>
  )
}

/* ---------------------------------------------------------
   GRÃFICA DE VENTAS (SVG puro, sin librerÃ­as nuevas)
--------------------------------------------------------- */

function SalesChart({ data }) {
  const width = 720
  const height = 230
  const padding = {
    top: 18,
    right: 14,
    bottom: 30,
    left: 64,
  }

  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const max = Math.max(data.max, 1)

  const points = data.months.map((item, index) => {
    const x =
      padding.left +
      (index * chartWidth) / Math.max(data.months.length - 1, 1)

    const y =
      padding.top + chartHeight - (item.value / max) * chartHeight

    return { ...item, x, y }
  })

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  const areaPath = `
    ${linePath}
    L ${points[points.length - 1]?.x || padding.left} ${padding.top + chartHeight}
    L ${points[0]?.x || padding.left} ${padding.top + chartHeight}
    Z
  `

  const gridLines = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div className="ov-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="GrÃ¡fica de ventas de los Ãºltimos seis meses"
      >
        <defs>
          <linearGradient id="ovAreaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(113, 75, 103, .20)" />
            <stop offset="100%" stopColor="rgba(113, 75, 103, 0)" />
          </linearGradient>
        </defs>

        {gridLines.map(value => {
          const y = padding.top + chartHeight - value * chartHeight

          return (
            <g key={value}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                className="ov-chart-grid"
              />

              <text
                x={padding.left - 10}
                y={y + 3}
                textAnchor="end"
                className="ov-chart-axis"
              >
                {money(max * value || 0).replace('RD$', '').trim()}
              </text>
            </g>
          )
        })}

        <path d={areaPath} className="ov-chart-area" />
        <path d={linePath} className="ov-chart-line" />

        {points.map(point => (
          <g key={point.key}>
            <circle cx={point.x} cy={point.y} r="3.6" className="ov-chart-point" />

            <text
              x={point.x}
              y={height - 8}
              textAnchor="middle"
              className="ov-chart-month"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
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
      return JSON.parse(localStorage.getItem('ventas_favorites') || '[]')
    } catch {
      return []
    }
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showExport, setShowExport] = useState(false)

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
      } else if (selectedId && !data.some(order => order.id === selectedId)) {
        setSelectedId(data[0]?.id ?? null)
      }
    } catch (e) {
      setError(e?.message || 'No se pudieron cargar los pedidos.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders(true)
  }, [])

  useEffect(() => {
    localStorage.setItem('ventas_favorites', JSON.stringify(favorites))
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

      const matchesSearch = !q || text.includes(q)
      const matchesStatus = status === 'Todos' || order.estado === status
      const matchesFavorite = !favoritesOnly || favorites.includes(order.id)

      return matchesSearch && matchesStatus && matchesFavorite
    })
  }, [orders, search, status, favoritesOnly, favorites])

  const selected = orders.find(order => order.id === selectedId) || null

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
      orders.map(order => order.cliente.trim().toLowerCase()).filter(Boolean)
    )

    return {
      total: orders.length,

      revenue: orders.reduce((sum, order) => sum + order.total, 0),

      monthRevenue: thisMonth.reduce((sum, order) => sum + order.total, 0),

      pending: orders.filter(order => order.estado === 'Pendiente').length,

      confirmed: orders.filter(order => order.estado === 'Confirmado').length,

      delivered: orders.filter(order => order.estado === 'Entregado').length,

      clients: uniqueClients.size,

      average:
        orders.length > 0
          ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length
          : 0,
    }
  }, [orders])

  const chart = useMemo(() => {
    const now = new Date()

    const months = Array.from({ length: 6 }, (_, index) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1)

      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: formatMonth(d),
        value: 0,
      }
    })

    for (const order of orders) {
      const d = new Date(order.fecha)

      if (Number.isNaN(d.getTime())) {
        continue
      }

      const item = months.find(
        month => month.key === `${d.getFullYear()}-${d.getMonth()}`
      )

      if (item) {
        item.value += order.total
      }
    }

    const max = Math.max(...months.map(month => month.value), 1)

    return { months, max }
  }, [orders])

  const grouped = useMemo(() => {
    if (groupBy === 'none') {
      return [{ key: '', label: '', rows: filtered }]
    }

    const map = new Map()

    filtered.forEach(order => {
      const key = groupBy === 'status' ? order.estado : order.cliente

      if (!map.has(key)) {
        map.set(key, [])
      }

      map.get(key).push(order)
    })

    return [...map.entries()].map(([key, rows]) => ({
      key,
      label: key,
      rows,
    }))
  }, [filtered, groupBy])

  const statusCounts = useMemo(() => {
    return STATUS.reduce((acc, item) => {
      acc[item] =
        item === 'Todos'
          ? orders.length
          : orders.filter(order => order.estado === item).length

      return acc
    }, {})
  }, [orders])

  function toggleFavorite(id) {
    setFavorites(current =>
      current.includes(id)
        ? current.filter(value => value !== id)
        : [...current, id]
    )
  }

  async function createOrder(event) {
    event.preventDefault()

    setSaveError('')

    const cliente = form.cliente.trim()
    const total = Number(form.total)

    if (!cliente) {
      setSaveError('El cliente es obligatorio.')
      return
    }

    if (!Number.isFinite(total) || total < 0) {
      setSaveError('El total debe ser un nÃºmero vÃ¡lido mayor o igual a 0.')
      return
    }

    setSaving(true)

    try {
      const payload = {
        cliente,
        total,

        observaciones: form.observaciones.trim() || null,

        ...(form.fecha
          ? {
              fecha: new Date(`${form.fecha}T12:00:00`).toISOString(),
            }
          : {}),
      }

      await ventasService.createOrder(payload)

      setShowCreate(false)

      setForm({
        cliente: '',
        total: '',
        fecha: '',
        observaciones: '',
      })

      await loadOrders(true)
    } catch (e) {
      setSaveError(e?.message || 'No se pudo crear el pedido.')
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(id, nextStatus) {
    setError('')

    try {
      await ventasService.updateOrderStatus(id, nextStatus)

      setOrders(current =>
        current.map(order =>
          order.id === id ? { ...order, estado: nextStatus } : order
        )
      )
    } catch (e) {
      setError(e?.message || 'No se pudo actualizar el estado.')
    }
  }

  function cleanText(value) {
    return String(value ?? '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function formatExportDate(value) {
    if (!value) return ''

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return cleanText(value)
    }

    return new Intl.DateTimeFormat('es-DO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  }

  function formatExportMoney(value) {
    const amount = Number(value || 0)

    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  function exportPdf(data = null) {
    const exportData = Array.isArray(data) ? data : filtered

    if (!exportData.length) {
      setError('No hay pedidos para exportar.')
      return
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    const totalVentas = exportData.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    )

    const pendientes = exportData.filter(
      order => order.estado === 'Pendiente'
    ).length

    const confirmados = exportData.filter(
      order => order.estado === 'Confirmado'
    ).length

    const enviados = exportData.filter(
      order => order.estado === 'Enviado'
    ).length

    const entregados = exportData.filter(
      order => order.estado === 'Entregado'
    ).length

    const cancelados = exportData.filter(
      order => order.estado === 'Cancelado'
    ).length

    const generatedAt = new Intl.DateTimeFormat('es-DO', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date())

    // Encabezado
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('ELY TECH STORE', 14, 18)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Tecnología para Empresas', 14, 24)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('REPORTE DE PEDIDOS DE VENTAS', 14, 36)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Generado: ${generatedAt}`, 14, 42)

    // Línea separadora
    doc.setLineWidth(0.4)
    doc.line(14, 46, pageWidth - 14, 46)

    // Resumen
    const summaryY = 55
    const boxWidth = (pageWidth - 28 - 16) / 5
    const boxHeight = 22

    const summary = [
      ['Pedidos', exportData.length],
      ['Total ventas', formatExportMoney(totalVentas)],
      ['Pendientes', pendientes],
      ['Confirmados', confirmados],
      ['Entregados', entregados],
    ]

    summary.forEach((item, index) => {
      const x = 14 + index * (boxWidth + 4)

      doc.setDrawColor(220, 224, 230)
      doc.setFillColor(248, 249, 251)
      doc.roundedRect(x, summaryY, boxWidth, boxHeight, 2, 2, 'FD')

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text(item[0], x + 4, summaryY + 7)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(String(item[1]), x + 4, summaryY + 15)
    })

    // Tabla
    const rows = exportData.map(order => [
      String(order.id ?? ''),
      cleanText(order.numero),
      cleanText(order.cliente),
      formatExportDate(order.fecha),
      cleanText(order.estado),
      formatExportMoney(order.total),
      cleanText(order.observaciones),
    ])

    autoTable(doc, {
      startY: 84,
      head: [[
        'ID',
        'PEDIDO',
        'CLIENTE',
        'FECHA',
        'ESTADO',
        'TOTAL',
        'OBSERVACIONES',
      ]],
      body: rows,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 3,
        valign: 'middle',
        overflow: 'linebreak',
      },
      headStyles: {
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
        fillColor: [31, 41, 55],
        textColor: [255, 255, 255],
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 40 },
        2: { cellWidth: 45 },
        3: { cellWidth: 28, halign: 'center' },
        4: { cellWidth: 30, halign: 'center' },
        5: { cellWidth: 32, halign: 'right' },
        6: { cellWidth: 'auto' },
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 4) {
          data.cell.styles.fontStyle = 'bold'
        }

        if (data.section === 'body' && data.column.index === 5) {
          data.cell.styles.fontStyle = 'bold'
        }
      },
      didDrawPage: function () {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)

        doc.text(
          'ELY TECH STORE · Reporte de pedidos',
          14,
          pageHeight - 8
        )

        doc.text(
          `Página ${doc.internal.getNumberOfPages()}`,
          pageWidth - 14,
          pageHeight - 8,
          { align: 'right' }
        )
      },
      margin: {
        left: 14,
        right: 14,
        bottom: 14,
      },
    })

    // Resumen final
    const finalY =
      typeof doc.lastAutoTable?.finalY === 'number'
        ? doc.lastAutoTable.finalY + 10
        : pageHeight - 25

    if (finalY < pageHeight - 15) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(
        `Resumen de estados: Pendientes ${pendientes} · Confirmados ${confirmados} · Enviados ${enviados} · Entregados ${entregados} · Cancelados ${cancelados}`,
        14,
        finalY
      )
    }

    const filenameDate = new Intl.DateTimeFormat('es-DO')
      .format(new Date())
      .replaceAll('/', '-')

    doc.save(`Reporte_Pedidos_${filenameDate}.pdf`)

    setShowExport(false)
    setError('')
  }
  async function importCsv(file) {
    if (!file) return

    setImporting(true)
    setError('')

    try {
      const text = await file.text()

      const lines = text.split(/\r?\n/).filter(Boolean)

      if (lines.length < 2) {
        throw new Error('El CSV debe tener encabezado y al menos un registro.')
      }

      const headers = lines[0]
        .split(',')
        .map(header => header.trim().replace(/^"|"$/g, '').toLowerCase())

      const indexOf = name => headers.indexOf(name)

      if (indexOf('cliente') === -1 || indexOf('total') === -1) {
        throw new Error('El CSV necesita las columnas: cliente,total.')
      }

      for (const line of lines.slice(1)) {
        const columns = line
          .split(',')
          .map(value =>
            value.trim().replace(/^"|"$/g, '').replaceAll('""', '"')
          )

        const cliente = columns[indexOf('cliente')]
        const total = Number(columns[indexOf('total')])

        if (!cliente || !Number.isFinite(total)) {
          continue
        }

        await ventasService.createOrder({
          cliente,
          total,

          fecha:
            indexOf('fecha') >= 0 && columns[indexOf('fecha')]
              ? columns[indexOf('fecha')]
              : undefined,

          observaciones:
            indexOf('observaciones') >= 0
              ? columns[indexOf('observaciones')] || null
              : null,
        })
      }

      setShowImport(false)

      await loadOrders(true)
    } catch (e) {
      setError(e?.message || 'No se pudo importar el archivo.')
    } finally {
      setImporting(false)

      if (importRef.current) {
        importRef.current.value = ''
      }
    }
  }

  return (
    <div className="ov-page">
      {/* TOPBAR */}
      <header className="ov-topbar">
        <div className="ov-crumb">
          <span>Ventas</span>
          <span className="ov-crumb-sep">/</span>
          <strong>Pedidos de ventas</strong>
        </div>

        <div className="ov-top-search">
          <SearchIcon />

          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar pedidos, clientes..."
          />

          <kbd>Ctrl K</kbd>
        </div>

        <div className="ov-top-actions">
          <button
            type="button"
            className="ov-icon-btn"
            title="Actualizar"
            onClick={() => loadOrders(false)}
          >
            <RefreshIcon />
          </button>

          <button type="button" className="ov-icon-btn" title="MÃ¡s opciones">
            <MoreIcon />
          </button>

          <div className="ov-user">
            <span className="ov-avatar">E</span>
            <ChevronIcon />
          </div>
        </div>
      </header>

      {/* ALERT */}
      {error && (
        <div className="ov-alert">
          <div>
            <strong>OcurriÃ³ un problema</strong>
            <span>{error}</span>
          </div>

          <button type="button" onClick={() => setError('')}>
            Ã—
          </button>
        </div>
      )}

      <div className="ov-title-row">
        <div>
          <p className="ov-eyebrow">GestiÃ³n comercial</p>
          <h1>Pedidos de ventas</h1>
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="ov-actionbar">
        <div className="ov-actionbar-left">
          <button
            type="button"
            className="ov-btn ov-btn-primary"
            onClick={() => {
              setSaveError('')
              setShowCreate(true)
            }}
          >
            <PlusIcon />
            Nuevo
          </button>

          <button
            type="button"
            className="ov-btn"
            onClick={() => setShowImport(true)}
          >
            <UploadIcon />
            Importar
          </button>

          <button type="button" className="ov-btn" onClick={() => exportPdf()}>
            <DownloadIcon />
            Exportar PDF
          </button>
        </div>

        <div className="ov-actionbar-right">
          <div className="ov-select-wrap">
            <FilterIcon />

            <select
              className="ov-select"
              value={status}
              onChange={event => setStatus(event.target.value)}
            >
              {STATUS.map(item => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <ChevronIcon />
          </div>

          <div className="ov-select-wrap">
            <GroupIcon />

            <select
              className="ov-select"
              value={groupBy}
              onChange={event => setGroupBy(event.target.value)}
            >
              <option value="none">Agrupar por</option>
              <option value="status">Estado</option>
              <option value="client">Cliente</option>
            </select>

            <ChevronIcon />
          </div>

          <button
            type="button"
            className={`ov-fav-toggle ${favoritesOnly ? 'active' : ''}`}
            onClick={() => setFavoritesOnly(value => !value)}
          >
            <StarIcon active={favoritesOnly} />
            Favoritos
          </button>
        </div>
      </div>

      {/* STATUS TABS */}
      <nav className="ov-status-tabs">
        {STATUS.map(item => (
          <button
            key={item}
            type="button"
            className={status === item ? 'active' : ''}
            onClick={() => setStatus(item)}
          >
            {item}
            <span>{statusCounts[item]}</span>
          </button>
        ))}
      </nav>

      <main className="ov-layout">
        <div className="ov-main">
          {/* KPIs */}
          <section className="ov-kpis">
            <article className="ov-kpi ov-kpi-highlight">
              <div className="ov-kpi-top">
                <span className="ov-kpi-label">Ventas este mes</span>
                <span className="ov-kpi-icon"><TrendIcon /></span>
              </div>

              <strong className="ov-kpi-value">{money(stats.monthRevenue)}</strong>

              <div className="ov-kpi-foot">
                <span className="ov-kpi-up">â†‘</span>
                respecto al perÃ­odo anterior
              </div>
            </article>

            <article className="ov-kpi">
              <div className="ov-kpi-top">
                <span className="ov-kpi-label">Pedidos</span>
                <span className="ov-kpi-icon ov-kpi-icon-blue"><OrdersIcon /></span>
              </div>

              <strong className="ov-kpi-value">{stats.total}</strong>

              <div className="ov-kpi-foot">
                <strong>{stats.pending}</strong>&nbsp;pendientes
              </div>
            </article>

            <article className="ov-kpi">
              <div className="ov-kpi-top">
                <span className="ov-kpi-label">Ventas acumuladas</span>
                <span className="ov-kpi-icon ov-kpi-icon-orange"><WalletIcon /></span>
              </div>

              <strong className="ov-kpi-value">{money(stats.revenue)}</strong>

              <div className="ov-kpi-foot">
                Ticket promedio&nbsp;<strong>{money(stats.average)}</strong>
              </div>
            </article>

            <article className="ov-kpi">
              <div className="ov-kpi-top">
                <span className="ov-kpi-label">Clientes</span>
                <span className="ov-kpi-icon ov-kpi-icon-green"><UsersIcon /></span>
              </div>

              <strong className="ov-kpi-value">{stats.clients}</strong>

              <div className="ov-kpi-foot">Clientes con pedidos</div>
            </article>
          </section>

          {/* DASHBOARD: chart + status summary */}
          <section className="ov-dashboard">
            <article className="ov-card ov-chart-card">
              <div className="ov-card-head">
                <div>
                  <h2>Ventas por mes</h2>
                  <p>Ãšltimos 6 meses</p>
                </div>

                <div className="ov-chart-total">{money(stats.revenue)}</div>
              </div>

              <SalesChart data={chart} />
            </article>

            <article className="ov-card ov-status-card">
              <div className="ov-card-head">
                <div>
                  <h2>Estado de pedidos</h2>
                  <p>Resumen de tu operaciÃ³n</p>
                </div>
              </div>

              <div className="ov-status-summary">
                {STATUS.filter(item => item !== 'Todos').map(item => {
                  const count = statusCounts[item]

                  const percentage =
                    stats.total > 0 ? Math.round((count / stats.total) * 100) : 0

                  return (
                    <button
                      key={item}
                      type="button"
                      className="ov-status-row"
                      onClick={() => setStatus(item)}
                    >
                      <div className="ov-status-row-top">
                        <StatusBadge status={item} />
                        <strong>{count}</strong>
                      </div>

                      <div className="ov-status-progress">
                        <span style={{ width: `${percentage}%` }} />
                      </div>
                    </button>
                  )
                })}
              </div>
            </article>
          </section>

          {/* TABLE */}
          <section className="ov-card ov-table-card">
            <div className="ov-table-card-head">
              <h2>Pedidos</h2>
              <span className="ov-count">{filtered.length}</span>
            </div>

            {loading ? (
              <div className="ov-table-state">
                <div className="ov-spinner" />
                <strong>Cargando pedidos</strong>
                <span>Consultando la base de datos...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="ov-table-state">
                <div className="ov-empty-icon">
                  <PlusIcon />
                </div>

                <strong>No hay pedidos</strong>
                <span>No encontramos pedidos con los filtros seleccionados.</span>

                <button
                  type="button"
                  className="ov-btn ov-btn-primary"
                  onClick={() => {
                    setSaveError('')
                    setShowCreate(true)
                  }}
                >
                  <PlusIcon />
                  Crear pedido
                </button>
              </div>
            ) : (
              <div className="ov-table-scroll">
                {grouped.map(group => (
                  <div key={group.key || 'all'} className="ov-group">
                    {group.label && (
                      <div className="ov-group-head">
                        <strong>{group.label}</strong>
                        <span>{group.rows.length}</span>
                      </div>
                    )}

                    <table className="ov-table">
                      <thead>
                        <tr>
                          <th className="ov-col-fav">
                            <span className="ov-sr-only">Favorito</span>
                          </th>

                          <th>Pedido</th>
                          <th>Cliente</th>
                          <th>Fecha</th>
                          <th>Estado</th>
                          <th className="ov-col-amount">Total</th>

                          <th className="ov-col-actions">
                            <span className="ov-sr-only">Acciones</span>
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {group.rows.map(order => {
                          const isSelected = selectedId === order.id
                          const isFavorite = favorites.includes(order.id)

                          return (
                            <tr
                              key={order.id}
                              className={isSelected ? 'ov-row-selected' : ''}
                              onClick={() => setSelectedId(order.id)}
                            >
                              <td className="ov-col-fav">
                                <button
                                  type="button"
                                  className={`ov-star-btn ${isFavorite ? 'active' : ''}`}
                                  onClick={event => {
                                    event.stopPropagation()
                                    toggleFavorite(order.id)
                                  }}
                                  title="Favorito"
                                >
                                  <StarIcon active={isFavorite} />
                                </button>
                              </td>

                              <td className="ov-order-number">
                                <strong>{order.numero}</strong>
                              </td>

                              <td>
                                <div className="ov-client">
                                  <span className="ov-client-avatar">
                                    {order.cliente?.charAt(0)?.toUpperCase() || '?'}
                                  </span>

                                  <span className="ov-client-name">{order.cliente}</span>
                                </div>
                              </td>

                              <td className="ov-date">{formatDate(order.fecha)}</td>

                              <td>
                                <StatusBadge status={order.estado} />
                              </td>

                              <td className="ov-amount">{money(order.total)}</td>

                              <td className="ov-col-actions">
                                <select
                                  className="ov-row-select"
                                  value={order.estado}
                                  onClick={event => event.stopPropagation()}
                                  onChange={event =>
                                    changeStatus(order.id, event.target.value)
                                  }
                                >
                                  {STATUS.filter(value => value !== 'Todos').map(
                                    value => (
                                      <option key={value} value={value}>
                                        {value}
                                      </option>
                                    )
                                  )}
                                </select>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* DETAIL PANEL */}
        <aside className="ov-detail">
          {selected ? (
            <>
              <div className="ov-detail-head">
                <div>
                  <span>Pedido</span>
                  <h2>{selected.numero}</h2>
                </div>

                <button
                  type="button"
                  className="ov-detail-close"
                  onClick={() => setSelectedId(null)}
                  title="Cerrar"
                >
                  Ã—
                </button>
              </div>

              <div className="ov-detail-status">
                <StatusBadge status={selected.estado} />
              </div>

              <div className="ov-detail-total">
                <span>Total del pedido</span>
                <strong>{money(selected.total)}</strong>
              </div>

              <div className="ov-detail-section">
                <h3>InformaciÃ³n</h3>

                <div className="ov-detail-row">
                  <span>Cliente</span>
                  <strong>{selected.cliente}</strong>
                </div>

                <div className="ov-detail-row">
                  <span>Fecha del pedido</span>
                  <strong>{formatDate(selected.fecha)}</strong>
                </div>

                <div className="ov-detail-row">
                  <span>Fecha de creaciÃ³n</span>
                  <strong>{formatDate(selected.fechaCreacion)}</strong>
                </div>
              </div>

              <div className="ov-detail-section">
                <h3>Cambiar estado</h3>

                <div className="ov-select-wrap ov-detail-select">
                  <select
                    className="ov-select"
                    value={selected.estado}
                    onChange={event => changeStatus(selected.id, event.target.value)}
                  >
                    {STATUS.filter(value => value !== 'Todos').map(value => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>

                  <ChevronIcon />
                </div>
              </div>

              <div className="ov-detail-section">
                <h3>Observaciones</h3>

                <div className="ov-notes">
                  {selected.observaciones || 'Sin observaciones para este pedido.'}
                </div>
              </div>

              <div className="ov-detail-foot">
                <button
                  type="button"
                  className="ov-btn ov-btn-block"
                  onClick={() => toggleFavorite(selected.id)}
                >
                  <StarIcon active={favorites.includes(selected.id)} />

                  {favorites.includes(selected.id)
                    ? 'Quitar de favoritos'
                    : 'AÃ±adir a favoritos'}
                </button>
              </div>
            </>
          ) : (
            <div className="ov-detail-empty">
              <div className="ov-empty-icon">
                <OrdersIcon />
              </div>

              <strong>NingÃºn pedido seleccionado</strong>
              <span>Elige un pedido de la tabla para ver su detalle aquÃ­.</span>
            </div>
          )}
        </aside>
      </main>

      {/* CREATE MODAL */}
      {showCreate && (
        <div
          className="ov-modal-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              setShowCreate(false)
            }
          }}
        >
          <form
            className="ov-modal ov-modal-create"
            onSubmit={createOrder}
          >
            <div className="ov-modal-head">
              <div>
                <span>Ventas</span>
                <h2>Nuevo pedido</h2>
              </div>

              <button
                type="button"
                className="ov-modal-close"
                onClick={() => setShowCreate(false)}
              >
                Ã—
              </button>
            </div>

            <div className="ov-modal-body">
              {saveError &&
                !/cliente/i.test(saveError) &&
                !/total/i.test(saveError) && (
                  <div className="ov-form-error">{saveError}</div>
                )}

              {/* CLIENTE */}
              <label className="ov-field ov-field-lg">
                <span>
                  Cliente <em className="ov-required">*</em>
                </span>

                <div
                  className={`ov-client-input ${
                    /cliente/i.test(saveError) ? 'ov-field-invalid' : ''
                  }`}
                >
                  <SearchIcon />

                  <input
                    value={form.cliente}
                    onChange={event =>
                      setForm(current => ({
                        ...current,
                        cliente: event.target.value,
                      }))
                    }
                    placeholder="Buscar o escribir el nombre del cliente..."
                    autoFocus
                  />
                </div>

                {/cliente/i.test(saveError) && (
                  <span className="ov-field-hint">
                    <span className="ov-hint-icon">!</span>
                    {saveError}
                  </span>
                )}
              </label>

              {/* INFORMACIÃ“N DEL PEDIDO */}
              <div className="ov-form-section">
                <h3>InformaciÃ³n del pedido</h3>

                <div className="ov-form-grid">
                  <label className="ov-field">
                    <span>Fecha del pedido</span>

                    <input
                      type="date"
                      value={form.fecha}
                      onChange={event =>
                        setForm(current => ({
                          ...current,
                          fecha: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="ov-field">
                    <span>Estado</span>

                    <div className="ov-static-field">
                      <StatusBadge status="Pendiente" />
                    </div>
                  </label>

                  <label className="ov-field ov-field-full">
                    <span>Referencia / Pedido</span>

                    <div className="ov-static-field ov-static-muted">
                      El nÃºmero de pedido serÃ¡ generado automÃ¡ticamente
                    </div>
                  </label>
                </div>
              </div>

              {/* TOTAL */}
              <div className="ov-form-section">
                <label className="ov-field">
                  <span>
                    Total del pedido <em className="ov-required">*</em>
                  </span>

                  <div
                    className={`ov-money-input ov-money-input-lg ${
                      /total/i.test(saveError) ? 'ov-field-invalid' : ''
                    }`}
                  >
                    <span>RD$</span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.total}
                      onChange={event =>
                        setForm(current => ({
                          ...current,
                          total: event.target.value,
                        }))
                      }
                      placeholder="0.00"
                    />
                  </div>

                  {/total/i.test(saveError) && (
                    <span className="ov-field-hint">
                      <span className="ov-hint-icon">!</span>
                      {saveError}
                    </span>
                  )}
                </label>
              </div>

              {/* RESUMEN */}
              <div className="ov-order-summary">
                <h3>Resumen del pedido</h3>

                <div className="ov-summary-row">
                  <span>Cliente</span>
                  <strong>{form.cliente.trim() || 'â€”'}</strong>
                </div>

                <div className="ov-summary-row">
                  <span>Fecha</span>
                  <strong>{form.fecha ? formatDate(form.fecha) : 'â€”'}</strong>
                </div>

                <div className="ov-summary-row ov-summary-total">
                  <span>Total</span>
                  <strong>{money(Number(form.total) || 0)}</strong>
                </div>
              </div>

              {/* OBSERVACIONES */}
              <label className="ov-field ov-field-lg">
                <span>Observaciones</span>

                <textarea
                  rows="4"
                  value={form.observaciones}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      observaciones: event.target.value,
                    }))
                  }
                  placeholder="Agrega informaciÃ³n adicional sobre este pedido..."
                />
              </label>
            </div>

            <div className="ov-modal-actions">
              <button
                type="button"
                className="ov-btn"
                onClick={() => setShowCreate(false)}
              >
                Cancelar
              </button>

              <button type="submit" className="ov-btn ov-btn-primary" disabled={saving}>
                {saving ? 'Creando pedido...' : 'Crear pedido'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* IMPORT MODAL */}
      {showImport && (
        <div
          className="ov-modal-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              setShowImport(false)
            }
          }}
        >
          <div className="ov-modal ov-modal-import">
            <div className="ov-modal-head">
              <div>
                <span>Ventas</span>
                <h2>Importar pedidos</h2>
              </div>

              <button
                type="button"
                className="ov-modal-close"
                onClick={() => setShowImport(false)}
              >
                Ã—
              </button>
            </div>

            <div className="ov-import-info">
              <div className="ov-import-icon">
                <UploadIcon />
              </div>

              <div>
                <strong>Importa tus pedidos</strong>

                <p>
                  Selecciona un archivo CSV con las columnas
                  <strong> cliente</strong> y <strong>total</strong>.
                </p>
              </div>
            </div>

            <input
              ref={importRef}
              className="ov-file-input"
              type="file"
              accept=".csv,text/csv"
              disabled={importing}
              onChange={event => importCsv(event.target.files?.[0])}
            />

            {importing && (
              <div className="ov-import-loading">
                <div className="ov-spinner" />
                Importando pedidos...
              </div>
            )}

            <div className="ov-modal-actions">
              <button
                type="button"
                className="ov-btn"
                disabled={importing}
                onClick={() => setShowImport(false)}
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






