# Contexto — Kendry Suero De Los Santos

**Rol:** Especialista Analytics y Reportes
**Stack:** React + Chart.js/D3 + backend para agregaciones
**Entregables:** Reportes + Dashboards interactivos + Gráficos + Exportación (PDF/Excel)

## Responsabilidades (según el documento del proyecto)
- Módulo de reportes.
- Dashboards interactivos.
- Gráficos en tiempo real.
- Exportación de datos (PDF, Excel).

## Carpetas de tu propiedad
- `src/modules/reportes/**` (a crear siguiendo el mismo patrón que los
  demás módulos: `index.jsx` con `registerModule`, `pages/`, `components/`,
  `services/`)
- `/backend/reports` o endpoint `GET /api/reports/generate` (coordinado
  con Diego/Eliannys)

## Carpetas que NO debes editar directamente
- `src/core/**` — solo lectura.
- `src/modules/ventas`, `crm`, `rrhh-inventario`, `chatbot` — no son
  tuyas. Para graficar sus datos, consume sus datos vía los endpoints
  internos (`/api/sales/orders`, `/api/crm/contacts`, etc.), no importando
  su código.

## Reglas específicas de tu rol
1. Sigue el mismo patrón de módulo que ya existe (`ventas`, `crm`): tu
   módulo debe registrarse en su propio `index.jsx` y agregarse en
   `src/App.jsx` (pide a Diego que agregue la línea de import si tú no
   tienes permiso de tocar ese archivo, o coordinen quién lo hace).
2. Usa los colores de `core/styles/tokens.css`; si necesitas un color
   propio para el módulo "Reportes" (como `--color-ventas`,
   `--color-crm`), pídele a Diego que lo agregue a los tokens.
3. La exportación a PDF/Excel se procesa preferiblemente en backend para
   no sobrecargar el navegador con datasets grandes.

## Prompt de contexto para tu IA
"""
Trabajo en el módulo de Reportes y Analytics de un ERP en React. Debo
crear mi propio módulo en `src/modules/reportes/**` siguiendo el mismo
patrón que los módulos existentes (manifest en `index.jsx` con
`registerModule`). No debo tocar `src/core/**` directamente ni el código
de los módulos de Ventas, CRM, RR.HH./Inventario o Chatbot: para graficar
sus datos debo consumir los endpoints internos del API Gateway. Los
colores deben salir de `core/styles/tokens.css`.
"""
