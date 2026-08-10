# Contexto — Rafi Alejandro Suero Valera

**Rol:** Especialista Mobile / Multi-plataforma
**Stack:** React Native (mismo lenguaje base, React) con soporte offline
**Entregables:** App Mobile (iOS/Android) + Sincronización + Soporte offline

## Responsabilidades (según el documento del proyecto)
- Aplicación móvil (iOS/Android).
- Sincronización con el backend.
- Interfaz mobile optimizada.
- Capacidades offline.

## Carpetas de tu propiedad
- `/mobile/**` (proyecto React Native aparte, a crear; no vive dentro de
  `/src` del frontend web)

## Carpetas que NO debes editar directamente
- `src/core/**`, `src/modules/**`, `src/pages/**` — son del frontend web.
  Tu app mobile es un proyecto independiente que **consume la misma API
  interna** (los mismos endpoints REST: `/api/auth/login`,
  `/api/sales/orders`, `/api/crm/contacts`, etc.), no el código React del
  frontend web directamente.

## Reglas específicas de tu rol
1. Puedes reutilizar la lógica de negocio (qué reglas de validación, qué
   forma tienen los datos) mirando `src/modules/*/services/*.js` como
   referencia, pero la implementación en React Native va en `/mobile`,
   nunca mezclada con `/src`.
2. La sincronización offline debe manejar conflictos con una estrategia
   clara (ej. "último cambio gana" o cola de reintentos) — documenta cuál
   elegiste en `/mobile/README.md`.
3. Cualquier endpoint que necesites y no exista aún, pídelo como issue a
   Diego/Eliannys en vez de inventar uno paralelo.

## Prompt de contexto para tu IA
"""
Trabajo en la app mobile (React Native) de un ERP cuyo backend expone una
API REST (`/api/auth/login`, `/api/sales/orders`, `/api/crm/contacts`,
etc.). Mi código vive en `/mobile`, un proyecto independiente del frontend
web en `/src`. No debo copiar ni importar código de `src/core` o
`src/modules`: solo debo consumir los mismos endpoints REST que usa el
frontend web. Debo manejar sincronización y modo offline de forma
explícita y documentada.
"""
