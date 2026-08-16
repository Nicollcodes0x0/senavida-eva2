# SeñaVida — Bitácora de Aprendizaje

## Fase 1 · Hito 4 — Convenciones base (UUIDs + Auditoría)

> **¿Qué es este documento?**
> Es el resumen, con lenguaje sencillo (de estudiante para estudiante), de lo que
> hicimos para establecer dos **convenciones** que se usarán en TODO el proyecto:
> los **UUIDs** (identificadores únicos) y la **auditoría** (registro de quién
> hace qué). Con este hito se cierra la **Fase 1** completa.

---

## Índice

1. [¿Qué hicimos en este hito?](#1-qué-hicimos-en-este-hito)
2. [Los conceptos nuevos explicados fácil](#2-los-conceptos-nuevos-explicados-fácil)
   - [¿Qué es un UUID?](#qué-es-un-uuid)
   - [¿Por qué UUID y no números?](#por-qué-uuid-y-no-números)
   - [¿Qué es la auditoría?](#qué-es-la-auditoría)
   - [¿Qué es una relación polimórfica?](#qué-es-una-relación-polimórfica)
   - [El trait HasUuids](#el-trait-hasuuids)
   - [¿Qué es $fillable? (asignación masiva)](#qué-es-fillable-asignación-masiva)
   - [¿Qué es $casts?](#qué-es-casts)
3. [La migración de audit_logs, explicada](#3-la-migración-de-audit_logs-explicada)
4. [El modelo AuditLog, explicado](#4-el-modelo-auditlog-explicado)
5. [Todo lo que hicimos, paso a paso](#5-todo-lo-que-hicimos-paso-a-paso)
6. [Lo que quedó pendiente para la Fase 2](#6-lo-que-quedó-pendiente-para-la-fase-2)
7. [Glosario rápido](#7-glosario-rápido)
8. [Resumen de toda la Fase 1](#8-resumen-de-toda-la-fase-1)

---

## 1. ¿Qué hicimos en este hito?

Establecimos **dos convenciones** que se aplicarán a todas las tablas del
proyecto de aquí en adelante:

1. Usar **UUIDs** (códigos únicos) como identificadores, en vez de números.
2. Preparar la **auditoría**: la tabla y el modelo donde se registrará "quién
   hizo qué y cuándo".

Estas decisiones se toman **una sola vez, al principio**, porque afectan todo lo
que se construya después. Es como decidir el sistema de numeración de una
biblioteca antes de colocar los libros: cambiarlo después sería un caos.

---

## 2. Los conceptos nuevos explicados fácil

### ¿Qué es un UUID?

Por defecto, las bases de datos identifican cada fila con un **número que sube**:
el primero es `1`, el segundo `2`, etc. (ID autoincremental).

Un **UUID** (Identificador Único Universal) es distinto: es un **código largo y
aleatorio**, como:

```
9d3f7a12-4c8b-4e21-9f0a-2b7c1d5e8a34
```

Cada registro tiene uno único e imposible de adivinar.

### ¿Por qué UUID y no números?

En un sistema de salud, los UUIDs son mejores por tres razones:

- **Seguridad:** con números, si tu paciente es el `47`, alguien podría adivinar
  que existe el `48`, el `49`... y tratar de espiar sus datos. Con un UUID
  aleatorio, **no se puede adivinar** el siguiente.
- **Privacidad:** un número revela cuántos registros hay (si eres el paciente
  `1000`, se sabe que hay ~1000 pacientes). El UUID no revela nada.
- **Multitenancy:** como varios hospitales comparten la misma base de datos, los
  UUIDs evitan choques y confusiones entre centros.

> Los documentos del proyecto **piden explícitamente UUIDs**. No es una elección
> nuestra, es un requisito del proyecto.

**Analogía:** un ID numérico es como el número de tu asiento en el cine (fácil
adivinar el de al lado). Un UUID es como el código de barras de una entrada:
largo, único e imposible de adivinar.

### ¿Qué es la auditoría?

**Auditoría** es **registrar automáticamente quién hizo qué y cuándo** en el
sistema. Cada acción importante (crear un paciente, firmar una nota, cerrar una
atención) queda anotada en un "libro de registro" (la tabla `audit_logs`).

**¿Por qué es crucial en salud?** Porque si algo sale mal, se necesita saber
**quién hizo cada cosa**: "¿quién modificó los datos de este paciente y a qué
hora?". Sin auditoría, no hay forma de saberlo. Es un requisito legal en sistemas
de salud.

**Analogía:** es como las **cámaras de seguridad de un banco**. Nadie las mira
todo el tiempo, pero si pasa algo, quedan grabadas todas las acciones para
revisar qué ocurrió y quién estuvo involucrado.

### ¿Qué es una relación polimórfica?

La tabla de auditoría tiene dos columnas juntas: `auditable_type` (qué **tipo** de
cosa) y `auditable_id` (**cuál** en concreto). Juntas permiten que **una sola
tabla** de auditoría registre acciones sobre **cualquier** entidad: un paciente,
una sesión, una nota, lo que sea.

Eso se llama **relación polimórfica**: "poli" = muchos, "morfo" = formas. Una
tabla que puede apuntar a muchos tipos distintos de cosas.

**Ejemplo:** un registro puede decir `auditable_type = "Patient"`,
`auditable_id = "9d3f..."` (se auditó a ese paciente). Otro puede decir
`auditable_type = "MedicalSession"`, `auditable_id = "7a1b..."` (se auditó esa
sesión). Misma tabla, distintos tipos.

### El trait HasUuids

¿Recuerdas los **traits** del Hito 2 (paquetes de habilidades que se agregan a
una clase)? `HasUuids` es otro trait. Su poder: hace que el modelo **genere un
UUID automáticamente** cada vez que creas un registro.

Sin él, tendrías que generar el código largo tú misma cada vez. Con él, Laravel
lo hace solo. Se activa igual que cualquier trait: se importa arriba y se activa
dentro de la clase.

### ¿Qué es $fillable? (asignación masiva)

`$fillable` es una **lista de las columnas que se pueden llenar** al crear un
registro desde el código.

**¿Por qué existe?** Por seguridad. Laravel, por defecto, no deja rellenar
cualquier columna de golpe, para evitar que alguien malicioso llene campos que no
debería. `$fillable` es la **"lista blanca"**: "estas columnas sí se pueden
llenar, las demás no".

Este mecanismo de protección se llama **asignación masiva (mass assignment)**.

**Analogía:** es como un formulario donde solo ciertos campos están habilitados
para escribir; los demás están bloqueados para que nadie meta datos donde no
debe.

### ¿Qué es $casts?

Un **cast** (conversión) le dice a Laravel que **trate una columna de una forma en
el código y de otra en la base de datos**.

En nuestro modelo, `'changes' => 'array'` significa: guarda la columna `changes`
como **JSON** en PostgreSQL, pero trátala como **array** en el código PHP. Laravel
hace la traducción automática en los dos sentidos.

**¿Por qué?** Porque en PHP es cómodo trabajar con arrays, pero en la base se
guarda como JSON. El cast evita que tengas que convertir a mano cada vez.

---

## 3. La migración de audit_logs, explicada

Esta es la migración (el "plano" de la tabla) que escribimos:

```php
Schema::create('audit_logs', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('user_id')->nullable();
    $table->string('action');
    $table->string('auditable_type')->nullable();
    $table->uuid('auditable_id')->nullable();
    $table->json('changes')->nullable();
    $table->string('ip_address', 45)->nullable();
    $table->timestamps();
});
```

Columna por columna:

| Columna | Qué guarda | Nota |
|---|---|---|
| `id` | UUID del registro de auditoría | Es la clave primaria (`primary`) |
| `user_id` | **Quién** hizo la acción (UUID del usuario) | `nullable`: puede estar vacío (acciones del sistema) |
| `action` | **Qué** hizo (`created`, `updated`...) | Obligatorio |
| `auditable_type` | Sobre **qué tipo** de cosa (`Patient`...) | Parte de la relación polimórfica |
| `auditable_id` | Sobre **cuál** en concreto (UUID) | Parte de la relación polimórfica |
| `changes` | **Detalles** de qué cambió | En formato JSON |
| `ip_address` | Desde qué **dirección IP** | Máximo 45 caracteres (cabe IPv6) |
| `created_at` / `updated_at` | **Cuándo** | Los crea `timestamps()` |

- **`nullable()`** = "puede estar vacío".
- **`up()`** crea la tabla; **`down()`** la borra (el "deshacer" de la migración).

---

## 4. El modelo AuditLog, explicado

Este es el modelo (la clase que representa la tabla):

```php
class AuditLog extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id', 'action', 'auditable_type',
        'auditable_id', 'changes', 'ip_address',
    ];

    protected $casts = [
        'changes' => 'array',
    ];
}
```

- **`use HasUuids;`** → genera UUIDs automáticamente al crear registros.
- **`$fillable`** → la lista blanca de columnas que se pueden llenar (no incluye
  `id` ni las fechas, que Laravel llena solo).
- **`$casts`** → convierte `changes` entre JSON (base de datos) y array (código).

Con esto, el modelo `AuditLog` se conecta con la tabla `audit_logs` y se puede
usar desde el código con cosas como `AuditLog::create(...)`, sin escribir SQL.

---

## 5. Todo lo que hicimos, paso a paso

1. **Creamos la migración** de la tabla de auditoría:
   ```bash
   php artisan make:migration create_audit_logs_table
   ```

2. **Escribimos las columnas** en la migración, usando `uuid('id')->primary()`
   para aplicar la convención UUID por primera vez.

3. **Ejecutamos la migración** para crear la tabla en PostgreSQL:
   ```bash
   php artisan migrate
   ```
   Resultado: `create_audit_logs_table ... DONE` ✅

4. **Creamos el modelo:**
   ```bash
   php artisan make:model AuditLog
   ```

5. **Configuramos el modelo** con `HasUuids`, `$fillable` y `$casts`.

6. **Verificamos que no había errores** con `php artisan about`.

---

## 6. Lo que quedó pendiente para la Fase 2

⏳ **La auditoría automática.** En este hito dejamos la **infraestructura** lista
(tabla + modelo), pero todavía **no conectamos** que cada acción se registre
sola. Eso se hará en la **Fase 2**, cuando existan los usuarios y las acciones que
auditar (no se puede auditar acciones de usuarios que aún no existen).

En la Fase 2 usaremos esta base para que, por ejemplo, cada vez que se cree o
modifique un paciente, se guarde solo un registro en `audit_logs`.

---

## 7. Glosario rápido

- **UUID:** identificador único y aleatorio (código largo), en vez de un número.
- **ID autoincremental:** el identificador numérico por defecto (1, 2, 3...).
- **Auditoría:** registro automático de quién hizo qué y cuándo.
- **`audit_logs`:** la tabla que guarda esos registros.
- **Relación polimórfica:** cuando una tabla puede apuntar a muchos tipos de
  entidades distintas (con `..._type` + `..._id`).
- **`HasUuids`:** trait que genera UUIDs automáticamente.
- **`$fillable`:** lista de columnas que se pueden llenar (lista blanca).
- **Asignación masiva (mass assignment):** protección de Laravel; solo se llenan
  las columnas de `$fillable`.
- **`$casts`:** convierte una columna entre formatos (ej: JSON ↔ array).
- **`nullable()`:** una columna que puede estar vacía.
- **`make:migration` / `make:model`:** comandos para crear migraciones y modelos.

---

## 8. Resumen de toda la Fase 1

¡Con este hito se cierra la **Fase 1 (Fundaciones)** completa! Esto es lo que se
construyó a lo largo de los cuatro hitos:

| Hito | Qué se logró |
|---|---|
| **Hito 1** | Proyecto Laravel creado y conectado a PostgreSQL |
| **Hito 2** | Sanctum instalado (autenticación por token) |
| **Hito 3** | CORS configurado (para que el frontend se conecte) |
| **Hito 4** | Convenciones base: UUIDs + infraestructura de auditoría |

**El resultado:** un backend con cimientos sólidos y profesionales — conectado a
la base de datos, con seguridad preparada, autorización para el frontend y las
convenciones definidas.

**Lo que viene (Fase 2):** crear las tablas y modelos de verdad —
organizaciones, centros, unidades, usuarios, pacientes, sesiones médicas— y
conectar la auditoría automática.

**En resumen:** los cimientos de la casa están puestos. Ahora empieza a levantarse
la estructura. 🏗️

---

*Documento de aprendizaje — Proyecto SeñaVida · Fase 1 · Hito 4 · Cierre de Fase 1*
