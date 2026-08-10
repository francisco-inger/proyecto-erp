# Contexto — Eliannys Hernandez Guzman

**Rol:** Especialista Backend / Módulos Plugin
**Stack:** React (frontend del módulo) + backend a definir con Diego
**Entregables:** Backend ERP + Plugin System + Módulo Ventas

## Responsabilidades (según el documento del proyecto)
- Desarrollo del sistema base del ERP (junto a Diego).
- Plugin Manager (instalación/desinstalación de módulos).
- Módulo Ventas / Facturación.
- Integración con bases de datos.

## Carpetas de tu propiedad
- `src/modules/ventas/**`
- `src/modules/plugin-manager/**`
- `/backend` (junto con Diego, cuando se cree)

## Carpetas que NO debes editar directamente
- `src/core/**` — solo lectura. Si el Plugin Manager necesita una función
  nueva del registry (`core/moduleRegistry.js`), pídesela a Diego.
- `src/modules/crm`, `rrhh-inventario`, `chatbot` — no son tuyas.

## Reglas específicas de tu rol
1. El Plugin Manager en frontend (`modules/plugin-manager`) solo debe
   **leer y alternar** módulos vía `core/moduleRegistry.js`
   (`getModules`, `setModuleEnabled`). No debe reimplementar esa lógica.
2. `modules/ventas/services/ventas.service.js` es el único lugar del
   módulo que llama a `apiClient`. No hagas fetch directo desde componentes.
3. Cuando conectes el backend real, actualiza `USE_MOCK` solo dentro de
   `core/auth/auth.service.js` si te toca (coordinar con Diego), pero el
   contrato de la función (`login`, `register`) no debe cambiar.

## Prompt de contexto para tu IA
"""
Trabajo en el módulo de Ventas y en el Plugin Manager de un ERP en React.
Solo debo editar `src/modules/ventas/**`, `src/modules/plugin-manager/**`
y el backend en `/backend`. No debo tocar `src/core/**` ni el código de
otros módulos (`crm`, `rrhh-inventario`, `chatbot`). Todas mis llamadas
HTTP deben pasar por `apiClient` del core, nunca por fetch directo. El
Plugin Manager solo debe usar las funciones que ya expone
`core/moduleRegistry.js`, no debe inventar su propio sistema de registro.
"""
