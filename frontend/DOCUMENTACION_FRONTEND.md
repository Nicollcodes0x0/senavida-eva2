# SEÑAVIDA — Documentación Técnica del Frontend

## 1. Descripción general

SEÑAVIDA es una plataforma web de comunicación inclusiva orientada a facilitar la interacción entre pacientes sordos y personal de salud en contextos clínicos, particularmente en servicios de urgencia. El frontend es una aplicación de página única (SPA) construida en React, responsable de la interfaz de usuario, la autenticación y la comunicación con la API REST del backend Laravel.

Este documento describe la arquitectura, las decisiones técnicas y el estado actual de integración del frontend con el backend.

---

## 2. Stack tecnológico

| Categoría | Tecnología | Versión |
|---|---|---|
| Framework UI | React | 19.2 |
| Bundler / Dev server | Vite | 7 |
| Lenguaje | TypeScript | 6 |
| Estilos | Tailwind CSS | 4 |
| Iconografía | lucide-react | — |
| Animaciones | motion | — |

El proyecto no utiliza un framework de enrutamiento (como React Router); la navegación entre vistas se maneja mediante estado local de React (`useState`), lo cual es adecuado dado el número acotado de vistas de nivel superior (landing, login, dashboard).

---

## 3. Arquitectura y estructura de carpetas

```
frontend/
├── src/
│   ├── components/       # Componentes de UI (vistas y piezas reutilizables)
│   ├── data/              # Datos de ejemplo (mockData.ts) para módulos aún
│   │                       # sin backend disponible
│   ├── lib/
│   │   └── apiClient.ts   # Capa única de comunicación con el backend
│   ├── App.tsx             # Componente raíz: enrutamiento por estado y
│   │                       # orquestación de sesión
│   ├── main.tsx
│   ├── types.ts            # Tipos de dominio compartidos
│   └── index.css
├── .env                    # Variables de entorno (no versionado)
└── package.json
```

### 3.1. Principio de capa única de red

Toda comunicación HTTP con el backend está centralizada en `src/lib/apiClient.ts`. Ningún componente realiza llamadas `fetch` directas. Esta decisión responde a tres objetivos:

1. **Punto único de configuración**: la URL base del backend se define una sola vez, mediante la variable de entorno `VITE_API_URL`.
2. **Manejo consistente de autenticación**: el token de sesión (Bearer, emitido por Laravel Sanctum) se adjunta automáticamente a cada petición que lo requiere.
3. **Manejo consistente de errores**: todos los componentes reciben los errores del backend en un formato uniforme (`ApiError`), independientemente del endpoint invocado.

---

## 4. Autenticación y sesión

### 4.1. Flujo de inicio de sesión

1. El usuario ingresa correo y contraseña en `Login.tsx`.
2. `apiClient.login()` realiza `POST /api/v1/auth/login`.
3. Si las credenciales son válidas, el backend responde con un token Sanctum y los datos del usuario (id, nombre, correo, rol, estado).
4. El token se almacena en `localStorage` bajo la clave `senavida_auth_token`.
5. El usuario autenticado se propaga a `App.tsx`, que determina la vista a renderizar según su rol.

El formulario de login admite, de forma opcional, la selección de Establecimiento y Unidad. Estos campos no son obligatorios: si se omiten, el backend valida solo correo y contraseña; si se incluyen, el backend además verifica que el usuario pertenezca efectivamente a ese establecimiento y unidad, devolviendo un error de autorización en caso contrario.

### 4.2. Persistencia de sesión

Al cargar la aplicación, `App.tsx` verifica si existe un token almacenado. De ser así, se invoca `GET /api/v1/auth/me` para recuperar los datos del usuario autenticado y restaurar la sesión sin requerir un nuevo inicio de sesión. Si el token ya no es válido (expirado o revocado), la sesión se descarta silenciosamente y el usuario permanece en la vista pública.

### 4.3. Cierre de sesión

El cierre de sesión invoca `POST /api/v1/auth/logout`, revocando el token en el servidor, y limpia el almacenamiento local independientemente del resultado de esa petición, para evitar dejar al usuario con una sesión inválida en el navegador.

### 4.4. Roles soportados

```
super_admin | admin_institucional | admision | categorizacion | medico | paciente
```

El rol determina qué panel se renderiza dentro del dashboard (`DashboardContainer.tsx`). La autorización real, sin embargo, es responsabilidad del backend: cada endpoint valida el rol del solicitante de forma independiente a lo que el frontend muestre u oculte.

---

## 5. Gestión de catálogos institucionales

El sistema modela una jerarquía de tres niveles: **Organización → Centro de Salud → Unidad**. Estos catálogos son consumidos en dos contextos:

- **Registro de funcionarios** (`UserRegistrationForm.tsx`): selección en cascada para asignar el nuevo usuario a una organización, centro y unidad específicos.
- **Inicio de sesión** (`Login.tsx`): selección opcional de establecimiento y unidad, utilizada quan el backend requiere validar la pertenencia institucional del usuario.

La creación de catálogos (`CatalogManagementForm.tsx`) está disponible en el panel de administración institucional. Las reglas de autorización correspondientes —qué rol puede crear qué nivel de la jerarquía— son aplicadas por el backend; el frontend no las duplica.

---

## 6. Registro de usuarios

El registro de funcionarios no es un flujo de autorregistro abierto. Únicamente los roles `admin_institucional` y `super_admin` tienen acceso al formulario correspondiente, ubicado dentro del panel de administración. El backend rechaza la solicitud con un error de autorización si es invocada por un rol distinto, incluso si se accediera al endpoint directamente.

El formulario exige confirmación de contraseña. La contraseña se transmite en texto plano únicamente durante el tránsito HTTPS de la petición; el cifrado (hash) se realiza del lado del servidor antes de persistir el registro, y el frontend no tiene visibilidad de ese proceso ni lo replica.

---

## 7. Estado de integración por módulo

| Módulo | Estado | Detalle |
|---|---|---|
| Autenticación (login, sesión, logout) | Integrado | Conectado a endpoints reales de Sanctum |
| Catálogos (organización, centro, unidad) | Integrado | Lectura y creación conectadas |
| Registro de funcionarios | Integrado | Conectado, con cifrado de contraseña gestionado por el backend |
| Listado de funcionarios existentes | Pendiente | Requiere que el backend exponga un endpoint de listado, actualmente inexistente |
| Cambio de contraseña por el propio usuario | Pendiente | Requiere endpoint no implementado aún en el backend |
| Dominio clínico (sesiones, admisión, triage, chat, pictogramas) | No integrado | Sin endpoints disponibles en el backend; el frontend opera con datos de ejemplo (`src/data/mockData.ts`) |

---

## 8. Sistema de diseño

### 8.1. Motor de estilos

El proyecto utiliza **Tailwind CSS 4**, que a diferencia de versiones anteriores no requiere un archivo `tailwind.config.js` para definir tokens personalizados. La configuración de diseño se define directamente en CSS, mediante el bloque `@theme` dentro de `src/index.css`, utilizando variables CSS nativas (`--color-*`, `--shadow-*`, `--radius-*`) que Tailwind expone automáticamente como clases utilitarias (por ejemplo, `--color-brand-primary` habilita las clases `bg-brand-primary`, `text-brand-primary`, `border-brand-primary`, etc.).

### 8.2. Tipografía

| Uso | Familia tipográfica | Propósito |
|---|---|---|
| Texto general (`font-sans`) | Inter | Tipografía principal de la interfaz |
| Texto accesible (`font-accessible`) | Atkinson Hyperlegible | Alternativa activable por el usuario, diseñada específicamente para mejorar la legibilidad en personas con baja visión o dislexia |
| Código / datos monoespaciados (`font-mono`) | JetBrains Mono | Reservada para elementos técnicos (identificadores, códigos) |

La tipografía accesible se activa dinámicamente mediante la clase `.accessible-font` sobre `<body>`, controlada desde el panel de accesibilidad del encabezado público.

### 8.3. Paleta de colores

**Colores de marca**

| Token | Valor hex | Uso previsto |
|---|---|---|
| `brand-primary` | `#3ea5e1` | Color principal de marca; botones primarios, enlaces activos, foco de accesibilidad |
| `brand-intermediate` | `#1fa0df` | Estado hover/interacción de elementos con `brand-primary` |
| `brand-dark` | `#0f172a` | Texto de alto contraste, fondos oscuros (modo alto contraste, secciones institucionales) |
| `brand-light` | `#f0fafd` | Fondos suaves, insignias y superficies de apoyo sobre `brand-primary` |

**Color secundario — turquesa**

| Token | Valor hex | Uso previsto |
|---|---|---|
| `brand-turquoise` | `#1fb9a4` | Acento secundario; se combina con `brand-primary` en degradados de titulares |
| `brand-turquoise-dark` | `#168e7d` | Variante oscura para texto o iconografía sobre fondos claros |

**Colores semánticos (estado)**

| Token | Valor hex | Significado |
|---|---|---|
| `brand-success` | `#16a34a` | Éxito, confirmación, estados activos |
| `brand-success-light` | `#f0fdf4` | Fondo suave para mensajes de éxito |
| `brand-coral` | `#dc2626` | Error, alerta crítica, acciones destructivas |
| `brand-coral-dark` | `#991b1b` | Variante oscura para texto de error |
| `brand-coral-light` | `#fef2f2` | Fondo suave para mensajes de error |
| `brand-yellow` | `#f59e0b` | Advertencia, estados pendientes |
| `brand-yellow-dark` | `#92400e` | Variante oscura para texto de advertencia |
| `brand-yellow-light` | `#fef3c7` | Fondo suave para mensajes de advertencia |

**Colores neutros y de superficie**

| Token | Valor hex | Uso previsto |
|---|---|---|
| `brand-text-primary` | `#1e293b` | Texto principal del cuerpo |
| `brand-text-secondary` | `#64748b` | Texto secundario, descripciones, metadatos |
| `brand-border` | `#e2e8f0` | Bordes de tarjetas, inputs y divisores |
| `brand-bg` | `#f8fafc` | Fondo general de la aplicación |

### 8.4. Modo de alto contraste

La aplicación incorpora un modo de alto contraste activable desde el encabezado público, que sustituye la paleta anterior por una combinación de fondo negro (`bg-black`) y texto/bordes en amarillo (`text-yellow-400`, `border-yellow-400`) en la totalidad de los componentes. Esta variante se controla mediante una prop booleana (`highContrast`) propagada desde `App.tsx` hacia cada componente, y responde al criterio de accesibilidad WCAG de contraste mínimo para usuarios con baja visión.

### 8.5. Elevación y bordes

| Token | Valor | Uso |
|---|---|---|
| `shadow-xs` | Sombra sutil (1px) | Elementos casi planos, tarjetas en reposo |
| `shadow-sm` | Sombra suave | Tarjetas interactivas |
| `shadow-md` | Sombra media | Modales, elementos flotantes |
| `shadow-lg` | Sombra pronunciada | Tarjetas destacadas, superposición sobre el hero |
| `radius-sm` | 6px | Elementos pequeños (badges, chips) |
| `radius-input` | 8px | Campos de formulario |
| `radius-button` | 8px | Botones |
| `radius-card` | 12px | Tarjetas de contenido |
| `radius-modal` | 16px | Modales y superposiciones |

### 8.6. Accesibilidad como principio de diseño

Más allá de la paleta y la tipografía, el sistema de diseño incorpora accesibilidad de forma estructural:

- **Foco visible reforzado**: todo elemento interactivo enfocado mediante teclado recibe un contorno de 3px en `brand-primary` con separación (`outline-offset`), en lugar de depender del estilo por defecto del navegador.
- **Escalado de tamaño de fuente**: la interfaz permite ajustar un multiplicador de tamaño de fuente global, aplicado mediante una variable de estilo en línea sobre el contenedor raíz de la aplicación.
- **Compatibilidad con lectores de pantalla y síntesis de voz**: los pictogramas y mensajes clínicos incorporan una función de lectura en voz alta (`speechSynthesis`), configurada en español chileno (`es-CL`).

### 8.7. Composición del hero (landing)

La sección principal de la página pública utiliza una imagen de marca a ancho completo de pantalla (*full-bleed*, sin contenerla dentro del ancho máximo del resto del contenido), con dos recursos visuales superpuestos:

- Un degradado oscuro inferior (negro a transparente) que garantiza la legibilidad de los botones de llamada a la acción independientemente del contenido de la imagen.
- Un difuminado lateral izquierdo y derecho hacia el color de fondo de la aplicación (`brand-bg`), que evita un corte visual abrupto entre la imagen y el resto de la página.



## 9. Configuración del entorno local

El frontend requiere un archivo `.env` (no versionado) con la siguiente variable:

```
VITE_API_URL=http://localhost:8000
```

Esta URL debe apuntar al backend en ejecución. El archivo `.env` está excluido del control de versiones mediante `.gitignore`, dado que puede variar según el entorno de cada persona desarrolladora.

---

## 10. Consideración conocida del entorno de desarrollo local

Durante las pruebas de integración se observó que, en ciertos entornos locales de Windows, las respuestas HTTP del servidor de desarrollo de Laravel llegan con un carácter adicional al inicio del cuerpo de la respuesta, lo que interfiere con el parseo JSON estándar. Se aplicó una medida de tolerancia en `apiClient.ts` que normaliza la respuesta antes de procesarla. La causa raíz de este comportamiento no ha sido determinada con certeza; se descartó que se origine en el código del backend, en la configuración de CORS, o en la versión de PHP utilizada (se probó tanto la variante Thread Safe como Non-Thread Safe). Queda pendiente una investigación posterior.
