import { useAuth } from '../auth/AuthContext'

export function Topbar() {
  const { user, logout } = useAuth()

  return (
    <header className="topbar">
      {/* Búsqueda */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 360 }}>
        <span style={{ color: 'var(--color-ink-faint)' }}>🔍</span>
        <input
          type="text"
          placeholder="Buscar en appes.erp..."
          style={{
            border: 'none', outline: 'none', background: 'transparent',
            fontSize: 14, color: 'var(--color-ink)', width: '100%'
          }}
        />
      </div>

      {/* Acciones derecha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, position: 'relative' }}>
          🔔
          <span style={{
            position: 'absolute', top: 0, right: 0,
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--color-danger)', display: 'block'
          }} />
        </button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>❓</button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>⚙️</button>

        {/* Avatar con logout */}
        <button
          onClick={logout}
          title="Cerrar sesión"
          style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--color-accent)',
            color: '#fff', border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 13
          }}
        >
          {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
        </button>
      </div>
    </header>
  )
}

