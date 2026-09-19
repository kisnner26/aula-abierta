<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('programs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 20)->unique();
            $table->unsignedSmallInteger('level_count')->default(1);
            $table->unsignedSmallInteger('weeks_per_level')->default(14);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedSmallInteger('order')->default(1);
            $table->timestamps();

            $table->unique(['program_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('levels');
        Schema::dropIfExists('programs');
    }
};
