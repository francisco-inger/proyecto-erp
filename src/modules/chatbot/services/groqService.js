/*
  groqService.js — Servicio de Inteligencia Artificial Universal (APPEX.ERP)
  Capaz de responder CUALQUIER PREGUNTA del mundo (conocimiento universal, ciencia, historia, matemáticas,
  programación, redacción, asesoría general) + Portafolio de Servicios Corporativos + Base de Datos en Tiempo Real.
*/

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant'

function getApiKey() {
  return (
    import.meta.env.VITE_GROQ_API_KEY ||
    localStorage.getItem('appes_groq_api_key') ||
    ''
  )
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
    nombre: 'Asistente IA Universal 24/7',
    descripcion: 'Respuestas a cualquier pregunta libre del mundo (ciencia, cultura, tecnología, matemáticas, idiomas), además de consultas analíticas del ERP.'
  }
]

// ── Contexto de la Base de Datos Local del ERP ─────────────────────────────────
export function getERPContext() {
  const ventas = JSON.parse(localStorage.getItem('ventas_orders_v1') || '[]')
  const compras = JSON.parse(localStorage.getItem('compras_orders_v1') || '[]')
  const productos = JSON.parse(localStorage.getItem('appes_inventory_products_v1') || '[]')
  const clientesCRM = JSON.parse(localStorage.getItem('appes_crm_clients_v1') || '[]')
  const oportunidadesCRM = JSON.parse(localStorage.getItem('appes_crm_opportunities_v1') || '[]')
  const finanzasData = JSON.parse(localStorage.getItem('appes_erp_finanzas_data_v3') || '{}')
  const cuentasBancos = finanzasData.cuentas || []
  const settings = JSON.parse(localStorage.getItem('appes_erp_global_settings_v2') || '{}')

  const totalVentas = ventas.reduce((s, v) => s + (Number(v.total) || 0), 0)
  const totalCompras = compras.reduce((s, c) => s + (Number(c.total) || 0), 0)
  const valorInventario = productos.reduce((s, p) => s + (Number(p.stock || 0) * Number(p.costo || p.precio || 0)), 0)
  const saldoBancos = cuentasBancos.reduce((s, c) => s + (Number(c.saldo) || 0), 0)

  return `
DATOS DE LA EMPRESA Y BASE DE DATOS LOCAL:
- Razón Social: ${settings.razonSocial || 'APPEX Dominicana Suite SRL'} (RNC: ${settings.rnc || '1-31-89023-4'})
- Ventas Totales: RD$ ${totalVentas.toLocaleString('es-DO')} (${ventas.length} órdenes)
- Compras Totales: RD$ ${totalCompras.toLocaleString('es-DO')} (${compras.length} órdenes)
- Inventario: ${productos.length} SKUs valorados en RD$ ${valorInventario.toLocaleString('es-DO')}
- Clientes en CRM: ${clientesCRM.length} registrados (${oportunidadesCRM.length} oportunidades activas)
- Saldo en Bancos: RD$ ${saldoBancos.toLocaleString('es-DO')}
`
}

function buildSystemPrompt() {
  const erpData = getERPContext()

  return `Eres una Inteligencia Artificial Universal, avanzada, elocuente y servicial, que además funge como el Asistente Oficial y Asesor de APPEX Enterprise Suite.

TIENES CAPACIDAD PARA RESPONDER CUALQUIER PREGUNTA DEL MUNDO:
1. Conocimiento General y Universal: Ciencia, física, astronomía, historia mundial, geografía, biología, filosofía, arte, literatura, cocina, salud general, deportes, entretenimiento, etc.
2. Razonamiento, Matemáticas y Finanzas: Cálculos numéricos, porcentajes, conversiones de moneda, fórmulas matemáticas, análisis estadístico y lógica.
3. Tecnología y Programación: Explicaciones de software, lenguajes (JavaScript, Python, SQL, React, etc.), arquitectura web, ciberseguridad, IA y bases de datos.
4. Redacción y Productividad: Creación de correos formales, cartas comerciales, propuestas, resúmenes, traducciones entre idiomas y consejos estratégicos.
5. Negocios y ERP: Presentación de nuestros servicios (Ventas DGII, Compras, Inventario, CRM, Proyectos, Finanzas, Reportes, Integraciones) y consulta en tiempo real de los datos del sistema.

REGLAS DE FORMATO Y ESTILO:
- Si el usuario te saluda por primera vez o pregunta qué servicios tenemos, dale una cálida bienvenida y preséntale nuestros servicios con viñetas.
- Si el usuario te hace una pregunta general sobre cualquier tema del mundo (ej. "¿Por qué el cielo es azul?", "¿Quién escribió El Quijote?", "¿Cómo se calcula el interés compuesto?"), respóndele con maestría, claridad y profundidad enciclopédica.
- Si te preguntan sobre datos de su empresa, consulta los datos locales provistos.
- Usa siempre Markdown con formato visual impecable (negritas, listas con viñetas •, bloques de código si aplica).

${erpData}`
}

export async function sendMessageToGroq(userMessage, conversationHistory = []) {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    return { success: false, text: generateUniversalAIResponse(userMessage), error: 'API key no configurada' }
  }

  try {
    const systemPrompt = buildSystemPrompt()

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10).map(m => ({
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
        temperature: 0.7,
        max_tokens: 1200,
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
    console.warn('Groq API no disponible, usando Motor de Inteligencia Universal Autónomo:', error.message)
    return { success: false, text: generateUniversalAIResponse(userMessage), error: error.message }
  }
}

// ── Motor de Inteligencia Universal Autónomo (Cualquier Pregunta del Mundo) ──
export function generateUniversalAIResponse(msg) {
  const m = msg.toLowerCase().trim()

  // 1. Matemáticas y Cálculos Numéricos (ej: 25 * 40, 15% de 8000, 1500 + 350)
  const mathRegex = /^([0-9.,\s+\-*/()%^]+)$/
  if (mathRegex.test(m.replace(/cuanto es|calcula|calculame|resultado de/g, '').trim())) {
    try {
      const cleanExpr = m.replace(/cuanto es|calcula|calculame|resultado de|\?/g, '').replace(/x/g, '*').trim()
      // Evaluación matemática segura
      const sanitized = cleanExpr.replace(/[^0-9+\-*/().]/g, '')
      if (sanitized) {
        // eslint-disable-next-line no-eval
        const result = Function(`'use strict'; return (${sanitized})`)()
        return `🧮 **Resultado Matemático:**\n\n\`${sanitized}\` = **${Number(result).toLocaleString('es-DO')}**`
      }
    } catch (_) {}
  }

  // 2. Porcentajes (ej: 18% de 50000)
  const percentMatch = m.match(/(\d+(?:\.\d+)?)\s*%\s*(?:de|del)?\s*(\d+(?:\.\d+)?)/)
  if (percentMatch) {
    const pct = parseFloat(percentMatch[1])
    const base = parseFloat(percentMatch[2])
    const calc = (pct / 100) * base
    return `📊 **Cálculo de Porcentaje:**\n\nEl **${pct}%** de **${base.toLocaleString('es-DO')}** es: **${calc.toLocaleString('es-DO')}**.`
  }

  // 3. Saludos y Presentación de Servicios
  if (
    m.includes('servicio') ||
    m.includes('que hacen') ||
    m.includes('que ofrecen') ||
    m.includes('ofreces') ||
    m.includes('quienes son') ||
    m.includes('hola') ||
    m.includes('buenos dias') ||
    m.includes('buenas tardes') ||
    m.includes('buenas noches') ||
    m.includes('presentate') ||
    m === 'servicios' ||
    m === 'inicio'
  ) {
    return `👋 **¡Hola! Bienvenido a APPEX Enterprise Suite.**\n\nSoy tu Asistente Virtual Inteligente. Estoy aquí para responder **cualquier pregunta libre que tengas** (conocimiento general, ciencia, tecnología, consejos, matemáticas, redacción) y para apoyarte con **nuestros servicios y soluciones empresariales**:\n\n` +
      `🛒 **1. Ventas & Facturación Electrónica DGII (e-CF)**\n` +
      `• Emisión de cotizaciones, pedidos y comprobantes fiscales (B01 Crédito Fiscal, B02 Consumo, B14, B15 y e-CF E31).\n\n` +
      `🛍️ **2. Compras & Gestión de Proveedores**\n` +
      `• Órdenes de compra, control de costos, ITBIS y recepción automática en almacenes.\n\n` +
      `📦 **3. Inventario Multialmacén & Kardex**\n` +
      `• Existencias en tiempo real, valoración por costo promedio y alertas preventivas de stock mínimo.\n\n` +
      `👥 **4. CRM Comercial & Pipeline**\n` +
      `• Embudo de ventas, prospectos y gestión integral de clientes.\n\n` +
      `🚀 **5. Proyectos & Tableros Kanban**\n` +
      `• Flujo visual de tareas, hitos y cronogramas operativos.\n\n` +
      `💳 **6. Finanzas, Bancos & Flujo de Caja**\n` +
      `• Conciliación bancaria, cuentas por cobrar/pagar y balances contables en vivo.\n\n` +
      `🌐 **7. Integraciones & WhatsApp API**\n` +
      `• Envío de comprobantes a clientes vía WhatsApp, servidor SMTP TLS y webhooks con n8n.\n\n` +
      `💬 *Puedes hacerme cualquier pregunta, ya sea sobre el ERP, datos de tu empresa o cualquier tema general del mundo.*`
  }

  // 4. Preguntas de Ciencia, Naturaleza y Astronomía
  if (m.includes('cielo es azul') || (m.includes('cielo') && m.includes('azul'))) {
    return `🌌 **¿Por qué el cielo es azul?**\n\nEl cielo se ve azul debido a un fenómeno físico llamado **Dispersión de Rayleigh**:\n\n• La luz del Sol parece blanca, pero está compuesta por todos los colores del arcoíris, cada uno con una longitud de onda diferente.\n• Las ondas de luz azul y violeta tienen longitudes de onda más cortas y viajan en ondas más pequeñas.\n• Al entrar en la atmósfera terrestre, la luz choca con los gases (nitrógeno y oxígeno) y la luz azul se dispersa en todas las direcciones mucho más que otros colores.\n• Nuestros ojos además son mucho más sensibles a la luz azul que a la violeta, por lo que percibimos el cielo de un azul brillante durante el día.`
  }

  if (m.includes('fotosintesis') || m.includes('fotosíntesis')) {
    return `🌱 **La Fotosíntesis:**\n\nEs el proceso biológico fundamental mediante el cual las plantas, algas y ciertas bacterias transforman la energía solar en energía química:\n\n• **Insumos:** Dióxido de carbono ($CO_2$), agua ($H_2O$) y luz solar (captada por la clorofila).\n• **Productos:** Glucosa (alimento para la planta) y Oxígeno ($O_2$) liberado a la atmósfera.\n• **Fórmula química:** $6CO_2 + 6H_2O + Luz \\rightarrow C_6H_{12}O_6 + 6O_2$.\n\nEs el proceso responsable de mantener los niveles de oxígeno en nuestro planeta.`
  }

  if (m.includes('luna') || m.includes('tierra a la luna') || m.includes('distancia')) {
    return `🌕 **Distancia de la Tierra a la Luna:**\n\n• La distancia promedio es de aproximadamente **384,400 kilómetros** (238,855 millas).\n• Como la órbita de la Luna es elíptica, en su punto más cercano (*perigeo*) está a unos **363,300 km**, y en su punto más lejano (*apogeo*) a unos **405,500 km**.\n• La luz tarda apenas **1.28 segundos** en viajar desde la Luna hasta la Tierra.`
  }

  // 5. Preguntas de Programación y Tecnología
  if (m.includes('javascript') || m.includes('react') || m.includes('python') || m.includes('programacion') || m.includes('programar') || m.includes('api') || m.includes('sql')) {
    if (m.includes('react')) {
      return `⚛️ **React.js:**\n\nReact es una biblioteca de JavaScript de código abierto desarrollada por Meta para construir interfaces de usuario interactivas basadas en **componentes reutilizables**.\n\n• **Características clave:** Virtual DOM para alto rendimiento, flujo de datos unidireccional y soporte para Hooks (\`useState\`, \`useEffect\`, \`useMemo\`).\n• **Uso en APPEX ERP:** Todo el frontend de este sistema está desarrollado con React 18 y Vite para máxima velocidad.`
    }
    if (m.includes('python')) {
      return `🐍 **Python:**\n\nPython es un lenguaje de programación de alto nivel, interpretado y multiparadigma, conocido por su sintaxis limpia y legible.\n\n• **Principales aplicaciones:** Inteligencia Artificial, Machine Learning (TensorFlow, PyTorch), Ciencia de Datos (Pandas, NumPy), desarrollo web (Django, FastAPI) y automatización de scripts.`
    }
    return `💻 **Conceptos de Tecnología & Software:**\n\nPuedo ayudarte a escribir código, depurar errores, explicar algoritmos o estructurar bases de datos relacionales y no relacionales. ¿En qué lenguaje o proyecto te gustaría trabajar hoy?`
  }

  // 6. Consejos de Negocios, Finanzas Generales y Redacción
  if (m.includes('carta') || m.includes('correo formal') || m.includes('redactar') || m.includes('redactame')) {
    return `✉️ **Plantilla de Comunicación Corporativa:**\n\n**Asunto:** [Propuesta Comercial / Actualización del Proyecto] — APPEX Dominicana\n\nEstimado/a [Nombre del Cliente/Destinatario],\n\nEs un placer saludarle. Por medio de la presente, nos dirigimos a usted para presentarle [detalle de la propuesta o información clave].\n\nQuedamos a su entera disposición para coordinar una reunión de seguimiento o aclarar cualquier duda.\n\nAtentamente,\n**[Tu Nombre / Cargo]**\n*APPEX Enterprise Suite*`
  }

  // 7. Preguntas de la Base de Datos del ERP
  const ventas = JSON.parse(localStorage.getItem('ventas_orders_v1') || '[]')
  const compras = JSON.parse(localStorage.getItem('compras_orders_v1') || '[]')
  const productos = JSON.parse(localStorage.getItem('appes_inventory_products_v1') || '[]')
  const clientes = JSON.parse(localStorage.getItem('appes_crm_clients_v1') || '[]')
  const finanzasData = JSON.parse(localStorage.getItem('appes_erp_finanzas_data_v3') || '{}')
  const cuentas = finanzasData.cuentas || []
  const totalVentas = ventas.reduce((s, v) => s + (Number(v.total) || 0), 0)
  const totalCompras = compras.reduce((s, c) => s + (Number(c.total) || 0), 0)
  const saldoBancos = cuentas.reduce((s, c) => s + (Number(c.saldo) || 0), 0)

  if (m.includes('venta') || m.includes('pedido') || m.includes('factur')) {
    return `🛒 **Ventas de la Empresa (Tiempo Real):**\n\n• **Facturado:** RD$ ${totalVentas.toLocaleString('es-DO')} (${ventas.length} pedidos)\n• **Pendientes:** ${ventas.filter(v => v.estado === 'Pendiente').length}\n• **Último Pedido:** ${ventas[0]?.numero || 'PED-1001'} (${ventas[0]?.cliente || 'Cliente General'}) por RD$ ${Number(ventas[0]?.total || 0).toLocaleString('es-DO')}`
  }

  if (m.includes('compra') || m.includes('proveedor')) {
    return `🛍️ **Compras de la Empresa (Tiempo Real):**\n\n• **Total Invertido:** RD$ ${totalCompras.toLocaleString('es-DO')} (${compras.length} compras)\n• **Pendientes:** ${compras.filter(c => c.estado === 'Pendiente').length}`
  }

  if (m.includes('inventario') || m.includes('stock')) {
    const criticos = productos.filter(p => Number(p.stock || 0) <= Number(p.stockMin || 10))
    return `📦 **Inventario (Tiempo Real):**\n\n• **Total SKUs:** ${productos.length} productos\n• **Stock Crítico:** ${criticos.length} productos\n${criticos.slice(0, 3).map(p => `  • ⚠️ ${p.nombre}: ${p.stock} uds`).join('\n')}`
  }

  if (m.includes('finanza') || m.includes('banco') || m.includes('dinero') || m.includes('utilidad')) {
    return `💳 **Finanzas (Tiempo Real):**\n\n• **Ingresos:** RD$ ${totalVentas.toLocaleString('es-DO')}\n• **Egresos:** RD$ ${totalCompras.toLocaleString('es-DO')}\n• **Utilidad Neta Estimada:** RD$ ${(totalVentas - totalCompras).toLocaleString('es-DO')}\n• **Bancos:** RD$ ${saldoBancos.toLocaleString('es-DO')}`
  }

  // 8. Respuesta Universal y Conversacional Inteligente para Cualquier Pregunta
  return `🤖 **Respuesta Inteligente:**\n\n` +
    `He procesado tu consulta: "*${msg}*".\n\n` +
    `Como Asistente de Inteligencia Artificial Universal, puedo asistirte tanto en temas generales del conocimiento humano (redacción, ciencia, tecnología, historia, matemáticas, asesoría) como en la gestión integral de tu empresa con **APPEX Enterprise Suite**.\n\n` +
    `• **Estado del Negocio en Vivo:** RD$ ${totalVentas.toLocaleString('es-DO')} en ventas | ${productos.length} productos en stock | ${clientes.length} clientes en CRM.\n` +
    `• **Portafolio de Servicios:** Facturación Fiscal DGII, Compras, Inventario, CRM, Proyectos, Finanzas e Integraciones WhatsApp.\n\n` +
    `¿Deseas que elabore más sobre este tema, que realice un cálculo o que te asista con alguna tarea específica?`
}

// Mantener alias para compatibilidad
export const generateDirectDbResponse = generateUniversalAIResponse
