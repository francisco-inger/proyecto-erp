import React from 'react'

export function ReciboImprimibleModal({ comprobante, onClose }) {
  if (!comprobante) return null

  const handlePrint = () => {
    const printContent = document.getElementById('recibo-print-area')
    const printWindow = window.open('', '_blank', 'width=800,height=700')
    if (!printWindow) {
      window.print()
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comprobante_${comprobante.numero}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 30px;
              color: #0f172a;
            }
            .recibo-box {
              max-width: 650px;
              margin: 0 auto;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 30px;
              box-shadow: none;
            }
            .recibo-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .empresa-title {
              font-size: 20px;
              font-weight: 800;
              color: #2563eb;
              margin: 0;
            }
            .empresa-sub {
              font-size: 11px;
              color: #64748b;
              margin-top: 3px;
            }
            .comprobante-num-box {
              text-align: right;
            }
            .comprobante-tipo {
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              color: #64748b;
            }
            .comprobante-num {
              font-size: 18px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 2px;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 20px;
            }
            .info-item {
              display: flex;
              flex-direction: column;
              gap: 3px;
            }
            .info-label {
              font-size: 11px;
              font-weight: 600;
              color: #64748b;
              text-transform: uppercase;
            }
            .info-val {
              font-size: 13px;
              font-weight: 600;
              color: #1e293b;
            }
            .table-concept {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .table-concept th {
              background: #f8fafc;
              border-bottom: 1px solid #cbd5e1;
              border-top: 1px solid #cbd5e1;
              padding: 8px 12px;
              font-size: 11px;
              text-align: left;
              color: #475569;
              text-transform: uppercase;
            }
            .table-concept td {
              padding: 12px;
              border-bottom: 1px solid #f1f5f9;
              font-size: 13px;
            }
            .total-box {
              display: flex;
              justify-content: flex-end;
              margin-top: 10px;
            }
            .total-row {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 12px 20px;
              display: flex;
              gap: 20px;
              align-items: center;
            }
            .total-label {
              font-size: 13px;
              font-weight: 700;
              color: #475569;
            }
            .total-val {
              font-size: 18px;
              font-weight: 800;
              color: #2563eb;
            }
            .recibo-footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px dashed #cbd5e1;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #94a3b8;
            }
            .firma-box {
              width: 180px;
              border-top: 1px solid #94a3b8;
              text-align: center;
              padding-top: 5px;
              color: #475569;
              font-weight: 600;
            }
            @media print {
              body { padding: 0; }
              .recibo-box { border: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const isIngreso = comprobante.tipo === 'Ingreso'

  return (
    <div className="fn-modal-overlay" onClick={onClose}>
      <div className="fn-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
        <div className="fn-modal-header">
          <div className="fn-modal-title-group">
            <span>🖨️</span>
            <h3>Comprobante Oficial de {comprobante.tipo}</h3>
          </div>
          <button className="fn-modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Área del Recibo */}
          <div id="recibo-print-area" className="recibo-box" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #2563eb', paddingBottom: 12, marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#2563eb' }}>APPES ERP DOMINICANA SRL</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#64748b' }}>RNC: 1-32-45678-9 • Santo Domingo, Rep. Dominicana</p>
                <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>Tel: (809) 555-0192 • info@appes.com</p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                  COMPROBANTE DE {comprobante.tipo.toUpperCase()}
                </span>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{comprobante.numero}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Fecha: {comprobante.fecha}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16, fontSize: 12 }}>
              <div>
                <span style={{ color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>
                  {isIngreso ? 'Recibido de (Cliente):' : 'Pagado a (Beneficiario):'}
                </span>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13, marginTop: 2 }}>
                  {comprobante.clienteProveedor || 'Cliente / Proveedor General'}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Cuenta / Medio de Pago:</span>
                <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 2 }}>{comprobante.cuenta}</div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', margin: '14px 0', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: '#475569', fontSize: 11 }}>DESCRIPCIÓN / CONCEPTO</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', color: '#475569', fontSize: 11 }}>CATEGORÍA</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', color: '#475569', fontSize: 11 }}>ESTADO</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', color: '#475569', fontSize: 11 }}>MONTO (RD$)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px 10px', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{comprobante.descripcion}</td>
                  <td style={{ padding: '12px 10px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', color: '#64748b' }}>{comprobante.categoria || 'General'}</td>
                  <td style={{ padding: '12px 10px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: '#ecfdf5', color: '#059669' }}>
                      {comprobante.estado}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 800, color: isIngreso ? '#16a34a' : '#dc2626', fontSize: 14 }}>
                    RD$ {Number(comprobante.monto || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 16px', display: 'flex', gap: 16, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>TOTAL COMPROBANTE:</span>
                <span style={{ fontSize: 17, fontWeight: 800, color: '#2563eb' }}>
                  RD$ {Number(comprobante.monto || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 11, color: '#94a3b8' }}>
              <div>
                <div>Generado por: <strong>{comprobante.creadoPor}</strong></div>
                <div>Fecha de emisión: {new Date().toLocaleString('es-DO')}</div>
              </div>
              <div style={{ width: 160, borderTop: '1px solid #94a3b8', textAlign: 'center', paddingTop: 4, color: '#475569', fontWeight: 600, fontSize: 10 }}>
                Firma Autorizada
              </div>
            </div>
          </div>
        </div>

        <div className="fn-modal-actions" style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
          <button type="button" className="fn-btn-secondary" onClick={onClose}>
            Cerrar
          </button>
          <button type="button" className="fn-btn-primary" onClick={handlePrint}>
            <span>🖨️</span> Imprimir Solo Este Recibo
          </button>
        </div>
      </div>
    </div>
  )
}
