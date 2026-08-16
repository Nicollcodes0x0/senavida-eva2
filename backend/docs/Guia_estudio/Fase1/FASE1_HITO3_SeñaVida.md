# SeñaVida — Bitácora de Aprendizaje

## Fase 1 · Hito 3 — Configuración de CORS

> **¿Qué es este documento?**
> Es el resumen, con lenguaje sencillo (de estudiante para estudiante), de lo que
> hicimos para configurar **CORS** en el backend de SeñaVida: el permiso que deja
> que el frontend de Nicoll (que corre en otra dirección) se conecte a nuestra
> API sin ser bloqueado por el navegador. Cada palabra técnica se explica apenas
> aparece, con ejemplos de la vida real.

---

## Índice

1. [¿Qué hicimos en este hito?](#1-qué-hicimos-en-este-hito)
2. [Los conceptos nuevos explicados fácil](#2-los-conceptos-nuevos-explicados-fácil)
   - [¿Qué es un "origen"?](#qué-es-un-origen)
   - [La regla del navegador: same-origin policy](#la-regla-del-navegador-same-origin-policy)
   - [¿Qué es CORS?](#qué-es-cors)
   - [¿Por qué tu proyecto necesita CORS?](#por-qué-tu-proyecto-necesita-cors)
   - [El principio de mínimo privilegio](#el-principio-de-mínimo-privilegio)
3. [El archivo config/cors.php explicado línea por línea](#3-el-archivo-configcorsphp-explicado-línea-por-línea)
4. [El flujo: qué resuelve CORS](#4-el-flujo-qué-resuelve-cors)
5. [Todo lo que hicimos, paso a paso](#5-todo-lo-que-hicimos-paso-a-paso)
6. [Glosario rápido](#6-glosario-rápido)
7. [Qué sigue](#7-qué-sigue)

---

## 1. ¿Qué hicimos en este hito?

Configuramos **CORS** en el backend. En pocas palabras: le dimos **permiso** al
frontend de Nicoll para que pueda pedirle datos a nuestra API.

¿Por qué hacía falta un permiso? Porque el backend y el frontend son **dos
proyectos separados que corren en direcciones distintas**, y los navegadores, por
seguridad, bloquean por defecto que una dirección le pida datos a otra. CORS es
justamente ese permiso que levanta el bloqueo.

---

## 2. Los conceptos nuevos explicados fácil

### ¿Qué es un "origen"?

Un **origen** es una **dirección web completa**: el protocolo + el dominio + el
puerto. Por ejemplo:

```
http://localhost:8000     ← este es un origen (el backend)
http://localhost:5173     ← este es OTRO origen (el frontend)
```

Aunque los dos digan `localhost`, **el puerto es distinto** (8000 vs 5173), así
que para el navegador son **orígenes diferentes**. Y ahí empieza el asunto de
CORS.

> Un puerto es como el número de un departamento dentro de un mismo edificio.
> Misma calle (`localhost`), pero departamentos distintos (8000 y 5173).

### La regla del navegador: same-origin policy

Los navegadores tienen una regla de seguridad llamada **same-origin policy**
(política del mismo origen). Dice:

> "Una página web solo puede pedirle datos a **su propio origen**. Si intenta
> pedirle datos a un origen distinto, lo bloqueo."

¿Por qué existe esta regla? Para protegerte. Evita que una web maliciosa que
tienes abierta le robe datos a, por ejemplo, la página de tu banco que tienes en
otra pestaña. Es una protección **del navegador**, no del servidor.

El problema: esta regla, que es buena para la seguridad, **también bloquea casos
legítimos**, como que el frontend de Nicoll (un origen) le pida datos a tu API
(otro origen). Ahí es donde entra CORS.

### ¿Qué es CORS?

**CORS** significa *Cross-Origin Resource Sharing* (Intercambio de Recursos entre
Orígenes). Es el **permiso que un servidor da** para que orígenes distintos
puedan pedirle datos, saltándose la same-origin policy.

En otras palabras: el servidor dice *"yo autorizo a que la página que está en tal
dirección me pida datos"*, y entonces el navegador deja pasar esa petición.

**Analogía:** imagina un edificio con un guardia en la entrada. Por defecto, el
guardia solo deja pasar a quienes viven en el edificio (same-origin). CORS es como
darle al guardia una **lista de invitados autorizados** de otros edificios:
*"a la gente que venga de tal dirección, déjala entrar"*. El frontend de Nicoll es
ese invitado que agregamos a la lista.

### ¿Por qué tu proyecto necesita CORS?

Porque eligieron **API REST**, donde el backend (tú) y el frontend (Nicoll) son
**proyectos separados en direcciones distintas**:

- Tu backend: `http://localhost:8000`
- El frontend de Nicoll: `http://localhost:5173`

Sin CORS, cuando el frontend de Nicoll intente conectarse a tu API, el navegador
bloquearía la petición y ella vería un error de "CORS policy" en su consola. Es
**uno de los errores más comunes** al conectar frontend y backend separados. Por
eso lo configuramos de antemano, para que cuando Nicoll conecte, todo funcione.

### El principio de mínimo privilegio

Cuando configuramos CORS, había dos opciones para autorizar orígenes:

- **`*`** → autorizar a **cualquier** dirección del mundo (puerta abierta a todos).
- **`http://localhost:5173`** → autorizar **solo** al frontend de Nicoll.

Elegimos la segunda. ¿Por qué? Por el **principio de mínimo privilegio**: dar
**solo los permisos necesarios, nada más**. Si solo Nicoll va a usar la API,
autorizamos solo su dirección. Abrir a todos (`*`) sería un riesgo de seguridad
innecesario.

> Es como no dar copia de tu llave a todo el barrio "por si acaso", sino solo a
> quien de verdad la necesita.

---

## 3. El archivo config/cors.php explicado línea por línea

CORS se configura en un solo archivo: `config/cors.php`. Estas son sus opciones:

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
```
**A qué rutas se aplica CORS.** `api/*` significa "todas las rutas que empiezan
con `api/`". Como tus rutas viven bajo `/api/v1`, esto las cubre.

```php
'allowed_methods' => ['*'],
```
**Qué métodos HTTP se permiten** (`GET`, `POST`, `PUT`, `DELETE`...). El `*`
significa "todos".

```php
'allowed_origins' => ['http://localhost:5173'],
```
**Qué direcciones están autorizadas.** Esta es la línea que cambiamos: pasó de
`['*']` (cualquiera) a solo el frontend de Nicoll. Es una **lista**, así que se
pueden agregar más separadas por coma en el futuro.

```php
'allowed_headers' => ['*'],
```
**Qué cabeceras se permiten.** El `*` incluye `Authorization`, que es la cabecera
donde viaja el **Bearer token** de Sanctum. Por eso está bien dejarlo así.

```php
'supports_credentials' => false,
```
**Si se permiten cookies.** Como usamos **Bearer token** (no cookies), va en
`false`. Correcto para una API REST con tokens.

**El único cambio que hicimos** fue la línea `allowed_origins`:

```php
// Antes:
'allowed_origins' => ['*'],

// Después:
'allowed_origins' => ['http://localhost:5173'],
```

---

## 4. El flujo: qué resuelve CORS

```
SIN CORS configurado:
1. El frontend de Nicoll (localhost:5173) le pide datos a tu API (localhost:8000)
2. El navegador ve que son direcciones distintas
3. El navegador BLOQUEA la petición  ❌
4. Nicoll ve un error de "CORS policy" en su consola

CON CORS configurado:
1. El frontend de Nicoll le pide datos a tu API
2. Tu backend responde: "sí, autorizo a localhost:5173"
3. El navegador ve la autorización y DEJA PASAR  ✅
4. Nicoll recibe los datos
```

Lo importante: **CORS lo decide el servidor (tu backend), pero quien bloquea o
deja pasar es el navegador.** Por eso se configura en el backend, aunque el efecto
se vea en el navegador del frontend.

---

## 5. Todo lo que hicimos, paso a paso

1. **Averiguamos el puerto del frontend de Nicoll:** `5173` (el puerto por
   defecto de Vite).

2. **Publicamos el archivo de configuración de CORS** (no venía por defecto):
   ```bash
   php artisan config:publish cors
   ```
   Esto creó el archivo `config/cors.php`.

3. **Editamos `allowed_origins`** para autorizar solo al frontend de Nicoll:
   ```php
   'allowed_origins' => ['http://localhost:5173'],
   ```

4. **Limpiamos la caché de configuración** para que Laravel tomara el cambio:
   ```bash
   php artisan config:clear
   ```

---

## 6. Glosario rápido

- **Origen:** una dirección web completa (protocolo + dominio + puerto).
- **Puerto:** el número al final de una dirección (`:8000`, `:5173`). Como el
  número de departamento dentro de un edificio.
- **Same-origin policy:** regla del navegador que bloquea peticiones entre
  orígenes distintos, por seguridad.
- **CORS:** permiso que da el servidor para autorizar orígenes externos y saltar
  la same-origin policy.
- **`allowed_origins`:** la lista de direcciones que tu backend autoriza.
- **`config/cors.php`:** el archivo donde se configura CORS en Laravel.
- **Principio de mínimo privilegio:** dar solo los permisos necesarios, nada más.
- **`config:publish`:** comando que crea un archivo de configuración que no venía
  por defecto.
- **`config:clear`:** comando que limpia la configuración en caché para que
  Laravel tome los cambios.

---

## 7. Qué sigue

La **Fase 1 (Fundaciones)** está casi cerrada:

- ✅ **Hito 1 — Proyecto + PostgreSQL**
- ✅ **Hito 2 — Instalación de Sanctum**
- ✅ **Hito 3 — Configuración de CORS** *(¡completado! Es lo que cubre este documento.)*
- ⏳ **Hito 4 — Convenciones base:** UUIDs como identificadores y el sistema de
  auditoría (registrar quién hace cada cosa). Es el **último hito** de la Fase 1.

Después del Hito 4, cerramos la Fase 1 completa y pasamos a la **Fase 2**, donde
por fin creamos las tablas y modelos de verdad (organizaciones, usuarios,
pacientes...).

**En resumen:** ya le abrimos la puerta al frontend de Nicoll para que se pueda
conectar. Cuando ella conecte su React, el navegador ya no la bloqueará. 🚪✅

---

*Documento de aprendizaje — Proyecto SeñaVida · Fase 1 · Hito 3*
