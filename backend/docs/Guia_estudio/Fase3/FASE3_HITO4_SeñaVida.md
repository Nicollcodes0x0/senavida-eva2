# SeñaVida — Bitácora de Aprendizaje

## Fase 3 · Hito 4 — Registro de usuarios

> **¿Qué es este documento?**
> Es el resumen, con lenguaje sencillo (de estudiante para estudiante), de cómo
> construimos el **controlador de Registro de Usuario**: el último indicador de
> la rúbrica. Con este hito se cierra la **Fase 3** completa y se alcanza el
> **100% de la evaluación**.

---

## Índice

1. [¿Qué hicimos en este hito?](#1-qué-hicimos-en-este-hito)
2. [Por qué este hito era clave para la rúbrica](#2-por-qué-este-hito-era-clave-para-la-rúbrica)
3. [Los conceptos nuevos explicados fácil](#3-los-conceptos-nuevos-explicados-fácil)
   - [Verificar un rol dentro del controlador](#verificar-un-rol-dentro-del-controlador)
   - [La regla `unique`](#la-regla-unique)
   - [La regla `exists`](#la-regla-exists)
   - [¿Por qué 201 y no 200?](#por-qué-201-y-no-200)
   - [Por qué nunca se devuelve la contraseña](#por-qué-nunca-se-devuelve-la-contraseña)
4. [El controlador explicado](#4-el-controlador-explicado)
5. [Los tropiezos que tuvimos (y qué enseñan)](#5-los-tropiezos-que-tuvimos-y-qué-enseñan)
6. [La prueba final: ver el cifrado con tus ojos](#6-la-prueba-final-ver-el-cifrado-con-tus-ojos)
7. [Todo lo que hicimos, paso a paso](#7-todo-lo-que-hicimos-paso-a-paso)
8. [Glosario rápido](#8-glosario-rápido)
9. [Resumen de toda la Fase 3 y la rúbrica](#9-resumen-de-toda-la-fase-3-y-la-rúbrica)

---

## 1. ¿Qué hicimos en este hito?

Construimos el endpoint **`POST /api/v1/users`**, que permite a un
`admin_institucional` registrar nuevos usuarios (funcionarios) en el sistema. La
contraseña que envían se **cifra automáticamente** antes de guardarse.

Este es el hito que completa el **indicador 3** de la rúbrica: "Define el
cifrado de los datos... controlador Registro de Usuario con el cifrado de la
clave."

---

## 2. Por qué este hito era clave para la rúbrica

La rúbrica oficial define 4 niveles para este indicador:

| Nivel | Qué exige | Puntos |
|---|---|---|
| Bajo | No hay controlador de Registro de Usuario | 0 |
| Medio | Existe, pero con errores en la ejecución | 22 |
| Alto | Existe y funciona, **pero sin cifrado** | 27 |
| **Sobresaliente** | Existe, funciona, **y cifra la clave** | **33** |

No bastaba con que el cifrado existiera "por dentro" del modelo `User` (ya lo
tenías desde la Fase 2) — la rúbrica pide que se **evidencie** a través de un
**controlador dedicado** que lo use. Por eso este hito era indispensable, aunque
el trabajo técnico fuera relativamente corto.

---

## 3. Los conceptos nuevos explicados fácil

### Verificar un rol dentro del controlador

```php
if ($request->user()->role !== 'admin_institucional') {
    return response()->json([...], 403);
}
```

No cualquiera puede registrar usuarios — solo un administrador. Como todavía no
tenemos un middleware de roles reutilizable, hicimos la verificación con una
simple condición `if` dentro del método. Es la forma más directa de resolverlo
por ahora; más adelante, cuando haya varios endpoints que necesiten roles
distintos, se puede convertir en un middleware propio.

### La regla `unique`

```php
'email' => ['required', 'email', 'unique:users,email'],
```

**`unique:users,email`** verifica que ese valor **no exista ya** en la columna
indicada de la tabla indicada. Si el email ya está registrado, Laravel rechaza
automáticamente con un `422`. Evita usuarios duplicados sin que tengamos que
escribir la comprobación a mano.

### La regla `exists`

```php
'organizationId' => ['required', 'uuid', 'exists:organizations,id'],
```

**`exists:organizations,id`** verifica que ese UUID **exista de verdad** en la
tabla indicada. Evita crear un usuario que apunte a una organización, centro o
unidad que no existen. Es lo opuesto de `unique`: mientras `unique` exige que
**no exista**, `exists` exige que **sí exista**.

### ¿Por qué 201 y no 200?

- **`200`** → "todo salió bien" (se usa para consultar o iniciar sesión, no se
  crea nada nuevo).
- **`201`** → "se creó algo nuevo" (el código correcto cuando el resultado es un
  nuevo registro, como este usuario).

Usar el código correcto es parte de seguir buenos estándares de API REST — el
frontend puede diferenciar "consulté algo" de "creé algo" mirando el código.

### Por qué nunca se devuelve la contraseña

En la respuesta del registro, **nunca** se incluye el campo `password`, ni
siquiera cifrado. Es una regla de seguridad básica: la contraseña (aunque esté
cifrada) no debe viajar de vuelta al cliente. El frontend no la necesita para
nada — ya cumplió su función al crear la cuenta.

---

## 4. El controlador explicado

```php
public function register(Request $request): JsonResponse
{
    // 1. Verificar que quien pide sea admin_institucional
    if ($request->user()->role !== 'admin_institucional') {
        return response()->json([...], 403);
    }

    // 2. Validar los datos del nuevo usuario
    $data = $request->validate([
        'name'           => ['required', 'string', 'max:255'],
        'email'          => ['required', 'email', 'unique:users,email'],
        'password'       => ['required', 'string', 'min:8'],
        'role'           => ['required', 'in:admin_institucional,admision,categorizacion,medico'],
        'organizationId' => ['required', 'uuid', 'exists:organizations,id'],
        'healthCenterId' => ['required', 'uuid', 'exists:health_centers,id'],
        'unitId'         => ['required', 'uuid', 'exists:units,id'],
    ]);

    // 3. Crear el usuario (la contraseña se cifra automáticamente)
    $user = User::create([
        'name'             => $data['name'],
        'email'            => $data['email'],
        'password'         => $data['password'],
        'role'             => $data['role'],
        'organization_id'  => $data['organizationId'],
        'health_center_id' => $data['healthCenterId'],
        'unit_id'          => $data['unitId'],
        'is_active'        => true,
    ]);

    // 4. Responder sin incluir la contraseña
    return response()->json([...], 201);
}
```

- **Bloque 1:** autorización por rol.
- **Bloque 2:** validación completa (formato, duplicados, existencia de
  relaciones).
- **Bloque 3:** creación. El cifrado ocurre **solo** por el
  `'password' => 'hashed'` que ya estaba en el modelo `User` desde la Fase 2 —
  aquí no escribimos ningún código de cifrado, simplemente se activa al guardar.
- **Bloque 4:** respuesta con código `201`, sin exponer la contraseña.

---

## 5. Los tropiezos que tuvimos (y qué enseñan)

**1. `isActive` salía `null` en la respuesta.**
No estábamos pasando `is_active` explícitamente en el `create()`. Aunque la
migración tenía `default(true)`, es más seguro **no depender del valor por
defecto de la base de datos** y especificarlo siempre a mano en el código.
Lección: sé explícito, no asumas defaults silenciosamente.

**2. Variables de Tinker que se "perdían".**
Al crear los datos de prueba (organización, centro, unidad), varias veces las
variables (`$org`, `$centro`) salían `undefined`. La causa: cada vez que se
vuelve a abrir Tinker, es una **sesión nueva** — las variables definidas en una
sesión anterior no se conservan. Lección: hay que definir y usar las variables
**en la misma sesión**, sin cerrar Tinker entre pasos relacionados.

**3. El email duplicado.**
Al reintentar el registro con el mismo email, salió `"The email has already
been taken."`. Esto no fue un error nuestro — fue la regla `unique` **haciendo
su trabajo correctamente**, rechazando un duplicado real. Buena señal de que la
validación funciona.

---

## 6. La prueba final: ver el cifrado con tus ojos

Para confirmar que la contraseña se guardó cifrada de verdad, se consultó el
usuario recién creado directamente en la base de datos con Tinker:

```php
App\Models\User::where('email', 'enfermero2@test.com')->first();
```

Resultado:
```
#password: "$2y$12$QHKja4OvFZ0j4JK9f/P/5.aXPrVwYlCoUkIR9neQjRa9hkTgPen4i"
```

Se envió `password123` en texto plano por Postman, pero en la base de datos
quedó ese texto cifrado. **Esa es la evidencia visual y directa** de que el
controlador cumple el nivel Sobresaliente de la rúbrica.

---

## 7. Todo lo que hicimos, paso a paso

1. **Creamos el `UserController`:**
   ```bash
   php artisan make:controller Api/V1/UserController
   ```
2. **Escribimos el método `register()`** con verificación de rol, validación,
   creación e is_active explícito.
3. **Creamos la ruta** `POST /users`, protegida por `auth:sanctum`, dentro del
   grupo `/v1`.
4. **Recreamos datos de prueba** (organización, centro, unidad — se habían
   perdido con un `migrate:fresh` anterior).
5. **Creamos un usuario admin** para poder probar el endpoint (solo un admin
   puede registrar).
6. **Hicimos login como admin** en Postman para obtener su token.
7. **Registramos un usuario nuevo** con ese token → confirmamos `201` y
   `isActive: true`.
8. **Verificamos en Tinker** que la contraseña quedó cifrada en la base de
   datos. ✅

---

## 8. Glosario rápido

- **`unique:tabla,columna`:** regla de validación que exige que el valor no
  exista ya.
- **`exists:tabla,columna`:** regla de validación que exige que el valor sí
  exista.
- **201 Created:** código HTTP correcto cuando se crea un recurso nuevo.
- **Verificación de rol en el controlador:** una condición `if` que limita
  quién puede ejecutar una acción.
- **Sesión de Tinker:** cada vez que se abre, empieza sin las variables de
  sesiones anteriores.
- **Cifrado silencioso:** ocurre automáticamente por el cast
  `'password' => 'hashed'`, sin código adicional en el controlador.

---

## 9. Resumen de toda la Fase 3 y la rúbrica

¡Con este hito se cierra la **Fase 3 (Autenticación real)** completa!

| Hito | Qué se logró |
|---|---|
| **Hito 1** | Login del personal (con Sanctum) |
| **Hito 2** | Endpoint `/me` y Logout (con middleware) |
| **Hito 3** | Rate limiting y validación de centro/unidad |
| **Hito 4** | Registro de usuarios con cifrado |

**Estado final de la rúbrica:**

| Indicador | Puntos | Estado |
|---|---|---|
| 1. Conexión BD + modelos | 33 | ✅ |
| 2. Login + middleware | 34 | ✅ |
| 3. Registro con cifrado | 33 | ✅ |
| **TOTAL** | **100** | ✅ **Completo** |

Y no solo en el papel: **cada pieza fue probada de verdad** con Postman,
incluyendo casos de error, límites de intentos, y verificación directa del
cifrado en la base de datos.

**En resumen:** el sistema de autenticación de SeñaVida está completo,
probado y documentado. Es momento de compartir el avance con Nicoll para que
empiece a conectar su frontend. 🔐🎉

---

*Documento de aprendizaje — Proyecto SeñaVida · Fase 3 · Hito 4 · Cierre de Fase 3*
