# FRONTEND_BACKEND_REQUIREMENTS

**Proyecto:** SEÑAVIDA — Plataforma de comunicación inclusiva en salud
**Documento:** Requisitos del backend
**Versión:** 2.0 — arquitectura **API REST**
**Fecha:** 2026-08-05

> **Arquitectura del proyecto (v2).** El backend se construye como una **API REST**
> en **Laravel 12 + PostgreSQL**, con autenticación **Laravel Sanctum (Bearer
> token)**. El frontend (React + Vite) es un **proyecto separado**, desarrollado
> por otra persona, que consume esta API. Todas las rutas viven bajo `/api/v1` y
> las respuestas son JSON con un envoltorio estándar. Estas decisiones fueron
> ratificadas por el equipo y el docente. El detalle normativo está en
> `FRONTEND_BACKEND_CONTRACT.md` (v2.0.0).

---

## Antes de empezar: cómo leer este documento

Este documento está escrito para que **cualquier estudiante de Ingeniería de
Software pueda entenderlo**, sin necesidad de ser experto.

Cada vez que aparezca una palabra técnica, se explica de inmediato con palabras
sencillas. Por ejemplo:

> **Backend**: es la parte del sistema que no se ve. Guarda la información,
> decide quién puede hacer qué y responde a lo que pide la pantalla.
>
> **Frontend**: es la parte que sí se ve. Los botones, los formularios, las
> pantallas que usa una persona.

### Documentos relacionados

Este no es el único documento del proyecto. Ya existen otros dos, y cada uno
responde una pregunta distinta:

| Documento | Pregunta que responde |
|---|---|
| `BACKEND_IMPLEMENTATION_GUIDE.md` | ¿Cómo está hecho el frontend por dentro? |
| `FRONTEND_BACKEND_CONTRACT.md` | ¿Cómo deben comunicarse las dos partes? |
| **Este documento** | **¿Qué tiene que construir el backend?** |

Si quieres saber **qué hay que hacer**, este es el documento correcto. Si además
necesitas saber **exactamente cómo debe verse cada mensaje** entre las dos
partes, entonces revisa el contrato.

### Una aclaración importante

El frontend de SEÑAVIDA ya está construido: tiene todas sus pantallas
terminadas y se ve como un sistema real y funcionando.

Pero hay algo fundamental que debes saber: **ese frontend no se comunica con
ningún servidor.** Toda la información que muestra está escrita directamente
dentro del código, como si fuera un ejemplo. Cuando la persona recarga la
página, todo lo que hizo desaparece.

Esto significa que:

- **No hay nada del backend que ya esté hecho.** Se empieza desde cero.
- Las pantallas ya existen, así que **sabemos exactamente qué información
  necesitan**. Eso es una ventaja enorme: no hay que adivinar.
- Muchas cosas que en la pantalla *parecen* funcionar, en realidad no hacen
  nada. Este documento marca esos casos con claridad.

---

## Índice

1. [Objetivo](#1-objetivo)
2. [Alcance](#2-alcance)
3. [Requerimientos funcionales](#3-requerimientos-funcionales)
4. [Requerimientos no funcionales](#4-requerimientos-no-funcionales)
5. [Dependencias entre módulos](#5-dependencias-entre-módulos)
6. [Prioridad de implementación](#6-prioridad-de-implementación)
7. [Necesidades técnicas](#7-necesidades-técnicas)
8. [Riesgos](#8-riesgos)
9. [Criterios de aceptación](#9-criterios-de-aceptación)
10. [Conclusión](#10-conclusión)

---

## 1. Objetivo

### 1.1 Para qué sirve este documento

Este documento tiene un solo propósito: **hacer una lista completa y ordenada de
todo lo que el equipo de backend debe construir** para que el frontend de
SEÑAVIDA funcione de verdad.

Piénsalo como la lista de compras antes de cocinar. No explica cómo cocinar. No
dice qué marca comprar. Solo dice, con claridad, **qué hace falta**.

### 1.2 Qué encontrarás aquí

- Una lista numerada de todo lo que el backend tiene que hacer.
- Qué tan urgente es cada cosa.
- Qué se necesita antes de poder construir cada parte.
- Cómo saber que algo quedó bien hecho.
- Qué pasa si alguna parte no se construye.

### 1.3 Qué NO encontrarás aquí

- Código de ningún tipo.
- Nombres de tecnologías específicas.
- Detalles de cómo debe verse la información que se intercambia.
- Explicaciones de cómo está hecho el frontend.

Todo eso está en los otros dos documentos.

### 1.4 Quién debería leerlo

| Persona | Para qué |
|---|---|
| Equipo de backend | Saber qué construir y en qué orden |
| Equipo de frontend | Saber qué puede esperar y cuándo |
| Jefe de proyecto | Planificar el trabajo y estimar tiempos |
| Docente o evaluador | Revisar que el alcance esté completo |

---

## 2. Alcance

### 2.1 Qué debe construir el backend

El backend de SEÑAVIDA tiene que encargarse de **quince áreas de trabajo**. Aquí
las presentamos agrupadas para que se entienda mejor el conjunto.

#### Grupo 1 — Quién entra al sistema y qué puede hacer

| Área | De qué se trata |
|---|---|
| **Inicio de sesión** | Verificar que la persona es quien dice ser |
| **Control de permisos** | Decidir qué puede hacer cada tipo de usuario |
| **Gestión de usuarios** | Crear, editar y desactivar cuentas del personal de salud |

#### Grupo 2 — Los datos base del sistema

| Área | De qué se trata |
|---|---|
| **Listas fijas** | Hospitales, unidades, salas y niveles de urgencia |
| **Pacientes** | La ficha de cada persona atendida y sus contactos de emergencia |

#### Grupo 3 — El corazón del sistema: la atención médica

| Área | De qué se trata |
|---|---|
| **Código de atención (CTA)** | El código que el paciente presenta para ser atendido |
| **Sesiones médicas** | Cada atención concreta, desde que empieza hasta que termina |
| **Consentimientos** | Los permisos que el paciente da sobre el uso de sus datos |

#### Grupo 4 — La comunicación con el paciente

| Área | De qué se trata |
|---|---|
| **Chat** | La conversación entre el paciente y el personal de salud |
| **Llamados al paciente** | Avisarle a dónde debe dirigirse |
| **Pictogramas** | Los dibujos que el paciente usa para expresarse |
| **Intérprete remoto** | Videollamada con un intérprete de lengua de señas |

#### Grupo 5 — La información clínica

| Área | De qué se trata |
|---|---|
| **Signos vitales** | Presión, temperatura, saturación, pulso y dolor |
| **Categorización de urgencia** | Clasificar qué tan grave es el caso |
| **Notas clínicas** | Lo que el médico escribe y firma |

#### Grupo 6 — Control y supervisión

| Área | De qué se trata |
|---|---|
| **Registro de acciones (auditoría)** | Anotar quién hizo qué y cuándo |
| **Configuración de seguridad** | Ajustes que controla el administrador |

### 2.2 Qué NO tiene que hacer el backend

Es igual de importante saber qué queda fuera:

| Cosa | Por qué queda fuera |
|---|---|
| **Leer texto en voz alta** | Lo hace el navegador del usuario, sin ayuda del servidor |
| **Ser la ficha clínica oficial del hospital** | SEÑAVIDA es un apoyo a la comunicación. El hospital ya tiene su propio sistema clínico y este no lo reemplaza |
| **Guardar videos o grabaciones** | El proyecto declara públicamente que no lo hace |
| **Permitir que el personal edite los datos del paciente** | Solo el paciente puede modificar su propia ficha |

> **Sobre el último punto.** Esto no es un descuido: es una decisión del
> producto. La pantalla de admisión lo dice de forma explícita al funcionario.
> La idea es proteger la autonomía del paciente, es decir, su derecho a decidir
> sobre sus propios datos.

### 2.3 Decisiones de arquitectura y lo que queda por resolver

**Ya resueltas (v2).** El equipo y el docente ratificaron el modelo **API REST**:

| Tema | Decisión |
|---|---|
| Cómo se comunican frontend y backend | API REST — proyectos separados, JSON sobre HTTP |
| Cómo entra el **personal** | Sanctum, con email y contraseña, que devuelve un **Bearer token** |
| Cómo entra el **paciente** | Un **Bearer token derivado de su código de atención (CTA)**, que expira cuando termina la atención. Ya no queda sin resolver |
| Versionado, respuestas, casing, documentación | `/api/v1`, envoltorio estándar, `camelCase`, Swagger |

**Lo que todavía falta decidir:**

| # | Pregunta | Por qué importa |
|---|---|---|
| **1** | ¿Cómo se representa el avance de una atención médica? | El frontend usa **dos formas distintas** de representar lo mismo (un estado y una etapa) y se contradicen entre sí. Hay que unificarlo antes de modelar la sesión médica |

Esta pregunta se retoma en la sección 8, donde se explica qué pasa si no se
responde.

---

## 3. Requerimientos funcionales

### 3.1 Cómo leer esta sección

Un **requerimiento funcional** es simplemente **algo que el sistema tiene que
saber hacer**. Por ejemplo: «el sistema debe permitir que un médico firme una
nota».

Cada requerimiento se presenta así:

| Elemento | Qué significa |
|---|---|
| **Código** | Un identificador único, como RF-001, para poder referirse a él |
| **Nombre** | De qué se trata, en pocas palabras |
| **Qué debe hacer** | La explicación, en lenguaje sencillo |
| **Prioridad** | Qué tan urgente es |
| **Necesita** | Qué debe existir antes para poder construirlo |
| **Resultado esperado** | Cómo saber que quedó bien |

**Las prioridades significan:**

| Prioridad | Significado |
|---|---|
| 🔴 **Alta** | Sin esto, el sistema no funciona o no es seguro |
| 🟠 **Media** | El sistema funciona, pero le falta algo importante |
| 🟢 **Baja** | Es deseable, pero puede esperar |

**Una marca especial que verás varias veces:**

> ⚠️ **La pantalla ya lo promete.** Significa que el frontend **le dice al
> usuario** que algo ocurre, pero en realidad no ocurre. Estos casos son
> especialmente importantes: no son ideas nuevas, son **promesas que el sistema
> ya está haciendo y no cumple**.

---

### MÓDULO A · Inicio de sesión y permisos

---

**RF-001 · Verificar la identidad del personal de salud**

| | |
|---|---|
| **Qué debe hacer** | Cuando un funcionario escribe su correo y su contraseña, el sistema debe comprobar que sean correctos y dejarlo entrar solo si lo son. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | Que existan las cuentas de usuario (RF-006) |
| **Resultado esperado** | Con la contraseña correcta, la persona entra. Con una incorrecta, no entra y recibe un aviso claro. |

> **Situación actual:** la pantalla de acceso **acepta cualquier contraseña**.
> Ni siquiera la revisa. Este es el primer problema de seguridad que hay que
> resolver.

---

**RF-002 · Bloquear cuentas desactivadas**

| | |
|---|---|
| **Qué debe hacer** | Si el administrador desactivó la cuenta de alguien (por ejemplo, porque dejó de trabajar en el hospital), esa persona no debe poder entrar, aunque su contraseña siga siendo correcta. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-001 |
| **Resultado esperado** | Una cuenta desactivada no puede iniciar sesión y recibe un mensaje que se lo explica. |

---

**RF-003 · Limitar los intentos de entrada**

| | |
|---|---|
| **Qué debe hacer** | Si alguien intenta adivinar una contraseña probando muchas veces seguidas, el sistema debe frenarlo temporalmente. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-001 |
| **Resultado esperado** | Tras varios intentos fallidos seguidos, el sistema pide esperar antes de volver a intentar. |

> **Por qué importa:** sin esto, un programa automático puede probar miles de
> contraseñas por minuto hasta acertar. Se llama «ataque de fuerza bruta».

---

**RF-004 · Dar acceso al paciente a su portal**

| | |
|---|---|
| **Qué debe hacer** | El paciente debe poder entrar a su portal de forma segura, demostrando de alguna manera que es él. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | **Que se responda primero la pregunta 1 de la sección 2.3** |
| **Resultado esperado** | Solo el paciente correcto puede ver su propia información. |

> ⚠️ **Situación actual, y es grave:** el portal del paciente **no pide nada**.
> Al elegir el perfil «paciente» en la pantalla de acceso, los campos de correo
> y contraseña simplemente desaparecen y se entra directo. Cualquier persona
> puede ver el número de identificación, la dirección, la previsión de salud y
> toda la conversación clínica del paciente.
>
> **La opción más recomendada** es que el mismo código que el paciente recibe en
> la ventanilla le sirva también para entrar a su portal, y que deje de servir
> cuando termine su atención. Encaja con cómo funciona el resto del sistema.

---

**RF-005 · Controlar qué puede hacer cada tipo de usuario**

| | |
|---|---|
| **Qué debe hacer** | El sistema debe controlar qué puede hacer cada tipo de usuario. Por ejemplo, un médico no puede entrar al panel de administración, y una persona de admisión no puede firmar notas clínicas. Estas restricciones las decide el backend, no la pantalla. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-001 |
| **Resultado esperado** | Si alguien intenta hacer algo que no le corresponde, el sistema lo rechaza, aunque haya encontrado la forma de saltarse la pantalla. |

> **Un punto que suele confundirse.** La pantalla puede *esconder* los botones
> que una persona no debería usar, y eso está bien porque es más cómodo. Pero
> esconder un botón **no es seguridad**: alguien con conocimientos técnicos
> puede enviar la petición igual, sin usar la pantalla. Por eso la decisión real
> siempre tiene que tomarla el backend.

---

**RF-006 · Impedir que alguien cambie de rol por su cuenta**

| | |
|---|---|
| **Qué debe hacer** | El tipo de usuario (médico, admisión, administrador…) lo decide el backend según la cuenta con la que se entró. La pantalla no puede cambiarlo. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-005 |
| **Resultado esperado** | Una persona de admisión no puede convertirse en médico sin volver a iniciar sesión con otra cuenta. |

> ⚠️ **Situación actual:** el frontend tiene **tres botones distintos** que
> permiten cambiar de rol al instante, sin volver a identificarse. Fueron
> pensados para probar la aplicación, pero si quedan así, cualquiera podría
> darse a sí mismo permisos de médico o de administrador.

---

**RF-007 · Cerrar sesión de verdad**

| | |
|---|---|
| **Qué debe hacer** | Cuando alguien cierra su sesión, el sistema debe invalidarla en el servidor, no solo en la pantalla. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-001 |
| **Resultado esperado** | Después de cerrar sesión, no se puede volver a entrar sin escribir la contraseña de nuevo. |

> **Ojo con una confusión frecuente.** Cerrar la sesión de un usuario **no
> cierra la atención médica del paciente**. Son dos cosas distintas: el personal
> cambia de turno mientras la atención del paciente sigue en curso.

---

**RF-008 · Cerrar sesiones abandonadas**

| | |
|---|---|
| **Qué debe hacer** | Si alguien deja su sesión abierta y se va, el sistema debe cerrarla sola después de un tiempo. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-001 |
| **Resultado esperado** | Una sesión sin uso durante cierto tiempo deja de funcionar. |

> **Por qué importa en un hospital:** los computadores de urgencias son
> compartidos. Si una enfermera deja su sesión abierta, la siguiente persona que
> se siente podría actuar con su identidad.

---

### MÓDULO B · Gestión de usuarios

---

**RF-009 · Crear cuentas para el personal**

| | |
|---|---|
| **Qué debe hacer** | El administrador debe poder crear cuentas nuevas para los funcionarios, indicando su nombre, correo, tipo de usuario, hospital y unidad. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-005, y las listas de hospitales y unidades (RF-013) |
| **Resultado esperado** | El administrador crea una cuenta y esa persona puede iniciar sesión. |

> **Una brecha que hay que cerrar.** El frontend **promete** esta función: la
> pantalla de acceso dice que el administrador gestiona usuarios, y el panel
> muestra un contador de «42 funcionarios activos». Pero **la pantalla para
> gestionarlos no existe**. Hay que construirla en el frontend y también en el
> backend.

---

**RF-010 · Editar y desactivar cuentas**

| | |
|---|---|
| **Qué debe hacer** | El administrador debe poder corregir los datos de una cuenta o desactivarla cuando la persona ya no debe tener acceso. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-009 |
| **Resultado esperado** | Una cuenta desactivada deja de poder entrar de inmediato. |

> **Nota importante:** desactivar **no es borrar**. Las acciones que esa persona
> realizó tienen que seguir existiendo en el registro histórico. En un sistema
> de salud, borrar quién hizo qué no es aceptable.

---

**RF-011 · Mostrar la lista de funcionarios**

| | |
|---|---|
| **Qué debe hacer** | El administrador debe poder ver todos los funcionarios de su hospital, buscarlos por nombre o correo, y filtrarlos por tipo de usuario. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-009 |
| **Resultado esperado** | La lista se muestra por partes (no todos de golpe) y se puede buscar dentro de ella. |

---

**RF-012 · Calcular las cifras del panel de administración**

| | |
|---|---|
| **Qué debe hacer** | El panel del administrador muestra tres cifras resumen. El backend debe calcularlas de verdad. |
| **Prioridad** | 🟢 Baja |
| **Necesita** | RF-009 |
| **Resultado esperado** | Las cifras cambian cuando cambian los datos reales. |

> ⚠️ **Situación actual:** las tres cifras están escritas a mano en el código y
> nunca cambian.

---

### MÓDULO C · Listas fijas del sistema

---

**RF-013 · Entregar la lista de hospitales y unidades**

| | |
|---|---|
| **Qué debe hacer** | La pantalla de acceso muestra dos listas desplegables: el hospital y la unidad donde trabaja la persona. Esas listas deben venir del backend. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | Nada |
| **Resultado esperado** | Si se agrega un hospital nuevo, aparece en la lista sin tocar el código del frontend. |

> ⚠️ **Situación actual:** las listas están escritas dentro del código, y además
> tienen errores. Una unidad («Maternidad») se pierde por un error de
> programación, y el nombre de un hospital aparece de dos formas distintas según
> dónde se mire.

---

**RF-014 · Entregar la lista de salas y ubicaciones**

| | |
|---|---|
| **Qué debe hacer** | Cuando el personal llama a un paciente, elige a qué sala debe dirigirse. Esa lista de salas debe venir del backend y ser la misma para todos. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-013 |
| **Resultado esperado** | Todos los roles ven el mismo catálogo de salas de su unidad. |

> ⚠️ **Situación actual:** hay **tres listas distintas** escritas a mano, una
> por cada rol que puede llamar al paciente. Además tienen nombres parecidos
> pero no idénticos para lo que probablemente es la misma sala, por ejemplo «Box
> de Emergencias» y «Box de Emergencias N° 1».

---

**RF-015 · Entregar los niveles de urgencia**

| | |
|---|---|
| **Qué debe hacer** | Los cinco niveles de urgencia (del más grave al menos grave) con su nombre, color y descripción deben venir del backend. |
| **Prioridad** | 🟠 Media |
| **Necesita** | Nada |
| **Resultado esperado** | El frontend muestra los niveles tal como los define el backend. |

---

### MÓDULO D · Pacientes

---

**RF-016 · Guardar la ficha del paciente**

| | |
|---|---|
| **Qué debe hacer** | El sistema debe guardar los datos de cada paciente: nombre, número de identificación, fecha de nacimiento, previsión de salud, dirección, teléfono, centro de salud familiar, alergias, condiciones de salud y cómo prefiere comunicarse. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | Nada |
| **Resultado esperado** | La ficha se guarda una vez y aparece igual en todas las pantallas que la muestran. |

---

**RF-017 · Impedir que el personal modifique la ficha**

| | |
|---|---|
| **Qué debe hacer** | Ningún funcionario de salud puede cambiar los datos de la ficha del paciente. Solo el propio paciente puede hacerlo, desde su aplicación. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-016, RF-005 |
| **Resultado esperado** | No existe ninguna forma de que un funcionario modifique la ficha, ni siquiera saltándose la pantalla. |

> **Por qué esta regla es tan estricta.** La pantalla de admisión se lo explica
> al funcionario con estas palabras: la ficha *«no es editable por el personal
> de salud para resguardar la exactitud de sus preferencias y su autonomía
> clínica»*. Es una decisión de diseño del producto, no un olvido.
>
> ⚠️ Sin embargo, hoy la misma pantalla **sí permite editar las alergias** en un
> campo de texto, lo que se contradice con lo que ella misma declara.

---

**RF-018 · Guardar los contactos de emergencia**

| | |
|---|---|
| **Qué debe hacer** | Cada paciente puede tener **varios** contactos de emergencia, cada uno con su nombre, parentesco, teléfono y permisos propios sobre qué se le puede informar. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-016 |
| **Resultado esperado** | El médico ve todos los contactos del paciente y puede elegir a cuál enviar información. |

> ⚠️ **Contradicción a resolver:** el frontend guarda **un solo contacto**, pero
> la pantalla del médico muestra **dos** para elegir. Los dos contactos que
> muestra están escritos a mano en el código. La forma correcta es permitir
> varios.

---

**RF-019 · Proteger el acceso a las fichas**

| | |
|---|---|
| **Qué debe hacer** | Un funcionario solo puede ver la ficha de un paciente si tiene una atención activa con él, o si acaba de validar su código. No puede navegar libremente por todos los pacientes. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-016, RF-023 |
| **Resultado esperado** | No existe forma de consultar la ficha de un paciente cualquiera sin motivo. |

---

### MÓDULO E · Código de atención (CTA)

> **¿Qué es el CTA?** Es un código corto, por ejemplo `SV-847291`, que se le
> entrega al paciente cuando llega al hospital. El funcionario de ventanilla lo
> escribe en su computador y así se abre la atención. Sirve para no tener que
> usar el número de identificación, que es fácil de adivinar o de conocer.

---

**RF-020 · Generar códigos de atención**

| | |
|---|---|
| **Qué debe hacer** | El sistema debe poder crear un código nuevo para un paciente, con una fecha de vencimiento. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-016 |
| **Resultado esperado** | Se genera un código, se le muestra **una sola vez** a quien lo pidió, y después ya no se puede volver a ver. |

> **Falta decidir quién lo genera.** El frontend describe el proceso en su
> página de inicio, pero **no existe ninguna pantalla que genere códigos**. Hay
> que definir si lo hace el funcionario de admisión, si el paciente lo pide
> desde su aplicación, o ambos.

---

**RF-021 · Guardar el código de forma segura**

| | |
|---|---|
| **Qué debe hacer** | El código nunca debe guardarse tal cual. Se guarda transformado, de modo que ni siquiera quien tenga acceso a la base de datos pueda leerlo. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-020 |
| **Resultado esperado** | Al revisar la base de datos, no se ve ningún código legible. |

> **Cómo funciona esto en palabras simples.** Se guarda una especie de «huella
> digital» del código. Cuando alguien escribe un código, se calcula su huella y
> se compara con la guardada. Si coinciden, el código es correcto. Pero desde la
> huella no se puede recuperar el código original.

---

**RF-022 · Validar el código que escribe el funcionario**

| | |
|---|---|
| **Qué debe hacer** | Cuando el funcionario escribe un código, el sistema debe revisar que exista, que no haya vencido, que no se haya usado antes, que no esté bloqueado y que pertenezca a ese hospital. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-021 |
| **Resultado esperado** | Si el código es válido, se muestran los datos del paciente. Si no, se explica el motivo con un mensaje claro. |

> ⚠️ **Situación actual:** el frontend compara el código escrito con el texto
> `SV-847291`, que está fijo en el código. Cualquier otro código se rechaza.

---

**RF-023 · Consumir el código al abrir la atención**

| | |
|---|---|
| **Qué debe hacer** | Cuando se abre la atención, el código queda marcado como usado y ya no sirve para nada más. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-022 |
| **Resultado esperado** | El mismo código no puede abrir dos atenciones. |

> **Detalle de diseño que conviene respetar.** Validar el código y abrir la
> atención son **dos pasos separados a propósito**. Entre uno y otro, el
> funcionario revisa la ficha en pantalla y confirma que la persona que tiene
> delante es realmente esa. No conviene juntarlos.

---

**RF-024 · Bloquear códigos tras varios intentos fallidos**

| | |
|---|---|
| **Qué debe hacer** | Si alguien escribe mal un código varias veces seguidas, ese código debe bloquearse. La cantidad de intentos permitidos la configura el administrador. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-022, RF-051 |
| **Resultado esperado** | Tras el número configurado de fallos, el código deja de funcionar aunque después se escriba bien. |

---

### MÓDULO F · Sesiones médicas

> **¿Qué es una sesión médica?** Es una atención concreta: un paciente, un día,
> en un hospital. Es la pieza central del sistema. Todo lo demás —el chat, los
> signos vitales, las notas, los permisos— pertenece a una sesión médica.
>
> ⚠️ **No confundir** con la «sesión de usuario», que es cuando alguien inicia
> sesión en el sistema. Son cosas completamente distintas.

---

**RF-025 · Abrir una atención**

| | |
|---|---|
| **Qué debe hacer** | El funcionario de admisión, después de validar el código, abre la atención del paciente. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-023 |
| **Resultado esperado** | Se crea la atención en estado activo, en la etapa de admisión, y queda registrado quién la abrió. |

---

**RF-026 · Avanzar de etapa**

| | |
|---|---|
| **Qué debe hacer** | La atención pasa por tres etapas en orden: admisión, luego categorización, luego consulta médica. El sistema debe controlar que ese orden se respete y que no se retroceda. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-025 |
| **Resultado esperado** | Cada avance queda registrado y aparece un aviso automático en el chat del paciente. |

---

**RF-027 · Impedir dos atenciones abiertas para el mismo paciente**

| | |
|---|---|
| **Qué debe hacer** | Un paciente no puede tener dos atenciones activas al mismo tiempo. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-025 |
| **Resultado esperado** | Si se intenta abrir una segunda atención para el mismo paciente, el sistema lo impide y explica por qué. |

---

**RF-028 · Cerrar la atención**

| | |
|---|---|
| **Qué debe hacer** | El médico cierra la atención indicando el motivo y escribiendo un resumen de alta para el paciente. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-025 |
| **Resultado esperado** | La atención queda cerrada, con la hora y el nombre de quien la cerró. |

---

**RF-029 · Bloquear todo después del cierre** ⚠️

| | |
|---|---|
| **Qué debe hacer** | Una vez cerrada la atención, **nadie puede escribir nada más en ella**: ni mensajes, ni signos vitales, ni notas, ni permisos, ni llamados. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-028 |
| **Resultado esperado** | Cualquier intento de escribir en una atención cerrada es rechazado. |

> ⚠️ **La pantalla ya lo promete, y es la promesa más importante que no se
> cumple.** El aviso que ve el médico antes de cerrar dice, textualmente:
>
> *«Al cerrar la sesión, el chat quedará bloqueado de forma permanente, el
> código de acceso temporal expirará y se emitirá el resumen al paciente
> sordo.»*
>
> **Ninguna de esas tres cosas ocurre.** Después de cerrar, el campo para
> escribir mensajes sigue funcionando perfectamente y se pueden seguir enviando
> mensajes. Este requerimiento existe para cumplir esa promesa.

---

**RF-030 · Efectos automáticos del cierre**

| | |
|---|---|
| **Qué debe hacer** | Al cerrar una atención, el sistema debe hacer automáticamente tres cosas más: vencer el código de atención, retirar todos los permisos que el paciente había dado, y entregarle su resumen de alta. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-028, RF-035 |
| **Resultado esperado** | Las tres cosas ocurren juntas. Si una falla, no se aplica ninguna. |

> **Por qué «si una falla, no se aplica ninguna».** Imagina que se vence el
> código pero no se retiran los permisos. El sistema quedaría en un estado
> inconsistente: una atención cerrada con permisos todavía activos. Por eso las
> tres cosas deben ocurrir como un solo bloque.

---

**RF-031 · Cerrar atenciones abandonadas**

| | |
|---|---|
| **Qué debe hacer** | Si en una atención no se envía ningún mensaje durante cierto tiempo, el sistema debe cerrarla automáticamente. El tiempo lo configura el administrador. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-028, RF-051 |
| **Resultado esperado** | La atención se cierra sola aunque nadie tenga el navegador abierto. |

> ⚠️ **La pantalla ya lo promete.** El panel de administración le dice al
> administrador: *«La atención inclusiva se cerrará automáticamente si no se
> detecta actividad en el chat en este lapso»*, con veinte minutos por defecto.
> Hoy ese campo no tiene ningún efecto.
>
> **Detalle importante:** esto tiene que ocurrir en el servidor, con una tarea
> programada que se ejecuta sola cada cierto tiempo. No puede depender de que
> alguien tenga la página abierta.

---

**RF-032 · Separar los datos de cada hospital**

| | |
|---|---|
| **Qué debe hacer** | Un funcionario del Hospital A nunca debe poder ver atenciones, pacientes ni mensajes del Hospital B. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-005, RF-013 |
| **Resultado esperado** | Aunque alguien conozca el identificador de una atención de otro hospital, el sistema responde como si no existiera. |

> **Cómo se hace bien.** Este filtro debe aplicarse **de forma automática y
> general**, no revisarlo a mano en cada función. Si se hace uno por uno,
> tarde o temprano alguien olvidará ponerlo en alguna parte, y ese olvido será
> una fuga de datos clínicos.

---

### MÓDULO G · Consentimientos

> **¿Qué es un consentimiento?** Es un permiso que el paciente da para un uso
> específico de sus datos. Por ejemplo: «autorizo que usen la cámara para
> traducir mis señas» o «autorizo que le avisen a mi papá cómo estoy». El
> paciente puede aceptar unos y rechazar otros.

---

**RF-033 · Solicitar un permiso al paciente**

| | |
|---|---|
| **Qué debe hacer** | El médico puede pedirle al paciente que autorice algo. La solicitud queda pendiente hasta que el paciente responda. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-025 |
| **Resultado esperado** | Al paciente le aparece la solicitud en su pantalla. |

---

**RF-034 · Permitir que solo el paciente responda**

| | |
|---|---|
| **Qué debe hacer** | Únicamente el paciente puede aceptar, rechazar o retirar un permiso. **Ningún funcionario puede hacerlo por él**, ni siquiera el administrador. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-033, RF-005 |
| **Resultado esperado** | No existe ninguna forma de que otra persona responda en nombre del paciente. |

> **Esta es la regla más importante del módulo.** Todo el producto se construye
> sobre la idea de que la persona sorda decide sobre sus propios datos sin
> depender de un intermediario. Si un funcionario pudiera aceptar permisos en su
> nombre, esa idea se rompe por completo.

---

**RF-035 · Retirar los permisos al cerrar la atención**

| | |
|---|---|
| **Qué debe hacer** | Cuando termina la atención, todos los permisos que el paciente dio dejan de tener efecto automáticamente. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-033, RF-028 |
| **Resultado esperado** | Ningún permiso sigue activo después de que la atención termina. |

> ⚠️ **La pantalla ya lo promete.** El portal del paciente le dice: *«Todos tus
> permisos expiran automáticamente al finalizar tu sesión de atención de
> salud.»*

---

**RF-036 · Guardar evidencia de cada decisión**

| | |
|---|---|
| **Qué debe hacer** | Cada vez que el paciente acepta o rechaza algo, hay que guardar cuándo lo hizo, desde qué dispositivo y desde qué conexión. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-034 |
| **Resultado esperado** | Ante una consulta legal, se puede demostrar exactamente qué autorizó el paciente y cuándo. |

---

**RF-037 · Vincular el permiso con el contacto correcto**

| | |
|---|---|
| **Qué debe hacer** | Cuando el permiso es para compartir información con un contacto de emergencia, el sistema debe guardar **exactamente cuál** contacto, sin ambigüedad. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-018, RF-033 |
| **Resultado esperado** | No hay forma de confundir un contacto con otro. |

> ⚠️ **Un error peligroso que hay que corregir.** Hoy el frontend identifica el
> contacto **buscando su nombre dentro del texto del permiso**. Si el paciente
> tiene dos contactos con apellidos parecidos, el sistema puede confundirlos y
> **enviar información clínica a la persona equivocada**. La solución es guardar
> el identificador del contacto, no buscar por nombre.

---

**RF-038 · Enviar la información al contacto autorizado**

| | |
|---|---|
| **Qué debe hacer** | Cuando el paciente autoriza compartir su comprobante de atención con un contacto, el sistema debe **enviarlo de verdad** por algún medio. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-037 |
| **Resultado esperado** | El contacto recibe el mensaje y queda registrado el envío. |

> ⚠️ **La pantalla ya lo promete, y esto es delicado.** Cuando el paciente
> acepta, el médico ve el mensaje *«El comprobante con triage y estado fue
> enviado exitosamente a Carlos Torres Solís»*.
>
> **Ese envío no existe.** No hay ningún código que envíe nada a nadie. El
> médico cree que la familia fue informada, y no lo fue. O se construye el envío
> real, o el frontend debe dejar de afirmar que ocurrió.

---

### MÓDULO H · Chat

---

**RF-039 · Guardar y entregar los mensajes**

| | |
|---|---|
| **Qué debe hacer** | El sistema debe guardar todos los mensajes de una atención y poder entregarlos ordenados por hora. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-025 |
| **Resultado esperado** | Al recargar la página, la conversación completa sigue ahí. |

---

**RF-040 · Decidir el backend quién envió cada mensaje**

| | |
|---|---|
| **Qué debe hacer** | El backend debe determinar por sí mismo quién envió cada mensaje, según la cuenta con la que se está usando el sistema. Si la pantalla envía esa información, hay que ignorarla. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-039, RF-005 |
| **Resultado esperado** | Nadie puede hacer pasar un mensaje suyo como si lo hubiera escrito otra persona. |

> ⚠️ **Situación actual:** el frontend arma en el navegador el nombre, el tipo y
> el origen de cada mensaje. Eso significa que cualquiera con conocimientos
> técnicos podría enviar un mensaje que aparezca firmado como «Dr. Andrés Soto»
> en el historial clínico del paciente.

---

**RF-041 · Generar los mensajes automáticos del sistema**

| | |
|---|---|
| **Qué debe hacer** | Algunos mensajes los escribe el sistema, no una persona: cuando se avanza de etapa, cuando se llama al paciente, cuando se confirma la urgencia y cuando se cierra la atención. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-039 |
| **Resultado esperado** | Estos avisos aparecen solos, sin que nadie los escriba. |

---

**RF-042 · Entregar los mensajes por partes**

| | |
|---|---|
| **Qué debe hacer** | Cuando una conversación es larga, no se deben entregar todos los mensajes de una vez, sino de a poco. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-039 |
| **Resultado esperado** | La conversación carga rápido aunque tenga cientos de mensajes. |

---

**RF-043 · Avisar en el momento a la otra persona**

| | |
|---|---|
| **Qué debe hacer** | Cuando alguien envía un mensaje, la otra persona debe verlo aparecer sin tener que recargar la página. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-039 |
| **Resultado esperado** | Los mensajes aparecen solos en la pantalla del destinatario. |

> **Por qué esto es Alta y no Media.** Hoy el frontend guarda todo en la memoria
> del navegador, así que todo se ve al instante «gratis». Cuando eso pase a un
> servidor real, esa magia desaparece: el médico pediría un permiso y el
> paciente **no lo vería nunca** hasta recargar. Sin esta pieza, varios flujos
> del sistema simplemente no funcionan.

---

### MÓDULO I · Llamar al paciente

> **¿Por qué existe esto?** En un hospital, a los pacientes se les llama por
> altavoz o por una pantalla lejana. Una persona sorda no puede oír el altavoz.
> Esta función le avisa directamente en su teléfono a qué sala debe ir.

---

**RF-044 · Registrar el llamado**

| | |
|---|---|
| **Qué debe hacer** | Cuando un funcionario llama al paciente, el sistema debe guardar quién lo llamó, a qué sala y a qué hora. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-025, RF-014 |
| **Resultado esperado** | El llamado queda registrado y le llega al paciente. |

> ⚠️ **Situación actual:** el llamado es solo un texto guardado en la memoria del
> navegador. No tiene identificador, no tiene historial y no está vinculado a la
> atención.

---

**RF-045 · Recibir el acuse del paciente**

| | |
|---|---|
| **Qué debe hacer** | El paciente puede confirmar que vio el llamado pulsando un botón, y el personal debe enterarse de esa confirmación. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-044 |
| **Resultado esperado** | El personal ve si el paciente ya confirmó o todavía no. |

---

**RF-046 · Entregar el llamado de inmediato**

| | |
|---|---|
| **Qué debe hacer** | El aviso debe llegarle al paciente al instante, no cuando recargue la página. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-043, RF-044 |
| **Resultado esperado** | El paciente ve el aviso en segundos. |

> **Este es el caso que obliga a construir los avisos en tiempo real.** Si el
> llamado tarda minutos en llegar, la función pierde todo su sentido: es
> exactamente igual de inútil que un altavoz para alguien que no oye.

---

### MÓDULO J · Información clínica

---

**RF-047 · Guardar signos vitales**

| | |
|---|---|
| **Qué debe hacer** | El personal de categorización registra presión, temperatura, saturación de oxígeno, pulso, frecuencia respiratoria y nivel de dolor. El sistema debe guardarlos junto con quién los midió y cuándo. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-025 |
| **Resultado esperado** | El médico ve los signos vitales que tomó el personal de categorización. |

> **Un detalle a corregir:** hoy el frontend guarda como responsable un texto
> genérico («Enfermera Universitaria») en lugar de la persona concreta. Eso hace
> que el registro no sea trazable, es decir, que no se pueda saber quién lo hizo
> realmente.

---

**RF-048 · Revisar que los valores tengan sentido**

| | |
|---|---|
| **Qué debe hacer** | El backend debe rechazar valores imposibles. Por ejemplo, una temperatura de 300 grados o una saturación de oxígeno de 150 %. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-047 |
| **Resultado esperado** | Los valores fuera de rango se rechazan con un mensaje que explica cuál es el rango correcto. |

> **Por qué el backend y no solo la pantalla.** El frontend ya revisa tres de
> estos valores, pero esa revisión ocurre en el navegador y **se puede saltar
> por completo**. La revisión que de verdad protege los datos es la del
> servidor.
>
> **Falta decidir algo:** tres valores (presión alta, presión baja y frecuencia
> respiratoria) **no tienen ningún rango definido** en el frontend. Definir esos
> rangos requiere criterio de un profesional de la salud, no de un programador.

---

**RF-049 · Guardar la categorización de urgencia**

| | |
|---|---|
| **Qué debe hacer** | El personal clasifica qué tan grave es el caso en uno de cinco niveles, escribiendo el motivo de esa decisión. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-025, RF-015 |
| **Resultado esperado** | Queda guardado el nivel, el motivo y quién lo decidió. Además, al paciente le llega un aviso automático. |

---

**RF-050 · Permitir avanzar sin categorización, pero dejarlo anotado**

| | |
|---|---|
| **Qué debe hacer** | Si el personal deriva al paciente al médico sin haber registrado la categorización, el sistema **debe permitirlo**, pero dejar constancia de que ocurrió. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-026, RF-049 |
| **Resultado esperado** | El avance se permite y queda registrado como una situación fuera de lo normal. |

> **Esto puede parecer contradictorio, pero es a propósito.** En una urgencia
> real con riesgo vital, detenerse a llenar el formulario de categorización
> puede costar la vida del paciente. Bloquear el avance sería peligroso. Lo
> correcto es permitirlo y dejar el registro para que después se pueda revisar.

---

**RF-051 · Guardar notas clínicas firmadas**

| | |
|---|---|
| **Qué debe hacer** | El médico escribe notas de distinto tipo (diagnóstico, tratamiento, indicaciones…) y las firma. El sistema las guarda con el nombre y cargo real del médico. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-025 |
| **Resultado esperado** | Las notas quedan guardadas y se pueden consultar después. |

> ⚠️ **Situación actual:** cuando el médico firma una nota, el frontend
> **solamente la escribe en la consola del navegador** y la guarda en la memoria
> de esa pantalla. Si el médico cambia de vista, la nota desaparece. Es el
> documento con más peso legal del sistema y hoy no se guarda en ninguna parte.

---

**RF-052 · Impedir que se modifique una nota firmada**

| | |
|---|---|
| **Qué debe hacer** | Una vez que el médico firma una nota, esa nota no se puede cambiar ni borrar. Si hay que corregirla, se crea una versión nueva que reemplaza a la anterior, pero la original se conserva. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-051 |
| **Resultado esperado** | La versión original siempre se puede recuperar. |

> **Por qué esto importa tanto.** Si una nota clínica se pudiera modificar
> después, no serviría como respaldo ante ninguna revisión ni reclamo. Firmar
> algo significa precisamente que ya no se puede cambiar sin dejar rastro.

---

**RF-053 · Guardar una huella de verificación de cada nota**

| | |
|---|---|
| **Qué debe hacer** | Junto a cada nota firmada se guarda una «huella digital» de su contenido, que permite detectar si alguien la alteró. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-051 |
| **Resultado esperado** | Si el texto de una nota cambia, la huella deja de coincidir y se detecta. |

> ⚠️ **La pantalla ya lo promete:** al firmar, el médico ve el mensaje *«Nota
> clínica firmada con éxito. Guardada con hash SHA-256 en base de datos.»*

---

**RF-054 · Armar la línea de tiempo de la atención**

| | |
|---|---|
| **Qué debe hacer** | El médico ve un resumen cronológico de todo lo que pasó en la atención. El backend debe generarlo con los hechos reales. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-056 |
| **Resultado esperado** | La línea de tiempo refleja lo que realmente sucedió, en orden. |

> ⚠️ **Situación actual:** son tres eventos escritos a mano que siempre dicen lo
> mismo, sin importar qué haya pasado en la atención.

---

### MÓDULO K · Pictogramas y comunicación visual

> **¿Qué es un pictograma?** Es un dibujo con una frase asociada. El paciente
> toca «me duele la cabeza» y esa frase se envía al chat. Sirve porque **no
> todas las personas sordas leen español con fluidez**: para muchas, la lengua
> de señas es su idioma principal y el español escrito es un segundo idioma.

---

**RF-055 · Entregar el catálogo de pictogramas**

| | |
|---|---|
| **Qué debe hacer** | El sistema entrega los pictogramas organizados por categoría, con su dibujo, su frase y el texto que se lee en voz alta. |
| **Prioridad** | 🟠 Media |
| **Necesita** | Nada |
| **Resultado esperado** | El paciente ve los pictogramas y puede usarlos para comunicarse. |

---

**RF-056 · Entregar el dibujo como dato, no como código**

| | |
|---|---|
| **Qué debe hacer** | El símbolo visible de cada pictograma tiene que venir guardado junto al pictograma, no estar escrito dentro del programa. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-055 |
| **Resultado esperado** | Un pictograma nuevo creado por el administrador se ve correctamente sin tocar el código. |

> ⚠️ **Un problema que parece pequeño y no lo es.** Hoy los dibujos están en una
> lista fija dentro del programa, con 24 casos escritos a mano. Si el
> administrador crea un pictograma nuevo, **aparecerá con un símbolo genérico de
> hospital**, no con el que le corresponde. Eso deja completamente inútil la
> pantalla de administración de pictogramas.

---

**RF-057 · Permitir administrar los pictogramas**

| | |
|---|---|
| **Qué debe hacer** | El administrador puede crear pictogramas nuevos, editarlos, y activarlos o desactivarlos. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-055, RF-005 |
| **Resultado esperado** | Los cambios del administrador se ven de inmediato en el portal del paciente. |

> ⚠️ **Situación actual:** el botón «Agregar» solo muestra un mensaje de aviso.
> Los cambios de activar y desactivar se pierden al cambiar de pantalla.

---

**RF-058 · Mostrar solo los pictogramas activos**

| | |
|---|---|
| **Qué debe hacer** | Al paciente y al público solo se les muestran los pictogramas que el administrador tiene activados. |
| **Prioridad** | 🟢 Baja |
| **Necesita** | RF-057 |
| **Resultado esperado** | Un pictograma desactivado desaparece del portal del paciente. |

---

**RF-059 · Guardar el dibujo de la pizarra**

| | |
|---|---|
| **Qué debe hacer** | El paciente puede dibujar en una pizarra para explicar algo. Ese dibujo debe llegarle al personal de salud. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-039 |
| **Resultado esperado** | El dibujo aparece en la conversación y el personal puede verlo. |

> ⚠️ **Situación actual, y anula la función completa.** Cuando el paciente pulsa
> «Enviar y Hablar al Médico», el sistema envía un **texto** que dice
> `🎨 [Dibujo de Pizarra]` y **borra el lienzo**. El dibujo, que era justamente
> lo que la persona quería comunicar, se pierde.
>
> Para un paciente que quizá no escribe español con fluidez, esta era una de las
> formas más importantes de expresarse. Tal como está, la función no sirve.

---

**RF-060 · Guardar las traducciones de señas correctamente**

| | |
|---|---|
| **Qué debe hacer** | Cuando la cámara traduce una seña, el mensaje debe guardarse indicando que vino de una traducción y con qué nivel de certeza. |
| **Prioridad** | 🟢 Baja |
| **Necesita** | RF-039 |
| **Resultado esperado** | El personal puede distinguir un mensaje escrito de una traducción automática, y saber qué tan confiable es. |

> ⚠️ **Situación actual:** el frontend calcula el nivel de certeza y luego lo
> descarta. Además guarda la traducción como si fuera un mensaje escrito normal.
> El médico no puede saber que ese mensaje vino de una máquina.

---

### MÓDULO L · Intérprete remoto

---

**RF-061 · Gestionar la solicitud de intérprete**

| | |
|---|---|
| **Qué debe hacer** | El médico solicita un intérprete de lengua de señas, y el sistema debe registrar esa solicitud y su estado (pedido, asignado, conectado, terminado). |
| **Prioridad** | 🟢 Baja |
| **Necesita** | RF-025 |
| **Resultado esperado** | El médico ve el estado real de su solicitud. |

> ⚠️ **Situación actual:** al pulsar el botón, la pantalla espera tres segundos
> y muestra que ya hay un intérprete asignado. No hay ninguna solicitud, ningún
> intérprete y ninguna videollamada.

---

**RF-062 · Permitir la videollamada**

| | |
|---|---|
| **Qué debe hacer** | Cuando hay un intérprete asignado, el médico y el paciente deben poder conectarse a una videollamada. |
| **Prioridad** | 🟢 Baja |
| **Necesita** | RF-061 |
| **Resultado esperado** | La videollamada funciona y solo pueden entrar los participantes autorizados. |

> **Falta decidir con qué servicio se hará.** El backend no necesita construir la
> videollamada desde cero: se contrata un servicio externo. Pero sí debe
> encargarse de crear la sala y dar permiso de entrada solo a quien corresponde.
>
> **Regla que el proyecto ya declaró en público:** no se guardan grabaciones de
> video ni de audio.

---

### MÓDULO M · Registro de acciones (auditoría)

> **¿Qué es la auditoría?** Es un cuaderno donde el sistema anota
> automáticamente todo lo importante que pasa: quién entró, quién vio la ficha
> de qué paciente, quién firmó qué nota. Sirve para poder revisar después qué
> ocurrió, y es una exigencia legal cuando se manejan datos de salud.

---

**RF-063 · Anotar automáticamente las acciones importantes**

| | |
|---|---|
| **Qué debe hacer** | Cada acción relevante debe quedar anotada sola, sin que nadie tenga que pedirlo: quién la hizo, qué hizo, sobre qué, cuándo y desde dónde. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-005 |
| **Resultado esperado** | Todas las acciones importantes quedan registradas sin excepción. |

> **La clave está en la palabra «automáticamente».** Si cada programador tiene
> que acordarse de anotar las acciones una por una, tarde o temprano alguien lo
> olvidará. Y justo esa acción olvidada será la que haga falta revisar.

---

**RF-064 · Impedir que se modifique el registro**

| | |
|---|---|
| **Qué debe hacer** | Las anotaciones del registro no se pueden editar ni borrar. Ni siquiera el administrador puede hacerlo. |
| **Prioridad** | 🔴 Alta |
| **Necesita** | RF-063 |
| **Resultado esperado** | No existe ninguna forma de alterar el historial de acciones. |

> **Piénsalo así:** un registro que se puede modificar no sirve como registro.
> Si alguien hace algo indebido y luego puede borrar la anotación, el sistema
> completo pierde su valor como respaldo.

---

**RF-065 · Permitir consultar el registro**

| | |
|---|---|
| **Qué debe hacer** | El administrador puede ver el registro, buscar dentro de él y filtrarlo por tipo de acción, por persona o por fechas. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-063 |
| **Resultado esperado** | El administrador encuentra rápido lo que busca aunque haya miles de anotaciones. |

> **Detalle interesante:** consultar el registro **también debe quedar
> anotado**. Es decir, se audita a quien audita.

---

**RF-066 · Exportar el registro**

| | |
|---|---|
| **Qué debe hacer** | El administrador puede descargar el registro en un archivo, firmado de forma que se pueda comprobar que no fue alterado. |
| **Prioridad** | 🟢 Baja |
| **Necesita** | RF-065 |
| **Resultado esperado** | Se genera un archivo verificable. |

> ⚠️ **Situación actual:** el botón «Exportar Logs Firmados» solo muestra un
> mensaje de aviso.

---

**RF-067 · Avisar ante situaciones sospechosas**

| | |
|---|---|
| **Qué debe hacer** | Algunas acciones no basta con anotarlas: hay que avisarle a alguien de inmediato. Por ejemplo, si alguien intenta ver datos de otro hospital. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-063 |
| **Resultado esperado** | El equipo responsable recibe una alerta cuando ocurre algo así. |

---

### MÓDULO N · Configuración

---

**RF-068 · Guardar y aplicar la configuración de seguridad**

| | |
|---|---|
| **Qué debe hacer** | El administrador ajusta dos valores: cuántos minutos de inactividad antes de cerrar una atención, y cuántos intentos fallidos antes de bloquear un código. El sistema debe guardarlos y **usarlos de verdad**. |
| **Prioridad** | 🟠 Media |
| **Necesita** | RF-005 |
| **Resultado esperado** | Si el administrador cambia el valor a 10 minutos, las atenciones empiezan a cerrarse a los 10 minutos. |

> ⚠️ **Situación actual:** el formulario existe y el botón «Guardar
> Configuración» muestra un aviso, pero los valores no afectan absolutamente
> nada.
>
> **Un detalle a corregir:** el campo de minutos hoy acepta cero y números
> negativos. Hay que ponerle un rango razonable.

---

### MÓDULO O · Formulario público de contacto

---

**RF-069 · Recibir consultas desde la página pública**

| | |
|---|---|
| **Qué debe hacer** | La página de inicio tiene un formulario para que instituciones interesadas escriban. El sistema debe recibir y guardar esos mensajes. |
| **Prioridad** | 🟢 Baja |
| **Necesita** | Nada |
| **Resultado esperado** | El mensaje llega al equipo del proyecto. |

> ⚠️ **Situación actual:** el formulario solo muestra un aviso que dice «Mensaje
> enviado con éxito en esta demostración». No se envía nada a nadie.
>
> **Cuidado con esto:** al ser un formulario público, cualquiera puede
> enviarlo, incluidos programas automáticos. Necesita alguna protección contra
> envíos masivos.

---

### 3.2 Resumen de requerimientos

| Módulo | Requerimientos | Alta | Media | Baja |
|---|:---:|:---:|:---:|:---:|
| A · Inicio de sesión y permisos | RF-001 a RF-008 | 6 | 2 | 0 |
| B · Gestión de usuarios | RF-009 a RF-012 | 1 | 2 | 1 |
| C · Listas fijas | RF-013 a RF-015 | 1 | 2 | 0 |
| D · Pacientes | RF-016 a RF-019 | 3 | 1 | 0 |
| E · Código de atención | RF-020 a RF-024 | 4 | 1 | 0 |
| F · Sesiones médicas | RF-025 a RF-032 | 6 | 2 | 0 |
| G · Consentimientos | RF-033 a RF-038 | 4 | 2 | 0 |
| H · Chat | RF-039 a RF-043 | 3 | 2 | 0 |
| I · Llamar al paciente | RF-044 a RF-046 | 1 | 2 | 0 |
| J · Información clínica | RF-047 a RF-054 | 5 | 3 | 0 |
| K · Pictogramas | RF-055 a RF-060 | 0 | 4 | 2 |
| L · Intérprete remoto | RF-061 a RF-062 | 0 | 0 | 2 |
| M · Auditoría | RF-063 a RF-067 | 2 | 2 | 1 |
| N · Configuración | RF-068 | 0 | 1 | 0 |
| O · Contacto público | RF-069 | 0 | 0 | 1 |
| **Total** | **69** | **36** | **28** | **7** |

> **Lo que dice esta tabla.** Más de la mitad de los requerimientos son de
> prioridad Alta. Eso no es un error de estimación: refleja que **el backend no
> existe todavía**, y que buena parte de lo que falta no es «funcionalidad
> extra», sino lo mínimo para que el sistema sea seguro y utilizable.

---

## 4. Requerimientos no funcionales

### 4.1 Qué son

Los requerimientos de la sección anterior dicen **qué debe hacer** el sistema.
Los de esta sección dicen **cómo debe hacerlo**.

Un ejemplo para entender la diferencia:

> «El sistema debe guardar las notas clínicas» → es funcional.
>
> «Las notas deben guardarse en menos de un segundo y nadie más debe poder
> leerlas» → es no funcional.

Ambos tipos son obligatorios. Un sistema que hace todo lo que debe pero tarda un
minuto en responder, o que deja los datos al alcance de cualquiera, no sirve.

---

### 4.2 Seguridad

Esta es la categoría más importante del proyecto, porque SEÑAVIDA maneja
**datos de salud de personas identificables**: número de identificación,
dirección, previsión, alergias, enfermedades y conversaciones clínicas.

| Código | Requerimiento | Explicación |
|---|---|---|
| RNF-01 | Contraseñas protegidas | Las contraseñas nunca se guardan tal cual. Se guardan transformadas, de modo que ni siquiera quien administre la base de datos pueda leerlas |
| RNF-02 | Conexión cifrada | Toda la comunicación entre el navegador y el servidor debe ir protegida, para que nadie pueda leerla en el camino |
| RNF-03 | Separación entre hospitales | Un hospital nunca ve los datos de otro. Este filtro debe aplicarse de forma general y automática, no revisarse a mano en cada parte |
| RNF-04 | Cada rol ve solo lo suyo | El sistema no solo controla si alguien puede entrar a una pantalla, sino **qué datos concretos recibe**. Al administrador no se le envía información clínica, ni siquiera oculta |
| RNF-05 | El servidor decide siempre | La pantalla puede esconder botones para que sea más cómodo, pero la decisión real de permitir o no una acción la toma siempre el servidor |
| RNF-06 | Manejo seguro del token de acceso | Con API REST, el frontend guarda el **token de acceso (Bearer)** para enviarlo en cada petición. Nunca se guardan **contraseñas** en el navegador. El token viaja siempre por conexión cifrada (HTTPS) y el servidor puede revocarlo en cualquier momento (por ejemplo, al cerrar sesión) |
| RNF-07 | Límite de peticiones | El sistema debe frenar a quien haga demasiadas peticiones seguidas, para protegerse de ataques automáticos |
| RNF-08 | Los errores no revelan detalles internos | Cuando algo falla, el mensaje debe ser útil pero no mostrar rutas de archivos, consultas ni datos del paciente |
| RNF-09 | Permisos de origen cruzado (CORS) | Como el frontend y el backend están en direcciones distintas, el backend debe autorizar explícitamente las peticiones del frontend. Sin esto, el navegador las bloquea |
| RNF-10 | Documentación de la API | El backend publica su documentación con **Swagger/OpenAPI**, para que el frontend y el docente vean cómo funciona cada endpoint y puedan probarlo |

> **Un ejemplo de RNF-04 que ayuda a entenderlo.** El administrador de TI
> gestiona la plataforma, pero **no debe poder ver ninguna información clínica
> de ningún paciente**. No basta con esconderle la pantalla: los datos
> directamente no se le envían. El frontend ya funciona así, y el backend debe
> respetarlo.

---

### 4.3 Protección de datos y privacidad

| Código | Requerimiento | Explicación |
|---|---|---|
| RNF-09 | Guardar solo lo necesario | Si un dato no lo usa ninguna pantalla, no se recopila. Mientras menos datos sensibles se guarden, menor es el riesgo |
| RNF-10 | El paciente controla sus datos | Solo el paciente decide qué se comparte y con quién. Nadie puede decidirlo por él |
| RNF-11 | No guardar video ni audio | El proyecto declara públicamente que no almacena grabaciones. Hay que cumplirlo |
| RNF-12 | Definir cuánto tiempo se guardan los datos | Hay que establecer por cuánto tiempo se conserva cada tipo de información y qué pasa después |
| RNF-13 | Copias de seguridad protegidas | Las copias de respaldo deben estar tan protegidas como los datos originales |

> **Un detalle que suele pasarse por alto (RNF-13).** De nada sirve proteger muy
> bien la base de datos si las copias de seguridad quedan sin protección. Es la
> puerta de atrás que muchos olvidan cerrar.

> **Nota legal.** El proyecto declara en su página pública que cumple dos leyes
> chilenas: la **Ley N° 20.584**, sobre derechos del paciente, y la
> **Ley N° 19.628**, sobre protección de la vida privada. Hoy no hay nada
> construido que respalde esas afirmaciones. Cumplirlas es responsabilidad del
> backend.

---

### 4.4 Trazabilidad

**Trazabilidad** significa poder responder después la pregunta: *¿quién hizo
esto, cuándo y desde dónde?*

| Código | Requerimiento | Explicación |
|---|---|---|
| RNF-14 | Toda acción importante queda anotada | Sin excepciones y de forma automática |
| RNF-15 | El registro no se puede alterar | Ni editar ni borrar, por nadie |
| RNF-16 | Cada registro identifica a una persona concreta | No sirve anotar «una enfermera»; hay que anotar quién exactamente |
| RNF-17 | Si falla la anotación, la atención continúa | Registrar es importante, pero **atender al paciente lo es más**. Si el sistema de registro falla, la atención no debe detenerse: se avisa al equipo técnico y se corrige después |

> **RNF-17 merece explicación.** Puede parecer que contradice a RNF-14, pero es
> una decisión consciente. En un servicio de urgencias, bloquear la atención de
> un paciente porque falló el sistema de registro sería peor que perder una
> anotación. Se prioriza la salud y se corrige el registro más tarde.

---

### 4.5 Rendimiento y tiempos de respuesta

| Código | Requerimiento | Explicación |
|---|---|---|
| RNF-18 | Respuestas rápidas | Las consultas normales deberían responder en menos de un segundo |
| RNF-19 | Los llamados al paciente son inmediatos | El aviso de «ve al box 3» debe llegar en segundos, no en minutos |
| RNF-20 | Las listas largas se entregan por partes | El historial de acciones tendrá miles de registros. No se pueden enviar todos de una vez |
| RNF-21 | Búsquedas rápidas | Buscar un pictograma o un funcionario debe responder de inmediato |

> **Por qué RNF-19 es especial.** El paciente de este sistema **no puede oír el
> altavoz del hospital**. Si el aviso en su teléfono llega tarde, se pierde su
> turno. Es el único requerimiento de rendimiento que afecta directamente la
> atención de una persona.

---

### 4.6 Disponibilidad

| Código | Requerimiento | Explicación |
|---|---|---|
| RNF-22 | El sistema funciona cuando se necesita | Es un servicio de urgencias: funciona de día, de noche, fines de semana y festivos |
| RNF-23 | Si falla un servicio externo, el resto sigue | Si el servicio de videollamada se cae, el chat y todo lo demás debe seguir funcionando |
| RNF-24 | Mantenimiento planificado | Las actualizaciones deben poder hacerse sin interrumpir atenciones en curso |

> **RNF-23 en palabras simples:** no hay que poner todos los huevos en la misma
> canasta. Si el intérprete remoto depende de un servicio externo y ese servicio
> falla, el sistema debe seguir permitiendo comunicarse por chat y pictogramas.

---

### 4.7 Escalabilidad

**Escalabilidad** significa que el sistema siga funcionando bien cuando crezca.

| Código | Requerimiento | Explicación |
|---|---|---|
| RNF-25 | Soportar más hospitales | El sistema está pensado para varios establecimientos. Agregar uno nuevo no debe requerir cambiar el programa |
| RNF-26 | Soportar varias atenciones simultáneas | En una urgencia hay varios pacientes al mismo tiempo, cada uno con su chat |
| RNF-27 | El historial crece sin parar | El registro de acciones nunca se borra, así que crecerá siempre. Hay que planificarlo desde el inicio |

---

### 4.8 Mantenibilidad

**Mantenibilidad** significa que el sistema sea fácil de arreglar y de mejorar
por otras personas en el futuro.

| Código | Requerimiento | Explicación |
|---|---|---|
| RNF-28 | Nada escrito a mano dentro del código | Hospitales, salas, niveles de urgencia y pictogramas se guardan como datos, no dentro del programa |
| RNF-29 | Un solo lugar para cada regla | Cada regla del sistema se escribe una sola vez. Si está repetida en cinco lugares, tarde o temprano quedarán distintas |
| RNF-30 | Mensajes de error entendibles | Los mensajes deben decirle a la persona qué hacer, no mostrar términos técnicos |
| RNF-31 | Documentación al día | Cuando cambie algo importante, hay que actualizar los documentos del proyecto |

> **Un ejemplo real de por qué importa RNF-28.** Hoy el código de atención de
> ejemplo (`SV-847291`) está escrito a mano en **más de diez lugares distintos**
> del frontend. Si mañana hay que cambiarlo, hay que buscar y corregir los diez.
> Si se olvida uno, aparece un error difícil de encontrar.

---

### 4.9 Registro de errores

| Código | Requerimiento | Explicación |
|---|---|---|
| RNF-32 | Los errores quedan registrados | Cuando algo falla, el equipo técnico debe poder revisar qué pasó |
| RNF-33 | Cada error tiene un identificador | Así el usuario puede decir «me salió el error 4B7X» y el equipo lo encuentra al instante |
| RNF-34 | Los registros técnicos no contienen datos del paciente | El equipo técnico revisa errores, no historias clínicas |
| RNF-35 | Alertas ante fallos graves | Algunos errores no pueden esperar a que alguien los descubra: hay que avisar de inmediato |

> **RNF-34 es importante y fácil de incumplir sin darse cuenta.** Es muy común
> que un programador, para depurar un problema, escriba en el registro técnico
> todos los datos que recibió. Si esos datos incluyen el número de
> identificación de un paciente y sus alergias, se acaba de crear una copia sin
> protección de información clínica.

---

### 4.10 Accesibilidad

El propósito de SEÑAVIDA es la accesibilidad, así que este punto no es menor.

| Código | Requerimiento | Explicación |
|---|---|---|
| RNF-36 | Soportar todos los caracteres | Tildes, la letra ñ, signos de interrogación de apertura y emoji. Los pictogramas son emoji, así que esto no es opcional |
| RNF-37 | Buscar sin tildes debe funcionar | Si alguien busca «nauseas», debe encontrar «náuseas». Exigir la tilde exacta haría la búsqueda inútil |
| RNF-38 | Mensajes en español claro | Los mensajes que devuelve el servidor los lee una persona que puede estar en una situación de estrés |
| RNF-39 | El servidor no impone formato de fecha | El servidor entrega la fecha en un formato estándar y la pantalla decide cómo mostrarla |

> **Sobre RNF-37.** El vocabulario del sistema está lleno de palabras con tilde:
> náuseas, cefalea, categorización, señas. Y quienes buscan son pacientes
> ansiosos o personal apurado. Si hay que escribir la tilde exacta, nadie
> encontrará nada.

---

## 5. Dependencias entre módulos

### 5.1 Qué significa que un módulo dependa de otro

Significa que **no se puede construir el segundo sin tener listo el primero**.

Por ejemplo: no se pueden guardar signos vitales sin que exista antes una
atención médica a la cual pertenezcan. Y no puede existir una atención médica
sin que antes exista un paciente y un código de atención.

Entender estas dependencias evita el error más común en proyectos de este tipo:
empezar por lo que parece más entretenido y descubrir a mitad de camino que
faltaba la base.

### 5.2 Tabla de dependencias

| Módulo | Necesita que exista antes | Por qué |
|---|---|---|
| **Listas fijas** | Nada | Es la base de todo. Los hospitales y unidades no dependen de nadie |
| **Inicio de sesión** | Listas fijas | Al entrar hay que elegir hospital y unidad |
| **Permisos** | Inicio de sesión | Primero hay que saber quién es la persona, después qué puede hacer |
| **Gestión de usuarios** | Permisos | Solo el administrador puede crear cuentas |
| **Pacientes** | Nada | Existen por sí solos, independientes del personal |
| **Código de atención** | Pacientes, Inicio de sesión | El código pertenece a un paciente y lo valida un funcionario |
| **Sesiones médicas** | Código de atención | La atención se abre consumiendo un código |
| **Chat** | Sesiones médicas | Cada conversación pertenece a una atención |
| **Consentimientos** | Sesiones médicas | Los permisos son para una atención concreta |
| **Signos vitales** | Sesiones médicas | Pertenecen a una atención |
| **Categorización** | Sesiones médicas, Listas fijas | Necesita la atención y la lista de niveles |
| **Notas clínicas** | Sesiones médicas | Pertenecen a una atención |
| **Llamados al paciente** | Sesiones médicas, Listas fijas | Necesita la atención y la lista de salas |
| **Avisos en tiempo real** | Chat, Consentimientos, Llamados | Es el mecanismo que los hace llegar al instante |
| **Cierre de la atención** | Sesiones médicas, Consentimientos, Código | Al cerrar hay que retirar permisos y vencer el código |
| **Pictogramas** | Nada | Es un catálogo independiente |
| **Intérprete remoto** | Sesiones médicas, Consentimientos | Necesita la atención y el permiso para usar cámara |
| **Auditoría** | Permisos | Necesita saber quién es cada persona para anotarlo |
| **Línea de tiempo** | Auditoría | Se arma a partir de las acciones registradas |
| **Configuración** | Permisos | Solo el administrador la modifica |

### 5.3 El camino principal

Si se ordena todo lo anterior en una sola línea, queda así:

```
Listas fijas
   ↓
Inicio de sesión y permisos
   ↓
Pacientes
   ↓
Código de atención
   ↓
Sesión médica          ← todo lo clínico cuelga de aquí
   ↓
Chat y consentimientos
   ↓
Signos vitales, categorización, notas clínicas
   ↓
Cierre de la atención
```

**La pieza central es la sesión médica.** Todo lo clínico depende de ella. Por
eso hay que construirla temprano y bien: si queda mal, hay que rehacer todo lo
que viene después.

### 5.4 Un caso especial: los avisos en tiempo real

Los avisos en tiempo real **no son un módulo más**. Son una pieza que atraviesa
varios módulos a la vez, y suele dejarse para el final por error.

| Depende de | Y a la vez es necesario para |
|---|---|
| Chat | Que los mensajes lleguen sin recargar |
| Consentimientos | Que el paciente vea la solicitud del médico |
| Llamados | Que el paciente sepa a dónde ir |

> **Por qué no puede dejarse para el final.** Cuando la información deje de
> estar en la memoria del navegador y pase a un servidor, esos tres flujos
> **dejarán de funcionar** hasta que exista esta pieza. No es un adorno: es lo
> que hace que dos personas puedan comunicarse.

---

## 6. Prioridad de implementación

### 6.1 En qué orden construir

| Etapa | Módulo | Prioridad | Por qué en este momento |
|---|---|---|---|
| **1** | Listas fijas | 🔴 Alta | No depende de nada y todo lo demás la necesita |
| **1** | Inicio de sesión | 🔴 Alta | Sin saber quién entra, nada más tiene sentido |
| **1** | Permisos | 🔴 Alta | Va junto con el inicio de sesión, no después |
| **2** | Pacientes | 🔴 Alta | La atención necesita a quién atender |
| **2** | Código de atención | 🔴 Alta | Es la puerta de entrada a toda atención |
| **2** | Sesiones médicas | 🔴 Alta | Es la pieza central del sistema |
| **3** | Chat | 🔴 Alta | Es el propósito del producto: comunicarse |
| **3** | Consentimientos | 🔴 Alta | Sin ellos no se puede usar ningún dato legalmente |
| **3** | Avisos en tiempo real | 🔴 Alta | Sin esto, chat y consentimientos no funcionan entre dos personas |
| **4** | Signos vitales | 🟠 Media | Ya hay atención donde guardarlos |
| **4** | Categorización | 🟠 Media | Va después de los signos vitales, como en la vida real |
| **4** | Notas clínicas | 🟠 Media | Es el último paso del flujo clínico |
| **4** | Cierre de la atención | 🔴 Alta | Cierra el ciclo y aplica reglas de seguridad importantes |
| **5** | Llamados al paciente | 🟠 Media | Mejora mucho la experiencia, pero el sistema funciona sin ellos |
| **5** | Pictogramas | 🟠 Media | El paciente puede escribir mientras tanto |
| **5** | Auditoría | 🔴 Alta | Debería estar antes, pero se puede sumar en paralelo desde el inicio |
| **6** | Gestión de usuarios | 🟠 Media | Al principio las cuentas se pueden crear a mano |
| **6** | Configuración | 🟠 Media | Los valores por defecto sirven mientras tanto |
| **7** | Intérprete remoto | 🟢 Baja | Depende de contratar un servicio externo |
| **7** | Pizarra de dibujo | 🟠 Media | Hoy no funciona, pero no bloquea nada más |
| **7** | Formulario de contacto | 🟢 Baja | No forma parte del sistema clínico |

### 6.2 Por qué este orden y no otro

**Primero lo que sostiene todo lo demás.** Las tres primeras etapas construyen
la base: quién entra, a quién se atiende y dónde se guarda esa atención. Sin
esto, cualquier otra cosa que se construya habrá que rehacerla.

**Los permisos van con el inicio de sesión, no después.** Es un error frecuente
construir primero todas las funciones «para que se vea que avanza» y agregar los
permisos al final. Cuando se hace así, siempre queda algún hueco. Es mucho más
fácil ponerlos desde el principio.

**La auditoría aparece tarde en la tabla, pero se construye desde el
principio.** Es una pieza que se activa una vez y funciona para todo el sistema.
Si se deja para el final, hay que volver a revisar cada función una por una para
agregarle la anotación. Conviene dejarla lista temprano aunque su prioridad
aparente sea menor.

**El chat es Alta aunque parezca solo «una funcionalidad más».** No es una
funcionalidad más: **es el propósito del producto**. SEÑAVIDA existe para que
una persona sorda pueda comunicarse con el personal de salud. Sin chat, no hay
producto.

**Los avisos en tiempo real están en la etapa 3, junto al chat.** Es tentador
dejarlos para después, pero como se explicó en 5.4, sin ellos varios flujos
quedan rotos.

**El intérprete remoto queda al final.** No porque no importe, sino porque
depende de contratar un servicio externo de videollamadas. Esa gestión puede
avanzar en paralelo, sin bloquear al equipo de desarrollo.

### 6.3 Antes de empezar

Las decisiones de arquitectura ya están tomadas (API REST, Sanctum con Bearer
token, `/api/v1`, Swagger — ver la nota del encabezado y la §2.3). Queda **una
decisión de modelado** por resolver antes de construir la sesión médica:

| # | Decisión | Qué bloquea si no se toma |
|---|---|---|
| **1** | Cómo se representa el avance de una atención (unificar el «estado» y la «etapa» que hoy se contradicen) | El diseño de la pieza central del sistema: la sesión médica |

> La identificación del paciente **ya está resuelta**: token derivado del código
> de atención (CTA). La que queda afecta la base del modelo, así que conviene
> cerrarla antes de avanzar con las sesiones médicas.

---

## 7. Necesidades técnicas

### 7.1 Qué se necesita para construir todo esto

Esta sección no nombra herramientas ni tecnologías concretas. Solo explica **qué
capacidades** debe tener el backend.

---

**Una base de datos**

Un lugar donde guardar toda la información de forma permanente: pacientes,
atenciones, mensajes, permisos, signos vitales, notas y el registro de acciones.

Debe cumplir dos condiciones especiales:

- **Guardar todo tipo de caracteres**, incluidos tildes, la letra ñ y emoji. Los
  pictogramas son emoji, así que esto no es opcional.
- **Permitir agrupar operaciones**. Cuando se cierra una atención pasan varias
  cosas a la vez, y o pasan todas o no pasa ninguna.

---

**Un sistema de identificación de usuarios**

Que sepa verificar contraseñas, mantener a alguien identificado mientras usa el
sistema y cerrarle la sesión cuando corresponda.

También debe manejar la identificación del paciente, que probablemente funcione
de forma distinta a la del personal.

---

**Un sistema de permisos**

Que decida, en cada acción, si la persona que la pide tiene derecho a hacerla.
Debe considerar tres cosas a la vez: qué tipo de usuario es, a qué hospital
pertenece y en qué estado está la atención que quiere modificar.

---

**Un sistema de validación de datos**

Que revise toda la información que llega antes de guardarla: que los campos
obligatorios estén, que los números estén en rangos posibles, que las fechas
tengan sentido y que los textos no sean demasiado largos.

Debe poder informar **todos los errores de una vez**, no de a uno. Si un
formulario tiene tres campos mal, la persona debe enterarse de los tres juntos,
no corregir uno y descubrir el siguiente.

---

**Tareas que se ejecutan solas**

Hacen falta procesos que corran automáticamente cada cierto tiempo, sin que
nadie los pida. Al menos uno: el que cierra las atenciones abandonadas.

> **Lo importante:** esto debe ocurrir en el servidor. No puede depender de que
> alguien tenga la página abierta, porque justamente el caso a resolver es que
> nadie está mirando.

---

**Un canal de avisos inmediatos**

Un mecanismo para enviar información desde el servidor hacia las pantallas sin
que estas la pidan. Es lo que permite que un mensaje aparezca solo, o que el
paciente vea su llamado al instante.

---

**Un sistema de envío de mensajes al exterior**

Para avisar a los contactos de emergencia cuando el paciente lo autoriza. Puede
ser mensajes de texto, mensajería instantánea o correo.

> Es una capacidad que **hoy no existe en ninguna parte**, aunque la pantalla
> afirme que el envío ya ocurre.

---

**Almacenamiento de archivos**

Para guardar los dibujos que el paciente hace en la pizarra. Deben guardarse en
un lugar al que no se pueda acceder directamente desde internet: solo a través
del sistema, y solo si la persona tiene permiso.

---

**Un sistema de registro de acciones**

Que anote automáticamente todo lo importante, sin que haya que pedirlo función
por función.

---

**Un sistema de registro de errores**

Distinto del anterior. Este es para el equipo técnico: anota qué falló y por
qué, sin incluir datos de pacientes.

---

**Un servicio externo de videollamadas**

Para el intérprete remoto. No se construye desde cero: se contrata. El backend
solo se encarga de crear la sala y dar permiso de entrada a quien corresponde.

---

### 7.2 Resumen

| Necesidad | Prioridad | ¿Se construye o se contrata? |
|---|---|---|
| Base de datos | 🔴 Alta | Se construye el diseño |
| Identificación de usuarios | 🔴 Alta | Se construye |
| Sistema de permisos | 🔴 Alta | Se construye |
| Validación de datos | 🔴 Alta | Se construye |
| Registro de acciones | 🔴 Alta | Se construye |
| Canal de avisos inmediatos | 🔴 Alta | Se construye sobre una herramienta existente |
| Tareas automáticas | 🟠 Media | Se construye |
| Registro de errores | 🟠 Media | Se construye sobre una herramienta existente |
| Envío de mensajes al exterior | 🟠 Media | Se contrata |
| Almacenamiento de archivos | 🟠 Media | Se construye |
| Videollamadas | 🟢 Baja | Se contrata |

---

## 8. Riesgos

### 8.1 Qué pasa si algo no se construye

Esta sección responde una pregunta concreta: **¿qué consecuencia tiene dejar
fuera cada parte?** Sirve para tomar decisiones cuando el tiempo aprieta y hay
que recortar alcance.

---

### 8.2 Riesgos que impiden usar el sistema con pacientes reales

Estos ocho no son negociables. Si alguno queda sin resolver, **el sistema no
puede usarse con personas reales**, ni siquiera en una prueba piloto.

---

**Si el portal del paciente no pide identificación**

Cualquier persona que abra la página puede ver el número de identificación de un
paciente, su dirección, su previsión de salud, sus alergias y toda su
conversación con el médico.

> **Impacto:** exposición directa de datos clínicos. Incumple las dos leyes que
> el proyecto declara cumplir.

---

**Si se puede cambiar de rol sin volver a identificarse**

Una persona de admisión puede convertirse en médico con un clic y firmar notas
clínicas, o convertirse en administrador y ver el registro completo de acciones.

> **Impacto:** el sistema de permisos deja de tener sentido. Es como poner una
> cerradura en la puerta y dejar la llave puesta.

---

**Si el inicio de sesión no verifica la contraseña**

Cualquiera entra escribiendo cualquier cosa.

> **Impacto:** no hay control de acceso de ningún tipo.

---

**Si el cierre de la atención no bloquea nada**

Se pueden seguir enviando mensajes y agregando información clínica a una
atención que ya terminó, incluso días después.

> **Impacto:** el historial clínico deja de ser confiable. Nadie puede saber si
> algo se escribió durante la atención o después.

---

**Si el servidor no decide quién envió cada mensaje**

Alguien con conocimientos técnicos puede enviar un mensaje que aparezca firmado
como si lo hubiera escrito el médico tratante.

> **Impacto:** se puede falsificar información dentro de un historial clínico.

---

**Si no se separan los datos entre hospitales**

Un funcionario del Hospital A puede ver pacientes y conversaciones del
Hospital B.

> **Impacto:** fuga masiva de datos clínicos entre instituciones.

---

**Si un permiso pendiente se muestra como rechazado**

El médico ve «Rechazado» cuando en realidad el paciente todavía no ha
respondido.

> **Impacto:** el médico puede creer que el paciente le negó algo que nunca le
> negó, y tomar decisiones equivocadas. Es un problema que hoy existe en el
> frontend y hay que corregir.

---

**Si el permiso se vincula al contacto buscando su nombre en un texto**

Con dos contactos de apellidos parecidos, el sistema puede confundirlos.

> **Impacto:** información clínica enviada a la persona equivocada. El paciente
> autorizó compartir con su padre y el sistema se lo envía a otra persona.

---

### 8.3 Riesgos que dejan el sistema incompleto

No impiden usarlo, pero le quitan buena parte de su valor.

| Si no se construye | Qué pasa |
|---|---|
| **Los avisos en tiempo real** | El médico pide un permiso y el paciente no lo ve. El paciente responde y el médico no se entera. La comunicación entre dos personas simplemente no ocurre |
| **Los llamados al paciente** | El paciente sordo depende del altavoz que no puede oír. Se pierde una de las razones principales por las que existe el producto |
| **Las notas clínicas** | El médico escribe su diagnóstico y este desaparece al cambiar de pantalla. Se pierde el documento con más peso legal del sistema |
| **La auditoría** | No se puede saber quién vio o modificó qué. Ante un reclamo o una revisión, no hay respuesta posible |
| **Los consentimientos** | Se usan datos del paciente sin su autorización registrada. Se pierde el principio central del producto |
| **El envío a los contactos** | La pantalla dice que la familia fue informada cuando no lo fue. Es peor que no tener la función: genera una falsa confianza |
| **La pizarra de dibujo** | Un paciente que no escribe español con fluidez pierde una de sus principales formas de expresarse |
| **La gestión de usuarios** | Cada cuenta nueva hay que crearla manualmente en la base de datos. No es sostenible |
| **La configuración de seguridad** | El administrador ajusta valores que no tienen ningún efecto |
| **Los pictogramas administrables** | Cualquier pictograma nuevo aparece con un símbolo genérico, dejando inútil la pantalla de administración |

---

### 8.4 Riesgos del proyecto

Además de los riesgos técnicos, hay tres riesgos de gestión que conviene tener
presentes.

**Riesgo 1 — Creer que el sistema está más avanzado de lo que está**

El frontend se ve terminado y funcional. Alguien que lo pruebe sin conocer el
detalle puede pensar que el proyecto está casi listo. **No lo está**: no existe
nada del backend, y ninguna información se guarda.

**Riesgo 2 — Dejar la seguridad para el final**

Es la tentación más común. Como los permisos y la auditoría no se ven en
pantalla, se posponen para «cuando funcione todo lo demás». Cuando se intentan
agregar al final, siempre queda algún hueco. En un sistema de salud, ese hueco
tiene consecuencias legales.

**Riesgo 3 — Confiar en lo que la pantalla dice que hace**

Varias pantallas afirman cosas que no ocurren: que el chat queda bloqueado, que
el código expira, que el comprobante fue enviado, que la nota se guardó con su
huella de verificación. Este documento marca esos casos con ⚠️. Es importante
revisarlos uno por uno y no darlos por hechos.

---

## 9. Criterios de aceptación

### 9.1 Cómo usar esta lista

Un **criterio de aceptación** es una forma concreta de comprobar que algo quedó
bien hecho. No es una opinión: se prueba y el resultado es sí o no.

Esta lista sirve para revisar el trabajo terminado. Cada punto debería poder
marcarse después de probarlo de verdad, no solo de leer el código.

---

### 9.2 Inicio de sesión y permisos

- [ ] Un funcionario con contraseña correcta puede entrar.
- [ ] Un funcionario con contraseña incorrecta **no** puede entrar.
- [ ] Una cuenta desactivada **no** puede entrar aunque su contraseña sea correcta.
- [ ] Después de varios intentos fallidos seguidos, el sistema pide esperar.
- [ ] El paciente puede entrar a su portal de forma segura.
- [ ] Nadie puede cambiar su propio tipo de usuario sin volver a identificarse.
- [ ] Al cerrar sesión, hay que escribir la contraseña de nuevo para volver.
- [ ] Una sesión abandonada se cierra sola después de un tiempo.

### 9.3 Permisos por tipo de usuario

- [ ] El administrador **no** puede ver ninguna información clínica de pacientes.
- [ ] El paciente **no** puede ver sus signos vitales, su categorización ni sus notas clínicas.
- [ ] La persona de admisión **no** puede ver signos vitales, categorización ni notas.
- [ ] La persona de categorización **no** puede ver notas clínicas.
- [ ] Solo el médico ve la información completa de la atención.
- [ ] Un funcionario del Hospital A **no** puede ver nada del Hospital B.
- [ ] Estas restricciones se cumplen aunque alguien intente saltarse la pantalla.

### 9.4 Pacientes y código de atención

- [ ] La ficha del paciente se guarda y aparece igual en todas las pantallas.
- [ ] **Ningún funcionario** puede modificar la ficha del paciente.
- [ ] Un paciente puede tener varios contactos de emergencia.
- [ ] Se puede generar un código de atención y se muestra solo una vez.
- [ ] El código guardado no se puede leer directamente en la base de datos.
- [ ] Un código válido muestra los datos del paciente.
- [ ] Un código inexistente, vencido, ya usado o de otro hospital es rechazado, con un mensaje que explica el motivo.
- [ ] Tras varios intentos fallidos, el código queda bloqueado.
- [ ] El mismo código **no** puede abrir dos atenciones.

### 9.5 Sesiones médicas

- [ ] Se puede abrir una atención después de validar un código.
- [ ] La atención avanza en orden: admisión, categorización, consulta médica.
- [ ] **No** se puede retroceder de etapa.
- [ ] Un paciente **no** puede tener dos atenciones abiertas al mismo tiempo.
- [ ] El médico puede cerrar la atención indicando motivo y resumen.
- [ ] Después de cerrar, **no** se puede enviar ningún mensaje.
- [ ] Después de cerrar, **no** se puede agregar ninguna información clínica.
- [ ] Al cerrar, el código de atención queda vencido.
- [ ] Al cerrar, todos los permisos del paciente quedan retirados.
- [ ] Una atención sin actividad se cierra sola, aunque nadie tenga la página abierta.
- [ ] El código de atención aparece en pantalla tomado de la información real, no escrito a mano.

### 9.6 Consentimientos

- [ ] El médico puede solicitarle un permiso al paciente.
- [ ] Al paciente le aparece la solicitud en su pantalla.
- [ ] El paciente puede aceptar o rechazar.
- [ ] **Ningún funcionario** puede responder en nombre del paciente.
- [ ] Un permiso pendiente se muestra como pendiente, **no** como rechazado.
- [ ] Cada decisión queda registrada con su fecha y origen.
- [ ] Cuando el permiso es para compartir con un contacto, se guarda exactamente cuál contacto.
- [ ] Al autorizarse el envío, el contacto **recibe realmente** la información.

### 9.7 Comunicación

- [ ] Los mensajes se guardan y siguen ahí al recargar la página.
- [ ] Cada mensaje queda con el remitente que el servidor determinó, no el que envió la pantalla.
- [ ] Nadie puede hacer pasar un mensaje suyo como de otra persona.
- [ ] Los avisos automáticos del sistema aparecen solos.
- [ ] Una conversación larga se carga por partes, sin demora.
- [ ] Un mensaje nuevo aparece en la pantalla de la otra persona sin recargar.
- [ ] El paciente recibe el llamado en segundos.
- [ ] El paciente puede confirmar que vio el llamado.
- [ ] El personal ve si el paciente ya confirmó.

### 9.8 Información clínica

- [ ] Se pueden registrar los signos vitales y quedan asociados a la persona que los midió.
- [ ] Un valor imposible es rechazado con un mensaje que explica el rango correcto.
- [ ] Se puede registrar la categorización de urgencia con su motivo.
- [ ] Al confirmar la categorización, al paciente le llega el aviso automático.
- [ ] Se puede avanzar sin categorización, y queda registrado que ocurrió.
- [ ] El médico puede firmar una nota clínica y esta **se guarda**.
- [ ] Una nota firmada **no** se puede modificar ni borrar.
- [ ] Una corrección crea una versión nueva y conserva la original.
- [ ] Cada nota tiene su huella de verificación.
- [ ] La línea de tiempo muestra lo que realmente pasó en esa atención.

### 9.9 Pictogramas

- [ ] Los pictogramas vienen del servidor, no del código.
- [ ] El administrador puede crear un pictograma nuevo y este se ve correctamente.
- [ ] El administrador puede activar o desactivar pictogramas, y el cambio se mantiene.
- [ ] Un pictograma desactivado desaparece del portal del paciente.
- [ ] El dibujo de la pizarra le llega al personal de salud.
- [ ] Se puede distinguir un mensaje escrito de una traducción de señas.

### 9.10 Administración y control

- [ ] El administrador puede crear cuentas de funcionarios.
- [ ] El administrador puede desactivar una cuenta y esta deja de entrar.
- [ ] Las cifras del panel reflejan datos reales.
- [ ] Toda acción importante queda anotada automáticamente.
- [ ] El registro de acciones **no** se puede modificar ni borrar.
- [ ] Cada anotación identifica a una persona concreta, no a un cargo genérico.
- [ ] El administrador puede buscar y filtrar dentro del registro.
- [ ] La consulta del registro también queda anotada.
- [ ] Los valores de configuración que fija el administrador **tienen efecto real**.

### 9.11 Comprobaciones generales

- [ ] El frontend recibe toda la información que necesita, sin datos escritos a mano.
- [ ] Los mensajes de error están en español y se entienden.
- [ ] Los errores no muestran información técnica interna.
- [ ] Los registros técnicos no contienen datos de pacientes.
- [ ] Buscar sin tildes encuentra palabras con tildes.
- [ ] Los emoji de los pictogramas se guardan y se muestran correctamente.
- [ ] Las listas largas se entregan por partes.
- [ ] Toda la comunicación va cifrada.

---

## 10. Conclusión

### 10.1 Qué se logró con este documento

Este documento traduce un frontend ya construido a una **lista concreta de
trabajo** para el equipo de backend: 69 requerimientos funcionales y 39 no
funcionales, cada uno con su prioridad, sus dependencias y su forma de
comprobación.

Todo salió del análisis del proyecto real. No hay funcionalidades inventadas ni
módulos agregados «por si acaso». Si algo aparece aquí, es porque alguna pantalla
del frontend lo necesita.

### 10.2 Las tres ideas que conviene recordar

**Primera: el frontend no guarda nada.** Se ve terminado y funciona bien, pero
toda su información está escrita dentro del código y desaparece al recargar la
página. El backend se construye completo, desde cero.

**Segunda: hay promesas sin cumplir que ya se le están haciendo al usuario.**
Varias pantallas afirman que ocurren cosas que no ocurren: que el chat se
bloquea al cerrar la atención, que el código expira, que se envió el comprobante
a la familia. Están marcadas con ⚠️ a lo largo del documento. No son ideas
nuevas: son compromisos que el sistema ya adquirió y debe cumplir.

**Tercera: la seguridad no se agrega al final.** Ocho de los riesgos
identificados impiden usar el sistema con pacientes reales, y casi todos son de
control de acceso. Construirlos desde el principio cuesta bastante menos que
agregarlos después.

### 10.3 Cómo usar este documento

| Momento | Cómo usarlo |
|---|---|
| **Al planificar** | La sección 6 da el orden de trabajo. La 5 explica qué no se puede adelantar |
| **Al repartir tareas** | Cada requerimiento tiene un código para asignarlo y hacerle seguimiento |
| **Al programar** | Cada requerimiento dice qué debe lograrse, sin imponer cómo |
| **Al revisar** | La sección 9 es la lista de comprobación del trabajo terminado |
| **Al recortar alcance** | La sección 8 explica qué se pierde con cada cosa que se deje fuera |

### 10.4 Antes de empezar

Las decisiones de arquitectura ya están cerradas (API REST, Sanctum con Bearer
token, `/api/v1`, Swagger). La **identificación del paciente** también: token
derivado de su código de atención (CTA). Queda **una pregunta de modelado**:

1. ¿Cómo se representa el avance de una atención médica? (unificar el «estado» y
   la «etapa» que hoy se contradicen)

Conviene resolverla antes de modelar la sesión médica. Avanzar sin ella significa
rehacer trabajo más adelante.

### 10.5 Palabras finales

SEÑAVIDA busca que una persona sorda pueda llegar a una urgencia y explicar qué
le duele sin depender de que un familiar traduzca por ella. Ese es el objetivo, y
es un buen objetivo.

El frontend ya demuestra cómo se vería ese sistema funcionando. Lo que falta es
lo que lo hace real: guardar la información, proteger quién accede a ella y
respetar lo que el paciente autoriza. Eso es lo que construye el backend, y es lo
que este documento describe.

---

## Anexo · Palabras que aparecen en este documento

| Palabra | Qué significa |
|---|---|
| **Backend** | La parte del sistema que no se ve: guarda la información y decide quién puede hacer qué |
| **Frontend** | La parte que sí se ve: pantallas, botones y formularios |
| **CTA** | Código Temporal de Atención. El código que se le entrega al paciente al llegar |
| **Sesión médica** | Una atención concreta: un paciente, un día, un hospital |
| **Sesión de usuario** | Cuando una persona inicia sesión en el sistema. **No es lo mismo** que la anterior |
| **Categorización** | Clasificar qué tan grave es un caso, en cinco niveles |
| **Consentimiento** | Un permiso que el paciente da para un uso concreto de sus datos |
| **Auditoría** | El registro automático de quién hizo qué y cuándo |
| **Trazabilidad** | Poder saber después qué pasó y quién lo hizo |
| **Requerimiento funcional** | Algo que el sistema debe saber hacer |
| **Requerimiento no funcional** | Cómo debe hacerlo: rápido, seguro, confiable |
| **Criterio de aceptación** | Una forma concreta de comprobar que algo quedó bien |
| **LSCh** | Lengua de Señas Chilena |

---

*Documento elaborado a partir del análisis del frontend de SEÑAVIDA y de los
documentos `BACKEND_IMPLEMENTATION_GUIDE.md` y `FRONTEND_BACKEND_CONTRACT.md`.
Los puntos marcados con ⚠️ señalan funciones que la interfaz ya promete al
usuario y que actualmente no se cumplen.*
