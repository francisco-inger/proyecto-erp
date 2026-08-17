import React, { useState } from 'react'

export function MonedasTab() {
  const [monedas, setMonedas] = useState([
    { codigo: 'DOP', nombre: 'Peso Dominicano (Oficial)', simbolo: 'RD$', tasaCompra: 1.00, tasaVenta: 1.00, esPrincipal: true },
    { codigo: 'USD', nombre: 'Dólar Estadounidense', simbolo: '$', tasaCompra: 58.75, tasaVenta: 59.10, esPrincipal: false },
    { codigo: 'EUR', nombre: 'Euro Europeo', simbolo: '€', tasaCompra: 63.40, tasaVenta: 64.20, esPrincipal: false },
  ])

  const [simulador, setSimulador] = useState({ monto: 100, origen: 'USD', destino: 'DOP' })

  const handleUpdateTasa = (codigo, field, val) => {
    setMonedas(prev => prev.map(m => m.codigo === codigo ? { ...m, [field]: Number(val) } : m))
  }

  const calcularConversion = () => {
    const origenObj = monedas.find(m => m.codigo === simulador.origen)
    const destinoObj = monedas.find(m => m.codigo === simulador.destino)
    if (!origenObj || !destinoObj) return 0
    const montoEnDOP = simulador.monto * (origenObj.tasaVenta || 1)
    const resultado = montoEnDOP / (destinoObj.tasaVenta || 1)
    return resultado.toFixed(2)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Lista y configuración de Monedas */}
        <div className="card" style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <strong style={{ fontSize: 16, color: '#0F172A', display: 'block' }}>Tasas de Cambio Oficiales (Banco Central)</strong>
            <span style={{ fontSize: 12, color: '#64748B' }}>Configuración multimoneda para ventas, facturación y compras</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {monedas.map(m => (
              <div key={m.codigo} style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, background: m.esPrincipal ? '#F8FAFC' : '#FFFFFF' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <strong style={{ fontSize: 14, color: '#0F172A' }}>{m.simbolo} · {m.nombre}</strong>
                    <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>Código ISO: {m.codigo}</span>
                  </div>
                  {m.esPrincipal ? (
                    <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                      Moneda Base ERP
                    </span>
                  ) : (
                    <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                      Secundaria
                    </span>
                  )}
                </div>

                {!m.esPrincipal && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4, fontWeight: 600 }}>Tasa Compra (RD$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={m.tasaCompra}
                        onChange={(e) => handleUpdateTasa(m.codigo, 'tasaCompra', e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4, fontWeight: 600 }}>Tasa Venta (RD$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={m.tasaVenta}
                        onChange={(e) => handleUpdateTasa(m.codigo, 'tasaVenta', e.target.value)}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Calculadora / Conversor en Tiempo Real */}
        <div className="card" style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <strong style={{ fontSize: 16, color: '#0F172A', display: 'block' }}>Conversor de Moneda en Vivo</strong>
            <span style={{ fontSize: 12, color: '#64748B' }}>Simulación instantánea con las tasas activas</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 4 }}>Monto a Convertir</label>
              <input
                type="number"
                value={simulador.monto}
                onChange={(e) => setSimulador({ ...simulador, monto: Number(e.target.value) })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, fontWeight: 700 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 4 }}>Moneda Origen</label>
                <select
                  value={simulador.origen}
                  onChange={(e) => setSimulador({ ...simulador, origen: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                >
                  <option value="USD">USD - Dólar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="DOP">DOP - Peso Dom.</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 4 }}>Moneda Destino</label>
                <select
                  value={simulador.destino}
                  onChange={(e) => setSimulador({ ...simulador, destino: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                >
                  <option value="DOP">DOP - Peso Dom.</option>
                  <option value="USD">USD - Dólar</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, marginTop: 10, textAlign: 'center' }}>
              <span style={{ fontSize: 12, color: '#64748B', display: 'block' }}>Resultado Estimado</span>
              <strong style={{ fontSize: 24, color: '#16A34A', fontWeight: 800 }}>
                {simulador.destino === 'DOP' ? 'RD$' : simulador.destino === 'USD' ? '$' : '€'} {calcularConversion()}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
