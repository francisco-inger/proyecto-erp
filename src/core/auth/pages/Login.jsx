import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import './Login.css'

const MAX_INTENTOS = 3
const BLOQUEO_SEGUNDOS = 120

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('admin@appes.com')
  const [password, setPassword] = useState('Admin2024!')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [intentos, setIntentos] = useState(0)
  const [bloqueado, setBloqueado] = useState(false)
  const [tiempoRestante, setTiempoRestante] = useState(BLOQUEO_SEGUNDOS)
  const [showPass, setShowPass] = useState(false)

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
      navigate('/')
    } catch (err) {
      const nuevosIntentos = intentos + 1
      setIntentos(nuevosIntentos)

      if (nuevosIntentos >= MAX_INTENTOS) {
        activarBloqueo()
        setError('')
      } else {
        const restantes = MAX_INTENTOS - nuevosIntentos
        setError(`${err.message} Te ${restantes === 1 ? 'queda 1 intento' : `quedan ${restantes} intentos`}.`)
      }
    } finally {
      setLoading(false)
    }
  }

  const minutos = String(Math.floor(tiempoRestante / 60)).padStart(2, '0')
  const segundos = String(tiempoRestante % 60).padStart(2, '0')

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

          <h1 className="auth-split-title">Sistema de Gestión Empresarial</h1>
          <p className="auth-split-sub">Panel de Control Administrativo — Acceso Seguro</p>

          {/* Estado de Bloqueo */}
          {bloqueado ? (
            <div className="auth-split-lockout">
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
              <strong style={{ display: 'block', fontSize: 15, marginBottom: 4 }}>Acceso Temporalmente Bloqueado</strong>
              <p style={{ fontSize: 12, margin: '0 0 12px', color: '#7F1D1D' }}>
                Has superado el límite de intentos ({MAX_INTENTOS}).
              </p>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#DC2626' }}>
                {minutos}:{segundos}
              </div>
              <small style={{ fontSize: 10, color: '#991B1B' }}>El formulario se reactivará automáticamente.</small>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="auth-split-field">
                <label htmlFor="email">USUARIO</label>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@appes.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
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
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
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
                disabled={loading}
              >
                <span>🔒</span>
                {loading ? 'Validando...' : 'Iniciar Sesión'}
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
            <span>¿No tienes cuenta?</span>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          </div>

          <Link to="/register" className="auth-split-btn-outline">
            <span>👤</span> Registrar Nuevo Usuario
          </Link>
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
            Sistema de Gestión y Control Empresarial.
          </h2>
          <p className="auth-split-hero-desc">
            Diseñado con visión, elegancia y precisión para una toma de decisiones inteligente y en tiempo real.
          </p>
        </div>
      </div>
    </div>
  )
}
