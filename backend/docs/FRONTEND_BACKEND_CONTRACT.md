# FRONTEND_BACKEND_CONTRACT

**Proyecto:** SEÑAVIDA — Plataforma de comunicación inclusiva en salud
**Documento:** Contrato oficial Frontend ↔ Backend
**Versión del contrato:** `2.1.0` — arquitectura **API REST**
**Estado:** Vigente. Decisiones de arquitectura ratificadas por el equipo y el docente (ver §Decisiones de arquitectura).
**Fuente:** `BACKEND_IMPLEMENTATION_GUIDE.md` — auditoría del frontend en el commit `41360a8`
**Fecha:** 2026-08-05 (actualizado v2.1.0)

> **Cambios en v2.1.0** (adiciones compatibles, no rompen v2.0.0):
> - Nuevo rol `super_admin` (libre, gestiona la estructura del sistema). Ver §6.3 (enum role).
> - Endpoints de catálogos implementados con `GET` y `POST`: `/organizations`, `/health-centers`, `/units`. Ver §7.3.
> - `POST /users` implementado, con confirmación de contraseña y restricción por centro para `admin_institucional`. Ver §7.9.
> - Modelo de dos niveles de administrador documentado (super_admin vs admin_institucional).

---

## Decisiones de arquitectura (v2.0.0) — RATIFICADAS

Este contrato pasó de un modelo **Inertia + sesión con cookie** (v1) a un modelo
**API REST desacoplada** (v2). El cambio responde a la realidad del equipo: el
**backend** y el **frontend** los desarrollan **personas distintas, en
repositorios y despliegues separados**. Una API REST desacoplada es el patrón
correcto para ese modo de trabajo, y fue aprobado por el docente.

| # | Decisión | Valor ratificado |
|---|---|---|
| A-01 | Estilo de integración | **API REST** — backend y frontend son proyectos separados que se comunican por HTTP/JSON |
| A-02 | Autenticación del personal de salud | **Laravel Sanctum — API token (Bearer)** |
| A-03 | Autenticación del paciente | **Bearer token derivado del código CTA**, acotado a la sesión médica y con su misma vigencia |
| A-04 | Versionado | **Obligatorio para toda la API** — prefijo `/api/v1` sin excepciones |
| A-05 | Formato de respuesta | **Envoltorio estándar** con `success`, `data`, `error`, `meta` (§4) |
| A-06 | Casing en el cable | **`camelCase`** en JSON; `snake_case` solo para valores de enum (§2.3) |
| A-07 | Documentación de la API | **Swagger / OpenAPI** publicada por el backend (§Documentación de la API) |
| A-08 | Almacenamiento del token en el cliente | El frontend guarda el Bearer token y lo envía en la cabecera `Authorization` en cada petición |

> **Nota histórica.** Las menciones a *Inertia*, *props compartidas*, *cookie de
> sesión* y *protección CSRF* que puedan quedar en secciones no reescritas
> corresponden al modelo v1 y **quedan derogadas** por estas decisiones. Ante
> cualquier contradicción, **prevalece esta sección**.

---

## Nota de lectura obligatoria

Este contrato se deriva de una auditoría de un frontend que **no realiza ninguna
llamada de red**. Todo su estado vive en memoria y sus datos provienen de
archivos de simulación. Esto tiene una consecuencia directa sobre cómo debe
leerse cada cláusula:

| Marca | Significado |
|---|---|
| **OBSERVADO** | La regla existe hoy en el frontend. Es un hecho verificable, no una propuesta. |
| **DECLARADO** | El frontend lo promete en su interfaz (texto visible al usuario) pero no lo implementa. El backend **debe** hacerlo cumplir. |
| **PROPUESTO** | El frontend no lo especifica. Es un estándar que este contrato define para que exista una única forma de hacerlo. Requiere ratificación. |
| `DECISIÓN PENDIENTE` | No puede definirse aún. Bloquea implementación. Listado consolidado en §20. |

Las secciones §2, §14, §15, §16 y §17 son **mayoritariamente PROPUESTO**: el
frontend actual no tiene cliente HTTP, ni paginación, ni filtros de servidor, ni
ordenamiento. No se está documentando algo existente — se está fijando el
estándar que aún no existe.

### Terminología normativa

Se usa el sentido de RFC 2119:

- **DEBE** / **NO DEBE** — requisito absoluto del contrato.
- **DEBERÍA** / **NO DEBERÍA** — recomendación fuerte; desviarse exige
  justificación escrita y actualización de este documento.
- **PUEDE** — opcional.

### Regla de precedencia

1. Este documento es la referencia oficial.
2. Ante conflicto entre este contrato y `BACKEND_IMPLEMENTATION_GUIDE.md`,
   **prevalece este contrato**.
3. Ante conflicto entre este contrato y el código del frontend actual,
   **prevalece este contrato** y el frontend DEBE adaptarse.
4. Cualquier cambio a este documento requiere acuerdo explícito de ambos equipos
   y un incremento de la versión del contrato (§2.2).

---

## Índice

1. [Objetivo del contrato](#1-objetivo-del-contrato)
2. [Convenciones generales](#2-convenciones-generales)
3. [Autenticación](#3-autenticación)
4. [Formato estándar de respuestas](#4-formato-estándar-de-respuestas)
5. [Códigos HTTP oficiales](#5-códigos-http-oficiales)
6. [Entidades del sistema](#6-entidades-del-sistema)
7. [Recursos de la API](#7-recursos-de-la-api)
8. [Requests esperados](#8-requests-esperados)
9. [Responses esperadas](#9-responses-esperadas)
10. [Validaciones](#10-validaciones)
11. [Reglas de negocio](#11-reglas-de-negocio)
12. [Roles y permisos](#12-roles-y-permisos)
13. [Seguridad](#13-seguridad)
14. [Paginación](#14-paginación)
15. [Filtros](#15-filtros)
16. [Ordenamiento](#16-ordenamiento)
17. [Búsquedas](#17-búsquedas)
18. [Manejo de errores](#18-manejo-de-errores)
19. [Eventos importantes](#19-eventos-importantes)
20. [Pendientes](#20-pendientes)

---

## 1. Objetivo del contrato

### 1.1 Propósito

Este documento define **las reglas oficiales de comunicación entre el equipo de
Frontend y el equipo de Backend** del proyecto SEÑAVIDA. Establece qué se envía,
qué se devuelve, con qué forma, bajo qué condiciones y quién es responsable de
cada validación.

Su función es eliminar la ambigüedad: ningún equipo debe tener que leer el código
del otro para saber cómo integrarse.

### 1.2 Alcance

**Cubre:**

- Convenciones de transporte, nomenclatura, tipos y fechas.
- Mecanismo de autenticación y gestión de sesión.
- Forma canónica de respuestas de éxito, error y validación.
- Semántica oficial de los códigos HTTP del proyecto.
- Catálogo de entidades y sus responsables.
- Catálogo de recursos de la API con su autorización.
- Contratos de request y response.
- Validaciones exigibles al backend.
- Reglas de negocio, separadas por quién las hace cumplir.
- Matriz de roles y permisos.
- Requisitos de seguridad y auditoría.
- Paginación, filtros, ordenamiento y búsqueda.

**No cubre:**

- Implementación interna de ninguno de los dos lados.
- Esquema de base de datos, migraciones ni modelos.
- Diseño visual, accesibilidad ni comportamiento de interfaz.
- Infraestructura, despliegue ni CI/CD.

### 1.3 Principios rectores

Estos cinco principios resuelven las dudas que el contrato no anticipe:

1. **El servidor es la única autoridad.** Toda validación, autorización y
   derivación de identidad ocurre en el backend. El frontend PUEDE validar para
   dar retroalimentación inmediata, pero esa validación **nunca** sustituye a la
   del servidor.

2. **El cliente nunca declara quién es.** El backend deriva `userId`, `role`,
   `senderType`, `origin`, `recordedBy`, `authorId` y `healthCenterId` del
   contexto autenticado. Si el cliente los envía, el backend **DEBE ignorarlos**.

3. **Segregación de datos por rol.** Un recurso no devuelve los mismos campos a
   todos los roles. La omisión de datos clínicos para roles sin competencia es un
   requisito de privacidad, no una optimización (§12.3).

4. **Todo dato clínico cuelga de una sesión médica.** Mensajes, consentimientos,
   signos vitales, triage, notas, convocatorias e intérpretes **DEBEN** existir
   siempre en el contexto de una `MedicalSession` y **NO DEBEN** aceptarse si esa
   sesión no está activa.

5. **Lo que la interfaz promete, el backend lo cumple.** El frontend declara al
   usuario reglas que hoy no implementa (bloqueo al cerrar sesión, expiración del
   código, revocación de consentimientos). Esas promesas son **vinculantes** y
   pasan a ser responsabilidad del backend (§11.3).

### 1.4 Responsabilidades por equipo

| Responsabilidad | Frontend | Backend |
|---|:---:|:---:|
| Presentación, accesibilidad e interacción | ✅ | — |
| Validación de formato para feedback inmediato | ✅ | — |
| Validación autoritativa de datos | — | ✅ |
| Autenticación y gestión de sesión | — | ✅ |
| Autorización (roles, permisos, multitenancy) | Oculta controles | ✅ Decide |
| Derivación de identidad del emisor | — | ✅ |
| Reglas de negocio y máquina de estados | — | ✅ |
| Efectos secundarios entre módulos | — | ✅ |
| Auditoría | — | ✅ |
| Paginación, filtros, orden y búsqueda | Solicita | ✅ Ejecuta |
| Síntesis de voz (TTS) | ✅ Navegador | — |
| Renderizado de fechas en zona local | ✅ | — |
| Emisión de fechas en UTC | — | ✅ |

---

## 2. Convenciones generales

### 2.1 Base URL de la API

**RATIFICADO (A-01, A-04).**

Bajo la arquitectura API REST, **el frontend es un cliente HTTP puro** (React +
Vite, proyecto separado) que consume el backend a través de una **única base
URL** configurada por variable de entorno (`VITE_API_URL`).

| Entorno | Base URL del backend |
|---|---|
| Desarrollo local | `http://localhost:8000` |
| Integración | `https://integracion.senavida.cl` |
| Producción | `https://senavida.cl` |

**Prefijo de ruta — único para toda la API:**

| Consumidor | Prefijo | Transporte |
|---|---|---|
| Personal de salud (dashboards) | `/api/v1` | **Bearer token (Sanctum)** |
| Portal del paciente | `/api/v1` | **Bearer token derivado del CTA** |
| Integraciones futuras | `/api/v1` | Bearer token |
| Broadcasting (tiempo real) | `/api/v1/broadcasting/auth` | Autorización de canal con el token del portador |

Toda ruta de negocio vive bajo `{{VITE_API_URL}}/api/v1/...`. **No existen rutas
sin prefijo:** con API REST desaparecen las rutas Inertia del personal que la v1
dejaba sin versionar.

**Ejemplos de URL completas:**

```
http://localhost:8000/api/v1/auth/login
http://localhost:8000/api/v1/patients/{patientId}
http://localhost:8000/api/v1/medical-sessions/{sessionId}/vital-signs
```

**Regla:** el frontend **NO DEBE** hardcodear ninguna URL absoluta. Todas las
peticiones se construyen a partir de la variable `VITE_API_URL` y de rutas
relativas. Esta regla existe porque el prototipo original tenía literales
dispersos por todo el código.

### 2.2 Versionado

**RATIFICADO (A-04).**

**Versionado de la API** — por prefijo de ruta, **obligatorio para todos los
endpoints sin excepción**:

- Formato: `/api/v{major}` — por ejemplo `/api/v1`.
- Solo se incrementa el major ante **cambios rompientes**.
- Al publicar `v2`, `v1` **DEBE** mantenerse operativa un mínimo de 90 días.
- Bajo API REST, **backend y frontend se despliegan por separado**; por eso el
  versionado protege al frontend de cambios rompientes del backend. **Todas** las
  rutas se versionan (ya no hay rutas Inertia exentas).

**Se considera cambio rompiente:**

- Eliminar o renombrar un campo de una response.
- Cambiar el tipo de un campo existente.
- Convertir un campo opcional del request en requerido.
- Añadir una validación que rechace payloads antes aceptados.
- Cambiar la semántica de un código HTTP o de un `code` de error.
- Eliminar un valor de un enum.

**NO se considera cambio rompiente:**

- Añadir un campo nuevo a una response.
- Añadir un campo **opcional** a un request.
- Añadir un valor nuevo a un enum **de salida** (el frontend DEBE tolerar valores
  desconocidos degradando con elegancia, nunca fallando).
- Añadir un endpoint nuevo.

**Versionado de este contrato:** semántico (`MAJOR.MINOR.PATCH`). Toda response
**DEBE** incluir la cabecera `X-Contract-Version` con la versión implementada,
para detectar desalineación entre equipos en integración.

### 2.3 Convención de nombres

**DECIDIDO: `camelCase` en todo el cable.**

Esta es una de las dos decisiones que bloqueaban el inicio de la implementación
y se resuelve aquí de forma normativa.

| Ámbito | Convención |
|---|---|
| Claves JSON de request | `camelCase` |
| Claves JSON de response | `camelCase` |
| Parámetros de query string | `camelCase` |
| Cabeceras HTTP | `Kebab-Case` estándar |
| Valores de enum | `snake_case` |
| Rutas / paths | `kebab-case` |
| Persistencia interna del backend | Libre — **no es parte del contrato** |

**Fundamento.** El frontend usa `camelCase` en sus 17 tipos de dominio y en las
~6.500 líneas de sus componentes. Convertir el cable a `snake_case` obligaría a
reescribir todo el consumo de datos, mientras que la conversión en el backend se
hace una sola vez en la capa de serialización. Se elige el costo menor.

**Ejemplos de valores de enum en `snake_case`** (no se convierten a camelCase por
ser identificadores, no nombres de campo):

```
role:         super_admin | admin_institucional | admision | categorizacion | medico | paciente
sessionStatus: pending_consent | active | in_admission | in_triage |
               in_medical_care | waiting_interpreter | closed | cancelled | expired
consentType:  start_care | basic_data | clinical_data | location | contacts |
              share_with_contacts | camera | microphone | visual_assistance |
              interpreter | video_call
messageType:  text | quick_message | pictogram | speech_to_text |
              text_to_speech | gesture_prediction | system
noteType:     impression | diagnosis | treatment | medication | indication |
              discharge_summary
```

**Nomenclatura de campos — reglas específicas:**

| Regla | Ejemplo |
|---|---|
| Los identificadores de relación terminan en `Id` | `sessionId`, `patientId`, `pictogramId` |
| Las marcas de tiempo terminan en `At` | `sentAt`, `signedAt`, `acknowledgedAt` |
| Los booleanos empiezan por `is`, `has`, `can` o `allow` | `isActive`, `isWritable`, `allowSos` |
| Las colecciones van en plural | `allergies`, `symptoms`, `contacts` |
| Un nombre **NO DEBE** describir un tipo que no es | ver nota siguiente |

> **Corrección obligatoria heredada de la auditoría:** el campo que el frontend
> llama `pictogramPath` **no contiene una ruta**, contiene un identificador. En
> este contrato se llama `pictogramId` y **DEBE** ser una referencia válida a un
> pictograma. El nombre anterior queda prohibido.

### 2.4 Formato de fechas

**DEBE** usarse **ISO 8601 con desplazamiento explícito**, siempre en UTC:

```
2026-07-12T11:00:00Z
```

| Regla | Detalle |
|---|---|
| Formato | `YYYY-MM-DDTHH:mm:ssZ` |
| Precisión | Segundos. Milisegundos PUEDEN incluirse (`.SSS`) y el frontend DEBE tolerarlos |
| Zona | Siempre `Z` (UTC). **NO DEBE** enviarse hora local sin desplazamiento |
| Fechas sin hora | `YYYY-MM-DD` — únicamente para fecha de nacimiento |
| Nulos | `null`, nunca `""` ni `"0000-00-00"` |

**Correcciones obligatorias heredadas de la auditoría.** El prototipo emite dos
formatos incompatibles con esta regla y **quedan prohibidos**:

| Campo | Formato en el prototipo | Formato exigido |
|---|---|---|
| Fecha de nacimiento | `"15/11/1997"` | `"1997-11-15"` |
| Marca de tiempo de la línea de tiempo | `"11:00"` | `"2026-07-12T11:00:00Z"` |

**Responsabilidad de presentación.** El backend **DEBE** emitir siempre UTC. El
frontend **DEBE** convertir a zona local para mostrar. El backend **NO DEBE**
enviar cadenas ya formateadas para humanos (`"Hace 23 minutos"`, `"11:00 hrs"`);
si se necesita un texto relativo, lo compone el frontend.

### 2.5 Zona horaria

| Ámbito | Zona |
|---|---|
| Almacenamiento y transporte | **UTC**, sin excepción |
| Presentación | `America/Santiago` |
| Lógica de negocio con sentido de calendario | `America/Santiago` |

**Advertencia operativa vinculante.** Chile aplica horario de verano, por lo que
el desplazamiento de `America/Santiago` alterna entre `-03:00` y `-04:00`. Toda
lógica sensible a la duración —expiración de códigos de atención, expiración de
sesión por inactividad, vigencia de consentimientos— **DEBE** calcularse en UTC.
Calcularla en hora local produciría errores de una hora dos veces al año en un
sistema de urgencias médicas.

El backend **DEBERÍA** exponer la zona de presentación como dato de
configuración, en vez de asumirla, para permitir despliegues fuera de Chile.

### 2.6 Identificadores

**DEBE** usarse **UUID versión 4** para todos los identificadores públicos.

| Aspecto | Regla |
|---|---|
| Formato | UUID v4 canónico en minúsculas, con guiones |
| Ejemplo | `"9d3f7a12-4c8b-4e21-9f0a-2b7c1d5e8a34"` |
| Tipo en JSON | **String**, siempre. **NUNCA** número |
| Comparación | El frontend DEBE tratarlos como opacos: no parsear, no ordenar, no inferir nada de su contenido |

**Fundamento.** El sistema maneja datos clínicos identificables. Los
identificadores secuenciales permiten enumeración y estimación de volumen
(cuántos pacientes se atendieron, en qué orden), lo que constituye fuga de
información en un contexto sanitario. El schema de referencia de la auditoría ya
proponía UUID; este contrato lo fija como obligatorio.

**Excepciones permitidas** — catálogos estables, no sensibles y de cardinalidad
baja PUEDEN usar códigos legibles como clave:

| Catálogo | Clave | Ejemplo |
|---|---|---|
| Niveles de triage | Código | `"C1"` … `"C5"` |
| Roles | Slug | `"medico"` |
| Tipos de consentimiento | Slug | `"share_with_contacts"` |

> **Nota sobre el prototipo:** los identificadores actuales (`pat-001`,
> `sess-1001`, `pic-101`, `'usr-' + Date.now()`) son artefactos de simulación.
> **No forman parte del contrato** y no deben usarse como referencia de formato.

### 2.7 Codificación

| Aspecto | Regla |
|---|---|
| Codificación | **UTF-8**, sin BOM, en request y response |
| `Content-Type` de request | `application/json; charset=utf-8` |
| `Content-Type` de response | `application/json; charset=utf-8` |
| `Accept` | `application/json` |
| Subida de archivos | `multipart/form-data` (§8.10) |

**Requisitos específicos del dominio.** La codificación **DEBE** preservar
íntegramente:

- Caracteres del español: `ñ`, `Ñ`, vocales acentuadas, `¿`, `¡`, `°`.
- El nombre del producto: **SEÑAVIDA**.
- **Emoji**, incluidos los de plano astral y secuencias compuestas. Los
  pictogramas médicos se representan con emoji (`🤕`, `🫁`, `🤟`) y los mensajes
  del sistema los incluyen en su cuerpo. El almacenamiento **DEBE** soportar el
  rango Unicode completo, no un subconjunto de 3 bytes.

**Longitudes.** Todos los límites de longitud de este contrato se expresan en
**caracteres Unicode**, no en bytes.

**Normalización.** El backend **DEBERÍA** normalizar el texto entrante a
**NFC** antes de persistir, para que las comparaciones y búsquedas sean
consistentes.

---

## 3. Autenticación

### 3.1 Situación de partida

**OBSERVADO — punto crítico.** El frontend auditado **no tiene autenticación
real**:

- El formulario de acceso acepta cualquier credencial sin verificarla.
- El rol se elige mediante botones en la propia pantalla de acceso.
- El estado `isActive` del usuario existe como campo pero nunca se comprueba.
- El portal del paciente **omite por completo** los campos de credenciales: al
  seleccionar ese perfil, el acceso es directo.
- Existen tres controles distintos que permiten **cambiar de rol sin
  reautenticación**.

Nada de lo anterior es un mecanismo de autenticación que este contrato pueda
documentar. Toda esta sección define lo que debe construirse desde cero, **bajo
el modelo API REST con Laravel Sanctum (Bearer token)** ratificado en A-02/A-03.

### 3.2 Método por consumidor

El sistema tiene **dos consumidores** y ambos se autentican con **Bearer token de
Sanctum**, emitido por el backend y enviado por el cliente en la cabecera
`Authorization`. La diferencia está en cómo se obtiene el token y en su vigencia.

| Consumidor | Método | Vigencia |
|---|---|---|
| **Personal de salud** | Sanctum API token, obtenido con email + contraseña | Larga; se revoca en logout |
| **Paciente** | Sanctum token derivado del **código CTA**, sin contraseña | Acotada a la sesión médica; expira con ella |

**Transporte del token — común a ambos:**

| Atributo | Valor |
|---|---|
| Cabecera | `Authorization: Bearer {token}` |
| Emisión | El backend crea el token con Sanctum (`createToken`) en el login y lo devuelve **una sola vez** en el cuerpo de la respuesta |
| Almacenamiento en el cliente | El frontend guarda el token (A-08) y lo adjunta en cada petición autenticada |
| Revocación | En logout el backend **DEBE** eliminar el token del portador (`delete` del `accessToken`) |
| `GET` de recursos protegidos | También requieren el `Authorization` |

> **Seguridad.** Como el token viaja en el cuerpo/cabecera y no en cookie, **no
> se usa CSRF** (§3.6 derogada). El backend **DEBE** servirse siempre sobre HTTPS
> en integración y producción para proteger el token en tránsito. El frontend
> **NO DEBE** exponer el token en la URL ni en logs.

#### Paciente — token derivado del código CTA (A-03)

El código entregado en ventanilla (`TemporaryAccessCode`) se **canjea** por un
Bearer token de Sanctum:

- El paciente envía su código CTA a `POST /api/v1/auth/patient/redeem`.
- El backend valida el código (existencia, vigencia, no usado) y, si es válido,
  emite un token acotado a **esa** sesión médica.
- El token **hereda la vigencia de la sesión médica**: al cerrarse o expirar la
  atención (§3.7), el token queda revocado y el paciente pierde acceso.
- El token del paciente **solo** habilita los endpoints del portal del paciente
  para su propia sesión médica; nunca endpoints del personal.

### 3.3 Flujo de login — personal

```
1. POST /api/v1/auth/login
        → { email, password, healthCenterId, unitId }

2. Backend valida, en este orden:
        a) Formato de los campos              → 422 si falla
        b) Límite de intentos                 → 429 si se supera
        c) Credenciales                       → 422 si no coinciden
        d) Usuario activo (isActive)          → 403 si está inactivo
        e) Pertenencia al centro y unidad     → 403 si no corresponde

3. Éxito:
        → Emite un Sanctum token con createToken()
        → Registra evento de auditoría 'login'
        → Responde 200 con el token y el contexto del usuario (envoltorio §4)
```

**Respuesta de login (éxito) — forma:**

```json
{
  "success": true,
  "data": {
    "token": "12|aBcD3f...opaco...",
    "tokenType": "Bearer",
    "user": {
      "id": "9d3f7a12-4c8b-4e21-9f0a-2b7c1d5e8a34",
      "name": "María Torres",
      "role": "medico",
      "roleLabel": "Médico",
      "healthCenterId": "…",
      "healthCenterName": "…",
      "unitId": "…",
      "unitName": "…",
      "permissions": ["…"]
    }
  }
}
```

**Contexto devuelto tras el login** — el frontend lo necesita para el encabezado,
el menú y el ocultamiento de controles:

| Campo | Uso en la interfaz |
|---|---|
| `user.id` | Identificación interna |
| `user.name` | Distintivo de usuario |
| `user.role` | Determina la vista inicial |
| `user.roleLabel` | Etiqueta legible |
| `user.healthCenterId` / `healthCenterName` | Ruta de navegación superior |
| `user.unitId` / `unitName` | Ruta de navegación superior |
| `permissions[]` | Ocultamiento de controles (§12.4) |

> **Requisito derivado.** El backend **DEBE** entregar **identificador y nombre**
> de centro y unidad. El prototipo guarda solo el nombre legible, lo que impide
> toda lógica de multitenancy en el cliente y produjo inconsistencias entre el
> nombre mostrado y el enviado.

**Regla vinculante — el rol no es elegible.** El rol lo determina exclusivamente
el backend a partir de la cuenta autenticada. El cliente **NO DEBE** enviar rol
en el login, y si lo envía el backend **DEBE ignorarlo**. Esto elimina de raíz el
selector de rol del prototipo.

**Endpoint del usuario autenticado.** El frontend PUEDE recuperar el contexto en
cualquier momento con `GET /api/v1/auth/me` (requiere Bearer token), útil al
recargar la aplicación cuando ya tiene un token guardado.

### 3.4 Logout

```
POST /api/v1/auth/logout    (requiere Bearer token)
```

| Requisito | Detalle |
|---|---|
| Autenticación | Requerida (Bearer token) |
| Invalidación | El backend **DEBE** eliminar el token del portador en el servidor (`currentAccessToken()->delete()`). No basta con que el cliente lo borre |
| Auditoría | Registra evento `logout` |
| Respuesta | `200` con envoltorio `success: true` (o `204`); el frontend descarta su token local |
| Idempotencia | Un logout sin token válido **DEBE** responder de forma controlada (`401`), sin error de servidor |

**Regla vinculante — el logout no cierra la atención.** Cerrar sesión de usuario
**NO DEBE** cerrar la sesión médica en curso. Son ciclos de vida independientes:
el personal cambia de turno mientras la atención del paciente continúa. Cerrar
una atención es una acción clínica explícita y distinta (§11.3).

### 3.5 Manejo del token

| Aspecto | Regla |
|---|---|
| Estado en el servidor | Sanctum persiste los tokens en la tabla `personal_access_tokens`. El backend puede revocarlos individualmente |
| Contenido del token | **Opaco.** El frontend NO DEBE parsearlo ni inferir nada de su texto |
| Datos de usuario | NO viajan dentro del token; se obtienen de `GET /api/v1/auth/me` |
| Sesiones concurrentes | Permitidas por defecto: un usuario PUEDE tener varios tokens activos (varios dispositivos). Cada logout revoca solo el token usado |
| Cambio de rol | **Imposible con el mismo token.** Requiere cerrar sesión y volver a autenticarse |

> **Distinción terminológica de uso obligatorio en todo el proyecto.** El
> término «sesión» es ambiguo en este dominio y su confusión ya generó errores en
> el prototipo. Este contrato exige distinguir siempre:
>
> - **Sesión de usuario** — autenticación de una persona (su Bearer token).
> - **Sesión médica** (`MedicalSession`) — la atención clínica de un paciente.
>
> No comparten ciclo de vida, ni caducidad, ni responsable.

### 3.6 Protección CSRF — DEROGADA

Bajo API REST con **Bearer token** (no cookies), **la protección CSRF no
aplica**. CSRF protege peticiones que el navegador autentica automáticamente por
cookie; un Bearer token debe adjuntarse explícitamente en cada petición, por lo
que el vector CSRF desaparece.

En su lugar rigen:

| Aspecto | Regla |
|---|---|
| Autenticación de toda mutación (`POST`/`PUT`/`PATCH`/`DELETE`) | Cabecera `Authorization: Bearer {token}` válida |
| Token ausente o inválido | **401** (§5.5) |
| Token válido sin permiso para la acción | **403** (§5.6) |
| Transporte | HTTPS obligatorio en integración y producción |

> El código **419 Page Expired** (propio del CSRF de sesión) **deja de usarse**
> en esta arquitectura.

### 3.7 Expiración de sesión

**Dos temporizadores independientes y no intercambiables.** Confundirlos es un
error frecuente y este contrato lo previene explícitamente.

| Temporizador | Ámbito | Valor por defecto | Configurable |
|---|---|---|---|
| **Inactividad de la sesión de usuario** | Autenticación | `DECISIÓN PENDIENTE — D-04` | — |
| **Inactividad de la sesión médica** | Atención clínica | **20 minutos** | Sí, por el administrador |

#### Inactividad de la sesión médica — DECLARADO

La interfaz de administración declara al usuario:

> *«La atención inclusiva se cerrará automáticamente si no se detecta actividad
> en el chat en este lapso.»*

Requisitos vinculantes:

| Requisito | Detalle |
|---|---|
| Valor por defecto | 20 minutos |
| Rango admisible | 5 a 240 minutos |
| Señal de actividad | Mensajes de chat de **cualquier** participante |
| Acción al expirar | La sesión médica pasa a `expired` |
| Ejecución | Proceso programado en el backend. **NO DEBE** depender de que haya un navegador abierto |
| Efectos | Los mismos que el cierre manual (§11.3), salvo que no hay `closedBy` |
| Auditoría | Evento `session_expired` |

**Regla vinculante.** El vencimiento **DEBE** producirse aunque no haya ningún
cliente conectado. Un paciente que cierra el navegador no impide que su atención
expire.

### 3.8 Vigencia y renovación del token

| Aspecto | Regla |
|---|---|
| Vigencia del token de personal | El token permanece válido hasta el logout o su revocación. PUEDE configurarse una expiración por inactividad vía `config/sanctum.php` (`expiration`) |
| Renovación | No se requiere endpoint dedicado; mientras el token sea válido, el acceso continúa |
| Token del paciente | Su vigencia está atada a la sesión médica: al expirar o cerrarse la atención, el backend **DEBE** revocar el token |
| Token inválido o expirado | El backend responde **401**; el frontend **DEBE** descartar el token, redirigir al acceso y preservar el destino original |
| Pérdida de datos | El frontend **DEBERÍA** preservar el contenido no enviado de formularios largos —nota clínica, resumen de egreso— para no perder trabajo clínico |

**Regla vinculante — la actividad de la sesión médica es independiente.** Que el
token del personal siga válido **no** mantiene viva la sesión médica. Solo los
mensajes de chat renuevan la sesión **médica**. Un profesional consultando la
pantalla sin interactuar con el paciente no impide que la atención expire por
inactividad (§3.7).

---

## 4. Formato estándar de respuestas

### 4.1 Principio

Toda respuesta del backend **DEBE** tener una de **tres formas**, y solo tres. El
frontend puede así implementar un único manejador y no defenderse ante formas
imprevistas.

| Forma | Cuándo | Códigos |
|---|---|---|
| **Éxito** | La operación se completó | 200, 201 |
| **Error de validación** | El payload no cumple las reglas | 422 |
| **Error general** | Cualquier otro fallo | 400, 401, 403, 404, 409, 429, 500, 503 |

Un **204** no tiene cuerpo y queda fuera de estas tres formas.

### 4.2 Éxito — recurso único

```json
{
  "status": "success",
  "data": {
    "id": "9d3f7a12-4c8b-4e21-9f0a-2b7c1d5e8a34",
    "triageLevel": "C3",
    "triageLevelName": "Urgencia Mediana (Amarillo)",
    "colorHex": "#9B6F08",
    "observations": "Paciente con dolor de cabeza persistente e hipertermia leve.",
    "completedAt": "2026-07-12T11:18:00Z"
  }
}
```

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `status` | string | ✅ | Constante `"success"` |
| `data` | object | ✅ | El recurso |
| `meta` | object | ❌ | Metadatos (§9.5) |
| `sideEffects` | object | ❌ | Efectos secundarios producidos (§4.5) |

### 4.3 Éxito — colección

```json
{
  "status": "success",
  "data": [
    { "id": "…", "body": "…" },
    { "id": "…", "body": "…" }
  ],
  "meta": {
    "pagination": {
      "total": 3412,
      "perPage": 25,
      "currentPage": 1,
      "lastPage": 137,
      "from": 1,
      "to": 25
    }
  }
}
```

**Reglas vinculantes:**

- `data` **DEBE** ser un array, incluso con un solo elemento.
- Una colección vacía **DEBE** devolver `"data": []` con **200**. **NUNCA**
  `null`, **NUNCA** 404.
- Toda colección paginable **DEBE** incluir `meta.pagination` (§14).

### 4.4 Éxito sin contenido

Para operaciones sin recurso que devolver, el backend **DEBE** responder **204**
sin cuerpo. **NO DEBE** responder 200 con `"data": null`.

### 4.5 Efectos secundarios

Varias operaciones producen cambios en otros módulos. Cuando así sea, la
respuesta **DEBE** declararlos en `sideEffects` para que el frontend actualice su
estado sin recargar.

```json
{
  "status": "success",
  "data": { "id": "…", "triageLevel": "C3" },
  "sideEffects": {
    "systemMessageId": "b2c4…",
    "sessionStageChanged": null
  }
}
```

Operaciones con efectos secundarios declarables:

| Operación | Efecto |
|---|---|
| Confirmar triage | Mensaje automático al paciente con el nivel asignado |
| Avanzar de etapa | Mensaje de sistema de derivación |
| Convocar al paciente | Mensaje de sistema con la ubicación |
| Cerrar la atención | Mensaje de sistema, expiración del código, revocación de consentimientos |

### 4.6 Error de validación — 422

Es el **único** formato de error con estructura propia, porque el frontend debe
asociar cada mensaje a su campo.

```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Los datos enviados no son válidos.",
  "errors": {
    "temperature": ["La temperatura debe estar entre 30 y 45 °C."],
    "observations": ["El fundamento de categorización es obligatorio."]
  }
}
```

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `status` | string | ✅ | Constante `"error"` |
| `code` | string | ✅ | Constante `"VALIDATION_ERROR"` |
| `message` | string | ✅ | Resumen legible |
| `errors` | object | ✅ | Mapa `campo → array de mensajes` |

**Reglas vinculantes:**

- Las claves de `errors` **DEBEN** coincidir exactamente con los nombres de campo
  del request, en `camelCase`.
- El valor **DEBE** ser siempre un **array**, aunque haya un solo mensaje.
- Campos anidados usan notación de punto: `"contacts.0.phone"`.
- El backend **DEBE** devolver **todos** los errores de una vez, no el primero.
- Los mensajes **DEBEN** estar en español, dirigidos al usuario final, sin
  jerga técnica ni nombres de columna.

### 4.7 Error general

```json
{
  "status": "error",
  "code": "INACTIVE_SESSION",
  "message": "La sesión médica ya no se encuentra activa."
}
```

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `status` | string | ✅ | Constante `"error"` |
| `code` | string | ✅ | Identificador estable, legible por máquina (§18.2) |
| `message` | string | ✅ | Texto en español para el usuario |
| `details` | object | ❌ | Contexto adicional |
| `retryAfter` | integer | ❌ | Segundos hasta poder reintentar (429, 503) |

**Regla vinculante.** El frontend **DEBE** ramificar su lógica por `code`,
**nunca** por el texto de `message`. Los mensajes pueden reescribirse o
traducirse; los `code` son parte del contrato y solo cambian con una versión
mayor.

### 4.8 Prohibiciones

El backend **NO DEBE**:

| Prohibición | Motivo |
|---|---|
| Devolver 200 con un error en el cuerpo | Rompe el manejo por código HTTP |
| Devolver HTML ante un error de API | El frontend no puede interpretarlo |
| Exponer trazas, SQL o rutas de archivos | Fuga de información (§13.6) |
| Devolver `message` vacío o nulo | El frontend no tendría qué mostrar |
| Inventar formas de respuesta fuera de §4.2–§4.7 | Rompe el manejador único |
| Incluir datos clínicos en mensajes de error | Los errores se registran en bitácoras |

---

## 5. Códigos HTTP oficiales

Solo los códigos de esta sección forman parte del contrato. El backend **NO
DEBE** emitir otros sin actualizar este documento.

### 5.1 `200 OK`

**Cuándo:** lectura exitosa, o mutación exitosa que devuelve el recurso
actualizado.

| Situación | Ejemplo |
|---|---|
| Obtener un recurso | Consultar una sesión médica |
| Obtener una colección | Listar mensajes |
| Actualizar y devolver | Habilitar un pictograma |
| Acción sobre recurso existente | Aprobar un consentimiento |
| Colección vacía | Lista de sesiones sin resultados → `"data": []` |

**NO DEBE** usarse para: creación (201), operaciones sin contenido (204), ni
ningún error.

### 5.2 `201 Created`

**Cuándo:** se creó un recurso nuevo y persistente.

| Situación |
|---|
| Abrir una sesión médica |
| Enviar un mensaje |
| Registrar signos vitales |
| Confirmar categorización de urgencia |
| Firmar una nota clínica |
| Solicitar un consentimiento |
| Convocar al paciente |
| Solicitar intérprete |
| Crear un pictograma o un usuario |

**DEBE** incluir el recurso creado en `data`, con su identificador definitivo.
**DEBERÍA** incluir la cabecera `Location`.

> **Nota:** validar un código de atención responde **200**, no 201: verifica un
> recurso existente, no crea nada. La creación de la sesión médica es un paso
> posterior y distinto.

### 5.3 `204 No Content`

**Cuándo:** la operación se completó y no hay nada que devolver.

| Situación |
|---|
| Cancelar una convocatoria |
| Eliminar un pictograma |
| Marcar un mensaje como leído |

**NO DEBE** llevar cuerpo.

### 5.4 `400 Bad Request`

**Cuándo:** la petición está **malformada** y no puede procesarse.

| Situación | Ejemplo |
|---|---|
| JSON sintácticamente inválido | Cuerpo truncado |
| `Content-Type` incorrecto | Se envió `text/plain` |
| Parámetro de query con tipo imposible | `perPage=abc` |
| Cuerpo ausente donde es obligatorio | `POST` sin payload |

**Distinción obligatoria con 422:** 400 es «no entiendo la petición»; 422 es «la
entiendo, pero los datos no cumplen las reglas». Un campo mal formateado dentro
de un JSON válido es **422**, nunca 400.

### 5.5 `401 Unauthorized`

**Cuándo:** no hay identidad válida.

| Situación |
|---|
| Sin sesión ante un recurso protegido |
| Sesión expirada |
| Token inválido o vencido |
| Credenciales incorrectas en el acceso |

**Acción del frontend:** redirigir al acceso preservando el destino original.
**NO DEBE** reintentar automáticamente.

### 5.6 `403 Forbidden`

**Cuándo:** la identidad es válida, pero **no tiene permiso**.

| Situación | `code` |
|---|---|
| Rol sin permiso para la acción | `FORBIDDEN_ROLE` |
| Recurso de otro centro de salud | `FORBIDDEN_CENTER` |
| Escritura sobre sesión médica no activa | `INACTIVE_SESSION` |
| Usuario desactivado | `USER_INACTIVE` |
| Código de atención bloqueado por intentos | `BLOCKED_CODE` |
| Acción que exige consentimiento no otorgado | `CONSENT_REQUIRED` |

**Acción del frontend:** mostrar el mensaje. **NO DEBE** reintentar ni redirigir
al acceso.

**Regla de privacidad.** Cuando revelar la existencia de un recurso constituya
fuga de información —por ejemplo, consultar la sesión médica de otro centro—, el
backend **DEBERÍA** responder **404** en lugar de 403.

### 5.7 `404 Not Found`

**Cuándo:** el recurso no existe, o el solicitante no tiene derecho a saber que
existe.

| Situación |
|---|
| Identificador inexistente |
| Recurso eliminado |
| Ruta inexistente |
| Recurso fuera del alcance del solicitante (por privacidad) |

**NO DEBE** usarse para colecciones vacías, que son **200** con `"data": []`.

### 5.8 `409 Conflict`

**Cuándo:** la petición es válida pero **contradice el estado actual**.

| Situación | `code` |
|---|---|
| Código de atención ya consumido | `CODE_ALREADY_CONSUMED` |
| Sesión médica ya cerrada | `SESSION_ALREADY_CLOSED` |
| Consentimiento ya respondido | `CONSENT_ALREADY_ANSWERED` |
| Intento de modificar una nota clínica firmada | `NOTE_IMMUTABLE` |
| Segunda solicitud de intérprete con una activa | `INTERPRETER_ALREADY_REQUESTED` |
| Transición de etapa no permitida | `INVALID_STAGE_TRANSITION` |

**Distinción con 422:** 422 es «estos datos son inválidos en cualquier
circunstancia»; 409 es «estos datos serían válidos, pero no en el estado actual».

### 5.9 `419 Page Expired` — NO APLICA en API REST

Este código pertenecía al modelo de **sesión con cookie + CSRF** (v1). Bajo
**Bearer token** (v2) **no se emite**. Un token ausente, inválido o vencido se
señala con **401** (§5.5). Se conserva la numeración de la sección solo por
trazabilidad histórica.

### 5.10 `422 Unprocessable Entity`

**Cuándo:** la petición está bien formada pero **los datos no pasan las
validaciones** (§10).

| Situación |
|---|
| Campo requerido ausente |
| Tipo incorrecto |
| Valor fuera de rango clínico |
| Formato inválido |
| Valor fuera de un enum |
| Referencia a un identificador inexistente |
| Credenciales que no coinciden |

**DEBE** usar el formato de §4.6 con el objeto `errors`. Es el código **más
frecuente** de la API.

### 5.11 `429 Too Many Requests`

**Cuándo:** se superó un límite de frecuencia (§13.5).

| Situación | Límite |
|---|---|
| Intentos de acceso | Por dirección IP y por cuenta |
| Validación de códigos de atención | Por usuario |
| Envío de mensajes | Por sesión médica |
| Formulario público de contacto | Por dirección IP |

**DEBE** incluir `Retry-After` y `retryAfter`. **Acción del frontend:** informar
y esperar. **NO DEBE** reintentar antes del plazo.

> **Advertencia de seguridad.** El límite de intentos de código de atención es
> **distinto** del contador de intentos fallidos del propio código, que provoca
> su bloqueo permanente (**403 `BLOCKED_CODE`**). Ambos coexisten y no deben
> confundirse.

### 5.12 `500 Internal Server Error`

**Cuándo:** fallo no controlado del servidor.

| Requisito |
|---|
| **NO DEBE** exponer trazas, SQL, rutas ni nombres de clase |
| **DEBE** registrar el fallo con un identificador de correlación |
| **DEBERÍA** incluir ese identificador en `details.incidentId` |
| El mensaje **DEBE** ser genérico y accionable |

Mensaje estándar:

> *«Ocurrió un error inesperado. El equipo técnico fue notificado. Si el problema
> persiste, contacta a soporte indicando el código de incidente.»*

**Acción del frontend:** mostrar el mensaje y ofrecer reintentar. **NO DEBE**
reintentar automáticamente una operación de escritura, para no duplicar registros
clínicos.

### 5.13 `503 Service Unavailable`

**Cuándo:** el servicio no está disponible temporalmente —mantenimiento, o
dependencia externa caída (videollamada, mensajería saliente).

**DEBE** incluir `Retry-After`. Se incluye en el contrato porque el sistema
depende de terceros cuya caída no debe presentarse como error genérico.

### 5.14 Tabla de referencia rápida

| Código | Significado | ¿Cuerpo? | ¿Reintentar? |
|---|---|---|---|
| 200 | Éxito | ✅ | — |
| 201 | Creado | ✅ | — |
| 204 | Éxito sin contenido | ❌ | — |
| 400 | Petición malformada | ✅ | ❌ |
| 401 | Sin autenticar | ✅ | ❌ → acceso |
| 403 | Sin permiso | ✅ | ❌ |
| 404 | No encontrado | ✅ | ❌ |
| 409 | Conflicto de estado | ✅ | ❌ → recargar |
| ~~419~~ | *No aplica en API REST — usar 401* | — | — |
| 422 | Validación fallida | ✅ | ❌ → corregir |
| 429 | Demasiadas peticiones | ✅ | ✅ tras `Retry-After` |
| 500 | Error del servidor | ✅ | ⚠️ solo lecturas |
| 503 | No disponible | ✅ | ✅ tras `Retry-After` |

---

## 6. Entidades del sistema

### 6.1 Cómo leer esta sección

Para cada entidad se indica:

- **Nombre** — identificador canónico. Es el nombre que ambos equipos usan en
  conversaciones, tickets y código.
- **Descripción** — qué representa en el dominio.
- **Responsable** — **quién crea y modifica** la entidad. Es la columna más
  importante del contrato: define quién puede escribir. Un rol que no figura como
  responsable **NO DEBE** poder mutar la entidad, aunque pueda leerla.
- **Relaciones** — vínculos con otras entidades.

**Procedencia.** Se indica el origen de cada entidad:

| Marca | Significado |
|---|---|
| 🟦 **Tipada** | Existe como tipo en el frontend |
| 🟩 **Referenciada** | Aparece en el schema de referencia, no en los tipos del frontend |
| 🟥 **Nueva** | No existe en ninguna fuente. La interfaz la necesita pero nunca fue modelada |

### 6.2 Mapa de relaciones

```
Organization
   └──* HealthCenter
          ├──* Unit
          │     └──* Location
          └──* User ──* Role

Patient
   ├──* PatientContact
   ├──* TemporaryAccessCode
   └──* MedicalSession

MedicalSession  ◄── raíz de todo el dominio clínico
   ├──1 Patient        ├──1 HealthCenter   ├──1 Unit
   ├──1 User (apertura) ├──0..1 User (cierre)
   ├──0..1 TemporaryAccessCode (consumido)
   ├──* Consent
   ├──* ChatMessage ──0..1 Pictogram
   ├──* VitalSigns
   ├──* TriageRecord ──1 TriageLevel
   ├──* ClinicalNote
   ├──* PatientCall ──1 Location
   ├──* InterpreterRequest
   └──* TimelineEvent

PictogramCategory ──* Pictogram
QuickMessage        (catálogo independiente)
SecuritySetting     (configuración por ámbito)
AuditLog            (transversal a todo)
ContactMessage      (público, fuera del dominio clínico)
```

### 6.3 Catálogo de entidades

---

#### E01 · `Organization` 🟩

| Aspecto | Definición |
|---|---|
| **Descripción** | Entidad jurídica que agrupa establecimientos de salud. Nivel superior del aislamiento multiinquilino |
| **Responsable** | Backend / administración de plataforma. **Ningún rol de la aplicación la crea o modifica** |
| **Relaciones** | `hasMany` HealthCenter · `hasMany` User · referenciada por MedicalSession |

> No existe interfaz para gestionarla. Se administra fuera de la aplicación.

---

#### E02 · `HealthCenter` 🟩

| Aspecto | Definición |
|---|---|
| **Descripción** | Establecimiento asistencial: hospital, complejo o clínica. Es la **frontera del aislamiento de datos**: ningún usuario accede a información clínica de otro centro |
| **Responsable** | Administración de plataforma. Consumido como catálogo de solo lectura por el acceso y el encabezado |
| **Relaciones** | `belongsTo` Organization · `hasMany` Unit, User, MedicalSession, TemporaryAccessCode |

> **Regla vinculante.** Toda consulta de datos clínicos **DEBE** filtrarse por el
> centro del usuario autenticado. Es el mecanismo primario de privacidad.

---

#### E03 · `Unit` 🟩

| Aspecto | Definición |
|---|---|
| **Descripción** | Unidad asistencial dentro de un establecimiento: urgencia adulto, urgencia infantil, maternidad |
| **Responsable** | Administración de plataforma. Catálogo de solo lectura para la aplicación |
| **Relaciones** | `belongsTo` HealthCenter · `hasMany` Location, User, MedicalSession |

---

#### E04 · `Location` 🟥

| Aspecto | Definición |
|---|---|
| **Descripción** | Punto físico al que se convoca a un paciente: box, sala de espera, sala de procedimientos |
| **Responsable** | Administración institucional |
| **Relaciones** | `belongsTo` Unit · referenciada por PatientCall |

> **Origen.** La interfaz ofrece tres listas de destinos **distintas e
> inconsistentes** según el rol que convoca, con etiquetas duplicadas para lo que
> parece ser el mismo lugar. Este contrato exige un **catálogo único por unidad**.
> `DECISIÓN PENDIENTE — D-05`: definir el catálogo real de cada establecimiento.

---

#### E05 · `User` 🟦🟩

| Aspecto | Definición |
|---|---|
| **Descripción** | Funcionario del sistema de salud con acceso a la plataforma |
| **Responsable** | `admin_institucional` |
| **Relaciones** | `belongsTo` Organization, HealthCenter, Unit · `hasMany`/`belongsToMany` Role · registrado como autor en MedicalSession, VitalSigns, TriageRecord, ClinicalNote, PatientCall, AuditLog |

> **Brecha declarada.** La interfaz promete gestión de usuarios («habilita o
> restringe cuentas») y muestra un contador de funcionarios activos, pero **no
> existe pantalla alguna de gestión**. El backend **DEBE** proveer estos recursos
> igualmente: son requisito declarado del producto (§7.9).
>
> **El paciente NO es un `User`.** Ver E07 y `DECISIÓN PENDIENTE — D-02`.

---

#### E06 · `Role` 🟦

| Aspecto | Definición |
|---|---|
| **Descripción** | Perfil funcional que determina capacidades y visibilidad de datos |
| **Responsable** | Backend. **Inmutable desde la aplicación** |
| **Valores** | `super_admin`, `admin_institucional`, `admision`, `categorizacion`, `medico`, `paciente` |
| **Nota `super_admin`** | Rol libre (sin centro/unidad). Gestiona la estructura del sistema: crea organizaciones, centros, unidades y usuarios en cualquier centro. El `admin_institucional` queda limitado a crear unidades y usuarios dentro de su propio centro. |
| **Relaciones** | Vinculado a User |

> **Regla vinculante.** El rol **NO DEBE** ser elegible, enviable ni modificable
> por el cliente. El prototipo permite elegirlo en el acceso y cambiarlo desde
> tres controles sin reautenticación; ambos comportamientos quedan **prohibidos**.
>
> `DECISIÓN PENDIENTE — D-06`: ¿un rol por usuario o varios? El frontend asume
> uno; el borrador de autorización de la auditoría sugiere varios.

---

#### E07 · `Patient` 🟦🟩

| Aspecto | Definición |
|---|---|
| **Descripción** | Persona sorda o con necesidad de mediación comunicacional atendida por el sistema. Titular de sus datos y de sus consentimientos |
| **Responsable** | **El propio paciente**, desde su aplicación. **NINGÚN rol clínico puede modificar esta entidad** |
| **Relaciones** | `hasMany` PatientContact, TemporaryAccessCode, MedicalSession |

> **Regla vinculante de autonomía.** La interfaz de admisión declara
> explícitamente que la ficha *«no es editable por el personal de salud para
> resguardar la exactitud de sus preferencias y su autonomía clínica»*. El
> backend **NO DEBE** exponer ningún recurso de escritura sobre `Patient`
> accesible a roles clínicos.
>
> **Campos que el contrato incorpora** y que el schema de referencia omitía:
> identificación nacional, fecha de nacimiento, previsión de salud, dirección,
> centro de atención primaria y teléfono. La interfaz los muestra en cuatro
> pantallas distintas; son parte del contrato.
>
> **Corrección obligatoria.** La edad **NO DEBE** almacenarse: se deriva de la
> fecha de nacimiento. Almacenarla produce datos obsoletos.

---

#### E08 · `PatientContact` 🟦🟩

| Aspecto | Definición |
|---|---|
| **Descripción** | Contacto de emergencia designado por el paciente, con permisos propios sobre qué se le puede comunicar |
| **Responsable** | **El propio paciente** |
| **Relaciones** | `belongsTo` Patient · referenciado por Consent de tipo `share_with_contacts` |

> **Corrección obligatoria.** El frontend modela **un solo contacto anidado** en
> el paciente, pero una de sus pantallas ofrece **dos contactos** para elegir. La
> relación **DEBE** ser uno-a-muchos. El objeto anidado singular queda prohibido.

---

#### E09 · `TemporaryAccessCode` 🟩

| Aspecto | Definición |
|---|---|
| **Descripción** | Código temporal de atención (CTA). Credencial intransferible y de un solo uso que autoriza a abrir una sesión médica en presencia física del paciente |
| **Responsable** | Backend lo genera. `admision` lo valida y consume |
| **Relaciones** | `belongsTo` Patient, HealthCenter · `hasOne` MedicalSession (al consumirse) |

> **Reglas vinculantes:**
> - El código **NUNCA** se almacena en claro; se persiste su resumen criptográfico.
> - El código en claro se devuelve **una sola vez**, al generarlo.
> - Es de **un solo uso**: al abrir la sesión pasa a consumido.
> - Tiene vencimiento obligatorio.
> - Acumula intentos fallidos y se bloquea al alcanzar el máximo configurado.
> - **DEBE** validarse contra el centro de salud del funcionario.
>
> **Requisito derivado.** El identificador o el propio código **DEBE** exponerse
> dentro del recurso `MedicalSession`. La interfaz lo muestra en cinco pantallas
> y hoy lo tiene fijo en el código porque el modelo no lo entrega.

---

#### E10 · `MedicalSession` 🟦🟩

| Aspecto | Definición |
|---|---|
| **Descripción** | **Entidad central del sistema.** Una atención clínica concreta de un paciente en un establecimiento y unidad, con su ciclo de vida y todos sus artefactos asociados |
| **Responsable** | `admision` la abre · `admision` y `categorizacion` la hacen avanzar · `medico` la cierra · el backend la expira |
| **Relaciones** | `belongsTo` Patient, Organization, HealthCenter, Unit, User (apertura), User (cierre) · `hasMany` Consent, ChatMessage, VitalSigns, TriageRecord, ClinicalNote, PatientCall, InterpreterRequest, TimelineEvent |

> **Regla vinculante de integridad.** Ninguna entidad clínica puede existir sin
> una sesión médica, y ninguna escritura se acepta si la sesión no está activa
> (§11.3).
>
> `DECISIÓN PENDIENTE — D-07`: el frontend mantiene **dos** representaciones de
> estado —un estado enumerado y una etapa de texto libre— que codifican
> información solapada. Debe unificarse en una sola máquina de estados.

---

#### E11 · `Consent` 🟦🟩

| Aspecto | Definición |
|---|---|
| **Descripción** | Autorización granular del paciente sobre un uso específico de sus datos o sensores durante una atención |
| **Responsable** | `medico` **solicita** · **solo el paciente otorga, rechaza o revoca** |
| **Relaciones** | `belongsTo` MedicalSession, Patient · referencia opcional a PatientContact |

> **Regla vinculante de autonomía.** Ningún rol clínico **DEBE** poder cambiar el
> estado de un consentimiento. Solicitar y responder son acciones de actores
> distintos, sin excepción.
>
> **Corrección obligatoria.** La interfaz correlaciona el consentimiento con su
> contacto mediante coincidencia de texto sobre el título. Con dos contactos de
> apellido similar, esto puede **autorizar el envío de datos clínicos a la
> persona equivocada**. El contrato exige una referencia estructurada al contacto.
>
> `DECISIÓN PENDIENTE — D-08`: ¿el título y la descripción se almacenan como
> texto, o se generan desde plantillas a partir del tipo y sus parámetros?

---

#### E12 · `ChatMessage` 🟦🟩

| Aspecto | Definición |
|---|---|
| **Descripción** | Mensaje del canal de comunicación inclusiva: texto, mensaje rápido, pictograma, traducción de señas o aviso del sistema |
| **Responsable** | `paciente`, `admision`, `categorizacion`, `medico` · el **backend** genera los de tipo sistema |
| **Relaciones** | `belongsTo` MedicalSession · `belongsTo` Pictogram (opcional) · autor opcional User |

> **Regla vinculante de identidad.** El backend **DEBE** derivar tipo de emisor,
> identificador, nombre y origen del contexto autenticado. Si el cliente los
> envía, **DEBEN ignorarse**. El prototipo los construye en el navegador, lo que
> permitiría suplantar a cualquier participante.
>
> **Correcciones obligatorias:** el campo de pictograma se renombra a
> `pictogramId` y **DEBE** ser una referencia real; el nivel de confianza de las
> traducciones de señas **DEBE** persistirse y el tipo de mensaje **DEBE** ser el
> correspondiente, no texto genérico.

---

#### E13 · `Pictogram` 🟦

| Aspecto | Definición |
|---|---|
| **Descripción** | Símbolo médico con frase asociada y texto para síntesis de voz, que el paciente usa para expresarse sin lenguaje escrito |
| **Responsable** | `admin_institucional` |
| **Relaciones** | `belongsTo` PictogramCategory · referenciado por ChatMessage |

> **Correcciones obligatorias:**
> 1. El símbolo visible **DEBE** ser un dato de la entidad. El prototipo lo
>    resuelve con una correspondencia fija en el código, por lo que **todo
>    pictograma nuevo creado desde administración aparecería con un símbolo
>    genérico**. Esto anula la función del mantenedor.
> 2. El color **NO DEBE** transportarse como clases de estilo. Se transporta un
>    token semántico de severidad y el frontend decide su representación.

---

#### E14 · `PictogramCategory` 🟦

| Aspecto | Definición |
|---|---|
| **Descripción** | Agrupación temática de pictogramas: dolor, síntomas, necesidades, información médica, respuestas |
| **Responsable** | `admin_institucional` |
| **Relaciones** | `hasMany` Pictogram |

---

#### E15 · `QuickMessage` 🟦

| Aspecto | Definición |
|---|---|
| **Descripción** | Frase de uso frecuente disponible como acceso directo para el paciente |
| **Responsable** | `DECISIÓN PENDIENTE — D-09` |
| **Relaciones** | Catálogo independiente |

> No existe interfaz de administración para estas frases, a diferencia de los
> pictogramas. Debe decidirse si son catálogo administrable o constantes.

---

#### E16 · `VitalSigns` 🟦🟩

| Aspecto | Definición |
|---|---|
| **Descripción** | Registro de parámetros fisiológicos tomados durante la categorización |
| **Responsable** | `categorizacion` |
| **Relaciones** | `belongsTo` MedicalSession, User (quien registra) |

> **Corrección obligatoria.** El autor **DEBE** ser una referencia al usuario
> autenticado. El prototipo guarda una descripción de texto libre del cargo, lo
> que hace el registro no trazable a una persona.

---

#### E17 · `TriageLevel` 🟥

| Aspecto | Definición |
|---|---|
| **Descripción** | Catálogo de niveles de categorización de urgencia (C1 a C5), con nombre, color y descripción clínica |
| **Responsable** | Backend. Catálogo de solo lectura, estable |
| **Relaciones** | Referenciado por TriageRecord |

> **Origen.** Está fijo en el código del frontend. El nombre y el color son
> atributos del **catálogo**, no del registro individual, y así deben modelarse.

---

#### E18 · `TriageRecord` 🟦🟩

| Aspecto | Definición |
|---|---|
| **Descripción** | Categorización de urgencia asignada a una atención, con sus síntomas y fundamento |
| **Responsable** | `categorizacion` |
| **Relaciones** | `belongsTo` MedicalSession, User, TriageLevel |

> **Brecha funcional.** Los síntomas están fijos en el código: no existe control
> de captura. El backend **DEBE** aceptarlos, pero se requiere interfaz
> (`DECISIÓN PENDIENTE — D-10`: ¿lista cerrada o texto libre?).

---

#### E19 · `ClinicalNote` 🟦🟩

| Aspecto | Definición |
|---|---|
| **Descripción** | Registro clínico firmado por el profesional. **Artefacto de mayor peso legal del sistema** |
| **Responsable** | `medico` |
| **Relaciones** | `belongsTo` MedicalSession, User (autor) · autorreferencia para versionado |

> **Reglas vinculantes declaradas por la interfaz:**
> - Se almacena con **resumen criptográfico** del contenido.
> - Una vez **firmada, es inmutable**. Una corrección genera una versión nueva
>   que sustituye a la anterior; la original **NO DEBE** borrarse ni alterarse.
> - La identidad y el cargo del firmante provienen del usuario autenticado.
>
> **Correcciones obligatorias:** el prototipo firma siempre y nunca versiona;
> además un tipo de nota declarado no es seleccionable y las etiquetas de dos
> tipos se muestran incorrectamente.

---

#### E20 · `PatientCall` 🟥

| Aspecto | Definición |
|---|---|
| **Descripción** | Convocatoria dirigida al paciente indicándole a qué ubicación acudir, con acuse de recibo. Sustituye el llamado por voz o pantalla, inaccesible para una persona sorda |
| **Responsable** | `admision`, `categorizacion`, `medico` convocan y cancelan · **el paciente acusa recibo** |
| **Relaciones** | `belongsTo` MedicalSession, Location, User (convocante) |

> **Origen.** En el prototipo es una única cadena de texto global, sin
> identidad, sin historial y sin vínculo con la atención. Es una entidad
> completa: tiene autor, destinatario, momento, acuse y cancelación.
>
> **Requisito de entrega inmediata.** Su valor depende de la inmediatez. Es el
> caso de uso que hace **obligatorio** el canal de tiempo real (§7.11).

---

#### E21 · `InterpreterRequest` 🟥

| Aspecto | Definición |
|---|---|
| **Descripción** | Solicitud de intérprete de lengua de señas y su eventual videollamada de mediación |
| **Responsable** | `medico` |
| **Relaciones** | `belongsTo` MedicalSession, User (solicitante) · intérprete asignado |

> **Origen.** Existe solo como estado efímero de una pantalla, simulado con un
> temporizador. No hay modelo, ni proveedor de video, ni registro.
>
> `DECISIÓN PENDIENTE — D-11`: proveedor de videollamada.
> `DECISIÓN PENDIENTE — D-12`: ¿qué consentimientos exige activar la cámara y la
> videollamada? Existen los tipos, no la regla.

---

#### E22 · `TimelineEvent` 🟦

| Aspecto | Definición |
|---|---|
| **Descripción** | Hito relevante de una atención, presentado cronológicamente al profesional |
| **Responsable** | Backend. **Generada por el sistema, nunca por un usuario** |
| **Relaciones** | `belongsTo` MedicalSession |

> `DECISIÓN PENDIENTE — D-13`: ¿entidad propia o proyección de la bitácora de
> auditoría? Este contrato **recomienda la proyección**, para mantener una sola
> fuente de verdad de los eventos del sistema.

---

#### E23 · `SecuritySetting` 🟥

| Aspecto | Definición |
|---|---|
| **Descripción** | Parámetros de seguridad operativa: minutos de inactividad antes de expirar una atención, e intentos máximos de código de atención |
| **Responsable** | `admin_institucional` |
| **Relaciones** | Depende del ámbito (`DECISIÓN PENDIENTE — D-14`) |

> **Regla vinculante.** Estos valores **DEBEN** consumirse efectivamente. En el
> prototipo el formulario existe pero no afecta a nada.

---

#### E24 · `AuditLog` 🟩

| Aspecto | Definición |
|---|---|
| **Descripción** | Registro inmutable de toda acción relevante: quién, qué, sobre qué, cuándo y desde dónde |
| **Responsable** | Backend, de forma automática. **Ningún rol la crea, modifica ni elimina** |
| **Relaciones** | Referencias opcionales a User, Patient, MedicalSession, Organization, HealthCenter |

> **Reglas vinculantes:** solo escritura y lectura; **nunca** modificación ni
> borrado. Únicamente `admin_institucional` puede consultarla y exportarla, y esa
> consulta **también se audita**. Eventos obligatorios en §19.

---

#### E25 · `ContactMessage` 🟥

| Aspecto | Definición |
|---|---|
| **Descripción** | Consulta enviada desde el formulario público por instituciones interesadas |
| **Responsable** | Público, sin autenticar |
| **Relaciones** | Ninguna. **Fuera del dominio clínico** |

> Requiere límite de frecuencia y protección contra envíos automatizados. **NO
> DEBE** compartir infraestructura de autorización con el dominio clínico.

### 6.4 Resumen de responsables de escritura

| Entidad | Quién escribe |
|---|---|
| Organization, HealthCenter, Unit | Plataforma (fuera de la aplicación) |
| Location, SecuritySetting, Pictogram, PictogramCategory, User | `admin_institucional` |
| **Patient, PatientContact** | **Solo el paciente** |
| TemporaryAccessCode | Backend genera · `admision` consume |
| MedicalSession | `admision` abre · `admision`/`categorizacion` avanzan · `medico` cierra · backend expira |
| Consent | `medico` solicita · **solo el paciente responde** |
| ChatMessage | Los cuatro roles participantes · backend para mensajes de sistema |
| VitalSigns, TriageRecord | `categorizacion` |
| ClinicalNote | `medico` |
| PatientCall | Tres roles clínicos convocan · **paciente acusa recibo** |
| InterpreterRequest | `medico` |
| TimelineEvent, AuditLog | **Solo el backend** |
| TriageLevel, QuickMessage | Catálogo del backend |
| ContactMessage | Público |

---

## 7. Recursos de la API

### 7.1 Cómo leer esta sección

Cada recurso indica endpoint, método, descripción, si exige autenticación y qué
roles lo pueden invocar.

**Reglas transversales aplicables a todos los recursos:**

1. Todo recurso autenticado exige un **Bearer token válido** (§3) en la
   cabecera `Authorization`, tanto en lecturas como en mutaciones.
2. Todo recurso que opere sobre datos clínicos aplica **aislamiento por centro de
   salud**: si el recurso pertenece a otro centro, se responde 404 (§5.7).
3. Todo recurso de **escritura** bajo una sesión médica exige que esa sesión esté
   **activa**; si no, 403 `INACTIVE_SESSION` (§11.3).
4. La columna «Roles» es **exhaustiva**: un rol no listado **NO DEBE** poder
   invocar el recurso, ni siquiera para lectura.
5. Todo recurso de mutación genera **auditoría** (§19).

**Notación de roles:**

| Símbolo | Rol |
|---|---|
| `ADM` | `admin_institucional` |
| `ADI` | `admision` |
| `CAT` | `categorizacion` |
| `MED` | `medico` |
| `PAC` | `paciente` |
| `—` | Público, sin autenticar |

### 7.2 Autenticación

| Endpoint | Método | Descripción | Auth | Roles |
|---|---|---|:---:|---|
| `/login` | `POST` | Inicia sesión de usuario | ❌ | — |
| `/logout` | `POST` | Cierra sesión de usuario | ✅ | Todos |
| `/me` | `GET` | Contexto del usuario autenticado | ✅ | Todos |
| `/forgot-password` | `POST` | Solicita recuperación de credenciales | ❌ | — |
| `/patient/access` | `POST` | Acceso del paciente al portal | ❌ | — |

> `/patient/access` está **bloqueado** por `DECISIÓN PENDIENTE — D-02`. Su
> contrato no puede cerrarse hasta definir el mecanismo de autenticación del
> paciente. **Es el bloqueante de mayor prioridad del proyecto.**

### 7.3 Catálogos

| Endpoint | Método | Descripción | Auth | Roles |
|---|---|---|:---:|---|
| `/organizations` | `GET` | Organizaciones activas (id, name) | ✅ | Cualquier usuario autenticado |
| `/organizations` | `POST` | Crea una organización | ✅ | `super_admin` |
| `/health-centers` | `GET` | Centros activos (id, name, organizationId). Alimenta selectores | ✅ | Cualquier usuario autenticado |
| `/health-centers` | `POST` | Crea un centro de salud | ✅ | `super_admin` |
| `/units` | `GET` | Unidades activas (id, name, healthCenterId). Filtro opcional `?healthCenterId=` | ✅ | Cualquier usuario autenticado |
| `/units` | `POST` | Crea una unidad | ✅ | `super_admin` (cualquier centro) o `admin_institucional` (solo su centro) |
| `/triage-levels` | `GET` | Niveles de categorización C1–C5 | ✅ | CAT, MED |

> **Estado de implementación (v2.1):** los endpoints `GET/POST` de
> `/organizations`, `/health-centers` y `/units` ya están implementados y
> probados. Los `GET` exponen únicamente identificador y nombre (más la
> referencia al padre). Los `POST` de organización y centro son exclusivos de
> `super_admin`; el `POST` de unidad sigue el patrón de doble camino según el
> rol.
>
> **Nota sobre autenticación:** en esta versión los `GET` de catálogos requieren
> token (a diferencia de una versión previa del contrato que los planteaba
> públicos), porque el flujo actual crea usuarios vía panel de administración ya
> autenticado, no un auto-registro público.

### 7.4 Código temporal de atención

| Endpoint | Método | Descripción | Auth | Roles |
|---|---|---|:---:|---|
| `/attention-codes/validate` | `POST` | Valida un código y devuelve los datos del paciente | ✅ | ADI |
| `/attention-codes/{id}/consume` | `POST` | Consume el código y abre la sesión médica | ✅ | ADI |
| `/patients/{id}/attention-codes` | `POST` | Genera un código nuevo | ✅ | `DECISIÓN PENDIENTE — D-15` |

> **D-15.** La interfaz describe la entrega del código en ventanilla pero **no
> existe pantalla que lo genere**. Debe definirse si lo genera `admision`, si lo
> solicita el paciente desde su aplicación, o ambos.
>
> **Regla vinculante.** La validación **NO DEBE** abrir la sesión médica. Son dos
> pasos deliberadamente separados: entre ambos, el funcionario revisa la ficha y
> confirma la identidad del paciente presente.

### 7.5 Paciente

| Endpoint | Método | Descripción | Auth | Roles |
|---|---|---|:---:|---|
| `/patients/{id}` | `GET` | Ficha completa | ✅ | ADI, CAT, MED |
| `/patients/{id}/contacts` | `GET` | Contactos de emergencia | ✅ | MED |
| `/patient/me` | `GET` | Ficha propia | ✅ | PAC |

> **Regla vinculante.** **No existe ningún recurso de escritura sobre `Patient`
> accesible a roles clínicos** (E07). Cualquier propuesta futura de añadirlo
> requiere modificar este contrato de forma explícita.
>
> El acceso de roles clínicos a `/patients/{id}` **DEBE** estar condicionado a
> una sesión médica activa con ese paciente, o a una validación de código
> reciente. **NO DEBE** permitirse la consulta libre del padrón.

### 7.6 Sesión médica

| Endpoint | Método | Descripción | Auth | Roles |
|---|---|---|:---:|---|
| `/medical-sessions` | `POST` | Abre una atención | ✅ | ADI |
| `/medical-sessions/{id}` | `GET` | Detalle de la atención | ✅ | ADI, CAT, MED |
| `/medical-sessions/active` | `GET` | Atención activa del centro y unidad | ✅ | ADI, CAT, MED |
| `/medical-sessions/{id}/stage` | `PATCH` | Avanza de etapa | ✅ | ADI, CAT |
| `/medical-sessions/{id}/close` | `POST` | Cierra la atención | ✅ | MED |
| `/medical-sessions/{id}/timeline` | `GET` | Línea de tiempo | ✅ | MED |
| `/patient/session` | `GET` | Atención propia en curso | ✅ | PAC |

> **`admin_institucional` está deliberadamente ausente de toda esta sección.** El
> borrador de autorización de la auditoría lo niega de forma explícita y la
> interfaz de administración no recibe ningún dato clínico. El administrador
> gestiona la plataforma; **no accede a información clínica de pacientes**.
>
> `DECISIÓN PENDIENTE — D-16`: el borrador de autorización permite a
> `categorizacion` cerrar atenciones, pero la interfaz solo ofrece ese control al
> médico. Este contrato adopta **la versión restrictiva** (solo `MED`) hasta que
> se ratifique lo contrario.

### 7.7 Datos clínicos

| Endpoint | Método | Descripción | Auth | Roles |
|---|---|---|:---:|---|
| `/medical-sessions/{id}/vital-signs` | `GET` | Historial de signos vitales | ✅ | CAT, MED |
| `/medical-sessions/{id}/vital-signs` | `POST` | Registra signos vitales | ✅ | CAT |
| `/medical-sessions/{id}/triage` | `GET` | Categorización asignada | ✅ | CAT, MED |
| `/medical-sessions/{id}/triage` | `POST` | Confirma la categorización | ✅ | CAT |
| `/medical-sessions/{id}/clinical-notes` | `GET` | Notas clínicas | ✅ | MED |
| `/medical-sessions/{id}/clinical-notes` | `POST` | Crea o firma una nota | ✅ | MED |
| `/clinical-notes/{id}` | `PUT` | Nueva versión de una nota firmada | ✅ | MED |

> **Segregación estricta.** El paciente **no accede** a sus signos vitales, su
> categorización ni sus notas clínicas a través de esta plataforma. Es el
> comportamiento observado y este contrato lo mantiene: SEÑAVIDA es una
> herramienta de **comunicación**, no un portal de resultados clínicos. Cambiarlo
> es una decisión de producto, no un ajuste técnico.

### 7.8 Comunicación

| Endpoint | Método | Descripción | Auth | Roles |
|---|---|---|:---:|---|
| `/medical-sessions/{id}/messages` | `GET` | Historial de mensajes | ✅ | ADI, CAT, MED, PAC |
| `/medical-sessions/{id}/messages` | `POST` | Envía un mensaje | ✅ | ADI, CAT, MED, PAC |
| `/messages/{id}/confirm` | `POST` | El paciente confirma un mensaje | ✅ | PAC |
| `/messages/{id}/read` | `POST` | Marca como leído | ✅ | ADI, CAT, MED, PAC |
| `/medical-sessions/{id}/consents` | `GET` | Consentimientos de la atención | ✅ | MED, PAC |
| `/medical-sessions/{id}/consent-requests` | `POST` | Solicita un consentimiento | ✅ | MED |
| `/consent-requests/{id}/approve` | `POST` | Otorga | ✅ | **PAC** |
| `/consent-requests/{id}/reject` | `POST` | Rechaza | ✅ | **PAC** |
| `/consent-requests/{id}/revoke` | `POST` | Revoca uno ya otorgado | ✅ | **PAC** |
| `/medical-sessions/{id}/calls` | `POST` | Convoca al paciente | ✅ | ADI, CAT, MED |
| `/calls/{id}/acknowledge` | `POST` | Acusa recibo de la convocatoria | ✅ | **PAC** |
| `/calls/{id}` | `DELETE` | Cancela la convocatoria | ✅ | ADI, CAT, MED |
| `/medical-sessions/{id}/interpreter-requests` | `POST` | Solicita intérprete | ✅ | MED |
| `/interpreter-requests/{id}` | `GET` | Estado de la solicitud | ✅ | MED |
| `/interpreter-requests/{id}/connect` | `POST` | Obtiene acceso a la videollamada | ✅ | MED, PAC |
| `/interpreter-requests/{id}/end` | `POST` | Finaliza la videollamada | ✅ | MED |

> **Regla vinculante — exclusividad del paciente.** Los cuatro recursos marcados
> en negrita son **exclusivos del paciente**. Ningún rol clínico, ni siquiera el
> administrador, **DEBE** poder invocarlos. Responder un consentimiento en nombre
> del paciente vulnera el principio de autonomía sobre el que se construye el
> producto.
>
> `/consent-requests/{id}/revoke` no tiene interfaz asociada, pero la bitácora de
> auditoría del prototipo incluye la revocación como evento crítico. Se declara
> aquí para que el modelo lo contemple (`DECISIÓN PENDIENTE — D-17`: diseñar el
> flujo de revocación posterior).

### 7.9 Administración

| Endpoint | Método | Descripción | Auth | Roles |
|---|---|---|:---:|---|
| `/pictograms` | `GET` | Lista de pictogramas | ✅ | ADM, PAC |
| `/pictograms` | `POST` | Crea un pictograma | ✅ | ADM |
| `/pictograms/{id}` | `PATCH` | Actualiza o habilita | ✅ | ADM |
| `/pictograms/{id}` | `DELETE` | Elimina | ✅ | ADM |
| `/pictogram-categories` | `GET` | Categorías | ✅ | ADM, PAC |
| `/quick-messages` | `GET` | Mensajes rápidos | ✅ | PAC |
| `/audit-logs` | `GET` | Bitácora de auditoría | ✅ | ADM |
| `/audit-logs/export` | `POST` | Exportación firmada | ✅ | ADM |
| `/security-settings` | `GET` | Parámetros de seguridad | ✅ | ADM |
| `/security-settings` | `PUT` | Actualiza parámetros | ✅ | ADM |
| `/users` | `GET` | Lista de funcionarios | ✅ | ADM |
| `/users` | `POST` | Crea un funcionario | ✅ | `super_admin` (cualquier centro) o `admin_institucional` (solo su centro) |
| `/users/{id}` | `PATCH` | Actualiza o desactiva | ✅ | ADM |
| `/admin/stats` | `GET` | Métricas del panel | ✅ | ADM |

> **Estado de implementación (v2.1):** `POST /users` ya está implementado y
> probado. Exige `name`, `email`, `password` + `password_confirmation` (regla
> `confirmed`), `role`, `organizationId`, `healthCenterId`, `unitId`. La
> contraseña se cifra automáticamente (bcrypt). Un `admin_institucional` solo
> puede crear usuarios en su propio centro; un `super_admin` en cualquiera. La
> respuesta nunca incluye la contraseña. Los demás recursos de esta tabla
> (`GET /users`, `PATCH`, pictogramas, auditoría, etc.) siguen pendientes.
>
> Los recursos de usuarios **no tienen interfaz** en el frontend auditado, pero
> son requisito declarado del producto (E05). El equipo de frontend **DEBE**
> construir esa pantalla; el de backend, estos recursos.
>
> `/pictograms` y `/pictogram-categories` son accesibles al paciente porque
> alimentan su tablero de comunicación. Para él, la respuesta **DEBE** incluir
> únicamente los habilitados.

### 7.10 Público

| Endpoint | Método | Descripción | Auth | Roles |
|---|---|---|:---:|---|
| `/pictograms/public` | `GET` | Catálogo demostrativo | ❌ | — |
| `/contact` | `POST` | Formulario de contacto | ❌ | — |

> `/pictograms/public` **DEBE** devolver solo pictogramas habilitados y **NO
> DEBE** exponer metadatos administrativos.
>
> Ambos exigen límite de frecuencia por dirección IP (§13.5).

### 7.11 Tiempo real

**Requisito de arquitectura, no opcional.**

El frontend auditado mantiene todo el estado compartido en memoria, por lo que
las actualizaciones entre participantes son instantáneas «gratis». Con un backend
real esa propiedad desaparece y **varios flujos dejan de funcionar**:

- El médico solicita un consentimiento y el paciente **no lo ve** hasta recargar.
- El paciente responde y el médico **no se entera**.
- Se convoca al paciente y el aviso **no llega**, anulando el propósito del
  producto para una persona que no puede oír un llamado por voz.

| Canal | Alcance | Suscriptores |
|---|---|---|
| `medical-session.{id}` | Mensajes, cambios de etapa, cierre, registros clínicos | ADI, CAT, MED, PAC |
| `medical-session.{id}.patient` | Convocatorias, solicitudes de consentimiento | PAC |
| `medical-session.{id}.staff` | Respuestas de consentimiento, acuses, asignación de intérprete | ADI, CAT, MED |

**Reglas vinculantes:**

1. Todos los canales son **privados**. La autorización usa las mismas reglas que
   la lectura del recurso equivalente.
2. Los eventos **NO DEBEN** transportar más datos de los que el suscriptor podría
   obtener por vía HTTP. La segregación por rol (§12.3) también aplica aquí.
3. El frontend **DEBE** tolerar la pérdida de eventos y reconciliar mediante
   recarga. El tiempo real es una optimización de latencia, **no** la fuente de
   verdad.
4. **Alternativa admitida para una primera entrega:** consulta periódica cada
   pocos segundos. Es aceptable para el chat, pero **degrada de forma
   inaceptable** la convocatoria del paciente, que debe ser inmediata.

---

## 8. Requests esperados

### 8.1 Reglas generales

| Regla | Detalle |
|---|---|
| Formato | JSON en el cuerpo, salvo subida de archivos (§8.10) |
| Claves | `camelCase` (§2.3) |
| Campos desconocidos | El backend **DEBE ignorarlos**, no fallar |
| Campos de identidad | El backend **DEBE ignorarlos** si el cliente los envía (§1.3) |
| Cadenas vacías | Se tratan como `null` en campos opcionales |
| Recorte de espacios | El backend **DEBE** recortar espacios al inicio y final de todo texto antes de validar |
| Nulos | Enviar `null` es distinto de omitir el campo: `null` limpia el valor, omitir lo deja sin cambios en actualizaciones parciales |

**Campos que el cliente NUNCA envía.** El backend los deriva y **DEBE
ignorarlos** si aparecen en el payload:

```
userId · role · senderType · senderId · senderName · origin
recordedBy · authorId · authorName · authorRole · calledBy · requestedBy
createdBy · closedBy · organizationId · healthCenterId · unitId
status (de mensajes) · createdAt · updatedAt · signedAt · version
ipAddress · userAgent
```

### 8.2 Autenticación

**`POST /login`**

| Campo | Tipo | Req. | Restricciones |
|---|---|:---:|---|
| `email` | string | ✅ | Formato de correo, máx. 255 |
| `password` | string | ✅ | Mín. 8 |
| `healthCenterId` | UUID | ✅ | Debe existir y estar activo |
| `unitId` | UUID | ✅ | Debe existir, estar activa y pertenecer al centro |

**`POST /forgot-password`**

| Campo | Tipo | Req. | Restricciones |
|---|---|:---:|---|
| `email` | string | ✅ | Formato de correo |

> **Regla de seguridad.** La respuesta **DEBE** ser idéntica exista o no la
> cuenta, para no permitir enumeración de usuarios.

### 8.3 Código de atención

**`POST /attention-codes/validate`**

| Campo | Tipo | Req. | Restricciones |
|---|---|:---:|---|
| `code` | string | ✅ | Patrón `SV-` seguido de 6 dígitos. Comparación insensible a mayúsculas |

> El patrón se deriva de los ejemplos observados. `DECISIÓN PENDIENTE — D-18`:
> confirmar longitud y alfabeto definitivos, y si el prefijo varía por
> establecimiento.

**`POST /attention-codes/{id}/consume`** — sin cuerpo.

### 8.4 Sesión médica

**`POST /medical-sessions`**

| Campo | Tipo | Req. | Restricciones |
|---|---|:---:|---|
| `accessCodeId` | UUID | ✅ | Código validado, vigente y no consumido |
| `communicationPreference` | string | ❌ | Máx. 255. Por defecto, la del paciente |
| `reasonOfVisit` | string | ❌ | Máx. 1000 |

> **Regla vinculante.** Las alergias **NO DEBEN** enviarse desde el cliente. El
> prototipo permite al funcionario editarlas en un campo de texto libre, lo que
> contradice la regla de que la ficha del paciente no es editable por el personal
> (E07). Se toman siempre de la ficha del paciente.
>
> `DECISIÓN PENDIENTE — D-19`: ¿el motivo de consulta pertenece al paciente
> (declarado en su aplicación) o a la atención (capturado en ventanilla)? Este
> contrato lo ubica en la atención, por variar en cada visita.

**`PATCH /medical-sessions/{id}/stage`**

| Campo | Tipo | Req. | Restricciones |
|---|---|:---:|---|
| `stage` | enum | ✅ | Transición válida desde la etapa actual (§11.2) |

**`POST /medical-sessions/{id}/close`**

| Campo | Tipo | Req. | Restricciones |
|---|---|:---:|---|
| `closureReason` | enum | ✅ | Uno de los tres valores de §11.4 |
| `summary` | string | ✅ | Mín. 10, máx. 5000 |

> El resumen es **obligatorio** en este contrato aunque el prototipo no lo exija:
> es el resumen de egreso que se entrega al paciente.

### 8.5 Signos vitales

**`POST /medical-sessions/{id}/vital-signs`**

| Campo | Tipo | Req. | Restricciones |
|---|---|:---:|---|
| `systolicPressure` | integer | ✅ | 40–300 mmHg *(propuesto)* |
| `diastolicPressure` | integer | ✅ | 20–200 mmHg, menor que la sistólica *(propuesto)* |
| `temperature` | decimal | ✅ | **30–45 °C**, un decimal |
| `oxygenSaturation` | integer | ✅ | **0–100 %** |
| `heartRate` | integer | ✅ | **20–250 lpm** |
| `respiratoryRate` | integer | ✅ | 4–80 rpm *(propuesto)* |
| `painLevel` | integer | ✅ | **0–10** |
| `measuredAt` | datetime | ❌ | No futuro. Por defecto, el momento de recepción |
| `notes` | string | ❌ | Máx. 1000 |

> Los rangos en negrita son **OBSERVADOS**: el frontend ya los aplica. Los
> marcados como propuestos **no tienen validación alguna** hoy y requieren
> ratificación clínica (`DECISIÓN PENDIENTE — D-20`).
>
> **Regla vinculante.** `measuredAt` **NO DEBE** aceptarse a ciegas del cliente:
> el reloj del navegador no es confiable. Si se acepta, **DEBE** validarse contra
> el reloj del servidor con una tolerancia acotada.

### 8.6 Categorización

**`POST /medical-sessions/{id}/triage`**

| Campo | Tipo | Req. | Restricciones |
|---|---|:---:|---|
| `triageLevel` | enum | ✅ | `C1`–`C5` |
| `symptoms` | array de string | ❌ | Cada elemento máx. 100; máx. 20 elementos |
| `observations` | string | ✅ | Mín. 10, máx. 2000 |

> El nombre del nivel y su color **NO DEBEN** enviarse: se resuelven desde el
> catálogo (E17).
>
> `observations` es **obligatorio** en este contrato: es el fundamento clínico de
> la categorización, que la interfaz rotula como tal pero no exige.

### 8.7 Nota clínica

**`POST /medical-sessions/{id}/clinical-notes`**

| Campo | Tipo | Req. | Restricciones |
|---|---|:---:|---|
| `noteType` | enum | ✅ | Los seis valores de §2.3 |
| `content` | string | ✅ | Mín. 3, máx. 10000 |
| `status` | enum | ❌ | `draft` o `signed`. Por defecto `signed` |

**`PUT /clinical-notes/{id}`** — solo para versionar una nota firmada.

| Campo | Tipo | Req. | Restricciones |
|---|---|:---:|---|
| `content` | string | ✅ | Mín. 3, máx. 10000 |
| `supersedesId` | UUID | ✅ | Nota firmada previa, de la misma atención |

> Una nota firmada **NO DEBE** modificarse. Este recurso crea una versión nueva
> que sustituye a la anterior sin borrarla (E19).

### 8.8 Comunicación

**`POST /medical-sessions/{id}/messages`**

| Campo | Tipo | Req. | Restricciones |
|---|---|:---:|---|
| `body` | string | ✅ | Mín. 1 tras recortar, máx. 2000 |
| `messageType` | enum | ✅ | Todos salvo `system`, reservado al backend |
| `pictogramId` | UUID | ⚠️ | Obligatorio si `messageType` es `pictogram`. Debe existir y estar habilitado |
| `confidence` | decimal | ⚠️ | Obligatorio si `messageType` es `gesture_prediction`. Entre 0 y 1 |

> **Regla vinculante.** El cliente **NO DEBE** enviar `messageType: "system"`. Los
> mensajes de sistema los genera exclusivamente el backend como efecto secundario
> de otras operaciones (§4.5).

**`POST /medical-sessions/{id}/consent-requests`**

| Campo | Tipo | Req. | Restricciones |
|---|---|:---:|---|
| `consentType` | enum | ✅ | Uno de los once tipos de §2.3 |
| `contactId` | UUID | ⚠️ | Obligatorio si el tipo es `share_with_contacts`. Contacto del paciente de la atención |

> **Corrección obligatoria.** El vínculo con el contacto es **estructurado**. El
> prototipo lo infiere del texto del título, lo que puede autorizar el envío a la
> persona equivocada (E11).
>
> Según se resuelva `D-08`, el título y la descripción se generan en el servidor
> desde plantillas (recomendado) o se envían desde el cliente.

**`POST /medical-sessions/{id}/calls`**

| Campo | Tipo | Req. | Restricciones |
|---|---|:---:|---|
| `locationId` | UUID | ✅ | Ubicación de la unidad de la atención |

**Recursos sin cuerpo:** aprobar, rechazar y revocar consentimiento; acusar
recibo de convocatoria; confirmar y marcar mensaje como leído; solicitar,
conectar y finalizar intérprete.

### 8.9 Administración

**`POST /pictograms` · `PATCH /pictograms/{id}`**

| Campo | Tipo | Req. | Restricciones |
|---|---|:---:|---|
| `categoryId` | UUID | ✅ | Categoría existente |
| `title` | string | ✅ | Máx. 100 |
| `phrase` | string | ✅ | Máx. 255. Es lo que se envía al chat |
| `speechText` | string | ✅ | Máx. 255. Es lo que se sintetiza en voz |
| `emoji` | string | ✅ | 1–2 caracteres visuales Unicode |
| `severity` | enum | ❌ | `critical`, `warning`, `info`, `neutral`. Por defecto `neutral` |
| `isActive` | boolean | ❌ | Por defecto `true` |
| `sortOrder` | integer | ❌ | Por defecto, al final |

> `emoji` es **obligatorio**: sin él, todo pictograma nuevo aparecería con un
> símbolo genérico (E13). `severity` sustituye a las clases de estilo.

**`PUT /security-settings`**

| Campo | Tipo | Req. | Restricciones |
|---|---|:---:|---|
| `sessionTimeoutMinutes` | integer | ✅ | **5–240** |
| `ctaMaxAttempts` | integer | ✅ | `0`, `3` o `5`. `0` significa sin bloqueo |

> El prototipo no acota el primer campo, aceptando cero y negativos. El rango es
> obligatorio.

**`POST /users` · `PATCH /users/{id}`**

| Campo | Tipo | Req. | Restricciones |
|---|---|:---:|---|
| `name` | string | ✅ | Máx. 255 |
| `email` | string | ✅ | Correo válido, único |
| `role` | enum | ✅ | Los cinco roles. `DECISIÓN PENDIENTE — D-06` si se admiten varios |
| `healthCenterId` | UUID | ✅ | Establecimiento existente |
| `unitId` | UUID | ❌ | Unidad del establecimiento |
| `isActive` | boolean | ❌ | Por defecto `true` |

**`POST /contact`** *(público)*

| Campo | Tipo | Req. | Restricciones |
|---|---|:---:|---|
| `name` | string | ✅ | Máx. 255 |
| `email` | string | ✅ | Correo válido |
| `institution` | string | ✅ | Máx. 255 |
| `message` | string | ✅ | Mín. 10, máx. 5000 |

### 8.10 Subida de archivos

`DECISIÓN PENDIENTE — D-21`

La pizarra de dibujo del portal del paciente **nunca envía el dibujo**: transmite
un texto de marcador y borra el lienzo. La funcionalidad, tal como está, no
cumple su propósito para una persona que puede no leer español con fluidez.

Contrato **PROPUESTO** cuando se implemente:

| Aspecto | Regla |
|---|---|
| Codificación | `multipart/form-data` |
| Campo | `image` |
| Formatos | PNG, JPEG |
| Tamaño máximo | 5 MB |
| Tipo de mensaje | Valor nuevo del enum, `DECISIÓN PENDIENTE — D-22` |
| Validación | Verificar el contenido real, no la extensión ni el tipo declarado |
| Almacenamiento | Fuera de la raíz web, servido mediante recurso autorizado |
| Retención | Sujeta a la política de datos clínicos (§13.4) |

---

## 9. Responses esperadas

### 9.1 Reglas generales

Toda respuesta sigue una de las tres formas de §4. Además:

| Regla | Detalle |
|---|---|
| Ausencia de valor | `null` explícito. **NUNCA** omitir la clave ni enviar `""` |
| Colecciones vacías | `[]`. **NUNCA** `null` |
| Relaciones | Objeto anidado con lo mínimo necesario, no solo el identificador |
| Campos calculados | Se incluyen resueltos, no se derivan en el cliente |
| Datos fuera del alcance del rol | **Se omiten por completo**, no se envían vacíos (§12.3) |

**Principio de enriquecimiento.** Cuando el frontend necesite un dato derivado
para renderizar, el backend **DEBE** entregarlo resuelto. Esto elimina
correspondencias fijas en el cliente que se desactualizan. Casos obligatorios:

| Campo enriquecido | Sustituye a |
|---|---|
| `roleLabel` | Correspondencia de etiquetas en el cliente |
| `healthCenterName`, `unitName` | Nombres retenidos del acceso |
| `triageLevelName`, `colorHex` | Catálogo fijo en el cliente |
| `noteTypeLabel` | Correspondencia incompleta que hoy rotula mal dos tipos |
| `pictogram.emoji` | Correspondencia fija de 24 casos |
| `ctaCode` | Valor literal repetido en cinco pantallas |
| `allergies` | Texto literal en tres pantallas |
| `isWritable` | Nada — hoy no existe forma de saber si la atención admite escritura |
| `speechText` de la convocatoria | Plantilla duplicada en el cliente |

### 9.2 Contexto de usuario

`GET /api/v1/auth/me` — contexto del usuario autenticado (respuesta JSON):

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "9d3f7a12-4c8b-4e21-9f0a-2b7c1d5e8a34",
      "name": "Natalia Orellana",
      "email": "n.orellana@hospitalvillarrica.cl",
      "role": "admision",
      "roleLabel": "Admisión / Ventanilla",
      "isActive": true,
      "organizationId": "…",
      "healthCenterId": "…",
      "healthCenterName": "Hospital Regional de Villarrica",
      "unitId": "…",
      "unitName": "Servicio de Urgencia Adulto"
    },
    "permissions": ["cta.validate", "session.create", "session.advance", "message.send", "call.create"],
    "session": { "expiresAt": "2026-07-12T13:20:00Z" }
  }
}
```

### 9.3 Sesión médica

Es el recurso maestro que alimenta todo el escritorio clínico:

```json
{
  "status": "success",
  "data": {
    "id": "…",
    "ctaCode": "SV-847291",
    "status": "active",
    "currentStage": "categorizacion",
    "isWritable": true,
    "startedAt": "2026-07-12T11:00:00Z",
    "endedAt": null,
    "closureReason": null,
    "summary": null,
    "patient": {
      "id": "…",
      "name": "Ana María Torres",
      "age": 28,
      "communicationPreference": "LSCh y texto escrito",
      "allergies": ["Penicilina", "Lactosa"]
    },
    "healthCenterId": "…",
    "healthCenterName": "Hospital Regional de Villarrica",
    "unitId": "…",
    "unitName": "Servicio de Urgencia Adulto",
    "createdBy": { "id": "…", "name": "María José" },
    "closedBy": null,
    "activeCall": {
      "id": "…",
      "locationLabel": "Sala de Categorización (Box A)",
      "calledAt": "2026-07-12T11:20:00Z",
      "acknowledgedAt": null
    },
    "interpreterRequest": null
  }
}
```

**Campos de contrato que resuelven deuda del prototipo:**

| Campo | Resuelve |
|---|---|
| `ctaCode` | Valor fijo en cinco pantallas por no entregarlo el modelo |
| `patient.allergies` | Texto literal en tres pantallas |
| `isWritable` | Permite deshabilitar los campos de escritura al cerrar la atención |
| `activeCall` | Sustituye una cadena global sin identidad |
| `healthCenterName`, `unitName` | Evita depender de lo retenido en el acceso |

> **Uso obligatorio de `isWritable`.** El frontend **DEBE** deshabilitar todo
> control de escritura cuando sea `false`. El prototipo declara al usuario que el
> chat queda bloqueado al cerrar la atención, pero el campo de escritura sigue
> operativo.

### 9.4 Mensajes

```json
{
  "status": "success",
  "data": [
    {
      "id": "…",
      "sessionId": "…",
      "senderType": "patient",
      "senderId": "…",
      "senderName": "Ana María Torres",
      "messageType": "pictogram",
      "body": "Me duele mucho la cabeza y tengo náuseas",
      "origin": "patient",
      "status": "read",
      "sentAt": "2026-07-12T11:02:10Z",
      "confirmedByPatientAt": "2026-07-12T11:02:05Z",
      "confidence": null,
      "pictogramId": "…",
      "pictogram": { "id": "…", "title": "Dolor de cabeza", "emoji": "🤕" }
    }
  ],
  "meta": {
    "pagination": { "perPage": 50, "nextCursor": "eyJpZCI6…", "hasMore": true }
  }
}
```

### 9.5 Metadatos

`meta` es opcional y **DEBE** usarse solo para estas claves:

| Clave | Cuándo | Contenido |
|---|---|---|
| `pagination` | Colecciones paginadas | §14 |
| `filters` | Colecciones filtrables | Filtros aplicados y disponibles |
| `sort` | Colecciones ordenables | Ordenamiento aplicado |
| `total` | Agregados | Totales de la consulta |

**Regla vinculante.** `meta` **NO DEBE** contener datos de dominio. Todo lo que
el usuario ve va en `data`.

### 9.6 Mensajes al usuario

| Origen | Regla |
|---|---|
| Errores de validación | En `errors`, por campo (§4.6) |
| Errores generales | En `message` (§4.7) |
| Confirmaciones de éxito | Mediante mensajería efímera del framework, **no** dentro de `data` |
| Textos de dominio | En `data` cuando sean contenido (descripción de consentimiento, texto de convocatoria) |

**Requisitos de redacción.** Todo mensaje dirigido al usuario **DEBE** estar en
español de Chile, ser accionable, no contener jerga técnica ni nombres de
columna, y **no** incluir datos clínicos identificables (§13.6).

Sustitución obligatoria de textos del prototipo:

| Texto actual | Texto de contrato |
|---|---|
| *«Código inválido. Escribe "SV-847291" para simular el caso de demostración.»* | *«El código ingresado no existe, expiró o está bloqueado.»* |
| *«Demostración: Enlace de recuperación simulado.»* | *«Si el correo está registrado, recibirás instrucciones para recuperar tu acceso.»* |
| *«Parámetros de red guardados en la base de datos de simulación.»* | *«Configuración guardada correctamente.»* |

---

## 10. Validaciones

### 10.1 Principio

**Toda validación de este contrato es responsabilidad del backend**, sin
excepción. El frontend PUEDE replicarlas para dar respuesta inmediata, pero esa
réplica **no libera** al backend de ejecutarlas.

Hoy **no existe ninguna validación de servidor**, porque no existe servidor. Las
que el frontend aplica se ejecutan en el navegador y pueden eludirse por completo.

### 10.2 Orden de evaluación

El backend **DEBE** validar en este orden, deteniéndose en el primer fallo de
cada nivel:

```
1. Formato de la petición          → 400
2. Autenticación                   → 401
3. Autenticación por Bearer token → 401
4. Límite de frecuencia            → 429
5. Autorización por rol            → 403
6. Aislamiento por centro          → 404
7. Existencia del recurso          → 404
8. Estado del recurso              → 403 / 409
9. Validación de campos            → 422  ← todos los errores juntos
10. Reglas de negocio              → 409 / 422
```

**Regla vinculante.** En el nivel 9 el backend **DEBE** devolver **todos** los
errores de campo simultáneamente, no el primero. Los niveles 1 a 8 se detienen en
el primer fallo.

### 10.3 Validaciones observadas

Ya existen en el frontend. El backend **DEBE** replicarlas.

| Campo | Regla | Mensaje de contrato |
|---|---|---|
| Temperatura | 30–45 °C | «La temperatura debe estar entre 30 y 45 °C.» |
| Saturación de oxígeno | 0–100 % | «La saturación de oxígeno debe estar entre 0 y 100 %.» |
| Frecuencia cardíaca | 20–250 lpm | «La frecuencia cardíaca debe estar entre 20 y 250 lpm.» |
| Nivel de dolor | 0–10 | «El nivel de dolor debe estar entre 0 y 10.» |
| Contenido de nota clínica | No vacío | «El contenido de la nota es obligatorio.» |
| Cuerpo del mensaje | No vacío tras recortar | «El mensaje no puede estar vacío.» |
| Correo y contraseña de acceso | No vacíos | «Ingresa tu correo institucional y contraseña.» |
| Nivel de categorización | `C1`–`C5` | «Selecciona un nivel de categorización válido.» |
| Formulario de contacto | Cuatro campos obligatorios | Por campo |

### 10.4 Validaciones que el backend debe añadir

**No existen** en el frontend y son exigibles.

#### Autenticación e identidad

| Validación | Código |
|---|---|
| La contraseña coincide | 422 |
| El usuario está activo | 403 `USER_INACTIVE` |
| El usuario pertenece al centro y unidad indicados | 403 `FORBIDDEN_CENTER` |
| Límite de intentos de acceso | 429 |

#### Código de atención

| Validación | Código |
|---|---|
| Formato del código | 422 |
| El código existe | 422 `INVALID_CODE` |
| No ha vencido | 410 `EXPIRED_CODE` |
| No fue consumido | 409 `CODE_ALREADY_CONSUMED` |
| No está bloqueado por intentos | 403 `BLOCKED_CODE` |
| Corresponde al centro del funcionario | 403 `FORBIDDEN_CENTER` |

#### Sesión médica

| Validación | Código |
|---|---|
| La sesión existe y es del centro del usuario | 404 |
| La sesión admite escritura | 403 `INACTIVE_SESSION` |
| La transición de etapa es válida | 409 `INVALID_STAGE_TRANSITION` |
| No hay otra atención activa para el mismo paciente | 409 |
| Motivo de cierre dentro del enum | 422 |
| Resumen de egreso presente | 422 |

#### Datos clínicos

| Validación | Código |
|---|---|
| Rangos de presión y frecuencia respiratoria | 422 |
| La diastólica es menor que la sistólica | 422 |
| La medición no es futura | 422 |
| Fundamento de categorización presente | 422 |
| Tipo de nota dentro del enum | 422 |
| La nota firmada no se modifica | 409 `NOTE_IMMUTABLE` |
| La nota sustituida existe y es de la misma atención | 422 |

#### Comunicación

| Validación | Código |
|---|---|
| Longitud del mensaje | 422 |
| Tipo de mensaje válido y distinto de sistema | 422 |
| Pictograma presente y habilitado si el tipo lo requiere | 422 |
| Confianza presente y entre 0 y 1 si el tipo lo requiere | 422 |
| El contacto pertenece al paciente de la atención | 422 |
| El consentimiento no fue respondido antes | 409 `CONSENT_ALREADY_ANSWERED` |
| Solo el paciente titular responde | 403 `FORBIDDEN_ROLE` |
| La ubicación pertenece a la unidad de la atención | 422 |
| No hay otra solicitud de intérprete activa | 409 |

#### Administración

| Validación | Código |
|---|---|
| Minutos de inactividad entre 5 y 240 | 422 |
| Intentos máximos dentro del enum | 422 |
| Correo de funcionario único | 422 |
| El emoji del pictograma es un carácter visual válido | 422 |
| La categoría del pictograma existe | 422 |

### 10.5 Saneamiento

| Regla | Detalle |
|---|---|
| Recorte | Todo texto se recorta antes de validar y persistir |
| Normalización | Texto a forma NFC |
| Escapado | Los datos se almacenan tal cual; el escapado ocurre al presentar |
| Marcado enriquecido | **No se acepta** en ningún campo de texto |
| Longitudes | En caracteres Unicode, no en bytes |
| Nulos frente a vacíos | La cadena vacía se convierte a `null` en campos opcionales |

### 10.6 Validaciones que no puede hacer el backend

Corresponden al frontend y se documentan para delimitar responsabilidades:

| Validación | Responsable |
|---|---|
| Que el paciente esté presente al validar el código | Procedimiento humano |
| Que la traducción de señas sea correcta | Confirmación del paciente antes de enviar |
| Que los signos vitales reflejen la medición real | Profesional que registra |
| Coherencia clínica entre categorización y signos vitales | Criterio profesional. **El backend NO DEBE bloquearla** |

> **Regla vinculante.** El backend **NO DEBE** rechazar una categorización por
> considerarla incoherente con los signos vitales. Existen situaciones clínicas
> legítimas donde divergen, y bloquearlas pondría en riesgo la atención.

---

## 11. Reglas de negocio

### 11.1 Clasificación

| Categoría | Definición | Quién la hace cumplir |
|---|---|---|
| **A — Implementada en el frontend** | Funciona hoy en el navegador | El backend **DEBE replicarla**. Es eludible tal como está |
| **B — Simulada** | Aparenta funcionar pero no tiene efecto real | El backend **DEBE implementarla** desde cero |
| **C — Declarada** | La interfaz la promete en texto visible, sin implementarla | El backend **DEBE implementarla**. Es una promesa vinculante al usuario |
| **D — Responsabilidad exclusiva del backend** | Nunca existió en el frontend | El backend **DEBE crearla** |

### 11.2 Ciclo de vida de la atención

**Etapas** — categoría **A**:

```
admision → categorizacion → consulta_medica → cerrado
```

| Regla | Categoría | Detalle |
|---|---|---|
| La atención se abre en `admision` | A | |
| `admision` deriva a `categorizacion` | A | |
| `categorizacion` deriva a `consulta_medica` | A | |
| Solo `medico` cierra | A | Ver `D-16` |
| Cada avance genera un mensaje de sistema | A | *«Paciente derivada a sala de {etapa}.»* |
| No se retrocede de etapa | **D** | El frontend no lo impide |
| No hay dos atenciones activas por paciente | **D** | El frontend no lo verifica |
| Avanzar sin categorización | A (advertencia) | Avisa pero **permite avanzar** |

> **Regla vinculante sobre el último punto.** El backend **DEBE** permitir el
> avance sin categorización previa, marcando la atención y auditando el hecho.
> Existen situaciones de riesgo vital donde omitir la categorización formal es lo
> clínicamente correcto. Bloquearlo sería peligroso. Ratificar en `D-23`.

**Estados** — categoría **A parcial**: el frontend declara nueve estados pero
solo produce tres. El backend **DEBE** implementar la máquina completa o reducir
el enum (`D-07`).

### 11.3 Cierre de la atención — categoría C 🔴

La interfaz declara al usuario, textualmente:

> *«Al cerrar la sesión, el chat quedará bloqueado de forma permanente, el código
> de acceso temporal expirará y se emitirá el resumen al paciente sordo.»*

**Ninguna de las tres cosas ocurre.** Tras cerrar, el campo de escritura sigue
operativo y pueden enviarse mensajes. Es la brecha más grave entre lo prometido y
lo entregado.

Efectos **obligatorios** del cierre:

| Efecto | Categoría |
|---|---|
| El estado pasa a `closed` | A |
| Se registran momento y responsable del cierre | **D** |
| Se rechaza **toda escritura posterior** sobre la atención | **C** 🔴 |
| El código de atención pasa a vencido | **C** |
| Todos los consentimientos de la atención se revocan | **C** |
| Se genera el mensaje de sistema de cierre | A |
| Se emite el resumen de egreso al paciente | **C** |
| Se registra el evento de auditoría | **D** |

**Recursos que DEBEN rechazarse con 403 `INACTIVE_SESSION`** cuando la atención
no esté activa: envío de mensajes, signos vitales, categorización, notas
clínicas, solicitudes de consentimiento, convocatorias, solicitudes de intérprete
y avance de etapa.

### 11.4 Motivos de cierre — categoría A

Enum cerrado de tres valores:

1. Atención completada con éxito
2. Derivación a centro de alta complejidad
3. Abandono voluntario del paciente

### 11.5 Código de atención — categoría C

| Regla | Categoría | Detalle |
|---|---|---|
| Intransferible y de un solo uso | **C** | Declarado en la portada, sin implementar |
| Se entrega en presencia física | **C** | Procedimiento; el backend lo refuerza acotando por centro |
| Vencimiento | **C** | Sin implementar |
| Bloqueo por intentos fallidos | **C** | Máximo configurable, por defecto tres |
| Nunca se almacena en claro | **D** | |
| Se devuelve en claro una sola vez | **D** | |
| Comparación insensible a mayúsculas | A | |
| Acotado al centro del funcionario | **D** | |

### 11.6 Consentimientos

| Regla | Categoría | Detalle |
|---|---|---|
| Solo el paciente otorga, rechaza o revoca | A | |
| El personal solo solicita y consulta | A | |
| El médico solicita compartir con un contacto | A | |
| Los consentimientos vencen al cerrar la atención | **C** | *«Todos tus permisos expiran automáticamente al finalizar tu sesión de atención de salud.»* |
| Se registra evidencia de la decisión | **D** | Dirección IP, agente, momento |
| Un consentimiento no se responde dos veces | **D** | |
| El envío al contacto **solo** ocurre tras la autorización | **B** 🔴 | La interfaz declara el envío realizado, pero **no existe ningún envío** |

> **Regla vinculante.** La interfaz muestra *«El comprobante con triage y estado
> fue enviado exitosamente a {contacto}»*. Esa afirmación es hoy **falsa**. El
> backend **DEBE** implementar el envío real, o el frontend **DEBE** dejar de
> afirmarlo. Mostrar como realizada una comunicación de datos clínicos que nunca
> ocurrió es un defecto grave.

### 11.7 Comunicación

| Regla | Categoría | Detalle |
|---|---|---|
| El origen del mensaje se deriva del rol | A → **D** | Hoy se calcula en el navegador; **debe** derivarse en el servidor |
| Los mensajes del paciente se marcan como confirmados al enviar | A | |
| Los mensajes de sistema los genera el sistema | A | |
| Confirmar categorización avisa automáticamente al paciente | A | |
| Convocar genera mensaje de sistema | A | |
| El chat requiere atención activa | A | |
| Las traducciones de señas no se envían sin confirmación | **C** | *«El sistema solicita al paciente pulsar un gran botón de confirmación»* |
| Se registra la confianza de la traducción | **B** | Se calcula y se descarta |
| El dibujo de la pizarra se transmite | **B** 🔴 | Solo se envía un texto de marcador |

### 11.8 Datos del paciente

| Regla | Categoría | Detalle |
|---|---|---|
| La ficha no es editable por el personal | **C** 🔴 | Declarado explícitamente; el prototipo permite editar alergias |
| Las alergias se propagan a todas las pantallas | **C** | *«Estos riesgos se proyectarán en los indicadores clínicos de todas las salas»* |
| El paciente ve su ficha completa | A | |
| El paciente **no** ve signos vitales, categorización ni notas | A | Segregación deliberada |

### 11.9 Segregación por rol — categoría A

Implementada mediante qué datos recibe cada pantalla. **DEBE** replicarse en el
servidor (§12.3).

| Regla |
|---|
| El administrador no accede a ningún dato clínico |
| El paciente no accede a signos vitales, categorización ni notas |
| Admisión no accede a signos vitales, categorización ni consentimientos |
| Categorización no accede a notas clínicas ni consentimientos |
| Solo el médico tiene la vista consolidada |

### 11.10 Reglas exclusivas del backend — categoría D

| Regla |
|---|
| Aislamiento por centro de salud en toda consulta |
| Derivación de identidad del emisor en cada escritura |
| Auditoría automática de toda acción relevante |
| Vencimiento por inactividad mediante proceso programado |
| Inmutabilidad y versionado de notas firmadas |
| Resumen criptográfico del contenido clínico |
| Límite de frecuencia |
| Atomicidad de los efectos secundarios entre módulos |
| Autorización de canales de tiempo real |

> **Atomicidad.** Cuando una operación produce efectos en otros módulos
> —confirmar categorización, avanzar etapa, convocar, cerrar—, todos los efectos
> **DEBEN** ocurrir dentro de una transacción. Un cierre que expire el código
> pero no revoque los consentimientos deja el sistema en estado inconsistente.

---

## 12. Roles y permisos

### 12.1 Los cinco roles

| Rol | Perfil | Ámbito |
|---|---|---|
| `admin_institucional` | Administrador de TI | Plataforma. **Sin acceso clínico** |
| `admision` | Personal de ventanilla | Apertura de la atención |
| `categorizacion` | Personal TENS o enfermería | Signos vitales y categorización |
| `medico` | Médico urgenciólogo | Consulta, notas y cierre |
| `paciente` | Persona atendida | Portal propio, autonomía sobre sus datos |

### 12.2 Matriz de permisos

| Permiso | ADM | ADI | CAT | MED | PAC |
|---|:---:|:---:|:---:|:---:|:---:|
| `cta.validate` | | ✅ | | | |
| `cta.generate` | | ⏳ | | | ⏳ |
| `patient.view` | | ✅ | ✅ | ✅ | ✅ propia |
| `patient.contacts.view` | | | | ✅ | ✅ propios |
| `patient.edit` | ❌ | ❌ | ❌ | ❌ | ✅ propia |
| `session.create` | | ✅ | | | |
| `session.view` | ❌ | ✅ | ✅ | ✅ | ✅ propia |
| `session.advance` | | ✅ | ✅ | | |
| `session.close` | | | ⏳ | ✅ | |
| `timeline.view` | | | | ✅ | |
| `message.send` | | ✅ | ✅ | ✅ | ✅ |
| `message.view` | ❌ | ✅ | ✅ | ✅ | ✅ |
| `message.confirm` | | | | | ✅ |
| `vitals.create` | | | ✅ | | |
| `vitals.view` | ❌ | ❌ | ✅ | ✅ | ❌ |
| `triage.create` | | | ✅ | | |
| `triage.view` | ❌ | ❌ | ✅ | ✅ | ❌ |
| `note.create` | | | | ✅ | |
| `note.view` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `consent.request` | | | | ✅ | |
| `consent.answer` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `consent.view` | ❌ | | | ✅ | ✅ |
| `call.create` | | ✅ | ✅ | ✅ | |
| `call.cancel` | | ✅ | ✅ | ✅ | |
| `call.acknowledge` | | | | | ✅ |
| `interpreter.request` | | | | ✅ | |
| `interpreter.connect` | | | | ✅ | ✅ |
| `pictogram.view` | ✅ | | | | ✅ |
| `pictogram.manage` | ✅ | | | | |
| `audit.view` | ✅ | | | | |
| `audit.export` | ✅ | | | | |
| `settings.manage` | ✅ | | | | |
| `user.manage` | ✅ | | | | |

**Leyenda:** ✅ permitido · ❌ **denegado explícitamente** · *(vacío)* no aplica ·
⏳ pendiente de decisión.

> La distinción entre ❌ y vacío importa: ❌ marca una denegación **deliberada**
> que **NO DEBE** relajarse sin modificar este contrato. Un vacío es simplemente
> una capacidad ajena al rol.

### 12.3 Segregación de datos

**Requisito de privacidad, no optimización.** Un mismo recurso **DEBE** devolver
distintos campos según el rol solicitante. No basta con autorizar el acceso: hay
que recortar el contenido.

| Rol | Recibe | **NO DEBE recibir** |
|---|---|---|
| `admin_institucional` | Catálogos, bitácora, configuración, usuarios, métricas | **Nada clínico**: ni atenciones, ni mensajes, ni signos vitales, ni categorización, ni notas, ni consentimientos, ni datos de pacientes |
| `admision` | Ficha administrativa, atención, mensajes | Signos vitales, categorización, notas, consentimientos |
| `categorizacion` | Ficha, atención, mensajes, signos vitales, categorización | Notas clínicas, consentimientos |
| `medico` | Vista consolidada completa | — |
| `paciente` | Ficha propia, mensajes, consentimientos propios, convocatorias, catálogos | Signos vitales, categorización, notas clínicas, datos de otros pacientes |

> **El caso del administrador es el más estricto.** Gestiona la plataforma, no
> atiende pacientes. El borrador de autorización de la auditoría lo niega de
> forma explícita, y la interfaz de administración no recibe ningún dato clínico.
> Este contrato lo eleva a **regla vinculante**: el administrador **NO DEBE**
> poder acceder a información clínica de ningún paciente, por ningún medio,
> incluidos los canales de tiempo real.

### 12.4 Permisos en el cliente

El backend entrega `permissions[]` tras el acceso. El frontend lo usa para
**ocultar controles** que el usuario no puede accionar.

**Regla vinculante.** Ese arreglo es una ayuda de presentación, **nunca** un
mecanismo de seguridad. El backend **DEBE** evaluar la autorización en cada
petición, con independencia de lo que el cliente crea tener permitido.

### 12.5 Prohibición de cambio de rol

El prototipo permite cambiar de rol desde tres controles distintos sin
reautenticación. Bajo este contrato:

| Regla |
|---|
| El rol lo determina **solo** el backend, desde la cuenta autenticada |
| El cliente **NO DEBE** enviar rol en ninguna petición |
| Si lo envía, el backend **DEBE ignorarlo** |
| Cambiar de rol exige cerrar sesión e iniciar una nueva |
| El menú lateral es **navegación**, no cambio de identidad |
| Todo control de simulación de roles **DEBE eliminarse** antes de integración |

---

## 13. Seguridad

### 13.1 Contexto

El sistema maneja datos clínicos identificables de personas con discapacidad
auditiva: identificación nacional, domicilio, previsión, alergias, condiciones
de salud, categorización de urgencia y notas clínicas. El producto declara
públicamente cumplir la **Ley N° 20.584** (derechos y deberes del paciente) y la
**Ley N° 19.628** (protección de la vida privada).

**Hoy no existe nada que sustente esas declaraciones.** Todos los requisitos de
esta sección son responsabilidad del backend.

### 13.2 Autorización

| Requisito |
|---|
| Toda petición autenticada verifica rol **y** pertenencia al centro de salud |
| El aislamiento por centro se aplica de forma **sistémica**, no recurso por recurso, para evitar omisiones |
| El acceso a datos de un paciente exige atención activa o validación de código reciente. **No existe consulta libre del padrón** |
| La segregación por rol se aplica en la serialización, no solo en el control de acceso |
| Los canales de tiempo real usan las mismas reglas que su equivalente HTTP |
| Ante duda entre 403 y 404, se prefiere **404** cuando revelar la existencia del recurso sea en sí una fuga |

### 13.3 Protección de datos en tránsito y reposo

| Requisito |
|---|
| **TLS obligatorio** en integración y producción. Sin excepciones |
| Tokens Sanctum transportados solo por HTTPS; revocables en el servidor |
| Contraseñas con función de derivación de clave adaptativa. **Nunca** resúmenes simples |
| Códigos de atención almacenados solo como resumen criptográfico |
| Notas clínicas con resumen criptográfico de contenido, para detectar alteraciones |
| Cifrado en reposo de los campos clínicos más sensibles — `DECISIÓN PENDIENTE — D-24`: definir el alcance |
| Copias de seguridad cifradas, con la misma política de retención |

### 13.4 Retención y minimización

| Requisito |
|---|
| Se recopila **solo** lo que la interfaz usa. Campos declarados y nunca mostrados **NO DEBEN** recopilarse sin justificación |
| Política de retención de datos clínicos — `DECISIÓN PENDIENTE — D-25` |
| La portada declara: *«no guarda imágenes, audios o secuencias de vídeo»*. El backend **NO DEBE** persistir video ni audio de las videollamadas |
| La portada declara que las imágenes de reconocimiento de señas *«se procesan y desechan de forma inmediata en el cliente»*. Esto **restringe** dónde puede ejecutarse el reconocimiento (`D-26`) |
| Los dibujos de la pizarra, cuando se implementen, son datos clínicos y siguen la misma política |
| Las bitácoras de auditoría tienen retención propia, normalmente mayor |

> **Advertencia vinculante.** Si el reconocimiento de señas se implementa en el
> servidor, la declaración pública sobre procesamiento local **deja de ser
> cierta** y debe corregirse antes del despliegue. La decisión técnica y la
> declaración legal están acopladas.

### 13.5 Límite de frecuencia

| Ámbito | Límite propuesto | Respuesta |
|---|---|---|
| Acceso, por IP | 10 / 15 min | 429 |
| Acceso, por cuenta | 5 / 15 min | 429 |
| Validación de código, por usuario | 10 / min | 429 |
| Envío de mensajes, por atención | 60 / min | 429 |
| Formulario público de contacto, por IP | 3 / hora | 429 |
| API general, por usuario | 300 / min | 429 |

> Valores **PROPUESTOS**, a calibrar con tráfico real (`D-27`). Los del acceso y
> el código de atención son los críticos.
>
> **Distinción obligatoria.** El límite de frecuencia del código de atención
> (429, temporal) es **distinto** del contador de intentos fallidos que bloquea
> el código de forma permanente (403 `BLOCKED_CODE`). Ambos coexisten.

### 13.6 Prevención de fugas

El backend **NO DEBE**:

| Prohibición |
|---|
| Exponer trazas, consultas SQL, rutas de archivos ni nombres de clase |
| Incluir datos clínicos o identificables en mensajes de error |
| Incluir datos clínicos en bitácoras de aplicación |
| Permitir enumerar usuarios mediante respuestas distintas del formulario de recuperación |
| Devolver más campos «por si acaso» |
| Emitir identificadores secuenciales para recursos sensibles (§2.6) |

### 13.7 Auditoría

| Requisito |
|---|
| Toda acción relevante genera un registro (§19) |
| Los registros son **inmutables**: solo escritura y lectura |
| Cada registro incluye actor, acción, recurso, momento, dirección IP y agente |
| La consulta de la bitácora **también se audita** |
| Solo `admin_institucional` accede |
| La exportación es firmada y no repudiable |
| Fallar al auditar **NO DEBE** impedir la operación clínica, pero **DEBE** alertarse |

> El último punto es deliberado: en un servicio de urgencias, la disponibilidad
> clínica prevalece sobre la trazabilidad. La solución no es bloquear la
> atención, sino alertar y reconciliar.

### 13.8 Validación como control de seguridad

| Requisito |
|---|
| Toda entrada se valida en el servidor, sin excepción |
| Los identificadores se validan como referencias existentes **y accesibles al solicitante** |
| Los enum se validan contra listas cerradas |
| Los archivos se validan por contenido real, no por extensión ni tipo declarado |
| No se acepta marcado enriquecido en ningún campo de texto |
| Los campos de identidad enviados por el cliente se descartan |

### 13.9 Requisitos de despliegue

| Requisito |
|---|
| Encabezados de seguridad: política de contenido, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security` |
| Origen cruzado restringido a los dominios del proyecto |
| Secretos fuera del repositorio |
| Dependencias auditadas periódicamente |
| Fuentes tipográficas **auto-hospedadas**: el frontend depende hoy de un servicio externo, inviable en redes hospitalarias restringidas |
| Pruebas de intrusión sobre el aislamiento por centro y el portal del paciente antes de cualquier piloto con datos reales |

### 13.10 Riesgos bloqueantes heredados

Ocho hallazgos de la auditoría **DEBEN** estar resueltos antes de cualquier
piloto con pacientes reales:

| # | Riesgo | Resuelto por |
|---|---|---|
| 1 | El portal del paciente no autentica | `D-02` + §3.2 |
| 2 | Cambio de rol sin reautenticación | §12.5 |
| 3 | El acceso no valida credenciales | §3.3, §10.4 |
| 4 | El cierre no bloquea escrituras | §11.3 |
| 5 | El cliente declara su propia identidad | §1.3, §8.1 |
| 6 | Datos sensibles sin control de acceso | §13.2 |
| 7 | Consentimiento pendiente mostrado como rechazado | §9.1 |
| 8 | Vínculo con el contacto por coincidencia de texto | §8.8 |

---

## 14. Paginación

### 14.1 Estado

**PROPUESTO en su totalidad.** El frontend **no tiene paginación en ninguna
lista**: renderiza colecciones completas. Es sostenible con datos simulados y
deja de serlo de inmediato con datos reales —la bitácora de auditoría tendrá
miles de registros.

### 14.2 Dos estrategias

| Estrategia | Uso | Recursos |
|---|---|---|
| **Por página** | Listas navegables con total conocido | Bitácora, usuarios, pictogramas, atenciones |
| **Por cursor** | Flujos cronológicos que crecen por un extremo | Mensajes, línea de tiempo |

### 14.3 Paginación por página

**Parámetros:**

| Parámetro | Tipo | Por defecto | Restricciones |
|---|---|---|---|
| `page` | integer | `1` | Mínimo 1 |
| `perPage` | integer | `25` | Entre 1 y 100 |

**Metadatos de respuesta:**

```json
{
  "meta": {
    "pagination": {
      "total": 3412,
      "count": 25,
      "perPage": 25,
      "currentPage": 1,
      "lastPage": 137,
      "from": 1,
      "to": 25
    }
  }
}
```

| Campo | Descripción |
|---|---|
| `total` | Registros que cumplen el filtro, en todas las páginas |
| `count` | Registros de esta página |
| `perPage` | Tamaño solicitado |
| `currentPage` | Página actual |
| `lastPage` | Última página disponible |
| `from` / `to` | Índices del primer y último registro. `null` si está vacía |

### 14.4 Paginación por cursor

**Parámetros:**

| Parámetro | Tipo | Por defecto | Restricciones |
|---|---|---|---|
| `cursor` | string | — | Opaco. Devuelto por la respuesta anterior |
| `perPage` | integer | `50` | Entre 1 y 100 |
| `direction` | enum | `before` | `before` (más antiguos) o `after` (más nuevos) |

**Metadatos de respuesta:**

```json
{
  "meta": {
    "pagination": {
      "perPage": 50,
      "count": 50,
      "nextCursor": "eyJpZCI6IjlkM2Y…",
      "prevCursor": "eyJpZCI6IjJhMWI…",
      "hasMore": true
    }
  }
}
```

**Reglas vinculantes:**

- El cursor es **opaco**. El frontend **NO DEBE** interpretarlo, construirlo ni
  derivar nada de él.
- `nextCursor` es `null` cuando no hay más registros.
- Un cursor inválido produce **400**, no un resultado vacío.

### 14.5 Reglas generales

| Regla |
|---|
| Toda colección que pueda crecer sin límite **DEBE** paginarse |
| `perPage` fuera de rango se acota al máximo; **NO DEBE** fallar |
| Una página vacía es **200** con `"data": []`, nunca 404 |
| Solicitar una página más allá de la última devuelve `[]`, no error |
| El orden **DEBE** ser determinista, con desempate por identificador, o la paginación produce duplicados y omisiones |

### 14.6 Aplicación por recurso

| Recurso | Estrategia | Por defecto |
|---|---|---|
| Mensajes | Cursor | 50 |
| Bitácora de auditoría | Página | 25 |
| Usuarios | Página | 25 |
| Pictogramas | Página | 50 |
| Línea de tiempo | Cursor | 50 |
| Historial de signos vitales | Sin paginar | — |
| Notas clínicas | Sin paginar | — |
| Catálogos | Sin paginar | — |

> Los recursos sin paginar tienen cardinalidad acotada por atención. Si eso
> cambia, este contrato **DEBE** actualizarse.

---

## 15. Filtros

### 15.1 Estado

**PROPUESTO en su totalidad.** El frontend no envía ningún filtro al servidor. El
único filtrado existente es en memoria, sobre datos ya cargados.

### 15.2 Formato oficial

Los filtros viajan como parámetros de consulta con prefijo `filter`:

```
GET /audit-logs?filter[severity]=critical&filter[userId]=9d3f…
```

**Reglas vinculantes:**

| Regla |
|---|
| Los nombres de filtro van en `camelCase` |
| Varios filtros se combinan con **Y lógico** |
| Varios valores del mismo filtro se separan por coma y se combinan con **O lógico** |
| Un filtro **desconocido** produce **400**. **NO DEBE** ignorarse en silencio |
| Un valor **inválido** para un filtro conocido produce **422** |
| Los filtros se aplican **antes** de paginar; `meta.pagination.total` refleja el conjunto filtrado |
| El filtrado **nunca** amplía la visibilidad: se aplica sobre lo que el rol ya puede ver |

### 15.3 Rangos

```
filter[occurredAtFrom]=2026-07-01T00:00:00Z
filter[occurredAtTo]=2026-07-31T23:59:59Z
```

Sufijos `From` y `To`, ambos inclusivos. Si `From` es posterior a `To`, **422**.

### 15.4 Filtros por recurso

| Recurso | Filtros |
|---|---|
| `/audit-logs` | `action`, `severity`, `userId`, `patientId`, `medicalSessionId`, `occurredAtFrom`, `occurredAtTo` |
| `/users` | `role`, `healthCenterId`, `unitId`, `isActive` |
| `/pictograms` | `categoryId`, `isActive`, `severity` |
| `/medical-sessions` | `status`, `currentStage`, `unitId`, `startedAtFrom`, `startedAtTo` |
| `/medical-sessions/{id}/messages` | `messageType`, `origin`, `senderType` |
| `/medical-sessions/{id}/vital-signs` | `measuredAtFrom`, `measuredAtTo` |
| `/medical-sessions/{id}/clinical-notes` | `noteType`, `status` |

### 15.5 Filtros implícitos

Se aplican **siempre**, no son solicitables ni desactivables:

| Filtro implícito | Ámbito |
|---|---|
| Centro de salud del usuario | Todo dato clínico |
| Segregación por rol | Todos los recursos |
| Registros no eliminados | Recursos con borrado lógico |
| Solo habilitados | Pictogramas vistos por el paciente o el público |

> **Regla vinculante.** Un filtro explícito **NO DEBE** poder anular uno
> implícito. No existe forma de que un usuario consulte datos de otro centro,
> aunque construya el parámetro a mano.

---

## 16. Ordenamiento

### 16.1 Estado

**PROPUESTO en su totalidad.** El frontend no solicita ordenamiento: consume las
colecciones en el orden en que están.

### 16.2 Formato oficial

```
GET /audit-logs?sort=-occurredAt
GET /users?sort=name
GET /pictograms?sort=categoryId,sortOrder
```

| Regla |
|---|
| Sin prefijo: ascendente |
| Prefijo `-`: descendente |
| Varios campos separados por coma, aplicados en orden de aparición |
| Un campo no ordenable produce **400** |
| Cada recurso tiene un orden por defecto documentado |

### 16.3 Determinismo

**Regla vinculante.** Todo ordenamiento **DEBE** incluir un desempate estable por
identificador, aunque el cliente no lo pida. Sin él, los registros con igual
valor pueden aparecer en distinto orden entre páginas, produciendo duplicados y
omisiones invisibles para el usuario.

### 16.4 Campos ordenables por recurso

| Recurso | Ordenables | Por defecto |
|---|---|---|
| `/audit-logs` | `occurredAt`, `severity`, `action` | `-occurredAt` |
| `/users` | `name`, `email`, `role`, `createdAt` | `name` |
| `/pictograms` | `sortOrder`, `title`, `categoryId`, `createdAt` | `categoryId,sortOrder` |
| `/medical-sessions` | `startedAt`, `status`, `currentStage` | `-startedAt` |
| `/medical-sessions/{id}/messages` | `sentAt` | `sentAt` |
| `/medical-sessions/{id}/vital-signs` | `measuredAt` | `-measuredAt` |
| `/medical-sessions/{id}/clinical-notes` | `createdAt`, `noteType` | `-createdAt` |
| `/medical-sessions/{id}/timeline` | `occurredAt` | `occurredAt` |

> Los mensajes y la línea de tiempo se ordenan **cronológicamente ascendente**
> por ser conversaciones: alterarlo rompería su legibilidad.

### 16.5 Ordenamiento de texto

| Regla |
|---|
| Comparación sensible a la configuración regional española |
| Insensible a mayúsculas |
| Los acentos ordenan junto a su vocal base: `á` con `a` |
| La `ñ` ordena **después** de la `n`, según convención del español |

> Ordenar con reglas binarias colocaría los nombres acentuados al final de la
> lista, algo visible de inmediato en un padrón chileno de pacientes.

---

## 17. Búsquedas

### 17.1 Estado

**PARCIALMENTE OBSERVADO.** Existen dos búsquedas en el frontend, ambas en
memoria sobre datos ya cargados:

| Ubicación | Campos | Comportamiento |
|---|---|---|
| Catálogo público de pictogramas | Título, frase, texto de voz | Subcadena, insensible a mayúsculas, sin acumular |
| Mantenedor de pictogramas | Título, frase | Subcadena, insensible a mayúsculas |

Ese comportamiento define el contrato del lado servidor.

### 17.2 Formato oficial

```
GET /pictograms?search=dolor
GET /users?search=orellana
```

| Parámetro | Tipo | Restricciones |
|---|---|---|
| `search` | string | Mín. 2, máx. 100 caracteres |

**Reglas vinculantes:**

| Regla |
|---|
| Coincidencia por **subcadena**, no por palabra completa |
| **Insensible a mayúsculas** |
| **Insensible a acentos**: buscar `nauseas` encuentra `náuseas` |
| Insensible a `ñ` frente a `n`: buscar `senas` encuentra `señas` |
| Se recorta antes de aplicar |
| Menos de 2 caracteres produce **422** |
| Se combina con los filtros mediante **Y lógico** |
| Sin resultados es **200** con `"data": []` |
| Los caracteres especiales del motor de búsqueda **DEBEN** escaparse |

> La insensibilidad a acentos y a `ñ` **no es opcional**. El vocabulario clínico
> del sistema está lleno de términos acentuados —náuseas, cefalea, categorización,
> señas— y la búsqueda la usan tanto pacientes como personal bajo presión de
> tiempo. Exigir la tilde exacta haría la función inútil en la práctica.

### 17.3 Campos buscables por recurso

| Recurso | Campos |
|---|---|
| `/pictograms` | `title`, `phrase`, `speechText` |
| `/quick-messages` | `phrase` |
| `/users` | `name`, `email` |
| `/audit-logs` | `action` |
| `/medical-sessions` | Nombre e identificación del paciente |

> **Restricción de privacidad vinculante.** La búsqueda en atenciones **NO
> DEBE** extenderse al contenido clínico —mensajes, notas, observaciones—. Sería
> un mecanismo de exploración masiva de datos clínicos que ninguna pantalla
> requiere. Si en el futuro se necesita, exige modificar este contrato y una
> justificación explícita.

### 17.4 Lo que no se busca

| Regla |
|---|
| Sin búsqueda global entre recursos |
| Sin búsqueda difusa ni corrección ortográfica |
| Sin resaltado de coincidencias en la respuesta: lo hace el frontend |
| Sin sugerencias ni autocompletado — `DECISIÓN PENDIENTE — D-28` si se requiere |

---

## 18. Manejo de errores

### 18.1 Contrato

Todo error sigue §4.6 (validación) o §4.7 (general). El frontend implementa **un
solo manejador** y ramifica por `code`.

### 18.2 Catálogo oficial de códigos

**Regla vinculante.** Estos identificadores son **parte del contrato**. Solo
cambian con una versión mayor. El frontend **DEBE** ramificar por ellos y
**NUNCA** por el texto de `message`.

#### Autenticación e identidad

| `code` | HTTP | Significado |
|---|:---:|---|
| `UNAUTHENTICATED` | 401 | Sin sesión válida |
| `SESSION_EXPIRED` | 401 | La sesión de usuario venció |
| `INVALID_CREDENTIALS` | 422 | Credenciales incorrectas |
| `USER_INACTIVE` | 403 | La cuenta está desactivada |
| `UNAUTHENTICATED` | 401 | Bearer token ausente, inválido o revocado |

#### Autorización

| `code` | HTTP | Significado |
|---|:---:|---|
| `FORBIDDEN_ROLE` | 403 | El rol no permite la acción |
| `FORBIDDEN_CENTER` | 403 | El recurso pertenece a otro centro |
| `CONSENT_REQUIRED` | 403 | Falta un consentimiento del paciente |

#### Código de atención

| `code` | HTTP | Significado |
|---|:---:|---|
| `INVALID_CODE` | 422 | No existe o no corresponde |
| `EXPIRED_CODE` | 410 | Venció |
| `BLOCKED_CODE` | 403 | Bloqueado por intentos fallidos |
| `CODE_ALREADY_CONSUMED` | 409 | Ya fue usado |

#### Sesión médica

| `code` | HTTP | Significado |
|---|:---:|---|
| `SESSION_NOT_FOUND` | 404 | No existe o no es accesible |
| `INACTIVE_SESSION` | 403 | Cerrada, cancelada o vencida |
| `SESSION_ALREADY_CLOSED` | 409 | Ya estaba cerrada |
| `INVALID_STAGE_TRANSITION` | 409 | Transición de etapa no permitida |
| `PATIENT_HAS_ACTIVE_SESSION` | 409 | El paciente ya tiene una atención abierta |

#### Datos clínicos y comunicación

| `code` | HTTP | Significado |
|---|:---:|---|
| `NOTE_IMMUTABLE` | 409 | La nota firmada no se modifica |
| `CONSENT_ALREADY_ANSWERED` | 409 | El consentimiento ya fue respondido |
| `INTERPRETER_ALREADY_REQUESTED` | 409 | Ya hay una solicitud activa |
| `CALL_ALREADY_ACKNOWLEDGED` | 409 | La convocatoria ya fue acusada |

#### Genéricos

| `code` | HTTP | Significado |
|---|:---:|---|
| `VALIDATION_ERROR` | 422 | Uno o más campos inválidos |
| `MALFORMED_REQUEST` | 400 | Petición no interpretable |
| `RESOURCE_NOT_FOUND` | 404 | Recurso inexistente |
| `TOO_MANY_ATTEMPTS` | 429 | Límite de frecuencia superado |
| `INTERNAL_ERROR` | 500 | Fallo no controlado |
| `SERVICE_UNAVAILABLE` | 503 | Servicio o dependencia no disponible |

### 18.3 Comportamiento esperado del frontend

| `code` / HTTP | Acción |
|---|---|
| 401, `SESSION_EXPIRED` | Redirigir al acceso preservando el destino |
| 401 | Descartar el token, redirigir al acceso y preservar el destino |
| 403 | Mostrar el mensaje. **No** reintentar ni redirigir |
| 404 | Mostrar estado de recurso no disponible |
| 409 | Mostrar el mensaje y **recargar** para reconciliar el estado |
| 422 | Mostrar los errores junto a cada campo |
| 429 | Mostrar el mensaje y esperar `retryAfter` |
| 500 | Mostrar el mensaje genérico. **No** reintentar escrituras |
| 503 | Mostrar el mensaje y ofrecer reintentar tras `retryAfter` |
| Sin red | Mensaje propio del cliente. **No** inventar un código |

**Reglas vinculantes para el frontend:**

| Regla |
|---|
| **NO DEBE** reintentar automáticamente operaciones de escritura clínica: duplicaría registros |
| **NO DEBE** reintentar en bucle ante 401 |
| **NO DEBE** ocultar errores al usuario |
| **DEBE** preservar el contenido no enviado de formularios largos ante un error |
| **DEBE** tolerar valores de enum desconocidos degradando con elegancia |

### 18.4 Errores en tiempo real

| Situación | Comportamiento |
|---|---|
| Fallo de conexión del canal | Reconexión con espera creciente |
| Autorización de canal denegada | **No** reintentar. Recargar la vista |
| Evento con forma desconocida | Descartar y registrar. **NO DEBE** romper la interfaz |
| Pérdida de eventos | Reconciliar recargando (§7.11) |

### 18.5 Prohibiciones

El backend **NO DEBE**:

| Prohibición |
|---|
| Devolver 200 con un error en el cuerpo |
| Devolver HTML ante un error de API |
| Emitir un `code` fuera del catálogo de §18.2 |
| Reutilizar un `code` con un significado distinto |
| Exponer detalles internos en `message` |
| Incluir datos clínicos identificables en errores |

---

## 19. Eventos importantes

### 19.1 Principio

Toda acción que **cree, modifique o exponga** datos clínicos o de configuración
**DEBE** generar un registro de auditoría. Es requisito legal, no una función
opcional.

**Regla vinculante.** El registro lo genera el **backend**, de forma automática y
transversal. **NUNCA** depende de que el cliente lo solicite ni de que un
desarrollador recuerde añadirlo en cada recurso.

### 19.2 Contenido obligatorio

| Campo | Obligatorio | Descripción |
|---|:---:|---|
| `action` | ✅ | Identificador del evento (§19.3) |
| `actor` | ✅ | Usuario o paciente que actúa. Puede ser el sistema |
| `resourceType` | ✅ | Entidad afectada |
| `resourceId` | ✅ | Identificador de la entidad |
| `medicalSessionId` | ⚠️ | Si aplica |
| `patientId` | ⚠️ | Si aplica |
| `organizationId`, `healthCenterId` | ✅ | Contexto de aislamiento |
| `ipAddress` | ✅ | Origen |
| `userAgent` | ✅ | Cliente |
| `occurredAt` | ✅ | Momento, en UTC |
| `severity` | ✅ | `info`, `warning`, `critical` |
| `oldValues` / `newValues` | ⚠️ | En modificaciones |

> **Restricción vinculante.** `oldValues` y `newValues` **NO DEBEN** contener el
> contenido clínico íntegro —cuerpo de notas, texto de mensajes—. Registran qué
> campos cambiaron, no el detalle sensible. La bitácora se consulta y exporta con
> criterios distintos a los del expediente.

### 19.3 Catálogo de eventos auditables

#### Autenticación — `info`, salvo indicación

| Acción | Severidad |
|---|---|
| `login` | info |
| `login_failed` | **warning** |
| `login_blocked` | **critical** |
| `logout` | info |
| `password_reset_requested` | info |
| `patient_portal_access` | info |

#### Código de atención

| Acción | Severidad |
|---|---|
| `attention_code_generated` | info |
| `attention_code_validated` | info |
| `attention_code_failed` | **warning** |
| `attention_code_blocked` | **critical** |
| `attention_code_consumed` | info |

#### Sesión médica

| Acción | Severidad |
|---|---|
| `session_created` | info |
| `session_viewed` | info |
| `session_stage_advanced` | info |
| `session_stage_advanced_without_triage` | **warning** |
| `session_closed` | **warning** |
| `session_expired` | **warning** |

#### Datos clínicos

| Acción | Severidad |
|---|---|
| `vitals_recorded` | info |
| `vitals_out_of_range` | **warning** |
| `triage_recorded` | info |
| `triage_level_c1_c2_assigned` | **warning** |
| `clinical_note_created` | info |
| `clinical_note_signed` | **warning** |
| `clinical_note_superseded` | **critical** |
| `clinical_note_viewed` | info |

#### Consentimientos — todos relevantes

| Acción | Severidad |
|---|---|
| `consent_requested` | info |
| `consent_granted` | **warning** |
| `consent_rejected` | **warning** |
| `consent_revoked` | **critical** |
| `consent_expired_on_close` | info |

#### Comunicación

| Acción | Severidad |
|---|---|
| `message_sent` | info |
| `message_confirmed_by_patient` | info |
| `patient_called` | info |
| `call_acknowledged` | info |
| `call_cancelled` | info |
| `interpreter_requested` | info |
| `interpreter_connected` | **warning** |
| `interpreter_ended` | info |

#### Datos compartidos con terceros — todos `critical`

| Acción |
|---|
| `contact_share_requested` |
| `contact_share_authorized` |
| `contact_share_sent` |
| `contact_share_failed` |

> Toda esta categoría es `critical` sin excepción: es el único punto donde
> información clínica **sale** del sistema hacia una persona ajena al equipo
> tratante.

#### Administración

| Acción | Severidad |
|---|---|
| `user_created` | **warning** |
| `user_updated` | **warning** |
| `user_deactivated` | **critical** |
| `pictogram_created` / `pictogram_updated` | info |
| `pictogram_toggled` | info |
| `pictogram_deleted` | **warning** |
| `security_settings_updated` | **critical** |
| `audit_logs_viewed` | **warning** |
| `audit_logs_exported` | **critical** |

#### Sistema

| Acción | Severidad |
|---|---|
| `unauthorized_access_attempt` | **critical** |
| `cross_center_access_attempt` | **critical** |
| `rate_limit_exceeded` | **warning** |

### 19.4 Eventos que exigen alerta activa

No basta con registrarlos. **DEBEN** generar notificación al equipo responsable:

| Evento | Motivo |
|---|---|
| `cross_center_access_attempt` | Posible intento de acceso indebido a datos de otro establecimiento |
| `unauthorized_access_attempt` | Posible ataque |
| `login_blocked` | Posible ataque por fuerza bruta |
| `attention_code_blocked` | Posible intento de adivinar códigos |
| `security_settings_updated` | Cambio de parámetros de seguridad |
| `audit_logs_exported` | Extracción masiva de datos de trazabilidad |
| `contact_share_sent` | Salida de datos clínicos del sistema |

### 19.5 Retención y exportación

| Aspecto | Regla |
|---|---|
| Retención | Mayor que la de los datos clínicos. `DECISIÓN PENDIENTE — D-29` |
| Inmutabilidad | Sin modificación ni borrado, por ningún rol |
| Exportación | Firmada y no repudiable, según declara la interfaz |
| Formato | `DECISIÓN PENDIENTE — D-30`. La interfaz menciona documento portátil y hoja de cálculo |
| Acceso | Solo `admin_institucional`, y la consulta se audita |

---

## 19bis. Documentación de la API — Swagger / OpenAPI (A-07)

**RATIFICADO.** El backend **DEBE** publicar la documentación de la API en
formato **OpenAPI 3** y exponer una interfaz navegable **Swagger UI**. Es la
fuente de verdad ejecutable del contrato: el frontend consulta ahí la forma real
de cada endpoint, y la evaluación puede verificarla.

| Aspecto | Regla |
|---|---|
| Estándar | OpenAPI 3.x |
| Interfaz | Swagger UI navegable |
| Ruta sugerida | `GET /api/documentation` (Swagger UI) y `GET /api/v1/openapi.json` (especificación) |
| Herramienta sugerida en Laravel | `darkaonline/l5-swagger` (genera OpenAPI desde anotaciones en los controladores) |
| Cobertura | **DEBE** documentar todos los endpoints de `/api/v1`: método, ruta, parámetros, cuerpo de request, respuestas por código HTTP y esquema de autenticación (Bearer) |
| Autenticación en la doc | Debe declararse el esquema `bearerAuth` para poder probar endpoints protegidos desde Swagger UI |
| Mantenimiento | La documentación **DEBE** regenerarse cuando cambie un endpoint; una respuesta real que no coincida con la doc es un defecto |

**Ejemplo de anotación (referencia, no normativa):**

```php
/**
 * @OA\Post(
 *   path="/api/v1/auth/login",
 *   tags={"Auth"},
 *   summary="Inicia sesión y devuelve un Bearer token",
 *   @OA\RequestBody(required=true,
 *     @OA\JsonContent(required={"email","password"},
 *       @OA\Property(property="email", type="string", format="email"),
 *       @OA\Property(property="password", type="string", format="password")
 *     )
 *   ),
 *   @OA\Response(response=200, description="Token emitido"),
 *   @OA\Response(response=422, description="Credenciales inválidas")
 * )
 */
```

> **Alcance para la evaluación.** Swagger es una mejora profesional acordada por
> el equipo. Se prioriza documentar primero los endpoints que cubre la rúbrica
> (autenticación, registro de usuario, y los recursos con modelos), y luego el
> resto.

---

## 20. Pendientes

### 20.1 Cómo usar esta sección

Cada decisión indica su impacto y qué queda bloqueado. **Las marcadas 🔴 impiden
comenzar la implementación** y deben resolverse antes de escribir la primera
línea del backend.

Resolver una decisión implica: acordarla entre ambos equipos, registrarla aquí
con su fundamento, actualizar la sección afectada e incrementar la versión del
contrato.

### 20.2 Bloqueantes 🔴

| # | Decisión | Bloquea | Sección |
|---|---|---|---|
| **D-07** | **Unificación de la máquina de estados.** El frontend mantiene un estado enumerado de nueve valores —de los que solo produce tres— y una etapa de texto libre, que codifican información solapada | Modelo de la sesión médica, transiciones, validaciones de estado | §6, §11.2 |

> **Decisiones antes bloqueantes, ahora RESUELTAS (v2.0.0):**
> - **D-01 — Base URL / arquitectura:** resuelta. API REST con base URL por
>   `VITE_API_URL` y prefijo único `/api/v1` (§2.1).
> - **D-02 — Autenticación del paciente:** resuelta. Bearer token de Sanctum
>   derivado del código CTA, acotado a la sesión médica (§3.2, A-03).
> - **Nomenclatura del cable:** resuelta en §2.3: `camelCase`.
> - **Estilo de integración y autenticación del personal:** resueltas en las
>   Decisiones de arquitectura (A-01, A-02).

### 20.3 Alto impacto 🟠

| # | Decisión | Impacto | Sección |
|---|---|---|---|
| **D-01** | URL base y estrategia de entornos | Configuración de ambos equipos | §2.1 |
| **D-05** | Catálogo real de ubicaciones por establecimiento | Convocatoria de pacientes | §6 E04 |
| **D-06** | ¿Un rol por usuario o varios? | Modelo de autorización completo | §6 E06 |
| **D-08** | ¿Título y descripción del consentimiento como texto almacenado o generado desde plantillas? | Contrato del recurso de consentimientos e internacionalización | §6 E11 |
| **D-11** | Proveedor de videollamada | Integración de intérprete remoto | §6 E21 |
| **D-12** | Consentimientos exigidos para cámara y videollamada | Reglas de negocio del intérprete | §6 E21 |
| **D-16** | ¿Puede `categorizacion` cerrar atenciones? El borrador de autorización dice que sí; la interfaz solo lo ofrece al médico | Matriz de permisos. Este contrato adopta la versión restrictiva | §7.6 |
| **D-20** | Rangos clínicos de presión arterial y frecuencia respiratoria | Validación de signos vitales. **Requiere criterio clínico, no técnico** | §8.5 |
| **D-23** | ¿Se permite avanzar a consulta médica sin categorización? | Máquina de estados. Este contrato lo permite auditándolo | §11.2 |
| **D-24** | Alcance del cifrado en reposo | Arquitectura de persistencia | §13.3 |
| **D-25** | Política de retención de datos clínicos | Cumplimiento legal | §13.4 |
| **D-26** | ¿El reconocimiento de señas se ejecuta en el cliente o en el servidor? | **Acoplado a una declaración pública** sobre procesamiento local | §13.4 |

### 20.4 Impacto medio 🟡

| # | Decisión | Impacto | Sección |
|---|---|---|---|
| **D-03** | ¿Se permiten sesiones concurrentes del mismo usuario? | Gestión de sesión | §3.5 |
| **D-04** | Minutos de inactividad de la **sesión de usuario** | Autenticación | §3.7 |
| **D-09** | ¿Los mensajes rápidos son catálogo administrable o constantes? | Alcance de administración | §6 E15 |
| **D-10** | ¿Los síntomas de la categorización son lista cerrada o texto libre? | Interfaz de captura, hoy inexistente | §6 E18 |
| **D-13** | ¿La línea de tiempo es entidad propia o proyección de la auditoría? | Modelo de eventos. Se recomienda la proyección | §6 E22 |
| **D-14** | Ámbito de los parámetros de seguridad: global, por organización o por centro | Configuración | §6 E23 |
| **D-15** | ¿Quién genera el código de atención? No existe pantalla que lo haga | Flujo de admisión | §7.4 |
| **D-17** | Flujo de revocación posterior de consentimientos | Autonomía del paciente | §7.8 |
| **D-18** | Formato definitivo del código: longitud, alfabeto, prefijo por establecimiento | Validación | §8.3 |
| **D-19** | ¿El motivo de consulta pertenece al paciente o a la atención? | Modelo de datos | §8.4 |
| **D-21** | Implementación del envío del dibujo de la pizarra | Funcionalidad hoy sin efecto real | §8.10 |
| **D-22** | Tipo de mensaje para imágenes | Enum de mensajes | §8.10 |
| **D-27** | Calibración de los límites de frecuencia | Operación | §13.5 |
| **D-29** | Retención de la bitácora de auditoría | Cumplimiento legal | §19.5 |
| **D-30** | Formato de exportación firmada | Administración | §19.5 |

### 20.5 Impacto bajo 🟢

| # | Decisión | Sección |
|---|---|---|
| **D-28** | ¿Se requiere autocompletado en las búsquedas? | §17.4 |
| **D-31** | ¿Se persisten las preferencias de accesibilidad por usuario o quedan en el cliente? | §1.2 |
| **D-32** | ¿Se requiere síntesis de voz de respaldo en el servidor? Hoy depende del navegador | §1.4 |

### 20.6 Ruta crítica

```
D-02 (autenticación del paciente) ─┐
                                   ├──► Modelo de identidad
D-07 (máquina de estados)        ──┘         │
                                             ▼
                                   Sesión médica y datos clínicos
                                             │
                          ┌──────────────────┼──────────────────┐
                          ▼                  ▼                  ▼
                   D-06, D-16          D-08, D-17          D-20, D-23
                  (autorización)      (consentimientos)      (clínicas)
```

**D-02 y D-07 bloquean el resto.** Ninguna otra decisión debería abordarse antes.

### 20.7 Registro de decisiones resueltas

| # | Decisión | Resolución | Sección |
|---|---|---|---|
| **D-00** | Nomenclatura del cable | **`camelCase`**, con conversión en la capa de serialización del backend | §2.3 |

> Toda decisión que se resuelva **DEBE** trasladarse a esta tabla con su
> fundamento, y retirarse de las listas de pendientes.

---

## Anexo · Glosario

| Término | Definición |
|---|---|
| **CTA** | Código Temporal de Atención. Credencial intransferible y de un solo uso que autoriza abrir una atención |
| **Sesión de usuario** | Autenticación de una persona ante el sistema |
| **Sesión médica** | Atención clínica de un paciente. **No** comparte ciclo de vida con la anterior |
| **Categorización / Triage** | Clasificación de urgencia en cinco niveles, de C1 (riesgo vital) a C5 (no urgente) |
| **LSCh** | Lengua de Señas Chilena |
| **Consentimiento granular** | Autorización por uso específico, no global |
| **Convocatoria** | Llamado dirigido al paciente indicándole a qué ubicación acudir |
| **Aislamiento por centro** | Separación estricta de datos entre establecimientos |
| **Segregación por rol** | Recorte de campos de una respuesta según el perfil del solicitante |
| **Efecto secundario** | Escritura que una operación produce en otro módulo |

---

*Contrato derivado de `BACKEND_IMPLEMENTATION_GUIDE.md`, basado en el análisis
del frontend en el commit `41360a8`. Las cláusulas marcadas OBSERVADO describen
comportamiento verificado; DECLARADO, promesas de la interfaz sin implementar;
PROPUESTO, estándares que este contrato establece y requieren ratificación.*

--- FIN DEL DOCUMENTO ---
