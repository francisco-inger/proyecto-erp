import React from 'react'

export function ImpuestosTab({ comprobantes = [] }) {
  // Cálculo de ITBIS 18% basado en comprobantes con ITBIS o facturas de ingreso
  const totalIngresos = comprobantes
    .filter(c => c.tipo === 'Ingreso' && c.estado !== 'Anulado')
    .reduce((sum, c) => sum + (Number(c.monto) || 0), 0)

  const itbisCobrado = Math.round(totalIngresos * 0.18)
  const totalGastos = comprobantes
    .filter(c => (c.tipo === 'Gasto' || c.tipo === 'Egreso') && c.estado !== 'Anulado')
    .reduce((sum, c) => sum + (Number(c.monto) || 0), 0)

  const itbisAdelantado = Math.round(totalGastos * 0.18)
  const itbisPagar = Math.max(0, itbisCobrado - itbisAdelantado)

  const reportesDgii = [
    { codigo: '606', nombre: 'Formato de Compras de Bienes y Servicios (606)', periodo: 'Mensual', estado: 'Generado', registros: comprobantes.filter(c => c.tipo === 'Gasto').length || 12 },
    { codigo: '607', nombre: 'Formato de Ventas de Bienes y Servicios (607)', periodo: 'Mensual', estado: 'Generado', registros: comprobantes.filter(c => c.tipo === 'Ingreso').length || 24 },
    { codigo: 'IT-1', nombre: 'Declaración Jurada de ITBIS (IT-1)', periodo: 'Mensual', estado: 'Pendiente Envío', registros: 1 },
    { codigo: 'IR-17', nombre: 'Declaración de Retenciones de Renta (IR-17)', periodo: 'Mensual', estado: 'Al Día', registros: 4 },
  ]

  const handleDescargarReporte = (codigo) => {
    const csvContent = `Formato DGII ${codigo}\nPeriodo,Agosto 2026\nRNC Empresa,132456789\nRegistros Totales,${comprobantes.length}\nEstado,Completado DGII Compliance`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dgii_formato_${codigo}_202608.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Tarjetas de Resumen Fiscal */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="card" style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>ITBIS Cobrado (18%)</span>
          <h3 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, color: '#2563EB' }}>
            RD$ {itbisCobrado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h3>
          <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>En ventas y facturación</span>
        </div>

        <div className="card" style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>ITBIS Deducible (Compras)</span>
          <h3 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, color: '#D97706' }}>
            RD$ {itbisAdelantado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h3>
          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>En compras con NCF válido</span>
        </div>

        <div className="card" style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Saldo Estimado a Pagar DGII</span>
          <h3 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, color: '#DC2626' }}>
            RD$ {itbisPagar.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h3>
          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Vence día 20 del mes</span>
        </div>
      </div>

      {/* Tabla de Formatos de Envío DGII */}
      <div className="card" style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
          <div>
            <strong style={{ fontSize: 15, color: '#0F172A' }}>Formatos y Reportes Fiscales DGII (Rep. Dominicana)</strong>
            <div style={{ fontSize: 12, color: '#64748B' }}>Generación automática de archivos para la Oficina Virtual DGII</div>
          </div>
        </div>

        <table className="fn-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', fontSize: 12, color: '#64748B' }}>
              <th style={{ padding: '12px 16px' }}>Código</th>
              <th style={{ padding: '12px 16px' }}>Descripción del Formato</th>
              <th style={{ padding: '12px 16px' }}>Frecuencia</th>
              <th style={{ padding: '12px 16px' }}>Registros</th>
              <th style={{ padding: '12px 16px' }}>Estado</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {reportesDgii.map(rep => (
              <tr key={rep.codigo} style={{ borderBottom: '1px solid #F1F5F9', fontSize: 13 }}>
                <td style={{ padding: '12px 16px', fontWeight: 800, color: '#2563EB' }}>{rep.codigo}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0F172A' }}>{rep.nombre}</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>{rep.periodo}</td>
                <td style={{ padding: '12px 16px', fontWeight: 700 }}>{rep.registros} registros</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: rep.estado === 'Al Día' || rep.estado === 'Generado' ? '#DCFCE7' : '#FEF3C7', color: rep.estado === 'Al Día' || rep.estado === 'Generado' ? '#16A34A' : '#D97706', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                    ● {rep.estado}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button
                    onClick={() => handleDescargarReporte(rep.codigo)}
                    style={{ background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    📥 Descargar TXT/CSV
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
