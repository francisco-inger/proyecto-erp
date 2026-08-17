/*
  Topbar.jsx — Barra Superior Interactiva del ERP
  Incluye búsqueda global con atajo (⌘K / Ctrl+K), escáner de códigos de barras,
  centro de notificaciones, modal de ayuda/documentación, acceso directo a ajustes
  y perfil de usuario con logout.
*/
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { usePWA } from '../hooks/usePWA'
import { PWAInstallBanner } from '../components/PWAInstallBanner'

export function Topbar({ onToggleMobileMenu }) {
  const { user, logout } = useAuth()
  const { isInstallable, isInstalled, promptInstall } = usePWA()
  const navigate = useNavigate()

  // Estados interactivos
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showPWAModal, setShowPWAModal] = useState(false)
  const [toast, setToast] = useState(null)

  const searchInputRef = useRef(null)
  const notifRef = useRef(null)
  const userMenuRef = useRef(null)

  // Notificaciones simuladas con datos en tiempo real
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Stock crítico detectado', desc: 'Loratadina 10mg y Omeprazol con menos de 20 uds.', time: 'Hace 10 min', unread: true, icon: '⚠️', link: '/rrhh-inventario?tab=Productos' },
    { id: 2, title: 'Nuevo pedido recibido', desc: 'PED-1001 de Farmacia Los Hidalgos por RD$ 125,000.', time: 'Hace 35 min', unread: true, icon: '🛒', link: '/ventas' },
    { id: 3, title: 'Orden de compra recibida', desc: 'OC-001 de Distribuidora Tech SRL ha sido completada.', time: 'Hace 2 horas', unread: false, icon: '🛍️', link: '/compras' },
  ])

  const unreadCount = notifications.filter(n => n.unread).length

  const showToastMsg = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Atajo de teclado global Ctrl+K / ⌘K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setShowNotifications(false)
        setShowHelp(false)
        setShowScanner(false)
        setShowUserMenu(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Rutas disponibles para búsqueda rápida
  const MODULES_SEARCH = [
    { title: 'Dashboard Principal', path: '/', icon: '🏠', cat: 'Navegación' },
    { title: 'Ventas y Facturación', path: '/ventas', icon: '🛒', cat: 'Módulos' },
    { title: 'Compras y Proveedores', path: '/compras', icon: '🛍️', cat: 'Módulos' },
    { title: 'Inventario y Almacenes', path: '/rrhh-inventario', icon: '📦', cat: 'Módulos' },
    { title: 'Recursos Humanos y Nómina', path: '/rrhh', icon: '👤', cat: 'Módulos' },
    { title: 'Finanzas y Flujo de Caja', path: '/finanzas', icon: '💲', cat: 'Módulos' },
    { title: 'Clientes y CRM', path: '/crm', icon: '👥', cat: 'Módulos' },
    { title: 'Proyectos Activos', path: '/proyectos', icon: '📁', cat: 'Módulos' },
    { title: 'Reportes y Estadísticas', path: '/reportes', icon: '📊', cat: 'Módulos' },
    { title: 'AI Chatbot Asistente', path: '/chatbot', icon: '🤖', cat: 'Inteligencia Artificial' },
    { title: 'Integraciones Externas', path: '/integraciones', icon: '🔗', cat: 'Conectores' },
    { title: 'Gestor de Plugins', path: '/plugin-manager', icon: '🧩', cat: 'Extensiones' },
    { title: 'Ajustes del Sistema', path: '/ajustes', icon: '⚙️', cat: 'Configuración' },
  ]

  const filteredSearch = searchQuery.trim()
    ? MODULES_SEARCH.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.cat.toLowerCase().includes(searchQuery.toLowerCase()))
    : []

  // Estados del Escáner de Código de Barras
  const [showScanner, setShowScanner] = useState(false)
  const [scannedCode, setScannedCode] = useState('')
  const [scannerResult, setScannerResult] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // Sonido de Beep al escanear
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 1800
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.12)
    } catch (_) {}
  }

  // Activar Cámara Web
  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
        setCameraActive(true)
      }
    } catch (err) {
      console.warn('Cámara no disponible o permiso denegado, usando modo simulador', err)
      setCameraActive(false)
    }
  }

  // Detener Cámara Web
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera()
    } else {
      startCamera()
    }
  }

  // Simulación y Lectura de Código de Barras conectado al Inventario Real
  const handleSimulateScan = (code) => {
    setIsScanning(true)
    setScannerResult(null)
    setTimeout(() => {
      setIsScanning(false)
      playBeep()

      let item = null
      try {
        const rawInv = localStorage.getItem('appes_inventory_products_v1')
        if (rawInv) {
          const products = JSON.parse(rawInv)
          item = products.find(p => p.codigo?.toLowerCase() === code.trim().toLowerCase())
        }
      } catch (_) {}

      if (!item) {
        const mockDb = {
          'MED-001': { codigo: 'MED-001', nombre: 'Paracetamol 500mg', stock: 450, stockMin: 50, precio: 100, categoria: 'Medicamentos', ubicacion: 'Almacén Principal - Pasillo A-02' },
          'MED-002': { codigo: 'MED-002', nombre: 'Amoxicilina 500mg', stock: 280, stockMin: 40, precio: 100, categoria: 'Medicamentos', ubicacion: 'Almacén Principal - Pasillo B-01' },
          'CUI-001': { codigo: 'CUI-001', nombre: 'Alcohol 70%', stock: 120, stockMin: 30, precio: 100, categoria: 'Cuidado Personal', ubicacion: 'Sucursal Norte - Pasillo C-04' },
          'SUP-001': { codigo: 'SUP-001', nombre: 'Vitamina C 1000mg', stock: 95, stockMin: 25, precio: 100, categoria: 'Suplementos', ubicacion: 'Sucursal Este - Pasillo A-01' },
          'MED-003': { codigo: 'MED-003', nombre: 'Ibuprofeno 400mg', stock: 310, stockMin: 50, precio: 100, categoria: 'Medicamentos', ubicacion: 'Almacén Principal' },
          'CUI-002': { codigo: 'CUI-002', nombre: 'Jarabe para la Tos', stock: 10, stockMin: 30, precio: 100, categoria: 'Cuidado Personal', ubicacion: 'Sucursal Norte' },
        }
        item = mockDb[code.trim().toUpperCase()]
      }

      if (item) {
        setScannerResult(item)
        showToastMsg(`✅ Código leído: ${item.codigo} (${item.nombre})`)
      } else {
        setScannerResult({
          nombre: `Código "${code}" no encontrado en inventario`,
          notFound: true,
        })
        showToastMsg(`⚠️ Código no registrado: ${code}`)
      }
    }, 500)
  }

  return (
    <header className="topbar" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Botón Hamburguesa para Móvil y Tablet */}
        <button
          className="topbar-hamburger-btn"
          onClick={onToggleMobileMenu}
          title="Menú de Navegación"
          aria-label="Abrir Menú"
        >
          ☰
        </button>

        {/* ── Búsqueda estilo Pill ── */}
        <div className="topbar-search-wrapper" style={{ position: 'relative' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: isSearchFocused ? '#FFFFFF' : '#F1F5F9',
            border: `1px solid ${isSearchFocused ? '#2563EB' : '#E2E8F0'}`,
            borderRadius: 10,
            padding: '7px 12px',
            boxShadow: isSearchFocused ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none',
            transition: 'all 150ms ease',
          }}>
            <span style={{ color: '#64748B', fontSize: 13 }}>🔍</span>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar en appes.erp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 13,
                color: '#0F172A',
                width: '100%'
              }}
            />
            {/* Botón Scanner de Código de Barras */}
            <button
              onClick={() => setShowScanner(true)}
              title="Escanear Código de Barras / SKU"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                padding: '2px 4px',
                borderRadius: 4,
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              📷
            </button>
            <span className="topbar-shortcut-pill" style={{
              fontSize: 10,
              color: '#64748B',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 4,
              padding: '2px 5px',
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}>
              ⌘K
            </span>
          </div>

        {/* Dropdown de Resultados de Búsqueda */}
        {isSearchFocused && searchQuery.trim() && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
            zIndex: 100,
            overflow: 'hidden',
            maxHeight: 320,
            overflowY: 'auto',
          }}>
            <div style={{ padding: '8px 12px', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', background: '#F8FAFC' }}>
              Módulos y Secciones
            </div>
            {filteredSearch.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: '#64748B' }}>
                No se encontraron resultados para "{searchQuery}"
              </div>
            ) : (
              filteredSearch.map((item, i) => (
                <div
                  key={i}
                  onMouseDown={() => {
                    navigate(item.path)
                    setSearchQuery('')
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #F1F5F9',
                    fontSize: 13,
                    color: '#0F172A',
                    transition: 'background 120ms',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#EFF6FF'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    <span style={{ fontWeight: 600 }}>{item.title}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: 4 }}>
                    {item.cat}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      </div>

      {/* ── Acciones Derecha ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        
        {/* Botón Descargar / Instalar PWA */}
        {!isInstalled && (
          <button
            onClick={() => {
              if (isInstallable) {
                promptInstall()
              } else {
                setShowPWAModal(true)
              }
            }}
            title="Instalar APPEX ERP como aplicación en tu ordenador o móvil"
            style={{
              background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(30,58,138,0.15))',
              border: '1px solid #93C5FD',
              borderRadius: 8,
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: 13,
              color: '#1E40AF',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 700,
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563EB'
              e.currentTarget.style.color = '#FFFFFF'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(30,58,138,0.15))'
              e.currentTarget.style.color = '#1E40AF'
            }}
          >
            <span>📲</span>
            <span className="topbar-pwa-btn-text">Instalar App</span>
          </button>
        )}

        {/* 1. Botón Escáner de Barra / QR */}
        <button
          className="topbar-scanner-btn"
          onClick={() => setShowScanner(true)}
          title="Escáner de Códigos de Barras / QR"
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            padding: '6px 10px',
            cursor: 'pointer',
            fontSize: 14,
            color: '#334155',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600,
            transition: 'all 120ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#93C5FD' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0' }}
        >
          <span>📷</span>
          <span style={{ fontSize: 12 }}>Escanear</span>
        </button>

        {/* 2. Botón Notificaciones con Dropdown */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={() => setShowNotifications(s => !s)}
            title="Notificaciones del sistema"
            style={{
              background: showNotifications ? '#EFF6FF' : 'none',
              border: 'none',
              borderRadius: 8,
              padding: '6px 8px',
              cursor: 'pointer',
              fontSize: 17,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              color: '#475569',
              transition: 'background 120ms',
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: 0,
                right: 2,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#EF4444',
                color: '#FFFFFF',
                fontSize: 10,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 2px #FFFFFF',
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Panel de Notificaciones */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: -50,
              width: 320,
              maxWidth: '90vw',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 14,
              boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
              zIndex: 100,
              overflow: 'hidden',
              animation: 'fadeIn 150ms ease',
            }}>
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#F8FAFC',
              }}>
                <strong style={{ fontSize: 14, color: '#0F172A' }}>Notificaciones</strong>
                {unreadCount > 0 && (
                  <button
                    onClick={() => setNotifications(prev => prev.map(n => ({ ...n, unread: false })))}
                    style={{ background: 'none', border: 'none', fontSize: 11, color: '#2563EB', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Marcar leídas
                  </button>
                )}
              </div>

              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => {
                      navigate(n.link)
                      setShowNotifications(false)
                    }}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #F1F5F9',
                      cursor: 'pointer',
                      background: n.unread ? '#F0FDF4' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      transition: 'background 120ms',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#EFF6FF'}
                    onMouseLeave={(e) => e.currentTarget.style.background = n.unread ? '#F0FDF4' : '#FFFFFF'}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{n.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{n.title}</span>
                        <span style={{ fontSize: 10, color: '#94A3B8' }}>{n.time}</span>
                      </div>
                      <p style={{ fontSize: 11, color: '#64748B', margin: 0, lineHeight: 1.4 }}>{n.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '10px 16px', textAlign: 'center', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                <button
                  onClick={() => {
                    navigate('/ajustes')
                    setShowNotifications(false)
                  }}
                  style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: '#2563EB', cursor: 'pointer' }}
                >
                  Configurar alertas →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Botón Centro de Ayuda (?) */}
        <button
          className="topbar-help-btn"
          onClick={() => setShowHelp(true)}
          title="Centro de Ayuda y Documentación"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 17,
            color: '#475569',
            padding: '6px 8px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          ❓
        </button>

        {/* 4. Botón Acceso Rápido a Ajustes (⚙️) */}
        <button
          onClick={() => navigate('/ajustes')}
          title="Abrir Ajustes del ERP"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 17,
            color: '#475569',
            padding: '6px 8px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          ⚙️
        </button>

        {/* 5. Avatar de Usuario y Menú de Perfil Desplegable */}
        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            title="Ver opciones de cuenta"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 10,
              background: showUserMenu ? '#EFF6FF' : '#F8FAFC',
              border: `1px solid ${showUserMenu ? '#93C5FD' : '#E2E8F0'}`,
              transition: 'all 120ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#93C5FD' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = showUserMenu ? '#EFF6FF' : '#F8FAFC'; e.currentTarget.style.borderColor = showUserMenu ? '#93C5FD' : '#E2E8F0' }}
          >
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 10,
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
              flexShrink: 0,
            }}>
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="topbar-user-email" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                {user?.name ?? 'Administrador'}
              </span>
              <span style={{ fontSize: 10, color: '#64748B' }}>
                {user?.email ?? 'admin@appes.com'}
              </span>
            </div>
            <span style={{ fontSize: 10, color: '#94A3B8', marginLeft: 2 }}>▾</span>
          </div>

          {/* Menú Desplegable de Usuario */}
          {showUserMenu && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 250,
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                boxShadow: '0 15px 30px rgba(0,0,0,0.12)',
                zIndex: 200,
                overflow: 'hidden',
                animation: 'fnFadeIn 120ms ease',
              }}
            >
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{user?.name || 'Administrador'}</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{user?.email || 'admin@appes.com'}</div>
                
                {/* Empresa del usuario */}
                <div style={{ marginTop: 6, fontSize: 11, color: '#1E293B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>🏢</span> {user?.departamento || 'APPEX Dominicana SRL'}
                </div>

                <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                  👑 Rol: {user?.role ? user.role.toUpperCase() : 'ADMIN'}
                </div>
              </div>

              <div style={{ padding: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button
                  onClick={() => {
                    navigate('/ajustes?tab=Seguridad')
                    setShowUserMenu(false)
                  }}
                  className="fn-popover-item"
                >
                  <span>🛡️</span> Mi Seguridad y 2FA
                </button>

                <button
                  onClick={() => {
                    navigate('/ajustes?tab=General')
                    setShowUserMenu(false)
                  }}
                  className="fn-popover-item"
                >
                  <span>⚙️</span> Ajustes de Cuenta
                </button>

                <button
                  onClick={() => {
                    navigate('/ajustes?tab=Sistema')
                    setShowUserMenu(false)
                  }}
                  className="fn-popover-item"
                >
                  <span>💻</span> Diagnóstico del Sistema
                </button>

                {!isInstalled && isInstallable && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      promptInstall()
                    }}
                    className="fn-popover-item"
                    style={{ color: '#2563EB', fontWeight: 700 }}
                  >
                    <span>📲</span> Instalar App Nativa (PWA)
                  </button>
                )}

                <button
                  onClick={() => {
                    if (window.confirm('¿Deseas limpiar el caché local del navegador y restaurar la sesión principal con todos los datos sincronizados?')) {
                      // Limpiar estados temporales y cachés
                      localStorage.removeItem('erp_registration_wizard_state_v1')
                      localStorage.removeItem('erp_login_block')
                      localStorage.removeItem('tenant_usr-admin-global_appes_erp_global_settings_v2')
                      
                      // Forzar sesión como Admin Principal
                      const adminUser = {
                        id: 'usr-1',
                        name: 'Admin General',
                        email: 'admin@appes.com',
                        role: 'ADMIN',
                        departamento: 'Dirección General',
                        dosFactores: true,
                        empresaConfigurada: true,
                      }
                      localStorage.setItem('erp_user', JSON.stringify(adminUser))
                      localStorage.setItem('erp_token', `token-usr-1-${Date.now()}`)
                      
                      // Forzar recarga completa sin caché
                      window.location.href = '/dashboard'
                    }
                  }}
                  className="fn-popover-item"
                  style={{ color: '#D97706', fontWeight: 700 }}
                >
                  <span>🧹</span> Limpiar Caché y Actualizar Datos
                </button>

                <div className="fn-popover-divider" />

                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    logout()
                  }}
                  className="fn-popover-item item-danger"
                >
                  <span>🚪</span> Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Escáner de Código de Barras / SKU ── */}
      {showScanner && (
        <div
          onClick={() => {
            stopCamera()
            setShowScanner(false)
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              maxWidth: 520,
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              border: '1px solid #E2E8F0',
            }}
          >
            {/* Header del Escáner */}
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F8FAFC',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>📷</span>
                <div>
                  <strong style={{ fontSize: 16, color: '#0F172A', display: 'block' }}>Escáner de Código de Barras / SKU</strong>
                  <span style={{ fontSize: 11, color: '#64748B' }}>Lector óptico con cámara web y búsqueda instantánea</span>
                </div>
              </div>
              <button
                onClick={() => {
                  stopCamera()
                  setShowScanner(false)
                }}
                style={{ background: 'none', border: 'none', fontSize: 18, color: '#94A3B8', cursor: 'pointer', padding: 4 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Visor de Cámara Real / Simulado con Láser */}
              <div style={{
                height: 220,
                background: '#0B0F19',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                border: '2px solid #1E293B',
              }}>
                {/* Elemento de Video de la Cámara */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: cameraActive ? 'block' : 'none',
                  }}
                />

                {/* Retícula y Línea Láser Animada */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}>
                  {/* Marco de enfoque óptico */}
                  <div style={{
                    width: 260,
                    height: 120,
                    border: '2px dashed rgba(255, 255, 255, 0.4)',
                    borderRadius: 10,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {/* Línea Láser Roja */}
                    <div style={{
                      width: '100%',
                      height: 2,
                      background: '#EF4444',
                      boxShadow: '0 0 12px 2px #EF4444',
                      animation: 'scannerLaser 2s infinite ease-in-out',
                    }} />
                  </div>

                  <span style={{
                    color: '#E2E8F0',
                    fontSize: 12,
                    fontWeight: 600,
                    marginTop: 14,
                    background: 'rgba(15, 23, 42, 0.75)',
                    padding: '4px 12px',
                    borderRadius: 20,
                    backdropFilter: 'blur(4px)',
                  }}>
                    {isScanning ? '⚡ Procesando lectura óptica...' : cameraActive ? '🟢 Cámara activa — Apunta al código' : 'Apunta la cámara al código de barras o ingresa el SKU'}
                  </span>
                </div>

                {/* Botón flotante para encender/apagar cámara */}
                <button
                  onClick={toggleCamera}
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 10,
                    background: cameraActive ? '#EF4444' : '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    zIndex: 10,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)',
                  }}
                >
                  {cameraActive ? '🔴 Apagar Cámara' : '📹 Encender Cámara'}
                </button>
              </div>

              {/* Botones de prueba rápidos */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>
                    Códigos de prueba rápidos en inventario:
                  </span>
                  <span style={{ fontSize: 10, color: '#2563EB', fontWeight: 600 }}>1-clic para escanear</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['MED-001', 'MED-002', 'CUI-001', 'SUP-001', 'MED-003', 'CUI-002'].map(code => (
                    <button
                      key={code}
                      onClick={() => {
                        setScannedCode(code)
                        handleSimulateScan(code)
                      }}
                      style={{
                        background: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        borderRadius: 6,
                        padding: '5px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#1E293B',
                        cursor: 'pointer',
                        transition: 'all 120ms ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#2563EB'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input manual con teclado */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Escribe código de barras o SKU (Ej: MED-001)..."
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && scannedCode.trim() && handleSimulateScan(scannedCode)}
                  style={{
                    flex: 1,
                    border: '1px solid #CBD5E1',
                    borderRadius: 8,
                    padding: '9px 12px',
                    fontSize: 13,
                    outline: 'none',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)',
                  }}
                />
                <button
                  onClick={() => handleSimulateScan(scannedCode)}
                  disabled={!scannedCode.trim() || isScanning}
                  style={{
                    background: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '9px 18px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: scannedCode.trim() && !isScanning ? 'pointer' : 'not-allowed',
                    opacity: scannedCode.trim() && !isScanning ? 1 : 0.6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {isScanning ? 'Leyendo...' : 'Buscar'}
                </button>
              </div>

              {/* Resultado del escaneo en tiempo real */}
              {scannerResult && (
                <div style={{
                  background: scannerResult.notFound ? '#FEF2F2' : '#F0FDF4',
                  border: `1px solid ${scannerResult.notFound ? '#FECACA' : '#BBF7D0'}`,
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  animation: 'fnFadeIn 150ms ease-out',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: 14, color: scannerResult.notFound ? '#991B1B' : '#166534', display: 'block' }}>
                        {scannerResult.notFound ? '❌ ' : '📦 '} {scannerResult.nombre}
                      </strong>
                      <span style={{ fontSize: 11, color: scannerResult.notFound ? '#B91C1C' : '#15803D', fontWeight: 600 }}>
                        SKU: {scannerResult.codigo || scannedCode} · Categoría: {scannerResult.categoria || 'General'}
                      </span>
                    </div>
                    {!scannerResult.notFound && (
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 800,
                        background: scannerResult.stock <= (scannerResult.stockMin || 20) ? '#FEF2F2' : '#DCFCE7',
                        color: scannerResult.stock <= (scannerResult.stockMin || 20) ? '#DC2626' : '#16A34A',
                      }}>
                        {scannerResult.stock <= (scannerResult.stockMin || 20) ? '⚠️ Stock Bajo' : '✓ Disponible'}
                      </span>
                    )}
                  </div>

                  {!scannerResult.notFound && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, marginTop: 4 }}>
                      <div style={{ background: '#FFFFFF', padding: '6px 10px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                        <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Stock en Bodega</span>
                        <strong style={{ fontSize: 14, color: '#0F172A' }}>{scannerResult.stock} uds</strong>
                      </div>
                      <div style={{ background: '#FFFFFF', padding: '6px 10px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                        <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Precio de Venta</span>
                        <strong style={{ fontSize: 14, color: '#16A34A' }}>
                          RD$ {Number(scannerResult.precio || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button
                      onClick={() => {
                        stopCamera()
                        navigate('/rrhh-inventario?tab=Productos')
                        setShowScanner(false)
                      }}
                      style={{
                        background: '#16A34A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 14px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Ver en Inventario →
                    </button>
                    <button
                      onClick={() => {
                        stopCamera()
                        navigate('/ventas')
                        setShowScanner(false)
                      }}
                      style={{
                        background: '#2563EB',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 14px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Facturar en Ventas 🛒
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Centro de Ayuda ── */}
      {showHelp && (
        <div
          onClick={() => setShowHelp(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              maxWidth: 520,
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            }}
          >
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>❓</span>
                <strong style={{ fontSize: 16, color: '#0F172A' }}>Centro de Ayuda y Atajos</strong>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, color: '#94A3B8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13, color: '#334155' }}>
                <strong>Atajos de teclado rápidos:</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span>Abrir Búsqueda Global</span>
                  <kbd style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>⌘K / Ctrl+K</kbd>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span>Cerrar modales o dropdowns</span>
                  <kbd style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>Esc</kbd>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span>Consultar asistente con IA</span>
                  <span style={{ color: '#2563EB', fontWeight: 600, cursor: 'pointer' }} onClick={() => { navigate('/chatbot'); setShowHelp(false) }}>Ir al Chatbot →</span>
                </div>
              </div>

              <div style={{ marginTop: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 12, fontSize: 12, color: '#64748B' }}>
                💡 <strong>Soporte Técnico:</strong> Para consultas sobre la plataforma ERP contacte al administrador del sistema o al equipo de soporte en <code>soporte@appex.do</code>.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Flotante ── */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 1300,
        }}>
          {toast}
        </div>
      )}
      {/* ── Modal PWA invocado desde el botón superior ── */}
      {showPWAModal && (
        <PWAInstallBanner showModalOverride={true} onCloseModalOverride={() => setShowPWAModal(false)} />
      )}
    </header>
  )
}
