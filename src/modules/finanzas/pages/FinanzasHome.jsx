import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { finanzasService } from '../services/finanzasService'
import { erpSync } from '../../../core/sync/erpSyncEngine'
import { KpiCards } from '../components/KpiCards'
import { CashFlowChart } from '../components/CashFlowChart'
import { ExpensesDonutChart } from '../components/ExpensesDonutChart'
import { ComprobantesTable } from '../components/ComprobantesTable'
import { NuevoComprobanteModal } from '../components/NuevoComprobanteModal'
import { CuentasTab } from '../components/CuentasTab'
import { IngresosGastosTab } from '../components/IngresosGastosTab'
import { TransferenciasTab } from '../components/TransferenciasTab'
import { ConciliacionesTab } from '../components/ConciliacionesTab'
import { PresupuestoTab } from '../components/PresupuestoTab'
import { ReportesFinancierosTab } from '../components/ReportesFinancierosTab'
import { ImpuestosTab } from '../components/ImpuestosTab'
import { MonedasTab } from '../components/MonedasTab'
import './FinanzasHome.css'

export function FinanzasHome() {
  const [data, setData] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState(null)
  const [searchParams] = useSearchParams()

  const rawTab = searchParams.get('tab') || 'Resumen'
  const activeTabLower = rawTab.trim().toLowerCase()

  const loadData = async () => {
    const initial = await finanzasService.getData()
    setData(initial)
  }

  useEffect(() => {
    loadData()
    const unsubscribe = erpSync.subscribe(() => {
      loadData()
    })
    return () => unsubscribe()
  }, [searchParams])

  const handleSaveComprobante = async (nuevo) => {
    const updated = await finanzasService.addComprobante(nuevo)
    setData(updated)
  }

  const handleNuevaCuenta = async (nueva) => {
    const updated = await finanzasService.addCuenta(nueva)
    setData(updated)
  }

  const handleNuevoPresupuesto = async (nuevo) => {
    const updated = await finanzasService.addPresupuesto(nuevo)
    setData(updated)
  }

  const handleConciliar = async (cuentaNombre) => {
    const updated = await finanzasService.conciliarCuenta(cuentaNombre)
    setData(updated)
  }

  const handleEliminarComprobante = async (id) => {
    const updated = await finanzasService.deleteComprobante(id)
    setData(updated)
  }

  const handleCambiarEstadoComprobante = async (id, nuevoEstado) => {
    const updated = await finanzasService.cambiarEstadoComprobante(id, nuevoEstado)
    setData(updated)
  }

  if (!data) return null

  // Capitalizar para el título
  const activeTabTitle = rawTab.charAt(0).toUpperCase() + rawTab.slice(1)

  return (
    <div className="fn-container">
      {/* ── Banner Hero Panorámico de Finanzas (Misma Secuencia de Color Azul Real) ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
        borderRadius: 20,
        padding: '28px 32px',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.3)',
        marginBottom: 20,
      }}>
        {/* Imagen de fondo panorámica de finanzas y tesorería */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '55%',
          backgroundImage: 'url(/branding/banner_finanzas_panoramic.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          opacity: 0.35,
          maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, transparent 100%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 750 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.12)',
            color: '#93C5FD',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 10,
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <span>🪙</span> PANEL DE CONTROL · FINANZAS & CONTABILIDAD NCF
          </div>

          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Control Financiero y Tesorería
          </h1>
          <p style={{ margin: '6px 0 20px', fontSize: 13, color: '#CBD5E1', lineHeight: 1.5, maxWidth: 580 }}>
            Supervisa balances en bancos, flujo de efectivo, cuentas por cobrar/pagar, presupuestos operativos y comprobantes fiscales.
          </p>

          {/* Estadísticas en vivo calculadas del tenant */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>RD$ {(Number(data?.kpis?.ingresosTotal || 0)).toLocaleString('es-DO')}</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Ingresos Acumulados</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>RD$ {(Number(data?.kpis?.gastosTotal || 0)).toLocaleString('es-DO')}</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Gastos Operativos</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#34D399', lineHeight: 1 }}>RD$ {(Number(data?.kpis?.balanceGeneral || 0)).toLocaleString('es-DO')}</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Utilidad / Balance Neto</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FCD34D', lineHeight: 1 }}>{data?.cuentas?.length || 0} Cuentas</div>
              <div style={{ fontSize: 11, color: '#93C5FD', marginTop: 2 }}>Tesorería & Bancos</div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(37,99,235,0.4)'
              }}
            >
              + Nuevo Comprobante
            </button>
            <button
              onClick={() => window.print()}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              🖨️ Imprimir Estados
            </button>
          </div>
        </div>
      </div>

      {/* RENDERIZADO POR SUBMÓDULO SEGÚN EL TAB ACTIVO */}
      {(activeTabLower === 'resumen' || !rawTab) && (
        <>
          {/* Tarjetas KPI */}
          <KpiCards kpis={data.kpis} />

          {/* Gráficos Analíticos */}
          <div className="fn-charts-grid">
            <CashFlowChart data={data.cashFlowData} />
            <ExpensesDonutChart categorias={data.categoriasGastos} />
          </div>

          {/* Tabla de Comprobantes Recientes */}
          <ComprobantesTable
            comprobantes={data.comprobantes}
            onVerDetalle={(item) => setComprobanteSeleccionado(item)}
            onNuevoComprobante={() => setIsModalOpen(true)}
            onEliminar={handleEliminarComprobante}
            onCambiarEstado={handleCambiarEstadoComprobante}
          />
        </>
      )}

      {activeTabLower === 'cuentas' && (
        <CuentasTab
          cuentas={data.cuentas}
          movimientos={data.comprobantes}
          onNuevaCuenta={handleNuevaCuenta}
        />
      )}

      {activeTabLower === 'comprobantes' && (
        <ComprobantesTable
          comprobantes={data.comprobantes}
          onVerDetalle={(item) => setComprobanteSeleccionado(item)}
          onNuevoComprobante={() => setIsModalOpen(true)}
          onEliminar={handleEliminarComprobante}
          onCambiarEstado={handleCambiarEstadoComprobante}
        />
      )}

      {activeTabLower === 'ingresos' && (
        <IngresosGastosTab
          tipo="Ingreso"
          items={data.comprobantes}
          cuentas={data.cuentas}
          onNuevoItem={handleSaveComprobante}
        />
      )}

      {activeTabLower === 'gastos' && (
        <IngresosGastosTab
          tipo="Gasto"
          items={data.comprobantes}
          cuentas={data.cuentas}
          onNuevoItem={handleSaveComprobante}
        />
      )}

      {activeTabLower === 'transferencias' && (
        <TransferenciasTab
          comprobantes={data.comprobantes}
          cuentas={data.cuentas}
          onNuevaTransferencia={handleSaveComprobante}
        />
      )}

      {activeTabLower === 'conciliaciones' && (
        <ConciliacionesTab
          conciliaciones={data.conciliaciones}
          onConciliar={handleConciliar}
        />
      )}

      {activeTabLower === 'reportes' && (
        <ReportesFinancierosTab
          kpis={data.kpis}
          categorias={data.categoriasGastos}
          comprobantes={data.comprobantes}
          cuentas={data.cuentas}
        />
      )}

      {(activeTabLower === 'presupuesto' || activeTabLower === 'presupuestos') && (
        <PresupuestoTab
          presupuestos={data.presupuestos}
          onNuevoPresupuesto={handleNuevoPresupuesto}
        />
      )}

      {(activeTabLower === 'impuestos' || activeTabLower === 'impuestos dgii') && (
        <ImpuestosTab
          comprobantes={data.comprobantes}
        />
      )}

      {(activeTabLower === 'monedas' || activeTabLower === 'monedas & tasas') && (
        <MonedasTab />
      )}

      {/* Modal para Crear Comprobante Global */}
      <NuevoComprobanteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveComprobante}
        cuentas={data.cuentas}
      />

      {/* Modal de Detalle de Comprobante */}
      {comprobanteSeleccionado && (
        <div
          className="fn-modal-overlay"
          onClick={() => setComprobanteSeleccionado(null)}
        >
          <div
            className="fn-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 460 }}
          >
            <div className="fn-modal-header">
              <div className="fn-modal-title-group">
                <span>📄</span>
                <h3>Detalle de Comprobante</h3>
              </div>
              <button
                className="fn-modal-close-btn"
                onClick={() => setComprobanteSeleccionado(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                <strong style={{ color: '#64748b' }}>Número:</strong>
                <span style={{ fontWeight: 700, color: '#2563eb' }}>{comprobanteSeleccionado.numero}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                <strong style={{ color: '#64748b' }}>Tipo:</strong>
                <span className={`fn-badge-tipo badge-tipo-${comprobanteSeleccionado.tipo.toLowerCase()}`}>
                  {comprobanteSeleccionado.tipo}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                <strong style={{ color: '#64748b' }}>Fecha:</strong>
                <span>{comprobanteSeleccionado.fecha}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                <strong style={{ color: '#64748b' }}>Concepto:</strong>
                <span>{comprobanteSeleccionado.descripcion}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                <strong style={{ color: '#64748b' }}>Tercero:</strong>
                <span>{comprobanteSeleccionado.clienteProveedor || 'General'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                <strong style={{ color: '#64748b' }}>Cuenta Afectada:</strong>
                <span>{comprobanteSeleccionado.cuenta}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                <strong style={{ color: '#64748b' }}>Monto:</strong>
                <strong style={{ fontSize: 16, color: comprobanteSeleccionado.tipo === 'Ingreso' ? '#16a34a' : '#dc2626' }}>
                  RD$ {comprobanteSeleccionado.monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                <strong style={{ color: '#64748b' }}>Estado:</strong>
                <span className={`fn-badge-estado badge-estado-${comprobanteSeleccionado.estado.toLowerCase()}`}>
                  {comprobanteSeleccionado.estado}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ color: '#64748b' }}>Registrado por:</strong>
                <span>{comprobanteSeleccionado.creadoPor}</span>
              </div>

              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="fn-btn-secondary"
                  onClick={() => setComprobanteSeleccionado(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
