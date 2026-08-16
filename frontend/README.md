# SEÑAVIDA — Frontend

Plataforma de comunicación inclusiva en salud para personas sordas y personal
de salud, con foco en atención de urgencias. Este repositorio contiene
**solo el frontend** (React + TypeScript), pensado para integrarse más
adelante dentro de un backend Laravel vía **Inertia.js**.

## Stack

- **React 19.2** + **TypeScript 6.0**
- **Vite 7** (no Vite 8: a julio 2026 `laravel-vite-plugin` todavía tiene un bug abierto de compatibilidad con Vite 8 — `import.meta.glob` cambió de comportamiento y rompe el plugin de Laravel. Vite 7 es la versión estable recomendada para stacks Laravel + Inertia hoy)
- **Tailwind CSS 4.3** (vía `@tailwindcss/vite`, sin `tailwind.config.js` — los
  tokens de marca viven en `src/index.css` con la directiva `@theme`; además,
  Tailwind CSS 4 ya viene por defecto en Laravel 11 y 12)
- **lucide-react** (íconos) y **motion** (animaciones)

> Nota: el backend real
> del proyecto es Laravel/PHP, no Node — ninguno de los componentes los usa.
> Si en algún momento SEÑAVIDA necesita IA (ej. traducción de señas), esa
> llamada debería hacerse desde Laravel, no desde un servidor Node aparte.
> Tailwind 4 maneja el prefijado de CSS internamente.

### Por qué estas versiones (y no otras)

Inertia.js v3 (la versión actual) exige React 19 como mínimo — no es una
preferencia, es un requisito duro del framework. Laravel 13 (lanzado marzo
2026) es totalmente compatible con Inertia v3 sin cambios adicionales. El
combo verificado y recomendado hoy para un proyecto Inertia + React nuevo es:
**PHP 8.2+, Laravel 11+, Vite 7+, React 19**.

Se agregaron `@types/react` y `@types/react-dom`  y un `src/vite-env.d.ts` con la referencia a `vite/client`  — sin esto, TypeScript no tipa correctamente
los imports de React ni los imports de CSS como side-effects.

## Estructura

```
src/
  App.tsx              # Estado global y ruteo de vistas (landing/login/dashboard)
  main.tsx             # Entry point
  index.css            # Tema Tailwind v4 + estilos de accesibilidad
  types.ts             # Contrato de tipos (mapea 1:1 con el schema SQL de Laravel)
  data/
    mockData.ts         # Datos simulados con la forma exacta que devolverá el backend
    backendDoc.ts        # Documentación de referencia: schema SQL + snippets Laravel
  components/
    AppLogo, PublicHeader, PublicFooter, LandingPage, Login
    DashboardContainer   # Shell con sidebar + switch de rol
    DashboardAdmin        # Panel institucional/TI
    DashboardAdmision     # Validación de código CTA + apertura de ficha
    DashboardCategorizacion  # Signos vitales + triage
    DashboardMedico        # Notas clínicas, cierre de sesión, videollamada intérprete
    PatientView            # Portal del paciente (pictogramas, pizarra, chat, consentimientos)
```

## Correr localmente

```bash
npm install
npm run dev
```

## Migración a Laravel/Inertia (pendiente)

1. Mover `src/` a `resources/js/` dentro del proyecto Laravel.
2. Reemplazar el estado en memoria de `App.tsx` (`useState` con mocks) por
   props que llegan del servidor vía `usePage().props`.
3. Sustituir `data/mockData.ts` por las respuestas reales de la API —el
   contrato ya está alineado con `backendDoc.ts` (mismo shape, solo cambia
   `camelCase` → `snake_case`).
4. Revisar `DashboardMedico`: el handler `onSignNote` hoy solo hace
   `console.log`, falta conectarlo a un estado real o a una petición al
   backend.

## Pendientes conocidos

- `DashboardContainer.tsx`: el código CTA mostrado en la sesión activa está
  hardcodeado a `'SV-847291'` porque `MedicalSession` no trae ese dato — hay
  que agregarlo al tipo/API cuando el backend lo entregue.
