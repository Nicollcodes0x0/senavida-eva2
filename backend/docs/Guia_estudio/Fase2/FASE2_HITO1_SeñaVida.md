# SeñaVida — Bitácora de Aprendizaje

## Fase 2 · Hito 1 — Organizaciones y Centros de Salud

> **¿Qué es este documento?**
> Es el resumen, con lenguaje sencillo (de estudiante para estudiante), de lo que
> hicimos para crear las dos primeras tablas "de verdad" del sistema:
> **organizations** (organizaciones) y **health_centers** (centros de salud), y
> cómo las **conectamos** entre sí. Aquí aparece uno de los conceptos más
> importantes de las bases de datos: las **relaciones**.

---

## Índice

1. [¿Qué hicimos en este hito?](#1-qué-hicimos-en-este-hito)
2. [Los conceptos nuevos explicados fácil](#2-los-conceptos-nuevos-explicados-fácil)
   - [¿Qué es una relación entre tablas?](#qué-es-una-relación-entre-tablas)
   - [Relación uno-a-muchos](#relación-uno-a-muchos)
   - [¿Qué es una llave foránea?](#qué-es-una-llave-foránea)
   - [Los dos lados: hasMany y belongsTo](#los-dos-lados-hasmany-y-belongsto)
   - [Integridad referencial y cascada](#integridad-referencial-y-cascada)
   - [El patrón is_active](#el-patrón-is_active)
   - [Convención de nombres: modelo y tabla](#convención-de-nombres-modelo-y-tabla)
3. [Las tablas que creamos](#3-las-tablas-que-creamos)
4. [Los modelos que creamos](#4-los-modelos-que-creamos)
5. [Todo lo que hicimos, paso a paso](#5-todo-lo-que-hicimos-paso-a-paso)
6. [Glosario rápido](#6-glosario-rápido)
7. [Qué sigue](#7-qué-sigue)

---

## 1. ¿Qué hicimos en este hito?

Creamos las dos primeras tablas de identidad del sistema y las conectamos:

- **Organization** (organización): la entidad jurídica que agrupa hospitales. Es
  el nivel más alto.
- **HealthCenter** (centro de salud): un hospital o clínica concreto. Es la
  **frontera de privacidad** del sistema: nadie ve datos clínicos de otro centro.

Y lo más importante: aprendimos a **relacionar** dos tablas, para que "se
conozcan" entre sí.

---

## 2. Los conceptos nuevos explicados fácil

### ¿Qué es una relación entre tablas?

Una **relación** es una **conexión entre dos tablas**. En la vida real, las cosas
están conectadas: un centro pertenece a una organización, un paciente tiene una
sesión, etc. Las relaciones son la forma de representar esas conexiones en la base
de datos.

Sin relaciones, cada tabla estaría aislada. Con relaciones, puedes "navegar" de
una a otra: desde una organización, ver sus centros; desde un centro, ver su
organización.

### Relación uno-a-muchos

Es el tipo de relación más común. Significa que **un** registro de una tabla se
conecta con **muchos** de otra.

En nuestro caso:

```
Organización: "Servicio de Salud Araucanía Sur"
    ├── Centro: "Hospital Regional de Villarrica"
    ├── Centro: "Hospital de Pucón"
    └── Centro: "CESFAM Labranza"
```

**Una** organización tiene **muchos** centros. Cada centro pertenece a **una
sola** organización.

**Analogía:** una **cadena de supermercados** (organización) tiene muchas
**sucursales** (centros). Cada sucursal pertenece a una sola cadena.

### ¿Qué es una llave foránea?

Para conectar dos tablas se usa una **llave foránea** (foreign key): una columna
en la tabla "hija" que **apunta al identificador de la tabla "padre"**.

En `health_centers` creamos la columna `organization_id`, que guarda el UUID de la
organización a la que pertenece el centro:

```
Tabla organizations:
  id: "aaa-111"   name: "Servicio Salud Araucanía"

Tabla health_centers:
  id: "bbb-222"   name: "Hospital Villarrica"   organization_id: "aaa-111"
                                                 └── apunta a la organización
```

Esa columna `organization_id` es el **"hilo"** que conecta el centro con su
organización.

En la migración se escribió así:
```php
$table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
```

### Los dos lados: hasMany y belongsTo

Una relación se ve **desde los dos lados**, y cada modelo la declara a su manera:

| Modelo | Método | Tipo | Significa |
|---|---|---|---|
| `Organization` | `healthCenters()` | `hasMany` | "tengo muchos centros" |
| `HealthCenter` | `organization()` | `belongsTo` | "pertenezco a una organización" |

Es **la misma relación**, vista desde arriba y desde abajo:
- Desde la organización (el padre): "tengo muchos centros" → **`hasMany`**.
- Desde el centro (el hijo): "pertenezco a una organización" → **`belongsTo`**.

Gracias a esto, puedes navegar en ambas direcciones en el código:
```php
$organizacion->healthCenters   // los centros de una organización
$centro->organization          // la organización de un centro
```

**Analogía:** una relación madre–hijos. Desde la madre: "tengo varios hijos"
(`hasMany`). Desde el hijo: "tengo una madre" (`belongsTo`). Misma relación, dos
puntos de vista.

> Detalle: el `belongsTo` funciona gracias a la columna `organization_id` (la
> llave foránea). Esa columna es la que Laravel usa para saber a qué organización
> apunta el centro.

### Integridad referencial y cascada

Cuando en la migración pusimos `->constrained()` y `->cascadeOnDelete()`, le dimos
dos garantías a la base de datos:

- **`constrained()` → integridad referencial.** No puedes crear un centro con un
  `organization_id` que no corresponda a ninguna organización real. La base lo
  rechaza. Así nunca hay centros apuntando a "la nada".

- **`cascadeOnDelete()` → borrado en cascada.** Si se borra una organización, se
  borran automáticamente todos sus centros. Así no quedan centros "huérfanos" sin
  organización.

**Analogía de la cascada:** si eliminas una cadena de supermercados completa, no
tiene sentido que queden "sucursales fantasma" sin cadena. Se van con ella.

### El patrón is_active

Ambas tablas tienen una columna `is_active` (booleana, verdadero/falso), que nace
en `true` por defecto.

**¿Para qué?** En sistemas serios **rara vez se borran registros de verdad**
(se perdería el historial). En vez de borrar, se **desactivan**: el registro
sigue existiendo pero marcado como inactivo. Se le llama **baja lógica**.

Verás un `is_active` en casi todas las tablas del proyecto. Es una convención de
buena práctica: nunca borrar, solo desactivar.

### Convención de nombres: modelo y tabla

Laravel conecta automáticamente un modelo con su tabla siguiendo una convención:

- El **modelo** va en **singular** y con **mayúsculas iniciales**: `HealthCenter`.
- La **tabla** va en **plural**, **minúsculas** y con **guiones bajos**:
  `health_centers`.

Por eso, cuando creas el modelo `HealthCenter`, Laravel sabe solo que se conecta
con la tabla `health_centers`. No hay que decírselo.

---

## 3. Las tablas que creamos

**organizations:**
```php
$table->uuid('id')->primary();
$table->string('name');
$table->boolean('is_active')->default(true);
$table->timestamps();
```

**health_centers:**
```php
$table->uuid('id')->primary();
$table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
$table->string('name');
$table->boolean('is_active')->default(true);
$table->timestamps();
```

La diferencia clave: `health_centers` tiene la **llave foránea**
`organization_id` que la conecta con `organizations`.

---

## 4. Los modelos que creamos

**Organization** (el lado "padre" — `hasMany`):
```php
class Organization extends Model
{
    use HasUuids;

    protected $fillable = ['name', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];

    public function healthCenters(): HasMany
    {
        return $this->hasMany(HealthCenter::class);
    }
}
```

**HealthCenter** (el lado "hijo" — `belongsTo`):
```php
class HealthCenter extends Model
{
    use HasUuids;

    protected $fillable = ['organization_id', 'name', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
```

Cada modelo declara **su lado** de la relación. Juntos, permiten navegar en ambas
direcciones.

---

## 5. Todo lo que hicimos, paso a paso

1. **Organization** — migración:
   ```bash
   php artisan make:migration create_organizations_table
   ```
   (Escribimos sus columnas con `uuid`, `name`, `is_active`.)

2. **Organization** — modelo:
   ```bash
   php artisan make:model Organization
   ```
   (Le agregamos `HasUuids`, `$fillable`, `$casts` y la relación `hasMany`.)

3. Corrimos la migración → tabla `organizations` creada. ✅

4. **HealthCenter** — migración:
   ```bash
   php artisan make:migration create_health_centers_table
   ```
   (Añadimos la llave foránea `organization_id` con `constrained` y
   `cascadeOnDelete`.)

5. **HealthCenter** — modelo:
   ```bash
   php artisan make:model HealthCenter
   ```
   (Le agregamos `HasUuids`, `$fillable`, `$casts` y la relación `belongsTo`.)

6. Corrimos la migración → tabla `health_centers` creada. ✅

---

## 6. Glosario rápido

- **Relación:** conexión entre dos tablas.
- **Uno-a-muchos:** un registro se conecta con muchos de otra tabla.
- **Llave foránea (foreign key):** columna que apunta al id de otra tabla.
- **`foreignUuid`:** crea una llave foránea de tipo UUID en Laravel.
- **`hasMany`:** relación desde el "padre" ("tengo muchos...").
- **`belongsTo`:** relación desde el "hijo" ("pertenezco a...").
- **`constrained()`:** exige que la llave foránea apunte a un registro real
  (integridad referencial).
- **`cascadeOnDelete()`:** borra los hijos si se borra el padre (cascada).
- **Integridad referencial:** garantía de que las conexiones entre tablas siempre
  son válidas.
- **`is_active`:** columna para desactivar en vez de borrar (baja lógica).
- **Convención modelo↔tabla:** modelo en singular/mayúsculas (`HealthCenter`),
  tabla en plural/minúsculas (`health_centers`).

---

## 7. Qué sigue

La **Fase 2 (Identidad y estructura base)** va así:

- ✅ **Hito 1 — Organizaciones y Centros de Salud** *(¡completado! Es este documento.)*
- ⏳ **Hito 2 — Unidades:** las áreas dentro de cada centro (urgencia adulto,
  urgencia infantil, maternidad...). Practicaremos otra vez el patrón de relación,
  ahora entre centro y unidad.
- ⏳ **Hito 3 — Usuarios:** el personal de salud, con sus roles. Aquí actualizamos
  el modelo `User` a UUID.
- ⏳ **Hito 4 — Auditoría automática:** conectar que las acciones se registren
  solas (el pendiente que dejamos anotado en la Fase 1).

**En resumen:** ya tenemos la base institucional (organizaciones y centros) y
aprendimos a conectar tablas. Ahora seguimos agregando las piezas de identidad. 🏥

---

*Documento de aprendizaje — Proyecto SeñaVida · Fase 2 · Hito 1*
