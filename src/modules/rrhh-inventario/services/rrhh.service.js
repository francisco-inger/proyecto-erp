/* rrhh.service.js — Servicio de Recursos Humanos con multi-tenant por empresa */
import { getTenantData, setTenantData, getActiveTenantId } from '../../../core/utils/formatters'

const KEY = 'rrhh_data_v1'

function getStore() {
  const tenantId = getActiveTenantId()
  const isGlobalAdmin = (tenantId === 'usr-1' || tenantId === 'usr-2' || tenantId === 'usr-admin-global')
  const defaultVal = isGlobalAdmin ? seed() : { empleados: [], asistencia: [], nomina: [], vacaciones: [], desempeno: [], reclutamiento: [] }
  return getTenantData(KEY, defaultVal)
}

function saveStore(data) {
  setTenantData(KEY, data)
}

// ── Datos semilla ──────────────────────────────────────────────────────────────
function seed() {
  return {
    empleados: [
      { id: 'e1', nombre: 'Ana Martínez', cargo: 'Gerente de Ventas', departamento: 'Ventas', fechaIngreso: '15/01/2021', tipoContrato: 'Indefinido', estado: 'Activo', salario: 85000, email: 'ana@empresa.com', telefono: '809-555-0101', avatar: 'AM' },
      { id: 'e2', nombre: 'Juan Pérez', cargo: 'Gerente de Almacén', departamento: 'Almacén', fechaIngreso: '20/03/2020', tipoContrato: 'Indefinido', estado: 'Activo', salario: 75000, email: 'juan@empresa.com', telefono: '809-555-0102', avatar: 'JP' },
      { id: 'e3', nombre: 'María Rodríguez', cargo: 'Coordinadora de Compras', departamento: 'Compras', fechaIngreso: '02/05/2021', tipoContrato: 'Indefinido', estado: 'Activo', salario: 72000, email: 'maria@empresa.com', telefono: '809-555-0103', avatar: 'MR' },
      { id: 'e4', nombre: 'Carlos Hernández', cargo: 'Contador General', departamento: 'Contabilidad', fechaIngreso: '10/08/2019', tipoContrato: 'Indefinido', estado: 'Activo', salario: 90000, email: 'carlos@empresa.com', telefono: '809-555-0104', avatar: 'CH' },
      { id: 'e5', nombre: 'Laura Jiménez', cargo: 'Directora de RRHH', departamento: 'Recursos Humanos', fechaIngreso: '15/02/2018', tipoContrato: 'Indefinido', estado: 'Activo', salario: 95000, email: 'laura@empresa.com', telefono: '809-555-0105', avatar: 'LJ' },
      { id: 'e6', nombre: 'Pedro Sánchez', cargo: 'Supervisor de Almacén', departamento: 'Almacén', fechaIngreso: '12/09/2022', tipoContrato: 'Temporal', estado: 'Activo', salario: 65000, email: 'pedro@empresa.com', telefono: '809-555-0106', avatar: 'PS' },
      { id: 'e7', nombre: 'Sofía López', cargo: 'Ejecutiva de Ventas', departamento: 'Ventas', fechaIngreso: '03/11/2023', tipoContrato: 'Indefinido', estado: 'Activo', salario: 60000, email: 'sofia@empresa.com', telefono: '809-555-0107', avatar: 'SL' },
      { id: 'e8', nombre: 'Miguel Torres', cargo: 'Desarrollador TI', departamento: 'TI / Sistemas', fechaIngreso: '22/06/2020', tipoContrato: 'Indefinido', estado: 'Inactivo', salario: 88000, email: 'miguel@empresa.com', telefono: '809-555-0108', avatar: 'MT' },
    ],
    asistencia: [
      { id: 'a1', empleado: 'Ana Martínez', fecha: '30/05/2025', entrada: '08:00 AM', salida: '05:00 PM', horasTrabajadas: '8h 00m', estado: 'Presente', observacion: '' },
      { id: 'a2', empleado: 'Juan Pérez', fecha: '30/05/2025', entrada: '08:15 AM', salida: '05:00 PM', horasTrabajadas: '7h 45m', estado: 'Presente', observacion: 'Llegó tarde' },
      { id: 'a3', empleado: 'María Rodríguez', fecha: '30/05/2025', entrada: '08:00 AM', salida: '03:00 PM', horasTrabajadas: '7h 00m', estado: 'Presente', observacion: 'Salió temprano' },
      { id: 'a4', empleado: 'Carlos Hernández', fecha: '30/05/2025', entrada: '--', salida: '--', horasTrabajadas: '--', estado: 'Ausente', observacion: 'Permiso personal' },
      { id: 'a5', empleado: 'Laura Jiménez', fecha: '30/05/2025', entrada: '09:00 AM', salida: '06:00 PM', horasTrabajadas: '9h 00m', estado: 'Presente', observacion: '' },
      { id: 'a6', empleado: 'Pedro Sánchez', fecha: '30/05/2025', entrada: '08:00 AM', salida: '05:00 PM', horasTrabajadas: '8h 00m', estado: 'Presente', observacion: '' },
    ],
    nomina: [
      { id: 'n1', empleado: 'Ana Martínez', cargo: 'Gerente de Ventas', salarioBase: 85000, bonificaciones: 8500, deducciones: 9350, netoPagar: 84150, estado: 'Calculado' },
      { id: 'n2', empleado: 'Juan Pérez', cargo: 'Gerente de Almacén', salarioBase: 75000, bonificaciones: 5000, deducciones: 8000, netoPagar: 72000, estado: 'Calculado' },
      { id: 'n3', empleado: 'María Rodríguez', cargo: 'Coordinadora de Compras', salarioBase: 72000, bonificaciones: 3600, deducciones: 7920, netoPagar: 67680, estado: 'Calculado' },
      { id: 'n4', empleado: 'Carlos Hernández', cargo: 'Contador General', salarioBase: 90000, bonificaciones: 9000, deducciones: 9900, netoPagar: 89100, estado: 'Calculado' },
      { id: 'n5', empleado: 'Laura Jiménez', cargo: 'Directora de RRHH', salarioBase: 95000, bonificaciones: 9500, deducciones: 10450, netoPagar: 94050, estado: 'Calculado' },
      { id: 'n6', empleado: 'Pedro Sánchez', cargo: 'Supervisor de Almacén', salarioBase: 65000, bonificaciones: 3250, deducciones: 7150, netoPagar: 61100, estado: 'Pendiente' },
      { id: 'n7', empleado: 'Sofía López', cargo: 'Ejecutiva de Ventas', salarioBase: 60000, bonificaciones: 6000, deducciones: 6600, netoPagar: 59400, estado: 'Pendiente' },
    ],
    vacaciones: [
      { id: 'v1', empleado: 'Ana Martínez', departamento: 'Ventas', fechaInicio: '01/06/2025', fechaFin: '08/06/2025', dias: 7, estado: 'Aprobada', solicitadoEl: '20/05/2025' },
      { id: 'v2', empleado: 'Juan Pérez', departamento: 'Almacén', fechaInicio: '15/06/2025', fechaFin: '22/06/2025', dias: 7, estado: 'Aprobada', solicitadoEl: '01/05/2025' },
      { id: 'v3', empleado: 'María Rodríguez', departamento: 'Compras', fechaInicio: '10/07/2025', fechaFin: '24/07/2025', dias: 14, estado: 'Pendiente', solicitadoEl: '25/05/2025' },
      { id: 'v4', empleado: 'Luis Gómez', departamento: 'Administración', fechaInicio: '18/06/2025', fechaFin: '25/06/2025', dias: 7, estado: 'Rechazada', solicitadoEl: '10/05/2025' },
      { id: 'v5', empleado: 'Carlos Hernández', departamento: 'Contabilidad', fechaInicio: '01/07/2025', fechaFin: '07/07/2025', dias: 6, estado: 'Aprobada', solicitadoEl: '15/05/2025' },
    ],
    desempeno: [
      { id: 'd1', empleado: 'Ana Martínez', cargo: 'Gerente de Ventas', departamento: 'Ventas', puntaje: 95, nivel: 'Excelente', evaluador: 'Carlos Hernández', fecha: '31/05/2025', comentario: 'Supera todas las metas.' },
      { id: 'd2', empleado: 'Juan Pérez', cargo: 'Gerente de Almacén', departamento: 'Almacén', puntaje: 88, nivel: 'Bueno', evaluador: 'Pedro Sánchez', fecha: '31/05/2025', comentario: 'Buen desempeño general.' },
      { id: 'd3', empleado: 'María Rodríguez', cargo: 'Coordinadora de Compras', departamento: 'Compras', puntaje: 78, nivel: 'Bueno', evaluador: 'Luis Gómez', fecha: '30/05/2025', comentario: 'Cumple con lo esperado.' },
      { id: 'd4', empleado: 'Carlos Hernández', cargo: 'Contador General', departamento: 'Contabilidad', puntaje: 92, nivel: 'Excelente', evaluador: 'Laura Jiménez', fecha: '31/05/2025', comentario: 'Excelente manejo financiero.' },
      { id: 'd5', empleado: 'Laura Jiménez', cargo: 'Directora de RRHH', departamento: 'RRHH', puntaje: 60, nivel: 'Regular', evaluador: 'Carlos Hernández', fecha: '28/05/2025', comentario: 'Necesita mejorar procesos.' },
      { id: 'd6', empleado: 'Pedro Sánchez', cargo: 'Supervisor de Almacén', departamento: 'Almacén', puntaje: 45, nivel: 'Necesita Mejora', evaluador: 'Juan Pérez', fecha: '29/05/2025', comentario: 'Requiere capacitación urgente.' },
    ],
    candidatos: [
      { id: 'c1', nombre: 'Pedro Ramírez', cargo: 'Auxiliar de Contabilidad', departamento: 'Contabilidad', etapa: 'Entrevista', fecha: '20/05/2025', estado: 'Activo', email: 'pedro.ramirez@mail.com' },
      { id: 'c2', nombre: 'Laura Méndez', cargo: 'Vendedor', departamento: 'Ventas', etapa: 'Prueba Técnica', fecha: '18/05/2025', estado: 'Activo', email: 'laura.mendez@mail.com' },
      { id: 'c3', nombre: 'Carlos García', cargo: 'Almacenista', departamento: 'Almacén', etapa: 'Aplicación', fecha: '22/05/2025', estado: 'Activo', email: 'carlos.garcia@mail.com' },
      { id: 'c4', nombre: 'Ana Vásquez', cargo: 'Desarrolladora Jr.', departamento: 'TI / Sistemas', etapa: 'Oferta', fecha: '15/05/2025', estado: 'Activo', email: 'ana.vasquez@mail.com' },
      { id: 'c5', nombre: 'Miguel Díaz', cargo: 'Asistente Administrativo', departamento: 'Administración', etapa: 'Contratado con Éxito', fecha: '10/05/2025', estado: 'Contratado', email: 'miguel.diaz@mail.com' },
    ],
  }
}

export const rrhhService = {
  // ── Empleados ────────────────────────────────────────────────────────────
  async listEmpleados() {
    const s = getStore() || seed()
    if (!getStore()) saveStore(seed())
    return s.empleados
  },
  async addEmpleado(emp) {
    const s = getStore() || seed()
    s.empleados.push({ ...emp, id: 'e' + Date.now() })
    saveStore(s)
    return s.empleados
  },
  async updateEmpleado(id, changes) {
    const s = getStore() || seed()
    s.empleados = s.empleados.map((e) => e.id === id ? { ...e, ...changes } : e)
    saveStore(s)
    return s.empleados
  },
  async deleteEmpleado(id) {
    const s = getStore() || seed()
    s.empleados = s.empleados.filter((e) => e.id !== id)
    saveStore(s)
    return s.empleados
  },

  // ── Asistencia ───────────────────────────────────────────────────────────
  async listAsistencia() {
    const s = getStore() || seed()
    if (!getStore()) saveStore(seed())
    return s.asistencia
  },
  async registrarAsistencia(reg) {
    const s = getStore() || seed()
    s.asistencia.unshift({ ...reg, id: 'a' + Date.now() })
    saveStore(s)
    return s.asistencia
  },

  // ── Nómina ───────────────────────────────────────────────────────────────
  async listNomina() {
    const s = getStore() || seed()
    if (!getStore()) saveStore(seed())
    return s.nomina
  },
  async marcarPagado(id) {
    const s = getStore() || seed()
    s.nomina = s.nomina.map((n) => n.id === id ? { ...n, estado: 'Pagado' } : n)
    saveStore(s)
    return s.nomina
  },

  // ── Vacaciones ───────────────────────────────────────────────────────────
  async listVacaciones() {
    const s = getStore() || seed()
    if (!getStore()) saveStore(seed())
    return s.vacaciones
  },
  async addVacacion(vac) {
    const s = getStore() || seed()
    s.vacaciones.unshift({ ...vac, id: 'v' + Date.now(), estado: 'Pendiente', solicitadoEl: new Date().toLocaleDateString('es-DO') })
    saveStore(s)
    return s.vacaciones
  },
  async updateVacacion(id, estado) {
    const s = getStore() || seed()
    s.vacaciones = s.vacaciones.map((v) => v.id === id ? { ...v, estado } : v)
    saveStore(s)
    return s.vacaciones
  },

  // ── Desempeño ────────────────────────────────────────────────────────────
  async listDesempeno() {
    const s = getStore() || seed()
    if (!getStore()) saveStore(seed())
    return s.desempeno
  },
  async addEvaluacion(ev) {
    const s = getStore() || seed()
    s.desempeno.unshift({ ...ev, id: 'd' + Date.now() })
    saveStore(s)
    return s.desempeno
  },

  // ── Candidatos (Reclutamiento) ───────────────────────────────────────────
  async listCandidatos() {
    const s = getStore() || seed()
    if (!getStore()) saveStore(seed())
    return s.candidatos
  },
  async addCandidato(can) {
    const s = getStore() || seed()
    s.candidatos.unshift({ ...can, id: 'c' + Date.now(), estado: 'Activo', fecha: new Date().toLocaleDateString('es-DO') })
    saveStore(s)
    return s.candidatos
  },
  async updateCandidato(id, changes) {
    const s = getStore() || seed()
    s.candidatos = s.candidatos.map((c) => c.id === id ? { ...c, ...changes } : c)
    saveStore(s)
    return s.candidatos
  },
  async deleteCandidato(id) {
    const s = getStore() || seed()
    s.candidatos = s.candidatos.filter((c) => c.id !== id)
    saveStore(s)
    return s.candidatos
  },
}
