<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('template_weeks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('number');
            $table->string('title');
            $table->text('vocabulary')->nullable();
            $table->timestamps();

            $table->unique(['template_id', 'number']);
        });

        Schema::create('template_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_week_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('type');
            $table->boolean('is_protected')->default(true);
            $table->string('storage_path')->nullable();
            $table->string('external_url')->nullable();
            $table->timestamps();
        });

        Schema::create('template_course_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_week_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->unsignedSmallInteger('deadline_offset_days')->default(7);
            $table->boolean('is_open')->default(true);
            $table->timestamps();
        });

        Schema::create('template_rubrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_course_task_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->timestamps();
        });

        Schema::create('template_rubric_criteria', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_rubric_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('max_score');
            $table->unsignedSmallInteger('order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('template_rubric_criteria');
        Schema::dropIfExists('template_rubrics');
        Schema::dropIfExists('template_course_tasks');
        Schema::dropIfExists('template_materials');
        Schema::dropIfExists('template_weeks');
    }
};
