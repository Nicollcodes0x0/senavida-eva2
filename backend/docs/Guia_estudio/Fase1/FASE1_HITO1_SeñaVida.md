# SeñaVida — Bitácora de Aprendizaje

## Fase 1 · Hito 1 — Fundaciones del proyecto

> **¿Qué es este documento?**
> Es un resumen escrito con lenguaje sencillo (de estudiante para estudiante) de
> todo lo que hicimos para dejar listo el backend de SeñaVida y crear el proyecto
> Laravel conectado a PostgreSQL. Cada palabra técnica se explica apenas aparece,
> con ejemplos de la vida real. Si algún día se te olvida algo, vuelve aquí.

---

## Índice

1. [¿Qué estamos construyendo?](#1-qué-estamos-construyendo)
2. [Los conceptos base explicados fácil](#2-los-conceptos-base-explicados-fácil)
   - [¿Qué es un backend? ¿Y un frontend?](#qué-es-un-backend-y-un-frontend)
   - [¿Qué es PHP?](#qué-es-php)
   - [¿Qué es Laravel?](#qué-es-laravel)
   - [¿Qué es Composer?](#qué-es-composer)
   - [¿Qué es una base de datos?](#qué-es-una-base-de-datos)
   - [PostgreSQL vs MySQL](#postgresql-vs-mysql)
   - [¿Qué es una migración?](#qué-es-una-migración)
   - [¿Qué es artisan?](#qué-es-artisan)
   - [¿Qué es el archivo .env?](#qué-es-el-archivo-env)
   - [¿Qué es Laragon?](#qué-es-laragon)
   - [¿Qué es el PATH?](#qué-es-el-path)
   - [¿Qué son las extensiones de PHP?](#qué-son-las-extensiones-de-php)
   - [Comentar y descomentar (# y ;)](#comentar-y-descomentar--y-)
3. [Todo lo que hicimos, paso a paso](#3-todo-lo-que-hicimos-paso-a-paso)
4. [El flujo completo: cómo se conecta todo](#4-el-flujo-completo-cómo-se-conecta-todo)
5. [Problemas que aparecieron y cómo los resolvimos](#5-problemas-que-aparecieron-y-cómo-los-resolvimos)
6. [Glosario rápido](#6-glosario-rápido)
7. [Qué sigue](#7-qué-sigue)

---

## 1. ¿Qué estamos construyendo?

**SeñaVida** es una plataforma web para mejorar la comunicación entre **personas
sordas** y el **personal de salud**, pensada para urgencias de hospitales en
Chile. No reemplaza la ficha clínica del hospital: es una herramienta que
*ayuda a comunicarse* (con pictogramas, chat, traductor de señas, etc.).

El frontend (las pantallas) ya está construido, pero **no guarda nada**: toda su
información está escrita "a mano" y se borra al recargar la página. Nuestro
trabajo es construir el **backend**: la parte que guarda la información de verdad,
decide quién puede hacer qué, y responde a las pantallas.

En este Hito 1 todavía no construimos funciones del sistema. Construimos los
**cimientos**: dejar el proyecto creado y conectado a la base de datos. Es como
preparar el terreno y las bases de una casa antes de levantar las paredes.

---

## 2. Los conceptos base explicados fácil

### ¿Qué es un backend? ¿Y un frontend?

Imagina un restaurante:

- El **frontend** es todo lo que ve el cliente: el salón, la carta, las mesas.
  En una app son los botones, formularios y pantallas.
- El **backend** es la cocina: donde se prepara la comida, se guardan los
  ingredientes y se organiza todo. El cliente no la ve, pero sin ella no hay
  comida. En una app, el backend guarda la información, aplica las reglas y
  responde a lo que pide la pantalla.

Nosotros estamos construyendo **la cocina** (el backend).

### ¿Qué es PHP?

**PHP** es un **lenguaje de programación** que se usa para construir la parte del
servidor (el backend) de muchas páginas web. Es el idioma en el que le damos
instrucciones al servidor.

En este proyecto usamos **PHP 8.4**, una de las versiones más nuevas.

> **Dato:** existen muchos lenguajes para backend (Python, Java, JavaScript…).
> Nosotros usamos PHP porque el framework que elegimos, Laravel, está hecho en PHP.

### ¿Qué es Laravel?

**Laravel** es un **framework** de PHP. Un *framework* es como un kit de
construcción con piezas ya hechas y ordenadas, para no empezar de cero.

Ejemplo de la vida real: si quieres armar un mueble, puedes cortar la madera tú
mismo desde un árbol (muy difícil), o comprar un kit de IKEA con las piezas
listas y un manual (mucho más fácil). **Laravel es el kit de IKEA del backend**:
te da la estructura, las herramientas y las reglas para construir rápido y bien.

Usamos **Laravel 12**, la versión más reciente.

### ¿Qué es Composer?

**Composer** es el **gestor de paquetes** de PHP. Un "paquete" es un trozo de
código que alguien ya escribió y que puedes reutilizar.

Analogía: Composer es como la **tienda de aplicaciones** (Play Store / App Store)
de PHP. En vez de programar todo tú, le pides a Composer que traiga las piezas que
necesitas y él las descarga y las organiza.

Con Composer hicimos nacer el proyecto:

```bash
composer create-project laravel/laravel senavida-backend
```

Este comando le dice a Composer: *"tráeme Laravel y todas sus piezas, y arma un
proyecto nuevo llamado senavida-backend"*.

### ¿Qué es una base de datos?

Una **base de datos** es el lugar donde se **guarda la información de forma
permanente**, de manera ordenada. Es como un gran archivador digital con
cajones (tablas), y dentro de cada cajón, fichas (filas) con datos.

Ejemplo: una tabla `pacientes` sería un cajón, y cada paciente sería una ficha
con su nombre, RUT, teléfono, etc.

Sin base de datos, todo se borra al apagar el programa. Con base de datos, la
información queda guardada aunque cierres todo.

### PostgreSQL vs MySQL

**PostgreSQL** y **MySQL** son dos programas de base de datos. Ambos hacen lo
mismo en esencia: guardar información en tablas y responder consultas usando un
lenguaje llamado **SQL**. Para lo que vas a aprender, el 90 % es igual.

Diferencias que sí importan:

| Tema | MySQL | PostgreSQL |
|---|---|---|
| Cómo se administra con ventanas | phpMyAdmin o **MySQL Workbench** (app de escritorio) | **pgAdmin** (se abre en el navegador) |
| Comando de terminal | `mysql` | `psql` |
| Puerto por defecto | `3306` | `5432` |
| Estilo | Más simple, muy común | Más estricto, robusto y "profesional" |
| Tipos de datos avanzados | Básicos | JSON de verdad, UUID nativo, arrays… |

**¿Por qué SeñaVida usa PostgreSQL?** Porque maneja **datos de salud sensibles**,
y PostgreSQL tiene fama de ser más riguroso y seguro. Además, el proyecto usa
**UUID** (un tipo especial de identificador) y campos **JSON**, que PostgreSQL
maneja de forma más natural.

> **Tranquila:** lo que aprendes con PostgreSQL te sirve casi igual para MySQL.
> No estás aprendiendo algo "raro", sino la base de datos que usan los sistemas
> más serios.

> **Curiosidad que nos pasó:** MySQL Workbench se abre como una app normal con su
> ventana. En cambio pgAdmin (el de PostgreSQL) se abre *dentro del navegador*.
> Eso no es un error: así funciona a propósito.

### ¿Qué es una migración?

Una **migración** es un archivo que **describe cómo debe ser una tabla** de la
base de datos (qué columnas tiene, de qué tipo, etc.). Es como el **plano** de un
cajón del archivador.

En vez de crear las tablas a mano dentro de la base de datos, escribimos
migraciones y le pedimos a Laravel que las "ejecute". Ahí Laravel crea las tablas
por nosotros.

Ventaja enorme: como las tablas están descritas en archivos, **cualquiera puede
recrear la base de datos completa** ejecutando las migraciones. Es como tener los
planos: con ellos puedes construir la misma casa en otro terreno.

El comando que ejecuta las migraciones es:

```bash
php artisan migrate
```

Cuando lo corrimos, creó tres tablas (`users`, `cache`, `jobs`). Y como terminó
**sin errores**, eso nos *probó* que Laravel de verdad se conectó a PostgreSQL.

### ¿Qué es artisan?

**Artisan** es la **herramienta de línea de comandos** de Laravel. Es como una
"navaja suiza" con muchas funciones. Le das órdenes escribiendo `php artisan` y
luego lo que quieres hacer.

Ejemplos que usamos:

```bash
php artisan migrate          # crea las tablas en la base de datos
php artisan config:clear     # borra la configuración guardada en caché
```

### ¿Qué es el archivo .env?

El **`.env`** (se lee "punto env", de *environment* = entorno) es el archivo
donde Laravel guarda su **configuración secreta**: sobre todo, cómo conectarse a
la base de datos.

Es como la **agenda de contactos** del proyecto: ahí anotamos la dirección de la
base de datos, el usuario y la contraseña, para que Laravel sepa a dónde llamar.

Lo editamos para que apuntara a PostgreSQL:

```dotenv
DB_CONNECTION=pgsql          # usar PostgreSQL (antes decía sqlite)
DB_HOST=127.0.0.1            # la base está en tu propia computadora
DB_PORT=5432                 # puerto de PostgreSQL (el de MySQL sería 3306)
DB_DATABASE=senavida         # el nombre de la base que creamos
DB_USERNAME=postgres         # el usuario
DB_PASSWORD=********          # tu contraseña de postgres
```

> **Importante:** el `.env` es **secreto** y nunca se sube a internet (a GitHub),
> porque tiene la contraseña.

### ¿Qué es Laragon?

**Laragon** es un programa que instala y organiza, en un solo lugar, las
herramientas que necesitas para desarrollar: **PHP**, **Composer**, una base de
datos, un servidor, etc. Así no tienes que instalar cada cosa por separado.

Es como un **estuche completo** que ya trae lápices, goma, regla y compás, en vez
de comprar cada útil suelto.

### ¿Qué es el PATH?

El **PATH** es una lista que tiene Windows con las **carpetas donde buscar
programas** cuando escribes un comando en la terminal.

Ejemplo: cuando escribes `php`, Windows recorre el PATH de arriba hacia abajo y
usa el **primer** `php` que encuentra.

**El problema que tuvimos:** teníamos dos PHP instalados (uno viejo de XAMPP y el
nuevo de Laragon). El de XAMPP estaba *primero* en el PATH, así que "ganaba" y la
terminal usaba el PHP viejo. Lo arreglamos **quitando XAMPP del PATH** y
**poniendo la carpeta del PHP de Laragon**.

Analogía: es como una fila. Cuando llamas "¡PHP!", responde el primero de la fila.
Tuvimos que reordenar la fila para que respondiera el PHP correcto.

### ¿Qué son las extensiones de PHP?

PHP viene "básico" y las **extensiones** son módulos que le agregan capacidades
extra. Vienen incluidas pero **apagadas** por defecto; tú enciendes las que
necesitas.

Las que activamos y para qué sirven:

- **`pdo_pgsql`** y **`pgsql`** → permiten que PHP se conecte a **PostgreSQL**.
  *(Estas eran obligatorias para nuestro proyecto.)*
- **`zip`** → permite descomprimir archivos. Composer la necesita para instalar
  los paquetes. *(Sin ella, la creación del proyecto falló la primera vez.)*
- **`mbstring`**, **`fileinfo`**, **`openssl`**, **`curl`** → requisitos generales
  de Laravel (texto con tildes/ñ, tipos de archivo, cifrado, peticiones a otras
  webs).

Se activan en un archivo llamado **`php.ini`** (la configuración de PHP).

### Comentar y descomentar (# y ;)

En muchos archivos de configuración, un símbolo al inicio de una línea significa
*"ignora esta línea"*. Eso se llama **comentar**.

- En el **`php.ini`** el símbolo es el punto y coma `;`
- En el **`.env`** el símbolo es la almohadilla `#`

Ejemplo:

```ini
;extension=zip     ← APAGADA (está comentada, PHP la ignora)
extension=zip      ← ENCENDIDA (le quitamos el ; y ahora funciona)
```

**Quitar el símbolo = activar la línea. Ponerlo = desactivarla.**

> Ojo: no todo lo comentado hay que activarlo. Solo activamos lo que
> necesitábamos (las extensiones y las líneas `DB_`). El resto se deja como vino.

---

## 3. Todo lo que hicimos, paso a paso

Este fue el recorrido completo, en orden:

1. **Revisamos qué había instalado** en la computadora con estos comandos:
   ```bash
   php --version          # ver la versión de PHP
   composer --version     # ver la versión de Composer
   where php              # ver DÓNDE está el PHP que se usa
   ```

2. **Detectamos un problema:** el PHP que usaba la terminal era el de XAMPP
   (versión 8.2, sin la extensión de PostgreSQL), no el que queríamos.

3. **Instalamos PHP 8.4** dentro de Laragon:
   - Lo descargamos de la web oficial (versión *Thread Safe*, *x64*).
   - Lo descomprimimos en `C:\laragon\bin\php\php-8.4.24-Win32-vs17-x64`.
   - Lo seleccionamos en Laragon (**Menu → PHP → Versión**).

4. **Arreglamos el PATH** para que la terminal usara el PHP 8.4 de Laragon y no
   el de XAMPP (quitamos la ruta de XAMPP y agregamos la de Laragon).

5. **Activamos las extensiones** en el `php.ini`: `pdo_pgsql`, `pgsql` y, más
   tarde, `zip`.

6. **Verificamos que todo quedó bien:**
   ```bash
   php --version              # → PHP 8.4.24 ✅
   php -m | findstr pgsql     # → pdo_pgsql, pgsql ✅
   php -m | findstr zip       # → zip ✅
   composer --version         # → apuntando al PHP 8.4 ✅
   ```

7. **Creamos el proyecto Laravel:**
   ```bash
   cd C:\laragon\www
   composer create-project laravel/laravel senavida-backend
   cd senavida-backend
   ```

8. **Creamos la base de datos** en PostgreSQL:
   ```bash
   "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
   ```
   ```sql
   CREATE DATABASE senavida;
   \l      -- para ver que se creó
   \q      -- para salir
   ```

9. **Configuramos el `.env`** para conectar Laravel con PostgreSQL (cambiamos las
   líneas `DB_`).

10. **Probamos la conexión:**
    ```bash
    php artisan config:clear
    php artisan migrate
    ```
    Las migraciones se ejecutaron con `DONE`. **¡Conexión exitosa!**

---

## 4. El flujo completo: cómo se conecta todo

Así encajan todas las piezas que instalamos:

```
   TÚ escribes un comando (ej: php artisan migrate)
        │
        ▼
   La TERMINAL busca "php" en el PATH
        │  (gracias a que arreglamos el PATH, encuentra el PHP 8.4 de Laragon)
        ▼
   PHP 8.4 ejecuta LARAVEL (usando artisan)
        │
        ▼
   Laravel lee el archivo .env
        │  (ahí están los datos de conexión a la base)
        ▼
   Laravel usa la extensión pdo_pgsql para hablar con...
        │
        ▼
   PostgreSQL  →  base de datos "senavida"
        │
        ▼
   Se crean las tablas  ✅  y Laravel confirma "DONE"
```

Cada herramienta que instalamos cumple un rol en esta cadena. Si una falla (por
eso pasamos tanto rato configurando), la cadena se rompe. Por eso los cimientos
eran tan importantes.

---

## 5. Problemas que aparecieron y cómo los resolvimos

Documentar los errores es parte de aprender. Estos fueron los tropiezos:

| Problema | Causa | Solución |
|---|---|---|
| La terminal usaba PHP 8.2 de XAMPP | XAMPP estaba primero en el PATH | Quitar XAMPP del PATH y poner Laragon |
| El PHP de Laragon era muy viejo (8.1) | Laravel 12 necesita PHP 8.2+ | Instalar PHP 8.4 manualmente en Laragon |
| `php -m` no mostraba `pgsql` | La extensión estaba apagada | Quitar el `;` en el `php.ini` |
| `create-project` falló: "zip missing" | Faltaba la extensión `zip` | Activar `extension=zip` en el `php.ini` |
| Aviso `E_STRICT` de Composer | Composer estaba desactualizado | `composer self-update` (como administrador) |
| No sabíamos la contraseña de postgres | (recuperada) | Se recordó / se puede resetear si hace falta |
| Las líneas `DB_` estaban comentadas | Vienen así por defecto | Quitarles el `#` y poner los valores correctos |

**Lección general:** casi todos los problemas eran de *configuración del entorno*,
no de programación. Y casi todos se resolvían **activando algo** (una extensión,
una línea) o **arreglando el PATH**. Esto es normal y le pasa a todo el mundo la
primera vez.

---

## 6. Glosario rápido

- **Backend:** la parte del sistema que no se ve; guarda datos y aplica reglas.
- **Frontend:** la parte que se ve; botones y pantallas.
- **PHP:** lenguaje de programación del backend. Usamos la versión 8.4.
- **Laravel:** framework (kit de construcción) de PHP. Usamos la versión 12.
- **Composer:** gestor de paquetes de PHP (la "tienda de apps" del código).
- **Base de datos:** archivador digital donde se guardan los datos.
- **PostgreSQL:** el programa de base de datos que usamos (más robusto).
- **MySQL:** otro programa de base de datos (más simple, no lo usamos aquí).
- **Migración:** archivo que describe una tabla (el "plano" de un cajón).
- **artisan:** herramienta de comandos de Laravel (`php artisan ...`).
- **.env:** archivo con la configuración secreta (conexión a la base de datos).
- **Laragon:** estuche que trae PHP, Composer y más, todo junto.
- **PATH:** lista de carpetas donde Windows busca los programas.
- **Extensión de PHP:** módulo que le da capacidades extra a PHP.
- **php.ini:** archivo de configuración de PHP.
- **psql:** herramienta de comandos de PostgreSQL.
- **pgAdmin:** programa con ventanas para administrar PostgreSQL (se abre en el navegador).
- **Comentar (`#` o `;`):** desactivar una línea de configuración.
- **SQL:** el lenguaje para pedirle cosas a la base de datos.
- **UUID:** un tipo especial de identificador único (lo usaremos más adelante).

---

## 7. Qué sigue

La **Fase 1 (Fundaciones)** tiene cuatro hitos. Vamos así:

- ✅ **Hito 1 — Proyecto + PostgreSQL** *(¡completado! Es lo que cubre este documento.)*
- ⏳ **Hito 2 — Inertia + React + Vite + Tailwind:** enlazar el backend con el
  frontend (las pantallas hechas en React).
- ⏳ **Hito 3 — Convenciones base:** decidir de una vez cómo serán las llaves
  primarias (UUID), las fechas y la auditoría (registrar quién hace cada cosa).
- ⏳ **Hito 4 — Seeders:** cargar datos de ejemplo en la base (pictogramas,
  categorías, el caso de demostración, etc.).

**En resumen:** ya tenemos la cocina montada y conectada al agua y la luz. Ahora
falta equiparla para empezar a cocinar de verdad. 🚀

---

*Documento de aprendizaje — Proyecto SeñaVida · Fase 1 · Hito 1*
