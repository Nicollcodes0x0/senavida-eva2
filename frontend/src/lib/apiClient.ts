/**
 * apiClient.ts
 *
 * Este archivo es el ÚNICO lugar del frontend donde hablamos directamente con
 * el backend de Laravel. Toda pantalla que necesite datos reales (login,
 * catálogos, usuarios, etc.) pasa por acá en vez de que cada componente haga
 * su propio fetch().
 *
 * Por qué lo organizamos así, centralizado:
 * - Si mañana cambia la URL del backend, la tocamos en un solo lugar
 *   (variable de entorno VITE_API_URL), no en cada componente.
 * - El token de sesión (Bearer de Sanctum) se agrega automáticamente en cada
 *   petición que lo necesita, sin que cada pantalla tenga que acordarse.
 * - El manejo de errores queda consistente: todos los componentes reciben
 *   los errores en la misma forma, sin importar qué endpoint hayan llamado.
 *
 * Sobre el formato de las respuestas del backend:
 * Antes de escribir esto revisamos directamente el código de
 * AuthController.php (no solo la documentación) para asegurarnos de qué
 * forma tienen las respuestas de verdad. El backend devuelve
 * { success: true, data } cuando todo sale bien, y
 * { success: false, error: { message } } cuando hay un error general
 * (credenciales incorrectas, cuenta desactivada, rate limiting). Los errores
 * de validación (422) usan el formato nativo de Laravel:
 * { message, errors: { campo: ["mensaje"] } }, sin el campo "success". Si en
 * algún momento el equipo cambia el formato de las respuestas, hay que
 * actualizar este archivo para que siga calzando.
 */

// ── Configuración base ──────────────────────────────────────────────────

// La URL del backend viene de la variable de entorno VITE_API_URL (definida
// en el archivo .env). Nunca hardcodeamos la URL acá directamente.
const API_BASE_URL = import.meta.env.VITE_API_URL as string;

if (!API_BASE_URL) {
  // Si esto aparece en la consola, significa que falta el archivo .env
  // o que no tiene la variable VITE_API_URL definida.
  console.error(
    'VITE_API_URL no está definida. Revisa que exista un archivo .env en la raíz del frontend con la línea VITE_API_URL=http://localhost:8000'
  );
}

const API_PREFIX = '/api/v1';

// ── Manejo del token de sesión ──────────────────────────────────────────

// Guardamos el token en localStorage para que la sesión sobreviva si se
// recarga la página. La clave tiene un nombre específico para no chocar con
// otras cosas que se guarden en localStorage.
const TOKEN_STORAGE_KEY = 'senavida_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

// ── Tipos de las respuestas del backend ─────────────────────────────────

// Así se ve una respuesta exitosa real (según AuthController.php):
// { success: true, data: {...} }
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

// Así se ve un error "general" real (login fallido por cuenta desactivada,
// rate limiting, etc.):
// { success: false, error: { message: "..." } }
interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
  };
}

// Cuando Laravel rechaza el request por validación (422), usa su formato
// nativo, que NO tiene "success" en absoluto:
// { message: "...", errors: { campo: ["mensaje"] } }
interface ApiValidationErrorResponse {
  message: string;
  errors: Record<string, string[]>;
}

// Esta es la clase de error que lanzamos cuando algo sale mal, para que
// los componentes puedan hacer try/catch y mostrar el mensaje adecuado.
export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string[]>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

// ── El corazón del archivo: la función que hace las peticiones ─────────

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  // Si el endpoint no requiere sesión iniciada (por ahora solo el login),
  // ponemos requiresAuth en false para no intentar mandar un token que no existe.
  requiresAuth?: boolean;
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, requiresAuth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (requiresAuth) {
    const token = getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    // Esto se dispara si el backend no está corriendo, o si hay un problema
    // de CORS, o si no hay conexión a internet.
    throw new ApiError(
      'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.',
      0
    );
  }

  // Caso especial: 204 No Content no trae cuerpo, así que no intentamos
  // parsear JSON (fallaría).
  if (response.status === 204) {
    return undefined as T;
  }

  const rawText = await response.text();

  // El servidor local está devolviendo un carácter '[' extra al inicio de
  // cada respuesta, antes del JSON real. Lo confirmamos con curl y con el
  // navegador, en distintos servidores (php artisan serve y Apache), así
  // que no depende del código del backend. No alcanzamos a encontrar la
  // causa exacta a tiempo, así que por ahora lo recortamos acá antes de
  // parsear. Nos queda pendiente investigar la causa real cuando tengamos
  // tiempo, y sacar este parche una vez que la resolvamos.
  let cleanText = rawText.trim();
  if (cleanText.startsWith('[') && !cleanText.endsWith(']')) {
    cleanText = cleanText.slice(1);
  }

  let json;
  try {
    json = JSON.parse(cleanText);
  } catch (parseError) {
    console.error('No se pudo parsear como JSON incluso después de limpiar:', rawText);
    throw parseError;
  }

  // Caso: error de validación (422). Laravel lo manda en su formato nativo,
  // distinto del resto de los errores.
  if (response.status === 422) {
    const validationError = json as ApiValidationErrorResponse;
    throw new ApiError(validationError.message, 422, validationError.errors);
  }

  // Caso: la respuesta trae success: false → es un error general
  // (credenciales incorrectas, cuenta desactivada, rate limiting, etc.)
  if ('success' in json && json.success === false) {
    const errorResponse = json as ApiErrorResponse;
    throw new ApiError(errorResponse.error.message, response.status);
  }

  // Caso: cualquier otro error HTTP que no tenga el formato esperado
  // (por ejemplo, un 500 con HTML en vez de JSON, o un error inesperado).
  if (!response.ok) {
    throw new ApiError(
      json.message || 'Ocurrió un error inesperado en el servidor.',
      response.status
    );
  }

  // Caso exitoso: { success: true, data: {...} }
  const successResponse = json as ApiSuccessResponse<T>;
  return successResponse.data;
}

// ── Tipos del dominio (según lo que devuelve AuthController.php) ───────

export type UserRole =
  | 'super_admin'
  | 'admin_institucional'
  | 'admision'
  | 'categorizacion'
  | 'medico'
  | 'paciente';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  user: AuthUser;
}

export interface Organization {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface HealthCenter {
  id: string;
  name: string;
  organizationId: string;
  [key: string]: unknown;
}

export interface Unit {
  id: string;
  name: string;
  healthCenterId: string;
  [key: string]: unknown;
}

// ── Funciones de Autenticación (Módulo A — el que ya está 100% listo) ──

/**
 * Inicia sesión con email y contraseña. healthCenterId y unitId son
 * opcionales: el propio AuthController.php los valida solo si vienen
 * presentes ("sometimes" en su regla de validación), y si vienen, además
 * confirma que el usuario realmente pertenezca a ese centro y esa unidad
 * (si no, responde 403). Si es exitoso, guarda el token automáticamente
 * para que las siguientes peticiones ya vayan autenticadas.
 */
export async function login(
  email: string,
  password: string,
  healthCenterId?: string,
  unitId?: string
): Promise<AuthUser> {
  const data = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: {
      email,
      password,
      ...(healthCenterId ? { healthCenterId } : {}),
      ...(unitId ? { unitId } : {}),
    },
    requiresAuth: false, // todavía no tenemos token en este punto
  });

  setStoredToken(data.token);
  return data.user;
}

/**
 * Trae los datos del usuario actualmente autenticado, según el token
 * guardado. La usamos justo después del login, y también al recargar la
 * página, para saber si la sesión sigue siendo válida.
 */
export async function fetchCurrentUser(): Promise<AuthUser> {
  const data = await apiRequest<{ user: AuthUser }>('/auth/me', {
    method: 'GET',
  });
  return data.user;
}

/**
 * Cierra la sesión en el servidor (revoca el token) y limpia el token
 * guardado localmente. Limpiamos el token local aunque la petición al
 * servidor falle, para no dejar a la persona con una sesión "fantasma"
 * en el navegador.
 */
export async function logout(): Promise<void> {
  try {
    await apiRequest<void>('/auth/logout', { method: 'POST' });
  } finally {
    clearStoredToken();
  }
}

// ── Funciones de Catálogos (Módulo listo: organizations, health-centers, units) ──

export async function listOrganizations(): Promise<Organization[]> {
  return apiRequest<Organization[]>('/organizations', { method: 'GET' });
}

export async function listHealthCenters(): Promise<HealthCenter[]> {
  return apiRequest<HealthCenter[]>('/health-centers', { method: 'GET' });
}

/**
 * Trae las unidades de un centro de salud específico, o todas si no se
 * pasa healthCenterId. El backend soporta filtrar con este query param.
 */
export async function listUnits(healthCenterId?: string): Promise<Unit[]> {
  const query = healthCenterId ? `?healthCenterId=${healthCenterId}` : '';
  return apiRequest<Unit[]>(`/units${query}`, { method: 'GET' });
}

// ── Función de Registro de Usuarios (Módulo B) ──────────────────────────

export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  role: UserRole;
  organizationId: string;
  healthCenterId: string;
  unitId: string;
}

export async function registerUser(payload: RegisterUserPayload): Promise<AuthUser> {
  // Ojo con este detalle: Laravel exige que el campo de confirmación de
  // contraseña se llame exactamente "password_confirmation" (con guion
  // bajo), porque es una convención fija de su regla `confirmed` — no seguir
  // el patrón camelCase del resto del contrato. Por eso lo traducimos acá,
  // para que el resto del código pueda seguir usando camelCase.
  const data = await apiRequest<{ user: AuthUser }>('/users', {
    method: 'POST',
    body: {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.passwordConfirmation,
      role: payload.role,
      organizationId: payload.organizationId,
      healthCenterId: payload.healthCenterId,
      unitId: payload.unitId,
    },
  });
  return data.user;
}

// ── Funciones para crear catálogos (organizations, health-centers, units) ──
//
// Revisamos los controllers reales del backend para confirmar los permisos:
// - Crear una organización: solo super_admin.
// - Crear un centro de salud: solo super_admin.
// - Crear una unidad: super_admin o admin_institucional (pero admin_institucional
//   solo puede crearla dentro de su propio centro; eso lo valida el backend,
//   no hace falta que lo repitamos acá).

export async function createOrganization(name: string): Promise<Organization> {
  return apiRequest<Organization>('/organizations', {
    method: 'POST',
    body: { name },
  });
}

export async function createHealthCenter(name: string, organizationId: string): Promise<HealthCenter> {
  return apiRequest<HealthCenter>('/health-centers', {
    method: 'POST',
    body: { name, organizationId },
  });
}

export async function createUnit(name: string, healthCenterId: string): Promise<Unit> {
  return apiRequest<Unit>('/units', {
    method: 'POST',
    body: { name, healthCenterId },
  });
}
