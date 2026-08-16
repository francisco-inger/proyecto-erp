import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import './Login.css'

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await register(form)
      navigate('/')
    } catch (err) {
      if (err.message.includes('esperando que el Administrador') || err.message.includes('Registro exitoso')) {
        setSuccess(err.message)
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-split-wrapper">
      {/* ── Panel Izquierdo: Formulario de Registro ── */}
      <div className="auth-split-form-side">
        <div>
          {/* Logo Corporativo */}
          <div className="auth-split-brand">
            <img
              src="/branding/logo_appex.jpg"
              alt="APPEX Logo"
              className="auth-split-logo-img"
            />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                APPEX<span style={{ color: '#2563EB' }}>.ERP</span>
              </div>
              <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Sistema de Gestión Empresarial
              </div>
            </div>
          </div>

          <h1 className="auth-split-title">Crear Cuenta Corporativa</h1>
          <p className="auth-split-sub">Registra tu empresa y solicita acceso a la plataforma.</p>

          {success ? (
            <div style={{
              background: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: 12,
              padding: '20px 16px',
              textAlign: 'center',
              margin: '20px 0',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
              <h3 style={{ margin: '0 0 6px', fontSize: 16, color: '#92400E', fontWeight: 800 }}>Registro Completado</h3>
              <p style={{ fontSize: 13, color: '#78350F', margin: '0 0 14px', lineHeight: 1.4 }}>
                {success}
              </p>
              <Link to="/login" className="auth-split-btn-primary" style={{ display: 'inline-flex', textDecoration: 'none', justifyContent: 'center' }}>
                Ir a Iniciar Sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="auth-split-field">
                <label htmlFor="name">NOMBRE COMPLETO</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Lic. Juan Pérez"
                  value={form.name}
                  onChange={update('name')}
                  disabled={loading}
                  required
                />
              </div>

              <div className="auth-split-field">
                <label htmlFor="company">EMPRESA / RAZÓN SOCIAL</label>
                <input
                  id="company"
                  type="text"
                  placeholder="Tech Solutions SRL"
                  value={form.company}
                  onChange={update('company')}
                  disabled={loading}
                  required
                />
              </div>

              <div className="auth-split-field">
                <label htmlFor="email">CORREO ELECTRÓNICO (LOGIN)</label>
                <input
                  id="email"
                  type="email"
                  placeholder="contacto@techsolutions.do"
                  value={form.email}
                  onChange={update('email')}
                  disabled={loading}
                  required
                />
              </div>

              <div className="auth-split-field">
                <label htmlFor="password">CONTRASEÑA</label>
                <div className="auth-split-pass-wrap">
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={form.password}
                    onChange={update('password')}
                    disabled={loading}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="auth-split-toggle-pass"
                    onClick={() => setShowPass(v => !v)}
                    tabIndex={-1}
                    aria-label="Ver u ocultar contraseña"
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 12,
                  color: '#DC2626',
                  fontWeight: 600,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="auth-split-btn-primary"
                disabled={loading}
              >
                <span>👤</span>
                {loading ? 'Procesando registro...' : 'Crear Cuenta'}
              </button>
            </form>
          )}

          {/* Separador */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            margin: '22px 0 16px',
            color: '#94A3B8',
            fontSize: 11,
            fontWeight: 600
          }}>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            <span>¿Ya tienes cuenta?</span>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          </div>

          <Link to="/login" className="auth-split-btn-outline">
            <span>🔒</span> Iniciar Sesión con mi Cuenta
          </Link>
        </div>

        {/* Footer legal */}
        <div style={{ paddingTop: 20, textAlign: 'center', fontSize: 11, color: '#94A3B8' }}>
          Sistema de Gestión Empresarial v2.0 · Plataforma Segura
        </div>
      </div>

      {/* ── Panel Derecho: Hero con Imagen Corporativa y Mensaje ── */}
      <div className="auth-split-hero-side">
        <div className="auth-split-hero-overlay" />
        <div className="auth-split-hero-content">
          <h2 className="auth-split-hero-title">
            Tu Empresa en una Plataforma Integral.
          </h2>
          <p className="auth-split-hero-desc">
            Gestiona compras, ventas, inventario, finanzas y clientes con la máxima precisión, elegancia y seguridad.
          </p>
        </div>
      </div>
    </div>
  )
}
