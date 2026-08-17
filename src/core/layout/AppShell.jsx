import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { PWAInstallBanner } from '../components/PWAInstallBanner'

export function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('appes_sidebar_collapsed') === 'true'
    } catch (_) {
      return false
    }
  })
  const location = useLocation()

  const handleToggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev
      try {
        localStorage.setItem('appes_sidebar_collapsed', String(next))
      } catch (_) {}
      return next
    })
  }

  // Cerrar sidebar al cambiar de página en pantallas pequeñas
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname, location.search])

  return (
    <div className={`app-shell ${isCollapsed ? 'sidebar-collapsed' : ''} ${mobileMenuOpen ? 'mobile-sidebar-open' : ''}`}>
      {/* Banner y detector de estado PWA Offline / Instalación */}
      <PWAInstallBanner />

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
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      <div className="app-shell-main">
        <Topbar
          onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

