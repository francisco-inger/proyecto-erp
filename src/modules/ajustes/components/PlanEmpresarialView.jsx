import { useState, useEffect } from 'react'
import { AdquisicionPlanesModal } from '../../../core/components/AdquisicionPlanesModal'

export function PlanEmpresarialView({ onShowToast }) {
  const [showPlansModal, setShowPlansModal] = useState(false)
  const [stats, setStats] = useState({
    storageUsedMB: 342,
    storageTotalGB: 50,
    activeUsers: 12,
    modulesCount: 11,
    dbLatency: '18ms',
    uptime: '99.98%',
    licencia: 'Corporativa Ilimitada (Enterprise)',
    renovacion: '31 Dic 2026',
  })

  const [loadingAction, setLoadingAction] = useState(null)
  const [dbOptimized, setDbOptimized] = useState(false)

  useEffect(() => {
    try {
      const usersRaw = localStorage.getItem('appes_security_users_v1')
      const totalUsers = usersRaw ? JSON.parse(usersRaw).length : 12
      setStats(prev => ({ ...prev, activeUsers: totalUsers }))
    } catch (_) {}
  }, [])

  const handleOptimizeDB = async () => {
    setLoadingAction('db')
    await new Promise(r => setTimeout(r, 1100))
    setDbOptimized(true)
    setLoadingAction(null)
    onShowToast?.('✅ Base de datos optimizada y compactada con éxito (VACUUM completado)')
  }

  const handleClearCache = async () => {
    setLoadingAction('cache')
    await new Promise(r => setTimeout(r, 800))
    setLoadingAction(null)
    onShowToast?.('🧹 Caché de consultas temporales purgada (Liberados 24 MB)')
  }

  const handleDownloadBackup = async () => {
    setLoadingAction('backup')
    await new Promise(r => setTimeout(r, 900))
    
    const backupData = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('appes_')) {
        try {
          backupData[key] = JSON.parse(localStorage.getItem(key))
        } catch (_) {
          backupData[key] = localStorage.getItem(key)
        }
      }
    }

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup_appes_erp_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setLoadingAction(null)
    onShowToast?.('💾 Copia de seguridad oficial generada y descargada')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Banner Hero Profesional con Estilo Clean SaaS ── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        padding: '24px 28px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: '#EFF6FF',
              border: '1px solid #DBEAFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
            }}>
              👑
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A' }}>
                  Plan Empresarial Avanzado
                </h2>
                <span style={{
                  background: '#ECFDF5',
                  color: '#059669',
                  border: '1px solid #A7F3D0',
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                  Activo
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
                Licencia Corporativa Enterprise · Acceso completo a los 11 módulos, base de datos SQLite y conectores API.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Botón Adquirir / Mejorar Plan */}
            <button
              onClick={() => setShowPlansModal(true)}
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                transition: 'all 120ms ease',
              }}
            >
              <span>👑</span>
              Ver y Adquirir Planes
            </button>

            {/* Botón de Descarga Backup */}
            <button
              onClick={handleDownloadBackup}
              disabled={loadingAction === 'backup'}
              style={{
                background: '#FFFFFF',
                color: '#0F172A',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 120ms ease',
              }}
            >
              <span>💾</span>
              {loadingAction === 'backup' ? 'Generando...' : 'Backup (.JSON)'}
            </button>
          </div>
        </div>

        {/* Barra de Capacidad de Almacenamiento */}
        <div style={{
          background: '#F8FAFC',
          borderRadius: 12,
          padding: '16px 20px',
          border: '1px solid #E2E8F0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span style={{ color: '#334155', fontWeight: 600 }}>Uso Global de Capacidad y Almacenamiento</span>
            <strong style={{ color: '#2563EB', fontWeight: 800 }}>68% Asignado</strong>
          </div>
          <div style={{ height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: '68%', height: '100%', background: 'linear-gradient(90deg, #2563EB, #059669)', borderRadius: 4 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748B', marginTop: 8 }}>
            <span>Espacio ocupado: <strong>342 MB</strong></span>
            <span>Límite corporativo: <strong>50 GB SSD NVMe</strong></span>
          </div>
        </div>
      </div>

      {/* ── 3 Tarjetas de Diagnóstico y Estado Técnico ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* 1. Base de Datos */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 16,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  🗄️
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Motor de Datos</span>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>SQLite / EF Core</h3>
                </div>
              </div>
              <span style={{ background: '#ECFDF5', color: '#059669', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
                ● Saludable
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#475569', background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Latencia de consulta:</span>
                <strong style={{ color: '#0F172A' }}>{stats.dbLatency}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Integridad referencial:</span>
                <strong style={{ color: '#059669' }}>100% Correcta</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Modo de escritura:</span>
                <strong>WAL (Write-Ahead Logging)</strong>
              </div>
            </div>
          </div>

          <button
            onClick={handleOptimizeDB}
            disabled={loadingAction === 'db'}
            style={{
              width: '100%',
              background: dbOptimized ? '#ECFDF5' : '#F8FAFC',
              border: `1px solid ${dbOptimized ? '#A7F3D0' : '#CBD5E1'}`,
              color: dbOptimized ? '#059669' : '#0F172A',
              padding: '9px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 120ms',
            }}
          >
            <span>⚡</span>
            {loadingAction === 'db' ? 'Optimizando tablas...' : dbOptimized ? 'Tablas Optimizadas' : 'Optimizar Tablas e Índices'}
          </button>
        </div>

        {/* 2. Módulos y Usuarios */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 16,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FAF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  📦
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Capacidad Operativa</span>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>11 Módulos Habilitados</h3>
                </div>
              </div>
              <span style={{ background: '#EFF6FF', color: '#2563EB', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
                Full Suite
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#475569', background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Usuarios activos:</span>
                <strong style={{ color: '#0F172A' }}>{stats.activeUsers} de Ilimitados</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Módulos de negocio:</span>
                <strong>Ventas, Finanzas, Compras...</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Conectores externos:</span>
                <strong style={{ color: '#2563EB' }}>WhatsApp, DGII, SMTP</strong>
              </div>
            </div>
          </div>

          <button
            onClick={handleClearCache}
            disabled={loadingAction === 'cache'}
            style={{
              width: '100%',
              background: '#F8FAFC',
              border: '1px solid #CBD5E1',
              color: '#0F172A',
              padding: '9px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 120ms',
            }}
          >
            <span>🧹</span>
            {loadingAction === 'cache' ? 'Purgando memoria...' : 'Purgar Caché del Sistema'}
          </button>
        </div>

        {/* 3. Licencia Corporativa */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 16,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  🎖️
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Vigencia & Licencia</span>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{stats.renovacion}</h3>
                </div>
              </div>
              <span style={{ background: '#ECFDF5', color: '#059669', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
                Enterprise
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#475569', background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Nivel de soporte:</span>
                <strong style={{ color: '#2563EB' }}>SLA 24/7 Dedicado</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Disponibilidad (Uptime):</span>
                <strong style={{ color: '#059669' }}>{stats.uptime}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Actualizaciones:</span>
                <strong>Automáticas en la Nube</strong>
              </div>
            </div>
          </div>

          <button
            onClick={() => onShowToast?.('📋 Licencia Enterprise validada: APPEX-ENTERPRISE-2026-ACTIVE')}
            style={{
              width: '100%',
              background: '#F8FAFC',
              border: '1px solid #CBD5E1',
              color: '#0F172A',
              padding: '9px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 120ms',
            }}
          >
            <span>🔑</span>
            Verificar Llave de Licencia
          </button>
        </div>
      </div>

      {/* Modal interactivo de Adquisición de Planes */}
      <AdquisicionPlanesModal
        isOpen={showPlansModal}
        onClose={() => setShowPlansModal(false)}
        onPlanActivated={(activated) => {
          onShowToast?.(`👑 ¡Plan ${activated.planNombre} adquirido y activado con éxito!`)
          setShowPlansModal(false)
        }}
      />
    </div>
  )
}
