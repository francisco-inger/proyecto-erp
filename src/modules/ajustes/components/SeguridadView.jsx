import React, { useState, useEffect } from 'react'
import { seguridadService } from '../services/seguridadService'

export function SeguridadView({ onShowToast }) {
  const [activeSubTab, setActiveSubTab] = useState('usuarios')
  const [usuarios, setUsuarios] = useState([])
  const [logs, setLogs] = useState([])
  const [policies, setPolicies] = useState(seguridadService.getPolicies())
  const [showUserModal, setShowUserModal] = useState(false)
  const [filterRole, setFilterRole] = useState('Todos')
  const [searchQuery, setSearchQuery] = useState('')

  const [userForm, setUserForm] = useState({
    nombre: '',
    email: '',
    rol: 'VENTAS',
    departamento: 'Ventas',
    dosFactores: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const u = await seguridadService.getUsuarios()
    const l = await seguridadService.getAuditLogs()
    setUsuarios(u)
    setLogs(l)
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (!userForm.nombre || !userForm.email) return
    const updated = await seguridadService.createUsuario(userForm)
    setUsuarios(updated)
    setShowUserModal(false)
    setUserForm({ nombre: '', email: '', rol: 'VENTAS', departamento: 'Ventas', dosFactores: true })
    onShowToast(`Usuario ${userForm.email} creado y credenciales generadas ✅`)
  }

  const handleDeleteUser = async (id, nombre) => {
    if (window.confirm(`¿Deseas revocar el acceso y eliminar al usuario ${nombre}?`)) {
      const updated = await seguridadService.deleteUsuario(id)
      setUsuarios(updated)
      onShowToast(`Usuario ${nombre} eliminado exitosamente 🗑️`)
    }
  }

  const handleToggle2FA = async (user) => {
    const updated = await seguridadService.updateUsuario(user.id, { dosFactores: !user.dosFactores })
    setUsuarios(updated)
    onShowToast(`2FA ${!user.dosFactores ? 'activado' : 'desactivado'} para ${user.nombre}`)
  }

  const handleSavePolicies = (e) => {
    e.preventDefault()
    seguridadService.savePolicies(policies)
    onShowToast('Políticas de seguridad empresarial guardadas con éxito 🛡️')
  }

  const filteredUsuarios = usuarios.filter((u) => {
    if (filterRole !== 'Todos' && u.rol !== filterRole) return false
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      return u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.departamento.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Barra de Subnavegación de Seguridad */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '2px solid #E2E8F0', paddingBottom: 12 }}>
        <button
          className={`fn-table-tab-btn ${activeSubTab === 'usuarios' ? 'active-tab' : ''}`}
          onClick={() => setActiveSubTab('usuarios')}
        >
          👥 Gestión de Usuarios ({usuarios.length})
        </button>
        <button
          className={`fn-table-tab-btn ${activeSubTab === 'roles' ? 'active-tab' : ''}`}
          onClick={() => setActiveSubTab('roles')}
        >
          🛡️ Roles y Permisos (RBAC)
        </button>
        <button
          className={`fn-table-tab-btn ${activeSubTab === 'politicas' ? 'active-tab' : ''}`}
          onClick={() => setActiveSubTab('politicas')}
        >
          🔒 Políticas y 2FA
        </button>
        <button
          className={`fn-table-tab-btn ${activeSubTab === 'auditoria' ? 'active-tab' : ''}`}
          onClick={() => setActiveSubTab('auditoria')}
        >
          📋 Bitácora de Auditoría ({logs.length})
        </button>
      </div>

      {/* 1. GESTIÓN DE USUARIOS */}
      {activeSubTab === 'usuarios' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="fn-search-input-box" style={{ width: 260 }}>
                <span className="fn-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar usuario o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="fn-search-input"
                />
              </div>
              <select
                className="fn-period-select"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="Todos">Todos los Roles</option>
                <option value="ADMIN">ADMIN (Acceso Total)</option>
                <option value="VENTAS">VENTAS</option>
                <option value="CRM">CRM</option>
                <option value="RRHH">RRHH</option>
                <option value="SOPORTE">SOPORTE</option>
              </select>
            </div>

            <button className="fn-btn-primary" onClick={() => setShowUserModal(true)}>
              <span>+</span> Nuevo Usuario
            </button>
          </div>

          <div className="fn-table-responsive">
            <table className="fn-data-table">
              <thead>
                <tr>
                  <th>Usuario / Nombre</th>
                  <th>Correo Electrónico</th>
                  <th>Departamento</th>
                  <th>Rol Asignado</th>
                  <th>2FA</th>
                  <th>Último Acceso</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.map((u) => (
                  <tr key={u.id} className="fn-table-row">
                    <td>
                      <strong>{u.nombre}</strong>
                    </td>
                    <td style={{ color: '#64748B' }}>{u.email}</td>
                    <td>{u.departamento}</td>
                    <td>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: u.rol === 'ADMIN' ? '#EFF6FF' : '#F1F5F9',
                          color: u.rol === 'ADMIN' ? '#2563EB' : '#475569',
                        }}
                      >
                        {u.rol}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggle2FA(u)}
                        style={{
                          background: u.dosFactores ? '#ECFDF5' : '#FEF2F2',
                          color: u.dosFactores ? '#059669' : '#DC2626',
                          border: 'none',
                          borderRadius: 6,
                          padding: '3px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {u.dosFactores ? '✓ 2FA Activo' : '✕ Inactivo'}
                      </button>
                    </td>
                    <td style={{ fontSize: 12, color: '#64748B' }}>{u.ultimoAcceso}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: u.estado === 'Activo' ? '#ECFDF5' : u.estado === 'Pendiente' ? '#FEF3C7' : '#FEF2F2',
                          color: u.estado === 'Activo' ? '#059669' : u.estado === 'Pendiente' ? '#D97706' : '#DC2626',
                        }}
                      >
                        ● {u.estado === 'Pendiente' ? 'Esperando Aprobación' : u.estado}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        {u.estado === 'Pendiente' ? (
                          <button
                            onClick={async () => {
                              const updated = await seguridadService.updateUsuario(u.id, { estado: 'Activo' })
                              setUsuarios(updated)
                              onShowToast(`Acceso concedido a ${u.nombre} ✅`)
                            }}
                            title="Conceder Acceso al Sistema"
                            style={{
                              background: '#2563EB',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: 6,
                              padding: '4px 8px',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            ✓ Conceder Acceso
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              const nuevoEstado = u.estado === 'Activo' ? 'Inactivo' : 'Activo'
                              const updated = await seguridadService.updateUsuario(u.id, { estado: nuevoEstado })
                              setUsuarios(updated)
                              onShowToast(`Estado de ${u.nombre} cambiado a ${nuevoEstado}`)
                            }}
                            title={u.estado === 'Activo' ? 'Bloquear/Desactivar acceso' : 'Reactivar acceso'}
                            style={{
                              background: u.estado === 'Activo' ? '#F1F5F9' : '#DCFCE7',
                              color: u.estado === 'Activo' ? '#475569' : '#166534',
                              border: '1px solid #CBD5E1',
                              borderRadius: 6,
                              padding: '3px 6px',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {u.estado === 'Activo' ? '🔒 Desactivar' : '🔓 Activar'}
                          </button>
                        )}

                        <button
                          className="fn-action-icon-btn"
                          title="Eliminar usuario"
                          onClick={() => handleDeleteUser(u.id, u.nombre)}
                          style={{ color: '#DC2626' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. ROLES Y PERMISOS (RBAC) */}
      {activeSubTab === 'roles' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <div className="card" style={{ padding: 20, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#2563EB' }}>👑 Rol: ADMIN</h3>
              <span style={{ fontSize: 11, background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>Total</span>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>Acceso irrestricto a todos los módulos: Finanzas, CRM, Ventas, Compras, RRHH, Auditoría y Configuración del Sistema.</p>
            <div style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>✓ Lectura, Escritura, Modificación, Aprobación y Borrado</div>
          </div>

          <div className="card" style={{ padding: 20, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#0F172A' }}>🛒 Rol: VENTAS</h3>
              <span style={{ fontSize: 11, background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>Comercial</span>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>Gestión de pedidos de clientes, consulta de inventario, emisión de comprobantes de ingreso y catálogo.</p>
            <div style={{ fontSize: 12, color: '#2563EB', fontWeight: 600 }}>✓ Ventas, Clientes y Comprobantes de Ingreso</div>
          </div>

          <div className="card" style={{ padding: 20, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#0F172A' }}>👥 Rol: RRHH</h3>
              <span style={{ fontSize: 11, background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>Talento</span>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>Maestro de empleados, cálculo quincenal de nómina, control de asistencia, permisos y vacaciones.</p>
            <div style={{ fontSize: 12, color: '#2563EB', fontWeight: 600 }}>✓ Empleados, Asistencia, Nómina y Desempeño</div>
          </div>

          <div className="card" style={{ padding: 20, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: '#0F172A' }}>🎯 Rol: CRM</h3>
              <span style={{ fontSize: 11, background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>Pipeline</span>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>Directorio de prospectos, clientes, embudo de ventas, seguimiento de oportunidades y actividades.</p>
            <div style={{ fontSize: 12, color: '#2563EB', fontWeight: 600 }}>✓ CRM, Pipeline y Oportunidades</div>
          </div>
        </div>
      )}

      {/* 3. POLÍTICAS Y 2FA */}
      {activeSubTab === 'politicas' && (
        <form onSubmit={handleSavePolicies} style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #E2E8F0', maxWidth: 700 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Políticas de Seguridad Empresarial</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={policies.dosFactoresObligatorio}
                onChange={(e) => setPolicies({ ...policies, dosFactoresObligatorio: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              <div>
                <strong>Autenticación de Dos Factores (2FA) Obligatoria</strong>
                <div style={{ fontSize: 12, color: '#64748B' }}>Exigir código OTP a administradores y personal contable.</div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={policies.requiereMayusculasNumeros}
                onChange={(e) => setPolicies({ ...policies, requiereMayusculasNumeros: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              <div>
                <strong>Requerir Contraseñas Fuertes</strong>
                <div style={{ fontSize: 12, color: '#64748B' }}>Obliga mayúsculas, minúsculas, números y caracteres especiales.</div>
              </div>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
              <div>
                <label className="fn-form-label">Tiempo de Inactividad (Minutos)</label>
                <input
                  type="number"
                  className="fn-form-input"
                  value={policies.tiempoExpiracionSesionMin}
                  onChange={(e) => setPolicies({ ...policies, tiempoExpiracionSesionMin: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="fn-form-label">Intentos antes de Bloqueo</label>
                <input
                  type="number"
                  className="fn-form-input"
                  value={policies.bloqueoIntentosFallidos}
                  onChange={(e) => setPolicies({ ...policies, bloqueoIntentosFallidos: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24, borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
            <button type="submit" className="fn-btn-primary">
              Guardar Políticas Globales
            </button>
          </div>
        </form>
      )}

      {/* 4. BITÁCORA DE AUDITORÍA */}
      {activeSubTab === 'auditoria' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Registro de Actividades y Eventos de Seguridad</h3>
            <span style={{ fontSize: 12, color: '#64748B' }}>Monitoreo en tiempo real de IP y operaciones</span>
          </div>

          <div className="fn-table-responsive">
            <table className="fn-data-table">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Usuario</th>
                  <th>Módulo</th>
                  <th>Acción Realizada</th>
                  <th>Dirección IP</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="fn-table-row">
                    <td style={{ fontSize: 12, color: '#64748B' }}>{log.fecha}</td>
                    <td><strong>{log.usuario}</strong></td>
                    <td>
                      <span style={{ padding: '2px 6px', borderRadius: 4, background: '#F1F5F9', fontSize: 11, fontWeight: 600 }}>
                        {log.modulo}
                      </span>
                    </td>
                    <td>{log.accion}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{log.ip}</td>
                    <td>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        background: log.estado === 'Exitoso' ? '#ECFDF5' : '#FEF2F2',
                        color: log.estado === 'Exitoso' ? '#059669' : '#DC2626',
                      }}>
                        {log.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nuevo Usuario */}
      {showUserModal && (
        <div className="fn-modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="fn-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="fn-modal-header">
              <div className="fn-modal-title-group">
                <span>👤</span>
                <h3>Registrar Nuevo Usuario</h3>
              </div>
              <button className="fn-modal-close-btn" onClick={() => setShowUserModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="fn-modal-form">
              <div className="fn-form-row">
                <label className="fn-form-label">Nombre Completo</label>
                <input
                  type="text"
                  className="fn-form-input"
                  placeholder="Ej. Roberto De León"
                  value={userForm.nombre}
                  onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="fn-form-row">
                <label className="fn-form-label">Correo Electrónico (Login)</label>
                <input
                  type="email"
                  className="fn-form-input"
                  placeholder="roberto.deleon@appes.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="fn-form-grid-2">
                <div className="fn-form-row">
                  <label className="fn-form-label">Contraseña Temporal</label>
                  <input
                    type="password"
                    className="fn-form-input"
                    placeholder="••••••••"
                    value={userForm.password || ''}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    required
                  />
                </div>

                <div className="fn-form-row">
                  <label className="fn-form-label">Rol del Sistema</label>
                  <select
                    className="fn-form-input"
                    value={userForm.rol}
                    onChange={(e) => setUserForm({ ...userForm, rol: e.target.value })}
                  >
                    <option value="ADMIN">ADMIN (Acceso Total de Administrador)</option>
                    <option value="CLIENTE">CLIENTE (Acceso a su Plan Contratado)</option>
                    <option value="VENTAS">VENTAS (Módulo Comercial)</option>
                    <option value="CRM">CRM (Gestión de Oportunidades)</option>
                    <option value="RRHH">RRHH (Recursos Humanos)</option>
                    <option value="SOPORTE">SOPORTE</option>
                  </select>
                </div>
              </div>

              <div className="fn-form-row">
                <label className="fn-form-label">Departamento / Empresa</label>
                <input
                  type="text"
                  className="fn-form-input"
                  placeholder="Ej: Dirección General / Tech Solutions SRL"
                  value={userForm.departamento}
                  onChange={(e) => setUserForm({ ...userForm, departamento: e.target.value })}
                />
              </div>

              <div className="fn-modal-actions">
                <button type="button" className="fn-btn-secondary" onClick={() => setShowUserModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="fn-btn-primary">
                  Guardar y Crear Acceso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
