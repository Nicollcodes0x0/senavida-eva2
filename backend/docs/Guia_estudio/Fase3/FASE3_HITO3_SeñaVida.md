# SeñaVida — Bitácora de Aprendizaje

## Fase 3 · Hito 3 — Middleware de validación refinado

> **¿Qué es este documento?**
> Es el resumen, con lenguaje sencillo (de estudiante para estudiante), de cómo
> completamos las **5 validaciones del login** que exige el contrato del
> proyecto: agregamos el **límite de intentos (rate limiting)** y la
> **verificación de pertenencia a centro y unidad**. Probamos ambas de punta a
> punta con Postman, incluido el ciclo completo de bloqueo y liberación.

---

## Índice

1. [¿Qué hicimos en este hito?](#1-qué-hicimos-en-este-hito)
2. [Las 5 validaciones del login](#2-las-5-validaciones-del-login)
3. [Los conceptos nuevos explicados fácil](#3-los-conceptos-nuevos-explicados-fácil)
   - [¿Qué es el rate limiting?](#qué-es-el-rate-limiting)
   - [Cómo funciona RateLimiter en Laravel](#cómo-funciona-ratelimiter-en-laravel)
   - [La regla `sometimes`](#la-regla-sometimes)
   - [Verificar pertenencia a una relación](#verificar-pertenencia-a-una-relación)
4. [El código explicado](#4-el-código-explicado)
5. [La prueba completa que hicimos](#5-la-prueba-completa-que-hicimos)
6. [Todo lo que hicimos, paso a paso](#6-todo-lo-que-hicimos-paso-a-paso)
7. [Glosario rápido](#7-glosario-rápido)
8. [Qué sigue](#8-qué-sigue)

---

## 1. ¿Qué hicimos en este hito?

En el Hito 1 construimos el login con 3 de las 5 validaciones que pide el
contrato. En este hito completamos las **2 que faltaban**:

- **Límite de intentos** — bloquear temporalmente a quien falle demasiadas
  veces seguidas.
- **Pertenencia a centro y unidad** — verificar que el usuario realmente
  pertenezca al centro/unidad que indica al iniciar sesión.

---

## 2. Las 5 validaciones del login

El contrato especifica este orden exacto:

| # | Validación | Código si falla | Estado |
|---|---|---|---|
| a | Formato de los campos | 422 | ✅ Hito 1 |
| b | Límite de intentos | 429 | ✅ **Este hito** |
| c | Credenciales correctas | 422 | ✅ Hito 1 |
| d | Usuario activo | 403 | ✅ Hito 1 |
| e | Pertenencia a centro y unidad | 403 | ✅ **Este hito** |

Con este hito, el login cumple el flujo **completo**.

---

## 3. Los conceptos nuevos explicados fácil

### ¿Qué es el rate limiting?

**Rate limiting** (límite de tasa) significa **limitar cuántas veces se puede
intentar algo en un período de tiempo**. Aquí lo usamos para el login: si alguien
falla la contraseña muchas veces seguidas, lo bloqueamos temporalmente.

**Analogía:** un cajero automático que **bloquea la tarjeta después de 3 intentos
fallidos de PIN**. No es que sospeche de una persona en particular; es una
protección general contra quien intente adivinar por fuerza bruta.

Sin esto, un atacante podría probar miles de contraseñas por segundo hasta dar
con la correcta. Con el límite, después de pocos intentos queda bloqueado un
rato.

### Cómo funciona RateLimiter en Laravel

Laravel trae una herramienta lista: `RateLimiter`. Las funciones que usamos:

- **`tooManyAttempts($clave, $máximo)`** → pregunta *"¿esta clave ya superó el
  máximo de intentos?"*. Devuelve verdadero/falso.
- **`hit($clave, $segundos)`** → suma un intento a esa clave, y fija que el
  contador se resetea tras esa cantidad de segundos sin actividad.
- **`clear($clave)`** → borra el contador (lo usamos cuando el login es
  exitoso, para no castigar a alguien que ya entró bien).
- **`availableIn($clave)`** → cuántos segundos faltan para poder reintentar.

**La "clave" (throttle key):** combinamos el email y la IP:
```php
$throttleKey = 'login:'.strtolower($credentials['email']).'|'.$request->ip();
```
Así, el límite es *por combinación de email+IP*, no global — no bloqueamos a todo
el mundo si una sola persona falla mucho.

### La regla `sometimes`

```php
'healthCenterId' => ['sometimes', 'uuid'],
```

**`sometimes`** es una regla de validación especial: significa *"valida este
campo SOLO SI viene en la petición"*. Si no lo mandan, no pasa nada. Si lo
mandan, debe cumplir las reglas siguientes (`uuid`, en este caso).

Se usa cuando un campo es **opcional**, pero si llega, debe tener el formato
correcto.

### Verificar pertenencia a una relación

```php
if (isset($credentials['healthCenterId']) && $user->health_center_id !== $credentials['healthCenterId']) {
    return response()->json([...], 403);
}
```

Esto compara el `healthCenterId` que envía el frontend con el que **realmente
tiene guardado** el usuario (de la Fase 2, cuando conectamos User con
HealthCenter). Si no coinciden, significa que alguien está tratando de entrar a
un centro que no le corresponde → error 403.

---

## 4. El código explicado

El método `login()` completo, con los pasos numerados:

```php
public function login(Request $request): JsonResponse
{
    // 1. Validar formato (incluye centro/unidad opcionales)
    $credentials = $request->validate([
        'email'          => ['required', 'email'],
        'password'       => ['required', 'string'],
        'healthCenterId' => ['sometimes', 'uuid'],
        'unitId'         => ['sometimes', 'uuid'],
    ]);

    // 2. Límite de intentos
    $throttleKey = 'login:'.strtolower($credentials['email']).'|'.$request->ip();
    if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
        $seconds = RateLimiter::availableIn($throttleKey);
        return response()->json([...], 429);
    }

    // 3. Buscar usuario
    $user = User::where('email', $credentials['email'])->first();

    // 4. Verificar credenciales
    if (! $user || ! Hash::check($credentials['password'], $user->password)) {
        RateLimiter::hit($throttleKey, 60);   // suma un intento fallido
        throw ValidationException::withMessages([...]);
    }

    RateLimiter::clear($throttleKey);   // login correcto: limpiamos el contador

    // 5. Verificar activo
    if (! $user->is_active) {
        return response()->json([...], 403);
    }

    // 6. Verificar centro y unidad (si se enviaron)
    if (isset($credentials['healthCenterId']) && $user->health_center_id !== $credentials['healthCenterId']) {
        return response()->json([...], 403);
    }
    if (isset($credentials['unitId']) && $user->unit_id !== $credentials['unitId']) {
        return response()->json([...], 403);
    }

    // 7. Crear token y responder
    $token = $user->createToken('auth-token')->plainTextToken;
    return response()->json([...], 200);
}
```

---

## 5. La prueba completa que hicimos

1. **Login correcto** → funcionó normal, token generado. ✅
2. **6 intentos con contraseña incorrecta:**
   - Intentos 1 a 5 → `422` ("Las credenciales no son correctas").
   - Intento 6 → **`429`** ("Demasiados intentos. Intenta de nuevo en 50
     segundos"). ✅
3. **Esperamos el tiempo indicado**, y volvimos a intentar con la contraseña
   **correcta** → **`200`** con un token nuevo. ✅

Esto demuestra el **ciclo completo**: el sistema bloquea temporalmente, pero no
castiga para siempre — pasado el tiempo (o con la credencial correcta), vuelve a
la normalidad.

> Detalle interesante: el mensaje decía "50 segundos" y no "60", porque el
> contador ya llevaba corriendo desde el primer intento fallido. El tiempo
> restante se calcula en tiempo real.

---

## 6. Todo lo que hicimos, paso a paso

1. **Agregamos las reglas `sometimes` + `uuid`** para `healthCenterId` y
   `unitId` en la validación.
2. **Agregamos el rate limiting**: `tooManyAttempts`, `hit`, `clear`,
   `availableIn`.
3. **Agregamos las dos verificaciones de pertenencia** (centro y unidad).
4. **Probamos el login normal** → siguió funcionando. ✅
5. **Forzamos 6 intentos fallidos** → el 6to devolvió `429`. ✅
6. **Esperamos y reintentamos con la contraseña correcta** → funcionó y limpió
   el bloqueo. ✅

---

## 7. Glosario rápido

- **Rate limiting:** limitar cuántas veces se puede intentar algo en un tiempo.
- **`RateLimiter`:** herramienta de Laravel para implementar rate limiting.
- **Throttle key:** la "etiqueta" que identifica a quién se le está contando
  los intentos (aquí: email + IP).
- **`tooManyAttempts()`:** pregunta si ya se superó el máximo de intentos.
- **`hit()`:** suma un intento.
- **`clear()`:** borra el contador (tras éxito).
- **`availableIn()`:** segundos que faltan para poder reintentar.
- **`sometimes`:** regla de validación que solo aplica si el campo viene en la
  petición.
- **429:** código HTTP de "demasiadas peticiones".

---

## 8. Qué sigue

La **Fase 3 (Autenticación real)** va así:

- ✅ **Hito 1 — Login del personal**
- ✅ **Hito 2 — Endpoint `/me` y Logout**
- ✅ **Hito 3 — Middleware de validación refinado** *(¡completado! Es este
  documento.)*
- ⏳ **Hito 4 — Registro de usuarios:** el último hito de la fase. Con él se
  cierra el **indicador 3 de la rúbrica** (registro con cifrado de clave) y toda
  la Fase 3.

**En resumen:** tu login ahora cumple las 5 validaciones completas que pide el
contrato, con protección real contra ataques de fuerza bruta. Es un sistema de
autenticación sólido y profesional. 🔐

---

*Documento de aprendizaje — Proyecto SeñaVida · Fase 3 · Hito 3*
