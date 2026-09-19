<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->text('notes')->nullable();
            $table->string('link_url')->nullable();
            $table->timestamp('submitted_at');
            $table->timestamps();

            $table->unique(['course_task_id', 'student_id']);
        });

        Schema::create('evidence_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained()->cascadeOnDelete();
            $table->string('filename');
            $table->string('mime_type');
            $table->string('storage_path'); // R2 key — never exposed to client
            $table->unsignedBigInteger('size_bytes');
            $table->timestamps();
        });

        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('graded_by')->constrained('users');
            $table->unsignedSmallInteger('numeric_score'); // 0-100
            $table->string('letter_grade', 2);             // A+, A, B, C
            $table->text('feedback')->nullable();
            $table->timestamp('graded_at');
            $table->timestamps();
        });

        Schema::create('criterion_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grade_id')->constrained()->cascadeOnDelete();
            $table->foreignId('criterion_id')->constrained('rubric_criteria')->cascadeOnDelete();
            $table->unsignedSmallInteger('score');
            $table->timestamps();

            $table->unique(['grade_id', 'criterion_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('criterion_scores');
        Schema::dropIfExists('grades');
        Schema::dropIfExists('evidence_files');
        Schema::dropIfExists('submissions');
    }
};
