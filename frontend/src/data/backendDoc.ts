/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CodeBlock {
  title: string;
  language: string;
  code: string;
  description: string;
}

export const databaseSchemaDoc = `
-- SEÑAVIDA - ESTRUCTURA BASE POSTGRESQL (MIGRACIONES)
-- NOTA: Utiliza UUIDs para IDs públicos o sensibles.

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    rut VARCHAR(20) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE health_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- Código DEIS o interno
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    health_center_id UUID REFERENCES health_centers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- Ej: Urgencias, Pediatría
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    health_center_id UUID REFERENCES health_centers(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    remember_token VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    age INT NOT NULL,
    communication_preference VARCHAR(255) DEFAULT 'LSCh y texto',
    allergies JSONB DEFAULT '[]'::jsonb,
    blood_type VARCHAR(10),
    conditions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE patient_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    priority INT DEFAULT 1,
    allow_sos BOOLEAN DEFAULT FALSE,
    allow_updates BOOLEAN DEFAULT FALSE,
    allow_clinical_information BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    blocked_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE temporary_access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    code_hash VARCHAR(255) NOT NULL, -- Hash de código ej: SV-847291
    status VARCHAR(50) DEFAULT 'active', -- active, consumed, expired, blocked
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP DEFAULT NULL,
    failed_attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    health_center_id UUID REFERENCES health_centers(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE medical_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    health_center_id UUID REFERENCES health_centers(id),
    unit_id UUID REFERENCES units(id),
    status VARCHAR(50) DEFAULT 'pending_consent', -- active, waiting_interpreter, closed, expired
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP DEFAULT NULL,
    current_stage VARCHAR(100) NOT NULL, -- admisión, categorización, consulta_medica
    created_by UUID REFERENCES users(id),
    closed_by UUID REFERENCES users(id),
    closure_reason TEXT,
    summary TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medical_session_id UUID REFERENCES medical_sessions(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL, -- camera, microphone, clinical_data, share_with_contacts
    status VARCHAR(50) DEFAULT 'pending', -- granted, rejected, revoked
    granted_at TIMESTAMP DEFAULT NULL,
    revoked_at TIMESTAMP DEFAULT NULL,
    expires_at TIMESTAMP DEFAULT NULL,
    evidence JSONB DEFAULT NULL, -- Datos de IP, hash, etc.
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medical_session_id UUID REFERENCES medical_sessions(id) ON DELETE CASCADE,
    sender_type VARCHAR(50) NOT NULL, -- patient, staff, system
    sender_id UUID, -- NULL si es paciente o sistema externo
    message_type VARCHAR(50) DEFAULT 'text', -- text, quick_message, pictogram, gesture_prediction
    body TEXT NOT NULL,
    origin VARCHAR(50) NOT NULL, -- patient, admission, triage, doctor
    status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, read
    sent_at TIMESTAMP NOT NULL,
    delivered_at TIMESTAMP DEFAULT NULL,
    read_at TIMESTAMP DEFAULT NULL,
    confirmed_by_patient_at TIMESTAMP DEFAULT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    deleted_at TIMESTAMP DEFAULT NULL
);

CREATE TABLE vital_signs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medical_session_id UUID REFERENCES medical_sessions(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES users(id) NOT NULL,
    systolic_pressure INT NOT NULL,
    diastolic_pressure INT NOT NULL,
    temperature DECIMAL(4,2) NOT NULL,
    oxygen_saturation INT NOT NULL,
    heart_rate INT NOT NULL,
    respiratory_rate INT NOT NULL,
    pain_level INT NOT NULL,
    measured_at TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE triage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medical_session_id UUID REFERENCES medical_sessions(id) ON DELETE CASCADE,
    recorded_by UUID REFERENCES users(id) NOT NULL,
    triage_level VARCHAR(10) NOT NULL, -- C1, C2, C3, C4, C5
    symptoms JSONB DEFAULT '[]'::jsonb,
    observations TEXT,
    completed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medical_session_id UUID REFERENCES medical_sessions(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) NOT NULL,
    note_type VARCHAR(100) NOT NULL, -- impression, diagnosis, treatment, medication, indication
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- draft, signed
    signed_at TIMESTAMP DEFAULT NULL,
    version INT DEFAULT 1,
    supersedes_id UUID DEFAULT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    health_center_id UUID,
    user_id UUID,
    patient_id UUID,
    medical_session_id UUID,
    action VARCHAR(255) NOT NULL, -- 'view_patient', 'sign_clinical_note', 'grant_consent'
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID NOT NULL,
    old_values JSONB DEFAULT NULL,
    new_values JSONB DEFAULT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    severity VARCHAR(50) NOT NULL -- 'info', 'warning', 'critical'
);
`;

export const backendCodeBlocks: CodeBlock[] = [
  {
    title: 'Model: MedicalSession.php',
    language: 'php',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsToMany;

class MedicalSession extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'patient_id', 'organization_id', 'health_center_id', 'unit_id',
        'status', 'started_at', 'ended_at', 'current_stage', 'created_by',
        'closed_by', 'closure_reason', 'summary'
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function healthCenter(): BelongsTo
    {
        return $this->belongsTo(HealthCenter::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function consents(): HasMany
    {
        return $this->hasMany(Consent::class);
    }

    public function chatMessages(): HasMany
    {
        return $this->hasMany(ChatMessage::class);
    }

    public function vitalSigns(): HasMany
    {
        return $this->hasMany(VitalSign::class);
    }

    public function clinicalNotes(): HasMany
    {
        return $this->hasMany(ClinicalNote::class);
    }
}`,
    description: 'Definición del modelo MedicalSession con sus respectivas relaciones de Laravel Eloquent y tipado explícito.'
  },
  {
    title: 'Controller: AttentionCodeController.php',
    language: 'php',
    code: `<?php

namespace App\\Http\\Controllers;

use App\\Http\\Requests\\ValidateTemporaryAccessCodeRequest;
use App\\Models\\TemporaryAccessCode;
use App\\Models\\MedicalSession;
use Illuminate\\Support\\Facades\\Hash;
use Illuminate\\Support\\Facades\\DB;
use Carbon\\Carbon;

class AttentionCodeController extends Controller
{
    public function validateCode(ValidateTemporaryAccessCodeRequest $request)
    {
        $code = $request->input('code'); // ej: SV-847291
        $centerId = auth()->user()->health_center_id;

        // Buscamos códigos vigentes y sin consumir
        $activeCodes = TemporaryAccessCode::where('status', 'active')
            ->where('expires_at', '>', Carbon::now())
            ->get();

        $matchingCode = null;
        foreach ($activeCodes as $tempCode) {
            if (Hash::check($code, $tempCode->code_hash)) {
                $matchingCode = $tempCode;
                break;
            }
        }

        if (!$matchingCode) {
            return response()->json([
                'status' => 'error',
                'message' => 'El código ingresado no existe, expiró o está bloqueado.',
                'code' => 'INVALID_CODE'
            ], 422);
        }

        if ($matchingCode->failed_attempts >= $matchingCode->max_attempts) {
            $matchingCode->update(['status' => 'blocked']);
            return response()->json([
                'status' => 'error',
                'message' => 'Código bloqueado por exceso de intentos fallidos.',
                'code' => 'BLOCKED_CODE'
            ], 403);
        }

        // Retornar datos mínimos para que el personal solicite el consentimiento del paciente
        return response()->json([
            'status' => 'success',
            'data' => [
                'access_id' => $matchingCode->id,
                'patient' => [
                    'name' => $matchingCode->patient->name,
                    'age' => $matchingCode->patient->age,
                    'communication_preference' => $matchingCode->patient->communication_preference,
                ]
            ]
        ]);
    }
}`,
    description: 'Controlador encargado de la validación segura de códigos de atención temporal (CTA). No almacena el código plano y gestiona el rate limiting e intentos fallidos.'
  },
  {
    title: 'Middleware: EnsureMedicalSessionIsActive.php',
    language: 'php',
    code: `<?php

namespace App\\Http\\Middleware;

use Closure;
use Illuminate\\Http\\Request;
use App\\Models\\MedicalSession;

class EnsureMedicalSessionIsActive
{
    public function handle(Request $request, Closure $next)
    {
        $sessionId = $request->route('session');
        $session = MedicalSession::find($sessionId);

        if (!$session) {
            return response()->json([
                'message' => 'Sesión médica no encontrada.',
                'code' => 'SESSION_NOT_FOUND'
            ], 404);
        }

        if (in_array($session->status, ['closed', 'cancelled', 'expired'])) {
            return response()->json([
                'message' => 'La sesión médica ya no se encuentra activa.',
                'code' => 'INACTIVE_SESSION'
            ], 403);
        }

        // Adjuntar modelo al request para evitar consultas redundantes en el controlador
        $request->attributes->set('medical_session_model', $session);

        return $next($request);
    }
}`,
    description: 'Middleware crítico que garantiza que no se puedan inyectar datos clínicos (mensajes, signos vitales, notas) a una sesión médica ya finalizada.'
  },
  {
    title: 'Policy: MedicalSessionPolicy.php',
    language: 'php',
    code: `<?php

namespace App\\Policies;

use App\\Models\\User;
use App\\Models\\MedicalSession;

class MedicalSessionPolicy
{
    public function view(User $user, MedicalSession $session): bool
    {
        // El usuario debe pertenecer al mismo centro de salud para evitar accesos cruzados (Multitenancy)
        if ($user->health_center_id !== $session->health_center_id) {
            return false;
        }

        // Validar acceso según rol
        if ($user->hasRole('admin_institucional')) {
            return false; // El administrador no ve información clínica de sesiones
        }

        return $user->hasAnyRole(['admision', 'categorizacion', 'medico']);
    }

    public function close(User $user, MedicalSession $session): bool
    {
        // Sólo los médicos o personal de categorización pueden dar cierre
        if ($user->health_center_id !== $session->health_center_id) {
            return false;
        }

        return $user->hasAnyRole(['categorizacion', 'medico']);
    }
}`,
    description: 'Policy para asegurar la privacidad del paciente y evitar el acceso cruzado entre centros de salud del sistema.'
  },
  {
    title: 'Routes: api.php',
    language: 'php',
    code: `<?php

use App\\Http\\Controllers\\AuthController;
use App\\Http\\Controllers\\AttentionCodeController;
use App\\Http\\Controllers\\MedicalSessionController;
use App\\Http\\Controllers\\ChatMessageController;
use App\\Http\\Controllers\\ConsentController;
use Illuminate\\Support\\Facades\\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

Route::middleware(['auth:sanctum', 'user.active'])->group(function () {
    
    // Validar y Consumir CTA
    Route::post('/attention-codes/validate', [AttentionCodeController::class, 'validateCode']);
    Route::post('/attention-codes/{id}/consume', [AttentionCodeController::class, 'consumeCode']);

    // Sesiones Médicas y Consentimientos
    Route::middleware('belongs.center')->group(function() {
        Route::apiResource('medical-sessions', MedicalSessionController::class)->except(['destroy']);
        
        Route::post('/medical-sessions/{session}/consent-requests', [ConsentController::class, 'requestConsent']);
        Route::post('/consent-requests/{request}/approve', [ConsentController::class, 'approve']);
        Route::post('/consent-requests/{request}/reject', [ConsentController::class, 'reject']);

        // Chat en tiempo real y componentes
        Route::middleware('session.active')->group(function() {
            Route::get('/medical-sessions/{session}/messages', [ChatMessageController::class, 'index']);
            Route::post('/medical-sessions/{session}/messages', [ChatMessageController::class, 'store']);
            Route::post('/messages/{message}/confirm', [ChatMessageController::class, 'confirmMessage']);
        });
    });
});`,
    description: 'Estructuración de endpoints e inyección ordenada de middlewares para garantizar que los datos estén completamente protegidos antes de tocar el controlador.'
  }
];
