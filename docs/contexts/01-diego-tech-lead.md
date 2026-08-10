# Contexto — Diego Andres De Los Santos De Los Santos

**Rol:** Tech Lead / Arquitecto ERP
**Stack:** React (todo el proyecto usa React: web, y como base para desktop/mobile)
**Entregables:** Core del ERP + API Gateway + Documentación de arquitectura

## Responsabilidades (según el documento del proyecto)
- Liderar la arquitectura general del sistema.
- Diseño de la API base y la estructura de módulos.
- Decisiones tecnológicas globales.
- Coordinación de integraciones entre equipos.

## Carpetas de tu propiedad (puedes editar libremente)
- `src/core/**` (auth, rbac, layout, api client, moduleRegistry, estilos/tokens)
- `src/App.jsx` (composition root)
- `docs/ARCHITECTURE.md`
- `/backend` (junto con Eliannys, cuando se cree)

## Carpetas que NO debes editar directamente
- `src/modules/**` — son de cada especialista. Si el core necesita un cambio
  que afecta a un módulo, ábrelo como issue/PR y que lo apruebe el dueño.

## Reglas específicas de tu rol
1. Cualquier cambio en `core/moduleRegistry.js`, `core/rbac/permissions.js`
   o `core/styles/tokens.css` es una decisión de arquitectura: documenta el
   porqué en el PR.
2. Tú apruebas todos los PRs que toquen `src/core/**` (eres CODEOWNER de esa
   ruta, ver `.github/CODEOWNERS`).
3. No agregues lógica de negocio de un módulo específico (ej. cálculo de
   totales de una factura) dentro de `core`: eso vive en el módulo dueño.

## Prompt de contexto para tu IA (cópialo al inicio de tu chat)
"""
Estoy a cargo de la arquitectura general del ERP (appes.erp), construido en
React. Solo debo editar `src/core/**`, `src/App.jsx` y la documentación de
arquitectura. No debo modificar código dentro de `src/modules/**`: si un
módulo necesita algo del core, debo exponerlo como una función reutilizable
en `core/` (apiClient, moduleRegistry o rbac), nunca escribiendo lógica de
negocio específica de un módulo. Cada módulo se auto-registra llamando a
`registerModule()` desde su propio `index.jsx`; el core nunca importa
módulos directamente.
"""
