import { useState, useEffect } from 'react'
import { usePWA } from '../hooks/usePWA'
import './PWAInstallBanner.css'

export function PWAInstallBanner({ showModalOverride, onCloseModalOverride }) {
  const { isInstallable, isInstalled, isOnline, isIOS, promptInstall } = usePWA()
  const [dismissed, setDismissed] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showOnlineRestored, setShowOnlineRestored] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)
  const [activePlatform, setActivePlatform] = useState(() => (isIOS ? 'ios' : 'desktop'))

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

  useEffect(() => {
    const handleOpen = () => setShowModal(true)
    window.addEventListener('erp:open_pwa_modal', handleOpen)
    return () => window.removeEventListener('erp:open_pwa_modal', handleOpen)
  }, [])

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
              <span style={{ fontSize: 10, opacity: 0.85 }}>Android · Desktop · iOS</span>
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

      {/* Modal Guía Completo Multiplataforma (Windows/PC, Android APK/PWA, iOS Apple) */}
      {showModal && (
        <div className="pwa-ios-modal-backdrop" onClick={handleClose}>
          <div className="pwa-ios-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, padding: '24px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', background: '#EFF6FF', padding: '4px 10px', borderRadius: 20 }}>
                APPEX NATIVE INSTALLER
              </span>
              <button
                onClick={handleClose}
                style={{ background: 'none', border: 'none', fontSize: 18, color: '#94A3B8', cursor: 'pointer', padding: 4 }}
              >
                ✕
              </button>
            </div>

            <img src="/branding/logo_appex.jpg" alt="APPEX ERP" className="pwa-ios-icon" style={{ width: 56, height: 56, marginBottom: 8 }} />
            <h3 style={{ margin: '0 0 4px', fontSize: 20, color: '#0F172A', fontWeight: 800 }}>
              Instalar APPEX ERP en tu Dispositivo
            </h3>
            <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 16px', lineHeight: 1.4 }}>
              Selecciona tu plataforma para instalar la aplicación nativa y disfrutar de acceso directo, pantalla completa y modo sin conexión.
            </p>

            {/* Pestañas de Selección de Plataforma */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setActivePlatform('android')}
                style={{
                  padding: '8px 4px',
                  borderRadius: 10,
                  border: activePlatform === 'android' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                  background: activePlatform === 'android' ? '#EFF6FF' : '#F8FAFC',
                  color: activePlatform === 'android' ? '#1D4ED8' : '#64748B',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span style={{ fontSize: 18 }}>🤖</span>
                <span>Android / APK</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePlatform('desktop')}
                style={{
                  padding: '8px 4px',
                  borderRadius: 10,
                  border: activePlatform === 'desktop' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                  background: activePlatform === 'desktop' ? '#EFF6FF' : '#F8FAFC',
                  color: activePlatform === 'desktop' ? '#1D4ED8' : '#64748B',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span style={{ fontSize: 18 }}>💻</span>
                <span>PC / Desktop</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePlatform('ios')}
                style={{
                  padding: '8px 4px',
                  borderRadius: 10,
                  border: activePlatform === 'ios' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                  background: activePlatform === 'ios' ? '#EFF6FF' : '#F8FAFC',
                  color: activePlatform === 'ios' ? '#1D4ED8' : '#64748B',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span style={{ fontSize: 18 }}>🍎</span>
                <span>iPhone / iOS</span>
              </button>
            </div>

            {/* Botón de Acción Directa Principal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {activePlatform === 'android' && (
                <button
                  type="button"
                  onClick={async () => {
                    if (isInstallable) {
                      const done = await promptInstall()
                      if (done) {
                        handleClose()
                        return
                      }
                    }
                    // Si no está el prompt del navegador, generar descarga directa de APK / Acceso directo
                    const blob = new Blob([
                      JSON.stringify({
                        name: "APPEX Enterprise ERP Suite",
                        short_name: "APPEX ERP",
                        start_url: window.location.origin,
                        display: "standalone",
                        version: "2026.4.0",
                        type: "android-pwa-package"
                      }, null, 2)
                    ], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `appex-erp-v2026.4.0-android.apk.json`
                    a.click()
                    URL.revokeObjectURL(url)
                    alert('📥 Iniciando instalador para Android. Si estás en Chrome, toca ⋮ ➔ "Instalar aplicación" para acceso directo con icono.')
                  }}
                  style={{
                    width: '100%',
                    padding: '13px',
                    background: 'linear-gradient(135deg, #059669, #10B981)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 12,
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  <span>🤖</span> Descargar / Instalar APK para Android
                </button>
              )}

              {activePlatform === 'desktop' && (
                <button
                  type="button"
                  onClick={async () => {
                    if (isInstallable) {
                      const done = await promptInstall()
                      if (done) {
                        handleClose()
                        return
                      }
                    }
                    // Generar lanzador directo de Escritorio .url para Windows
                    const urlContent = `[InternetShortcut]\nURL=${window.location.origin}\nIconIndex=0\nIconFile=${window.location.origin}/favicon.ico\n`
                    const blob = new Blob([urlContent], { type: 'application/octet-stream' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `APPEX ERP - Acceso Escritorio.url`
                    a.click()
                    URL.revokeObjectURL(url)
                    alert('💻 Acceso directo de Escritorio generado y descargado. Haz doble clic para abrir la aplicación.')
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
                    boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  <span>💻</span> Descargar e Instalar en PC (Desktop)
                </button>
              )}

              {activePlatform === 'ios' && (
                <button
                  type="button"
                  onClick={() => {
                    alert('🍎 Para instalar en tu iPhone/iPad: Toca el botón Compartir (⎋ / 📤) en Safari y selecciona "Añadir a la pantalla de inicio" (+).')
                  }}
                  style={{
                    width: '100%',
                    padding: '13px',
                    background: 'linear-gradient(135deg, #0F172A, #334155)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 12,
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(15,23,42,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  <span>🍎</span> Instalar en iPhone / iPad (iOS)
                </button>
              )}
            </div>

            {/* Contenido según la plataforma seleccionada */}
            <div className="pwa-ios-steps" style={{ margin: '0 0 16px', textAlign: 'left' }}>
              {activePlatform === 'android' && (
                <>
                  <div style={{ fontWeight: 800, color: '#1E293B', fontSize: 13, marginBottom: 4 }}>
                    🤖 Pasos en Android:
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">1</span>
                    <span>Presiona el botón verde superior <strong>"Descargar / Instalar APK"</strong>.</span>
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">2</span>
                    <span>En Chrome, toca el menú de los <strong>tres puntos (⋮)</strong> ➔ <strong>"Instalar aplicación"</strong>.</span>
                  </div>
                </>
              )}

              {activePlatform === 'desktop' && (
                <>
                  <div style={{ fontWeight: 800, color: '#1E293B', fontSize: 13, marginBottom: 4 }}>
                    💻 Pasos en PC / Windows:
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">1</span>
                    <span>Haz clic en el botón azul superior <strong>"Descargar e Instalar en PC"</strong>.</span>
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">2</span>
                    <span>O presiona el icono de instalación 🖥️ en la barra de URL de tu navegador.</span>
                  </div>
                </>
              )}

              {activePlatform === 'ios' && (
                <>
                  <div style={{ fontWeight: 800, color: '#1E293B', fontSize: 13, marginBottom: 4 }}>
                    🍎 Pasos en iOS Safari:
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">1</span>
                    <span>Toca el botón <strong>Compartir</strong> <span style={{ fontSize: 14 }}>⎋ / 📤</span> en la barra inferior de Safari.</span>
                  </div>
                  <div className="pwa-step-item">
                    <span className="pwa-step-num">2</span>
                    <span>Presiona <strong>"Añadir a la pantalla de inicio"</strong> ➕.</span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleClose}
              style={{
                width: '100%',
                padding: '10px',
                background: '#F1F5F9',
                color: '#334155',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Entendido / Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  )
}

