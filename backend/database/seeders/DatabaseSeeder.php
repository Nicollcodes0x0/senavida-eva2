<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Creamos un usuario de prueba por cada rol del sistema, para poder
     * probar el login real y ver cada dashboard tal como lo vería esa
     * persona en la vida real. La contraseña es la misma para todos
     * ("password123") solo para que sea fácil de recordar mientras
     * probamos en local — esto nunca debe usarse así en producción.
     */
    public function run(): void
    {
        $roles = [
            'super_admin',
            'admin_institucional',
            'admision',
            'categorizacion',
            'medico',
        ];

        foreach ($roles as $role) {
            User::updateOrCreate(
                ['email' => "{$role}@test.com"],
                [
                    'name' => 'Usuario ' . ucfirst(str_replace('_', ' ', $role)),
                    'password' => Hash::make('password123'),
                    'role' => $role,
                    'is_active' => true,
                ]
            );
        }
    }
}
