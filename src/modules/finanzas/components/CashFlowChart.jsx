import React, { useState } from 'react'

export function CashFlowChart({ data }) {
  const [periodo, setPeriodo] = useState('Este mes')
  const [hoveredPoint, setHoveredPoint] = useState(null)

  const rawItems = (data && data.length > 0) ? data : [
    { mes: 'Ene', ingresos: 1050000, gastos: 620000, resultado: 430000 },
    { mes: 'Feb', ingresos: 1200000, gastos: 640000, resultado: 560000 },
    { mes: 'Mar', ingresos: 1180000, gastos: 650000, resultado: 530000 },
    { mes: 'Abr', ingresos: 1150000, gastos: 630000, resultado: 520000 },
    { mes: 'May', ingresos: 1280000, gastos: 670000, resultado: 610000 },
    { mes: 'Jun', ingresos: 1210000, gastos: 640000, resultado: 570000 },
    { mes: 'Jul', ingresos: 1350000, gastos: 700000, resultado: 650000 },
    { mes: 'Ago', ingresos: 1280000, gastos: 680000, resultado: 600000 },
  ]

  const items = periodo === 'Este mes'
    ? rawItems.slice(-4)
    : periodo === 'Últimos 3 meses'
    ? rawItems.slice(-6)
    : rawItems

  // Dimensiones del canvas SVG
  const width = 600
  const height = 240
  const paddingX = 45
  const paddingY = 30
  const maxVal = Math.max(...items.map(i => Math.max(i.ingresos || 0, i.gastos || 0, 1500000))) * 1.15

  const getX = (index) => paddingX + (index * (width - paddingX * 2)) / (items.length - 1)
  const getY = (val) => height - paddingY - (val / maxVal) * (height - paddingY * 2)

  const createPath = (key) => {
    return items.map((item, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(item[key])}`).join(' ')
  }

  const createAreaPath = (key) => {
    const linePath = items.map((item, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(item[key])}`).join(' ')
    const lastX = getX(items.length - 1)
    const firstX = getX(0)
    const baselineY = height - paddingY
    return `${linePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`
  }

  const yLabels = [
    { label: 'RD$ 1.5M', val: 1500000 },
    { label: 'RD$ 1.2M', val: 1200000 },
    { label: 'RD$ 900K', val: 900000 },
    { label: 'RD$ 600K', val: 600000 },
    { label: 'RD$ 300K', val: 300000 },
    { label: 'RD$ 0', val: 0 },
  ]

  return (
    <div className="fn-chart-card">
      <div className="fn-chart-header">
        <div className="fn-chart-title-group">
          <h3 className="fn-chart-title">Flujo de Efectivo</h3>
          <span className="fn-chart-info-icon" title="Comparativa mensual de ingresos, gastos y margen neto">ⓘ</span>
        </div>
        <div className="fn-chart-actions">
          <div className="fn-chart-legend">
            <span className="legend-item"><span className="legend-dot dot-ingresos"></span> Ingresos</span>
            <span className="legend-item"><span className="legend-dot dot-gastos"></span> Gastos</span>
            <span className="legend-item"><span className="legend-dot dot-resultado"></span> Resultado</span>
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
      </div>

      <div className="fn-chart-body">
        <svg viewBox={`0 0 ${width} ${height}`} className="fn-svg-chart">
          <defs>
            <linearGradient id="gradIngresos" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradGastos" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradResultado" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yLabels.map((y) => (
            <g key={y.val}>
              <line
                x1={paddingX}
                y1={getY(y.val)}
                x2={width - paddingX}
                y2={getY(y.val)}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
              />
              <text
                x={paddingX - 8}
                y={getY(y.val) + 4}
                textAnchor="end"
                className="fn-axis-text"
              >
                {y.label}
              </text>
            </g>
          ))}

          {/* X Axis labels */}
          {items.map((item, idx) => (
            <text
              key={item.mes}
              x={getX(idx)}
              y={height - 8}
              textAnchor="middle"
              className="fn-axis-text"
            >
              {item.mes}
            </text>
          ))}

          {/* Fill Areas */}
          <path d={createAreaPath('ingresos')} fill="url(#gradIngresos)" />
          <path d={createAreaPath('gastos')} fill="url(#gradGastos)" />
          <path d={createAreaPath('resultado')} fill="url(#gradResultado)" />

          {/* Lines */}
          <path d={createPath('ingresos')} fill="none" stroke="#10b981" strokeWidth="2.5" />
          <path d={createPath('gastos')} fill="none" stroke="#ef4444" strokeWidth="2.5" />
          <path d={createPath('resultado')} fill="none" stroke="#3b82f6" strokeWidth="2.5" />

          {/* Points */}
          {items.map((item, idx) => (
            <g key={idx}>
              {/* Ingresos Point */}
              <circle
                cx={getX(idx)}
                cy={getY(item.ingresos)}
                r="4.5"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
                className="chart-dot"
                onMouseEnter={() => setHoveredPoint({ ...item, key: 'Ingresos', val: item.ingresos, x: getX(idx), y: getY(item.ingresos) })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {/* Gastos Point */}
              <circle
                cx={getX(idx)}
                cy={getY(item.gastos)}
                r="4.5"
                fill="#ef4444"
                stroke="#ffffff"
                strokeWidth="2"
                className="chart-dot"
                onMouseEnter={() => setHoveredPoint({ ...item, key: 'Gastos', val: item.gastos, x: getX(idx), y: getY(item.gastos) })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {/* Resultado Point */}
              <circle
                cx={getX(idx)}
                cy={getY(item.resultado)}
                r="4.5"
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth="2"
                className="chart-dot"
                onMouseEnter={() => setHoveredPoint({ ...item, key: 'Resultado', val: item.resultado, x: getX(idx), y: getY(item.resultado) })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          ))}
        </svg>

        {hoveredPoint && (
          <div
            className="fn-chart-tooltip"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100}%`,
            }}
          >
            <div className="tooltip-title">{hoveredPoint.mes} - {hoveredPoint.key}</div>
            <div className="tooltip-value">RD$ {hoveredPoint.val.toLocaleString('en-US')}</div>
          </div>
        )}
      </div>
    </div>
  )
}
