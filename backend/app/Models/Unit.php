<?php

namespace App\Models;

use App\Observers\AuditLogObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ObservedBy([AuditLogObserver::class])]
class Unit extends Model
{
    use HasUuids;

    protected $fillable = [
        'health_center_id',
        'name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Una unidad pertenece a un centro de salud.
     */
    public function healthCenter(): BelongsTo
    {
        return $this->belongsTo(HealthCenter::class);
    }
}