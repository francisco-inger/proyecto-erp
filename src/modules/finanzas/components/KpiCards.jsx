import React from 'react'

export function KpiCards({ kpis }) {
  if (!kpis) return null

  const items = [
    {
      id: 'saldo',
      titulo: 'Saldo en Cuentas',
      valor: kpis.saldoCuentas.valor,
      cambio: kpis.saldoCuentas.cambioPorcentual,
      periodo: kpis.saldoCuentas.periodoTexto,
      iconBg: '#dcfce7',
      iconColor: '#16a34a',
      icon: '$',
      isCurrency: true,
    },
    {
      id: 'ingresos',
      titulo: 'Ingresos del Mes',
      valor: kpis.ingresosMes.valor,
      cambio: kpis.ingresosMes.cambioPorcentual,
      periodo: kpis.ingresosMes.periodoTexto,
      iconBg: '#e0f2fe',
      iconColor: '#0284c7',
      icon: '↓',
      isCurrency: true,
    },
    {
      id: 'gastos',
      titulo: 'Gastos del Mes',
      valor: kpis.gastosMes.valor,
      cambio: kpis.gastosMes.cambioPorcentual,
      periodo: kpis.gastosMes.periodoTexto,
      iconBg: '#ffedd5',
      iconColor: '#ea580c',
      icon: '◆',
      isCurrency: true,
    },
    {
      id: 'resultado',
      titulo: 'Resultado del Mes',
      valor: kpis.resultadoMes.valor,
      cambio: kpis.resultadoMes.cambioPorcentual,
      periodo: kpis.resultadoMes.periodoTexto,
      iconBg: '#ede9fe',
      iconColor: '#7c3aed',
      icon: '📄',
      isCurrency: true,
    },
  ]

  const formatCurrency = (val) => {
    return `RD$ ${Number(val).toLocaleString('en-US')}`
  }

  return (
    <div className="fn-kpi-grid">
      {items.map((item) => {
        const isPositive = item.cambio >= 0
        return (
          <div key={item.id} className="fn-kpi-card">
            <div className="fn-kpi-header">
              <div
                className="fn-kpi-icon-wrapper"
                style={{ backgroundColor: item.iconBg, color: item.iconColor }}
              >
                <span className="fn-kpi-icon">{item.icon}</span>
              </div>
              <div className="fn-kpi-info">
                <span className="fn-kpi-label">{item.titulo}</span>
                <div className="fn-kpi-value">{formatCurrency(item.valor)}</div>
              </div>
            </div>

            <div className="fn-kpi-footer">
              <span
                className={`fn-kpi-trend ${isPositive ? 'trend-up' : 'trend-down'}`}
              >
                {isPositive ? '↑' : '↓'} {Math.abs(item.cambio)}%
              </span>
              <span className="fn-kpi-period">{item.periodo}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
