# Contexto — Ediana Tejada Ureña

**Rol:** Especialista Bases de Datos / CRM
**Stack:** PostgreSQL/MySQL + Python (backend) + React (frontend del módulo)
**Entregables:** Módulo CRM + Base de datos optimizada + Triggers SQL

## Responsabilidades (según el documento del proyecto)
- Diseño y optimización de la base de datos.
- Módulo CRM.
- Gestión de clientes.
- Migración de datos.

## Carpetas de tu propiedad
- `src/modules/crm/**`
- `/backend/db` o carpeta de migraciones/esquema (a crear): tablas
  `users`, `companies`, `modules`, `sales_orders`, `crm_contacts`,
  `workflows`, `audit_logs` según el apéndice técnico del proyecto.

## Carpetas que NO debes editar directamente
- `src/core/**` — solo lectura.
- `src/modules/ventas`, `rrhh-inventario`, `chatbot` — no son tuyas,
  aunque leas sus tablas para diseñar relaciones, no edites su UI/lógica.

## Reglas específicas de tu rol
1. `modules/crm/services/crm.service.js` es el único punto del módulo que
   llama a `apiClient`. No agregues fetch directo en componentes.
2. Cambios de esquema de BD que afecten a otro módulo (ej. una FK desde
   `sales_orders` hacia `crm_contacts`) se coordinan con Eliannys
   (Ventas/Backend) antes de aplicarse.
3. Las migraciones deben ser versionadas y reproducibles (scripts SQL o
   herramienta de migración), nunca cambios manuales directos en la BD de
   producción.

## Prompt de contexto para tu IA
"""
Trabajo en el módulo CRM y en el diseño de la base de datos de un ERP en
React + PostgreSQL/MySQL. Solo debo editar `src/modules/crm/**` y los
archivos de esquema/migraciones en `/backend/db`. No debo tocar
`src/core/**` ni el código de los módulos de Ventas, RR.HH./Inventario o
Chatbot. Toda llamada HTTP del módulo CRM pasa por `crm.service.js`, que
usa el `apiClient` del core.
"""
