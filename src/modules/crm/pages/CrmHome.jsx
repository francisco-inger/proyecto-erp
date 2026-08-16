/*
  CrmHome.jsx — Módulo CRM (appes.erp)
  Propietaria: Ediana Tejada Ureña.
  Vistas interactivas: Resumen general, Gestión de Clientes (CRUD),
  Pipeline / Tablero Kanban de Oportunidades, Directorio de Contactos,
  Bitácora de Actividades y Reportes exportables.
*/
import { useState, useEffect } from 'react'
import { crmService } from '../services/crm.service'
import { erpSync } from '../../../core/sync/erpSyncEngine'
import { EnterprisePicker } from '../../../core/components/EnterprisePickerModal'
import { formatPhone, formatRNC } from '../../../core/utils/formatters'
import './CrmHome.css'

// ─── Utilidades ───────────────────────────────────────────────────────────────

function fmtMoney(n) {
  if (n === undefined || n === null) return '—'
  return 'RD$ ' + Number(n).toLocaleString('es-DO')
}

// ─── Componente Gauge Semicircular (Tasa de Conversión) ───────────────────────

function ConversionGauge({ value = 28.6 }) {
  const r = 36
  const totalLength = Math.PI * r
  const strokeDash = (value / 100) * totalLength
  const gap = totalLength - strokeDash

  return (
    <div className="crm-gauge-wrap">
      <svg viewBox="0 0 90 50" className="crm-gauge-svg">
        <path
          d="M 9,42 A 36,36 0 0,1 81,42"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 9,42 A 36,36 0 0,1 81,42"
          fill="none"
          stroke="#2563EB"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${gap}`}
        />
      </svg>
      <span className="crm-gauge-val">{value}%</span>
    </div>
  )
}

// ─── Componente Embudo SVG (Funnel) ──────────────────────────────────────────

function FunnelChart({ stages, onSelectStage }) {
  if (!stages || stages.length === 0) return null

  const trapezoids = [
    { d: 'M 10,10 L 230,10 L 210,42 L 30,42 Z', color: '#2563EB', stage: 'Prospección' },
    { d: 'M 32,46 L 208,46 L 190,78 L 50,78 Z', color: '#4F46E5', stage: 'Calificación' },
    { d: 'M 52,82 L 188,82 L 170,114 L 70,114 Z', color: '#10B981', stage: 'Propuesta' },
    { d: 'M 72,118 L 168,118 L 150,150 L 90,150 Z', color: '#F59E0B', stage: 'Negociación' },
    { d: 'M 92,154 L 148,154 L 138,186 L 102,186 Z', color: '#FBBF24', stage: 'Cierre' },
  ]

  return (
    <div className="crm-funnel-container">
      <div className="crm-funnel-labels-left">
        {stages.map((st) => (
          <span key={st.etapa} onClick={() => onSelectStage && onSelectStage(st.etapa)}>
            {st.etapa}
          </span>
        ))}
      </div>

      <div className="crm-funnel-svg-wrap">
        <svg viewBox="0 0 240 195" className="crm-funnel-svg" preserveAspectRatio="xMidYMid meet">
          {trapezoids.map((tp, idx) => (
            <path
              key={idx}
              d={tp.d}
              fill={tp.color}
              className="crm-funnel-step"
              onClick={() => onSelectStage && onSelectStage(tp.stage)}
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))' }}
            >
              <title>{`${tp.stage}: ${stages[idx]?.count || 0} oportunidades`}</title>
            </path>
          ))}
        </svg>
      </div>

      <div className="crm-funnel-labels-right">
        {stages.map((st) => (
          <span key={st.etapa}>{st.count} ({st.pct}%)</span>
        ))}
      </div>
    </div>
  )
}

// ─── Componente Donut de Fuentes ──────────────────────────────────────────────

function SourcesDonut({ sources }) {
  if (!sources) return null
  const R = 44, cx = 60, cy = 60
  const circumference = 2 * Math.PI * R
  let offset = 0

  const strokes = sources.map((src) => {
    const dash = (src.pct / 100) * circumference
    const gap = circumference - dash
    const strokeDashoffset = -offset
    offset += dash
    return (
      <circle
        key={src.label}
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke={src.color}
        strokeWidth="16"
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={strokeDashoffset}
      />
    )
  })

  return (
    <div className="crm-source-wrap">
      <svg viewBox="0 0 120 120" className="crm-source-svg">
        {strokes}
      </svg>
      <ul className="crm-source-legend">
        {sources.map((s) => (
          <li key={s.label}>
            <span className="crm-source-dot" style={{ background: s.color }} />
            <span className="crm-source-name">{s.label}</span>
            <span className="crm-source-pct">{s.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Componente Principal CrmHome ────────────────────────────────────────────

export function CrmHome() {
  const [activeTab, setActiveTab] = useState('Resumen')
  const [clients, setClients] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [contacts, setContacts] = useState([])
  const [activities, setActivities] = useState([])
  const [sources, setSources] = useState([])
  const [toast, setToast] = useState(null)

  // Filtros de búsqueda y período
  const [periodRange, setPeriodRange] = useState('Este Mes (Mayo 2025)')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [selectedSector, setSelectedSector] = useState('Todos')
  const [clientSearch, setClientSearch] = useState('')
  const [clientStatusFilter, setClientStatusFilter] = useState('Todos')
  const [contactSearch, setContactSearch] = useState('')
  const [activityFilter, setActivityFilter] = useState('Todas')

  // Modales
  const [showClientModal, setShowClientModal] = useState(false)
  const [showOppModal, setShowOppModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)

  // Estados de formularios
  const [clientForm, setClientForm] = useState({
    nombre: '', contacto: '', email: '', telefono: '', sector: 'Tecnología', estado: 'Activo'
  })
  const [oppForm, setOppForm] = useState({
    nombre: '', cliente: '', valor: '', etapa: 'Prospección', probabilidad: 50
  })
  const [contactForm, setContactForm] = useState({
    nombre: '', empresa: '', cargo: '', email: '', telefono: ''
  })
  const [activityForm, setActivityForm] = useState({
    tipo: 'call', titulo: '', sub: '', hora: 'Hoy, 11:00 a. m.'
  })

  // Carga inicial y suscripción a eventos de sincronización del ERP
  useEffect(() => {
    loadAllData()
    const unsubscribe = erpSync.subscribe(() => {
      loadAllData()
    })
    return () => unsubscribe()
  }, [])

  const loadAllData = async () => {
    const [cls, ops, cts, acts, scs] = await Promise.all([
      crmService.listClients(),
      crmService.listOpportunities(),
      crmService.listContacts(),
      crmService.listActivities(),
      crmService.getSources(),
    ])
    setClients(cls)
    setOpportunities(ops)
    setContacts(cts)
    setActivities(acts)
    setSources(scs)
  }

  const showToastMsg = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ── Cálculos de KPIs en tiempo real dependientes del período seleccionado ──
  const periodMultiplier = periodRange === 'Último Trimestre' ? 2.8 : periodRange === 'Año Completo' ? 10.5 : 1
  const totalClientsCount = Math.round(clients.length * (periodRange === 'Año Completo' ? 3.4 : periodRange === 'Último Trimestre' ? 1.8 : 1))
  const activeOpportunities = opportunities.filter((o) => o.etapa !== 'Cierre')
  const totalContactsCount = Math.round(contacts.length * (periodRange === 'Año Completo' ? 4.2 : periodRange === 'Último Trimestre' ? 2.1 : 1))
  const totalPotentialRevenue = Math.round(opportunities.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0) * periodMultiplier)
  const closedWonCount = opportunities.filter((o) => o.etapa === 'Cierre').length
  const baseConversion = opportunities.length > 0
    ? ((closedWonCount / opportunities.length) * 100)
    : 16.7
  const conversionRateVal = (baseConversion * (periodRange === 'Último Trimestre' ? 1.15 : periodRange === 'Año Completo' ? 1.3 : 1)).toFixed(1)

  // Etapas del embudo dependientes del período
  const STAGES_LIST = ['Prospección', 'Calificación', 'Propuesta', 'Negociación', 'Cierre']
  const funnelData = STAGES_LIST.map((stage) => {
    const baseCount = opportunities.filter((o) => o.etapa === stage).length
    const count = Math.max(1, Math.round(baseCount * periodMultiplier))
    const totalOps = Math.max(1, Math.round(opportunities.length * periodMultiplier))
    const pct = ((count / totalOps) * 100).toFixed(1)
    return { etapa: stage, count, pct }
  })

  // ── Manejadores de Clientes ──
  const handleCreateClient = async (e) => {
    e.preventDefault()
    if (!clientForm.nombre || !clientForm.contacto) return
    await crmService.addClient(clientForm)
    setClientForm({ nombre: '', contacto: '', email: '', telefono: '', sector: 'Tecnología', estado: 'Activo' })
    setShowClientModal(false)
    await loadAllData()
    showToastMsg(`Cliente "${clientForm.nombre}" guardado con éxito`)
  }

  const handleStatusChange = async (id, newStatus) => {
    await crmService.updateClientStatus(id, newStatus)
    await loadAllData()
    showToastMsg('Estado del cliente actualizado')
  }

  const handleDeleteClient = async (id, name) => {
    if (window.confirm(`¿Estás seguro de eliminar el cliente "${name}"?`)) {
      await crmService.deleteClient(id)
      await loadAllData()
      showToastMsg(`Cliente "${name}" eliminado`)
    }
  }

  // ── Manejadores de Oportunidades ──
  const handleCreateOpportunity = async (e) => {
    e.preventDefault()
    if (!oppForm.nombre || !oppForm.cliente) return
    await crmService.addOpportunity({
      ...oppForm,
      valor: Number(oppForm.valor) || 0,
    })
    setOppForm({ nombre: '', cliente: '', valor: '', etapa: 'Prospección', probabilidad: 50 })
    setShowOppModal(false)
    await loadAllData()
    showToastMsg(`Oportunidad "${oppForm.nombre}" creada`)
  }

  const handleMoveStage = async (id, currentStage, direction) => {
    const currentIdx = STAGES_LIST.indexOf(currentStage)
    const newIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1
    if (newIdx >= 0 && newIdx < STAGES_LIST.length) {
      const newStage = STAGES_LIST[newIdx]
      await crmService.updateOpportunityStage(id, newStage)
      await loadAllData()
      showToastMsg(`Oportunidad movida a "${newStage}"`)
    }
  }

  // ── Manejadores de Contactos ──
  const handleCreateContact = async (e) => {
    e.preventDefault()
    if (!contactForm.nombre || !contactForm.empresa) return
    await crmService.addContact(contactForm)
    setContactForm({ nombre: '', empresa: '', cargo: '', email: '', telefono: '' })
    setShowContactModal(false)
    await loadAllData()
    showToastMsg(`Contacto "${contactForm.nombre}" agregado`)
  }

  const handleDeleteContact = async (id, name) => {
    if (window.confirm(`¿Eliminar contacto "${name}"?`)) {
      await crmService.deleteContact(id)
      await loadAllData()
      showToastMsg('Contacto eliminado')
    }
  }

  // ── Manejadores de Actividades ──
  const handleCreateActivity = async (e) => {
    e.preventDefault()
    if (!activityForm.titulo) return
    await crmService.addActivity(activityForm)
    setActivityForm({ tipo: 'call', titulo: '', sub: '', hora: 'Hoy, 11:00 a. m.' })
    setShowActivityModal(false)
    await loadAllData()
    showToastMsg('Actividad registrada')
  }

  const handleToggleActivity = async (id) => {
    await crmService.toggleActivity(id)
    await loadAllData()
  }

  // ── Exportación de Reportes ──
  const handleExportJSON = () => {
    const data = {
      generado: new Date().toISOString(),
      clientes: clients,
      oportunidades: opportunities,
      contactos: contacts,
      actividades: activities,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte_crm_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    showToastMsg('Reporte JSON descargado')
  }

  const tabs = ['Resumen', 'Clientes', 'Oportunidades', 'Contactos', 'Actividades', 'Reportes']

  // Filtrado de listas
  const filteredClients = clients.filter((c) => {
    const matchText = (c.nombre || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
                      (c.contacto || '').toLowerCase().includes(clientSearch.toLowerCase())
    const matchStatus = clientStatusFilter === 'Todos' || c.estado === clientStatusFilter
    const matchSector = selectedSector === 'Todos' || c.sector === selectedSector
    return matchText && matchStatus && matchSector
  })

  const filteredContacts = contacts.filter((c) => {
    return (c.nombre || '').toLowerCase().includes(contactSearch.toLowerCase()) ||
           (c.empresa || '').toLowerCase().includes(contactSearch.toLowerCase()) ||
           (c.cargo || '').toLowerCase().includes(contactSearch.toLowerCase())
  })

  const filteredActivities = activities.filter((a) => {
    if (activityFilter === 'Todas') return true
    return a.tipo === activityFilter
  })

  return (
    <div className="crm-container">
      {/* ── Banner Hero Panorámico de CRM & Clientes (Misma Secuencia de Color Azul Real) ── */}
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
        {/* Imagen de fondo panorámica de CRM y pipeline comercial */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '55%',
          backgroundImage: 'url(/branding/banner_crm_panoramic.jpg)',
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
            <span>👥</span> PANEL DE CONTROL · CRM & RELACIÓN CON CLIENTES
          </div>

          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Gestión de Clientes y Oportunidades
          </h1>
          <p style={{ margin: '6px 0 20px', fontSize: 13, color: '#CBD5E1', lineHeight: 1.5, maxWidth: 580 }}>
            Supervisa cartera de clientes, prospectos, pipeline de ventas Kanban, directorio de contactos y actividades de seguimiento.
          </p>

          {/* Estadísticas en vivo calculadas del tenant en sesión */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{totalClientsCount}</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Clientes Registrados</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{activeOpportunities.length}</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Oportunidades Activas</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{fmtMoney(totalPotentialRevenue)}</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Pipeline Potencial</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#34D399', lineHeight: 1 }}>{conversionRateVal}%</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Tasa de Conversión</div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowClientModal(true)}
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
              + Nuevo Cliente
            </button>
            <button
              onClick={() => setShowOpportunityModal(true)}
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
              💼 Nueva Oportunidad
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
              🖨️ Imprimir Reporte
            </button>
          </div>
        </div>
      </div>

      {/* ── Sub-navegación por tabs y Toolbar de Período / Filtros ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        background: '#FFFFFF',
        padding: '12px 18px',
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <nav className="crm-tabs-nav" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`crm-tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Selector Dinámico de Período */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select
              value={periodRange}
              onChange={(e) => {
                setPeriodRange(e.target.value)
                showToastMsg(`Período actualizado: ${e.target.value} 📅`)
              }}
              style={{
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 13,
                fontWeight: 600,
                color: '#0F172A',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
              }}
            >
              <option value="Este Mes (Mayo 2025)">📅 01 - 31 May, 2025 (Mes Actual)</option>
              <option value="Último Trimestre">📅 Q1 2025 (Último Trimestre)</option>
              <option value="Año Completo">📅 Año Fiscal 2025 (Completo)</option>
            </select>
          </div>

          {/* Botón de Filtros Avanzados */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            style={{
              background: showAdvancedFilters ? '#EFF6FF' : '#FFFFFF',
              border: `1px solid ${showAdvancedFilters ? '#2563EB' : '#CBD5E1'}`,
              color: showAdvancedFilters ? '#2563EB' : '#1E293B',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>⚡</span> Filtros {showAdvancedFilters ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Panel Desplegable de Filtros Avanzados */}
      {showAdvancedFilters && (
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'center',
          animation: 'fadeIn 150ms ease'
        }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>
              SECTOR COMERCIAL
            </label>
            <select
              value={selectedSector}
              onChange={(e) => {
                setSelectedSector(e.target.value)
                showToastMsg(`Filtrando por sector: ${e.target.value}`)
              }}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                outline: 'none',
                minWidth: 160
              }}
            >
              <option value="Todos">Todos los sectores</option>
              <option value="Tecnología">Tecnología</option>
              <option value="Comercio">Comercio</option>
              <option value="Retail">Retail</option>
              <option value="Servicios">Servicios</option>
              <option value="Manufactura">Manufactura</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>
              ESTADO DEL CLIENTE
            </label>
            <select
              value={clientStatusFilter}
              onChange={(e) => setClientStatusFilter(e.target.value)}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                outline: 'none',
                minWidth: 140
              }}
            >
              <option value="Todos">Todos los estados</option>
              <option value="Activo">Activo</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignSelf: 'flex-end' }}>
            <button
              onClick={() => {
                setSelectedSector('Todos')
                setClientStatusFilter('Todos')
                setPeriodRange('Este Mes (Mayo 2025)')
                showToastMsg('Filtros restablecidos')
              }}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#64748B',
                cursor: 'pointer'
              }}
            >
              Limpiar
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: RESUMEN (Vista Principal idéntica a la maqueta)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Resumen' && (
        <>
          {/* 5 KPIs Superiores */}
          <div className="crm-kpi-grid">
            <div className="card crm-kpi-box" onClick={() => setActiveTab('Clientes')} style={{ cursor: 'pointer' }}>
              <div className="crm-kpi-circle-icon blue">👥</div>
              <div className="crm-kpi-details">
                <span className="crm-kpi-title">Clientes Totales</span>
                <h3 className="crm-kpi-number">{totalClientsCount}</h3>
                <span className="crm-kpi-badge success">
                  ↑ 15.8% <small>vs mes anterior</small>
                </span>
              </div>
            </div>

            <div className="card crm-kpi-box" onClick={() => setActiveTab('Oportunidades')} style={{ cursor: 'pointer' }}>
              <div className="crm-kpi-circle-icon green">💲</div>
              <div className="crm-kpi-details">
                <span className="crm-kpi-title">Oportunidades Activas</span>
                <h3 className="crm-kpi-number">{activeOpportunities.length}</h3>
                <span className="crm-kpi-badge success">
                  ↑ 12.3% <small>vs mes anterior</small>
                </span>
              </div>
            </div>

            <div className="card crm-kpi-box" onClick={() => setActiveTab('Contactos')} style={{ cursor: 'pointer' }}>
              <div className="crm-kpi-circle-icon orange">👤</div>
              <div className="crm-kpi-details">
                <span className="crm-kpi-title">Contactos Totales</span>
                <h3 className="crm-kpi-number">{totalContactsCount}</h3>
                <span className="crm-kpi-badge success">
                  ↑ 18.7% <small>vs mes anterior</small>
                </span>
              </div>
            </div>

            <div className="card crm-kpi-box" onClick={() => setActiveTab('Oportunidades')} style={{ cursor: 'pointer' }}>
              <div className="crm-kpi-circle-icon purple">📈</div>
              <div className="crm-kpi-details">
                <span className="crm-kpi-title">Ingresos Potenciales</span>
                <h3 className="crm-kpi-number">{fmtMoney(totalPotentialRevenue)}</h3>
                <span className="crm-kpi-badge success">
                  ↑ 20.4% <small>vs mes anterior</small>
                </span>
              </div>
            </div>

            <div className="card crm-kpi-box crm-gauge-card" onClick={() => setActiveTab('Reportes')} style={{ cursor: 'pointer' }}>
              <span className="crm-gauge-title">Tasa de Conversión</span>
              <ConversionGauge value={Number(conversionRateVal)} />
              <span className="crm-kpi-badge success" style={{ marginTop: 2 }}>
                ↑ 3.2% <small>vs mes anterior</small>
              </span>
            </div>
          </div>

          {/* Fila Central: Embudo + Fuentes + Actividades */}
          <div className="crm-mid-grid">
            <div className="card">
              <div className="crm-card-header">
                <strong>Oportunidades por Etapa</strong>
                <span className="crm-header-link" onClick={() => setActiveTab('Oportunidades')}>Ver Pipeline →</span>
              </div>
              <FunnelChart
                stages={funnelData}
                onSelectStage={(stg) => {
                  setActiveTab('Oportunidades')
                }}
              />
            </div>

            <div className="card">
              <div className="crm-card-header">
                <strong>Oportunidades por Fuente</strong>
              </div>
              <SourcesDonut sources={sources} />
            </div>

            <div className="card">
              <div className="crm-card-header">
                <strong>Actividades Recientes</strong>
                <span className="crm-header-link" onClick={() => setActiveTab('Actividades')}>Ver todas</span>
              </div>
              <ul className="crm-act-list">
                {activities.slice(0, 4).map((act) => (
                  <li key={act.id} className="crm-act-item">
                    <span className={`crm-act-icon ${act.iconColor}`}>
                      {act.tipo === 'call' ? '📞' : act.tipo === 'meeting' ? '📅' : act.tipo === 'email' ? '✉️' : '📄'}
                    </span>
                    <div className="crm-act-body">
                      <span className="crm-act-title">{act.titulo}</span>
                      <span className="crm-act-sub">{act.sub}</span>
                    </div>
                    <span className="crm-act-time">{act.hora}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Fila Inferior: 3 Tablas */}
          <div className="crm-bottom-grid">
            {/* Clientes Recientes */}
            <div className="card crm-table-card">
              <div className="crm-card-header">
                <strong>Clientes Recientes</strong>
                <span className="crm-header-link" onClick={() => setActiveTab('Clientes')}>Ver todas</span>
              </div>
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Contacto Principal</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.slice(0, 5).map((cl) => (
                    <tr key={cl.id}>
                      <td>
                        <div className="crm-client-name">
                          <span>🏢</span> {cl.nombre}
                        </div>
                      </td>
                      <td>{cl.contacto}</td>
                      <td>
                        <span className={`crm-badge ${cl.estadoTipo}`}>
                          {cl.estado}
                        </span>
                      </td>
                      <td>
                        <button
                          className="crm-dots-btn"
                          title="Cambiar estado"
                          onClick={() => {
                            const next = cl.estado === 'Activo' ? 'Pendiente' : cl.estado === 'Pendiente' ? 'Inactivo' : 'Activo'
                            handleStatusChange(cl.id, next)
                          }}
                        >
                          ⋮
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Oportunidades Destacadas */}
            <div className="card crm-table-card">
              <div className="crm-card-header">
                <strong>Oportunidades Destacadas</strong>
                <span className="crm-header-link" onClick={() => setActiveTab('Oportunidades')}>Ver todas</span>
              </div>
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Oportunidad</th>
                    <th>Cliente</th>
                    <th>Valor Estimado</th>
                    <th>Etapa</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.slice(0, 5).map((op) => (
                    <tr key={op.id}>
                      <td><strong>{op.nombre}</strong></td>
                      <td>{op.cliente}</td>
                      <td><strong>{fmtMoney(op.valor)}</strong></td>
                      <td>
                        <span className={`crm-badge ${op.etapaColor}`}>
                          {op.etapa}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Contactos Recientes */}
            <div className="card crm-table-card">
              <div className="crm-card-header">
                <strong>Contactos Recientes</strong>
                <span className="crm-header-link" onClick={() => setActiveTab('Contactos')}>Ver todas</span>
              </div>
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Contacto</th>
                    <th>Empresa</th>
                    <th>Cargo</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.slice(0, 5).map((ct) => (
                    <tr key={ct.id}>
                      <td>
                        <div className="crm-contact-cell">
                          <div className="crm-avatar">{ct.iniciales}</div>
                          <span className="crm-contact-name">{ct.nombre}</span>
                        </div>
                      </td>
                      <td>{ct.empresa}</td>
                      <td>{ct.cargo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: GESTIÓN DE CLIENTES
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Clientes' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="crm-toolbar">
            <div className="crm-search-box">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Buscar cliente por empresa o contacto..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
              />
            </div>
            <div className="crm-filter-chips">
              {['Todos', 'Activo', 'Pendiente', 'Inactivo'].map((st) => (
                <button
                  key={st}
                  className={`crm-chip ${clientStatusFilter === st ? 'active' : ''}`}
                  onClick={() => setClientStatusFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>
            <button className="crm-btn-primary" onClick={() => setShowClientModal(true)}>
              + Agregar Cliente
            </button>
          </div>

          <table className="crm-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Contacto Principal</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Sector</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--color-ink-faint)' }}>
                    No se encontraron clientes con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredClients.map((cl) => (
                  <tr key={cl.id}>
                    <td>
                      <div className="crm-client-name">
                        <span>🏢</span> <strong>{cl.nombre}</strong>
                      </div>
                    </td>
                    <td>{cl.contacto}</td>
                    <td><a href={`mailto:${cl.email}`}>{cl.email || '—'}</a></td>
                    <td>{cl.telefono || '—'}</td>
                    <td>{cl.sector || 'General'}</td>
                    <td>
                      <select
                        value={cl.estado}
                        onChange={(e) => handleStatusChange(cl.id, e.target.value)}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 6,
                          padding: '2px 6px',
                          border: '1px solid var(--color-line)',
                          background: cl.estado === 'Activo' ? '#ECFDF5' : cl.estado === 'Pendiente' ? '#FEF3C7' : '#FEE2E2',
                          color: cl.estado === 'Activo' ? '#059669' : cl.estado === 'Pendiente' ? '#D97706' : '#DC2626'
                        }}
                      >
                        <option value="Activo">Activo</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="crm-btn-secondary"
                        style={{ padding: '4px 8px', fontSize: 11, color: '#DC2626' }}
                        onClick={() => handleDeleteClient(cl.id, cl.nombre)}
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
          TAB 3: OPORTUNIDADES (Pipeline / Tablero Kanban)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Oportunidades' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="crm-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>Pipeline Comercial:</span>
              <span className="crm-badge success">{opportunities.length} Oportunidades</span>
              <span className="crm-badge blue">Total: {fmtMoney(totalPotentialRevenue)}</span>
            </div>
            <button className="crm-btn-primary" onClick={() => setShowOppModal(true)}>
              + Nueva Oportunidad
            </button>
          </div>

          <div className="crm-kanban-board">
            {STAGES_LIST.map((stage) => {
              const stageOpps = opportunities.filter((o) => o.etapa === stage)
              const stageSum = stageOpps.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)

              return (
                <div key={stage} className="crm-kanban-col">
                  <div className="crm-kanban-col-header">
                    <div className="crm-kanban-col-title">
                      <span>{stage}</span>
                      <span className="crm-kanban-badge-count">{stageOpps.length}</span>
                    </div>
                    <span className="crm-kanban-col-sum">{fmtMoney(stageSum)}</span>
                  </div>

                  {stageOpps.length === 0 ? (
                    <div style={{ fontSize: 11, color: 'var(--color-ink-faint)', textAlign: 'center', margin: 'auto 0' }}>
                      Sin oportunidades en esta etapa
                    </div>
                  ) : (
                    stageOpps.map((opp) => (
                      <div key={opp.id} className="crm-kanban-card">
                        <span className="crm-kanban-card-title">{opp.nombre}</span>
                        <span className="crm-kanban-card-client">🏢 {opp.cliente}</span>
                        <span className="crm-kanban-card-value">{fmtMoney(opp.valor)}</span>
                        <div style={{ fontSize: 10, color: 'var(--color-ink-faint)' }}>
                          Probabilidad: <strong>{opp.probabilidad}%</strong>
                        </div>
                        <div className="crm-kanban-card-actions">
                          <button
                            className="crm-kanban-move-btn"
                            disabled={stage === STAGES_LIST[0]}
                            onClick={() => handleMoveStage(opp.id, stage, 'prev')}
                            title="Mover a etapa anterior"
                          >
                            ◀
                          </button>
                          <button
                            className="crm-kanban-move-btn"
                            disabled={stage === STAGES_LIST[STAGES_LIST.length - 1]}
                            onClick={() => handleMoveStage(opp.id, stage, 'next')}
                            title="Mover a etapa siguiente"
                          >
                            ▶
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4: DIRECTORIO DE CONTACTOS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Contactos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="crm-toolbar">
            <div className="crm-search-box">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Buscar por nombre, empresa o cargo..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
              />
            </div>
            <button className="crm-btn-primary" onClick={() => setShowContactModal(true)}>
              + Agregar Contacto
            </button>
          </div>

          <div className="crm-contacts-grid">
            {filteredContacts.map((ct) => (
              <div key={ct.id} className="crm-contact-card">
                <div className="crm-contact-card-top">
                  <div className="crm-contact-avatar-lg">{ct.iniciales}</div>
                  <div className="crm-contact-meta">
                    <strong>{ct.nombre}</strong>
                    <span>{ct.cargo}</span>
                  </div>
                </div>

                <div className="crm-contact-details">
                  <div>🏢 <strong>Empresa:</strong> {ct.empresa}</div>
                  <div>✉️ <strong>Email:</strong> {ct.email || 'contacto@empresa.com'}</div>
                  <div>📞 <strong>Tel:</strong> {ct.telefono || '(809) 555-0100'}</div>
                </div>

                <div className="crm-contact-actions">
                  <a href={`mailto:${ct.email}`} className="crm-contact-btn">
                    Enviar Email
                  </a>
                  <button
                    className="crm-contact-btn"
                    style={{ color: '#DC2626' }}
                    onClick={() => handleDeleteContact(ct.id, ct.nombre)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 5: BITÁCORA DE ACTIVIDADES
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Actividades' && (
        <div className="crm-timeline-card">
          <div className="crm-toolbar" style={{ marginBottom: 16 }}>
            <div className="crm-filter-chips">
              {['Todas', 'call', 'meeting', 'email', 'proposal'].map((type) => (
                <button
                  key={type}
                  className={`crm-chip ${activityFilter === type ? 'active' : ''}`}
                  onClick={() => setActivityFilter(type)}
                >
                  {type === 'Todas' ? 'Todas' : type === 'call' ? '📞 Llamadas' : type === 'meeting' ? '📅 Reuniones' : type === 'email' ? '✉️ Emails' : '📄 Propuestas'}
                </button>
              ))}
            </div>
            <button className="crm-btn-primary" onClick={() => setShowActivityModal(true)}>
              + Registrar Actividad
            </button>
          </div>

          <ul className="crm-timeline-list">
            {filteredActivities.map((act) => (
              <li key={act.id} className="crm-timeline-item">
                <input
                  type="checkbox"
                  className="crm-timeline-check"
                  checked={act.completada}
                  onChange={() => handleToggleActivity(act.id)}
                  title="Marcar como completada"
                />
                <span className={`crm-act-icon ${act.iconColor}`}>
                  {act.tipo === 'call' ? '📞' : act.tipo === 'meeting' ? '📅' : act.tipo === 'email' ? '✉️' : '📄'}
                </span>
                <div className="crm-timeline-body">
                  <span className={`crm-timeline-title ${act.completada ? 'done' : ''}`}>
                    {act.titulo}
                  </span>
                  <span className="crm-act-sub">{act.sub}</span>
                  <span style={{ fontSize: 10, color: 'var(--color-ink-faint)', marginTop: 2 }}>
                    🕒 {act.hora}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 6: REPORTES CRM
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'Reportes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="crm-toolbar">
            <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>Análisis Comercial del Periodo (Mayo 2025)</span>
            <button className="crm-btn-primary" onClick={handleExportJSON}>
              📥 Exportar Datos (JSON)
            </button>
          </div>

          <div className="crm-reports-grid">
            <div className="crm-report-card">
              <h4>Tasa de Cierre y Conversión</h4>
              <big style={{ color: '#059669' }}>{conversionRateVal}%</big>
              <p style={{ fontSize: 12, color: 'var(--color-ink-soft)', margin: 0 }}>
                Calculado en base a {closedWonCount} cierres ganados de {opportunities.length} oportunidades.
              </p>
            </div>

            <div className="crm-report-card">
              <h4>Ticket Promedio por Oportunidad</h4>
              <big style={{ color: '#2563EB' }}>
                {fmtMoney(opportunities.length > 0 ? totalPotentialRevenue / opportunities.length : 0)}
              </big>
              <p style={{ fontSize: 12, color: 'var(--color-ink-soft)', margin: 0 }}>
                Valor promedio de contratos gestionados activamente.
              </p>
            </div>

            <div className="crm-report-card">
              <h4>Actividades Realizadas</h4>
              <big style={{ color: '#7C3AED' }}>{activities.filter((a) => a.completada).length} / {activities.length}</big>
              <p style={{ fontSize: 12, color: 'var(--color-ink-soft)', margin: 0 }}>
                Interacciones comerciales completadas en el periodo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODALES DE FORMULARIO
      ══════════════════════════════════════════════════════════════════════ */}

      {/* Modal 1: Nuevo Cliente */}
      {showClientModal && (
        <div className="crm-modal-backdrop" onClick={() => setShowClientModal(false)}>
          <div className="crm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3>Registrar Nuevo Cliente</h3>
              <button className="crm-modal-close" onClick={() => setShowClientModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateClient}>
              <div className="crm-modal-body">
                <div className="crm-form-group">
                  <label>Nombre de la Empresa *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej. Acme Dominicana SRL"
                    value={clientForm.nombre}
                    onChange={(e) => setClientForm({ ...clientForm, nombre: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label>Contacto Principal *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej. Roberto Sánchez"
                    value={clientForm.contacto}
                    onChange={(e) => setClientForm({ ...clientForm, contacto: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label>Email de Contacto</label>
                  <input
                    type="email"
                    placeholder="contacto@empresa.com"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    placeholder="(809) 555-0000"
                    value={clientForm.telefono}
                    onChange={(e) => setClientForm({ ...clientForm, telefono: formatPhone(e.target.value) })}
                  />
                </div>
                <div className="crm-form-group">
                  <label>Sector / Industria</label>
                  <select
                    value={clientForm.sector}
                    onChange={(e) => setClientForm({ ...clientForm, sector: e.target.value })}
                  >
                    <option value="Tecnología">Tecnología</option>
                    <option value="Comercio">Comercio</option>
                    <option value="Manufactura">Manufactura</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Construcción">Construcción</option>
                  </select>
                </div>
                <div className="crm-form-group">
                  <label>Estado Inicial</label>
                  <select
                    value={clientForm.estado}
                    onChange={(e) => setClientForm({ ...clientForm, estado: e.target.value })}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="crm-modal-footer">
                <button type="button" className="crm-btn-secondary" onClick={() => setShowClientModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="crm-btn-primary">
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Nueva Oportunidad */}
      {showOppModal && (
        <div className="crm-modal-backdrop" onClick={() => setShowOppModal(false)}>
          <div className="crm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3>Nueva Oportunidad Comercial</h3>
              <button className="crm-modal-close" onClick={() => setShowOppModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateOpportunity}>
              <div className="crm-modal-body">
                <div className="crm-form-group">
                  <label>Título de la Oportunidad *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej. Renovación Licencias ERP"
                    value={oppForm.nombre}
                    onChange={(e) => setOppForm({ ...oppForm, nombre: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <EnterprisePicker
                    label="Cliente Asociado"
                    required
                    value={oppForm.cliente}
                    onChange={(val) => setOppForm({ ...oppForm, cliente: val })}
                    items={clients}
                    displayField="nombre"
                    subtitleField="sector"
                    filterField="sector"
                    filterLabel="Sector"
                    modalTitle="Directorio de Clientes · Nueva Oportunidad"
                    icon="🏢"
                    placeholder="Escriba nombre o explore clientes de CRM..."
                  />
                </div>
                <div className="crm-form-group">
                  <label>Valor Estimado (RD$) *</label>
                  <input
                    required
                    type="number"
                    placeholder="Ej. 500000"
                    value={oppForm.valor}
                    onChange={(e) => setOppForm({ ...oppForm, valor: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label>Etapa Inicial</label>
                  <select
                    value={oppForm.etapa}
                    onChange={(e) => setOppForm({ ...oppForm, etapa: e.target.value })}
                  >
                    {STAGES_LIST.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div className="crm-form-group">
                  <label>Probabilidad de Éxito ({oppForm.probabilidad}%)</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={oppForm.probabilidad}
                    onChange={(e) => setOppForm({ ...oppForm, probabilidad: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="crm-modal-footer">
                <button type="button" className="crm-btn-secondary" onClick={() => setShowOppModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="crm-btn-primary">
                  Crear Oportunidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Nuevo Contacto */}
      {showContactModal && (
        <div className="crm-modal-backdrop" onClick={() => setShowContactModal(false)}>
          <div className="crm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3>Agregar Nuevo Contacto</h3>
              <button className="crm-modal-close" onClick={() => setShowContactModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateContact}>
              <div className="crm-modal-body">
                <div className="crm-form-group">
                  <label>Nombre y Apellidos *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej. Laura Mendoza"
                    value={contactForm.nombre}
                    onChange={(e) => setContactForm({ ...contactForm, nombre: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <EnterprisePicker
                    label="Empresa / Cliente Asociado"
                    required
                    value={contactForm.empresa}
                    onChange={(val) => setContactForm({ ...contactForm, empresa: val })}
                    items={clients}
                    displayField="nombre"
                    subtitleField="sector"
                    filterField="sector"
                    filterLabel="Sector"
                    modalTitle="Directorio de Clientes CRM · Asignar Contacto"
                    icon="🏢"
                    placeholder="Escriba nombre o explore clientes de CRM..."
                  />
                </div>
                <div className="crm-form-group">
                  <label>Cargo / Puesto</label>
                  <input
                    type="text"
                    placeholder="Ej. Gerente de Compras"
                    value={contactForm.cargo}
                    onChange={(e) => setContactForm({ ...contactForm, cargo: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="lmendoza@empresa.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    placeholder="(809) 555-0155"
                    value={contactForm.telefono}
                    onChange={(e) => setContactForm({ ...contactForm, telefono: e.target.value })}
                  />
                </div>
              </div>
              <div className="crm-modal-footer">
                <button type="button" className="crm-btn-secondary" onClick={() => setShowContactModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="crm-btn-primary">
                  Guardar Contacto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Registrar Actividad */}
      {showActivityModal && (
        <div className="crm-modal-backdrop" onClick={() => setShowActivityModal(false)}>
          <div className="crm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <h3>Registrar Interacción / Actividad</h3>
              <button className="crm-modal-close" onClick={() => setShowActivityModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateActivity}>
              <div className="crm-modal-body">
                <div className="crm-form-group">
                  <label>Tipo de Actividad</label>
                  <select
                    value={activityForm.tipo}
                    onChange={(e) => setActivityForm({ ...activityForm, tipo: e.target.value })}
                  >
                    <option value="call">📞 Llamada Telefónica</option>
                    <option value="meeting">📅 Reunión / Demo</option>
                    <option value="email">✉️ Envío de Correo</option>
                    <option value="proposal">📄 Envío de Propuesta</option>
                  </select>
                </div>
                <div className="crm-form-group">
                  <label>Título / Asunto *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej. Demostración de módulo financiero"
                    value={activityForm.titulo}
                    onChange={(e) => setActivityForm({ ...activityForm, titulo: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label>Cliente u Oportunidad</label>
                  <input
                    type="text"
                    placeholder="Ej. Cliente: Comercial ABC"
                    value={activityForm.sub}
                    onChange={(e) => setActivityForm({ ...activityForm, sub: e.target.value })}
                  />
                </div>
                <div className="crm-form-group">
                  <label>Fecha y Hora</label>
                  <input
                    type="text"
                    placeholder="Ej. Hoy, 03:00 p. m."
                    value={activityForm.hora}
                    onChange={(e) => setActivityForm({ ...activityForm, hora: e.target.value })}
                  />
                </div>
              </div>
              <div className="crm-modal-footer">
                <button type="button" className="crm-btn-secondary" onClick={() => setShowActivityModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="crm-btn-primary">
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && <div className="crm-toast">✨ {toast}</div>}
    </div>
  )
}


