<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UnitController extends Controller
{
    /**
     * Lista las unidades activas. Si se envía healthCenterId,
     * filtra solo las unidades de ese centro.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Unit::where('is_active', true);

        if ($request->has('healthCenterId')) {
            $query->where('health_center_id', $request->query('healthCenterId'));
        }

        $units = $query->get();

        return response()->json([
            'success' => true,
            'data'    => $units->map(fn ($unit) => [
                'id'             => $unit->id,
                'name'           => $unit->name,
                'healthCenterId' => $unit->health_center_id,
            ]),
        ], 200);
    }

    /**
     * Crea una unidad nueva.
     * super_admin: puede crear en cualquier centro.
     * admin_institucional: solo puede crear en SU propio centro.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        // 1. Verificar que el rol tenga permiso en absoluto
        if (! in_array($user->role, ['super_admin', 'admin_institucional'])) {
            return response()->json([
                'success' => false,
                'error'   => ['message' => 'No tienes permiso para crear unidades.'],
            ], 403);
        }

        // 2. Validar los datos
        $data = $request->validate([
            'name'           => ['required', 'string', 'max:255'],
            'healthCenterId' => ['required', 'uuid', 'exists:health_centers,id'],
        ]);

        // 3. Si es admin_institucional, solo puede crear en su propio centro
        if ($user->role === 'admin_institucional' && $data['healthCenterId'] !== $user->health_center_id) {
            return response()->json([
                'success' => false,
                'error'   => ['message' => 'Solo puedes crear unidades en tu propio centro de salud.'],
            ], 403);
        }

        // 4. Crear la unidad
        $unit = Unit::create([
            'name'             => $data['name'],
            'health_center_id' => $data['healthCenterId'],
            'is_active'        => true,
        ]);

        // 5. Responder con los datos creados
        return response()->json([
            'success' => true,
            'data'    => [
                'id'             => $unit->id,
                'name'           => $unit->name,
                'healthCenterId' => $unit->health_center_id,
            ],
        ], 201);
    }
}