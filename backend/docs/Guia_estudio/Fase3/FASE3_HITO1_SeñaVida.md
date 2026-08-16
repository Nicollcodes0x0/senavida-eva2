# SeñaVida — Bitácora de Aprendizaje

## Fase 3 · Hito 1 — Login del personal

> **¿Qué es este documento?**
> Es el resumen, con lenguaje sencillo (de estudiante para estudiante), de cómo
> construimos el **login** de SeñaVida: el endpoint que recibe email y
> contraseña, verifica las credenciales y devuelve un **token Sanctum**. Este es
> el hito donde por fin viste toda la Fase 1 y la Fase 2 trabajando juntas.

---

## Índice

1. [¿Qué hicimos en este hito?](#1-qué-hicimos-en-este-hito)
2. [Los conceptos nuevos explicados fácil](#2-los-conceptos-nuevos-explicados-fácil)
   - [¿Qué es un Controlador?](#qué-es-un-controlador)
   - [¿Qué es una Ruta de API?](#qué-es-una-ruta-de-api)
   - [Agrupar rutas con prefix](#agrupar-rutas-con-prefix)
   - [¿Qué es un Form Request (validación)?](#qué-es-un-form-request-validación)
   - [¿Qué es Hash::check?](#qué-es-hashcheck)
   - [¿Qué es Postman?](#qué-es-postman)
3. [El método login explicado paso a paso](#3-el-método-login-explicado-paso-a-paso)
4. [El flujo completo del login](#4-el-flujo-completo-del-login)
5. [El error que tuvimos con UUID en Sanctum](#5-el-error-que-tuvimos-con-uuid-en-sanctum)
6. [Todo lo que hicimos, paso a paso](#6-todo-lo-que-hicimos-paso-a-paso)
7. [Glosario rápido](#7-glosario-rápido)
8. [Qué sigue](#8-qué-sigue)

---

## 1. ¿Qué hicimos en este hito?

Construimos el **login real** del sistema: el endpoint
`POST /api/v1/auth/login`. Un usuario envía su email y contraseña, el backend los
verifica, y si son correctos, le devuelve un **token** que usará para acceder al
resto de la API.

Este es el **"inicio de sesión"** que pide el indicador 2 de la rúbrica, y lo
probamos de verdad con Postman: **funcionó y devolvió un token real.**

---

## 2. Los conceptos nuevos explicados fácil

### ¿Qué es un Controlador?

Un **controlador** es la clase que **maneja las peticiones**. Cuando llega una
petición a una URL, el controlador decide qué hacer con ella: validar datos,
buscar información, y devolver una respuesta.

**Analogía:** el controlador es el **recepcionista de un hotel**. Recibe tu
solicitud ("quiero hacer check-in"), verifica tus datos, y te da la respuesta (tu
llave o un "lo siento, no hay reserva"). No hace el trabajo pesado él mismo;
coordina.

Creamos `AuthController`, que maneja las acciones de autenticación (por ahora,
`login`).

### ¿Qué es una Ruta de API?

Una **ruta** conecta una **URL** con el **código** que se ejecuta. Viven en
`routes/api.php`.

```php
Route::post('/auth/login', [AuthController::class, 'login']);
```
> "Cuando llegue un POST a /auth/login, ejecuta el método `login` del
> AuthController."

**Analogía:** es como el **directorio de un edificio**: "¿buscas login? ve a la
oficina AuthController, método login".

### Agrupar rutas con prefix

Usamos `Route::prefix('v1')->group(...)` para que todas las rutas de dentro
compartan el prefijo `/v1` automáticamente, sin repetirlo en cada línea:

```php
Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
    // más rutas aquí, todas con /v1 automático
});
```

Como Laravel ya agrega `/api` a todo lo que está en `api.php`, el resultado final
es: **`/api` + `/v1` + `/auth/login`** = `POST /api/v1/auth/login`, justo lo que
pide el contrato.

### ¿Qué es un Form Request (validación)?

Es una forma de **revisar que los datos que llegan cumplan ciertas reglas**,
antes de procesarlos.

En este hito la hicimos directo en el controlador:
```php
$credentials = $request->validate([
    'email'    => ['required', 'email'],
    'password' => ['required', 'string'],
]);
```
- `required` → obligatorio.
- `email` → debe tener formato de correo válido.
- `string` → debe ser texto.

Si algo falla, Laravel **automáticamente** devuelve un error 422 con el detalle.
No hay que escribir ese manejo a mano.

> **Nota:** el contrato del proyecto sugiere usar **Form Requests** como clases
> separadas (un archivo aparte solo para validar). Aquí lo hicimos simple, dentro
> del controlador. Más adelante podemos extraerlo a una clase propia si se
> necesita más orden.

### ¿Qué es Hash::check?

**`Hash::check($textoPlano, $textoCifrado)`** compara una contraseña que alguien
escribió (texto normal) con la versión **cifrada** que está guardada en la base
de datos, y dice si coinciden.

**¿Por qué no comparar directo con `==`?** Porque la contraseña en la base
**nunca** se guarda en texto plano (recuerda el `'password' => 'hashed'` de la
Fase 2). Está cifrada, así que hay que usar una función especial que sepa
comparar sin necesidad de "descifrar" (de hecho, un hash no se puede
descifrar — solo se puede comparar).

**Analogía:** es como comparar una huella dactilar con un molde guardado. No
"conviertes" el molde de vuelta a un dedo; usas una herramienta especial que
sabe si coinciden.

### ¿Qué es Postman?

**Postman** es una aplicación que te permite **probar APIs enviando peticiones**
sin necesitar una pantalla o frontend. Eliges el método (GET, POST...), la URL, y
qué datos enviar, y ves la respuesta.

Es la herramienta ideal para probar tu backend **antes** de que exista el
frontend que lo consuma. La usamos para probar el login enviando un `POST` con
email y contraseña, y ver si devolvía el token.

---

## 3. El método login explicado paso a paso

```php
public function login(Request $request): JsonResponse
{
    // 1. Validar formato
    $credentials = $request->validate([
        'email'    => ['required', 'email'],
        'password' => ['required', 'string'],
    ]);

    // 2. Buscar al usuario
    $user = User::where('email', $credentials['email'])->first();

    // 3. Verificar credenciales
    if (! $user || ! Hash::check($credentials['password'], $user->password)) {
        throw ValidationException::withMessages([...]);
    }

    // 4. Verificar que esté activo
    if (! $user->is_active) {
        return response()->json([...], 403);
    }

    // 5. Crear el token
    $token = $user->createToken('auth-token')->plainTextToken;

    // 6. Devolver la respuesta
    return response()->json([...], 200);
}
```

- **Bloque 1:** revisa que lleguen email y password con formato válido.
- **Bloque 2:** busca en la tabla `users` uno con ese email.
- **Bloque 3:** comprueba que el usuario exista **y** que la contraseña
  coincida. Si algo falla, da el **mismo mensaje genérico** (para no revelar si
  un email existe o no — buena práctica de seguridad).
- **Bloque 4:** revisa `is_active`. Si está desactivado, error 403.
- **Bloque 5:** `createToken()` — el poder que le dio `HasApiTokens` al modelo
  User en la Fase 1 — genera el token de Sanctum.
- **Bloque 6:** devuelve el token y los datos del usuario, con el envoltorio
  estándar (`success`, `data`) del contrato.

---

## 4. El flujo completo del login

```
1. Postman envía POST /api/v1/auth/login con { email, password }
2. La ruta en api.php dirige la petición al AuthController@login
3. El controlador valida el formato de los datos
4. Busca al usuario por su email
5. Compara la contraseña con Hash::check (contra la versión cifrada)
6. Verifica que el usuario esté activo
7. Sanctum genera un token con createToken()
8. Se devuelve el token + los datos del usuario, en JSON
```

Cada pieza que construiste en fases anteriores (User con UUID, Sanctum, el
cifrado de contraseña) se usó en este flujo. Por eso este hito se sintió como "ver
todo junto funcionando".

---

## 5. El error que tuvimos con UUID en Sanctum

Al primer intento, Postman devolvió un error `500`:
```
Invalid text representation: la sintaxis de entrada no es válida para tipo bigint
```

**Por qué:** la tabla `personal_access_tokens` (de Sanctum) tenía una columna
`tokenable_id` de tipo **número** (creada con `$table->morphs('tokenable')`),
pero nuestros usuarios usan **UUID**. Sanctum no podía guardar un UUID en una
columna numérica.

**Cómo lo resolvimos:** cambiamos esa línea en la migración de Sanctum:
```php
$table->morphs('tokenable');        →   $table->uuidMorphs('tokenable');
```
`uuidMorphs` crea la columna `tokenable_id` como UUID, compatible con nuestros
usuarios. Recreamos las tablas (`migrate:fresh`) y el login funcionó.

**Lección:** es el mismo tipo de ajuste que ya habíamos hecho con la tabla
`sessions` en la Fase 2 (cambiar `foreignId` por `foreignUuid`). Cada vez que
Laravel trae algo "de fábrica" pensado para IDs numéricos, hay que revisar si
necesita su versión UUID.

---

## 6. Todo lo que hicimos, paso a paso

1. **Creamos el controlador:**
   ```bash
   php artisan make:controller Api/V1/AuthController
   ```
   (En la carpeta `Api/V1/`, organizando por versión de API.)

2. **Escribimos el método `login`** con los 6 pasos: validar, buscar, verificar
   credenciales, verificar activo, crear token, responder.

3. **Creamos la ruta** en `routes/api.php`, agrupada bajo `prefix('v1')`.

4. **Verificamos con `route:list`** que la ruta apareciera registrada.

5. **Creamos un usuario de prueba con Tinker** para poder probar el login.

6. **Levantamos el servidor** con `php artisan serve`.

7. **Probamos con Postman** → apareció el error 500 de UUID.

8. **Corregimos la migración de Sanctum** (`uuidMorphs`), recreamos las tablas y
   el usuario de prueba.

9. **Probamos de nuevo con Postman** → 🎉 **el login devolvió el token.**

---

## 7. Glosario rápido

- **Controlador (Controller):** clase que maneja las peticiones.
- **Ruta (Route):** conecta una URL con el código que se ejecuta.
- **`Route::prefix(...)->group(...)`:** agrupa rutas bajo un prefijo común.
- **Form Request / `validate()`:** revisa que los datos cumplan reglas antes de
  procesarlos.
- **`Hash::check()`:** compara una contraseña en texto plano con su versión
  cifrada.
- **`createToken()`:** método de Sanctum que genera un token de acceso.
- **Postman:** app para probar APIs enviando peticiones manuales.
- **`morphs` / `uuidMorphs`:** crean columnas polimórficas; la segunda usa UUID
  en vez de número.
- **Envoltorio estándar:** el formato `{ "success": ..., "data": ... }` que usan
  todas las respuestas de la API.

---

## 8. Qué sigue

La **Fase 3 (Autenticación real)** va así:

- ✅ **Hito 1 — Login del personal** *(¡completado! Es este documento.)*
- ⏳ **Hito 2 — Endpoint `/me` y logout:** ver quién soy con el token, y cerrar
  sesión revocándolo. Usaremos el token que generaste hoy.
- ⏳ **Hito 3 — Middleware de validación:** proteger rutas para que solo entren
  usuarios con token válido.
- ⏳ **Hito 4 — Registro de usuarios:** crear cuentas con contraseña cifrada
  (indicador 3 de la rúbrica).

**En resumen:** el login ya funciona de verdad, probado con una herramienta real
(Postman) y devolviendo un token de Sanctum auténtico. Es la base de toda la
seguridad del sistema. 🔐

---

*Documento de aprendizaje — Proyecto SeñaVida · Fase 3 · Hito 1*
