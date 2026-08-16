# SeñaVida — Bitácora de Aprendizaje

## Fase 2 · Hito 3 — Usuarios

> **¿Qué es este documento?**
> Es el resumen, con lenguaje sencillo (de estudiante para estudiante), de lo que
> hicimos para convertir el modelo **User** en la pieza central del sistema: con
> **UUID**, conectado a su organización, centro y unidad, y con un **rol**. Fue el
> hito más denso hasta ahora, y en él resolvimos un error real muy instructivo
> sobre el **orden de las migraciones**.

---

## Índice

1. [¿Qué hicimos en este hito?](#1-qué-hicimos-en-este-hito)
2. [Por qué el usuario es la pieza más importante](#2-por-qué-el-usuario-es-la-pieza-más-importante)
3. [Los conceptos nuevos explicados fácil](#3-los-conceptos-nuevos-explicados-fácil)
   - [Modificar una tabla que ya existe](#modificar-una-tabla-que-ya-existe)
   - [El orden de las migraciones importa](#el-orden-de-las-migraciones-importa)
   - [migrate:fresh](#migratefresh)
   - [nullOnDelete vs cascadeOnDelete](#nullondelete-vs-cascadeondelete)
   - [Los roles del sistema](#los-roles-del-sistema)
4. [El error que tuvimos (y cómo lo resolvimos)](#4-el-error-que-tuvimos-y-cómo-lo-resolvimos)
5. [El modelo User final](#5-el-modelo-user-final)
6. [Todo lo que hicimos, paso a paso](#6-todo-lo-que-hicimos-paso-a-paso)
7. [Glosario rápido](#7-glosario-rápido)
8. [Qué sigue](#8-qué-sigue)

---

## 1. ¿Qué hicimos en este hito?

Convertimos el modelo `User` (que venía básico con Laravel) en el **usuario real
del sistema**:

- Ahora usa **UUID** (como todo el proyecto).
- Está **conectado** a su organización, centro y unidad.
- Tiene un **rol** (`medico`, `admision`, etc.).
- Tiene `is_active` para habilitar o deshabilitar cuentas.

A diferencia de los hitos anteriores, aquí **no creamos una tabla de cero**:
**modificamos** la tabla `users` que Laravel ya trae. Eso trajo un reto nuevo (el
orden de las migraciones) que resolvimos.

---

## 2. Por qué el usuario es la pieza más importante

El usuario está en el centro de todo el sistema:

- Es quien **inicia sesión** → el login se apoya en esta tabla (clave para la
  rúbrica).
- Es el **autor** de las acciones (crear pacientes, firmar notas...) → a quien la
  auditoría registrará.
- Tiene un **rol** → que definirá qué puede hacer (los permisos).

Por eso este hito fue el más importante de la fase.

---

## 3. Los conceptos nuevos explicados fácil

### Modificar una tabla que ya existe

Hasta ahora **creábamos** tablas nuevas con `Schema::create`. Pero la tabla
`users` **ya existía** (viene con Laravel). Para cambiarla, hay dos herramientas:

- **`Schema::create('tabla', ...)`** → **crear** una tabla nueva.
- **`Schema::table('tabla', ...)`** → **modificar** una tabla que ya existe
  (agregar o quitar columnas).

En este hito usamos `Schema::table('users', ...)` para agregarle columnas a la
tabla de usuarios sin recrearla desde cero.

### El orden de las migraciones importa

Este fue el gran aprendizaje del hito. Laravel ejecuta las migraciones **en orden
de fecha** (el número al inicio del nombre del archivo):

```
0001_01_01_000000_create_users_table          ← se ejecuta PRIMERO
2026_08_08_040215_create_organizations_table  ← se ejecuta DESPUÉS
```

**La regla de oro:** una tabla con una **llave foránea** debe crearse **después**
de la tabla a la que apunta. Si no, la conexión falla porque apunta a algo que
todavía no existe.

**Analogía:** es como colgar un cuadro. Primero pones el clavo (la tabla padre),
y **después** cuelgas el cuadro (la tabla con la llave foránea). Si intentas
colgar el cuadro antes de poner el clavo, se cae.

### migrate:fresh

**`php artisan migrate:fresh`** hace dos cosas: **borra todas las tablas** y las
**vuelve a crear** desde cero.

- Se usa cuando cambias algo profundo de una tabla (como pasar `users` de ID
  numérico a UUID), que no se puede "editar" sobre la marcha.
- ⚠️ **Borra todos los datos.** En desarrollo (sin datos reales) es perfecto.
  **NUNCA** se usa en producción con datos reales, porque los borraría todos.

Diferencia con `migrate` normal:
| Comando | Qué hace |
|---|---|
| `migrate` | Ejecuta solo las migraciones nuevas (no toca las anteriores) |
| `migrate:fresh` | Borra todo y recrea todas las tablas |

### nullOnDelete vs cascadeOnDelete

Las dos definen qué pasa con una fila "hija" cuando se borra su "padre", pero
hacen cosas opuestas:

- **`cascadeOnDelete()`** → si se borra el padre, **se borran los hijos**. (Lo
  usamos en centros y unidades: si se borra un centro, se borran sus unidades.)
- **`nullOnDelete()`** → si se borra el padre, el hijo **NO se borra**; solo se
  pone su llave foránea en `NULL` (se desvincula). (Lo usamos en usuarios: si se
  borra un centro, **no borramos a la persona**, solo pierde su asignación.)

**¿Por qué distinto para usuarios?** Porque una unidad sin centro no tiene sentido
(se borra), pero un **usuario es una persona**: no queremos borrarlo si se elimina
su centro, solo desvincularlo.

### Los roles del sistema

Según los documentos del proyecto, hay **cinco roles**:

| Rol (slug) | Quién es |
|---|---|
| `admin_institucional` | Administrador (gestiona usuarios, config) |
| `admision` | Valida el código CTA, abre la ficha |
| `categorizacion` | Registra signos vitales y triage |
| `medico` | Notas clínicas, cierra la atención |
| `paciente` | Usa el portal del paciente |

Por ahora el rol se guarda como **texto** en la columna `role`. Más adelante
construiremos la lógica de permisos sobre eso.

---

## 4. El error que tuvimos (y cómo lo resolvimos)

Vale la pena documentarlo porque fue muy instructivo.

**Qué pasó:** al principio pusimos las tres llaves foráneas (organization_id,
health_center_id, unit_id) **dentro** de la migración original de `users`. Al
correr `migrate:fresh`, dio este error:

```
no existe la relación «organizations»
```

**Por qué:** la migración de `users` tiene fecha `0001` (se ejecuta primera), pero
las tablas `organizations`, `health_centers` y `units` tienen fecha `2026` (se
ejecutan después). Entonces `users` intentaba conectarse a tablas que **aún no
existían**.

**Cómo lo resolvimos:**
1. Quitamos las tres llaves foráneas de la migración original de `users`.
2. Creamos una **migración separada y nueva** (`add_foreign_keys_to_users_table`)
   con fecha posterior, que agrega esas llaves foráneas **después** de que existan
   las otras tablas.

Ahora el orden es correcto:
```
1. Crear users (sin llaves foráneas)             ← fecha 0001
2. Crear organizations, health_centers, units    ← fecha 2026_08_08_04...
3. Agregar llaves foráneas a users               ← fecha 2026_08_08_05...
```

**Lección:** cuando una tabla depende de otras que se crean después, mueve sus
llaves foráneas a una migración separada con fecha posterior.

---

## 5. El modelo User final

Quedó con todo integrado (respetando la sintaxis de Laravel 13):

```php
#[Fillable(['organization_id', 'health_center_id', 'unit_id', 'name', 'email', 'password', 'role', 'is_active'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function healthCenter(): BelongsTo
    {
        return $this->belongsTo(HealthCenter::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }
}
```

Notas de la sintaxis de Laravel 13:
- `#[Fillable(...)]` arriba de la clase (en vez de la propiedad `$fillable`).
- `#[Hidden(...)]` esconde campos sensibles (la contraseña nunca se muestra).
- Los casts van en un **método** `casts()` (no en `$casts`).
- `'password' => 'hashed'` → Laravel **cifra automáticamente** la contraseña al
  guardarla (¡esto es justo lo que pide la rúbrica sobre cifrado de clave!).

---

## 6. Todo lo que hicimos, paso a paso

1. **Modificamos** la migración original de `users`: id a UUID, y agregamos `role`
   e `is_active`.
2. Al correr `migrate:fresh`, **apareció el error de orden** con las llaves
   foráneas.
3. **Quitamos** las llaves foráneas de la migración de `users`.
4. **Creamos una migración separada** para las llaves foráneas:
   ```bash
   php artisan make:migration add_foreign_keys_to_users_table
   ```
   (con `Schema::table` y `after(...)`).
5. Corrimos `migrate:fresh` de nuevo → **todas las tablas `DONE`.** ✅
6. **Actualizamos el modelo `User`**: `HasUuids`, `#[Fillable]` ampliado, cast de
   `is_active`, y las tres relaciones `belongsTo`.
7. Verificamos con `php artisan about` y `php artisan migrate:status`.

---

## 7. Glosario rápido

- **`Schema::create`:** crear una tabla nueva.
- **`Schema::table`:** modificar una tabla que ya existe.
- **Orden de migraciones:** se ejecutan por fecha; la tabla padre va antes que la
  hija.
- **`migrate:fresh`:** borra todas las tablas y las recrea (solo en desarrollo).
- **`migrate` (normal):** ejecuta solo las migraciones nuevas.
- **`cascadeOnDelete`:** borra los hijos si se borra el padre.
- **`nullOnDelete`:** desvincula (pone NULL) los hijos si se borra el padre, sin
  borrarlos.
- **`after('columna')`:** indica dónde colocar una columna nueva.
- **`role`:** columna de texto con el rol del usuario.
- **`'password' => 'hashed'`:** cifra la contraseña automáticamente al guardarla.
- **Rol:** el tipo de funcionario (`medico`, `admision`, `categorizacion`,
  `admin_institucional`, `paciente`).

---

## 8. Qué sigue

La **Fase 2** está casi cerrada:

- ✅ **Hito 1 — Organizaciones y Centros de Salud**
- ✅ **Hito 2 — Unidades**
- ✅ **Hito 3 — Usuarios** *(¡completado! Es este documento.)*
- ⏳ **Hito 4 — Auditoría automática:** conectar que las acciones se registren
  solas en `audit_logs`, usando la infraestructura de la Fase 1. Es el **último
  hito** de la Fase 2 (y el pendiente que veníamos arrastrando).

Después de la Fase 2 viene la **Fase 3: la autenticación real** (el login con
Sanctum), donde por fin usaremos el usuario que acabamos de construir. Ahí se
juegan los puntos grandes de la rúbrica.

**En resumen:** ya tenemos al usuario, la pieza central, con UUID, relaciones y
rol. Y aprendimos a resolver el orden de las migraciones, algo que pasa en
proyectos reales. 💪

---

*Documento de aprendizaje — Proyecto SeñaVida · Fase 2 · Hito 3*
