<?php

namespace App\Observers;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogObserver
{
    /**
     * Se ejecuta cuando se CREA un registro.
     */
    public function created(Model $model): void
    {
        $this->record($model, 'created', $model->getAttributes());
    }

    /**
     * Se ejecuta cuando se MODIFICA un registro.
     */
    public function updated(Model $model): void
    {
        $this->record($model, 'updated', $model->getChanges());
    }

    /**
     * Se ejecuta cuando se BORRA un registro.
     */
    public function deleted(Model $model): void
    {
        $this->record($model, 'deleted', $model->getOriginal());
    }

    /**
     * Método interno: crea el registro de auditoría.
     */
    protected function record(Model $model, string $action, array $changes): void
    {
        AuditLog::create([
            'user_id'        => Auth::id(),
            'action'         => $action,
            'auditable_type' => $model->getMorphClass(),
            'auditable_id'   => $model->getKey(),
            'changes'        => $changes,
            'ip_address'     => Request::ip(),
        ]);
    }
}