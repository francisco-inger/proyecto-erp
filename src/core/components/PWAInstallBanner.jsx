import { useState, useEffect } from 'react'
import { usePWA } from '../hooks/usePWA'
import './PWAInstallBanner.css'

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, isOnline, isIOS, promptInstall } = usePWA()
  const [dismissed, setDismissed] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)
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

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true)
    } else {
      const success = await promptInstall()
      if (!success && isIOS) {
        setShowIOSModal(true)
      }
    }
  }

  return (
    <>
      {/* Alerta si el dispositivo pierde conexión */}
      {!isOnline && (
        <div className="pwa-offline-alert" role="alert">
          <span>📡</span>
          <span>Modo Sin Conexión — Acceso a datos en caché activo</span>
        </div>
      )}

      {/* Alerta cuando la conexión se recupera */}
      {showOnlineRestored && isOnline && (
        <div className="pwa-online-restored-alert" role="alert">
          <span>🟢</span>
          <span>Conexión restablecida — Sincronizando datos</span>
        </div>
      )}

      {/* Pill flotante para invitar a instalar si no está instalada */}
      {!isInstalled && !dismissed && (isInstallable || isIOS) && (
        <div className="pwa-floating-install-pill" onClick={handleInstallClick}>
          <span>📲</span>
          <span>Instalar APPEX ERP</span>
          <button
            className="pwa-pill-close"
            onClick={(e) => {
              e.stopPropagation()
              setDismissed(true)
            }}
            title="Descartar por ahora"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modal Guía para iOS (iPhone / iPad) */}
      {showIOSModal && (
        <div className="pwa-ios-modal-backdrop" onClick={() => setShowIOSModal(false)}>
          <div className="pwa-ios-modal" onClick={(e) => e.stopPropagation()}>
            <img src="/branding/logo_appex.jpg" alt="APPEX ERP" className="pwa-ios-icon" />
            <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#0F172A', fontWeight: 800 }}>
              Instalar en iPhone o iPad
            </h3>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
              Agrega APPEX ERP a tu pantalla de inicio para una experiencia como app nativa a pantalla completa.
            </p>

            <div className="pwa-ios-steps">
              <div className="pwa-step-item">
                <span className="pwa-step-num">1</span>
                <span>Toca el botón <strong>Compartir</strong> <span style={{ fontSize: 16 }}>⎋ / 📤</span> en la barra de Safari.</span>
              </div>
              <div className="pwa-step-item">
                <span className="pwa-step-num">2</span>
                <span>Desplázate hacia abajo y selecciona <strong>"Añadir a la pantalla de inicio"</strong> ➕.</span>
              </div>
              <div className="pwa-step-item">
                <span className="pwa-step-num">3</span>
                <span>Presiona <strong>"Añadir"</strong> en la esquina superior derecha.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  )
}
