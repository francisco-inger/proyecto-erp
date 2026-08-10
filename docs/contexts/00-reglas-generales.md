# Reglas generales de convivencia en el repo (appes.erp)

Este documento aplica a los 10 integrantes. Los archivos individuales
(`01-...md` a `10-...md`) son un CONTEXTO que cada quien puede pegar al
inicio de su chat con la IA que use para programar, para que la IA sepa
qué puede y qué no puede tocar.

## Principio base

> **Cada quien es dueño de su carpeta. Nadie edita la carpeta de otro
> directamente.** Si necesitas algo de otro módulo, lo consumes a través
> del contrato que expone `/src/core` (apiClient, moduleRegistry, rbac),
> nunca importando archivos internos de otro módulo.

## Mapa de propiedad (carpetas → responsable)

| Carpeta | Responsable | Puede tocar `core/`? |
|---|---|---|
| `src/core/**` | Diego (Tech Lead) | — (es su carpeta) |
| `src/modules/ventas/**` | Eliannys | No, solo lectura |
| `src/modules/plugin-manager/**` | Eliannys | No, solo lectura |
| `src/modules/crm/**` | Ediana | No, solo lectura |
| `src/modules/rrhh-inventario/**` | Benjamin* | No, solo lectura |
| `src/modules/chatbot/**` | Daniel + Francisco | No, solo lectura |
| `src/pages/**`, layout global | Benjamin (Frontend Web) | No, solo lectura |
| `/backend/**` (a crear) | Eliannys + Diego | — |
| `/mobile/**` (a crear) | Rafi | Consume `core` vía contratos, no copia código |
| `/desktop/**` (a crear, Electron) | Ana María | Empaqueta el build de `frontend-web`, no reescribe módulos |
| `.github/workflows/**`, hosting, dominio | Ana María | No, solo lectura |
| `docs/**` | Todos pueden añadir, nadie borra lo de otro sin avisar | — |

\* Ajustar el nombre exacto si el equipo reparte RR.HH./Inventario distinto;
el documento original lo deja abierto ("Módulo RR.HH. O Inventario").

## Reglas duras (no negociables)

1. **No imports cruzados entre módulos.** `modules/crm` no puede hacer
   `import ... from '../ventas/...'`. Si dos módulos necesitan compartir
   algo, ese "algo" se sube a `core/` y lo aprueba Diego.
2. **`src/App.jsx` es el único composition root.** Es el único archivo
   donde está permitido importar más de un módulo a la vez. Cualquier PR
   que agregue imports de módulos en otro archivo debe rechazarse.
3. **Los colores y la tipografía viven solo en `core/styles/tokens.css`.**
   Ningún módulo declara un color nuevo "a mano" (hex suelto en un
   componente); si falta un token, se pide en el PR de `core`.
4. **Cambios en `core/` requieren aprobación de Diego** (Tech Lead) antes
   de mergear a `develop`, incluso si otro integrante los necesita con
   urgencia. Se abre un PR pequeño y específico, no se edita en caliente.
5. **Cada módulo prueba su propia carpeta.** No se asume que "ya alguien
   más lo probó"; cada dueño corre `npm run build` antes de pedir review.
6. **Ramas:** `main` = producción, `develop` = integración. Cada persona
   trabaja en `feature/<módulo>-<tarea>` y abre PR contra `develop`.
7. **El archivo `.github/CODEOWNERS`** (incluido en este repo) hace
   cumplir la tabla de arriba automáticamente: GitHub pedirá la
   aprobación del dueño antes de permitir el merge en su carpeta.

## Cómo pedir algo del módulo de otra persona

1. Revisa si ya existe un contrato en `core/` (apiClient, moduleRegistry,
   rbac/permissions.js) que resuelva lo que necesitas.
2. Si no existe, abre un issue describiendo qué necesitas y por qué.
3. El dueño del módulo (o Diego, si es del core) decide cómo exponerlo:
   normalmente como una nueva función en un `service.js` o un nuevo campo
   en el `manifest` del módulo — nunca dándote acceso directo a sus
   componentes internos.
