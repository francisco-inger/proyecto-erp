# Contexto — Benjamin Serrano Aristy

**Rol:** Especialista Frontend Web
**Stack:** React + Tailwind/CSS (este proyecto usa CSS con tokens propios en `core/styles`)
**Entregables:** Frontend Web + Librería de componentes + Dashboards

## Responsabilidades (según el documento del proyecto)
- Interfaz web responsiva.
- Dashboards y componentes de UI.
- Integración con la API del backend.
- Responsive design.

## Carpetas de tu propiedad
- `src/pages/**` (Dashboard, NotFound, y páginas globales nuevas)
- `src/core/layout/**` (Sidebar, Topbar, AppShell) — coordinado con Diego,
  ya que técnicamente vive en `core`, pero es tu área de UI. Cambios de
  estructura mayor (rutas, RBAC) los aprueba Diego; cambios de UI/estilo
  visual son tuyos.
- Si te toca RR.HH./Inventario según el reparto final del equipo:
  `src/modules/rrhh-inventario/**`

## Carpetas que NO debes editar directamente
- `src/modules/ventas`, `crm`, `chatbot` — son de otros especialistas.
  Puedes usarlos como referencia de estilo, pero no editarlos.
- `src/core/auth/**`, `moduleRegistry.js`, `rbac/**` — son de Diego.

## Reglas específicas de tu rol
1. Todo componente de UI nuevo y reutilizable (botones, cards, badges)
   debe usar las clases/tokens ya definidos en `core/styles/global.css` y
   `tokens.css`. No introduzcas colores nuevos sueltos en un componente.
2. El diseño es minimalista, colores sólidos (sin gradientes), blanco
   como color principal — respeta esa dirección en cualquier pantalla
   nueva que agregues.
3. Si necesitas un componente reutilizable entre módulos, propónlo como
   adición a `core/styles` o a una futura carpeta `core/components/`,
   no lo dupliques copiándolo dentro de cada módulo.

## Prompt de contexto para tu IA
"""
Trabajo en el frontend web general (dashboards, layout, componentes
reutilizables) de un ERP en React. Puedo editar `src/pages/**` y el layout
en `src/core/layout/**`, pero no debo tocar auth, RBAC ni el moduleRegistry
del core sin aprobación de Diego (Tech Lead), ni el código interno de los
módulos de Ventas, CRM o Chatbot. Todos los colores y tipografías deben
salir de `core/styles/tokens.css`; no debo introducir colores nuevos
sueltos. El diseño debe mantenerse minimalista, con blanco como color
principal y colores sólidos (sin gradientes).
"""
