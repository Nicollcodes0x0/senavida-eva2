# SeñaVida — Bitácora de Aprendizaje

## Mejoras adicionales — Seguridad del registro y Catálogos institucionales

> **¿Qué es este documento?**
> Es el resumen, con lenguaje sencillo (de estudiante para estudiante), de un
> conjunto de mejoras que se agregaron **después** de cerrar la Fase 3, para
> reforzar la seguridad del registro de usuarios y resolver un problema real
> detectado: el frontend necesitaba una forma de consultar organizaciones,
> centros y unidades para poder construir sus formularios.

---

## Índice

1. [¿Qué se hizo en esta sesión?](#1-qué-se-hizo-en-esta-sesión)
2. [Mejora 1 — Confirmación de contraseña](#2-mejora-1--confirmación-de-contraseña)
3. [Mejora 2 — Expiración de tokens](#3-mejora-2--expiración-de-tokens)
4. [Mejora 3 — Admin limitado a su propio centro](#4-mejora-3--admin-limitado-a-su-propio-centro)
5. [Mejora 4 — Endpoints de catálogos institucionales](#5-mejora-4--endpoints-de-catálogos-institucionales)
6. [La jerarquía completa: quién crea qué](#6-la-jerarquía-completa-quién-crea-qué)
7. [Los datos de prueba creados](#7-los-datos-de-prueba-creados)
8. [Glosario rápido](#8-glosario-rápido)
9. [Qué sigue](#9-qué-sigue)

---

## 1. ¿Qué se hizo en esta sesión?

Después de completar la Fase 3 (con la rúbrica al 100%), se hicieron **4 mejoras
adicionales** al backend, motivadas por preguntas reales sobre seguridad y por un
problema práctico detectado al planear cómo Nicoll (el frontend) conectaría el
formulario de registro:

1. Exigir **confirmación de contraseña** en el registro.
2. Configurar que los **tokens expiren** automáticamente.
3. Limitar a cada admin a registrar usuarios **solo en su propio centro**.
4. Crear **endpoints de consulta** para organizaciones, centros y unidades.

---

## 2. Mejora 1 — Confirmación de contraseña

### El problema que resuelve

Antes, el registro solo pedía un campo `password`. Si el admin (quien registra a
otra persona) se equivocaba al escribirla, la cuenta quedaba con una contraseña
que nadie sabía cuál era realmente.

### La solución: la regla `confirmed`

```php
'password' => ['required', 'string', 'min:8', 'confirmed'],
```

**`confirmed`** es una regla de Laravel que, por convención de nombres, exige que
además de `password` llegue un campo **`password_confirmation`** con el mismo
valor. Si no coinciden, o falta, Laravel rechaza automáticamente con un `422`.

### Un concepto clave: validación del backend vs. del frontend

- **Validación visual (frontend):** el equipo de Nicoll podría poner dos campos
  de contraseña y compararlos en su propio código, antes de enviar la petición.
  Esto es solo para la experiencia de usuario — el backend nunca se entera de si
  se hizo o no.
- **Validación real (backend):** al agregar `confirmed`, el backend **exige**
  que lleguen ambos campos, sin importar qué haga el frontend. Es la única forma
  de **garantizar** de verdad que nunca se guarde una contraseña mal escrita.

### Prueba realizada

- Sin `password_confirmation` → `422`, "The password field confirmation does
  not match."
- Con `password_confirmation` correcta → `201`, usuario creado con normalidad.

---

## 3. Mejora 2 — Expiración de tokens

### El problema que resuelve

Por defecto, los tokens de Sanctum **no expiran nunca** — solo se invalidan si
alguien hace logout explícitamente. Eso significa que un token robado o filtrado
seguiría siendo válido para siempre.

### La solución: la opción `expiration`

En `config/sanctum.php`:
```php
'expiration' => 120,
```

Este valor está en **minutos**. Con `120`, cada token generado en el login deja
de ser válido automáticamente **2 horas** después de haberse creado, sin
necesidad de que nadie haga logout.

### Criterio para elegir el tiempo

No hay un número "correcto" universal — depende del tipo de sistema:

| Tipo de sistema | Tiempo típico |
|---|---|
| Banca / finanzas | 15-30 minutos |
| Salud (como SeñaVida) | 1 a 8 horas |
| Apps de consumo | Días o semanas |

Se eligió **120 minutos** como balance entre seguridad (rotación frecuente de
tokens) y comodidad para el personal.

---

## 4. Mejora 3 — Admin limitado a su propio centro

### El problema que resuelve

La verificación de rol original solo comprobaba *"¿eres admin_institucional?"*,
sin importar de qué centro. Eso permitía que un admin de un hospital registrara
personal para **otro** hospital al que no pertenece — rompiendo la privacidad
por centro que exige el contrato del proyecto.

### La solución

```php
if ($data['healthCenterId'] !== $admin->health_center_id) {
    return response()->json([
        'success' => false,
        'error'   => ['message' => 'Solo puedes registrar usuarios en tu propio centro de salud.'],
    ], 403);
}
```

Se compara el `healthCenterId` que viene en la petición con el centro real del
admin logueado (`$admin->health_center_id`). Si no coinciden, se rechaza con
`403`.

**Detalle de orden:** esta verificación se colocó **después** de validar el
formato de los datos, para asegurarse de que `healthCenterId` ya es un UUID
válido antes de compararlo.

### Prueba realizada

- Admin registrando en su propio centro → `201`, funciona normal.
- El mismo admin registrando en otro centro → `403`, "Solo puedes registrar
  usuarios en tu propio centro de salud."

---

## 5. Mejora 4 — Endpoints de catálogos institucionales

### El problema real que se detectó

Al planear cómo Nicoll construiría el formulario de "Registro de Usuario", surgió
una pregunta clave: **¿cómo sabe el frontend cuáles son los UUID de las
organizaciones, centros y unidades**, si no hay ningún endpoint donde
consultarlos? Hasta ese momento, esos IDs solo se podían obtener mirando
directamente la base de datos con Tinker — algo que un formulario real no puede
hacer.

### La solución: 3 endpoints de solo lectura

```
GET /api/v1/organizations
GET /api/v1/health-centers
GET /api/v1/units
```

Todos protegidos solo con `auth:sanctum` (cualquier usuario logueado puede
consultarlos, no solo el admin, porque son datos básicos no sensibles).

### El patrón `index()`

Es el nombre por convención para el método que **lista** todos los registros de
algo. A diferencia de `register()` o `login()`, estos métodos:
- No reciben casi ningún dato del cliente (excepto, en `units`, un filtro
  opcional).
- No validan ni crean nada — solo **leen y devuelven**.
- Son mucho más simples.

Ejemplo (`OrganizationController`):
```php
public function index(): JsonResponse
{
    $organizations = Organization::where('is_active', true)->get();

    return response()->json([
        'success' => true,
        'data'    => $organizations->map(fn ($org) => [
            'id'   => $org->id,
            'name' => $org->name,
        ]),
    ], 200);
}
```

### El concepto nuevo: `map()`

**`map()`** transforma cada elemento de una lista en otra forma. Aquí se usa para
**controlar exactamente qué campos se exponen** en la respuesta — en vez de
devolver el modelo completo (con `created_at`, `is_active`, etc.), se devuelve
solo `id` y `name`, que es lo único que el frontend necesita para un desplegable.

### El concepto nuevo: query parameters (filtro en la URL)

En `UnitController`, se agregó la posibilidad de filtrar las unidades por centro:

```php
$query = Unit::where('is_active', true);

if ($request->has('healthCenterId')) {
    $query->where('health_center_id', $request->query('healthCenterId'));
}

$units = $query->get();
```

- **`$request->has('healthCenterId')`** pregunta si ese parámetro llegó en la
  URL.
- **`$request->query('healthCenterId')`** lee su valor.
- Se usa así desde el cliente:
  ```
  GET /api/v1/units                              → todas las unidades
  GET /api/v1/units?healthCenterId=xxxxx         → solo las de ese centro
  ```

Esto es justo lo que el formulario de Nicoll necesitará: cuando el admin elija un
centro, pedir solo las unidades de ese centro, sin mezclar con las de otros.

### Pruebas realizadas

- `GET /organizations` → devuelve las organizaciones existentes. ✅
- `GET /health-centers` → devuelve los dos centros. ✅
- `GET /units` (sin filtro) → devuelve todas las unidades mezcladas. ✅
- `GET /units?healthCenterId=...` → devuelve solo las unidades de ese centro
  específico. ✅

---

## 6. La jerarquía completa: quién crea qué

```
1. DESARROLLADORA (vía Tinker)
   └── Crea: Organización → Centro de Salud → Unidad
       Sin endpoint de API todavía — pendiente en Fase 4

2. ADMIN_INSTITUCIONAL (vía POST /api/v1/users)
   └── Crea: Usuarios nuevos (médico, admisión, categorización, otro admin)
       Reglas de seguridad:
         • Solo si su rol es admin_institucional
         • Solo dentro de SU PROPIO centro de salud
         • Contraseña cifrada automáticamente
         • Requiere confirmación de contraseña

3. PACIENTE
   └── NO se registra con formulario
       Entra con el código CTA (temporal, ligado a su atención)
       Todavía no construido — fase futura
```

### Por qué el registro no es "libre"

Es importante recordar: la rúbrica **sí exige** un controlador de Registro de
Usuario (y ya se cumple), pero eso no significa que cualquiera pueda registrarse
solo. En un sistema hospitalario real, no tendría sentido que cualquier persona
se autoproclame "médico" — por eso el registro está controlado por un
administrador, y ahora además, limitado a su propio centro.

---

## 7. Los datos de prueba creados

```
Organización: Servicio de Salud de Prueba
├── Centro: Hospital de Prueba
│   └── Unidad: Urgencia Adulto
│       └── Usuarios: Doctora Prueba (médico), Admin Prueba (admin),
│                      Enfermero Nuevo x2 (admisión)
└── Centro: Hospital Clínico Sur
    ├── Unidad: Urgencia Adulto
    │   └── Usuarios: Recepcionista Adulto (admisión), Admin Hospital Sur (admin)
    ├── Unidad: Urgencia Infantil
    │   └── Usuario: Enfermera Triage Infantil (categorización)
    └── Unidad: Maternidad
        └── Usuario: Dr. Maternidad (médico)
```

Estos usuarios se crearon usando el propio endpoint de registro (no con
Tinker), y algunos —como Dr. Maternidad y Admin Hospital Sur— también se
probaron haciendo login real con sus credenciales, confirmando el ciclo completo:
**registro real → login real → contexto automático** (organización, centro,
unidad, rol), sin que el usuario tenga que volver a indicar nada de eso al
iniciar sesión.

---

## 8. Glosario rápido

- **`confirmed`:** regla de validación que exige un campo `_confirmation`
  igual al original.
- **`expiration` (Sanctum):** minutos hasta que un token deja de ser válido
  automáticamente.
- **`index()`:** método por convención para listar todos los registros de un
  recurso.
- **`map()`:** transforma cada elemento de una colección, útil para controlar
  qué campos se exponen en una respuesta.
- **Query parameter:** dato que viaja en la URL después de un `?`, usado para
  filtros en peticiones `GET` (ej: `?healthCenterId=...`).
- **`$request->has()` / `$request->query()`:** comprobar y leer un query
  parameter.
- **Endpoint de solo lectura:** uno que únicamente consulta datos, sin crear ni
  modificar nada — más simple que uno que valida y guarda.

---

## 9. Qué sigue

Con estas mejoras, el backend queda más completo y coherente:

- ✅ Autenticación completa (login, me, logout).
- ✅ Registro de usuarios reforzado (cifrado, confirmación, restricción por
  centro).
- ✅ Catálogos consultables (organizaciones, centros, unidades) — resolviendo el
  bloqueo real que tenía el frontend.

**Pendiente para el futuro (Fase 4):** endpoints para **crear** (no solo
consultar) organizaciones, centros y unidades desde la API, en vez de usar
Tinker manualmente.

**En resumen:** el sistema ahora tiene una base de seguridad más sólida, y el
frontend de Nicoll ya tiene todo lo que necesita para construir un formulario de
registro real y funcional, sin datos hardcodeados. 🔐📋

---

*Documento de aprendizaje — Proyecto SeñaVida · Mejoras post-Fase 3*
