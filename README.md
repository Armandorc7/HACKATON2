# TropelCare Control Room

Frontend de la hackathon **Pizza Protocol** construido con React, TypeScript, Vite, React Router y Tailwind CSS.

## Integrantes
Armando Andres Ruesta Carrion 202410753

## Requisitos

- Node.js 20+
- Credenciales asignadas por el equipo docente

## Variables

Crear `.env.local`:

```txt
VITE_API_BASE_URL=https://hackaton-20261-front-587720740455.us-east1.run.app/api/v1
API_DOCUMENTATION_URL=https://hackaton-20261-front-587720740455.us-east1.run.app/docs
```

Las credenciales no se guardan en el repositorio. El operador las ingresa en `/login`.

## Comandos

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
npm run preview
```

## Funcionalidades

- Login con `teamCode`, `email` y `password`.
- Ruta privada, restauracion de sesion con `/auth/me` y logout.
- Dashboard con `/dashboard/summary` y sectores reales.
- Atlas de tropeles con paginacion de servidor, filtros combinables, busqueda, orden y estado reflejado en URL.
- Feed de senales cursor-based con infinite scroll, deduplicacion por ID, control de request en vuelo y recuperacion de errores parciales.
- Detalle de senal con cambio de estado a `PROCESANDO` o `ATENDIDA`.
- Sector Story Engine en `/sectors/:id/story` con etapas por scroll, visual sticky, progreso, View Transition API si existe, CSS Scroll-driven Animations si existe, fallback con `IntersectionObserver`, soporte responsive y `prefers-reduced-motion`.

## Decisiones tecnicas

- Se usa Fetch API directamente, sin React Query, SWR, TanStack Query ni librerias de cache.
- Las respuestas de API estan tipadas en `src/api/types.ts`; no se usa `any` para DTOs.
- La paginacion y el cursor se delegan al backend; no se carga el dataset completo.
- La posicion del feed y las actualizaciones de senales se conservan temporalmente en `sessionStorage`.
- La historia de sectores usa exclusivamente la data del endpoint `/sectors/{id}/story`.

## Deploy

Pendiente agregar link del deploy final.
