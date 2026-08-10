/*
  MÓDULO PLUGINS · servicio
  Propietaria: Eliannys Hernández Guzmán.
  Proporciona datos dinámicos sobre los plugins instalados, destacados,
  categorías y métricas del sistema, conectándose con el core/moduleRegistry.
*/
import { getModules, setModuleEnabled } from 'core/moduleRegistry'

const FEATURED_PLUGINS = [
  {
    id: 'contabilidad-avanzada',
    nombre: 'Contabilidad Avanzada',
    categoria: 'Finanzas',
    color: '#157F5A',
    bgColor: '#E6F9F5',
    icon: '💲',
    descripcion: 'Módulo completo de contabilidad con reportes financieros avanzados.',
    rating: 4.8,
    reviews: 128,
    instalado: false,
  },
  {
    id: 'punto-de-venta',
    nombre: 'Punto de Venta',
    categoria: 'Ventas',
    color: '#1F3A93',
    bgColor: '#E8F0FE',
    icon: '🛒',
    descripcion: 'Sistema de punto de venta moderno con soporte para múltiples tiendas.',
    rating: 4.7,
    reviews: 96,
    instalado: false,
  },
  {
    id: 'manufactura',
    nombre: 'Manufactura',
    categoria: 'Inventario',
    color: '#6D28D9',
    bgColor: '#F3E8FF',
    icon: '📦',
    descripcion: 'Gestión completa de procesos de manufactura y producción.',
    rating: 4.6,
    reviews: 74,
    instalado: false,
  },
  {
    id: 'recursos-humanos-pro',
    nombre: 'Recursos Humanos',
    categoria: 'RRHH',
    color: '#B45309',
    bgColor: '#FEF3C7',
    icon: '👥',
    descripcion: 'Gestión de empleados, nómina y evaluaciones de desempeño.',
    rating: 4.7,
    reviews: 85,
    instalado: false,
  },
]

const INITIAL_INSTALLED = [
  { id: 'contabilidad', nombre: 'Contabilidad', categoria: 'Finanzas', color: '#157F5A', icon: '💲', version: '1.2.3', estado: 'Activo', ultimaAct: '15 May 2025' },
  { id: 'ventas-core', nombre: 'Ventas', categoria: 'Ventas', color: '#1F3A93', icon: '🛒', version: '2.1.0', estado: 'Activo', ultimaAct: '14 May 2025' },
  { id: 'inventario-core', nombre: 'Inventario', categoria: 'Inventario', color: '#B45309', icon: '📦', version: '1.8.2', estado: 'Activo', ultimaAct: '13 May 2025' },
  { id: 'crm-core', nombre: 'CRM', categoria: 'CRM', color: '#6D28D9', icon: '👥', version: '1.5.1', estado: 'Activo', ultimaAct: '12 May 2025' },
  { id: 'reportes-avanzados', nombre: 'Reportes Avanzados', categoria: 'Reportes', color: '#E11D48', icon: '📊', version: '1.0.5', estado: 'Activo', ultimaAct: '11 May 2025' },
]

const CATEGORIES = [
  { name: 'Todas', count: 48 },
  { name: 'Ventas', count: 8 },
  { name: 'Finanzas', count: 6 },
  { name: 'Inventario', count: 7 },
  { name: 'CRM', count: 5 },
  { name: 'RRHH', count: 4 },
  { name: 'Manufactura', count: 4 },
  { name: 'Reportes', count: 5 },
  { name: 'Integraciones', count: 3 },
  { name: 'Utilidades', count: 2 },
]

export const pluginManagerService = {
  getCoreModules: () => getModules(),
  toggleCoreModule: (id, enabled) => setModuleEnabled(id, enabled),
  getFeaturedPlugins: () => FEATURED_PLUGINS,
  getInstalledPlugins: () => INITIAL_INSTALLED,
  getCategories: () => CATEGORIES,
  getSystemInfo: () => ({
    version: '1.0.0',
    entorno: 'Producción',
    estado: 'Óptimo',
    uptime: '15d 4h 32m',
  }),
}
