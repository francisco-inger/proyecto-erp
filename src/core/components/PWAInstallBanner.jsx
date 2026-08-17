import { useState, useEffect } from 'react'
import { usePWA } from '../hooks/usePWA'
import './PWAInstallBanner.css'

export function PWAInstallBanner({ showModalOverride, onCloseModalOverride }) {
  const { isInstallable, isInstalled, isOnline, isIOS, promptInstall } = usePWA()
  const [dismissed, setDismissed] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showOnlineRestored, setShowOnlineRestored] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  // Control de aviso de reconexión
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true)
    } else if (wasOffline) {
      setShowOnlineRestored(true)
      const t = setTimeout(() => setShowOnlineRestored(false), 4000)
      return () => clearTimeout(t)
    }
  }, [isOnline, wasOffline])

  useEffect(() => {
    if (showModalOverride) {
      setShowModal(true)
    }
  }, [showModalOverride])

  const handleOpenInstall = async () => {
    if (isInstallable) {
      const installed = await promptInstall()
      if (installed) return
    }
    setShowModal(true)
  }

  const handleClose = () => {
    setShowModal(false)
    if (onCloseModalOverride) onCloseModalOverride()
  }

  return (
    <>
      {/* Alerta si el dispositivo pierde conexión */}
      {!isOnline && (
        <div className="pwa-offline-alert" role="alert">
          <span>📡</span>
          <span>Modo Sin Conexión — Base de datos local disponible</span>
        </div>
      )}

      {/* Alerta cuando la conexión se recupera */}
      {showOnlineRestored && isOnline && (
        <div className="pwa-online-restored-alert" role="alert">
          <span>🟢</span>
          <span>Conexión restablecida — Sincronizando datos con el servidor</span>
        </div>
      )}

      {/* Píldora Flotante fija en la esquina inferior derecha */}
      {!isInstalled && !dismissed && (
        <div
          className="pwa-floating-install-pill"
          onClick={handleOpenInstall}
          title="Descargar e instalar APPEX ERP en tu dispositivo"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>📲</span>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.1 }}>
              <strong style={{ fontSize: 12 }}>Instalar APPEX ERP</strong>
              <span style={{ fontSize: 10, opacity: 0.85 }}>App de Escritorio & Móvil</span>
            </div>
          </div>
          <button
            className="pwa-pill-close"
            onClick={(e) => {
              e.stopPropagation()
              setDismissed(true)
            }}
            title="Ocultar"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modal Guía Completo Multiplataforma (Windows, Android, Mac, iOS) */}
      {showModal && (
        <div className="pwa-ios-modal-backdrop" onClick={handleClose}>
          <div className="pwa-ios-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleClose}
                style={{ background: 'none', border: 'none', fontSize: 18, color: '#94A3B8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <img src="/branding/logo_appex.jpg" alt="APPEX ERP" className="pwa-ios-icon" />
            <h3 style={{ margin: '0 0 6px', fontSize: 19, color: '#0F172A', fontWeight: 800 }}>
              Instalar APPEX ERP
            </h3>
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px', lineHeight: 1.4 }}>
              Disfruta de acceso rápido desde tu escritorio o pantalla de inicio, modo a pantalla completa y soporte sin conexión.
            </p>

            {/* Si el navegador soporta el botón de instalación nativo */}
            {isInstallable ? (
              <button
                onClick={async () => {
                  const done = await promptInstall()
                  if (done) handleClose()
                }}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: 'linear-gradient(135deg, #1E3A8A, #2563EB)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                  marginBottom: 16
                }}
              >
                ⚡ Instalar en 1 Clic Ahora
              </button>
            ) : null}

            {/* Instrucciones según plataforma */}
            <div className="pwa-ios-steps">
              <strong style={{ fontSize: 12, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                {isIOS ? '📱 Instrucciones para iPhone / iPad' : '💻 Instrucciones para Windows / Mac / Android'}
              </strong>

              {isIOS ? (
                <>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">1</span>
                    <span>Toca el botón <strong>Compartir</strong> <span style={{ fontSize: 15 }}>⎋ / 📤</span> en la barra inferior de Safari.</span>
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">2</span>
                    <span>Desliza hacia abajo y pulsa <strong>"Añadir a la pantalla de inicio"</strong> ➕.</span>
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">3</span>
                    <span>Confirma tocando <strong>"Añadir"</strong> en la esquina superior derecha.</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">1</span>
                    <span>En <strong>Google Chrome</strong> o <strong>Edge</strong>, busca el ícono de instalación 🖥️ en la parte derecha de la barra de URL.</span>
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">2</span>
                    <span>O abre el menú de los <strong>tres puntos (⋮)</strong> ➔ <strong>"Instalar APPEX Enterprise Suite ERP"</strong>.</span>
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">3</span>
                    <span>¡Listo! Se abrirá como aplicación nativa en tu barra de tareas o escritorio.</span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleClose}
              style={{
                width: '100%',
                padding: '11px',
                background: '#F1F5F9',
                color: '#334155',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
