import React, { useState } from 'react'

export function ExpensesDonutChart({ categorias }) {
  const [periodo, setPeriodo] = useState('Este mes')
  const [activeCategory, setActiveCategory] = useState(null)

  const items = categorias || [
    { id: 'sueldos', nombre: 'Sueldos y Salarios', porcentaje: 40, monto: 272000, color: '#10b981' },
    { id: 'servicios', nombre: 'Servicios', porcentaje: 20, monto: 136000, color: '#3b82f6' },
    { id: 'alquileres', nombre: 'Alquileres', porcentaje: 15, monto: 102000, color: '#f59e0b' },
    { id: 'suministros', nombre: 'Suministros', porcentaje: 10, monto: 68000, color: '#8b5cf6' },
    { id: 'otros', nombre: 'Otros Gastos', porcentaje: 15, monto: 102000, color: '#6366f1' },
  ]

  const totalGastos = items.reduce((acc, curr) => acc + curr.monto, 0)

  // Geometría del Donut SVG
  const size = 180
  const radius = 65
  const strokeWidth = 32
  const center = size / 2
  const circumference = 2 * Math.PI * radius

  let accumulatedPercent = 0

  return (
    <div className="fn-chart-card">
      <div className="fn-chart-header">
        <div className="fn-chart-title-group">
          <h3 className="fn-chart-title">Gastos por Categoría</h3>
          <span className="fn-chart-info-icon" title="Distribución proporcional de egresos en el período">ⓘ</span>
        </div>
        <select
          className="fn-period-select"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
        >
          <option value="Este mes">Este mes</option>
          <option value="Últimos 3 meses">Últimos 3 meses</option>
          <option value="Año actual">Año actual</option>
        </select>
      </div>

      <div className="fn-donut-container">
        {/* Gráfico Donut SVG */}
        <div className="fn-donut-graphic">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="fn-donut-svg">
            <g transform={`rotate(-90 ${center} ${center})`}>
              {items.map((cat) => {
                const strokeDasharray = `${(cat.porcentaje / 100) * circumference} ${circumference}`
                const strokeDashoffset = -((accumulatedPercent / 100) * circumference)
                accumulatedPercent += cat.porcentaje

                const isHovered = activeCategory?.id === cat.id

                return (
                  <circle
                    key={cat.id}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke={cat.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="fn-donut-segment"
                    onMouseEnter={() => setActiveCategory(cat)}
                    onMouseLeave={() => setActiveCategory(null)}
                    style={{
                      transition: 'stroke-width 0.2s ease',
                      cursor: 'pointer',
                    }}
                  />
                )
              })}
            </g>
          </svg>

          {/* Centro del donut con ícono de gráfico */}
          <div className="fn-donut-center">
            <span className="fn-donut-icon">📊</span>
          </div>
        </div>

        {/* Desglose / Leyenda lateral con porcentajes y montos */}
        <div className="fn-donut-legend">
          {items.map((cat) => (
            <div
              key={cat.id}
              className={`fn-legend-row ${activeCategory?.id === cat.id ? 'active-row' : ''}`}
              onMouseEnter={() => setActiveCategory(cat)}
              onMouseLeave={() => setActiveCategory(null)}
            >
              <div className="fn-legend-name-group">
                <span className="fn-legend-dot" style={{ backgroundColor: cat.color }}></span>
                <span className="fn-legend-label">{cat.nombre}</span>
              </div>
              <span className="fn-legend-percent">{cat.porcentaje}%</span>
              <span className="fn-legend-amount">RD$ {cat.monto.toLocaleString('en-US')}</span>
            </div>
          ))}

          <div className="fn-donut-total-row">
            <span className="fn-donut-total-label">Total:</span>
            <span className="fn-donut-total-val">RD$ {totalGastos.toLocaleString('en-US')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
