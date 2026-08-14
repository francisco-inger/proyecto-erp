/*
  proyectos.service.js — Servicio de Proyectos con sincronización a CRM y Finanzas
*/
import { apiClient } from '../../../core/api/apiClient'

const STORAGE_KEY = 'appes_proyectos_data_v1'

const DEFAULT_PROYECTOS = [
  { id: 'PRY-01', nombre: 'Implementación ERP Web', cliente: 'Tech Solutions SRL', presupuesto: 850000, avance: 75, estado: 'En curso', fechaFin: '2026-08-21', responsable: 'Daniel Morales' },
  { id: 'PRY-02', nombre: 'Consultoría Estratégica TI', cliente: 'Comercial ABC', presupuesto: 650000, avance: 40, estado: 'En curso', fechaFin: '2026-09-10', responsable: 'Francisco Inger' },
  { id: 'PRY-03', nombre: 'Sistema de Facturación POS', cliente: 'Distribuidora XYZ', presupuesto: 420000, avance: 90, estado: 'Revisión', fechaFin: '2026-08-15', responsable: 'Ediana Tejada' },
  { id: 'PRY-04', nombre: 'Migración Cloud e Infraestructura', cliente: 'Servicios Integrales RD', presupuesto: 1200000, avance: 100, estado: 'Completado', fechaFin: '2026-08-01', responsable: 'Daniel Morales' },
]

export const proyectosService = {
  getProyectos: async () => {
    let proyectos = DEFAULT_PROYECTOS

    // Sincronizar con oportunidades ganadas de CRM
    try {
      const rawCrm = localStorage.getItem('appes_crm_opportunities_v1')
      if (rawCrm) {
        const crmOpp = JSON.parse(rawCrm)
        const ganadas = crmOpp.filter(o => o.etapa === 'Cierre' || o.probabilidad >= 90)
        ganadas.forEach(g => {
          const yaExiste = proyectos.some(p => p.nombre.toLowerCase() === g.nombre.toLowerCase())
          if (!yaExiste) {
            proyectos.push({
              id: `PRY-0${proyectos.length + 1}`,
              nombre: g.nombre,
              cliente: g.cliente,
              presupuesto: g.valor,
              avance: 15,
              estado: 'En curso',
              fechaFin: g.fechaCierre || '2026-09-30',
              responsable: 'Equipo Proyectos',
            })
          }
        })
      }
    } catch (_) {}

    try {
      const local = localStorage.getItem(STORAGE_KEY)
      if (local) return JSON.parse(local)
    } catch (_) {}

    localStorage.setItem(STORAGE_KEY, JSON.stringify(proyectos))
    return proyectos
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  },

  updateAvance: async (id, avance) => {
    const actuales = await proyectosService.getProyectos()
    const updated = actuales.map(p => p.id === id ? { ...p, avance: Number(avance), estado: avance >= 100 ? 'Completado' : p.estado } : p)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  }
}
