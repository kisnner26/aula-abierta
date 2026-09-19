<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('weeks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classroom_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('number');
            $table->string('title');
            $table->text('vocabulary')->nullable();
            $table->timestamps();

            $table->unique(['classroom_id', 'number']);
        });

        Schema::create('materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('week_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('type'); // slide | link | vocabulary | audio | document
            $table->boolean('is_protected')->default(false);
            $table->string('storage_path')->nullable(); // R2 key — never exposed to client
            $table->string('external_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('materials');
        Schema::dropIfExists('weeks');
    }
};
