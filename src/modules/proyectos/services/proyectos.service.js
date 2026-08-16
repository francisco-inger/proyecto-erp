import { apiClient } from '../../../core/api/apiClient'
import { getTenantData, setTenantData, getActiveTenantId } from '../../../core/utils/formatters'

const STORAGE_KEY = 'appes_proyectos_data_v1'

const DEFAULT_PROYECTOS = [
  { id: 'PRY-01', nombre: 'Implementación ERP Web', cliente: 'Tech Solutions SRL', presupuesto: 850000, avance: 75, estado: 'En curso', fechaFin: '2026-08-21', responsable: 'Daniel Morales' },
  { id: 'PRY-02', nombre: 'Consultoría Estratégica TI', cliente: 'Comercial ABC', presupuesto: 650000, avance: 40, estado: 'En curso', fechaFin: '2026-09-10', responsable: 'Francisco Inger' },
]

export const proyectosService = {
  getProyectos: async () => {
    const tenantId = getActiveTenantId()
    const defaultVal = (tenantId === 'usr-1' || tenantId === 'usr-2' || tenantId === 'usr-admin-global') ? DEFAULT_PROYECTOS : []
    return getTenantData(STORAGE_KEY, defaultVal)
  },

  createProyecto: async (nuevo) => {
    const actuales = await proyectosService.getProyectos()
    const id = `PRY-0${actuales.length + 1}`
    const item = {
      id,
      nombre: nuevo.nombre,
      cliente: nuevo.cliente || 'Cliente General',
      presupuesto: Number(nuevo.presupuesto) || 0,
      avance: Number(nuevo.avance) || 0,
      estado: nuevo.estado || 'En curso',
      fechaFin: nuevo.fechaFin || '2026-09-30',
      responsable: nuevo.responsable || 'Administrador',
    }

    const updated = [item, ...actuales]
    setTenantData(STORAGE_KEY, updated)
    return updated
  },

  updateAvance: async (id, avance) => {
    const actuales = await proyectosService.getProyectos()
    const updated = actuales.map(p => p.id === id ? { ...p, avance: Number(avance), estado: avance >= 100 ? 'Completado' : p.estado } : p)
    setTenantData(STORAGE_KEY, updated)
    return updated
  }
}
