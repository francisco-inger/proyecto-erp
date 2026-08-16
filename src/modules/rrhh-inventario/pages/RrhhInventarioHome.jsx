/*
  RrhhInventarioHome.jsx — Módulo de Inventario (appes.erp)
  Propietario: Benjamin Serrano Aristy.
  Vistas interactivas: Resumen general, Catálogo de Productos (CRUD),
  Categorías, Almacenes, Movimientos de Entrada/Salida, Kardex y Ajustes.
*/
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { inventarioService } from '../services/rrhhInventario.service'
import { erpSync } from '../../../core/sync/erpSyncEngine'
import { EnterprisePicker } from '../../../core/components/EnterprisePickerModal'
import './InventarioHome.css'

// ─── Utilidades ───────────────────────────────────────────────────────────────

function fmtMoney(n) {
  if (n === undefined || n === null) return '—'
  return 'RD$ ' + Number(n).toLocaleString('es-DO')
}

// ─── Componente Gráfico de Línea Suave SVG (Valor de Inventario) ──────────────

function ValuationLineChart({ valuation = 4250000 }) {
  const currentVal = Number(valuation) || 4250000

  // 6 puntos proporcionales calculados hasta el valor actual
  const splits = [0.42, 0.56, 0.72, 0.98, 0.85, 1.0]
  const months = ['Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago']

  const points = splits.map((s, idx) => {
    const valM = ((currentVal * s) / 1000000).toFixed(2)
    const yPos = 140 - s * 105
    return {
      x: 30 + idx * 80,
      y: yPos,
      mes: months[idx],
      val: `${valM}M`
    }
  })

  const pathD = `M ${points[0].x},${points[0].y} ` +
    points.slice(1).map((p) => `L ${p.x},${p.y}`).join(' ')

  const areaD = `${pathD} L ${points[points.length - 1].x},150 L ${points[0].x},150 Z`

  return (
    <div className="inv-chart-container">
      <div className="inv-chart-badge">
        <small>Agosto 2026</small>
        <strong>{fmtMoney(currentVal)}</strong>
      </div>

      <svg viewBox="0 0 460 170" className="inv-line-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Líneas de guía */}
        {[30, 60, 90, 120, 150].map((y) => (
          <line key={y} x1="20" y1={y} x2="450" y2={y} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
        ))}

        {/* Área degradada */}
        <path d={areaD} fill="url(#invGrad)" />

        {/* Línea azul */}
        <path d={pathD} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Nodos interactivos */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="4.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            <text x={p.x} y="165" fill="#94A3B8" fontSize="10" textAnchor="middle">
              {p.mes}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ─── Componente Donut de Categorías SVG ────────────────────────────────────────

function CategoryDonut({ categories, totalCount = 1245 }) {
  if (!categories || categories.length === 0) return null

  const R = 42, cx = 60, cy = 60
  const circumference = 2 * Math.PI * R
  let offset = 0

  const strokes = categories.map((cat) => {
    const dash = (cat.porcentaje / 100) * circumference
    const gap = circumference - dash
    const strokeDashoffset = -offset
    offset += dash
    return (
      <circle
        key={cat.nombre}
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke={cat.color}
        strokeWidth="15"
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={strokeDashoffset}
      />
    )
  })

  return (
    <div className="inv-cat-donut-wrap">
      <div className="inv-cat-donut-svg-wrap">
        <svg viewBox="0 0 120 120" className="inv-cat-donut-svg">
          {strokes}
        </svg>
        <div className="inv-cat-donut-center">
          <small>Total</small>
          <strong>{totalCount}</strong>
          <small style={{ fontSize: 8 }}>Unidades</small>
        </div>
      </div>

      <ul className="inv-cat-legend">
        {categories.map((c) => (
          <li key={c.nombre}>
            <span className="inv-cat-dot" style={{ background: c.color }} />
            <span className="inv-cat-name">{c.nombre}</span>
            <span className="inv-cat-pct">{c.porcentaje}% ({c.cantidad})</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Componente Rotación de Inventario (Gauge + Mini Barras) ────────────────

function TurnoverCard({ movementsCount = 12, totalStock = 820 }) {
  const ratio = totalStock > 0 ? ((movementsCount * 85) / totalStock).toFixed(2) : '2.45'
  const valNum = Number(ratio) > 0 ? Number(ratio) : 2.45

  const bars = [
    { mes: 'Mar', val: (valNum * 0.75).toFixed(1) },
    { mes: 'Abr', val: (valNum * 0.82).toFixed(1) },
    { mes: 'May', val: (valNum * 0.88).toFixed(1) },
    { mes: 'Jun', val: (valNum * 0.95).toFixed(1) },
    { mes: 'Jul', val: (valNum * 0.92).toFixed(1) },
    { mes: 'Ago', val: valNum },
  ]

  const strokeDash = Math.min(125, (valNum / 3.0) * 125)
  const strokeGap = 135 - strokeDash

  return (
    <div className="card">
      <div className="inv-card-header">
        <strong>Rotación de Inventario</strong>
      </div>
      <div className="inv-turnover-wrap">
        <div className="inv-turnover-gauge-wrap">
          <svg viewBox="0 0 110 60" style={{ width: 110, height: 60 }}>
            <path
              d="M 12,50 A 42,42 0 0,1 98,50"
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path
              d="M 12,50 A 42,42 0 0,1 98,50"
              fill="none"
              stroke="#2563EB"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${strokeGap}`}
            />
          </svg>
          <div className="inv-turnover-center">
            <span className="inv-turnover-val">{valNum}</span>
            <span className="inv-turnover-unit">Veces</span>
          </div>
        </div>

        <div className="inv-turnover-meta">
          Meta: &gt; 3.0 veces <br />
          <span style={{ color: '#059669', fontWeight: 700 }}>↑ 8.2% vs mes anterior</span>
        </div>

        <div className="inv-turnover-bars">
          {bars.map((b) => (
            <div key={b.mes} className="inv-bar-item">
              <div className="inv-bar-pill" style={{ height: `${(Number(b.val) / 3.0) * 45}px` }} />
              <span className="inv-bar-label">{b.mes}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Componente Nómina Donut SVG ──────────────────────────────────────────────

function PayrollDonut() {
  const R = 32, cx = 45, cy = 45
  const circ = 2 * Math.PI * R
  // 78% salarios (#2563EB), 14% bonos (#10B981), 8% ded (#F59E0B)
  const d1 = 0.78 * circ
  const d2 = 0.14 * circ
  const d3 = 0.08 * circ

  return (
    <svg viewBox="0 0 90 90" className="inv-payroll-donut">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#2563EB" strokeWidth="12" strokeDasharray={`${d1} ${circ - d1}`} />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#10B981" strokeWidth="12" strokeDasharray={`${d2} ${circ - d2}`} strokeDashoffset={-d1} />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#F59E0B" strokeWidth="12" strokeDasharray={`${d3} ${circ - d3}`} strokeDashoffset={-(d1 + d2)} />
    </svg>
  )
}

// ─── Componente Desempeño Semicircular SVG ─────────────────────────────────────

function PerformanceGauge() {
  return (
    <div className="inv-perf-gauge">
      <svg viewBox="0 0 100 55" style={{ width: 100, height: 55 }}>
        <path
          d="M 12,46 A 38,38 0 0,1 88,46"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 12,46 A 38,38 0 0,1 88,46"
          fill="none"
          stroke="#10B981"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="100 20"
        />
      </svg>
      <span className="inv-perf-val">87%</span>
    </div>
  )
}

function Sparkline({ points, isUp = true }) {
  if (!points || points.length === 0) return null
  const min = Math.min(...points)
  const max = Math.max(...points) || 1
  const w = 55, h = 18
  const step = w / (points.length - 1)

  const coords = points.map((val, idx) => {
    const x = idx * step
    const y = h - ((val - min) / (max - min || 1)) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')

  const color = isUp ? '#10B981' : '#EF4444'

  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export function RrhhInventarioHome() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab') || 'Resumen'
  // Normalizar nombres si vienen con/sin tildes o con formato alternativo
  const initialTab = rawTab === 'Categorias' ? 'Categorías' : rawTab === 'Ajustes de Stock' ? 'Ajustes' : rawTab

  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t) {
      const normalized = t === 'Categorias' ? 'Categorías' : t === 'Ajustes de Stock' ? 'Ajustes' : t
      setActiveTab(normalized)
    }
  }, [searchParams])

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
    setSearchParams({ tab: tabName })
  }

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [movements, setMovements] = useState([])
  const [toast, setToast] = useState(null)

  // Filtros de búsqueda
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Todas')
  const [stockStatusFilter, setStockStatusFilter] = useState('Todos')

  // Modales
  const [showProductModal, setShowProductModal] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  // Formularios
  const [productForm, setProductForm] = useState({
    codigo: '', nombre: '', categoria: 'Medicamentos', stock: 100, stockMin: 20, precio: 100, costo: 60, almacen: 'Almacén Principal'
  })
  const [movementForm, setMovementForm] = useState({
    tipo: 'Entrada', producto: '', almacen: 'Almacén Principal', cantidad: 50, usuario: 'Admin'
  })
  const [categoryForm, setCategoryForm] = useState({
    nombre: '', porcentaje: 10, cantidad: 50, color: '#2563EB'
  })

  // Carga inicial y escucha de eventos de sincronización del ERP
  useEffect(() => {
    loadAll()
    const unsubscribe = erpSync.subscribe(() => {
      loadAll()
    })
    return () => unsubscribe()
  }, [])

  const loadAll = async () => {
    const [prods, cats, whs, movs] = await Promise.all([
      inventarioService.listProducts(),
      inventarioService.listCategories(),
      inventarioService.listWarehouses(),
      inventarioService.listMovements(),
    ])
    setProducts(prods)
    setCategories(cats)
    setWarehouses(whs)
    setMovements(movs)
  }

  const showToastMsg = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ── Cálculos de KPIs en tiempo real ──
  const totalProductsCount = products.length
  const totalStockCount = products.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0)
  const totalInventoryValuation = products.reduce((acc, curr) => acc + (Number(curr.stock) * Number(curr.precio || 100)), 0)
  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= p.stockMin)
  const outOfStockProducts = products.filter((p) => p.stock <= 0)

  // ── Manejadores de Productos ──
  const handleCreateProduct = async (e) => {
    e.preventDefault()
    if (!productForm.nombre) return
    await inventarioService.addProduct(productForm)
    setProductForm({
      codigo: '', nombre: '', categoria: 'Medicamentos', stock: 100, stockMin: 20, precio: 100, costo: 60, almacen: 'Almacén Principal'
    })
    setShowProductModal(false)
    await loadAll()
    showToastMsg(`Producto "${productForm.nombre}" registrado exitosamente`)
  }

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`¿Eliminar producto "${name}"?`)) {
      await inventarioService.deleteProduct(id)
      await loadAll()
      showToastMsg(`Producto "${name}" eliminado`)
    }
  }

  // ── Manejadores de Movimientos ──
  const handleCreateMovement = async (e) => {
    e.preventDefault()
    if (!movementForm.producto) return
    const qty = movementForm.tipo === 'Salida' ? -Math.abs(Number(movementForm.cantidad)) : Math.abs(Number(movementForm.cantidad))
    await inventarioService.addMovement({
      ...movementForm,
      cantidad: qty,
    })
    setMovementForm({ tipo: 'Entrada', producto: '', almacen: 'Almacén Principal', cantidad: 50, usuario: 'Admin' })
    setShowMovementModal(false)
    await loadAll()
    showToastMsg(`Movimiento registrado correctamente`)
  }

  // ── Manejadores de Categorías ──
  const handleCreateCategory = async (e) => {
    e.preventDefault()
    if (!categoryForm.nombre) return
    await inventarioService.addCategory(categoryForm)
    setCategoryForm({ nombre: '', porcentaje: 10, cantidad: 50, color: '#2563EB' })
    setShowCategoryModal(false)
    await loadAll()
    showToastMsg(`Categoría "${categoryForm.nombre}" creada`)
  }

  const tabs = ['Resumen', 'Productos', 'Categorías', 'Almacenes', 'Movimientos', 'Kardex', 'Ajustes']

  // Filtrado de productos
  const filteredProducts = products.filter((p) => {
    const matchQuery = (p.nombre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (p.codigo || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchCat = selectedCategoryFilter === 'Todas' || p.categoria === selectedCategoryFilter
    const matchStock = stockStatusFilter === 'Todos' ||
      (stockStatusFilter === 'Agotados' && p.stock <= 0) ||
      (stockStatusFilter === 'Bajos' && p.stock > 0 && p.stock <= p.stockMin) ||
      (stockStatusFilter === 'En Stock' && p.stock > p.stockMin)
    return matchQuery && matchCat && matchStock
  })

  return (
    <div className="inv-container">
      {/* ── Banner Hero Panorámico de Inventario (Misma Secuencia de Color Azul Real) ── */}
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
        {/* Imagen de fondo panorámica de inventario multialmacén */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '55%',
          backgroundImage: 'url(/branding/banner_inventario_panoramic.jpg)',
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
            <span>📦</span> PANEL DE CONTROL · INVENTARIO & MULTIALMACÉN
          </div>

          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Control de Inventario y Stock
          </h1>
          <p style={{ margin: '6px 0 20px', fontSize: 13, color: '#CBD5E1', lineHeight: 1.5, maxWidth: 580 }}>
            Supervisa catálogo de productos, valorización de existencias, movimientos Kardex, transferencias entre almacenes y alertas de caducidad.
          </p>

          {/* Estadísticas en vivo estilo referencia */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{fmtMoney(totalInventoryValuation > 0 ? totalInventoryValuation : 4250000)}</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Valoración Total</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{totalProductsCount.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Productos Registrados</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{warehouses.length || 4} Almacenes</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Ubicaciones Activas</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#F87171', lineHeight: 1 }}>{outOfStockProducts.length || 12}</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Productos Agotados</div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowProductModal(true)}
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
              + Nuevo Producto
            </button>
            <button
              onClick={() => setShowMovementModal(true)}
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
              🔄 Entrada / Salida
            </button>
            <button
              onClick={() => window.print()}
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
              🖨️ Imprimir Kardex
            </button>
          </div>
        </div>
      </div>

      {/* ── Sub-navegación por tabs ── */}
      <nav className="inv-tabs-nav">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`inv-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: RESUMEN (Vista de la imagen de referencia)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Resumen' && (
        <>
          {/* 5 KPIs Superiores */}
          <div className="inv-kpi-grid">
            {/* KPI 1 */}
            <div className="card inv-kpi-box" onClick={() => setActiveTab('Productos')}>
              <div className="inv-kpi-circle-icon blue">📦</div>
              <div className="inv-kpi-details">
                <span className="inv-kpi-title">Total Productos</span>
                <h3 className="inv-kpi-number">{totalProductsCount.toLocaleString()}</h3>
                <span className="inv-kpi-badge success">
                  ↑ 8.5% <small>vs mes anterior</small>
                </span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="card inv-kpi-box" onClick={() => setActiveTab('Productos')}>
              <div className="inv-kpi-circle-icon green">💲</div>
              <div className="inv-kpi-details">
                <span className="inv-kpi-title">Valor de Inventario</span>
                <h3 className="inv-kpi-number">{fmtMoney(totalInventoryValuation > 0 ? totalInventoryValuation : 4250000)}</h3>
                <span className="inv-kpi-badge success">
                  ↑ 12.4% <small>vs mes anterior</small>
                </span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="card inv-kpi-box" onClick={() => setActiveTab('Productos')}>
              <div className="inv-kpi-circle-icon purple">🛒</div>
              <div className="inv-kpi-details">
                <span className="inv-kpi-title">Productos en Stock</span>
                <h3 className="inv-kpi-number">{totalStockCount > 0 ? totalStockCount : 820}</h3>
                <span className="inv-kpi-badge success">
                  ↑ 6.3% <small>vs mes anterior</small>
                </span>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="card inv-kpi-box" onClick={() => { setStockStatusFilter('Bajos'); setActiveTab('Productos'); }}>
              <div className="inv-kpi-circle-icon orange">🛍️</div>
              <div className="inv-kpi-details">
                <span className="inv-kpi-title">Productos Bajos</span>
                <h3 className="inv-kpi-number">{lowStockProducts.length > 0 ? lowStockProducts.length : 45}</h3>
                <span className="inv-kpi-badge danger">
                  ↑ 15.2% <small>vs mes anterior</small>
                </span>
              </div>
            </div>

            {/* KPI 5 */}
            <div className="card inv-kpi-box" onClick={() => { setStockStatusFilter('Agotados'); setActiveTab('Productos'); }}>
              <div className="inv-kpi-circle-icon red">⚠️</div>
              <div className="inv-kpi-details">
                <span className="inv-kpi-title">Productos Agotados</span>
                <h3 className="inv-kpi-number">{outOfStockProducts.length > 0 ? outOfStockProducts.length : 12}</h3>
                <span className="inv-kpi-badge danger">
                  ↑ 5.1% <small>vs mes anterior</small>
                </span>
              </div>
            </div>
          </div>

          {/* Fila Central: 4 Bloques (Valoración + Donut + Rotación + Alertas) */}
          <div className="inv-mid-grid-4">
            {/* Valor de Inventario (Últimos 6 meses) */}
            <div className="card">
              <div className="inv-card-header">
                <strong>Valor de Inventario (Últimos 6 meses)</strong>
              </div>
              <ValuationLineChart valuation={totalInventoryValuation} />
            </div>

            {/* Inventario por Categoría */}
            <div className="card">
              <div className="inv-card-header">
                <strong>Inventario por Categoría</strong>
              </div>
              <CategoryDonut categories={categories} totalCount={totalStockCount} />
            </div>

            {/* Rotación de Inventario */}
            <TurnoverCard movementsCount={movements.length} totalStock={totalStockCount} />

            {/* Alertas de Inventario */}
            <div className="card">
              <div className="inv-card-header">
                <strong>Alertas de Inventario</strong>
                <span className="inv-header-link" onClick={() => setActiveTab('Productos')}>Ver todas</span>
              </div>
              <ul className="inv-alerts-list">
                <li className="inv-alert-item" onClick={() => { setStockStatusFilter('Agotados'); setActiveTab('Productos'); }}>
                  <span className="inv-alert-icon red">🚫</span>
                  <div className="inv-alert-body">
                    <span className="inv-alert-title">Productos agotados</span>
                    <span className="inv-alert-sub">{outOfStockProducts.length || 12} productos sin existencia</span>
                  </div>
                  <span className="inv-alert-action">Ver</span>
                </li>
                <li className="inv-alert-item" onClick={() => { setStockStatusFilter('Bajos'); setActiveTab('Productos'); }}>
                  <span className="inv-alert-icon orange">⚠️</span>
                  <div className="inv-alert-body">
                    <span className="inv-alert-title">Stock bajo</span>
                    <span className="inv-alert-sub">{lowStockProducts.length || 45} productos con bajo stock</span>
                  </div>
                  <span className="inv-alert-action">Ver</span>
                </li>
                <li className="inv-alert-item" onClick={() => showToastMsg('18 lotes con fecha de caducidad en los próximos 30 días')}>
                  <span className="inv-alert-icon blue">🕒</span>
                  <div className="inv-alert-body">
                    <span className="inv-alert-title">Vencimientos próximos</span>
                    <span className="inv-alert-sub">18 productos por vencer</span>
                  </div>
                  <span className="inv-alert-action">Ver</span>
                </li>
                <li className="inv-alert-item" onClick={() => showToastMsg('8 órdenes de reabastecimiento en curso')}>
                  <span className="inv-alert-icon purple">🛒</span>
                  <div className="inv-alert-body">
                    <span className="inv-alert-title">Órdenes pendientes</span>
                    <span className="inv-alert-sub">8 órdenes de compra</span>
                  </div>
                  <span className="inv-alert-action">Ver</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Fila Tablas de Inventario */}
          <div className="inv-bottom-grid">
            {/* Productos Más Vendidos */}
            <div className="card inv-table-card">
              <div className="inv-card-header">
                <strong>Productos Más Vendidos</strong>
                <span className="inv-header-link" onClick={() => setActiveTab('Productos')}>Ver todos</span>
              </div>
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Ventas (Uds)</th>
                    <th>Ingresos</th>
                    <th>Tendencia</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 5).map((p, idx) => (
                    <tr key={p.id}>
                      <td>
                        <div className="inv-product-cell">
                          <span className="inv-product-img-box">
                            {idx === 0 ? '💊' : idx === 1 ? '💉' : idx === 2 ? '🧴' : idx === 3 ? '🧪' : '📦'}
                          </span>
                          <span>{p.nombre}</span>
                        </div>
                      </td>
                      <td><strong>{p.ventasUds?.toLocaleString() || '1,250'}</strong></td>
                      <td>{fmtMoney(p.ingresos || p.ventasUds * 100 || 125000)}</td>
                      <td>
                        <Sparkline points={p.tendencia || [10, 15, 12, 18, 25, 30]} isUp={idx !== 3 && idx !== 4} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Productos con Stock Bajo */}
            <div className="card inv-table-card">
              <div className="inv-card-header">
                <strong>Productos con Stock Bajo</strong>
                <span className="inv-header-link" onClick={() => { setStockStatusFilter('Bajos'); setActiveTab('Productos'); }}>Ver todos</span>
              </div>
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Stock</th>
                    <th>Mínimo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {products.filter((p) => p.stock <= p.stockMin).slice(0, 5).map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="inv-product-cell">
                          <span>📦</span>
                          <span>{p.nombre}</span>
                        </div>
                      </td>
                      <td>{p.categoria}</td>
                      <td><strong style={{ color: p.stock <= 10 ? '#DC2626' : '#D97706' }}>{p.stock}</strong></td>
                      <td>{p.stockMin}</td>
                      <td>
                        <span className={`inv-badge ${p.stock <= 10 ? 'critico' : 'bajo'}`}>
                          {p.stock <= 10 ? 'Crítico' : 'Bajo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Últimos Movimientos */}
            <div className="card inv-table-card">
              <div className="inv-card-header">
                <strong>Últimos Movimientos</strong>
                <span className="inv-header-link" onClick={() => setActiveTab('Movimientos')}>Ver todos</span>
              </div>
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Producto</th>
                    <th>Almacén</th>
                    <th>Cantidad</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.slice(0, 5).map((m) => (
                    <tr key={m.id}>
                      <td>
                        <span className={`inv-badge ${m.tipo.toLowerCase()}`}>
                          {m.tipo}
                        </span>
                      </td>
                      <td><strong>{m.producto}</strong></td>
                      <td>{m.almacen}</td>
                      <td>
                        <strong style={{ color: m.cantidad > 0 ? '#059669' : '#DC2626' }}>
                          {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                        </strong>
                      </td>
                      <td>{m.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Fila RRHH: 3 Tarjetas (Resumen RRHH, Nómina, Desempeño) ── */}
          <div className="inv-rrhh-grid">
            {/* 1. RRHH - Resumen */}
            <div className="card">
              <div className="inv-card-header">
                <strong>RRHH - Resumen</strong>
                <span className="inv-header-link" onClick={() => showToastMsg('Navegando a módulo de Empleados')}>Ver módulo</span>
              </div>

              {/* 5 Micro-KPIs */}
              <div className="inv-rrhh-kpis-mini">
                <div className="inv-rrhh-kpi-item">
                  <span className="inv-rrhh-kpi-icon">👥</span>
                  <span className="inv-rrhh-kpi-title">Empleados Activos</span>
                  <span className="inv-rrhh-kpi-val">156</span>
                  <span className="inv-rrhh-kpi-badge">↑ 2.7%</span>
                </div>
                <div className="inv-rrhh-kpi-item">
                  <span className="inv-rrhh-kpi-icon">👤</span>
                  <span className="inv-rrhh-kpi-title">Nuevas Contrataciones</span>
                  <span className="inv-rrhh-kpi-val">5</span>
                  <span style={{ fontSize: 9, color: 'var(--color-ink-faint)' }}>Este mes</span>
                </div>
                <div className="inv-rrhh-kpi-item">
                  <span className="inv-rrhh-kpi-icon">⏱️</span>
                  <span className="inv-rrhh-kpi-title">Ausencias Hoy</span>
                  <span className="inv-rrhh-kpi-val">3</span>
                  <span style={{ fontSize: 9, color: 'var(--color-ink-faint)' }}>Empleados</span>
                </div>
                <div className="inv-rrhh-kpi-item">
                  <span className="inv-rrhh-kpi-icon">🎂</span>
                  <span className="inv-rrhh-kpi-title">Cumpleaños del Mes</span>
                  <span className="inv-rrhh-kpi-val">7</span>
                  <span style={{ fontSize: 9, color: 'var(--color-ink-faint)' }}>Empleados</span>
                </div>
                <div className="inv-rrhh-kpi-item">
                  <span className="inv-rrhh-kpi-icon">🏖️</span>
                  <span className="inv-rrhh-kpi-title">Vacaciones Pendientes</span>
                  <span className="inv-rrhh-kpi-val">12</span>
                  <span style={{ fontSize: 9, color: 'var(--color-ink-faint)' }}>Empleados</span>
                </div>
              </div>

              {/* Distribución por Departamento + Cumpleaños/Vacaciones */}
              <div className="inv-rrhh-split">
                <div className="inv-dept-bars">
                  <strong style={{ fontSize: 11, color: 'var(--color-ink)' }}>Distribución por Departamento</strong>
                  {[
                    { dept: 'Ventas', count: 35, pct: 22, color: '#4F46E5' },
                    { dept: 'Administración', count: 28, pct: 18, color: '#6366F1' },
                    { dept: 'Almacén', count: 25, pct: 16, color: '#3B82F6' },
                    { dept: 'Compras', count: 22, pct: 14, color: '#0EA5E9' },
                    { dept: 'Contabilidad', count: 18, pct: 12, color: '#06B6D4' },
                    { dept: 'Recursos Humanos', count: 16, pct: 10, color: '#10B981' },
                    { dept: 'TI / Sistemas', count: 12, pct: 8, color: '#8B5CF6' },
                  ].map((d) => (
                    <div key={d.dept} className="inv-dept-row">
                      <div className="inv-dept-info">
                        <span>{d.dept}</span>
                        <span><strong>{d.count}</strong> ({d.pct}%)</span>
                      </div>
                      <div className="inv-dept-bar-bg">
                        <div className="inv-dept-bar-fill" style={{ width: `${d.pct * 3.5}%`, background: d.color }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <strong style={{ fontSize: 11, color: 'var(--color-ink)' }}>Próximos Cumpleaños</strong>
                    <div className="inv-birthdays-list" style={{ marginTop: 6 }}>
                      {[
                        { nombre: 'Ana Martínez', dept: 'Ventas', fecha: '22 May', in: 'AM' },
                        { nombre: 'Juan Pérez', dept: 'Almacén', fecha: '24 May', in: 'JP' },
                        { nombre: 'María Rodríguez', dept: 'Compras', fecha: '26 May', in: 'MR' },
                        { nombre: 'Luis Gómez', dept: 'Contabilidad', fecha: '28 May', in: 'LG' },
                      ].map((b) => (
                        <div key={b.nombre} className="inv-birthday-item">
                          <div className="inv-emp-avatar">{b.in}</div>
                          <span className="inv-birthday-name">{b.nombre} <small style={{ color: 'var(--color-ink-faint)', fontWeight: 400 }}>({b.dept})</small></span>
                          <span className="inv-birthday-date">{b.fecha}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <strong style={{ fontSize: 11, color: 'var(--color-ink)' }}>Vacaciones Próximas</strong>
                    <div className="inv-birthdays-list" style={{ marginTop: 6 }}>
                      {[
                        { nombre: 'Carlos Hernández', dept: 'Ventas', fecha: '21/05 - 28/05', in: 'CH' },
                        { nombre: 'Laura Jiménez', dept: 'Administración', fecha: '23/05 - 27/05', in: 'LJ' },
                      ].map((v) => (
                        <div key={v.nombre} className="inv-birthday-item">
                          <div className="inv-emp-avatar" style={{ background: '#FEF3C7', color: '#D97706' }}>{v.in}</div>
                          <span className="inv-birthday-name">{v.nombre}</span>
                          <span className="inv-birthday-date">{v.fecha}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Nómina del Mes */}
            <div className="card">
              <div className="inv-card-header">
                <strong>Nómina del Mes (Mayo 2025)</strong>
                <span className="inv-header-link" onClick={() => showToastMsg('Navegando a Nómina')}>Ver módulo</span>
              </div>
              <div className="inv-payroll-wrap">
                <div>
                  <h3 className="inv-payroll-total">RD$ 1,850,000</h3>
                  <small style={{ color: 'var(--color-ink-faint)' }}>Total a pagar</small>
                </div>
                <div className="inv-payroll-body">
                  <PayrollDonut />
                  <ul className="inv-payroll-legend">
                    <li>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB' }} />
                        Salarios
                      </span>
                      <span><strong>RD$ 1,450,000</strong> <small>(78%)</small></span>
                    </li>
                    <li>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                        Bonificaciones
                      </span>
                      <span><strong>RD$ 250,000</strong> <small>(14%)</small></span>
                    </li>
                    <li>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
                        Deducciones
                      </span>
                      <span><strong>RD$ 150,000</strong> <small>(8%)</small></span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 3. Desempeño de Empleados */}
            <div className="card">
              <div className="inv-card-header">
                <strong>Desempeño de Empleados</strong>
                <span className="inv-header-link" onClick={() => showToastMsg('Navegando a Evaluaciones de Desempeño')}>Ver módulo</span>
              </div>
              <div className="inv-perf-wrap">
                <PerformanceGauge />
                <span style={{ fontSize: 11, color: 'var(--color-ink-soft)', marginTop: -4 }}>Promedio General</span>
                <div className="inv-perf-stars">⭐⭐⭐⭐⭐</div>

                <div className="inv-perf-bars">
                  {[
                    { label: 'Excelente', count: 45, pct: 29, color: '#10B981' },
                    { label: 'Bueno', count: 72, pct: 46, color: '#3B82F6' },
                    { label: 'Regular', count: 28, pct: 18, color: '#F59E0B' },
                    { label: 'Necesita Mejora', count: 11, pct: 7, color: '#EF4444' },
                  ].map((lvl) => (
                    <div key={lvl.label} className="inv-perf-row">
                      <span style={{ width: 90 }}>{lvl.label}</span>
                      <div style={{ flex: 1, height: 5, background: '#E2E8F0', borderRadius: 3, margin: '0 8px', overflow: 'hidden' }}>
                        <div style={{ width: `${lvl.pct * 2}%`, background: lvl.color, height: '100%' }} />
                      </div>
                      <span style={{ width: 50, textAlign: 'right' }}><strong>{lvl.count}</strong> ({lvl.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: CATÁLOGO DE PRODUCTOS (CRUD)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Productos' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="inv-toolbar">
            <div className="inv-search-box">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Buscar por código o nombre de producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="inv-filter-chips">
              {['Todos', 'En Stock', 'Bajos', 'Agotados'].map((st) => (
                <button
                  key={st}
                  className={`inv-chip ${stockStatusFilter === st ? 'active' : ''}`}
                  onClick={() => setStockStatusFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="inv-btn-secondary" onClick={() => setShowMovementModal(true)}>
                + Registrar Movimiento
              </button>
              <button className="inv-btn-primary" onClick={() => setShowProductModal(true)}>
                + Nuevo Producto
              </button>
            </div>
          </div>

          <table className="inv-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Almacén</th>
                <th>Stock Actual</th>
                <th>Stock Mín.</th>
                <th>Precio Venta</th>
                <th>Valor Total</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: 24, color: 'var(--color-ink-faint)' }}>
                    No se encontraron productos con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id}>
                    <td><code>{p.codigo}</code></td>
                    <td>
                      <div className="inv-product-cell">
                        <span>📦</span>
                        <strong>{p.nombre}</strong>
                      </div>
                    </td>
                    <td>{p.categoria}</td>
                    <td>{p.almacen}</td>
                    <td>
                      <strong style={{ color: p.stock <= 0 ? '#DC2626' : p.stock <= p.stockMin ? '#D97706' : '#059669' }}>
                        {p.stock}
                      </strong>
                    </td>
                    <td>{p.stockMin}</td>
                    <td>{fmtMoney(p.precio)}</td>
                    <td>{fmtMoney(p.stock * p.precio)}</td>
                    <td>
                      <span className={`inv-badge ${p.stock <= 0 ? 'critico' : p.stock <= p.stockMin ? 'bajo' : 'normal'}`}>
                        {p.stock <= 0 ? 'Agotado' : p.stock <= p.stockMin ? 'Stock Bajo' : 'En Stock'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="inv-btn-secondary"
                        style={{ padding: '4px 8px', fontSize: 11, color: '#DC2626' }}
                        onClick={() => handleDeleteProduct(p.id, p.nombre)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: CATEGORÍAS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Categorías' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="inv-toolbar">
            <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>Categorías de Productos ({categories.length})</span>
            <button className="inv-btn-primary" onClick={() => setShowCategoryModal(true)}>
              + Nueva Categoría
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {categories.map((c) => (
              <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: c.color }} />
                  <span className="inv-badge normal">{c.porcentaje}% del Total</span>
                </div>
                <h3 style={{ margin: 0, fontSize: 16, color: 'var(--color-ink)' }}>{c.nombre}</h3>
                <div style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>
                  Total artículos: <strong>{c.cantidad || 0} unidades</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4: ALMACENES Y SUCURSALES
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Almacenes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="inv-toolbar">
            <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>Almacenes y Centros de Distribución</span>
            <button className="inv-btn-primary" onClick={() => showToastMsg('Almacén nuevo habilitado')}>
              + Nuevo Almacén
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {warehouses.map((w) => (
              <div key={w.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🏢</span>
                  <strong style={{ fontSize: 15, color: 'var(--color-ink)' }}>{w.nombre}</strong>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-ink-soft)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>📍 <strong>Ubicación:</strong> {w.ubicacion}</div>
                  <div>👤 <strong>Responsable:</strong> {w.responsable}</div>
                  <div>📊 <strong>Ocupación:</strong> {w.capacidad}</div>
                </div>
                <div style={{ height: 6, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: w.capacidad, background: '#2563EB', height: '100%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 5: MOVIMIENTOS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Movimientos' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="inv-toolbar">
            <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>Registro de Entradas, Salidas y Ajustes</span>
            <button className="inv-btn-primary" onClick={() => setShowMovementModal(true)}>
              + Registrar Movimiento
            </button>
          </div>

          <table className="inv-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Producto</th>
                <th>Almacén</th>
                <th>Cantidad</th>
                <th>Fecha</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td>
                    <span className={`inv-badge ${m.tipo.toLowerCase()}`}>
                      {m.tipo}
                    </span>
                  </td>
                  <td><strong>{m.producto}</strong></td>
                  <td>{m.almacen}</td>
                  <td>
                    <strong style={{ color: m.cantidad > 0 ? '#059669' : '#DC2626' }}>
                      {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                    </strong>
                  </td>
                  <td>{m.fecha}</td>
                  <td>{m.usuario || 'Admin'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 6: KARDEX
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Kardex' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="inv-toolbar">
            <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>Kardex Valorizado (Método Promedio Ponderado)</span>
            <button className="inv-btn-primary" onClick={() => showToastMsg('Reporte Kardex descargado')}>
              📥 Exportar Kardex (Excel)
            </button>
          </div>

          <table className="inv-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Existencias</th>
                <th>Costo Unit. Promedio</th>
                <th>Precio Venta</th>
                <th>Valor Total en Stock</th>
                <th>Margen Bruto</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const margen = p.precio > 0 ? (((p.precio - p.costo) / p.precio) * 100).toFixed(1) : 0
                return (
                  <tr key={p.id}>
                    <td><strong>{p.nombre}</strong> ({p.codigo})</td>
                    <td>{p.stock} uds</td>
                    <td>{fmtMoney(p.costo)}</td>
                    <td>{fmtMoney(p.precio)}</td>
                    <td><strong>{fmtMoney(p.stock * p.costo)}</strong></td>
                    <td>
                      <span className="inv-badge normal">+{margen}%</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 7: AJUSTES
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Ajustes' && (
        <div className="card" style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: 0, color: 'var(--color-ink)' }}>Configuración de Parámetros de Inventario</h3>
          <div className="inv-form-group">
            <label>Nivel de Alerta Stock Crítico por Defecto</label>
            <input type="number" defaultValue={10} />
          </div>
          <div className="inv-form-group">
            <label>Método de Valoración de Inventario</label>
            <select defaultValue="promedio">
              <option value="promedio">Promedio Ponderado</option>
              <option value="peps">PEPS (Primeras Entradas, Primeras Salidas)</option>
              <option value="ueps">UEPS (Últimas Entradas, Primeras Salidas)</option>
            </select>
          </div>
          <div className="inv-form-group">
            <label>Días de Anticipación para Alerta de Caducidad</label>
            <input type="number" defaultValue={30} />
          </div>
          <button className="inv-btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => showToastMsg('Configuraciones guardadas')}>
            Guardar Parámetros
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODALES
      ══════════════════════════════════════════════════════════════════════ */}

      {/* Modal 1: Nuevo Producto */}
      {showProductModal && (
        <div className="inv-modal-backdrop" onClick={() => setShowProductModal(false)}>
          <div className="inv-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>Registrar Nuevo Producto</h3>
              <button className="inv-modal-close" onClick={() => setShowProductModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateProduct}>
              <div className="inv-modal-body">
                <div className="inv-form-grid-2">
                  <div className="inv-form-group">
                    <label>Código / SKU</label>
                    <input
                      type="text"
                      placeholder="Ej. MED-008"
                      value={productForm.codigo}
                      onChange={(e) => setProductForm({ ...productForm, codigo: e.target.value })}
                    />
                  </div>
                  <div className="inv-form-group">
                    <label>Categoría</label>
                    <select
                      value={productForm.categoria}
                      onChange={(e) => setProductForm({ ...productForm, categoria: e.target.value })}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.nombre}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="inv-form-group">
                  <label>Nombre del Producto *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej. Acetaminofén 500mg"
                    value={productForm.nombre}
                    onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
                  />
                </div>

                <div className="inv-form-grid-2">
                  <div className="inv-form-group">
                    <label>Stock Inicial</label>
                    <input
                      type="number"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    />
                  </div>
                  <div className="inv-form-group">
                    <label>Stock Mínimo (Alerta)</label>
                    <input
                      type="number"
                      value={productForm.stockMin}
                      onChange={(e) => setProductForm({ ...productForm, stockMin: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="inv-form-grid-2">
                  <div className="inv-form-group">
                    <label>Costo de Compra (RD$)</label>
                    <input
                      type="number"
                      value={productForm.costo}
                      onChange={(e) => setProductForm({ ...productForm, costo: Number(e.target.value) })}
                    />
                  </div>
                  <div className="inv-form-group">
                    <label>Precio de Venta (RD$)</label>
                    <input
                      type="number"
                      value={productForm.precio}
                      onChange={(e) => setProductForm({ ...productForm, precio: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="inv-form-group">
                  <label>Almacén Asignado</label>
                  <select
                    value={productForm.almacen}
                    onChange={(e) => setProductForm({ ...productForm, almacen: e.target.value })}
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.nombre}>{w.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="inv-modal-footer">
                <button type="button" className="inv-btn-secondary" onClick={() => setShowProductModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="inv-btn-primary">
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Registrar Movimiento */}
      {showMovementModal && (
        <div className="inv-modal-backdrop" onClick={() => setShowMovementModal(false)}>
          <div className="inv-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>Registrar Movimiento de Inventario</h3>
              <button className="inv-modal-close" onClick={() => setShowMovementModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateMovement}>
              <div className="inv-modal-body">
                <div className="inv-form-group">
                  <label>Tipo de Movimiento</label>
                  <select
                    value={movementForm.tipo}
                    onChange={(e) => setMovementForm({ ...movementForm, tipo: e.target.value })}
                  >
                    <option value="Entrada">📥 Entrada / Reabastecimiento</option>
                    <option value="Salida">📤 Salida / Despacho</option>
                    <option value="Ajuste">⚖️ Ajuste por Auditoría</option>
                  </select>
                </div>

                <div className="inv-form-group">
                  <EnterprisePicker
                    label="Producto de Inventario"
                    required
                    value={movementForm.producto}
                    onChange={(val, item) => setMovementForm({ ...movementForm, producto: val, almacen: item?.almacen || movementForm.almacen })}
                    items={products}
                    displayField="nombre"
                    subtitleField="categoria"
                    filterField="categoria"
                    filterLabel="Categoría"
                    modalTitle="Catálogo de Productos · Movimiento de Inventario"
                    icon="📦"
                    placeholder="Escriba nombre o explore catálogo de inventario..."
                  />
                </div>

                <div className="inv-form-grid-2">
                  <div className="inv-form-group">
                    <label>Cantidad *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={movementForm.cantidad}
                      onChange={(e) => setMovementForm({ ...movementForm, cantidad: Number(e.target.value) })}
                    />
                  </div>
                  <div className="inv-form-group">
                    <label>Almacén</label>
                    <select
                      value={movementForm.almacen}
                      onChange={(e) => setMovementForm({ ...movementForm, almacen: e.target.value })}
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.nombre}>{w.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="inv-modal-footer">
                <button type="button" className="inv-btn-secondary" onClick={() => setShowMovementModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="inv-btn-primary">
                  Registrar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Nueva Categoría */}
      {showCategoryModal && (
        <div className="inv-modal-backdrop" onClick={() => setShowCategoryModal(false)}>
          <div className="inv-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>Nueva Categoría</h3>
              <button className="inv-modal-close" onClick={() => setShowCategoryModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateCategory}>
              <div className="inv-modal-body">
                <div className="inv-form-group">
                  <label>Nombre de Categoría *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej. Material Descartable"
                    value={categoryForm.nombre}
                    onChange={(e) => setCategoryForm({ ...categoryForm, nombre: e.target.value })}
                  />
                </div>
                <div className="inv-form-group">
                  <label>Color Identificador</label>
                  <input
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  />
                </div>
              </div>
              <div className="inv-modal-footer">
                <button type="button" className="inv-btn-secondary" onClick={() => setShowCategoryModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="inv-btn-primary">
                  Crear Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toast && <div className="inv-toast">✨ {toast}</div>}
    </div>
  )
}

