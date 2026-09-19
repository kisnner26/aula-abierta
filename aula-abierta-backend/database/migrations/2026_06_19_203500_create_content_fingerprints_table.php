<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_fingerprints', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('material_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('user_reference', 80);
            $table->string('material_reference', 120);
            $table->string('role', 40);
            $table->char('session_hash', 64);
            $table->char('pixel_tag', 16)->index();
            $table->char('payload_hash', 64)->unique();
            $table->text('signed_payload');
            $table->string('mime_type')->nullable();
            $table->string('storage_path')->nullable();
            $table->timestamp('accessed_at')->nullable();
            $table->timestamp('expires_at')->index();
            $table->timestamps();

            $table->index(['user_id', 'material_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_fingerprints');
    }
};
