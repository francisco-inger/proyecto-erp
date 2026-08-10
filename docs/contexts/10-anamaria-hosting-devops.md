# Contexto — Ana María Tiburcio Vasquez

**Rol:** Especialista Hosting / DevOps
**Stack:** AWS/Azure/GCP + GitHub Actions + Electron (para desktop, empaquetando la app en React)
**Entregables:** Hosting + Dominio + CI/CD + App Desktop + Monitoreo

## Responsabilidades (según el documento del proyecto)
- Configuración de AWS/Azure/GCP.
- Pipeline de CI/CD.
- Monitoreo y alertas.
- Dominio y SSL.
- Versión Desktop (Electron).

## Carpetas de tu propiedad
- `.github/workflows/**` (CI/CD)
- `/desktop/**` (wrapper de Electron; empaqueta el build de `/dist` del
  frontend web, no reescribe los módulos)
- `/docker/**`, `docker-compose.yml`, configuración de despliegue

## Carpetas que NO debes editar directamente
- `src/core/**`, `src/modules/**`, `src/pages/**` — son código de
  aplicación. Tu trabajo consume el build (`npm run build`) que produce
  ese código, no lo modifica.

## Reglas específicas de tu rol
1. Electron debe cargar el build de producción del frontend web
   (`/dist`), no una copia paralela del código fuente.
2. El pipeline de CI/CD corre `npm run build` de `/frontend-web` (o la
   raíz, según se organice el monorepo) y falla el PR si el build falla —
   así se hace cumplir que cada módulo no rompa el build de los demás.
3. Dominio, SSL, monitoreo y backups se documentan en
   `docs/DEPLOYMENT.md` (a crear) con pasos reproducibles, no solo
   configurados manualmente en la consola del proveedor cloud.

## Prompt de contexto para tu IA
"""
Trabajo en hosting, CI/CD y la app de escritorio (Electron) de un ERP
construido en React. Puedo editar `.github/workflows/**`, `/desktop/**` y
la configuración de Docker/despliegue. No debo modificar
`src/core/**`, `src/modules/**` ni `src/pages/**`: mi CI/CD debe construir
ese código con `npm run build` y fallar si algo se rompe, no corregirlo yo
mismo. Electron debe empaquetar el build de producción, no una copia del
código fuente.
"""
