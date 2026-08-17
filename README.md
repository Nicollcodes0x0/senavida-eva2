# SEÑAVIDA — Eva2 (Frontend + Backend Integrados)

Plataforma web de comunicación inclusiva para pacientes sordos en contextos de salud. Este repositorio contiene el frontend (React + Vite) y el backend (Laravel + PostgreSQL) como dos proyectos independientes que se comunican vía API REST.

```
senavida-eva2/
├── backend/    # API Laravel (PHP 8.4+, PostgreSQL, Sanctum)
└── frontend/   # SPA React (Vite, TypeScript, Tailwind CSS)
```

Documentación técnica detallada del frontend (arquitectura, sistema de diseño, estado de integración): [`frontend/DOCUMENTACION_FRONTEND.md`](./frontend/DOCUMENTACION_FRONTEND.md).

---

## Requisitos previos

- **PHP 8.4 o superior**, con las extensiones `pdo_pgsql`, `pgsql`, `mbstring`, `fileinfo` y `openssl` habilitadas.
- **Composer**
- **PostgreSQL** (servidor corriendo localmente, con un usuario y contraseña configurados)
- **Node.js** (versión compatible con Vite 7) y **npm**
- **Git**

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/Nicollcodes0x0/senavida-eva2.git
cd senavida-eva2
```

---

## 2. Levantar el backend

```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
```

Edita el archivo `backend/.env` recién creado y configura la conexión a tu base de datos PostgreSQL:

```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=senavida
DB_USERNAME=postgres
DB_PASSWORD=tu_contraseña_de_postgres
```

Crea las tablas y carga los datos de prueba:

```bash
php artisan migrate
php artisan db:seed
```

Levanta el servidor:

```bash
php artisan serve
```

El backend queda disponible en `http://127.0.0.1:8000`.

---

## 3. Levantar el frontend

En otra terminal:

```bash
cd frontend
npm install
```

Crea un archivo `frontend/.env` con:

```
VITE_API_URL=http://localhost:8000
```

Levanta el servidor de desarrollo:

```bash
npm run dev
```

El frontend queda disponible en `http://localhost:5173`.

> **Importante:** el backend solo permite peticiones desde `http://localhost:5173` (configurado en `backend/config/cors.php`). Si Vite levanta en otro puerto (por ejemplo porque el 5173 ya está en uso), la aplicación no podrá comunicarse con la API. Verifica que no haya otro proceso usando ese puerto antes de levantar el frontend.

---

## 4. Usuarios de prueba

El comando `php artisan db:seed` crea una organización, un centro de salud, una unidad, y un usuario de prueba por cada rol del sistema. Todos comparten la misma contraseña.

| Correo | Rol | Contraseña |
|---|---|---|
| `super_admin@test.com` | Super Administrador | `password123` |
| `admin_institucional@test.com` | Administrador Institucional | `password123` |
| `admision@test.com` | Admisión / Ventanilla | `password123` |
| `categorizacion@test.com` | Categorización (TENS) | `password123` |
| `medico@test.com` | Médico | `password123` |

**Recomendación para revisión:** iniciar sesión con `admin_institucional@test.com` permite acceder a las secciones de Gestión de Catálogos Institucionales (creación de organizaciones, centros de salud y unidades) y Registro de Funcionarios (con validación de confirmación de contraseña y cifrado del lado del servidor).

---

## 5. Estado de la integración

Un resumen detallado de qué módulos están conectados a la API real y cuáles todavía dependen de datos de ejemplo está disponible en la sección 7 de [`frontend/DOCUMENTACION_FRONTEND.md`](./frontend/DOCUMENTACION_FRONTEND.md).
