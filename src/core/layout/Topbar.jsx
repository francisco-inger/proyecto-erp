import { useAuth } from '../auth/AuthContext'

export function Topbar() {
  const { user, logout } = useAuth()

  return (
    <header className="topbar">
      {/* Búsqueda estilo pill */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: '#F1F5F9',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        padding: '6px 12px',
        flex: 1,
        maxWidth: 340
      }}>
        <span style={{ color: 'var(--color-ink-faint)', fontSize: 13 }}>🔍</span>
        <input
          type="text"
          placeholder="Buscar en appes.erp..."
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 13,
            color: 'var(--color-ink)',
            width: '100%'
          }}
        />
        <span style={{
          fontSize: 11,
          color: 'var(--color-ink-faint)',
          background: '#FFFFFF',
          border: '1px solid #CBD5E1',
          borderRadius: 4,
          padding: '1px 5px',
          fontWeight: 600
        }}>
          ⌘K
        </span>
      </div>

      {/* Acciones derecha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button style={{
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 16,
          position: 'relative', display: 'flex', alignItems: 'center', color: '#64748B'
        }}>
          🔔
          <span style={{
            position: 'absolute', top: -2, right: -4,
            width: 14, height: 14, borderRadius: '50%',
            background: 'var(--color-danger)', color: '#FFF',
            fontSize: 9, fontWeight: 700, display: 'flex',
            alignItems: 'center', justifyContent: 'center'
          }}>1</span>
        </button>

        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#64748B' }}>❓</button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#64748B' }}>⚙️</button>

        {/* Avatar de usuario y detalles */}
        <div
          onClick={logout}
          title="Haz clic para cerrar sesión"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 8,
            transition: 'background 120ms'
          }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: '#EEF2FF', color: 'var(--color-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 12, border: '1px solid #C7D2FE'
          }}>
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-ink)' }}>
              {user?.name ?? 'Administrador'}
            </span>
            <span style={{ fontSize: 10, color: 'var(--color-ink-faint)' }}>
              {user?.email ?? 'admin@appes.erp'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}


