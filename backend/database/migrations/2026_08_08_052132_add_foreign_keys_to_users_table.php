<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignUuid('organization_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->foreignUuid('health_center_id')->nullable()->after('organization_id')->constrained()->nullOnDelete();
            $table->foreignUuid('unit_id')->nullable()->after('health_center_id')->constrained()->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['organization_id']);
            $table->dropForeign(['health_center_id']);
            $table->dropForeign(['unit_id']);
            $table->dropColumn(['organization_id', 'health_center_id', 'unit_id']);
        });
    }
};