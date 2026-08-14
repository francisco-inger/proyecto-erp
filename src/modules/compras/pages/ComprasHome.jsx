import { useState, useEffect, useMemo, useRef } from 'react'
import { inventarioService } from '../../rrhh-inventario/services/rrhhInventario.service'
import { erpSync } from '../../../core/sync/erpSyncEngine'
import './ComprasHome.css'

const STORAGE_KEY = 'compras_orders_v1'

const SEED_COMPRAS = [
  {
    id: 'OC-001',
    proveedor: 'Distribuidora Tech SRL',
    rnc: '1-31-89234-5',
    fecha: '05/08/2026',
    total: 280000,
    estado: 'Recibida',
    entregado: '05/08/2026',
    categoria: 'Tecnología & Hardware',
    condicionPago: 'Crédito 30 días',
    notas: 'Servidores rackeables y switches Gigabit para expansión de datacenter.',
    items: [
      { descripcion: 'Servidor Rack 2U Enterprise Xeon 32-Core', cantidad: 2, precioUnitario: 110000 },
      { descripcion: 'Switch Administrable 48 Puertos PoE+ Gigabit', cantidad: 2, precioUnitario: 30000 },
    ]
  },
  {
    id: 'OC-002',
    proveedor: 'Electrónica Global SA',
    rnc: '1-01-44589-2',
    fecha: '07/08/2026',
    total: 145000,
    estado: 'Pendiente',
    entregado: '—',
    categoria: 'Componentes Electrónicos',
    condicionPago: 'Crédito 15 días',
    notas: 'Lote de sensores industriales y fuentes reguladas.',
    items: [
      { descripcion: 'Sensores de Proximidad Inductivos IP67', cantidad: 50, precioUnitario: 1500 },
      { descripcion: 'Fuentes de Alimentación Reguladas 24V 10A', cantidad: 14, precioUnitario: 5000 },
    ]
  },
  {
    id: 'OC-003',
    proveedor: 'Suministros Caribe',
    rnc: '1-22-33445-1',
    fecha: '09/08/2026',
    total: 67500,
    estado: 'En Tránsito',
    entregado: '—',
    categoria: 'Insumos de Oficina',
    condicionPago: 'Contado',
    notas: 'Papelería, tóneres de alta capacidad y material de empaque.',
    items: [
      { descripcion: 'Pack Tóner Láser Alta Capacidad Negro/Color', cantidad: 5, precioUnitario: 9500 },
      { descripcion: 'Cajas Papel Bond 20lb Carta (10 resmas)', cantidad: 20, precioUnitario: 1000 },
    ]
  },
  {
    id: 'OC-004',
    proveedor: 'Ferretería Industrial',
    rnc: '1-02-78912-3',
    fecha: '08/08/2026',
    total: 320000,
    estado: 'Recibida',
    entregado: '08/08/2026',
    categoria: 'Mantenimiento & Herramientas',
    condicionPago: 'Crédito 45 días',
    notas: 'Herramientas de precisión y compresor de aire industrial.',
    items: [
      { descripcion: 'Compresor de Aire Industrial 15 HP 500L', cantidad: 1, precioUnitario: 220000 },
      { descripcion: 'Set de Herramientas de Mantenimiento Pesado', cantidad: 4, precioUnitario: 25000 },
    ]
  },
  {
    id: 'OC-005',
    proveedor: 'Papelería & Oficina RD',
    rnc: '1-30-66778-9',
    fecha: '06/08/2026',
    total: 85000,
    estado: 'Cancelada',
    entregado: '—',
    categoria: 'Mobiliario & Oficina',
    condicionPago: 'Crédito 30 días',
    notas: 'Orden cancelada por falta de disponibilidad de inventario del proveedor.',
    items: [
      { descripcion: 'Sillas Ergonómicas Ejecutivas Mesh', cantidad: 10, precioUnitario: 8500 },
    ]
  },
  {
    id: 'OC-006',
    proveedor: 'Importadora Médica Dominicana',
    rnc: '1-01-99881-4',
    fecha: '04/08/2026',
    total: 190000,
    estado: 'Recibida',
    entregado: '04/08/2026',
    categoria: 'Seguridad & Salud Ocupacional',
    condicionPago: 'Crédito 30 días',
    notas: 'Equipamiento de primeros auxilios y kits de bioseguridad para plantas.',
    items: [
      { descripcion: 'Desfibrilador Automático Externo (DEA)', cantidad: 2, precioUnitario: 75000 },
      { descripcion: 'Botiquines Industriales Tipo Maletín Completo', cantidad: 10, precioUnitario: 4000 },
    ]
  },
  {
    id: 'OC-007',
    proveedor: 'Soluciones IT del Caribe',
    rnc: '1-24-55443-8',
    fecha: '03/08/2026',
    total: 115000,
    estado: 'Pendiente',
    entregado: '—',
    categoria: 'Licencias & Software',
    condicionPago: 'Anual Anticipado',
    notas: 'Renovación de licencias de seguridad perimetral y soporte 24/7.',
    items: [
      { descripcion: 'Licencia Anual Firewall UTM NextGen', cantidad: 1, precioUnitario: 85000 },
      { descripcion: 'Póliza de Soporte Técnico 24/7 Nivel 2', cantidad: 1, precioUnitario: 30000 },
    ]
  },
  {
    id: 'OC-008',
    proveedor: 'Plásticos & Envases SRL',
    rnc: '1-33-11223-7',
    fecha: '02/08/2026',
    total: 47500,
    estado: 'En Tránsito',
    entregado: '—',
    categoria: 'Empaque & Logística',
    condicionPago: 'Crédito 15 días',
    notas: 'Rollos de film stretch y cajas corrugadas de exportación.',
    items: [
      { descripcion: 'Rollos de Film Stretch Calibre 80 (500m)', cantidad: 25, precioUnitario: 900 },
      { descripcion: 'Cajas Corrugadas Doble Pared Master (Pack 100)', cantidad: 10, precioUnitario: 2500 },
    ]
  },
]

function money(val) {
  return 'RD$ ' + Number(val || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function getStoredCompras() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (_) {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_COMPRAS))
  return SEED_COMPRAS
}

function saveStoredCompras(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function ComprasHome() {
  const [ordenes, setOrdenes] = useState([])
  const [activeTab, setActiveTab] = useState('Todas')
  const [search, setSearch] = useState('')
  const [openMenuId, setOpenMenuId] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedOrden, setSelectedOrden] = useState(null)
  const [editingOrden, setEditingOrden] = useState(null)
  const [deletingOrden, setDeletingOrden] = useState(null)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filters, setFilters] = useState({
    minTotal: '',
    maxTotal: '',
    proveedor: '',
    categoria: '',
  })
  const [toast, setToast] = useState(null)
  const [invProducts, setInvProducts] = useState([])

  const [form, setForm] = useState({
    proveedor: '',
    rnc: '',
    categoria: 'Insumos Generales',
    condicionPago: 'Crédito 30 días',
    productoId: '',
    itemDesc: 'Adquisición de insumos y materiales operativos',
    itemCant: 1,
    itemPrecioUnitario: 0,
    total: '',
    fecha: new Date().toLocaleDateString('es-DO'),
    estado: 'Pendiente',
    entregado: '—',
    notas: '',
  })

  // Cargar órdenes y escuchar sincronizaciones en tiempo real
  useEffect(() => {
    setOrdenes(getStoredCompras())
    inventarioService.listProducts().then(p => {
      if (p && p.length > 0) setInvProducts(p)
    }).catch(() => {})

    const unsubscribe = erpSync.subscribe(() => {
      setOrdenes(getStoredCompras())
      inventarioService.listProducts().then(p => {
        if (p && p.length > 0) setInvProducts(p)
      }).catch(() => {})
    })
    return () => unsubscribe()
  }, [])

  // Cerrar menú contextual al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.compras-row-actions-wrap')) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const showToastMsg = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // Filtrado de órdenes (Tabs + Búsqueda + Filtros Avanzados)
  const filteredOrdenes = useMemo(() => {
    return ordenes.filter(o => {
      // Filtro de Tab
      let matchTab = true
      if (activeTab === 'Pendientes') matchTab = o.estado === 'Pendiente'
      else if (activeTab === 'En Tránsito') matchTab = o.estado === 'En Tránsito'
      else if (activeTab === 'Recibidas') matchTab = o.estado === 'Recibida'
      else if (activeTab === 'Canceladas') matchTab = o.estado === 'Cancelada'

      // Filtro de Búsqueda rápida
      const q = search.toLowerCase().trim()
      const matchSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.proveedor.toLowerCase().includes(q) ||
        (o.categoria && o.categoria.toLowerCase().includes(q)) ||
        (o.rnc && o.rnc.toLowerCase().includes(q))

      // Filtros Avanzados
      let matchAdv = true
      if (filters.proveedor && !o.proveedor.toLowerCase().includes(filters.proveedor.toLowerCase())) {
        matchAdv = false
      }
      if (filters.categoria && o.categoria && !o.categoria.toLowerCase().includes(filters.categoria.toLowerCase())) {
        matchAdv = false
      }
      if (filters.minTotal && Number(o.total) < Number(filters.minTotal)) {
        matchAdv = false
      }
      if (filters.maxTotal && Number(o.total) > Number(filters.maxTotal)) {
        matchAdv = false
      }

      return matchTab && matchSearch && matchAdv
    })
  }, [ordenes, activeTab, search, filters])

  // Conteos para los tabs
  const counts = {
    Todas: ordenes.length,
    Pendientes: ordenes.filter(o => o.estado === 'Pendiente').length,
    'En Tránsito': ordenes.filter(o => o.estado === 'En Tránsito').length,
    Recibidas: ordenes.filter(o => o.estado === 'Recibida').length,
    Canceladas: ordenes.filter(o => o.estado === 'Cancelada').length,
  }

  // KPIs
  const totalOrdenesMes = ordenes.length
  const totalComprasMes = ordenes.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0)
  const ordenesPendientes = ordenes.filter(o => o.estado === 'Pendiente' || o.estado === 'En Tránsito').length
  const proveedoresActivos = new Set(ordenes.map(o => o.proveedor)).size

  // Crear nueva orden
  const handleCreateOrden = (e) => {
    e.preventDefault()
    if (!form.proveedor || !form.total) return

    const selectedInvProd = invProducts.find(p => p.id === form.productoId || p.nombre === form.itemDesc)

    const newOrden = {
      id: `OC-${pad}`,
      proveedor: form.proveedor,
      rnc: form.rnc || '1-01-' + Math.floor(10000 + Math.random() * 90000) + '-1',
      categoria: form.categoria || 'Insumos Generales',
      condicionPago: form.condicionPago || 'Crédito 30 días',
      fecha: form.fecha || today,
      total: totalVal,
      estado: form.estado,
      entregado: form.estado === 'Recibida' ? (form.fecha || today) : '—',
      notas: form.notas || 'Orden de compra generada desde panel de adquisiciones.',
      items: [
        {
          productoId: form.productoId || selectedInvProd?.id,
          codigo: selectedInvProd?.codigo || 'OC-ITEM-01',
          descripcion: form.itemDesc || 'Insumos / Servicios Adquiridos',
          cantidad: Number(form.itemCant) || 1,
          precioUnitario: Number(form.itemPrecioUnitario) > 0
            ? Number(form.itemPrecioUnitario)
            : totalVal / (Number(form.itemCant) || 1)
        }
      ]
    }

    const updated = [newOrden, ...ordenes]
    setOrdenes(updated)
    saveStoredCompras(updated)
    erpSync.syncPurchaseOrder(newOrden, 'create')

    setShowCreateModal(false)
    showToastMsg(`✅ Orden ${newOrden.id} creada y sincronizada con Finanzas & Inventario`)
    setForm({
      proveedor: '',
      rnc: '',
      categoria: 'Insumos Generales',
      condicionPago: 'Crédito 30 días',
      productoId: '',
      itemDesc: 'Adquisición de insumos y materiales operativos',
      itemCant: 1,
      itemPrecioUnitario: 0,
      total: '',
      fecha: new Date().toLocaleDateString('es-DO'),
      estado: 'Pendiente',
      entregado: '—',
      notas: '',
    })
  }

  // Guardar edición de orden
  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (!editingOrden) return

    let editedSaved = null
    const updated = ordenes.map(o => {
      if (o.id === editingOrden.id) {
        const item = {
          ...editingOrden,
          total: Number(editingOrden.total),
          entregado: editingOrden.estado === 'Recibida' && (!editingOrden.entregado || editingOrden.entregado === '—')
            ? new Date().toLocaleDateString('es-DO')
            : editingOrden.estado !== 'Recibida' ? '—' : editingOrden.entregado
        }
        editedSaved = item
        return item
      }
      return o
    })

    setOrdenes(updated)
    saveStoredCompras(updated)
    if (editedSaved) {
      erpSync.syncPurchaseOrder(editedSaved, 'update')
    }
    if (selectedOrden && selectedOrden.id === editingOrden.id) {
      setSelectedOrden(editingOrden)
    }
    setEditingOrden(null)
    showToastMsg(`💾 Orden ${editingOrden.id} actualizada`)
  }

  // Cambiar estado directo
  const handleChangeStatus = (id, newStatus) => {
    const today = new Date().toLocaleDateString('es-DO')
    let updatedOrderObj = null

    const updated = ordenes.map(o => {
      if (o.id === id) {
        const item = {
          ...o,
          estado: newStatus,
          entregado: newStatus === 'Recibida' ? today : '—',
        }
        updatedOrderObj = item
        return item
      }
      return o
    })
    setOrdenes(updated)
    saveStoredCompras(updated)
    if (updatedOrderObj) {
      erpSync.syncPurchaseOrder(updatedOrderObj, 'status_change')
    }
    if (selectedOrden && selectedOrden.id === id) {
      setSelectedOrden(prev => ({ ...prev, estado: newStatus, entregado: newStatus === 'Recibida' ? today : '—' }))
    }
    showToastMsg(`Estado de ${id} actualizado a: ${newStatus} (Sincronizado)`)
  }

  // Eliminar orden
  const handleConfirmDelete = () => {
    if (!deletingOrden) return
    const updated = ordenes.filter(o => o.id !== deletingOrden.id)
    setOrdenes(updated)
    saveStoredCompras(updated)
    erpSync.syncPurchaseOrder(deletingOrden, 'delete')
    if (selectedOrden && selectedOrden.id === deletingOrden.id) {
      setSelectedOrden(null)
    }
    showToastMsg(`🗑️ Orden ${deletingOrden.id} eliminada`)
    setDeletingOrden(null)
  }

  // Impresión profesional de Orden de Compra
  const handlePrintOrden = (orden) => {
    const printWindow = window.open('', '_blank', 'width=850,height=900')
    if (!printWindow) {
      window.print()
      return
    }

    const items = orden.items && orden.items.length > 0 ? orden.items : [
      { descripcion: 'Adquisición de insumos y materiales autorizados', cantidad: 1, precioUnitario: orden.total }
    ]

    const subtotal = orden.total / 1.18
    const itbis = orden.total - subtotal

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Orden de Compra - ${orden.id}</title>
        <meta charset="utf-8" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: #0F172A;
            margin: 0;
            padding: 36px;
            background: #FFFFFF;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #2563EB;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .logo-title h1 {
            margin: 0;
            color: #1E3A8A;
            font-size: 24px;
            font-weight: 800;
          }
          .logo-title p {
            margin: 4px 0 0;
            color: #64748B;
            font-size: 12px;
          }
          .oc-badge {
            text-align: right;
          }
          .oc-number {
            font-size: 22px;
            font-weight: 800;
            color: #2563EB;
          }
          .oc-date {
            font-size: 12px;
            color: #64748B;
            margin-top: 4px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 28px;
          }
          .info-box {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 14px 18px;
          }
          .info-box h3 {
            margin: 0 0 10px;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #2563EB;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            margin-bottom: 6px;
          }
          .info-label { color: #64748B; font-weight: 500; }
          .info-val { font-weight: 700; color: #0F172A; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          th {
            background: #1E3A8A;
            color: #FFFFFF;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            text-align: left;
            padding: 10px 12px;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #E2E8F0;
            font-size: 12px;
          }
          .totals-box {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 36px;
          }
          .totals-table {
            width: 320px;
          }
          .totals-table td {
            padding: 6px 12px;
            border-bottom: none;
          }
          .total-highlight {
            font-size: 16px;
            font-weight: 800;
            color: #1E3A8A;
            border-top: 2px solid #E2E8F0;
          }
          .notes-box {
            background: #F1F5F9;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 11px;
            color: #475569;
            margin-bottom: 40px;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            padding-top: 20px;
          }
          .signature-line {
            width: 200px;
            border-top: 1px solid #94A3B8;
            text-align: center;
            font-size: 11px;
            color: #64748B;
            padding-top: 6px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-title">
            <h1>APPEX.ERP Enterprise Suite</h1>
            <p>Módulo de Compras & Cadena de Suministro · RNC: 1-30-99887-1</p>
            <p>Av. Winston Churchill #109, Santo Domingo, D.N.</p>
          </div>
          <div class="oc-badge">
            <div class="oc-number">ORDEN DE COMPRA</div>
            <div class="oc-number" style="font-size: 18px;">${orden.id}</div>
            <div class="oc-date">Fecha: ${orden.fecha}</div>
            <div class="oc-date">Estado: <strong>${orden.estado}</strong></div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <h3>Datos del Proveedor</h3>
            <div class="info-row"><span class="info-label">Razón Social:</span><span class="info-val">${orden.proveedor}</span></div>
            <div class="info-row"><span class="info-label">RNC / Cédula:</span><span class="info-val">${orden.rnc || '1-31-89234-5'}</span></div>
            <div class="info-row"><span class="info-label">Categoría:</span><span class="info-val">${orden.categoria || 'Proveedor Homologado'}</span></div>
            <div class="info-row"><span class="info-label">Términos de Pago:</span><span class="info-val">${orden.condicionPago || 'Crédito 30 días'}</span></div>
          </div>
          <div class="info-box">
            <h3>Detalles de Entrega y Recepción</h3>
            <div class="info-row"><span class="info-label">Lugar de Entrega:</span><span class="info-val">Almacén Central / Nave A-3</span></div>
            <div class="info-row"><span class="info-label">Fecha Programada:</span><span class="info-val">${orden.fecha}</span></div>
            <div class="info-row"><span class="info-label">Fecha de Entrega:</span><span class="info-val">${orden.entregado}</span></div>
            <div class="info-row"><span class="info-label">Moneda:</span><span class="info-val">Pesos Dominicanos (DOP)</span></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Descripción del Artículo / Servicio</th>
              <th style="text-align: center; width: 80px;">Cant.</th>
              <th style="text-align: right; width: 140px;">Precio Unit.</th>
              <th style="text-align: right; width: 140px;">Importe</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((it, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${it.descripcion}</strong></td>
                <td style="text-align: center;">${it.cantidad}</td>
                <td style="text-align: right;">${money(it.precioUnitario)}</td>
                <td style="text-align: right; font-weight: 700;">${money(it.cantidad * it.precioUnitario)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals-box">
          <table class="totals-table">
            <tr>
              <td class="info-label">Subtotal (Neto):</td>
              <td style="text-align: right; font-weight: 600;">${money(subtotal)}</td>
            </tr>
            <tr>
              <td class="info-label">ITBIS (18%):</td>
              <td style="text-align: right; font-weight: 600;">${money(itbis)}</td>
            </tr>
            <tr class="total-highlight">
              <td>Total Orden:</td>
              <td style="text-align: right;">${money(orden.total)}</td>
            </tr>
          </table>
        </div>

        <div class="notes-box">
          <strong>Observaciones / Términos de Aceptación:</strong><br/>
          ${orden.notas || 'Favor entregar la factura fiscal con valor de crédito fiscal (B01) adjunta a esta orden de compra.'}
        </div>

        <div class="signatures">
          <div class="signature-line">
            Elaborado por (Compras)
          </div>
          <div class="signature-line">
            Autorizado por (Dirección Financiera)
          </div>
          <div class="signature-line">
            Recibido por (Proveedor)
          </div>
        </div>

        <div style="margin-top: 30px; text-align: center;" class="no-print">
          <button onclick="window.print()" style="background: #2563EB; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; cursor: pointer;">
            🖨️ Imprimir Documento
          </button>
        </div>
      </body>
      </html>
    `
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.focus()
    }, 250)
  }

  // Exportar a CSV
  const handleExportCSV = () => {
    const csvContent = [
      ['ID Orden', 'Proveedor', 'RNC', 'Categoría', 'Fecha', 'Total DOP', 'Estado', 'Entregado', 'Condición Pago'].join(','),
      ...filteredOrdenes.map(o => [
        `"${o.id}"`,
        `"${o.proveedor}"`,
        `"${o.rnc || ''}"`,
        `"${o.categoria || ''}"`,
        `"${o.fecha}"`,
        o.total,
        `"${o.estado}"`,
        `"${o.entregado}"`,
        `"${o.condicionPago || ''}"`,
      ].join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `ordenes_compras_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToastMsg('Órdenes exportadas a CSV con éxito')
  }

  const activeFiltersCount = (filters.proveedor ? 1 : 0) + (filters.categoria ? 1 : 0) + (filters.minTotal || filters.maxTotal ? 1 : 0)

  return (
    <div className="compras-container">
      {/* ── Banner Hero Panorámico de Compras ── */}
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
        {/* Imagen de fondo panorámica */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '55%',
          backgroundImage: 'url(/branding/banner_compras_panoramic.jpg)',
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
            <span>🛍️</span> PANEL DE CONTROL · COMPRAS & CADENA DE SUMINISTRO
          </div>

          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Control de Compras y Proveedores
          </h1>
          <p style={{ margin: '6px 0 20px', fontSize: 13, color: '#CBD5E1', lineHeight: 1.5, maxWidth: 580 }}>
            Gestiona adquisiciones corporativas, emisión de órdenes de compra (OC), control de embarques y catálogo de proveedores.
          </p>

          {/* Estadísticas en vivo */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{money(totalComprasMes > 0 ? totalComprasMes : 850000)}</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Compras Acumuladas</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{totalOrdenesMes}</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Órdenes Totales</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{proveedoresActivos}</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Proveedores Homologados</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#34D399', lineHeight: 1 }}>{ordenesPendientes}</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>En Tránsito / Pendientes</div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowCreateModal(true)}
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
              + Nueva Orden de Compra
            </button>
            <button
              onClick={handleExportCSV}
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
              📄 Exportar a CSV
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
              🖨️ Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* ── Panel Principal: Tabla de Órdenes ── */}
      <div className="compras-table-card">
        {/* Tabs Superiores y Filtros */}
        <div className="compras-tabs-row">
          <div className="compras-status-tabs">
            {['Todas', 'Pendientes', 'En Tránsito', 'Recibidas', 'Canceladas'].map(t => (
              <button
                key={t}
                className={`compras-status-tab ${activeTab === t ? 'active' : ''}`}
                onClick={() => setActiveTab(t)}
              >
                <span>{t}</span>
                <span className="compras-tab-badge">{counts[t] ?? 0}</span>
              </button>
            ))}
          </div>

          <div className="compras-actions-right">
            <div className="compras-table-search">
              <span>🔍</span>
              <input
                placeholder="Buscar órdenes, proveedor, RNC..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              className={`compras-outline-btn ${activeFiltersCount > 0 ? 'filter-active' : ''}`}
              onClick={() => setShowFilterModal(true)}
            >
              ⚡ Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </button>
            <button className="compras-outline-btn" onClick={handleExportCSV}>
              📥 Exportar
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="compras-table-responsive">
          <table className="compras-table">
            <thead>
              <tr>
                <th>ID Orden</th>
                <th>Proveedor</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Entregado</th>
                <th style={{ width: 100, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrdenes.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>📦</div>
                    <div>No se encontraron órdenes de compra con los filtros actuales.</div>
                  </td>
                </tr>
              ) : (
                filteredOrdenes.map(o => (
                  <tr key={o.id}>
                    <td>
                      <div className="compras-order-cell">
                        <span className="compras-doc-icon">📄</span>
                        <span className="compras-order-id-link" onClick={() => setSelectedOrden(o)}>
                          {o.id}
                        </span>
                      </div>
                    </td>
                    <td>
                      <strong>{o.proveedor}</strong>
                      {o.categoria && (
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{o.categoria}</div>
                      )}
                    </td>
                    <td>{o.fecha}</td>
                    <td><strong>{money(o.total)}</strong></td>
                    <td>
                      <span className={`compras-pill-badge ${o.estado.toLowerCase().replace(' ', '-').replace('á', 'a')}`}>
                        <span className="compras-badge-dot" />
                        {o.estado}
                      </span>
                    </td>
                    <td style={{ color: o.entregado === '—' ? '#94A3B8' : '#0F172A' }}>{o.entregado}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="compras-row-actions-wrap">
                        <button
                          className="compras-icon-btn"
                          title="Ver detalle"
                          onClick={() => setSelectedOrden(o)}
                        >
                          👁️
                        </button>

                        <button
                          className={`compras-icon-btn ${openMenuId === o.id ? 'active' : ''}`}
                          title="Más opciones de orden"
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId(openMenuId === o.id ? null : o.id)
                          }}
                        >
                          ⋮
                        </button>

                        {/* Menú Contextual Desplegable para los 3 Puntos */}
                        {openMenuId === o.id && (
                          <div className="compras-action-dropdown" onClick={e => e.stopPropagation()}>
                            <div className="compras-dropdown-header">
                              <span className="compras-dropdown-header-title">Opciones · {o.id}</span>
                              <span className="compras-dropdown-header-sub">{o.proveedor}</span>
                            </div>

                            <button
                              className="compras-dropdown-item"
                              onClick={() => {
                                setSelectedOrden(o)
                                setOpenMenuId(null)
                              }}
                            >
                              <span className="dropdown-item-icon">👁️</span>
                              <span>Ver detalle completo</span>
                            </button>

                            <button
                              className="compras-dropdown-item"
                              onClick={() => {
                                setEditingOrden({ ...o })
                                setOpenMenuId(null)
                              }}
                            >
                              <span className="dropdown-item-icon">✏️</span>
                              <span>Editar orden</span>
                            </button>

                            <button
                              className="compras-dropdown-item"
                              onClick={() => {
                                handlePrintOrden(o)
                                setOpenMenuId(null)
                              }}
                            >
                              <span className="dropdown-item-icon">🖨️</span>
                              <span>Imprimir Orden (OC)</span>
                            </button>

                            <div className="compras-dropdown-divider" />
                            <div className="compras-dropdown-section-title">Cambiar Estado</div>

                            <button
                              className={`compras-dropdown-item ${o.estado === 'Pendiente' ? 'is-selected' : ''}`}
                              onClick={() => {
                                handleChangeStatus(o.id, 'Pendiente')
                                setOpenMenuId(null)
                              }}
                            >
                              <span className="dropdown-status-dot dot-pendiente" />
                              <span>Marcar Pendiente</span>
                              {o.estado === 'Pendiente' && <span className="dropdown-check">✓</span>}
                            </button>

                            <button
                              className={`compras-dropdown-item ${o.estado === 'En Tránsito' ? 'is-selected' : ''}`}
                              onClick={() => {
                                handleChangeStatus(o.id, 'En Tránsito')
                                setOpenMenuId(null)
                              }}
                            >
                              <span className="dropdown-status-dot dot-transito" />
                              <span>Marcar En Tránsito</span>
                              {o.estado === 'En Tránsito' && <span className="dropdown-check">✓</span>}
                            </button>

                            <button
                              className={`compras-dropdown-item ${o.estado === 'Recibida' ? 'is-selected' : ''}`}
                              onClick={() => {
                                handleChangeStatus(o.id, 'Recibida')
                                setOpenMenuId(null)
                              }}
                            >
                              <span className="dropdown-status-dot dot-recibida" />
                              <span>Marcar Recibida</span>
                              {o.estado === 'Recibida' && <span className="dropdown-check">✓</span>}
                            </button>

                            <button
                              className={`compras-dropdown-item ${o.estado === 'Cancelada' ? 'is-selected' : ''}`}
                              onClick={() => {
                                handleChangeStatus(o.id, 'Cancelada')
                                setOpenMenuId(null)
                              }}
                            >
                              <span className="dropdown-status-dot dot-cancelada" />
                              <span>Marcar Cancelada</span>
                              {o.estado === 'Cancelada' && <span className="dropdown-check">✓</span>}
                            </button>

                            <div className="compras-dropdown-divider" />

                            <button
                              className="compras-dropdown-item is-danger"
                              onClick={() => {
                                setDeletingOrden(o)
                                setOpenMenuId(null)
                              }}
                            >
                              <span className="dropdown-item-icon">🗑️</span>
                              <span>Eliminar orden</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="compras-pagination-row">
          <span>Mostrando 1 a {filteredOrdenes.length} de {ordenes.length} órdenes</span>
          <div className="compras-page-controls">
            <button className="compras-page-num-btn">‹</button>
            <button className="compras-page-num-btn active">1</button>
            <button className="compras-page-num-btn">2</button>
            <button className="compras-page-num-btn">3</button>
            <button className="compras-page-num-btn">›</button>
          </div>
        </div>
      </div>

      {/* ── Modal Nueva Orden de Compra ── */}
      {showCreateModal && (
        <div className="compras-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="compras-modal-box" onClick={e => e.stopPropagation()}>
            <div className="compras-modal-header">
              <h3>+ Nueva Orden de Compra</h3>
              <button className="compras-modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateOrden}>
              <div className="compras-modal-body">
                <div className="compras-form-row">
                  <div className="compras-form-group" style={{ flex: 2 }}>
                    <label>Proveedor / Razón Social *</label>
                    <input
                      required
                      placeholder="Ej: Distribuidora Tech SRL"
                      value={form.proveedor}
                      onChange={e => setForm(f => ({ ...f, proveedor: e.target.value }))}
                    />
                  </div>
                  <div className="compras-form-group" style={{ flex: 1 }}>
                    <label>RNC / Cédula</label>
                    <input
                      placeholder="1-31-89234-5"
                      value={form.rnc}
                      onChange={e => setForm(f => ({ ...f, rnc: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="compras-form-row">
                  <div className="compras-form-group" style={{ flex: 1 }}>
                    <label>Categoría</label>
                    <select
                      value={form.categoria}
                      onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                    >
                      <option value="Tecnología & Hardware">Tecnología & Hardware</option>
                      <option value="Componentes Electrónicos">Componentes Electrónicos</option>
                      <option value="Insumos de Oficina">Insumos de Oficina</option>
                      <option value="Mantenimiento & Herramientas">Mantenimiento & Herramientas</option>
                      <option value="Mobiliario & Oficina">Mobiliario & Oficina</option>
                      <option value="Seguridad & Salud Ocupacional">Seguridad & Salud Ocupacional</option>
                      <option value="Licencias & Software">Licencias & Software</option>
                      <option value="Empaque & Logística">Empaque & Logística</option>
                      <option value="Insumos Generales">Insumos Generales</option>
                    </select>
                  </div>
                  <div className="compras-form-group" style={{ flex: 1 }}>
                    <label>Condición de Pago</label>
                    <select
                      value={form.condicionPago}
                      onChange={e => setForm(f => ({ ...f, condicionPago: e.target.value }))}
                    >
                      <option value="Contado">Contado</option>
                      <option value="Crédito 15 días">Crédito 15 días</option>
                      <option value="Crédito 30 días">Crédito 30 días</option>
                      <option value="Crédito 45 días">Crédito 45 días</option>
                      <option value="Crédito 60 días">Crédito 60 días</option>
                    </select>
                  </div>
                </div>

                {/* Selector de Producto de Inventario */}
                {invProducts.length > 0 && (
                  <div className="compras-form-group">
                    <label>Producto de Inventario (Opcional - Para reposición de stock)</label>
                    <select
                      value={form.productoId}
                      onChange={e => {
                        const pid = e.target.value
                        const prod = invProducts.find(p => p.id === pid)
                        if (prod) {
                          const cost = Number(prod.costo || prod.precio * 0.6 || 50)
                          const cant = Number(form.itemCant || 1)
                          setForm(f => ({
                            ...f,
                            productoId: prod.id,
                            itemDesc: prod.nombre,
                            itemPrecioUnitario: cost,
                            total: (cost * cant).toFixed(2),
                            categoria: prod.categoria || f.categoria
                          }))
                        } else {
                          setForm(f => ({ ...f, productoId: '' }))
                        }
                      }}
                    >
                      <option value="">-- Seleccionar producto para reposición automática --</option>
                      {invProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} · Costo Ref: {money(p.costo || p.precio * 0.6 || 50)} (Stock actual: {p.stock} uds.)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="compras-form-row">
                  <div className="compras-form-group" style={{ flex: 1 }}>
                    <label>Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={form.itemCant}
                      onChange={e => {
                        const cant = Math.max(1, Number(e.target.value) || 1)
                        const cost = Number(form.itemPrecioUnitario) || 0
                        setForm(f => ({
                          ...f,
                          itemCant: cant,
                          total: cost > 0 ? (cost * cant).toFixed(2) : f.total
                        }))
                      }}
                    />
                  </div>
                  <div className="compras-form-group" style={{ flex: 1 }}>
                    <label>Total Orden (RD$) *</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={form.total}
                      onChange={e => setForm(f => ({ ...f, total: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="compras-form-row">
                  <div className="compras-form-group" style={{ flex: 1 }}>
                    <label>Fecha de Emisión</label>
                    <input
                      type="text"
                      placeholder="DD/MM/AAAA"
                      value={form.fecha}
                      onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                    />
                  </div>
                  <div className="compras-form-group" style={{ flex: 1 }}>
                    <label>Estado Inicial</label>
                    <select
                      value={form.estado}
                      onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Tránsito">En Tránsito</option>
                      <option value="Recibida">Recibida</option>
                    </select>
                  </div>
                </div>

                <div className="compras-form-group">
                  <label>Descripción de Artículos / Servicios</label>
                  <input
                    placeholder="Ej: Lote de repuestos y suministros autorizados"
                    value={form.itemDesc}
                    onChange={e => setForm(f => ({ ...f, itemDesc: e.target.value }))}
                  />
                </div>

                <div className="compras-form-group">
                  <label>Observaciones / Instrucciones de Entrega</label>
                  <textarea
                    rows="2"
                    placeholder="Notas para el proveedor o recepción en almacén..."
                    value={form.notas}
                    onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  />
                </div>
              </div>
              <div className="compras-modal-footer">
                <button type="button" className="compras-outline-btn" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="compras-btn-primary">
                  Crear Orden de Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Detalle de Orden ── */}
      {selectedOrden && (
        <div className="compras-modal-backdrop" onClick={() => setSelectedOrden(null)}>
          <div className="compras-modal-box large" onClick={e => e.stopPropagation()}>
            <div className="compras-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>📄</span>
                <div>
                  <h3 style={{ margin: 0 }}>Orden de Compra: {selectedOrden.id}</h3>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{selectedOrden.proveedor}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`compras-pill-badge ${selectedOrden.estado.toLowerCase().replace(' ', '-').replace('á', 'a')}`}>
                  <span className="compras-badge-dot" />
                  {selectedOrden.estado}
                </span>
                <button className="compras-modal-close" onClick={() => setSelectedOrden(null)}>✕</button>
              </div>
            </div>

            <div className="compras-modal-body">
              {/* Resumen Superior */}
              <div className="compras-detail-kpi-row">
                <div className="compras-detail-kpi">
                  <span className="detail-kpi-label">Monto Total</span>
                  <span className="detail-kpi-value text-blue">{money(selectedOrden.total)}</span>
                </div>
                <div className="compras-detail-kpi">
                  <span className="detail-kpi-label">Fecha de Emisión</span>
                  <span className="detail-kpi-value">{selectedOrden.fecha}</span>
                </div>
                <div className="compras-detail-kpi">
                  <span className="detail-kpi-label">Recepción / Entrega</span>
                  <span className="detail-kpi-value">{selectedOrden.entregado}</span>
                </div>
                <div className="compras-detail-kpi">
                  <span className="detail-kpi-label">Término de Pago</span>
                  <span className="detail-kpi-value">{selectedOrden.condicionPago || 'Crédito 30 días'}</span>
                </div>
              </div>

              {/* Información Proveedor */}
              <div className="compras-detail-section">
                <h4 className="detail-section-title">Información del Proveedor</h4>
                <div className="compras-detail-grid">
                  <div className="detail-field">
                    <span className="field-label">Proveedor:</span>
                    <span className="field-val"><strong>{selectedOrden.proveedor}</strong></span>
                  </div>
                  <div className="detail-field">
                    <span className="field-label">RNC / Identificación:</span>
                    <span className="field-val">{selectedOrden.rnc || '1-31-89234-5'}</span>
                  </div>
                  <div className="detail-field">
                    <span className="field-label">Categoría:</span>
                    <span className="field-val">{selectedOrden.categoria || 'Suministros Corporativos'}</span>
                  </div>
                  <div className="detail-field">
                    <span className="field-label">Almacén Destino:</span>
                    <span className="field-val">Almacén Central / Nave A-3</span>
                  </div>
                </div>
              </div>

              {/* Artículos de la Orden */}
              <div className="compras-detail-section">
                <h4 className="detail-section-title">Desglose de Artículos / Servicios</h4>
                <table className="compras-items-table">
                  <thead>
                    <tr>
                      <th>Descripción</th>
                      <th style={{ textAlign: 'center', width: 70 }}>Cant.</th>
                      <th style={{ textAlign: 'right', width: 120 }}>Precio Unit.</th>
                      <th style={{ textAlign: 'right', width: 120 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrden.items && selectedOrden.items.length > 0 ? selectedOrden.items : [
                      { descripcion: 'Adquisición de insumos y materiales autorizados', cantidad: 1, precioUnitario: selectedOrden.total }
                    ]).map((it, idx) => (
                      <tr key={idx}>
                        <td>{it.descripcion}</td>
                        <td style={{ textAlign: 'center' }}>{it.cantidad}</td>
                        <td style={{ textAlign: 'right' }}>{money(it.precioUnitario)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{money(it.cantidad * it.precioUnitario)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'right', fontWeight: 600, color: '#64748B' }}>Subtotal Neto:</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{money(selectedOrden.total / 1.18)}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'right', fontWeight: 600, color: '#64748B' }}>ITBIS (18%):</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{money(selectedOrden.total - (selectedOrden.total / 1.18))}</td>
                    </tr>
                    <tr className="tfoot-total">
                      <td colSpan="3" style={{ textAlign: 'right', fontWeight: 800 }}>Total Final (DOP):</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#2563EB', fontSize: 15 }}>{money(selectedOrden.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Observaciones */}
              {selectedOrden.notas && (
                <div className="compras-detail-section">
                  <h4 className="detail-section-title">Observaciones</h4>
                  <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, fontSize: 13, color: '#475569', border: '1px solid #E2E8F0' }}>
                    {selectedOrden.notas}
                  </div>
                </div>
              )}
            </div>

            <div className="compras-modal-footer" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="compras-btn-secondary"
                  onClick={() => {
                    handlePrintOrden(selectedOrden)
                  }}
                >
                  🖨️ Imprimir OC
                </button>
                <button
                  className="compras-btn-secondary"
                  onClick={() => {
                    setEditingOrden({ ...selectedOrden })
                  }}
                >
                  ✏️ Editar
                </button>
              </div>
              <button className="compras-btn-primary" onClick={() => setSelectedOrden(null)}>
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Editar Orden ── */}
      {editingOrden && (
        <div className="compras-modal-backdrop" onClick={() => setEditingOrden(null)}>
          <div className="compras-modal-box" onClick={e => e.stopPropagation()}>
            <div className="compras-modal-header">
              <h3>✏️ Editar Orden: {editingOrden.id}</h3>
              <button className="compras-modal-close" onClick={() => setEditingOrden(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="compras-modal-body">
                <div className="compras-form-group">
                  <label>Proveedor / Razón Social *</label>
                  <input
                    required
                    value={editingOrden.proveedor}
                    onChange={e => setEditingOrden(ed => ({ ...ed, proveedor: e.target.value }))}
                  />
                </div>
                <div className="compras-form-row">
                  <div className="compras-form-group" style={{ flex: 1 }}>
                    <label>RNC / Cédula</label>
                    <input
                      value={editingOrden.rnc || ''}
                      onChange={e => setEditingOrden(ed => ({ ...ed, rnc: e.target.value }))}
                    />
                  </div>
                  <div className="compras-form-group" style={{ flex: 1 }}>
                    <label>Categoría</label>
                    <input
                      value={editingOrden.categoria || ''}
                      onChange={e => setEditingOrden(ed => ({ ...ed, categoria: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="compras-form-row">
                  <div className="compras-form-group" style={{ flex: 1 }}>
                    <label>Monto Total (RD$) *</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={editingOrden.total}
                      onChange={e => setEditingOrden(ed => ({ ...ed, total: e.target.value }))}
                    />
                  </div>
                  <div className="compras-form-group" style={{ flex: 1 }}>
                    <label>Fecha de Emisión</label>
                    <input
                      value={editingOrden.fecha}
                      onChange={e => setEditingOrden(ed => ({ ...ed, fecha: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="compras-form-row">
                  <div className="compras-form-group" style={{ flex: 1 }}>
                    <label>Estado de la Orden</label>
                    <select
                      value={editingOrden.estado}
                      onChange={e => setEditingOrden(ed => ({ ...ed, estado: e.target.value }))}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Tránsito">En Tránsito</option>
                      <option value="Recibida">Recibida</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>
                  <div className="compras-form-group" style={{ flex: 1 }}>
                    <label>Fecha de Entrega</label>
                    <input
                      value={editingOrden.entregado}
                      onChange={e => setEditingOrden(ed => ({ ...ed, entregado: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="compras-form-group">
                  <label>Observaciones</label>
                  <textarea
                    rows="2"
                    value={editingOrden.notas || ''}
                    onChange={e => setEditingOrden(ed => ({ ...ed, notas: e.target.value }))}
                  />
                </div>
              </div>
              <div className="compras-modal-footer">
                <button type="button" className="compras-outline-btn" onClick={() => setEditingOrden(null)}>
                  Cancelar
                </button>
                <button type="submit" className="compras-btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Confirmar Eliminación ── */}
      {deletingOrden && (
        <div className="compras-modal-backdrop" onClick={() => setDeletingOrden(null)}>
          <div className="compras-modal-box danger" onClick={e => e.stopPropagation()}>
            <div className="compras-modal-header">
              <h3 style={{ color: '#DC2626' }}>🗑️ Eliminar Orden de Compra</h3>
              <button className="compras-modal-close" onClick={() => setDeletingOrden(null)}>✕</button>
            </div>
            <div className="compras-modal-body">
              <p style={{ margin: 0, fontSize: 14, color: '#334155', lineHeight: 1.5 }}>
                ¿Estás seguro de que deseas eliminar permanentemente la orden <strong>{deletingOrden.id}</strong> correspondiente a <strong>{deletingOrden.proveedor}</strong> por valor de <strong>{money(deletingOrden.total)}</strong>?
              </p>
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 12 }}>
                ⚠️ Esta acción no se puede deshacer. Los registros de compras relacionados serán removidos del sistema.
              </div>
            </div>
            <div className="compras-modal-footer">
              <button className="compras-outline-btn" onClick={() => setDeletingOrden(null)}>
                Cancelar
              </button>
              <button className="compras-btn-danger" onClick={handleConfirmDelete}>
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Filtros Avanzados ── */}
      {showFilterModal && (
        <div className="compras-modal-backdrop" onClick={() => setShowFilterModal(false)}>
          <div className="compras-modal-box" onClick={e => e.stopPropagation()}>
            <div className="compras-modal-header">
              <h3>⚡ Filtros Avanzados</h3>
              <button className="compras-modal-close" onClick={() => setShowFilterModal(false)}>✕</button>
            </div>
            <div className="compras-modal-body">
              <div className="compras-form-group">
                <label>Proveedor</label>
                <input
                  placeholder="Filtrar por nombre de proveedor..."
                  value={filters.proveedor}
                  onChange={e => setFilters(f => ({ ...f, proveedor: e.target.value }))}
                />
              </div>
              <div className="compras-form-group">
                <label>Categoría</label>
                <input
                  placeholder="Ej: Tecnología, Insumos..."
                  value={filters.categoria}
                  onChange={e => setFilters(f => ({ ...f, categoria: e.target.value }))}
                />
              </div>
              <div className="compras-form-row">
                <div className="compras-form-group" style={{ flex: 1 }}>
                  <label>Monto Mínimo (RD$)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.minTotal}
                    onChange={e => setFilters(f => ({ ...f, minTotal: e.target.value }))}
                  />
                </div>
                <div className="compras-form-group" style={{ flex: 1 }}>
                  <label>Monto Máximo (RD$)</label>
                  <input
                    type="number"
                    placeholder="500000"
                    value={filters.maxTotal}
                    onChange={e => setFilters(f => ({ ...f, maxTotal: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="compras-modal-footer" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                className="compras-outline-btn"
                onClick={() => {
                  setFilters({ minTotal: '', maxTotal: '', proveedor: '', categoria: '' })
                  setShowFilterModal(false)
                  showToastMsg('Filtros restablecidos')
                }}
              >
                Limpiar Filtros
              </button>
              <button
                type="button"
                className="compras-btn-primary"
                onClick={() => {
                  setShowFilterModal(false)
                  showToastMsg('Filtros aplicados')
                }}
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && <div className="compras-toast">{toast}</div>}
    </div>
  )
}
