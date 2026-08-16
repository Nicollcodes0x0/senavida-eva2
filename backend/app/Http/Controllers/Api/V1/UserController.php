<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Registra un nuevo usuario (funcionario del sistema).
     * Solo un admin_institucional puede hacerlo, y únicamente
     * para su propio centro de salud.
     */
    public function register(Request $request): JsonResponse
    {
        $admin = $request->user();

        // 1. Verificar que quien hace la petición sea admin_institucional o super_admin
        if (! in_array($admin->role, ['super_admin', 'admin_institucional'])) {
            return response()->json([
                'success' => false,
                'error'   => ['message' => 'No tienes permiso para registrar usuarios.'],
            ], 403);
        }

        // 2. Validar los datos del nuevo usuario
        $data = $request->validate([
            'name'             => ['required', 'string', 'max:255'],
            'email'            => ['required', 'email', 'unique:users,email'],
            'password'         => ['required', 'string', 'min:8', 'confirmed'],
            'role'             => ['required', 'in:super_admin,admin_institucional,admision,categorizacion,medico'],
            'organizationId'   => ['required', 'uuid', 'exists:organizations,id'],
            'healthCenterId'   => ['required', 'uuid', 'exists:health_centers,id'],
            'unitId'           => ['required', 'uuid', 'exists:units,id'],
        ]);

        // 3. Verificar que el admin solo registre usuarios en SU propio centro y que tambien lo pueda hacer el super_admin
        if ($admin->role === 'admin_institucional' && $data['healthCenterId'] !== $admin->health_center_id) {
            return response()->json([
                'success' => false,
                'error'   => ['message' => 'Solo puedes registrar usuarios en tu propio centro de salud.'],
             ], 403);
        }

        // 4. Crear el usuario (la contraseña se cifra automáticamente)
        $user = User::create([
            'name'              => $data['name'],
            'email'             => $data['email'],
            'password'          => $data['password'],
            'role'              => $data['role'],
            'organization_id'   => $data['organizationId'],
            'health_center_id'  => $data['healthCenterId'],
            'unit_id'           => $data['unitId'],
            'is_active'         => true,
        ]);

        // 5. Responder con los datos del usuario creado (sin la contraseña)
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
        ], 201);
    }
}