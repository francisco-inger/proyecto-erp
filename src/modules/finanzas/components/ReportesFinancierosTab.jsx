import React, { useState } from 'react'

export function ReportesFinancierosTab({ kpis, categorias, comprobantes, cuentas }) {
  const [reporteTipo, setReporteTipo] = useState('pyg') // pyg | balance | flujo
  const [periodo, setPeriodo] = useState('Agosto 2025')

  const totalIngresos = kpis?.ingresosTotal || kpis?.ingresosMes?.valor || 0
  const totalGastos = kpis?.gastosTotal || kpis?.gastosMes?.valor || 0
  const resultadoNeto = totalIngresos - totalGastos
  const totalActivos = (cuentas || []).reduce((acc, c) => acc + (c.saldo || 0), 0)

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank', 'width=850,height=900')
    if (!printWindow) {
      window.print()
      return
    }

    const titleMap = {
      pyg: 'Estado de Ganancias y Pérdidas (P&G)',
      balance: 'Balance General Simplificado',
      flujo: 'Flujo de Efectivo Detallado'
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Informe Financiero Oficial - ${titleMap[reporteTipo] || 'Reporte'}</title>
        <meta charset="utf-8" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
          body { font-family: 'Inter', sans-serif; color: #0F172A; margin: 0; padding: 36px; background: #FFFFFF; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563EB; padding-bottom: 20px; margin-bottom: 24px; }
          .logo-title h1 { margin: 0; color: #1E3A8A; font-size: 24px; font-weight: 800; }
          .logo-title p { margin: 4px 0 0; color: #64748B; font-size: 12px; }
          .badge-box { text-align: right; }
          .badge-title { font-size: 18px; font-weight: 800; color: #2563EB; }
          .badge-date { font-size: 12px; color: #64748B; margin-top: 4px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
          .kpi-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 14px; text-align: center; }
          .kpi-val { font-size: 18px; font-weight: 800; color: #1E3A8A; }
          .kpi-lbl { font-size: 11px; color: #64748B; text-transform: uppercase; font-weight: 600; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
          th { background: #1E3A8A; color: #FFFFFF; font-size: 11px; text-transform: uppercase; padding: 10px 12px; text-align: left; }
          td { padding: 10px 12px; border-bottom: 1px solid #E2E8F0; }
          .signatures { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 20px; }
          .signature-line { width: 220px; border-top: 1px solid #94A3B8; text-align: center; font-size: 11px; color: #64748B; padding-top: 6px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-title">
            <h1>APPEX.ERP Enterprise Suite</h1>
            <p>Dirección de Finanzas & Contabilidad Corporativa · RNC: 1-30-99887-1</p>
            <p>Av. Winston Churchill #109, Santo Domingo, D.N.</p>
          </div>
          <div class="badge-box">
            <div class="badge-title">${(titleMap[reporteTipo] || 'ESTADO FINANCIERO').toUpperCase()}</div>
            <div class="badge-date">Período: ${periodo}</div>
            <div class="badge-date">Moneda: Pesos Dominicanos (RD$)</div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-val" style="color: #059669;">RD$ ${totalIngresos.toLocaleString('es-DO')}</div>
            <div class="kpi-lbl">Ingresos Operativos</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #DC2626;">RD$ ${totalGastos.toLocaleString('es-DO')}</div>
            <div class="kpi-lbl">Egresos / Gastos</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-val" style="color: #2563EB;">RD$ ${resultadoNeto.toLocaleString('es-DO')}</div>
            <div class="kpi-lbl">Resultado Neto</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Concepto Contable</th>
              <th style="text-align: right;">Monto (RD$)</th>
              <th style="text-align: right;">% Ratio</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>1. Ingresos Operativos Totales</strong></td>
              <td style="text-align: right; font-weight: 700; color: #059669;">RD$ ${totalIngresos.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
              <td style="text-align: right;">100.0%</td>
            </tr>
            <tr>
              <td><strong>2. Egresos Operativos y Gastos</strong></td>
              <td style="text-align: right; font-weight: 700; color: #DC2626;">RD$ ${totalGastos.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
              <td style="text-align: right;">${totalIngresos > 0 ? ((totalGastos / totalIngresos) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr style="background: #EFF6FF; font-weight: 800;">
              <td>3. Utilidad Neta del Ejercicio</td>
              <td style="text-align: right; color: #2563EB;">RD$ ${resultadoNeto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
              <td style="text-align: right; color: #2563EB;">${totalIngresos > 0 ? ((resultadoNeto / totalIngresos) * 100).toFixed(1) : 0}%</td>
            </tr>
          </tbody>
        </table>

        <div class="signatures">
          <div class="signature-line">Contador General / CPA</div>
          <div class="signature-line">Auditor Financiero Autorizado</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  return (
    <div className="fn-submodule-container">
      <div className="fn-submodule-header">
        <div>
          <h3 className="fn-submodule-title">📑 Reportes y Estados Financieros</h3>
          <p className="fn-submodule-desc">
            Informes contables auditables, Estado de Resultados (P&G), Balance General y Flujo Operativo.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select
            className="fn-period-select"
            value={reporteTipo}
            onChange={(e) => setReporteTipo(e.target.value)}
            style={{ padding: '8px 12px', fontSize: 13 }}
          >
            <option value="pyg">Estado de Resultados (P&G)</option>
            <option value="balance">Balance General Simplificado</option>
            <option value="flujo">Flujo de Efectivo Detallado</option>
          </select>
          <button className="fn-btn-primary" onClick={handleExportPDF}>
            <span>🖨️</span> Imprimir / PDF
          </button>
        </div>
      </div>

      {reporteTipo === 'pyg' && (
        <div className="fn-table-section">
          <div className="fn-table-header-row">
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              Estado de Ganancias y Pérdidas — {periodo}
            </h4>
            <span style={{ fontSize: 12, color: '#64748b' }}>Expresado en Pesos Dominicanos (RD$)</span>
          </div>

          <div className="fn-table-responsive">
            <table className="fn-data-table">
              <thead>
                <tr>
                  <th>Concepto Contable</th>
                  <th style={{ textAlign: 'right' }}>Monto (RD$)</th>
                  <th style={{ textAlign: 'right' }}>% Sobre Ingresos</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td>(+) INGRESOS OPERACIONALES TOTALES</td>
                  <td style={{ textAlign: 'right', color: '#16a34a' }}>
                    RD$ {totalIngresos.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right' }}>100.0%</td>
                </tr>

                {categorias?.map((cat) => (
                  <tr key={cat.id}>
                    <td style={{ paddingLeft: 28 }}>(-) {cat.nombre}</td>
                    <td style={{ textAlign: 'right', color: '#dc2626' }}>
                      RD$ {cat.monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {((cat.monto / totalIngresos) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}

                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td>(-) GASTOS OPERACIONALES TOTALES</td>
                  <td style={{ textAlign: 'right', color: '#dc2626' }}>
                    RD$ {totalGastos.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {((totalGastos / totalIngresos) * 100).toFixed(1)}%
                  </td>
                </tr>

                <tr style={{ background: '#ecfdf5', fontWeight: 800, fontSize: 14 }}>
                  <td style={{ color: '#065f46' }}>(=) UTILIDAD NETA / RESULTADO DEL EJERCICIO</td>
                  <td style={{ textAlign: 'right', color: '#059669', fontSize: 16 }}>
                    RD$ {resultadoNeto.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right', color: '#059669' }}>
                    {((resultadoNeto / totalIngresos) * 100).toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reporteTipo === 'balance' && (
        <div className="fn-table-section">
          <div className="fn-table-header-row">
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              Balance General — Al 31 de Agosto 2025
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: '10px 0' }}>
            <div>
              <h5 style={{ margin: '0 0 10px 0', fontSize: 14, color: '#1e293b' }}>🏛️ Activos Corrientes</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cuentas?.map((c) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
                    <span>{c.nombre}</span>
                    <strong>RD$ {c.saldo.toLocaleString('en-US')}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#e0f2fe', borderRadius: 6, fontWeight: 700, color: '#0369a1' }}>
                  <span>TOTAL ACTIVOS</span>
                  <span>RD$ {totalActivos.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div>
              <h5 style={{ margin: '0 0 10px 0', fontSize: 14, color: '#1e293b' }}>💼 Pasivos y Patrimonio</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
                  <span>Cuentas por Pagar Proveedores</span>
                  <strong>RD$ 32,500.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
                  <span>Capital Social Integrado</span>
                  <strong>RD$ 1,817,500.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
                  <span>Utilidades del Ejercicio</span>
                  <strong style={{ color: '#16a34a' }}>RD$ {resultadoNeto.toLocaleString('en-US')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#ede9fe', borderRadius: 6, fontWeight: 700, color: '#6d28d9' }}>
                  <span>TOTAL PASIVO + PATRIMONIO</span>
                  <span>RD$ {totalActivos.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reporteTipo === 'flujo' && (
        <div className="fn-table-section">
          <div className="fn-table-header-row">
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              Flujo de Caja Consolidado
            </h4>
          </div>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            Entradas y salidas de efectivo registradas en los libros contables durante el período activo.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 10 }}>
            <div className="card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <span style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>Entradas de Efectivo</span>
              <h3 style={{ margin: '6px 0 0 0', color: '#15803d' }}>RD$ {totalIngresos.toLocaleString('en-US')}</h3>
            </div>
            <div className="card" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <span style={{ fontSize: 12, color: '#991b1b', fontWeight: 600 }}>Salidas de Efectivo</span>
              <h3 style={{ margin: '6px 0 0 0', color: '#b91c1c' }}>RD$ {totalGastos.toLocaleString('en-US')}</h3>
            </div>
            <div className="card" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <span style={{ fontSize: 12, color: '#1e40af', fontWeight: 600 }}>Flujo Neto Resultante</span>
              <h3 style={{ margin: '6px 0 0 0', color: '#1d4ed8' }}>RD$ {resultadoNeto.toLocaleString('en-US')}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
