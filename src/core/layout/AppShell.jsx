import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  // Cerrar sidebar al cambiar de página en pantallas pequeñas
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname, location.search])

  return (
    <div className={`app-shell ${mobileMenuOpen ? 'mobile-sidebar-open' : ''}`}>
      {/* Backdrop oscuro para móvil */}
      {mobileMenuOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="app-shell-main">
        <Topbar onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

