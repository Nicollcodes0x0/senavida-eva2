# SeñaVida — Bitácora de Aprendizaje

## Fase 1 · Hito 2 — Instalación de Laravel Sanctum

> **¿Qué es este documento?**
> Es el resumen, con lenguaje sencillo (de estudiante para estudiante), de todo
> lo que hicimos para instalar y configurar **Laravel Sanctum**, el sistema que
> le dará seguridad (autenticación por token) a la API de SeñaVida. Cada palabra
> técnica se explica apenas aparece, con ejemplos de la vida real.

---

## Índice

1. [¿Qué hicimos en este hito?](#1-qué-hicimos-en-este-hito)
2. [Los conceptos nuevos explicados fácil](#2-los-conceptos-nuevos-explicados-fácil)
   - [¿Qué es autenticación?](#qué-es-autenticación)
   - [¿Qué es un token?](#qué-es-un-token)
   - [¿Qué es Laravel Sanctum?](#qué-es-laravel-sanctum)
   - [¿Qué es un Bearer token?](#qué-es-un-bearer-token)
   - [¿Qué es un trait?](#qué-es-un-trait)
   - [Los dos tipos de `use`](#los-dos-tipos-de-use)
   - [¿Qué es un modelo (Model)?](#qué-es-un-modelo-model)
   - [¿Qué es routes/api.php?](#qué-es-routesapiphp)
3. [Todo lo que hicimos, paso a paso](#3-todo-lo-que-hicimos-paso-a-paso)
4. [El flujo: cómo funcionará el login con Sanctum](#4-el-flujo-cómo-funcionará-el-login-con-sanctum)
5. [Detalle del cambio en el modelo User](#5-detalle-del-cambio-en-el-modelo-user)
6. [Cosas que aprendimos por el camino](#6-cosas-que-aprendimos-por-el-camino)
7. [Glosario rápido](#7-glosario-rápido)
8. [Qué sigue](#8-qué-sigue)

---

## 1. ¿Qué hicimos en este hito?

Instalamos **Laravel Sanctum**, la herramienta que se encargará de la
**seguridad de la API**: decidir quién puede entrar y quién no.

Importante: en este hito **solo instalamos y preparamos** la herramienta. Todavía
**no construimos el login** (eso viene en la Fase 3). Es como instalar la
cerradura de una puerta antes de empezar a repartir llaves.

---

## 2. Los conceptos nuevos explicados fácil

### ¿Qué es autenticación?

**Autenticación** es el proceso de **comprobar que alguien es quien dice ser**.

Ejemplo de la vida real: cuando entras a tu banco por internet, escribes tu
usuario y contraseña. El banco comprueba que sean correctos: eso es
autenticación. Si son correctos, te deja entrar; si no, te rechaza.

En SeñaVida, el personal de salud tendrá que autenticarse (con correo y
contraseña) antes de poder ver datos de pacientes.

> **Ojo:** no es lo mismo *autenticación* que *autorización*.
> - **Autenticación** = ¿quién eres? (comprobar tu identidad)
> - **Autorización** = ¿qué tienes permitido hacer? (comprobar tus permisos)

### ¿Qué es un token?

Un **token** es un **texto largo y único** que el servidor le da a una persona
cuando se autentica correctamente. Funciona como una **credencial temporal**.

Analogía: es como la **pulsera de un festival**. Cuando muestras tu entrada
válida en la puerta (te autenticas), te ponen una pulsera (token). Después, en
cada puesto de comida o escenario, solo muestras la pulsera y te dejan pasar, sin
tener que mostrar la entrada otra vez.

En una API, el token cumple ese papel: te identificas una vez, recibes el token,
y luego lo muestras en cada petición.

### ¿Qué es Laravel Sanctum?

**Sanctum** es un **paquete oficial de Laravel** que se encarga de **crear,
verificar y revocar tokens**. Es la herramienta que gestiona toda la seguridad
por token de tu API.

Lo que hace Sanctum:
- Cuando alguien hace login correcto → **crea un token** y se lo entrega.
- En cada petición siguiente → **verifica** que el token sea válido.
- Cuando alguien cierra sesión → **revoca** (elimina) el token.

Siguiendo la analogía del festival: **Sanctum es el sistema de pulseras
completo** — la máquina que las imprime, el personal que las revisa en cada
puesto, y quien te la corta al salir.

### ¿Qué es un Bearer token?

**Bearer** significa "portador" en inglés. Un **Bearer token** es simplemente un
token que se envía en cada petición dentro de una cabecera especial llamada
`Authorization`, así:

```
Authorization: Bearer <el-token-aquí>
```

"Bearer" quiere decir que **quien porta (lleva) el token, tiene acceso** — igual
que quien lleva la pulsera del festival puede entrar. Por eso es importante no
compartir el token con nadie: quien lo tenga, entra.

En SeñaVida usamos Bearer tokens porque son el estándar de las **API REST** y son
simples de manejar entre dos proyectos separados (backend y frontend).

### ¿Qué es un trait?

Un **trait** es como un **paquete de habilidades** que le agregas a una clase de
código. En vez de escribir el mismo código en muchos lugares, pones el trait y la
clase "hereda" esas capacidades.

Analogía: es como darle a un **personaje de videojuego un poder extra**. El trait
`HasApiTokens` le da a tu modelo `User` el poder de **crear y manejar tokens**
(con funciones como `createToken()`). Sin ese trait, el `User` no sabría generar
tokens.

En este hito, agregamos el trait `HasApiTokens` al modelo `User` para darle ese
poder.

### Los dos tipos de `use`

En PHP, la palabra `use` aparece en **dos lugares distintos** y significan cosas
diferentes. Esto confunde al principio, así que ojo:

**1. `use` arriba del archivo → IMPORTAR**

```php
use Laravel\Sanctum\HasApiTokens;
```
Esto le dice a PHP **dónde encontrar** la herramienta. Es como decir "voy a usar
esta herramienta que está guardada en la librería de Sanctum".

**2. `use` dentro de la clase → ACTIVAR**

```php
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
}
```
Esto **activa** el trait dentro del modelo. Es lo que realmente le da el poder al
`User`.

**Necesitas los dos.** El de arriba dice *dónde está* la herramienta; el de
adentro la *enciende*. Es como: primero traes la lámpara a la casa (importar) y
luego la enchufas (activar).

### ¿Qué es un modelo (Model)?

Un **modelo** es una **clase de PHP que representa una tabla** de la base de
datos. Cada modelo es el "espejo" de una tabla.

Ejemplo: el modelo `User` representa la tabla `users`. Cuando escribes
`User::all()`, Laravel va a la tabla `users` y te trae todos los usuarios, sin
que tengas que escribir SQL a mano.

Los modelos viven en la carpeta `app/Models/`. En este hito editamos
`app/Models/User.php`.

> Los modelos son parte de **Eloquent**, el ORM de Laravel (la herramienta que
> convierte tablas en objetos PHP, que ya vimos en el Hito 1).

### ¿Qué es routes/api.php?

Es el **archivo donde viven las rutas de la API**. Una "ruta" conecta una URL con
el código que se ejecuta.

Al instalar Sanctum con `install:api`, Laravel creó este archivo automáticamente.
Todas las rutas de tu API (login, pacientes, sesiones, etc.) vivirán aquí, bajo
el prefijo `/api/v1`.

Ejemplo de una ruta que crearemos más adelante:
```php
Route::post('/auth/login', [AuthController::class, 'login']);
```
> "Cuando alguien envíe un POST a /auth/login, ejecuta el método `login` del
> AuthController."

---

## 3. Todo lo que hicimos, paso a paso

1. **Confirmamos que estábamos en el proyecto correcto.** (Hubo un enredo de
   carpetas con nombres parecidos; aprendimos a verificar la ruta con `pwd`.)

2. **Instalamos Sanctum** con el comando oficial de Laravel para APIs:
   ```bash
   php artisan install:api
   ```
   Este comando hizo varias cosas por nosotras:
   - Descargó el paquete Sanctum.
   - Creó la migración de la tabla `personal_access_tokens` (donde se guardan los
     tokens).
   - Creó el archivo `routes/api.php`.
   - Corrió las migraciones (respondimos `yes`).

3. **Verificamos que la tabla de tokens se creó** en PostgreSQL:
   ```bash
   php artisan migrate:status
   ```
   Vimos `personal_access_tokens ... Ran` ✅

4. **Agregamos el trait `HasApiTokens`** al modelo `User`, en dos lugares:
   - `use Laravel\Sanctum\HasApiTokens;` (arriba, para importar)
   - `use HasApiTokens, HasFactory, Notifiable;` (dentro de la clase, para activar)

5. **Comprobamos que no había errores** con:
   ```bash
   php artisan about
   ```
   Corrió sin problemas y confirmó que la base de datos es PostgreSQL (`pgsql`).

---

## 4. El flujo: cómo funcionará el login con Sanctum

Aunque todavía no construimos el login, así funcionará gracias a lo que
instalamos:

```
1. El usuario escribe su correo y contraseña   → POST /api/v1/auth/login
2. El backend comprueba que sean correctos      (autenticación)
3. Si son correctos, Sanctum CREA un token       → $user->createToken(...)
4. El backend le devuelve el token al frontend
5. El frontend guarda el token
6. En cada petición siguiente, el frontend lo envía:
        Authorization: Bearer <token>
7. Sanctum VERIFICA el token en cada petición    → deja pasar o rechaza (401)
8. Al cerrar sesión, Sanctum REVOCA el token      → el acceso termina
```

Lo que hicimos en este hito (instalar Sanctum + el trait) es lo que hace posible
los pasos 3, 7 y 8. Sin eso, el `User` no podría crear ni manejar tokens.

---

## 5. Detalle del cambio en el modelo User

Este fue el único archivo que editamos. Los dos cambios:

**Antes (sin Sanctum):**
```php
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;
```

**Después (con Sanctum):**
```php
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;          // ← línea nueva: IMPORTA el trait

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;   // ← ACTIVA el trait
```

Con esto, el modelo `User` ahora puede llamar a `createToken()`, que es lo que
usaremos en la Fase 3 para generar el token cuando alguien haga login.

> **Nota:** el `User.php` de este proyecto usa Laravel 13, que tiene una sintaxis
> algo distinta a versiones anteriores (usa `#[Fillable(...)]` y `#[Hidden(...)]`
> arriba de la clase, en vez de las viejas propiedades `$fillable` y `$hidden`).
> Eso no cambia nada del trait; solo es bueno saberlo.

---

## 6. Cosas que aprendimos por el camino

Además de Sanctum, en este hito pasaron cosas que dejan enseñanza:

- **El nombre de la carpeta de un proyecto Laravel no importa.** Renombramos la
  carpeta de `senavida-backend` a `senavida-backend-eva2` y el proyecto siguió
  funcionando perfecto. Laravel no depende del nombre de su carpeta.

- **Cuidado con tener el proyecto en varias ubicaciones.** Aparecieron carpetas
  con nombres parecidos en sitios distintos. Aprendimos a **verificar siempre la
  ruta** con `pwd` antes de trabajar, para no editar la copia equivocada.

- **`install:api` puede actualizar Laravel.** El comando dejó el proyecto en
  Laravel 13. No es problema: es una versión más nueva y todo sigue válido.

- **`php artisan about`** es un comando útil: muestra un resumen del proyecto
  (versión, base de datos, etc.) y, de paso, confirma que no hay errores de
  sintaxis en el código.

---

## 7. Glosario rápido

- **Autenticación:** comprobar que alguien es quien dice ser (identidad).
- **Autorización:** comprobar qué tiene permitido hacer (permisos).
- **Token:** texto único que sirve como credencial temporal tras autenticarse.
- **Bearer token:** token que se envía en la cabecera `Authorization: Bearer ...`.
- **Sanctum:** paquete de Laravel que crea, verifica y revoca tokens.
- **Trait:** paquete de habilidades que se agrega a una clase.
- **`HasApiTokens`:** el trait que le da al modelo User el poder de manejar tokens.
- **Modelo (Model):** clase PHP que representa una tabla de la base de datos.
- **`personal_access_tokens`:** la tabla donde Sanctum guarda los tokens.
- **`routes/api.php`:** archivo donde viven las rutas de la API.
- **`install:api`:** comando de Laravel que instala Sanctum y prepara la API.
- **`pwd`:** comando que muestra la ruta de la carpeta actual.

---

## 8. Qué sigue

La **Fase 1 (Fundaciones)** va así:

- ✅ **Hito 1 — Proyecto + PostgreSQL**
- ✅ **Hito 2 — Instalación de Sanctum** *(¡completado! Es lo que cubre este documento.)*
- ⏳ **Hito 3 — CORS:** permitir que el frontend de Nicoll (que está en otra
  dirección) pueda conectarse al backend.
- ⏳ **Hito 4 — Convenciones base:** UUIDs como identificadores y el sistema de
  auditoría (registrar quién hace cada cosa).

Después de la Fase 1 viene la **Fase 2 (modelos y migraciones)** y la **Fase 3
(autenticación real)**, donde por fin construiremos el login usando todo lo que
Sanctum nos dejó preparado aquí.

**En resumen:** ya instalamos la cerradura (Sanctum). Todavía falta repartir las
llaves (construir el login), pero la puerta ya puede tener seguridad. 🔐

---

*Documento de aprendizaje — Proyecto SeñaVida · Fase 1 · Hito 2*
