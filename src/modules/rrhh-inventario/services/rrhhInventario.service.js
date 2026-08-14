/*
  MÓDULO INVENTARIO · servicio
  Propietario: Benjamin Serrano Aristy.
  Maneja persistencia en localStorage para productos, categorías, almacenes, movimientos y kardex.
*/
import { apiClient } from '../../../core/api/apiClient'

const STORAGE_KEYS = {
  PRODUCTS: 'appes_inventory_products_v1',
  CATEGORIES: 'appes_inventory_categories_v1',
  WAREHOUSES: 'appes_inventory_warehouses_v1',
  MOVEMENTS: 'appes_inventory_movements_v1',
}

const DEFAULT_PRODUCTS = [
  { id: 1, codigo: 'MED-001', nombre: 'Paracetamol 500mg', categoria: 'Medicamentos', stock: 450, stockMin: 50, ventasUds: 1250, ingresos: 125000, costo: 60, precio: 100, almacen: 'Almacén Principal', tendencia: [10, 15, 12, 18, 25, 30] },
  { id: 2, codigo: 'MED-002', nombre: 'Amoxicilina 500mg', categoria: 'Medicamentos', stock: 280, stockMin: 40, ventasUds: 980, ingresos: 98000, costo: 55, precio: 100, almacen: 'Almacén Principal', tendencia: [8, 12, 14, 16, 22, 28] },
  { id: 3, codigo: 'CUI-001', nombre: 'Alcohol 70%', categoria: 'Cuidado Personal', stock: 120, stockMin: 30, ventasUds: 750, ingresos: 75000, costo: 40, precio: 100, almacen: 'Sucursal Norte', tendencia: [15, 14, 18, 17, 20, 26] },
  { id: 4, codigo: 'SUP-001', nombre: 'Vitamina C 1000mg', categoria: 'Suplementos', stock: 95, stockMin: 25, ventasUds: 620, ingresos: 62000, costo: 50, precio: 100, almacen: 'Sucursal Este', tendencia: [10, 12, 11, 14, 13, 11] },
  { id: 5, codigo: 'MED-003', nombre: 'Ibuprofeno 400mg', categoria: 'Medicamentos', stock: 310, stockMin: 50, ventasUds: 580, ingresos: 58000, costo: 45, precio: 100, almacen: 'Almacén Principal', tendencia: [12, 11, 14, 10, 12, 9] },
  { id: 6, codigo: 'MED-004', nombre: 'Loratadina 10mg', categoria: 'Medicamentos', stock: 15, stockMin: 50, ventasUds: 310, ingresos: 31000, costo: 30, precio: 100, almacen: 'Almacén Principal', tendencia: [5, 8, 7, 9, 6, 4] },
  { id: 7, codigo: 'MED-005', nombre: 'Omeprazol 20mg', categoria: 'Medicamentos', stock: 18, stockMin: 40, ventasUds: 420, ingresos: 42000, costo: 35, precio: 100, almacen: 'Almacén Principal', tendencia: [6, 7, 8, 9, 8, 6] },
  { id: 8, codigo: 'CUI-002', nombre: 'Jarabe para la Tos', categoria: 'Cuidado Personal', stock: 10, stockMin: 30, ventasUds: 290, ingresos: 29000, costo: 45, precio: 100, almacen: 'Sucursal Norte', tendencia: [4, 5, 6, 7, 5, 3] },
  { id: 9, codigo: 'CUI-003', nombre: 'Crema Hidratante', categoria: 'Cuidado Personal', stock: 12, stockMin: 25, ventasUds: 210, ingresos: 21000, costo: 40, precio: 100, almacen: 'Sucursal Este', tendencia: [5, 6, 5, 7, 6, 5] },
  { id: 10, codigo: 'SUP-002', nombre: 'Complejo B', categoria: 'Suplementos', stock: 8, stockMin: 20, ventasUds: 180, ingresos: 18000, costo: 50, precio: 100, almacen: 'Almacén Principal', tendencia: [3, 4, 4, 5, 4, 3] },
]

const DEFAULT_CATEGORIES = [
  { id: 1, nombre: 'Medicamentos', porcentaje: 35, cantidad: 435, color: '#2563EB' },
  { id: 2, nombre: 'Cuidado Personal', porcentaje: 25, cantidad: 312, color: '#4F46E5' },
  { id: 3, nombre: 'Suplementos', porcentaje: 18, cantidad: 223, color: '#10B981' },
  { id: 4, nombre: 'Equipos Médicos', porcentaje: 12, cantidad: 149, color: '#F59E0B' },
  { id: 5, nombre: 'Otros', porcentaje: 10, cantidad: 126, color: '#EF4444' },
]

const DEFAULT_WAREHOUSES = [
  { id: 1, nombre: 'Almacén Principal', ubicacion: 'Santo Domingo Centro', capacidad: '85%', responsable: 'Carlos Mendez' },
  { id: 2, nombre: 'Sucursal Norte', ubicacion: 'Santiago de los Caballeros', capacidad: '62%', responsable: 'Patricia Ruiz' },
  { id: 3, nombre: 'Sucursal Este', ubicacion: 'Punta Cana', capacidad: '48%', responsable: 'Miguel Almonte' },
]

const DEFAULT_MOVEMENTS = [
  { id: 1, tipo: 'Entrada', producto: 'Paracetamol 500mg', almacen: 'Almacén Principal', cantidad: 500, fecha: '20/05/2025', usuario: 'Admin' },
  { id: 2, tipo: 'Salida', producto: 'Amoxicilina 500mg', almacen: 'Almacén Principal', cantidad: -120, fecha: '20/05/2025', usuario: 'Ventas' },
  { id: 3, tipo: 'Entrada', producto: 'Alcohol 70%', almacen: 'Sucursal Norte', cantidad: 300, fecha: '20/05/2025', usuario: 'Admin' },
  { id: 4, tipo: 'Salida', producto: 'Vitamina C 1000mg', almacen: 'Sucursal Este', cantidad: -80, fecha: '19/05/2025', usuario: 'Ventas' },
  { id: 5, tipo: 'Ajuste', producto: 'Ibuprofeno 400mg', almacen: 'Almacén Principal', cantidad: -10, fecha: '19/05/2025', usuario: 'Auditor' },
]

function getStored(key, def) {
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : def
  } catch {
    return def
  }
}

function setStored(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch (e) {
    console.error('Error saving inventory storage:', e)
  }
}

export const inventarioService = {
  // ── Productos ──
  listProducts: async () => {
    return getStored(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS)
  },

  addProduct: async (prod) => {
    const prods = getStored(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS)
    const newProd = {
      id: Date.now(),
      codigo: prod.codigo || `PROD-${Math.floor(100 + Math.random() * 900)}`,
      ventasUds: 0,
      ingresos: 0,
      tendencia: [5, 8, 12, 10, 15, 18],
      ...prod,
      stock: Number(prod.stock) || 0,
      stockMin: Number(prod.stockMin) || 10,
      precio: Number(prod.precio) || 100,
      costo: Number(prod.costo) || 50,
    }
    const updated = [newProd, ...prods]
    setStored(STORAGE_KEYS.PRODUCTS, updated)

    // Registrar movimiento inicial de entrada
    if (newProd.stock > 0) {
      await inventarioService.addMovement({
        tipo: 'Entrada',
        producto: newProd.nombre,
        almacen: newProd.almacen || 'Almacén Principal',
        cantidad: newProd.stock,
        fecha: new Date().toLocaleDateString('es-DO'),
        usuario: 'Admin',
      })
    }

    return newProd
  },

  updateProductStock: async (id, newStock) => {
    const prods = getStored(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS)
    const updated = prods.map((p) => (p.id === id ? { ...p, stock: Number(newStock) } : p))
    setStored(STORAGE_KEYS.PRODUCTS, updated)
    return updated
  },

  deleteProduct: async (id) => {
    const prods = getStored(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS)
    const updated = prods.filter((p) => p.id !== id)
    setStored(STORAGE_KEYS.PRODUCTS, updated)
    return updated
  },

  // ── Categorías ──
  listCategories: async () => {
    return getStored(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES)
  },

  addCategory: async (cat) => {
    const cats = getStored(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES)
    const newCat = {
      id: Date.now(),
      porcentaje: 0,
      cantidad: 0,
      color: '#6366F1',
      ...cat,
    }
    const updated = [...cats, newCat]
    setStored(STORAGE_KEYS.CATEGORIES, updated)
    return newCat
  },

  // ── Almacenes ──
  listWarehouses: async () => {
    return getStored(STORAGE_KEYS.WAREHOUSES, DEFAULT_WAREHOUSES)
  },

  // ── Movimientos ──
  listMovements: async () => {
    return getStored(STORAGE_KEYS.MOVEMENTS, DEFAULT_MOVEMENTS)
  },

  addMovement: async (mov) => {
    const movs = getStored(STORAGE_KEYS.MOVEMENTS, DEFAULT_MOVEMENTS)
    const newMov = {
      id: Date.now(),
      fecha: mov.fecha || new Date().toLocaleDateString('es-DO'),
      ...mov,
      cantidad: Number(mov.cantidad) || 0,
    }
    const updated = [newMov, ...movs]
    setStored(STORAGE_KEYS.MOVEMENTS, updated)

    // Actualizar stock del producto automáticamente
    const prods = getStored(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS)
    const prodIndex = prods.findIndex((p) => p.nombre.toLowerCase() === mov.producto.toLowerCase())
    if (prodIndex !== -1) {
      prods[prodIndex].stock = Math.max(0, prods[prodIndex].stock + newMov.cantidad)
      setStored(STORAGE_KEYS.PRODUCTS, prods)
    }

    return newMov
  },

  // ── Estadísticas Históricas ──
  getHistoryValuation: async () => {
    return [
      { mes: 'Dic 2024', valor: 1800000 },
      { mes: 'Ene 2025', valor: 2400000 },
      { mes: 'Feb 2025', valor: 3100000 },
      { mes: 'Mar 2025', valor: 4200000 },
      { mes: 'Abr 2025', valor: 3600000 },
      { mes: 'May 2025', valor: 4250000 },
    ]
  },
}

// Mantener compatibilidad con importaciones previas
export const rrhhInventarioService = {
  ...inventarioService,
  listEmployees: () => apiClient.get('/rrhh/employees'),
  listInventory: () => inventarioService.listProducts(),
}

