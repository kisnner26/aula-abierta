<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('week_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->timestamp('deadline');
            $table->boolean('is_open')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('rubrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_task_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->timestamps();
        });

        Schema::create('rubric_criteria', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rubric_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('max_score');
            $table->unsignedSmallInteger('order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rubric_criteria');
        Schema::dropIfExists('rubrics');
        Schema::dropIfExists('course_tasks');
    }
};
