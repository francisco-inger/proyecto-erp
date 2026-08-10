/*
  Dashboard API Service — datos dinámicos desde el backend.
  Sigue el mismo patrón de apiClient del core.
*/
import { apiClient } from 'core/api/apiClient'

export const dashboardService = {
  /**
   * KPIs: ventas del mes, órdenes, clientes, ganancias.
   * Endpoint real: GET /api/dashboard/kpis
   * Si el backend no está disponible, devuelve datos de muestra.
   */
  async getKpis() {
    try {
      return await apiClient.get('/dashboard/kpis')
    } catch {
      return {
        ventasMes:   { value: 1250000, prev: 1108000 },
        ordenes:     { value: 320,     prev: 296 },
        clientes:    { value: 1245,    prev: 1073 },
        ganancias:   { value: 250000,  prev: 226500 },
      }
    }
  },

  /** Actividades recientes (últimas 4). */
  async getActividades() {
    try {
      return await apiClient.get('/dashboard/actividades')
    } catch {
      const now = new Date()
      const fmt = (d) => d.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })
      return [
        { id: 1, tipo: 'venta',   texto: 'Nueva venta #VTA-2025-001',       sub: 'Cliente: Juan Pérez',        hora: fmt(new Date(now - 60000 * 30)) },
        { id: 2, tipo: 'factura', texto: 'Factura generada #FAC-2025-001', sub: 'Cliente: Empresa ABC',       hora: fmt(new Date(now - 60000 * 90)) },
        { id: 3, tipo: 'cliente', texto: 'Nuevo cliente registrado',        sub: 'María Rodríguez',           hora: 'Ayer' },
        { id: 4, tipo: 'pago',    texto: 'Pago recibido #PAY-2025-001',    sub: 'Cliente: Constructora XYZ', hora: 'Ayer' },
      ]
    }
  },

  /** Inventario: totales de stock. */
  async getInventario() {
    try {
      return await apiClient.get('/dashboard/inventario')
    } catch {
      return {
        total:     1245,
        disponible: 890,
        stockBajo:  120,
        sinStock:    35,
      }
    }
  },

  /** Top productos. */
  async getTopProductos() {
    try {
      return await apiClient.get('/dashboard/top-productos')
    } catch {
      return [
        { nombre: 'Laptop Dell Inspiron',      precio: 45000, unidades: 120, img: '💻' },
        { nombre: 'iPhone 15 Pro',              precio: 65000, unidades: 85,  img: '📱' },
        { nombre: 'Auriculares Sony WH-1000XM5',precio: 12530, unidades: 150, img: '🎧' },
        { nombre: 'Monitor LG 24"',             precio: 18000, unidades: 65,  img: '🖥️' },
      ]
    }
  },

  /** Resumen financiero. */
  async getFinanciero() {
    try {
      return await apiClient.get('/dashboard/financiero')
    } catch {
      return {
        ingresos:  { value: 1250000, prev: 1108000 },
        gastos:    { value:  850000, prev:  808000 },
        utilidad:  { value:  400000, prev:  336000 },
        margen:    { value: 32,      prev: 30.3 },
      }
    }
  },

  /** Datos de la línea de ventas (30 días). */
  async getSalesChart() {
    try {
      return await apiClient.get('/dashboard/sales-chart')
    } catch {
      // Genera 30 puntos de datos simulados
      const base = 80000
      return Array.from({ length: 30 }, (_, i) => ({
        dia: i + 1,
        valor: Math.round(base + Math.random() * 120000 + i * 2800),
      }))
    }
  },

  /** Ventas por categoría (donut chart). */
  async getCategorias() {
    try {
      return await apiClient.get('/dashboard/categorias')
    } catch {
      return [
        { label: 'Productos',    pct: 45, color: '#1F3A93' },
        { label: 'Servicios',    pct: 25, color: '#0F766E' },
        { label: 'Suscripciones',pct: 20, color: '#B45309' },
        { label: 'Otros',        pct: 10, color: '#6D28D9' },
      ]
    }
  },

  /** Estado de integraciones externas. */
  async getIntegraciones() {
    try {
      return await apiClient.get('/dashboard/integraciones')
    } catch {
      return [
        { nombre: 'WhatsApp', status: 'Conectado', icon: '💬', color: '#157F5A' },
        { nombre: 'Email',    status: 'Conectado', icon: '✉️',  color: '#157F5A' },
        { nombre: 'n8n',      status: 'Conectado', icon: '⚙️',  color: '#157F5A' },
        { nombre: 'CRM',      status: 'Conectado', icon: '👥', color: '#157F5A' },
      ]
    }
  },
}
