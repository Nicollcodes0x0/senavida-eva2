<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\HealthCenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HealthCenterController extends Controller
{
    /**
     * Lista todos los centros de salud activos.
     */
    public function index(): JsonResponse
    {
        $healthCenters = HealthCenter::where('is_active', true)->get();

        return response()->json([
            'success' => true,
            'data'    => $healthCenters->map(fn ($center) => [
                'id'             => $center->id,
                'name'           => $center->name,
                'organizationId' => $center->organization_id,
            ]),
        ], 200);
    }

    /**
     * Crea un centro de salud nuevo.
     * Solo un super_admin puede hacerlo.
     */
    public function store(Request $request): JsonResponse
    {
        // 1. Verificar que quien hace la petición sea super_admin
        if ($request->user()->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'error'   => ['message' => 'No tienes permiso para crear centros de salud.'],
            ], 403);
        }

        // 2. Validar los datos
        $data = $request->validate([
            'name'           => ['required', 'string', 'max:255'],
            'organizationId' => ['required', 'uuid', 'exists:organizations,id'],
        ]);

        // 3. Crear el centro
        $healthCenter = HealthCenter::create([
            'name'            => $data['name'],
            'organization_id' => $data['organizationId'],
            'is_active'       => true,
        ]);

        // 4. Responder con los datos creados
        return response()->json([
            'success' => true,
            'data'    => [
                'id'             => $healthCenter->id,
                'name'           => $healthCenter->name,
                'organizationId' => $healthCenter->organization_id,
            ],
        ], 201);
    }
}