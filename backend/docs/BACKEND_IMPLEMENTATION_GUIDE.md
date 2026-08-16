# BACKEND_IMPLEMENTATION_GUIDE

**Proyecto:** SEÑAVIDA — Plataforma de comunicación inclusiva en salud
**Documento:** Guía oficial de implementación del backend
**Base del análisis:** repositorio `senavida-frontend`, commit `41360a8`
**Fecha del análisis:** 2026-07-30 · **Actualización de arquitectura:** 2026-08-05
**Destino de la implementación:** **Laravel 12 — API REST** (backend desacoplado) con **PostgreSQL** y **Laravel Sanctum (Bearer token)**. El frontend React/Vite es un proyecto separado que consume la API.

> **Cambio de arquitectura (v2).** Este proyecto lo desarrollan dos personas: una
> el **backend**, otra el **frontend**, en repositorios separados. Por eso se
> adoptó una **API REST desacoplada** en lugar de Inertia. Las decisiones
> ratificadas (por el equipo y el docente) son:
>
> | # | Decisión | Valor |
> |---|---|---|
> | A-01 | Integración | API REST (proyectos separados) |
> | A-02 | Auth del personal | Sanctum — Bearer token |
> | A-03 | Auth del paciente | Bearer token derivado del CTA |
> | A-04 | Versionado | `/api/v1` para toda la API |
> | A-05 | Respuestas | Envoltorio `success`/`data`/`error`/`meta` |
> | A-06 | Casing | `camelCase` en el cable |
> | A-07 | Documentación | Swagger / OpenAPI |
>
> Las menciones a **Inertia**, **Blade como capa de vistas**, **props
> compartidas** o **sesión con cookie** que queden en el cuerpo del documento
> corresponden al análisis original y **quedan sustituidas** por el modelo API
> REST. La §12 fue reescrita en consecuencia. El contrato
> `FRONTEND_BACKEND_CONTRACT.md` (v2.0.0) es la referencia normativa.

> Este documento es **descriptivo**, no prescriptivo respecto al código. Todo lo
> que se afirma aquí fue extraído leyendo el repositorio real. Cuando algo **no
> existe** en el frontend y debe ser decidido por el equipo, aparece marcado
> explícitamente como `DECISIÓN PENDIENTE`. Cuando algo existe pero está
> simulado, aparece como `SIMULADO`.

---

## Índice

1. [Resumen del frontend](#1-resumen-del-frontend)
2. [Arquitectura detectada](#2-arquitectura-detectada)
3. [Flujo completo del usuario](#3-flujo-completo-del-usuario)
4. [Módulos del sistema](#4-módulos-del-sistema)
5. [Entidades y relaciones](#5-entidades-y-relaciones)
6. [Endpoints necesarios](#6-endpoints-necesarios)
7. [Contratos JSON esperados](#7-contratos-json-esperados)
8. [Validaciones requeridas](#8-validaciones-requeridas)
9. [Roles y permisos](#9-roles-y-permisos)
10. [Dependencias entre módulos](#10-dependencias-entre-módulos)
11. [Riesgos encontrados](#11-riesgos-encontrados)
12. [Recomendaciones para implementar la API REST en Laravel](#12-recomendaciones-para-implementar-la-api-rest-en-laravel)
13. [Roadmap recomendado del backend](#13-roadmap-recomendado-del-backend)

---

## 1. Resumen del frontend

### 1.1 Qué hace la aplicación

SEÑAVIDA es una plataforma web de **mediación comunicacional entre personas
sordas y personal de salud**, enfocada en el flujo de **urgencias hospitalarias**
en Chile. No es una ficha clínica electrónica: el propio frontend lo declara de
forma permanente en el shell del dashboard
(`DashboardContainer.tsx:249-252`):

> *"Software de Comunicación Inclusiva Complementario (No Reemplaza EHR) … no
> reemplaza, sustituye ni altera el software de registro clínico electrónico
> obligatorio (ficha clínica local) de la institución de salud."*

El eje del producto es un **Código Temporal de Atención (CTA)** — por ejemplo
`SV-847291` — que el paciente presenta en ventanilla. Ese código abre una
**sesión médica** (`MedicalSession`) que atraviesa tres etapas asistenciales
(Admisión → Categorización → Consulta Médica) y sobre la cual se cuelgan todos
los artefactos: chat, consentimientos, signos vitales, triage, notas clínicas,
llamados al paciente y solicitudes de intérprete.

El paciente accede a un **portal propio** con pictogramas, mensajes rápidos,
pizarra de dibujo, un traductor de señas por cámara y control granular de
consentimientos.

### 1.2 Cifras del repositorio

| Métrica | Valor |
|---|---|
| Archivos fuente TS/TSX | 15 |
| Líneas de TS/TSX | 6.577 |
| Componentes React | 11 |
| Interfaces/tipos de dominio | 17 (`src/types.ts`, 203 líneas) |
| Llamadas HTTP al backend | **0** |
| Dependencias de red (axios, react-query, swr…) | **0** |
| Variables de entorno usadas | **0** |
| Tests | **0** |
| Router | **ninguno** (estado de vista en `useState`) |

### 1.3 Estado de madurez

El repositorio es un **prototipo funcional de alta fidelidad ("sandbox")**, no
una aplicación conectada. Compila limpio (`npx tsc --noEmit` sale con código 0),
pero:

- **No existe una sola llamada de red.** Se verificó con búsqueda exhaustiva de
  `fetch(`, `axios`, `useQuery`, `useMutation`, `XMLHttpRequest`, `WebSocket`,
  `EventSource`, `http://`, `https://`, `import.meta.env`, `process.env`,
  `VITE_`, `localStorage`, `sessionStorage`. El único match en todo `src/` es el
  `@import url('https://fonts.googleapis.com/...')` de `index.css:1`.
- **Todo el estado vive en memoria** en `App.tsx` (`useState`) y se pierde al
  recargar. No hay persistencia de ningún tipo.
- El login **no valida credenciales**: acepta cualquier email/contraseña y el rol
  se elige con botones (`Login.tsx:32-44`).
- Hay un **conmutador de roles flotante** en el header del dashboard
  (`App.tsx:211-244`) que permite saltar entre los 5 roles sin reautenticación.

> **Implicancia central para el backend:** no hay contratos que "respetar"
> heredados de llamadas existentes. El backend **define** el contrato; lo que el
> frontend aporta es la **forma de los datos** (`src/types.ts`) y las **reglas de
> negocio visibles en la UI**. Este documento formaliza ambas.

---

## 2. Arquitectura detectada

### 2.1 Stack

| Capa | Tecnología | Versión declarada | Nota |
|---|---|---|---|
| UI | React | `^19.2.7` | Frontend separado que consume la API REST |
| Lenguaje | TypeScript | `^6.0.3` | `strict` **no** activado |
| Build | Vite | `^7.3.6` | Elegida sobre Vite 8 por compatibilidad con `laravel-vite-plugin` |
| Estilos | Tailwind CSS | `^4.3.2` | Vía `@tailwindcss/vite`, sin `tailwind.config.js` |
| Iconos | lucide-react | `^0.546.0` | Usado extensivamente |
| Animación | motion | `^12.23.24` | **Declarada pero nunca importada** — dependencia muerta |
| Tipos | @types/react, @types/react-dom, @types/node | — | — |

Scripts (`package.json`): `dev`, `build`, `preview`, `clean`, `lint`
(`lint` = `tsc --noEmit`; **no hay ESLint ni Prettier configurados**).

### 2.2 Estructura de carpetas

```
senavida-frontend/
├── index.html                 # Entry HTML, título de marca
├── vite.config.ts             # React + Tailwind plugin, alias '@' → raíz, HMR condicional
├── tsconfig.json              # ES2022, jsx: react-jsx, paths '@/*', SIN "strict"
├── .env.example               # Solo APP_URL (residuo de AI Studio) — sin variables reales
└── src/
    ├── main.tsx               # createRoot + StrictMode (10 líneas)
    ├── index.css              # @theme Tailwind v4: tokens de marca + utilidades a11y
    ├── vite-env.d.ts          # /// <reference types="vite/client" />
    ├── types.ts               # ★ Contrato de dominio (17 tipos)
    ├── App.tsx                # ★ Estado global + ruteo de vistas + handlers
    ├── data/
    │   ├── mockData.ts        # ★ Datos simulados (414 líneas)
    │   └── backendDoc.ts      # Schema SQL + snippets Laravel — CÓDIGO MUERTO
    └── components/
        ├── AppLogo.tsx            # Logo SVG, 3 variantes
        ├── PublicHeader.tsx       # Nav pública + panel de accesibilidad
        ├── PublicFooter.tsx       # Footer institucional
        ├── LandingPage.tsx        # ★ Landing de 12 secciones (1.082 líneas)
        ├── Login.tsx              # Formulario + selector de rol sandbox
        ├── DashboardContainer.tsx # ★ Shell: sidebar, header, switch de rol
        ├── DashboardAdmision.tsx      # Validación CTA + apertura de ficha
        ├── DashboardCategorizacion.tsx# Signos vitales + triage C1-C5
        ├── DashboardMedico.tsx        # Notas, intérprete, cierre, consentimientos
        ├── DashboardAdmin.tsx         # Pictogramas, auditoría, config TI
        └── PatientView.tsx        # ★ Portal del paciente (1.012 líneas)
```

**Carpetas/archivos críticos para el backend:**

1. `src/types.ts` — la **fuente de verdad del contrato**. Cada interfaz mapea a
   una tabla o a un recurso de API.
2. `src/data/mockData.ts` — muestra la **forma exacta y los valores de ejemplo**
   que la UI espera recibir. Es el mejor insumo para escribir seeders y factories.
3. `src/App.tsx` — cada handler (`handleStartSession`, `handleCloseSession`,
   `handleConsentToggle`, `handleSendMessage`, `handleAdvanceStage`,
   `handleAddConsentRequest`) es **una futura llamada al backend**.
4. `src/data/backendDoc.ts` — **no está importado en ninguna parte**. Contiene
   465 líneas con un schema PostgreSQL propuesto y 5 snippets PHP (modelo,
   controlador, middleware, policy, rutas). Es documentación de referencia útil,
   pero **no es código en uso** y hay divergencias respecto a `types.ts`
   (ver §11.4).

### 2.3 Patrón arquitectónico actual

```
                        App.tsx
        ┌───────── (todo el estado global) ─────────┐
        │  currentView | user | session | vitals    │
        │  triage | consents | chatHistory          │
        │  calledLocation | accessibilitySettings   │
        └──────────────────┬────────────────────────┘
                           │ props + callbacks (prop drilling puro)
        ┌──────────────────┼──────────────────────────┐
        │                  │                          │
  PublicHeader        LandingPage / Login      DashboardContainer
                                                      │
                       ┌───────────┬──────────┬───────┴──────┐
                  Admision   Categorizacion  Medico     PatientView
                                                        DashboardAdmin
```

Características del patrón:

- **Sin router.** `currentView` es una unión de strings
  (`'landing' | 'login' | 'dashboard'`) y la navegación de la landing es
  `scrollIntoView` sobre anclas (`App.tsx:56-63`). **No hay URLs.** Esto es lo
  primero que cambia al pasar a rutas REST reales.
- **Sin store global** (Redux/Zustand/Context). Solo `useState` + prop drilling.
  `DashboardContainer` recibe **18 props**.
- **Sin capa de servicios.** No hay `api/`, `services/`, ni cliente HTTP.
- **Estado huérfano en componentes hijos:** varias piezas de estado clínico viven
  **solo** dentro de un componente y se pierden al cambiar de rol o desmontar:
  - `notesHistory` (notas clínicas firmadas) — `DashboardMedico.tsx:61`
  - `interpreterStatus`, `videoActive` — `DashboardMedico.tsx:66-67`
  - `vitalsSaved`, `triageSaved` — `DashboardCategorizacion.tsx:48-49`
  - `pictograms` (toggles del mantenedor) — `DashboardAdmin.tsx:17`
  - `sessionTimeout` — `DashboardAdmin.tsx:19`
- **Acceso directo a mocks desde componentes de presentación:** `mockPatient` se
  importa directamente en `DashboardAdmision`, `DashboardCategorizacion`,
  `DashboardMedico` y `PatientView`, **saltándose el objeto `session`**. Esto es
  deuda que el backend debe forzar a corregir (§11.2).

### 2.4 Sistema de diseño

Tokens de marca definidos con la directiva `@theme` de Tailwind v4 en
`src/index.css` (no hay `tailwind.config.js`):

- Paleta: `brand-primary #3ea5e1`, `brand-dark #0f172a`, `brand-turquoise #1fb9a4`,
  `brand-coral #dc2626`, `brand-yellow #f59e0b`, `brand-success #16a34a`, etc.
- Tipografías: **Inter** (base), **Atkinson Hyperlegible** (modo accesible),
  **JetBrains Mono** (datos/códigos).
- Utilidades de accesibilidad: `.accessible-font`, `*:focus-visible` con outline
  de 3px, scrollbars personalizados.

**Modo alto contraste:** implementado como **prop booleano `highContrast`**
propagado manualmente a través de casi todos los componentes, con ternarios
inline. No usa `data-theme` ni clases CSS. Es una decisión de UI que **no afecta
al backend**, salvo si se decide persistir las preferencias de accesibilidad por
usuario (`DECISIÓN PENDIENTE`, ver §6.9).

---

## 3. Flujo completo del usuario

### 3.1 Mapa de vistas

```
LANDING (currentView='landing')
   │  secciones ancladas: inicio, que-es, como-funciona, pictogramas,
   │                      seguridad, faq, contacto
   │  + demo cámara de señas   + carrusel/buscador de pictogramas
   │  + formulario de contacto + FAQ colapsable
   │
   ├─► "Acceso Institucional" ──► LOGIN (currentView='login')
   │                                 │
   │                                 └─► onLoginSuccess(role, center, unit)
   │                                        │
   └────────────────────────────────────────▼
                                    DASHBOARD (currentView='dashboard')
                                          │
             ┌────────────┬───────────────┼───────────────┬──────────────┐
        DashboardAdmin  Admision   Categorizacion     Medico        PatientView
```

### 3.2 Paso a paso — flujo público (sin autenticar)

1. **Aterrizaje.** El usuario llega a la landing. Header sticky con 7 ítems de
   navegación (`PublicHeader.tsx:36-44`) que hacen scroll suave a secciones.
2. **Panel de accesibilidad.** Botón ⚙ abre un dropdown con tres controles:
   fuente accesible (Atkinson), alto contraste, y tamaño de texto
   (1.0 / 1.15 / 1.3). **Estado en memoria, no persistido.**
3. **Exploración de pictogramas.** Sección `#pictogramas` con:
   - Buscador de texto libre que filtra por `title`, `phrase` y `speechText`
     (`LandingPage.tsx:562-584`).
   - 5 tabs de categoría.
   - Carrusel horizontal con flechas, snap, barra de progreso y estado vacío.
   - Botón "Escuchar Voz" por tarjeta → **Web Speech API del navegador**
     (`speechSynthesis`, `lang='es-CL'`). **No requiere backend de TTS.**
   - Filtra por `pic.isActive` — el flag del mantenedor de admin ya se respeta.
4. **Demo de traductor de señas.** Cámara simulada: al pulsar "Simular Seña
   Médica" espera 1.500 ms y muestra una seña aleatoria de una lista de 5 con
   una confianza fija (`LandingPage.tsx:102-122`). **No accede a la cámara real.**
5. **FAQ.** 4 preguntas colapsables.
6. **Formulario de contacto.** Nombre, email, establecimiento, mensaje — los 4
   `required`. Al enviar ejecuta `alert('Mensaje enviado con éxito en esta
   demostración.')` (`LandingPage.tsx:1022-1026`). **No envía nada.**

### 3.3 Paso a paso — login

1. Se muestra un **banner "🧪 Sandbox Simulador Activo"** con 5 botones de rol
   (`Login.tsx:57-63`). Al elegir uno, **autorrellena** email y contraseña
   (`admision@hospital.cl` / `password123`, o `paciente@senavida.cl` /
   `paciente123`).
2. Si el rol ≠ `paciente`, se muestran: email institucional, contraseña (con
   toggle de visibilidad), selector de **Establecimiento** (2 opciones) y
   selector de **Unidad de Ingreso** (3 opciones).
3. Si el rol = `paciente`, **los campos de credenciales desaparecen por completo**
   y el submit pasa directo (`Login.tsx:34-37`). El portal del paciente hoy
   **no tiene autenticación alguna**.
4. Validación: solo comprueba que email y contraseña no estén vacíos, y solo
   para roles de personal. Mensaje: *"Por favor, ingresa tu correo institucional
   y contraseña."*
5. "¿Olvidaste tu clave?" → `alert('Demostración: Enlace de recuperación
   simulado.')`.
6. Al enviar, `onLoginSuccess(role, centerName, unitName)` construye un usuario
   ficticio en `App.tsx:65-75` con `id: 'usr-' + Date.now()`.

### 3.4 Paso a paso — Admisión / Ventanilla

**Estado A — sin sesión activa** (`DashboardAdmision.tsx:76-256`):

1. Panel izquierdo: **"Validar Código de Atención (CTA)"**. Input de texto
   centrado + botón "Validar" + enlace "💡 Autorellenar código demo".
2. Al enviar, compara `code.toUpperCase() === 'SV-847291'`
   (`DashboardAdmision.tsx:48`). Si coincide, carga `mockPatient` en estado
   local. Si no: *"Código inválido. Escribe 'SV-847291' para simular el caso de
   demostración."*
3. Tras validar, aparece una tarjeta verde con nombre, RUT, edad + fecha de
   nacimiento, previsión, teléfono y preferencia de comunicación.
4. Panel derecho: **"Ficha de Registro Pre-ingresada (Lectura)"** con un aviso
   explícito de que **no es editable por el personal**:
   > *"Esta ficha fue completada y autorizada por la paciente … al momento de
   > registrarse en su aplicación móvil. No es editable por el personal de salud
   > para resguardar la exactitud de sus preferencias y su autonomía clínica."*
5. Campos mostrados: preferencia de comunicación, RUN, fecha de nacimiento,
   previsión, CESFAM, teléfono, dirección, **alergias críticas** (chips rojos),
   **motivo de consulta declarado**, **contacto de emergencia**.
6. Botón **"Iniciar Atención Inclusiva en Urgencias"** → `onStartSession(patient)`
   → crea `MedicalSession` con `status: 'active'`, `currentStage: 'Admisión'`,
   IDs de organización/centro/unidad **hardcodeados**
   (`App.tsx:84-86`), y resetea chat, vitals, triage, consents y llamado.

**Estado B — con sesión activa** (`DashboardAdmision.tsx:257-427`):

7. Resumen lateral del paciente + ficha rápida (leída de `mockPatient`, **no de
   la sesión**).
8. Botón **"Derivar a Categorización"** → `onAdvanceStage('Categorización')`,
   que inyecta un mensaje de sistema en el chat: *"Paciente derivada a sala de
   Categorización."* (`App.tsx:100-118`).
9. **Convocatoria de Paciente:** `select` con 3 destinos + botón "📢 Notificar
   Dirección". Setea `calledLocation` y **además** envía un mensaje de chat
   `📢 LLAMADO A PACIENTE: Por favor diríjase a: {destino}`. Botón "[Quitar]"
   para cancelar el llamado.
10. **Panel de conversación** a pantalla completa: burbujas paciente/staff,
    badge de pictograma con emoji, hora local, input de texto + botón enviar.

### 3.5 Paso a paso — Categorización (TENS)

Sin sesión activa: pantalla vacía con mensaje *"Actualmente no hay ninguna
atención clínica activa en el sistema."*

Con sesión activa (`DashboardCategorizacion.tsx:135-461`):

1. **Sidebar** con datos del paciente, ficha rápida, botón "Derivar a Consulta
   Médica", convocatoria (4 destinos) y un mini-chat de 460 px.
2. **Captura de Signos Vitales** — formulario con 8 campos:
   PA sistólica (def. 120), PA diastólica (def. 80), temperatura (def. 36.5,
   `step=0.1`), saturación O₂ (def. 98), frecuencia cardíaca (def. 72),
   frecuencia respiratoria (def. 16), escala de dolor (`select` 0–10, def. 4) y
   observaciones (texto libre).
3. Al guardar corre **tres validaciones de rango** con `alert()` bloqueante
   (`DashboardCategorizacion.tsx:67-78`) — ver §8.3. Si pasa, construye
   `VitalSigns` con `recordedBy: 'Enfermera Universitaria'` (**string literal,
   no ID de usuario**) y muestra confirmación verde.
4. **Categorización de Urgencia (DAU)** — 5 botones C1–C5 con color, nombre y
   descripción (`DashboardCategorizacion.tsx:54-60`). Default `C3`.
5. Textarea "Fundamento de Categorización" (prellenado). Botón "Confirmar
   Categorización" → crea `TriageRecord` con
   `symptoms: ['Cefalea', 'Mareos', 'Náuseas']` **hardcodeado**
   (`DashboardCategorizacion.tsx:110`) y `recordedBy: 'Enfermero de Turno'`.
6. Tras guardar el triage, **envía automáticamente un mensaje al paciente** con
   el nivel asignado y la instrucción de esperar
   (`DashboardCategorizacion.tsx:119-122`).
7. "Derivar a Consulta Médica" muestra un `alert()` de **advertencia no
   bloqueante** si faltan vitals o triage, pero **avanza igual**
   (`DashboardCategorizacion.tsx:179-184`).

### 3.6 Paso a paso — Consulta Médica

Con sesión activa (`DashboardMedico.tsx:133-634`):

1. **Columna izquierda:**
   - Resumen clínico + ficha de admisión.
   - Tarjeta de **triage** (si existe): color, código, nombre, observaciones.
   - Grilla de **signos vitales** (si existen): PA, SatO₂, temperatura, dolor.
   - **Envío de comprobante a contactos:** radios con 2 contactos
     preregistrados **hardcodeados** (`DashboardMedico.tsx:80-83`). Botón
     "📬 Solicitar Consentimiento a Paciente" → `onAddConsentRequest(...)` crea
     un `ConsentRequest` de tipo `share_with_contacts` en estado `pending`. La
     UI luego muestra 4 estados: sin solicitud / esperando / enviado y
     consentido / rechazado.
   - **Convocatoria a Box** (4 destinos).
   - Botón **"🔒 Cerrar Sesión Médica"** → abre modal.
   - **Consentimientos otorgados:** lista de todos los consents con badge.
   - **Línea de tiempo:** 3 eventos **hardcodeados**
     (`DashboardMedico.tsx:125-129`).
2. **Columna derecha:**
   - **Intérprete Remoto de LSCh:** botón "Solicitar Intérprete" →
     `interpreterStatus='requested'` → tras `setTimeout(3000)` pasa a
     `'assigned'` → botón "Conectar Videollamada" → muestra un marco de video
     falso con *"CONECTADO: Juan Pérez (Intérprete Certificado LSCh)"* y
     *"Provider: WebRTC Room SV-847291-INT"* (`DashboardMedico.tsx:431-486`).
   - **Chat clínico** de 380 px con botón TTS por mensaje. **Oculta los mensajes
     de sistema** (`DashboardMedico.tsx:501`).
   - **Registro de Nota Clínica Firmada:** `select` de tipo (5 opciones) +
     textarea `required`. Al firmar crea `ClinicalNote` con
     `status: 'signed'`, `version: 1`, `authorId: 'doc-001'`,
     `authorName: 'Dr. Andrés Soto'` — **todos hardcodeados**.
   - Historial de notas firmadas **local al componente**.
3. **Modal de cierre:** advertencia (*"el chat quedará bloqueado de forma
   permanente, el código de acceso temporal expirará y se emitirá el resumen al
   paciente sordo"*), `select` de motivo (3 opciones fijas) y textarea de
   resumen de egreso. Al confirmar → `onCloseSession(reason, summary)` que:
   - marca `status: 'closed'`, `currentStage: 'Cerrado'`,
   - inyecta mensaje de sistema *"Sesión cerrada de forma permanente por: … .
     Código de acceso expirado."*,
   - lanza `alert('La sesión se ha cerrado y bloqueado con éxito. Se generaron
     las firmas de auditoría.')`.

   > **Nota crítica:** el cierre **no bloquea realmente el chat**. El input sigue
   > operativo. Es la UI declarando una regla que **el backend debe hacer
   > cumplir** (§8.7).

### 3.7 Paso a paso — Portal del Paciente

`PatientView.tsx` (1.012 líneas). Sin autenticación real.

1. **Cabecera:** saludo, preferencia de comunicación y **"CÓDIGO ACTIVO:
   SV-847291"** (literal hardcodeado, `PatientView.tsx:231`).
2. **Ficha colapsable "Ver mis Datos de Registro"**: RUT, fecha de nacimiento,
   previsión, CESFAM, teléfono, dirección — todo desde `mockPatient`.
3. **Banner de llamado (paging):** si `calledLocation` está seteado, muestra un
   banner grande con la ubicación, dispara **TTS automáticamente** vía
   `useEffect` (`PatientView.tsx:101-105`), y ofrece dos botones: "🔊 Escuchar
   Voz (TTS)" y "✓ Entendido, Voy 👍" (que limpia el llamado —
   **acuse de recibo**).
4. **Banner de consentimiento pendiente:** si existe un consent
   `share_with_contacts` en `pending`, muestra la descripción y dos botones:
   "No Autorizar Envío" / "✓ Sí, Autorizar y Compartir".
5. **Nota de accesibilidad permanente** recordando que no todas las personas
   sordas leen español con fluidez.
6. **Tres pestañas principales:**

   **6a. 🎨 Dibujos / Señas** — con 3 sub-pestañas:
   - **Pizarra de Dibujo:** `<canvas>` 500×240 con soporte mouse + touch, lápiz
     y borrador, 4 colores, 3 grosores, botón limpiar. Input de texto
     explicativo + botón TTS. Botón "Enviar y Hablar al Médico" que envía un
     mensaje de **texto** con el formato
     `🎨 [Dibujo de Pizarra]: "{texto}"`. **La imagen del canvas nunca se
     exporta ni se envía** (`PatientView.tsx:172-178`).
   - **Traductor de Señas:** cámara simulada. Al activar, muestra 6 frases
     clínicas predefinidas; al elegir una, espera 1.200 ms y produce una
     detección con confianza `0.92 + random*0.07`. Botones "Volver a Escuchar" y
     "Enviar al Médico" (envía como **texto**, no como `gesture_prediction`, y
     **descarta la confianza**, `PatientView.tsx:652-656`).
   - **Mensajes y Pictogramas:** 8 mensajes rápidos con botón TTS individual +
     biblioteca de 23 pictogramas en 5 categorías, cada uno con emoji, título,
     frase y botón de audio. Tocar el pictograma lo envía al chat y lo verbaliza.

   **6b. 💬 Conversación** — chat de 500 px con fuentes grandes, TTS por mensaje,
   popover de respuestas rápidas y composer.

   **6c. 🛡️ Mis Permisos** — lista de consentimientos con botones "✓ Permitir" /
   "✗ Bloquear" por ítem. Pie: *"Todos tus permisos expiran automáticamente al
   finalizar tu sesión de atención de salud."*

### 3.8 Paso a paso — Administración TI

`DashboardAdmin.tsx`. **No consume la sesión clínica** (coherente con la policy
propuesta en `backendDoc.ts:407-409`, que niega a `admin_institucional` la
visualización de sesiones).

1. **3 tarjetas de métricas hardcodeadas:** "42 Usuarios", "3.4K Peticiones",
   "100% Repudiable".
2. **Mantenedor de Pictogramas:** buscador por título/frase + tabla con columnas
   Símbolo / Título-Frase / Voz Sintetizada / Estado. Toggle `isActive` por fila
   (solo estado local). Botón "Agregar" → `alert()`.
3. **Configuración de Seguridad TI:** input numérico de expiración por
   inactividad (default 20 minutos) + `select` de intentos máximos de CTA
   fallidos (3 / 5 / sin bloqueo). Botón "Guardar Configuración" → `alert()`.
4. **Registro de Acceso y Auditoría:** 4 entradas hardcodeadas con `action`,
   `resource`, `user`, `time`, `ip`, `severity` (`info`/`warning`/`critical`).
   Botón "Exportar Logs Firmados" → `alert()`.

> **Brecha:** la descripción del rol en `Login.tsx:61` y en la landing
> (`LandingPage.tsx:794-796`) promete **"Gestión de usuarios"** / *"Habilita o
> restringe cuentas"*, pero **no existe ninguna UI de CRUD de usuarios**. El
> backend debe proveer los endpoints igualmente (§6.8) porque son requisito
> declarado del producto.

---

## 4. Módulos del sistema

| # | Módulo | Componentes | Estado en el frontend | Prioridad backend |
|---|---|---|---|---|
| M1 | **Autenticación y sesión de usuario** | `Login`, `App` | Simulado sin validación | 🔴 Crítica |
| M2 | **Catálogos institucionales** (organización, centro, unidad) | `Login` | 2 centros / 3 unidades hardcodeados | 🔴 Crítica |
| M3 | **Código Temporal de Atención (CTA)** | `DashboardAdmision` | Comparación literal con `'SV-847291'` | 🔴 Crítica |
| M4 | **Paciente y ficha de registro** | `DashboardAdmision`, `PatientView`, + 2 | `mockPatient` importado directo | 🔴 Crítica |
| M5 | **Sesión médica y etapas** | `App`, `DashboardContainer`, todos los dashboards | `useState` en memoria | 🔴 Crítica |
| M6 | **Consentimientos granulares** | `PatientView`, `DashboardMedico` | 4 consents mock, toggles locales | 🔴 Crítica |
| M7 | **Chat / mensajería inclusiva** | Los 5 dashboards | Array en memoria, sin realtime | 🔴 Crítica |
| M8 | **Signos vitales** | `DashboardCategorizacion` | Formulario → `useState` | 🟠 Alta |
| M9 | **Triage / categorización C1–C5** | `DashboardCategorizacion` | Niveles hardcodeados | 🟠 Alta |
| M10 | **Notas clínicas firmadas** | `DashboardMedico` | `console.log` + estado local | 🟠 Alta |
| M11 | **Convocatoria / llamado a paciente** | Admisión, Categorización, Médico, `PatientView` | String global `calledLocation` | 🟠 Alta |
| M12 | **Pictogramas y mensajes rápidos** | `PatientView`, `LandingPage`, `DashboardAdmin` | 23 pictogramas + 8 quick messages mock | 🟠 Alta |
| M13 | **Línea de tiempo de atención** | `DashboardMedico` | 3 eventos hardcodeados | 🟡 Media |
| M14 | **Auditoría** | `DashboardAdmin` | 4 logs hardcodeados | 🟡 Media |
| M15 | **Intérprete remoto / videollamada** | `DashboardMedico` | `setTimeout` + marco falso | 🟡 Media |
| M16 | **Traductor de señas por cámara (IA)** | `PatientView`, `LandingPage` | Frases predefinidas + delay | 🟢 Baja / externa |
| M17 | **Pizarra de dibujo** | `PatientView` | Canvas local, nunca exportado | 🟢 Baja |
| M18 | **Configuración de seguridad TI** | `DashboardAdmin` | 2 campos → `alert()` | 🟡 Media |
| M19 | **Gestión de usuarios** | — | **No existe UI** (prometido en copy) | 🟡 Media |
| M20 | **Formulario de contacto público** | `LandingPage` | `alert()` | 🟢 Baja |
| M21 | **Preferencias de accesibilidad** | `PublicHeader`, `App` | En memoria, no persistido | 🟢 Baja |
| M22 | **Síntesis de voz (TTS)** | Transversal | Web Speech API del navegador | ⚪ Sin backend |

---

## 5. Entidades y relaciones

> Notación: los campos provienen de `src/types.ts` (frontend, camelCase) y del
> schema propuesto en `src/data/backendDoc.ts` (SQL, snake_case). Se indica
> cuando un campo existe **solo** en uno de los dos.

### 5.1 Diagrama de relaciones inferido

```
Organization 1─┬─* HealthCenter 1─┬─* Unit
               │                  │
               │                  └─* User (staff)
               └─────────────────────* User

Patient 1─* PatientContact
Patient 1─* TemporaryAccessCode (CTA)
Patient 1─* MedicalSession

MedicalSession *─1 Patient
              *─1 HealthCenter, *─1 Unit, *─1 Organization
              *─1 User (created_by)   *─0..1 User (closed_by)
              1─* Consent
              1─* ChatMessage
              1─* VitalSigns
              1─* TriageRecord
              1─* ClinicalNote
              1─* TimelineEvent
              1─* PatientCall          ← NUEVA, no existe en el schema propuesto
              1─* InterpreterRequest   ← NUEVA, no existe en el schema propuesto
              1─0..1 TemporaryAccessCode (consumido)

PictogramCategory 1─* Pictogram
Pictogram 1─* ChatMessage (pictogram_path / pictogram_id)

AuditLog *─0..1 User, *─0..1 Patient, *─0..1 MedicalSession
```

### 5.2 Fichas de entidad

---

#### E1 · `Organization`

Solo en el schema propuesto (`backendDoc.ts:17-24`). El frontend únicamente
guarda `organizationId` en `MedicalSession` (valor hardcodeado
`'org-chile-salud'`, `App.tsx:84`).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID | PK |
| `name` | string(255) | requerido |
| `rut` | string(20) | único, requerido |
| `is_active` | bool | default `true` |
| `created_at` / `updated_at` | timestamp | |

**Relaciones:** `hasMany` HealthCenter, `hasMany` User.

---

#### E2 · `HealthCenter` (Establecimiento)

Renderizado en el `select` de `Login.tsx:46-49` y en el breadcrumb del header.

| Campo | Tipo | Origen | Notas |
|---|---|---|---|
| `id` | UUID | ambos | En el mock: `'hc-villarrica'`, `'hc-temuco'` |
| `organization_id` | UUID | SQL | FK |
| `name` | string(255) | ambos | `"Hospital Regional de Villarrica"`, `"Complejo Hospitalario Padre Las Casas"` |
| `code` | string(50) | SQL | único — comentado como *"Código DEIS o interno"* |
| `address` | text | SQL | |
| `is_active` | bool | SQL | |

**Relaciones:** `belongsTo` Organization; `hasMany` Unit, User, MedicalSession.

> ⚠️ **Inconsistencia detectada:** el `select` lista `"Hospital Regional de
> Villarrica"` pero `handleSubmit` envía `"Hospital de Villarrica"`
> (`Login.tsx:41`). Al normalizar contra el backend, el nombre debe venir de una
> sola fuente.

---

#### E3 · `Unit` (Unidad de ingreso)

`Login.tsx:51-55`.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID | `'unit-urgencias'`, `'unit-pediatria'`, `'unit-maternidad'` |
| `health_center_id` | UUID | FK |
| `name` | string(255) | `"Servicio de Urgencia Adulto"`, `"Unidad de Urgencia Infantil"`, `"Maternidad y Ginecología"` |
| `is_active` | bool | |

> ⚠️ **Bug detectado:** hay **3 unidades** en el `select` pero `handleSubmit`
> usa un ternario binario (`Login.tsx:42`): cualquier unidad distinta de
> `unit-urgencias` se rotula `"Unidad de Pediatría"`. Maternidad se pierde.

---

#### E4 · `User` (personal de salud)

Interfaz `User` en `types.ts:8-16`. **Nunca se usa**: `App.tsx:29-36` declara un
tipo anónimo inline con los mismos campos menos `isActive`.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID | En el mock: `'usr-' + Date.now()` |
| `name` | string | |
| `email` | string | único; el mock usa `{role}@senavida.cl` |
| `role` | `UserRole` | ver E5 |
| `healthCenter` | string? | **nombre**, no ID, en el frontend |
| `unit` | string? | **nombre**, no ID |
| `isActive` | bool | en el tipo, no en el estado de `App` |
| `password` | string | solo SQL |
| `organization_id`, `health_center_id`, `unit_id` | UUID | solo SQL |
| `remember_token` | string(100) | solo SQL |

> ⚠️ El frontend almacena **nombres legibles** de centro y unidad, el SQL
> almacena **FKs**. El backend debe entregar **ambos**: el ID para lógica y el
> nombre para el breadcrumb.

---

#### E5 · `Role` / `UserRole`

`types.ts:6` — unión de 5 literales:

| Valor | Etiqueta en UI | Fuente |
|---|---|---|
| `admin_institucional` | "Administrador TI" / "Administración TI" | `DashboardContainer.tsx:91`, `Login.tsx:61` |
| `admision` | "Admisión / Ventanilla" | `DashboardContainer.tsx:92` |
| `categorizacion` | "Categorización (TENS)" | `DashboardContainer.tsx:93` |
| `medico` | "Médico Urgenciólogo" | `DashboardContainer.tsx:94` |
| `paciente` | "Portal del Paciente" | `Login.tsx:62` |

> **Actualización v2.1 — sexto rol `super_admin`.** El backend introdujo un rol
> adicional, `super_admin`, no presente en el prototipo original. Es un rol
> libre (sin centro/unidad asociados) que gestiona la estructura del sistema:
> crea organizaciones, centros, unidades y usuarios en cualquier centro. El
> `admin_institucional` queda limitado a crear unidades y usuarios dentro de su
> propio centro. El primer `super_admin` se crea manualmente (seeder/Tinker);
> no es un rol asignable desde el auto-registro (que de todas formas no existe).

`DECISIÓN PENDIENTE`: ¿los roles son un **enum** en la tabla `users` (1 rol por
usuario, como sugiere la unión de tipos) o una **relación N:M** (como sugiere
`hasAnyRole([...])` en la policy de `backendDoc.ts:411`)? El frontend asume
**un solo rol por usuario**. Recomendación: modelar N:M igualmente, con un rol
activo por sesión, para no bloquear el caso "TENS que también hace admisión".

> ⚠️ `paciente` es un rol en el mismo enum que el personal, pero el paciente **no
> tiene fila en `users`** en el schema propuesto (tiene fila en `patients`). Esta
> ambigüedad debe resolverse antes de escribir el guard de autenticación (§11.1).

---

#### E6 · `Patient`

`types.ts:18-40`. Es la entidad con **mayor divergencia** entre frontend y schema.

| Campo (frontend) | Tipo | ¿En el SQL propuesto? | Ejemplo del mock |
|---|---|---|---|
| `id` | string | ✅ | `'pat-001'` |
| `name` | string | ✅ | `'Ana María Torres'` |
| `age` | number | ✅ | `28` |
| `communicationPreference` | string | ✅ | `'LSCh (Lengua de Señas Chilena) y texto escrito'` |
| `ctaCode` | string | ❌ **falta en SQL** | `'SV-847291'` |
| `rut` | string? | ❌ **falta en SQL** | `'19.482.903-K'` |
| `birthDate` | string? | ❌ **falta en SQL** | `'15/11/1997'` — formato `dd/mm/yyyy`, **no ISO** |
| `prevision` | string? | ❌ **falta en SQL** | `'FONASA B'` |
| `address` | string? | ❌ **falta en SQL** | `'Av. Pedro de Valdivia 1420, Depto 402, Temuco'` |
| `cesfam` | string? | ❌ **falta en SQL** | `'CESFAM Villarrica Centro'` |
| `phone` | string? | ❌ **falta en SQL** | `'+56 9 7462 8193'` |
| `allergies` | string[]? | ✅ `JSONB` | `['Penicilina', 'Lactosa']` |
| `bloodType` | string? | ✅ | `'O-Rh Positive'` — formato no estándar, **nunca renderizado** |
| `conditions` | string[]? | ✅ `JSONB` | `['Hipotiroidismo leve']` — **nunca renderizado** |
| `emergencyContact` | objeto | ✅ como tabla aparte | ver E7 |

**Campos adicionales que la UI muestra pero no están en el tipo:**
- **Motivo de consulta inicial declarado** — `reasonOfVisit` es `useState` local
  en `DashboardAdmision.tsx:42`. Debe pertenecer a `Patient` o a
  `MedicalSession`. `DECISIÓN PENDIENTE`: recomendación → `MedicalSession`,
  porque cambia en cada visita.

`DECISIÓN PENDIENTE` — **`age` vs `birthDate`:** el frontend guarda ambos y los
muestra juntos (`"28 años (15/11/1997)"`). Almacenar `age` es un antipatrón
(queda obsoleto). Recomendación: persistir solo `birth_date` (ISO 8601) y
exponer `age` como atributo calculado.

---

#### E7 · `PatientContact` (contacto de emergencia)

Aparece en tres formas **incompatibles**:

1. `types.ts:33-39` — objeto **singular** anidado en `Patient`:
   `{ name, relationship, phone, allowSos, allowUpdates }`.
2. `mockData.ts:284-290` — un contacto: *Carlos Torres Solís, Padre*.
3. `DashboardMedico.tsx:80-83` — array **hardcodeado de 2 contactos**
   (`Carlos Torres Solís` / Padre, `Marta Torres Aguirre` / Hermana) que
   **contradice** el mock singular.

El schema propuesto (`backendDoc.ts:72-87`) sí modela una tabla `patient_contacts`
1:N, que es lo correcto:

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID | |
| `patient_id` | UUID | FK |
| `name` | string(255) | |
| `relationship` | string(100) | "Padre", "Hermana" |
| `phone` | string(50) | |
| `email` | string(255)? | no usado en UI |
| `priority` | int | default 1 — no usado en UI |
| `allow_sos` | bool | en el tipo del frontend, **nunca leído** |
| `allow_updates` | bool | en el tipo del frontend, **nunca leído** |
| `allow_clinical_information` | bool | solo SQL |
| `is_active`, `blocked_at` | bool / ts | solo SQL |

**Resolución requerida:** adoptar la relación **1:N** y eliminar el objeto
singular de `Patient`.

---

#### E8 · `TemporaryAccessCode` (CTA)

No existe como tipo en `types.ts`; solo como `Patient.ctaCode` (string) y como
literal `'SV-847291'` repartido por la UI. El schema propuesto
(`backendDoc.ts:89-101`) es la mejor referencia:

| Campo | Tipo | Notas de la UI |
|---|---|---|
| `id` | UUID | |
| `patient_id` | UUID | FK |
| `code_hash` | string(255) | **hash**, no el código plano |
| `status` | enum | `active`, `consumed`, `expired`, `blocked` |
| `expires_at` | timestamp | requerido |
| `used_at` | timestamp? | |
| `failed_attempts` | int | default 0 |
| `max_attempts` | int | default 3 — **configurable desde Admin** (`DashboardAdmin.tsx:185-189`: 3 / 5 / sin bloqueo) |
| `health_center_id` | UUID | FK |

**Formato del código observado:** `SV-` + 6 dígitos. Comparación
**case-insensitive** en el frontend (`code.toUpperCase()`).

Reglas declaradas en la landing (`LandingPage.tsx:130-131`):
> *"Es un código corto e **intransferible** generado al ingreso del paciente …
> asegurando que sólo el funcionario facultado y **en presencia física del
> paciente** pueda iniciar la mediación."*

Y en el paso 01 (`LandingPage.tsx:310`): *"intransferible y de **un solo uso**"*.

---

#### E9 · `MedicalSession`

`types.ts:53-70`. Entidad central.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | `'sess-' + Date.now()` en el mock |
| `patientId` | string | FK |
| `patientName` | string | **denormalizado** — la UI lo lee directo |
| `patientAge` | number | **denormalizado** |
| `communicationPreference` | string | **denormalizado** |
| `organizationId` | string | hardcodeado `'org-chile-salud'` |
| `healthCenterId` | string | hardcodeado `'hc-villarrica'` |
| `unitId` | string | hardcodeado `'unit-urgencias'` |
| `status` | `SessionStatus` | ver abajo |
| `startedAt` | string ISO | |
| `endedAt` | string ISO? | **nunca seteado por el frontend** |
| `currentStage` | string | **texto libre**, ver abajo |
| `createdBy` | string | ID de usuario |
| `closedBy` | string? | **nunca seteado por el frontend** |
| `closureReason` | string? | seteado al cerrar |
| `summary` | string? | seteado al cerrar |
| **`ctaCode`** | — | ❌ **FALTA** — ver TODO explícito abajo |

**TODO explícito en el código** (`DashboardContainer.tsx:262`):
```tsx
Código CTA: <strong>{/* TODO: MedicalSession no incluye el código CTA;
  cuando el backend lo entregue, reemplazar este valor fijo */ 'SV-847291'}</strong>
```
👉 **El backend DEBE incluir el código CTA (o su referencia) en el recurso
`MedicalSession`.**

**`SessionStatus`** (`types.ts:42-51`) — 9 valores declarados:
`pending_consent`, `active`, `in_admission`, `in_triage`, `in_medical_care`,
`waiting_interpreter`, `closed`, `cancelled`, `expired`.

> ⚠️ El frontend **solo produce 3**: `'active'` (`App.tsx:87`, `mockData.ts:302`)
> y `'closed'` (`App.tsx:122`). Los 6 restantes nunca se generan ni se leen.

**`currentStage`** — string libre. Valores observados:
`'Admisión'` → `'Categorización'` → `'Consulta Médica'` → `'Cerrado'`.

> ⚠️ **Redundancia de máquina de estados:** `status` y `currentStage` codifican
> información solapada (`in_triage` vs `'Categorización'`). `DECISIÓN PENDIENTE`:
> recomendación → **una sola máquina de estados** con `status` como enum
> canónico y `current_stage` derivado o eliminado. Si se mantienen ambos, el
> backend debe garantizar su consistencia.

---

#### E10 · `Consent` / `ConsentRequest`

`types.ts:85-94`.

| Campo | Tipo | ¿En SQL? | Notas |
|---|---|---|---|
| `id` | string | ✅ | |
| `sessionId` | string | ✅ `medical_session_id` | |
| `consentType` | `ConsentType` | ✅ | ver enum abajo |
| `title` | string | ❌ **falta** | *"Inicio de Atención Inclusiva"* |
| `description` | string | ❌ **falta** | texto largo mostrado al paciente |
| `status` | enum | ✅ | `pending` \| `granted` \| `rejected` \| `revoked` |
| `requestedAt` | string ISO | ✅ (implícito) | |
| `respondedAt` | string ISO? | ✅ como `granted_at`/`revoked_at` | **nunca seteado por el frontend** |
| — | | ✅ `patient_id` | solo SQL |
| — | | ✅ `expires_at` | solo SQL |
| — | | ✅ `evidence` JSONB | solo SQL — *"Datos de IP, hash, etc."* |

**`ConsentType`** (`types.ts:72-83`) — 11 valores:
`start_care`, `basic_data`, `clinical_data`, `location`, `contacts`,
`share_with_contacts`, `camera`, `microphone`, `visual_assistance`,
`interpreter`, `video_call`.

> ⚠️ Solo **4** aparecen en los datos mock: `start_care`, `clinical_data`,
> `camera`, `share_with_contacts` (`mockData.ts:308-345`). Los otros 7 son
> aspiracionales.

**`title` y `description` son dinámicos.** En
`DashboardMedico.tsx:264-268` se construyen en tiempo de ejecución
interpolando el nombre, parentesco y teléfono del contacto elegido:

```
title:       `Compartir Comprobante con ${contact.name}`
description: `¿Autorizas que el Dr. Andrés Soto comparta un comprobante de
              atención clínica con tu contacto de emergencia ${contact.name}
              (${contact.relationship}) al número ${contact.phone}?`
```

👉 `DECISIÓN PENDIENTE` **importante**: ¿el backend guarda `title`/`description`
como columnas de texto, o guarda un `consent_type` + un `payload` JSON
(`{contact_id: ...}`) y **renderiza** el texto desde plantillas i18n? La segunda
opción es superior (evita texto duplicado, permite traducir), pero **requiere que
el frontend deje de recibir `title`/`description` ya formados**. Definir antes de
implementar §7.6.

---

#### E11 · `ChatMessage`

`types.ts:113-127`.

| Campo | Tipo | ¿En SQL? | Notas |
|---|---|---|---|
| `id` | string | ✅ | |
| `sessionId` | string | ✅ | |
| `senderType` | `'patient'\|'staff'\|'system'` | ✅ | |
| `senderId` | string? | ✅ | NULL si paciente/sistema |
| `senderName` | string | ❌ **falta** | mostrado en cada burbuja |
| `messageType` | `MessageType` | ✅ | 7 valores |
| `body` | text | ✅ | requerido |
| `origin` | `MessageOrigin` | ✅ | 6 valores |
| `status` | `'sent'\|'delivered'\|'read'` | ✅ | |
| `sentAt` | string ISO | ✅ | |
| `confirmedByPatientAt` | string ISO? | ✅ | seteado al enviar si `senderType==='patient'` |
| `pictogramPath` | string? | ✅ vía `metadata` JSONB | **contiene el ID del pictograma**, no una ruta (`'pic-101'`) |
| `confidence` | number? | ❌ **falta** | comentado *"for gesture predictions"* — **nunca poblado** |
| — | | ✅ `delivered_at`, `read_at`, `deleted_at` | solo SQL |

**`MessageType`** (`types.ts:96-103`): `text`, `quick_message`, `pictogram`,
`speech_to_text`, `text_to_speech`, `gesture_prediction`, `system`.
> ⚠️ El frontend solo **produce** `text`, `quick_message`, `pictogram` y
> `system`. `gesture_prediction` **existe pero no se usa**: la seña detectada se
> envía como `'text'` (`PatientView.tsx:653`).

**`MessageOrigin`** (`types.ts:105-111`): `patient`, `admission`, `triage`,
`doctor`, `interpreter`, `system`. Mapeo real en `App.tsx:164-173`:
`paciente→patient`, `admision→admission`, `categorizacion→triage`,
`medico→doctor`. `interpreter` **nunca se produce**.

> ⚠️ `pictogramPath` mal nombrado: guarda `'pic-101'`, un **ID**. Renombrar a
> `pictogram_id` con FK real a `pictograms`.

---

#### E12 · `Pictogram`

`types.ts:129-138`. **No existe tabla en el schema propuesto** — debe crearse.

| Campo | Tipo | Ejemplo |
|---|---|---|
| `id` | string | `'pic-101'` |
| `categoryId` | string | `'cat-1'` |
| `title` | string | `'Dolor de cabeza'` |
| `phrase` | string | `'Me duele la cabeza'` — lo que se envía al chat |
| `iconName` | string | `'Activity'` — nombre de icono **Lucide** |
| `speechText` | string | `'Tengo dolor de cabeza'` — lo que lee el TTS |
| `isActive` | bool | toggle del mantenedor de admin; la landing lo respeta |
| `colorClass` | string | `'border-brand-coral bg-brand-coral-light/20 …'` |

> ⚠️ **`colorClass` contiene clases Tailwind crudas en la base de datos.** Es
> acoplamiento fuerte entre datos y presentación, y con Tailwind 4 (JIT) las
> clases generadas dinámicamente **pueden no compilarse** si no están en el
> `safelist` o en el código fuente. `DECISIÓN PENDIENTE`: recomendación →
> persistir un token semántico (`severity: 'critical'|'warning'|'info'|'neutral'`)
> y mapear a clases en el frontend.

> ⚠️ **`iconName` está desconectado.** El tipo dice *"Lucide icon mapping"* pero
> la UI **no lo usa**: renderiza emojis desde un `switch` de 24 casos
> hardcodeado, `getPictogramEmoji()` en `PatientView.tsx:21-58`. Esa función es
> **exportada e importada por 4 componentes** (`LandingPage`,
> `DashboardAdmision`, `DashboardCategorizacion`, `DashboardMedico`).
> 👉 Si se agregan pictogramas por el mantenedor de admin, **caerán al emoji
> fallback `'🏥'`**. El backend debe entregar el emoji (o un `image_path`) como
> **dato**, no como código.

**23 pictogramas** en 5 categorías (`mockData.ts:16-256`).

---

#### E13 · `PictogramCategory`

`types.ts:140-145`. **No existe tabla en el schema propuesto.**

| Campo | Tipo | Valores mock |
|---|---|---|
| `id` | string | `cat-1` … `cat-5` |
| `name` | string | Dolor, Síntomas, Necesidades, Información Médica, Respuestas |
| `slug` | string | `dolor`, `sintomas`, `necesidades`, `info-medica`, `respuestas` |
| `description` | string | ej. *"Localización e intensidad de dolores físicos"* |

> ⚠️ `description` **nunca se renderiza** en ninguna vista.

---

#### E14 · `QuickMessage`

`types.ts:147-152`. **No existe tabla en el schema propuesto.**

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | `qm-1` … `qm-8` |
| `phrase` | string | "Sí", "No", "No entiendo", "Repita por favor", "Necesito más tiempo", "Prefiero escribir", "Necesito ayuda", "Necesito intérprete" |
| `iconName` | string | Lucide — **nunca usado**, la UI dibuja `💬` fijo |
| `category` | string | `positive`, `negative`, `help`, `neutral`, `danger` — **nunca usado** para estilar |

> ⚠️ No tiene flag `isActive` (a diferencia de `Pictogram`), pero el mantenedor
> de admin no los gestiona. `DECISIÓN PENDIENTE`: ¿son un catálogo administrable
> o constantes del sistema?

---

#### E15 · `VitalSigns`

`types.ts:154-167`. Bien alineada con el SQL propuesto.

| Campo | Tipo | Unidad | Default UI | Rango validado |
|---|---|---|---|---|
| `id` | string | | | |
| `sessionId` | string | | | |
| `recordedBy` | string | | `'Enfermera Universitaria'` ⚠️ | debe ser **UUID de usuario** |
| `systolicPressure` | int | mmHg | 120 | ❌ sin validación |
| `diastolicPressure` | int | mmHg | 80 | ❌ sin validación |
| `temperature` | decimal(4,2) | °C | 36.5 | ✅ **30–45** |
| `oxygenSaturation` | int | % | 98 | ✅ **0–100** |
| `heartRate` | int | lpm | 72 | ✅ **20–250** |
| `respiratoryRate` | int | rpm | 16 | ❌ sin validación |
| `painLevel` | int | 0–10 | 4 | ✅ por `<select>` (0..10) |
| `measuredAt` | ISO | | `now()` | |
| `notes` | string? | | vacío | |

> ⚠️ `recordedBy` guarda un **string descriptivo** (`'Enfermera Universitaria'`,
> `'Enfermero de Turno'`) en vez del ID del usuario autenticado. El backend debe
> tomarlo de `auth()->id()` e **ignorar** cualquier valor que envíe el cliente.

---

#### E16 · `TriageRecord`

`types.ts:169-179`.

| Campo | Tipo | ¿En SQL? | Notas |
|---|---|---|---|
| `id` | string | ✅ | |
| `sessionId` | string | ✅ | |
| `recordedBy` | string | ✅ | mismo problema que E15 |
| `triageLevel` | `'C1'..'C5'` | ✅ | |
| `triageLevelName` | string | ❌ **falta** | *"Reanimación (Rojo)"* — es **catálogo**, no dato |
| `colorHex` | string | ❌ **falta** | `'#D95555'` — es **catálogo** |
| `symptoms` | string[] | ✅ JSONB | ⚠️ **hardcodeado** `['Cefalea','Mareos','Náuseas']` |
| `observations` | string | ✅ | textarea "Fundamento de Categorización" |
| `completedAt` | ISO | ✅ | |

**Catálogo de niveles** (`DashboardCategorizacion.tsx:54-60`) — debe vivir en una
tabla `triage_levels`:

| Código | Nombre | Hex | Descripción |
|---|---|---|---|
| C1 | Reanimación (Rojo) | `#D95555` | Riesgo vital inminente. Paro cardiorespiratorio o shock severo. |
| C2 | Emergencia (Naranja) | `#E8B949` | Riesgo de secuela grave o inestabilidad hemodinámica latente. |
| C3 | Urgencia Mediana (Amarillo) | `#9B6F08` | Condición aguda, requiere valoración diagnóstica rápida. |
| C4 | Consulta General (Verde) | `#3CA67C` | Paciente estable sin riesgo fisiológico evidente. |
| C5 | No Urgente (Azul) | `#176B87` | Patología de larga data o afección no aguda. |

> ⚠️ **`symptoms` no tiene UI de captura.** Es un array fijo. El backend debe
> aceptarlo, pero el frontend necesita un selector multi-opción — es un gap de
> producto (§11.3).

---

#### E17 · `ClinicalNote`

`types.ts:181-193`.

| Campo | Tipo | ¿En SQL? | Notas |
|---|---|---|---|
| `id` | string | ✅ | |
| `sessionId` | string | ✅ | |
| `authorId` | string | ✅ | ⚠️ hardcodeado `'doc-001'` |
| `authorName` | string | ❌ **falta** | ⚠️ hardcodeado `'Dr. Andrés Soto'` |
| `authorRole` | string | ❌ **falta** | ⚠️ hardcodeado `'Médico Urgenciólogo'` |
| `noteType` | enum | ✅ | 6 valores en el tipo |
| `content` | text | ✅ | `required` en el textarea |
| `status` | `'draft'\|'signed'` | ✅ | el frontend **siempre** crea `'signed'` |
| `signedAt` | ISO? | ✅ | |
| `version` | int | ✅ | el frontend **siempre** pone `1` |
| `createdAt` | ISO | ✅ | |
| — | | ✅ `supersedes_id` | solo SQL — versionado |

**`noteType`** — 6 valores en `types.ts:187`: `impression`, `diagnosis`,
`treatment`, `medication`, `indication`, `discharge_summary`.
> ⚠️ El `<select>` (`DashboardMedico.tsx:571-577`) solo ofrece **5**:
> `discharge_summary` **no es seleccionable**. Y el mapeo de etiquetas del
> historial (`DashboardMedico.tsx:623`) solo distingue `impression` y
> `diagnosis`; **todo lo demás se rotula "Indicaciones"**, lo que es incorrecto
> para `treatment` y `medication`.

Etiquetas del `<select>`:
`impression` → "Impresión Diagnóstica Inicial" · `diagnosis` → "Diagnóstico
Diferencial" · `treatment` → "Esquema Terapéutico" · `medication` →
"Medicamentos Administrados" · `indication` → "Indicaciones de Alta Médica".

**Regla declarada** (`DashboardMedico.tsx:611`): *"Guardada con hash SHA-256 en
base de datos"* y (`:580`) *"El contenido registrado se encripta y consolida en
el historial auditable"*.

> ⚠️ **`status: 'draft'` no tiene UI.** No hay botón "Guardar borrador". El
> backend debe soportarlo (está en el tipo y en el SQL) pero el frontend hoy
> firma siempre.

---

#### E18 · `TimelineEvent`

`types.ts:195-203`. **No existe tabla en el schema propuesto.**

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | |
| `sessionId` | string | ⚠️ los mocks usan `'1'`, no el ID real |
| `eventType` | string | `session_started`, `consent_granted`, `triage_recorded` |
| `actorName` | string | *"María José"*, *"Paciente"*, *"Enfermería"* |
| `description` | string | texto legible |
| `occurredAt` | string | ⚠️ **`'11:00'`, no ISO** — inconsistente con el resto |
| `iconName` | string | Lucide — **nunca usado** en el render |

`DECISIÓN PENDIENTE`: ¿la timeline es una **tabla propia** o una **proyección**
de `audit_logs` filtrada por sesión? Recomendación: **proyección**, para
mantener una sola fuente de verdad de eventos.

---

#### E19 · `AuditLog`

Solo en el schema propuesto (`backendDoc.ts:195-211`) y en el array hardcodeado
de `DashboardAdmin.tsx:27-32`.

| Campo (SQL) | Campo mostrado en UI | Ejemplo UI |
|---|---|---|
| `action` | `action` | `validate_cta`, `sign_clinical_note`, `revoke_consent_camera`, `create_user` |
| `patient_id` | `resource` | `'Ana María Torres'` (nombre, no ID) |
| `user_id` | `user` | `'María José (Admisión)'` |
| `occurred_at` | `time` | `'Hace 23 minutos'` (relativo) |
| `ip_address` | `ip` | `'192.168.12.44'` |
| `severity` | `severity` | `info` \| `warning` \| `critical` |
| `organization_id`, `health_center_id`, `medical_session_id` | — | no mostrados |
| `resource_type`, `resource_id` | — | no mostrados |
| `old_values`, `new_values` (JSONB) | — | no mostrados |
| `user_agent` | — | no mostrado |

**Acciones auditables identificadas en la UI:** validar CTA, iniciar sesión
médica, avanzar etapa, registrar signos vitales, confirmar triage, firmar nota
clínica, solicitar consentimiento, otorgar/rechazar/revocar consentimiento,
convocar paciente, acusar recibo de convocatoria, solicitar intérprete, iniciar
videollamada, cerrar sesión médica, habilitar/deshabilitar pictograma, cambiar
configuración de seguridad, crear usuario, exportar logs.

---

#### E20 · `PatientCall` (Convocatoria) — **ENTIDAD NUEVA**

**No existe en `types.ts` ni en el schema propuesto.** En el frontend es un
único `string | null` global: `calledLocation` (`App.tsx:44`).

Comportamiento observado:
- Tres roles pueden convocar (Admisión, Categorización, Médico), cada uno con su
  propia lista de destinos.
- Al convocar: setea `calledLocation` **y** envía un mensaje de chat.
- El paciente ve un banner grande, escucha el TTS automáticamente
  (`PatientView.tsx:101-105`) y puede **acusar recibo** con "✓ Entendido, Voy 👍"
  (que limpia el llamado).
- El personal puede cancelar con "[Quitar]".

Campos mínimos propuestos:

| Campo | Tipo | Origen |
|---|---|---|
| `id` | UUID | |
| `medical_session_id` | UUID | FK |
| `location_id` / `location_label` | string | ver E21 |
| `called_by` | UUID | usuario que convoca |
| `called_at` | timestamp | |
| `acknowledged_at` | timestamp? | botón "Entendido, Voy" |
| `cancelled_at` | timestamp? | botón "[Quitar]" |
| `status` | enum | `active` \| `acknowledged` \| `cancelled` |

---

#### E21 · `Location` / Box — **CATÁLOGO NUEVO**

Los destinos de convocatoria están **hardcodeados en 3 componentes con listas
distintas**:

| Componente | Destinos |
|---|---|
| `DashboardAdmision.tsx:324-326` | Sala de Categorización (Box A) · Sala de Espera General (Piso 1) · Box de Consulta Médica N° 3 |
| `DashboardCategorizacion.tsx:205-208` | los 3 anteriores **+** Box de Emergencias |
| `DashboardMedico.tsx:333-336` | Box de Consulta Médica N° 3 · Box de Emergencias N° 1 · Sala de Procedimientos (Piso 2) · Sala de Espera General |

> ⚠️ Nótese que **"Box de Emergencias"** y **"Box de Emergencias N° 1"** son
> etiquetas distintas para lo que probablemente es el mismo lugar, igual que
> **"Sala de Espera General (Piso 1)"** vs **"Sala de Espera General"**. Un
> catálogo `locations` por `unit_id` resuelve esto.

---

#### E22 · `InterpreterRequest` — **ENTIDAD NUEVA**

No existe en ninguna parte salvo como `useState` local
(`DashboardMedico.tsx:66-67`). Estados observados: `idle` → `requested` →
`assigned`, más un flag `videoActive`.

Campos propuestos:

| Campo | Tipo | Origen en UI |
|---|---|---|
| `id` | UUID | |
| `medical_session_id` | UUID | FK |
| `requested_by` | UUID | médico |
| `status` | enum | `requested` \| `assigned` \| `connected` \| `ended` \| `cancelled` |
| `interpreter_id` / `interpreter_name` | | *"Juan Pérez (Intérprete Certificado LSCh)"* |
| `room_id` | string | *"WebRTC Room SV-847291-INT"* — hoy derivado del CTA |
| `requested_at` / `assigned_at` / `connected_at` / `ended_at` | ts | |

Relación con consentimientos: existen los tipos `interpreter` y `video_call` en
`ConsentType` — el flujo probablemente los requiere. `DECISIÓN PENDIENTE`.

---

#### E23 · `SecuritySetting` — **ENTIDAD NUEVA**

`DashboardAdmin.tsx:167-197`. Dos parámetros:

| Parámetro | Tipo | Default | Descripción en UI |
|---|---|---|---|
| Expiración por inactividad de sesión | int (minutos) | `20` | *"La atención inclusiva se cerrará automáticamente si no se detecta actividad en el chat en este lapso."* |
| Intentos máximos de CTA fallidos | enum | `3` | `3 (Recomendado)` \| `5` \| `Sin bloqueo` |

`DECISIÓN PENDIENTE`: ¿el alcance es por **organización**, por **centro de
salud** o global? El header muestra centro+unidad, sugiriendo alcance por centro.

---

#### E24 · `ContactMessage` — **ENTIDAD NUEVA (baja prioridad)**

Formulario público de la landing (`LandingPage.tsx:1022-1076`):
`nombre` (req), `email` (req, type=email), `establecimiento` (req),
`mensaje` (req, textarea 4 filas).

---

### 5.3 Resumen de brechas de entidades

| Entidad | En `types.ts` | En SQL propuesto | Acción |
|---|---|---|---|
| Organization | ❌ | ✅ | Crear |
| HealthCenter | ❌ (solo ID) | ✅ | Crear + exponer catálogo |
| Unit | ❌ (solo ID) | ✅ | Crear + exponer catálogo |
| User | ✅ (sin usar) | ✅ | Alinear |
| Role | ✅ (enum) | ❌ | **Decidir** enum vs N:M |
| Patient | ✅ | ✅ parcial | **Agregar 6 campos** (rut, birthDate, prevision, address, cesfam, phone) |
| PatientContact | ✅ singular | ✅ 1:N | **Adoptar 1:N** |
| TemporaryAccessCode | ❌ | ✅ | Crear + **exponer en MedicalSession** |
| MedicalSession | ✅ | ✅ | **Agregar `ctaCode`**; resolver `status` vs `currentStage` |
| Consent | ✅ | ✅ parcial | **Decidir** `title`/`description` vs plantillas |
| ChatMessage | ✅ | ✅ | Agregar `senderName`, `confidence`; renombrar `pictogramPath`→`pictogram_id` |
| Pictogram | ✅ | ❌ | **Crear tabla**; resolver `iconName`/emoji/`colorClass` |
| PictogramCategory | ✅ | ❌ | **Crear tabla** |
| QuickMessage | ✅ | ❌ | **Crear tabla** |
| VitalSigns | ✅ | ✅ | Alinear `recordedBy` a UUID |
| TriageRecord | ✅ | ✅ parcial | **Crear catálogo `triage_levels`** |
| ClinicalNote | ✅ | ✅ | Agregar `authorName`/`authorRole` vía relación |
| TimelineEvent | ✅ | ❌ | **Decidir** tabla vs proyección de auditoría |
| AuditLog | ❌ | ✅ | Crear |
| **PatientCall** | ❌ | ❌ | **Crear (nueva)** |
| **Location** | ❌ | ❌ | **Crear catálogo (nueva)** |
| **InterpreterRequest** | ❌ | ❌ | **Crear (nueva)** |
| **SecuritySetting** | ❌ | ❌ | **Crear (nueva)** |
| **ContactMessage** | ❌ | ❌ | **Crear (nueva, opcional)** |

---

## 6. Endpoints necesarios

> **Importante:** ninguno de estos endpoints existe hoy en el frontend. Se
> derivan de las **acciones de la UI**. Cada fila indica el componente y la línea
> que la origina.
>
> **Convención (v2, API REST):** **todas** las rutas viven en `routes/api.php`
> bajo el prefijo `/api/v1` y se protegen con `auth:sanctum` (salvo login, canje
> de CTA y endpoints públicos). Las rutas de las tablas se listan **sin** el
> prefijo por brevedad; en la implementación real lo llevan
> (p. ej. `/login` → `POST /api/v1/auth/login`). Las respuestas usan el
> envoltorio estándar (§7) y **JSON**, nunca redirects ni props. Ver §12.

### 6.1 M1 · Autenticación

| # | Método | Ruta | Origen en UI | Envía | Devuelve | Errores a manejar |
|---|---|---|---|---|---|---|
| A1 | `POST` | `/auth/login` | `Login.tsx:32` | `email`, `password`, `healthCenterId`, `unitId` | `{ token, tokenType:"Bearer", user }` (§7.1) | `422` credenciales inválidas · `403` usuario inactivo · `429` rate limit |
| A2 | `POST` | `/auth/logout` | `DashboardContainer.tsx:174,229,386` | — (Bearer token) | `success: true`; el token se revoca | `401` |
| A3 | `GET` | `/auth/me` | `App.tsx:29-36` | — (Bearer token) | usuario + rol + centro + unidad + permisos | `401` |
| A4 | `POST` | `/auth/forgot-password` | `Login.tsx:176` (hoy `alert`) | `email` | `success: true` (respuesta genérica) | `422` |
| A5 | `POST` | `/auth/patient/redeem` | `Login.tsx:34-37` — hoy **sin credenciales** | `{ ctaCode }` | Bearer token acotado a la sesión médica (A-03) | ver §11.1 |

> 🔴 **Bloqueante A5:** el portal del paciente hoy **no autentica**. El backend
> debe definir cómo el paciente prueba su identidad. Opciones: (a) el CTA
> funciona como credencial de un solo uso que emite un token de sesión acotado a
> la `MedicalSession`; (b) cuenta propia con contraseña; (c) magic link por SMS
> al teléfono registrado. **La opción (a) es la más coherente con el flujo
> descrito en la landing** (el código se entrega en ventanilla, presencialmente).

### 6.2 M2 · Catálogos institucionales

| # | Método | Ruta | Origen | Devuelve | Estado |
|---|---|---|---|---|---|
| C0a | `GET` | `/organizations` | Selector de organización | `[{id, name}]` activas | ✅ Implementado |
| C0b | `POST` | `/organizations` | Panel super_admin | `{id, name}` — solo `super_admin` | ✅ Implementado |
| C1 | `GET` | `/health-centers` | `Login.tsx:46-49` | `[{id, name, organizationId}]` activos | ✅ Implementado |
| C1b | `POST` | `/health-centers` | Panel super_admin | `{id, name, organizationId}` — solo `super_admin` | ✅ Implementado |
| C2 | `GET` | `/units` (filtro `?healthCenterId=`) | `Login.tsx:51-55` | `[{id, name, healthCenterId}]` activas | ✅ Implementado |
| C2b | `POST` | `/units` | Panel admin | `{id, name, healthCenterId}` — `super_admin` (cualquier centro) o `admin_institucional` (solo el suyo) | ✅ Implementado |
| C3 | `GET` | `/units/{id}/locations` | E21 — hoy hardcodeado en 3 componentes | `[{id, label}]` para convocatoria | ⏳ Pendiente |
| C4 | `GET` | `/triage-levels` | `DashboardCategorizacion.tsx:54-60` | `[{code, name, color_hex, description}]` | ⏳ Pendiente |

> **Nota v2.1:** el listado de unidades se resolvió con un único endpoint
> `GET /units` con filtro opcional por query parameter (`?healthCenterId=`), en
> vez de la ruta anidada `/health-centers/{id}/units` planteada originalmente.
> Ambos enfoques son válidos; se eligió el filtro por ser más flexible. Los
> endpoints de creación (`POST`) implementan el modelo de dos niveles de
> administrador (ver §6.1 M1 y el documento de estudio DOS_NIVELES_ADMIN).

### 6.3 M3 · Código Temporal de Atención

| # | Método | Ruta | Origen | Envía | Devuelve | Errores |
|---|---|---|---|---|---|---|
| T1 | `POST` | `/attention-codes/validate` | `DashboardAdmision.tsx:46-55` | `{code: "SV-847291"}` | datos mínimos del paciente + `access_id` | `422 INVALID_CODE` · `403 BLOCKED_CODE` · `410 EXPIRED_CODE` · `429` rate limit |
| T2 | `POST` | `/attention-codes/{id}/consume` | `DashboardAdmision.tsx:57-65` | — | `MedicalSession` creada | `409` código ya consumido |
| T3 | `POST` | `/patients/{id}/attention-codes` | Paso 01 de la landing (`LandingPage.tsx:308-311`) — **sin UI** | `{health_center_id, expires_in}` | código en claro **una sola vez** | `403` sin permiso |

Reglas obligatorias del backend para T1/T2:
- El código **nunca** se almacena en claro (`code_hash`, `backendDoc.ts:92`).
- Incrementar `failed_attempts` en cada fallo; bloquear al llegar a `max_attempts`
  (configurable, §6.8 S1).
- Verificar que el código pertenece al `health_center_id` del funcionario.
- Marcar `status='consumed'` y `used_at` al abrir la sesión — **un solo uso**.

### 6.4 M4 · Paciente

| # | Método | Ruta | Origen | Notas |
|---|---|---|---|---|
| P1 | `GET` | `/patients/{id}` | `DashboardAdmision.tsx:122-146` | Ficha completa. **Solo tras validar CTA** |
| P2 | `GET` | `/patients/{id}/contacts` | `DashboardMedico.tsx:80-83` (hardcodeado) | Lista 1:N de contactos de emergencia |
| P3 | `GET` | `/patient/me` | `PatientView.tsx:248-280` | Ficha propia para el portal |

> La ficha es **de solo lectura para el personal** — regla explícita en
> `DashboardAdmision.tsx:159`. **No debe existir** `PUT /patients/{id}` accesible
> a roles clínicos. Si el paciente edita sus datos, es desde su app.

### 6.5 M5 · Sesión médica

| # | Método | Ruta | Origen | Envía | Devuelve |
|---|---|---|---|---|---|
| S1 | `POST` | `/medical-sessions` | `App.tsx:77-98` | `{access_code_id, communication_preference, allergies[], reason_of_visit}` | `MedicalSession` completa |
| S2 | `GET` | `/medical-sessions/{id}` | `DashboardContainer.tsx:257-269` | — | sesión + relaciones (ver §7.3) |
| S3 | `GET` | `/medical-sessions/active` | Banner de "sin sesión" (`DashboardContainer.tsx:270-279`) | — | sesión activa del centro/unidad, o `null` |
| S4 | `PATCH` | `/medical-sessions/{id}/stage` | `App.tsx:100-118` | `{stage: "Categorización"}` | sesión actualizada + mensaje de sistema generado |
| S5 | `POST` | `/medical-sessions/{id}/close` | `App.tsx:120-138` | `{closure_reason, summary}` | sesión cerrada |
| S6 | `GET` | `/medical-sessions/{id}/timeline` | `DashboardMedico.tsx:125-129` | — | eventos ordenados |

Efectos secundarios que el backend debe producir (hoy los hace el frontend):
- **S4** inserta un `ChatMessage` de sistema: `"Paciente derivada a sala de {stage}."`
- **S5** inserta un `ChatMessage` de sistema: `"Sesión cerrada de forma permanente por: {reason}. Código de acceso expirado."`
- **S5** debe además: setear `ended_at`, `closed_by`, expirar el CTA asociado,
  expirar todos los consentimientos de la sesión, y **bloquear escrituras
  posteriores** (§8.7).

### 6.6 M6 · Consentimientos

| # | Método | Ruta | Origen | Envía |
|---|---|---|---|---|
| K1 | `GET` | `/medical-sessions/{id}/consents` | `PatientView.tsx:971`, `DashboardMedico.tsx:385` | — |
| K2 | `POST` | `/medical-sessions/{id}/consent-requests` | `App.tsx:144-155` ← `DashboardMedico.tsx:262-269` | `{consent_type, payload:{contact_id}}` o `{consent_type, title, description}` (ver E10) |
| K3 | `POST` | `/consent-requests/{id}/approve` | `PatientView.tsx:980`, `:367` | — |
| K4 | `POST` | `/consent-requests/{id}/reject` | `PatientView.tsx:990`, `:360` | — |
| K5 | `POST` | `/consent-requests/{id}/revoke` | Estado `revoked` en el tipo — **sin UI dedicada** | — |

> Solo el **paciente** puede aprobar/rechazar/revocar (K3–K5). El personal solo
> puede **solicitar** (K2) y **leer** (K1).
> El backend debe registrar `evidence` (IP, user-agent, hash) según
> `backendDoc.ts:130`.

### 6.7 M7–M11 · Datos clínicos y comunicación

| # | Método | Ruta | Origen | Notas |
|---|---|---|---|---|
| CH1 | `GET` | `/medical-sessions/{id}/messages` | los 5 dashboards | Paginado. **No hay paginación en el frontend hoy** |
| CH2 | `POST` | `/medical-sessions/{id}/messages` | `App.tsx:157-190` | `{body, message_type, pictogram_id?}`. `origin` y `sender_type` los **infiere el backend** del rol autenticado |
| CH3 | `POST` | `/messages/{id}/confirm` | `confirmedByPatientAt` — **sin UI explícita** | Confirmación del paciente |
| CH4 | `POST` | `/messages/{id}/read` | `status: 'read'` en el tipo — **sin UI** | Acuse de lectura |
| V1 | `POST` | `/medical-sessions/{id}/vital-signs` | `DashboardCategorizacion.tsx:62-97` | 8 campos + notas |
| V2 | `GET` | `/medical-sessions/{id}/vital-signs` | `DashboardMedico.tsx:189-208` | Historial (la UI muestra solo el último) |
| TR1 | `POST` | `/medical-sessions/{id}/triage` | `DashboardCategorizacion.tsx:99-123` | `{triage_level, symptoms[], observations}` |
| TR2 | `GET` | `/medical-sessions/{id}/triage` | `DashboardMedico.tsx:173-187` | |
| N1 | `POST` | `/medical-sessions/{id}/clinical-notes` | `DashboardMedico.tsx:93-116` | `{note_type, content, status}` |
| N2 | `GET` | `/medical-sessions/{id}/clinical-notes` | `DashboardMedico.tsx:616-631` | Historial firmado |
| N3 | `PUT` | `/clinical-notes/{id}` | `version` / `supersedes_id` — **sin UI** | Versionado |
| L1 | `POST` | `/medical-sessions/{id}/calls` | `DashboardAdmision.tsx:330-334` y equivalentes | `{location_id}`. Genera **también** el mensaje de chat |
| L2 | `POST` | `/calls/{id}/acknowledge` | `PatientView.tsx:316-318` ("Entendido, Voy") | — |
| L3 | `DELETE` | `/calls/{id}` | `[Quitar]` en los 3 dashboards | — |
| I1 | `POST` | `/medical-sessions/{id}/interpreter-requests` | `DashboardMedico.tsx:433-435` | — |
| I2 | `GET` | `/interpreter-requests/{id}` | polling/realtime del estado `requested→assigned` | — |
| I3 | `POST` | `/interpreter-requests/{id}/connect` | `DashboardMedico.tsx:449` | Devuelve credenciales de sala WebRTC |
| I4 | `POST` | `/interpreter-requests/{id}/end` | `DashboardMedico.tsx:476` | — |

### 6.8 M12, M14, M18, M19 · Administración

| # | Método | Ruta | Origen | Notas |
|---|---|---|---|---|
| PG1 | `GET` | `/pictograms` | `DashboardAdmin.tsx:34-37`, `PatientView.tsx:790`, `LandingPage.tsx:610` | Filtrable por categoría y búsqueda; público debe recibir solo `is_active=true` |
| PG2 | `GET` | `/pictogram-categories` | `PatientView.tsx:772`, `LandingPage.tsx:526` | |
| PG3 | `POST` | `/pictograms` | `DashboardAdmin.tsx:88` (hoy `alert`) | Crear |
| PG4 | `PATCH` | `/pictograms/{id}` | `DashboardAdmin.tsx:21-25` toggle | `{is_active}` |
| PG5 | `DELETE` | `/pictograms/{id}` | **sin UI** | |
| QM1 | `GET` | `/quick-messages` | `PatientView.tsx:733,932` | |
| AU1 | `GET` | `/audit-logs` | `DashboardAdmin.tsx:208` | Paginado + filtros por acción, usuario, severidad, rango de fechas |
| AU2 | `POST` | `/audit-logs/export` | `DashboardAdmin.tsx:230` (hoy `alert`) | *"PDF/Excel con firmas no repudiables"* |
| SE1 | `GET` | `/security-settings` | `DashboardAdmin.tsx:19,185` | |
| SE2 | `PUT` | `/security-settings` | `DashboardAdmin.tsx:193` (hoy `alert`) | `{session_timeout_minutes, cta_max_attempts}` |
| US1 | `GET` | `/users` | **sin UI** — prometido en `Login.tsx:61` | Métrica "42 Usuarios" (`DashboardAdmin.tsx:49`) |
| US2 | `POST` | `/users` | **sin UI** — acción `create_user` en el log de auditoría | |
| US3 | `PATCH` | `/users/{id}` | **sin UI** — *"Habilita o restringe cuentas"* | `{is_active}` |
| ST1 | `GET` | `/admin/stats` | `DashboardAdmin.tsx:42-72` | `{active_users, api_requests, audit_coverage}` |

### 6.9 Endpoints públicos y auxiliares

| # | Método | Ruta | Origen | Notas |
|---|---|---|---|---|
| PU1 | `POST` | `/contact` | `LandingPage.tsx:1022-1026` | Formulario público. Requiere rate limit + antispam |
| PU2 | `GET` | `/pictograms/public` | `LandingPage.tsx:610` | Catálogo demo, solo activos |
| PR1 | `PUT` | `/me/accessibility-preferences` | `PublicHeader.tsx:46-56` | `DECISIÓN PENDIENTE`: ¿persistir `{dyslexic_font, high_contrast, font_size_multiplier}` por usuario, o dejarlo en `localStorage`? Recomendación: `localStorage` para invitados, backend para usuarios autenticados |

### 6.10 Tiempo real

El frontend hoy actualiza todo de forma síncrona porque comparte un `useState`.
Con backend real, **estas vistas necesitan actualizaciones push**:

| Canal | Eventos | Consumidores |
|---|---|---|
| `medical-session.{id}` (privado) | `MessageSent`, `StageAdvanced`, `SessionClosed`, `VitalsRecorded`, `TriageRecorded`, `NoteSigned` | Todos los dashboards + portal |
| `medical-session.{id}.patient` (privado) | `PatientCalled`, `CallCancelled`, `ConsentRequested` | Solo `PatientView` |
| `medical-session.{id}.staff` (privado) | `ConsentAnswered`, `CallAcknowledged`, `InterpreterAssigned` | Dashboards de personal |

Sin esto, el flujo se rompe: el médico solicita un consentimiento y el paciente
**nunca lo ve** hasta recargar; el paciente autoriza y el médico **nunca se
entera**.

---

## 7. Contratos JSON esperados

### 7.0 Convenciones transversales

> **Prefijo de rutas.** Todas las rutas de esta sección se muestran **sin** el
> prefijo por brevedad. En la API real llevan `/api/v1` (p. ej.
> `POST /medical-sessions/{id}/vital-signs` →
> `POST /api/v1/medical-sessions/{id}/vital-signs`).

**Casing — RESUELTO: `camelCase` en el cable (A-06).** El frontend usa `camelCase`
en todo `types.ts`; el backend expone `camelCase` convirtiendo en las **API
Resources**. Así el frontend no cambia su consumo de datos y la conversión se
hace una sola vez en la capa de serialización del backend. Los valores de enum
permanecen en `snake_case` (§2.3 del contrato).

**Fechas.** Todo `ISO 8601 UTC` (`2026-07-12T11:00:00Z`). El frontend parsea con
`new Date(msg.sentAt)`. ⚠️ **Dos excepciones a corregir en el frontend:**
`Patient.birthDate` es `'15/11/1997'` y `TimelineEvent.occurredAt` es `'11:00'`.

**Envoltura de respuesta (A-05).** Formato estándar del contrato (§4): `success`,
`data`, `error`, `meta`. Para los `422` de validación se usa el objeto `errors`
(`{campo:[...]}`); el frontend los muestra junto a cada campo.

**Autenticación.** Toda ruta protegida exige `Authorization: Bearer {token}`
(Sanctum). Un token ausente o inválido responde **401** (no 419: el CSRF de
sesión no aplica en API REST).

**Errores.** Cada respuesta de error debe traer un `code` legible por máquina
(`INVALID_CODE`, `BLOCKED_CODE`, `SESSION_NOT_FOUND`, `INACTIVE_SESSION`,
`CONSENT_REQUIRED`, `FORBIDDEN_CENTER`), no solo un mensaje.

---

### 7.1 Login — `POST /login`

**Request**
```json
{
  "email": "n.orellana@hospitalvillarrica.cl",
  "password": "••••••••",
  "healthCenterId": "hc-villarrica",
  "unitId": "unit-urgencias"
}
```

**Response 200**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "9d3f...-uuid",
      "name": "Natalia Orellana",
      "email": "n.orellana@hospitalvillarrica.cl",
      "role": "admision",
      "roleLabel": "Admisión / Ventanilla",
      "isActive": true,
      "organizationId": "org-chile-salud",
      "healthCenterId": "hc-villarrica",
      "healthCenter": "Hospital Regional de Villarrica",
      "unitId": "unit-urgencias",
      "unit": "Servicio de Urgencia Adulto"
    },
    "permissions": ["session.create", "session.advance", "message.send", "call.create"]
  }
}
```

> Nótese que se entregan **ID y nombre** de centro y unidad: el ID para lógica y
> multitenancy, el nombre para el breadcrumb (`DashboardContainer.tsx:215-217`).
> El array `permissions` alimenta el gating de UI (§9.4).

**Response 422**
```json
{
  "message": "Las credenciales no coinciden con nuestros registros.",
  "errors": { "email": ["Las credenciales son incorrectas."] }
}
```

---

### 7.2 Validar CTA — `POST /attention-codes/validate`

**Request**
```json
{ "code": "SV-847291" }
```

**Response 200** — datos **mínimos** hasta que exista consentimiento
```json
{
  "status": "success",
  "data": {
    "accessId": "b71c...-uuid",
    "patient": {
      "id": "pat-001",
      "name": "Ana María Torres",
      "age": 28,
      "birthDate": "1997-11-15",
      "rut": "19.482.903-K",
      "prevision": "FONASA B",
      "phone": "+56 9 7462 8193",
      "address": "Av. Pedro de Valdivia 1420, Depto 402, Temuco",
      "cesfam": "CESFAM Villarrica Centro",
      "communicationPreference": "LSCh (Lengua de Señas Chilena) y texto escrito",
      "allergies": ["Penicilina", "Lactosa"],
      "bloodType": "O-",
      "conditions": ["Hipotiroidismo leve"],
      "reasonOfVisit": "Dolor de cabeza agudo y náuseas intensas",
      "contacts": [
        {
          "id": "pc-1",
          "name": "Carlos Torres Solís",
          "relationship": "Padre",
          "phone": "+56 9 8473 9201",
          "priority": 1,
          "allowSos": true,
          "allowUpdates": true
        },
        {
          "id": "pc-2",
          "name": "Marta Torres Aguirre",
          "relationship": "Hermana",
          "phone": "+56 9 9381 2048",
          "priority": 2,
          "allowSos": false,
          "allowUpdates": true
        }
      ]
    }
  }
}
```

> ⚠️ `bloodType` en el mock es `"O-Rh Positive"`, que es contradictorio
> (`O-` y `Positive`). Normalizar a `A+ | A- | B+ | B- | AB+ | AB- | O+ | O-`.

**Errores**
```json
{ "status": "error", "code": "INVALID_CODE",  "message": "El código ingresado no existe, expiró o está bloqueado." }
{ "status": "error", "code": "BLOCKED_CODE",  "message": "Código bloqueado por exceso de intentos fallidos." }
{ "status": "error", "code": "FORBIDDEN_CENTER", "message": "El código no corresponde a este establecimiento." }
```
(`422`, `403`, `403` respectivamente. Textos tomados de `backendDoc.ts:315-328`.)

---

### 7.3 Sesión médica — `GET /medical-sessions/{id}`

Este es el **payload maestro** que alimenta el dashboard completo.

```json
{
  "status": "success",
  "data": {
    "id": "sess-1001",
    "ctaCode": "SV-847291",
    "patientId": "pat-001",
    "patientName": "Ana María Torres",
    "patientAge": 28,
    "communicationPreference": "LSCh y texto",
    "organizationId": "org-chile-salud",
    "healthCenterId": "hc-villarrica",
    "healthCenterName": "Hospital Regional de Villarrica",
    "unitId": "unit-urgencias",
    "unitName": "Servicio de Urgencia Adulto",
    "status": "active",
    "currentStage": "Categorización",
    "startedAt": "2026-07-12T11:00:00Z",
    "endedAt": null,
    "createdBy": "usr-admin",
    "closedBy": null,
    "closureReason": null,
    "summary": null,
    "isWritable": true,
    "allergies": ["Penicilina", "Lactosa"],
    "activeCall": {
      "id": "call-9",
      "locationLabel": "Sala de Categorización (Box A)",
      "calledAt": "2026-07-12T11:20:00Z",
      "acknowledgedAt": null
    },
    "interpreterRequest": null
  }
}
```

Campos añadidos respecto a `types.ts` que **resuelven deuda existente**:

| Campo | Resuelve |
|---|---|
| `ctaCode` | el TODO de `DashboardContainer.tsx:262` |
| `healthCenterName` / `unitName` | breadcrumb sin depender del login |
| `allergies` | los chips `PENICILINA, LACTOSA` hoy hardcodeados en 3 componentes |
| `isWritable` | permite a la UI deshabilitar composers al cerrar (§8.7) |
| `activeCall` | reemplaza el `calledLocation: string \| null` global |
| `interpreterRequest` | reemplaza el `useState` local del médico |

---

### 7.4 Mensajes — `GET /medical-sessions/{id}/messages`

```json
{
  "status": "success",
  "data": [
    {
      "id": "msg-1",
      "sessionId": "sess-1001",
      "senderType": "system",
      "senderId": null,
      "senderName": "SEÑAVIDA",
      "messageType": "system",
      "body": "Atención médica iniciada mediante código SV-847291 en Centro de Salud Villarrica.",
      "origin": "system",
      "status": "read",
      "sentAt": "2026-07-12T11:00:15Z",
      "confirmedByPatientAt": null,
      "pictogramId": null,
      "pictogram": null,
      "confidence": null
    },
    {
      "id": "msg-3",
      "sessionId": "sess-1001",
      "senderType": "patient",
      "senderId": "pat-001",
      "senderName": "Ana María Torres",
      "messageType": "pictogram",
      "body": "Me duele mucho la cabeza y tengo náuseas",
      "origin": "patient",
      "status": "read",
      "sentAt": "2026-07-12T11:02:10Z",
      "confirmedByPatientAt": "2026-07-12T11:02:05Z",
      "pictogramId": "pic-101",
      "pictogram": { "id": "pic-101", "title": "Dolor de cabeza", "emoji": "🤕" },
      "confidence": null
    }
  ],
  "meta": { "perPage": 50, "nextCursor": "eyJpZCI6..." }
}
```

> El objeto anidado `pictogram.emoji` **elimina la necesidad** del `switch`
> hardcodeado `getPictogramEmoji()` (`PatientView.tsx:21-58`), que hoy es
> importado por 4 componentes y devuelve `'🏥'` para cualquier pictograma nuevo.

**`POST /medical-sessions/{id}/messages` — Request**
```json
{ "body": "Hola Ana, ¿cuál es tu motivo de consulta?", "messageType": "text", "pictogramId": null }
```
👉 El cliente **no envía** `senderType`, `senderId`, `senderName`, `origin` ni
`status`: el backend los deriva del usuario autenticado. Hoy el frontend los
calcula en `App.tsx:160-187`, lo que sería un vector de suplantación.

---

### 7.5 Signos vitales — `POST /medical-sessions/{id}/vital-signs`

**Request**
```json
{
  "systolicPressure": 120,
  "diastolicPressure": 80,
  "temperature": 36.5,
  "oxygenSaturation": 98,
  "heartRate": 72,
  "respiratoryRate": 16,
  "painLevel": 4,
  "measuredAt": "2026-07-12T11:15:00Z",
  "notes": "Paciente cooperadora, manifiesta dolor que se incrementa al respirar."
}
```
**Response 201**
```json
{
  "status": "success",
  "data": {
    "id": "vit-1",
    "sessionId": "sess-1001",
    "recordedBy": { "id": "usr-tens-4", "name": "Rodrigo Muñoz", "role": "categorizacion" },
    "systolicPressure": 120, "diastolicPressure": 80,
    "temperature": 36.5, "oxygenSaturation": 98,
    "heartRate": 72, "respiratoryRate": 16, "painLevel": 4,
    "measuredAt": "2026-07-12T11:15:00Z",
    "notes": "Paciente cooperadora…",
    "createdAt": "2026-07-12T11:15:02Z"
  }
}
```
> `recordedBy` pasa de string libre (`'Enfermera Universitaria'`) a **objeto con
> el usuario real**.

---

### 7.6 Triage — `POST /medical-sessions/{id}/triage`

**Request**
```json
{
  "triageLevel": "C3",
  "symptoms": ["Cefalea", "Mareos", "Náuseas"],
  "observations": "Paciente con dolor de cabeza persistente e hipertermia leve."
}
```
**Response 201**
```json
{
  "status": "success",
  "data": {
    "id": "tr-1",
    "sessionId": "sess-1001",
    "recordedBy": { "id": "usr-tens-4", "name": "Rodrigo Muñoz" },
    "triageLevel": "C3",
    "triageLevelName": "Urgencia Mediana (Amarillo)",
    "colorHex": "#9B6F08",
    "symptoms": ["Cefalea", "Mareos", "Náuseas"],
    "observations": "Paciente con dolor de cabeza persistente e hipertermia leve.",
    "completedAt": "2026-07-12T11:18:00Z"
  },
  "sideEffects": {
    "systemMessageId": "msg-42"
  }
}
```
> `triageLevelName` y `colorHex` vienen **resueltos desde el catálogo**
> `triage_levels`, no los envía el cliente.
> El backend genera el mensaje automático al paciente que hoy produce
> `DashboardCategorizacion.tsx:119-122`.

---

### 7.7 Nota clínica — `POST /medical-sessions/{id}/clinical-notes`

**Request**
```json
{ "noteType": "impression", "content": "Cefalea tensional…", "status": "signed" }
```
**Response 201**
```json
{
  "status": "success",
  "data": {
    "id": "note-1",
    "sessionId": "sess-1001",
    "author": { "id": "usr-doc-1", "name": "Dr. Andrés Soto", "role": "medico", "roleLabel": "Médico Urgenciólogo" },
    "noteType": "impression",
    "noteTypeLabel": "Impresión Diagnóstica Inicial",
    "content": "Cefalea tensional…",
    "status": "signed",
    "signedAt": "2026-07-12T11:45:00Z",
    "version": 1,
    "supersedesId": null,
    "contentHash": "sha256:9f2b…",
    "createdAt": "2026-07-12T11:45:00Z"
  }
}
```
> `noteTypeLabel` resuelve el bug de etiquetado de
> `DashboardMedico.tsx:623` (donde `treatment` y `medication` se rotulan
> incorrectamente como "Indicaciones").
> `contentHash` materializa la promesa de la UI: *"Guardada con hash SHA-256"*.

---

### 7.8 Consentimientos — `GET /medical-sessions/{id}/consents`

```json
{
  "status": "success",
  "data": [
    {
      "id": "con-1",
      "sessionId": "sess-1001",
      "consentType": "start_care",
      "title": "Inicio de Atención Inclusiva",
      "description": "Permitir al personal abrir un canal de asistencia inclusivo en SEÑAVIDA…",
      "status": "granted",
      "requestedAt": "2026-07-12T11:01:00Z",
      "respondedAt": "2026-07-12T11:01:30Z",
      "expiresAt": null,
      "requestedBy": { "id": "usr-adm-2", "name": "María José" },
      "payload": null
    },
    {
      "id": "con-4",
      "sessionId": "sess-1001",
      "consentType": "share_with_contacts",
      "title": "Compartir Comprobante con Carlos Torres Solís",
      "description": "¿Autorizas que el Dr. Andrés Soto comparta un comprobante de atención clínica con tu contacto de emergencia Carlos Torres Solís (Padre) al número +56 9 8473 9201?",
      "status": "pending",
      "requestedAt": "2026-07-12T11:40:00Z",
      "respondedAt": null,
      "expiresAt": "2026-07-12T12:40:00Z",
      "requestedBy": { "id": "usr-doc-1", "name": "Dr. Andrés Soto" },
      "payload": { "contactId": "pc-1" }
    }
  ]
}
```

> ⚠️ **`payload.contactId` es crítico.** Hoy el frontend correlaciona el consent
> con el contacto haciendo `c.title.includes(selectedContact.name)`
> (`DashboardMedico.tsx:251-256`) — coincidencia de substring sobre texto libre.
> Eso se rompe con nombres parciales o duplicados. Con `payload.contactId` el
> match es determinista.

**`POST /consent-requests/{id}/approve` — Response**
```json
{
  "status": "success",
  "data": { "id": "con-4", "status": "granted", "respondedAt": "2026-07-12T11:41:12Z" }
}
```

---

### 7.9 Convocatoria — `POST /medical-sessions/{id}/calls`

**Request**
```json
{ "locationId": "loc-box-a" }
```
**Response 201**
```json
{
  "status": "success",
  "data": {
    "id": "call-9",
    "sessionId": "sess-1001",
    "locationId": "loc-box-a",
    "locationLabel": "Sala de Categorización (Box A)",
    "calledBy": { "id": "usr-adm-2", "name": "María José" },
    "calledAt": "2026-07-12T11:20:00Z",
    "acknowledgedAt": null,
    "cancelledAt": null,
    "status": "active",
    "speechText": "Atención por favor. Has sido llamada. Por favor dirígete a la ubicación: Sala de Categorización (Box A)"
  },
  "sideEffects": { "systemMessageId": "msg-43" }
}
```
> `speechText` viene del backend para que el TTS del paciente
> (`PatientView.tsx:103`) no dependa de una plantilla duplicada en el cliente, y
> para poder localizarla.

---

### 7.10 Pictogramas — `GET /pictograms`

```json
{
  "status": "success",
  "data": [
    {
      "id": "pic-101",
      "categoryId": "cat-1",
      "category": { "id": "cat-1", "name": "Dolor", "slug": "dolor" },
      "title": "Dolor de cabeza",
      "phrase": "Me duele la cabeza",
      "speechText": "Tengo dolor de cabeza",
      "emoji": "🤕",
      "iconName": "Activity",
      "imagePath": null,
      "severity": "critical",
      "isActive": true,
      "sortOrder": 1
    }
  ]
}
```
> `emoji` y `severity` **reemplazan** respectivamente al `switch` hardcodeado y
> al campo `colorClass` con clases Tailwind crudas (§E12). Mantener `iconName`
> es opcional (hoy no se usa).

---

### 7.11 Auditoría — `GET /audit-logs`

```json
{
  "status": "success",
  "data": [
    {
      "id": "log-1",
      "action": "validate_cta",
      "actionLabel": "Validación de código CTA",
      "severity": "info",
      "user": { "id": "usr-adm-2", "name": "María José", "roleLabel": "Admisión" },
      "patient": { "id": "pat-001", "name": "Ana María Torres" },
      "medicalSessionId": "sess-1001",
      "resourceType": "TemporaryAccessCode",
      "resourceId": "b71c…",
      "ipAddress": "192.168.12.44",
      "userAgent": "Mozilla/5.0…",
      "occurredAt": "2026-07-12T11:00:12Z"
    }
  ],
  "meta": { "currentPage": 1, "perPage": 25, "total": 3412 }
}
```
> La UI muestra tiempos relativos (*"Hace 23 minutos"*). Enviar `occurredAt` en
> ISO y **formatear en el cliente**; no enviar el string relativo.

---

### 7.12 Errores compartidos

| HTTP | `code` | Cuándo | Origen de la regla |
|---|---|---|---|
| 401 | `UNAUTHENTICATED` | sin sesión | — |
| 403 | `FORBIDDEN_CENTER` | usuario de otro centro | `backendDoc.ts:402` |
| 403 | `FORBIDDEN_ROLE` | rol sin permiso | `backendDoc.ts:407-411` |
| 403 | `INACTIVE_SESSION` | sesión `closed`/`cancelled`/`expired` | `backendDoc.ts:372-377` |
| 403 | `BLOCKED_CODE` | CTA con intentos agotados | `backendDoc.ts:322-328` |
| 403 | `CONSENT_REQUIRED` | acción que exige consentimiento no otorgado | `PatientView.tsx:966`, landing §8 |
| 404 | `SESSION_NOT_FOUND` | | `backendDoc.ts:365-370` |
| 409 | `CODE_ALREADY_CONSUMED` | CTA de un solo uso ya usado | `LandingPage.tsx:310` |
| 410 | `EXPIRED_CODE` | CTA vencido | `backendDoc.ts:94` |
| 422 | `VALIDATION_ERROR` | validación de formulario | §8 |
| 429 | `TOO_MANY_ATTEMPTS` | rate limit de CTA/login | `backendDoc.ts:345` |

---

## 8. Validaciones requeridas

> Solo se documentan reglas **efectivamente presentes en el código**. Cada una
> indica su ubicación. Las reglas que el frontend *declara en texto* pero no
> implementa se marcan como `SOLO TEXTO` — el backend debe implementarlas porque
> son promesas al usuario.

### 8.1 Login (`Login.tsx:32-44`)

| Campo | Regla en el frontend | Regla requerida en el backend |
|---|---|---|
| `email` | `required` (HTML) + no vacío (JS), `type="email"` | `required|email|exists:users,email` |
| `password` | `required` (HTML) + no vacío (JS) | `required|string` |
| `healthCenterId` | `select`, default `hc-villarrica` | `required|exists:health_centers,id` |
| `unitId` | `select`, default `unit-urgencias` | `required|exists:units,id` + debe pertenecer al centro |

Mensaje de error exacto usado hoy: **"Por favor, ingresa tu correo institucional
y contraseña."**

🔴 **Reglas ausentes que el backend DEBE agregar:**
- Verificación real de contraseña (hoy **cualquier** valor pasa).
- `is_active = true` (el campo existe en `types.ts:15` y en el SQL, pero **nunca
  se comprueba**). El middleware `user.active` de `backendDoc.ts:441` lo prevé.
- Rate limiting de intentos.
- El usuario debe pertenecer al centro/unidad seleccionados, o bien el selector
  debe listar solo sus asignaciones.
- Para `role='paciente'`, el frontend **omite las credenciales por completo**
  (`Login.tsx:34,152`). Ver §6.1 A5.

### 8.2 Código CTA (`DashboardAdmision.tsx:46-55`)

| Regla | Implementación actual | Requerida en backend |
|---|---|---|
| Formato | ninguna | `regex:/^SV-\d{6}$/` (observado en todos los ejemplos) |
| Comparación | `code.toUpperCase() === 'SV-847291'` | Case-insensitive contra `code_hash` |
| Requerido | ninguna (permite submit vacío) | `required|string` |
| Intentos | ninguna | Máx. configurable (default 3, `DashboardAdmin.tsx:186`) → `status='blocked'` |
| Expiración | ninguna | `expires_at > now()` |
| Un solo uso | `SOLO TEXTO` (`LandingPage.tsx:310`) | `status='active'` → `'consumed'` |
| Alcance por centro | ninguna | `health_center_id` debe coincidir con el del funcionario |

Mensaje de error actual: **"Código inválido. Escribe 'SV-847291' para simular el
caso de demostración."** — es texto de demo, debe reemplazarse por el mensaje
real de `backendDoc.ts:317`: *"El código ingresado no existe, expiró o está
bloqueado."*

### 8.3 Signos vitales (`DashboardCategorizacion.tsx:62-97`)

**Validaciones implementadas** (bloquean con `alert()` y abortan el guardado):

| Campo | Rango | Mensaje exacto |
|---|---|---|
| `temperature` | `30 ≤ t ≤ 45` | *"Error de validación clínica: La temperatura debe oscilar entre 30 y 45°C."* |
| `oxygenSaturation` | `0 ≤ o ≤ 100` | *"Error de validación clínica: La saturación de oxígeno debe estar en el rango 0-100%."* |
| `heartRate` | `20 ≤ h ≤ 250` | *"Error de validación clínica: Frecuencia cardíaca fuera de rangos de supervivencia (20-250 lpm)."* |

**Campos SIN validación en el frontend** — el backend debe definir rangos:

| Campo | Estado | Sugerencia (`DECISIÓN PENDIENTE`, requiere validación clínica) |
|---|---|---|
| `systolicPressure` | sin validar | `integer|between:40,300` |
| `diastolicPressure` | sin validar | `integer|between:20,200` + `< systolic` |
| `respiratoryRate` | sin validar | `integer|between:4,80` |
| `painLevel` | acotado por `<select>` 0..10 | `integer|between:0,10` |
| `notes` | libre, opcional | `nullable|string|max:1000` |
| `measuredAt` | `new Date()` en cliente | `date|before_or_equal:now` — **no confiar en el reloj del cliente** |

> ⚠️ Los tres rangos implementados usan `alert()` bloqueante, que **no es
> accesible** (no lo anuncian los lectores de pantalla de forma fiable, no es
> navegable por teclado de forma estándar) en una aplicación cuyo propósito
> declarado es la accesibilidad. Al migrar deben convertirse en errores inline
> del formulario. Ver §11.6.

### 8.4 Triage (`DashboardCategorizacion.tsx:99-123`)

| Campo | Regla actual | Requerida |
|---|---|---|
| `triageLevel` | `select` con default `C3`, siempre válido | `required|in:C1,C2,C3,C4,C5` |
| `observations` | textarea **prellenada**, sin `required` | `required|string|min:10` (es el "Fundamento de Categorización") |
| `symptoms` | **hardcodeado** `['Cefalea','Mareos','Náuseas']` | `array` — necesita UI de captura (§11.3) |

**Regla de secuencia — no bloqueante:** al pulsar "Derivar a Consulta Médica",
si `!vitalsSaved || !triageSaved` muestra
*"Recomendación: Asegúrate de guardar los signos vitales y categorizar el riesgo
antes de derivar al médico."* — y **avanza de todas formas**
(`DashboardCategorizacion.tsx:179-184`).

👉 `DECISIÓN PENDIENTE`: ¿el backend debe **rechazar** el avance a
`Consulta Médica` sin triage registrado, o solo advertir? La UI actual dice
"Recomendación", no "Requisito". **Recomendación: permitir el avance pero marcar
la sesión** (`triage_skipped: true`) y auditarlo — hay escenarios clínicos reales
(C1 con riesgo vital) donde saltarse el triage formal es lo correcto.

### 8.5 Nota clínica (`DashboardMedico.tsx:93-116`)

| Campo | Regla actual | Requerida |
|---|---|---|
| `content` | `required` (HTML) + `!noteContent.trim()` aborta | `required|string|min:3|max:10000` |
| `noteType` | `select`, 5 opciones | `required|in:impression,diagnosis,treatment,medication,indication,discharge_summary` |
| `status` | siempre `'signed'` | `in:draft,signed` |
| `session` | `if (!session) return` | sesión debe existir y estar **abierta** |

**Reglas declaradas en texto (`SOLO TEXTO`) que el backend debe implementar:**
- *"El contenido registrado se **encripta** y consolida en el historial
  auditable"* (`:580`).
- *"Guardada con **hash SHA-256** en base de datos"* (`:611`).
- Firma con identidad del autor: *"Firmado como: Dr. Andrés Soto (Médico
  Urgenciólogo)"* (`:598`) — hoy es un literal.
- **Inmutabilidad tras la firma**: implícita en el concepto de "firma" y en el
  campo `supersedes_id` del SQL. Una nota `signed` **no debe poder editarse**;
  una corrección crea una nueva versión.

### 8.6 Cierre de sesión (`DashboardMedico.tsx:645-705`)

| Campo | Regla actual | Requerida |
|---|---|---|
| `closureReason` | `select` con 3 valores fijos, sin `required` | `required|in:...` (ver abajo) |
| `closureSummary` | textarea **prellenada**, sin `required` | `required|string|min:10` — es el resumen de egreso clínico |

Valores exactos del `select` (`DashboardMedico.tsx:669-671`), que deben ser un
enum en el backend:
1. `"Atención Completada con Éxito"`
2. `"Derivado a Centro de Alta Complejidad"`
3. `"Abandono voluntario del paciente"`

### 8.7 Reglas de estado de la sesión (`SOLO TEXTO` — críticas)

El modal de cierre declara (`DashboardMedico.tsx:658`):
> *"Al cerrar la sesión, el chat quedará **bloqueado de forma permanente**, el
> **código de acceso temporal expirará** y se emitirá el **resumen al paciente
> sordo**."*

Y el mensaje de sistema resultante (`App.tsx:130`):
> *"Sesión cerrada de forma permanente por: {motivo}. Código de acceso
> expirado."*

🔴 **Ninguna de estas tres cosas ocurre en el frontend.** Tras cerrar, el input
de chat sigue habilitado y se pueden seguir enviando mensajes. El backend
**debe** hacerlas cumplir. El middleware `EnsureMedicalSessionIsActive`
(`backendDoc.ts:358-383`) es exactamente el mecanismo correcto:

```
Si session.status ∈ {closed, cancelled, expired}:
    → 403 INACTIVE_SESSION
```

Debe aplicarse a: `POST messages`, `POST vital-signs`, `POST triage`,
`POST clinical-notes`, `POST consent-requests`, `POST calls`,
`POST interpreter-requests`, `PATCH stage`.

Además, al cerrar:
- `ended_at = now()`, `closed_by = auth()->id()`
- CTA asociado → `status = 'expired'`
- Todos los consents de la sesión → `revoked_at = now()` (la UI lo promete:
  *"Todos tus permisos expiran automáticamente al finalizar tu sesión"*,
  `PatientView.tsx:1005`)
- Emitir el resumen de egreso al paciente

### 8.8 Expiración por inactividad (`SOLO TEXTO`)

`DashboardAdmin.tsx:178-180`:
> *"La atención inclusiva se cerrará **automáticamente** si no se detecta
> actividad en el chat en este lapso."* (default 20 minutos)

👉 Requiere un **job programado** en el backend que cierre sesiones inactivas
con `status='expired'`. No existe nada en el frontend.

### 8.9 Chat (`App.tsx:157-190`, composers)

| Regla | Ubicación |
|---|---|
| `body` no vacío tras `trim()` | `DashboardAdmision.tsx:69`, `DashboardCategorizacion.tsx:127`, `DashboardMedico.tsx:120`, `PatientView.tsx:195` |
| Requiere sesión activa | `App.tsx:158` (`if (!session) return`) |
| `origin` derivado del rol | `App.tsx:164-173` — **debe derivarse en el backend** |
| `confirmedByPatientAt` se setea solo si `senderType==='patient'` | `App.tsx:186` |

Validación de backend sugerida: `body: required|string|max:2000`,
`messageType: required|in:text,quick_message,pictogram,speech_to_text,text_to_speech,gesture_prediction`,
`pictogramId: nullable|exists:pictograms,id|required_if:messageType,pictogram`.

### 8.10 Consentimientos

| Regla | Ubicación |
|---|---|
| Solo dos acciones desde la UI: `granted` / `rejected` | `PatientView.tsx:980,990` |
| `revoked` existe en el tipo pero **ninguna UI lo produce** | `types.ts:91` |
| El personal **no puede** cambiar el estado, solo solicitarlo | `DashboardMedico.tsx:385-395` (solo lectura) |
| Un consent `share_with_contacts` pendiente genera un banner bloqueante en el portal | `PatientView.tsx:337-375` |

🔴 **Bug de renderizado a corregir:** `DashboardMedico.tsx:388-392` usa un
ternario binario — cualquier estado distinto de `granted` (incluido `pending` y
`revoked`) se muestra como **"Rechazado"**. Es peligroso clínicamente: un
consentimiento pendiente aparece como denegado.

### 8.11 Configuración de seguridad TI (`DashboardAdmin.tsx:167-197`)

| Campo | Regla actual | Requerida |
|---|---|---|
| Timeout de inactividad | `<input type="number">` **sin `min`/`max`** — acepta `0` y negativos | `required|integer|between:5,240` |
| Intentos máx. CTA | `select` 3 / 5 / "Sin bloqueo" | `required|in:3,5,0` (0 = sin bloqueo) |

### 8.12 Formulario de contacto (`LandingPage.tsx:1029-1068`)

Los 4 campos tienen `required` en HTML: `nombre`, `email` (`type="email"`),
`establecimiento`, `mensaje`. Sin validación adicional. Backend: agregar
`max` por campo, rate limit por IP y protección antispam.

### 8.13 Reglas transversales de autorización (no son validación de campo)

Del `MedicalSessionPolicy` de referencia (`backendDoc.ts:397-422`):

| Regla | Código |
|---|---|
| **Multitenancy estricto:** el usuario debe pertenecer al mismo `health_center_id` que la sesión | `:402-404`, `:417-419` |
| `admin_institucional` **no puede ver** información clínica de sesiones | `:407-409` (`return false`) |
| Solo `admision`, `categorizacion`, `medico` pueden ver una sesión | `:411` |
| Solo `categorizacion` y `medico` pueden **cerrar** una sesión | `:421` |

> ⚠️ Nótese que la policy permite a **categorización** cerrar sesiones, pero la
> UI solo expone el botón de cierre en el dashboard del **médico**
> (`DashboardMedico.tsx:370-375`). `DECISIÓN PENDIENTE`: alinear. Recomendación:
> restringir a `medico` para coincidir con la UI, salvo que exista un requisito
> operativo explícito.

---

## 9. Roles y permisos

### 9.1 Matriz de capacidades observada

Derivada de qué componente renderiza cada rol y qué acciones expone.

| Capacidad | `admision` | `categorizacion` | `medico` | `admin_institucional` | `paciente` |
|---|:---:|:---:|:---:|:---:|:---:|
| Validar código CTA | ✅ | — | — | — | — |
| Ver ficha del paciente | ✅ | ✅ | ✅ | ❌ | ✅ (propia) |
| Editar ficha del paciente | ❌ | ❌ | ❌ | ❌ | ❌ (en esta app) |
| Iniciar sesión médica | ✅ | — | — | — | — |
| Avanzar de etapa | ✅ (→Categorización) | ✅ (→Consulta Médica) | — | — | — |
| Cerrar sesión médica | — | ⚠️ policy sí / UI no | ✅ | — | — |
| Enviar mensajes de chat | ✅ | ✅ | ✅ | — | ✅ |
| Ver mensajes de sistema | ✅ | ✅ | ❌ (los oculta) | — | ✅ |
| Registrar signos vitales | — | ✅ | — | — | — |
| Ver signos vitales | — | ✅ | ✅ | — | ❌ |
| Registrar triage | — | ✅ | — | — | — |
| Ver triage | — | ✅ | ✅ | — | ❌ |
| Firmar nota clínica | — | — | ✅ | — | — |
| Ver notas clínicas | — | — | ✅ | — | ❌ |
| Ver línea de tiempo | — | — | ✅ | — | — |
| Convocar paciente | ✅ | ✅ | ✅ | — | — |
| Acusar recibo de convocatoria | — | — | — | — | ✅ |
| **Solicitar** consentimiento | — | — | ✅ | — | — |
| **Otorgar/rechazar** consentimiento | ❌ | ❌ | ❌ | ❌ | ✅ |
| Ver estado de consentimientos | — | — | ✅ | — | ✅ |
| Solicitar intérprete | — | — | ✅ | — | — |
| Iniciar videollamada | — | — | ✅ | — | — |
| Usar pictogramas / pizarra / cámara de señas | — | — | — | — | ✅ |
| Gestionar pictogramas | — | — | — | ✅ | — |
| Ver logs de auditoría | — | — | — | ✅ | — |
| Exportar logs | — | — | — | ✅ | — |
| Configurar seguridad TI | — | — | — | ✅ | — |
| Gestionar usuarios | — | — | — | ⚠️ prometido, sin UI | — |

Leyenda: ✅ expuesto en la UI · ❌ explícitamente negado · — no aplica ·
⚠️ inconsistencia entre UI y policy/copy.

### 9.2 Segregación de datos observada

Es la parte más interesante del diseño y **debe respetarse en el backend**:

1. **El administrador TI está aislado de lo clínico.** `DashboardAdmin` no
   recibe `session`, `vitals`, `triage`, `chatHistory` ni `consents`
   (`DashboardContainer.tsx:284`: recibe solo `user` y `highContrast`). El
   banner de "sesión activa/inactiva" se **oculta** para este rol
   (`DashboardContainer.tsx:271`). La policy de referencia lo confirma con un
   `return false` explícito.

2. **El paciente no ve datos clínicos derivados.** `PatientView` recibe
   `sessionConsents`, `chatHistory` y `calledLocation`, pero **no** `vitals`,
   `triage`, `session` ni notas clínicas (`DashboardContainer.tsx:334-341`). El
   paciente ve su **ficha administrativa** y su **conversación**, no su triage
   ni sus signos vitales.

3. **Admisión no ve datos clínicos.** `DashboardAdmision` no recibe `vitals`,
   `triage` ni `consents`.

4. **Categorización no ve notas clínicas ni consentimientos.**

5. **Solo el médico tiene la vista consolidada** (triage + vitals + consents +
   timeline + notas).

👉 **Esta segregación es un requisito de privacidad, no una casualidad de UI.**
Las API Resources deben implementarla, no solo las policies de acceso.

### 9.3 Riesgo de escalamiento de privilegios (🔴 crítico)

El frontend permite **cambiar de rol libremente sin reautenticación** desde tres
lugares:

1. La barra flotante del simulador (`App.tsx:222-242`) — 5 botones.
2. El sidebar del dashboard (`DashboardContainer.tsx:140-163`) — cada ítem llama
   a `onRoleChange(item.role)`, no navega.
3. El drawer móvil (`DashboardContainer.tsx:362-382`).

El handler es `handleSandboxRoleSwitch` (`App.tsx:198-201`), que muta el rol del
usuario en memoria.

👉 **En el frontend, el sidebar debe convertirse en navegación real** (enrutado del cliente a
rutas distintas) y el rol debe venir **exclusivamente** del backend. La barra del
simulador debe eliminarse o quedar tras un flag de entorno estrictamente de
desarrollo.

### 9.4 Modelo de permisos recomendado

Dado que la UI ya distingue capacidades finas, conviene un esquema de
**permisos con nombre** agrupados por rol, en vez de `if (role === 'medico')`
disperso:

| Permiso | Roles |
|---|---|
| `cta.validate` | admision |
| `session.create` | admision |
| `session.view` | admision, categorizacion, medico |
| `session.advance` | admision, categorizacion |
| `session.close` | medico *(y categorizacion si se confirma §8.13)* |
| `message.send` | admision, categorizacion, medico, paciente |
| `vitals.create` | categorizacion |
| `vitals.view` | categorizacion, medico |
| `triage.create` | categorizacion |
| `triage.view` | categorizacion, medico |
| `note.create` / `note.sign` | medico |
| `note.view` | medico |
| `timeline.view` | medico |
| `call.create` / `call.cancel` | admision, categorizacion, medico |
| `call.acknowledge` | paciente |
| `consent.request` | medico |
| `consent.answer` | paciente |
| `consent.view` | medico, paciente |
| `interpreter.request` | medico |
| `pictogram.manage` | admin_institucional |
| `audit.view` / `audit.export` | admin_institucional |
| `settings.manage` | admin_institucional |
| `user.manage` | admin_institucional |

El array `permissions` del payload de login (§7.1) permite al frontend ocultar
controles sin duplicar la lógica de roles — **pero la autorización real siempre
se evalúa en el servidor**.

---

## 10. Dependencias entre módulos

### 10.1 Grafo de dependencias

```
M2 Catálogos ─────────────────┐
                              ▼
M1 Auth ──────────────► M3 CTA ──────► M4 Paciente
                              │              │
                              └──────┬───────┘
                                     ▼
                            M5 Sesión médica   ◄── raíz de todo lo clínico
                                     │
   ┌────────┬────────┬───────┬───────┼────────┬────────┬────────┐
   ▼        ▼        ▼       ▼       ▼        ▼        ▼        ▼
  M6      M7       M8      M9      M10     M11      M13      M15
Consents Chat    Vitales  Triage  Notas   Llamado  Timeline Intérprete
   │        ▲                              │          ▲
   │        │                              │          │
   │        └──────────────────────────────┘          │
   │        (M8/M9/M11 inyectan mensajes de sistema)  │
   │                                                  │
   └──────────────────────────────────────────────────┘
                (M15 requiere consents interpreter/video_call)

M12 Pictogramas ──► M7 Chat  (pictogramId en mensajes)
M14 Auditoría ◄──── TODOS (escritura transversal)
M18 Config TI ────► M3 CTA (max_attempts)  ·  M5 Sesión (timeout)
```

### 10.2 Dependencias duras (bloqueantes)

| Depende de | Módulo | Por qué |
|---|---|---|
| M2 Catálogos | M1 Auth | El login pide centro y unidad |
| M3 CTA | M1, M2, M4 | Valida contra el centro del funcionario y resuelve un paciente |
| M5 Sesión | M3, M4 | `POST /medical-sessions` consume un `access_code_id` |
| M6, M7, M8, M9, M10, M11, M13, M15 | **M5** | Todos cuelgan de `medical_session_id`. **Sin sesión no hay nada** |
| M7 Chat | M12 Pictogramas | `pictogramId` es FK; el chat renderiza emoji/título del pictograma |
| M14 Auditoría | Todos | Cada escritura genera un log |
| M13 Timeline | M14 (si se implementa como proyección) | §E18 |

### 10.3 Acoplamientos por efectos secundarios

Estos son los puntos donde **una acción de un módulo escribe en otro**. Hoy los
hace el frontend; el backend debe asumirlos de forma transaccional:

| Acción | Módulo origen | Escribe también en | Código actual |
|---|---|---|---|
| Avanzar de etapa | M5 | M7 (mensaje de sistema) | `App.tsx:104-116` |
| Cerrar sesión | M5 | M7 (mensaje), M3 (expira CTA), M6 (revoca consents) | `App.tsx:124-135` + `SOLO TEXTO` |
| Confirmar triage | M9 | M7 (mensaje automático al paciente con el nivel asignado) | `DashboardCategorizacion.tsx:119-122` |
| Convocar paciente | M11 | M7 (mensaje `📢 LLAMADO A PACIENTE…`) | `DashboardAdmision.tsx:333`, `DashboardCategorizacion.tsx:216`, `DashboardMedico.tsx:343` |
| Iniciar sesión médica | M5 | M7 (resetea chat), M6 (resetea consents), M8/M9 (limpia), M11 (limpia) | `App.tsx:92-97` |
| Otorgar consent `share_with_contacts` | M6 | Envío real del comprobante al contacto (SMS/WhatsApp) | `SOLO TEXTO` — `DashboardMedico.tsx:296-300` |

> 🔴 **El último caso no está implementado en ninguna parte.** La UI declara
> *"El comprobante con triage y estado fue enviado exitosamente a {contacto}"*,
> pero **no existe ningún envío**. El backend necesita un módulo de
> notificaciones salientes (SMS/WhatsApp/email) + una plantilla de comprobante.
> Es un requisito funcional nuevo, no una migración.

### 10.4 Orden de implementación forzado por dependencias

```
Fase 1: M2 → M1                     (catálogos y autenticación)
Fase 2: M4 → M3 → M5                (paciente, CTA, sesión)
Fase 3: M7 + M6                     (chat y consentimientos: el núcleo del producto)
Fase 4: M8 → M9 → M10               (datos clínicos, en orden del flujo)
Fase 5: M11 + M12                   (convocatoria y catálogo de pictogramas)
Fase 6: M14 → M13                   (auditoría y su proyección como timeline)
Fase 7: M18 + M19                   (administración)
Fase 8: M15 + M16 + M17 + M20       (intérprete, IA de señas, pizarra, contacto)
```

### 10.5 Dependencias externas al backend

| Necesidad | Estado en el frontend | Implicancia |
|---|---|---|
| **TTS (síntesis de voz)** | Web Speech API del navegador, `lang='es-CL'` | ⚪ **No requiere backend.** Se usa en 8 lugares. Riesgo: soporte y calidad de voces varía por navegador/SO. `DECISIÓN PENDIENTE`: ¿fallback a TTS de servidor? |
| **Reconocimiento de señas (IA)** | 100% simulado (`setTimeout` + frases fijas) | 🔴 Requiere un servicio real. La landing menciona *"MediaPipe y TensorFlow.js corriendo localmente"* (`LandingPage.tsx:139`), pero **ninguna de esas librerías está en `package.json`**. `DECISIÓN PENDIENTE`: ¿inferencia en cliente (sin backend) o en servidor? El README recomienda que cualquier IA se invoque desde Laravel |
| **Videollamada WebRTC** | Marco falso con texto *"Provider: WebRTC Room SV-847291-INT"* | 🔴 Requiere proveedor (LiveKit, Twilio, Jitsi…) + emisión de tokens desde Laravel |
| **Envío a contactos (SMS/WhatsApp)** | Solo texto en la UI | 🔴 Requiere proveedor de mensajería |
| **Broadcasting en tiempo real** | No existe | 🔴 Requiere Laravel Reverb / Pusher (§6.10) |
| **Exportación firmada de logs** | `alert()` | 🟡 Requiere generador PDF/Excel + firma digital |
| **Fuentes de Google** | `@import` en `index.css:1` | 🟡 Dependencia de red externa. En un entorno hospitalario con red restringida conviene **auto-hospedar** Inter, Atkinson Hyperlegible y JetBrains Mono |

---

## 11. Riesgos encontrados

### 11.1 🔴 Críticos — bloquean la puesta en producción

**R1 · El portal del paciente no tiene autenticación.**
`Login.tsx:34,152`: al elegir el rol `paciente`, los campos de credenciales
**desaparecen** y el submit pasa directo. Cualquiera puede entrar al portal y
ver la ficha completa (RUT, dirección, previsión, teléfono) y la conversación
clínica. No hay decisión tomada sobre cómo se autentica el paciente.
→ **Bloqueante. Ver §6.1 A5.**

**R2 · Escalamiento de rol libre.**
Tres controles distintos permiten cambiar de rol sin reautenticación (§9.3).
Con backend real, si el sidebar sigue llamando a `onRoleChange`, un usuario de
admisión "se convierte" en médico y solicita los datos de esas vistas.
→ El sidebar **debe** ser navegación, no mutación de estado.

**R3 · El login no valida credenciales.**
`Login.tsx:32-44` acepta cualquier email/contraseña. No se comprueba `isActive`
pese a existir el campo.

**R4 · El cierre de sesión no bloquea nada.**
La UI promete bloqueo permanente del chat, expiración del CTA y revocación de
consentimientos (§8.7). **Ninguna ocurre.** Datos clínicos pueden inyectarse en
sesiones cerradas. El middleware de referencia existe en `backendDoc.ts` pero
no hay backend que lo ejecute.

**R5 · El cliente decide su propia identidad en los mensajes.**
`App.tsx:160-187` construye `senderType`, `senderId`, `senderName` y `origin` en
el navegador. Sin derivación en servidor, es suplantación trivial.

**R6 · Datos clínicos y personales sensibles sin capa de persistencia ni
control de acceso.** RUT, dirección, previsión, alergias, condiciones,
contactos y conversación clínica viven en memoria y se muestran sin ninguna
verificación de autorización. El producto declara cumplimiento de la
**Ley N° 20.584** (derechos del paciente) y la **Ley N° 19.628** (protección de
la vida privada) en `PublicFooter.tsx:45` y `Login.tsx:246`. Hoy no hay nada
que sustente esas afirmaciones.

**R7 · Consentimiento pendiente se muestra como "Rechazado".**
`DashboardMedico.tsx:388-392`. Un médico puede creer que el paciente denegó algo
que en realidad no ha respondido. Riesgo clínico y legal directo.

### 11.2 🟠 Altos — deuda que el backend debe forzar a resolver

**R8 · `mockPatient` importado directamente en 4 componentes.**
`DashboardAdmision`, `DashboardCategorizacion`, `DashboardMedico` y `PatientView`
leen RUT, fecha de nacimiento, previsión, CESFAM, teléfono y dirección
**directamente del mock**, saltándose `session` y las props. Al conectar el
backend, esos bloques **seguirán mostrando a Ana María Torres** sin importar
quién sea el paciente real. Son ~40 líneas repetidas 4 veces.
→ Debe reemplazarse por `session.patient` o una prop `patient`.

**R9 · Valores hardcodeados que deben venir del servidor.**

| Valor | Ubicaciones |
|---|---|
| `'SV-847291'` | `DashboardContainer.tsx:262,275`, `DashboardAdmision.tsx:48,108,365`, `DashboardCategorizacion.tsx:249`, `DashboardMedico.tsx:483,493,650`, `PatientView.tsx:231,966`, `LandingPage.tsx:202,869`, `mockData.ts:273,354` |
| `'PENICILINA, LACTOSA'` / `'PENICILINA'` (texto literal) | `DashboardAdmision.tsx:274`, `DashboardCategorizacion.tsx:150`, `DashboardMedico.tsx:147` |
| `'(28 años)'` | `DashboardContainer.tsx:262` |
| `'Dr. Andrés Soto'` / `'doc-001'` / `'Médico Urgenciólogo'` | `DashboardMedico.tsx:100-102,267,598` |
| `'Enfermera Universitaria'` / `'Enfermero de Turno'` | `DashboardCategorizacion.tsx:84,107` |
| `'org-chile-salud'`, `'hc-villarrica'`, `'unit-urgencias'` | `App.tsx:84-86` |
| 2 contactos de emergencia | `DashboardMedico.tsx:80-83` |
| 3 eventos de timeline | `DashboardMedico.tsx:126-128` |
| 4 logs de auditoría | `DashboardAdmin.tsx:27-32` |
| Métricas "42 Usuarios / 3.4K Peticiones / 100%" | `DashboardAdmin.tsx:49,59,69` |
| `['Cefalea','Mareos','Náuseas']` | `DashboardCategorizacion.tsx:110` |
| Listas de ubicaciones (3 distintas) | §E21 |
| Niveles de triage | `DashboardCategorizacion.tsx:54-60` |
| `'Ana María Torres'` | `App.tsx:69,165`, `DashboardAdmision.tsx:159`, `DashboardMedico.tsx:299`, `PatientView.tsx:223` |

**R10 · Estado clínico que se pierde al cambiar de vista.**
Notas firmadas, estado del intérprete, flags `vitalsSaved`/`triageSaved` y los
toggles de pictogramas viven en `useState` de componentes hijos (§2.3). Al
cambiar de rol y volver, **desaparecen**. Con backend esto se resuelve, pero
delata que esas vistas nunca fueron diseñadas para recargarse.

**R11 · `onSignNote` solo hace `console.log`.**
`DashboardContainer.tsx:322-324`. La nota clínica firmada — el artefacto de
mayor peso legal del sistema — **no se propaga al estado global**. Está
documentado como pendiente en el README.

**R12 · La imagen de la pizarra nunca se envía.**
`PatientView.tsx:172-178` envía el **texto** `🎨 [Dibujo de Pizarra]: "..."` y
**limpia el canvas**. El dibujo, que es el contenido comunicativo real, se
descarta. Para una herramienta de comunicación con personas sordas que pueden no
leer español con fluidez, esto anula el propósito de la funcionalidad.
→ Requiere `POST` de la imagen (`canvas.toDataURL()`) + almacenamiento +
`messageType` adecuado.

**R13 · La detección de señas descarta la confianza y el tipo.**
`PatientView.tsx:652-656` envía como `'text'` en vez de `'gesture_prediction'` y
descarta el valor de `confidence` que acaba de calcular. El campo `confidence`
existe en `types.ts:126` con el comentario *"for gesture predictions"* y **nunca
se puebla**.

**R14 · Correlación de consentimientos por substring de nombre.**
`DashboardMedico.tsx:251-256`: `c.title.includes(selectedContact.name)`. Con dos
contactos de apellido "Torres", o si el título cambia de redacción, el match
falla o acierta con el contacto equivocado — **autorizando el envío de datos
clínicos a la persona incorrecta**. → Ver §7.8 `payload.contactId`.

### 11.3 🟡 Medios — gaps funcionales

| # | Gap | Detalle |
|---|---|---|
| R15 | **No hay UI de gestión de usuarios** | Prometida en `Login.tsx:61` y `LandingPage.tsx:794-796`; la métrica "42 Usuarios" existe; la acción `create_user` aparece en el log de auditoría. Falta la pantalla completa |
| R16 | **No hay captura de síntomas para el triage** | `symptoms` es un array fijo (`DashboardCategorizacion.tsx:110`) |
| R17 | **No hay UI de generación de CTA** | El paso 01 de la landing lo describe, pero ningún rol puede generar un código |
| R18 | **No hay borrador de nota clínica** | `status: 'draft'` existe en el tipo y en el SQL; la UI siempre firma |
| R19 | **No hay versionado de notas** | `version` siempre `1`; `supersedes_id` sin uso |
| R20 | **No hay paginación en ninguna lista** | Chat, auditoría y pictogramas se renderizan completos. La auditoría real tendrá miles de filas |
| R21 | **No hay estados de carga ni de error** | Cero spinners, cero `try/catch`, cero manejo de fallo de red. Solo 2 mensajes de error inline (login y CTA); el resto son `alert()` |
| R22 | **6 acciones son solo `alert()`** | Recuperar contraseña, agregar pictograma, guardar config TI, exportar logs, formulario de contacto, confirmar seña en la landing |
| R23 | **`revoked` sin UI** | El paciente puede permitir/bloquear, pero no hay flujo explícito de revocación posterior, pese a que el log de auditoría de ejemplo incluye `revoke_consent_camera` como evento `critical` |
| R24 | **`discharge_summary` no seleccionable** | Está en `types.ts:187` pero no en el `<select>` |
| R25 | **Etiquetas de tipo de nota incorrectas** | `treatment` y `medication` se muestran como "Indicaciones" (`DashboardMedico.tsx:623`) |
| R26 | **Unidad "Maternidad" se pierde en el login** | Ternario binario en `Login.tsx:42` |
| R27 | **Nombre de centro inconsistente** | `"Hospital Regional de Villarrica"` en el `select` vs `"Hospital de Villarrica"` al enviar (`Login.tsx:41,47`) |
| R28 | **Campos del tipo nunca renderizados** | `Patient.bloodType`, `Patient.conditions`, `PatientContact.allowSos`, `PatientContact.allowUpdates`, `PictogramCategory.description`, `QuickMessage.iconName`, `QuickMessage.category`, `Pictogram.iconName`, `TimelineEvent.iconName` |

### 11.4 🟡 Inconsistencias de contrato (`types.ts` ↔ `backendDoc.ts`)

El README afirma que el contrato *"ya está alineado con `backendDoc.ts` (mismo
shape, solo cambia camelCase → snake_case)"*. **Esa afirmación no se sostiene.**
Divergencias verificadas:

| Divergencia | `types.ts` | `backendDoc.ts` |
|---|---|---|
| Campos de `Patient` | `ctaCode`, `rut`, `birthDate`, `prevision`, `address`, `cesfam`, `phone` | **ausentes** |
| `Consent.title` / `.description` | presentes | **ausentes** |
| `ChatMessage.senderName` | presente | **ausente** |
| `ChatMessage.confidence` | presente | **ausente** |
| `ClinicalNote.authorName` / `.authorRole` | presentes | **ausentes** |
| `TriageRecord.triageLevelName` / `.colorHex` | presentes | **ausentes** |
| `MedicalSession` código CTA | **ausente** (TODO explícito) | **ausente** |
| Tablas `pictograms`, `pictogram_categories`, `quick_messages`, `timeline_events` | tipos presentes | **tablas ausentes** |
| Tablas `organizations`, `health_centers`, `units`, `audit_logs`, `temporary_access_codes`, `patient_contacts` | tipos ausentes | tablas presentes |
| `ChatMessage.delivered_at` / `read_at` / `deleted_at` | ausentes | presentes |
| `Consent.patient_id` / `expires_at` / `evidence` | ausentes | presentes |
| `ClinicalNote.supersedes_id` | ausente | presente |
| `PatientContact` | objeto singular anidado | tabla 1:N |
| `MessageType` `'system'` | en el enum | no en el comentario SQL |
| `MessageOrigin` `'interpreter'`, `'system'` | en el enum | no en el comentario SQL |

**Además:** `src/data/backendDoc.ts` (465 líneas) **no está importado en ningún
archivo**. Es documentación viva desconectada del código, con riesgo alto de
quedar desactualizada. → Recomendación: **extraerla a documentación Markdown y
eliminar el módulo TS**, para que no se compile ni se distribuya en el bundle.

### 11.5 🟡 Calidad del código y tooling

| # | Hallazgo |
|---|---|
| R29 | **`strict` no está activado** en `tsconfig.json`. Sin `strictNullChecks` ni `noImplicitAny`, el tipado es decorativo en los bordes |
| R30 | **`any` en la frontera crítica**: `onStartSession: (patientData: any)` (`App.tsx:77`) y `onStartSession: (patient: any)` (`DashboardContainer.tsx:37`), justo donde se construye la sesión médica |
| R31 | **Sin ESLint ni Prettier**. `npm run lint` es solo `tsc --noEmit` |
| R32 | **Sin tests** de ningún tipo. Sin CI |
| R33 | **Dependencia muerta**: `motion@^12.23.24` declarada y nunca importada |
| R34 | **Exports muertos**: `vocabularySigns` (`mockData.ts:407-414`), interfaz `User` (`types.ts:8`), `databaseSchemaDoc` y `backendCodeBlocks` |
| R35 | **Imports sin usar**: `mockSession` e `initialChatHistory` en `DashboardAdmision.tsx:9`; `mockPatient` en `App.tsx:8`; `ClinicalNote` en `DashboardContainer.tsx:7`; `ShieldCheck, Heart, User, Sparkles` en `App.tsx:14` |
| R36 | **Dependencia circular de facto**: `getPictogramEmoji` se define en `PatientView.tsx` y la importan 4 componentes, incluida la landing pública. Una utilidad de presentación vive dentro de una vista de 1.012 líneas |
| R37 | **`.env.example` es residuo**: solo contiene `APP_URL` de AI Studio. No hay `VITE_API_URL` ni ninguna variable real |
| R38 | **Comentario del generador en `vite.config.ts`**: referencias a "AI Studio" y `DISABLE_HMR`, irrelevantes en Laravel |
| R39 | **Componentes muy grandes**: `LandingPage` 1.082 líneas, `PatientView` 1.012, `DashboardMedico` 708. Sin subcomponentes extraídos |
| R40 | **Prop drilling severo**: `DashboardContainer` recibe 18 props solo para reenviarlas |

### 11.6 🟡 Accesibilidad — riesgo reputacional específico

El producto declara **WCAG 2.2 AA** (`PublicHeader.tsx:189`, `PublicFooter.tsx:41`,
`LandingPage.tsx:287`). Hallazgos que contradicen esa afirmación:

| # | Hallazgo |
|---|---|
| R41 | **10 usos de `alert()`**, incluidas las 3 validaciones clínicas de signos vitales. Los diálogos nativos no son consistentemente anunciados ni estilables, y rompen el flujo de teclado |
| R42 | **El `<canvas>` de la pizarra no tiene alternativa textual ni etiqueta ARIA** (`PatientView.tsx:485-498`) |
| R43 | **Los toggles de accesibilidad no tienen `role="switch"` ni `aria-checked`** (`PublicHeader.tsx:126-155`) |
| R44 | **Las FAQ colapsables son `<div onClick>`**, no botones (`LandingPage.tsx:958-960`): no son enfocables ni operables por teclado |
| R45 | **Los tabs de las tres vistas principales no usan `role="tablist"`/`role="tab"`/`aria-selected"`** (`PatientView.tsx:389-420`) |
| R46 | **Tamaños de fuente muy pequeños**: uso extensivo de `text-[8px]`, `text-[9px]`, `text-[10px]` en interfaces destinadas a personas con posibles dificultades de lectura |
| R47 | **`animate-pulse` / `animate-bounce` / `animate-ping` sin respetar `prefers-reduced-motion`** |
| R48 | **El modo alto contraste está roto dentro de los dashboards.** `DashboardAdmin`, `DashboardAdmision`, `DashboardCategorizacion` y `DashboardMedico` **declaran la prop `highContrast` y nunca la usan** en su render. `PatientView` solo la aplica al `<div>` raíz. Es decir: al activar alto contraste, el shell cambia pero **todo el contenido de trabajo sigue en el tema claro** |
| R49 | **El multiplicador de tamaño de fuente se aplica como `fontSize` en `rem` al contenedor raíz** (`App.tsx:207`), pero casi todo el UI usa tamaños Tailwind absolutos (`text-xs`), por lo que **el control tiene efecto casi nulo** |

> Estos puntos no bloquean al backend, pero sí deben registrarse: son promesas
> públicas del producto. Se recomienda una auditoría WCAG formal antes de
> reclamar conformidad AA.

### 11.7 Resumen de decisiones pendientes

| # | Decisión | Impacto | Sección |
|---|---|---|---|
| D1 | Cómo se autentica el paciente | 🔴 Bloqueante | §6.1 |
| D2 | `camelCase` vs `snake_case` en el cable | 🔴 Alto (toca todo el frontend) | §7.0 |
| D3 | `status` vs `currentStage`: una o dos máquinas de estado | 🔴 Alto | §E9 |
| D4 | Rol único (enum) vs roles N:M | 🟠 Medio | §E5 |
| D5 | `Consent.title/description` como columnas vs plantillas + `payload` | 🟠 Medio | §E10, §7.8 |
| D6 | Timeline: tabla propia vs proyección de auditoría | 🟠 Medio | §E18 |
| D7 | `Pictogram.colorClass` (Tailwind crudo) vs token semántico | 🟠 Medio | §E12 |
| D8 | Emoji del pictograma como dato vs `switch` en el cliente | 🟠 Medio | §E12 |
| D9 | ¿Puede `categorizacion` cerrar sesiones? (policy dice sí, UI dice no) | 🟠 Medio | §8.13 |
| D10 | ¿El avance a Consulta Médica sin triage se bloquea o solo se advierte? | 🟠 Medio | §8.4 |
| D11 | Reconocimiento de señas: inferencia en cliente o en servidor | 🟠 Medio | §10.5 |
| D12 | Proveedor de videollamada y emisión de tokens | 🟠 Medio | §10.5 |
| D13 | Alcance de `SecuritySetting`: global, por organización o por centro | 🟡 Bajo | §E23 |
| D14 | `QuickMessage`: catálogo administrable o constantes | 🟡 Bajo | §E14 |
| D15 | Persistir preferencias de accesibilidad en backend o `localStorage` | 🟡 Bajo | §6.9 |
| D16 | Rangos clínicos para PA sistólica/diastólica y frecuencia respiratoria | 🟡 Bajo | §8.3 |
| D17 | `age` almacenada vs derivada de `birth_date` | 🟡 Bajo | §E6 |
| D18 | Fallback de TTS en servidor | 🟡 Bajo | §10.5 |

---

## 12. Recomendaciones para implementar la API REST en Laravel

> Recomendaciones de arquitectura y proceso para el **backend como API REST**.
> El frontend es un proyecto React/Vite separado (repositorio `senavida-frontend`)
> que consume esta API. **No incluye código de producción**, solo lineamientos.

### 12.1 Estructura del proyecto backend

El backend es un proyecto Laravel independiente. No aloja el frontend: no hay
`resources/js/` con las páginas React ni un layout Blade que las cargue. La
estructura relevante es la del backend puro:

```
app/
├── Http/
│   ├── Controllers/Api/V1/     # controladores de la API, agrupados por versión
│   │   ├── AuthController.php
│   │   ├── PatientController.php
│   │   ├── MedicalSessionController.php
│   │   └── ...
│   ├── Requests/               # Form Requests: validación de cada endpoint
│   ├── Resources/              # API Resources: forma exacta del JSON (camelCase)
│   └── Middleware/             # multitenancy, sesión médica activa, etc.
├── Models/                     # Eloquent: una clase por entidad (§5)
├── Policies/                   # autorización por entidad
└── Services/                   # lógica de negocio reutilizable
routes/
└── api.php                     # TODAS las rutas, bajo el prefijo /api/v1
database/
├── migrations/                 # esquema de tablas
├── seeders/                    # datos desde mockData.ts
└── factories/
```

**No se usa Blade para UI.** En una API REST el backend devuelve **JSON**, no
HTML. Blade solo podría aparecer para algo marginal (por ejemplo, la plantilla de
un correo), nunca para las pantallas del sistema, que las construye el frontend.

### 12.2 Rutas — todo en `api.php` bajo `/api/v1`

A diferencia del modelo Inertia (donde había rutas `web.php` que devolvían
páginas), aquí **todas** las rutas viven en `routes/api.php`, se agrupan bajo el
prefijo `/api/v1` y se protegen con el middleware `auth:sanctum`.

| Acción del frontend | Método y ruta REST | Controlador |
|---|---|---|
| Iniciar sesión | `POST /api/v1/auth/login` | `AuthController@login` |
| Usuario autenticado | `GET /api/v1/auth/me` | `AuthController@me` |
| Cerrar sesión | `POST /api/v1/auth/logout` | `AuthController@logout` |
| Canjear código CTA (paciente) | `POST /api/v1/auth/patient/redeem` | `AuthController@redeemCta` |
| Ver un paciente | `GET /api/v1/patients/{id}` | `PatientController@show` |
| Signos vitales | `POST /api/v1/medical-sessions/{id}/vital-signs` | `VitalSignController@store` |

Consecuencias directas respecto del prototipo:
- La navegación entre pantallas (landing, login, dashboards) es responsabilidad
  **del frontend** (React Router o equivalente), **no** del backend. El backend
  solo expone datos.
- El selector de rol del prototipo desaparece: el rol lo determina el backend a
  partir del token (resuelve R2).
- No hay redirecciones del servidor ni *flash messages*; el frontend interpreta
  los códigos HTTP y el envoltorio de respuesta (§7) para decidir qué mostrar.

### 12.3 Autenticación — Sanctum con Bearer token (A-02, A-03)

| Consumidor | Mecanismo | Motivo |
|---|---|---|
| Personal de salud | **Sanctum API token (Bearer)** obtenido con email + contraseña | Estándar de API REST; el token se envía en `Authorization` en cada petición |
| Portal del paciente | **Sanctum token derivado del código CTA**, acotado a la sesión médica | Sin contraseñas; expira con la atención |
| Broadcasting (tiempo real) | Reverb con auth de canal privado, autorizada con el mismo token | Ambos consumidores |
| Integraciones futuras | Mismo esquema Sanctum | — |

Puntos clave de implementación:
- El modelo `User` usa el trait `HasApiTokens` de Sanctum.
- El login crea el token con `createToken(...)` y lo devuelve **una sola vez**.
- El logout ejecuta `currentAccessToken()->delete()` para revocarlo.
- **No hay CSRF** (no se usan cookies de sesión). La protección es el propio
  token + HTTPS.
- El token del paciente se revoca cuando la sesión médica se cierra o expira.

### 12.4 Estado del cliente vs peticiones

En Inertia el estado global viajaba como *props compartidas*. En API REST el
frontend **mantiene su propio estado** (por ejemplo con Context o un store) y lo
llena con llamadas a la API:

- Al iniciar sesión, guarda el token y llama a `GET /api/v1/auth/me` para el
  contexto (`user`, `role`, `permissions`, `healthCenter`, `unit`).
- Cada pantalla pide sus propios datos a su endpoint (`vital-signs`, `triage`,
  `consents`, `messages`, `clinical-notes`, `timeline`).
- Para datos pesados (historial de chat, auditoría) se usa **paginación** del
  lado servidor (§14 del contrato), no traer todo de una vez.

### 12.5 Validación — Form Requests

Cada endpoint que recibe datos usa un **Form Request** de Laravel:

- Las reglas viven en el servidor y son la fuente de verdad (§8). El frontend
  puede validar también, pero **el servidor siempre revalida**.
- Un fallo de validación devuelve **422** con el objeto `errors` del envoltorio
  estándar (§7 del contrato), que el frontend muestra junto a cada campo.
- Las validaciones que en el prototipo eran `alert()` (signos vitales, §8.3) se
  convierten en reglas de Form Request.

### 12.6 Autorización

- **Policies** por entidad: `MedicalSessionPolicy`, `ConsentPolicy`,
  `ClinicalNotePolicy`, `VitalSignPolicy`, `PictogramPolicy`, `AuditLogPolicy`.
  El borrador de `backendDoc.ts:397-422` es un buen punto de partida.
- **Middleware de multitenancy** que fuerce `health_center_id` en cada consulta
  (un global scope sobre los modelos con esa columna evita olvidos).
- **Middleware de sesión médica activa** (§8.7) aplicado al grupo de rutas de
  escritura clínica.
- **Permisos con nombre** (§9.4) devueltos en `GET /auth/me` para el gating de
  UI. La UI oculta; el servidor decide.
- **API Resources distintas por rol** para materializar la segregación de datos
  de §9.2: el recurso que ve admisión no debe incluir triage ni notas, aunque el
  modelo los tenga cargados.

### 12.7 Documentación de la API — Swagger / OpenAPI (A-07)

El backend publica su documentación OpenAPI con **Swagger UI**:
- Herramienta sugerida: `darkaonline/l5-swagger`, que genera la especificación a
  partir de anotaciones en los controladores.
- Debe declararse el esquema de seguridad `bearerAuth` para probar endpoints
  protegidos desde la propia interfaz.
- Prioridad de cobertura: primero los endpoints que evalúa la rúbrica
  (autenticación, registro de usuario con cifrado, recursos con modelos), luego
  el resto.

### 12.8 Tiempo real

Sin broadcasting el producto no funciona (§6.10). Recomendación:
**Laravel Reverb** (first-party, WebSocket, sin dependencia SaaS — relevante en
entornos hospitalarios con restricciones de red).

Canales privados por sesión médica, autorizados con la misma policy que la
lectura de la sesión. Los eventos clave son los de §6.10.

Alternativa de bajo costo para una primera versión: **polling** desde el frontend
(pedir cada pocos segundos los mensajes nuevos). Funciona, pero degrada la
inmediatez del banner de convocatoria.

### 12.9 CORS — imprescindible con proyectos separados

Como el frontend (otro origen: por ejemplo `http://localhost:3000`) y el backend
(`http://localhost:8000`) están en **orígenes distintos**, el backend **DEBE**
configurar **CORS** para permitir las peticiones del frontend:
- Ajustar `config/cors.php` con los orígenes permitidos del frontend.
- Permitir la cabecera `Authorization` y los métodos usados.
- Sin esto, el navegador bloquea las llamadas del frontend al backend.

### 12.10 Higiene y versiones

- Mantener las versiones acordadas: **PHP 8.2+ (se usa 8.4)**, **Laravel 12**,
  **PostgreSQL**. El frontend usa React 19 + Vite 7 + Tailwind 4 en su propio
  repositorio.
- Del lado frontend (responsabilidad de la otra persona): reemplazar
  `src/data/mockData.ts` por llamadas reales a la API, escribir `.env.example`
  con `VITE_API_URL`, y activar `strict: true` en `tsconfig.json`.
- Del lado backend: convertir `mockData.ts` en **seeders**, activar Pint y Pest,
  y CI.

---

## 13. Roadmap recomendado del backend

Estimaciones en semanas-persona de backend. Asumen un equipo pequeño trabajando
en paralelo con el frontend.

### Fase 0 · Fundaciones (1–2 sem)

- Proyecto Laravel 12 (API REST) + PostgreSQL + Sanctum. El frontend React 19 + Vite 7 + Tailwind 4 vive en su propio repositorio.
- Configurar CORS para el origen del frontend; instalar Sanctum y `l5-swagger`.
- **Resolver la máquina de estados de la sesión** (status vs stage) — bloquea el
  modelo de `MedicalSession`. (La auth del paciente y el casing ya están resueltos:
  Sanctum + `camelCase`.)
- Base de datos, convención de UUIDs, `AuditLog` como observer transversal.
- Instalar **Sanctum** y configurar **CORS** para el origen del frontend.
- Seeders desde `mockData.ts` (23 pictogramas, 5 categorías, 8 mensajes rápidos,
  5 niveles de triage, el caso de demostración de Ana María Torres).
- CI: Pint, Pest. Documentación base con **Swagger (l5-swagger)**.

**Entregable:** la API arranca contra PostgreSQL con datos de seeder y Swagger
publicado. Sin auth real todavía.

### Fase 1 · Identidad y multitenancy (1–2 sem) — M1, M2

- `organizations`, `health_centers`, `units`, `users`, roles y permisos.
- Login real con verificación de contraseña, `is_active` y rate limit (R3).
- Catálogos C1–C4.
- Middleware de multitenancy + global scopes.
- **Rutas reales por rol** — elimina R2.
- Corregir R26 y R27.

**Entregable:** login funcional, cada rol en su URL, sin escalamiento.
🔴 Cierra R2, R3.

### Fase 2 · CTA, paciente y sesión (2 sem) — M3, M4, M5

- `patients` con los 6 campos faltantes (§E6), `patient_contacts` 1:N.
- `temporary_access_codes` con hash, expiración, intentos y consumo único.
- `medical_sessions` **incluyendo `ctaCode`** (cierra el TODO de
  `DashboardContainer.tsx:262`).
- Endpoints T1, T2, P1, P2, S1, S2, S3, S4, S5.
- Middleware `EnsureMedicalSessionIsActive` — 🔴 cierra R4.
- Sustituir `mockPatient` en los 4 componentes — cierra R8.
- Resolver D3 (status vs stage).

**Entregable:** flujo real de admisión de punta a punta.
🔴 Cierra R4, R8, gran parte de R9.

### Fase 3 · Núcleo comunicacional (2–3 sem) — M6, M7, M12

- `chat_messages` con derivación de identidad en servidor — 🔴 cierra R5.
- `consents` con `payload` estructurado — cierra R14.
- Corregir el renderizado de estado de consentimiento — 🔴 cierra R7.
- `pictograms`, `pictogram_categories`, `quick_messages` con emoji como dato —
  cierra R36 y el problema de pictogramas nuevos.
- **Broadcasting con Reverb** (§6.10) — sin esto el flujo de consentimientos no
  funciona entre dos personas.

**Entregable:** conversación real bidireccional con consentimientos en vivo.
🔴 Cierra R5, R7, R14.

### Fase 4 · Datos clínicos (2 sem) — M8, M9, M10

- `vital_signs` con validación de rangos en servidor (§8.3) y `recorded_by` real.
- `triage_records` + catálogo `triage_levels`; resolver D10.
- `clinical_notes` con hash SHA-256, inmutabilidad tras firma y versionado.
- Conectar `onSignNote` de verdad — cierra R11.
- Agregar `discharge_summary` al selector y corregir etiquetas (R24, R25).
- Efectos secundarios transaccionales de §10.3.

**Entregable:** el expediente de la sesión se persiste completo.
🟠 Cierra R11, R18, R19, R24, R25.

### Fase 5 · Convocatoria y trazabilidad (1–2 sem) — M11, M13, M14

- `patient_calls` + catálogo `locations` unificado (§E21).
- Broadcasting del llamado (debe ser inmediato).
- `audit_logs` reales + timeline como proyección (D6).
- Listado paginado y filtrable de auditoría — cierra parte de R20.

**Entregable:** convocatoria real y trazabilidad completa.

### Fase 6 · Administración (1–2 sem) — M18, M19, M12

- CRUD de pictogramas (formulario de creación, hoy `alert`).
- **CRUD de usuarios** — cierra R15, la brecha entre lo prometido y lo entregado.
- `security_settings` conectada al CTA y al job de expiración por inactividad
  (§8.8).
- Exportación firmada de logs.
- Métricas reales del panel — cierra el resto de R9.

**Entregable:** el administrador puede operar el sistema sin tocar la base de datos.
🟡 Cierra R15, R22.

### Fase 7 · Accesibilidad e integraciones (2–4 sem) — M15, M16, M17, M20

- Reemplazar los 10 `alert()` por errores inline y flash accesibles — R41.
- Corregir R42–R49 (ARIA, teclado, `prefers-reduced-motion`, tamaños).
- **Envío de la pizarra como imagen** — cierra R12 (funcionalidad hoy inútil).
- Señas: `gesture_prediction` + `confidence` persistidos — cierra R13.
- Integrar el proveedor de videollamada (D12) e intérpretes.
- Notificaciones salientes a contactos (§10.3) — hoy la UI miente.
- Formulario de contacto real.
- **Auditoría WCAG 2.2 AA formal.**

**Entregable:** el producto cumple lo que declara públicamente.

### Fase 8 · Endurecimiento (continuo)

- Cifrado en reposo de campos clínicos.
- Retención y purga de datos según Ley N° 19.628 y Ley N° 20.584.
- Pruebas de penetración sobre multitenancy y el portal del paciente.
- Observabilidad y alertas.
- Pruebas de carga sobre broadcasting.

### 13.1 Ruta crítica

```
D1 (auth paciente) ──► Fase 1 ──► Fase 2 ──► Fase 3 ──► Fase 4
D2 (casing)        ──┘                          │
                                                ▼
                            Fases 5, 6, 7 (paralelizables)
```

D1 y D2 **bloquean todo**. Deben resolverse antes de escribir la primera
migración.

### 13.2 Riesgos que deben cerrarse antes de cualquier piloto con pacientes reales

| # | Riesgo | Fase |
|---|---|---|
| R1 | Portal del paciente sin autenticación | 0 (decisión) + 2 |
| R2 | Escalamiento de rol libre | 1 |
| R3 | Login sin validación de credenciales | 1 |
| R4 | El cierre de sesión no bloquea escrituras | 2 |
| R5 | El cliente decide su identidad en los mensajes | 3 |
| R6 | Datos sensibles sin control de acceso | 1–3 |
| R7 | Consentimiento pendiente mostrado como "Rechazado" | 3 |
| R14 | Correlación de consentimientos por substring | 3 |

**Ninguno de estos ocho es aceptable en un entorno con datos clínicos reales.**

---

## Anexo A · Índice de referencias al código

| Tema | Archivo:línea |
|---|---|
| Tipos de dominio | `src/types.ts:1-203` |
| Estado global y handlers | `src/App.tsx:16-201` |
| Datos simulados | `src/data/mockData.ts:1-414` |
| Schema SQL propuesto (código muerto) | `src/data/backendDoc.ts:13-212` |
| Snippets Laravel de referencia | `src/data/backendDoc.ts:214-465` |
| TODO del código CTA | `src/components/DashboardContainer.tsx:262` |
| `onSignNote` sin implementar | `src/components/DashboardContainer.tsx:322-324` |
| Validación del CTA | `src/components/DashboardAdmision.tsx:46-55` |
| Validaciones de signos vitales | `src/components/DashboardCategorizacion.tsx:62-97` |
| Catálogo de niveles de triage | `src/components/DashboardCategorizacion.tsx:54-60` |
| Firma de nota clínica | `src/components/DashboardMedico.tsx:93-116` |
| Flujo de consentimiento a contactos | `src/components/DashboardMedico.tsx:249-316` |
| Modal de cierre de sesión | `src/components/DashboardMedico.tsx:645-705` |
| Mapa emoji de pictogramas | `src/components/PatientView.tsx:21-58` |
| Banner de convocatoria del paciente | `src/components/PatientView.tsx:284-334` |
| Gestión de consentimientos del paciente | `src/components/PatientView.tsx:959-1008` |
| Config de seguridad TI | `src/components/DashboardAdmin.tsx:161-199` |
| Logs de auditoría (mock) | `src/components/DashboardAdmin.tsx:27-32` |
| Selector de rol del login | `src/components/Login.tsx:57-63` |
| Conmutador de rol (simulador) | `src/App.tsx:211-244` |
| Tokens de marca Tailwind | `src/index.css:4-40` |

---

*Documento generado a partir del análisis estático del repositorio
`senavida-frontend` en el commit `41360a8`. Toda afirmación sobre el
comportamiento actual es verificable en las referencias del Anexo A.*
