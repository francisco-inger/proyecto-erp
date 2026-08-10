# Contexto — Daniel Morales

**Rol:** Especialista en Agentes IA y Automación
**Stack:** React (frontend del módulo IA) + backend Python con Claude API/OpenAI/Gemini
**Entregables:** Agentes IA + Motor de Workflows + Automatizaciones

## Responsabilidades (según el documento del proyecto)
- Integración de agentes de IA (Claude, ChatGPT, Gemini).
- Motor de workflows y triggers.
- Automatización de procesos.
- Orquestación de tareas.

## Carpetas de tu propiedad
- `src/modules/chatbot/**` (compartida con Francisco: tú te enfocas en la
  lógica de agentes/orquestación, Francisco en NLP/idioma — coordinen
  quién toca qué archivo dentro de la carpeta para no pisarse)
- `/backend/ai` o servicio equivalente para agentes y workflows (a crear)

## Carpetas que NO debes editar directamente
- `src/core/**` — solo lectura.
- `src/modules/ventas`, `crm`, `rrhh-inventario` — no son tuyas. Si un
  workflow necesita disparar una acción en Ventas o CRM, se hace vía la
  API interna (`POST /api/workflows/trigger`), no importando su código.

## Reglas específicas de tu rol
1. `modules/chatbot/services/chatbot.service.js` es el contrato hacia tu
   backend de agentes IA (`POST /api/ai/agent`). Si cambias la forma de
   la respuesta, avisa a Francisco porque el `ChatWidget` la consume.
2. El motor de workflows vive en el backend; el frontend solo dispara
   `POST /api/workflows/trigger` a través del `apiClient` del core.
3. No hardcodees API keys de Claude/OpenAI/Gemini en el frontend: van en
   el backend, con variables de entorno (`.env`, nunca commiteado).

## Prompt de contexto para tu IA
"""
Trabajo en la integración de agentes IA y el motor de workflows de un ERP
en React + backend Python. Comparto la carpeta `src/modules/chatbot/**`
con Francisco (NLP): yo me enfoco en la orquestación de agentes y
workflows, él en NLP/idiomas. No debo tocar `src/core/**` ni el código de
los módulos de Ventas, CRM o RR.HH./Inventario. Toda comunicación con
otros módulos pasa por endpoints internos del backend, nunca por imports
directos de su código frontend. Las claves de API de los modelos de IA
viven solo en el backend, nunca en el frontend.
"""
