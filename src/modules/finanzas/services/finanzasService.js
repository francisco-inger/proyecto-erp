// src/modules/finanzas/services/finanzasService.js

const STORAGE_KEY = 'appes_erp_finanzas_data_v2'

export const INITIAL_FINANZAS_DATA = {
  kpis: {
    saldoCuentas: { valor: 2450000, cambioPorcentual: 8.5, periodoTexto: 'vs. mes anterior' },
    ingresosMes: { valor: 1280000, cambioPorcentual: 12.3, periodoTexto: 'vs. mes anterior' },
    gastosMes: { valor: 680000, cambioPorcentual: -5.4, periodoTexto: 'vs. mes anterior' },
    resultadoMes: { valor: 600000, cambioPorcentual: 22.1, periodoTexto: 'vs. mes anterior' },
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
    {
      id: 'cta-1',
      nombre: 'Banco Popular 960-123456',
      banco: 'Banco Popular Dominicano',
      tipo: 'Cuenta Corriente',
      numeroCuenta: '960-123456-7',
      saldo: 1450000,
      moneda: 'DOP',
      estado: 'Activa',
      icono: '🏦',
      titular: 'APPES ERP SRL',
    },
    {
      id: 'cta-2',
      nombre: 'Banco BHD 450-987654',
      banco: 'Banco BHD',
      tipo: 'Cuenta de Ahorros',
      numeroCuenta: '450-987654-2',
      saldo: 750000,
      moneda: 'DOP',
      estado: 'Activa',
      icono: '🏛️',
      titular: 'APPES ERP SRL',
    },
    {
      id: 'cta-3',
      nombre: 'Efectivo / Caja Chica',
      banco: 'Caja Principal',
      tipo: 'Efectivo',
      numeroCuenta: 'CAJA-001',
      saldo: 250000,
      moneda: 'DOP',
      estado: 'Activa',
      icono: '💵',
      titular: 'Cajero Principal',
    },
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
      categoria: 'Ventas de Software',
      clienteProveedor: 'Inversiones Globales SAS',
    },
    {
      id: 'comp-2',
      numero: 'EG-000089',
      tipo: 'Gasto',
      fecha: '12/08/2025',
      fechaRaw: '2025-08-12',
      descripcion: 'Pago de alquiler oficina corporativa',
      cuenta: 'Banco Popular 960-123456',
      cuentaId: 'cta-1',
      monto: 85000,
      estado: 'Aprobado',
      creadoPor: 'maria.garcia',
      categoria: 'Alquileres',
      clienteProveedor: 'Torre Empresarial Bella Vista',
    },
    {
      id: 'comp-3',
      numero: 'TR-000034',
      tipo: 'Transferencia',
      fecha: '11/08/2025',
      fechaRaw: '2025-08-11',
      descripcion: 'Transferencia a caja chica mensual',
      cuenta: 'Banco Popular 960-123456',
      cuentaDestino: 'Efectivo / Caja Chica',
      cuentaId: 'cta-1',
      cuentaDestinoId: 'cta-3',
      monto: 20000,
      estado: 'Completado',
      creadoPor: 'juan.perez',
      categoria: 'Fondos Operativos',
      clienteProveedor: 'Caja Chica Administrativa',
    },
    {
      id: 'comp-4',
      numero: 'FV-000124',
      tipo: 'Ingreso',
      fecha: '11/08/2025',
      fechaRaw: '2025-08-11',
      descripcion: 'Venta mostrador #1456 - Licencias POS',
      cuenta: 'Efectivo / Caja Chica',
      cuentaId: 'cta-3',
      monto: 120000,
      estado: 'Aprobado',
      creadoPor: 'cajero1',
      categoria: 'Ventas de Software',
      clienteProveedor: 'Retail Dominicana SRL',
    },
    {
      id: 'comp-5',
      numero: 'EG-000088',
      tipo: 'Gasto',
      fecha: '10/08/2025',
      fechaRaw: '2025-08-10',
      descripcion: 'Compra de suministros de oficina y papelería',
      cuenta: 'Banco Popular 960-123456',
      cuentaId: 'cta-1',
      monto: 32500,
      estado: 'Pendiente',
      creadoPor: 'maria.garcia',
      categoria: 'Suministros',
      clienteProveedor: 'Papelería y Útiles SA',
    },
    {
      id: 'comp-6',
      numero: 'FV-000123',
      tipo: 'Ingreso',
      fecha: '09/08/2025',
      fechaRaw: '2025-08-09',
      descripcion: 'Servicio de consultoría TI e integración',
      cuenta: 'Banco BHD 450-987654',
      cuentaId: 'cta-2',
      monto: 180000,
      estado: 'Aprobado',
      creadoPor: 'admin',
      categoria: 'Servicios de Consultoría',
      clienteProveedor: 'Grupo Ramos',
    },
    {
      id: 'comp-7',
      numero: 'EG-000087',
      tipo: 'Gasto',
      fecha: '08/08/2025',
      fechaRaw: '2025-08-08',
      descripcion: 'Servicios de Internet fibra óptica y Telefonía',
      cuenta: 'Banco Popular 960-123456',
      cuentaId: 'cta-1',
      monto: 14500,
      estado: 'Aprobado',
      creadoPor: 'juan.perez',
      categoria: 'Servicios',
      clienteProveedor: 'Claro Dominicana',
    },
    {
      id: 'comp-8',
      numero: 'TR-000033',
      tipo: 'Transferencia',
      fecha: '07/08/2025',
      fechaRaw: '2025-08-07',
      descripcion: 'Traspaso de fondos BHD a Popular',
      cuenta: 'Banco BHD 450-987654',
      cuentaDestino: 'Banco Popular 960-123456',
      cuentaId: 'cta-2',
      cuentaDestinoId: 'cta-1',
      monto: 50000,
      estado: 'Completado',
      creadoPor: 'admin',
      categoria: 'Rebalanceo de Cuentas',
      clienteProveedor: 'Operación Interna',
    },
  ],
  presupuestos: [
    {
      id: 'pre-1',
      categoria: 'Sueldos y Salarios',
      presupuestado: 300000,
      ejecutado: 272000,
      departamento: 'Recursos Humanos',
      periodo: 'Agosto 2025',
    },
    {
      id: 'pre-2',
      categoria: 'Servicios (Luz, Agua, Internet)',
      presupuestado: 150000,
      ejecutado: 136000,
      departamento: 'Operaciones',
      periodo: 'Agosto 2025',
    },
    {
      id: 'pre-3',
      categoria: 'Alquileres e Inmuebles',
      presupuestado: 100000,
      ejecutado: 102000,
      departamento: 'Administración',
      periodo: 'Agosto 2025',
    },
    {
      id: 'pre-4',
      categoria: 'Suministros y Papelería',
      presupuestado: 80000,
      ejecutado: 68000,
      departamento: 'Administración',
      periodo: 'Agosto 2025',
    },
    {
      id: 'pre-5',
      categoria: 'Marketing y Publicidad',
      presupuestado: 120000,
      ejecutado: 95000,
      departamento: 'Ventas y Marketing',
      periodo: 'Agosto 2025',
    },
    {
      id: 'pre-6',
      categoria: 'Tecnología e Infraestructura Cloud',
      presupuestado: 90000,
      ejecutado: 65000,
      departamento: 'TI y Desarrollo',
      periodo: 'Agosto 2025',
    },
  ],
  conciliaciones: [
    {
      id: 'con-1',
      cuenta: 'Banco Popular 960-123456',
      periodo: 'Agosto 2025',
      saldoBanco: 1450000,
      saldoLibros: 1450000,
      diferencia: 0,
      estado: 'Conciliado',
      movimientosVerificados: 18,
      movimientosPendientes: 0,
      fechaUltimaConciliacion: '12/08/2025',
    },
    {
      id: 'con-2',
      cuenta: 'Banco BHD 450-987654',
      periodo: 'Agosto 2025',
      saldoBanco: 765000,
      saldoLibros: 750000,
      diferencia: 15000,
      estado: 'En Proceso',
      movimientosVerificados: 12,
      movimientosPendientes: 2,
      fechaUltimaConciliacion: '10/08/2025',
    },
    {
      id: 'con-3',
      cuenta: 'Efectivo / Caja Chica',
      periodo: 'Agosto 2025',
      saldoBanco: 250000,
      saldoLibros: 250000,
      diferencia: 0,
      estado: 'Conciliado',
      movimientosVerificados: 9,
      movimientosPendientes: 0,
      fechaUltimaConciliacion: '11/08/2025',
    },
  ],
}

export const finanzasService = {
  getData: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return JSON.parse(stored)
    } catch (e) {
      console.warn('Error al leer de localStorage', e)
    }
    return INITIAL_FINANZAS_DATA
  },

  saveData: (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('Error al guardar en localStorage', e)
    }
  },

  addCuenta: (nueva) => {
    const data = finanzasService.getData()
    const id = 'cta-' + (data.cuentas.length + 1)
    const item = {
      id,
      nombre: `${nueva.banco} ${nueva.numeroCuenta || ''}`.trim(),
      banco: nueva.banco,
      tipo: nueva.tipo || 'Cuenta Corriente',
      numeroCuenta: nueva.numeroCuenta || `CTA-00${data.cuentas.length + 1}`,
      saldo: Number(nueva.saldoInicial) || 0,
      moneda: nueva.moneda || 'DOP',
      estado: 'Activa',
      icono: nueva.tipo === 'Efectivo' ? '💵' : nueva.tipo === 'Cuenta de Ahorros' ? '🏛️' : '🏦',
      titular: nueva.titular || 'APPES ERP SRL',
    }

    const updatedCuentas = [...data.cuentas, item]
    const updatedKpis = { ...data.kpis }
    updatedKpis.saldoCuentas.valor += item.saldo

    const nextData = {
      ...data,
      cuentas: updatedCuentas,
      kpis: updatedKpis,
    }
    finanzasService.saveData(nextData)
    return nextData
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
      numero:
        nuevo.numero ||
        (nuevo.tipo === 'Ingreso'
          ? `FV-000${125 + data.comprobantes.length}`
          : nuevo.tipo === 'Gasto'
          ? `EG-0000${89 + data.comprobantes.length}`
          : `TR-0000${34 + data.comprobantes.length}`),
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
      categoria: nuevo.categoria || (nuevo.tipo === 'Ingreso' ? 'Ventas' : 'Operativos'),
      clienteProveedor: nuevo.clienteProveedor || 'General',
    }

    const updatedComprobantes = [item, ...data.comprobantes]

    // Actualizar Cuentas y KPIs
    const updatedCuentas = data.cuentas.map((c) => {
      if (c.nombre === item.cuenta) {
        if (item.tipo === 'Ingreso') return { ...c, saldo: c.saldo + item.monto }
        if (item.tipo === 'Gasto') return { ...c, saldo: c.saldo - item.monto }
        if (item.tipo === 'Transferencia') return { ...c, saldo: c.saldo - item.monto }
      }
      if (item.tipo === 'Transferencia' && c.nombre === item.cuentaDestino) {
        return { ...c, saldo: c.saldo + item.monto }
      }
      return c
    })

    const updatedKpis = { ...data.kpis }
    if (item.tipo === 'Ingreso') {
      updatedKpis.ingresosMes.valor += item.monto
      updatedKpis.saldoCuentas.valor += item.monto
    } else if (item.tipo === 'Gasto') {
      updatedKpis.gastosMes.valor += item.monto
      updatedKpis.saldoCuentas.valor -= item.monto
    }
    updatedKpis.resultadoMes.valor = updatedKpis.ingresosMes.valor - updatedKpis.gastosMes.valor

    const nextData = {
      ...data,
      cuentas: updatedCuentas,
      kpis: updatedKpis,
      comprobantes: updatedComprobantes,
    }

    finanzasService.saveData(nextData)
    return nextData
  },

  addPresupuesto: (nuevo) => {
    const data = finanzasService.getData()
    const id = 'pre-' + (data.presupuestos.length + 1)
    const item = {
      id,
      categoria: nuevo.categoria,
      presupuestado: Number(nuevo.presupuestado) || 0,
      ejecutado: 0,
      departamento: nuevo.departamento || 'General',
      periodo: nuevo.periodo || 'Agosto 2025',
    }

    const nextData = {
      ...data,
      presupuestos: [...data.presupuestos, item],
    }
    finanzasService.saveData(nextData)
    return nextData
  },

  conciliarCuenta: (cuentaNombre) => {
    const data = finanzasService.getData()
    const updatedConciliaciones = data.conciliaciones.map((con) => {
      if (con.cuenta === cuentaNombre) {
        return {
          ...con,
          estado: 'Conciliado',
          diferencia: 0,
          movimientosPendientes: 0,
          fechaUltimaConciliacion: new Date().toLocaleDateString('es-DO'),
        }
      }
      return con
    })

    const nextData = {
      ...data,
      conciliaciones: updatedConciliaciones,
    }
    finanzasService.saveData(nextData)
    return nextData
  },
}
