<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('learning_videos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained()->cascadeOnDelete();
            $table->foreignId('level_id')->constrained()->cascadeOnDelete();
            $table->foreignId('added_by')->constrained('users');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('youtube_url');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['program_id', 'level_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('learning_videos');
    }
};
