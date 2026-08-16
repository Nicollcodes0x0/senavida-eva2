<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Inicia sesión y devuelve un token de acceso.
     */
    public function login(Request $request): JsonResponse
    {
        // 1. Validar formato de los campos
        $credentials = $request->validate([
            'email'          => ['required', 'email'],
            'password'       => ['required', 'string'],
            'healthCenterId' => ['sometimes', 'uuid'],
            'unitId'         => ['sometimes', 'uuid'],
        ]);

        // 2. Límite de intentos (rate limiting)
        $throttleKey = 'login:'.strtolower($credentials['email']).'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return response()->json([
                'success' => false,
                'error'   => ['message' => "Demasiados intentos. Intenta de nuevo en {$seconds} segundos."],
            ], 429);
        }

        // 3. Buscar al usuario por su email
        $user = User::where('email', $credentials['email'])->first();

        // 4. Verificar credenciales: que el usuario exista y la contraseña coincida
        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            RateLimiter::hit($throttleKey, 60);

            throw ValidationException::withMessages([
                'email' => ['Las credenciales no son correctas.'],
            ]);
        }

        // Credenciales correctas: limpiamos el contador de intentos
        RateLimiter::clear($throttleKey);

        // 5. Verificar que el usuario esté activo
        if (! $user->is_active) {
            return response()->json([
                'success' => false,
                'error'   => ['message' => 'Tu cuenta está desactivada.'],
            ], 403);
        }

        // 6. Verificar pertenencia al centro y unidad (si se enviaron)
        if (isset($credentials['healthCenterId']) && $user->health_center_id !== $credentials['healthCenterId']) {
            return response()->json([
                'success' => false,
                'error'   => ['message' => 'No perteneces a ese centro de salud.'],
            ], 403);
        }

        if (isset($credentials['unitId']) && $user->unit_id !== $credentials['unitId']) {
            return response()->json([
                'success' => false,
                'error'   => ['message' => 'No perteneces a esa unidad.'],
            ], 403);
        }

        // 7. Crear el token de Sanctum
        $token = $user->createToken('auth-token')->plainTextToken;

        // 8. Devolver el token y los datos del usuario
        return response()->json([
            'success' => true,
            'data'    => [
                'token'     => $token,
                'tokenType' => 'Bearer',
                'user'      => [
                    'id'       => $user->id,
                    'name'     => $user->name,
                    'email'    => $user->email,
                    'role'     => $user->role,
                    'isActive' => $user->is_active,
                ],
            ],
        ], 200);
    }

    /**
     * Devuelve los datos del usuario autenticado (según su token).
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data'    => [
                'user' => [
                    'id'       => $user->id,
                    'name'     => $user->name,
                    'email'    => $user->email,
                    'role'     => $user->role,
                    'isActive' => $user->is_active,
                ],
            ],
        ], 200);
    }

    /**
     * Cierra sesión: revoca el token actual en el servidor.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
        ], 200);
    }
}