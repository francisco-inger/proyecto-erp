// src/modules/finanzas/services/finanzasService.js

const STORAGE_KEY = 'appes_erp_finanzas_data'

export const INITIAL_FINANZAS_DATA = {
  kpis: {
    saldoCuentas: {
      valor: 2450000,
      cambioPorcentual: 8.5,
      periodoTexto: 'vs. mes anterior',
    },
    ingresosMes: {
      valor: 1280000,
      cambioPorcentual: 12.3,
      periodoTexto: 'vs. mes anterior',
    },
    gastosMes: {
      valor: 680000,
      cambioPorcentual: -5.4,
      periodoTexto: 'vs. mes anterior',
    },
    resultadoMes: {
      valor: 600000,
      cambioPorcentual: 22.1,
      periodoTexto: 'vs. mes anterior',
    },
  },
  cashFlowData: [
    { mes: 'Ene', ingresos: 1050000, gastos: 620000, resultado: 430000 },
    { mes: 'Feb', ingresos: 1200000, gastos: 640000, resultado: 560000 },
    { mes: 'Mar', ingresos: 1180000, gastos: 650000, resultado: 530000 },
    { mes: 'Abr', ingresos: 1150000, gastos: 630000, resultado: 520000 },
    { mes: 'May', ingresos: 1280000, gastos: 670000, resultado: 610000 },
    { mes: 'Jun', ingresos: 1210000, gastos: 640000, resultado: 570000 },
    { mes: 'Jul', ingresos: 1350000, gastos: 700000, resultado: 650000 },
    { mes: 'Ago', ingresos: 1280000, gastos: 680000, resultado: 600000 },
  ],
  categoriasGastos: [
    { id: 'sueldos', nombre: 'Sueldos y Salarios', porcentaje: 40, monto: 272000, color: '#10b981' },
    { id: 'servicios', nombre: 'Servicios', porcentaje: 20, monto: 136000, color: '#3b82f6' },
    { id: 'alquileres', nombre: 'Alquileres', porcentaje: 15, monto: 102000, color: '#f59e0b' },
    { id: 'suministros', nombre: 'Suministros', porcentaje: 10, monto: 68000, color: '#8b5cf6' },
    { id: 'otros', nombre: 'Otros Gastos', porcentaje: 15, monto: 102000, color: '#6366f1' },
  ],
  cuentas: [
    { id: 'cta-1', nombre: 'Banco Popular 960-123456', tipo: 'Corriente', banco: 'Banco Popular', saldo: 1450000, moneda: 'DOP' },
    { id: 'cta-2', nombre: 'Banco BHD 450-987654', tipo: 'Ahorros', banco: 'Banco BHD', saldo: 750000, moneda: 'DOP' },
    { id: 'cta-3', nombre: 'Efectivo / Caja Chica', tipo: 'Efectivo', banco: 'Caja Principal', saldo: 250000, moneda: 'DOP' },
  ],
  comprobantes: [
    {
      id: 'comp-1',
      numero: 'FV-000125',
      tipo: 'Ingreso',
      fecha: '12/08/2025',
      fechaRaw: '2025-08-12',
      descripcion: 'Cobro factura FV-001245',
      cuenta: 'Banco Popular 960-123456',
      cuentaId: 'cta-1',
      monto: 250000,
      estado: 'Aprobado',
      creadoPor: 'admin',
    },
    {
      id: 'comp-2',
      numero: 'EG-000089',
      tipo: 'Gasto',
      fecha: '12/08/2025',
      fechaRaw: '2025-08-12',
      descripcion: 'Pago de alquiler oficina',
      cuenta: 'Banco Popular 960-123456',
      cuentaId: 'cta-1',
      monto: 85000,
      estado: 'Aprobado',
      creadoPor: 'maria.garcia',
    },
    {
      id: 'comp-3',
      numero: 'TR-000034',
      tipo: 'Transferencia',
      fecha: '11/08/2025',
      fechaRaw: '2025-08-11',
      descripcion: 'Transferencia a caja chica',
      cuenta: 'Banco Popular 960-123456',
      cuentaDestino: 'Efectivo / Caja Chica',
      cuentaId: 'cta-1',
      monto: 20000,
      estado: 'Completado',
      creadoPor: 'juan.perez',
    },
    {
      id: 'comp-4',
      numero: 'FV-000124',
      tipo: 'Ingreso',
      fecha: '11/08/2025',
      fechaRaw: '2025-08-11',
      descripcion: 'Venta mostrador #1456',
      cuenta: 'Efectivo',
      cuentaId: 'cta-3',
      monto: 120000,
      estado: 'Aprobado',
      creadoPor: 'cajero1',
    },
    {
      id: 'comp-5',
      numero: 'EG-000088',
      tipo: 'Gasto',
      fecha: '10/08/2025',
      fechaRaw: '2025-08-10',
      descripcion: 'Compra de suministros',
      cuenta: 'Banco Popular 960-123456',
      cuentaId: 'cta-1',
      monto: 32500,
      estado: 'Pendiente',
      creadoPor: 'maria.garcia',
    },
    {
      id: 'comp-6',
      numero: 'FV-000123',
      tipo: 'Ingreso',
      fecha: '09/08/2025',
      fechaRaw: '2025-08-09',
      descripcion: 'Servicio de consultoría TI',
      cuenta: 'Banco BHD 450-987654',
      cuentaId: 'cta-2',
      monto: 180000,
      estado: 'Aprobado',
      creadoPor: 'admin',
    },
    {
      id: 'comp-7',
      numero: 'EG-000087',
      tipo: 'Gasto',
      fecha: '08/08/2025',
      fechaRaw: '2025-08-08',
      descripcion: 'Servicios de Internet y Telefonía',
      cuenta: 'Banco Popular 960-123456',
      cuentaId: 'cta-1',
      monto: 14500,
      estado: 'Aprobado',
      creadoPor: 'juan.perez',
    },
    {
      id: 'comp-8',
      numero: 'TR-000033',
      tipo: 'Transferencia',
      fecha: '07/08/2025',
      fechaRaw: '2025-08-07',
      descripcion: 'Traspaso BHD a Popular',
      cuenta: 'Banco BHD 450-987654',
      cuentaDestino: 'Banco Popular 960-123456',
      cuentaId: 'cta-2',
      monto: 50000,
      estado: 'Completado',
      creadoPor: 'admin',
    },
  ],
}

export const finanzasService = {
  getData: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return JSON.parse(stored)
    } catch (e) {
      console.warn('Error reading finanzas data from localStorage', e)
    }
    return INITIAL_FINANZAS_DATA
  },

  saveData: (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('Error saving finanzas data to localStorage', e)
    }
  },

  addComprobante: (nuevo) => {
    const data = finanzasService.getData()
    const id = 'comp-' + (data.comprobantes.length + 1)
    const fechaObj = new Date()
    const dd = String(fechaObj.getDate()).padStart(2, '0')
    const mm = String(fechaObj.getMonth() + 1).padStart(2, '0')
    const yyyy = fechaObj.getFullYear()
    const fechaFormateada = `${dd}/${mm}/${yyyy}`

    const item = {
      id,
      numero: nuevo.numero || (nuevo.tipo === 'Ingreso' ? `FV-000${125 + data.comprobantes.length}` : nuevo.tipo === 'Gasto' ? `EG-0000${89 + data.comprobantes.length}` : `TR-0000${34 + data.comprobantes.length}`),
      tipo: nuevo.tipo,
      fecha: nuevo.fecha || fechaFormateada,
      fechaRaw: nuevo.fechaRaw || `${yyyy}-${mm}-${dd}`,
      descripcion: nuevo.descripcion,
      cuenta: nuevo.cuenta,
      cuentaDestino: nuevo.cuentaDestino || '',
      cuentaId: nuevo.cuentaId || 'cta-1',
      monto: Number(nuevo.monto) || 0,
      estado: nuevo.estado || 'Aprobado',
      creadoPor: nuevo.creadoPor || 'admin',
    }

    const updatedComprobantes = [item, ...data.comprobantes]

    // Actualizar KPIs según la transacción
    const updatedKpis = { ...data.kpis }
    if (item.tipo === 'Ingreso') {
      updatedKpis.ingresosMes.valor += item.monto
      updatedKpis.saldoCuentas.valor += item.monto
      updatedKpis.resultadoMes.valor = updatedKpis.ingresosMes.valor - updatedKpis.gastosMes.valor
    } else if (item.tipo === 'Gasto') {
      updatedKpis.gastosMes.valor += item.monto
      updatedKpis.saldoCuentas.valor -= item.monto
      updatedKpis.resultadoMes.valor = updatedKpis.ingresosMes.valor - updatedKpis.gastosMes.valor
    }

    const nextData = {
      ...data,
      kpis: updatedKpis,
      comprobantes: updatedComprobantes,
    }

    finanzasService.saveData(nextData)
    return nextData
  },

  deleteComprobante: (id) => {
    const data = finanzasService.getData()
    const nextData = {
      ...data,
      comprobantes: data.comprobantes.filter((c) => c.id !== id),
    }
    finanzasService.saveData(nextData)
    return nextData
  },

  resetData: () => {
    localStorage.removeItem(STORAGE_KEY)
    return INITIAL_FINANZAS_DATA
  }
}
