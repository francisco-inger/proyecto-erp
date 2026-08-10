import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-mark">ERP</div>
        <h1>Crea tu cuenta</h1>
        <p>Configura tu empresa en appes.erp en menos de un minuto.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Nombre completo</label>
            <input id="name" type="text" placeholder="Tu nombre" value={form.name} onChange={update('name')} required />
          </div>

          <div className="field">
            <label htmlFor="company">Empresa</label>
            <input id="company" type="text" placeholder="Nombre de tu empresa" value={form.company} onChange={update('company')} />
          </div>

          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" placeholder="tunombre@empresa.com" value={form.email} onChange={update('email')} required />
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={update('password')} required minLength={8} />
          </div>

          {error && (
            <p style={{ color: 'var(--color-danger)', fontSize: 13 }}>{error}</p>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}
