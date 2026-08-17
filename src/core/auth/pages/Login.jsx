import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { validateStrongPassword } from '../../../core/utils/formatters'
import './Login.css'

const MAX_INTENTOS = 3
const BLOQUEO_SEGUNDOS = 120

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [intentos, setIntentos] = useState(0)
  const [bloqueado, setBloqueado] = useState(false)
  const [tiempoRestante, setTiempoRestante] = useState(BLOQUEO_SEGUNDOS)
  const [showPass, setShowPass] = useState(false)

  // ── Estados para "Olvidé mi contraseña" ──
  const [modoRecuperacion, setModoRecuperacion] = useState(false)
  const [recuperacionPaso, setRecuperacionPaso] = useState(1) // 1: Email, 2: Nueva Contraseña, 3: Éxito
  const [emailRecuperacion, setEmailRecuperacion] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [showPassRecup, setShowPassRecup] = useState(false)
  const [recupSuccess, setRecupSuccess] = useState('')

  const timerRef = useRef(null)

  useEffect(() => {
    const stored = localStorage.getItem('erp_login_block')
    if (stored) {
      const { until } = JSON.parse(stored)
      const diff = Math.ceil((until - Date.now()) / 1000)
      if (diff > 0) {
        setBloqueado(true)
        setTiempoRestante(diff)
      } else {
        localStorage.removeItem('erp_login_block')
      }
    }
  }, [])

  useEffect(() => {
    if (!bloqueado) return

    timerRef.current = setInterval(() => {
      setTiempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setBloqueado(false)
          setIntentos(0)
          setError('')
          localStorage.removeItem('erp_login_block')
          return BLOQUEO_SEGUNDOS
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [bloqueado])

  function activarBloqueo() {
    const until = Date.now() + BLOQUEO_SEGUNDOS * 1000
    localStorage.setItem('erp_login_block', JSON.stringify({ until }))
    setBloqueado(true)
    setTiempoRestante(BLOQUEO_SEGUNDOS)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (bloqueado) return
    setError('')
    setLoading(true)

    try {
      await login({ email, password })
      setIntentos(0)
      navigate('/dashboard')
    } catch (err) {
      const nuevosIntentos = intentos + 1
      setIntentos(nuevosIntentos)

      if (nuevosIntentos >= MAX_INTENTOS) {
        activarBloqueo()
        setError(`Demasiados intentos fallidos. Acceso bloqueado por ${BLOQUEO_SEGUNDOS} segundos por seguridad.`)
      } else {
        const restantes = MAX_INTENTOS - nuevosIntentos
        setError(`${err.message} (Te quedan ${restantes} intento${restantes === 1 ? '' : 's'})`)
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Manejo de Recuperación de Contraseña ──
  function handleVerificarEmail(e) {
    e.preventDefault()
    setError('')

    const rawUsers = localStorage.getItem('erp_seguridad_users_v1')
    const users = rawUsers ? JSON.parse(rawUsers) : []
    const usuarioEncontrado = users.find(u => u.email.toLowerCase() === emailRecuperacion.trim().toLowerCase())

    if (!usuarioEncontrado && emailRecuperacion.toLowerCase() !== 'admin@appes.com') {
      setError('No encontramos ninguna cuenta registrada con este correo electrónico.')
      return
    }

    setRecuperacionPaso(2)
  }

  function handleGuardarNuevaPassword(e) {
    e.preventDefault()
    setError('')

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas ingresadas no coinciden.')
      return
    }

    const passError = validateStrongPassword(nuevaPassword)
    if (passError) {
      setError(passError)
      return
    }

    setLoading(true)

    setTimeout(() => {
      try {
        const rawUsers = localStorage.getItem('erp_seguridad_users_v1')
        if (rawUsers) {
          const users = JSON.parse(rawUsers)
          const updated = users.map(u => {
            if (u.email.toLowerCase() === emailRecuperacion.trim().toLowerCase()) {
              return { ...u, password: nuevaPassword }
            }
            return u
          })
          localStorage.setItem('erp_seguridad_users_v1', JSON.stringify(updated))
        }

        setLoading(false)
        setRecuperacionPaso(3)
        setRecupSuccess('¡Tu contraseña ha sido restablecida exitosamente!')
      } catch (_) {
        setError('Ocurrió un error al actualizar la contraseña.')
        setLoading(false)
      }
    }, 900)
  }

  return (
    <div className="auth-split-wrapper">
      {/* ── Panel Izquierdo: Formulario ── */}
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

          {/* ── VISTA DE RECUPERACIÓN DE CONTRASEÑA ── */}
          {modoRecuperacion ? (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h1 className="auth-split-title" style={{ fontSize: 22 }}>
                  Restablecer Contraseña
                </h1>
                <p className="auth-split-subtitle">
                  {recuperacionPaso === 1 && 'Ingresa el correo electrónico asociado a tu cuenta.'}
                  {recuperacionPaso === 2 && 'Crea y confirma tu nueva contraseña de acceso seguro.'}
                  {recuperacionPaso === 3 && 'Contraseña actualizada con éxito.'}
                </p>
              </div>

              {recuperacionPaso === 1 && (
                <form onSubmit={handleVerificarEmail}>
                  <div className="auth-split-field">
                    <label htmlFor="recup-email">CORREO ELECTRÓNICO REGISTRADO</label>
                    <input
                      id="recup-email"
                      type="email"
                      required
                      placeholder="correo@empresa.com"
                      value={emailRecuperacion}
                      onChange={e => setEmailRecuperacion(e.target.value)}
                    />
                  </div>

                  {error && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#DC2626', fontWeight: 600, marginBottom: 14 }}>
                      ⚠️ {error}
                    </div>
                  )}

                  <button type="submit" className="auth-split-btn-primary">
                    Continuar al Restablecimiento →
                  </button>

                  <button
                    type="button"
                    onClick={() => { setModoRecuperacion(false); setError(''); }}
                    className="auth-split-btn-outline"
                    style={{ marginTop: 10 }}
                  >
                    ← Volver a Iniciar Sesión
                  </button>
                </form>
              )}

              {recuperacionPaso === 2 && (
                <form onSubmit={handleGuardarNuevaPassword}>
                  <div className="auth-split-field">
                    <label htmlFor="new-pass">NUEVA CONTRASEÑA *</label>
                    <div className="auth-split-pass-wrap">
                      <input
                        id="new-pass"
                        type={showPassRecup ? 'text' : 'password'}
                        required
                        placeholder="Mín. 8 caracteres (A-Z, 0-9, !@#)"
                        value={nuevaPassword}
                        onChange={e => setNuevaPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="auth-split-toggle-pass"
                        onClick={() => setShowPassRecup(v => !v)}
                        tabIndex={-1}
                      >
                        {showPassRecup ? '🙈' : '👁️'}
                      </button>
                    </div>

                    {/* Checklist interactivo */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 6, fontSize: 11 }}>
                      <span style={{ color: nuevaPassword.length >= 8 ? '#16A34A' : '#94A3B8', fontWeight: 600 }}>
                        {nuevaPassword.length >= 8 ? '✓' : '○'} Mín. 8 caracteres
                      </span>
                      <span style={{ color: /[A-Z]/.test(nuevaPassword) ? '#16A34A' : '#94A3B8', fontWeight: 600 }}>
                        {/[A-Z]/.test(nuevaPassword) ? '✓' : '○'} 1 Mayúscula (A-Z)
                      </span>
                      <span style={{ color: /[0-9]/.test(nuevaPassword) ? '#16A34A' : '#94A3B8', fontWeight: 600 }}>
                        {/[0-9]/.test(nuevaPassword) ? '✓' : '○'} 1 Número (0-9)
                      </span>
                      <span style={{ color: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(nuevaPassword) ? '#16A34A' : '#94A3B8', fontWeight: 600 }}>
                        {/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(nuevaPassword) ? '✓' : '○'} 1 Especial (!@#)
                      </span>
                    </div>
                  </div>

                  <div className="auth-split-field">
                    <label htmlFor="confirm-pass">CONFIRMAR NUEVA CONTRASEÑA *</label>
                    <input
                      id="confirm-pass"
                      type={showPassRecup ? 'text' : 'password'}
                      required
                      placeholder="Repite la nueva contraseña"
                      value={confirmarPassword}
                      onChange={e => setConfirmarPassword(e.target.value)}
                    />
                  </div>

                  {error && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#DC2626', fontWeight: 600, marginBottom: 14 }}>
                      ⚠️ {error}
                    </div>
                  )}

                  <button type="submit" className="auth-split-btn-primary" disabled={loading}>
                    {loading ? 'Guardando nueva contraseña...' : '💾 Guardar Nueva Contraseña'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setModoRecuperacion(false); setRecuperacionPaso(1); setError(''); }}
                    className="auth-split-btn-outline"
                    style={{ marginTop: 10 }}
                  >
                    Cancelar
                  </button>
                </form>
              )}

              {recuperacionPaso === 3 && (
                <div style={{ textAlign: 'center', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: '24px 16px' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                  <strong style={{ fontSize: 16, color: '#166534', display: 'block', marginBottom: 6 }}>
                    {recupSuccess}
                  </strong>
                  <p style={{ fontSize: 13, color: '#15803D', margin: '0 0 16px' }}>
                    Ya puedes iniciar sesión con tu nueva contraseña segura.
                  </p>
                  <button
                    type="button"
                    className="auth-split-btn-primary"
                    onClick={() => {
                      setModoRecuperacion(false);
                      setRecuperacionPaso(1);
                      setPassword(nuevaPassword);
                      setEmail(emailRecuperacion);
                      setError('');
                    }}
                  >
                    Ir a Iniciar Sesión →
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── VISTA NORMAL DE LOGIN ── */
            <div>
              <h1 className="auth-split-title">Bienvenido de nuevo</h1>
              <p className="auth-split-subtitle">
                Ingresa tus credenciales para acceder al panel de control.
              </p>

              {/* Banner de bloqueo por seguridad */}
              {bloqueado && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 10,
                  padding: '12px 14px',
                  marginBottom: 18,
                  fontSize: 12,
                  color: '#991B1B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span style={{ fontSize: 18 }}>⏱️</span>
                  <div>
                    <strong>Acceso temporalmente bloqueado</strong>
                    <div>Podrás intentar de nuevo en <strong>{tiempoRestante}s</strong>.</div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="auth-split-field">
                  <label htmlFor="email">CORREO ELECTRÓNICO</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="usuario@empresa.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading || bloqueado}
                    required
                  />
                </div>

                <div className="auth-split-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="password" style={{ margin: 0 }}>CONTRASEÑA</label>
                    <button
                      type="button"
                      onClick={() => {
                        setModoRecuperacion(true);
                        setRecuperacionPaso(1);
                        setEmailRecuperacion(email);
                        setError('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563EB',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="auth-split-pass-wrap" style={{ marginTop: 6 }}>
                    <input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      disabled={loading || bloqueado}
                      required
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
                  disabled={loading || bloqueado}
                >
                  <span>🔒</span>
                  {loading ? 'Validando...' : 'Iniciar Sesión'}
                </button>
              </form>
            </div>
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
            <span>¿No tienes cuenta?</span>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          </div>

          <Link to="/register" className="auth-split-btn-outline">
            <span>👤</span> Registrar Nuevo Usuario
          </Link>

          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <Link to="/" style={{ fontSize: 12, color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>
              ← Volver a la Página Principal (Landing Page)
            </Link>
          </div>
        </div>

        {/* Footer legal */}
        <div style={{ paddingTop: 20, textAlign: 'center', fontSize: 11, color: '#94A3B8' }}>
          Sistema de Gestión Empresarial v2.0 · Sesión segura con JWT
        </div>
      </div>

      {/* ── Panel Derecho: Hero con Imagen Corporativa y Mensaje ── */}
      <div className="auth-split-hero-side">
        <div className="auth-split-hero-overlay" />
        <div className="auth-split-hero-content">
          <h2 className="auth-split-hero-title">
            Tu Empresa en una Plataforma Integral
          </h2>
          <p className="auth-split-hero-subtitle">
            Gestiona compras, ventas, inventario, finanzas y clientes con la máxima precisión, elegancia y seguridad.
          </p>
          <div className="auth-split-badges">
            <div className="auth-split-badge-item">
              <span className="auth-split-badge-icon">⚡</span>
              <span>11 Módulos Conectados</span>
            </div>
            <div className="auth-split-badge-item">
              <span className="auth-split-badge-icon">🛡️</span>
              <span>Cifrado y Auditoría en Tiempo Real</span>
            </div>
            <div className="auth-split-badge-item">
              <span className="auth-split-badge-icon">🤖</span>
              <span>Chatbot IA Asistente</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
