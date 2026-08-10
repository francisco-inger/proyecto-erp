# Contexto — Leandro Junior Ramirez Alcantara

**Rol:** Especialista Integraciones
**Stack:** React (si aplica UI de configuración) + backend Node.js/REST + n8n
**Entregables:** Conectores n8n + WhatsApp + Email + CRM externo

## Responsabilidades (según el documento del proyecto)
- Integración con n8n (flujos de trabajo externos).
- API de WhatsApp Business.
- Conector de correo electrónico (SMTP).
- Integración con CRM externo (Hubspot, Salesforce, etc.).

## Carpetas de tu propiedad
- `/backend/integrations` (a crear): conectores n8n, WhatsApp, email, CRM externo.
- Si se necesita una pantalla de configuración de integraciones en el
  frontend, créala como módulo nuevo propio, por ejemplo
  `src/modules/integraciones/**` (regístralo en `src/App.jsx` solo tú, o
  pide a Diego que lo agregue).

## Carpetas que NO debes editar directamente
- `src/core/**` — solo lectura.
- `src/modules/ventas`, `crm`, `rrhh-inventario`, `chatbot` — no son tuyas.
  Los webhooks que dispares hacia el sistema deben llegar como llamadas a
  la API interna (`/api/workflows/trigger`, endpoints de CRM/Ventas), no
  como imports de código.

## Reglas específicas de tu rol
1. Los webhooks entrantes (n8n → backend, WhatsApp → backend) se manejan
   en `/backend/integrations`, con su propia validación de payloads.
2. No dupliques la lógica de negocio de Ventas/CRM en tus conectores:
   llama a los endpoints internos ya definidos
   (`POST /api/sales/orders`, `GET /api/crm/contacts`, etc.).
3. Documenta cada integración nueva en `docs/` con el formato del payload
   esperado, para que Kendry (analytics) y QA puedan probarla.

## Prompt de contexto para tu IA
"""
Trabajo en las integraciones externas (n8n, WhatsApp Business, email, CRM
externo) de un ERP construido en React + backend Node.js. Mi código vive
en `/backend/integrations` y, si necesito UI, en un módulo propio nuevo
dentro de `src/modules/`. No debo tocar `src/core/**` ni el código interno
de los módulos de Ventas, CRM, RR.HH./Inventario o Chatbot: toda
comunicación con ellos pasa por los endpoints internos del API Gateway.
"""
