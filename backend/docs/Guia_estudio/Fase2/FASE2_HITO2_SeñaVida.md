# SeñaVida — Bitácora de Aprendizaje

## Fase 2 · Hito 2 — Unidades

> **¿Qué es este documento?**
> Es el resumen, con lenguaje sencillo (de estudiante para estudiante), de lo que
> hicimos para crear la tabla **units** (unidades asistenciales) y completar la
> jerarquía institucional del sistema: **Organización → Centro → Unidad**. En este
> hito repetimos el patrón de relaciones que aprendimos antes, para afianzarlo.

---

## Índice

1. [¿Qué hicimos en este hito?](#1-qué-hicimos-en-este-hito)
2. [La jerarquía completa](#2-la-jerarquía-completa)
3. [Repaso del patrón que repetimos](#3-repaso-del-patrón-que-repetimos)
4. [Lo nuevo: un modelo con relaciones en dos direcciones](#4-lo-nuevo-un-modelo-con-relaciones-en-dos-direcciones)
5. [La tabla y el modelo que creamos](#5-la-tabla-y-el-modelo-que-creamos)
6. [Todo lo que hicimos, paso a paso](#6-todo-lo-que-hicimos-paso-a-paso)
7. [Glosario rápido](#7-glosario-rápido)
8. [Qué sigue](#8-qué-sigue)

---

## 1. ¿Qué hicimos en este hito?

Creamos la tabla **units** (unidades): las áreas asistenciales dentro de cada
centro de salud, como "urgencia adulto", "urgencia infantil" o "maternidad".

Con esto completamos la **jerarquía institucional** del sistema: tres niveles
conectados entre sí.

Este hito fue, sobre todo, **práctica**: repetimos el patrón de relación
uno-a-muchos que aprendimos en el hito anterior, ahora entre el centro y la
unidad. Repetir es la mejor forma de fijar un concepto.

---

## 2. La jerarquía completa

Después de este hito, la estructura institucional queda así:

```
Organización            (Servicio de Salud Araucanía Sur)
    └── Centro de salud  (Hospital Regional de Villarrica)
            └── Unidad   (Urgencia Adulto, Maternidad...)
```

Cada nivel se conecta con el de arriba y con el de abajo:
- Una **organización** tiene muchos **centros**.
- Un **centro** tiene muchas **unidades** (y pertenece a una organización).
- Una **unidad** pertenece a un **centro**.

**Analogía:** es como una empresa.
- Empresa (organización) → tiene varias sedes.
- Sede (centro) → tiene varios departamentos.
- Departamento (unidad) → pertenece a una sede.

---

## 3. Repaso del patrón que repetimos

Este hito usó **exactamente** el mismo patrón del hito anterior. Solo cambiaron
los nombres. Compara:

| Hito anterior | Este hito |
|---|---|
| `HealthCenter` **belongsTo** `Organization` | `Unit` **belongsTo** `HealthCenter` |
| `Organization` **hasMany** `HealthCenter` | `HealthCenter` **hasMany** `Unit` |
| Llave foránea: `organization_id` | Llave foránea: `health_center_id` |

Es la misma **relación uno-a-muchos** con **llave foránea**, un nivel más abajo en
la jerarquía.

> **Lección importante:** una vez que entiendes una relación uno-a-muchos, todas
> las demás son iguales. Cambian los nombres, no el concepto. Por eso este hito se
> sintió más fácil que el anterior.

---

## 4. Lo nuevo: un modelo con relaciones en dos direcciones

Lo único verdaderamente nuevo de este hito fue ver que un modelo "del medio" tiene
relaciones en **ambas direcciones**.

El `HealthCenter` está en el medio de la jerarquía, así que mira hacia arriba y
hacia abajo:

```
Organización
    └── Centro   ← belongsTo hacia arriba (su organización)
            └── Unidad   ← hasMany hacia abajo (sus unidades)
```

Por eso, en el modelo `HealthCenter` ahora hay **dos** relaciones:

| Método | Tipo | Dirección | Significa |
|---|---|---|---|
| `organization()` | `belongsTo` | hacia arriba | "pertenezco a una organización" |
| `units()` | `hasMany` | hacia abajo | "tengo muchas unidades" |

Gracias a esto puedes navegar en las dos direcciones desde un centro:
```php
$centro->organization   // sube: la organización del centro
$centro->units          // baja: las unidades del centro
```

---

## 5. La tabla y el modelo que creamos

**Tabla units:**
```php
$table->uuid('id')->primary();
$table->foreignUuid('health_center_id')->constrained()->cascadeOnDelete();
$table->string('name');
$table->boolean('is_active')->default(true);
$table->timestamps();
```
La llave foránea `health_center_id` conecta la unidad con su centro.

**Modelo Unit:**
```php
class Unit extends Model
{
    use HasUuids;

    protected $fillable = ['health_center_id', 'name', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];

    public function healthCenter(): BelongsTo
    {
        return $this->belongsTo(HealthCenter::class);
    }
}
```

**Ajuste en HealthCenter** (le agregamos el `hasMany` hacia sus unidades):
```php
public function units(): HasMany
{
    return $this->hasMany(Unit::class);
}
```

---

## 6. Todo lo que hicimos, paso a paso

1. **Migración** de la tabla units:
   ```bash
   php artisan make:migration create_units_table
   ```
   (Con la llave foránea `health_center_id`, igual patrón que antes.)

2. **Modelo** Unit:
   ```bash
   php artisan make:model Unit
   ```
   (Con `HasUuids`, `$fillable`, `$casts` y la relación `belongsTo`.)

3. **Ajuste** en HealthCenter: le agregamos la relación `hasMany` hacia units, y
   la importación de `HasMany` arriba.

4. Corrimos la migración → tabla `units` creada. ✅

---

## 7. Glosario rápido

(Los conceptos son los mismos del hito anterior; este hito los reforzó.)

- **Unidad:** área asistencial dentro de un centro (urgencia, maternidad...).
- **Jerarquía:** la estructura de niveles Organización → Centro → Unidad.
- **Relación uno-a-muchos:** un registro conectado con muchos de otra tabla.
- **`belongsTo`:** "pertenezco a..." (desde el hijo, mirando hacia arriba).
- **`hasMany`:** "tengo muchos..." (desde el padre, mirando hacia abajo).
- **Llave foránea:** columna que conecta con otra tabla (`health_center_id`).
- **Modelo del medio:** uno que tiene relaciones en ambas direcciones (como
  HealthCenter: `belongsTo` una organización y `hasMany` unidades).

---

## 8. Qué sigue

La **Fase 2 (Identidad y estructura base)** va así:

- ✅ **Hito 1 — Organizaciones y Centros de Salud**
- ✅ **Hito 2 — Unidades** *(¡completado! Es este documento.)*
- ⏳ **Hito 3 — Usuarios:** el personal de salud, con sus roles. Aquí
  actualizamos el modelo `User` a UUID y lo conectamos con su organización,
  centro y unidad. Es un hito clave (el login se apoya en él).
- ⏳ **Hito 4 — Auditoría automática:** conectar que las acciones se registren
  solas (el pendiente que dejamos anotado en la Fase 1).

**En resumen:** ya tenemos la estructura institucional completa (organización,
centro, unidad) y el patrón de relaciones bien afianzado. Ahora viene lo grande:
los usuarios. 👤

---

*Documento de aprendizaje — Proyecto SeñaVida · Fase 2 · Hito 2*
