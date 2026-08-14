/*
  groqService.js — Servicio de integración con Groq AI API & Motor NLP Local de APPEX.ERP
  Asistente Inteligente y Asesor Corporativo sincronizado con la Base de Datos y el Portafolio de Servicios.
*/

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant'

function getApiKey() {
  return import.meta.env.VITE_GROQ_API_KEY || ''
}

// ── Servicios Corporativos del Sistema ─────────────────────────────────────────
export const NUESTROS_SERVICIOS = [
  {
    id: 'srv-ventas',
    icono: '🛒',
    nombre: 'Ventas & Facturación Fiscal DGII (e-CF)',
    descripcion: 'Control integral del ciclo comercial: cotizaciones, pedidos, órdenes de entrega y emisión de facturas fiscales electrónicas autorizadas por la DGII (B01 Crédito Fiscal, B02 Consumo, B14 Regímenes Especiales, B15 Gubernamental y e-CF E31).'
  },
  {
    id: 'srv-compras',
    icono: '🛍️',
    nombre: 'Compras & Gestión de Proveedores',
    descripcion: 'Emisión de órdenes de compra con cálculo automático de costos e ITBIS, seguimiento de embarques, control de recepciones y sincronización directa con almacenes.'
  },
  {
    id: 'srv-inventario',
    icono: '📦',
    nombre: 'Inventario Multialmacén & Kardex en Tiempo Real',
    descripcion: 'Control de existencias multi-ubicación, registro automatizado de entradas y salidas, valoración contable por costo promedio / FIFO y alertas inteligentes de stock mínimo.'
  },
  {
    id: 'srv-crm',
    icono: '👥',
    nombre: 'CRM Comercial & Pipeline de Oportunidades',
    descripcion: 'Gestión de prospectos, clientes activos, contactos clave, embudo comercial por etapas de probabilidad y registro de interacciones comerciales.'
  },
  {
    id: 'srv-proyectos',
    icono: '🚀',
    nombre: 'Gestión de Proyectos & Tableros Kanban',
    descripcion: 'Planificación por tareas, hitos, asignación de colaboradores, control de cronogramas y análisis de rentabilidad por proyecto.'
  },
  {
    id: 'srv-finanzas',
    icono: '💳',
    nombre: 'Finanzas, Tesorería & Flujo de Caja',
    descripcion: 'Monitoreo de ingresos y egresos, balances bancarios multi-moneda (RD$, USD, EUR), conciliación bancaria y gestión de cuentas por cobrar y por pagar.'
  },
  {
    id: 'srv-reportes',
    icono: '📊',
    nombre: 'Reportes Ejecutivos & Business Intelligence',
    descripcion: 'Inteligencia de negocios con métricas en tiempo real, balances generales, estados de resultados y exportación a formatos PDF y Excel.'
  },
  {
    id: 'srv-integraciones',
    icono: '🌐',
    nombre: 'Integraciones, Webhooks & WhatsApp API',
    descripcion: 'Conexión con WhatsApp Business API para notificaciones directas a clientes, servidor de correo SMTP TLS, pasarelas de pago y automatizaciones con n8n.'
  },
  {
    id: 'srv-ia',
    icono: '🤖',
    nombre: 'Asistente IA 24/7 & Automatización de Procesos',
    descripcion: 'Consultas en lenguaje natural sobre cualquier dato operativo de la empresa, recomendaciones estratégicas y automatización de tareas.'
  }
]

// ── Obtener datos en tiempo real de toda la Base de Datos del ERP ──────────────────
export function getERPContext() {
  const ventas = JSON.parse(localStorage.getItem('ventas_orders_v1') || '[]')
  const compras = JSON.parse(localStorage.getItem('compras_orders_v1') || '[]')
  const productos = JSON.parse(localStorage.getItem('appes_inventory_products_v1') || '[]')
  const almacenes = JSON.parse(localStorage.getItem('appes_inventory_warehouses_v1') || '[]')
  const clientesCRM = JSON.parse(localStorage.getItem('appes_crm_clients_v1') || '[]')
  const oportunidadesCRM = JSON.parse(localStorage.getItem('appes_crm_opportunities_v1') || '[]')
  const contactosCRM = JSON.parse(localStorage.getItem('appes_crm_contacts_v1') || '[]')
  const finanzasData = JSON.parse(localStorage.getItem('appes_erp_finanzas_data_v3') || '{}')
  const cuentasBancos = finanzasData.cuentas || []
  const comprobantes = finanzasData.comprobantes || []
  const empleados = JSON.parse(localStorage.getItem('appes_rrhh_colaboradores_v1') || '[]')
  const settings = JSON.parse(localStorage.getItem('appes_erp_global_settings_v2') || '{}')

  const totalVentas = ventas.reduce((s, v) => s + (Number(v.total) || 0), 0)
  const totalCompras = compras.reduce((s, c) => s + (Number(c.total) || 0), 0)
  const ventasPendientes = ventas.filter(v => v.estado === 'Pendiente').length
  const comprasPendientes = compras.filter(c => c.estado === 'Pendiente').length

  const valorTotalInventario = productos.reduce((s, p) => s + (Number(p.stock || 0) * Number(p.costo || p.precio || 0)), 0)
  const stockCritico = productos.filter(p => Number(p.stock || 0) <= Number(p.stockMin || 10))

  const valorOportunidades = oportunidadesCRM.reduce((s, o) => s + (Number(o.valor) || 0), 0)
  const saldoTotalBancos = cuentasBancos.reduce((s, c) => s + (Number(c.saldo) || 0), 0)

  return `
PORTAFOLIO DE NUESTROS SERVICIOS EMPRESARIALES (APPEX ENTERPRISE SUITE):
1. Ventas & Facturación Electrónica DGII (e-CF): Emisión con NCF (B01, B02, B14, B15), cobros, cotizaciones.
2. Compras & Proveedores: Órdenes de compra, control de costos, recepción de mercancías.
3. Inventario Multialmacén: Existencias en vivo, kardex de entradas/salidas, alertas de stock mínimo.
4. CRM & Clientes: Pipeline comercial, seguimiento de oportunidades, cartera de clientes.
5. Proyectos & Kanban: Hitos, cronogramas, tareas operativas, rentabilidad.
6. Finanzas & Tesorería: Flujo de caja, cuentas por cobrar/pagar, cuentas bancarias.
7. Reportes & Business Intelligence: Informes financieros, balances y analíticas.
8. Integraciones & Webhooks: WhatsApp Business API, Servidor SMTP TLS, DGII y n8n.

DATOS EN TIEMPO REAL EXTRAÍDOS DE LA BASE DE DATOS LOCAL:
- Razón Social: ${settings.razonSocial || 'APPEX Dominicana Suite SRL'} (RNC: ${settings.rnc || '1-31-89023-4'})
- Ventas Totales: RD$ ${totalVentas.toLocaleString('es-DO')} (${ventas.length} órdenes, ${ventasPendientes} pendientes)
- Compras Totales: RD$ ${totalCompras.toLocaleString('es-DO')} (${compras.length} órdenes, ${comprasPendientes} pendientes)
- Utilidad Bruta Estimada: RD$ ${(totalVentas - totalCompras).toLocaleString('es-DO')}
- Inventario: ${productos.length} SKUs valorados en RD$ ${valorTotalInventario.toLocaleString('es-DO')} (${stockCritico.length} productos con stock crítico)
- Clientes en CRM: ${clientesCRM.length} registrados (${oportunidadesCRM.length} oportunidades activas por RD$ ${valorOportunidades.toLocaleString('es-DO')})
- Saldo en Bancos: RD$ ${saldoTotalBancos.toLocaleString('es-DO')} (${cuentasBancos.length} cuentas)
- Colaboradores (RRHH): ${empleados.length || 24} colaboradores activos
`
}

function buildSystemPrompt() {
  const erpData = getERPContext()

  return `Eres el Asistente Virtual Inteligente y Asesor Corporativo oficial de APPEX Enterprise Suite.
Tu objetivo es brindar soporte integral, presentar nuestros servicios a nuevos clientes y responder cualquier pregunta libre con precisión, amabilidad y profesionalismo.

INSTRUCCIONES CLAVE:
1. Si el usuario saluda o pregunta sobre la empresa o qué servicios ofrecemos, presenta con entusiasmo nuestros servicios clave (Ventas & DGII, Compras, Inventario, CRM, Proyectos, Finanzas, Reportes e Integraciones).
2. Si el usuario hace preguntas sobre los datos del negocio (ventas, productos, compras, bancos, clientes, etc.), usa las cifras exactas del contexto provisto.
3. Si el usuario hace preguntas conceptuales, técnicas, fiscales (DGII, ITBIS, NCF) o de asesoría de negocios, respóndelas con total claridad y experiencia.
4. Responde siempre con formato limpio usando Markdown, viñetas (•), negritas y formato de moneda dominicana (RD$ X,XXX.XX).
5. Mantén un tono ejecutivo, cordial y orientado a soluciones.

${erpData}`
}

export async function sendMessageToGroq(userMessage, conversationHistory = []) {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    return { success: false, text: generateDirectDbResponse(userMessage), error: 'API key no configurada' }
  }

  try {
    const systemPrompt = buildSystemPrompt()

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-8).map(m => ({
        role: m.type === 'user' ? 'user' : 'assistant',
        content: m.text,
      })),
      { role: 'user', content: userMessage },
    ]

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.6,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error?.message || `Error ${response.status} en la conexión`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('Respuesta vacía')
    }

    return { success: true, text: content, model: data.model }
  } catch (error) {
    console.warn('Groq API no disponible, usando motor NLP directo de base de datos:', error.message)
    return { success: false, text: generateDirectDbResponse(userMessage), error: error.message }
  }
}

// ── Motor NLP Local Autónomo con Conocimiento Completo ───────────────────────
export function generateDirectDbResponse(msg) {
  const m = msg.toLowerCase().trim()
  const ventas = JSON.parse(localStorage.getItem('ventas_orders_v1') || '[]')
  const compras = JSON.parse(localStorage.getItem('compras_orders_v1') || '[]')
  const productos = JSON.parse(localStorage.getItem('appes_inventory_products_v1') || '[]')
  const clientes = JSON.parse(localStorage.getItem('appes_crm_clients_v1') || '[]')
  const oportunidades = JSON.parse(localStorage.getItem('appes_crm_opportunities_v1') || '[]')
  const finanzasData = JSON.parse(localStorage.getItem('appes_erp_finanzas_data_v3') || '{}')
  const cuentas = finanzasData.cuentas || []
  const settings = JSON.parse(localStorage.getItem('appes_erp_global_settings_v2') || '{}')

  const totalVentas = ventas.reduce((s, v) => s + (Number(v.total) || 0), 0)
  const totalCompras = compras.reduce((s, c) => s + (Number(c.total) || 0), 0)
  const valorInventario = productos.reduce((s, p) => s + (Number(p.stock || 0) * Number(p.costo || p.precio || 0)), 0)
  const saldoBancos = cuentas.reduce((s, c) => s + (Number(c.saldo) || 0), 0)

  // 1. Saludos o preguntas sobre qué servicios ofrecemos
  if (
    m.includes('servicio') ||
    m.includes('que hacen') ||
    m.includes('que ofrecen') ||
    m.includes('ofreces') ||
    m.includes('quienes son') ||
    m.includes('hola') ||
    m.includes('buenos dias') ||
    m.includes('buenas tardes') ||
    m.includes('presentate') ||
    m.includes('ayuda') ||
    m === 'servicios'
  ) {
    return `👋 **¡Hola! Bienvenido a APPEX Enterprise Suite.**\n\nSoy tu Asistente Virtual Inteligente. Nuestra plataforma integral está diseñada para optimizar todas las operaciones de tu empresa. Aquí tienes **nuestros principales servicios y soluciones**:\n\n` +
      `🛒 **1. Ventas & Facturación Electrónica DGII (e-CF)**\n` +
      `• Emisión de cotizaciones, pedidos y facturas fiscales (B01 Crédito Fiscal, B02 Consumo, B14, B15).\n` +
      `• Cumplimiento total con las normativas fiscales de la DGII.\n\n` +
      `🛍️ **2. Compras & Proveedores**\n` +
      `• Emisión de órdenes de compra, control de costos, ITBIS y recepción automática en almacenes.\n\n` +
      `📦 **3. Inventario Multialmacén & Kardex**\n` +
      `• Control de existencias en tiempo real, valoración por costo promedio y alertas preventivas de stock mínimo.\n\n` +
      `👥 **4. CRM Comercial & Pipeline**\n` +
      `• Embudo de ventas, seguimiento de clientes y oportunidades de negocio.\n\n` +
      `🚀 **5. Proyectos & Tareas Kanban**\n` +
      `• Gestión visual del flujo de trabajo, cronogramas y rentabilidad operativa.\n\n` +
      `💳 **6. Finanzas, Bancos & Flujo de Caja**\n` +
      `• Conciliación bancaria, cuentas por cobrar/pagar y estado financiero en tiempo real.\n\n` +
      `🌐 **7. Integraciones & WhatsApp API**\n` +
      `• Envío de comprobantes por WhatsApp, notificaciones por correo SMTP y webhooks con n8n.\n\n` +
      `💬 *¿Deseas consultar datos específicos de tu empresa o profundizar en alguno de nuestros servicios?*`
  }

  // 2. Ventas y Facturación
  if (m.includes('venta') || m.includes('pedido') || m.includes('factura') || m.includes('facturacion') || m.includes('cotizacion')) {
    const pendientes = ventas.filter(v => v.estado === 'Pendiente').length
    const completadas = ventas.filter(v => v.estado === 'Completado' || v.estado === 'Entregado').length
    return `🛒 **Módulo de Ventas & Facturación (Datos en Tiempo Real):**\n\n` +
      `• **Total Facturado:** RD$ ${totalVentas.toLocaleString('es-DO')}\n` +
      `• **Órdenes Totales:** ${ventas.length} pedidos registrados\n` +
      `• **Pedidos Completados:** ${completadas}\n` +
      `• **Pedidos Pendientes:** ${pendientes}\n` +
      `• **Último Pedido:** ${ventas[0]?.numero || 'PED-1001'} (${ventas[0]?.cliente || 'Cliente General'}) por RD$ ${Number(ventas[0]?.total || 0).toLocaleString('es-DO')}\n\n` +
      `💡 *Servicio relacionado:* Puedes emitir nuevas facturas fiscales con comprobante DGII desde el módulo de Ventas.`
  }

  // 3. Compras y Proveedores
  if (m.includes('compra') || m.includes('proveedor') || m.includes('orden de compra') || m.includes('abastecer')) {
    const pendientes = compras.filter(c => c.estado === 'Pendiente').length
    return `🛍️ **Módulo de Compras & Proveedores (Datos en Tiempo Real):**\n\n` +
      `• **Total Invertido en Compras:** RD$ ${totalCompras.toLocaleString('es-DO')}\n` +
      `• **Órdenes de Compra:** ${compras.length} órdenes registradas\n` +
      `• **Órdenes Pendientes de Recepción:** ${pendientes}\n` +
      `• **Última Compra:** ${compras[0]?.id || 'OC-2026-001'} a ${compras[0]?.proveedor || 'Proveedor Autorizado'} por RD$ ${Number(compras[0]?.total || 0).toLocaleString('es-DO')}\n\n` +
      `💡 *Servicio relacionado:* Las compras recibidas actualizan automáticamente las existencias en el inventario.`
  }

  // 4. Inventario y Stock
  if (m.includes('inventario') || m.includes('stock') || m.includes('producto') || m.includes('almacen') || m.includes('kardex')) {
    const criticos = productos.filter(p => Number(p.stock || 0) <= Number(p.stockMin || 10))
    return `📦 **Módulo de Inventario & Almacén (Datos en Tiempo Real):**\n\n` +
      `• **Total de SKUs en Catálogo:** ${productos.length} productos\n` +
      `• **Valoración Total del Inventario:** RD$ ${valorInventario.toLocaleString('es-DO')}\n` +
      `• **Productos con Stock Crítico:** ${criticos.length} productos\n\n` +
      `⚠️ **Productos que requieren reabastecimiento urgente:**\n` +
      (criticos.length > 0
        ? criticos.slice(0, 4).map(p => `  • **${p.nombre}**: ${p.stock} unidades en existencia (Mínimo: ${p.stockMin || 10})`).join('\n')
        : '  • ¡Excelente! Todos los productos se encuentran sobre el umbral mínimo.') +
      `\n\n💡 *Servicio relacionado:* Puedes gestionar transferencias y kardex detallado desde el módulo de Inventario.`
  }

  // 5. Clientes y CRM
  if (m.includes('cliente') || m.includes('crm') || m.includes('contacto') || m.includes('lead') || m.includes('prospecto') || m.includes('oportunidad')) {
    const valorOps = oportunidades.reduce((s, o) => s + (Number(o.valor) || 0), 0)
    const activos = clientes.filter(c => c.estado === 'Activo').length
    return `👥 **Módulo CRM & Cartera de Clientes (Datos en Tiempo Real):**\n\n` +
      `• **Total Clientes:** ${clientes.length} registrados (${activos} activos)\n` +
      `• **Oportunidades Comerciales:** ${oportunidades.length} activas\n` +
      `• **Pipeline Total:** RD$ ${valorOps.toLocaleString('es-DO')}\n` +
      `• **Top Cliente:** ${clientes[0]?.nombre || 'Tech Solutions SRL'} (${clientes[0]?.telefono || '809-555-0192'})\n\n` +
      `💡 *Servicio relacionado:* Desde el CRM puedes dar seguimiento al embudo de ventas y sincronizar con WhatsApp.`
  }

  // 6. Finanzas, Tesorería y Bancos
  if (m.includes('finanza') || m.includes('banco') || m.includes('gasto') || m.includes('ingreso') || m.includes('flujo') || m.includes('utilidad') || m.includes('dinero') || m.includes('ganancia')) {
    const utilidad = totalVentas - totalCompras
    const margen = totalVentas > 0 ? ((utilidad / totalVentas) * 100).toFixed(1) : '0'
    return `💳 **Módulo de Finanzas & Tesorería (Datos en Tiempo Real):**\n\n` +
      `• **Ingresos por Ventas:** RD$ ${totalVentas.toLocaleString('es-DO')}\n` +
      `• **Egresos por Compras:** RD$ ${totalCompras.toLocaleString('es-DO')}\n` +
      `• **Utilidad Bruta Operativa:** RD$ ${utilidad.toLocaleString('es-DO')} (Margen: ${margen}%)\n` +
      `• **Saldo Total en Cuentas Bancarias:** RD$ ${saldoBancos.toLocaleString('es-DO')} (${cuentas.length} cuentas)\n\n` +
      `💡 *Servicio relacionado:* El módulo de Finanzas emite balances generales, reportes de NCF y estado de cuentas.`
  }

  // 7. DGII y Fiscal
  if (m.includes('dgii') || m.includes('ncf') || m.includes('itbis') || m.includes('fiscal') || m.includes('rnc') || m.includes('ecf')) {
    return `🏛️ **Cumplimiento Fiscal DGII & Facturación Electrónica:**\n\n` +
      `• **RNC Registrado:** ${settings.rnc || '1-31-89023-4'}\n` +
      `• **Régimen:** ${settings.regimenFiscal || 'Régimen Ordinario (DGII - ITBIS 18%)'}\n` +
      `• **Comprobantes Habilitados:** B01 (Crédito Fiscal), B02 (Consumo), B14 (Regímenes Especiales), B15 (Gubernamental), e-CF E31.\n` +
      `• **Cálculo de ITBIS:** Automatizado al 18% en cada pedido y factura.\n\n` +
      `💡 *Servicio relacionado:* Validamos e-CF en tiempo real mediante el conector del Hub de Integraciones.`
  }

  // 8. Integraciones y WhatsApp
  if (m.includes('whatsapp') || m.includes('integracion') || m.includes('api') || m.includes('webhook') || m.includes('n8n') || m.includes('correo') || m.includes('smtp')) {
    return `🌐 **Hub de Integraciones & Conectores Externos:**\n\n` +
      `• **WhatsApp Business Cloud API:** Envío de recibos de cobro y avisos de entrega directamente al celular del cliente.\n` +
      `• **Servidor SMTP TLS:** Envío de facturas en PDF y comprobantes electrónicos.\n` +
      `• **Conector DGII e-CF:** Transmisión y validación fiscal en línea.\n` +
      `• **n8n Workflows:** Automatización de flujos de inventario y alertas con IA.\n\n` +
      `💡 *Servicio relacionado:* Puedes gestionar y disparar acciones en vivo desde el módulo de Integraciones.`
  }

  // 9. Proyectos y Tareas
  if (m.includes('proyecto') || m.includes('tarea') || m.includes('kanban') || m.includes('cronograma')) {
    return `🚀 **Módulo de Gestión de Proyectos:**\n\n` +
      `• **Tableros Kanban:** Seguimiento visual por columnas (Por Hacer, En Proceso, En Revisión, Completado).\n` +
      `• **Control de Hitos & Entregables:** Monitoreo de plazos y cumplimiento.\n` +
      `• **Rentabilidad:** Comparación entre presupuesto asignado y costo real de horas trabajadas.\n\n` +
      `💡 *Servicio relacionado:* Vincula oportunidades ganadas en el CRM directamente con nuevos proyectos.`
  }

  // 10. Respuesta general analítica con resumen y servicios
  return `🤖 **Asistente Virtual APPEX ERP:**\n\n` +
    `He analizado tu consulta sobre "*${msg}*". A continuación, te comparto el estado actual del sistema:\n\n` +
    `• **Ventas:** RD$ ${totalVentas.toLocaleString('es-DO')} (${ventas.length} órdenes)\n` +
    `• **Compras:** RD$ ${totalCompras.toLocaleString('es-DO')} (${compras.length} órdenes)\n` +
    `• **Inventario:** ${productos.length} SKUs (Valor: RD$ ${valorInventario.toLocaleString('es-DO')})\n` +
    `• **Clientes Activos:** ${clientes.length} registrados en CRM\n` +
    `• **Saldo Bancario:** RD$ ${saldoBancos.toLocaleString('es-DO')}\n\n` +
    `🌟 **Nuestros Servicios Disponibles:** Ventas & e-CF DGII, Compras, Inventario, CRM, Proyectos, Finanzas, Reportes e Integraciones WhatsApp/SMTP.\n\n` +
    `💬 *¿Te gustaría que realice alguna acción específica o profundice en algún área de tu negocio?*`
}
