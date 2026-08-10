# Arquitectura — appes.erp

## Principio central: Core independiente de los módulos

- `src/core/**` no importa nada de `src/modules/**`.
- Cada módulo se auto-registra llamando a `registerModule(manifest)` desde
  su propio `index.jsx` (ver `src/core/moduleRegistry.js`).
- `src/App.jsx` es el único "composition root": el único archivo con
  permiso de importar más de un módulo, solo para forzar su registro.
- La navegación (Sidebar, rutas protegidas por rol) se arma en tiempo de
  ejecución leyendo el registry — agregar/quitar un módulo es agregar/quitar
  una línea de import en `App.jsx`, nada más.

## Capas (según el documento del proyecto)

1. **Núcleo ERP** → `src/core/` (auth, RBAC, api client, layout) +
   `/backend` (API Gateway, BD, cache, auditoría — a implementar).
2. **Arquitectura modular (plugins)** → `src/modules/*` +
   `src/modules/plugin-manager`.
3. **IA y automatización** → `src/modules/chatbot` + `/backend/ai`.
4. **Integraciones** → `/backend/integrations` (n8n, WhatsApp, email, CRM externo).
5. **Frontend** → este repo (web, con Vite+React) + `/mobile` (React Native)
   + `/desktop` (Electron, empaquetando el build web).
6. **Hosting y DevOps** → `.github/workflows`, `/docker`, configuración cloud.

## Paleta de diseño

Definida en `src/core/styles/tokens.css`. Reglas del proyecto:
colores **sólidos** (sin gradientes), **blanco** como color principal,
diseño minimalista. Cada módulo tiene un color de identidad usado
únicamente en badges/etiquetas pequeñas, nunca como fondo de pantalla
completo.

## Reparto de responsabilidad por carpeta

Ver `docs/contexts/00-reglas-generales.md` para el mapa completo y
`.github/CODEOWNERS` para que GitHub lo haga cumplir automáticamente.
