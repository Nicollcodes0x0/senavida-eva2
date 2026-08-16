# SeñaVida — Bitácora de Aprendizaje

## Dos niveles de administrador — super_admin y admin_institucional

> **¿Qué es este documento?**
> Es el resumen, con lenguaje sencillo (de estudiante para estudiante), de cómo
> se introdujo un **segundo nivel de administrador** (`super_admin`) al sistema,
> se construyeron los **endpoints de creación** para organizaciones, centros y
> unidades, y se reconstruyó toda la estructura de datos de prueba usando
> exclusivamente los propios endpoints de la API.

---

## Índice

1. [¿Qué se hizo en esta sesión?](#1-qué-se-hizo-en-esta-sesión)
2. [Por qué se necesitaban dos niveles de admin](#2-por-qué-se-necesitaban-dos-niveles-de-admin)
3. [La nueva jerarquía de permisos](#3-la-nueva-jerarquía-de-permisos)
4. [El patrón "doble camino según el rol"](#4-el-patrón-doble-camino-según-el-rol)
5. [Los endpoints nuevos: store()](#5-los-endpoints-nuevos-store)
6. [El error que apareció y cómo se resolvió](#6-el-error-que-apareció-y-cómo-se-resolvió)
7. [La estructura de datos reconstruida](#7-la-estructura-de-datos-reconstruida)
8. [Glosario rápido](#8-glosario-rápido)
9. [Qué sigue](#9-qué-sigue)

---

## 1. ¿Qué se hizo en esta sesión?

Se agregó un rol nuevo, **`super_admin`**, y se construyeron **3 endpoints de
creación** (`POST /organizations`, `POST /health-centers`, `POST /units`) que
antes no existían — solo había endpoints para **consultar** esos catálogos, no
para crearlos. Con esto, todo el sistema pasó a ser gestionable desde la propia
API, sin depender de Tinker (salvo para el primer super_admin).

Después, se **limpiaron** los datos de prueba viejos y se **reconstruyó** una
estructura completa nueva (1 organización, 2 centros, 6 unidades, 12 usuarios)
usando exclusivamente los endpoints reales.

---

## 2. Por qué se necesitaban dos niveles de admin

Antes, solo existía `admin_institucional`, limitado a su propio centro. Pero
¿quién crea el **primer** centro de un hospital nuevo? Un admin institucional no
debería poder hacerlo — su autoridad es sobre un centro que **ya existe**, no
sobre decidir que un centro nuevo se sume al sistema.

Se necesitaba una autoridad **superior**, que gestione la estructura completa
(organizaciones y centros), separada de quien gestiona el día a día de un
centro específico (unidades y personal).

---

## 3. La nueva jerarquía de permisos

```
SUPER_ADMIN (libre, sin centro fijo)
   └── Crea: Organizaciones, Centros de Salud, Unidades (en cualquiera),
             Usuarios (en cualquier centro)

ADMIN_INSTITUCIONAL (pertenece a UN centro específico)
   └── Crea: Unidades (solo en su centro), Usuarios (solo en su centro)

MÉDICO / ADMISIÓN / CATEGORIZACIÓN
   └── No crean nada de esto — roles operativos
```

**Decisión clave:** el `super_admin` **no pertenece a ningún centro** — sus
columnas `health_center_id` y `unit_id` quedan en `null`. Por eso puede actuar
sobre cualquier centro sin restricción.

---

## 4. El patrón "doble camino según el rol"

Este es el concepto técnico central de la sesión. Hasta ahora, las
verificaciones de rol eran simples: *"¿eres exactamente este rol? Si no,
rechazo."* Ahora se necesitaba algo más elaborado: reglas distintas según
**cuál** de dos roles válidos tiene la persona.

### `in_array()` — permitir varios roles a la vez

```php
if (! in_array($user->role, ['super_admin', 'admin_institucional'])) {
    return response()->json([...], 403);
}
```

**`in_array($valor, [lista])`** pregunta si `$valor` está dentro de la lista.
Aquí se usa para decir: *"si el rol NO es super_admin NI admin_institucional,
rechaza."* Evita escribir dos condiciones separadas con `||`.

### La restricción condicional — solo aplica a uno de los dos roles

```php
if ($user->role === 'admin_institucional' && $data['healthCenterId'] !== $user->health_center_id) {
    return response()->json([...], 403);
}
```

Fíjate en el orden: primero se pregunta **de qué rol se trata**
(`$user->role === 'admin_institucional'`), y **solo si** es ese rol específico,
se aplica la comparación de centro. Si es `super_admin`, esta condición nunca se
cumple (porque la primera parte ya es falsa), así que **no se le aplica ninguna
restricción** — puede actuar en cualquier centro.

**Por qué el orden importa:** si se comparara el centro sin antes filtrar por
rol, el `super_admin` (que tiene `health_center_id = null`) **siempre** fallaría
la comparación, porque `null` nunca es igual a un UUID real — quedaría bloqueado
por error.

---

## 5. Los endpoints nuevos: store()

Se agregó el método **`store()`** (la convención de Laravel para "crear un
registro nuevo") a tres controladores que antes solo tenían `index()` (listar):

| Controlador | Quién puede usar `store()` | Restricción |
|---|---|---|
| `OrganizationController` | Solo `super_admin` | Ninguna — crea donde sea |
| `HealthCenterController` | Solo `super_admin` | Ninguna — crea donde sea |
| `UnitController` | `super_admin` o `admin_institucional` | El segundo, solo en su centro |
| `UserController` (ya existía) | `super_admin` o `admin_institucional` | El segundo, solo en su centro |

Cada `store()` sigue el mismo patrón ya conocido: verificar rol → validar datos
→ crear → responder con `201`.

---

## 6. El error que apareció y cómo se resolvió

Al intentar registrar el primer usuario con el token del super_admin, apareció:
```json
{"success": false, "error": {"message": "No tienes permiso para registrar usuarios."}}
```

**Causa:** el `UserController@register` **solo** comprobaba
`$admin->role !== 'admin_institucional'` — nunca se había actualizado para
aceptar también a `super_admin`, aunque la decisión de diseño lo incluía.

**Solución:** se aplicó el mismo patrón de "doble camino" que ya se usó en
`UnitController`:
- Bloque de verificación de rol → `in_array($admin->role, ['super_admin', 'admin_institucional'])`.
- Bloque de restricción de centro → solo se evalúa si
  `$admin->role === 'admin_institucional'`.

**Lección:** al agregar un rol nuevo con permisos ampliados, hay que revisar
**todos** los controladores que antes solo aceptaban el rol anterior — no basta
con cambiarlo en uno solo.

---

## 7. La estructura de datos reconstruida

Se limpiaron los datos viejos (en el orden correcto: usuarios → unidades →
centros → organizaciones) y se reconstruyó todo usando los propios endpoints:

```
Organización: Servicio de Salud Metropolitano
├── Centro: Hospital San Rafael
│   ├── Unidad: Urgencia Adulto   → Enfermero Uno SR (admisión), Dr. Uno SR (médico)
│   ├── Unidad: Urgencia Infantil → Categorizador Uno SR (categorización), Dra. Dos SR (médico)
│   └── Unidad: Maternidad        → Admin Dos SR (admin_institucional), Dra. Maternidad SR (médico)
└── Centro: Hospital Santa Lucía
    ├── Unidad: Urgencia Adulto   → Enfermero Uno SL (admisión), Admin Uno SL (admin_institucional)
    ├── Unidad: Traumatología     → Dr. Trauma SL (médico), Categorizador Uno SL (categorización)
    └── Unidad: Pediatría         → Dra. Pediatra SL (médico), Enfermero Pediatra SL (admisión)
```

Cada organización, centro, unidad y usuario se creó con `POST`, usando el
Bearer token del super_admin — demostrando el flujo real que usaría el sistema
en producción, no atajos de desarrollo.

---

## 8. Glosario rápido

- **`super_admin`:** rol libre (sin centro fijo) que gestiona toda la estructura
  del sistema.
- **`store()`:** método por convención para crear un registro nuevo (junto a
  `index()` para listar).
- **`in_array()`:** función que comprueba si un valor está dentro de una lista.
- **Doble camino según el rol:** lógica que aplica reglas distintas dependiendo
  de cuál, entre varios roles válidos, tiene el usuario.
- **Orden de las condiciones:** filtrar primero por rol y solo después comparar
  datos específicos, para no aplicar restricciones a quien no corresponde.

---

## 9. Qué sigue

Con esta mejora, el sistema de roles y permisos queda mucho más completo:

- ✅ Autenticación completa (login, me, logout).
- ✅ Registro de usuarios reforzado.
- ✅ Catálogos consultables **y creables** (organizaciones, centros, unidades).
- ✅ Dos niveles de administración, con reglas de permisos claras.

**Pendiente para el futuro:** endpoints para **editar** y **desactivar**
(no solo crear) estos catálogos; y decidir si el `super_admin` puede crear
otros `super_admin` vía API o eso queda exclusivo de Tinker.

**En resumen:** el sistema ahora refleja una jerarquía de autoridad realista,
propia de una plataforma multi-hospital, construida enteramente a través de la
propia API. 🏥🔐

---

*Documento de aprendizaje — Proyecto SeñaVida · Dos niveles de administrador*
