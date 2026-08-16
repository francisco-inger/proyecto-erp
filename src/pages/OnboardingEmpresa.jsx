import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../core/auth/AuthContext'
import { formatRNC, formatPhone } from '../core/utils/formatters'
import './Onboarding.css'

export function OnboardingEmpresa() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Datos Iniciales Obligatorios de la Empresa / Clínica
  const [form, setForm] = useState({
    razonSocial: user?.departamento || '',
    nombreComercial: '',
    rnc: '',
    telefono: '',
    emailContacto: user?.email || '',
    direccion: '',
    ciudad: 'Santo Domingo',
    monedaPrincipal: 'DOP',
    sectorSalud: 'Clínica de Especialidades',
    secuenciaInicialNCF: 'B0100000001',
    limiteConsultorios: 3,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.razonSocial.trim() || !form.rnc.trim() || !form.telefono.trim() || !form.direccion.trim()) {
      setError('Por favor completa todos los campos requeridos de la empresa.')
      return
    }

    setError('')
    setLoading(true)

    setTimeout(() => {
      try {
        // 1. Guardar la configuración de la empresa en Ajustes Globales
        const empresaData = {
          razonSocial: form.razonSocial,
          nombreComercial: form.nombreComercial || form.razonSocial,
          rnc: form.rnc,
          telefonoPrincipal: form.telefono,
          emailContacto: form.emailContacto,
          direccionFiscal: form.direccion,
          ciudad: form.ciudad,
          monedaPrincipal: form.monedaPrincipal,
          sector: form.sectorSalud,
          ncfInicial: form.secuenciaInicialNCF,
          consultorios: form.limiteConsultorios,
          configuracionCompletada: true,
          fechaConfiguracion: new Date().toISOString(),
        }
        localStorage.setItem('appes_erp_global_settings_v2', JSON.stringify(empresaData))

        // 2. Marcar al usuario como empresa configurada y Activo
        const rawUsers = localStorage.getItem('erp_seguridad_users_v1')
        if (rawUsers) {
          const users = JSON.parse(rawUsers)
          const updated = users.map(u => {
            if (u.email === user?.email || u.id === user?.id) {
              return {
                ...u,
                estado: 'Activo',
                empresaConfigurada: true,
                departamento: form.razonSocial,
              }
            }
            return u
          })
          localStorage.setItem('erp_seguridad_users_v1', JSON.stringify(updated))
        }

        // Actualizar sesión actual como activa
        const currentSession = JSON.parse(localStorage.getItem('erp_user') || '{}')
        currentSession.empresaConfigurada = true
        currentSession.departamento = form.razonSocial
        currentSession.estado = 'Activo'
        localStorage.setItem('erp_user', JSON.stringify(currentSession))
        localStorage.setItem('erp_token', `token-${currentSession.id || 'usr'}-${Date.now()}`)

        setLoading(false)
        setSuccess(true)
      } catch (err) {
        setError('Error al guardar la configuración inicial.')
        setLoading(false)
      }
    }, 1000)
  }

  return (
    <div className="onboarding-shell">
      {/* ── Topbar de Progreso ── */}
      <header className="onboarding-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/branding/logo_appex.jpg" alt="APPEX Logo" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <strong style={{ fontSize: 16, color: '#0F172A' }}>APPEX<span style={{ color: '#2563EB' }}>.ERP</span></strong>
        </div>

        <div className="onboarding-steps-indicator">
          <div className="onboarding-step-badge completed">
            <span className="onboarding-step-num">✓</span>
            <span>Plan & Pago Confirmado</span>
          </div>
          <div className="onboarding-step-line active" />
          <div className="onboarding-step-badge active">
            <span className="onboarding-step-num">2</span>
            <span>Configuración Inicial de Empresa</span>
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>
          Paso Final Obligatorio
        </div>
      </header>

      {/* ── Contenedor Central ── */}
      <main className="onboarding-container">
        <div className="onboarding-card">
          <div className="onboarding-header">
            <h1 className="onboarding-title">Paso 2: Configuración Inicial de tu Empresa / Clínica</h1>
            <p className="onboarding-subtitle">
              Configura los datos fiscales, moneda y parámetros operativos de tu centro médico para emitir facturas y gestionar expedientes.
            </p>
          </div>

          {success ? (
            <div style={{
              background: '#F0FDF4',
              border: '2px solid #86EFAC',
              borderRadius: 16,
              padding: '36px 24px',
              textAlign: 'center',
              maxWidth: 600,
              margin: '20px auto',
            }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🎉</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#166534', margin: '0 0 8px' }}>
                ¡Suscripción y Configuración Activa!
              </h2>
              <p style={{ fontSize: 14, color: '#15803D', lineHeight: 1.5, margin: '0 0 20px' }}>
                Tu pago ha sido validado con éxito y la empresa <strong>{form.razonSocial}</strong> está lista para operar. Ya tienes acceso inmediato a todos tus módulos.
              </p>
              <button
                type="button"
                className="onboarding-submit-btn"
                style={{ maxWidth: 280, margin: '0 auto' }}
                onClick={() => window.location.href = '/dashboard'}
              >
                🚀 Entrar al Sistema (Panel ERP) →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="onboarding-form-grid-2">
                <div className="onboarding-field">
                  <label>RAZÓN SOCIAL / NOMBRE LEGAL *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Centro Médico Dominicano SRL"
                    value={form.razonSocial}
                    onChange={e => setForm({ ...form, razonSocial: e.target.value })}
                  />
                </div>

                <div className="onboarding-field">
                  <label>NOMBRE COMERCIAL / CLÍNICA</label>
                  <input
                    type="text"
                    placeholder="Ej. MediCare Policlínica"
                    value={form.nombreComercial}
                    onChange={e => setForm({ ...form, nombreComercial: e.target.value })}
                  />
                </div>
              </div>

              <div className="onboarding-form-grid-2">
                <div className="onboarding-field">
                  <label>RNC / CÉDULA FISCAL (DGII) *</label>
                  <input
                    type="text"
                    required
                    placeholder="1-31-89023-4"
                    value={form.rnc}
                    onChange={e => setForm({ ...form, rnc: formatRNC(e.target.value) })}
                  />
                </div>

                <div className="onboarding-field">
                  <label>TELÉFONO DE CONTACTO *</label>
                  <input
                    type="text"
                    required
                    placeholder="(809) 555-0100"
                    value={form.telefono}
                    onChange={e => setForm({ ...form, telefono: formatPhone(e.target.value) })}
                  />
                </div>
              </div>

              <div className="onboarding-field">
                <label>DIRECCIÓN FISCAL COMPLETA *</label>
                <input
                  type="text"
                  required
                  placeholder="Av. 27 de Febrero #450, Piantini"
                  value={form.direccion}
                  onChange={e => setForm({ ...form, direccion: e.target.value })}
                />
              </div>

              <div className="onboarding-form-grid-2">
                <div className="onboarding-field">
                  <label>CIUDAD / MUNICIPIO</label>
                  <select
                    value={form.ciudad}
                    onChange={e => setForm({ ...form, ciudad: e.target.value })}
                  >
                    <option value="Santo Domingo">Santo Domingo</option>
                    <option value="Santiago de los Caballeros">Santiago de los Caballeros</option>
                    <option value="La Vega">La Vega</option>
                    <option value="San Cristóbal">San Cristóbal</option>
                    <option value="Punta Cana / Bávaro">Punta Cana / Bávaro</option>
                    <option value="Puerto Plata">Puerto Plata</option>
                  </select>
                </div>

                <div className="onboarding-field">
                  <label>MONEDA PRINCIPAL DEL SISTEMA</label>
                  <select
                    value={form.monedaPrincipal}
                    onChange={e => setForm({ ...form, monedaPrincipal: e.target.value })}
                  >
                    <option value="DOP">Pesos Dominicanos (RD$)</option>
                    <option value="USD">Dólares Estadounidenses (USD$)</option>
                  </select>
                </div>
              </div>

              <div className="onboarding-form-grid-2">
                <div className="onboarding-field">
                  <label>SECTOR / ESPECIALIDAD MÉDICA</label>
                  <select
                    value={form.sectorSalud}
                    onChange={e => setForm({ ...form, sectorSalud: e.target.value })}
                  >
                    <option value="Clínica de Especialidades">Clínica de Especialidades</option>
                    <option value="Consultorio Privado">Consultorio Privado</option>
                    <option value="Centro Odontológico">Centro Odontológico</option>
                    <option value="Laboratorio Clínico">Laboratorio Clínico</option>
                    <option value="Centro de Diagnóstico & Imágenes">Centro de Diagnóstico & Imágenes</option>
                    <option value="Policlínica General">Policlínica General</option>
                  </select>
                </div>

                <div className="onboarding-field">
                  <label>CANTIDAD DE CONSULTORIOS FÍSICOS</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={form.limiteConsultorios}
                    onChange={e => setForm({ ...form, limiteConsultorios: Number(e.target.value) })}
                  />
                </div>
              </div>

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '10px', borderRadius: 8, color: '#DC2626', fontSize: 12, marginBottom: 14 }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                className="onboarding-submit-btn"
                disabled={loading}
              >
                <span>💾</span>
                {loading ? 'Guardando configuración inicial...' : 'Finalizar y Guardar Configuración de Empresa'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
