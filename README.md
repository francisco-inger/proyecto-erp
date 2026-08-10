# appes.erp

ERP empresarial integral (tipo Odoo) — Proyecto Final de Ingeniería de
Software II. Frontend en React, arquitectura modular con core
independiente de los módulos.

## Levantar el proyecto

```bash
npm install
npm run dev        # http://localhost:5173
```

Usuario de prueba (mock, sin backend aún): cualquier email + contraseña
en `/login` te deja entrar como rol `admin`.

## Estructura

```
src/
  core/            # Núcleo del ERP: auth, RBAC, layout, api client,
                    # moduleRegistry (Plugin Manager), design tokens.
                    # NO conoce a los módulos.
  modules/
    ventas/         # Eliannys
    crm/            # Ediana
    rrhh-inventario/# (a repartir)
    chatbot/        # Daniel + Francisco
    plugin-manager/ # Eliannys
  pages/           # Dashboard y páginas globales (Benjamin)
  App.jsx          # Composition root — único lugar que "instala" módulos
docs/
  ARCHITECTURE.md
  contexts/        # Un archivo por integrante con sus reglas de trabajo
.github/
  CODEOWNERS       # Hace cumplir el mapa de propiedad de carpetas
```

## Agregar un módulo nuevo

1. Crea `src/modules/<nombre>/{index.jsx,pages,components,services}`.
2. En `index.jsx`, llama a `registerModule({...})` (ver los módulos
   existentes como plantilla).
3. Agrega una línea `import 'modules/<nombre>'` en `src/App.jsx`.

Con eso, el módulo aparece solo en la Sidebar, el Dashboard y el Plugin
Manager — no hay que tocar nada más.

## Documentación de equipo

Antes de programar, cada integrante debe leer su archivo en
`docs/contexts/` — define qué carpetas puede tocar y trae un prompt de
contexto listo para pegar en su asistente de IA.
