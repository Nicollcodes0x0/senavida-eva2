<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    /**
     * Lista todas las organizaciones activas.
     */
    public function index(): JsonResponse
    {
        $organizations = Organization::where('is_active', true)->get();

        return response()->json([
            'success' => true,
            'data'    => $organizations->map(fn ($org) => [
                'id'   => $org->id,
                'name' => $org->name,
            ]),
        ], 200);
    }

    /**
     * Crea una organización nueva.
     * Solo un super_admin puede hacerlo.
     */
    public function store(Request $request): JsonResponse
    {
        // 1. Verificar que quien hace la petición sea super_admin
        if ($request->user()->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'error'   => ['message' => 'No tienes permiso para crear organizaciones.'],
            ], 403);
        }

        // 2. Validar los datos
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        // 3. Crear la organización
        $organization = Organization::create([
            'name'      => $data['name'],
            'is_active' => true,
        ]);

        // 4. Responder con los datos creados
        return response()->json([
            'success' => true,
            'data'    => [
                'id'   => $organization->id,
                'name' => $organization->name,
            ],
        ], 201);
    }
}