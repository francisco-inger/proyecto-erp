import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import './Login.css'

const MAX_INTENTOS = 3
const BLOQUEO_SEGUNDOS = 120 // 2 minutos

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [intentos, setIntentos] = useState(0)
  const [bloqueado, setBloqueado] = useState(false)
  const [tiempoRestante, setTiempoRestante] = useState(BLOQUEO_SEGUNDOS)
  const [showPass, setShowPass] = useState(false)

  const timerRef = useRef(null)

  // Restaurar estado de bloqueo persistente al recargar
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

  // Countdown timer cuando está bloqueado
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
  const progreso = ((BLOQUEO_SEGUNDOS - tiempoRestante) / BLOQUEO_SEGUNDOS) * 100

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#grad)"/>
              <path d="M8 12h16M8 16h10M8 20h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#8b5cf6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="auth-logo-text">appes<span>.erp</span></span>
        </div>

        <h1 className="auth-title">Iniciar sesión</h1>
        <p className="auth-subtitle">Accede con tus credenciales corporativas registradas en el sistema.</p>

        {/* ── ESTADO BLOQUEADO ── */}
        {bloqueado ? (
          <div className="bloqueo-container">
            <div className="bloqueo-icon">🔒</div>
            <h2 className="bloqueo-titulo">Acceso temporalmente bloqueado</h2>
            <p className="bloqueo-desc">
              Has superado el número máximo de intentos fallidos ({MAX_INTENTOS}).
              <br/>Por seguridad, el acceso se ha bloqueado temporalmente.
            </p>

            <div className="countdown-circle">
              <svg viewBox="0 0 120 120" className="countdown-svg">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth="8"/>
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke="#ef4444"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (progreso / 100)}`}
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="countdown-text">
                <span className="countdown-time">{minutos}:{segundos}</span>
                <span className="countdown-label">restantes</span>
              </div>
            </div>

            <div className="bloqueo-barra-wrap">
              <div className="bloqueo-barra">
                <div className="bloqueo-barra-fill" style={{ width: `${progreso}%` }}/>
              </div>
              <p className="bloqueo-pie">El formulario se desbloqueará automáticamente cuando el cronómetro llegue a cero.</p>
            </div>
          </div>
        ) : (
          /* ── FORMULARIO NORMAL ── */
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                placeholder="tunombre@appes.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <div className="field-password-wrap">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {intentos > 0 && !error && (
              <div className="auth-intentos">
                {MAX_INTENTOS - intentos} intento(s) restante(s) antes del bloqueo
              </div>
            )}

            <button
              className="btn btn-primary auth-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="auth-spinner">
                  <span className="spinner-dot"/>Verificando…
                </span>
              ) : 'Entrar al sistema'}
            </button>

            <div className="auth-hint">
              <p>
                <strong>💡 Usuarios de prueba:</strong><br/>
                <code>admin@appes.com</code> / <code>Admin2024!</code><br/>
                <code>francisco@appes.com</code> / <code>Francisco123!</code>
              </p>
            </div>
          </form>
        )}

        <p className="auth-footer">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  )
}
