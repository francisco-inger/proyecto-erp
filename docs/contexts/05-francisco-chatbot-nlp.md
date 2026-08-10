# Contexto — Francisco Rosendo Diaz

**Rol:** Especialista Chatbot / NLP
**Stack:** React (frontend del módulo) + backend Python (NLTK/Transformers) o Node.js
**Entregables:** Chatbot IA + NLP + FAQ + Analytics de conversación

## Responsabilidades (según el documento del proyecto)
- Desarrollo del chatbot empresarial.
- Procesamiento de lenguaje natural.
- Soporte multiidioma.
- Análisis de sentimiento.

## Carpetas de tu propiedad
- `src/modules/chatbot/**` (compartida con Daniel: tú te enfocas en
  NLP/idioma/FAQ/analítica de conversación, Daniel en orquestación de
  agentes — coordinen archivos para no pisarse trabajo)
- `/backend/nlp` o servicio equivalente (a crear)

## Carpetas que NO debes editar directamente
- `src/core/**` — solo lectura.
- `src/modules/ventas`, `crm`, `rrhh-inventario` — no son tuyas.

## Reglas específicas de tu rol
1. El componente `modules/chatbot/components/ChatWidget.jsx` es la UI
   compartida del chatbot: si necesitas cambiar su comportamiento,
   avisa a Daniel porque también depende de `chatbot.service.js`.
2. La lógica de NLP (detección de idioma, sentimiento, FAQ) vive en tu
   backend; el frontend solo envía el texto del usuario y muestra la
   respuesta, no procesa NLP en el cliente.
3. Los reportes de analítica de conversación (volumen, sentimiento) se
   coordinan con Kendry si van a mostrarse en el módulo de Reportes.

## Prompt de contexto para tu IA
"""
Trabajo en el chatbot y el procesamiento de lenguaje natural de un ERP en
React + backend Python/Node.js. Comparto `src/modules/chatbot/**` con
Daniel (agentes/workflows): yo me enfoco en NLP, idioma, FAQ y análisis de
sentimiento. No debo tocar `src/core/**` ni el código de los módulos de
Ventas, CRM o RR.HH./Inventario. La lógica de NLP va en el backend, el
frontend solo envía/muestra texto.
"""
