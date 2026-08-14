/*
  RrhhHome.jsx — Módulo de Recursos Humanos (appes.erp)
  7 Pestañas: Resumen, Empleados, Asistencia, Nómina, Vacaciones, Desempeño, Reclutamiento.
  Completamente funcional con localStorage y sin tocar otros módulos.
*/
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { rrhhService } from '../services/rrhh.service'
import './RrhhHome.css'

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(n) {
  return 'RD$ ' + Number(n).toLocaleString('es-DO')
}

function avatarColor(idx) {
  const colors = ['', 'green', 'orange', 'purple', 'red']
  return colors[idx % colors.length]
}

// ── Donut SVG ─────────────────────────────────────────────────────────────────

function DonutChart({ segments, total, centerLabel, centerSub }) {
  const R = 50, cx = 60, cy = 60
  const circ = 2 * Math.PI * R
  let offset = 0
  return (
    <div className="rrhh-donut-wrap" style={{ width: 120, height: 120 }}>
      <svg viewBox="0 0 120 120" style={{ width: 120, height: 120, transform: 'rotate(-90deg)' }}>
        {segments.map((seg, i) => {
          const len = (seg.pct / 100) * circ
          const el = (
            <circle
              key={i}
              cx={cx} cy={cy} r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth="16"
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-offset}
            />
          )
          offset += len
          return el
        })}
        <circle cx={cx} cy={cy} r={42} fill="#fff" />
      </svg>
      <div className="rrhh-donut-center">
        <strong style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{total}</strong>
        <small style={{ fontSize: 9, color: '#94A3B8' }}>{centerSub}</small>
      </div>
    </div>
  )
}

// ── Gauge semicircular ────────────────────────────────────────────────────────

function Gauge({ value, max = 100, color = '#10B981', size = 120 }) {
  const R = 42, cx = 60, cy = 56
  const circ = Math.PI * R  // semicírculo
  const fill = (value / max) * circ
  return (
    <div className="rrhh-gauge-wrap" style={{ width: size, height: size / 2 + 20 }}>
      <svg viewBox="0 0 120 65" style={{ width: size, height: size / 2 + 10 }}>
        <path d={`M 18,56 A ${R},${R} 0 0,1 102,56`} fill="none" stroke="#E2E8F0" strokeWidth="10" strokeLinecap="round" />
        <path d={`M 18,56 A ${R},${R} 0 0,1 102,56`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${fill} ${circ - fill}`} />
      </svg>
      <div className="rrhh-gauge-center">
        <strong style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{value}%</strong>
      </div>
    </div>
  )
}

// ── Mini Bar chart ────────────────────────────────────────────────────────────

function BarChart({ data, height = 70 }) {
  const max = Math.max(...data.map(d => d.val), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height, borderBottom: '1px solid #E2E8F0' }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 18, height: `${(d.val / max) * (height - 16)}px`, background: d.color || '#2563EB', borderRadius: '3px 3px 0 0' }} />
          <span style={{ fontSize: 9, color: '#94A3B8' }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── LineChart mini ─────────────────────────────────────────────────────────────

function LineChart({ data, width = 200, height = 70, color = '#2563EB' }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data) || 1
  const step = width / (data.length - 1)
  const pts = data.map((v, i) => {
    const x = i * step
    const y = height - 8 - ((v - min) / (max - min || 1)) * (height - 16)
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div className="rrhh-modal-backdrop" onClick={onClose}>
      <div className="rrhh-modal-box" onClick={e => e.stopPropagation()}>
        <div className="rrhh-modal-header">
          <h3>{title}</h3>
          <button className="rrhh-modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── TAB 1: RESUMEN RRHH ───────────────────────────────────────────────────────

function TabResumen({ empleados, asistencia, nomina, desempeno, setActiveTab, showToast }) {
  const activos = empleados.filter(e => e.estado === 'Activo').length
  const totalEmps = empleados.length
  const presentes = asistencia.filter(a => a.estado === 'Presente').length
  const totalNomina = nomina.reduce((acc, n) => acc + n.netoPagar, 0)
  const promedioDesempeno = desempeno.length
    ? Math.round(desempeno.reduce((acc, d) => acc + d.puntaje, 0) / desempeno.length)
    : 0

  const depts = [
    { dept: 'Ventas', count: 35, pct: 22, color: '#4F46E5' },
    { dept: 'Administración', count: 28, pct: 18, color: '#6366F1' },
    { dept: 'Almacén', count: 25, pct: 16, color: '#3B82F6' },
    { dept: 'Compras', count: 22, pct: 14, color: '#0EA5E9' },
    { dept: 'Contabilidad', count: 18, pct: 12, color: '#06B6D4' },
    { dept: 'Recursos Humanos', count: 16, pct: 10, color: '#10B981' },
    { dept: 'TI / Sistemas', count: 12, pct: 8, color: '#8B5CF6' },
  ]

  const cumpleanos = [
    { nombre: 'Ana Martínez', dept: 'Ventas', fecha: '22 May', av: 'AM', c: '' },
    { nombre: 'Juan Pérez', dept: 'Almacén', fecha: '24 May', av: 'JP', c: 'green' },
    { nombre: 'María Rodríguez', dept: 'Compras', fecha: '26 May', av: 'MR', c: 'orange' },
    { nombre: 'Luis Gómez', dept: 'Administración', fecha: '28 May', av: 'LG', c: 'purple' },
  ]

  const proxAusencias = [
    { nombre: 'María González', tipo: 'Vacaciones', inicio: '01/06/2025', fin: '08/06/2025' },
    { nombre: 'Luis Gómez', tipo: 'Permisos Personales', inicio: '03/06/2025', fin: '03/06/2025' },
    { nombre: 'Sofía Martínez', tipo: 'Vacaciones', inicio: '05/06/2025', fin: '19/06/2025' },
  ]

  const antiguedad = [
    { label: '< 1 año', pct: 18, color: '#DBEAFE' },
    { label: '1-2 años', pct: 27, color: '#BFDBFE' },
    { label: '2-5 años', pct: 23, color: '#93C5FD' },
    { label: '5-10 años', pct: 22, color: '#60A5FA' },
    { label: '> 10 años', pct: 10, color: '#3B82F6' },
  ]

  return (
    <>
      {/* KPIs */}
      <div className="rrhh-kpi-grid">
        <div className="rrhh-card rrhh-kpi-box" onClick={() => setActiveTab('Empleados')}>
          <div className="rrhh-kpi-icon blue">👥</div>
          <div>
            <div className="rrhh-kpi-label">Empleados Activos</div>
            <div className="rrhh-kpi-val">{activos}</div>
            <div className="rrhh-kpi-badge-up">↑ 2.7% vs mes anterior</div>
          </div>
        </div>
        <div className="rrhh-card rrhh-kpi-box" onClick={() => setActiveTab('Empleados')}>
          <div className="rrhh-kpi-icon green">➕</div>
          <div>
            <div className="rrhh-kpi-label">Nuevas Contrataciones</div>
            <div className="rrhh-kpi-val">5</div>
            <div style={{ fontSize: 11, color: '#64748B' }}>Este mes</div>
          </div>
        </div>
        <div className="rrhh-card rrhh-kpi-box" onClick={() => setActiveTab('Asistencia')}>
          <div className="rrhh-kpi-icon orange">📋</div>
          <div>
            <div className="rrhh-kpi-label">Ausencias Hoy</div>
            <div className="rrhh-kpi-val">3</div>
            <div style={{ fontSize: 11, color: '#64748B' }}>Empleados</div>
          </div>
        </div>
        <div className="rrhh-card rrhh-kpi-box">
          <div className="rrhh-kpi-icon purple">🎂</div>
          <div>
            <div className="rrhh-kpi-label">Cumpleaños del Mes</div>
            <div className="rrhh-kpi-val">7</div>
            <div style={{ fontSize: 11, color: '#64748B' }}>Empleados</div>
          </div>
        </div>
        <div className="rrhh-card rrhh-kpi-box" onClick={() => setActiveTab('Vacaciones')}>
          <div className="rrhh-kpi-icon red">🏖️</div>
          <div>
            <div className="rrhh-kpi-label">Vacaciones Pendientes</div>
            <div className="rrhh-kpi-val">12</div>
            <div style={{ fontSize: 11, color: '#64748B' }}>Empleados</div>
          </div>
        </div>
      </div>

      {/* Fila 3 tarjetas */}
      <div className="rrhh-grid-3">
        {/* Donut departamentos */}
        <div className="rrhh-card">
          <div className="rrhh-card-header">
            <strong>Distribución por Departamento</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <DonutChart
              segments={depts.map(d => ({ pct: d.pct, color: d.color }))}
              total={totalEmps}
              centerSub="Empleados"
            />
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {depts.slice(0, 5).map(d => (
                <li key={d.dept} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, color: '#64748B' }}>{d.dept}</span>
                  <strong>{d.count}</strong>
                  <span style={{ color: '#94A3B8' }}>({d.pct}%)</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rrhh-dept-list" style={{ marginTop: 12 }}>
            {depts.map(d => (
              <div key={d.dept} className="rrhh-dept-row">
                <div className="rrhh-dept-info">
                  <span>{d.dept}</span>
                  <span><strong>{d.count}</strong> ({d.pct}%)</span>
                </div>
                <div className="rrhh-bar-bg">
                  <div className="rrhh-bar-fill" style={{ width: `${d.pct * 4}%`, background: d.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ausencias del mes + Desempeño gauge */}
        <div className="rrhh-card">
          <div className="rrhh-card-header">
            <strong>Asistencia del Mes (Mayo 2025)</strong>
          </div>
          <div className="rrhh-attendance-summary">
            <div className="rrhh-att-kpi">
              <div className="rrhh-att-kpi-val" style={{ color: '#059669' }}>142</div>
              <div className="rrhh-att-kpi-label">Presentes</div>
              <div style={{ fontSize: 10, color: '#059669' }}>91.7%</div>
            </div>
            <div className="rrhh-att-kpi">
              <div className="rrhh-att-kpi-val" style={{ color: '#DC2626' }}>15</div>
              <div className="rrhh-att-kpi-label">Ausentes</div>
              <div style={{ fontSize: 10, color: '#DC2626' }}>9.6%</div>
            </div>
            <div className="rrhh-att-kpi">
              <div className="rrhh-att-kpi-val" style={{ color: '#D97706' }}>178</div>
              <div className="rrhh-att-kpi-label">Registros</div>
              <div style={{ fontSize: 10, color: '#D97706' }}>8.1%</div>
            </div>
          </div>
          <BarChart
            height={70}
            data={[
              { label: 'L', val: 22, color: '#4F46E5' }, { label: 'M', val: 20, color: '#4F46E5' },
              { label: 'X', val: 21, color: '#4F46E5' }, { label: 'J', val: 22, color: '#4F46E5' },
              { label: 'V', val: 20, color: '#4F46E5' }, { label: 'S', val: 10, color: '#E2E8F0' },
              { label: 'D', val: 5, color: '#E2E8F0' },
            ]}
          />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <DonutChart
                segments={[
                  { pct: 79, color: '#059669' }, { pct: 9, color: '#DC2626' }, { pct: 12, color: '#D97706' },
                ]}
                total="178"
                centerSub="Registros"
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 6, justifyContent: 'center', fontSize: 10 }}>
                <span style={{ color: '#059669' }}>● Presentes 79.8%</span>
                <span style={{ color: '#D97706' }}>● Ausentes 8.43%</span>
                <span style={{ color: '#DC2626' }}>● Tardanzas 11.62%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Desempeño */}
        <div className="rrhh-card">
          <div className="rrhh-card-header">
            <strong>Desempeño del Mes (MAY)</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Gauge value={promedioDesempeno || 87} color="#10B981" />
            <span style={{ fontSize: 12, color: '#64748B' }}>Promedio General</span>
            <span style={{ fontSize: 12, color: '#64748B' }}>+6.2% vs mes anterior</span>
          </div>
          {[
            { label: 'Excelente', count: 45, pct: 29, color: '#10B981' },
            { label: 'Bueno', count: 72, pct: 46, color: '#3B82F6' },
            { label: 'Regular', count: 28, pct: 18, color: '#F59E0B' },
            { label: 'Necesita Mejora', count: 11, pct: 7, color: '#EF4444' },
          ].map(lvl => (
            <div key={lvl.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginTop: 4 }}>
              <span style={{ width: 90, color: '#64748B' }}>{lvl.label}</span>
              <div style={{ flex: 1, height: 5, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${lvl.pct * 2}%`, background: lvl.color, height: '100%' }} />
              </div>
              <span style={{ width: 55, textAlign: 'right', color: '#64748B' }}><strong>{lvl.count}</strong> ({lvl.pct}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cumpleaños y próximas ausencias */}
      <div className="rrhh-grid-2">
        <div className="rrhh-card">
          <div className="rrhh-card-header">
            <strong>Cumpleaños del Mes</strong>
            <span className="rrhh-link">Ver todos</span>
          </div>
          <div className="rrhh-birthday-list">
            {cumpleanos.map(b => (
              <div key={b.nombre} className="rrhh-birthday-item">
                <div className={`rrhh-avatar ${b.c}`}>{b.av}</div>
                <span className="rrhh-birthday-name">{b.nombre} <small style={{ fontWeight: 400, color: '#94A3B8' }}>({b.dept})</small></span>
                <span className="rrhh-birthday-date">{b.fecha}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rrhh-card">
          <div className="rrhh-card-header">
            <strong>Próximas Ausencias</strong>
            <span className="rrhh-link" onClick={() => setActiveTab('Vacaciones')}>Ver todos</span>
          </div>
          <table className="rrhh-table">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Tipo</th>
                <th>Inicio</th>
                <th>Fin</th>
              </tr>
            </thead>
            <tbody>
              {proxAusencias.map((a, i) => (
                <tr key={i}>
                  <td><strong>{a.nombre}</strong></td>
                  <td>{a.tipo}</td>
                  <td>{a.inicio}</td>
                  <td>{a.fin}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 16 }}>
            <strong style={{ fontSize: 12 }}>Distribución por Antigüedad</strong>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {antiguedad.map(a => (
                <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                  <span style={{ width: 60, color: '#64748B' }}>{a.label}</span>
                  <div style={{ flex: 1, height: 12, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${a.pct * 4}%`, background: a.color, height: '100%' }} />
                  </div>
                  <strong style={{ color: '#64748B' }}>{a.pct}%</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── TAB 2: EMPLEADOS ──────────────────────────────────────────────────────────

function TabEmpleados({ empleados, setEmpleados, showToast }) {
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('Todos')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ nombre: '', cargo: '', departamento: 'Ventas', fechaIngreso: '', tipoContrato: 'Indefinido', estado: 'Activo', salario: 0, email: '', telefono: '' })

  const depts = ['Todos', ...new Set(empleados.map(e => e.departamento))]

  const filtered = empleados.filter(e => {
    const matchSearch = e.nombre.toLowerCase().includes(search.toLowerCase()) || e.cargo.toLowerCase().includes(search.toLowerCase())
    const matchDept = filterDept === 'Todos' || e.departamento === filterDept
    const matchEstado = filterEstado === 'Todos' || e.estado === filterEstado
    return matchSearch && matchDept && matchEstado
  })

  const handleAdd = async (ev) => {
    ev.preventDefault()
    if (!form.nombre) return
    const av = form.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    const newList = await rrhhService.addEmpleado({ ...form, avatar: av })
    setEmpleados(newList)
    setShowModal(false)
    showToast(`Empleado "${form.nombre}" registrado`)
    setForm({ nombre: '', cargo: '', departamento: 'Ventas', fechaIngreso: '', tipoContrato: 'Indefinido', estado: 'Activo', salario: 0, email: '', telefono: '' })
  }

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar a "${nombre}"?`)) return
    const newList = await rrhhService.deleteEmpleado(id)
    setEmpleados(newList)
    showToast(`Empleado "${nombre}" eliminado`)
  }

  const handleToggleEstado = async (id, current) => {
    const nuevo = current === 'Activo' ? 'Inactivo' : 'Activo'
    const newList = await rrhhService.updateEmpleado(id, { estado: nuevo })
    setEmpleados(newList)
  }

  return (
    <>
      <div className="rrhh-toolbar">
        <div className="rrhh-search-box">
          <span>🔍</span>
          <input placeholder="Buscar empleado..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select className="rrhh-inline-select" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            {depts.map(d => <option key={d}>{d}</option>)}
          </select>
          <div className="rrhh-filter-chips">
            {['Todos', 'Activo', 'Inactivo'].map(s => (
              <button key={s} className={`rrhh-chip ${filterEstado === s ? 'active' : ''}`} onClick={() => setFilterEstado(s)}>{s}</button>
            ))}
          </div>
          <button className="rrhh-btn-primary" onClick={() => setShowModal(true)}>+ Nuevo Empleado</button>
        </div>
      </div>

      {/* KPIs resumen */}
      <div className="rrhh-kpi-grid">
        <div className="rrhh-card rrhh-kpi-box">
          <div className="rrhh-kpi-icon blue">👥</div>
          <div>
            <div className="rrhh-kpi-label">Total Empleados</div>
            <div className="rrhh-kpi-val">{empleados.length}</div>
          </div>
        </div>
        <div className="rrhh-card rrhh-kpi-box">
          <div className="rrhh-kpi-icon purple">🏢</div>
          <div>
            <div className="rrhh-kpi-label">Por Departamento</div>
            <div className="rrhh-kpi-val">7</div>
          </div>
        </div>
        <div className="rrhh-card rrhh-kpi-box">
          <div className="rrhh-kpi-icon orange">📅</div>
          <div>
            <div className="rrhh-kpi-label">Por Altas</div>
            <div className="rrhh-kpi-val">{empleados.filter(e => e.fechaIngreso?.includes('2025')).length || 92}</div>
          </div>
        </div>
        <div className="rrhh-card rrhh-kpi-box">
          <div className="rrhh-kpi-icon green">✅</div>
          <div>
            <div className="rrhh-kpi-label">Empleados Activos</div>
            <div className="rrhh-kpi-val">{empleados.filter(e => e.estado === 'Activo').length}</div>
          </div>
        </div>
      </div>

      {/* Tabla de empleados */}
      <div className="rrhh-card">
        <div className="rrhh-card-header">
          <strong>Lista de Empleados</strong>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>Mostrando {filtered.length} de {empleados.length} empleados</span>
        </div>
        <table className="rrhh-table">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Cargo</th>
              <th>Departamento</th>
              <th>Fecha Ingreso</th>
              <th>Tipo Contrato</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, idx) => (
              <tr key={e.id}>
                <td>
                  <div className="rrhh-emp-cell">
                    <div className={`rrhh-avatar ${avatarColor(idx)}`}>{e.avatar}</div>
                    <div>
                      <div>{e.nombre}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>{e.email}</div>
                    </div>
                  </div>
                </td>
                <td>{e.cargo}</td>
                <td>{e.departamento}</td>
                <td>{e.fechaIngreso}</td>
                <td>{e.tipoContrato}</td>
                <td>
                  <span className={`rrhh-badge ${e.estado.toLowerCase()}`}>{e.estado}</span>
                </td>
                <td>
                  <div className="rrhh-action-btns">
                    <button className="rrhh-icon-btn" title="Ver detalle" onClick={() => showToast(`Detalle de ${e.nombre}`)}>👁️</button>
                    <button className="rrhh-icon-btn" title="Cambiar estado" onClick={() => handleToggleEstado(e.id, e.estado)}>🔄</button>
                    <button className="rrhh-icon-btn danger" title="Eliminar" onClick={() => handleDelete(e.id, e.nombre)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="rrhh-pagination">
          <span>Mostrando {filtered.length} de {empleados.length} empleados</span>
          <div className="rrhh-pagination-btns">
            {[1, 2, 3].map(n => <button key={n} className={`rrhh-pagination-btn ${n === 1 ? 'active' : ''}`}>{n}</button>)}
            <button className="rrhh-pagination-btn">›</button>
          </div>
        </div>
      </div>

      {showModal && (
        <Modal title="Nuevo Empleado" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAdd}>
            <div className="rrhh-modal-body">
              <div className="rrhh-form-grid-2">
                <div className="rrhh-form-group">
                  <label>Nombre Completo *</label>
                  <input required placeholder="Ej: Juan Pérez" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
                </div>
                <div className="rrhh-form-group">
                  <label>Cargo *</label>
                  <input required placeholder="Ej: Gerente de Ventas" value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} />
                </div>
                <div className="rrhh-form-group">
                  <label>Departamento</label>
                  <select value={form.departamento} onChange={e => setForm(f => ({ ...f, departamento: e.target.value }))}>
                    {['Ventas', 'Compras', 'Almacén', 'Contabilidad', 'Recursos Humanos', 'TI / Sistemas', 'Administración'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="rrhh-form-group">
                  <label>Fecha de Ingreso</label>
                  <input type="date" value={form.fechaIngreso} onChange={e => setForm(f => ({ ...f, fechaIngreso: e.target.value }))} />
                </div>
                <div className="rrhh-form-group">
                  <label>Tipo de Contrato</label>
                  <select value={form.tipoContrato} onChange={e => setForm(f => ({ ...f, tipoContrato: e.target.value }))}>
                    {['Indefinido', 'Temporal', 'Por Obra', 'Pasantía'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="rrhh-form-group">
                  <label>Salario Base (RD$)</label>
                  <input type="number" placeholder="0" value={form.salario} onChange={e => setForm(f => ({ ...f, salario: Number(e.target.value) }))} />
                </div>
                <div className="rrhh-form-group">
                  <label>Email</label>
                  <input type="email" placeholder="correo@empresa.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="rrhh-form-group">
                  <label>Teléfono</label>
                  <input placeholder="809-555-0000" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="rrhh-modal-footer">
              <button type="button" className="rrhh-btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="rrhh-btn-primary">Registrar Empleado</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

// ── TAB 3: ASISTENCIA ─────────────────────────────────────────────────────────

function TabAsistencia({ asistencia, setAsistencia, empleados, showToast }) {
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ empleado: '', fecha: '', entrada: '', salida: '', estado: 'Presente', observacion: '' })

  const filtered = asistencia.filter(a => {
    const matchSearch = a.empleado.toLowerCase().includes(search.toLowerCase())
    const matchEstado = filterEstado === 'Todos' || a.estado === filterEstado
    return matchSearch && matchEstado
  })

  const handleAdd = async (ev) => {
    ev.preventDefault()
    if (!form.empleado) return
    const newList = await rrhhService.registrarAsistencia({
      ...form,
      horasTrabajadas: form.estado === 'Ausente' ? '--' : '8h 00m',
    })
    setAsistencia(newList)
    setShowModal(false)
    showToast('Asistencia registrada exitosamente')
    setForm({ empleado: '', fecha: '', entrada: '', salida: '', estado: 'Presente', observacion: '' })
  }

  // Calendario mayo 2025
  const calDays = Array.from({ length: 31 }, (_, i) => i + 1)
  const firstDay = 3 // Mayo 2025 empieza jueves (0=dom, ..., 3=jue)
  const calData = {
    1: 'finde', 2: 'presente', 3: 'presente', 4: 'presente', 5: 'presente', 6: 'presente', 7: 'presente', 8: 'presente', 9: 'presente',
    10: 'presente', 11: 'presente', 12: 'ausente', 13: 'presente', 14: 'presente', 15: 'presente', 16: 'presente', 17: 'presente',
    18: 'tarde', 19: 'presente', 20: 'presente', 21: 'presente', 22: 'presente', 23: 'presente', 24: 'ausente', 25: 'finde',
    26: 'presente', 27: 'presente', 28: 'presente', 29: 'presente', 30: 'presente', 31: 'presente',
  }

  return (
    <>
      <div className="rrhh-toolbar">
        <div className="rrhh-search-box">
          <span>🔍</span>
          <input placeholder="Buscar empleado..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="rrhh-date-btn">📅 30 May, 2025 ▾</div>
          <select className="rrhh-inline-select">
            <option>Departamento ▾</option>
            {['Ventas', 'Compras', 'Almacén'].map(d => <option key={d}>{d}</option>)}
          </select>
          <div className="rrhh-filter-chips">
            {['Todos', 'Presente', 'Ausente', 'Tarde'].map(s => (
              <button key={s} className={`rrhh-chip ${filterEstado === s ? 'active' : ''}`} onClick={() => setFilterEstado(s)}>{s}</button>
            ))}
          </div>
          <button className="rrhh-btn-primary" onClick={() => setShowModal(true)}>+ Registrar Asistencia</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <div className="rrhh-card rrhh-kpi-box">
          <div className="rrhh-kpi-icon green">✅</div>
          <div><div className="rrhh-kpi-label">Presentes Hoy</div><div className="rrhh-kpi-val" style={{ color: '#059669' }}>142</div><div style={{ fontSize: 10, color: '#059669' }}>91.7%</div></div>
        </div>
        <div className="rrhh-card rrhh-kpi-box">
          <div className="rrhh-kpi-icon red">❌</div>
          <div><div className="rrhh-kpi-label">Ausentes</div><div className="rrhh-kpi-val" style={{ color: '#DC2626' }}>15</div><div style={{ fontSize: 10, color: '#DC2626' }}>9.6%</div></div>
        </div>
        <div className="rrhh-card rrhh-kpi-box">
          <div className="rrhh-kpi-icon orange">⚠️</div>
          <div><div className="rrhh-kpi-label">Tardanzas</div><div className="rrhh-kpi-val" style={{ color: '#D97706' }}>8</div><div style={{ fontSize: 10, color: '#D97706' }}>5.1%</div></div>
        </div>
        <div className="rrhh-card rrhh-kpi-box">
          <div className="rrhh-kpi-icon blue">📊</div>
          <div><div className="rrhh-kpi-label">Total Registros</div><div className="rrhh-kpi-val">178</div></div>
        </div>
      </div>

      <div className="rrhh-grid-half">
        {/* Calendario */}
        <div className="rrhh-card">
          <div className="rrhh-card-header"><strong>Calendario de Asistencia (Mayo 2025)</strong></div>
          <div className="rrhh-calendar-grid">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="rrhh-cal-header">{d}</div>
            ))}
            {Array(firstDay - 1).fill(null).map((_, i) => <div key={'empty' + i} className="rrhh-cal-day empty" />)}
            {calDays.map(day => (
              <div key={day} className={`rrhh-cal-day ${calData[day] || ''}`}>{day}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 10, flexWrap: 'wrap' }}>
            {[{ label: 'Presentes', color: '#D1FAE5', text: '#059669' }, { label: 'Ausentes', color: '#FEE2E2', text: '#DC2626' }, { label: 'Tardanzas', color: '#FEF3C7', text: '#D97706' }, { label: 'Planificados', color: '#F1F5F9', text: '#64748B' }].map(l => (
              <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, border: `1px solid ${l.text}` }} />
                <span style={{ color: l.text }}>{l.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Resumen de asistencia */}
        <div className="rrhh-card">
          <div className="rrhh-card-header"><strong>Resumen de Asistencia</strong></div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <DonutChart
              segments={[{ pct: 80, color: '#059669' }, { pct: 9, color: '#D97706' }, { pct: 11, color: '#DC2626' }]}
              total="178"
              centerSub="Registros"
            />
          </div>
          {[
            { label: 'Presentes', pct: 79.8, color: '#059669' },
            { label: 'Ausentes', pct: 8.43, color: '#D97706' },
            { label: 'Tardanzas', pct: 11.62, color: '#DC2626' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
              <span style={{ flex: 1, color: '#64748B' }}>{r.label}</span>
              <div style={{ width: 80, height: 4, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${r.pct}%`, background: r.color, height: '100%' }} />
              </div>
              <strong style={{ color: '#64748B', width: 35, textAlign: 'right' }}>{r.pct}%</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla asistencia del día */}
      <div className="rrhh-card">
        <div className="rrhh-card-header">
          <strong>Detalle de Asistencia — 30 de Mayo, 2025</strong>
        </div>
        <table className="rrhh-table">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Horas Laboradas</th>
              <th>Estado</th>
              <th>Observación</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, idx) => (
              <tr key={a.id}>
                <td>
                  <div className="rrhh-emp-cell">
                    <div className={`rrhh-avatar ${avatarColor(idx)}`}>{a.empleado.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
                    <span>{a.empleado}</span>
                  </div>
                </td>
                <td>{a.entrada}</td>
                <td>{a.salida}</td>
                <td>{a.horasTrabajadas}</td>
                <td><span className={`rrhh-badge ${a.estado.toLowerCase()}`}>{a.estado}</span></td>
                <td style={{ color: '#94A3B8', fontSize: 11 }}>{a.observacion || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="Registrar Asistencia" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAdd}>
            <div className="rrhh-modal-body">
              <div className="rrhh-form-grid-2">
                <div className="rrhh-form-group">
                  <label>Empleado *</label>
                  <select required value={form.empleado} onChange={e => setForm(f => ({ ...f, empleado: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {empleados.map(e => <option key={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                <div className="rrhh-form-group">
                  <label>Fecha</label>
                  <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
                </div>
                <div className="rrhh-form-group">
                  <label>Hora Entrada</label>
                  <input type="time" value={form.entrada} onChange={e => setForm(f => ({ ...f, entrada: e.target.value }))} />
                </div>
                <div className="rrhh-form-group">
                  <label>Hora Salida</label>
                  <input type="time" value={form.salida} onChange={e => setForm(f => ({ ...f, salida: e.target.value }))} />
                </div>
                <div className="rrhh-form-group">
                  <label>Estado</label>
                  <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
                    {['Presente', 'Ausente', 'Tarde'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="rrhh-form-group">
                  <label>Observación</label>
                  <input placeholder="Opcional..." value={form.observacion} onChange={e => setForm(f => ({ ...f, observacion: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="rrhh-modal-footer">
              <button type="button" className="rrhh-btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="rrhh-btn-primary">Registrar</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

// ── TAB 4: NÓMINA ─────────────────────────────────────────────────────────────

function TabNomina({ nomina, setNomina, showToast }) {
  const totalBruto = nomina.reduce((acc, n) => acc + n.salarioBase + n.bonificaciones, 0)
  const totalDeducciones = nomina.reduce((acc, n) => acc + n.deducciones, 0)
  const totalNeto = nomina.reduce((acc, n) => acc + n.netoPagar, 0)

  const handlePagar = async (id, nombre) => {
    const newList = await rrhhService.marcarPagado(id)
    setNomina(newList)
    showToast(`Nómina de "${nombre}" marcada como pagada`)
  }

  const nominaData = [
    { mes: 'Ene', val: 1700000 }, { mes: 'Feb', val: 1750000 }, { mes: 'Mar', val: 1800000 },
    { mes: 'Abr', val: 1780000 }, { mes: 'May', val: 1850000 },
  ]

  return (
    <>
      {/* KPIs Nómina */}
      <div className="rrhh-card">
        <div className="rrhh-card-header"><strong>Nómina Mayo 2025</strong></div>
        <div className="rrhh-nomina-summary">
          <div className="rrhh-nomina-kpi">
            <small>Empleados</small>
            <strong>{nomina.length}</strong>
          </div>
          <div className="rrhh-nomina-kpi">
            <small>Total Bruto</small>
            <strong style={{ color: '#2563EB' }}>{fmtMoney(totalBruto)}</strong>
          </div>
          <div className="rrhh-nomina-kpi">
            <small>Deducciones</small>
            <strong style={{ color: '#DC2626' }}>{fmtMoney(totalDeducciones)}</strong>
          </div>
          <div className="rrhh-nomina-kpi">
            <small>Total a Pagar</small>
            <strong style={{ color: '#059669' }}>{fmtMoney(totalNeto)}</strong>
          </div>
        </div>
      </div>

      <div className="rrhh-grid-2">
        {/* Gráfico nómina */}
        <div className="rrhh-card">
          <div className="rrhh-card-header"><strong>Resumen de Nómina</strong></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Fecha de Pago</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>30 May, 2025</div>
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
            <DonutChart
              segments={[
                { pct: 78, color: '#2563EB' }, { pct: 14, color: '#10B981' }, { pct: 8, color: '#F59E0B' },
              ]}
              total={fmtMoney(totalNeto)}
              centerSub="Neto"
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB' }} />Salarios</span>
                <strong>{fmtMoney(totalBruto * 0.78)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />Bonificaciones</span>
                <strong>{fmtMoney(totalBruto * 0.14)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />Deducciones</span>
                <strong>{fmtMoney(totalDeducciones)}</strong>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>
              <span>Abr 2025</span><span>May 2025</span>
            </div>
            <LineChart data={nominaData.map(d => d.val)} width={280} height={60} color="#2563EB" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94A3B8', marginTop: 4 }}>
              {nominaData.map(d => <span key={d.mes}>{d.mes}</span>)}
            </div>
          </div>
        </div>

        {/* Distribución por concepto */}
        <div className="rrhh-card">
          <div className="rrhh-card-header"><strong>Distribución por Concepto</strong></div>
          {[
            { label: 'AF', color: '#DBEAFE', name: 'Salarios Base', monto: fmtMoney(totalBruto * 0.78) },
            { label: 'BF', color: '#D1FAE5', name: 'Bonificaciones', monto: fmtMoney(totalBruto * 0.14) },
            { label: 'CF', color: '#FEF3C7', name: 'Seguro Médico', monto: fmtMoney(totalDeducciones * 0.4) },
            { label: 'DF', color: '#EDE9FE', name: 'AFP Empleado', monto: fmtMoney(totalDeducciones * 0.35) },
            { label: 'EF', color: '#FEE2E2', name: 'ISR', monto: fmtMoney(totalDeducciones * 0.25) },
          ].map((row) => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #F1F5F9', fontSize: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: row.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{row.label}</div>
              <span style={{ flex: 1 }}>{row.name}</span>
              <strong>{row.monto}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla nómina */}
      <div className="rrhh-card">
        <div className="rrhh-card-header"><strong>Detalle de Nómina</strong></div>
        <table className="rrhh-table">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Cargo</th>
              <th>Salario Base</th>
              <th>Bonificaciones</th>
              <th>Deducciones</th>
              <th>Neto a Pagar</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {nomina.map((n, idx) => (
              <tr key={n.id}>
                <td>
                  <div className="rrhh-emp-cell">
                    <div className={`rrhh-avatar ${avatarColor(idx)}`}>{n.empleado.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
                    <span>{n.empleado}</span>
                  </div>
                </td>
                <td style={{ fontSize: 11, color: '#64748B' }}>{n.cargo}</td>
                <td>{fmtMoney(n.salarioBase)}</td>
                <td style={{ color: '#059669' }}>+{fmtMoney(n.bonificaciones)}</td>
                <td style={{ color: '#DC2626' }}>-{fmtMoney(n.deducciones)}</td>
                <td><strong>{fmtMoney(n.netoPagar)}</strong></td>
                <td><span className={`rrhh-badge ${n.estado.toLowerCase()}`}>{n.estado}</span></td>
                <td>
                  {n.estado !== 'Pagado' && (
                    <button className="rrhh-btn-primary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => handlePagar(n.id, n.empleado)}>
                      Pagar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ── TAB 5: VACACIONES ─────────────────────────────────────────────────────────

function TabVacaciones({ vacaciones, setVacaciones, empleados, showToast }) {
  const [showModal, setShowModal] = useState(false)
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [form, setForm] = useState({ empleado: '', departamento: '', fechaInicio: '', fechaFin: '', dias: 7 })

  const filtered = vacaciones.filter(v => filterEstado === 'Todos' || v.estado === filterEstado)

  const pendientes = vacaciones.filter(v => v.estado === 'Pendiente').length
  const aprobadas = vacaciones.filter(v => v.estado === 'Aprobada').length
  const rechazadas = vacaciones.filter(v => v.estado === 'Rechazada').length

  const handleAdd = async (ev) => {
    ev.preventDefault()
    if (!form.empleado) return
    const emp = empleados.find(e => e.nombre === form.empleado)
    const newList = await rrhhService.addVacacion({ ...form, departamento: emp?.departamento || form.departamento })
    setVacaciones(newList)
    setShowModal(false)
    showToast(`Solicitud de vacaciones registrada para "${form.empleado}"`)
    setForm({ empleado: '', departamento: '', fechaInicio: '', fechaFin: '', dias: 7 })
  }

  const handleUpdate = async (id, nuevoEstado) => {
    const newList = await rrhhService.updateVacacion(id, nuevoEstado)
    setVacaciones(newList)
    showToast(`Solicitud ${nuevoEstado.toLowerCase()} exitosamente`)
  }

  // Calendario de vacaciones mayo 2025
  const calDays = Array.from({ length: 31 }, (_, i) => i + 1)
  const vacCalData = {
    1: 'aprobada', 2: 'aprobada', 4: 'pendiente', 5: 'pendiente', 6: 'pendiente',
    10: 'rechazada', 15: 'aprobada', 16: 'aprobada', 20: 'pendiente', 25: 'aprobada',
  }

  return (
    <>
      <div className="rrhh-toolbar">
        <div className="rrhh-search-box">
          <span>🔍</span>
          <input placeholder="Buscar empleado..." />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="rrhh-filter-chips">
            {['Todos', 'Pendiente', 'Aprobada', 'Rechazada'].map(s => (
              <button key={s} className={`rrhh-chip ${filterEstado === s ? 'active' : ''}`} onClick={() => setFilterEstado(s)}>{s}</button>
            ))}
          </div>
          <button className="rrhh-btn-primary" onClick={() => setShowModal(true)}>+ Nueva Solicitud</button>
        </div>
      </div>

      {/* KPIs Vacaciones */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <div className="rrhh-card rrhh-kpi-box"><div className="rrhh-kpi-icon blue">📋</div>
          <div><div className="rrhh-kpi-label">Solicitudes</div><div className="rrhh-kpi-val">{vacaciones.length}</div></div>
        </div>
        <div className="rrhh-card rrhh-kpi-box"><div className="rrhh-kpi-icon green">✅</div>
          <div><div className="rrhh-kpi-label">Aprobadas</div><div className="rrhh-kpi-val" style={{ color: '#059669' }}>{aprobadas}</div></div>
        </div>
        <div className="rrhh-card rrhh-kpi-box"><div className="rrhh-kpi-icon orange">⏳</div>
          <div><div className="rrhh-kpi-label">Pendientes</div><div className="rrhh-kpi-val" style={{ color: '#D97706' }}>{pendientes}</div></div>
        </div>
      </div>

      {/* Tabla de solicitudes */}
      <div className="rrhh-card">
        <div className="rrhh-card-header">
          <strong>Solicitudes de Vacaciones (Mayo 2025)</strong>
        </div>
        <table className="rrhh-table">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Departamento</th>
              <th>Fecha Inicio</th>
              <th>Fecha Fin</th>
              <th>Días</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v, idx) => (
              <tr key={v.id}>
                <td>
                  <div className="rrhh-emp-cell">
                    <div className={`rrhh-avatar ${avatarColor(idx)}`}>{v.empleado.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
                    <span>{v.empleado}</span>
                  </div>
                </td>
                <td>{v.departamento}</td>
                <td>{v.fechaInicio}</td>
                <td>{v.fechaFin}</td>
                <td><strong>{v.dias}</strong></td>
                <td><span className={`rrhh-badge ${v.estado.toLowerCase()}`}>{v.estado}</span></td>
                <td>
                  <div className="rrhh-action-btns">
                    {v.estado === 'Pendiente' && (
                      <>
                        <button className="rrhh-btn-primary" style={{ padding: '4px 8px', fontSize: 11, background: '#059669' }} onClick={() => handleUpdate(v.id, 'Aprobada')}>✓ Aprobar</button>
                        <button className="rrhh-btn-danger" onClick={() => handleUpdate(v.id, 'Rechazada')}>✗ Rechazar</button>
                      </>
                    )}
                    {v.estado !== 'Pendiente' && (
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Calendario de vacaciones */}
      <div className="rrhh-card">
        <div className="rrhh-card-header"><strong>Calendario de Vacaciones (Mayo 2025)</strong></div>
        <div className="rrhh-calendar-grid">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <div key={d} className="rrhh-cal-header">{d}</div>
          ))}
          {Array(2).fill(null).map((_, i) => <div key={'e' + i} className="rrhh-cal-day empty" />)}
          {calDays.map(day => (
            <div key={day} className={`rrhh-cal-day ${vacCalData[day] || ''}`}>{day}</div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 10 }}>
          {[{ label: 'Aprobadas', color: '#D1FAE5', text: '#059669' }, { label: 'Pendientes', color: '#FEF3C7', text: '#D97706' }, { label: 'Rechazadas', color: '#FEE2E2', text: '#DC2626' }].map(l => (
            <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
              <span style={{ color: l.text }}>{l.label}</span>
            </span>
          ))}
        </div>
      </div>

      {showModal && (
        <Modal title="Nueva Solicitud de Vacaciones" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAdd}>
            <div className="rrhh-modal-body">
              <div className="rrhh-form-grid-2">
                <div className="rrhh-form-group">
                  <label>Empleado *</label>
                  <select required value={form.empleado} onChange={e => setForm(f => ({ ...f, empleado: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {empleados.map(e => <option key={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                <div className="rrhh-form-group">
                  <label>Días Solicitados</label>
                  <input type="number" min="1" max="30" value={form.dias} onChange={e => setForm(f => ({ ...f, dias: Number(e.target.value) }))} />
                </div>
                <div className="rrhh-form-group">
                  <label>Fecha Inicio</label>
                  <input type="date" value={form.fechaInicio} onChange={e => setForm(f => ({ ...f, fechaInicio: e.target.value }))} />
                </div>
                <div className="rrhh-form-group">
                  <label>Fecha Fin</label>
                  <input type="date" value={form.fechaFin} onChange={e => setForm(f => ({ ...f, fechaFin: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="rrhh-modal-footer">
              <button type="button" className="rrhh-btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="rrhh-btn-primary">Solicitar</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

// ── TAB 6: DESEMPEÑO ──────────────────────────────────────────────────────────

function TabDesempeno({ desempeno, setDesempeno, empleados, showToast }) {
  const [showModal, setShowModal] = useState(false)
  const [filterNivel, setFilterNivel] = useState('Todos')
  const [form, setForm] = useState({ empleado: '', cargo: '', departamento: '', puntaje: 75, evaluador: '', comentario: '' })

  const getLevelFromPuntaje = (p) => {
    if (p >= 90) return 'Excelente'
    if (p >= 70) return 'Bueno'
    if (p >= 50) return 'Regular'
    return 'Necesita Mejora'
  }

  const filtered = desempeno.filter(d => filterNivel === 'Todos' || d.nivel === filterNivel)
  const promedio = desempeno.length ? Math.round(desempeno.reduce((acc, d) => acc + d.puntaje, 0) / desempeno.length) : 0

  const topDesempenados = [...desempeno].sort((a, b) => b.puntaje - a.puntaje).slice(0, 5)

  const handleAdd = async (ev) => {
    ev.preventDefault()
    if (!form.empleado) return
    const emp = empleados.find(e => e.nombre === form.empleado)
    const nivel = getLevelFromPuntaje(Number(form.puntaje))
    const newList = await rrhhService.addEvaluacion({
      ...form,
      cargo: emp?.cargo || form.cargo,
      departamento: emp?.departamento || form.departamento,
      nivel,
      fecha: new Date().toLocaleDateString('es-DO'),
    })
    setDesempeno(newList)
    setShowModal(false)
    showToast(`Evaluación de "${form.empleado}" registrada (${nivel})`)
    setForm({ empleado: '', cargo: '', departamento: '', puntaje: 75, evaluador: '', comentario: '' })
  }

  return (
    <>
      <div className="rrhh-toolbar">
        <div className="rrhh-search-box">
          <span>🔍</span>
          <input placeholder="Buscar empleado..." />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select className="rrhh-inline-select">
            <option>Mayo 2025 ▾</option>
          </select>
          <div className="rrhh-filter-chips">
            {['Todos', 'Excelente', 'Bueno', 'Regular', 'Necesita Mejora'].map(n => (
              <button key={n} className={`rrhh-chip ${filterNivel === n ? 'active' : ''}`} onClick={() => setFilterNivel(n)}>{n}</button>
            ))}
          </div>
          <button className="rrhh-btn-primary" onClick={() => setShowModal(true)}>+ Nueva Evaluación</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
        {[
          { label: 'Promedio', val: `${promedio}%`, icon: '📊', color: 'blue' },
          { label: 'Total Evaluados', val: desempeno.length, icon: '👥', color: 'green' },
          { label: 'Excelente', val: desempeno.filter(d => d.nivel === 'Excelente').length, icon: '⭐', color: 'green' },
          { label: 'Bueno', val: desempeno.filter(d => d.nivel === 'Bueno').length, icon: '👍', color: 'blue' },
          { label: 'Necesitan Mejora', val: desempeno.filter(d => d.nivel === 'Necesita Mejora').length, icon: '⚠️', color: 'orange' },
        ].map(k => (
          <div key={k.label} className="rrhh-card rrhh-kpi-box">
            <div className={`rrhh-kpi-icon ${k.color}`}>{k.icon}</div>
            <div><div className="rrhh-kpi-label">{k.label}</div><div className="rrhh-kpi-val">{k.val}</div></div>
          </div>
        ))}
      </div>

      <div className="rrhh-grid-2">
        {/* Donut distribución desempeño */}
        <div className="rrhh-card">
          <div className="rrhh-card-header"><strong>Distribución de Desempeño</strong></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <DonutChart
              segments={[
                { pct: 29, color: '#10B981' }, { pct: 46, color: '#3B82F6' },
                { pct: 18, color: '#F59E0B' }, { pct: 7, color: '#EF4444' },
              ]}
              total={desempeno.length}
              centerSub="Evaluaciones"
            />
            <div style={{ flex: 1 }}>
              {[
                { label: 'Excelente (90-100)', pct: 29, count: 45, color: '#10B981' },
                { label: 'Bueno (70-89)', pct: 46, count: 72, color: '#3B82F6' },
                { label: 'Regular (50-69)', pct: 18, count: 28, color: '#F59E0B' },
                { label: 'Necesita Mejora (<50)', pct: 7, count: 11, color: '#EF4444' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 11 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
                  <span style={{ flex: 1, color: '#64748B' }}>{r.label}</span>
                  <strong>{r.count}</strong>
                  <span style={{ color: '#94A3B8' }}>({r.pct}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top empleados */}
        <div className="rrhh-card">
          <div className="rrhh-card-header"><strong>Top 5 Mejores Desempeños</strong></div>
          {topDesempenados.map((d, idx) => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #F1F5F9', fontSize: 12 }}>
              <div className={`rrhh-avatar ${avatarColor(idx)}`}>{d.empleado.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#0F172A' }}>{d.empleado}</div>
                <div style={{ color: '#94A3B8', fontSize: 10 }}>{d.departamento}</div>
              </div>
              <div style={{ width: 80, height: 4, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${d.puntaje}%`, background: d.puntaje >= 90 ? '#10B981' : d.puntaje >= 70 ? '#3B82F6' : '#F59E0B', height: '100%' }} />
              </div>
              <strong style={{ color: d.puntaje >= 90 ? '#059669' : '#2563EB', width: 35, textAlign: 'right' }}>{d.puntaje}%</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla evaluaciones */}
      <div className="rrhh-card">
        <div className="rrhh-card-header"><strong>Detalle de Evaluaciones</strong></div>
        <table className="rrhh-table">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Cargo</th>
              <th>Departamento</th>
              <th>Puntaje</th>
              <th>Nivel</th>
              <th>Evaluador</th>
              <th>Comentario</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, idx) => (
              <tr key={d.id}>
                <td>
                  <div className="rrhh-emp-cell">
                    <div className={`rrhh-avatar ${avatarColor(idx)}`}>{d.empleado.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
                    <span>{d.empleado}</span>
                  </div>
                </td>
                <td style={{ fontSize: 11, color: '#64748B' }}>{d.cargo}</td>
                <td>{d.departamento}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 50, height: 4, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${d.puntaje}%`, background: d.puntaje >= 90 ? '#10B981' : d.puntaje >= 70 ? '#3B82F6' : '#F59E0B', height: '100%' }} />
                    </div>
                    <strong>{d.puntaje}%</strong>
                  </div>
                </td>
                <td><span className={`rrhh-badge ${d.nivel.toLowerCase().replace(' ', '-')}`}>{d.nivel}</span></td>
                <td style={{ fontSize: 11 }}>{d.evaluador}</td>
                <td style={{ fontSize: 11, color: '#64748B', maxWidth: 180 }}>{d.comentario}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="Nueva Evaluación de Desempeño" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAdd}>
            <div className="rrhh-modal-body">
              <div className="rrhh-form-grid-2">
                <div className="rrhh-form-group">
                  <label>Empleado *</label>
                  <select required value={form.empleado} onChange={e => setForm(f => ({ ...f, empleado: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {empleados.map(e => <option key={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                <div className="rrhh-form-group">
                  <label>Evaluador</label>
                  <input placeholder="Nombre del evaluador" value={form.evaluador} onChange={e => setForm(f => ({ ...f, evaluador: e.target.value }))} />
                </div>
                <div className="rrhh-form-group">
                  <label>Puntaje (0-100)</label>
                  <input type="number" min="0" max="100" value={form.puntaje} onChange={e => setForm(f => ({ ...f, puntaje: Number(e.target.value) }))} />
                </div>
                <div className="rrhh-form-group">
                  <label>Nivel (auto-calculado)</label>
                  <input readOnly value={getLevelFromPuntaje(form.puntaje)} style={{ background: '#F8FAFC', color: '#64748B' }} />
                </div>
                <div className="rrhh-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Comentario</label>
                  <textarea rows={3} placeholder="Observaciones sobre el desempeño..." value={form.comentario} onChange={e => setForm(f => ({ ...f, comentario: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="rrhh-modal-footer">
              <button type="button" className="rrhh-btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="rrhh-btn-primary">Guardar Evaluación</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

// ── TAB 7: RECLUTAMIENTO ──────────────────────────────────────────────────────

function TabReclutamiento({ candidatos, setCandidatos, showToast }) {
  const [showModal, setShowModal] = useState(false)
  const [filterEtapa, setFilterEtapa] = useState('Todos')
  const [form, setForm] = useState({ nombre: '', cargo: '', departamento: 'Ventas', etapa: 'Aplicación', email: '' })

  const etapas = ['Aplicación', 'Entrevista', 'Prueba Técnica', 'Oferta', 'Contratado con Éxito']
  const etapaColors = {
    'Aplicación': '#94A3B8',
    'Entrevista': '#2563EB',
    'Prueba Técnica': '#7C3AED',
    'Oferta': '#D97706',
    'Contratado con Éxito': '#059669',
  }

  const filtered = candidatos.filter(c => filterEtapa === 'Todos' || c.etapa === filterEtapa)

  const handleAdd = async (ev) => {
    ev.preventDefault()
    if (!form.nombre) return
    const newList = await rrhhService.addCandidato(form)
    setCandidatos(newList)
    setShowModal(false)
    showToast(`Candidato "${form.nombre}" añadido`)
    setForm({ nombre: '', cargo: '', departamento: 'Ventas', etapa: 'Aplicación', email: '' })
  }

  const handleMoveEtapa = async (id, etapaActual) => {
    const idx = etapas.indexOf(etapaActual)
    if (idx < etapas.length - 1) {
      const newList = await rrhhService.updateCandidato(id, { etapa: etapas[idx + 1], estado: etapas[idx + 1] === 'Contratado con Éxito' ? 'Contratado' : 'Activo' })
      setCandidatos(newList)
      showToast('Candidato avanzado a siguiente etapa')
    }
  }

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar candidato "${nombre}"?`)) return
    const newList = await rrhhService.deleteCandidato(id)
    setCandidatos(newList)
    showToast(`Candidato "${nombre}" eliminado`)
  }

  // KPIs
  const total = candidatos.length
  const contratados = candidatos.filter(c => c.estado === 'Contratado').length
  const activos = candidatos.filter(c => c.estado === 'Activo').length
  const enOferta = candidatos.filter(c => c.etapa === 'Oferta').length

  return (
    <>
      <div className="rrhh-toolbar">
        <div className="rrhh-search-box">
          <span>🔍</span>
          <input placeholder="Buscar candidato..." />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="rrhh-filter-chips">
            {['Todos', ...etapas.slice(0, 4)].map(e => (
              <button key={e} className={`rrhh-chip ${filterEtapa === e ? 'active' : ''}`} onClick={() => setFilterEtapa(e)}>{e}</button>
            ))}
          </div>
          <button className="rrhh-btn-primary" onClick={() => setShowModal(true)}>+ Nueva Aplicación</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Vacantes Activas', val: 12, icon: '💼', color: 'blue' },
          { label: 'Candidatos', val: total, icon: '👤', color: 'purple' },
          { label: 'En Proceso', val: activos, icon: '📋', color: 'orange' },
          { label: 'Contratados Mes', val: contratados, icon: '✅', color: 'green' },
        ].map(k => (
          <div key={k.label} className="rrhh-card rrhh-kpi-box">
            <div className={`rrhh-kpi-icon ${k.color}`}>{k.icon}</div>
            <div><div className="rrhh-kpi-label">{k.label}</div><div className="rrhh-kpi-val">{k.val}</div></div>
          </div>
        ))}
      </div>

      <div className="rrhh-grid-2">
        {/* Embudo de reclutamiento */}
        <div className="rrhh-card">
          <div className="rrhh-card-header"><strong>Embudo de Reclutamiento</strong></div>
          <div className="rrhh-funnel">
            {etapas.map((etapa, i) => {
              const count = candidatos.filter(c => c.etapa === etapa).length
              const width = 100 - (i * 12)
              return (
                <div key={etapa} className="rrhh-funnel-step"
                  style={{ width: `${width}%`, background: etapaColors[etapa], justifyContent: 'space-between' }}>
                  <span>{etapa}</span>
                  <strong>{count}</strong>
                </div>
              )
            })}
          </div>
        </div>

        {/* Vacantes activas */}
        <div className="rrhh-card">
          <div className="rrhh-card-header"><strong>Vacantes Activas</strong></div>
          <table className="rrhh-table">
            <thead>
              <tr><th>Cargo</th><th>Departamento</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {[
                { cargo: 'Auxiliar de Contabilidad', dept: 'Contabilidad', estado: 'Activo' },
                { cargo: 'Vendedor', dept: 'Ventas', estado: 'Activo' },
                { cargo: 'Almacenista', dept: 'Almacén', estado: 'Activo' },
                { cargo: 'Desarrolladora Jr.', dept: 'TI / Sistemas', estado: 'Activo' },
                { cargo: 'Asistente Administrativo', dept: 'Administración', estado: 'Cubierto' },
              ].map((v, i) => (
                <tr key={i}>
                  <td><strong>{v.cargo}</strong></td>
                  <td>{v.dept}</td>
                  <td><span className={`rrhh-badge ${v.estado === 'Cubierto' ? 'contratado' : 'activo'}`}>{v.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla candidatos recientes */}
      <div className="rrhh-card">
        <div className="rrhh-card-header"><strong>Candidatos Recientes</strong></div>
        <table className="rrhh-table">
          <thead>
            <tr>
              <th>Candidato</th>
              <th>Cargo</th>
              <th>Departamento</th>
              <th>Etapa</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, idx) => (
              <tr key={c.id}>
                <td>
                  <div className="rrhh-emp-cell">
                    <div className={`rrhh-avatar ${avatarColor(idx)}`}>{c.nombre.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
                    <div>
                      <div>{c.nombre}</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>{c.email}</div>
                    </div>
                  </div>
                </td>
                <td>{c.cargo}</td>
                <td>{c.departamento}</td>
                <td>
                  <span style={{ fontSize: 11, fontWeight: 700, color: etapaColors[c.etapa] || '#64748B' }}>
                    {c.etapa}
                  </span>
                </td>
                <td style={{ fontSize: 11, color: '#94A3B8' }}>{c.fecha}</td>
                <td><span className={`rrhh-badge ${c.estado.toLowerCase()}`}>{c.estado}</span></td>
                <td>
                  <div className="rrhh-action-btns">
                    {c.etapa !== 'Contratado con Éxito' && (
                      <button className="rrhh-btn-primary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => handleMoveEtapa(c.id, c.etapa)}>
                        Avanzar →
                      </button>
                    )}
                    <button className="rrhh-icon-btn danger" onClick={() => handleDelete(c.id, c.nombre)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="Nueva Aplicación de Candidato" onClose={() => setShowModal(false)}>
          <form onSubmit={handleAdd}>
            <div className="rrhh-modal-body">
              <div className="rrhh-form-grid-2">
                <div className="rrhh-form-group">
                  <label>Nombre Completo *</label>
                  <input required placeholder="Juan García" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
                </div>
                <div className="rrhh-form-group">
                  <label>Cargo Aplicado</label>
                  <input placeholder="Ej: Analista de Compras" value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} />
                </div>
                <div className="rrhh-form-group">
                  <label>Departamento</label>
                  <select value={form.departamento} onChange={e => setForm(f => ({ ...f, departamento: e.target.value }))}>
                    {['Ventas', 'Compras', 'Almacén', 'Contabilidad', 'Recursos Humanos', 'TI / Sistemas', 'Administración'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="rrhh-form-group">
                  <label>Email</label>
                  <input type="email" placeholder="candidato@mail.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="rrhh-form-group">
                  <label>Etapa Inicial</label>
                  <select value={form.etapa} onChange={e => setForm(f => ({ ...f, etapa: e.target.value }))}>
                    {etapas.map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="rrhh-modal-footer">
              <button type="button" className="rrhh-btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="rrhh-btn-primary">Registrar Candidato</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────

export function RrhhHome() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab') || 'Resumen RRHH'
  const [activeTab, setActiveTab] = useState(rawTab)

  // Estado global del módulo
  const [empleados, setEmpleados] = useState([])
  const [asistencia, setAsistencia] = useState([])
  const [nomina, setNomina] = useState([])
  const [vacaciones, setVacaciones] = useState([])
  const [desempeno, setDesempeno] = useState([])
  const [candidatos, setCandidatos] = useState([])
  const [toast, setToast] = useState(null)

  useEffect(() => {
    async function load() {
      const [emps, asis, nom, vacs, desp, cands] = await Promise.all([
        rrhhService.listEmpleados(),
        rrhhService.listAsistencia(),
        rrhhService.listNomina(),
        rrhhService.listVacaciones(),
        rrhhService.listDesempeno(),
        rrhhService.listCandidatos(),
      ])
      setEmpleados(emps)
      setAsistencia(asis)
      setNomina(nom)
      setVacaciones(vacs)
      setDesempeno(desp)
      setCandidatos(cands)
    }
    load()
  }, [])

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t) setActiveTab(t)
  }, [searchParams])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const tabs = ['Resumen RRHH', 'Empleados', 'Asistencia', 'Nómina', 'Vacaciones', 'Desempeño', 'Reclutamiento']

  return (
    <div className="rrhh-container">
      {/* ── Banner Hero Panorámico RRHH con Estilo Idéntico a la Referencia ── */}
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
        {/* Imagen de fondo panorámica de Recursos Humanos y Talento */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '55%',
          backgroundImage: 'url(/branding/banner_rrhh_panoramic.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          opacity: 0.38,
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
            backdropFilter: 'blur(4px)'
          }}>
            <span>👥</span> PANEL DE CONTROL · RECURSOS HUMANOS
          </div>

          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Control de Talento Humano
          </h1>
          <p style={{ margin: '6px 0 20px', fontSize: 13, color: '#CBD5E1', lineHeight: 1.5, maxWidth: 580 }}>
            Administra y consulta los registros oficiales de colaboradores, horas de asistencia, nómina y archivo general.
          </p>

          {/* Estadísticas en vivo estilo referencia */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{empleados.length || 24}</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Colaboradores Activos</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>8</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Departamentos</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>178 hrs</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Carga Horaria Promedio</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>0</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Archivados</div>
            </div>
          </div>

          {/* Botones Rápidos */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => showToast('Generando reporte oficial en PDF...')}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              📄 Exportar PDF
            </button>
            <button
              onClick={() => window.print()}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 8,
                padding: '7px 14px',
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

      {/* Tabs */}
      <nav className="rrhh-tabs-nav">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`rrhh-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Contenido */}
      {activeTab === 'Resumen RRHH' && (
        <TabResumen
          empleados={empleados}
          asistencia={asistencia}
          nomina={nomina}
          desempeno={desempeno}
          setActiveTab={(t) => handleTabChange(t)}
          showToast={showToast}
        />
      )}
      {activeTab === 'Empleados' && (
        <TabEmpleados empleados={empleados} setEmpleados={setEmpleados} showToast={showToast} />
      )}
      {activeTab === 'Asistencia' && (
        <TabAsistencia asistencia={asistencia} setAsistencia={setAsistencia} empleados={empleados} showToast={showToast} />
      )}
      {activeTab === 'Nómina' && (
        <TabNomina nomina={nomina} setNomina={setNomina} showToast={showToast} />
      )}
      {activeTab === 'Vacaciones' && (
        <TabVacaciones vacaciones={vacaciones} setVacaciones={setVacaciones} empleados={empleados} showToast={showToast} />
      )}
      {activeTab === 'Desempeño' && (
        <TabDesempeno desempeno={desempeno} setDesempeno={setDesempeno} empleados={empleados} showToast={showToast} />
      )}
      {activeTab === 'Reclutamiento' && (
        <TabReclutamiento candidatos={candidatos} setCandidatos={setCandidatos} showToast={showToast} />
      )}

      {/* Toast */}
      {toast && <div className="rrhh-toast">{toast}</div>}
    </div>
  )
}
