# SeñaVida — Bitácora de Aprendizaje

## Fase 3 · Hito 2 — Endpoint `/me` y Logout

> **¿Qué es este documento?**
> Es el resumen, con lenguaje sencillo (de estudiante para estudiante), de cómo
> construimos y probamos **`/me`** (ver quién soy) y **`/logout`** (cerrar sesión
> de verdad), protegidos por un **middleware**. En el camino resolvimos dos
> errores de configuración típicos de una API Laravel, y confirmamos con Postman
> que la revocación del token es real.

---

## Índice

1. [¿Qué hicimos en este hito?](#1-qué-hicimos-en-este-hito)
2. [Los conceptos nuevos explicados fácil](#2-los-conceptos-nuevos-explicados-fácil)
   - [¿Qué es un middleware?](#qué-es-un-middleware)
   - [Cómo proteger rutas con middleware](#cómo-proteger-rutas-con-middleware)
   - [`$request->user()`](#requestuser)
   - [Revocar un token de verdad](#revocar-un-token-de-verdad)
3. [Los métodos me() y logout() explicados](#3-los-métodos-me-y-logout-explicados)
4. [Los dos errores que resolvimos](#4-los-dos-errores-que-resolvimos)
5. [Las tres pruebas que hicimos en Postman](#5-las-tres-pruebas-que-hicimos-en-postman)
6. [Todo lo que hicimos, paso a paso](#6-todo-lo-que-hicimos-paso-a-paso)
7. [Glosario rápido](#7-glosario-rápido)
8. [Qué sigue](#8-qué-sigue)

---

## 1. ¿Qué hicimos en este hito?

Construimos dos endpoints que trabajan con el token generado en el login:

- **`GET /api/v1/auth/me`** → devuelve los datos del usuario dueño del token.
- **`POST /api/v1/auth/logout`** → revoca el token (cierra sesión de verdad).

Ambos quedaron **protegidos** por un middleware, y los probamos a fondo con
Postman, incluyendo confirmar que un token usado para logout **deja de servir**
después.

---

## 2. Los conceptos nuevos explicados fácil

### ¿Qué es un middleware?

Un **middleware** es un "guardia" que se ejecuta **antes** de que la petición
llegue al controlador. Revisa algo y decide: ¿dejo pasar o rechazo?

**Analogía:** el guardia de seguridad en la puerta de un edificio de oficinas.
Revisa tu credencial (el token) antes de dejarte entrar al piso. Si no tienes
credencial válida, no pasas del lobby — ni siquiera llegas al recepcionista (el
controlador).

Usamos el middleware `auth:sanctum`, que revisa la cabecera
`Authorization: Bearer {token}` y decide si el token es válido.

### Cómo proteger rutas con middleware

En `routes/api.php`:

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
});
```

Todas las rutas **dentro** de este grupo pasan primero por el guardia. Si el
token falta o es inválido, el guardia rechaza con **401** automáticamente — el
controlador ni se entera.

`/login` queda **fuera** de este grupo a propósito: para hacer login todavía no
tienes token — es donde lo consigues. No le puedes pedir credencial a alguien
para dejarlo entrar a la oficina donde se la **dan**.

### `$request->user()`

Cuando el middleware deja pasar una petición, "engancha" al usuario dueño del
token a la petición. Dentro del controlador, `$request->user()` te da
**directamente** ese usuario, sin tener que buscarlo a mano (no repetimos el
`User::where(...)` del login).

### Revocar un token de verdad

```php
$request->user()->currentAccessToken()->delete();
```

- `currentAccessToken()` → obtiene **el token específico** que se usó en esta
  petición (un usuario puede tener varios tokens, por ejemplo desde el celular y
  la computadora a la vez).
- `->delete()` → lo **borra de la base de datos**.

**¿Por qué borrar y no solo "olvidar" en el cliente?** Porque si el frontend solo
borra el token de su lado, el token **sigue siendo válido** en el servidor.
Cualquiera que lo tenga (por ejemplo, alguien que lo copió) podría seguir
usándolo. Borrarlo en el servidor es la única forma de invalidarlo de verdad.

---

## 3. Los métodos me() y logout() explicados

```php
public function me(Request $request): JsonResponse
{
    $user = $request->user();

    return response()->json([
        'success' => true,
        'data'    => ['user' => [...]],
    ], 200);
}

public function logout(Request $request): JsonResponse
{
    $request->user()->currentAccessToken()->delete();

    return response()->json(['success' => true], 200);
}
```

Ninguno de los dos verifica el token "a mano" — esa verificación ya la hizo el
**middleware** antes de que la petición llegara aquí. El controlador **confía**
en que si llegó hasta él, ya está autenticado. Esa es la división de
responsabilidades: el middleware protege, el controlador actúa.

---

## 4. Los dos errores que resolvimos

Al probar `/me` **sin token**, en vez de un 401 limpio, apareció un error 500:
```
Route [login] not defined.
```

**Por qué:** por defecto, cuando Laravel detecta que alguien no está
autenticado, intenta **redirigir** a una página llamada `login` — un
comportamiento pensado para sitios web con páginas, no para una API pura. Como tu
proyecto no tiene esa página (eres una API), la redirección fallaba.

**Cómo lo resolvimos**, en `bootstrap/app.php`, con dos ajustes:

**1. Evitar el intento de redirección para rutas de la API:**
```php
$middleware->redirectGuestsTo(function (Request $request) {
    return $request->is('api/*') ? null : '/';
});
```
Le dice a Laravel: *"si la petición es de la API, no redirijas a ningún lado."*

**2. Responder con JSON limpio cuando falta autenticación:**
```php
$exceptions->render(function (AuthenticationException $e, Request $request) {
    if ($request->is('api/*')) {
        return response()->json([
            'success' => false,
            'error'   => ['message' => 'No autenticado.'],
        ], 401);
    }
});
```

**Lección de diagnóstico:** el primer intento de arreglo (solo el `render()`) no
bastó, porque el error ocurría **un paso antes**, al intentar calcular la URL de
redirección. Leyendo el **stack trace** (la lista de dónde pasó cada cosa) se
encontró la causa exacta y se corrigió de raíz con el `redirectGuestsTo`.

---

## 5. Las tres pruebas que hicimos en Postman

**Prueba 1 — `/me` sin token:**
```json
{"success": false, "error": {"message": "No autenticado."}}
```
→ 401. El guardia rechazó correctamente. ✅

**Prueba 2 — `/me` con token válido:**
```json
{"success": true, "data": {"user": {...}}}
```
→ 200. El guardia dejó pasar y el controlador devolvió los datos. ✅

**Prueba 3 — Logout, y luego reusar el mismo token:**
```json
// Logout:
{"success": true}

// /me con el mismo token, después del logout:
{"success": false, "error": {"message": "No autenticado."}}
```
→ El token quedó **revocado de verdad** en el servidor. ✅

> **Nota de la práctica:** en un intento, la petición fue por error a
> `postman-echo.com` en vez de a `127.0.0.1:8000` (la URL se había cambiado sin
> querer). Recordatorio útil: **siempre revisar la URL** antes de enviar una
> petición en Postman.

---

## 6. Todo lo que hicimos, paso a paso

1. **Agregamos `me()` y `logout()`** al `AuthController`.
2. **Creamos las rutas** protegidas con `Route::middleware('auth:sanctum')`.
3. **Verificamos con `route:list`** que las tres rutas de auth estuvieran
   registradas.
4. **Probamos `/me` sin token** → apareció el error 500 de redirección.
5. **Corregimos `bootstrap/app.php`** con `redirectGuestsTo` y `render()`.
6. **Volvimos a probar `/me` sin token** → 401 limpio. ✅
7. **Probamos `/me` con token** (usando la pestaña Authorization → Bearer Token
   de Postman) → 200 con los datos. ✅
8. **Probamos el logout**, y luego reusamos el mismo token en `/me` → 401,
   confirmando la revocación real. ✅

---

## 7. Glosario rápido

- **Middleware:** guardia que revisa una petición antes de que llegue al
  controlador.
- **`auth:sanctum`:** middleware que verifica el Bearer token de Sanctum.
- **`Route::middleware(...)->group(...)`:** agrupa rutas protegidas por un
  middleware.
- **`$request->user()`:** devuelve el usuario dueño del token de la petición
  actual (gracias al middleware).
- **`currentAccessToken()`:** el token específico usado en la petición actual.
- **Revocar un token:** borrarlo del servidor para que deje de ser válido.
- **`redirectGuestsTo`:** configura a dónde redirigir a alguien sin sesión (o que
  no redirija, en el caso de una API).
- **Stack trace:** la lista de pasos donde ocurrió un error; ayuda a encontrar la
  causa real.

---

## 8. Qué sigue

La **Fase 3 (Autenticación real)** va así:

- ✅ **Hito 1 — Login del personal**
- ✅ **Hito 2 — Endpoint `/me` y Logout** *(¡completado! Es este documento.)*
- ⏳ **Hito 3 — Refinar el middleware de validación:** completar las
  validaciones que faltaban del login (centro/unidad, límite de intentos).
- ⏳ **Hito 4 — Registro de usuarios:** crear cuentas con contraseña cifrada
  (indicador 3 de la rúbrica, el último que falta cubrir).

**En resumen:** ya tienes autenticación funcionando de punta a punta — login,
verificación de identidad, y cierre de sesión real. El sistema ya sabe distinguir
quién entra y quién no. 🔐

---

*Documento de aprendizaje — Proyecto SeñaVida · Fase 3 · Hito 2*
