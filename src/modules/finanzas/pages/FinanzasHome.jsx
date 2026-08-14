import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { finanzasService } from '../services/finanzasService'
import { KpiCards } from '../components/KpiCards'
import { CashFlowChart } from '../components/CashFlowChart'
import { ExpensesDonutChart } from '../components/ExpensesDonutChart'
import { ComprobantesTable } from '../components/ComprobantesTable'
import { NuevoComprobanteModal } from '../components/NuevoComprobanteModal'
import './FinanzasHome.css'

export function FinanzasHome() {
  const [data, setData] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState(null)
  const [searchParams] = useSearchParams()

  const activeTab = searchParams.get('tab') || 'Resumen'

  useEffect(() => {
    const initial = finanzasService.getData()
    setData(initial)
  }, [])

  const handleSaveComprobante = (nuevo) => {
    const updated = finanzasService.addComprobante(nuevo)
    setData(updated)
  }

  if (!data) return null

  return (
    <div className="fn-container">
      {/* Encabezado Superior */}
      <div className="fn-header-row">
        <div className="fn-title-group">
          <h2 className="fn-title">
            <span>🪙</span> Finanzas
            <span
              className="fn-title-info-icon"
              title="Módulo de gestión contable, presupuestaria y tesorería empresarial"
            >
              ⓘ
            </span>
          </h2>
          <p className="fn-subtitle">
            Gestiona la contabilidad, ingresos, gastos y flujo financiero.
          </p>
        </div>

        <div className="fn-header-actions">
          <button
            className="fn-btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <span>+</span> Nuevo Comprobante
          </button>
        </div>
      </div>

      {/* Tarjetas KPI de Saldo, Ingresos, Gastos y Resultado */}
      <KpiCards kpis={data.kpis} />

      {/* Sección de Gráficos Analíticos */}
      <div className="fn-charts-grid">
        <CashFlowChart data={data.cashFlowData} />
        <ExpensesDonutChart categorias={data.categoriasGastos} />
      </div>

      {/* Tabla de Comprobantes, Ingresos, Gastos y Transferencias */}
      <ComprobantesTable
        comprobantes={data.comprobantes}
        onVerDetalle={(item) => setComprobanteSeleccionado(item)}
        onNuevoComprobante={() => setIsModalOpen(true)}
      />

      {/* Modal para Crear Comprobante */}
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
            style={{ maxWidth: 440 }}
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
                <strong style={{ color: '#64748b' }}>Descripción:</strong>
                <span>{comprobanteSeleccionado.descripcion}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                <strong style={{ color: '#64748b' }}>Cuenta:</strong>
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
                <strong style={{ color: '#64748b' }}>Creado por:</strong>
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
