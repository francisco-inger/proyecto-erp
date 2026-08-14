/*
  groqService.js — Servicio de integración con Groq AI API
  Módulo: AI Chatbot (appes.erp)
  
  Sincronizado completamente con las tablas/almacenamiento de la Base de Datos del ERP.
*/

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant'

// Lee la API key desde las variables de entorno de Vite
function getApiKey() {
  return import.meta.env.VITE_GROQ_API_KEY || ''
}

// ── Obtener datos en tiempo real de toda la Base de Datos del ERP ──────────────────

function getERPContext() {
  // 1. Ventas
  const ventas = JSON.parse(localStorage.getItem('ventas_orders_v1') || '[]')
  // 2. Compras
  const compras = JSON.parse(localStorage.getItem('compras_orders_v1') || '[]')
  // 3. Inventario
  const productos = JSON.parse(localStorage.getItem('appes_inventory_products_v1') || '[]')
  const categorias = JSON.parse(localStorage.getItem('appes_inventory_categories_v1') || '[]')
  const almacenes = JSON.parse(localStorage.getItem('appes_inventory_warehouses_v1') || '[]')
  // 4. CRM
  const clientesCRM = JSON.parse(localStorage.getItem('appes_crm_clients_v1') || '[]')
  const oportunidadesCRM = JSON.parse(localStorage.getItem('appes_crm_opportunities_v1') || '[]')

  // Cálculos consolidados
  const totalVentas = ventas.reduce((s, v) => s + (Number(v.total) || 0), 0)
  const totalCompras = compras.reduce((s, c) => s + (Number(c.total) || 0), 0)
  const ventasPendientes = ventas.filter(v => v.estado === 'Pendiente').length
  const comprasPendientes = compras.filter(c => c.estado === 'Pendiente').length

  const valorTotalInventario = productos.reduce((s, p) => s + (Number(p.stock || 0) * Number(p.costo || p.precio || 0)), 0)
  const stockCritico = productos.filter(p => Number(p.stock || 0) <= Number(p.stockMin || 10))

  const valorOportunidades = oportunidadesCRM.reduce((s, o) => s + (Number(o.valor) || 0), 0)

  return `
DATOS SINCRONIZADOS EN TIEMPO REAL CON LA BASE DE DATOS DE APPEX.ERP:

🛒 1. MÓDULO DE VENTAS (Tabla: sales_orders):
- Total de pedidos: ${ventas.length}
- Monto total facturado: RD$ ${totalVentas.toLocaleString('es-DO')}
- Pedidos pendientes: ${ventasPendientes}
- Lista detallada de órdenes:
${ventas.map(v => `  • [${v.numero || v.id}] ${v.cliente} | Monto: RD$ ${Number(v.total || 0).toLocaleString('es-DO')} | Estado: ${v.estado} | Fecha: ${v.fecha}`).join('\n')}

🏷️ 2. MÓDULO DE COMPRAS (Tabla: purchase_orders):
- Total de órdenes de compra: ${compras.length}
- Total gastado en compras: RD$ ${totalCompras.toLocaleString('es-DO')}
- Órdenes pendientes: ${comprasPendientes}
- Lista detallada de compras:
${compras.map(c => `  • [${c.id}] Proveedor: ${c.proveedor} | Monto: RD$ ${Number(c.total || 0).toLocaleString('es-DO')} | Estado: ${c.estado} | Fecha: ${c.fecha}`).join('\n')}

📦 3. MÓDULO DE INVENTARIO (Tablas: products, warehouses):
- Total de SKUs: ${productos.length}
- Valor total del inventario: RD$ ${valorTotalInventario.toLocaleString('es-DO')}
- Almacenes activos: ${almacenes.map(a => `${a.nombre} (${a.ubicacion})`).join(', ') || 'Almacén Principal'}
- Categorías: ${categorias.map(c => `${c.nombre} (${c.cantidad || 0} uds)`).join(', ')}
- Alerta Stock Crítico (${stockCritico.length} productos):
${stockCritico.map(p => `  ⚠️ ${p.nombre} (Stock: ${p.stock} | Mínimo: ${p.stockMin || 10} | Almacén: ${p.almacen || 'Principal'})`).join('\n')}

👥 4. MÓDULO DE CRM & CLIENTES (Tablas: crm_clients, opportunities):
- Clientes registrados: ${clientesCRM.length} (${clientesCRM.filter(c => c.estado === 'Activo').length} activos)
- Oportunidades comerciales abiertas: ${oportunidadesCRM.length} por un valor total de RD$ ${valorOportunidades.toLocaleString('es-DO')}
- Principales oportunidades:
${oportunidadesCRM.slice(0, 5).map(o => `  • ${o.nombre} (${o.cliente}) - RD$ ${Number(o.valor || 0).toLocaleString('es-DO')} | Etapa: ${o.etapa} | Probabilidad: ${o.probabilidad}%`).join('\n')}

💰 5. CONSOLIDADO FINANCIERO:
- Ingresos brutos: RD$ ${totalVentas.toLocaleString('es-DO')}
- Costo de compras: RD$ ${totalCompras.toLocaleString('es-DO')}
- Margen operacional bruto: RD$ ${(totalVentas - totalCompras).toLocaleString('es-DO')}
`
}

// ── System Prompt del Asistente ERP ──────────────────────────────────────────

function buildSystemPrompt() {
  const erpData = getERPContext()

  return `Eres el Asistente Inteligente oficial de appex.erp, conectado directamente a la base de datos empresarial.

Tu función es responder con absoluta precisión analítica a partir de los datos sincronizados del sistema.

REGLAS DE RESPUESTA:
1. Responde de forma clara, ejecutiva y estructurada con Markdown y viñetas (•).
2. Usa formato de moneda dominicana: "RD$ X,XXX.XX".
3. Cuando te pidan resúmenes o reportes, menciona los números exactos extraídos de la base de datos.
4. Si te piden una acción o recomendación, dala basándote en los datos críticos (como compras sugeridas si hay stock bajo).
5. Mantén un tono profesional, amigable y eficiente.

${erpData}`
}

// ── Función principal de chat con Groq ───────────────────────────────────────

export async function sendMessageToGroq(userMessage, conversationHistory = []) {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    return { success: false, text: generateDirectDbResponse(userMessage), error: 'API key no configurada' }
  }

  try {
    const systemPrompt = buildSystemPrompt()

    // Historial limpio para la conversación
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
    console.warn('Groq API error, usando respuesta de base de datos directa:', error.message)
    return { success: false, text: generateDirectDbResponse(userMessage), error: error.message }
  }
}

// ── Consulta directa a base de datos si no hay internet o falla la API ──────

function generateDirectDbResponse(msg) {
  const m = msg.toLowerCase()
  const ventas = JSON.parse(localStorage.getItem('ventas_orders_v1') || '[]')
  const compras = JSON.parse(localStorage.getItem('compras_orders_v1') || '[]')
  const productos = JSON.parse(localStorage.getItem('appes_inventory_products_v1') || '[]')
  const clientes = JSON.parse(localStorage.getItem('appes_crm_clients_v1') || '[]')

  const totalVentas = ventas.reduce((s, v) => s + (Number(v.total) || 0), 0)
  const totalCompras = compras.reduce((s, c) => s + (Number(c.total) || 0), 0)

  if (m.includes('venta') || m.includes('pedido')) {
    return `📊 **Datos directos de la BD (Ventas):**\n\n• **Total pedidos:** ${ventas.length}\n• **Total ventas:** RD$ ${totalVentas.toLocaleString('es-DO')}\n• **Pendientes:** ${ventas.filter(v => v.estado === 'Pendiente').length}\n\nÚltimo pedido registrado: **${ventas[0]?.numero || 'N/A'}** (${ventas[0]?.cliente || 'N/A'}) por RD$ ${Number(ventas[0]?.total || 0).toLocaleString('es-DO')}.`
  }

  if (m.includes('compra') || m.includes('proveedor')) {
    return `🏷️ **Datos directos de la BD (Compras):**\n\n• **Total órdenes:** ${compras.length}\n• **Monto en compras:** RD$ ${totalCompras.toLocaleString('es-DO')}\n• **Pendientes:** ${compras.filter(c => c.estado === 'Pendiente').length}`
  }

  if (m.includes('inventario') || m.includes('stock') || m.includes('producto')) {
    const criticos = productos.filter(p => Number(p.stock || 0) <= Number(p.stockMin || 10))
    return `📦 **Datos directos de la BD (Inventario):**\n\n• **Total SKUs:** ${productos.length}\n• **Productos con stock crítico:** ${criticos.length}\n\n${criticos.slice(0, 3).map(p => `• ${p.nombre} (Stock: ${p.stock})`).join('\n')}`
  }

  if (m.includes('cliente') || m.includes('crm')) {
    return `👥 **Datos directos de la BD (CRM):**\n\n• **Total clientes:** ${clientes.length}\n• **Clientes activos:** ${clientes.filter(c => c.estado === 'Activo').length}`
  }

  return `📊 **Resumen Global Sincronizado de la Base de Datos:**\n\n• **Ventas:** RD$ ${totalVentas.toLocaleString('es-DO')} (${ventas.length} órdenes)\n• **Compras:** RD$ ${totalCompras.toLocaleString('es-DO')} (${compras.length} órdenes)\n• **Productos en Inventario:** ${productos.length} SKUs\n• **Clientes CRM:** ${clientes.length} registrados\n• **Balance Neto Estimado:** RD$ ${(totalVentas - totalCompras).toLocaleString('es-DO')}`
}
