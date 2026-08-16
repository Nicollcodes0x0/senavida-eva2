# SeñaVida — Bitácora de Aprendizaje

## Fase 2 · Hito 4 — Auditoría automática

> **¿Qué es este documento?**
> Es el resumen, con lenguaje sencillo (de estudiante para estudiante), de lo que
> hicimos para que la tabla `audit_logs` se **llene sola** cada vez que ocurre una
> acción, usando un **Observer**. Con este hito se cierra la **Fase 2** completa y
> se resuelve el pendiente que arrastrábamos desde la Fase 1.

---

## Índice

1. [¿Qué hicimos en este hito?](#1-qué-hicimos-en-este-hito)
2. [Los conceptos nuevos explicados fácil](#2-los-conceptos-nuevos-explicados-fácil)
   - [¿Qué es un Observer?](#qué-es-un-observer)
   - [Los eventos de Eloquent](#los-eventos-de-eloquent)
   - [Cómo se conecta un Observer a un modelo](#cómo-se-conecta-un-observer-a-un-modelo)
   - [¿Qué es Tinker?](#qué-es-tinker)
3. [El Observer explicado](#3-el-observer-explicado)
4. [La prueba que hicimos](#4-la-prueba-que-hicimos)
5. [Todo lo que hicimos, paso a paso](#5-todo-lo-que-hicimos-paso-a-paso)
6. [Glosario rápido](#6-glosario-rápido)
7. [Resumen de toda la Fase 2](#7-resumen-de-toda-la-fase-2)

---

## 1. ¿Qué hicimos en este hito?

Hicimos que la **auditoría** funcione **automáticamente**. Es decir: cada vez que
alguien crea, modifica o borra algo importante en el sistema, queda registrado
**solo** en la tabla `audit_logs`, sin que nadie escriba el registro a mano.

En la Fase 1 dejamos la tabla y el modelo de auditoría listos, pero "apagados".
En este hito los "encendimos" con un **Observer**.

---

## 2. Los conceptos nuevos explicados fácil

### ¿Qué es un Observer?

Un **Observer** (observador) es una clase que **vigila un modelo** y **reacciona
automáticamente** cuando algo le pasa. No tienes que decirle "haz esto ahora"; él
actúa solo cuando ocurre el evento.

**Analogía:** un Observer es como un **portero que anota en un cuaderno** cada vez
que alguien entra o sale del edificio. Nadie le dice "anota" cada vez — él lo hace
solo, automáticamente, cada vez que pasa algo.

En nuestro caso, el Observer vigila los modelos (Organization, HealthCenter, Unit,
User) y, cuando les pasa algo, anota un registro en `audit_logs`.

### Los eventos de Eloquent

Los modelos de Laravel disparan **eventos** en momentos clave de su vida:

- **`created`** → cuando se **crea** un registro.
- **`updated`** → cuando se **modifica**.
- **`deleted`** → cuando se **borra**.

(Hay más: `restored`, `forceDeleted`, etc.)

Un Observer "escucha" esos eventos. Es como si el modelo gritara "¡me acaban de
crear!" y el Observer lo oyera y reaccionara.

### Cómo se conecta un Observer a un modelo

Escribir el Observer no basta: hay que **decirle a cada modelo que lo use**. En
Laravel 13 se hace con un **atributo** justo antes de la clase:

```php
#[ObservedBy([AuditLogObserver::class])]
class Organization extends Model
```

Esto le dice a Laravel: *"este modelo está vigilado por el AuditLogObserver"*. Es
como asignarle al portero una puerta específica para vigilar.

Los `#[...]` de Laravel 13 se llaman **atributos de PHP**: una forma moderna de
"etiquetar" una clase con información. (Ya habías visto otros: `#[Fillable(...)]`,
`#[Hidden(...)]`.)

### ¿Qué es Tinker?

**Tinker** es una herramienta de Laravel que te deja **ejecutar código PHP en
vivo** desde la terminal, para probar cosas sin tener que crear una pantalla.

**Analogía:** Tinker es como un **cuaderno de borrador** donde pruebas cosas
rápido antes de escribirlas "en limpio". Lo usamos para crear una organización de
prueba y comprobar que la auditoría la registraba sola.

Se entra con `php artisan tinker` y se sale con `exit`.

> **Ojo:** los comandos de Tinker se escriben **dentro** de Tinker (después de
> `php artisan tinker`), no en la terminal normal. Si los escribes en la terminal
> normal, PowerShell da error (nos pasó en la prueba).

---

## 3. El Observer explicado

Este es el Observer que escribimos:

```php
class AuditLogObserver
{
    public function created(Model $model): void
    {
        $this->record($model, 'created', $model->getAttributes());
    }

    public function updated(Model $model): void
    {
        $this->record($model, 'updated', $model->getChanges());
    }

    public function deleted(Model $model): void
    {
        $this->record($model, 'deleted', $model->getOriginal());
    }

    protected function record(Model $model, string $action, array $changes): void
    {
        AuditLog::create([
            'user_id'        => Auth::id(),
            'action'         => $action,
            'auditable_type' => $model->getMorphClass(),
            'auditable_id'   => $model->getKey(),
            'changes'        => $changes,
            'ip_address'     => Request::ip(),
        ]);
    }
}
```

Cómo funciona:

- Los tres métodos (`created`, `updated`, `deleted`) se ejecutan **solos** cuando
  le pasa eso al modelo. Cada uno llama al método interno `record()` con una
  acción distinta.
- **`record()`** es el corazón: crea el registro en `audit_logs` con:

| Dato | De dónde sale | Qué es |
|---|---|---|
| `user_id` | `Auth::id()` | **quién** (por ahora `null`, sin login) |
| `action` | el método que lo llamó | **qué** (`created`, `updated`, `deleted`) |
| `auditable_type` | `$model->getMorphClass()` | **qué tipo** de entidad |
| `auditable_id` | `$model->getKey()` | **cuál** en concreto (su UUID) |
| `changes` | los datos del modelo | **qué cambió** (JSON) |
| `ip_address` | `Request::ip()` | desde **qué IP** |

> **El `user_id` en `null` es esperado.** Como aún no hay login, no hay usuario
> logueado. Cuando construyamos el login en la Fase 3, `Auth::id()` devolverá el
> usuario y se llenará solo. Por eso la columna la hicimos `nullable()`.

---

## 4. La prueba que hicimos

Para confirmar que funcionaba, usamos Tinker:

1. Creamos una organización:
   ```php
   App\Models\Organization::create(['name' => 'Organización de Prueba']);
   ```

2. Miramos la auditoría:
   ```php
   App\Models\AuditLog::all();
   ```
   → Apareció **un registro** con `action: "created"`,
   `auditable_type: "App\Models\Organization"`, y el `auditable_id` coincidiendo
   con la organización. ✅

3. Creamos también un centro y contamos los registros:
   ```php
   App\Models\AuditLog::count();
   ```
   → Devolvió **2** (la organización + el centro). ✅

**Conclusión:** el Observer registra las acciones automáticamente en todos los
modelos vigilados. La auditoría automática funciona.

---

## 5. Todo lo que hicimos, paso a paso

1. **Creamos el Observer:**
   ```bash
   php artisan make:observer AuditLogObserver
   ```

2. **Escribimos su lógica:** los métodos `created`, `updated`, `deleted` y el
   método interno `record()` que crea el registro en `audit_logs`.

3. **Conectamos el Observer** a los cuatro modelos (Organization, HealthCenter,
   Unit, User) con `#[ObservedBy([AuditLogObserver::class])]`.

4. **Probamos con Tinker** que la auditoría se registraba sola. → ¡Funcionó! ✅

---

## 6. Glosario rápido

- **Observer:** clase que vigila un modelo y reacciona sola a sus eventos.
- **Evento de Eloquent:** momento clave en la vida de un registro (`created`,
  `updated`, `deleted`...).
- **`#[ObservedBy(...)]`:** atributo que conecta un modelo con su Observer.
- **Atributo de PHP (`#[...]`):** etiqueta moderna para dar información a una
  clase.
- **Tinker:** consola de Laravel para probar código PHP en vivo.
- **`Auth::id()`:** devuelve el UUID del usuario logueado (o `null` si no hay).
- **`getMorphClass()`:** devuelve el nombre del modelo (para la relación
  polimórfica).
- **`getKey()`:** devuelve el identificador (UUID) del registro.
- **Auditoría automática:** que las acciones se registren solas, sin escribirlas a
  mano.

---

## 7. Resumen de toda la Fase 2

¡Con este hito se cierra la **Fase 2 (Identidad y estructura base)** completa!

| Hito | Qué se logró |
|---|---|
| **Hito 1** | Organizaciones y Centros de Salud (con relaciones) |
| **Hito 2** | Unidades (jerarquía Organización → Centro → Unidad) |
| **Hito 3** | Usuarios con UUID, relaciones y rol |
| **Hito 4** | Auditoría automática con un Observer |

**Lo que tienes construido hasta ahora:**

```
Organización → Centro → Unidad          (jerarquía institucional)
Usuario (UUID, rol, conectado a todo)
Auditoría automática (registra solo)
Sanctum (listo para emitir tokens)
```

**Lo que viene (Fase 3):** la **autenticación real** — el login con Sanctum,
usando el usuario que construimos. Es donde se juegan los puntos grandes de la
rúbrica (login + middleware + registro con cifrado de contraseña).

**En resumen:** ya tenemos toda la base de identidad del sistema, y la auditoría
funcionando sola. Ahora viene lo que más puntos da: la autenticación. 🔐

---

*Documento de aprendizaje — Proyecto SeñaVida · Fase 2 · Hito 4 · Cierre de Fase 2*
