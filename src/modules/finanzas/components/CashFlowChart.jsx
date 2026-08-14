/*
  CashFlowChart.jsx — Gráfico de Flujo de Efectivo (Ingresos, Gastos y Resultado Neto)
  Soporte dinámico para rangos positivos y negativos, curvas suaves bezier y escala adaptativa.
*/
import React, { useState, useMemo } from 'react'

function fmtMoneyCompact(val) {
  const abs = Math.abs(val)
  const sign = val < 0 ? '-' : ''
  if (abs >= 1000000) {
    return `${sign}RD$ ${(abs / 1000000).toFixed(1).replace('.0', '')}M`
  }
  if (abs >= 1000) {
    return `${sign}RD$ ${(abs / 1000).toFixed(0)}K`
  }
  return `${sign}RD$ ${abs}`
}

function fmtMoneyFull(val) {
  return 'RD$ ' + Number(val || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function CashFlowChart({ data }) {
  const [periodo, setPeriodo] = useState('Este mes')
  const [hoveredPoint, setHoveredPoint] = useState(null)

  const rawItems = useMemo(() => {
    if (data && Array.isArray(data) && data.length > 0) return data
    return [
      { mes: 'Ene', ingresos: 1050000, gastos: 620000, resultado: 430000 },
      { mes: 'Feb', ingresos: 1200000, gastos: 640000, resultado: 560000 },
      { mes: 'Mar', ingresos: 1180000, gastos: 650000, resultado: 530000 },
      { mes: 'Abr', ingresos: 1150000, gastos: 630000, resultado: 520000 },
      { mes: 'May', ingresos: 1280000, gastos: 670000, resultado: 610000 },
      { mes: 'Jun', ingresos: 1210000, gastos: 640000, resultado: 570000 },
      { mes: 'Jul', ingresos: 1350000, gastos: 700000, resultado: 650000 },
      { mes: 'Ago', ingresos: 1280000, gastos: 680000, resultado: 600000 },
    ]
  }, [data])

  const items = useMemo(() => {
    if (periodo === 'Este mes') {
      return rawItems.slice(-4)
    }
    if (periodo === 'Últimos 3 meses') {
      return rawItems.slice(-6)
    }
    return rawItems
  }, [rawItems, periodo])

  // Canvas SVG Dimensions
  const width = 620
  const height = 240
  const paddingLeft = 65
  const paddingRight = 24
  const paddingTop = 20
  const paddingBottom = 32

  const { minVal, maxVal, yTicks } = useMemo(() => {
    const allValues = items.flatMap(i => [
      Number(i.ingresos) || 0,
      Number(i.gastos) || 0,
      Number(i.resultado) || 0
    ])

    const realMax = Math.max(...allValues, 1000000)
    const realMin = Math.min(...allValues, 0)

    // Determinar límites redondeados
    let calculatedMax = Math.ceil((realMax * 1.15) / 200000) * 200000
    let calculatedMin = 0

    if (realMin < 0) {
      calculatedMin = Math.floor((realMin * 1.2) / 200000) * 200000
    }

    // Asegurar mínimo rango de altura
    if (calculatedMax - calculatedMin < 500000) {
      calculatedMax = 1000000
      calculatedMin = 0
    }

    // Generar 5 a 6 ticks limpios para el eje Y
    const stepsCount = 5
    const stepSize = (calculatedMax - calculatedMin) / stepsCount
    const ticks = []
    for (let i = 0; i <= stepsCount; i++) {
      const val = calculatedMin + stepSize * i
      ticks.push({
        val: Math.round(val),
        label: fmtMoneyCompact(val),
      })
    }

    return { minVal: calculatedMin, maxVal: calculatedMax, yTicks: ticks }
  }, [items])

  const range = maxVal - minVal || 1
  const chartHeight = height - paddingTop - paddingBottom
  const chartWidth = width - paddingLeft - paddingRight

  const getX = (index) => {
    if (items.length <= 1) return paddingLeft + chartWidth / 2
    return paddingLeft + (index * chartWidth) / (items.length - 1)
  }

  const getY = (val) => {
    const clamped = Math.max(minVal, Math.min(maxVal, Number(val) || 0))
    const ratio = (clamped - minVal) / range
    return height - paddingBottom - ratio * chartHeight
  }

  const zeroY = getY(0)

  // Generar curva suave Bezier cúbica
  const createSmoothPath = (key) => {
    if (items.length === 0) return ''
    if (items.length === 1) return `M ${getX(0)} ${getY(items[0][key])}`

    const points = items.map((item, idx) => ({
      x: getX(idx),
      y: getY(item[key]),
    }))

    let d = `M ${points[0].x},${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i]
      const next = points[i + 1]
      const cpX1 = curr.x + (next.x - curr.x) / 3
      const cpY1 = curr.y
      const cpX2 = curr.x + (2 * (next.x - curr.x)) / 3
      const cpY2 = next.y
      d += ` C ${cpX1},${cpY1} ${cpX2},${cpY2} ${next.x},${next.y}`
    }
    return d
  }

  // Generar área sombreada cerrada
  const createAreaPath = (key) => {
    if (items.length < 2) return ''
    const linePath = createSmoothPath(key)
    const firstX = getX(0)
    const lastX = getX(items.length - 1)
    const baselineY = Math.min(height - paddingBottom, zeroY)
    return `${linePath} L ${lastX},${baselineY} L ${firstX},${baselineY} Z`
  }

  return (
    <div className="fn-chart-card">
      <div className="fn-chart-header">
        <div className="fn-chart-title-group">
          <h3 className="fn-chart-title">Flujo de Efectivo</h3>
          <span className="fn-chart-info-icon" title="Comparativa mensual de ingresos, gastos operativos y margen neto">ⓘ</span>
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

      <div className="fn-chart-body" style={{ overflow: 'hidden', position: 'relative' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="fn-svg-chart"
          style={{ width: '100%', height: '100%', display: 'block', overflow: 'hidden' }}
        >
          <defs>
            <clipPath id="chartClip">
              <rect x={paddingLeft - 4} y={paddingTop - 6} width={chartWidth + 8} height={chartHeight + 12} />
            </clipPath>

            <linearGradient id="gradIngresos" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradGastos" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradResultado" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines y etiquetas del eje Y */}
          {yTicks.map((tick, idx) => {
            const yPos = getY(tick.val)
            const isZero = tick.val === 0
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={yPos}
                  x2={width - paddingRight}
                  y2={yPos}
                  stroke={isZero ? '#94a3b8' : '#e2e8f0'}
                  strokeWidth={isZero ? '1.5' : '1'}
                  strokeDasharray={isZero ? 'none' : '3 3'}
                />
                <text
                  x={paddingLeft - 8}
                  y={yPos + 3.5}
                  textAnchor="end"
                  className="fn-axis-text"
                  style={{ fontWeight: isZero ? '700' : '500', fill: isZero ? '#475569' : '#94a3b8' }}
                >
                  {tick.label}
                </text>
              </g>
            )
          })}

          {/* Etiquetas del eje X (Meses) */}
          {items.map((item, idx) => (
            <text
              key={item.mes || idx}
              x={getX(idx)}
              y={height - 10}
              textAnchor="middle"
              className="fn-axis-text"
              style={{ fontWeight: '600', fill: '#64748B' }}
            >
              {item.mes}
            </text>
          ))}

          {/* Área sombreada (recortada dentro del gráfico) */}
          <g clipPath="url(#chartClip)">
            <path d={createAreaPath('ingresos')} fill="url(#gradIngresos)" />
            <path d={createAreaPath('gastos')} fill="url(#gradGastos)" />
            <path d={createAreaPath('resultado')} fill="url(#gradResultado)" />

            {/* Líneas de trazado */}
            <path d={createSmoothPath('ingresos')} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            <path d={createSmoothPath('gastos')} fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            <path d={createSmoothPath('resultado')} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />

            {/* Puntos Interactivos */}
            {items.map((item, idx) => {
              const xPos = getX(idx)
              const yIng = getY(item.ingresos)
              const yGas = getY(item.gastos)
              const yRes = getY(item.resultado)

              return (
                <g key={idx}>
                  {/* Punto Ingresos */}
                  <circle
                    cx={xPos}
                    cy={yIng}
                    r="4.5"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="chart-dot"
                    onMouseEnter={() => setHoveredPoint({ mes: item.mes, key: 'Ingresos', val: item.ingresos, x: xPos, y: yIng, color: '#10b981' })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Punto Gastos */}
                  <circle
                    cx={xPos}
                    cy={yGas}
                    r="4.5"
                    fill="#ef4444"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="chart-dot"
                    onMouseEnter={() => setHoveredPoint({ mes: item.mes, key: 'Gastos', val: item.gastos, x: xPos, y: yGas, color: '#ef4444' })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Punto Resultado */}
                  <circle
                    cx={xPos}
                    cy={yRes}
                    r="4.5"
                    fill="#3b82f6"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="chart-dot"
                    onMouseEnter={() => setHoveredPoint({ mes: item.mes, key: 'Resultado Neto', val: item.resultado, x: xPos, y: yRes, color: '#3b82f6' })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                </g>
              )
            })}
          </g>
        </svg>

        {/* Tooltip emergente inteligente */}
        {hoveredPoint && (
          <div
            className="fn-chart-tooltip"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${Math.max(10, Math.min(height - 40, hoveredPoint.y)) / height * 100}%`,
              borderColor: hoveredPoint.color || '#3b82f6',
            }}
          >
            <div className="tooltip-title">{hoveredPoint.mes} · {hoveredPoint.key}</div>
            <div className="tooltip-value">{fmtMoneyFull(hoveredPoint.val)}</div>
          </div>
        )}
      </div>
    </div>
  )
}
